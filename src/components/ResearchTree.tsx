import { ERAS, TECHNOLOGIES, availableTechs } from "../data/technologies";
import { formatTicks, ticksToCompleteTech } from "../data/simulation";
import type { Civilization } from "../data/civilization";

const NODE_W = 150;
const NODE_H = 62;
const COL_GAP = 70;
const ROW_GAP = 26;
const PAD = 10;
const HEADER_H = 26;

interface NodePos {
  x: number;
  y: number;
}

type Status = "completed" | "active" | "available" | "locked";

const NODE_STYLE: Record<Status, string> = {
  completed: "border-green-400/70 bg-green-400/10 text-green-300",
  active: "border-amber-400 bg-amber-400/10 text-amber-200",
  available: "border-emerald-400/50 bg-black text-white/80 hover:bg-emerald-400/10 cursor-pointer",
  locked: "border-white/10 bg-black text-white/30 cursor-not-allowed",
};

function layout(): { pos: Record<string, NodePos>; width: number; height: number } {
  const pos: Record<string, NodePos> = {};
  let maxRows = 0;
  ERAS.forEach((era, eraIdx) => {
    const techs = Object.values(TECHNOLOGIES).filter((t) => t.era === era);
    maxRows = Math.max(maxRows, techs.length);
    techs.forEach((t, idx) => {
      pos[t.id] = {
        x: PAD + eraIdx * (NODE_W + COL_GAP),
        y: PAD + HEADER_H + idx * (NODE_H + ROW_GAP),
      };
    });
  });
  return {
    pos,
    width: PAD * 2 + ERAS.length * NODE_W + (ERAS.length - 1) * COL_GAP,
    height: PAD * 2 + HEADER_H + maxRows * NODE_H + (maxRows - 1) * ROW_GAP,
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
  const { pos, width, height } = layout();
  const available = new Set(availableTechs(game.research.completed).map((t) => t.id));
  const completed = new Set(game.research.completed);

  function status(id: string): Status {
    if (completed.has(id)) return "completed";
    if (game.research.activeId === id) return "active";
    if (available.has(id)) return "available";
    return "locked";
  }

  function subLabel(id: string, st: Status): string {
    if (st === "completed") return "done";
    if (st === "locked") {
      const tech = TECHNOLOGIES[id];
      const missing = tech.requiresAll.filter((r) => !completed.has(r));
      return missing.length > 0 ? `needs ${missing.length}` : "locked";
    }
    const eta = ticksToCompleteTech(game, id);
    if (eta === null) return st === "active" ? "stalled" : "assign Researchers";
    if (eta <= 1) return `${tickTimeCounter}s`;
    return formatTicks(eta);
  }

  const edges = Object.values(TECHNOLOGIES).flatMap((t) =>
    t.requiresAll
      .filter((req) => pos[req] && pos[t.id])
      .map((req) => {
        const sameColumn = TECHNOLOGIES[req].era === t.era;
        const isActiveTarget = game.research.activeId === t.id;
        return (
          <path
            key={`${req}->${t.id}`}
            d={edgePath(pos[req], pos[t.id], sameColumn)}
            fill="none"
            stroke={isActiveTarget ? "rgba(251,191,36,0.55)" : "rgba(255,255,255,0.16)"}
            strokeWidth={isActiveTarget ? 1.6 : 1}
          />
        );
      })
  );

  return (
    <div>
      <p className="px-1 text-white/40">
        <span className="text-green-300">green</span>=done{" "}
        <span className="text-amber-200">amber</span>=active{" "}
        <span className="text-white/70">bright</span>=available{" "}
        <span className="text-white/30">dim</span>=locked
        <span className="text-white/30"> (scroll →)</span>
      </p>
      <div className="overflow-auto border border-white/10 max-h-[62vh]">
        <div className="relative" style={{ width, height }}>
          <svg className="absolute inset-0" width={width} height={height}>
            {edges}
          </svg>
          {ERAS.map((era, eraIdx) => (
            <div
              key={era}
              className="absolute text-white/40 uppercase"
              style={{
                left: PAD + eraIdx * (NODE_W + COL_GAP),
                top: PAD,
                width: NODE_W,
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
              <button
                key={t.id}
                type="button"
                disabled={!clickable}
                onClick={() => onSelect(t.id)}
                title={`${t.name} — ${t.description}`}
                className={`absolute border px-1.5 py-1 text-left ${NODE_STYLE[st]}`}
                style={{ left: p.x, top: p.y, width: NODE_W, height: NODE_H }}
              >
                <span className="block truncate" style={{ fontSize: 12 }}>
                  {t.name}
                  {st === "active" ? " [x]" : ""}
                </span>
                <span className="block text-white/50" style={{ fontSize: 11 }}>
                  {subLabel(t.id, st)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
