// Simple tick simulation (v1).
// - 1 tick = 1 minute (TICK_SECONDS).
// - Research: 1 researcher = 1 point/tick into the active tech.
// - Construction: 1 infrastructure worker = 1 labor/tick into the active building.
// - Food: allocated citizens eat 1 per meal, free citizens eat 0.5. The meal
//   interval is a Politics policy (1h-12h, default 8h). All food production
//   adds to one "food" stockpile. Starvation kills the unfed.
// - Growth: +1 citizen every 60 ticks when food is in surplus, up to housing limit.
// - Resources: 1 worker in Production = 1 labor applied to EVERY ACTIVE owned
//   resource building (e.g. 1 labor feeds 1 active farm AND 1 active mine at once).
//   Buildings are inactive until the player picks an output in Production.
// Later: tech boosts will modify points/labor/food-need.

import {
  ALLOCATION_CATEGORIES,
  DEFAULT_MEAL_INTERVAL_HOURS,
  MAX_MEAL_INTERVAL_HOURS,
  MIN_MEAL_INTERVAL_HOURS,
  populationLimit,
  type Civilization,
} from "./civilization";
import {
  buildingGroup,
  buildingNextCost,
  ownedBuildingCount,
} from "./infrastructure";
import { TECHNOLOGIES } from "./technologies";
import { DEFAULT_LANGUAGE, formatDuration, type Language } from "../i18n";

export const TICK_SECONDS = 60;

/** 1 tick = 1 minute. Format a tick count as localized real time (min/h/d). */
export function formatTicks(ticks: number, lang: Language = DEFAULT_LANGUAGE): string {
  return formatDuration(ticks, lang);
}

/** 1 researcher contributes this many points per tick. */
export const RESEARCH_POINTS_PER_RESEARCHER_PER_TICK = 1;

/** Citizens each eat FOOD_PER_CITIZEN per meal (meal timing is a policy).
 * Allocated citizens eat full rate, free citizens eat FREE_FOOD_RATE. */
export const FOOD_PER_CITIZEN = 1;
export const FREE_FOOD_RATE = 0.5;

/** Public mood baseline and how much each hour of meal delay shifts it. */
export const HAPPINESS_BASELINE = 50;
export const HAPPINESS_PER_MEAL_HOUR = 6;

/** The single stockpile key all food production counts towards. */
export const FOOD_RESOURCE = "food";

/** +1 population every GROWTH_INTERVAL_TICKS when food is in surplus. */
export const GROWTH_INTERVAL_TICKS = 60;

/**
 * One production recipe a building can run. Every food recipe writes to the
 * same stockpile key (FOOD_RESOURCE); the recipe only changes the rate.
 */
export interface ProductionOption {
  /** Stable id stored in production.assignments[buildingKey] (e.g. "lentils"). */
  id: string;
  /** Recipe name shown in the Production view (e.g. "Lentils"). */
  label: string;
  /** Key in resources.stockpile that this option fills. */
  resource: string;
  /** Amount produced per `everyTicks` per labor point per building. */
  amount: number;
  everyTicks: number;
}

/**
 * What each resource building can be set to produce in the Production view.
 * Food buildings offer recipes with different yields (all into "food");
 * the mine chooses between coal and stone.
 *
 * Production only runs when the player picks an option for the building in
 * the Production view. No selection = inactive (produces nothing).
 */
export const BUILDING_PRODUCTION_OPTIONS: Record<string, ProductionOption[]> = {
  farm: [
    { id: "lentils", label: "Lentils", resource: FOOD_RESOURCE, amount: 2, everyTicks: 60 },
    { id: "rice", label: "Rice", resource: FOOD_RESOURCE, amount: 3, everyTicks: 60 },
    { id: "cattle", label: "Cattle", resource: FOOD_RESOURCE, amount: 4, everyTicks: 60 },
  ],
  pasture: [
    { id: "cattle", label: "Cattle", resource: FOOD_RESOURCE, amount: 4, everyTicks: 60 },
  ],
  fishery: [
    { id: "fish", label: "Fish", resource: FOOD_RESOURCE, amount: 3, everyTicks: 60 },
  ],
  huntingCamp: [
    { id: "game", label: "Game", resource: FOOD_RESOURCE, amount: 2, everyTicks: 60 },
  ],
  mine: [
    { id: "coal", label: "Coal", resource: "coal", amount: 1, everyTicks: 240 },
    { id: "stone", label: "Stone", resource: "stone", amount: 1, everyTicks: 60 },
  ],
  quarry: [{ id: "stone", label: "Stone", resource: "stone", amount: 2, everyTicks: 60 }],
  lumberCamp: [{ id: "wood", label: "Wood", resource: "wood", amount: 2, everyTicks: 60 }],
};

