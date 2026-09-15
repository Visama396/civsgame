import type { SupabaseClient } from "@supabase/supabase-js";
import { TECH_BY_KEY } from "./technologies";
import type { GameAction, GameActionResponse } from "./types";

export async function handleAction(
  sb: SupabaseClient,
  nationId: string,
  action: GameAction,
): Promise<GameActionResponse> {
  switch (action.type) {
    case "start_research":
      return startResearch(sb, nationId, action.techKey);
    case "cancel_research":
      return cancelResearch(sb, nationId);
    case "queue_construction":
      return queueConstruction(sb, nationId, action.cityId, action.item, action.key);
    case "respond_event":
      return respondEvent(sb, nationId, action.eventId, action.choiceKey);
    case "rename_nation": {
      const name = action.name.trim().slice(0, 40);
      if (!name) return { ok: false, error: "Name cannot be empty" };
      const { error } = await sb.from("nations").update({ name }).eq("id", nationId);
      if (error) return { ok: false, error: error.message };
      return { ok: true, notifications: [`Renamed to ${name}`] };
    }
    case "found_city": {
      const name = action.name.trim().slice(0, 40);
      if (!name) return { ok: false, error: "Name cannot be empty" };
      const { error } = await sb.from("cities").insert({
        nation_id: nationId,
        name,
        population: 1,
      });
      if (error) return { ok: false, error: error.message };
      return { ok: true, notifications: [`Founded ${name}`] };
    }
    default:
      return { ok: false, error: "Unknown action" };
  }
}

async function startResearch(
  sb: SupabaseClient,
  nationId: string,
  techKey: string,
): Promise<GameActionResponse> {
  const tech = TECH_BY_KEY.get(techKey);
  if (!tech) return { ok: false, error: "Unknown technology" };

  const { data: researched } = await sb
    .from("nation_technologies")
    .select("tech_id")
    .eq("nation_id", nationId);
  const known = new Set((researched ?? []).map((r) => r.tech_id as string));

  if (known.has(techKey)) return { ok: false, error: "Already researched" };
  if (!tech.prerequisites.every((p) => known.has(p))) {
    return { ok: false, error: "Missing prerequisites" };
  }

  const { data: existing } = await sb
    .from("tech_research")
    .select("tech_id")
    .eq("nation_id", nationId)
    .maybeSingle();
  if (existing) return { ok: false, error: "Already researching another technology" };

  const { error } = await sb.from("tech_research").insert({
    nation_id: nationId,
    tech_id: techKey,
    invested: 0,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, notifications: [`Started researching ${tech.name}`] };
}

async function cancelResearch(
  sb: SupabaseClient,
  nationId: string,
): Promise<GameActionResponse> {
  const { error } = await sb.from("tech_research").delete().eq("nation_id", nationId);
  if (error) return { ok: false, error: error.message };
  return { ok: true, notifications: ["Research cancelled"] };
}

async function queueConstruction(
  sb: SupabaseClient,
  nationId: string,
  cityId: string,
  item: "unit" | "building",
  key: string,
): Promise<GameActionResponse> {
  const { data: city, error: cityError } = await sb
    .from("cities")
    .select("id, nation_id, production_queue")
    .eq("id", cityId)
    .single();
  if (cityError || !city) return { ok: false, error: "City not found" };
  if (city.nation_id !== nationId) return { ok: false, error: "Not your city" };

  const queue: string[] = city.production_queue ?? [];
  queue.push(JSON.stringify({ kind: item, key, spent: 0, cityId }));

  const { error } = await sb.from("cities").update({ production_queue: queue }).eq("id", cityId);
  if (error) return { ok: false, error: error.message };
  return { ok: true, notifications: [`Queued ${item}: ${key}`] };
}

async function respondEvent(
  sb: SupabaseClient,
  nationId: string,
  eventId: string,
  choiceKey: string,
): Promise<GameActionResponse> {
  const { data: choice } = await sb
    .from("event_choices")
    .select("id, event_id")
    .eq("event_id", eventId)
    .eq("key", choiceKey)
    .maybeSingle();
  if (!choice) return { ok: false, error: "Choice not found" };

  const { error } = await sb.from("event_responses").upsert(
    { nation_id: nationId, event_id: eventId, choice_id: choice.id },
    { onConflict: "nation_id,event_id" },
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true, notifications: ["Response recorded"] };
}