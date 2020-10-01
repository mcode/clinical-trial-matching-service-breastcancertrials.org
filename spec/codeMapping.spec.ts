import { fhir } from "clinical-trial-matching-service";
import { mapCodes } from "../src/query";
import fs from "fs";
import path from "path";
import {
  importRxnormSnomedMapping,
  BaseResourceCode, rxnormSnomedMapping, importStageSnomedMapping
} from "../src/breastcancertrials";

describe("RxNormSnomedMappingTests", () => {
  // Setup
  let testPatientBundle: fhir.Bundle;
  beforeAll(() => {
    importRxnormSnomedMapping().catch(() => "Loaded RxNorm-SNOMED Mapping.");
    importStageSnomedMapping().catch(() => "Loaded Staging SNOMED Mapping.");
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
    // Map the RxNorm-SNOMED codes in the patient bundle.
    mapCodes(testPatientBundle, 'MedicatiomStatement', rxnormSnomedMapping);

    // Test that RxNorm code 904425 gets mapped to SNOMED 96290008 (located in entry[1] in patient_data)
    expect(
      (testPatientBundle.entry[1].resource[
        "medicationCodeableConcept"
      ] as BaseResourceCode).coding[0].code
    ).toBe("96290008");
    expect(
      (testPatientBundle.entry[1].resource[
        "medicationCodeableConcept"
      ] as BaseResourceCode).coding[0].system
    ).toBe("http://snomed.info/sct");
    // Test that RxNorm code 34566 Does NOT map to anything else (located in entry[3] in patient_data).
    expect(
      (testPatientBundle.entry[3].resource[
        "medicationCodeableConcept"
      ] as BaseResourceCode).coding[0].code
    ).toBe("34566");
    expect(
      (testPatientBundle.entry[3].resource[
        "medicationCodeableConcept"
      ] as BaseResourceCode).coding[0].system
    ).toBe("http://www.nlm.nih.gov/research/umls/rxnorm");
    // Test that RxNorm code 1156253 gets mapped to SNOMED 395926009 (located in entry[4] in patient_data).
    expect(
      (testPatientBundle.entry[4].resource[
        "medicationCodeableConcept"
      ] as BaseResourceCode).coding[0].code
    ).toBe("395926009");
    expect(
      (testPatientBundle.entry[4].resource[
        "medicationCodeableConcept"
      ] as BaseResourceCode).coding[0].system
    ).toBe("http://snomed.info/sct");
    // Test that RxNorm code 583218 gets mapped to SNOMED 426653008 (located in entry[4] in patient_data).
    expect(
      (testPatientBundle.entry[5].resource[
        "medicationCodeableConcept"
      ] as BaseResourceCode).coding[0].code
    ).toBe("426653008");
    expect(
      (testPatientBundle.entry[5].resource[
        "medicationCodeableConcept"
      ] as BaseResourceCode).coding[0].system
    ).toBe("http://snomed.info/sct");
    // Test that RxNorm code 583214 gets mapped to SNOMED 426653008 (located in entry[4] in patient_data).
    expect(
      (testPatientBundle.entry[6].resource[
        "medicationCodeableConcept"
      ] as BaseResourceCode).coding[0].code
    ).toBe("426653008");
    expect(
      (testPatientBundle.entry[6].resource[
        "medicationCodeableConcept"
      ] as BaseResourceCode).coding[0].system
    ).toBe("http://snomed.info/sct");
  });
});
