import { ERAS, TECHNOLOGIES, availableTechs } from "../data/technologies";
import { formatTicks, ticksToCompleteTech } from "../data/simulation";
import type { Civilization } from "../data/civilization";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

const NODE_W = 150;
const NODE_H = 100;
const COL_GAP = 70;
const ERA_GAP = 110;
const ROW_GAP = 26;
const PAD = 10;
const HEADER_H = 26;
/** Max nodes stacked vertically in one sub-column before wrapping to a new
 *  column, so each era grows horizontally instead of one tall column.
 *  (Eras with explicit ERA_COLUMNS below ignore this.) */
const MAX_ROWS = 6;

/**
 * Explicit left-to-right columns for eras where the default depth-sorted
 * wrapping is hard to follow. Each tech's prerequisites sit in earlier
 * columns, so edges mostly run between adjacent columns instead of
 * crossing. Gaps control vertical breathing room:
 * - `null` = one full-row gap (a free node-sized slot),
 * - a number = a custom gap in row units (e.g. `0.5` = half gap,
 *   `2` = two full rows).
 * Eras not listed here keep the default wrapping behavior.
 */
const ERA_COLUMNS: Record<string, (string | number | null)[][]> = {
  "Ancient Age": [
    ["fishing", "theWheel", "agriculture", "hunting", null, "mysticism", 0.5, "mining"],
    ["sailing", "pottery", "animalHusbandry", "archery", "meditation", "polytheism", "masonry"],
    [2.5, "horsebackRiding", 0.5, "priesthood", "monotheism", 0.5, "bronzeWorking"],
    [null, "writing", 3.5, "metalCasting", "ironWorking"],
    [0.5, "aesthetics", 0.5, "mathematics", "alphabet", 0.5, "monarchy", null, "compass"],
  ],
  "Medieval Times": [
    ["literature", "calendar", "construction", "currency", 2, "machinery"],
    [0.5, "drama", 0.5, "engineering", 1.1, "codeOfLaws", 0.5, "feudalism", 0.9, "optics"],
    ["music", "philosophy", 1.5, "civilService", 0.5, "theology"],
    [2, "divineRight", 0.5, "paper", 1.6, "guilds"],
    [null, "nationalism", "printingPress", "education", "banking"],
  ],
  "Industrial Age": [
    ["constitution", "militaryTradition", "replaceableParts", "liberalism", "economics", "gunpowder"],
    ["democracy", "rifling", 0.5, "corporation", 0.5, "chemistry", 1.5, "astronomy"],
    [2, "steamPower", "steel", "militaryScience", 0.5, "scientificMethod" ],
    [1.5, "assemblyLine", "railroad", "physics", "communism", "biology"],
    ["artillery", "fascism", "combustion",1.5, "electricity", "medicine"],
  ],
  "Modern Time": [
    ["rocketry", 1.5, "flight", "fission", "radio", "refrigeration"],
    ["satellites", 0.5, "industrialism", "plastics", "massMedia", "computers"],
    ["advancedFlight", "laser", "composites", "ecology", 1.5, "superconductors"],
    ["stealth",2.5, "fiberOptics", "robotics", "genetics"],
    [3.5,"fusion"]
  ],
  "Future Age": [
    [5.5, "futureTech"],
  ],
};

interface NodePos {
  x: number;
  y: number;
}

type Status = "completed" | "active" | "available" | "locked";

const NODE_STYLE: Record<Status, string> = {
  completed: "border-green-400/70 bg-green-400/10 text-green-300",
  active: "border-amber-400 bg-amber-400/10 text-amber-200",
  available: "border-white/50 bg-black text-white/80 hover:bg-white/10 cursor-pointer",
  locked: "border-white/10 bg-black text-white/30 cursor-not-allowed",
};

