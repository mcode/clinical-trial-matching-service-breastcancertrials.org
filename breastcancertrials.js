"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importSnomedHl7Mapping = exports.importLoincBiomarkerMapping = exports.importStageAjccMapping = exports.importStageSnomedMapping = exports.importRxnormSnomedMapping = exports.importCodeMappingFile = exports.snomedBiomarkerMapping = exports.loincBiomarkerMapping = exports.ajccStageSnomedMapping = exports.stageSnomedMapping = exports.rxnormSnomedMapping = void 0;
const strip_bom_stream_1 = __importDefault(require("strip-bom-stream"));
const fs_1 = __importDefault(require("fs"));
const csv_parser_1 = __importDefault(require("csv-parser"));
exports.rxnormSnomedMapping = new Map();
exports.stageSnomedMapping = new Map();
exports.ajccStageSnomedMapping = new Map();
exports.loincBiomarkerMapping = new Map();
exports.snomedBiomarkerMapping = new Map();
/*
 * Imports the mapping CSV at the given file path into the given variable.
 */
function importCodeMappingFile(filePath, mapping) {
    return new Promise((resolve, reject) => {
        fs_1.default.createReadStream(filePath)
            .on("error", (error) => {
            reject(error);
        })
            .pipe(strip_bom_stream_1.default())
            .pipe(csv_parser_1.default())
            .on("data", (data) => {
            if (data.rxnorm != undefined) {
                mapping.set(data.rxnorm, data.snomed);
            }
            else if (data.qualifiervaluesnomed != undefined) {
                mapping.set(data.qualifiervaluesnomed, data.clinicalfindingsnomed);
            }
            else if (data.ajcc != undefined) {
                mapping.set(data.ajcc, data.snomed);
            }
            else if (data.loincBiomarker != undefined) {
                mapping.set(data.loincBiomarker, data.bctLioncBiomarker);
            }
            else if (data.snomedValue != undefined) {
                mapping.set(data.snomedValue, data.hl7value);
            }
            else {
                reject(new Error("Invalid input mapping file."));
                return;
            }
        })
            .on("end", () => {
            console.log("Loaded code mapping with: " + mapping.size.toString() + " entries.");
            resolve(mapping);
        });
    });
}
exports.importCodeMappingFile = importCodeMappingFile;
// Imports RxNorm to SNOMED Code Mapping.
function importRxnormSnomedMapping() {
    return importCodeMappingFile("./data/rxnorm-snomed-mapping.csv", exports.rxnormSnomedMapping);
}
exports.importRxnormSnomedMapping = importRxnormSnomedMapping;
// Imports Stage SNOMED Code Mapping from Qualifer Value Stage Codes and Clincal Finding Stage Codes.
function importStageSnomedMapping() {
    return importCodeMappingFile("./data/stage-snomed-mapping.csv", exports.stageSnomedMapping);
}
exports.importStageSnomedMapping = importStageSnomedMapping;
// Imports Stage AJCC Code Mapping SNOMED Code Mapping.
function importStageAjccMapping() {
    return importCodeMappingFile("./data/ajcc-stage-snomed-mapping.csv", exports.ajccStageSnomedMapping);
}
exports.importStageAjccMapping = importStageAjccMapping;
// Imports Loinc to Loinc Biomarker Code Mapping.
function importLoincBiomarkerMapping() {
    return importCodeMappingFile("./data/loinc-to-loinc-biomarker-mapping.csv", exports.loincBiomarkerMapping);
}
exports.importLoincBiomarkerMapping = importLoincBiomarkerMapping;
// Imports SNOMED Value to HL7 Value Code Mapping.
function importSnomedHl7Mapping() {
    return importCodeMappingFile("./data/snomedvalue-to-hl7value-biomarker.csv", exports.snomedBiomarkerMapping);
}
exports.importSnomedHl7Mapping = importSnomedHl7Mapping;
//# sourceMappingURL=breastcancertrials.js.map