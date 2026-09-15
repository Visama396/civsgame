import type { Resource, ResourceCategory, ResourceCategoryKey, ResourceKind, ResourceTier } from "./types";

export const RESOURCE_CATEGORIES: ResourceCategory[] = [
  { key: "strategic", name: "Strategic", color: "#f87171" },
  { key: "luxury", name: "Luxury", color: "#fbbf24" },
  { key: "food", name: "Food", color: "#4ade80" },
  { key: "agricultural", name: "Agricultural", color: "#a3e635" },
  { key: "animal", name: "Animal", color: "#fb923c" },
  { key: "mineral", name: "Mineral", color: "#a8a29e" },
  { key: "metal", name: "Metal", color: "#94a3b8" },
  { key: "precious", name: "Precious Metal", color: "#fde047" },
  { key: "gemstone", name: "Gemstone", color: "#c084fc" },
  { key: "energy", name: "Energy", color: "#facc15" },
  { key: "chemical", name: "Chemical", color: "#38bdf8" },
  { key: "forest", name: "Forest", color: "#22c55e" },
  { key: "textile", name: "Textile", color: "#e2e8f0" },
  { key: "marine", name: "Marine", color: "#2dd4bf" },
  { key: "industrial", name: "Industrial", color: "#fb7185" },
  { key: "technological", name: "Technological", color: "#818cf8" },
  { key: "medicinal", name: "Medicinal", color: "#34d399" },
  { key: "cultural", name: "Cultural", color: "#f472b6" },
];

const DEFAULT_TIER: Record<ResourceCategoryKey, ResourceTier> = {
  strategic: 2,
  luxury: 2,
  food: 1,
  agricultural: 1,
  animal: 1,
  mineral: 1,
  metal: 2,
  precious: 2,
  gemstone: 2,
  energy: 1,
  chemical: 2,
  forest: 1,
  textile: 1,
  marine: 1,
  industrial: 3,
  technological: 4,
  medicinal: 1,
  cultural: 2,
};

