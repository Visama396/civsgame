import { useState, useEffect, useCallback, type SubmitEvent } from "react";
import { getBrowserClient } from "../lib/supabase/client";
import { RESOURCE_CATEGORIES, RESOURCE_BY_KEY } from "../lib/game/resources";
import { TECH_BY_KEY, researchableTechs } from "../lib/game/technologies";
import type { ClientGameState, NationResource, TechResearch } from "../lib/game/types";

// Username is used as a fake email so Supabase Auth works without needing a
// real address (same trick as ViPlay / laregion on this shared project).
const fakeEmail = (username: string) => `${username.trim().toLowerCase()}@app.local`;

async function api(sb: ReturnType<typeof getBrowserClient>, path: string, init?: RequestInit) {
  const {
    data: { session },
  } = await sb.auth.getSession();
  return fetch(path, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init?.headers,
      ...(session?.access_token ? { authorization: `Bearer ${session.access_token}` } : {}),
    },
  });
}

function statBar(label: string, value: number, max: number, color: string) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex justify-between text-xs text-amber-200">
        <span>{label}</span>
        <span className="font-mono">{typeof value === "number" ? value.toFixed(1) : value}</span>
      </div>
      <div className="h-1.5 rounded bg-gray-700">
        <div className="h-full rounded" style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: color }} />
      </div>
    </div>
  );
}

