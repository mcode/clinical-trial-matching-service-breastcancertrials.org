
/**
 * Handles conversion of patient bundle data to a proper request for matching service apis.
 * Retrieves api response as promise to be used in conversion to fhir ResearchStudy
 */

import { Bundle, Condition } from './bundle';
import http from 'http'; // changed from https
import { IncomingMessage } from 'http';
import Configuration from "./env";

// sample for development
const samplePatient = `{
                        "resourceType": "Bundle",
                        "entry": [
                          {
                            "resource": {
                              "resourceType": "Patient",
                              "id": "5bc1e9964142590005d12d7c",
                              "gender": "female",
                              "birthDate": "1966-04-25"
                            }
                          },
                          {
                            "resource": {
                              "resourceType": "Condition",
                              "id": "condition1",
                              "subject": {
                                   "reference" : "Patient/5bc1e9964142590005d12d7c"
                              },
                              "code":	{
                                "coding" : [
                                  {
                                    "system": "http://snomed.info/sct",
                                    "code": "126926005"
                                  }
                                ],
                                "text" : "Breast Neo plasm"
                              },
                              "clinicalStatus" : "active",
                              "verificationStatus" : "confirmed",
                              "bodySite" : [ {
                                "coding" : [
                                  {
                                    "system": "http://snomed.info/sct",
                                    "code": "421663001"
                                  }
                                ],
                                "text" : "Body Site:  Bone"
                              },
                              {
                                "coding" : [
                                  {
                                    "system": "http://snomed.info/sct",
                                    "code": "59441001"
                                  }
                                ],
                                "text" : "Body Site: Lymph Nodes"
                              }],
                              "stage" : [ {
                                "summary" : {
                                  "coding" : [
                                  {
                                    "system": "http://snomed.info/sct",
                                    "code": "2640006"
                                  }
                                  ],
                                  "text" : "verification status confirmed"
                                }
                              } ],
                                      "onsetDateTime": "2018-01-01"
                            }
                          },
                          {
                            "resource": {
                              "resourceType": "Observation",
                              "status": "final",
                              "subject": {
                                   "reference" : "Patient/5bc1e9964142590005d12d7c"
                              },
                              "code": {
                                "coding" : [
                                        {
                                          "system": "http://loinc.org",
                                          "code": "42802-9"
                                        }
                                      ],
                                "text" : "Meno Pausal"
                              },
                              "valueCodeableConcept" : {
                                "coding" : [
                                        {
                                          "system": "http://snomed.info/sct",
                                          "code": "76498008"
                                        }
                                      ],
                                "text" : "Post"
                              }

                            }
                          },
                          {
                            "resource": {
                              "resourceType": "Observation",
                              "status": "final",
                              "subject": {
                                   "reference" : "Patient/5bc1e9964142590005d12d7c"
                                },
                                "code": {
                                "coding" : [
                                        {
                                          "system": "http://loinc.org",
                                          "code": "16112-5"
                                        }
                                      ],
                                "text" : "ER"
                                },
                                "valueCodeableConcept" : {
                                  "coding" : [
                                          {
                                            "system": "http://hl7.org/fhir/v2/0078",
                                            "code": "POS"
                                          }
                                        ],
                                "text" : "Positive"
                              }
                            }
                          },
                          {
                            "resource": {
                              "resourceType": "MedicationAdministration",
                              "id": "medication001",
                              "medicationCodeableConcept": {
                                  "coding": [
                                    {
                                        "system": "http://snomed.info/sct",
                                        "code": "372817009",
                                        "display": "Adriamycin"
                                    }
                                  ]
                              },
                              "subject": {
                                  "reference" : "Patient/5bc1e9964142590005d12d7c"
                              },
                              "effectiveDateTime": "2000-06-01",
                              "status": "completed"
                            }
                          },
                          {
                            "resource": {
                              "resourceType": "MedicationAdministration",
                              "id": "medication002",
                              "medicationCodeableConcept": {
                                  "coding": [
                                    {
                                        "system": "http://snomed.info/sct",
                                        "code": "387420009",
                                        "display": "Cytoxan"
                                    }
                                  ]
                              },
                              "subject": {
                                  "reference" : "Patient/5bc1e9964142590005d12d7c"
                              },
                              "effectiveDateTime": "2000-06-01",
                              "status": "completed"
                            }
                          },
                          {
                            "resource": {
                              "resourceType": "MedicationAdministration",
                              "id": "medication003",
                              "medicationCodeableConcept": {
                                  "coding": [
                                    {
                                        "system": "http://snomed.info/sct",
                                        "code": "387374002",
                                        "display": "Taxol"
                                    }
                                  ]
                              },
                              "subject": {
                                  "reference" : "Patient/5bc1e9964142590005d12d7c"
                              },
                              "effectiveDateTime": "2000-06-01",
                              "status": "completed"
                            }
                          },
                          {
                            "resource": {
                              "resourceType": "MedicationAdministration",
                              "id": "medication004",
                              "medicationCodeableConcept": {
                                  "coding": [
                                    {
                                        "system": "http://snomed.info/sct",
                                        "code": "373345002",
                                        "display": "Tamoxifen"
                                    }
                                  ]
                              },
                              "subject": {
                                  "reference" : "Patient/5bc1e9964142590005d12d7c"
                              },
                              "effectiveDateTime": "2001-01-01",
                              "status": "completed"
                            }
                          },
                          {
                            "resource": {
                              "resourceType": "MedicationAdministration",
                              "id": "medication005",
                              "medicationCodeableConcept": {
                                  "coding": [
                                    {
                                        "system": "http://snomed.info/sct",
                                        "code": "386911004",
                                        "display": "Letrozole"
                                    }
                                  ]
                              },
                              "subject": {
                                  "reference" : "Patient/5bc1e9964142590005d12d7c"
                              },
                              "effectiveDateTime": "2006-01-01",
                              "status": "completed"
                            }
                          },
                          {
                            "resource": {
                              "resourceType": "MedicationAdministration",
                              "id": "medication006",
                              "medicationCodeableConcept": {
                                  "coding": [
                                    {
                                        "system": "http://snomed.info/sct",
                                        "code": "385519002",
                                        "display": "Fulvestrant"
                                    }
                                  ]
                              },
                              "subject": {
                                  "reference" : "Patient/5bc1e9964142590005d12d7c"
                              },
                              "effectiveDateTime": "2018-09-01",
                              "status": "in-progress"
                            }
                          },
                          {
                            "resource": {
                              "resourceType": "MedicationAdministration",
                              "id": "medication007",
                              "medicationCodeableConcept": {
                                  "coding": [
                                    {
                                        "system": "http://snomed.info/sct",
                                        "code": "715958001",
                                        "display": "Palbociclib"
                                    }
                                  ]
                              },
                              "subject": {
                                  "reference" : "Patient/5bc1e9964142590005d12d7c"
                              },
                              "effectiveDateTime": "2018-09-01",
                              "status": "in-progress"
                            }
                          },
                          {
                            "resource": {
                              "resourceType": "Procedure",
                              "id": "proc001",
                              "status": "completed",
                              "code": {
                                  "coding": [
                                    {
                                      "system": "http://snomed.info/sct",
                                      "code": "108290001",
                                      "display": "Radiation"
                                    }
                                  ]
                                },
                                "subject": {
                                    "reference": "Patient/5bc1e9964142590005d12d7c",
                                   "display": "Patient 1"
                                },
                                "bodySite": [
                                    {
                                      "coding": [
                                        {
                                          "system": "http://snomed.info/sct",
                                          "code": "76752008",
                                          "display": "Breast"
                                        }
                                      ]
                                    },
                                    {
                                      "coding": [
                                        {
                                          "system": "http://snomed.info/sct",
                                          "code": "78904004",
                                          "display": "ChestWall"
                                        }
                                      ]
                                    }
                                 ]
                            }
                          },
                          {
                            "resource": {
                              "resourceType": "Procedure",
                              "id": "proc002",
                              "status": "completed",
                              "code": {
                                  "coding": [
                                    {
                                      "system": "http://snomed.info/sct",
                                      "code": "108290001",
                                      "display": "Radiation"
                                    }
                                  ]
                                },
                                "subject": {
                                    "reference": "Patient/5bc1e9964142590005d12d7c",
                                   "display": "Patient 1"
                                },
                                "bodySite": [
                                    {
                                      "coding": [
                                        {
                                          "system": "http://snomed.info/sct",
                                          "code": "2748008",
                                          "display": "Spine"
                                        }
                                      ]
                                    }
                                 ]
                            }
                          },
                          {
                            "resource": {
                              "resourceType": "Procedure",
                              "id": "proc003",
                              "status": "completed",
                              "code": {
                                  "coding": [
                                    {
                                      "system": "http://snomed.info/sct",
                                      "code": "69031006",
                                      "display": "Mastectomy of breast"
                                    }
                                  ]
                                },
                                "subject": {
                                    "reference": "Patient/5bc1e9964142590005d12d7c",
                                   "display": "Patient 1"
                                }
                            }
                          }
                        ]
                      }`;