function layout(): {
  pos: Record<string, NodePos>;
  eraSpans: { era: string; left: number; width: number }[];
  width: number;
  height: number;
} {
  // Each era gets as many side-by-side sub-columns as needed (wrapping after
  // MAX_ROWS), so eras stay grouped but the tree expands horizontally.
  const depthCache: Record<string, number> = {};
  function depth(id: string, visiting: string[] = []): number {
    if (depthCache[id] !== undefined) return depthCache[id];
    const tech = TECHNOLOGIES[id];
    if (!tech || tech.requiresAll.length === 0) {
      depthCache[id] = 0;
      return 0;
    }
    if (visiting.includes(id)) {
      depthCache[id] = 0;
      return 0;
    }
    const d =
      Math.max(
        ...tech.requiresAll.map((req) =>
          TECHNOLOGIES[req] ? depth(req, [...visiting, id]) : 0
        )
      ) + 1;
    depthCache[id] = d;
    return d;
  }

  const all = Object.values(TECHNOLOGIES);
  all.forEach((t) => depth(t.id));

  const pos: Record<string, NodePos> = {};
  const eraSpans: { era: string; left: number; width: number }[] = [];
  let xCursor = PAD;
  let tallestColumn = MAX_ROWS;
  ERAS.forEach((era) => {
    const explicit = ERA_COLUMNS[era];
    if (explicit) {
      // Use the hand-ordered columns, keeping gaps as vertical space; drop
      // stale ids and append any tech missing from the lists so no node
      // can silently disappear.
      const known = new Set<string>(
        explicit.flat().filter((id): id is string => typeof id === "string")
      );
      const cols: (string | number | null)[][] = explicit.map((col) => {
        const out: (string | number | null)[] = [];
        for (const id of col) {
          if (id === null || typeof id === "number") out.push(id);
          else if (TECHNOLOGIES[id]?.era === era) out.push(id);
        }
        return out;
      });
      for (const t of all) {
        if (t.era === era && !known.has(t.id)) cols[cols.length - 1].push(t.id);
      }
      cols.forEach((col, ci) => {
        // Fractional cursor so half-gaps (0.5) offset everything below them.
        let cursor = 0;
        for (const id of col) {
          if (id === null) cursor += 1;
          else if (typeof id === "number") cursor += Math.max(0, id);
          else {
            pos[id] = {
              x: xCursor + ci * (NODE_W + COL_GAP),
              y: PAD + HEADER_H + cursor * (NODE_H + ROW_GAP),
            };
            cursor += 1;
          }
        }
        tallestColumn = Math.max(tallestColumn, Math.ceil(cursor));
      });
      const spanWidth = cols.length * NODE_W + (cols.length - 1) * COL_GAP;
      eraSpans.push({ era, left: xCursor, width: spanWidth });
      xCursor += spanWidth + ERA_GAP;
      return;
    }
    // Prereq order first, so dependencies sit left of dependents inside the era.
    const techs = all
      .filter((t) => t.era === era)
      .sort((a, b) => depth(a.id) - depth(b.id) || a.name.localeCompare(b.name));
    const cols = Math.max(1, Math.ceil(techs.length / MAX_ROWS));
    techs.forEach((t, i) => {
      const col = Math.floor(i / MAX_ROWS);
      const row = i % MAX_ROWS;
      pos[t.id] = {
        x: xCursor + col * (NODE_W + COL_GAP),
        y: PAD + HEADER_H + row * (NODE_H + ROW_GAP),
      };
    });
    const spanWidth = cols * NODE_W + (cols - 1) * COL_GAP;
    eraSpans.push({ era, left: xCursor, width: spanWidth });
    xCursor += spanWidth + ERA_GAP;
  });
  return {
    pos,
    eraSpans,
    width: xCursor - ERA_GAP + PAD,
    height: PAD * 2 + HEADER_H + tallestColumn * NODE_H + (tallestColumn - 1) * ROW_GAP,
  };
}