/** Production options for a building key, or empty when it produces nothing. */
export function productionOptionsFor(key: string): ProductionOption[] {
  return BUILDING_PRODUCTION_OPTIONS[key] ?? [];
}

/** Selected production option id for a building key, or null when inactive/unset. */
export function productionAssignment(civ: Civilization, key: string): string | null {
  return civ.production.assignments[key] ?? null;
}

function allocationIndex(name: string): number {
  return ALLOCATION_CATEGORIES.indexOf(name as (typeof ALLOCATION_CATEGORIES)[number]);
}

/** Clamp an allocation array so its sum fits within population. Trims from the end. */
export function clampAllocation(allocation: number[], population: number): number[] {
  const next = [...allocation];
  let total = next.reduce((s, v) => s + v, 0);
  for (let i = next.length - 1; i >= 0 && total > population; i--) {
    while (next[i] > 0 && total > population) {
      next[i] -= 1;
      total -= 1;
    }
  }
  return next;
}

/** Ticks in one real-time hour (1 tick = 1 minute). */
export const TICKS_PER_HOUR = 3600 / TICK_SECONDS;

/** Research points earned per tick from the current allocation. */
export function researchPerTick(civ: Civilization): number {
  const researchers = civ.overview.allocation[allocationIndex("Research")] ?? 0;
  return researchers * RESEARCH_POINTS_PER_RESEARCHER_PER_TICK;
}

/** Labor points per tick from the current allocation. */
export function laborPerTick(civ: Civilization): number {
  return civ.overview.allocation[allocationIndex("Production")] ?? 0;
}

/** Construction labor per tick from citizens allocated to Infrastructure. */
export function infraLaborPerTick(civ: Civilization): number {
  return civ.overview.allocation[allocationIndex("Infrastructure")] ?? 0;
}

/** Food needed at the next meal: allocated eat full, free eat half (floored). */
export function mealNeed(civ: Civilization): number {
  const allocated = civ.overview.allocation.reduce((s, v) => s + v, 0);
  const free = Math.max(0, civ.overview.population - allocated);
  return allocated * FOOD_PER_CITIZEN + Math.floor(free * FREE_FOOD_RATE);
}

/**
 * Resource gains per tick from owned buildings that are currently assigned an
 * option in Production. Mirrors the production step of advanceTick exactly.
 */
export function productionPerTick(civ: Civilization): Record<string, number> {
  const gains: Record<string, number> = {};
  const labor = laborPerTick(civ);
  if (labor <= 0) return gains;
  const assignments = civ.production.assignments ?? {};
  for (const group of Object.values(civ.infrastructure)) {
    for (const [key, building] of Object.entries(group)) {
      if (building.count <= 0) continue;
      const selected = assignments[key];
      if (!selected) continue;
      const options = BUILDING_PRODUCTION_OPTIONS[key];
      if (!options) continue;
      const option = options.find((o) => o.id === selected);
      if (!option) continue;
      const gain = (labor * building.count * option.amount) / option.everyTicks;
      gains[option.resource] = (gains[option.resource] ?? 0) + gain;
    }
  }
  return gains;
}

/** Clamp a requested meal interval to the policy slider range (whole hours). */
export function clampMealIntervalHours(hours: number): number {
  return Math.max(
    MIN_MEAL_INTERVAL_HOURS,
    Math.min(MAX_MEAL_INTERVAL_HOURS, Math.round(hours))
  );
}

/** Ticks between meals under the current Politics policy. */
export function mealIntervalTicks(civ: Civilization): number {
  return clampMealIntervalHours(civ.politics.mealIntervalHours) * TICKS_PER_HOUR;
}

/**
 * Public mood current policies push citizens toward. 8h (the default) is
 * neutral; shorter intervals make people happier, longer intervals angrier.
 */
export function happinessTarget(civ: Civilization): number {
  const hours = clampMealIntervalHours(civ.politics.mealIntervalHours);
  const raw = HAPPINESS_BASELINE + (DEFAULT_MEAL_INTERVAL_HOURS - hours) * HAPPINESS_PER_MEAL_HOUR;
  return Math.max(0, Math.min(100, raw));
}

