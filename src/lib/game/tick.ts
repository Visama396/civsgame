import { BUILDING_BY_KEY } from "./buildings";
import { RESOURCE_BY_KEY } from "./resources";
import { TECH_BY_KEY } from "./technologies";
import { UNIT_BY_KEY } from "./units";
import type {
  Army,
  Building,
  City,
  CityBuilding,
  GameEvent,
  Nation,
  NationResource,
  NationTechnology,
  Technology,
  TechResearch,
  Unit,
} from "./types";

export const TICK_SECONDS = 60;
export const FOOD_PER_POP_PER_TICK = 0.1;
export const FOOD_TO_GROW = 10;
export const MAX_HAPPINESS = 100;
export const BASE_HAPPINESS = 70;

interface QueueItem {
  kind: "building" | "unit";
  key: string;
  spent: number;
  cityId: string;
}

export interface TickContext {
  nation: Nation;
  cities: City[];
  cityBuildings: CityBuilding[];
  nationResources: NationResource[];
  armies: Army[];
  techResearch: TechResearch[];
  researchedTechs: string[];
}

export interface TickResult {
  nation: Nation;
  nationResources: NationResource[];
  techResearch: TechResearch[];
  technologiesToInsert: NationTechnology[];
  buildingsToInsert: Partial<CityBuilding>[];
  armiesToInsert: Partial<Army>[];
  citiesToUpdate: Partial<City>[];
  resourcesToUnlock: string[];
  notifications: string[];
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function sumEffects(ctx: TickContext, key: keyof Building["effects"]): number {
  let total = 0;
  for (const cb of ctx.cityBuildings) {
    const building = BUILDING_BY_KEY.get(cb.building_id);
    if (building) total += (building.effects[key] ?? 0) * cb.level;
  }
  return total;
}

function totalUpkeep(ctx: TickContext): number {
  let total = 0;
  for (const cb of ctx.cityBuildings) {
    const building = BUILDING_BY_KEY.get(cb.building_id);
    if (building) total += building.maintenance * cb.level;
  }
  for (const army of ctx.armies) {
    const unit = UNIT_BY_KEY.get(army.unit_id);
    if (unit) total += unit.maintenance;
  }
  return total;
}

export function computeRates(ctx: TickContext) {
  const upkeep = totalUpkeep(ctx);
  return {
    food: sumEffects(ctx, "food"),
    production: sumEffects(ctx, "production"),
    gold: sumEffects(ctx, "gold") - upkeep,
    science: sumEffects(ctx, "science"),
    culture: sumEffects(ctx, "culture"),
    happiness: BASE_HAPPINESS + sumEffects(ctx, "happiness"),
    populationCap: sumEffects(ctx, "populationCap"),
  };
}

export function computeResourceRates(ctx: TickContext): Record<string, number> {
  const rates: Record<string, number> = {};
  for (const cb of ctx.cityBuildings) {
    const building = BUILDING_BY_KEY.get(cb.building_id);
    if (!building?.outputs) continue;
    for (const output of building.outputs) {
      rates[output.resourceKey] = (rates[output.resourceKey] ?? 0) + output.perTick * cb.level;
    }
  }
  return rates;
}

export function calculateElapsedTicks(lastTick: string, now?: number): number {
  const then = new Date(lastTick).getTime();
  const current = now ?? Date.now();
  return Math.max(0, Math.floor((current - then) / (TICK_SECONDS * 1000)));
}

export function tick(ctx: TickContext, elapsedSeconds: number): TickResult {
  const result: TickResult = {
    nation: { ...ctx.nation, stats: { ...ctx.nation.stats } },
    nationResources: ctx.nationResources.map((r) => ({ ...r })),
    techResearch: ctx.techResearch.map((r) => ({ ...r })),
    technologiesToInsert: [],
    buildingsToInsert: [],
    armiesToInsert: [],
    citiesToUpdate: [],
    resourcesToUnlock: [],
    notifications: [],
  };

  const nation = result.nation;
  const stats = nation.stats;
  const ticks = Math.max(1, Math.round(elapsedSeconds / TICK_SECONDS));
  const rates = computeRates(ctx);
  const resourceRates = computeResourceRates(ctx);

  for (const nr of result.nationResources) {
    const rate = nr.unlocked ? (resourceRates[nr.resource_id] ?? 0) : 0;
    nr.rate = rate;
    if (nr.unlocked && rate > 0) nr.amount = Number(nr.amount) + rate * ticks;
  }

  const foodConsumption = nation.population * FOOD_PER_POP_PER_TICK * ticks;
  const netFood = stats.food + rates.food * ticks - foodConsumption;
  stats.food = Math.max(0, netFood);
  stats.production = stats.production + rates.production * ticks;
  stats.gold = stats.gold + rates.gold * ticks;
  stats.science = stats.science + rates.science * ticks;
  stats.culture = stats.culture + rates.culture * ticks;
  stats.happiness = clamp(rates.happiness + (rates.food <= 0 ? -5 : 0), 0, MAX_HAPPINESS);

  if (netFood >= FOOD_TO_GROW) {
    const growth = Math.floor(netFood / FOOD_TO_GROW);
    nation.population += growth;
    result.notifications.push(`Population grew to ${nation.population}`);
  }

  processProductionQueues(result, ctx.cities, rates.production, ticks);

  processResearch(result, rates.science, ticks);

  nation.last_tick = new Date(Date.now() + elapsedSeconds * 1000).toISOString();

  return result;
}

function processProductionQueues(
  result: TickResult,
  cities: City[],
  productionRate: number,
  ticks: number,
) {
  const productionPool = productionRate * ticks;
  if (productionPool <= 0 || cities.every((c) => !(c.production_queue?.length ?? 0))) return;

  for (const city of cities) {
    if (!city.production_queue || city.production_queue.length === 0) continue;

    let queue: QueueItem[] = city.production_queue.map((entry) =>
      typeof entry === "string" ? parseQueueItem(entry) : entry,
    );
    let changed = false;

    for (const item of queue) {
      const buildableInstance = buildable(item);
      if (!buildableInstance) continue;

      if (item.kind === "building") {
        const building = BUILDING_BY_KEY.get(item.key);
        if (!building) continue;
        item.spent += productionPool;
        changed = true;

        if (item.spent >= building.costGold) {
          if (payAndInsertBuilding(result, city, building)) {
            result.notifications.push(`${building.name} completed in ${city.name}`);
            queue = queue.filter((q) => q !== item);
            changed = true;
          }
        }
      } else if (item.kind === "unit") {
        const unit = UNIT_BY_KEY.get(item.key);
        if (!unit) continue;
        item.spent += productionPool;
        changed = true;

        if (item.spent >= unit.costGold) {
          if (payAndInsertArmy(result, city, unit)) {
            result.notifications.push(`${unit.name} trained in ${city.name}`);
            queue = queue.filter((q) => q !== item);
            changed = true;
          }
        }
      }
    }

    if (changed) {
      result.citiesToUpdate.push({
        id: city.id,
        production_queue: queue.map((q) => JSON.stringify(q)),
      });
    }
  }
}

function buildable(item: QueueItem): boolean {
  if (item.kind === "building") return BUILDING_BY_KEY.has(item.key);
  if (item.kind === "unit") return UNIT_BY_KEY.has(item.key);
  return false;
}

function parseQueueItem(raw: string): QueueItem {
  try {
    return JSON.parse(raw);
  } catch {
    const [kind, key] = raw.split(":");
    return { kind: kind === "unit" ? "unit" : "building", key, spent: 0, cityId: "" };
  }
}

function payAndInsertBuilding(result: TickResult, city: City, building: Building): boolean {
  const costById = new Map<string, number>();
  for (const entry of building.costResources) {
    costById.set(entry.resourceKey, entry.qty);
  }
  if (!canAfford(result.nationResources, costById)) return false;

  const stats = result.nation.stats;
  if (stats.gold < building.costGold) return false;

  stats.gold -= building.costGold;
  deductCost(result.nationResources, costById);

  result.buildingsToInsert.push({
    city_id: city.id,
    building_id: building.key,
    constructed_at: new Date().toISOString(),
  });
  return true;
}

function payAndInsertArmy(result: TickResult, city: City, unit: Unit): boolean {
  const costById = new Map<string, number>();
  for (const entry of unit.costResources) {
    costById.set(entry.resourceKey, entry.qty);
  }
  if (!canAfford(result.nationResources, costById)) return false;

  const stats = result.nation.stats;
  if (stats.gold < unit.costGold) return false;

  stats.gold -= unit.costGold;
  deductCost(result.nationResources, costById);

  result.armiesToInsert.push({
    nation_id: result.nation.id,
    unit_id: unit.key,
    name: unit.name,
    strength: unit.stats.combat ?? 1,
    stationed_city_id: city.id,
  });
  return true;
}

export function canAfford(
  nationResources: NationResource[],
  costById: Map<string, number>,
): boolean {
  const byKey = new Map<string, number>();
  for (const nr of nationResources) byKey.set(nr.resource_id, Number(nr.amount));
  for (const [key, qty] of costById) {
    if ((byKey.get(key) ?? 0) < qty) return false;
  }
  return true;
}

function deductCost(nationResources: NationResource[], costById: Map<string, number>): void {
  for (const nr of nationResources) {
    const need = costById.get(nr.resource_id);
    if (need) nr.amount = Number(nr.amount) - need;
  }
}

function processResearch(result: TickResult, scienceRate: number, ticks: number) {
  if (result.techResearch.length === 0) return;
  const research = result.techResearch[0];
  const tech = TECH_BY_KEY.get(research.tech_id);
  if (!tech) return;

  const progress = scienceRate * ticks;
  if (progress > 0) research.invested = Number(research.invested) + progress;

  if (Number(research.invested) >= tech.cost) {
    result.technologiesToInsert.push({
      nation_id: result.nation.id,
      tech_id: tech.key,
      researched_at: new Date().toISOString(),
    });
    result.techResearch.shift();
    result.notifications.push(`Research completed: ${tech.name}`);

    for (const resKey of tech.unlocksResources) {
      let found = false;
      for (const nr of result.nationResources) {
        if (nr.resource_id === resKey) {
          found = true;
          if (!nr.unlocked) {
            nr.unlocked = true;
            nr.discovered_at = new Date().toISOString();
          }
        }
      }
      if (!found) result.resourcesToUnlock.push(resKey);
    }
  }
}

export function researchableTechsFor(researched: string[]): Technology[] {
  const known = new Set(researched);
  return [...TECH_BY_KEY.values()].filter(
    (t) => !known.has(t.key) && t.prerequisites.every((p) => known.has(p)),
  );
}

export function unlockResourcesForCategory(
  awaiting: NationResource[],
  categoryKey: string,
): string[] {
  const unlocked: string[] = [];
  for (const nr of awaiting) {
    const resource = RESOURCE_BY_KEY.get(nr.resource_id);
    if (resource?.category === categoryKey && !nr.unlocked) {
      nr.unlocked = true;
      nr.discovered_at = new Date().toISOString();
      unlocked.push(nr.resource_id);
    }
  }
  return unlocked;
}

export function eventForResearch(_tech: Technology): GameEvent | null {
  return null;
}

export function upcomingRandomEvent(): GameEvent | null {
  return null;
}