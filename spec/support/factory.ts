import { fhir } from "clinical-trial-matching-service";
import { TrialResponse } from "../../src/breastcancertrials";

/**
 * Create an empty patient bundle
 */
export function createEmptyBundle(): fhir.Bundle {
  return {
    resourceType: "Bundle",
    type: "collection",
    entry: [],
  };
}

/**
 * This creates an example trial. (It's shared between test suites.)
 */
export function createExampleTrialResponse(): TrialResponse {
  return {
    resultNumber: "1",
    trialId: "NCT12345678",
    trialTitle: "Title",
    scientificTitle: "Scientific Title",
    phaseNumber: "I-II",
    purpose: "Purpose.",
    whoIsThisFor: "Who is this for?",
    whatIsInvolved: "What is involved?",
    whatIsBeingStudied: "What is being studied?",
    learnMore: "Learn more",
    ctGovLink: "https://clinicaltrials.gov/ct2/show/NCT03377387",
    eligibilityCriteriaLink:
      "https://clinicaltrials.gov/ct2/show/NCT03377387#eligibility",
    trialCategories: ["METASTATIC", "TREATMENT_BIOLOGICAL"],
    trialMutations: [],
    newTrialFlag: false,
    zip: "01780",
    distance: "3",
    siteName: "Example",
    city: "Bedford",
    state: "MA",
    visits: "Monthly visits, ongoing",
    latitude: 42,
    longitude: -75,
    contactName: "Contact",
    contactPhone: "781-555-0100",
    contactEmail: null,
    noVisitsRequiredFlag: false,
    numberOfSites: "1",
  };
}
