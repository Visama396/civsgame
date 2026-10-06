// Per-view game state: one object per main-menu view, so everything a view
// reads lives in one place. Population allocation lives in overview.

export const ALLOCATION_CATEGORIES = [
  "Resources",
  "Industry",
  "Economy",
  "Research",
  "Infrastructure",
  "Military",
  "Politics",
  "Intelligence",
] as const;

export type AllocationCategory = (typeof ALLOCATION_CATEGORIES)[number];

export interface Building {
  name: string;
  count: number;
  capacityEach?: number;
}

export interface OverviewState {
  population: number;
  /** Population allocated per ALLOCATION_CATEGORIES entry, in order. */
  allocation: number[];
}

export interface ResourcesState {
  stockpile: Record<string, number>;
}

export interface IndustryState {
  output: Record<string, number>;
}

export interface EconomyState {
  treasury: number;
  taxRate: number;
}

export interface ResearchState {
  points: number;
  /** One active research at a time for now; parallel slots come later. */
  activeId: string | null;
  completed: string[];
}

export interface MilitaryState {
  units: Record<string, number>;
}

export interface PoliticsState {
  legitimacy: number;
}

export interface IntelligenceState {
  /** Names of discovered player civilizations (fog of war). */
  discovered: string[];
}

export interface Civilization {
  leader: string;
  /** First settlement. Evolves tribe -> village -> town -> city; more cities later. */
  tribe: string;
  name: string;
  era: string;
  overview: OverviewState;
  resources: ResourcesState;
  industry: IndustryState;
  economy: EconomyState;
  research: ResearchState;
  infrastructure: Record<string, Record<string, Building>>;
  military: MilitaryState;
  politics: PoliticsState;
  intelligence: IntelligenceState;
}

const START_POPULATION = 10;

const START_INFRASTRUCTURE: Record<string, Record<string, Building>> = {
  housing: {
    hut: { name: "Hut", count: 3, capacityEach: 4 },
    longhouse: { name: "Longhouse", count: 0, capacityEach: 10 },
    house: { name: "House", count: 0, capacityEach: 6 },
    apartment: { name: "Apartment", count: 0, capacityEach: 20 },
  },
  transport: {
    road: { name: "Road", count: 0 },
    bridge: { name: "Bridge", count: 0 },
    port: { name: "Port", count: 0 },
    harbor: { name: "Harbor", count: 0 },
    railway: { name: "Railway", count: 0 },
    airport: { name: "Airport", count: 0 },
  },
  production: {
    farm: { name: "Farm", count: 0 },
    pasture: { name: "Pasture", count: 0 },
    fishery: { name: "Fishery", count: 0 },
    huntingCamp: { name: "Hunting Camp", count: 0 },
    mine: { name: "Mine", count: 0 },
    quarry: { name: "Quarry", count: 0 },
    lumberCamp: { name: "Lumber Camp", count: 0 },
    workshop: { name: "Workshop", count: 0 },
    market: { name: "Market", count: 0 },
    factory: { name: "Factory", count: 0 },
    automatedPlant: { name: "Automated Plant", count: 0 },
  },
  social: {
    school: { name: "School", count: 0 },
    library: { name: "Library", count: 0 },
    temple: { name: "Temple", count: 0 },
    hospital: { name: "Hospital", count: 0 },
    townHall: { name: "Town Hall", count: 0 },
    university: { name: "University", count: 0 },
    observatory: { name: "Observatory", count: 0 },
  },
  utilities: {
    well: { name: "Well", count: 0 },
    granary: { name: "Granary", count: 0 },
    aqueduct: { name: "Aqueduct", count: 0 },
    sewer: { name: "Sewer", count: 0 },
    powerGrid: { name: "Power Grid", count: 0 },
    dataCenter: { name: "Data Center", count: 0 },
  },
  energy: {
    nuclearPlant: { name: "Nuclear Plant", count: 0 },
    fusionPlant: { name: "Fusion Plant", count: 0 },
  },
  space: {
    launchPad: { name: "Launch Pad", count: 0 },
    spaceport: { name: "Spaceport", count: 0 },
  },
};

function evenSpread(total: number, parts: number): number[] {
  const base = Math.floor(total / parts);
  const remainder = total % parts;
  return Array.from({ length: parts }, (_, i) => base + (i < remainder ? 1 : 0));
}

export function createCivilization(args: {
  leader: string;
  tribe: string;
  name: string;
}): Civilization {
  return {
    leader: args.leader,
    tribe: args.tribe,
    name: args.name,
    era: "Tribal",
    overview: {
      population: START_POPULATION,
      allocation: evenSpread(START_POPULATION, ALLOCATION_CATEGORIES.length),
    },
    resources: { stockpile: { food: 0, wood: 0, stone: 0 } },
    industry: { output: {} },
    economy: { treasury: 0, taxRate: 10 },
    research: { points: 0, activeId: null, completed: [] },
    infrastructure: structuredClone(START_INFRASTRUCTURE),
    military: { units: {} },
    politics: { legitimacy: 50 },
    intelligence: { discovered: [] },
  };
}

/** Housing capacity from owned housing buildings. */
export function populationLimit(civ: Civilization): number {
  return Object.values(civ.infrastructure.housing ?? {}).reduce(
    (sum, b) => sum + b.count * (b.capacityEach ?? 0),
    0
  );
}