/** Food eaten per tick, averaged across the current meal cycle. */
export function foodConsumptionPerTick(civ: Civilization): number {
  return mealNeed(civ) / mealIntervalTicks(civ);
}

export interface ResourceRate {
  /** Units produced per hour by active buildings. */
  production: number;
  /** Units consumed per hour (food only, for now). */
  consumption: number;
  /** production - consumption, per hour. */
  net: number;
}

/**
 * Net change per hour for every resource the simulation touches, including
 * food demand even when the stockpile is empty (so deficits stay visible).
 * Rates are derived from the same helpers advanceTick uses, so the Resources
 * view can show what the stockpile is about to do without duplicating math.
 */
export function resourceRatesPerHour(civ: Civilization): Record<string, ResourceRate> {
  const production = productionPerTick(civ);
  const consumption: Record<string, number> = { [FOOD_RESOURCE]: foodConsumptionPerTick(civ) };
  const rates: Record<string, ResourceRate> = {};
  for (const key of new Set([...Object.keys(production), ...Object.keys(consumption)])) {
    const produced = (production[key] ?? 0) * TICKS_PER_HOUR;
    const consumed = (consumption[key] ?? 0) * TICKS_PER_HOUR;
    rates[key] = { production: produced, consumption: consumed, net: produced - consumed };
  }
  return rates;
}

/** Estimated ticks to finish the active construction, or null if stalled/none. */
export function ticksToCompleteBuild(civ: Civilization): number | null {
  const key = civ.construction.activeKey;
  if (!key) return null;
  return ticksToCompleteBuildFor(civ, key);
}

/** Estimated ticks to build a given building key with current workers. Null if stalled/unknown. */
export function ticksToCompleteBuildFor(civ: Civilization, key: string): number | null {
  const cost = buildingNextCost(key, ownedBuildingCount(civ.infrastructure, key));
  if (cost === null) return null;
  const perTick = infraLaborPerTick(civ);
  if (perTick <= 0) return null;
  const done = civ.construction.activeKey === key ? civ.construction.progress : 0;
  return Math.max(0, Math.ceil((cost - done) / perTick));
}

/** Estimated ticks to finish the active research, or null if stalled/no active. */
export function ticksToCompleteResearch(civ: Civilization): number | null {
  const activeId = civ.research.activeId;
  if (!activeId) return null;
  return ticksToCompleteTech(civ, activeId);
}

/** Estimated ticks to research a given tech with current researchers. Null if stalled/unknown. */
export function ticksToCompleteTech(civ: Civilization, id: string): number | null {
  const tech = TECHNOLOGIES[id];
  if (!tech) return null;
  if (civ.research.completed.includes(id)) return null;
  const perTick = researchPerTick(civ);
  if (perTick <= 0) return null;
  const done = civ.research.progress[id] ?? 0;
  return Math.max(0, Math.ceil((tech.cost - done) / perTick));
}

/** Saved progress for a tech (0 if never started). */
export function researchProgress(civ: Civilization, id: string): number {
  return civ.research.progress[id] ?? 0;
}

