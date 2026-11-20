// Civipedia content. Data tables (buildings, rates, technologies) are rendered
// from the game data at runtime; this file only holds the prose and labels.

import type { Language } from "./index";

export const HELP_TOPICS = [
  "basics",
  "population",
  "food",
  "production",
  "research",
  "construction",
  "buildings",
  "technologies",
  "politics",
] as const;

export type HelpTopic = (typeof HELP_TOPICS)[number];

export interface HelpSection {
  title: string;
  body: string[];
  bullets?: string[];
}

export interface HelpLabels {
  currentPopulation: string;
  housingCapacity: string;
  mealNeed: string;
  building: string;
  cost: string;
  unlockedBy: string;
  capacity: string;
  production: string;
  option: string;
  produces: string;
  perHour: string;
  perLaborBuilding: string;
  technology: string;
  requires: string;
  unlocks: string;
  none: string;
  start: string;
  boosts: Record<string, string>;
}

export interface HelpText {
  title: string;
  subtitle: string;
  topics: Record<HelpTopic, string>;
  sections: Record<HelpTopic, HelpSection>;
  labels: HelpLabels;
}

const en: HelpText = {
  title: "CIVIPEDIA",
  subtitle: "Everything you need to know about running a civilization.",
  topics: {
    basics: "Basics",
    population: "Population",
    food: "Food",
    production: "Production",
    research: "Research",
    construction: "Construction",
    buildings: "Buildings",
    technologies: "Technologies",
    politics: "Politics",
  },
  sections: {
    basics: {
      title: "Basics",
      body: [
        "This is a real-time civilization simulation: one tick is one real minute.",
        "The clock follows your local time. Time that passes while the game is closed is simulated when you return, so research, construction, production and meals keep going.",
        "Progress saves automatically: player actions save immediately, and ticks save within a second.",
      ],
      bullets: [
        "Number keys 1-9 switch views. Press ? to open the Civipedia.",
        "The top bar shows your civilization, era and the seconds until the next tick.",
      ],
    },
    population: {
      title: "Population",
      body: [
        "Citizens are either allocated to a category or free. Only allocated citizens work.",
        "Housing sets the population limit. Build Huts, Longhouses, Houses and Apartments to raise it.",
        "When food is in surplus, the settlement grows by one citizen every 60 ticks (1 hour), up to the housing limit.",
      ],
      bullets: [
        "Production: produces resources in active buildings.",
        "Economy: treasury and taxes (not simulated yet).",
        "Research: generates research points.",
        "Infrastructure: generates construction labor.",
        "Military: units (not simulated yet).",
        "Politics: legitimacy and public mood.",
        "Intelligence: discovers other civilizations.",
      ],
    },
    food: {
      title: "Food",
      body: [
        "Every food type shares a single stockpile.",
        "Citizens eat every meal interval set in Politics (1-12 hours, default 8).",
        "Allocated citizens eat 1 food per meal; free citizens eat 0.5, rounded down.",
        "If the stockpile cannot cover a meal, every missing meal kills one citizen.",
      ],
      bullets: [
        "Shorter intervals keep citizens happier but consume food faster.",
        "Longer intervals make food last longer but lower happiness.",
      ],
    },
    production: {
      title: "Production",
      body: [
        "Citizens allocated to Production are workers: 1 worker = 1 labor point per tick.",
        "Each labor point is applied to every active building at once.",
        "A building produces nothing until you choose an output in the Production view.",
      ],
    },
    research: {
      title: "Research",
      body: [
        "1 researcher = 1 research point per tick.",
        "One technology is active at a time; more can be queued.",
        "Progress is kept per technology, so cancelling does not lose it.",
        "Technologies unlock buildings and permanent boosts.",
      ],
    },
    construction: {
      title: "Construction",
      body: [
        "1 worker in Infrastructure = 1 construction labor per tick.",
        "One building is built at a time; more can be queued.",
        "The next unit costs base cost x (owned + 1): the first Hut costs 10, the second 20, and so on.",
        "Cancelling the active build discards its progress.",
      ],
    },
    buildings: {
      title: "Buildings",
      body: [
        "Every building, its base cost, the technology that unlocks it and what it can produce.",
      ],
    },
    technologies: {
      title: "Technologies",
      body: [
        "The full technology catalog by era. Research one at a time in the Research view.",
      ],
    },
    politics: {
      title: "Politics",
      body: [
        "Happiness drifts toward the mood implied by the meal interval.",
        "8 hours is neutral. Each hour shorter adds +6 happiness; each hour longer subtracts 6, clamped to 0-100.",
        "Legitimacy is tracked, but no actions affect it yet.",
      ],
    },
  },
  labels: {
    currentPopulation: "Current population",
    housingCapacity: "Housing capacity",
    mealNeed: "Food per meal",
    building: "Building",
    cost: "Cost",
    unlockedBy: "Unlocked by",
    capacity: "Housing",
    production: "Production",
    option: "Option",
    produces: "Produces",
    perHour: "/h",
    perLaborBuilding: "per labor point / building",
    technology: "Technology",
    requires: "Requires",
    unlocks: "Unlocks",
    none: "-",
    start: "Start",
    boosts: {
      militaryStrength: "military strength",
      exploration: "exploration",
      researchSpeed: "research speed",
      economyOutput: "economy",
      populationGrowth: "population growth",
      intelligence: "intelligence",
    },
  },
};