const NAME_LISTS: Record<ResourceCategoryKey, string[]> = {
  strategic: ["Rubber"],
  luxury: [
    "Coffee", "Tea", "Cocoa", "Wine", "Beer", "Cider", "Tobacco", "Hops",
    "Sugar", "Vanilla", "Saffron", "Truffles", "Ivory",
    "Incense", "Myrrh", "Frankincense", "Silk", "Exotic Woods", "Furs",
    "Ebony", "Lacquer", "Perfume", "Chocolate", "Porcelain", "Ambergris", "Caviar",
  ],
  food: [
    "Wheat", "Maize", "Rice", "Barley", "Rye", "Oats", "Sorghum", "Millet",
    "Buckwheat", "Quinoa", "Amaranth", "Teff", "Spelt", "Fonio", "Einkorn",
    "Emmer", "Durum", "Potato", "Sweet Potato", "Cassava", "Yam", "Taro",
    "Turnip", "Beet", "Carrot", "Radish", "Parsnip", "Rutabaga", "Flour", "Bread",
    "Apple", "Banana", "Orange", "Grape", "Strawberry", "Watermelon",
    "Pineapple", "Mango", "Peach", "Pear", "Cherry", "Lemon", "Lime",
    "Coconut", "Papaya", "Avocado", "Plum", "Apricot", "Kiwi", "Pomegranate",
    "Fig", "Date", "Olive", "Raspberry", "Blackberry", "Blueberry",
    "Cranberry", "Gooseberry", "Currant", "Grapefruit", "Tangerine",
    "Mandarin", "Clementine", "Melon", "Cantaloupe", "Guava", "Passion Fruit",
    "Dragon Fruit", "Lychee", "Durian", "Jackfruit", "Persimmon", "Starfruit",
    "Breadfruit", "Tamarind", "Kumquat", "Mulberry", "Soursop", "Longan",
    "Mangosteen", "Nectarine", "Quince", "Elderberry", "Tomato", "Onion",
    "Garlic", "Lettuce", "Cabbage", "Broccoli", "Cauliflower", "Spinach",
    "Kale", "Celery", "Cucumber", "Eggplant", "Zucchini", "Pumpkin",
    "Squash", "Bell Pepper", "Chili Pepper", "Peas", "Green Beans",
    "Asparagus", "Artichoke", "Leek", "Okra", "Bamboo Shoots",
    "Brussels Sprouts", "Sweetcorn", "Soybeans", "Chickpeas", "Lentils",
    "Peanuts", "Kidney Beans", "Black Beans", "Pinto Beans", "Navy Beans",
    "Fava Beans", "Lupin", "Mung Beans", "Adzuki Beans", "Almonds", "Walnuts",
    "Hazelnuts", "Cashews", "Pistachios", "Pecans", "Macadamia Nuts",
    "Brazil Nuts", "Chestnuts", "Pine Nuts", "Sunflower Seeds",
    "Pumpkin Seeds", "Sesame", "Flaxseed", "Chia Seeds", "Poppy Seeds",
    "Hemp Seeds", "Honey", "Yeast", "Vinegar", "Palm Oil", "Olive Oil",
    "Coconut Oil", "Soy Oil", "Sunflower Oil", "Canola Oil", "Sesame Oil",
  ],
  agricultural: [
    "Sugarcane", "Sugar Beet", "Rapeseed", "Sunflower", "Palm",
    "Fertile Soil", "Arable Land", "Wetlands", "Fresh Water",
  ],
  animal: [
    "Cattle", "Horses", "Pigs", "Sheep", "Goats", "Chickens", "Ducks",
    "Geese", "Turkeys", "Donkeys", "Mules", "Camels", "Reindeer", "Yaks",
    "Water Buffalo", "Llamas", "Alpacas", "Rabbits", "Bees",
    "Beef", "Pork", "Mutton", "Goat Meat", "Chicken", "Eggs", "Milk",
    "Cheese", "Butter", "Leather", "Wool", "Horn", "Antler", "Bone", "Tusk",
    "Whale Bone", "Tortoiseshell", "Mother of Pearl", "Animal Fat",
    "Beeswax", "Shell", "Beaver Fur", "Fox Fur", "Mink Fur", "Otter Fur",
    "Sable Fur", "Ermine Fur", "Rabbit Fur", "Coyote Fur", "Wolf Fur",
    "Lynx Fur", "Chinchilla Fur", "Raccoon Fur", "Muskrat Fur", "Seal Fur",
    "Nutria Fur", "Marten Fur", "Cowhide", "Calfskin", "Goatskin",
    "Sheepskin", "Pigskin", "Deer Hide", "Buffalo Hide", "Horsehide",
    "Reptile Leather", "Crocodile Leather", "Alligator Leather",
    "Snake Leather", "Ostrich Leather", "Wildlife", "Pasture",
  ],
  mineral: [
    "Stone", "Granite", "Marble", "Limestone", "Sandstone", "Slate", "Basalt",
    "Obsidian", "Flint", "Clay", "Sand", "Gravel", "Salt", "Gypsum", "Quartz",
    "Feldspar", "Mica", "Kaolin", "Talc", "Graphite", "Sulfur", "Pyrite",
    "Fluorite", "Barite", "Calcite", "Dolomite", "Bauxite", "Hematite",
    "Magnetite", "Galena", "Sphalerite", "Malachite", "Cinnabar", "Rutile",
    "Ilmenite", "Monazite", "Apatite", "Potash", "Phosphate Rock", "Borax",
    "Diatomite", "Perlite", "Pumice", "Vermiculite", "Bentonite", "Zeolite",
    "Soapstone", "Serpentine", "Iron Ore", "Copper Ore", "Tin Ore",
    "Nickel Ore", "Cobalt Ore", "Lead Ore", "Zinc Ore", "Manganese Ore",
    "Chromium Ore", "Titanium Ore", "Uranium Ore", "Silver Ore", "Gold Ore",
    "Platinum Ore", "Tungsten Ore", "Lithium Ore", "Rare Earth Ore",
    "Phosphate Ore", "Potash Ore", "Cement", "Asbestos",
  ],
  metal: [
    "Iron", "Aluminum", "Copper", "Zinc", "Lead", "Tin", "Nickel", "Chromium",
    "Manganese", "Cobalt", "Titanium", "Magnesium", "Calcium", "Sodium",
    "Potassium", "Mercury", "Cadmium", "Antimony", "Bismuth", "Arsenic",
    "Silicon", "Columbium", "Electrum", "Bronze", "Brass", "Cast Iron",
  ],
  precious: [
    "Gold", "Silver", "Platinum", "Palladium", "Rhodium", "Iridium",
    "Osmium", "Ruthenium",
  ],
  gemstone: [
    "Diamond", "Ruby", "Sapphire", "Emerald", "Amethyst", "Topaz", "Garnet",
    "Opal", "Aquamarine", "Tourmaline", "Peridot", "Citrine", "Tanzanite",
    "Zircon", "Spinel", "Jade", "Onyx", "Agate", "Jasper", "Moonstone",
    "Sunstone", "Labradorite", "Alexandrite", "Turquoise", "Lapis Lazuli",
    "Carnelian", "Aventurine", "Bloodstone", "Chrysoprase", "Amber", "Jet",
    "Paraiba Tourmaline", "Musgravite", "Painite", "Grandidierite",
    "Taaffeite", "Benitoite", "Red Beryl", "Jeremejevite", "Gemstones",
  ],
  energy: [
    "Coal", "Lignite", "Oil", "Natural Gas", "Shale Oil", "Oil Shale",
    "Peat", "Bitumen", "Tar Sands", "Uranium", "Thorium", "Wood Fuel",
    "Charcoal", "Hydrogen", "Ethanol", "Methanol", "Biodiesel", "Biogas",
    "Biomass", "Solar Energy", "Wind Energy", "Hydropower", "Geothermal Energy",
    "Tidal Energy", "Wave Energy", "Nuclear Energy", "Saltpeter",
    "Helium-3", "Deuterium", "Tritium", "Fusion Fuel",
  ],
  chemical: [
    "Phosphorus", "Chlorine", "Bromine", "Iodine", "Fluorine", "Oxygen",
    "Nitrogen", "Carbon", "Helium", "Neon", "Argon", "Krypton", "Xenon",
    "Ammonia", "Nitric Acid", "Sulfuric Acid", "Hydrochloric Acid",
    "Sodium Hydroxide", "Potassium Hydroxide", "Methane", "Acetone",
    "Hydrogen Peroxide", "Silicon Dioxide", "Calcium Carbonate",
    "Sodium Chloride", "Table Salt", "Sea Salt", "Rock Salt", "Baking Soda",
    "Nitrates", "Phosphates", "Sulfur Dioxide",
  ],
  forest: [
    "Timber", "Hardwood", "Softwood", "Oak", "Pine", "Spruce", "Fir",
    "Cedar", "Birch", "Beech", "Maple", "Ash", "Walnut Wood", "Mahogany",
    "Teak", "Ebony", "Rosewood", "Bamboo", "Cork", "Resin", "Sap", "Pulp",
    "Wood", "Wood Cherries", "Papyrus", "Fine Wood", "Rosewood Timber",
  ],
  textile: [
    "Cotton", "Flax", "Hemp", "Jute", "Ramie", "Sisal", "Linen", "Cloth",
    "Bamboo Fiber", "Cashmere", "Alpaca Fiber", "Mohair", "Angora", "Coir",
    "Kapok", "Linen Yarn", "Canvas", "Tapestry", "Damask", "Velvet", "Brocatelle",
  ],
  marine: [
    "Fish", "Salmon", "Tuna", "Cod", "Herring", "Sardines", "Mackerel",
    "Anchovies", "Trout", "Carp", "Eel", "Halibut", "Haddock", "Swordfish",
    "Marlin", "Sea Bass", "Snapper", "Grouper", "Crab", "Lobster", "Shrimp",
    "Prawn", "Oyster", "Mussel", "Clam", "Scallop", "Squid", "Octopus",
    "Snail", "Sea Urchin", "Whales", "Seals", "Kelp", "Seaweed", "Coral",
    "Pearls", "Salt Spice", "Fish Oil", "Fish Stocks", "Coral Reefs",
  ],
  industrial: [
    "Steel", "Stainless Steel", "Titanium Alloy", "Carbon Fiber",
    "Fiberglass", "Concrete", "Glass", "Ceramics", "Brick", "Asphalt",
    "Paper", "Fertilizer", "Explosives", "Chemicals", "Pharmaceuticals",
    "Semiconductor Materials", "Electronic Components", "Gasoline", "Diesel",
    "Kerosene", "Jet Fuel", "Fuel Oil", "LPG", "Naphtha", "Lubricants",
    "Petrochemicals", "Plastic", "Synthetic Rubber", "Synthetic Fiber",
    "Solvents", "Plastics", "Machinery", "Locomotive", "Armor Plate",
  ],
  technological: [
    "Lithium", "Tungsten", "Molybdenum", "Vanadium", "Niobium", "Tantalum",
    "Zirconium", "Hafnium", "Beryllium", "Gallium", "Germanium", "Indium",
    "Tellurium", "Rhenium", "Scandium", "Yttrium", "Lanthanum", "Cerium",
    "Praseodymium", "Neodymium", "Promethium", "Samarium", "Europium",
    "Gadolinium", "Terbium", "Dysprosium", "Holmium", "Erbium", "Thulium",
    "Ytterbium", "Lutetium", "Rare Earth Elements", "Semiconductors",
    "Microchips", "Batteries", "Solar Cells", "Fiber Optics", "Superconductors",
    "Magnets", "Electronics", "Graphene", "Nanomaterials", "Carbon Nanotubes",
    "Quantum Materials", "Synthetic Diamonds", "Advanced Ceramics",
    "Smart Materials", "Space Ice", "Lunar Regolith", "Asteroid Metals",
    "Platinum Group Metals", "Exotic Matter", "Antimatter", "Gadolinium Alloy",
  ],
  medicinal: [
    "Medicinal Herbs", "Aloe Vera", "Ginseng", "Cinchona", "Opium Poppy",
    "Willow Bark", "Eucalyptus", "Chamomile", "Lavender", "Peppermint",
    "Tea Tree", "Cannabis", "Licorice", "Valerian", "Foxglove", "Belladonna",
  ],
  cultural: [
    "Indigo", "Madder", "Henna", "Woad", "Logwood", "Brazilwood", "Safflower",
    "Annatto", "Walnut", "Beetroot", "Cochineal", "Tyrian Purple", "Lac Dye",
    "Sepia", "Ochre", "Red Ochre", "Yellow Ochre", "Azurite", "Realgar",
    "Orpiment", "Ultramarine", "Charcoal Black", "Red Dye", "Blue Dye",
    "Green Dye", "Yellow Dye", "Orange Dye", "Purple Dye", "Black Dye",
    "White Dye", "Brown Dye", "Pink Dye", "Rose", "Jasmine", "Ylang-Ylang",
    "Sandalwood", "Cedarwood", "Patchouli", "Vetiver", "Bergamot", "Neroli",
    "Parchment", "Musical Instruments", "Fine Ceramics", "Crystal", "Gems",
    "Artworks", "Statuary", "Golden Idols",
  ],
};

