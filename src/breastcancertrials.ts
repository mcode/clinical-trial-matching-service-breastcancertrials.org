export const phaseCodeMap = new Map<string, string>([ // this is guesswork
     ['NA', 'n-a'],
     ['0', 'early-phase-1'],
     ['I', 'phase-1'],
     ['I-II', 'phase-1-phase-2'],
     ['II', 'phase-2'],
     ['II-III', 'phase-2-phase-3'],
     ['III', 'phase-3'],
     ['III-IV', 'phase-3'],
     ['IV', 'phase-4']
   ]);

export const phaseDisplayMap = new Map<string, string>([ // Also guesswork
     ['NA', 'N/A'],
     ['0', 'Early Phase 1'],
     ['I', 'Phase 1'],
     ['I-II', 'Phase 1/Phase 2'],
     ['II', 'Phase 2'],
     ['II-III', 'Phase 2/Phase 3'],
     ['III', 'Phase 3'],
     ['III-IV', 'Phase 3'],
     ['IV', 'Phase 4']
   ]);
  
   export const rxNormSnomedMapping = new Map<string, string>([
    ["RXNORM", "SNONMED"],
    ["486610", "426653008"],
    ["3639", "372817009"],
    ["4492", "387172005"],
    ["3002", "387420009"],
    ["214525", "428681007"],
    ["3995", "417916005"],
    ["12574", "386920008"],
    ["51499", "372538008"],
    ["6851", "387381009"],
    ["39541", "372541004"],
    ["7005", "386913001"],
    ["40048", "386905002"],
    ["2555", "387318005"],
    ["56946", "387374002"],
    ["72962", "386918005"],
    ["37776", "387009002"],
    ["10473", "387508004"],
    ["57308", "372536007"],
    ["11202", "387126006"],
    ["11198", "387051009"],
    ["194000", "386906001"],
    ["337523", "428282007"],
    ["1045452", "448800004"],
    ["3109", "372715008"],
    ["632", "387331000"],
    ["224905", "387003001"],
    ["480167", "425820005"],
    ["1298944", "704226002"],
    ["141704", "428698007"],
    ["1371041", "702836004"],
    ["253337", "409406007"],
    ["1940643", "736632003"],
    ["1547545", "716125002"],
    ["1601374", "715958001"],
    ["1873916", "732257004"],
    ["1946825", "761851004"],
    ["1597582", "432162002"],
    ["2099704", "782199007"],
    ["1792776", "719371003"],
    ["2169285", "788050002"],
    ["72143", "109029006"],
    ["38409", "387588002"],
    ["282357", "385519002"],
    ["10324", "373345002"],
    ["84857", "386910003"],
    ["258494", "387017005"],
    ["72965", "386911004"],
    ["42375", "397198002"],
    ["301739", "407128008"],
    ["1825", "395744006"],
    ["50610", "108771008"],
    ["29451", "126092000"],
    ["73056", "387582001"],
    ["11473", "96288007"],
    ["115264", "96287002"],
    ["46041", "96290008"],
    ["993449", "446321003"],
    ["77655", "395926009"],
    ["198240", "TEST-REMOVE-THIS"]
  ]);

export interface TrialResponse {
    resultNumber: string;
    trialId: string;
    trialTitle: string;
    scientificTitle: string;
    phaseNumber: string;
    purpose: string;
    whoIsThisFor: string;
    whatIsInvolved: string;
    whatIsBeingStudied: string;
    learnMore: string;
    ctGovLink: string;
    eligibilityCriteriaLink: string;
    trialCategories: string[];
    trialMutations: string[];
    newTrialFlag: boolean;
    zip: string;
    distance: string;
    siteName: string;
    city: string;
    state: string;
    visits: string;
    latitude: number;
    longitude: number;
    contactName: string;
    contactPhone: string;
    contactEmail: string | null;
    noVisitsRequiredFlag: boolean;
    numberOfSites: string;
}

export interface MedicationCodeableConcept {
  coding?: {
    system?: string;
    code?: string;
    display?: string;
  }[];
  text: string;
}