import * as breastcancertrials from "./breastcancertrials";

import { fhir, ResearchStudy, ClinicalStudy, updateResearchStudyWithClinicalStudy } from 'clinical-trial-matching-service';
import { TrialResponse } from './breastcancertrials';

/*
This file contains a basic implementation of a FHIR ResearchStudy resource and supporting interfaces
The class can be expanded meeting the specifications outlined at https://www.hl7.org/fhir/researchstudy.html
Should your matching service not provide a necessary attribute, use trialbackup.ts fill it in, if there is nothing to
pull in from the backup, leave the attribute out of your FHIR ResearchStudy entirely
*/

function convertArrayToCodeableConcept(trialConditions: string[]): fhir.CodeableConcept[] {
  const fhirConditions: fhir.CodeableConcept[] = [];
  for (const condition of trialConditions) {
    fhirConditions.push({ text: condition });
  }
  return fhirConditions;
}

export function convertToResearchStudy(trial: TrialResponse, clinicalStudy: ClinicalStudy): ResearchStudy {
  const result = new ResearchStudy(trial.trialId);
  if (trial.trialTitle) {
    result.title = trial.trialTitle;
  }
  if (trial.trialId) {
    result.identifier = [{ use: 'official', system: 'http://clinicaltrials.gov', value: trial.trialId }];
  }

  if (trial.phaseNumber) {
    result.phase = {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/research-study-phase',
          code: breastcancertrials.phaseCodeMap.get(trial.phaseNumber),
          display: breastcancertrials.phaseDisplayMap.get(trial.phaseNumber)
        }
      ],
      text: breastcancertrials.phaseDisplayMap.get(trial.phaseNumber)
    };
  }
  if (trial.trialCategories != []) {
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
    const briefSummary = clinicalStudy.brief_summary;
    if (briefSummary) {
      result.description += '\n\n' + briefSummary[0].textblock[0];
    }
  }
  if (trial.purpose) {
    result.objective = [{ name: trial.purpose }];
  }
  if (trial.siteName) {
    result.sponsor = result.addContainedResource({ resourceType: 'Organization', id: 'org' + result.id, name: trial.siteName });
  }
  // Now that we've filled out what we can, let the backup service fill everything else out
  updateResearchStudyWithClinicalStudy(result, clinicalStudy);
  return result;
}


