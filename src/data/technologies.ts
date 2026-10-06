// Technology tree. Separate concept from infrastructure:
// - technologies.ts: what the player can research, chain prerequisites,
//   and which buildings each tech unlocks.
// - infrastructure (Home.tsx): what the player owns.
// Research rule for now: one active research at a time (BASE_RESEARCH_SLOTS).
// Parallel slots unlock as the empire advances (later eras / governments).

export const ERAS = [
  "Tribal",
  "Ancient",
  "Classical",
  "Medieval",
  "Renaissance",
  "Industrial",
  "Modern",
  "Digital",
  "Future",
  "Space",
] as const;

export type Era = (typeof ERAS)[number];

export interface Technology {
  id: string;
  name: string;
  era: Era;
  /** Research points required. Earned from population allocated to Research. */
  cost: number;
  /** All of these must be researched first. Empty = researchable from the start. */
  requiresAll: string[];
  /** Building keys in the infrastructure template this tech unlocks. */
  unlocksBuildings: string[];
  /** Non-building effects, e.g. "farmOutput". */
  boosts?: string[];
  description: string;
}

export const BASE_RESEARCH_SLOTS = 1;

export const TECHNOLOGIES: Record<string, Technology> = {
  // ---- Tribal: starting options, Civ-style (fire/tools/shelter are implicit) ----
  agriculture: {
    id: "agriculture",
    name: "Agriculture",
    era: "Tribal",
    cost: 20,
    requiresAll: [],
    unlocksBuildings: ["farm"],
    description: "Cultivate crops. Unlocks the Farm.",
  },
  animalHusbandry: {
    id: "animalHusbandry",
    name: "Animal Husbandry",
    era: "Tribal",
    cost: 20,
    requiresAll: [],
    unlocksBuildings: ["pasture"],
    description: "Raise herds. Unlocks the Pasture.",
  },
  pottery: {
    id: "pottery",
    name: "Pottery",
    era: "Tribal",
    cost: 20,
    requiresAll: [],
    unlocksBuildings: ["granary"],
    description: "Store food in clay vessels. Unlocks the Granary.",
  },
  fishing: {
    id: "fishing",
    name: "Fishing",
    era: "Tribal",
    cost: 20,
    requiresAll: [],
    unlocksBuildings: ["fishery"],
    description: "Fish rivers and coasts. Unlocks the Fishery.",
  },
  mining: {
    id: "mining",
    name: "Mining",
    era: "Tribal",
    cost: 20,
    requiresAll: [],
    unlocksBuildings: ["mine"],
    description: "Dig stone and ore. Unlocks the Mine.",
  },
  hunting: {
    id: "hunting",
    name: "Hunting",
    era: "Tribal",
    cost: 20,
    requiresAll: [],
    unlocksBuildings: ["huntingCamp"],
    boosts: ["exploration"],
    description: "Track game. Unlocks the Hunting Camp, aids exploration.",
  },

  // ---- Ancient ----
  masonry: {
    id: "masonry",
    name: "Masonry",
    era: "Ancient",
    cost: 40,
    requiresAll: ["mining"],
    unlocksBuildings: ["quarry", "house"],
    description: "Cut and lay stone. Unlocks the Quarry and stone Houses.",
  },
  writing: {
    id: "writing",
    name: "Writing",
    era: "Ancient",
    cost: 40,
    requiresAll: ["pottery"],
    unlocksBuildings: ["school", "library"],
    description: "Record knowledge. Unlocks the School and Library.",
  },
  sailing: {
    id: "sailing",
    name: "Sailing",
    era: "Ancient",
    cost: 40,
    requiresAll: ["fishing"],
    unlocksBuildings: ["port"],
    description: "Harness the wind. Unlocks the Port.",
  },
  irrigation: {
    id: "irrigation",
    name: "Irrigation",
    era: "Ancient",
    cost: 40,
    requiresAll: ["agriculture", "pottery"],
    unlocksBuildings: [],
    boosts: ["farmOutput"],
    description: "Water the fields. Greatly boosts Farms.",
  },
  bronzeWorking: {
    id: "bronzeWorking",
    name: "Bronze Working",
    era: "Ancient",
    cost: 40,
    requiresAll: ["mining"],
    unlocksBuildings: [],
    boosts: ["militaryStrength"],
    description: "Cast bronze tools and weapons. Strengthens the military.",
  },
  archery: {
    id: "archery",
    name: "Archery",
    era: "Ancient",
    cost: 40,
    requiresAll: ["hunting"],
    unlocksBuildings: [],
    boosts: ["militaryStrength", "exploration"],
    description: "Bows for war and the hunt.",
  },

  // ---- Classical ----
  mathematics: {
    id: "mathematics",
    name: "Mathematics",
    era: "Classical",
    cost: 70,
    requiresAll: ["writing"],
    unlocksBuildings: [],
    description: "Count, measure, plan. Gateway to engineering.",
  },
  engineering: {
    id: "engineering",
    name: "Engineering",
    era: "Classical",
    cost: 70,
    requiresAll: ["masonry", "mathematics"],
    unlocksBuildings: ["road", "bridge", "aqueduct"],
    description: "Build big. Unlocks Roads, Bridges, Aqueducts.",
  },
  currency: {
    id: "currency",
    name: "Currency",
    era: "Classical",
    cost: 70,
    requiresAll: ["writing"],
    unlocksBuildings: ["market"],
    description: "Mint coin. Unlocks the Market.",
  },
  medicine: {
    id: "medicine",
    name: "Medicine",
    era: "Classical",
    cost: 70,
    requiresAll: ["writing"],
    unlocksBuildings: ["hospital"],
    description: "Heal the sick. Unlocks the Hospital.",
  },
  philosophy: {
    id: "philosophy",
    name: "Philosophy",
    era: "Classical",
    cost: 70,
    requiresAll: ["writing"],
    unlocksBuildings: ["temple"],
    description: "Ask why. Unlocks the Temple.",
  },

  // ---- Medieval ----
  guilds: {
    id: "guilds",
    name: "Guilds",
    era: "Medieval",
    cost: 110,
    requiresAll: ["currency"],
    unlocksBuildings: ["workshop"],
    description: "Organize craftsmen. Unlocks the Workshop.",
  },
  navigation: {
    id: "navigation",
    name: "Navigation",
    era: "Medieval",
    cost: 110,
    requiresAll: ["sailing"],
    unlocksBuildings: ["harbor"],
    description: "Sail beyond sight of land. Unlocks the Harbor.",
  },
  architecture: {
    id: "architecture",
    name: "Architecture",
    era: "Medieval",
    cost: 110,
    requiresAll: ["engineering"],
    unlocksBuildings: ["townHall"],
    description: "Raise civic monuments. Unlocks the Town Hall.",
  },

  // ---- Renaissance ----
  printing: {
    id: "printing",
    name: "Printing",
    era: "Renaissance",
    cost: 160,
    requiresAll: ["writing", "guilds"],
    unlocksBuildings: [],
    boosts: ["researchSpeed"],
    description: "Spread ideas. Speeds all future research.",
  },
  education: {
    id: "education",
    name: "Education",
    era: "Renaissance",
    cost: 160,
    requiresAll: ["printing"],
    unlocksBuildings: ["university"],
    description: "Higher learning. Unlocks the University.",
  },
  astronomy: {
    id: "astronomy",
    name: "Astronomy",
    era: "Renaissance",
    cost: 160,
    requiresAll: ["mathematics", "navigation"],
    unlocksBuildings: ["observatory"],
    description: "Map the heavens. Unlocks the Observatory.",
  },
  gunpowder: {
    id: "gunpowder",
    name: "Gunpowder",
    era: "Renaissance",
    cost: 160,
    requiresAll: ["engineering"],
    unlocksBuildings: [],
    boosts: ["militaryStrength"],
    description: "Fire and thunder. Strengthens the military.",
  },

  // ---- Industrial ----
  steamPower: {
    id: "steamPower",
    name: "Steam Power",
    era: "Industrial",
    cost: 220,
    requiresAll: ["engineering"],
    unlocksBuildings: ["railway"],
    description: "Coal and iron move. Unlocks the Railway.",
  },
  industrialization: {
    id: "industrialization",
    name: "Industrialization",
    era: "Industrial",
    cost: 220,
    requiresAll: ["steamPower", "guilds"],
    unlocksBuildings: ["factory"],
    description: "Workshop plus steam. Unlocks the Factory.",
  },
  steel: {
    id: "steel",
    name: "Steel",
    era: "Industrial",
    cost: 220,
    requiresAll: ["steamPower", "mining"],
    unlocksBuildings: [],
    boosts: ["factoryOutput", "militaryStrength"],
    description: "Stronger than iron. Boosts factories and armies.",
  },
  physics: {
    id: "physics",
    name: "Physics",
    era: "Industrial",
    cost: 220,
    requiresAll: ["mathematics", "astronomy"],
    unlocksBuildings: [],
    description: "Laws of nature. Gateway to electricity and flight.",
  },
  electricity: {
    id: "electricity",
    name: "Electricity",
    era: "Industrial",
    cost: 220,
    requiresAll: ["physics"],
    unlocksBuildings: ["powerGrid"],
    description: "Light the cities. Unlocks the Power Grid.",
  },
  sanitation: {
    id: "sanitation",
    name: "Sanitation",
    era: "Industrial",
    cost: 220,
    requiresAll: ["medicine"],
    unlocksBuildings: ["sewer"],
    boosts: ["populationGrowth"],
    description: "Clean water, healthy cities. Unlocks Sewers, boosts growth.",
  },
  concrete: {
    id: "concrete",
    name: "Concrete",
    era: "Industrial",
    cost: 220,
    requiresAll: ["engineering"],
    unlocksBuildings: ["apartment"],
    description: "Build upward. Unlocks the Apartment Block.",
  },

  // ---- Modern ----
  combustion: {
    id: "combustion",
    name: "Combustion",
    era: "Modern",
    cost: 300,
    requiresAll: ["steel", "physics"],
    unlocksBuildings: [],
    boosts: ["transportSpeed", "militaryStrength"],
    description: "Engines of oil and fire.",
  },
  flight: {
    id: "flight",
    name: "Flight",
    era: "Modern",
    cost: 300,
    requiresAll: ["combustion", "physics"],
    unlocksBuildings: ["airport"],
    description: "Take to the skies. Unlocks the Airport.",
  },
  electronics: {
    id: "electronics",
    name: "Electronics",
    era: "Modern",
    cost: 300,
    requiresAll: ["electricity"],
    unlocksBuildings: [],
    boosts: ["researchSpeed"],
    description: "Circuits and signals. Speeds research.",
  },
  nuclear: {
    id: "nuclear",
    name: "Nuclear Power",
    era: "Modern",
    cost: 300,
    requiresAll: ["physics", "mining"],
    unlocksBuildings: ["nuclearPlant"],
    description: "Split the atom. Unlocks the Nuclear Plant.",
  },

  // ---- Digital ----
  computers: {
    id: "computers",
    name: "Computers",
    era: "Digital",
    cost: 400,
    requiresAll: ["electronics"],
    unlocksBuildings: ["dataCenter"],
    description: "Machines that think. Unlocks the Data Center.",
  },
  internet: {
    id: "internet",
    name: "Internet",
    era: "Digital",
    cost: 400,
    requiresAll: ["computers"],
    unlocksBuildings: [],
    boosts: ["researchSpeed", "economyOutput"],
    description: "Connect the world. Boosts research and economy.",
  },
  robotics: {
    id: "robotics",
    name: "Robotics",
    era: "Digital",
    cost: 400,
    requiresAll: ["computers", "steel"],
    unlocksBuildings: ["automatedPlant"],
    description: "Hands of steel. Unlocks the Automated Plant.",
  },

  // ---- Future ----
  ecology: {
    id: "ecology",
    name: "Ecology",
    era: "Future",
    cost: 550,
    requiresAll: ["medicine"],
    unlocksBuildings: [],
    boosts: ["populationGrowth", "farmOutput"],
    description: "Understand the living world.",
  },
  satellites: {
    id: "satellites",
    name: "Satellites",
    era: "Future",
    cost: 550,
    requiresAll: ["computers", "flight"],
    unlocksBuildings: [],
    boosts: ["exploration", "intelligence"],
    description: "Eyes above the world. Boosts exploration and intelligence.",
  },
  rocketry: {
    id: "rocketry",
    name: "Rocketry",
    era: "Future",
    cost: 550,
    requiresAll: ["combustion", "satellites"],
    unlocksBuildings: ["launchPad"],
    description: "Escape the cradle. Unlocks the Launch Pad.",
  },
  fusion: {
    id: "fusion",
    name: "Fusion Power",
    era: "Future",
    cost: 550,
    requiresAll: ["nuclear", "physics"],
    unlocksBuildings: ["fusionPlant"],
    description: "A star in a bottle. Unlocks the Fusion Plant.",
  },

  // ---- Space ----
  orbital: {
    id: "orbital",
    name: "Orbital Stations",
    era: "Space",
    cost: 700,
    requiresAll: ["rocketry", "satellites"],
    unlocksBuildings: ["spaceport"],
    description: "Live above the sky. Unlocks the Spaceport.",
  },
  terraforming: {
    id: "terraforming",
    name: "Terraforming",
    era: "Space",
    cost: 700,
    requiresAll: ["orbital", "ecology"],
    unlocksBuildings: [],
    boosts: ["victory"],
    description: "Remake worlds. The endgame.",
  },
};

/** Techs researchable right now given completed tech ids. */
export function availableTechs(researched: string[]): Technology[] {
  const done = new Set(researched);
  return Object.values(TECHNOLOGIES).filter(
    (t) => !done.has(t.id) && t.requiresAll.every((r) => done.has(r))
  );
}

/** Starting options: no prerequisites. */
export function startingTechs(): Technology[] {
  return Object.values(TECHNOLOGIES).filter((t) => t.requiresAll.length === 0);
}
