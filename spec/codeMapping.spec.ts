import { fhir } from "clinical-trial-matching-service";
import { performCodeMapping } from "../src/query";
import fs from "fs";
import path from "path";
import {
  importRxnormSnomedMapping,
  Coding,
  Stage,
  rxnormSnomedMapping,
  stageSnomedMapping,
  importStageSnomedMapping,
} from "../src/breastcancertrials";

describe("Code Mapping Tests.", () => {
  // Setup
  let testPatientBundle: fhir.Bundle;
  beforeAll(() => {
    importRxnormSnomedMapping().catch(
      () => "Loaded RxNorm-SNOMED Mapping for Tests."
    );
    importStageSnomedMapping().catch(
      () => "Loaded Staging SNOMED Mapping for Tests."
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
    });
  });

  it("Test Coding Mappings.", function () {
    // Map the RxNorm-SNOMED codes in the patient bundle.
    performCodeMapping(
      testPatientBundle,
      "MedicationStatement",
      rxnormSnomedMapping
    );
    // Map the Staging SNOMED codes in the patient bundle.
    performCodeMapping(testPatientBundle, "Condition", stageSnomedMapping);

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
  });
});