function AuthForm({
  sb,
  onSuccess,
}: {
  sb: ReturnType<typeof getBrowserClient>;
  onSuccess: () => void;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: SubmitEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "register") {
        const { data: signup, error } = await sb.auth.signUp({
          email: fakeEmail(username),
          password,
          options: { data: { display_name: displayName.trim() || username.trim() } },
        });
        if (error) {
          setError(error.message);
          setBusy(false);
          return;
        }
        if (!signup.session) {
          setError("Account created — confirm your email to sign in.");
          setBusy(false);
          return;
        }
      } else {
        const { error } = await sb.auth.signInWithPassword({
          email: fakeEmail(username),
          password,
        });
        if (error) {
          setError(error.message);
          setBusy(false);
          return;
        }
      }
      await sb.rpc("ensure_account_link", {
        p_username: username.trim().toLowerCase(),
        p_display_name: displayName.trim() || username.trim(),
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="max-w-sm mx-auto mt-8 rounded-md border border-amber-400/40 bg-gray-800/80 p-4 flex flex-col gap-3"
    >
      <h2 className="text-lg font-semibold text-amber-400">
        {mode === "login" ? "Sign in" : "Create account"}
      </h2>
      <label className="flex flex-col gap-1 text-xs text-amber-200">
        Username
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          minLength={3}
          maxLength={16}
          autoCapitalize="none"
          className="rounded bg-gray-900 border border-amber-400/30 px-2 py-1 text-sm text-amber-100 outline-none focus:border-amber-400"
        />
      </label>
      {mode === "register" && (
        <label className="flex flex-col gap-1 text-xs text-amber-200">
          Display name
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={24}
            className="rounded bg-gray-900 border border-amber-400/30 px-2 py-1 text-sm text-amber-100 outline-none focus:border-amber-400"
          />
        </label>
      )}
      <label className="flex flex-col gap-1 text-xs text-amber-200">
        Password
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={4}
          className="rounded bg-gray-900 border border-amber-400/30 px-2 py-1 text-sm text-amber-100 outline-none focus:border-amber-400"
        />
      </label>

      {error && <div className="text-sm text-red-400">{error}</div>}

      <button
        type="submit"
        disabled={busy}
        className="rounded bg-amber-400/30 hover:bg-amber-400/50 disabled:opacity-50 px-3 py-1.5 text-sm font-semibold text-amber-200"
      >
        {busy ? "Working…" : mode === "login" ? "Sign in" : "Register"}
      </button>

      <button
        type="button"
        onClick={() => setMode(mode === "login" ? "register" : "login")}
        className="text-xs text-amber-300/80 hover:text-amber-200"
      >
        {mode === "login" ? "New here? Create an account" : "Already have an account? Sign in"}
      </button>
    </form>
  );
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<ClientGameState | null>(null);
  const [sb] = useState(() => getBrowserClient());

  const fetchState = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await api(sb, "/api/state");
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      setError(body.error ?? `HTTP ${res.status}`);
      setLoading(false);
      return;
    }
    setState(await res.json());
    setLoading(false);
  }, [sb]);

  useEffect(() => {
    sb.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        fetchState();
      }
    });
    sb.auth
      .getUser()
      .then(({ data }) => {
        setAuthChecking(false);
        if (data.user) fetchState();
        else setLoading(false);
      })
      .catch(() => {
        setAuthChecking(false);
        setLoading(false);
      });
  }, [sb, fetchState]);

  const startResearch = async (techKey: string) => {
    await api(sb, "/api/state", {
      method: "POST",
      body: JSON.stringify({ action: { type: "start_research", techKey } }),
    });
    fetchState();
  };

  const cancelResearch = async () => {
    await api(sb, "/api/state", {
      method: "POST",
      body: JSON.stringify({ action: { type: "cancel_research" } }),
    });
    fetchState();
  };

  const signOut = async () => {
    await sb.auth.signOut();
    setState(null);
    setLoading(false);
  };

  const nation = state?.nation;
  const resources = state?.resources ?? [];
  const notifications = state?.notifications ?? [];
  const events = state?.events ?? [];

  const researchable = nation
    ? researchableTechs(state?.researchedTechs ?? [])
    : [];
  const activeResearch = state?.techResearch?.[0] as TechResearch | undefined;
  const activeTech = activeResearch ? TECH_BY_KEY.get(activeResearch.tech_id) : null;

  const unlockedByCategory = new Map<string, NationResource[]>();
  for (const nr of resources) {
    if (!nr.unlocked) continue;
    const cat = RESOURCE_BY_KEY.get(nr.resource_id)?.category ?? "mineral";
    if (!unlockedByCategory.has(cat)) unlockedByCategory.set(cat, []);
    unlockedByCategory.get(cat)!.push(nr);
  }

  const stats = nation?.stats;

  return (
    <div className="bg-gray-900 min-h-screen p-4 flex flex-col gap-3 text-amber-100">
      <header className="rounded-md border border-amber-400 shadow-2xs shadow-amber-100 p-3 bg-amber-500/30 flex justify-between items-center">
        <div>
          <h1 className="text-2xl text-amber-400 font-black tracking-wide">Civilization Simulation</h1>
          {nation && <p className="text-amber-200 text-sm">{nation.name} · {nation.era} era · Pop {nation.population}</p>}
        </div>
        <div className="flex gap-2">
          {nation && (
            <button onClick={fetchState} className="text-xs bg-amber-400/20 hover:bg-amber-400/40 rounded px-2 py-1 text-amber-300">
              Refresh
            </button>
          )}
          {state && (
            <button onClick={signOut} className="text-xs bg-red-400/20 hover:bg-red-400/40 rounded px-2 py-1 text-red-300">
              Sign out
            </button>
          )}
        </div>
      </header>

      {authChecking && <div className="text-center text-amber-400 py-8">Checking…</div>}

      {!authChecking && !state && !loading && <AuthForm sb={sb} onSuccess={fetchState} />}

      {!authChecking && state && loading && <div className="text-center text-amber-400 py-8">Loading…</div>}
      {error && !state && <div className="text-center text-red-400 py-8">{error}</div>}

      {!loading && nation && (
        <>
          <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {[
              { label: "Food", value: stats?.food ?? 0, color: "#4ade80" },
              { label: "Production", value: stats?.production ?? 0, color: "#f97316" },
              { label: "Gold", value: stats?.gold ?? 0, color: "#fbbf24" },
              { label: "Science", value: stats?.science ?? 0, color: "#60a5fa" },
              { label: "Culture", value: stats?.culture ?? 0, color: "#c084fc" },
              { label: "Happiness", value: stats?.happiness ?? 0, color: "#34d399" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-md border border-amber-400/30 p-2 bg-gray-800/80">
                {statBar(label, value, label === "Happiness" ? 100 : 500, color)}
              </div>
            ))}
          </section>

          <section className="rounded-md border border-amber-400/30 p-2 bg-gray-800/80">
            <h2 className="text-sm text-amber-400 font-semibold mb-1">Research</h2>
            {activeTech ? (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-amber-200">{activeTech.name}</span>
                <span className="font-mono text-xs text-amber-300">
                  {Number(activeResearch!.invested).toFixed(0)} / {activeTech.cost}
                </span>
                <button onClick={cancelResearch} className="ml-auto text-xs text-red-300 hover:text-red-200">Cancel</button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                {researchable.length === 0 && <span className="text-xs text-amber-400/60">All researched</span>}
                {researchable.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => startResearch(t.key)}
                    className="text-xs bg-amber-400/10 hover:bg-amber-400/20 rounded px-2 py-0.5 border border-amber-400/20 text-amber-200"
                    title={t.description}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            )}
          </section>

          {events.length > 0 && (
            <section className="rounded-md border border-amber-400/30 p-2 bg-gray-800/80">
              <h2 className="text-sm text-amber-400 font-semibold mb-1">News</h2>
              <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                {events.slice(0, 5).map((ev) => (
                  <div key={ev.id} className="border-b border-amber-400/10 pb-1">
                    <div className="text-sm font-medium text-amber-200">{ev.title}</div>
                    {ev.description && <div className="text-xs text-amber-300/80">{ev.description}</div>}
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {RESOURCE_CATEGORIES.filter((cat) => (unlockedByCategory.get(cat.key)?.length ?? 0) > 0).map((cat) => (
              <div key={cat.key} className="rounded-md border border-amber-400/30 p-2 bg-gray-800/80">
                <h3 className="text-xs font-semibold mb-1" style={{ color: cat.color }}>{cat.name}</h3>
                <div className="flex flex-col max-h-40 overflow-y-auto">
                  {unlockedByCategory.get(cat.key)!.slice(0, 20).map((nr) => (
                    <div key={nr.resource_id} className="flex justify-between text-xs py-0.5 border-b border-amber-400/10">
                      <span className="text-amber-100 truncate">{RESOURCE_BY_KEY.get(nr.resource_id)?.name}</span>
                      <div className="flex gap-2 font-mono text-amber-300">
                        <span>{Number(nr.amount).toFixed(1)}</span>
                        {Number(nr.rate) > 0 && <span className="text-green-400">+{Number(nr.rate).toFixed(1)}</span>}
                      </div>
                    </div>
                  ))}
                  {(unlockedByCategory.get(cat.key)?.length ?? 0) > 20 && (
                    <span className="text-xs text-amber-400/50">+{(unlockedByCategory.get(cat.key)?.length ?? 0) - 20} more</span>
                  )}
                </div>
              </div>
            ))}
          </section>

          {notifications.length > 0 && (
            <section className="rounded-md border border-green-400/30 p-2 bg-green-900/20">
              <h2 className="text-xs text-green-400 font-semibold mb-1">Notifications</h2>
              <div className="flex flex-col gap-0.5 max-h-24 overflow-y-auto">
                {notifications.map((n, i) => (
                  <span key={i} className="text-xs text-green-200">{n}</span>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}