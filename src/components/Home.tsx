import { useEffect, useState } from "react";
import {
  ALLOCATION_CATEGORIES,
  createCivilization,
  populationLimit,
  type Civilization,
} from "../data/civilization";

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

  const totalAllocated = draft.reduce((sum, v) => sum + v, 0)
  const free = population - totalAllocated
  const hasChanges = draft.some((v, i) => v !== applied[i])
  const canApply = hasChanges && free >= 0

  return (
    <div className="bg-black/95 min-h-screen p-2 flex flex-col gap-2 text-white/80 ibm-plex-mono-regular">
      <header className="px-2">
        {inGame && game ? (
          <h1><span className="text-amber-200 font-semibold">{game.name}</span> | Leader: <span className="text-green-300 font-semibold">{game.leader}</span> | Era: <span className="text-cyan-200 font-semibold">{game.era}</span> | Next Tick: <span className="text-cyan-200 font-semibold">{tickTimeCounter}s</span> | &gt;_</h1>
        ) : (
          <h1><span className="text-amber-200 font-semibold">Civilization Online</span> | Next Tick: <span className="text-cyan-200 font-semibold">{tickTimeCounter}s</span> | &gt;_</h1>
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
                    {" | "}Free (unemployed):{" "}
                    <span className={free < 0 ? "text-red-400 font-semibold" : "text-green-300 font-semibold"}>
                      {free}
                    </span>
                  </p>
                  {free < 0 && (
                    <p className="px-1 text-red-400">Over-allocated by {-free}. Reduce a slider.</p>
                  )}
                  {hasChanges && free >= 0 && (
                    <p className="px-1 text-amber-200">Unsaved changes.</p>
                  )}
                  <div className="flex flex-col gap-1 pt-2">
                    {ALLOCATION_CATEGORIES.map((cat, i) => (
                      <label key={cat} className="grid grid-cols-[130px_1fr_50px] items-center gap-2 px-1">
                        <span>{cat}:</span>
                        <input
                          type="range"
                          min={0}
                          max={population}
                          value={draft[i] ?? 0}
                          onChange={(e) =>
                            setDraft((prev) =>
                              prev.map((v, j) => (j === i ? Number(e.target.value) : v))
                            )
                          }
                          className="w-full accent-emerald-400"
                        />
                        <span className="text-right text-amber-200">{draft[i] ?? 0}</span>
                      </label>
                    ))}
                  </div>
                  <div className="px-1 pt-2">
                    <button
                      type="button"
                      disabled={!canApply}
                      onClick={applyDraft}
                      className="border border-green-400/50 px-2 py-1 text-green-300 hover:bg-green-400/10 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      [Apply]
                    </button>
                  </div>
                </div>
              ) : currentView === "Infrastructure" ? (
                <div className="pt-2">
                  <h3 className="text-green-400 font-semibold">&gt; INFRASTRUCTURE</h3>
                  {Object.entries(game.infrastructure).map(([group, buildings]) => {
                    const owned = Object.values(buildings).filter((b) => b.count > 0)
                    if (owned.length === 0) return null
                    return (
                      <div key={group}>
                        <p className="px-1 pt-1 text-white/60 capitalize">{group}:</p>
                        {owned.map((b) => (
                          <p key={b.name} className="px-1">
                            - {b.name} x<span className="text-amber-200 font-semibold">{b.count}</span>
                            {b.capacityEach !== undefined && (
                              <span className="text-white/40"> (houses {b.capacityEach} each)</span>
                            )}
                          </p>
                        ))}
                      </div>
                    )
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
