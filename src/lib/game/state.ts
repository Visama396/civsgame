import type { SupabaseClient } from "@supabase/supabase-js";
import { RESOURCES } from "./resources";
import { TECH_BY_KEY } from "./technologies";
import {
  type TickContext,
  calculateElapsedTicks,
  tick,
} from "./tick";
import type {
  ClientGameState,
  Nation,
  NationResource,
  City,
  CityBuilding,
  Army,
  TechResearch,
  GameEvent,
} from "./types";

interface Row {
  [key: string]: unknown;
}

function gameEvents(rows: Row[] | null): GameEvent[] {
  return (rows ?? []).map((r) => ({
    id: r.id as string,
    nation_id: (r.nation_id as string) ?? null,
    category: r.category as GameEvent["category"],
    title: r.title as string,
    description: (r.description as string) ?? null,
    payload: (r.payload as Record<string, unknown>) ?? {},
    choices: (r.choices as GameEvent["choices"]) ?? [],
    occurs_at: r.occurs_at as string,
    expires_at: (r.expires_at as string) ?? null,
  }));
}

export async function getOrCreateNation(
  sb: SupabaseClient,
  userId: string,
): Promise<Nation> {
  const { data: existing } = await sb
    .from("nations")
    .select("*")
    .eq("owner_id", userId)
    .maybeSingle();

  if (existing) return existing as Nation;

  return createNation(sb, userId);
}

export async function createNation(sb: SupabaseClient, userId: string): Promise<Nation> {
  const { data: nation, error: nationError } = await sb
    .from("nations")
    .insert({
      owner_id: userId,
      name: generateNationName(),
      slogan: "A bright future awaits.",
    })
    .select("*")
    .single();

  if (nationError || !nation) throw new Error(nationError?.message ?? "Failed to create nation");

  const { error: cityError } = await sb.from("cities").insert({
    nation_id: nation.id,
    name: "Capital",
    population: 1,
  });
  if (cityError) throw new Error(cityError.message);

  const initialResources = RESOURCES.filter((r) => !r.unlockTechKey).map((r) => ({
    nation_id: nation.id,
    resource_id: r.key,
    amount: r.tier === 1 ? 50 : 0,
    rate: 0,
    unlocked: true,
    discovered_at: new Date().toISOString(),
  }));

  const { error: resourceError } = await sb
    .from("nation_resources")
    .insert(initialResources);

  if (resourceError) throw new Error(resourceError.message);

  return nation as Nation;
}

const NATION_PREFIXES = ["Al'", "Vel", "Kor", "Zar", "Thul", "Mor", "Ran", "Sid", "Ore", "Nys"];
const NATION_SUFFIXES = [" -ari", " -mir", " -dor", " -hal", " -tos", " -gur", " -eth", " -aq"];

function generateNationName(): string {
  const prefix = NATION_PREFIXES[Math.floor(Math.random() * NATION_PREFIXES.length)];
  const suffix = NATION_SUFFIXES[Math.floor(Math.random() * NATION_SUFFIXES.length)];
  return (prefix + suffix).trim();
}

export interface NationState {
  nation: Nation;
  resources: NationResource[];
  cities: City[];
  cityBuildings: CityBuilding[];
  armies: Army[];
  techResearch: TechResearch[];
  researchedTechs: string[];
  events: GameEvent[];
}

export async function fetchNationState(
  sb: SupabaseClient,
  nationId: string,
): Promise<NationState> {
  const [nationRes, resourcesRes, citiesRes, buildingsRes, armiesRes, techRes, researchedRes, eventsRes] =
    await Promise.all([
      sb.from("nations").select("*").eq("id", nationId).single(),
      sb.from("nation_resources").select("*").eq("nation_id", nationId),
      sb.from("cities").select("*").eq("nation_id", nationId),
      sb.from("city_buildings")
        .select("id, city_id, building_id, level, constructed_at")
        .in(
          "city_id",
          (await sb.from("cities").select("id").eq("nation_id", nationId)).data?.map((c) => c.id) ?? [],
        ),
      sb.from("armies").select("*").eq("nation_id", nationId),
      sb.from("tech_research").select("*").eq("nation_id", nationId),
      sb.from("nation_technologies").select("tech_id").eq("nation_id", nationId),
      sb
        .from("game_events")
        .select("*, event_choices(*)")
        .or(`nation_id.eq.${nationId},nation_id.is.null`)
        .order("occurs_at", { ascending: true }),
    ]);

  if (nationRes.error) throw new Error(nationRes.error.message);

  return {
    nation: nationRes.data as Nation,
    resources: (resourcesRes.data ?? []) as NationResource[],
    cities: (citiesRes.data ?? []) as City[],
    cityBuildings: (buildingsRes.data ?? []) as CityBuilding[],
    armies: (armiesRes.data ?? []) as Army[],
    techResearch: (techRes.data ?? []) as TechResearch[],
    researchedTechs: (researchedRes.data ?? []).map((r) => r.tech_id as string),
    events: gameEvents(eventsRes.data as Row[]),
  };
}

