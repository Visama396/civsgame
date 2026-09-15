export type Era = "ancient" | "classical" | "medieval" | "renaissance" | "industrial" | "modern" | "atomic" | "information" | "future";

export type ResourceKind =
  | "abstract"
  | "strategic"
  | "luxury"
  | "food"
  | "agricultural"
  | "animal"
  | "mineral"
  | "metal"
  | "precious"
  | "gemstone"
  | "energy"
  | "chemical"
  | "forest"
  | "textile"
  | "marine"
  | "industrial"
  | "technological"
  | "medicinal"
  | "cultural";

export type ResourceTier = 1 | 2 | 3 | 4;

export interface Resource {
  key: string;
  name: string;
  category: ResourceCategoryKey;
  tier: ResourceTier;
  kind: ResourceKind;
  value: number;
  weight: number;
  unlockTechKey: string | null;
}

export type ResourceCategoryKey =
  | "strategic"
  | "luxury"
  | "food"
  | "agricultural"
  | "animal"
  | "mineral"
  | "metal"
  | "precious"
  | "gemstone"
  | "energy"
  | "chemical"
  | "forest"
  | "textile"
  | "marine"
  | "industrial"
  | "technological"
  | "medicinal"
  | "cultural";

export interface ResourceCategory {
  key: ResourceCategoryKey;
  name: string;
  color: string;
}

export interface RecipeInput {
  resourceKey: string;
  qty: number;
}

export interface Recipe {
  key: string;
  name: string;
  outputKey: string;
  outputQty: number;
  inputs: RecipeInput[];
  buildingKey: string | null;
  unlockTechKey: string | null;
}

export interface Technology {
  key: string;
  name: string;
  era: Era;
  cost: number;
  description: string;
  prerequisites: string[];
  unlocksResources: string[];
  unlocksBuildings: string[];
  unlocksUnits: string[];
  unlocksRecipes: string[];
}

export interface BuildingOutput {
  resourceKey: string;
  perTick: number;
}

export interface Building {
  key: string;
  name: string;
  era: Era;
  costGold: number;
  costResources: RecipeInput[];
  maintenance: number;
  effects: {
    food?: number;
    production?: number;
    gold?: number;
    science?: number;
    culture?: number;
    happiness?: number;
    populationCap?: number;
  };
  outputs?: BuildingOutput[];
  unlockTechKey: string | null;
}

export type UnitKind = "military" | "civilian" | "siege" | "naval" | "air";

export interface Unit {
  key: string;
  name: string;
  kind: UnitKind;
  era: Era;
  costGold: number;
  costResources: RecipeInput[];
  maintenance: number;
  stats: {
    combat: number;
    movement: number;
    defense: number;
  };
  unlockTechKey: string | null;
}

export type NationStat = {
  food: number;
  production: number;
  gold: number;
  science: number;
  culture: number;
  happiness: number;
  stability: number;
  corruption: number;
};

export interface Nation {
  id: string;
  owner_id: string;
  name: string;
  banner: string;
  slogan: string;
  founded_at: string;
  last_tick: string;
  era: Era;
  population: number;
  stats: NationStat;
}

export interface NationResource {
  nation_id: string;
  resource_id: string;
  amount: number;
  rate: number;
  unlocked: boolean;
  discovered_at: string | null;
}

export interface City {
  id: string;
  nation_id: string;
  name: string;
  founded_at: string;
  population: number;
  happiness: number;
  production_queue: string[] | null;
}

export interface CityBuilding {
  id: string;
  city_id: string;
  building_id: string;
  level: number;
  constructed_at: string;
}

export interface Army {
  id: string;
  nation_id: string;
  unit_id: string;
  name: string;
  strength: number;
  stationed_city_id: string | null;
  status: "garrison" | "field" | "training";
}

export interface KnowledgeTransfer {
  id: string;
  from_nation: string;
  to_nation: string;
  tech_id: string | null;
  resource_category: ResourceCategoryKey | null;
  status: "proposed" | "accepted" | "completed" | "rejected";
  created_at: string;
}

export interface Diplomacy {
  id: string;
  nation_a: string;
  nation_b: string;
  status: "neutral" | "peace" | "allied" | "war" | "trade_agreement";
  updated_at: string;
}

export type EventCategory =
  | "news"
  | "economic"
  | "military"
  | "diplomacy"
  | "disaster"
  | "science"
  | "trade"
  | "social";

export interface EventChoice {
  key: string;
  label: string;
  description: string;
  effects: Record<string, number | string>;
}

export interface GameEvent {
  id: string;
  nation_id: string | null;
  category: EventCategory;
  title: string;
  description: string;
  payload: Record<string, unknown>;
  choices: EventChoice[];
  occurs_at: string;
  expires_at: string | null;
}

export interface NationTechnology {
  nation_id: string;
  tech_id: string;
  researched_at: string;
}

export interface TechResearch {
  nation_id: string;
  tech_id: string;
  invested: number;
  started_at: string;
}

export interface ClientGameState {
  nation: Nation;
  resources: NationResource[];
  cities: City[];
  cityBuildings: CityBuilding[];
  armies: Army[];
  techResearch: TechResearch[];
  researchedTechs: string[];
  events: GameEvent[];
  notifications: string[];
  serverTime: string;
}

export type GameAction =
  | { type: "start_research"; techKey: string }
  | { type: "cancel_research" }
  | { type: "queue_construction"; cityId: string; item: "unit" | "building"; key: string }
  | { type: "respond_event"; eventId: string; choiceKey: string }
  | { type: "rename_nation"; name: string }
  | { type: "found_city"; name: string };

export interface GameActionResponse {
  ok: boolean;
  error?: string;
  notifications?: string[];
}

export interface GameStateBundle {
  nation: Nation;
  resources: NationResource[];
  cities: City[];
  cityBuildings: CityBuilding[];
  armies: Army[];
  technologies: {
    researched: NationTechnology[];
    inProgress: TechResearch[];
  };
  events: GameEvent[];
  diplomacy: Diplomacy[];
  knowledgeTransfers: KnowledgeTransfer[];
  catalog: {
    resources: Resource[];
    categories: ResourceCategory[];
    technologies: Technology[];
    buildings: Building[];
    units: Unit[];
    recipes: Recipe[];
  };
}