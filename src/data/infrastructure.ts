// Infrastructure template. Separate concept from technologies:
// - infrastructure.ts: what the player owns (building counts, housing capacity).
// - technologies.ts: what the player can research and which buildings each tech unlocks.

import { TECHNOLOGIES } from "./technologies";

export interface Building {
  name: string;
  count: number;
  capacityEach?: number;
}

export type InfrastructureMap = Record<string, Record<string, Building>>;

export const START_INFRASTRUCTURE: InfrastructureMap = {
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

/** The only building known without research. */
export const BASE_BUILDABLE_KEYS = ["hut"] as const;

/** Hut labor cost; other buildings cost the tech that unlocks them. */
export const HUT_LABOR_COST = 10;

/** Labor cost to build one unit. Null = no known tech unlocks it (unbuildable for now). */
export function buildingLaborCost(key: string): number | null {
  if (key === "hut") return HUT_LABOR_COST;
  let cheapest: number | null = null;
  for (const tech of Object.values(TECHNOLOGIES)) {
    if (tech.unlocksBuildings.includes(key)) {
      cheapest = cheapest === null ? tech.cost : Math.min(cheapest, tech.cost);
    }
  }
  return cheapest;
}

/** Owned count of a building key in an infrastructure map. */
export function ownedBuildingCount(infra: InfrastructureMap, key: string): number {
  for (const buildings of Object.values(infra)) {
    if (key in buildings) return buildings[key].count;
  }
  return 0;
}

/**
 * Cost of the NEXT unit: base x (owned + 1).
 * 1st farm (base 20, owned 0) = 20, 2nd = 40, 3rd = 60...
 */
export function buildingNextCost(key: string, owned: number): number | null {
  const base = buildingLaborCost(key);
  if (base === null) return null;
  return base * (owned + 1);
}

/** Building keys the player may build given completed tech ids (hut always). */
export function unlockedBuildingKeys(completed: string[]): string[] {
  const done = new Set(completed);
  const keys = new Set<string>(BASE_BUILDABLE_KEYS);
  for (const tech of Object.values(TECHNOLOGIES)) {
    if (done.has(tech.id)) {
      for (const key of tech.unlocksBuildings) keys.add(key);
    }
  }
  return [...keys].filter((key) => buildingLaborCost(key) !== null);
}

/** Find which group a building key lives in, or null. */
export function buildingGroup(key: string): string | null {
  for (const [group, buildings] of Object.entries(START_INFRASTRUCTURE)) {
    if (key in buildings) return group;
  }
  return null;
}

/** Display name for a building key. */
export function buildingName(key: string): string {
  for (const buildings of Object.values(START_INFRASTRUCTURE)) {
    if (key in buildings) return buildings[key].name;
  }
  return key;
}
