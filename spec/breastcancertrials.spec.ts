import { importCodeMappingFile } from "../src/breastcancertrials";
import mockfs from "mock-fs";

describe("importCodeMappingFile()", () => {
  beforeEach(() => {
    mockfs({
      "data/rxnorm-snomed-mapping.csv": "rxnorm,snomed\n583218,426653008",
      "data/stage-snomed-mapping.csv":
        "qualifiervaluesnomed,clinicalfindingsnomed\n258215001,13104003\n",
      "data/invalid.csv": "foo,bar\n1,2\n",
      "data/invalid.txt": "Not a CSV file, but almost could be\nBut isn't",
    });
  });
  afterEach(() => {
    mockfs.restore();
  });

  it("loads the expected mappings", async () => {
    const mappings = new Map<string, string>();
    await importCodeMappingFile("data/rxnorm-snomed-mapping.csv", mappings);
    expect(Array.from(mappings.entries())).toEqual([["583218", "426653008"]]);
    await importCodeMappingFile("data/stage-snomed-mapping.csv", mappings);
    // Make sure it added them - entries returns in insertion order so this should work
    expect(Array.from(mappings.entries())).toEqual([
      ["583218", "426653008"],
      ["258215001", "13104003"],
    ]);
  });
  it("handles attempting to read a file with unknown mappings", () => {
    return expectAsync(
      importCodeMappingFile("data/invalid.csv", new Map<string, string>())
    ).toBeRejected();
  });
  it("handles attempting to read a file that is not CSV", () => {
    return expectAsync(
      importCodeMappingFile("data/invalid.txt", new Map<string, string>())
    ).toBeRejected();
  });
  it("handles attempting to read a file that doesn't exist", () => {
    return expectAsync(
      importCodeMappingFile("data/not_found.csv", new Map<string, string>())
    ).toBeRejected();
  });
});
