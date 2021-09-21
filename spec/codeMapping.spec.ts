import { fhir } from "clinical-trial-matching-service";
import { conformStageCoding, performCodeMapping } from "../src/query";
import fs from "fs";
import path from "path";
import {
  importRxnormSnomedMapping,
  Coding,
  Stage,
  importStageSnomedMapping,
  importStageAjccMapping,
} from "../src/breastcancertrials";
import { json } from "body-parser";

describe("Code Mapping Tests.", () => {
  // Setup
  let testPatientBundle: fhir.Bundle;
  let testPatientBundleStagePlacement: fhir.Bundle;
  beforeAll(() => {
    importRxnormSnomedMapping().catch(
      () => "Loaded RxNorm-SNOMED Mapping for Tests."
    );
    importStageSnomedMapping().catch(
      () => "Loaded Staging SNOMED Mapping for Tests."
    );
    importStageAjccMapping().catch(
      () => "Loaded Staging AJCC to SNOMED Mapping for Tests."
    );
    return new Promise((resolve, reject) => {
      const patientDataPath = path.join(
        __dirname,
        "../../spec/data/patient_data.json"
      );
      fs.readFile(patientDataPath, { encoding: "utf8" }, (error, data) => {
        if (error) {
          console.error("Could not read spec file");
          reject(error);
          return;
        }
        try {
          testPatientBundle = JSON.parse(data) as fhir.Bundle;
          // The object we resolve to doesn't really matter
          resolve(testPatientBundle);
        } catch (ex) {
          reject(error);
        }
      });
      const patientStagePlacementPath = path.join(
        __dirname,
        "../../spec/data/stage_placement.json"
      );
      fs.readFile(patientStagePlacementPath, { encoding: "utf8" }, (error, data) => {
        if (error) {
          console.error("Could not read spec file");
          reject(error);
          return;
        }
        try {
          testPatientBundleStagePlacement = JSON.parse(data) as fhir.Bundle;
          // The object we resolve to doesn't really matter
          resolve(testPatientBundleStagePlacement);
        } catch (ex) {
          reject(error);
        }
      });
    });
  });

  it("Test Coding Mappings.", function () {
    // Map the RxNorm-SNOMED codes in the patient bundle.
    performCodeMapping(testPatientBundle);

    // Test that RxNorm code 904425 gets mapped to SNOMED 96290008 (located in entry[1] in patient_data)
    expect(
      (testPatientBundle.entry[1].resource[
        "medicationCodeableConcept"
      ] as Coding).coding[0].code
    ).toBe("96290008");
    expect(
      (testPatientBundle.entry[1].resource[
        "medicationCodeableConcept"
      ] as Coding).coding[0].system
    ).toBe("http://snomed.info/sct");
    // Test that Staging summary SNOMED code 258215001 gets mapped to SNOMED 13104003 (located in entry[2], stage[0], coding[1] in patient_data)
    expect(
      (testPatientBundle.entry[2].resource["stage"] as Stage[])[0].summary
        .coding[1].code
    ).toBe("13104003");
    expect(
      (testPatientBundle.entry[2].resource["stage"] as Stage[])[0].summary
        .coding[1].system
    ).toBe("http://snomed.info/sct");
    // Test that Staging type SNOMED code 261639007 gets mapped to SNOMED 64062008 (located in entry[2], stage[0], coding[0] in patient_data)
    expect(
      (testPatientBundle.entry[2].resource["stage"] as Stage[])[0].type
        .coding[0].code
    ).toBe("64062008");
    expect(
      (testPatientBundle.entry[2].resource["stage"] as Stage[])[0].type
        .coding[0].system
    ).toBe("http://snomed.info/sct");
    // Test that LOINC code 34566 Does NOT map to anything else (located in entry[3] in patient_data).
    expect(
      (testPatientBundle.entry[3].resource[
        "code"
      ] as Coding).coding[0].code
    ).toBe("34566");
    expect(
      (testPatientBundle.entry[3].resource[
        "code"
      ] as Coding).coding[0].system
    ).toBe("http://loinc.org");
    // Test that RxNorm code 1156253 gets mapped to SNOMED 395926009 (located in entry[5] in patient_data).
    expect(
      (testPatientBundle.entry[5].resource[
        "medicationCodeableConcept"
      ] as Coding).coding[0].code
    ).toBe("395926009");
    expect(
      (testPatientBundle.entry[5].resource[
        "medicationCodeableConcept"
      ] as Coding).coding[0].system
    ).toBe("http://snomed.info/sct");
    // Test that RxNorm code 583218 gets mapped to SNOMED 426653008 (located in entry[6] in patient_data).
    expect(
      (testPatientBundle.entry[6].resource[
        "medicationCodeableConcept"
      ] as Coding).coding[0].code
    ).toBe("426653008");
    expect(
      (testPatientBundle.entry[6].resource[
        "medicationCodeableConcept"
      ] as Coding).coding[0].system
    ).toBe("http://snomed.info/sct");
    // Test that RxNorm code 583214 gets mapped to SNOMED 426653008 (located in entry[7] in patient_data).
    expect(
      (testPatientBundle.entry[7].resource[
        "medicationCodeableConcept"
      ] as Coding).coding[0].code
    ).toBe("426653008");
    expect(
      (testPatientBundle.entry[7].resource[
        "medicationCodeableConcept"
      ] as Coding).coding[0].system
    ).toBe("http://snomed.info/sct");
    // Test that Staging summary SNOMED code 261638004 gets mapped to SNOMED 73082003 (located in entry[8], stage[0] in patient_data)
    expect(
      (testPatientBundle.entry[8].resource["stage"] as Stage[])[0].summary
        .coding[0].code
    ).toBe("73082003");
    expect(
      (testPatientBundle.entry[8].resource["stage"] as Stage[])[0].summary
        .coding[0].system
    ).toBe("http://snomed.info/sct");
    // Test that Staging type SNOMED code 258228008 gets mapped to SNOMED 2640006 (located in entry[9], stage[1] in patient_data)
    expect(
      (testPatientBundle.entry[9].resource["stage"] as Stage[])[1].type
        .coding[0].code
    ).toBe("2640006");
    expect(
      (testPatientBundle.entry[9].resource["stage"] as Stage[])[1].type
        .coding[0].system
    ).toBe("http://snomed.info/sct");
    // throw JSON.stringify(testPatientBundle.entry[10].resource["stage"] as Stage[])
    // expect(
    // // Test that staging AJCC 1a maps to SNOMED 13104003.
    //   (testPatientBundle.entry[10].resource["stage"] as Stage[])[0].type
    //     .coding[0].code
    // ).toBe("13104003");
    // expect(
    //   (testPatientBundle.entry[10].resource["stage"] as Stage[])[0].type
    //     .coding[0].system
    // ).toBe("http://snomed.info/sct");
  });

  it("Test Coding Mappings.", function () {
    // Conform the staging values to the Primary Cancer Condition.
    conformStageCoding(testPatientBundleStagePlacement);

    // Check array equality
    const stageArrayIsWithinStageArray = (fullArray: Stage[], subArray: Stage[]) => {

      const codingsMatch = (coding1: Coding, coding2: Coding) => {
        for(const currentCoding1 of coding1.coding){
          if(coding2.coding.some(currentCoding2 => currentCoding1.code == currentCoding2.code && currentCoding1.system == currentCoding2.system)){
            return true;
          }
        }
        return false;
      }

      for(const subObj of subArray){
        if(fullArray.filter(fullObj => codingsMatch(fullObj.type, subObj.type) || codingsMatch(fullObj.summary, subObj.summary)).length < 1){
          return false;
        }
      }
      return true;
    }

    // Build expected stage object.
    const expectedClinicalStageCoding: Coding = {coding: [{system: "http://snomed.info/sct", code: "261638004", display: ""}], text: ""} as Coding;
    const expectedPathologicalStageCoding: Coding = {coding: [{system: "http://snomed.info/sct", code: "50283003", display: ""}], text: ""} as Coding;
    const expectedStaging: Stage[] = [];
    expectedStaging.push({type: expectedClinicalStageCoding, summary: expectedClinicalStageCoding} as Stage);
    expectedStaging.push({type: expectedPathologicalStageCoding, summary: expectedPathologicalStageCoding} as Stage);
    expect(stageArrayIsWithinStageArray(testPatientBundleStagePlacement.entry[1].resource["stage"], expectedStaging)).toBeTrue();
  });

  // TODO: Fix an issue where patient data JSON is not always properly read in.
});
