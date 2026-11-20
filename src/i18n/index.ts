// Localization layer. English is the source language and lives in the game
// data (technologies, infrastructure, recipes); the other languages are
// translation tables in ./content.ts. UI chrome is fully defined per language
// here so a missing key is a compile error.

export const LANGUAGES = ["en", "es", "de", "ja"] as const;
export type Language = (typeof LANGUAGES)[number];
export const DEFAULT_LANGUAGE: Language = "en";
export const LANGUAGE_STORAGE_KEY = "civsgame.language";

export const LANGUAGE_NAMES: Record<Language, string> = {
  es: "Español",
  en: "English",
  de: "Deutsch",
  ja: "日本語",
};

/** Display order for the language picker. */
export const LANGUAGE_ORDER: Language[] = ["es", "en", "de", "ja"];

export const VIEW_KEYS = [
  "Overview",
  "Resources",
  "Production",
  "Economy",
  "Research",
  "Infrastructure",
  "Military",
  "Politics",
  "Intelligence",
  "Settings",
] as const;
export type ViewKey = (typeof VIEW_KEYS)[number];

export type Trend = "rising" | "falling" | "steady";

import { RECIPE_TEXT, RESOURCE_TEXT } from "./content";

export interface Messages {
  civilizationOnline: string;
  leader: string;
  era: string;
  nextTick: string;
  settings: string;
  help: string;

  loginTitle: string;
  registerTitle: string;
  leaderName: string;
  usernameLabel: string;
  passwordLabel: string;
  displayNameLabel: string;
  enterName: string;
  enterUsername: string;
  enterPassword: string;
  enterDisplayName: string;
  enterLogin: string;
  enterRegister: string;
  noAccount: string;
  haveAccount: string;
  accountLabel: string;
  logoutButton: string;
  checkingSession: string;
  loadingCivilization: string;
  loadFailed: (error: string) => string;
  retryButton: string;
  saveFailed: string;
  newTribeTitle: string;
  newTribeIntro: string;
  enterTribeName: string;
  enterCivilizationName: string;
  enterBegin: string;
  mainMenuTitle: string;

  views: Record<ViewKey, string>;

  populationLabel: string;
  allocatedLabel: string;
  freeLabel: string;
  nextMealLabel: string;
  nextMealIn: (time: string) => string;
  everyHours: (hours: number) => string;
  overAllocated: (n: number) => string;
  applyButton: string;
  unsavedChanges: string;
  sliderAria: (category: string) => string;
  decreaseAria: (category: string) => string;
  amountAria: (category: string) => string;
  increaseAria: (category: string) => string;

  netChange: (hours: number) => string;
  noResources: string;

  assignResearch: string;
  researchersLabel: string;
  researchPoints: (n: number) => string;
  activeLabel: string;
  cancelButton: string;
  noActiveResearch: string;
  requiresLabel: string;
  costLabel: (cost: number, time: string) => string;
  doneLabel: string;
  noResearchers: string;
  researchQueueLabel: string;
  buildQueueLabel: string;
  queuedLabel: string;
  removeButton: string;

  workersLabel: string;
  laborPoints: (n: number) => string;
  productionHint: string;
  noProductiveBuildings: string;
  producing: (label: string, rate: string, resource: string) => string;
  inactiveLabel: string;
  productionPrefix: string;
  inactiveButton: string;

  buildingLabel: string;
  buildButton: string;
  buildUnlocked: string;
  assignWorkers: string;

  legitimacyLabel: string;
  happinessLabel: string;
  moods: {
    content: string;
    uneasy: string;
    angry: string;
    revolting: string;
  };
  trendLabel: (trend: Trend, target: number) => string;
  mealIntervalLabel: string;
  mealIntervalHint: string;
  mealIntervalAria: string;
  foodPerMeal: (food: number, rate: string) => string;
  intervalLong: string;
  intervalShort: string;
  intervalDefault: string;

  languageLabel: string;
  languageHint: string;

  durationMinutes: (n: number) => string;
  durationHours: (h: number) => string;
  durationHoursMinutes: (h: number, m: number) => string;
  durationDays: (d: number) => string;
  durationDaysHours: (d: number, h: number) => string;
  seconds: (n: number) => string;
  perHour: (rate: string) => string;
  optionTitle: (label: string, rate: string, resource: string) => string;
}

