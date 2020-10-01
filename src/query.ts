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
  TrialResponse,
} from "./breastcancertrials";
import { convertToResearchStudy } from "./research-study";

type Bundle = fhir.Bundle;

import http from "http"; // changed from https
import { IncomingMessage } from "http";
import { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } from "constants";

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
    // Map the RxNorm-SNOMED Codes.
    patientBundle = performCodeMapping(
      patientBundle,
      "MedicationStatement",
      rxnormSnomedMapping
    );
    // Map the Staging SNOMED Codes.
    patientBundle = performCodeMapping(patientBundle, "Condition", stageSnomedMapping);
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

/** TO-DO
 * Finish making an object for storing the various parameters necessary for the api query
 * based on a patient bundle.
 * Reference https://github.com/mcode/clinical-trial-matching-engine/wiki to see patientBundle Structures
 -> possibly not needed for breastcancertrials.org - for now it seems the patientBundle itself can serve as the query
    commenting out the whole class for now

export class APIQuery {
    conditions = new Set<string>();
    zipCode?: string = null;
    travelRadius?: number = null;
    phase = 'any';
    recruitmentStatus = 'all';

     // TO-DO Add any additional fields which need to be extracted from the bundle to construct query

    constructor(patientBundle: Bundle) {
      for (const entry of patientBundle.entry) {
        if (!('resource' in entry)) {
          // Skip bad entries
          continue;
        }
        const resource = entry.resource;
        console.log(`Checking resource ${resource.resourceType}`);
        //Obtain critical search parameters
        if (resource.resourceType === 'Parameters') {
          for (const parameter of resource.parameter) {
            console.log(` - Setting parameter ${parameter.name} to ${parameter.valueString}`);
            if (parameter.name === 'zipCode') {
              this.zipCode = parameter.valueString;
            } else if (parameter.name === 'travelRadius') {
              this.travelRadius = parseFloat(parameter.valueString);
            } else if (parameter.name === 'phase') {
              this.phase = parameter.valueString;
            } else if (parameter.name === 'recruitmentStatus') {
              this.recruitmentStatus = parameter.valueString;
            }
          }
        }
        //Gather all conditions the patient has
        if (resource.resourceType === 'Condition') {
          this.addCondition(resource);
        }
        //TO-DO Extract any additional resources that you defined



      }
    }
    addCondition(condition: Condition): void {
      // Should have a code
      // TODO: Limit to specific coding systems (maybe)
      for (const code of condition.code.coding) {
        this.conditions.add(code.code);
      }
    }

    //TO-DO Utilize the extracted information to create the API query

    /**
     * Create an api request string
     * @return {string} the api query
     -> possibly not needed for breastcancertrials.org - for now it seems the patientBundle itself can serve as the query

    toQuery(): string {
      const query = ` {}`;
      return query;
    }

    toString(): string {
      return this.toQuery();
    }
  }
*/

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
      let medicationCodableConcept = entry.resource[
        "medicationCodeableConcept"
      ] as Coding;
      mapCoding(medicationCodableConcept, mapping);
    }
    // If the current resource is of the given ResourceType and is a Staging Code...
    if (
      entry.resource.resourceType == resourceType &&
      resourceType == "Condition"
    ) {
      // Cast to a Stage[] to access the stage's coding attributes.
      let staging = entry.resource["stage"] as Stage[];
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

function sendQuery(endpoint: string, query: string): Promise<TrialResponse[]> {
  return new Promise((resolve, reject) => {
    const body = Buffer.from(query, "utf8"); // or use samplePatient
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
