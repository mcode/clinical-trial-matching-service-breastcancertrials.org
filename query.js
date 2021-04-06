"use strict";
/**
 * Handles conversion of patient bundle data to a proper request for matching service apis.
 * Retrieves api response as promise to be used in conversion to fhir ResearchStudy
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendQuery = exports.performCodeMapping = exports.createClinicalTrialLookup = exports.updateResearchStudy = exports.APIError = void 0;
const clinical_trial_matching_service_1 = require("clinical-trial-matching-service");
const breastcancertrials_1 = require("./breastcancertrials");
const research_study_1 = require("./research-study");
const http_1 = __importDefault(require("http")); // changed from https
class APIError extends Error {
    constructor(message, result, body) {
        super(message);
        this.result = result;
        this.body = body;
    }
}
exports.APIError = APIError;
/**
 * Slight change to the default way research studies are updated.
 * @param researchStudy the base research study
 * @param clinicalStudy the clinical study data from ClinicalTrials.gov
 */
function updateResearchStudy(researchStudy, clinicalStudy) {
    if (researchStudy.description) {
        const briefSummary = clinicalStudy.brief_summary;
        if (briefSummary) {
            researchStudy.description += '\n\n' + briefSummary[0].textblock[0];
        }
    }
    clinical_trial_matching_service_1.updateResearchStudyWithClinicalStudy(researchStudy, clinicalStudy);
}
exports.updateResearchStudy = updateResearchStudy;
/**
 * Create a new matching function using the given configuration.
 * @param configuration the configuration to use to configure the matcher
 * @param backupService the backup service to use. (Note: at present, the
 *    updateResarchStudy method is "monkey patched" to update how trials are
 *    converted.)
 */
function createClinicalTrialLookup(configuration, backupService) {
    // Raise errors on missing configuration
    if (typeof configuration.api_endpoint !== "string") {
        throw new Error("Missing API_ENDPOINT in configuration");
    }
    const endpoint = configuration.api_endpoint;
    // FIXME: While this is sort of the intended usage, it potentially wipes out
    // customizations from the object passed in
    backupService.updateResearchStudy = updateResearchStudy;
    return function getMatchingClinicalTrials(patientBundle) {
        patientBundle = performCodeMapping(patientBundle);
        // For now, the full patient bundle is the query
        return sendQuery(endpoint, JSON.stringify(patientBundle, null, 2)).then((result) => {
            return backupService.updateResearchStudies(result.map(research_study_1.convertToResearchStudy)).then((studies) => new clinical_trial_matching_service_1.SearchSet(studies));
        });
    };
}
exports.createClinicalTrialLookup = createClinicalTrialLookup;
/*
 * Maps the Relevant codes in the patient bundle to the codes in the given mapping.
 */
function performCodeMapping(patientBundle) {
    for (const entry of patientBundle.entry) {
        if (!("resource" in entry)) {
            // Skip bad entries
            continue;
        }
        // If the current resource is a Medication Statement...
        if (entry.resource.resourceType == "MedicationStatement") {
            // Cast to a Coding to access the medicationCodableConcept coding attributes.
            const medicationCodableConcept = entry.resource["medicationCodeableConcept"];
            mapCoding(medicationCodableConcept, "MedicationStatement");
        }
        // If the current resource is an Observation
        if (entry.resource.resourceType == "Observation") {
            const code = entry.resource["code"];
            mapCoding(code, "Observation");
            const valueCodableConcept = entry.resource["valueCodeableConcept"];
            mapCoding(valueCodableConcept, "Observation");
        }
        // If the current resource is a Staging Code...
        if (entry.resource.resourceType == "Condition" &&
            entry.resource["stage"] != undefined) {
            // Cast to a Stage[] to access the stage's coding attributes.
            const staging = entry.resource["stage"];
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
exports.performCodeMapping = performCodeMapping;
/*
 * Converts the codes in a given Coding based on the given mapping.
 */
function mapCoding(coding, resourceType) {
    // Check all the codes for conversion based on the given mapping.
    let count = 0;
    // Check if coding is undefined in the event of an unexpected bundle format. If so, skip this resource.
    if (coding == undefined) {
        return;
    }
    for (const currentCoding of coding.coding) {
        const origSystem = currentCoding.system;
        let resultSystem = "http://snomed.info/sct";
        // set mapping
        let mapping = new Map();
        if (origSystem != undefined) {
            if (origSystem.includes("rxnorm")) {
                mapping = breastcancertrials_1.rxnormSnomedMapping;
            }
            else if (origSystem.includes("loinc")) {
                mapping = breastcancertrials_1.loincBiomarkerMapping;
                resultSystem = origSystem;
            }
            else if (origSystem.includes("snomed") && resourceType == "Observation") {
                mapping = breastcancertrials_1.snomedBiomarkerMapping;
                resultSystem = "http://hl7.org/fhir/v2/0078";
            }
            else if (origSystem.includes("snomed")) {
                mapping = breastcancertrials_1.stageSnomedMapping;
            }
            else if (origSystem.includes("ajcc") || origSystem.includes("cancerstaging.org")) {
                mapping = breastcancertrials_1.ajccStageSnomedMapping;
            }
        }
        const potentialNewCode = mapping.get(currentCoding.code);
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
function sendQuery(endpoint, query) {
    return new Promise((resolve, reject) => {
        const body = Buffer.from(query, "utf8");
        console.log("Running raw query");
        console.log(query);
        const request = http_1.default.request(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/fhir+json",
            },
        }, (result) => {
            let responseBody = "";
            result.on("data", (chunk) => {
                responseBody += chunk;
            });
            result.on("end", () => {
                console.log("Complete");
                if (result.statusCode === 200) {
                    try {
                        const json = JSON.parse(responseBody);
                        if (Array.isArray(json)) {
                            // Assume it's correct
                            resolve(json);
                        }
                        else {
                            reject(new APIError("Unexpected JSON result from server", result, responseBody));
                        }
                    }
                    catch (ex) {
                        reject(new APIError("Unexpected exception parsing server response", result, responseBody));
                    }
                }
                else {
                    reject(new APIError(`Server returned ${result.statusCode} ${result.statusMessage}`, result, responseBody));
                }
            });
        });
        request.on("error", (error) => reject(error));
        request.write(body);
        request.end();
    });
}
exports.sendQuery = sendQuery;
//# sourceMappingURL=query.js.map