const en: Messages = {
  civilizationOnline: "Civilization Online",
  leader: "Leader:",
  era: "Era:",
  nextTick: "Next Tick:",
  settings: "Settings",
  help: "Help",

  loginTitle: "LOGIN",
  registerTitle: "REGISTER",
  leaderName: "Leader name:",
  usernameLabel: "Username:",
  passwordLabel: "Password:",
  displayNameLabel: "Display name:",
  enterName: "Enter name...",
  enterUsername: "Enter username...",
  enterPassword: "Enter password...",
  enterDisplayName: "How others see you...",
  enterLogin: "[Enter] Login",
  enterRegister: "[Enter] Register",
  noAccount: "No account yet?",
  haveAccount: "Already have an account?",
  accountLabel: "Account:",
  logoutButton: "[Logout]",
  checkingSession: "Checking session...",
  loadingCivilization: "Loading civilization...",
  loadFailed: (error) => `Could not load your civilization: ${error}`,
  retryButton: "[Retry]",
  saveFailed: "Save failed",
  newTribeTitle: "NEW TRIBE",
  newTribeIntro:
    "You and your people start leaving the caves, and venture into open world, until you find the perfect spot to start living.",
  enterTribeName: "Enter tribe name...",
  enterCivilizationName: "Enter civilization name...",
  enterBegin: "[Enter] Begin",
  mainMenuTitle: "MAIN MENU",

  views: {
    Overview: "Overview",
    Resources: "Resources",
    Production: "Production",
    Economy: "Economy",
    Research: "Research",
    Infrastructure: "Infrastructure",
    Military: "Military",
    Politics: "Politics",
    Intelligence: "Intelligence",
    Settings: "Settings",
  },

  populationLabel: "Population:",
  allocatedLabel: "Allocated:",
  freeLabel: "Free:",
  nextMealLabel: "Next meal:",
  nextMealIn: (time) => `in ${time}`,
  everyHours: (hours) => `(every ${hours}h)`,
  overAllocated: (n) => `Over-allocated by ${n}. Reduce a slider.`,
  applyButton: "[Apply]",
  unsavedChanges: "Unsaved changes.",
  sliderAria: (category) => `${category} slider`,
  decreaseAria: (category) => `Decrease ${category}`,
  amountAria: (category) => `${category} amount`,
  increaseAria: (category) => `Increase ${category}`,

  netChange: (hours) => `Net change per hour. Food is eaten every ${hours}h.`,
  noResources: "No resources yet.",

  assignResearch: "Assign population into research.",
  researchersLabel: "Researchers:",
  researchPoints: (n) => `+${n} Research pts`,
  activeLabel: "Active:",
  cancelButton: "[Cancel]",
  noActiveResearch: "No active research. Pick a bright node below.",
  requiresLabel: "Requires:",
  costLabel: (cost, time) => `Cost ${cost} pts · ${time}`,
  doneLabel: "done",
  noResearchers: "-- min",
  researchQueueLabel: "Research queue:",
  buildQueueLabel: "Construction queue:",
  queuedLabel: "queued",
  removeButton: "[Remove]",

  workersLabel: "Workers:",
  laborPoints: (n) => `+${n} Labor pts`,
  productionHint:
    "Built resource buildings work only when you pick what they produce. Unset = inactive. Every food recipe adds to the same Food stockpile.",
  noProductiveBuildings:
    "No productive buildings yet. Research (e.g. Agriculture for Farm), then build in Infrastructure — they will show up here.",
  producing: (label, rate, resource) => `producing ${label} (${rate} ${resource}/h)`,
  inactiveLabel: "inactive",
  productionPrefix: "Production:",
  inactiveButton: "[Inactive]",

  buildingLabel: "Building:",
  buildButton: "[Build]",
  buildUnlocked: "Build (unlocked by research):",
  assignWorkers: "assign Workers",

  legitimacyLabel: "Legitimacy:",
  happinessLabel: "Happiness:",
  moods: {
    content: "Content",
    uneasy: "Uneasy",
    angry: "Angry",
    revolting: "Revolting",
  },
  trendLabel: (trend, target) =>
    trend === "rising" ? `, rising to ${target}` : trend === "falling" ? `, falling to ${target}` : "",
  mealIntervalLabel: "Meal interval:",
  mealIntervalHint: "— how often citizens eat.",
  mealIntervalAria: "Meal interval",
  foodPerMeal: (food, rate) => `${food} food per meal, about ${rate} food/h.`,
  intervalLong: "Longer intervals save food, but citizens resent skipping meals.",
  intervalShort: "Frequent meals keep citizens happy, but food runs out faster.",
  intervalDefault: "Default schedule: balanced food use and mood.",

  languageLabel: "Language:",
  languageHint: "Changes all interface text and game content.",

  durationMinutes: (n) => `${n} min`,
  durationHours: (h) => `${h}h`,
  durationHoursMinutes: (h, m) => `${h}h ${m}m`,
  durationDays: (d) => `${d}d`,
  durationDaysHours: (d, h) => `${d}d ${h}h`,
  seconds: (n) => `${n}s`,
  perHour: (rate) => `${rate}/h`,
  optionTitle: (label, rate, resource) => `${label}: ${rate} ${resource}/h per labor per building`,
};

