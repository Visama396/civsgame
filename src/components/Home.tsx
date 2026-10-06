import { useEffect, useState } from "react";
import {
  ALLOCATION_CATEGORIES,
  createCivilization,
  populationLimit,
  type Civilization,
} from "../data/civilization";
import {
  FOOD_CONSUMPTION_INTERVAL_TICKS,
  advanceTick,
  clampAllocation,
  formatTicks,
  infraLaborPerTick,
  researchPerTick,
  ticksToCompleteBuild,
  ticksToCompleteBuildFor,
  ticksToCompleteResearch,
} from "../data/simulation";
import {
  buildingNextCost,
  buildingName,
  ownedBuildingCount,
  unlockedBuildingKeys,
} from "../data/infrastructure";
import { TECHNOLOGIES } from "../data/technologies";
import ResearchTree from "./ResearchTree";

const MENU_VIEWS = [
  "Overview",
  ...ALLOCATION_CATEGORIES,
] as const;

type MenuView = (typeof MENU_VIEWS)[number];

const MENU_SHORTCUTS: Record<string, string> = {
  Overview: "1",
  Resources: "2",
  Industry: "3",
  Economy: "4",
  Research: "5",
  Infrastructure: "6",
  Military: "7",
  Politics: "8",
  Intelligence: "9",
};

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loginName, setLoginName] = useState("")
  const [leader, setLeader] = useState("")
  const [tribeInput, setTribeInput] = useState("")
  const [civInput, setCivInput] = useState("")
  const [game, setGame] = useState<Civilization | null>(null)
  const [tickTimeCounter, setTickTimeCounter] = useState(60)
  // Transient slider edits; committed into game.overview.allocation via [Apply].
  const [draft, setDraft] = useState<number[]>([]);
  const [currentView, setCurrentView] = useState<MenuView>("Overview");

  const inGame = game !== null
  const population = game?.overview.population ?? 0
  const applied = game?.overview.allocation ?? []
  const popLimit = game ? populationLimit(game) : 0

  useEffect(() => {
    const id = setInterval(() => {
      setTickTimeCounter((prev) => (prev <= 1 ? 60 : prev - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [])

  // Simulation tick every 60s real time (1 tick = 1 minute game time).
  useEffect(() => {
    if (!inGame) return
    const id = setInterval(() => {
      setGame((prev) => (prev ? advanceTick(prev) : prev))
    }, 60000)
    return () => clearInterval(id)
  }, [inGame])

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

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    const name = loginName.trim()
    if (!name) return
    setLeader(name)
    setIsLoggedIn(true)
  }

  function handleTribe(e: React.FormEvent) {
    e.preventDefault()
    const tribe = tribeInput.trim()
    const civ = civInput.trim()
    if (!tribe || !civ) return
    const fresh = createCivilization({ leader, tribe, name: civ })
    setGame(fresh)
    setDraft(fresh.overview.allocation)
  }

  function selectView(view: MenuView) {
    setCurrentView(view)
    if (game) setDraft(game.overview.allocation)
  }

  function applyDraft() {
    if (!game) return
    setGame({ ...game, overview: { ...game.overview, allocation: draft } })
  }

  function startResearch(id: string) {
    if (!game) return
    if (game.research.completed.includes(id)) return
    // Clicking the active tech cancels it; progress is kept in research.progress.
    if (game.research.activeId === id) {
      setGame({
        ...game,
        research: { ...game.research, activeId: null },
      })
      return
    }
    setGame({
      ...game,
      research: { ...game.research, activeId: id },
    })
  }

  function startBuild(key: string) {
    if (!game) return
    if (!unlockedBuildingKeys(game.research.completed).includes(key)) return
    // Clicking the active build cancels it and discards progress.
    if (game.construction.activeKey === key) {
      setGame({
        ...game,
        construction: { activeKey: null, progress: 0 },
      })
      return
    }
    setGame({
      ...game,
      construction: { activeKey: key, progress: 0 },
    })
  }

  const totalAllocated = draft.reduce((sum, v) => sum + v, 0)
  const free = population - totalAllocated
  const hasChanges = draft.some((v, i) => v !== applied[i])
  const canApply = hasChanges && free >= 0
  const ticksUntilMeal = game
    ? FOOD_CONSUMPTION_INTERVAL_TICKS - (game.tick % FOOD_CONSUMPTION_INTERVAL_TICKS)
    : 0

  return (
    <div className="bg-black/95 min-h-screen p-2 flex flex-col gap-2 text-white/80 ibm-plex-mono-regular">
      <header className="px-2">
        {inGame && game ? (
          <h1><span className="text-amber-200 font-semibold">{game.name}</span> | Leader: <span className="text-green-300 font-semibold">{game.leader}</span> | Era: <span className="text-cyan-200 font-semibold">{game.era}</span> | Next Tick: <span className="text-cyan-200 font-semibold">{tickTimeCounter}s</span> | &gt;_</h1>
        ) : isLoggedIn ? (
          <h1><span className="text-amber-200 font-semibold">Civilization Online</span> | Next Tick: <span className="text-cyan-200 font-semibold">{tickTimeCounter}s</span> | &gt;_</h1>
        ) : (
          <h1><span className="text-amber-200 font-semibold">Civilization Online</span> | &gt;_</h1>
        )}
      </header>
      <section className="grid grid-cols-[20%_1fr] border">
        <div className="flex flex-col">
          <div className="p-2">
            {!isLoggedIn ? (
              <>
                <h2 className="text-green-400 font-semibold">&gt; LOGIN</h2>
                <form onSubmit={handleLogin} className="flex flex-col gap-2 px-1 pt-2">
                  <label className="flex flex-col gap-1">
                    <span>Leader name:</span>
                    <input
                      type="text"
                      value={loginName}
                      onChange={(e) => setLoginName(e.target.value)}
                      placeholder="Enter name..."
                      autoFocus
                      className="bg-black border border-white/20 px-2 py-1 text-white/80 outline-none focus:border-green-400"
                    />
                  </label>
                  <button
                    type="submit"
                    className="border border-green-400/50 px-2 py-1 text-green-300 hover:bg-green-400/10 text-left"
                  >
                    [Enter] Login
                  </button>
                </form>
              </>
            ) : !inGame ? (
              <>
                <h2 className="text-green-400 font-semibold">&gt; NEW TRIBE</h2>
                <p className="px-1 pt-2">You and your people start leaving the caves, and venture into open world, until you find the perfect spot to start living.</p>
                <form onSubmit={handleTribe} className="flex flex-col gap-2 px-1 pt-2">
                  <input
                    type="text"
                    value={tribeInput}
                    onChange={(e) => setTribeInput(e.target.value)}
                    placeholder="Enter tribe name..."
                    autoFocus
                    className="bg-black border border-white/20 px-2 py-1 text-white/80 outline-none focus:border-green-400"
                  />
                  <input
                    type="text"
                    value={civInput}
                    onChange={(e) => setCivInput(e.target.value)}
                    placeholder="Enter civilization name..."
                    className="bg-black border border-white/20 px-2 py-1 text-white/80 outline-none focus:border-green-400"
                  />
                  <button
                    type="submit"
                    className="border border-green-400/50 px-2 py-1 text-green-300 hover:bg-green-400/10 text-left"
                  >
                    [Enter] Begin
                  </button>
                </form>
              </>
            ) : (
              <>
                <h2 className="text-green-400 font-semibold">&gt; MAIN MENU</h2>
                {MENU_VIEWS.map((view) => (
                  <p
                    key={view}
                    onClick={() => selectView(view)}
                    className={`${currentView === view ? "current-view" : ""} px-1 cursor-pointer hover:bg-white/5`}
                  >
                    [<span className="text-amber-500">{MENU_SHORTCUTS[view]}</span>] {view}
                  </p>
                ))}
                <p className="px-1">[<span className="text-white">?</span>] Help</p>
                <p className="px-1">[<span className="text-red-900">Esc</span>] Settings</p>
              </>
            )}
          </div>
        </div>
        <div className="min-w-0 p-2 border-l">
          {inGame && game ? (
            <>
              {currentView === "Overview" ? (
                <div className="pt-2">
                  <h3 className="text-green-400 font-semibold">&gt; OVERVIEW</h3>
                  <p className="px-1">
                    Population: <span className="text-amber-200 font-semibold">{game.overview.population}</span>
                    {" / "}
                    <span className="text-white/60">{popLimit}</span>
                    {" | "}Allocated:{" "}
                    <span className={free < 0 ? "text-red-400 font-semibold" : "text-cyan-200 font-semibold"}>
                      {totalAllocated}
                    </span>
                    {" | "}Free:{" "}
                    <span className={free < 0 ? "text-red-400 font-semibold" : "text-green-300 font-semibold"}>
                      {free}
                    </span>
                  </p>
                  <p className="px-1">
                    Next meal: <span className="text-amber-200 font-semibold">in {formatTicks(ticksUntilMeal)}</span>
                  </p>
                  {free < 0 && (
                    <p className="px-1 text-red-400">Over-allocated by {-free}. Reduce a slider.</p>
                  )}
                  <div className="flex flex-col gap-1 pt-2 max-w-md">
                    {ALLOCATION_CATEGORIES.map((cat, i) => (
                      <div key={cat} className="grid grid-cols-[100px_minmax(0,1fr)_110px] sm:grid-cols-[130px_minmax(0,1fr)_130px] items-center gap-2 px-1">
                        <span className="truncate">{cat}:</span>
                        <input
                          type="range"
                          aria-label={`${cat} slider`}
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
                            aria-label={`Decrease ${cat}`}
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
                            aria-label={`${cat} amount`}
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
                            aria-label={`Increase ${cat}`}
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
                      [Apply]
                    </button>
                    {hasChanges && free >= 0 && (
                      <span className="text-amber-200">Unsaved changes.</span>
                    )}
                  </div>
                </div>
              ) : currentView === "Resources" ? (
                <div className="pt-2">
                  <h3 className="text-green-400 font-semibold">&gt; RESOURCES</h3>
                  {game &&
                    Object.entries(game.resources.stockpile)
                      .filter(([key, value]) => key !== "food" && value > 0)
                      .map(([key, value]) => (
                        <p key={key} className="px-1 capitalize">
                          - {key}: <span className="text-amber-200 font-semibold">{Math.floor(value * 100) / 100}</span>
                        </p>
                      ))}
                </div>
              ) : currentView === "Research" ? (
                <div className="pt-2">
                  <h3 className="text-green-400 font-semibold">&gt; RESEARCH</h3>
                  {game && (
                    <>
                      <p className="px-1">
                        Researchers: <span className="text-amber-200 font-semibold">{game.overview.allocation[ALLOCATION_CATEGORIES.indexOf("Research")] ?? 0}</span>
                        {" | "}+<span className="text-cyan-200 font-semibold">{researchPerTick(game)}</span> Research pts
                      </p>
                      {game.research.activeId && TECHNOLOGIES[game.research.activeId] ? (
                        <p className="px-1">
                          Active: <span className="text-amber-200 font-semibold">{TECHNOLOGIES[game.research.activeId].name}</span>
                          {" "}{game.research.progress[game.research.activeId] ?? 0}/{TECHNOLOGIES[game.research.activeId].cost}
                          {(() => {
                            const eta = ticksToCompleteResearch(game);
                            if (eta === null) return null;
                            return <span className="text-white/60"> ({eta <= 1 ? `${tickTimeCounter}s` : formatTicks(eta)})</span>;
                          })()}
                          <button
                            type="button"
                            onClick={() => startResearch(game.research.activeId as string)}
                            className="ml-2 border border-red-400/50 px-1 text-red-300 hover:bg-red-400/10"
                          >
                            [Cancel]
                          </button>
                        </p>
                      ) : (
                        <p className="px-1 text-white/60">No active research. Pick a bright node below.</p>
                      )}
                      <div className="px-1 pt-1">
                        <ResearchTree game={game} tickTimeCounter={tickTimeCounter} onSelect={startResearch} />
                      </div>
                    </>
                  )}
                </div>
              ) : currentView === "Infrastructure" ? (
                <div className="pt-2">
                  <h3 className="text-green-400 font-semibold">&gt; INFRASTRUCTURE</h3>
                  {game && (
                    <p className="px-1">
                      Workers: <span className="text-amber-200 font-semibold">{game.overview.allocation[ALLOCATION_CATEGORIES.indexOf("Infrastructure")] ?? 0}</span>
                      {" | "}+<span className="text-cyan-200 font-semibold">{infraLaborPerTick(game)}</span> Labor pts
                    </p>
                  )}
                  {game?.construction.activeKey && (
                    <p className="px-1">
                      Building: <span className="text-amber-200 font-semibold">{buildingName(game.construction.activeKey)}</span>
                      {" "}{game.construction.progress}/{buildingNextCost(game.construction.activeKey, ownedBuildingCount(game.infrastructure, game.construction.activeKey)) ?? "?"}
                      {(() => {
                        const eta = ticksToCompleteBuild(game);
                        if (eta === null) return null;
                        return <span className="text-white/60"> ({eta <= 1 ? `${tickTimeCounter}s` : formatTicks(eta)})</span>;
                      })()}
                    </p>
                  )}
                  {Object.entries(game.infrastructure).map(([group, buildings]) => {
                    const owned = Object.values(buildings).filter((b) => b.count > 0)
                    if (owned.length === 0) return null
                    return (
                      <div key={group}>
                        <p className="px-1 pt-1 text-white/60 capitalize">{group}:</p>
                        {owned.map((b) => (
                          <p key={b.name} className="px-1">
                            - {b.name} x<span className="text-amber-200 font-semibold">{b.count}</span>
                          </p>
                        ))}
                      </div>
                    )
                  })}
                  <p className="px-1 pt-1 text-white/60">Build (unlocked by research):</p>
                  {game &&
                    unlockedBuildingKeys(game.research.completed).map((key) => {
                      const owned = ownedBuildingCount(game.infrastructure, key);
                      const isActive = game.construction.activeKey === key;
                      const eta = ticksToCompleteBuildFor(game, key);
                      return (
                        <p key={key} className="px-1">
                          - {buildingName(key)} x{owned} ({eta !== null ? (eta <= 1 ? `${tickTimeCounter}s` : formatTicks(eta)) : "assign Workers"})
                          <button
                            type="button"
                            onClick={() => startBuild(key)}
                            className={isActive
                              ? "ml-2 border border-red-400/50 px-1 text-red-300 hover:bg-red-400/10"
                              : "ml-2 border border-green-400/50 px-1 text-green-300 hover:bg-green-400/10"}
                          >
                            {isActive ? "[Cancel]" : "[Build]"}
                          </button>
                        </p>
                      );
                    })}
                </div>
              ) : (
                <div className="pt-2">
                  <h3 className="text-green-400 font-semibold">&gt; {currentView.toUpperCase()}</h3>
                </div>
              )}
            </>
          ) : null}
        </div>
      </section>
    </div>
  );
}
