"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertToResearchStudy = exports.phaseDisplayMap = exports.phaseCodeMap = void 0;
const clinical_trial_matching_service_1 = require("clinical-trial-matching-service");
/*
 * This module handles mapping the responses from the breastcancertrials.org
 * service to FHIR ResearchStudy objects.
 */
exports.phaseCodeMap = new Map([
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
exports.phaseDisplayMap = new Map([
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
function convertArrayToCodeableConcept(trialConditions) {
    const fhirConditions = [];
    for (const condition of trialConditions) {
        fhirConditions.push({ text: condition });
    }
    return fhirConditions;
}
function convertToResearchStudy(trial) {
    // The clinical trial ID is required as it's used to look up the search study
    const result = new clinical_trial_matching_service_1.ResearchStudy(trial.trialId);
    if (trial.trialTitle) {
        result.title = trial.trialTitle;
    }
    result.identifier = [{ use: 'official', system: 'http://clinicaltrials.gov', value: trial.trialId }];
    if (trial.phaseNumber) {
        result.phase = {
            coding: [
                {
                    system: 'http://terminology.hl7.org/CodeSystem/research-study-phase',
                    code: exports.phaseCodeMap.get(trial.phaseNumber),
                    display: exports.phaseDisplayMap.get(trial.phaseNumber)
                }
            ],
            text: exports.phaseDisplayMap.get(trial.phaseNumber)
        };
    }
    if (trial.trialCategories && trial.trialCategories.length > 0) {
        result.keyword = convertArrayToCodeableConcept(trial.trialCategories);
    }
    if (trial.contactName) {
        result.addContact(trial.contactName, trial.contactPhone, trial.contactEmail);
    }
    result.location = [{ text: "United States" }]; // default location country is USA
    if (trial.purpose && trial.whoIsThisFor) {
        // If there is a purpose and whoIsThisFor, use that, otherwise leave the
        // description blank and allow the default CTs.gov service fill it in
        result.description = `Purpose: ${trial.purpose}\n\n Targets: ${trial.whoIsThisFor}`;
    }
    if (trial.purpose) {
        result.objective = [{ name: trial.purpose }];
    }
    if (trial.siteName) {
        result.sponsor = result.addContainedResource({ resourceType: 'Organization', id: 'org' + result.id, name: trial.siteName });
    }
    return result;
}
exports.convertToResearchStudy = convertToResearchStudy;
//# sourceMappingURL=research-study.js.map