//API RESPONSE SECTION
export class APIError extends Error {
    constructor(message: string, public result: IncomingMessage, public body: string) {
      super(message);
    }
}

//set environment variables
const environment = new Configuration().defaultEnvObject();
// currently the breastcancertrials.org sandbox doesn't need a token, so this may be removed
if (typeof environment.AUTH_TOKEN !== 'string' || environment.AUTH_TOKEN === '') {
    throw new Error('Authorization token is not set in environment. Please set AUTH_TOKEN to valid API token.');
}


/** TO-DO
 * Finish making an object for storing the various parameters necessary for the api query
 * based on a patient bundle.
 * Reference https://github.com/mcode/clinical-trial-matching-engine/wiki to see patientBundle Structures
 -> possibly not needed for breastcancertrials.org - for now it seems the patientBundle itself can serve as the query
 */
export class APIQuery {
    conditions = new Set<string>();
    zipCode?: string = null;
    travelRadius?: number = null;
    phase = 'any';
    recruitmentStatus = 'all';

     // TO-DO Add any additional fields which need to be extracted from the bundle to construct query

    constructor(patientBundle: Bundle) {
      for (const entry of patientBundle.entry) {
        if (!('resource' in entry)) {
          // Skip bad entries
          continue;
        }
        const resource = entry.resource;
        console.log(`Checking resource ${resource.resourceType}`);
        //Obtain critical search parameters
        if (resource.resourceType === 'Parameters') {
          for (const parameter of resource.parameter) {
            console.log(` - Setting parameter ${parameter.name} to ${parameter.valueString}`);
            if (parameter.name === 'zipCode') {
              this.zipCode = parameter.valueString;
            } else if (parameter.name === 'travelRadius') {
              this.travelRadius = parseFloat(parameter.valueString);
            } else if (parameter.name === 'phase') {
              this.phase = parameter.valueString;
            } else if (parameter.name === 'recruitmentStatus') {
              this.recruitmentStatus = parameter.valueString;
            }
          }
        }
        //Gather all conditions the patient has
        if (resource.resourceType === 'Condition') {
          this.addCondition(resource);
        }
        //TO-DO Extract any additional resources that you defined



      }
    }
    addCondition(condition: Condition): void {
      // Should have a code
      // TODO: Limit to specific coding systems (maybe)
      for (const code of condition.code.coding) {
        this.conditions.add(code.code);
      }
    }

