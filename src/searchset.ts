import { ResearchStudy } from './research-study';

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

  constructor(response: any) {
    this.total = 0; // TO-DO: Set the total number of trials returned by the match service
    const trials = []; // TO-DO: Create an iterable version of the trials returned from the raw JSON of the match service (if necessary)
    let index = 0;

    for (const trial of trials) {
      const study = new ResearchStudy(trial, index); // TO DO: Implement the ResearchStudy constructor in research-study.ts
      const searchResult: SearchResult = {mode: "match", score: 1}; // TO-DO: Set the score (0-1) for each trial (< 0.33 for "No Match", else < 0.67 for "Possible Match", else "Likely Match")
      // If the trial does not have a match score, do not include the "search" parameter in the following line
      this.entry.push({resource: study, search: searchResult});
      index++;
    }

  }

}