const es: HelpText = {
  title: "CIVIPEDIA",
  subtitle: "Todo lo que necesitas saber para dirigir una civilización.",
  topics: {
    basics: "Conceptos",
    population: "Población",
    food: "Comida",
    production: "Producción",
    research: "Investigación",
    construction: "Construcción",
    buildings: "Edificios",
    technologies: "Tecnologías",
    politics: "Política",
  },
  sections: {
    basics: {
      title: "Conceptos básicos",
      body: [
        "Esta es una simulación de civilización en tiempo real: un tick equivale a un minuto real.",
        "El reloj sigue tu hora local. El tiempo que pasa con el juego cerrado se simula al volver, así que la investigación, la construcción, la producción y las comidas continúan.",
        "El progreso se guarda automáticamente: las acciones se guardan al instante y los ticks en menos de un segundo.",
      ],
      bullets: [
        "Las teclas 1-9 cambian de vista. Pulsa ? para abrir la Civipedia.",
        "La barra superior muestra tu civilización, la era y los segundos hasta el siguiente tick.",
      ],
    },
    population: {
      title: "Población",
      body: [
        "Los ciudadanos están asignados a una categoría o libres. Solo los asignados trabajan.",
        "La vivienda marca el límite de población. Construye Chozas, Casas comunales, Casas y Apartamentos para aumentarlo.",
        "Con comida en excedente, el asentamiento crece un ciudadano cada 60 ticks (1 hora), hasta el límite de vivienda.",
      ],
      bullets: [
        "Producción: genera recursos en los edificios activos.",
        "Economía: tesoro e impuestos (aún no simulados).",
        "Investigación: genera puntos de investigación.",
        "Infraestructura: genera mano de obra de construcción.",
        "Militar: unidades (aún no simuladas).",
        "Política: legitimidad y ánimo público.",
        "Inteligencia: descubre otras civilizaciones.",
      ],
    },
    food: {
      title: "Comida",
      body: [
        "Todos los tipos de comida comparten una única reserva.",
        "Los ciudadanos comen cada intervalo de comida definido en Política (1-12 horas, por defecto 8).",
        "Los ciudadanos asignados comen 1 de comida por comida; los libres comen 0,5, redondeado hacia abajo.",
        "Si la reserva no cubre una comida, cada comida faltante mata a un ciudadano.",
      ],
      bullets: [
        "Intervalos más cortos mantienen felices a los ciudadanos pero consumen comida más rápido.",
        "Intervalos más largos hacen que la comida dure más pero bajan la felicidad.",
      ],
    },
    production: {
      title: "Producción",
      body: [
        "Los ciudadanos asignados a Producción son trabajadores: 1 trabajador = 1 punto de mano de obra por tick.",
        "Cada punto de mano de obra se aplica a todos los edificios activos a la vez.",
        "Un edificio no produce nada hasta que eliges un producto en la vista Producción.",
      ],
    },
    research: {
      title: "Investigación",
      body: [
        "1 investigador = 1 punto de investigación por tick.",
        "Solo hay una tecnología activa a la vez; se pueden encolar más.",
        "El progreso se guarda por tecnología, así que cancelar no lo pierde.",
        "Las tecnologías desbloquean edificios y mejoras permanentes.",
      ],
    },
    construction: {
      title: "Construcción",
      body: [
        "1 trabajador en Infraestructura = 1 de mano de obra de construcción por tick.",
        "Solo se construye un edificio a la vez; se pueden encolar más.",
        "La siguiente unidad cuesta coste base x (poseídos + 1): la primera Choza cuesta 10, la segunda 20, etc.",
        "Cancelar la construcción activa descarta su progreso.",
      ],
    },
    buildings: {
      title: "Edificios",
      body: [
        "Todos los edificios, su coste base, la tecnología que los desbloquea y lo que pueden producir.",
      ],
    },
    technologies: {
      title: "Tecnologías",
      body: [
        "El catálogo completo de tecnologías por era. Investiga una a la vez en la vista Investigación.",
      ],
    },
    politics: {
      title: "Política",
      body: [
        "La felicidad tiende hacia el ánimo que implica el intervalo de comidas.",
        "8 horas es neutro. Cada hora menos suma +6 de felicidad; cada hora más resta 6, entre 0 y 100.",
        "La legitimidad se registra, pero ninguna acción la afecta todavía.",
      ],
    },
  },
  labels: {
    currentPopulation: "Población actual",
    housingCapacity: "Capacidad de vivienda",
    mealNeed: "Comida por comida",
    building: "Edificio",
    cost: "Coste",
    unlockedBy: "Desbloqueado por",
    capacity: "Vivienda",
    production: "Producción",
    option: "Opción",
    produces: "Produce",
    perHour: "/h",
    perLaborBuilding: "por punto de mano de obra / edificio",
    technology: "Tecnología",
    requires: "Requiere",
    unlocks: "Desbloquea",
    none: "-",
    start: "Inicio",
    boosts: {
      militaryStrength: "fuerza militar",
      exploration: "exploración",
      researchSpeed: "velocidad de investigación",
      economyOutput: "economía",
      populationGrowth: "crecimiento poblacional",
      intelligence: "inteligencia",
    },
  },
};

