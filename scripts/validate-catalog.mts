import {
  RESOURCES,
  RESOURCE_BY_KEY,
  TECH_BY_KEY,
  BUILDING_BY_KEY,
  UNIT_BY_KEY,
  RECIPE_BY_KEY,
  RESOURCE_CATEGORIES,
  TECHNOLOGIES,
} from "../src/lib/game/index.ts";

let errors = 0;
const fail = (msg: string) => {
  errors++;
  console.error(`ERROR: ${msg}`);
};

for (const res of RESOURCES) {
  if (!RESOURCE_CATEGORIES.some((c) => c.key === res.category)) {
    fail(`resource ${res.key} has unknown category ${res.category}`);
  }
  if (res.unlockTechKey && !TECH_BY_KEY.has(res.unlockTechKey)) {
    fail(`resource ${res.key} unlockTechKey ${res.unlockTechKey} does not exist`);
  }
}

for (const tech of TECHNOLOGIES) {
  for (const p of tech.prerequisites) {
    if (!TECH_BY_KEY.has(p)) fail(`tech ${tech.key} prereq ${p} does not exist`);
  }
  for (const r of tech.unlocksResources) {
    if (!RESOURCE_BY_KEY.has(r)) fail(`tech ${tech.key} unlocks unknown resource ${r}`);
  }
  for (const b of tech.unlocksBuildings) {
    if (!BUILDING_BY_KEY.has(b)) fail(`tech ${tech.key} unlocks unknown building ${b}`);
  }
  for (const u of tech.unlocksUnits) {
    if (!UNIT_BY_KEY.has(u)) fail(`tech ${tech.key} unlocks unknown unit ${u}`);
  }
  for (const r of tech.unlocksRecipes) {
    if (!RECIPE_BY_KEY.has(r)) fail(`tech ${tech.key} unlocks unknown recipe ${r}`);
  }
}

for (const building of BUILDING_BY_KEY.values()) {
  if (building.unlockTechKey && !TECH_BY_KEY.has(building.unlockTechKey)) {
    fail(`building ${building.key} unlockTechKey ${building.unlockTechKey} does not exist`);
  }
  checkResources(building.costResources);
}

for (const unit of UNIT_BY_KEY.values()) {
  if (unit.unlockTechKey && !TECH_BY_KEY.has(unit.unlockTechKey)) {
    fail(`unit ${unit.key} unlockTechKey ${unit.unlockTechKey} does not exist`);
  }
  checkResources(unit.costResources);
}

for (const recipe of RECIPE_BY_KEY.values()) {
  if (!RESOURCE_BY_KEY.has(recipe.outputKey)) {
    fail(`recipe ${recipe.key} outputs unknown resource ${recipe.outputKey}`);
  }
  if (recipe.buildingKey && !BUILDING_BY_KEY.has(recipe.buildingKey)) {
    fail(`recipe ${recipe.key} building ${recipe.buildingKey} does not exist`);
  }
  if (recipe.unlockTechKey && !TECH_BY_KEY.has(recipe.unlockTechKey)) {
    fail(`recipe ${recipe.key} unlockTechKey ${recipe.unlockTechKey} does not exist`);
  }
  checkResources(recipe.inputs);
}

function checkResources(list: { resourceKey: string }[]) {
  for (const entry of list) {
    if (!RESOURCE_BY_KEY.has(entry.resourceKey)) {
      fail(`references unknown resource ${entry.resourceKey}`);
    }
  }
}

console.log(`Checked ${RESOURCES.length} resources across ${RESOURCE_CATEGORIES.length} categories, ${TECHNOLOGIES.length} techs, ${BUILDING_BY_KEY.size} buildings, ${UNIT_BY_KEY.size} units, ${RECIPE_BY_KEY.size} recipes.`);
if (errors) {
  console.error(`${errors} error(s) found.`);
  process.exit(1);
} else {
  console.log("All references valid.");
}