// Simple tick simulation (v1).
// - 1 tick = 1 minute (TICK_SECONDS).
// - Research: 1 researcher = 1 point/tick into the active tech.
// - Construction: 1 infrastructure worker = 1 labor/tick into the active building.
// - Food: allocated citizens eat 1 every 480 ticks, free citizens eat 0.5.
//   (meat=2, lentils=1). Starvation kills the unfed.
// - Growth: +1 citizen every 60 ticks when food is in surplus, up to housing limit.
// - Resources: 1 worker in Resources = 1 labor applied to EVERY owned
//   resource building (e.g. 1 labor feeds 1 farm AND 1 mine at once).
// Later: tech boosts will modify points/labor/food-need.

import {
  ALLOCATION_CATEGORIES,
  populationLimit,
  type Civilization,
} from "./civilization";
import {
  buildingGroup,
  buildingNextCost,
  ownedBuildingCount,
} from "./infrastructure";
import { TECHNOLOGIES } from "./technologies";

export const TICK_SECONDS = 60;

/** 1 tick = 1 minute. Format a tick count as real time (min/h/d). */
export function formatTicks(ticks: number): string {
  const t = Math.max(0, Math.ceil(ticks));
  if (t < 60) return `${t} min`;
  const h = Math.floor(t / 60);
  const m = t % 60;
  if (h < 24) return m === 0 ? `${h}h` : `${h}h ${m}m`;
  const d = Math.floor(h / 24);
  const rh = h % 24;
  return rh === 0 ? `${d}d` : `${d}d ${rh}h`;
}

/** 1 researcher contributes this many points per tick. */
export const RESEARCH_POINTS_PER_RESEARCHER_PER_TICK = 1;

/** Citizens each eat FOOD_PER_CITIZEN every FOOD_CONSUMPTION_INTERVAL_TICKS.
 * Allocated citizens eat full rate, free citizens eat FREE_FOOD_RATE. */
export const FOOD_CONSUMPTION_INTERVAL_TICKS = 480;
export const FOOD_PER_CITIZEN = 1;
export const FREE_FOOD_RATE = 0.5;

/**
 * Food values: how many citizens 1 unit feeds.
 * meat = 2, lentils = 1 (food kept as 1 for legacy stockpiles).
 */
export const FOOD_VALUES: Record<string, number> = {
  lentils: 1,
  food: 1,
  meat: 2,
};

/** Order foods are eaten when covering a meal (cheapest first, meat last). */
const EAT_ORDER = ["lentils", "food", "meat"] as const;

/** Total edible food value in a stockpile. */
export function foodValue(stockpile: Record<string, number>): number {
  return EAT_ORDER.reduce((sum, key) => sum + (stockpile[key] ?? 0) * (FOOD_VALUES[key] ?? 0), 0);
}

/** +1 population every GROWTH_INTERVAL_TICKS when food is in surplus. */
export const GROWTH_INTERVAL_TICKS = 60;

export interface BuildingYield {
  /** Key in resources.stockpile. */
  resource: string;
  /** Amount produced per `everyTicks` per labor point per building. */
  amount: number;
  everyTicks: number;
}

/**
 * Base yields. Farm + mine are the spec examples:
 * farm = 4 lentils/hour/labor, mine (coal) = 1 coal/4h/labor.
 * Meat comes from pasture/fishery/hunting; other workshops and
 * later industry produce nothing here until industry phase.
 */
export const BUILDING_YIELDS: Record<string, BuildingYield> = {
  farm: { resource: "lentils", amount: 4, everyTicks: 60 },
  pasture: { resource: "meat", amount: 2, everyTicks: 60 },
  fishery: { resource: "meat", amount: 3, everyTicks: 60 },
  huntingCamp: { resource: "meat", amount: 2, everyTicks: 60 },
  mine: { resource: "coal", amount: 1, everyTicks: 240 },
  quarry: { resource: "stone", amount: 2, everyTicks: 60 },
  lumberCamp: { resource: "wood", amount: 2, everyTicks: 60 },
};

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

/** Research points earned per tick from the current allocation. */
export function researchPerTick(civ: Civilization): number {
  const researchers = civ.overview.allocation[allocationIndex("Research")] ?? 0;
  return researchers * RESEARCH_POINTS_PER_RESEARCHER_PER_TICK;
}

/** Labor points per tick from the current allocation. */
export function laborPerTick(civ: Civilization): number {
  return civ.overview.allocation[allocationIndex("Resources")] ?? 0;
}