function edgePath(from: NodePos, to: NodePos, sameColumn: boolean): string {
  if (sameColumn) {
    const x1 = from.x + NODE_W / 2;
    const y1 = from.y + NODE_H;
    const x2 = to.x + NODE_W / 2;
    const y2 = to.y;
    const dy = Math.max(14, Math.abs(y2 - y1) / 2) * (y2 >= y1 ? 1 : -1);
    return `M ${x1} ${y1} C ${x1} ${y1 + dy}, ${x2} ${y2 - dy}, ${x2} ${y2}`;
  }
  const x1 = from.x + NODE_W;
  const y1 = from.y + NODE_H / 2;
  const x2 = to.x;
  const y2 = to.y + NODE_H / 2;
  const dx = Math.max(24, (x2 - x1) / 2);
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

export default function ResearchTree({
  game,
  tickTimeCounter,
  onSelect,
}: {
  game: Civilization;
  tickTimeCounter: number;
  onSelect: (id: string) => void;
}) {
  const { pos, eraSpans, width, height } = layout();
  const available = new Set(availableTechs(game.research.completed).map((t) => t.id));
  const completed = new Set(game.research.completed);
  // Hovered (or keyboard-focused) node: its connected edges light up.
  const [hoverId, setHoverId] = useState<string | null>(null);
  // Mouse wheel scrolls the tree horizontally. Native listener (not React's
  // onWheel) so preventDefault works and the page doesn't scroll instead.
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      // Leave trackpad-style horizontal gestures and non-overflowing
      // containers alone.
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      if (el.scrollWidth <= el.clientWidth) return;
      // At either horizontal end, let the wheel scroll the page instead.
      const max = el.scrollWidth - el.clientWidth;
      const atEdge =
        e.deltaY > 0 ? el.scrollLeft >= max - 1 : el.scrollLeft <= 1;
      if (atEdge) return;
      e.preventDefault();
      el.scrollLeft += e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  function status(id: string): Status {
    if (completed.has(id)) return "completed";
    if (game.research.activeId === id) return "active";
    if (available.has(id)) return "available";
    return "locked";
  }

  /** Time to finish a tech, or "-- min" when no researchers are assigned. */
  function timeLabel(id: string): string {
    const eta = ticksToCompleteTech(game, id);
    if (eta === null) return "-- min";
    if (eta <= 1) return `${tickTimeCounter}s`;
    return formatTicks(eta);
  }

  function tooltipContent(id: string): ReactNode {
    const tech = TECHNOLOGIES[id];
    return (
      <div>
        <p className="font-semibold text-amber-200" style={{ fontSize: 12 }}>
          {tech.name}
        </p>
        <p
          className="uppercase text-white/40"
          style={{ fontSize: 10, letterSpacing: "0.08em" }}
        >
          {tech.era}
        </p>
        <p className="mt-1 text-white/80" style={{ fontSize: 11 }}>
          {tech.description}
        </p>
        {tech.requiresAll.length > 0 && (
          <div className="mt-1" style={{ fontSize: 11 }}>
            <p className="text-white/40">Requires:</p>
            {tech.requiresAll.map((r) => {
              const met = completed.has(r);
              return (
                <p
                  key={r}
                  className={met ? "text-green-300/80" : "text-red-400/90"}
                >
                  {met ? "✓" : "•"} {TECHNOLOGIES[r]?.name ?? r}
                </p>
              );
            })}
          </div>
        )}
        <p className="mt-1 text-white/50" style={{ fontSize: 11 }}>
          Cost {tech.cost} pts · {timeLabel(id)}
        </p>
      </div>
    );
  }

  const edges = Object.values(TECHNOLOGIES).flatMap((t) =>
    t.requiresAll
      .filter((req) => pos[req] && pos[t.id])
      .map((req) => {
        const sameColumn = pos[req].x === pos[t.id].x;
        const isActiveTarget = game.research.activeId === t.id;
        const isConnected =
          hoverId !== null && (req === hoverId || t.id === hoverId);
        const stroke = isConnected
          ? "rgba(251,191,36,0.9)"
          : hoverId !== null
            ? "rgba(255,255,255,0.06)"
            : isActiveTarget
              ? "rgba(251,191,36,0.55)"
              : "rgba(255,255,255,0.16)";
        return (
          <path
            key={`${req}->${t.id}`}
            d={edgePath(pos[req], pos[t.id], sameColumn)}
            fill="none"
            stroke={stroke}
            strokeWidth={isConnected ? 2 : isActiveTarget ? 1.6 : 1}
          />
        );
      })
  );

  return (
    <div>
      <TooltipProvider delayDuration={250}>
      <div ref={scrollRef} className="overflow-auto border border-white/10">
        <div className="relative" style={{ width, height }}>
          <svg className="absolute inset-0" width={width} height={height}>
            {edges}
          </svg>
          {eraSpans.map(({ era, left, width: spanWidth }) => (
            <div
              key={era}
              className="absolute text-left text-white/40 uppercase"
              style={{
                left,
                top: PAD,
                width: spanWidth,
                fontSize: 11,
                letterSpacing: "0.08em",
              }}
            >
              {era}
            </div>
          ))}
          {Object.values(TECHNOLOGIES).map((t) => {
            const p = pos[t.id];
            const st = status(t.id);
            const clickable = st === "available" || st === "active";
            return (
              <Tooltip key={t.id}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-disabled={!clickable}
                    onClick={() => {
                      if (clickable) onSelect(t.id);
                    }}
                    onMouseEnter={() => setHoverId(t.id)}
                    onMouseLeave={() => setHoverId(null)}
                    onFocus={() => setHoverId(t.id)}
                    onBlur={() => setHoverId(null)}
                    className={`absolute border px-1.5 py-1 text-left ${NODE_STYLE[st]}`}
                    style={{ left: p.x, top: p.y, width: NODE_W, height: NODE_H }}
                  >
                    <span className="block truncate" style={{ fontSize: 12 }}>
                      {t.name}
                      {st === "active" ? " [x]" : ""}
                    </span>
                    {st === "completed" ? (
                      <span className="block text-white/50" style={{ fontSize: 11 }}>
                        done
                      </span>
                    ) : (
                      <>
                        {t.requiresAll.map((r) => {
                          const met = completed.has(r);
                          return (
                            <span
                              key={r}
                              className={`block truncate ${met ? "text-green-400" : "text-red-400"}`}
                              style={{ fontSize: 11 }}
                            >
                              • {TECHNOLOGIES[r]?.name ?? r}
                            </span>
                          );
                        })}
                        <span className="block text-white/50" style={{ fontSize: 11 }}>
                          {timeLabel(t.id)}
                        </span>
                      </>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>{tooltipContent(t.id)}</TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
      </TooltipProvider>
    </div>
  );
}
