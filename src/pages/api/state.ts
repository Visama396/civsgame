import type { APIRoute } from "astro";
import { getServerClient, getServiceClient } from "../../lib/supabase/server";
import {
  advanceNation,
  buildClientState,
  fetchNationState,
  getOrCreateNation,
} from "../../lib/game/state";
import { handleAction } from "../../lib/game/actions";
import type { ClientGameState, GameAction } from "../../lib/game/types";

export const prerender = false;

function bearer(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7);
}

// Only registered players may play. A player is registered if their auth token
// resolves to a confirmed (non-anonymous) user whose auth_id is linked in the
// shared `accounts` table. Returns the anonymous/invalid user as null.
async function registeredUser(request: Request): Promise<{ id: string } | null> {
  const token = bearer(request);
  if (!token) return null;
  const sb = getServerClient(token);
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data?.user) return null;

  const user = data.user;
  // Reject anonymous sessions outright.
  if (user.is_anonymous || !user.email || !user.email_confirmed_at) return null;

  const admin = getServiceClient();
  const { data: account } = await admin
    .from("accounts")
    .select("auth_id")
    .eq("auth_id", user.id)
    .maybeSingle();
  if (!account) return null;

  return { id: user.id };
}

async function loadState(sb: ReturnType<typeof getServerClient>, userId: string) {
  const nation = await getOrCreateNation(sb, userId);
  const state = await fetchNationState(sb, nation.id);
  const notifications = await advanceNation(sb, state);
  const fresh = await fetchNationState(sb, nation.id);
  return buildClientState(sb, fresh, notifications);
}

export const GET: APIRoute = async ({ request }) => {
  const user = await registeredUser(request);
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized — registered player only" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const sb = getServerClient(bearer(request));
  try {
    const state = await loadState(sb, user.id);
    return new Response(JSON.stringify(state), {
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  const user = await registeredUser(request);
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized — registered player only" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const sb = getServerClient(bearer(request));
  try {
    let action: GameAction;
    try {
      const body = await request.json();
      action = body?.action as GameAction;
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }
    if (!action?.type) {
      return new Response(JSON.stringify({ error: "Missing action" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const nation = await getOrCreateNation(sb, user.id);
    const response = await handleAction(sb, nation.id, action);

    const state = await loadState(sb, user.id);
    const notifications = [...(response.notifications ?? []), ...state.notifications];

    return new Response(JSON.stringify({ ...state, notifications } as ClientGameState), {
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }
};