import * as trialbackup from './trialbackup';

/*
This file contains a basic implementation of a FHIR ResearchStudy resource and supporting interfaces
The class can be expanded meeting the specifications outlined at https://www.hl7.org/fhir/researchstudy.html
Should your matching service not provide a necessary attribute, use trialbackup.ts fill it in, if there is nothing to
pull in from the backup, leave the attribute out of your FHIR ResearchStudy entirely
*/

// FHIR data types supporting ResearchStudy
export interface Identifier{
  use?: string;
  system?: string;
  value?: string;
}

export interface CodeableConcept {
  coding?: {system?: string; code?: string; display?: string;}[]
  text?: string;
}

export interface ContactDetail {
  name?: string;
  telecom?: Telecom[];
}

export interface Telecom {
  system?: string;
  value?: string;
  use?: string;
}

export interface Arm {
  name?: string;
  type?: CodeableConcept;
  description?: string;
}

export interface Objective {
  name?: string;
  type?: CodeableConcept;
}

export interface Reference {
  reference?: string;
  type?: string;
  display?: string;
}

// FHIR resources contained within ResearchStudy
export interface Group {
  resourceType?: string
  id?: string;
  type?: string;
  actual?: boolean;
}

export interface Location {
  resourceType?: string
  id?: string;
  name?: string;
  telecom?: Telecom[];
  position?: {longitude?: number; latitude?: number};
}

export interface Organization {
  resourceType?: string
  id?: string;
  name?: string;
}

export interface Practitioner {
  resourceType?: string
  id?: string;
  name?: HumanName[];
}

// FHIR data types supporting resources contained in ResearchStudy
export interface HumanName {
  use?: string;
  text: string;
}

// ResearchStudy implementation
export class ResearchStudy {
  resourceType = 'ResearchStudy';
  id?: string;
  identifier?: Identifier[];
  title?: string;
  status?: string; // Use values from this coding system: http://hl7.org/fhir/research-study-status
  phase?: CodeableConcept; // Use values from this coding system: http://terminology.hl7.org/CodeSystem/research-study-phase
  category?: CodeableConcept[];
  condition?: CodeableConcept[];
  contact?: ContactDetail[];
  keyword?: CodeableConcept[];
  location?: CodeableConcept[];
  description?: string; // Should actually be markdown
  arm?: Arm[];
  objective?: Objective[];
  enrollment?: Reference[]; // reference to a list of Group resource(s) (trial inclusion/exclusion criteria)
  sponsor?: Reference; // reference to an Organization resource
  principalInvestigator?: Reference; // reference to a Practitioner resource
  site?: Reference[]; // reference to a Location Resource
  contained?: (Group | Location | Organization | Practitioner)[]; // List of referenced resources
  // Details on Contained: https://www.hl7.org/fhir/domainresource-definitions.html#DomainResource.contained
  // Details on Reference: https://www.hl7.org/fhir/references.html#Reference
  // Note: If the trial criteria is a text blob that cannot be mapped to characteristics in a Group resource,
  // it can be stored in the display attribute of the Reference instead

  constructor(trial, id: number) {

    /*
    Set as many of the above parameters as possible
    The following parameters are required for the UI:
    - Title
    - Summary
    - Site location
    - Phase
    - Contact Information i.e. sponsor email, phone number
    - Study Type
    - Inclusion/ Exclusion criteria
    If your service does not return a necessary attribute, leverage the code in trialbackup.ts with the trial's nctId
    to find the required information.
    Write your constructor such that if the information cannot be found the response from your match service or in the
    trialbackup system, the parameter is left out of the ResearchStudy object entirely
    A sample filled out ResearchStudy constructor (build for TrialScope) can be found here:
    https://github.com/mcode/clinical-trial-matching-service/blob/master/src/research-study.ts
    */

    this.id = String(id);
  }
}


