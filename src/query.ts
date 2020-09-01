/**
 * Handles conversion of patient bundle data to a proper request for matching service apis.
 * Retrieves api response as promise to be used in conversion to fhir ResearchStudy
 */

import { ClinicalTrialGovService, fhir, ResearchStudy, SearchSet, ServiceConfiguration } from 'clinical-trial-matching-service';
import { TrialResponse } from './breastcancertrials';
import { convertToResearchStudy } from './research-study';

type Bundle = fhir.Bundle;

import http from 'http'; // changed from https
import { IncomingMessage } from 'http';

type JsonObject = Record<string, unknown> | Array<unknown>;

export interface QueryConfiguration extends ServiceConfiguration {
  endpoint?: string;
}

export class APIError extends Error {
  constructor(message: string, public result: IncomingMessage, public body: string) {
    super(message);
  }
}

/**
 * Create a new matching function using the given configuration.
 * @param configuration the configuration to use to configure the matcher
 */
export function createClinicalTrialLookup(configuration: QueryConfiguration, backupService: ClinicalTrialGovService): (patientBundle: Bundle) => Promise<SearchSet> {
  // Raise errors on missing configuration
  if (typeof configuration.endpoint !== 'string') {
    throw new Error('Missing endpoint in configuration');
  }
  const endpoint = configuration.endpoint;
  return function getMatchingClinicalTrials(patientBundle: Bundle): Promise<SearchSet> {
    // For now, the full patient bundle is the query
    return sendQuery(endpoint, JSON.stringify(patientBundle)).then((result) => {
      // Convert the result to a SearchSet
      return backupService.downloadTrials(result.map(trialResponse => trialResponse.trialId)).then(() => {
        return Promise.all(result.map(async (trialResponse) => {
          const clinicalStudy = await backupService.getDownloadedTrial(trialResponse.trialId);
          return convertToResearchStudy(trialResponse, clinicalStudy);
        })).then(studies => new SearchSet(studies));
      });
    });
  };
}

/** TO-DO
 * Finish making an object for storing the various parameters necessary for the api query
 * based on a patient bundle.
 * Reference https://github.com/mcode/clinical-trial-matching-engine/wiki to see patientBundle Structures
 -> possibly not needed for breastcancertrials.org - for now it seems the patientBundle itself can serve as the query
    commenting out the whole class for now

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

    toQuery(): string {
      const query = ` {}`;
      return query;
    }

    toString(): string {
      return this.toQuery();
    }
  }
*/

function sendQuery(endpoint: string, query: string): Promise<TrialResponse[]> {
  return new Promise((resolve, reject) => {
    const body = Buffer.from(query, 'utf8'); // or use samplePatient
    console.log('Running raw query');
    console.log(query);
    const request = http.request(endpoint, {
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
          const json = JSON.parse(responseBody) as unknown;
          if (Array.isArray(json)) {
            // Assume it's correct
            resolve(json as TrialResponse[]);
          } else {
            reject(new APIError('Unexpected JSON result from server', result, responseBody));
          }
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
