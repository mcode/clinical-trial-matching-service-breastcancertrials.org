import { ResearchStudy } from './research-study';
import { TrialResponse } from "./breastcancertrials";

/* Handles conversion of API results to a standardized FHIR object
This file contains a basic implementation of a FHIR Bundle (of type searchset)
The class can be expanded meeting the specifications outlined at https://www.hl7.org/fhir/bundle.html
For further specification on the FHIR SearchSet specifically : https://www.hl7.org/fhir/bundle.html#searchset
*/

export interface SearchResult {
  mode: string;
  score: number;
}

export interface SearchBundleEntry {
  resource: ResearchStudy;
  search?: SearchResult;
}

export class SearchSet {
  resourceType = 'Bundle';
  type = 'searchset';
  total: number;
  entry: SearchBundleEntry[] = [];

  constructor(response: TrialResponse[]) {
    const trials = response; // iterable version of the trials returned from match service
    this.total = response.length; // total number of trials returned by the match service
    let index = 0;

    for (const trial of trials) {
      const study = new ResearchStudy(trial, index); // TO DO: Implement the ResearchStudy constructor in research-study.ts as TrialResponse
      //const searchResult: SearchResult = {mode: "match", score: 1}; // no match likelihood score
      this.entry.push({resource: study});
      index++;
    }

  }

}
