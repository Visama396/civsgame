import { writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  RESOURCE_CATEGORIES,
  RESOURCES,
  TECHNOLOGIES,
  BUILDINGS,
  UNITS,
  RECIPES,
} from "../src/lib/game/index.ts";

const sql: string[] = [];
sql.push("-- Auto-generated seed from src/lib/game. Do not edit by hand.");
sql.push("-- Regenerate with: bun scripts/generate-seed.mts");
sql.push("");

const esc = (s: string) => `'${s.replace(/'/g, "''")}'`;
const escArr = (arr: string[] | undefined) => {
  const list = (arr ?? []).map((x) => `'${x.replace(/'/g, "''")}'`);
  return `ARRAY[${list.join(", ")}]::text[]`;
};
const escJson = (obj: unknown) => `'${JSON.stringify(obj ?? null).replace(/'/g, "''")}'::jsonb`;
const num = (n: number) => String(n);

sql.push("insert into public.resource_categories (key, name, color) values");
sql.push(
  RESOURCE_CATEGORIES.map(
    (c) => `  (${esc(c.key)}, ${esc(c.name)}, ${esc(c.color)})`,
  ).join(",\n") + " on conflict (key) do nothing;",
);
sql.push("");

sql.push("insert into public.resources (key, name, category_key, tier, value, weight, unlock_tech_key) values");
sql.push(
  RESOURCES.map(
    (r) =>
      `  (${esc(r.key)}, ${esc(r.name)}, ${esc(r.category)}, ${num(r.tier)}, ${num(r.value)}, ${num(r.weight)}, ${r.unlockTechKey ? esc(r.unlockTechKey) : "null"})`,
  ).join(",\n") + " on conflict (key) do nothing;",
);
sql.push("");

sql.push("insert into public.technologies (key, name, era, cost, description, prerequisites, unlocks_resources, unlocks_buildings, unlocks_units, unlocks_recipes) values");
sql.push(
  TECHNOLOGIES.map(
    (t) =>
      `  (${esc(t.key)}, ${esc(t.name)}, ${esc(t.era)}, ${num(t.cost)}, ${esc(t.description)}, ${escArr(t.prerequisites)}, ${escArr(t.unlocksResources)}, ${escArr(t.unlocksBuildings)}, ${escArr(t.unlocksUnits)}, ${escArr(t.unlocksRecipes)})`,
  ).join(",\n") + " on conflict (key) do nothing;",
);
sql.push("");

sql.push("insert into public.buildings (key, name, era, cost_gold, cost_resources, maintenance, effects, outputs, unlock_tech_key) values");
sql.push(
  BUILDINGS.map(
    (b) =>
      `  (${esc(b.key)}, ${esc(b.name)}, ${esc(b.era)}, ${num(b.costGold)}, ${escJson(b.costResources)}, ${num(b.maintenance)}, ${escJson(b.effects)}, ${escJson(b.outputs)}` +
      (b.unlockTechKey ? `, ${esc(b.unlockTechKey)})` : `, null)`),
  ).join(",\n") + " on conflict (key) do nothing;",
);
sql.push("");

sql.push("insert into public.units (key, name, kind, era, cost_gold, cost_resources, maintenance, stats, unlock_tech_key) values");
sql.push(
  UNITS.map(
    (u) =>
      `  (${esc(u.key)}, ${esc(u.name)}, ${esc(u.kind)}, ${esc(u.era)}, ${num(u.costGold)}, ${escJson(u.costResources)}, ${num(u.maintenance)}, ${escJson(u.stats)}` +
      (u.unlockTechKey ? `, ${esc(u.unlockTechKey)})` : `, null)`),
  ).join(",\n") + " on conflict (key) do nothing;",
);
sql.push("");

sql.push("insert into public.recipes (key, name, output_resource_key, output_qty, inputs, building_key, unlock_tech_key) values");
sql.push(
  RECIPES.map(
    (r) =>
      `  (${esc(r.key)}, ${esc(r.name)}, ${esc(r.outputKey)}, ${num(r.outputQty)}, ${escJson(r.inputs)}, ${r.buildingKey ? esc(r.buildingKey) : "null"}, ${r.unlockTechKey ? esc(r.unlockTechKey) : "null"})`,
  ).join(",\n") + " on conflict (key) do nothing;",
);
sql.push("");

const out = join(process.cwd(), "supabase", "migrations", "0002_seed.sql");
writeFileSync(out, sql.join("\n"));
console.log(`Wrote ${out} (${sql.length} lines)`);