const es: Messages = {
  civilizationOnline: "Civilization Online",
  leader: "Líder:",
  era: "Era:",
  nextTick: "Siguiente tick:",
  settings: "Ajustes",
  help: "Ayuda",

  loginTitle: "INICIAR SESIÓN",
  registerTitle: "REGISTRO",
  leaderName: "Nombre del líder:",
  usernameLabel: "Nombre de usuario:",
  passwordLabel: "Contraseña:",
  displayNameLabel: "Nombre visible:",
  enterName: "Escribe tu nombre...",
  enterUsername: "Escribe tu usuario...",
  enterPassword: "Escribe tu contraseña...",
  enterDisplayName: "Cómo te ven los demás...",
  enterLogin: "[Enter] Entrar",
  enterRegister: "[Enter] Registrarse",
  noAccount: "¿Aún no tienes cuenta?",
  haveAccount: "¿Ya tienes cuenta?",
  accountLabel: "Cuenta:",
  logoutButton: "[Salir]",
  checkingSession: "Comprobando sesión...",
  loadingCivilization: "Cargando civilización...",
  loadFailed: (error) => `No se pudo cargar tu civilización: ${error}`,
  retryButton: "[Reintentar]",
  saveFailed: "Error al guardar",
  newTribeTitle: "NUEVA TRIBU",
  newTribeIntro:
    "Tú y tu pueblo salís de las cuevas y os aventuráis al mundo abierto hasta encontrar el lugar perfecto para vivir.",
  enterTribeName: "Nombre de la tribu...",
  enterCivilizationName: "Nombre de la civilización...",
  enterBegin: "[Enter] Comenzar",
  mainMenuTitle: "MENÚ PRINCIPAL",

  views: {
    Overview: "Resumen",
    Resources: "Recursos",
    Production: "Producción",
    Economy: "Economía",
    Research: "Investigación",
    Infrastructure: "Infraestructura",
    Military: "Militar",
    Politics: "Política",
    Intelligence: "Inteligencia",
    Settings: "Ajustes",
  },

  populationLabel: "Población:",
  allocatedLabel: "Asignados:",
  freeLabel: "Libres:",
  nextMealLabel: "Próxima comida:",
  nextMealIn: (time) => `en ${time}`,
  everyHours: (hours) => `(cada ${hours} h)`,
  overAllocated: (n) => `Exceso de asignación: ${n}. Reduce un control.`,
  applyButton: "[Aplicar]",
  unsavedChanges: "Cambios sin guardar.",
  sliderAria: (category) => `Control de ${category}`,
  decreaseAria: (category) => `Reducir ${category}`,
  amountAria: (category) => `Cantidad de ${category}`,
  increaseAria: (category) => `Aumentar ${category}`,

  netChange: (hours) => `Cambio neto por hora. Se come cada ${hours} h.`,
  noResources: "Aún no hay recursos.",

  assignResearch: "Asigna población a investigación.",
  researchersLabel: "Investigadores:",
  researchPoints: (n) => `+${n} pts de investigación`,
  activeLabel: "Activo:",
  cancelButton: "[Cancelar]",
  noActiveResearch: "No hay investigación activa. Elige un nodo iluminado abajo.",
  requiresLabel: "Requiere:",
  costLabel: (cost, time) => `Coste ${cost} pts · ${time}`,
  doneLabel: "completado",
  noResearchers: "-- min",
  researchQueueLabel: "Cola de investigación:",
  buildQueueLabel: "Cola de construcción:",
  queuedLabel: "en cola",
  removeButton: "[Quitar]",

  workersLabel: "Trabajadores:",
  laborPoints: (n) => `+${n} pts de mano de obra`,
  productionHint:
    "Los edificios de recursos solo funcionan cuando eliges qué producen. Sin asignar = inactivos. Todas las recetas de comida llenan la misma reserva de Comida.",
  noProductiveBuildings:
    "Aún no hay edificios productivos. Investiga (p. ej. Agricultura para la Granja) y construye en Infraestructura; aparecerán aquí.",
  producing: (label, rate, resource) => `produciendo ${label} (${rate} ${resource}/h)`,
  inactiveLabel: "inactivo",
  productionPrefix: "Producción:",
  inactiveButton: "[Inactivo]",

  buildingLabel: "Edificio:",
  buildButton: "[Construir]",
  buildUnlocked: "Construir (desbloqueado por investigación):",
  assignWorkers: "asigna trabajadores",

  legitimacyLabel: "Legitimidad:",
  happinessLabel: "Felicidad:",
  moods: {
    content: "Contentos",
    uneasy: "Inquietos",
    angry: "Enojados",
    revolting: "En revuelta",
  },
  trendLabel: (trend, target) =>
    trend === "rising" ? `, subiendo hacia ${target}` : trend === "falling" ? `, bajando hacia ${target}` : "",
  mealIntervalLabel: "Intervalo entre comidas:",
  mealIntervalHint: "— cada cuánto comen los ciudadanos.",
  mealIntervalAria: "Intervalo entre comidas",
  foodPerMeal: (food, rate) => `${food} de comida por comida, unas ${rate} de comida/h.`,
  intervalLong: "Intervalos más largos ahorran comida, pero los ciudadanos se resienten.",
  intervalShort: "Comidas frecuentes mantienen felices a los ciudadanos, pero la comida se agota antes.",
  intervalDefault: "Calendario predeterminado: equilibrio entre comida y ánimo.",

  languageLabel: "Idioma:",
  languageHint: "Cambia todo el texto de la interfaz y el contenido del juego.",

  durationMinutes: (n) => `${n} min`,
  durationHours: (h) => `${h} h`,
  durationHoursMinutes: (h, m) => `${h} h ${m} min`,
  durationDays: (d) => `${d} d`,
  durationDaysHours: (d, h) => `${d} d ${h} h`,
  seconds: (n) => `${n}s`,
  perHour: (rate) => `${rate}/h`,
  optionTitle: (label, rate, resource) => `${label}: ${rate} ${resource}/h por trabajador y edificio`,
};