const de: HelpText = {
  title: "CIVIPEDIA",
  subtitle: "Alles, was du zum Regieren einer Zivilisation wissen musst.",
  topics: {
    basics: "Grundlagen",
    population: "Bevölkerung",
    food: "Nahrung",
    production: "Produktion",
    research: "Forschung",
    construction: "Bau",
    buildings: "Gebäude",
    technologies: "Technologien",
    politics: "Politik",
  },
  sections: {
    basics: {
      title: "Grundlagen",
      body: [
        "Dies ist eine Echtzeit-Zivilisationssimulation: Ein Tick ist eine reale Minute.",
        "Die Uhr folgt deiner Ortszeit. Zeit, die bei geschlossenem Spiel vergeht, wird bei deiner Rückkehr simuliert, sodass Forschung, Bau, Produktion und Mahlzeiten weiterlaufen.",
        "Der Fortschritt wird automatisch gespeichert: Aktionen sofort, Ticks innerhalb einer Sekunde.",
      ],
      bullets: [
        "Die Tasten 1-9 wechseln die Ansicht. Drücke ?, um die Civipedia zu öffnen.",
        "Die obere Leiste zeigt Zivilisation, Zeitalter und die Sekunden bis zum nächsten Tick.",
      ],
    },
    population: {
      title: "Bevölkerung",
      body: [
        "Bürger sind entweder einer Kategorie zugewiesen oder frei. Nur zugewiesene Bürger arbeiten.",
        "Wohnraum begrenzt die Bevölkerung. Baue Hütten, Langhäuser, Häuser und Apartments, um das Limit zu erhöhen.",
        "Bei Nahrungsüberschuss wächst die Siedlung alle 60 Ticks (1 Stunde) um einen Bürger, bis zum Wohnlimit.",
      ],
      bullets: [
        "Produktion: erzeugt Ressourcen in aktiven Gebäuden.",
        "Wirtschaft: Schatz und Steuern (noch nicht simuliert).",
        "Forschung: erzeugt Forschungspunkte.",
        "Infrastruktur: erzeugt Bauarbeitskraft.",
        "Militär: Einheiten (noch nicht simuliert).",
        "Politik: Legitimität und öffentliche Stimmung.",
        "Geheimdienst: entdeckt andere Zivilisationen.",
      ],
    },
    food: {
      title: "Nahrung",
      body: [
        "Alle Nahrungsarten teilen sich einen Vorrat.",
        "Bürger essen im Mahlzeitenintervall aus der Politik (1-12 Stunden, Standard 8).",
        "Zugewiesene Bürger essen 1 Nahrung pro Mahlzeit; freie Bürger 0,5, abgerundet.",
        "Reicht der Vorrat nicht für eine Mahlzeit, stirbt pro fehlender Mahlzeit ein Bürger.",
      ],
      bullets: [
        "Kürzere Intervalle machen Bürger zufriedener, verbrauchen aber mehr Nahrung.",
        "Längere Intervalle sparen Nahrung, senken aber die Zufriedenheit.",
      ],
    },
    production: {
      title: "Produktion",
      body: [
        "Bürger in der Produktion sind Arbeiter: 1 Arbeiter = 1 Arbeitspunkt pro Tick.",
        "Jeder Arbeitspunkt wirkt gleichzeitig auf alle aktiven Gebäude.",
        "Ein Gebäude produziert nichts, bis du in der Produktionsansicht eine Ausgabe wählst.",
      ],
    },
    research: {
      title: "Forschung",
      body: [
        "1 Forscher = 1 Forschungspunkt pro Tick.",
        "Es ist immer nur eine Technologie aktiv; weitere können in die Warteschlange.",
        "Der Fortschritt bleibt pro Technologie erhalten, auch beim Abbrechen.",
        "Technologien schalten Gebäude und dauerhafte Verbesserungen frei.",
      ],
    },
    construction: {
      title: "Bau",
      body: [
        "1 Arbeiter in der Infrastruktur = 1 Bauarbeitspunkt pro Tick.",
        "Es wird immer nur ein Gebäude gebaut; weitere können in die Warteschlange.",
        "Die nächste Einheit kostet Basiskosten x (besessen + 1): die erste Hütte 10, die zweite 20 usw.",
        "Das Abbrechen des aktiven Baus verwirft den Fortschritt.",
      ],
    },
    buildings: {
      title: "Gebäude",
      body: [
        "Alle Gebäude, ihre Basiskosten, die freischaltende Technologie und ihre mögliche Produktion.",
      ],
    },
    technologies: {
      title: "Technologien",
      body: [
        "Der vollständige Technologiekatalog nach Zeitalter. Forsche immer eine in der Forschungsansicht.",
      ],
    },
    politics: {
      title: "Politik",
      body: [
        "Die Zufriedenheit nähert sich der Stimmung, die das Mahlzeitenintervall vorgibt.",
        "8 Stunden sind neutral. Jede Stunde weniger gibt +6 Zufriedenheit; jede Stunde mehr zieht 6 ab (0-100).",
        "Legitimität wird erfasst, aber noch von keiner Aktion beeinflusst.",
      ],
    },
  },
  labels: {
    currentPopulation: "Aktuelle Bevölkerung",
    housingCapacity: "Wohnkapazität",
    mealNeed: "Nahrung pro Mahlzeit",
    building: "Gebäude",
    cost: "Kosten",
    unlockedBy: "Freigeschaltet durch",
    capacity: "Wohnraum",
    production: "Produktion",
    option: "Option",
    produces: "Erzeugt",
    perHour: "/Std.",
    perLaborBuilding: "pro Arbeitspunkt / Gebäude",
    technology: "Technologie",
    requires: "Benötigt",
    unlocks: "Schaltet frei",
    none: "-",
    start: "Start",
    boosts: {
      militaryStrength: "Militärstärke",
      exploration: "Erkundung",
      researchSpeed: "Forschungsgeschwindigkeit",
      economyOutput: "Wirtschaft",
      populationGrowth: "Bevölkerungswachstum",
      intelligence: "Geheimdienst",
    },
  },
};

