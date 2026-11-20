import { useEffect, useRef, useState } from "react";
import {
  ALLOCATION_CATEGORIES,
  DEFAULT_MEAL_INTERVAL_HOURS,
  MAX_MEAL_INTERVAL_HOURS,
  MIN_MEAL_INTERVAL_HOURS,
  createCivilization,
  populationLimit,
  type Civilization,
} from "../data/civilization";
import {
  BUILDING_PRODUCTION_OPTIONS,
  TICKS_PER_HOUR,
  advanceTick,
  clampAllocation,
  clampMealIntervalHours,
  foodConsumptionPerTick,
  formatTicks,
  happinessTarget,
  infraLaborPerTick,
  laborPerTick,
  mealIntervalTicks,
  mealNeed,
  researchPerTick,
  resourceRatesPerHour,
  ticksToCompleteBuild,
  ticksToCompleteBuildFor,
  ticksToCompleteResearch,
} from "../data/simulation";
import {
  buildingGroupName,
  buildingName,
  buildingNextCost,
  ownedBuildingCount,
  unlockedBuildingKeys,
} from "../data/infrastructure";
import { TECHNOLOGIES, eraName, techName } from "../data/technologies";
import {
  DEFAULT_LANGUAGE,
  LANGUAGES,
  LANGUAGE_NAMES,
  LANGUAGE_ORDER,
  LANGUAGE_STORAGE_KEY,
  UI,
  recipeLabel,
  resourceLabel,
  type Language,
} from "../i18n";
import ResearchTree from "./ResearchTree";
import Civipedia from "./Civipedia";
import {
  getCurrentAccount,
  login,
  logout,
  register,
  type Account,
} from "../lib/auth";
import { loadCivilization, saveCivilization } from "../lib/civilization-store";

// Menu views are intentionally separate from ALLOCATION_CATEGORIES:
// Resources (stockpile) and Production (building outputs) are views, but
// only Production has a population slider — Resources has none.
const MENU_VIEWS = [
  "Overview",
  "Resources",
  "Production",
  "Economy",
  "Research",
  "Infrastructure",
  "Military",
  "Politics",
  "Intelligence",
] as const;

type GameView = (typeof MENU_VIEWS)[number];
type MenuView = GameView | "Settings" | "Help";

const MENU_SHORTCUTS: Record<string, string> = {
  Overview: "1",
  Resources: "2",
  Production: "3",
  Economy: "4",
  Research: "5",
  Infrastructure: "6",
  Military: "7",
  Politics: "8",
  Intelligence: "9",
};

/** Signed hourly rate, e.g. +4, -0.31, 0 (at most 2 decimals). */
function formatRate(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return `${rounded > 0 ? "+" : ""}${rounded}`;
}

