import { fhir } from "clinical-trial-matching-service";
import { mapRxNormToSnomed } from "../src/query";
import fs from "fs";
import path from "path";
import {
  importRxnormSnomedMapping,
  importStageSnomedMapping,
  MedicationCodeableConcept,
} from "../src/breastcancertrials";

describe("StageSnomedMappingTests", () => {
  // Setup
  let testPatientBundle: fhir.Bundle;
  beforeAll(() => {
    importStageSnomedMapping().catch(() => "Loaded");
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
    });
  });

  it("Test Breast Cancer Stage SNOMED Mappings from Qualifer Value Codes to Clincal Finding Codes", function () {
    // Test that RxNorm code 904425 gets mapped to SNOMED 96290008 (located in entry[1] in patient_data)
    mapRxNormToSnomed(testPatientBundle);
    expect(
      (testPatientBundle.entry[1].resource[
        "medicationCodeableConcept"
      ] as MedicationCodeableConcept).coding[0].code
    ).toBe("96290008");
    expect(
      (testPatientBundle.entry[1].resource[
        "medicationCodeableConcept"
      ] as MedicationCodeableConcept).coding[0].system
    ).toBe("http://snomed.info/sct");
    // Test that RxNorm code 34566 Does NOT map to anything else (located in entry[3] in patient_data).
    expect(
      (testPatientBundle.entry[3].resource[
        "medicationCodeableConcept"
      ] as MedicationCodeableConcept).coding[0].code
    ).toBe("34566");
    expect(
      (testPatientBundle.entry[3].resource[
        "medicationCodeableConcept"
      ] as MedicationCodeableConcept).coding[0].system
    ).toBe("http://www.nlm.nih.gov/research/umls/rxnorm");
    // Test that RxNorm code 1156253 gets mapped to SNOMED 395926009 (located in entry[4] in patient_data).
    expect(
      (testPatientBundle.entry[4].resource[
        "medicationCodeableConcept"
      ] as MedicationCodeableConcept).coding[0].code
    ).toBe("395926009");
    expect(
      (testPatientBundle.entry[4].resource[
        "medicationCodeableConcept"
      ] as MedicationCodeableConcept).coding[0].system
    ).toBe("http://snomed.info/sct");
    // Test that RxNorm code 583218 gets mapped to SNOMED 426653008 (located in entry[4] in patient_data).
    expect(
      (testPatientBundle.entry[5].resource[
        "medicationCodeableConcept"
      ] as MedicationCodeableConcept).coding[0].code
    ).toBe("426653008");
    expect(
      (testPatientBundle.entry[5].resource[
        "medicationCodeableConcept"
      ] as MedicationCodeableConcept).coding[0].system
    ).toBe("http://snomed.info/sct");
    // Test that RxNorm code 583214 gets mapped to SNOMED 426653008 (located in entry[4] in patient_data).
    expect(
      (testPatientBundle.entry[6].resource[
        "medicationCodeableConcept"
      ] as MedicationCodeableConcept).coding[0].code
    ).toBe("426653008");
    expect(
      (testPatientBundle.entry[6].resource[
        "medicationCodeableConcept"
      ] as MedicationCodeableConcept).coding[0].system
    ).toBe("http://snomed.info/sct");
  });
});
