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

export function importRxnormSnomedMapping() {
  fs.createReadStream("./data/rxnorm-snomed-mapping.csv")
    .pipe(stripBom())
    .pipe(csv())
    .on("data", (data: { rxnorm: string; snomed: string }) =>
      rxnormSnomedMapping.set(data.rxnorm, data.snomed)
    )
    .on("end", () => {
      console.log("Loaded RxNorm-SNOMED mapping.");
    });
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

export interface MedicationCodeableConcept {
  coding?: {
    system?: string;
    code?: string;
    display?: string;
  }[];
  text: string;
}
