// This stub handles starting the server.

import { createClinicalTrialLookup } from "./query";
import ClinicalTrialMatchingService, {
  configFromEnv,
  ClinicalTrialGovService,
} from "clinical-trial-matching-service";
import { importRxnormSnomedMapping, importStageSnomedMapping } from "./breastcancertrials";
import * as dotenv from "dotenv-flow";

export class BreastCancerTrialsService extends ClinicalTrialMatchingService {
  backupService: ClinicalTrialGovService;
  constructor(config: Record<string, string | number>) {
    // Need to instantiate the backup service first - note that it is NOT
    // initialized here
    // TODO: Make this configurable
    const backupService = new ClinicalTrialGovService(
      "clinicaltrial-backup-cache"
    );
    super(createClinicalTrialLookup(config, backupService), config);
    this.backupService = backupService;
  }

  init(): Promise<this> {
    return Promise.all([
      this.backupService.init(),
      // Import RxNorm-SNOMED Mapping
      importRxnormSnomedMapping(),
      // Import stage-SNOMED Mapping
      importStageSnomedMapping()
    ]).then(() => this);
  }
}

export default function start(): Promise<ClinicalTrialMatchingService> {
  return new Promise((resolve, reject) => {
    // Use dotenv-flow to load local configuration from .env files
    dotenv.config({
      // The environment variable to use to set the environment
      node_env: process.env.NODE_ENV,
      // The default environment to use if none is set
      default_node_env: "development",
    });
    const service = new BreastCancerTrialsService(configFromEnv(""));
    service.init().then(() => {
      service.listen();
      resolve(service);
    }, reject);
  });
}

/* istanbul ignore next: can't exactly load this directly via test case */
if (module.parent === null) {
  start().catch((error) => {
    console.error("Could not start service:");
    console.error(error);
  });
}
