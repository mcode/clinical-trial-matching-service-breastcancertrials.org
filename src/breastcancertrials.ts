import stripBom from "strip-bom-stream";
import fs from "fs";
import csv from "csv-parser";

export const phaseCodeMap = new Map<string, string>([
  // this is guesswork
  ["NA", "n-a"],
  ["0", "early-phase-1"],
  ["I", "phase-1"],
  ["I-II", "phase-1-phase-2"],
  ["II", "phase-2"],
  ["II-III", "phase-2-phase-3"],
  ["III", "phase-3"],
  ["III-IV", "phase-3"],
  ["IV", "phase-4"],
]);

export const phaseDisplayMap = new Map<string, string>([
  // Also guesswork
  ["NA", "N/A"],
  ["0", "Early Phase 1"],
  ["I", "Phase 1"],
  ["I-II", "Phase 1/Phase 2"],
  ["II", "Phase 2"],
  ["II-III", "Phase 2/Phase 3"],
  ["III", "Phase 3"],
  ["III-IV", "Phase 3"],
  ["IV", "Phase 4"],
]);

export const rxnormSnomedMapping = new Map<string, string>();
export const stageSnomedMapping = new Map<string, string>();

/*
 * Imports the mapping CSV at the given file path into the given variable.
 */
export function importCodeMappingFile(filePath: string, mapping: Map<string,string>): Promise<Map<string, string>> {
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(stripBom())
      .pipe(csv())
      .on("data", (data: { rxnorm: string; snomed: string; qualifiervaluesnomed: string; clinicalfindingsnomed: string }, error: any) => {
        if (error) {
          console.error("ERROR: Could not load mapping.");
          reject(error);
          return;
        }
        try {
          if(data.rxnorm != undefined){
            mapping.set(data.rxnorm, data.snomed);
          } else if (data.qualifiervaluesnomed != undefined){
            mapping.set(data.qualifiervaluesnomed, data.clinicalfindingsnomed);
          } else {
            console.error("ERROR: Invalid Input Mapping File.");
            reject(error);
            return;
          }
        } catch (ex) {
          reject(error);
        }
      })
      .on("end", () => {
        console.log("Loaded code mapping with: " + mapping.size + " entries.");
        resolve(mapping);
      });
  });
}

// Imports RxNorm to SNOMED Code Mapping.
export function importRxnormSnomedMapping(): Promise<Map<string, string>> {
  return importCodeMappingFile('./data/rxnorm-snomed-mapping.csv', rxnormSnomedMapping);
}

// Imports Stage SNOMED Code Mapping from Qualifer Value Stage Codes and Clincal Finding Stage Codes.
export function importStageSnomedMapping(): Promise<Map<string, string>> {
  return importCodeMappingFile('./data/stage-snomed-mapping.csv', stageSnomedMapping);
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

export interface BaseResourceCode {
  coding?: {
    system?: string;
    code?: string;
    display?: string;
  }[];
  text: string;
}
