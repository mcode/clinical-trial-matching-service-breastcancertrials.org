# clinical-trial-matching-service-template
Template which streamlines the process of writing a server for clinical trial matching system. 

For more information on the architecture and data schemas of the clinical trial matching system, please visit the clinical-trial-matching-engine [wiki](https://github.com/mcode/clinical-trial-matching-engine/wiki).

These steps give an overview of steps you need to take to get the template into a running server

## Steps:

1. Navigate to **env.ts**. 
    - Fill in the defaults environment variables corresponding to your api service
    - Create a file in the project directory named **.env.local** and enter the following: AUTH_TOKEN = **_insert authorization token_** 
2. Open up **searchset.ts**. This is one of two files that turns the response from the match API into a FHIR Bundle.
    - Fill in the TO-DOs in the _SearchSet_ constructor
3. Open up **research-study.ts**. This is the other file that turns the response from the match API into a FHIR Bundle. This file maps a trial from the match API to a FHIR ResearchStudy.
    - Complete the constructors for the _ResearchStudy_ classes
        * Extract as many paramaters as possible from the JSON while adhering to the spec
    - Ensure this part is completed as it used in the rest of the server 
    - For testing and validation, make sure to save off an example result from the match API to **trial_object.json**. There are unit tests that will validate the ResearchStudy bundle that has been created by filling in the constructors above.
4. Open **query.ts**
    - Complete the _APIQuery_ class 
        * Learn more about patient bundle formatting on the [wiki](https://github.com/mcode/clinical-trial-matching-engine/wiki/Data-Model). 
        * Complete the **toQuery()** function which formats the request body sent to the matching service API. 
5. Download and unzip folder of trials from (https://clinicaltrials.gov/ct2/resources/download#DownloadAllData) and place it in the src folder. Name it 'AllPublicXML'


# Requirements

The ResearchStudy object passed back by this server must be [FHIR-compliant] (https://www.hl7.org/fhir/researchstudy.html) and satisfy several requirements. 
Study must contain: 
- Title 
- Summary 
- Site location
- Phase 
- Contact Information i.e. sponsor email, phone number
- Study Type 
- Inclusion/ Exclusion criteria

Note: _research-study.ts_ provides a "backup" system for filling in information missing from the object passed back from the matching service. This system fills in the following based on the trial's NctId:
- Inclusion/Exclusion Criteria
- Phase 
- Study Type 
- Trial Summary

# Running the Server
1. Run `npm install`
2. Run `npm run-script build`
3. Run `npm start`
4. The service will now be running at http://localhost:3000/
