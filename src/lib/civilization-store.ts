// Persistence for a player's civilization.
//
// Saves live in the shared `game_progress` table (one row per account + game
// slug, `progress` is jsonb). Reads and writes go through the SECURITY DEFINER
// RPCs so the account lookup and RLS stay server-side — the client never needs
// the account id or direct table access.
//
// The simulation tick is NOT stored. A save records when the civilization was
// founded and when the snapshot was written; on load the tick is derived from
// those timestamps and every minute missed while the tab was closed is replayed,
// so a returning player progresses in real time.

import {
  createCivilization,
  type Civilization,
  type InfrastructureMap,
} from "../data/civilization";
import { TICK_SECONDS, advanceTick } from "../data/simulation";
import { supabase } from "./supabase";

/** Row key in the shared `game_progress` table. */
export const GAME_SLUG = "civsgame";

/** v1 stored `tick` directly; v2 stores timestamps and derives the tick. */
const SAVE_VERSION = 2;

/** Real time represented by one simulation tick (1 tick = 1 minute). */
const TICK_MS = TICK_SECONDS * 1000;

/** Upper bound on replayed ticks (90 days) so an absurd absence stays fast. */
const MAX_CATCHUP_TICKS = 90 * 24 * 60;

export interface SaveEnvelopeV2 {
  version: 2;
  /** ISO time the civilization was founded (derived from the in-memory tick). */
  foundedAt: string;
  /** ISO time this snapshot was written. */
  savedAt: string;
  /** Full state minus the derived tick counter. */
  civilization: Omit<Civilization, "tick">;
}

export interface LoadResult {
  civilization: Civilization | null;
  error: string | null;
}

/** Build the JSON payload for a save, without storing the tick counter. */
export function buildSavePayload(civilization: Civilization, now: number): SaveEnvelopeV2 {
  const { tick, ...state } = civilization;
  return {
    version: SAVE_VERSION,
    foundedAt: new Date(now - tick * TICK_MS).toISOString(),
    savedAt: new Date(now).toISOString(),
    civilization: state,
  };
}

/** Load the signed-in player's civilization, or null when they have none. */
export async function loadCivilization(): Promise<LoadResult> {
  const { data, error } = await supabase.rpc("load_game_progress", {
    p_game_slug: GAME_SLUG,
  });

  if (error) return { civilization: null, error: error.message };

  const row = (Array.isArray(data) ? data[0] : data) as {
    progress?: unknown;
    updated_at?: string;
  } | null;
  if (!row?.progress) return { civilization: null, error: null };
  // `{}` is the table default; treat it as "no save yet".
  if (typeof row.progress === "object" && Object.keys(row.progress as object).length === 0) {
    return { civilization: null, error: null };
  }

  const civilization = restoreCivilization(row.progress, Date.now(), row.updated_at);
  if (!civilization) {
    return { civilization: null, error: "Saved civilization data is unreadable." };
  }
  return { civilization, error: null };
}

/** Persist the civilization. Returns an error message, or null on success. */
export async function saveCivilization(civilization: Civilization): Promise<string | null> {
  const payload = buildSavePayload(civilization, Date.now());
  const { error } = await supabase.rpc("save_game_progress", {
    p_game_slug: GAME_SLUG,
    p_progress: payload,
  });
  return error ? error.message : null;
}

function mergeSection<T extends object>(defaults: T, saved: unknown): T {
  return saved && typeof saved === "object" ? { ...defaults, ...(saved as Partial<T>) } : defaults;
}

/**
 * Merge saved infrastructure with the current defaults per group, so buildings
 * added to a group after this save was written still show up.
 */
function mergeInfrastructure(defaults: InfrastructureMap, saved: unknown): InfrastructureMap {
  if (!saved || typeof saved !== "object") return defaults;
  const savedMap = saved as InfrastructureMap;
  const merged: InfrastructureMap = {};
  for (const group of new Set([...Object.keys(defaults), ...Object.keys(savedMap)])) {
    merged[group] = { ...(defaults[group] ?? {}), ...(savedMap[group] ?? {}) };
  }
  return merged;
}

/**
 * Turn stored JSON back into a Civilization, then replay the ticks that passed
 * since `savedAt`. `fallbackSavedAt` is the row's `updated_at`, used for old
 * v1 saves that did not store a timestamp.
 *
 * Returns null when the payload is clearly not a civilization.
 */
export function restoreCivilization(
  raw: unknown,
  now: number = Date.now(),
  fallbackSavedAt?: string,
): Civilization | null {
  if (!raw || typeof raw !== "object") return null;

  const record = raw as Record<string, unknown>;
  if (Object.keys(record).length === 0) return null;

  const saved = (record.civilization ?? record) as Partial<Civilization> | null;
  if (!saved || typeof saved !== "object") return null;

  // Require the core sections so arbitrary JSON can't be mistaken for a save.
  if (!saved.overview || !saved.resources || !saved.research) return null;

  const defaults = createCivilization({
    leader: saved.leader ?? "",
    tribe: saved.tribe ?? "",
    name: saved.name ?? "",
  });

  const savedAtRaw = typeof record.savedAt === "string" ? record.savedAt : fallbackSavedAt;
  const savedAt = savedAtRaw ? Date.parse(savedAtRaw) : NaN;
  const hasSavedAt = Number.isFinite(savedAt);

  // v2 derives the saved tick from foundedAt/savedAt; v1 stored it directly.
  let savedTick = typeof saved.tick === "number" ? Math.max(0, Math.floor(saved.tick)) : 0;
  if (typeof record.foundedAt === "string" && hasSavedAt) {
    const foundedAt = Date.parse(record.foundedAt);
    if (Number.isFinite(foundedAt)) {
      savedTick = Math.max(0, Math.round((savedAt - foundedAt) / TICK_MS));
    }
  }

  let civilization: Civilization = {
    ...defaults,
    ...saved,
    tick: savedTick,
    overview: mergeSection(defaults.overview, saved.overview),
    resources: mergeSection(defaults.resources, saved.resources),
    production: mergeSection(defaults.production, saved.production),
    economy: mergeSection(defaults.economy, saved.economy),
    research: mergeSection(defaults.research, saved.research),
    infrastructure: mergeInfrastructure(defaults.infrastructure, saved.infrastructure),
    construction: mergeSection(defaults.construction, saved.construction),
    military: mergeSection(defaults.military, saved.military),
    politics: mergeSection(defaults.politics, saved.politics),
    intelligence: mergeSection(defaults.intelligence, saved.intelligence),
  };

  // Catch up on the time the tab was closed (or throttled).
  if (!hasSavedAt) return civilization;
  const elapsed = Math.floor((now - savedAt) / TICK_MS);
  const ticks = Math.min(Math.max(0, elapsed), MAX_CATCHUP_TICKS);
  for (let i = 0; i < ticks; i++) {
    civilization = advanceTick(civilization);
  }
  return civilization;
}