/** Advance the civilization by exactly one tick (pure, immutable). */
export function advanceTick(prev: Civilization): Civilization {
  const tick = prev.tick + 1;
  const researchers = prev.overview.allocation[allocationIndex("Research")] ?? 0;

  // --- Research (progress saved per tech, survives cancel/switch) ---
  let researchActiveId = prev.research.activeId;
  let researchCompleted = prev.research.completed;
  let researchProgressMap = prev.research.progress;
  let researchQueue = [...(prev.research.queue ?? [])];
  if (researchActiveId && researchers > 0) {
    const tech = TECHNOLOGIES[researchActiveId];
    if (tech && !researchCompleted.includes(researchActiveId)) {
      const done = (researchProgressMap[researchActiveId] ?? 0) + researchers * RESEARCH_POINTS_PER_RESEARCHER_PER_TICK;
      if (done >= tech.cost) {
        const completedId = researchActiveId;
        researchCompleted = [...researchCompleted, completedId];
        researchActiveId = null;
        const { [completedId]: _discard, ...rest } = researchProgressMap;
        researchProgressMap = rest;
      } else {
        researchProgressMap = { ...researchProgressMap, [researchActiveId]: done };
      }
    }
  }
  // Start the next queued tech as soon as the previous one finishes. Invalid
  // or already-completed entries are skipped so a stale queue can't stall.
  if (!researchActiveId && researchQueue.length > 0) {
    const pending = [...researchQueue];
    while (pending.length > 0) {
      const next = pending.shift() as string;
      if (TECHNOLOGIES[next] && !researchCompleted.includes(next)) {
        researchActiveId = next;
        break;
      }
    }
    researchQueue = pending;
  }

  // --- Resource production: each labor point feeds every ACTIVE owned building ---
  // A building only produces when the player picked an output for it in
  // Production (production.assignments[key]). Unset/null = inactive.
  const stockpile: Record<string, number> = { ...prev.resources.stockpile };
  for (const [resource, gain] of Object.entries(productionPerTick(prev))) {
    stockpile[resource] = (stockpile[resource] ?? 0) + gain;
  }

  // --- Construction: infrastructure labor builds the active building ---
  let infrastructure = prev.infrastructure;
  let construction = { ...prev.construction, queue: [...(prev.construction.queue ?? [])] };
  const infraLabor = prev.overview.allocation[allocationIndex("Infrastructure")] ?? 0;
  if (construction.activeKey && infraLabor > 0) {
    const cost = buildingNextCost(
      construction.activeKey,
      ownedBuildingCount(prev.infrastructure, construction.activeKey)
    );
    if (cost !== null) {
      const progress = construction.progress + infraLabor;
      if (progress >= cost) {
        const group = buildingGroup(construction.activeKey);
        if (group && infrastructure[group]?.[construction.activeKey]) {
          infrastructure = {
            ...infrastructure,
            [group]: {
              ...infrastructure[group],
              [construction.activeKey]: {
                ...infrastructure[group][construction.activeKey],
                count: infrastructure[group][construction.activeKey].count + 1,
              },
            },
          };
        }
        construction = { activeKey: null, progress: 0, queue: construction.queue };
      } else {
        construction = { ...construction, progress };
      }
    }
  }
  // Start the next queued building as soon as the current one finishes.
  if (!construction.activeKey && construction.queue.length > 0) {
    const [next, ...rest] = construction.queue;
    construction = { activeKey: next, progress: 0, queue: rest };
  }

  // --- Food consumption at the interval set by the Politics meal policy ---
  // Allocated citizens eat full rate, free citizens eat half. All food types
  // share one stockpile, so a meal simply drains FOOD_RESOURCE.
  const mealTicks = mealIntervalTicks(prev);
  let population = prev.overview.population;
  let allocation = prev.overview.allocation;
  let starvedThisTick = false;
  if (tick % mealTicks === 0) {
    const need = mealNeed(prev);
    const have = stockpile[FOOD_RESOURCE] ?? 0;
    if (have >= need) {
      stockpile[FOOD_RESOURCE] = have - need;
    } else {
      // Unfed meals become deaths (one death per missing meal).
      const deaths = Math.min(population, Math.ceil(need - have));
      population = Math.max(0, population - deaths);
      stockpile[FOOD_RESOURCE] = 0;
      starvedThisTick = true;
      allocation = clampAllocation(allocation, population);
    }
  }

  // --- Growth every 60 ticks when food is in surplus (never while starving) ---
  if (!starvedThisTick && tick % GROWTH_INTERVAL_TICKS === 0) {
    const limit = populationLimit({ ...prev, overview: { ...prev.overview, population } } as Civilization);
    if (population < limit && (stockpile[FOOD_RESOURCE] ?? 0) > 0) {
      population += 1;
      // New citizen starts unemployed: allocation unchanged, free grows.
    }
  }

  // --- Public mood drifts 1 point/tick toward what the meal policy implies ---
  const moodTarget = happinessTarget(prev);
  const happinessStep = Math.min(1, Math.abs(moodTarget - prev.politics.happiness));
  const politics = {
    ...prev.politics,
    happiness:
      prev.politics.happiness + Math.sign(moodTarget - prev.politics.happiness) * happinessStep,
  };

  return {
    ...prev,
    tick,
    overview: { population, allocation },
    resources: { stockpile },
    research: { activeId: researchActiveId, queue: researchQueue, completed: researchCompleted, progress: researchProgressMap },
    infrastructure,
    construction,
    politics,
  };
}
