import * as trialbackup from './trialbackup';
import * as breastcancertrials from "./breastcancertrials";

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
  resourceType = 'ResearchStudy'; // done
  id?: string; // done
  identifier?: Identifier[]; // done
  title?: string; // done
  status?: string; // Use values from this coding system: http://hl7.org/fhir/research-study-status // done
  phase?: CodeableConcept; // Use values from this coding system: http://terminology.hl7.org/CodeSystem/research-study-phase // done
  category?: CodeableConcept[]; // done
  condition?: CodeableConcept[]; // done
  contact?: ContactDetail[]; // done
  keyword?: CodeableConcept[]; // done
  location?: CodeableConcept[]; // done
  description?: string; // Should actually be markdown // done
  arm?: Arm[]; // skipped
  objective?: Objective[]; // done
  enrollment?: Reference[]; // reference to a list of Group resource(s) (trial inclusion/exclusion criteria) // done
  sponsor?: Reference; // reference to an Organization resource // done
  principalInvestigator?: Reference; // reference to a Practitioner resource // skipped
  site?: Reference[]; // reference to a Location Resource // done
  contained?: (Group | Location | Organization | Practitioner)[]; // List of referenced resources // done

  constructor(trial: breastcancertrials.TrialResponse, id: number) {

    this.id = String(id);
    if (trial.trialTitle) {
      this.title = trial.trialTitle;
    }
    if (trial.trialId) {
      this.identifier = [{ use: 'official', system: 'http://clinicaltrials.gov', value: trial.trialId }];
    }
    // Attributes we have to get from the backup service
    const backupInfo = trialbackup.getBackupTrial(trial.trialId);
    const backupStatus = trialbackup.getBackupStatus(backupInfo);
    const backupCategory = trialbackup.getBackupStudyType(backupInfo);
    const backupCondition = trialbackup.getBackupCondition(backupInfo);
    const backupDescription = trialbackup.getBackupSummary(backupInfo);
    const backupCriteria = trialbackup.getBackupCriteria(backupInfo);
    const backupSites = trialbackup.getBackupSite(backupInfo);

    console.log(backupSites);

    if (backupStatus) {
      this.status = backupStatus;
    }
    if (trial.phaseNumber) {
     this.phase = {
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
      this.keyword = this.convertArrayToCodeableConcept(trial.trialCategories);
    }
    if (backupCategory) {
      this.category = [{ text: backupCategory }];
    }
    if (backupCondition) {
      this.condition = this.convertArrayToCodeableConcept(backupCondition);
    }
    if (trial.contactName || trial.contactPhone || trial.contactEmail) {
      this.contact = this.setContact(trial.contactName, trial.contactPhone, trial.contactEmail);
    }
    this.location = [{ text: "United States" }]; // default location country is USA
    if (trial.purpose && trial.whoIsThisFor) {
      this.description = "Purpose: " + trial.purpose + "\n\n Targets: " + trial.whoIsThisFor + "\n\n Description: " + backupDescription;
    } else {
      this.description = backupDescription;
    }
    if (trial.purpose) {
      this.objective = [{ name: trial.purpose }];
    }
    if (backupCriteria) {
      this.enrollment = [{ reference: '#group' + this.id, type: 'Group', display: backupCriteria}];
    }
    if (trial.siteName) {
      this.sponsor = { reference: '#org' + this.id, type: 'Organization' };
    }
    if (backupSites) {
      this.site = this.setSiteReferences(backupSites);
    }
    if (this.enrollment || this.site || this.sponsor || this.principalInvestigator) {
      this.contained = [];
    }
    if (this.enrollment) {
      this.contained.push({ resourceType: 'Group', id: 'group' + this.id, type: 'person', actual: false });
    }
    if (this.sponsor) {
      this.contained.push({ resourceType: 'Organization', id: 'org' + this.id, name: trial.siteName });
    }
    if (this.site) {
      this.addSitesToContained(backupSites);
    }

  }

  convertArrayToCodeableConcept(trialConditions: string[]): CodeableConcept[] {
    const fhirConditions: CodeableConcept[] = [];
    for (const condition of trialConditions) {
      fhirConditions.push({ text: condition });
    }
    return fhirConditions;
  }

  setContact(name: string, phone: string, email: string): ContactDetail[] {
      const contact: ContactDetail = {};
      if (name) {
        contact.name = name;
      }
      if (phone || email) {
        const telecoms: Telecom[] = [];
        if (phone) {
          telecoms.push({ system: 'phone', value: phone, use: 'work' });
        }
        if (email) {
          telecoms.push({ system: 'email', value: email, use: 'work' });
        }
        contact.telecom = telecoms;
      }
      return [contact];
    }

  setSiteReferences(sites: trialbackup.Site[]): Reference[] {
    const siteReferences: Reference[] = [];
    let siteIndex = 0;
    for (const site of sites) {
      siteReferences.push({ reference: '#location' + this.id + '-' + String(siteIndex), type: 'Location' });
      siteIndex++;
    }
    return siteReferences;
  }

  addSitesToContained(sites: trialbackup.Site[]): void {
    let locationIndex = 0;
    for (const location of sites) {
      const local: Location = {};
      local.resourceType = 'Location';
      local.id = 'location' + this.id + '-' + String(locationIndex);
      if (location.facility) {
        local.name = location.facility.name;
      }
      if (location.contact) {
        const localTelecom: Telecom[] = [];
        if (location.contact.email) {
          localTelecom.push({ system: 'email', value: location.contact.email, use: 'work' });
        }
        if (location.contact.phone) {
          localTelecom.push({ system: 'phone', value: location.contact.phone, use: 'work' });
        }
        local.telecom = localTelecom;
      }
      this.contained.push(local);
      locationIndex++;
    }
  }

}


