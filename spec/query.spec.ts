import { ClinicalTrialGovService, ClinicalTrialMatcher, fhir } from "clinical-trial-matching-service";
import { APIError, createClinicalTrialLookup, performCodeMapping, sendQuery, updateResearchStudy } from "../src/query";
import nock from "nock";
import { Coding } from "../src/breastcancertrials";
import { isResearchStudy } from "clinical-trial-matching-service/dist/fhir-types";
import { createExampleTrialResponse, createEmptyClinicalStudy, createEmptyBundle } from "./support/factory";

describe(".createClinicalTrialLookup", () => {
  it("raises an error if missing an endpoint", () => {
    const backupService = new ClinicalTrialGovService("temp");
    expect(() => {
      createClinicalTrialLookup({}, backupService);
    }).toThrowError("Missing API_ENDPOINT in configuration");
  });

  it("creates a function", () => {
    expect(
      typeof createClinicalTrialLookup({ api_endpoint: "http://www.example.com/" }, new ClinicalTrialGovService("temp"))
    ).toEqual("function");
  });

  describe("generated matcher function", () => {
    const endpoint = "http://www.example.com/endpoint";
    let matcher: ClinicalTrialMatcher;
    let backupService: ClinicalTrialGovService;
    let scope: nock.Scope;
    let interceptor: nock.Interceptor;
    beforeEach(() => {
      // Note: backupService is never initialized therefore it won't actually work
      backupService = new ClinicalTrialGovService("temp");
      // Don't actually download anything
      spyOn(backupService, "updateResearchStudies").and.callFake((studies) => {
        return Promise.resolve(studies);
      });
      matcher = createClinicalTrialLookup({ api_endpoint: endpoint }, backupService);
      scope = nock("http://www.example.com");
      interceptor = scope.post("/endpoint");
    });
    afterEach(() => {
      expect(scope.isDone()).toBeTrue();
    });

    it("runs queries", () => {
      // Reply with an empty array
      interceptor.reply(200, []);
      return expectAsync(
        matcher(createEmptyBundle()).then((result) => {
          expect(result.type).toEqual("searchset");
          // Rather than deal with casting just do this
          expect(result["total"]).toEqual(0);
          expect(scope.isDone()).toBeTrue();
        })
      ).toBeResolved();
    });

    it("fills in missing data", () => {
      interceptor.reply(200, [createExampleTrialResponse()]);
      return expectAsync(
        matcher(createEmptyBundle()).then((result) => {
          const study = result.entry[0].resource;
          if (isResearchStudy(study)) {
            expect(study.title).toEqual("Title");
          } else {
            fail("Expected research study");
          }
        })
      ).toBeResolved();
    });
  });
});