/** Construction labor per tick from citizens allocated to Infrastructure. */
export function infraLaborPerTick(civ: Civilization): number {
  return civ.overview.allocation[allocationIndex("Infrastructure")] ?? 0;
}

/** Food value needed at the next meal: allocated eat full, free eat half (floored). */
export function mealNeed(civ: Civilization): number {
  const allocated = civ.overview.allocation.reduce((s, v) => s + v, 0);
  const free = Math.max(0, civ.overview.population - allocated);
  return allocated * FOOD_PER_CITIZEN + Math.floor(free * FREE_FOOD_RATE);
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
  const labor = prev.overview.allocation[allocationIndex("Resources")] ?? 0;
  const researchers = prev.overview.allocation[allocationIndex("Research")] ?? 0;

  // --- Research (progress saved per tech, survives cancel/switch) ---
  let researchActiveId = prev.research.activeId;
  let researchCompleted = prev.research.completed;
  let researchProgressMap = prev.research.progress;
  if (researchActiveId && researchers > 0) {
    const tech = TECHNOLOGIES[researchActiveId];
    if (tech && !researchCompleted.includes(researchActiveId)) {
      const done = (researchProgressMap[researchActiveId] ?? 0) + researchers * RESEARCH_POINTS_PER_RESEARCHER_PER_TICK;
      if (done >= tech.cost) {
        researchCompleted = [...researchCompleted, researchActiveId];
        researchActiveId = null;
        const { [researchActiveId]: _discard, ...rest } = researchProgressMap;
        researchProgressMap = rest;
      } else {
        researchProgressMap = { ...researchProgressMap, [researchActiveId]: done };
      }
    }
  }

  // --- Resource production: each labor point feeds every owned building ---
  const stockpile: Record<string, number> = { ...prev.resources.stockpile };
  if (labor > 0) {
    for (const group of Object.values(prev.infrastructure)) {
      for (const [key, building] of Object.entries(group)) {
        if (building.count <= 0) continue;
        const yield_ = BUILDING_YIELDS[key];
        if (!yield_) continue;
        const gain = (labor * building.count * yield_.amount) / yield_.everyTicks;
        stockpile[yield_.resource] = (stockpile[yield_.resource] ?? 0) + gain;
      }
    }
  }

  // --- Construction: infrastructure labor builds the active building ---
  let infrastructure = prev.infrastructure;
  let construction = prev.construction;
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
        construction = { activeKey: null, progress: 0 };
      } else {
        construction = { ...construction, progress };
      }
    }
  }

  // --- Food consumption every 480 ticks (meat=2, lentils/food=1) ---
  // Allocated citizens eat full rate, free citizens eat half.
  let population = prev.overview.population;
  let allocation = prev.overview.allocation;
  let starvedThisTick = false;
  if (tick % FOOD_CONSUMPTION_INTERVAL_TICKS === 0) {
    const allocated = allocation.reduce((s, v) => s + v, 0);
    const free = Math.max(0, population - allocated);
    const need = allocated * FOOD_PER_CITIZEN + Math.floor(free * FREE_FOOD_RATE);
    const haveValue = foodValue(stockpile);
    if (haveValue >= need) {
      let remaining = need;
      for (const key of EAT_ORDER) {
        if (remaining <= 0) break;
        const value = FOOD_VALUES[key] ?? 0;
        if (value <= 0) continue;
        const availableValue = (stockpile[key] ?? 0) * value;
        if (availableValue >= remaining) {
          stockpile[key] = (stockpile[key] ?? 0) - remaining / value;
          remaining = 0;
        } else {
          remaining -= availableValue;
          stockpile[key] = 0;
        }
      }
    } else {
      // Unfed food value = deaths (each death counts as 1 not-eaten meal).
      const deaths = Math.min(population, Math.ceil(need - haveValue));
      population = Math.max(0, population - deaths);
      for (const key of EAT_ORDER) stockpile[key] = 0;
      starvedThisTick = true;
      allocation = clampAllocation(allocation, population);
    }
  }

  // --- Growth every 60 ticks when food is in surplus (never while starving) ---
  if (!starvedThisTick && tick % GROWTH_INTERVAL_TICKS === 0) {
    const limit = populationLimit({ ...prev, overview: { ...prev.overview, population } } as Civilization);
    if (population < limit && foodValue(stockpile) > 0) {
      population += 1;
      // New citizen starts unemployed: allocation unchanged, free grows.
    }
  }

  return {
    ...prev,
    tick,
    overview: { population, allocation },
    resources: { stockpile },
    research: { activeId: researchActiveId, completed: researchCompleted, progress: researchProgressMap },
    infrastructure,
    construction,
  };
}