/** Terminal-style progress box: a bordered bar filled to done/total. */
function ProgressBox({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? Math.max(0, Math.min(1, done / total)) : 0;
  return (
    <span
      className="ml-2 inline-block h-3 w-28 border border-white/30 align-middle"
      role="progressbar"
      aria-valuenow={Math.floor(done)}
      aria-valuemin={0}
      aria-valuemax={total}
    >
      <span className="block h-full bg-green-400/70" style={{ width: `${pct * 100}%` }} />
    </span>
  );
}

export default function Home() {
  const [account, setAccount] = useState<Account | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [authMode, setAuthMode] = useState<"login" | "register">("login")
  const [authPending, setAuthPending] = useState(false)
  const [authError, setAuthError] = useState("")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loginName, setLoginName] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [leader, setLeader] = useState("")
  const [tribeInput, setTribeInput] = useState("")
  const [civInput, setCivInput] = useState("")
  const [game, setGame] = useState<Civilization | null>(null)
  // Persistence: `hydratedRef` is true only once we know the account's saved
  // state (loaded, or intentionally started fresh), so a failed load can never
  // overwrite an existing civilization.
  const hydratedRef = useRef(false)
  // Latest game object, used to flush a pending save when the tab is hidden.
  const gameRef = useRef<Civilization | null>(null)
  // Exact object most recently queued for saving; lets the debounced effect
  // skip states that an action already persisted.
  const savedGameRef = useRef<Civilization | null>(null)
  // Serialize writes so a slow save can never overwrite a newer one.
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve())
  const [gameLoading, setGameLoading] = useState(false)
  const [loadError, setLoadError] = useState("")
  const [saveError, setSaveError] = useState("")
  // Tick clock synced to LOCAL wall-clock time: 1 tick = 1 minute, firing
  // on every minute boundary. "Next Tick" = seconds left in the current
  // minute, so logging in at 10:48:20 shows 40s. No server time involved.
  function secondsToNextTick(nowMs: number = Date.now()): number {
    const frac = (nowMs / 1000) % 60;
    const left = 60 - frac;
    // Exact boundary reads as a full 60s rather than 0s.
    return left <= 0.5 ? 60 : Math.ceil(left);
  }
  const [tickTimeCounter, setTickTimeCounter] = useState(() => secondsToNextTick())
  // Transient slider edits; committed into game.overview.allocation via [Apply].
  const [draft, setDraft] = useState<number[]>([]);
  const [currentView, setCurrentView] = useState<MenuView>("Overview");
  const previousViewRef = useRef<MenuView>("Overview");
  const [lang, setLang] = useState<Language>(DEFAULT_LANGUAGE);

  const t = UI[lang];

  const inGame = game !== null
  const population = game?.overview.population ?? 0
  const applied = game?.overview.allocation ?? []
  const popLimit = game ? populationLimit(game) : 0
  const researchQueue = game?.research.queue ?? []
  const constructionQueue = game?.construction.queue ?? []

  // One clock drives everything, synced to the local minute boundary: the
  // interval refreshes the "Next Tick" countdown several times a second and
  // fires the simulation tick exactly when the minute rolls over — so the
  // label and the research/construction ETAs can never drift apart.
  const lastTickMinuteRef = useRef(Math.floor(Date.now() / 60000));
  useEffect(() => {
    setTickTimeCounter(secondsToNextTick());
    const id = setInterval(() => {
      const now = Date.now();
      const minute = Math.floor(now / 60000);
      if (minute !== lastTickMinuteRef.current) {
        lastTickMinuteRef.current = minute;
        setGame((prev) => (prev ? advanceTick(prev) : prev));
      }
      setTickTimeCounter(secondsToNextTick(now));
    }, 250);
    return () => clearInterval(id);
  }, []);

  // Keep `gameRef` in sync so a pending save can be flushed on tab hide.
  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  // Fallback persistence for state changes that are not discrete actions
  // (simulation ticks, the meal-interval slider). Player actions save through
  // `commitGame` immediately; the debounce here coalesces slider drags.
  useEffect(() => {
    if (!isLoggedIn || !game || !hydratedRef.current) return;
    if (game === savedGameRef.current) return;
    const id = window.setTimeout(() => {
      if (game !== savedGameRef.current) persist(game);
    }, 600);
    return () => window.clearTimeout(id);
  }, [game, isLoggedIn]);

  // Flush anything still pending when the tab is hidden or closed, so an
  // action made just before leaving is not lost to the debounce.
  useEffect(() => {
    const flush = () => {
      const current = gameRef.current;
      if (!current || !hydratedRef.current) return;
      if (current === savedGameRef.current) return;
      persist(current);
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
    };
  }, []);

  // Restore an existing Supabase Auth session on load. The first paint shows a
  // short "checking" state so signed-in players don't see the login form flash.
  useEffect(() => {
    let cancelled = false
    getCurrentAccount()
      .then(async (acc) => {
        if (cancelled || !acc) return
        setAccount(acc)
        setLeader(acc.display_name?.trim() || acc.username)
        setIsLoggedIn(true)
        await hydrateGame()
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setAuthReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Restore the saved language once on the client (the SSR pass starts in
  // English so hydration can't mismatch).
  useEffect(() => {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (stored && (LANGUAGES as readonly string[]).includes(stored)) {
      setLang(stored as Language)
      document.documentElement.lang = stored
    }
  }, [])

  // Number keys 1-9 switch menu views (matches the [1]-[9] hints).
  // Esc toggles Settings. Ignored while typing in inputs and with modifiers.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key === "Escape") {
        e.preventDefault()
        toggleSettings()
        return
      }
      const el = e.target as HTMLElement | null
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT")) return
      if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
        e.preventDefault()
        setCurrentView("Help")
        return
      }
      const view = (Object.keys(MENU_SHORTCUTS) as GameView[]).find(
        (v) => MENU_SHORTCUTS[v] === e.key
      )
      if (!view) return
      selectView(view)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [game])

  // Keep slider draft within population when starvation/growth changes it.
  useEffect(() => {
    if (!game) return
    setDraft((prev) => {
      if (prev.length === 0) return game.overview.allocation
      const total = prev.reduce((s, v) => s + v, 0)
      if (total <= game.overview.population) return prev
      return clampAllocation(prev, game.overview.population)
    })
  }, [game?.overview.population])

  /**
   * Queue a save. Writes are serialized so a slow request can never land after
   * (and overwrite) a newer one.
   */
  function persist(next: Civilization) {
    savedGameRef.current = next
    saveQueueRef.current = saveQueueRef.current
      .catch(() => {})
      .then(async () => {
        try {
          const error = await saveCivilization(next)
          if (error) {
            // Allow the tab-hide flush / next tick to retry this state.
            savedGameRef.current = null
            setSaveError(error)
          } else {
            setSaveError("")
          }
        } catch (err) {
          savedGameRef.current = null
          setSaveError(err instanceof Error ? err.message : String(err))
        }
      })
  }

  /** Apply a player action and save it right away, without waiting for a tick. */
  function commitGame(next: Civilization) {
    setGame(next)
    persist(next)
  }

  async function hydrateGame() {
    setGameLoading(true)
    setLoadError("")
    try {
      const { civilization, error } = await loadCivilization()
      if (error) {
        // Do not mark as hydrated: starting a new tribe now would overwrite
        // a save we could not read.
        hydratedRef.current = false
        setLoadError(error)
        return
      }
      hydratedRef.current = true
      if (civilization) {
        // Already current: don't write the just-loaded state straight back.
        savedGameRef.current = civilization
        setGame(civilization)
        setDraft(civilization.overview.allocation)
      }
    } catch (err) {
      hydratedRef.current = false
      setLoadError(err instanceof Error ? err.message : String(err))
    } finally {
      setGameLoading(false)
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    const username = loginName.trim()
    if (!username || !loginPassword) return
    setAuthError("")
    setAuthPending(true)
    try {
      const result =
        authMode === "register"
          ? await register(username, loginPassword, displayName)
          : await login(username, loginPassword)

      if (result.error) {
        setAuthError(result.error)
        return
      }
      if (result.account) {
        setAccount(result.account)
        setLeader(result.account.display_name?.trim() || result.account.username)
        setIsLoggedIn(true)
        setLoginPassword("")
        setDisplayName("")
        await hydrateGame()
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setAuthPending(false)
    }
  }

  async function handleLogout() {
    // Flush the latest state (and any queued writes) before the session ends.
    if (game && hydratedRef.current) {
      persist(game)
      await saveQueueRef.current
    }
    await logout().catch(() => {})
    setAccount(null)
    setIsLoggedIn(false)
    setLeader("")
    setLoginName("")
    setLoginPassword("")
    setDisplayName("")
    setGame(null)
    setDraft([])
    setCurrentView("Overview")
    hydratedRef.current = false
    gameRef.current = null
    savedGameRef.current = null
    setGameLoading(false)
    setLoadError("")
    setSaveError("")
  }

  function handleTribe(e: React.FormEvent) {
    e.preventDefault()
    const tribe = tribeInput.trim()
    const civ = civInput.trim()
    if (!tribe || !civ) return
    const fresh = createCivilization({ leader, tribe, name: civ })
    // A new tribe is an intentional replacement of the saved state.
    hydratedRef.current = true
    commitGame(fresh)
    setDraft(fresh.overview.allocation)
  }

  function selectView(view: GameView) {
    setCurrentView(view)
    if (game) setDraft(game.overview.allocation)
  }

  function toggleSettings() {
    if (!game) return
    setCurrentView((view) => {
      if (view === "Settings") return previousViewRef.current
      previousViewRef.current = view
      return "Settings"
    })
  }

  function changeLanguage(next: Language) {
    setLang(next)
    document.documentElement.lang = next
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next)
  }

  function applyDraft() {
    if (!game) return
    commitGame({ ...game, overview: { ...game.overview, allocation: draft } })
  }

  function startResearch(id: string) {
    if (!game) return
    if (game.research.completed.includes(id)) return
    const { activeId } = game.research
    const queue = game.research.queue ?? []

    // Clicking the active tech cancels it; saved progress is kept and the
    // next queued tech starts immediately.
    if (activeId === id) {
      const [next, ...rest] = queue
      commitGame({
        ...game,
        research: { ...game.research, activeId: next ?? null, queue: rest },
      })
      return
    }
    // Nothing active: start now (and drop it from the queue if present).
    if (!activeId) {
      commitGame({
        ...game,
        research: {
          ...game.research,
          activeId: id,
          queue: queue.filter((q) => q !== id),
        },
      })
      return
    }
    // Clicking a queued tech removes it from the queue.
    if (queue.includes(id)) {
      commitGame({
        ...game,
        research: { ...game.research, queue: queue.filter((q) => q !== id) },
      })
      return
    }
    commitGame({
      ...game,
      research: { ...game.research, queue: [...queue, id] },
    })
  }

  function startBuild(key: string) {
    if (!game) return
    if (!unlockedBuildingKeys(game.research.completed).includes(key)) return
    const { activeKey } = game.construction
    const queue = game.construction.queue ?? []

    // Clicking the active build cancels it and discards its progress, then
    // starts the next queued building.
    if (activeKey === key) {
      const [next, ...rest] = queue
      commitGame({
        ...game,
        construction: { activeKey: next ?? null, progress: 0, queue: rest },
      })
      return
    }
    // Nothing active: start now (and drop it from the queue if present).
    if (!activeKey) {
      commitGame({
        ...game,
        construction: {
          ...game.construction,
          activeKey: key,
          progress: 0,
          queue: queue.filter((q) => q !== key),
        },
      })
      return
    }
    // Clicking a queued building removes it from the queue.
    if (queue.includes(key)) {
      commitGame({
        ...game,
        construction: {
          ...game.construction,
          queue: queue.filter((q) => q !== key),
        },
      })
      return
    }
    commitGame({
      ...game,
      construction: { ...game.construction, queue: [...queue, key] },
    })
  }

  function setProduction(key: string, optionId: string | null) {
    if (!game) return
    if (!(key in BUILDING_PRODUCTION_OPTIONS)) return
    if (optionId !== null && !BUILDING_PRODUCTION_OPTIONS[key].some((o) => o.id === optionId)) return
    commitGame({
      ...game,
      production: {
        ...game.production,
        assignments: { ...game.production.assignments, [key]: optionId },
      },
    })
  }

  function setMealInterval(hours: number) {
    if (!game) return
    setGame({
      ...game,
      politics: { ...game.politics, mealIntervalHours: clampMealIntervalHours(hours) },
    })
  }

  const totalAllocated = draft.reduce((sum, v) => sum + v, 0)
  const free = population - totalAllocated
  const hasChanges = draft.some((v, i) => v !== applied[i])
  const canApply = hasChanges && free >= 0
  const mealTicks = game ? mealIntervalTicks(game) : 0
  const ticksUntilMeal = game ? mealTicks - (game.tick % mealTicks) : 0

  return (
    <div className="bg-black/95 min-h-screen p-2 flex flex-col gap-2 text-white/80 ibm-plex-mono-regular">
      <header className="px-2">
        {inGame && game ? (
          <h1><span className="text-amber-200 font-semibold">{game.name}</span> | {t.leader} <span className="text-green-300 font-semibold">{game.leader}</span> | {t.era} <span className="text-cyan-200 font-semibold">{eraName(game.era, lang)}</span> | {t.nextTick} <span className="text-cyan-200 font-semibold">{t.seconds(tickTimeCounter)}</span>{saveError && <span className="text-red-400"> | {t.saveFailed}</span>} | &gt;_</h1>
        ) : isLoggedIn ? (
          <h1><span className="text-amber-200 font-semibold">{t.civilizationOnline}</span> | {t.nextTick} <span className="text-cyan-200 font-semibold">{t.seconds(tickTimeCounter)}</span> | &gt;_</h1>
        ) : (
          <h1><span className="text-amber-200 font-semibold">{t.civilizationOnline}</span> | &gt;_</h1>
        )}
      </header>
      <section className="grid grid-cols-[20%_1fr] border">
        <div className="flex flex-col">
          <div className="p-2">
            {!authReady ? (
              <p className="px-1 text-white/60">{t.checkingSession}</p>
            ) : !isLoggedIn ? (
              <>
                <h2 className="text-green-400 font-semibold">&gt; {authMode === "login" ? t.loginTitle : t.registerTitle}</h2>
                <form onSubmit={handleLogin} className="flex flex-col gap-2 px-1 pt-2">
                  <label className="flex flex-col gap-1">
                    <span>{t.usernameLabel}</span>
                    <input
                      type="text"
                      value={loginName}
                      onChange={(e) => setLoginName(e.target.value.toLowerCase().slice(0, 16))}
                      placeholder={t.enterUsername}
                      autoComplete="username"
                      autoFocus
                      className="bg-black border border-white/20 px-2 py-1 text-white/80 outline-none focus:border-green-400"
                    />
                  </label>
                  {authMode === "register" && (
                    <label className="flex flex-col gap-1">
                      <span>{t.displayNameLabel}</span>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value.slice(0, 20))}
                        placeholder={t.enterDisplayName}
                        autoComplete="nickname"
                        className="bg-black border border-white/20 px-2 py-1 text-white/80 outline-none focus:border-green-400"
                      />
                    </label>
                  )}
                  <label className="flex flex-col gap-1">
                    <span>{t.passwordLabel}</span>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder={t.enterPassword}
                      autoComplete={authMode === "login" ? "current-password" : "new-password"}
                      className="bg-black border border-white/20 px-2 py-1 text-white/80 outline-none focus:border-green-400"
                    />
                  </label>
                  {authError && (
                    <p className="text-red-400">{authError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={authPending || !loginName.trim() || !loginPassword}
                    className="border border-green-400/50 px-2 py-1 text-green-300 hover:bg-green-400/10 text-left disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {authPending ? "..." : authMode === "login" ? t.enterLogin : t.enterRegister}
                  </button>
                </form>
                <p className="px-1 pt-2 text-white/60">
                  {authMode === "login" ? t.noAccount : t.haveAccount}{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode(authMode === "login" ? "register" : "login")
                      setAuthError("")
                    }}
                    className="text-green-300 underline hover:text-green-200"
                  >
                    {authMode === "login" ? t.registerTitle : t.loginTitle}
                  </button>
                </p>
              </>
            ) : gameLoading ? (
              <p className="px-1 text-white/60">{t.loadingCivilization}</p>
            ) : loadError ? (
              <>
                <p className="px-1 pt-2 text-red-400">{t.loadFailed(loadError)}</p>
                <button
                  type="button"
                  onClick={() => { void hydrateGame() }}
                  className="mt-2 border border-green-400/50 px-2 py-1 text-green-300 hover:bg-green-400/10"
                >
                  {t.retryButton}
                </button>
              </>
            ) : !inGame ? (
              <>
                <h2 className="text-green-400 font-semibold">&gt; {t.newTribeTitle}</h2>
                <p className="px-1 pt-2">{t.newTribeIntro}</p>
                <form onSubmit={handleTribe} className="flex flex-col gap-2 px-1 pt-2">
                  <input
                    type="text"
                    value={tribeInput}
                    onChange={(e) => setTribeInput(e.target.value)}
                    placeholder={t.enterTribeName}
                    autoFocus
                    className="bg-black border border-white/20 px-2 py-1 text-white/80 outline-none focus:border-green-400"
                  />
                  <input
                    type="text"
                    value={civInput}
                    onChange={(e) => setCivInput(e.target.value)}
                    placeholder={t.enterCivilizationName}
                    className="bg-black border border-white/20 px-2 py-1 text-white/80 outline-none focus:border-green-400"
                  />
                  <button
                    type="submit"
                    className="border border-green-400/50 px-2 py-1 text-green-300 hover:bg-green-400/10 text-left"
                  >
                    {t.enterBegin}
                  </button>
                </form>
              </>
            ) : (
              <>
                <h2 className="text-green-400 font-semibold">&gt; {t.mainMenuTitle}</h2>
                {MENU_VIEWS.map((view) => (
                  <p
                    key={view}
                    onClick={() => selectView(view)}
                    className={`${currentView === view ? "current-view" : ""} px-1 cursor-pointer hover:bg-white/5`}
                  >
                    [<span className="text-amber-500">{MENU_SHORTCUTS[view]}</span>] {t.views[view]}
                  </p>
                ))}
                <p
                  onClick={() => setCurrentView("Help")}
                  className={`${currentView === "Help" ? "current-view" : ""} px-1 cursor-pointer hover:bg-white/5`}
                >
                  [<span className="text-white">?</span>] {t.help}
                </p>
                <p
                  onClick={toggleSettings}
                  className={`${currentView === "Settings" ? "current-view" : ""} px-1 cursor-pointer hover:bg-white/5`}
                >
                  [<span className="text-red-900">Esc</span>] {t.settings}
                </p>
              </>
            )}
          </div>
        </div>
        <div className="min-w-0 p-2 border-l">
          {inGame && game ? (
            <>
              {currentView === "Overview" ? (
                <div className="pt-2">
                  <h3 className="text-green-400 font-semibold">&gt; {t.views.Overview}</h3>
                  <p className="px-1">
                    {t.populationLabel} <span className="text-amber-200 font-semibold">{game.overview.population}</span>
                    {" / "}
                    <span className="text-white/60">{popLimit}</span>
                    {" | "}{t.allocatedLabel}{" "}
                    <span className={free < 0 ? "text-red-400 font-semibold" : "text-cyan-200 font-semibold"}>
                      {totalAllocated}
                    </span>
                    {" | "}{t.freeLabel}{" "}
                    <span className={free < 0 ? "text-red-400 font-semibold" : "text-green-300 font-semibold"}>
                      {free}
                    </span>
                  </p>
                  <p className="px-1">
                    {t.nextMealLabel} <span className="text-amber-200 font-semibold">{t.nextMealIn(formatTicks(ticksUntilMeal, lang))}</span>
                    {" "}
                    <span className="text-white/60">{t.everyHours(game.politics.mealIntervalHours)}</span>
                  </p>
                  {free < 0 && (
                    <p className="px-1 text-red-400">{t.overAllocated(-free)}</p>
                  )}
                  <div className="flex flex-col gap-1 pt-2 max-w-md">
                    {ALLOCATION_CATEGORIES.map((cat, i) => (
                      <div key={cat} className="grid grid-cols-[100px_minmax(0,1fr)_110px] sm:grid-cols-[130px_minmax(0,1fr)_130px] items-center gap-2 px-1">
                        <span className="truncate">{t.views[cat]}:</span>
                        <input
                          type="range"
                          aria-label={t.sliderAria(t.views[cat])}
                          min={0}
                          max={population}
                          value={draft[i] ?? 0}
                          onChange={(e) =>
                            setDraft((prev) =>
                              prev.map((v, j) => (j === i ? Number(e.target.value) : v))
                            )
                          }
                          className="w-full min-w-0 accent-emerald-400"
                        />
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            aria-label={t.decreaseAria(t.views[cat])}
                            onClick={() =>
                              setDraft((prev) =>
                                prev.map((v, j) => (j === i ? Math.max(0, (v ?? 0) - 1) : v))
                              )
                            }
                            className="border border-white/20 px-1.5 text-green-300 hover:bg-green-400/10"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            aria-label={t.amountAria(t.views[cat])}
                            min={0}
                            max={population}
                            value={draft[i] ?? 0}
                            onChange={(e) => {
                              const next = Math.max(0, Math.min(population, Math.floor(Number(e.target.value) || 0)));
                              setDraft((prev) => prev.map((v, j) => (j === i ? next : v)));
                            }}
                            className="alloc-number w-full min-w-0 bg-black border border-white/20 px-1 text-right text-amber-200 outline-none focus:border-green-400"
                          />
                          <button
                            type="button"
                            aria-label={t.increaseAria(t.views[cat])}
                            onClick={() =>
                              setDraft((prev) =>
                                prev.map((v, j) => (j === i ? Math.min(population, (v ?? 0) + 1) : v))
                              )
                            }
                            className="border border-white/20 px-1.5 text-green-300 hover:bg-green-400/10"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-1 pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      disabled={!canApply}
                      onClick={applyDraft}
                      className="border border-green-400/50 px-2 py-1 text-green-300 hover:bg-green-400/10 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {t.applyButton}
                    </button>
                    {hasChanges && free >= 0 && (
                      <span className="text-amber-200">{t.unsavedChanges}</span>
                    )}
                  </div>
                </div>
              ) : currentView === "Resources" ? (
                <div className="pt-2">
                  <h3 className="text-green-400 font-semibold">&gt; {t.views.Resources}</h3>
                  <p className="px-1 text-white/60">
                    {t.netChange(game?.politics.mealIntervalHours ?? DEFAULT_MEAL_INTERVAL_HOURS)}
                  </p>
                  {game && (() => {
                    const rates = resourceRatesPerHour(game);
                    const keys = [...new Set([
                      ...Object.keys(game.resources.stockpile),
                      ...Object.keys(rates),
                    ])].filter(
                      (key) =>
                        (game.resources.stockpile[key] ?? 0) > 0 || key in rates
                    );
                    if (keys.length === 0) {
                      return <p className="px-1">{t.noResources}</p>;
                    }
                    return keys.map((key) => {
                      const stock = game.resources.stockpile[key] ?? 0;
                      const net = rates[key]?.net ?? 0;
                      const rateClass =
                        net > 0
                          ? "text-green-300"
                          : net < 0
                            ? "text-red-400"
                            : "text-white/40";
                      return (
                        <p key={key} className="px-1 capitalize">
                          - {resourceLabel(key, lang)}{" "}
                          <span className={`${rateClass} font-semibold`}>({t.perHour(formatRate(net))})</span>:{" "}
                          <span className="text-amber-200 font-semibold">{Math.floor(stock * 100) / 100}</span>
                        </p>
                      );
                    });
                  })()}
                </div>
              ) : currentView === "Research" ? (
                <div className="pt-2">
                  <h3 className="text-green-400 font-semibold">&gt; {t.views.Research}</h3>
                  {game && (
                    <>
                      {(game.overview.allocation[ALLOCATION_CATEGORIES.indexOf("Research")] ?? 0) === 0 && (
                        <p className="px-1 text-red-400 font-semibold">{t.assignResearch}</p>
                      )}
                      <p className="px-1">
                        {t.researchersLabel} <span className="text-amber-200 font-semibold">{game.overview.allocation[ALLOCATION_CATEGORIES.indexOf("Research")] ?? 0}</span>
                        {" | "}<span className="text-cyan-200 font-semibold">{t.researchPoints(researchPerTick(game))}</span>
                      </p>
                      {game.research.activeId && TECHNOLOGIES[game.research.activeId] ? (
                        <p className="px-1">
                          {t.activeLabel} <span className="text-amber-200 font-semibold">{techName(game.research.activeId, lang)}</span>
                          {" "}{game.research.progress[game.research.activeId] ?? 0}/{TECHNOLOGIES[game.research.activeId].cost}
                          <ProgressBox done={game.research.progress[game.research.activeId] ?? 0} total={TECHNOLOGIES[game.research.activeId].cost} />
                          {(() => {
                            const eta = ticksToCompleteResearch(game);
                            if (eta === null) return null;
                            return <span className="text-white/60"> ({eta <= 1 ? t.seconds(tickTimeCounter) : formatTicks(eta, lang)})</span>;
                          })()}
                          <button
                            type="button"
                            onClick={() => startResearch(game.research.activeId as string)}
                            className="ml-2 border border-red-400/50 px-1 text-red-300 hover:bg-red-400/10"
                          >
                            {t.cancelButton}
                          </button>
                        </p>
                      ) : (
                        <p className="px-1 text-white/60">{t.noActiveResearch}</p>
                      )}
                      {researchQueue.length > 0 && (
                        <div className="px-1 pt-1">
                          <p className="text-white/60">{t.researchQueueLabel}</p>
                          {researchQueue.map((id, i) => (
                            <p key={id}>
                              {i + 1}. {techName(id, lang)}{" "}
                              <button
                                type="button"
                                onClick={() => startResearch(id)}
                                className="ml-1 border border-red-400/50 px-1 text-red-300 hover:bg-red-400/10"
                              >
                                {t.removeButton}
                              </button>
                            </p>
                          ))}
                        </div>
                      )}
                      <div className="px-1 pt-1">
                        <ResearchTree game={game} tickTimeCounter={tickTimeCounter} onSelect={startResearch} lang={lang} />
                      </div>
                    </>
                  )}
                </div>
              ) : currentView === "Production" ? (
                <div className="pt-2">
                  <h3 className="text-green-400 font-semibold">&gt; {t.views.Production}</h3>
                  {game && (
                    <p className="px-1">
                      {t.workersLabel} <span className="text-amber-200 font-semibold">{game.overview.allocation[ALLOCATION_CATEGORIES.indexOf("Production")] ?? 0}</span>
                      {" | "}<span className="text-cyan-200 font-semibold">{t.laborPoints(laborPerTick(game))}</span>
                    </p>
                  )}
                  <p className="px-1 text-white/60">{t.productionHint}</p>
                  {game && (() => {
                    const owned: { key: string; name: string; count: number }[] = [];
                    for (const buildings of Object.values(game.infrastructure)) {
                      for (const [key, b] of Object.entries(buildings)) {
                        if (b.count > 0 && BUILDING_PRODUCTION_OPTIONS[key]) {
                          owned.push({ key, name: buildingName(key, lang), count: b.count });
                        }
                      }
                    }
                    if (owned.length === 0) {
                      return <p className="px-1 pt-1">{t.noProductiveBuildings}</p>;
                    }
                    return owned.map(({ key, name, count }) => {
                      const options = BUILDING_PRODUCTION_OPTIONS[key];
                      const selected = game.production.assignments[key] ?? null;
                      const selectedOption = options.find((o) => o.id === selected) ?? null;
                      const perHour = (o: (typeof options)[number]) =>
                        (o.amount * TICKS_PER_HOUR) / o.everyTicks;
                      return (
                        <div key={key} className="px-1 pt-1">
                          <p>
                            - {name} x<span className="text-amber-200 font-semibold">{count}</span>
                            {" "}
                            {selectedOption ? (
                              <span className="text-green-300">
                                {t.producing(
                                  recipeLabel(selectedOption.id, lang),
                                  formatRate(perHour(selectedOption)),
                                  resourceLabel(selectedOption.resource, lang)
                                )}
                              </span>
                            ) : (
                              <span className="text-red-400">{t.inactiveLabel}</span>
                            )}
                          </p>
                          <p className="pl-2 text-white/60">
                            {t.productionPrefix}
                            <button
                              type="button"
                              onClick={() => setProduction(key, null)}
                              className={selected === null
                                ? "ml-2 border border-amber-400/70 px-1 text-amber-200"
                                : "ml-2 border border-white/20 px-1 text-white/60 hover:bg-white/5"}
                            >
                              {t.inactiveButton}
                            </button>
                            {options.map((o) => {
                              const isActive = selected === o.id;
                              return (
                                <button
                                  key={o.id}
                                  type="button"
                                  title={t.optionTitle(
                                    recipeLabel(o.id, lang),
                                    formatRate(perHour(o)),
                                    resourceLabel(o.resource, lang)
                                  )}
                                  onClick={() => setProduction(key, o.id)}
                                  className={isActive
                                    ? "ml-1 border border-amber-400/70 px-1 text-amber-200"
                                    : "ml-1 border border-green-400/50 px-1 text-green-300 hover:bg-green-400/10"}
                                >
                                  [{recipeLabel(o.id, lang)} {t.perHour(`${formatRate(perHour(o))} ${resourceLabel(o.resource, lang)}`)}]
                                </button>
                              );
                            })}
                          </p>
                        </div>
                      );
                    });
                  })()}
                </div>
              ) : currentView === "Infrastructure" ? (
                <div className="pt-2">
                  <h3 className="text-green-400 font-semibold">&gt; {t.views.Infrastructure}</h3>
                  {game && (
                    <p className="px-1">
                      {t.workersLabel} <span className="text-amber-200 font-semibold">{game.overview.allocation[ALLOCATION_CATEGORIES.indexOf("Infrastructure")] ?? 0}</span>
                      {" | "}<span className="text-cyan-200 font-semibold">{t.laborPoints(infraLaborPerTick(game))}</span>
                    </p>
                  )}
                  {game?.construction.activeKey && (
                    <p className="px-1">
                      {t.buildingLabel} <span className="text-amber-200 font-semibold">{buildingName(game.construction.activeKey, lang)}</span>
                      {" "}{game.construction.progress}/{buildingNextCost(game.construction.activeKey, ownedBuildingCount(game.infrastructure, game.construction.activeKey)) ?? "?"}
                      {(() => {
                        const total = buildingNextCost(game.construction.activeKey as string, ownedBuildingCount(game.infrastructure, game.construction.activeKey as string)) ?? 0;
                        return <ProgressBox done={game.construction.progress} total={total} />;
                      })()}
                      {(() => {
                        const eta = ticksToCompleteBuild(game);
                        if (eta === null) return null;
                        return <span className="text-white/60"> ({eta <= 1 ? t.seconds(tickTimeCounter) : formatTicks(eta, lang)})</span>;
                      })()}
                    </p>
                  )}
                  {game && constructionQueue.length > 0 && (
                    <div className="px-1 pt-1">
                      <p className="text-white/60">{t.buildQueueLabel}</p>
                      {constructionQueue.map((queuedKey, i) => (
                        <p key={queuedKey}>
                          {i + 1}. {buildingName(queuedKey, lang)}{" "}
                          <button
                            type="button"
                            onClick={() => startBuild(queuedKey)}
                            className="ml-1 border border-red-400/50 px-1 text-red-300 hover:bg-red-400/10"
                          >
                            {t.removeButton}
                          </button>
                        </p>
                      ))}
                    </div>
                  )}
                  {Object.entries(game.infrastructure).map(([group, buildings]) => {
                    const owned = Object.entries(buildings).filter(([, b]) => b.count > 0)
                    if (owned.length === 0) return null
                    return (
                      <div key={group}>
                        <p className="px-1 pt-1 text-white/60 capitalize">{buildingGroupName(group, lang)}:</p>
                        {owned.map(([key, b]) => (
                          <p key={key} className="px-1">
                            - {buildingName(key, lang)} x<span className="text-amber-200 font-semibold">{b.count}</span>
                          </p>
                        ))}
                      </div>
                    )
                  })}
                  <p className="px-1 pt-1 text-white/60">{t.buildUnlocked}</p>
                  {game &&
                    unlockedBuildingKeys(game.research.completed).map((key) => {
                      const owned = ownedBuildingCount(game.infrastructure, key);
                      const isActive = game.construction.activeKey === key;
                      const isQueued = constructionQueue.includes(key);
                      const eta = ticksToCompleteBuildFor(game, key);
                      return (
                        <p key={key} className="px-1">
                          - {buildingName(key, lang)} x{owned} ({eta !== null ? (eta <= 1 ? t.seconds(tickTimeCounter) : formatTicks(eta, lang)) : t.assignWorkers})
                          {isQueued && (
                            <span className="text-cyan-200"> [{t.queuedLabel}]</span>
                          )}
                          <button
                            type="button"
                            onClick={() => startBuild(key)}
                            className={isActive || isQueued
                              ? "ml-2 border border-red-400/50 px-1 text-red-300 hover:bg-red-400/10"
                              : "ml-2 border border-green-400/50 px-1 text-green-300 hover:bg-green-400/10"}
                          >
                            {isActive || isQueued ? t.cancelButton : t.buildButton}
                          </button>
                        </p>
                      );
                    })}
                </div>
              ) : currentView === "Politics" ? (
                <div className="pt-2">
                  <h3 className="text-green-400 font-semibold">&gt; {t.views.Politics}</h3>
                  {game && (() => {
                    const hours = game.politics.mealIntervalHours
                    const happiness = game.politics.happiness
                    const target = happinessTarget(game)
                    const foodPerHour = foodConsumptionPerTick(game) * TICKS_PER_HOUR
                    const mood =
                      happiness >= 75 ? t.moods.content
                        : happiness >= 50 ? t.moods.uneasy
                          : happiness >= 25 ? t.moods.angry
                            : t.moods.revolting
                    const moodClass =
                      happiness >= 75 ? "text-green-300"
                        : happiness >= 50 ? "text-amber-200"
                          : "text-red-400"
                    const trend =
                      target > happiness + 0.5 ? "rising"
                        : target < happiness - 0.5 ? "falling"
                          : "steady"
                    return (
                      <>
                        <p className="px-1">
                          {t.legitimacyLabel} <span className="text-amber-200 font-semibold">{game.politics.legitimacy}</span>
                        </p>
                        <p className="px-1">
                          {t.happinessLabel} <span className={`${moodClass} font-semibold`}>{Math.round(happiness)}</span>
                          <span className="text-white/60">
                            {" "}/ 100 ({mood}{t.trendLabel(trend, Math.round(target))})
                          </span>
                        </p>
                        <p className="px-1 pt-2">
                          {t.mealIntervalLabel} <span className="text-amber-200 font-semibold">{t.durationHours(hours)}</span>
                          <span className="text-white/60"> {t.mealIntervalHint}</span>
                        </p>
                        <div className="flex items-center gap-2 px-1 pt-1 max-w-md">
                          <span className="text-white/60">{t.durationHours(MIN_MEAL_INTERVAL_HOURS)}</span>
                          <input
                            type="range"
                            aria-label={t.mealIntervalAria}
                            min={MIN_MEAL_INTERVAL_HOURS}
                            max={MAX_MEAL_INTERVAL_HOURS}
                            step={1}
                            value={hours}
                            onChange={(e) => setMealInterval(Number(e.target.value))}
                            className="w-full min-w-0 accent-emerald-400"
                          />
                          <span className="text-white/60">{t.durationHours(MAX_MEAL_INTERVAL_HOURS)}</span>
                        </div>
                        <p className="px-1 pt-1 text-white/60">
                          {t.foodPerMeal(mealNeed(game), formatRate(-foodPerHour))}
                        </p>
                        {hours > DEFAULT_MEAL_INTERVAL_HOURS ? (
                          <p className="px-1 text-red-400">{t.intervalLong}</p>
                        ) : hours < DEFAULT_MEAL_INTERVAL_HOURS ? (
                          <p className="px-1 text-green-300">{t.intervalShort}</p>
                        ) : (
                          <p className="px-1 text-white/60">{t.intervalDefault}</p>
                        )}
                      </>
                    )
                  })()}
                </div>
              ) : currentView === "Help" ? (
                <Civipedia game={game} lang={lang} />
              ) : currentView === "Settings" ? (
                <div className="pt-2">
                  <h3 className="text-green-400 font-semibold">&gt; {t.views.Settings}</h3>
                  <p className="px-1 pt-1">{t.languageLabel}</p>
                  <p className="px-1 text-white/60">{t.languageHint}</p>
                  <div className="flex flex-wrap gap-2 px-1 pt-2">
                    {LANGUAGE_ORDER.map((code) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => changeLanguage(code)}
                        className={code === lang
                          ? "border border-amber-400/70 px-2 py-1 text-amber-200"
                          : "border border-green-400/50 px-2 py-1 text-green-300 hover:bg-green-400/10"}
                      >
                        {code === lang ? "[*]" : "[ ]"} {LANGUAGE_NAMES[code]}
                      </button>
                    ))}
                  </div>
                  {account && (
                    <div className="px-1 pt-5">
                      <p>
                        {t.accountLabel}{" "}
                        <span className="text-amber-200 font-semibold">{account.username}</span>
                      </p>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="mt-2 border border-red-400/50 px-2 py-1 text-red-300 hover:bg-red-400/10"
                      >
                        {t.logoutButton}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="pt-2">
                  <h3 className="text-green-400 font-semibold">&gt; {t.views[currentView]}</h3>
                </div>
              )}
            </>
          ) : null}
        </div>
      </section>
    </div>
  );
}