const de: Messages = {
  civilizationOnline: "Civilization Online",
  leader: "Anführer:",
  era: "Zeitalter:",
  nextTick: "Nächster Tick:",
  settings: "Einstellungen",
  help: "Hilfe",

  loginTitle: "ANMELDEN",
  registerTitle: "REGISTRIEREN",
  leaderName: "Name des Anführers:",
  usernameLabel: "Benutzername:",
  passwordLabel: "Passwort:",
  displayNameLabel: "Anzeigename:",
  enterName: "Namen eingeben...",
  enterUsername: "Benutzernamen eingeben...",
  enterPassword: "Passwort eingeben...",
  enterDisplayName: "So sehen dich andere...",
  enterLogin: "[Enter] Anmelden",
  enterRegister: "[Enter] Registrieren",
  noAccount: "Noch kein Konto?",
  haveAccount: "Schon ein Konto?",
  accountLabel: "Konto:",
  logoutButton: "[Abmelden]",
  checkingSession: "Sitzung wird geprüft...",
  loadingCivilization: "Zivilisation wird geladen...",
  loadFailed: (error) => `Zivilisation konnte nicht geladen werden: ${error}`,
  retryButton: "[Erneut versuchen]",
  saveFailed: "Speichern fehlgeschlagen",
  newTribeTitle: "NEUER STAMM",
  newTribeIntro:
    "Du und dein Volk verlassen die Höhlen und ziehen in die offene Welt, bis ihr den perfekten Ort zum Leben findet.",
  enterTribeName: "Stammesnamen eingeben...",
  enterCivilizationName: "Namen der Zivilisation eingeben...",
  enterBegin: "[Enter] Beginnen",
  mainMenuTitle: "HAUPTMENÜ",

  views: {
    Overview: "Übersicht",
    Resources: "Ressourcen",
    Production: "Produktion",
    Economy: "Wirtschaft",
    Research: "Forschung",
    Infrastructure: "Infrastruktur",
    Military: "Militär",
    Politics: "Politik",
    Intelligence: "Geheimdienst",
    Settings: "Einstellungen",
  },

  populationLabel: "Bevölkerung:",
  allocatedLabel: "Zugewiesen:",
  freeLabel: "Frei:",
  nextMealLabel: "Nächste Mahlzeit:",
  nextMealIn: (time) => `in ${time}`,
  everyHours: (hours) => `(alle ${hours} Std.)`,
  overAllocated: (n) => `Überbelegt um ${n}. Reduziere einen Regler.`,
  applyButton: "[Anwenden]",
  unsavedChanges: "Ungespeicherte Änderungen.",
  sliderAria: (category) => `${category}-Regler`,
  decreaseAria: (category) => `${category} verringern`,
  amountAria: (category) => `${category}-Menge`,
  increaseAria: (category) => `${category} erhöhen`,

  netChange: (hours) => `Nettoveränderung pro Stunde. Gegessen wird alle ${hours} Std.`,
  noResources: "Noch keine Ressourcen.",

  assignResearch: "Weise Bevölkerung der Forschung zu.",
  researchersLabel: "Forscher:",
  researchPoints: (n) => `+${n} Forschungspunkte`,
  activeLabel: "Aktiv:",
  cancelButton: "[Abbrechen]",
  noActiveResearch: "Keine aktive Forschung. Wähle unten einen hellen Knoten.",
  requiresLabel: "Benötigt:",
  costLabel: (cost, time) => `Kosten ${cost} Pkt. · ${time}`,
  doneLabel: "fertig",
  noResearchers: "-- Min.",
  researchQueueLabel: "Forschungswarteschlange:",
  buildQueueLabel: "Bauwarteschlange:",
  queuedLabel: "in Warteschlange",
  removeButton: "[Entfernen]",

  workersLabel: "Arbeiter:",
  laborPoints: (n) => `+${n} Arbeitspunkte`,
  productionHint:
    "Gebäude für Ressourcen arbeiten nur, wenn du ihre Produktion wählst. Nicht gesetzt = inaktiv. Alle Essensrezepte füllen denselben Nahrungsvorrat.",
  noProductiveBuildings:
    "Noch keine produktiven Gebäude. Forsche (z. B. Landwirtschaft für den Bauernhof) und baue dann unter Infrastruktur; hier erscheinen sie.",
  producing: (label, rate, resource) => `produziert ${label} (${rate} ${resource}/Std.)`,
  inactiveLabel: "inaktiv",
  productionPrefix: "Produktion:",
  inactiveButton: "[Inaktiv]",

  buildingLabel: "Gebäude:",
  buildButton: "[Bauen]",
  buildUnlocked: "Bauen (durch Forschung freigeschaltet):",
  assignWorkers: "Arbeiter zuweisen",

  legitimacyLabel: "Legitimität:",
  happinessLabel: "Zufriedenheit:",
  moods: {
    content: "Zufrieden",
    uneasy: "Unruhig",
    angry: "Wütend",
    revolting: "Aufständisch",
  },
  trendLabel: (trend, target) =>
    trend === "rising" ? `, steigend auf ${target}` : trend === "falling" ? `, fallend auf ${target}` : "",
  mealIntervalLabel: "Mahlzeitenintervall:",
  mealIntervalHint: "— wie oft Bürger essen.",
  mealIntervalAria: "Mahlzeitenintervall",
  foodPerMeal: (food, rate) => `${food} Nahrung pro Mahlzeit, etwa ${rate} Nahrung/Std.`,
  intervalLong: "Längere Intervalle sparen Nahrung, aber die Bürger ärgern sich über ausgelassene Mahlzeiten.",
  intervalShort: "Häufige Mahlzeiten halten die Bürger zufrieden, aber die Nahrung geht schneller aus.",
  intervalDefault: "Standardplan: ausgewogene Nahrungsnutzung und Stimmung.",

  languageLabel: "Sprache:",
  languageHint: "Ändert alle Texte der Oberfläche und die Spielinhalte.",

  durationMinutes: (n) => `${n} Min.`,
  durationHours: (h) => `${h} Std.`,
  durationHoursMinutes: (h, m) => `${h} Std. ${m} Min.`,
  durationDays: (d) => `${d} Tg.`,
  durationDaysHours: (d, h) => `${d} Tg. ${h} Std.`,
  seconds: (n) => `${n}s`,
  perHour: (rate) => `${rate}/Std.`,
  optionTitle: (label, rate, resource) => `${label}: ${rate} ${resource}/Std. pro Arbeiter und Gebäude`,
};

