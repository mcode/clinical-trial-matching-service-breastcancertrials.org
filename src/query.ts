/**
 * Handles conversion of patient bundle data to a proper request for matching service apis.
 * Retrieves api response as promise to be used in conversion to fhir ResearchStudy
 */

import {
  ClinicalTrialGovService,
  fhir,
  SearchSet,
  ServiceConfiguration,
} from "clinical-trial-matching-service";
import {
  Coding,
  Stage,
  rxnormSnomedMapping,
  stageSnomedMapping,
  ajccStageSnomedMapping,
  TrialResponse,
} from "./breastcancertrials";
import { convertToResearchStudy } from "./research-study";

type Bundle = fhir.Bundle;

import http from "http"; // changed from https
import { IncomingMessage } from "http";

type JsonObject = Record<string, unknown> | Array<unknown>;

export interface QueryConfiguration extends ServiceConfiguration {
  api_endpoint?: string;
}

export class APIError extends Error {
  constructor(
    message: string,
    public result: IncomingMessage,
    public body: string
  ) {
    super(message);
  }
}

/**
 * Create a new matching function using the given configuration.
 * @param configuration the configuration to use to configure the matcher
 */
export function createClinicalTrialLookup(
  configuration: QueryConfiguration,
  backupService: ClinicalTrialGovService
): (patientBundle: Bundle) => Promise<SearchSet> {
  // Raise errors on missing configuration
  if (typeof configuration.api_endpoint !== "string") {
    throw new Error("Missing API_ENDPOINT in configuration");
  }
  const endpoint = configuration.api_endpoint;
  return function getMatchingClinicalTrials(
    patientBundle: Bundle
  ): Promise<SearchSet> {
    patientBundle = performCodeMapping(patientBundle);
     /*
    // Map the RxNorm-SNOMED Codes.
    patientBundle = performCodeMapping(
      patientBundle,
      "MedicationStatement",
      rxnormSnomedMapping
    );
    // Map the Staging SNOMED Codes.
    patientBundle = performCodeMapping(
      patientBundle,
      "Condition",
      stageSnomedMapping
    );
    */
    // For now, the full patient bundle is the query
    return sendQuery(endpoint, JSON.stringify(patientBundle)).then((result) => {
      // Convert the result to a SearchSet
      return backupService
        .downloadTrials(result.map((trialResponse) => trialResponse.trialId))
        .then(() => {
          return Promise.all(
            result.map(async (trialResponse) => {
              const clinicalStudy = await backupService.getDownloadedTrial(
                trialResponse.trialId
              );
              return convertToResearchStudy(trialResponse, clinicalStudy);
            })
          ).then((studies) => new SearchSet(studies));
        });
    });
  };
}

/*
 * Maps the Relevant codes in the patient bundle to the codes in the given mapping.
 */
export function performCodeMapping(
  patientBundle: Bundle
): Bundle {
  for (const entry of patientBundle.entry) {
    if (!("resource" in entry)) {
      // Skip bad entries
      continue;
    }

    // If the current resource is of the given ResourceType and is a Medication Statement...
    if (
      entry.resource.resourceType == "MedicationStatement"
    ) {
      // Cast to a Coding to access the medicationCodableConcept coding attributes.
      const medicationCodableConcept = entry.resource[
        "medicationCodeableConcept"
      ] as Coding;
      mapCoding(medicationCodableConcept);
    }
    // If the current resource is of the given ResourceType and is a Staging Code...
    if (
      entry.resource.resourceType == "Condition" &&
      entry.resource["stage"] != undefined
    ) {
      // Cast to a Stage[] to access the stage's coding attributes.
      const staging = entry.resource["stage"] as Stage[];
      for (const stage of staging) {
        if (stage.summary != undefined) {
          mapCoding(stage.summary);
        }
        if (stage.type != undefined) {
          mapCoding(stage.type);
        }
      }
    }
  }
  return patientBundle;
}

/*
 * Converts the codes in a given Coding based on the given mapping.
 */
function mapCoding(coding: Coding) {
  // Check all the codes for conversion based on the given mapping.
  let count = 0;
  for (const currentCoding of coding.coding) {
    const origSystem: string = coding.coding[count].system;
    // set mapping
    var mapping = new Map<string, string>();
    if (origSystem.includes("rxnorm")) {
      mapping = rxnormSnomedMapping;
    } else if (origSystem.includes("snomed")) {
      mapping = stageSnomedMapping;
    } else if (origSystem.includes("ajcc") || origSystem.includes("cancerstaging.org")) {
      mapping = ajccStageSnomedMapping;
    } else {
      console.log("No Code Mapping Found");
    }
    const potentialNewCode: string = mapping.get(currentCoding.code);
    if (potentialNewCode != undefined) {
      // Code exists in the given mapping; update it.
      coding.coding[count].code = potentialNewCode;
      coding.coding[count].system = "http://snomed.info/sct";
    }
    count++;
  }
}

export function sendQuery(
  endpoint: string,
  query: string
): Promise<TrialResponse[]> {
  return new Promise((resolve, reject) => {
    const body = Buffer.from(query, "utf8");
    console.log("Running raw query");
    console.log(query);
    const request = http.request(
      endpoint,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/fhir+json",
        },
      },
      (result) => {
        let responseBody = "";
        result.on("data", (chunk) => {
          responseBody += chunk;
        });
        result.on("end", () => {
          console.log("Complete");
          if (result.statusCode === 200) {
            try {
              const json = JSON.parse(responseBody) as unknown;
              if (Array.isArray(json)) {
                // Assume it's correct
                resolve(json as TrialResponse[]);
              } else {
                reject(
                  new APIError(
                    "Unexpected JSON result from server",
                    result,
                    responseBody
                  )
                );
              }
            } catch (ex) {
              reject(
                new APIError(
                  "Unexpected exception parsing server response",
                  result,
                  responseBody
                )
              );
            }
          } else {
            reject(
              new APIError(
                `Server returned ${result.statusCode} ${result.statusMessage}`,
                result,
                responseBody
              )
            );
          }
        });
      }
    );

    request.on("error", (error) => reject(error));

    request.write(body);
    request.end();
  });
}
