import fs from 'fs';
import * as parser from 'xml2json';

/*
This file contains a backup system for finding necessary trial information if your matching service does not provide it:
  Using the given trial's nctId, use getBackupTrial to retrieve the trial's info from a local data store within AllPublicXML
  Use the rest of the getBackup functions to retrieve the missing information in question
*/

export interface TrialBackup
{
  clinical_study: {
    required_header: {
      download_date: string,
      link_text: string,
      url: string
    },
    id_info: { org_study_id: string, nct_id: string},
    brief_title: string,
    official_title: string,
    sponsors: { lead_sponsor: [Record<string, unknown>] },
    source: string,
    oversight_info: {
      has_dmc: string,
      is_fda_regulated_drug: string,
      is_fda_regulated_device: string
    },
    brief_summary: {
      textblock: string
    },
    overall_status: string,
    start_date: { type: string, t: string },
    completion_date: { type: string, t: string },
    primary_completion_date: { type: string, t: string },
    phase: string,
    study_type: string,
    has_expanded_access: string,
    study_design_info: {
      allocation: string,
      intervention_model: string,
      primary_purpose: string,
      masking: string
    },
    primary_outcome: [ [Record<string, unknown>], [Record<string, unknown>] ],
    secondary_outcome: [ [Record<string, unknown>], [Record<string, unknown>], [Record<string, unknown>] ],
    number_of_arms: string,
    enrollment: { type: string, t: string },
    condition: string,
    arm_group: [ [Record<string, unknown>], [Record<string, unknown>] ],
    intervention: [ [Record<string, unknown>], [Record<string, unknown>] ],
    eligibility: {
      criteria: {textblock: string},
      gender: string,
      minimum_age: string,
      maximum_age: string,
      healthy_volunteers: string
    },
    location: Site[],
    location_countries: { country: string },
    verification_date: string,
    study_first_submitted: string,
    study_first_submitted_qc: string,
    study_first_posted: { type: string, t: string },
    last_update_submitted: string,
    last_update_submitted_qc: string,
    last_update_posted: { type: string, t: string},
    responsible_party: { responsible_party_type: string },
    intervention_browse: { mesh_term: string },
    patient_data: { sharing_ipd: string }
  }
}

export interface Site {
  facility: {name: string},
  contact?: {phone?: string, email?: string}
}

// for statuses coming back from trialbackup to FHIR codes
const statusMap = new Map<string, string>([
  ['Active, not recruiting', 'closed-to-accrual'],
  ['Approved for marketing', 'approved'],
  ['Available', 'active'],
  ['Enrolling by invitation', 'active'],
  ['Not yet recruiting', 'approved'],
  ['Recruiting', 'active']
]);

export function getBackupTrial(nctId: string) : TrialBackup {
  const filePath = `./AllPublicXML/${nctId.substr(0, 7)}xxxx/${nctId}.xml`;
  const data = fs.readFileSync(filePath, {encoding: 'utf8'});
  const json : TrialBackup= JSON.parse(parser.toJson(data)) as TrialBackup;
  return json;
}

export function getBackupCriteria(trial: TrialBackup) {
  const criteria :string = trial.clinical_study.eligibility.criteria.textblock;
  return criteria;
}

export function getBackupSummary(trial: TrialBackup) {
  const summary:string = trial.clinical_study.brief_summary.textblock;
  return summary;
}

export function getBackupPhase(trial: TrialBackup) {
  const phase:string = trial.clinical_study.phase;
  return phase;
}

export function getBackupStudyType(trial: TrialBackup) {
  const studytype:string = trial.clinical_study.study_type;
  return studytype;
 }

// additional getters for breastcancertrials.org
export function getBackupStatus(trial: TrialBackup) {
 const status:string = statusMap.get(trial.clinical_study.overall_status);
 return status;
}

export function getBackupCondition(trial: TrialBackup) {
 const condition:string = trial.clinical_study.condition;
 return typeof condition == 'string' ? [ condition ] : condition;
}

export function getBackupSite(trial: TrialBackup) {
 const sites: Site[] = trial.clinical_study.location;
 return Array.isArray(sites) ? sites : [sites];
}
