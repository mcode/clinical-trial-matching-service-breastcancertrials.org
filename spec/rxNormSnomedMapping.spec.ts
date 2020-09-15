import { fhir } from "clinical-trial-matching-service";
import { mapRxNormToSnomed } from "../src/query";
import fs from "fs";
import path from "path";
import { BUNDLE_TYPES } from "clinical-trial-matching-service/dist/fhir-types";
import { MedicationCodeableConcept } from "../src/breastcancertrials";

describe("RxNormSnomedMappingTests", async () => {
  // Setup
  let testPatientBundle: fhir.Bundle;
  beforeAll(() => {
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

  it("Test RxNorm to SNOMED Mappings", function () {
    // Test that RxNorm code 51499 gets mapped to SNOMED 372538008 (located in entry[1] in patient_data).
    mapRxNormToSnomed(testPatientBundle);
    expect(
      (testPatientBundle.entry[1].resource[
        "medicationCodeableConcept"
      ] as MedicationCodeableConcept).coding[0].code
    ).toBe("372538008");
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
    // Test that RxNorm code 11473 gets mapped to SNOMED 96288007 (located in entry[4] in patient_data).
    expect(
      (testPatientBundle.entry[4].resource[
        "medicationCodeableConcept"
      ] as MedicationCodeableConcept).coding[0].code
    ).toBe("96288007");
    expect(
      (testPatientBundle.entry[4].resource[
        "medicationCodeableConcept"
      ] as MedicationCodeableConcept).coding[0].system
    ).toBe("http://snomed.info/sct");
  });
});