const UNLOCK_TECH_ENTRIES: [string, string][] = [
  ["Flint", "mining"],
  ["Granite", "mining"],
  ["Marble", "mining"],
  ["Limestone", "mining"],
  ["Sandstone", "mining"],
  ["Slate", "mining"],
  ["Basalt", "mining"],
  ["Obsidian", "mining"],
  ["Clay", "mining"],
  ["Sand", "mining"],
  ["Gravel", "mining"],
  ["Salt", "mining"],
  ["Gypsum", "mining"],
  ["Quartz", "mining"],
  ["Iron Ore", "mining"],
  ["Hematite", "mining"],
  ["Magnetite", "mining"],
  ["Coal", "mining"],
  ["Bronze", "bronze_working"],
  ["Brass", "bronze_working"],
  ["Iron", "iron_working"],
  ["Cast Iron", "iron_working"],
  ["Steel", "steel_making"],
  ["Stainless Steel", "steel_making"],
  ["Aluminum", "electricity"],
  ["Concrete", "construction"],
  ["Cement", "construction"],
  ["Glass", "glassblowing"],
  ["Paper", "writing"],
  ["Fertilizer", "chemistry"],
  ["Chemicals", "chemistry"],
  ["Pharmaceuticals", "chemistry"],
  ["Explosives", "gunpowder"],
  ["Gasoline", "petroleum_refining"],
  ["Diesel", "petroleum_refining"],
  ["Kerosene", "petroleum_refining"],
  ["Jet Fuel", "petroleum_refining"],
  ["Fuel Oil", "petroleum_refining"],
  ["LPG", "petroleum_refining"],
  ["Naphtha", "petroleum_refining"],
  ["Lubricants", "petroleum_refining"],
  ["Petrochemicals", "petroleum_refining"],
  ["Solvents", "petroleum_refining"],
  ["Synthetic Rubber", "petroleum_refining"],
  ["Synthetic Fiber", "petroleum_refining"],
  ["Plastics", "petroleum_refining"],
  ["Plastic", "petroleum_refining"],
  ["Rubber", "chemistry"],
  ["Uranium", "nuclear_fission"],
  ["Thorium", "nuclear_fission"],
  ["Uranium Ore", "nuclear_fission"],
  ["Helium-3", "nuclear_fusion"],
  ["Deuterium", "nuclear_fusion"],
  ["Tritium", "nuclear_fusion"],
  ["Fusion Fuel", "nuclear_fusion"],
  ["Silicon", "electronics"],
  ["Gallium", "electronics"],
  ["Germanium", "electronics"],
  ["Semiconductors", "semiconductors"],
  ["Microchips", "semiconductors"],
  ["Electronics", "electronics"],
  ["Rare Earth Ore", "electronics"],
  ["Rare Earth Elements", "electronics"],
  ["Neodymium", "electronics"],
  ["Magnets", "superconductors"],
  ["Superconductors", "nanotechnology"],
  ["Graphene", "nanotechnology"],
  ["Nanomaterials", "nanotechnology"],
  ["Carbon Nanotubes", "nanotechnology"],
  ["Quantum Materials", "nanotechnology"],
  ["Smart Materials", "nanotechnology"],
  ["Advanced Ceramics", "nanotechnology"],
  ["Synthetic Diamonds", "nanotechnology"],
  ["Batteries", "electricity"],
  ["Solar Cells", "electricity"],
  ["Fiber Optics", "electronics"],
  ["Space Ice", "rocketry"],
  ["Lunar Regolith", "rocketry"],
  ["Asteroid Metals", "rocketry"],
  ["Platinum Group Metals", "rocketry"],
  ["Exotic Matter", "exotic_matter"],
  ["Antimatter", "exotic_matter"],
  ["Red Dye", "chemistry"],
  ["Blue Dye", "chemistry"],
  ["Green Dye", "chemistry"],
  ["Yellow Dye", "chemistry"],
  ["Orange Dye", "chemistry"],
  ["Purple Dye", "chemistry"],
  ["Black Dye", "chemistry"],
  ["White Dye", "chemistry"],
  ["Brown Dye", "chemistry"],
  ["Pink Dye", "chemistry"],
  ["Chocolate", "preservation"],
];

