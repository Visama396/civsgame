// Civipedia: the in-game reference. Prose lives in ../i18n/help.ts; the tables
// are generated from the same data the simulation uses, so rates and costs can
// never drift from the actual game.

import { useState } from "react";
import { populationLimit, type Civilization } from "../data/civilization";
import {
  START_INFRASTRUCTURE,
  buildingGroupName,
  buildingLaborCost,
  buildingName,
} from "../data/infrastructure";
import { BUILDING_PRODUCTION_OPTIONS, TICKS_PER_HOUR, mealNeed } from "../data/simulation";
import { ERAS, TECHNOLOGIES, eraName, techDescription, techName } from "../data/technologies";
import { UI, recipeLabel, resourceLabel, type Language } from "../i18n";
import { HELP_TEXT, HELP_TOPICS, type HelpTopic } from "../i18n/help";

function formatRate(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return `${rounded}`;
}

/** Techs that unlock a building, in data order. */
function unlockingTechIds(key: string): string[] {
  return Object.values(TECHNOLOGIES)
    .filter((tech) => tech.unlocksBuildings.includes(key))
    .map((tech) => tech.id);
}

export default function Civipedia({ game, lang }: { game: Civilization; lang: Language }) {
  const [topic, setTopic] = useState<HelpTopic>("basics");
  const text = HELP_TEXT[lang];
  const t = UI[lang];
  const section = text.sections[topic];

  return (
    <div className="pt-2">
      <h3 className="text-green-400 font-semibold">&gt; {text.title}</h3>
      <p className="px-1 text-white/60">{text.subtitle}</p>

      <div className="flex flex-wrap gap-1 px-1 pt-2">
        {HELP_TOPICS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTopic(key)}
            className={
              key === topic
                ? "border border-amber-400/70 px-1.5 text-amber-200"
                : "border border-green-400/50 px-1.5 text-green-300 hover:bg-green-400/10"
            }
          >
            {text.topics[key]}
          </button>
        ))}
      </div>

      <h4 className="px-1 pt-4 text-amber-200 font-semibold">{section.title}</h4>
      {section.body.map((paragraph) => (
        <p key={paragraph} className="px-1 pt-1">
          {paragraph}
        </p>
      ))}
      {section.bullets && (
        <ul className="px-1 pt-1">
          {section.bullets.map((bullet) => (
            <li key={bullet}>- {bullet}</li>
          ))}
        </ul>
      )}

      {topic === "population" && (
        <p className="px-1 pt-2 text-cyan-200">
          {text.labels.currentPopulation}: {game.overview.population} / {populationLimit(game)}
        </p>
      )}
      {topic === "food" && (
        <p className="px-1 pt-2 text-cyan-200">
          {text.labels.mealNeed}: {mealNeed(game)} {t.everyHours(game.politics.mealIntervalHours)}
        </p>
      )}

      {topic === "production" && <ProductionTable lang={lang} />}
      {topic === "buildings" && <BuildingsTable lang={lang} />}
      {topic === "technologies" && <TechnologiesTable lang={lang} />}
    </div>
  );
}

