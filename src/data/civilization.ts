// Per-view game state: one object per main-menu view, so everything a view
// reads lives in one place. Population allocation lives in overview.

import { START_INFRASTRUCTURE } from "./infrastructure";
import type { Building, InfrastructureMap } from "./infrastructure";

export type { Building, InfrastructureMap };

export const ALLOCATION_CATEGORIES = [
  "Production",
  "Economy",
  "Research",
  "Infrastructure",
  "Military",
  "Politics",
  "Intelligence",
] as const;

export type AllocationCategory = (typeof ALLOCATION_CATEGORIES)[number];

export interface OverviewState {
  population: number;
  /** Population allocated per ALLOCATION_CATEGORIES entry, in order. */
  allocation: number[];
}

export interface ResourcesState {
  stockpile: Record<string, number>;
}

export interface ProductionState {
  /**
   * What each owned building type is set to produce in the Production view.
   * Key = building key (e.g. "farm"), value = production option id
   * (e.g. "lentils", "cattle", "coal") or null/undefined = inactive.
   * Every food option fills the same "food" stockpile key.
   * Buildings are inactive by default until the player picks a production.
   */
  assignments: Record<string, string | null>;
}

export interface EconomyState {
  treasury: number;
  taxRate: number;
}

export interface ResearchState {
  /** One active research at a time for now; parallel slots come later. */
  activeId: string | null;
  /** Tech ids waiting to start after the active one, in order. */
  queue: string[];
  completed: string[];
  /** Saved progress per tech id (survives cancel/switch). */
  progress: Record<string, number>;
}

export interface MilitaryState {
  units: Record<string, number>;
}

export interface PoliticsState {
  legitimacy: number;
  /** Public mood, 0-100. Drifts toward what current policies make people feel. */
  happiness: number;
  /**
   * Hours between meals. Higher = citizens eat less often (less food used)
   * but they grow unhappy; lower = happier but more food consumed.
   * Slider range is MIN_MEAL_INTERVAL_HOURS..MAX_MEAL_INTERVAL_HOURS.
   */
  mealIntervalHours: number;
}

/** Meal-interval policy bounds, in hours. */
export const MIN_MEAL_INTERVAL_HOURS = 1;
export const MAX_MEAL_INTERVAL_HOURS = 12;
/** Interval citizens consider normal (neither happier nor angrier than baseline). */
export const DEFAULT_MEAL_INTERVAL_HOURS = 8;

export interface IntelligenceState {
  /** Names of discovered player civilizations (fog of war). */
  discovered: string[];
}

export interface ConstructionState {
  /** Building key being built (one at a time, like research). */
  activeKey: string | null;
  /** Labor points invested in the active building. */
  progress: number;
  /** Building keys waiting to start after the active one, in order. */
  queue: string[];
}

export interface Civilization {
  leader: string;
  /** First settlement. Evolves tribe -> village -> town -> city; more cities later. */
  tribe: string;
  name: string;
  era: string;
  /** Number of elapsed simulation ticks (1 tick = 1 minute). */
  tick: number;
  overview: OverviewState;
  resources: ResourcesState;
  production: ProductionState;
  economy: EconomyState;
  research: ResearchState;
  infrastructure: InfrastructureMap;
  construction: ConstructionState;
  military: MilitaryState;
  politics: PoliticsState;
  intelligence: IntelligenceState;
}

const START_POPULATION = 10;

export function createCivilization(args: {
  leader: string;
  tribe: string;
  name: string;
}): Civilization {
  return {
    leader: args.leader,
    tribe: args.tribe,
    name: args.name,
    era: "Ancient Age",
    tick: 0,
    overview: {
      population: START_POPULATION,
      // All free at the start: the player must move the sliders and decide.
      allocation: Array(ALLOCATION_CATEGORIES.length).fill(0),
    },
    resources: { stockpile: { food: 10, wood: 0, stone: 0, coal: 0 } },
    production: { assignments: {} },
    economy: { treasury: 0, taxRate: 10 },
    research: { activeId: null, queue: [], completed: [], progress: {} },
    infrastructure: structuredClone(START_INFRASTRUCTURE),
    construction: { activeKey: null, progress: 0, queue: [] },
    military: { units: {} },
    politics: {
      legitimacy: 50,
      happiness: 50,
      mealIntervalHours: DEFAULT_MEAL_INTERVAL_HOURS,
    },
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