const ja: Messages = {
  civilizationOnline: "Civilization Online",
  leader: "指導者:",
  era: "時代:",
  nextTick: "次のティック:",
  settings: "設定",
  help: "ヘルプ",

  loginTitle: "ログイン",
  registerTitle: "登録",
  leaderName: "指導者名:",
  usernameLabel: "ユーザー名:",
  passwordLabel: "パスワード:",
  displayNameLabel: "表示名:",
  enterName: "名前を入力...",
  enterUsername: "ユーザー名を入力...",
  enterPassword: "パスワードを入力...",
  enterDisplayName: "他の人に表示される名前...",
  enterLogin: "[Enter] ログイン",
  enterRegister: "[Enter] 登録",
  noAccount: "アカウントをお持ちでないですか？",
  haveAccount: "すでにアカウントをお持ちですか？",
  accountLabel: "アカウント:",
  logoutButton: "[ログアウト]",
  checkingSession: "セッションを確認中...",
  loadingCivilization: "文明を読み込み中...",
  loadFailed: (error) => `文明を読み込めませんでした: ${error}`,
  retryButton: "[再試行]",
  saveFailed: "保存に失敗しました",
  newTribeTitle: "新しい部族",
  newTribeIntro:
    "あなたと民は洞窟を離れ、住むのに最適な場所を求めて広い世界へ旅立ちます。",
  enterTribeName: "部族名を入力...",
  enterCivilizationName: "文明名を入力...",
  enterBegin: "[Enter] 開始",
  mainMenuTitle: "メインメニュー",

  views: {
    Overview: "概要",
    Resources: "資源",
    Production: "生産",
    Economy: "経済",
    Research: "研究",
    Infrastructure: "インフラ",
    Military: "軍事",
    Politics: "政治",
    Intelligence: "諜報",
    Settings: "設定",
  },

  populationLabel: "人口:",
  allocatedLabel: "割当:",
  freeLabel: "余剰:",
  nextMealLabel: "次の食事:",
  nextMealIn: (time) => `${time}後`,
  everyHours: (hours) => `（${hours}時間ごと）`,
  overAllocated: (n) => `割当超過: ${n}。スライダーを減らしてください。`,
  applyButton: "[適用]",
  unsavedChanges: "未保存の変更があります。",
  sliderAria: (category) => `${category}スライダー`,
  decreaseAria: (category) => `${category}を減らす`,
  amountAria: (category) => `${category}の量`,
  increaseAria: (category) => `${category}を増やす`,

  netChange: (hours) => `1時間あたりの純変化。食事は${hours}時間ごと。`,
  noResources: "まだ資源がありません。",

  assignResearch: "研究に人口を割り当ててください。",
  researchersLabel: "研究者:",
  researchPoints: (n) => `+${n} 研究ポイント`,
  activeLabel: "進行中:",
  cancelButton: "[キャンセル]",
  noActiveResearch: "進行中の研究はありません。下の明るいノードを選んでください。",
  requiresLabel: "必要条件:",
  costLabel: (cost, time) => `コスト ${cost} pt · ${time}`,
  doneLabel: "完了",
  noResearchers: "-- 分",
  researchQueueLabel: "研究キュー:",
  buildQueueLabel: "建設キュー:",
  queuedLabel: "待機中",
  removeButton: "[解除]",

  workersLabel: "労働者:",
  laborPoints: (n) => `+${n} 労働ポイント`,
  productionHint:
    "資源建物は生産内容を選んだときだけ働きます。未設定＝停止。食料レシピはすべて同じ食料備蓄に加算されます。",
  noProductiveBuildings:
    "生産建物はまだありません。研究（例: 農業で農場）してインフラで建設すると、ここに表示されます。",
  producing: (label, rate, resource) => `${label}を生産中（${rate} ${resource}/時間）`,
  inactiveLabel: "停止",
  productionPrefix: "生産:",
  inactiveButton: "[停止]",

  buildingLabel: "建設中:",
  buildButton: "[建設]",
  buildUnlocked: "建設（研究で解放）:",
  assignWorkers: "労働者を割り当ててください",

  legitimacyLabel: "正統性:",
  happinessLabel: "幸福度:",
  moods: {
    content: "満足",
    uneasy: "不安",
    angry: "怒り",
    revolting: "反乱寸前",
  },
  trendLabel: (trend, target) =>
    trend === "rising" ? `、${target}へ上昇中` : trend === "falling" ? `、${target}へ下降中` : "",
  mealIntervalLabel: "食事間隔:",
  mealIntervalHint: "— 市民が食事をする頻度。",
  mealIntervalAria: "食事間隔",
  foodPerMeal: (food, rate) => `1食あたり${food}の食料、約${rate}食料/時間。`,
  intervalLong: "間隔を長くすると食料は節約できますが、食事を抜かれて市民は不満になります。",
  intervalShort: "食事の回数を増やすと市民は満足しますが、食料の減りが早くなります。",
  intervalDefault: "標準スケジュール: 食料と気分のバランスが取れています。",

  languageLabel: "言語:",
  languageHint: "インターフェースとゲーム内容のすべてのテキストを変更します。",

  durationMinutes: (n) => `${n}分`,
  durationHours: (h) => `${h}時間`,
  durationHoursMinutes: (h, m) => `${h}時間${m}分`,
  durationDays: (d) => `${d}日`,
  durationDaysHours: (d, h) => `${d}日${h}時間`,
  seconds: (n) => `${n}秒`,
  perHour: (rate) => `${rate}/時間`,
  optionTitle: (label, rate, resource) => `${label}: 労働者・建物あたり ${rate} ${resource}/時間`,
};

export const UI: Record<Language, Messages> = { en, es, de, ja };

/** Format a tick count as localized real time (min/h/d). 1 tick = 1 minute. */
export function formatDuration(ticks: number, lang: Language = DEFAULT_LANGUAGE): string {
  const t = UI[lang];
  const total = Math.max(0, Math.ceil(ticks));
  if (total < 60) return t.durationMinutes(total);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h < 24) return m === 0 ? t.durationHours(h) : t.durationHoursMinutes(h, m);
  const d = Math.floor(h / 24);
  const rh = h % 24;
  return rh === 0 ? t.durationDays(d) : t.durationDaysHours(d, rh);
}

export {
  TECH_TEXT,
  ERA_TEXT,
  BUILDING_TEXT,
  BUILDING_GROUP_TEXT,
  RESOURCE_TEXT,
  RECIPE_TEXT,
} from "./content";

/** Localized stockpile resource label. */
export function resourceLabel(key: string, lang: Language): string {
  return RESOURCE_TEXT[lang][key] ?? key;
}

/** Localized production recipe label. */
export function recipeLabel(id: string, lang: Language): string {
  return RECIPE_TEXT[lang][id] ?? id;
}