    //TO-DO Utilize the extracted information to create the API query

    /**
     * Create an api request string
     * @return {string} the api query
     -> possibly not needed for breastcancertrials.org - for now it seems the patientBundle itself can serve as the query
     */
    toQuery(): string {
      const query = ` {}`;
      return query;
    }

    toString(): string {
      return this.toQuery();
    }
  }


/** Converts patient Bundle (stored within request to server) --> Promise < JSON>
 * @param reqBody The body of the request containing patient bundle data
 */

export function getResponse(patientBundle: Bundle) : Promise<JSON> {
    //const query = (new APIQuery(patientBundle)).toQuery();
    return sendQuery(JSON.stringify(patientBundle)); // For now, the full patient bundle is the query
}

function sendQuery(query: string): Promise<JSON> {
    return new Promise((resolve, reject) => {
      const body = Buffer.from(query, 'utf8'); // or use samplePatient
      console.log('Running raw query');
      console.log(query);
      const request = http.request(environment.api_endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/fhir+json'
        }
      }, result => {
        let responseBody = '';
        result.on('data', chunk => {
          responseBody += chunk;
        });
        result.on('end', () => {
          console.log('Complete');
          if (result.statusCode === 200) {
            resolve(JSON.parse(responseBody));
          } else {
            reject(new APIError(`Server returned ${result.statusCode} ${result.statusMessage}`, result, responseBody));
          }
        });
      });

      request.on('error', error => reject(error));

      request.write(body);
      request.end();
    });
  }