describe(".performCodeMapping", () => {
  let mappings: Map<string, string>;
  beforeEach(() => {
    // Rather than load the "real" mappings just do some fake ones for the test
    mappings = new Map<string, string>([
      ["AAA", "111"],
      ["BBB", "222"]
    ]);
  });

  it("ignores invalid entries", () => {
    const bundle: fhir.Bundle = {
      resourceType: "Bundle",
      type: "collection",
      entry: []
    };
    // This involves lying to TypeScript as it ensures we only add valid objects
    bundle.entry.push(({ foo: "bar" } as unknown) as fhir.BundleEntry);
    performCodeMapping(bundle, "MedicationStatement", mappings);
    // This test succeeds if it doesn't blow up
  });

  it("maps properly", () => {
    const bundle: fhir.Bundle = createEmptyBundle();
    bundle.entry.push({
      resource: {
        resourceType: "MedicationStatement",
        code: {
          coding: [
            {
              system: "",
              code: "AAA"
            }
          ]
        }
      }
    });
    bundle.entry.push({
      resource: {
        resourceType: "Condition",
        code: {
          coding: []
        },
        stage: [
          {
            summary: {
              coding: [
                {
                  system: "unused",
                  code: "BBB"
                },
                {
                  system: "unused",
                  code: "CCC"
                }
              ]
            },
            type: {
              coding: [
                {
                  system: "unused",
                  code: "XXX"
                }
              ]
            }
          }
        ]
      }
    } as fhir.BundleEntry);
    const medicationCodableConcept: Coding = {
      coding: [
        {
          code: "AAA"
        }
      ],
      text: "Example"
    };
    bundle.entry[0].resource["medicationCodeableConcept"] = medicationCodableConcept;
    let result = performCodeMapping(bundle, "MedicationStatement", mappings);
    expect(result.entry.length).toEqual(2);
    let resource: fhir.Resource = result.entry[0].resource;
    expect(resource).toBeDefined();
    expect(resource.resourceType).toEqual("MedicationStatement");
    const concept = resource["medicationCodeableConcept"] as Coding;
    expect(concept).toBeDefined();
    expect(concept.text).toEqual("Example");
    expect(concept.coding).toEqual([{ system: "http://snomed.info/sct", code: "111" }]);
    resource = result.entry[1].resource;
    expect(resource).toBeDefined();
    // At present, the condition resource should be unchanged
    expect(resource["stage"]).toEqual([
      {
        summary: {
          coding: [
            {
              system: "unused",
              code: "BBB"
            },
            {
              system: "unused",
              code: "CCC"
            }
          ]
        },
        type: {
          coding: [
            {
              system: "unused",
              code: "XXX"
            }
          ]
        }
      }
    ]);
    // Repeat for conditions
    result = performCodeMapping(bundle, "Condition", mappings);
    resource = result.entry[1].resource;
    expect(resource.resourceType).toEqual("Condition");
    expect(resource["stage"]).toEqual([
      {
        summary: {
          coding: [
            {
              system: "http://snomed.info/sct",
              code: "222"
            },
            {
              system: "unused",
              code: "CCC"
            }
          ]
        },
        type: {
          coding: [
            {
              system: "unused",
              code: "XXX"
            }
          ]
        }
      }
    ]);
  });
});

describe("updateResearchStudy()", () => {
  it("does not update the description if none exists", () => {
    const researchStudy: fhir.ResearchStudy = { resourceType: "ResearchStudy" };
    updateResearchStudy(researchStudy, createEmptyClinicalStudy({ briefSummary: "ignore me" }));
    expect(researchStudy.description).not.toBeDefined();
  });

  it("does not update the description if there is no brief summary", () => {
    const researchStudy: fhir.ResearchStudy = { resourceType: "ResearchStudy", description: "Do not change this" };
    updateResearchStudy(researchStudy, createEmptyClinicalStudy());
    expect(researchStudy.description).toEqual("Do not change this");
  });
});

describe(".sendQuery", () => {
  let scope: nock.Scope;
  let interceptor: nock.Interceptor;
  const endpoint = "http://www.example.com/endpoint";
  beforeEach(() => {
    scope = nock("http://www.example.com");
    interceptor = scope.post("/endpoint");
  });
  afterEach(() => {
    expect(scope.isDone()).toBeTrue();
  });

  it("sets the content-type header", () => {
    interceptor.matchHeader("Content-type", "application/fhir+json").reply(200, []);
    return expectAsync(
      sendQuery(endpoint, "ignored").then(() => {
        expect(scope.isDone()).toBeTrue();
      })
    ).toBeResolved();
  });

  it("returns trial responses from the server", () => {
    const exampleTrial = createExampleTrialResponse();
    interceptor.reply(200, [exampleTrial]);
    return expectAsync(
      sendQuery(endpoint, "ignored").then((result) => {
        expect(result).toEqual([exampleTrial]);
      })
    ).toBeResolved();
  });

  it("rejects the Promise if the response isn't JSON", () => {
    interceptor.reply(200, "Not JSON");
    return expectAsync(sendQuery(endpoint, "ignored")).toBeRejectedWithError(APIError);
  });

  it("rejects the Promise if the response isn't the expected JSON", () => {
    interceptor.reply(200, "null");
    return expectAsync(sendQuery(endpoint, "ignored")).toBeRejectedWithError(APIError);
  });

  it("rejects the Promise if server returns an error response", () => {
    interceptor.reply(500, "This is an error.");
    return expectAsync(sendQuery(endpoint, "ignored")).toBeRejectedWithError(APIError);
  });

  it("rejects the Promise if the connection fails", () => {
    interceptor.replyWithError("Oops");
    return expectAsync(sendQuery(endpoint, "ignored")).toBeRejectedWithError("Oops");
  });
});
