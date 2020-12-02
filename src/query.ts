/**
 * Handles conversion of patient bundle data to a proper request for matching service apis.
 * Retrieves api response as promise to be used in conversion to fhir ResearchStudy
 */

import {
  ClinicalStudy,
  ClinicalTrialGovService,
  fhir,
  SearchSet,
  ServiceConfiguration,
  updateResearchStudyWithClinicalStudy
} from "clinical-trial-matching-service";
import {
  Coding,
  Stage,
  rxnormSnomedMapping,
  stageSnomedMapping,
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
 * Slight change to the default way research studies are updated.
 * @param researchStudy the base research study
 * @param clinicalStudy the clinical study data from ClinicalTrials.gov
 */
export function updateResearchStudy(researchStudy: fhir.ResearchStudy, clinicalStudy: ClinicalStudy): void {
  if (researchStudy.description) {
    const briefSummary = clinicalStudy.brief_summary;
    if (briefSummary) {
      researchStudy.description += '\n\n' + briefSummary[0].textblock[0];
    }
  }
  updateResearchStudyWithClinicalStudy(researchStudy, clinicalStudy);
}
/**
 * Create a new matching function using the given configuration.
 * @param configuration the configuration to use to configure the matcher
 * @param backupService the backup service to use. (Note: at present, the
 *    updateResarchStudy method is "monkey patched" to update how trials are
 *    converted.)
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
  // FIXME: While this is sort of the intended usage, it potentially wipes out
  // customizations from the object passed in
  backupService.updateResearchStudy = updateResearchStudy;
  return function getMatchingClinicalTrials(
    patientBundle: Bundle
  ): Promise<SearchSet> {
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
    // For now, the full patient bundle is the query
    return sendQuery(endpoint, JSON.stringify(patientBundle)).then((result) => {
      return backupService.updateResearchStudies(result.map(convertToResearchStudy)).then((studies) => new SearchSet(studies));
    });
  };
}

/*
 * Maps the Relevant codes in the patient bundle to the codes in the given mapping.
 */
export function performCodeMapping(
  patientBundle: Bundle,
  resourceType: string,
  mapping: Map<string, string>
): Bundle {
  for (const entry of patientBundle.entry) {
    if (!("resource" in entry)) {
      // Skip bad entries
      continue;
    }

    // If the current resource is of the given ResourceType and is a Medication Statement...
    if (
      entry.resource.resourceType == resourceType &&
      resourceType == "MedicationStatement"
    ) {
      // Cast to a Coding to access the medicationCodableConcept coding attributes.
      const medicationCodableConcept = entry.resource[
        "medicationCodeableConcept"
      ] as Coding;
      mapCoding(medicationCodableConcept, mapping);
    }
    // If the current resource is of the given ResourceType and is a Staging Code...
    if (
      entry.resource.resourceType == resourceType &&
      resourceType == "Condition" &&
      entry.resource["stage"] != undefined
    ) {
      // Cast to a Stage[] to access the stage's coding attributes.
      const staging = entry.resource["stage"] as Stage[];
      for (const stage of staging) {
        mapCoding(stage.summary, mapping);
        mapCoding(stage.type, mapping);
      }
    }
  }
  return patientBundle;
}

/*
 * Converts the codes in a given Coding based on the given mapping.
 */
function mapCoding(coding: Coding, mapping: Map<string, string>) {
  // Check all the codes for conversion based on the given mapping.
  let count = 0;
  for (const currentCoding of coding.coding) {
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