const ja: HelpText = {
  title: "シヴィペディア",
  subtitle: "文明を運営するために必要なすべての情報。",
  topics: {
    basics: "基本",
    population: "人口",
    food: "食料",
    production: "生産",
    research: "研究",
    construction: "建設",
    buildings: "建物",
    technologies: "技術",
    politics: "政治",
  },
  sections: {
    basics: {
      title: "基本",
      body: [
        "これはリアルタイムの文明シミュレーションです。1ティックは実時間1分です。",
        "時計は端末の現地時刻に従います。ゲームを閉じている間に経過した時間は、戻ったときにシミュレーションされます。研究・建設・生産・食事はその間も進みます。",
        "進行状況は自動保存されます。操作はすぐに、ティックは1秒以内に保存されます。",
      ],
      bullets: [
        "1〜9キーで画面を切り替えます。?を押すとシヴィペディアが開きます。",
        "上部バーに文明、時代、次のティックまでの秒数が表示されます。",
      ],
    },
    population: {
      title: "人口",
      body: [
        "市民は各カテゴリに割り当てられるか、余剰になります。働くのは割り当てられた市民だけです。",
        "住居が人口上限を決めます。小屋・長屋・家・アパートを建てて上限を増やします。",
        "食料に余剰があると、住居上限まで60ティック（1時間）ごとに市民が1人増えます。",
      ],
      bullets: [
        "生産: 稼働中の建物で資源を生産します。",
        "経済: 国庫と税（未実装）。",
        "研究: 研究ポイントを生みます。",
        "インフラ: 建設労働力を生みます。",
        "軍事: 部隊（未実装）。",
        "政治: 正統性と世論。",
        "諜報: 他の文明を発見します。",
      ],
    },
    food: {
      title: "食料",
      body: [
        "すべての食料は1つの備蓄にまとめられます。",
        "市民は政治で設定した食事間隔ごとに食事します（1〜12時間、既定8時間）。",
        "割り当てられた市民は1食につき食料1、余剰市民は0.5（切り捨て）を食べます。",
        "備蓄が1食分に足りない場合、足りない食料1につき市民1人が死亡します。",
      ],
      bullets: [
        "間隔を短くすると市民は満足しますが、食料の減りが早くなります。",
        "間隔を長くすると食料は長持ちしますが、幸福度が下がります。",
      ],
    },
    production: {
      title: "生産",
      body: [
        "生産に割り当てた市民は労働者です。1労働者 = 1ティックにつき労働ポイント1。",
        "各労働ポイントは、稼働中のすべての建物に同時に適用されます。",
        "生産画面で産物を選ぶまで、建物は何も生産しません。",
      ],
    },
    research: {
      title: "研究",
      body: [
        "研究者1人 = 1ティックにつき研究ポイント1。",
        "同時に研究できる技術は1つで、ほかは待機列に入れられます。",
        "進捗は技術ごとに保存されるため、キャンセルしても失われません。",
        "技術は建物や恒久的な強化を解放します。",
      ],
    },
    construction: {
      title: "建設",
      body: [
        "インフラに割り当てた労働者1人 = 1ティックにつき建設労働1。",
        "同時に建てられる建物は1つで、ほかは待機列に入れられます。",
        "次の1棟のコストは基本コスト×（保有数+1）です。最初の小屋は10、2棟目は20、以降も同様です。",
        "建設中の建物をキャンセルすると進捗は失われます。",
      ],
    },
    buildings: {
      title: "建物",
      body: [
        "すべての建物、基本コスト、解放する技術、生産できる内容の一覧です。",
      ],
    },
    technologies: {
      title: "技術",
      body: [
        "時代ごとの技術カタログです。研究画面で1つずつ研究します。",
      ],
    },
    politics: {
      title: "政治",
      body: [
        "幸福度は食事間隔が示す目標値に近づきます。",
        "8時間が中立です。1時間短いごとに幸福度+6、1時間長いごとに-6（0〜100）。",
        "正統性は記録されますが、まだ操作の影響を受けません。",
      ],
    },
  },
  labels: {
    currentPopulation: "現在の人口",
    housingCapacity: "住居容量",
    mealNeed: "1食あたりの食料",
    building: "建物",
    cost: "コスト",
    unlockedBy: "解放条件",
    capacity: "住居",
    production: "生産",
    option: "選択肢",
    produces: "生産物",
    perHour: "/時間",
    perLaborBuilding: "労働ポイント・建物あたり",
    technology: "技術",
    requires: "必要条件",
    unlocks: "解放",
    none: "-",
    start: "開始時",
    boosts: {
      militaryStrength: "軍事力",
      exploration: "探索",
      researchSpeed: "研究速度",
      economyOutput: "経済",
      populationGrowth: "人口増加",
      intelligence: "諜報",
    },
  },
};

export const HELP_TEXT: Record<Language, HelpText> = { en, es, de, ja };
