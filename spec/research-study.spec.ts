import { convertToResearchStudy } from "../src/research-study";
import { createEmptyClinicalStudy, createExampleTrialResponse } from "./support/factory";

describe("convertToResearchStudy()", () => {
  it("handles receiving an empty clinical study", () => {
    convertToResearchStudy(createExampleTrialResponse(), createEmptyClinicalStudy());
    // Success in this case is not raising an exception
  });

  it("handles receiving an empty response", () => {
    // Trial ID is the only field it absolutely requires
    convertToResearchStudy(
      {
        trialId: "NCT12345678"
      },
      createEmptyClinicalStudy()
    );
  });

  it("maps as expected", () => {
    const trialResponse = createExampleTrialResponse();
    const clinicalStudy = createEmptyClinicalStudy();
    clinicalStudy.brief_summary = [{ textblock: ["Brief Summary"] }];
    const researchStudy = convertToResearchStudy(trialResponse, clinicalStudy);
    expect(researchStudy.title).toEqual("Title");
    expect(researchStudy.identifier).toEqual([
      {
        use: "official",
        system: "http://clinicaltrials.gov",
        value: trialResponse.trialId
      }
    ]);
    expect(researchStudy.phase).toEqual({
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/research-study-phase",
          code: "phase-1-phase-2",
          display: "Phase 1/Phase 2"
        }
      ],
      text: "Phase 1/Phase 2"
    });
    expect(researchStudy.keyword).toEqual([{ text: "METASTATIC" }, { text: "TREATMENT_BIOLOGICAL" }]);
    expect(researchStudy.contact).toEqual([
      {
        name: "Contact",
        telecom: [
          {
            system: "phone",
            value: "781-555-0100",
            use: "work"
          }
        ]
      }
    ]);
    expect(researchStudy.location).toEqual([{ text: "United States" }]);
    expect(researchStudy.description).toEqual("Purpose: Purpose.\n\n Targets: Who is this for?\n\nBrief Summary");
    expect(researchStudy.objective).toEqual([{ name: "Purpose." }]);
    if (researchStudy.sponsor) {
      expect(researchStudy.sponsor.reference).toBeDefined();
      const id = researchStudy.sponsor.reference.substring(1);
      expect(researchStudy.sponsor).toEqual({
        reference: "#" + id,
        type: "Organization"
      });
      expect(researchStudy.contained).toEqual([
        {
          resourceType: "Organization",
          id: id,
          name: "Example"
        }
      ]);
    } else {
      fail("Missing sponsor.");
    }
  });
});
