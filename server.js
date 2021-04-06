"use strict";
// This stub handles starting the server.
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BreastCancerTrialsService = void 0;
const query_1 = require("./query");
const clinical_trial_matching_service_1 = __importStar(require("clinical-trial-matching-service"));
const breastcancertrials_1 = require("./breastcancertrials");
const dotenv = __importStar(require("dotenv-flow"));
class BreastCancerTrialsService extends clinical_trial_matching_service_1.default {
    constructor(config) {
        // Need to instantiate the backup service first - note that it is NOT
        // initialized here
        // TODO: Make this configurable
        const backupService = new clinical_trial_matching_service_1.ClinicalTrialsGovService("clinicaltrial-backup-cache");
        super(query_1.createClinicalTrialLookup(config, backupService), config);
        this.backupService = backupService;
    }
    init() {
        return Promise.all([
            this.backupService.init(),
            // Import RxNorm-SNOMED Mapping
            breastcancertrials_1.importRxnormSnomedMapping(),
            // Import stage-SNOMED Mapping
            breastcancertrials_1.importStageSnomedMapping(),
            // Import stage-AJCC Mapping
            breastcancertrials_1.importStageAjccMapping(),
            // Imports Loinc to Loinc Biomarker Code Mapping.
            breastcancertrials_1.importLoincBiomarkerMapping(),
            // Imports SNOMED Value to HL7 Value Code Mapping.
            breastcancertrials_1.importSnomedHl7Mapping()
        ]).then(() => this);
    }
}
exports.BreastCancerTrialsService = BreastCancerTrialsService;
function start() {
    // Use dotenv-flow to load local configuration from .env files
    dotenv.config({
        // The environment variable to use to set the environment
        node_env: process.env.NODE_ENV,
        // The default environment to use if none is set
        default_node_env: "development",
    });
    const service = new BreastCancerTrialsService(clinical_trial_matching_service_1.configFromEnv(""));
    return service.init(); // => {
    // return service.listen().then(() => service);
    // });
}
exports.default = start;
//# sourceMappingURL=server.js.map