/**
 * Handles conversion of patient bundle data to a proper request for matching service apis.
 * Retrieves api response as promise to be used in conversion to fhir ResearchStudy
 */

import {
  ClinicalStudy,
  ClinicalTrialsGovService,
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
  ajccStageSnomedMapping,
  loincBiomarkerMapping,
  snomedBiomarkerMapping,
  TrialResponse
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
  backupService: ClinicalTrialsGovService
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
    // Add any staging information to the Primary Cancer Condition.
    patientBundle = conformStageCoding(patientBundle);
    // Perform the code mapping.
    patientBundle = performCodeMapping(patientBundle);
    // For now, the full patient bundle is the query
    return sendQuery(endpoint, JSON.stringify(patientBundle, null, 2)).then((result) => {
      return backupService.updateResearchStudies(result.map(convertToResearchStudy)).then((studies) => new SearchSet(studies));
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

    // If the current resource is a Medication Statement...
    if (
      entry.resource.resourceType == "MedicationStatement"
    ) {
      // Cast to a Coding to access the medicationCodableConcept coding attributes.
      const medicationCodableConcept = entry.resource[
        "medicationCodeableConcept"
      ] as Coding;
      mapCoding(medicationCodableConcept, "MedicationStatement");
    }
    // If the current resource is an Observation
    if (
      entry.resource.resourceType == "Observation"
    ) {
      const code = entry.resource[
        "code"
      ] as Coding;
      mapCoding(code, "Observation");
      const valueCodableConcept = entry.resource[
        "valueCodeableConcept"
      ] as Coding;
      mapCoding(valueCodableConcept, "Observation");
    }
    // If the current resource is a Staging Code...
    if (
      entry.resource.resourceType == "Condition" &&
      entry.resource["stage"] != undefined
    ) {
      // Cast to a Stage[] to access the stage's coding attributes.
      const staging = entry.resource["stage"] as Stage[];
      for (const stage of staging) {
        if (stage.summary != undefined) {
          mapCoding(stage.summary, "Condition");
        }
        if (stage.type != undefined) {
          mapCoding(stage.type, "Condition");
        }
      }
    }
  }
  return patientBundle;
}

/*
 * Converts the codes in a given Coding based on the given mapping.
 */
function mapCoding(coding: Coding, resourceType: string) {
  // Check all the codes for conversion based on the given mapping.
  let count = 0;
  // Check if coding is undefined in the event of an unexpected bundle format. If so, skip this resource.
  if (coding == undefined) {
    return;
  }
  for (const currentCoding of coding.coding) {
    const origSystem: string = currentCoding.system;
    let resultSystem = "http://snomed.info/sct";
    // set mapping
    let mapping = new Map<string, string>();
    if (origSystem != undefined) {
      if (origSystem.includes("rxnorm")) {
        mapping = rxnormSnomedMapping;
      } else if (origSystem.includes("loinc")) {
        mapping = loincBiomarkerMapping;
        resultSystem = origSystem;
      } else if (origSystem.includes("snomed") && resourceType == "Observation") {
        mapping = snomedBiomarkerMapping;
        resultSystem = "http://hl7.org/fhir/v2/0078";
      } else if (origSystem.includes("snomed")) {
        mapping = stageSnomedMapping;
      } else if (origSystem.includes("ajcc") || origSystem.includes("cancerstaging.org")) {
        mapping = ajccStageSnomedMapping;
      }
    }
    const potentialNewCode: string = mapping.get(currentCoding.code.toLowerCase());
    if (potentialNewCode != undefined) {
      // Code exists in the given mapping; update it.
      coding.coding[count].code = potentialNewCode;
      coding.coding[count].system = resultSystem;
      if (coding.coding[count].display != undefined) {
        coding.coding[count].display = undefined;
      }
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

/**
 * Conforms any staging data in the bundle to be part of the primary cancer condition.
 * @param patientBundle
 * @returns 
 */
export function conformStageCoding(patientBundle: fhir.Bundle): fhir.Bundle {

  // Extract the primary cancer condition.
  const primaryCancerCondition = extractPrimaryCancerCondition(patientBundle);
  if(primaryCancerCondition == undefined) {
    // There is no primary cancer condition, thus nowhere to move staging.
    return patientBundle;
  }

  // Function to extract a stage resource's stage codes and add to the primary cancer condition.
  const extractStageResource = (entry: fhir.BundleEntry) => {
    const rawStageCoding: Coding[] = entry.resource['valueCodeableConcept']['coding'];
    const stageCoding: Coding = {coding: rawStageCoding} as Coding;
    const newStage: Stage = {type: stageCoding, summary: stageCoding};
    (primaryCancerCondition.resource['stage'] as Stage[]).push(newStage);
  };

  for (const entry of patientBundle.entry) {
    if (!("resource" in entry)) {
      // Skip bad entries
      continue;
    }
    // If the current entry is a TNMClinicalStageGroup, extract the stage for primary cancer condition.
    if((entry.resource['meta']['profile'] as string[]).includes("http://hl7.org/fhir/us/mcode/StructureDefinition/mcode-tnm-clinical-stage-group")) {
      extractStageResource(entry);
    }
    // If the current entry is a TNMPathologicalStageGroup, extract the stage for primary cancer condition.
    if((entry.resource['meta']['profile'] as string[]).includes("http://hl7.org/fhir/us/mcode/StructureDefinition/mcode-tnm-pathological-stage-group")) {
      extractStageResource(entry);
    }
  }

  return patientBundle;
}

/**
 * Extract the first primary cancer condition object from the patient bundle.
 * @param patientBundle 
 * @returns 
 */
function extractPrimaryCancerCondition(patientBundle: fhir.Bundle): fhir.BundleEntry {
  for (const entry of patientBundle.entry) {
    if (!("resource" in entry)) {
      // Skip bad entries
      continue;
    }
    // If the current entry is a TNMClinicalStageGroup, extract the stage for primary cancer condition.
    if((entry.resource['meta']['profile'] as string[]).includes("http://hl7.org/fhir/us/mcode/StructureDefinition/mcode-primary-cancer-condition")) {
      return entry;
    }
  }
  return undefined;
}