function ProductionTable({ lang }: { lang: Language }) {
  const text = HELP_TEXT[lang];
  const rows = Object.entries(BUILDING_PRODUCTION_OPTIONS).flatMap(([key, options]) =>
    options.map((option) => ({ key, option })),
  );

  return (
    <>
      <p className="px-1 pt-2 text-white/60">{text.labels.perLaborBuilding}</p>
      <div className="overflow-x-auto">
        <table className="mt-1 w-full border-collapse text-left">
          <thead>
            <tr className="text-white/60">
              <th className="border-b border-white/20 px-1 py-1 font-normal">{text.labels.building}</th>
              <th className="border-b border-white/20 px-1 py-1 font-normal">{text.labels.option}</th>
              <th className="border-b border-white/20 px-1 py-1 font-normal">{text.labels.produces}</th>
              <th className="border-b border-white/20 px-1 py-1 font-normal">{text.labels.perHour}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ key, option }) => (
              <tr key={`${key}-${option.id}`} className="align-top">
                <td className="px-1">{buildingName(key, lang)}</td>
                <td className="px-1 text-amber-200">{recipeLabel(option.id, lang)}</td>
                <td className="px-1 text-cyan-200">{resourceLabel(option.resource, lang)}</td>
                <td className="px-1 text-green-300">
                  {formatRate((option.amount * TICKS_PER_HOUR) / option.everyTicks)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function BuildingsTable({ lang }: { lang: Language }) {
  const text = HELP_TEXT[lang];

  return (
    <div className="overflow-x-auto">
      <table className="mt-2 w-full border-collapse text-left">
        <thead>
          <tr className="text-white/60">
            <th className="border-b border-white/20 px-1 py-1 font-normal">{text.labels.building}</th>
            <th className="border-b border-white/20 px-1 py-1 font-normal">{text.labels.cost}</th>
            <th className="border-b border-white/20 px-1 py-1 font-normal">{text.labels.unlockedBy}</th>
            <th className="border-b border-white/20 px-1 py-1 font-normal">{text.labels.capacity}</th>
            <th className="border-b border-white/20 px-1 py-1 font-normal">{text.labels.production}</th>
          </tr>
        </thead>
        {Object.entries(START_INFRASTRUCTURE).map(([group, buildings]) => (
          <tbody key={group}>
            <tr>
              <th colSpan={5} className="border-b border-white/10 pt-3 text-left font-normal text-cyan-200">
                {buildingGroupName(group, lang)}
              </th>
            </tr>
            {Object.entries(buildings).map(([key, building]) => {
              const cost = buildingLaborCost(key);
              const unlockers = key === "hut"
                ? [text.labels.start]
                : unlockingTechIds(key).map((id) => techName(id, lang));
              const options = BUILDING_PRODUCTION_OPTIONS[key] ?? [];
              return (
                <tr key={key} className="align-top">
                  <td className="px-1">{buildingName(key, lang)}</td>
                  <td className="px-1 text-amber-200">{cost ?? text.labels.none}</td>
                  <td className="px-1 text-white/60">
                    {unlockers.length > 0 ? unlockers.join(", ") : text.labels.none}
                  </td>
                  <td className="px-1">{building.capacityEach ?? text.labels.none}</td>
                  <td className="px-1 text-white/60">
                    {options.length > 0
                      ? options.map((option) => recipeLabel(option.id, lang)).join(", ")
                      : text.labels.none}
                  </td>
                </tr>
              );
            })}
          </tbody>
        ))}
      </table>
    </div>
  );
}

function TechnologiesTable({ lang }: { lang: Language }) {
  const text = HELP_TEXT[lang];

  return (
    <div className="overflow-x-auto">
      <table className="mt-2 w-full border-collapse text-left">
        <thead>
          <tr className="text-white/60">
            <th className="border-b border-white/20 px-1 py-1 font-normal">{text.labels.technology}</th>
            <th className="border-b border-white/20 px-1 py-1 font-normal">{text.labels.cost}</th>
            <th className="border-b border-white/20 px-1 py-1 font-normal">{text.labels.requires}</th>
            <th className="border-b border-white/20 px-1 py-1 font-normal">{text.labels.unlocks}</th>
          </tr>
        </thead>
        {ERAS.map((era) => {
          const techs = Object.values(TECHNOLOGIES).filter((tech) => tech.era === era);
          if (techs.length === 0) return null;
          return (
            <tbody key={era}>
              <tr>
                <th colSpan={4} className="border-b border-white/10 pt-3 text-left font-normal text-cyan-200">
                  {eraName(era, lang)}
                </th>
              </tr>
              {techs.map((tech) => {
                const unlocks = [
                  ...tech.unlocksBuildings.map((key) => buildingName(key, lang)),
                  ...(tech.boosts ?? []).map((boost) => text.labels.boosts[boost] ?? boost),
                ];
                return (
                  <tr key={tech.id} className="align-top">
                    <td className="px-1">
                      <div className="text-amber-200">{techName(tech.id, lang)}</div>
                      <div className="text-white/50">{techDescription(tech.id, lang)}</div>
                    </td>
                    <td className="px-1 text-cyan-200">{tech.cost}</td>
                    <td className="px-1 text-white/60">
                      {tech.requiresAll.length > 0
                        ? tech.requiresAll.map((id) => techName(id, lang)).join(", ")
                        : text.labels.none}
                    </td>
                    <td className="px-1 text-green-300">
                      {unlocks.length > 0 ? unlocks.join(", ") : text.labels.none}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          );
        })}
      </table>
    </div>
  );
}