export async function advanceNation(sb: SupabaseClient, state: NationState): Promise<string[]> {
  const ctx: TickContext = {
    nation: state.nation,
    cities: state.cities,
    cityBuildings: state.cityBuildings,
    nationResources: state.resources,
    armies: state.armies,
    techResearch: state.techResearch,
    researchedTechs: state.researchedTechs,
  };

  const elapsed = calculateElapsedTicks(state.nation.last_tick);
  const result = tick(ctx, elapsed * 60);

  await persistTick(sb, state.nation.id, result);

  return result.notifications;
}

async function persistTick(
  sb: SupabaseClient,
  nationId: string,
  result: ReturnType<typeof tick>,
) {
  const nation = result.nation;
  await sb
    .from("nations")
    .update({
      population: nation.population,
      last_tick: nation.last_tick,
      stats: nation.stats,
    })
    .eq("id", nationId);

  if (result.nationResources.length > 0) {
    await sb.from("nation_resources").upsert(
      result.nationResources.map((r) => ({
        nation_id: r.nation_id,
        resource_id: r.resource_id,
        amount: Number(r.amount),
        rate: Number(r.rate),
        unlocked: Boolean(r.unlocked),
        discovered_at: r.discovered_at,
      })),
      { onConflict: "nation_id,resource_id" },
    );
  }

  if (result.resourcesToUnlock.length > 0) {
    await sb.from("nation_resources").upsert(
      result.resourcesToUnlock.map((key) => ({
        nation_id: nationId,
        resource_id: key,
        amount: 0,
        rate: 0,
        unlocked: true,
        discovered_at: new Date().toISOString(),
      })),
      { onConflict: "nation_id,resource_id" },
    );
  }

  if (result.buildingsToInsert.length > 0) {
    await sb.from("city_buildings").insert(result.buildingsToInsert);
  }

  if (result.armiesToInsert.length > 0) {
    await sb.from("armies").insert(
      result.armiesToInsert.map((a) => ({
        ...a,
        strength: Number(a.strength),
      })),
    );
  }

  if (result.technologiesToInsert.length > 0) {
    await sb.from("nation_technologies").insert(result.technologiesToInsert);
  }

  if (result.techResearch.length > 0) {
    await sb
      .from("tech_research")
      .upsert(
        result.techResearch.map((r) => ({
          nation_id: r.nation_id,
          tech_id: r.tech_id,
          invested: Number(r.invested),
        })),
        { onConflict: "nation_id,tech_id" },
      );
  } else {
    await sb.from("tech_research").delete().eq("nation_id", nationId);
  }

  for (const update of result.citiesToUpdate) {
    if (update.id && update.production_queue) {
      await sb.from("cities").update({ production_queue: update.production_queue }).eq("id", update.id);
    }
  }
}

export async function buildClientState(
  sb: SupabaseClient,
  state: NationState,
  notifications: string[],
): Promise<ClientGameState> {
  const { data: processedEvents } = await sb
    .from("event_responses")
    .select("event_id")
    .eq("nation_id", state.nation.id);

  const processedIds = new Set((processedEvents ?? []).map((r) => r.event_id as string));

  return {
    nation: state.nation,
    resources: state.resources,
    cities: state.cities,
    cityBuildings: state.cityBuildings,
    armies: state.armies,
    techResearch: state.techResearch,
    researchedTechs: state.researchedTechs,
    events: state.events.filter((e) => !processedIds.has(e.id)),
    notifications,
    serverTime: new Date().toISOString(),
  };
}

export function techByKey(key: string) {
  return TECH_BY_KEY.get(key) ?? null;
}

export async function tallyUnlockables(
  sb: SupabaseClient,
  nationId: string,
): Promise<{ categories: string[]; resources: string[] }> {
  const { data: resources } = await sb
    .from("nation_resources")
    .select("resource_id, unlocked")
    .eq("nation_id", nationId);
  return {
    categories: [],
    resources: (resources ?? []).filter((r) => r.unlocked).map((r) => r.resource_id),
  };
}