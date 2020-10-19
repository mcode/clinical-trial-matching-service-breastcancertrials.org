import stripBom from "strip-bom-stream";
import fs from "fs";
import csv from "csv-parser";

export const rxnormSnomedMapping = new Map<string, string>();
export const stageSnomedMapping = new Map<string, string>();

/*
 * Imports the mapping CSV at the given file path into the given variable.
 */
export function importCodeMappingFile(filePath: string, mapping: Map<string, string>): Promise<Map<string, string>> {
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .on("error", (error) => {
        reject(error);
      })
      .pipe(stripBom())
      .pipe(csv())
      .on(
        "data",
        (data: { rxnorm: string; snomed: string; qualifiervaluesnomed: string; clinicalfindingsnomed: string }) => {
          if (data.rxnorm != undefined) {
            mapping.set(data.rxnorm, data.snomed);
          } else if (data.qualifiervaluesnomed != undefined) {
            mapping.set(data.qualifiervaluesnomed, data.clinicalfindingsnomed);
          } else {
            reject(new Error("Invalid input mapping file."));
            return;
          }
        }
      )
      .on("end", () => {
        console.log("Loaded code mapping with: " + mapping.size.toString() + " entries.");
        resolve(mapping);
      });
  });
}

// Imports RxNorm to SNOMED Code Mapping.
export function importRxnormSnomedMapping(): Promise<Map<string, string>> {
  return importCodeMappingFile("./data/rxnorm-snomed-mapping.csv", rxnormSnomedMapping);
}

// Imports Stage SNOMED Code Mapping from Qualifer Value Stage Codes and Clincal Finding Stage Codes.
export function importStageSnomedMapping(): Promise<Map<string, string>> {
  return importCodeMappingFile("./data/stage-snomed-mapping.csv", stageSnomedMapping);
}

export interface TrialResponse {
  resultNumber: string;
  trialId: string;
  trialTitle: string;
  scientificTitle: string;
  phaseNumber: string;
  purpose: string;
  whoIsThisFor: string;
  whatIsInvolved: string;
  whatIsBeingStudied: string;
  learnMore: string;
  ctGovLink: string;
  eligibilityCriteriaLink: string;
  trialCategories: string[];
  trialMutations: string[];
  newTrialFlag: boolean;
  zip: string;
  distance: string;
  siteName: string;
  city: string;
  state: string;
  visits: string;
  latitude: number;
  longitude: number;
  contactName: string;
  contactPhone: string;
  contactEmail: string | null;
  noVisitsRequiredFlag: boolean;
  numberOfSites: string;
}

export interface Coding {
  coding?: {
    system?: string;
    code?: string;
    display?: string;
  }[];
  text: string;
}

export interface Stage {
  type: Coding;
  summary: Coding;
}
