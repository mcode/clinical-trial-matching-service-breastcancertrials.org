
/**
 * Handles conversion of patient bundle data to a proper request for matching service apis.
 * Retrieves api response as promise to be used in conversion to fhir ResearchStudy
 */

import { Bundle, Condition } from './bundle';
import https from 'https';
import { IncomingMessage } from 'http';
import Configuration from "./env";

//API RESPONSE SECTION
export class APIError extends Error {
    constructor(message: string, public result: IncomingMessage, public body: string) {
      super(message);
    }
}

//set environment variables
const environment = new Configuration().defaultEnvObject();
if (typeof environment.AUTH_TOKEN !== 'string' || environment.AUTH_TOKEN === '') {
    throw new Error('Authorization token is not set in environment. Please set AUTH_TOKEN to valid API token.');
}


/** TO-DO
 * Finish making an object for storing the various parameters necessary for the api query
 * based on a patient bundle.
 * Reference https://github.com/mcode/clinical-trial-matching-engine/wiki to see patientBundle Structures
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
    const query = (new APIQuery(patientBundle)).toQuery();
    return sendQuery(query);
}

function sendQuery(query: string): Promise<JSON> {
    return new Promise((resolve, reject) => {
      const body = Buffer.from(`{"query":${JSON.stringify(query)}}`, 'utf8');
      console.log('Running raw query');
      console.log(query);
      const request = https.request(environment.api_endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Content-Length': body.byteLength.toString(),
          'Authorization': 'Bearer ' + environment.AUTH_TOKEN //Potentially needs to be modified ?
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