const UNLOCK_TECHS: Record<string, string> = Object.fromEntries(UNLOCK_TECH_ENTRIES);

const TIER_OVERRIDES: Record<string, ResourceTier> = {
  Flour: 2,
  Bread: 2,
  ["Fish Oil"]: 2,
  Leather: 2,
  Milk: 2,
  Cheese: 2,
  Butter: 2,
  Linen: 3,
  Cloth: 3,
  Paper: 3,
  Glass: 3,
  Brick: 3,
  Ceramics: 3,
  Cement: 3,
  Concrete: 3,
  Machinery: 3,
  Locomotive: 3,
  ["Armor Plate"]: 3,
};

const KIND_OVERRIDES: Record<string, ResourceKind> = {};

const KIND_MULTIPLER: Record<ResourceKind, number> = {
  abstract: 0,
  strategic: 3,
  luxury: 5,
  food: 1,
  agricultural: 1,
  animal: 1,
  mineral: 1,
  metal: 2,
  precious: 8,
  gemstone: 10,
  energy: 2,
  chemical: 3,
  forest: 1,
  textile: 2,
  marine: 1,
  industrial: 4,
  technological: 8,
  medicinal: 3,
  cultural: 5,
};

const TIER_VALUE: Record<ResourceTier, number> = {
  1: 1,
  2: 3,
  3: 9,
  4: 30,
};

const TIER_WEIGHT: Record<ResourceTier, number> = {
  1: 1,
  2: 0.8,
  3: 0.5,
  4: 0.25,
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildResources(): Resource[] {
  const resources: Resource[] = [];
  const seen = new Set<string>();

  for (const category of RESOURCE_CATEGORIES) {
    const names = NAME_LISTS[category.key] ?? [];
    for (const name of names) {
      const key = slugify(name);
      if (seen.has(key)) continue;
      seen.add(key);
      const tier = TIER_OVERRIDES[key] ?? DEFAULT_TIER[category.key];
      const kind = KIND_OVERRIDES[key] ?? (category.key === "strategic" ? "strategic" : category.key);
      resources.push({
        key,
        name,
        category: category.key,
        tier,
        kind,
        value: TIER_VALUE[tier] * KIND_MULTIPLER[kind],
        weight: TIER_WEIGHT[tier],
        unlockTechKey: UNLOCK_TECHS[name] ?? UNLOCK_TECHS[key] ?? null,
      });
    }
  }

  return resources.sort((a, b) => {
    const cat = RESOURCE_CATEGORIES.findIndex((c) => c.key === a.category);
    const catB = RESOURCE_CATEGORIES.findIndex((c) => c.key === b.category);
    if (cat !== catB) return cat - catB;
    return a.name.localeCompare(b.name);
  });
}

export const RESOURCES: Resource[] = buildResources();

export const RESOURCE_BY_KEY: Map<string, Resource> = new Map(RESOURCES.map((r) => [r.key, r]));

export const CATEGORY_BY_KEY: Map<string, ResourceCategory> = new Map(
  RESOURCE_CATEGORIES.map((c) => [c.key, c]),
);