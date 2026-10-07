# Civilization Simulation Online — Game Design Document (GDD)

Core premise: Civilization Online, where player controls everything like a head of state.

## 1. High Concept

A persistent, multiplayer, incremental, terminal-based civilization simulation where each player governs their civilization.

The player is the Head of State. They control government policy, laws, taxes, public spending, infrastructure, economic strategy, foreign policy, military strategy, research priorities, industrial development, education, diplomacy, intelligence, and long-term national objectives.

The player does not directly control the population one by one. Citizens, businesses, politicians, generals, scientists, merchants and organizations are simulated actors with their own interests.

## 2. Design Pillars

- Civilization, not character: The player governs a civilization rather than inhabiting an individual role.
- Everything is connected: Resources, people, technology, institutions, infrastructure, markets, politics, diplomacy, and war influence one another.
- Resources become capabilities: A resource is not a simple unlock. Its value depends on industries, institutions, infrastructure, knowledge, labor, and capital.
- Consequences matter: Decisions propagate through the simulation and can create unintended outcomes.

## 3. The Player

Can: enact laws; issue policies; establish institutions; allocate budgets; set taxes; subsidize industries; establish trade agreements; declare wars; negotiate treaties; appoint officials; reorganize administration; set research priorities; order military campaigns; build infrastructure; regulate markets; fund education and healthcare; control immigration.

Cannot directly: command every citizen; instantly create industries; guarantee political support; make businesses profitable; force scientific discoveries; eliminate corruption instantly; guarantee military obedience; know everything happening inside the country.

The player governs through systems and institutions rather than direct unit-by-unit control.

## 4. Civilization Model

Core layers: Resources → Population → Production → Industries → Markets → Economy → Institutions → State → Politics → Diplomacy → Military.

Technology interacts with all layers rather than existing as a simple technology tree.

## 5. Resources

Resource categories include biological resources (horses, cattle, grain, timber, cotton), minerals (iron, copper, coal, silver, gold), energy resources (wood, coal, oil, gas, hydro potential), and strategic assets such as fertile land, freshwater, rivers, harbors, and passes that contribute to buff or increment the effect of the resources.

Important resource properties are amount, quality, production, processing, storage, demand, price, known uses, and developed uses.

## 6. Resource → Industry Capability

One of the game's fundamental systems is: Resource → Processing → Industry → Institution → Infrastructure → Capability.

## 7. Technology

Technology is divided into four layers: Knowledge (mathematics, metallurgy, biology, navigation, medicine); Techniques (steelmaking, horse breeding, irrigation, steam engines); Institutions (universities, banks, academies, postal services); and Infrastructure (roads, railways, factories, laboratories, power grids).

Discovering something does not automatically mean the civilization can use it effectively. (still thinking about this game mechanic)

## 8. Technology Diffusion

Knowledge can spread through trade, universities, espionage, migration, conquest, diplomacy, books, scientific exchange, corporations, missionaries, captured equipment, and foreign investment.

A civilization may know that a technology exists while lacking the industrial base, institutions, or skills required to reproduce it. That means, a player may have discovered how to use a resource to make energy but doesn't have said resource.

## 9. Population

Population is the number of people living in the player civilization. The player does not order individual citizens. The player allocates population % across employment areas via sliders.

Employment areas: construction/infrastructure; industry/manufacturing/processing; military/diplomacy; farming/harvesting/mining; economy/research; exploration.

More population in an area makes its processes and orders complete faster and more effectively, at the cost of the other areas. For example, shifting population into military during a war tilts the balance over time, but leaves farming/mining and economy poorer, producing less food, fewer resources such as iron, and less buying power.

## 10. Population as Actors

Population groups react to taxes, prices, unemployment, wages, wars, laws, education, economic opportunity, migration, and political conditions.

Possible outcomes include protests, strikes, migration, political movements, rebellion, entrepreneurship, recruitment, government support, and radicalization.

## 11. Businesses

Businesses produce goods, employ workers, buy inputs, sell products, compete, invest, fail, expand, lobby, evade taxes, and innovate.

Behavior depends on expected profit, risk, capital, demand, taxes, regulation, labor costs, resource prices, infrastructure, political stability, and technology.

## 12. Industries

Industries emerge from combinations of resources, labor, capital, knowledge, technology, infrastructure, and demand.

The player cannot simply click 'Build Automobile Industry.' The required economic ecosystem must exist. The state can accelerate development through subsidies, tariffs, state-owned companies, education, infrastructure, research, investment, and procurement.

## 13. Economy

The economy contains production, consumption, prices, wages, employment, capital, investment, banking, credit, debt, trade, taxation, government spending, inflation, and currency.

Markets exist at local, regional, national, and international levels. Prices depend on supply, demand, transport cost, taxes, tariffs, market power, storage, and expectations.

## 14. Infrastructure

Transportation includes roads, bridges, canals, railways, ports, and airports. Communication includes postal routes, telegraph, telephone, radio, and internet. Energy includes coal networks, oil pipelines, electrical grids, and nuclear infrastructure. Social infrastructure includes schools, universities, hospitals, and sanitation.

Infrastructure determines how effectively a civilization can exploit resources and knowledge.

## 15. Administrative Capacity

Administrative capacity limits the player's practical power. It depends on bureaucracy, education, communication, transportation, centralization, institutions, corruption, political legitimacy, and government organization.

Example: a 20% official tax rate may produce only 11% actual collection because of corruption, local evasion, and weak administration.

## 16. Information

The player does not have perfect information. Information may be unknown, rumored, public, reported, estimated, verified, classified, or obtained through intelligence.

Players should sometimes need intelligence, bureaucracy, communication infrastructure, or investigation to understand what is really happening.

## 17. Politics

Political groups emerge from society: industrialists, workers, farmers, military, aristocracy, liberals, conservatives, socialists, nationalists, regionalists, religious movements, and others.

Political power depends on wealth, population, organization, institutions, public opinion, military support, media influence, and economic importance.

## 18. Government and Laws

Government structures may include monarchy, republic, parliamentary government, presidential government, dictatorship, oligarchy, federation, confederation, and empire.

Government types determine how decisions are made and constrained rather than simply providing static bonuses.

Laws can cover taxation, labor, property, immigration, education, military service, business regulation, trade, censorship, healthcare, welfare, and land ownership.

## 19. Elections and Legitimacy

Depending on the political system, the player may face elections, parliamentary opposition, coups, revolutions, protests, strikes, and separatism.

The player remains the head of state, but their ability to remain in power depends on the political system.

## 20. Diplomacy and Trade

Diplomatic relationships depend on trade, ideology, borders, military power, historical relations, resources, alliances, territorial claims, and economic dependence.

Trade routes have volume, capacity, transportation costs, tariffs, risks, blockades, piracy, infrastructure requirements, and political dependencies.

## 21. Military

Military power depends on manpower, food, weapons, ammunition, logistics, transportation, officers, training, industry, technology, and money.

Military doctrine emerges from technology, resources, geography, institutions, historical experience, officers, and training.

## 22. War

Combat depends on logistics, terrain, morale, leadership, doctrine, intelligence, equipment, supply, infrastructure, weather, industrial production, population, and strategic objectives rather than a single combat-power number.

## 23. Events and Causal Simulation

Events should emerge from the simulation: food shortages, banking crises, industrial strikes, scandals, coups, scientific breakthroughs, disease outbreaks, commodity booms, resource discoveries, corruption scandals, border crises, revolutions, and migration waves.

Players should be able to investigate causes. Example: war → coal imports interrupted → coal prices rise → steel production falls → railway maintenance declines → transport capacity falls → food distribution problems → urban food prices rise → unrest → political opposition.

## 24. Simulation Architecture

The simulation must be independent of the UI.

Suggested structure: `/apps/web`; `/packages/simulation`; `/packages/economy`; `/packages/population`; `/packages/politics`; `/packages/military`; `/packages/diplomacy`; `/packages/technology`; `/packages/shared`.

The frontend should never contain core simulation logic.

## 25. Technology Stack

- Frontend: Astro, React, TypeScript.
- Backend: Supabase, PostgreSQL, Supabase Auth, Supabase Realtime, Supabase Edge Functions.
- Hosting: Netlify.
- Simulation: TypeScript initially, with the option to move computationally expensive systems to another runtime later.

## 26. Database Philosophy

PostgreSQL is the authoritative source of persistent world state.

Core entities include worlds, civilizations, regions, cities, population groups, businesses, industries, resources, resource deposits, markets, goods, infrastructure, institutions, technologies, knowledge, laws, political groups, political parties, governments, armies, navies, wars, treaties, trade routes, events, decisions, player orders/actions (with started_at, finishes_at, status), and notifications.

## 27. Player Decisions and Projects

Important player actions become decisions/orders rather than direct database mutations. They are stored in a player orders/actions table with started_at, finishes_at, and status.

Timing is server-authoritative. The client sends the order type and payload. Supabase (Edge Function / Postgres function) computes the estimated duration from the order type plus modifiers such as population allocation, then stores started_at and finishes_at. The client shows a local countdown without polling every second, and on completion asks the database to verify that finishes_at has passed before applying the result and marking the order done.

Large actions become projects with cost, duration, labor, materials, institutions, prerequisites, political support, risks, expected outcomes, and actual outcomes.

Examples: houses to raise the population limit, railways, universities, factories, naval bases, postal systems, central banks, electrification, canals, and colonization.

## 28. Institutions

Institutions are organizations capable of preserving knowledge and making complex systems function: parliament, central bank, university, postal service, military academy, railway administration, tax authority, intelligence service, public health service, stock exchange, scientific academy.

Institutions have quality characteristics such as funding, personnel, prestige, output, independence, corruption, international connections, and facilities.

## 29. History

The simulation records major civilization history: reforms, projects, crises, wars, discoveries, political changes, economic transformations, and other milestones.

History is a first-class system and should let players understand how their civilization developed.

## 30. Terminal Interface

Primary commands: overview, economy, population, politics, military, diplomacy, technology, resources, industries, infrastructure, regions, institutions, projects, intelligence, history.

Deep inspection commands should answer questions such as: why did food prices increase? why did unemployment rise? why is steel production falling? where is government money going? what industries depend on coal? what uses do horses currently have? why is research slow?

## 31. Strategic Paths

- Industrialization: education → engineering → factories → railways → mass production → urbanization.
- Commercial Empire: ports → merchant fleet → trade agreements → financial institutions → foreign investment → economic influence.
- Military Power: industrial base → military institutions → officer corps → arms production → logistics → professional army.
- Scientific Civilization: education → universities → research institutions → scientific community → industrial R&D → technological leadership.

## 32. Failure States

Possible systemic failures include bankruptcy, civil war, revolution, military coup, economic collapse, famine, political fragmentation, foreign occupation, technological stagnation, administrative collapse, and separatism.

Failure should emerge from simulation rather than arbitrary game-over screens.

## 33. Multiplayer

Each player controls a civilization in a persistent shared world. Opponents are other players only. There are no AI civilizations.

The world starts hidden in fog of war. Other civilizations are found naturally while exploring: population allocated to exploration increases discovery chance and range, and may reveal another civilization by chance.

Once discovered, players interact through diplomacy, trade, alliances, espionage, wars, technology exchange, migration, investment, treaties, sanctions, and international organizations.

## 34. Offline Civilization Behavior

While a player is offline, their civilization continues according to existing policies, institutional behavior, established government priorities, economic processes, military orders, and active projects.

Every order stores server-computed started_at and finishes_at in the database. The client shows progress with a local countdown and does not need to poll every second. If the client is still connected at completion, it asks the database to verify finishes_at has passed, then finishes the order and updates the UI. If the player was offline, the client fetches all pending orders on reconnect and computes finished vs. pending from the current time, showing the appropriate state.

## 35. Tick Sync and Performance

The 60s tick is UI refresh only. It does not advance the simulation on the server. Each tick the client polls the database for pending decisions, order completions, and other players' interactions.

Ticks are synced to LOCAL wall-clock time: 1 tick = 1 minute, firing on every minute boundary. The client computes next_tick = 60 - (seconds into the current minute) locally with no server time involved, so a player logging in at 10:48:20 sees 40s until the next tick. All clients therefore tick at the same minute boundaries without any sync query.

Order completion must be idempotent, transactional, and recoverable. The system must handle missed ticks, duplicate completion checks, server failure, and concurrent execution without corrupting world state.

Do not simulate every citizen individually. Primary simulation entities are population cohorts, businesses, industries, markets, political groups, military units, institutions, and regions.

## 36. Development Roadmap

- Phase 1 — Simulation Core: world, regions, resources, population, cities, basic economy, time, ticks.
- Phase 2 — Economy: goods, production, consumption, businesses, markets, prices, wages, taxation, government budget.
- Phase 3 — Civilization Systems: institutions, infrastructure, technology, administrative capacity, political groups, laws.
- Phase 4 — Diplomacy & Military: armies, logistics, war, diplomacy, treaties, trade.
- Phase 5 — Multiplayer: player civilizations, authentication, realtime updates, diplomacy, player interaction, persistent world.

## 37. Core Gameplay Loop

Observe → Understand → Plan → Decide → Invest / Legislate / Order → Simulation → Consequences → New Situation → Observe again.

## Appendix — Design Rules

- The player controls policy, not reality.
- Actors should have incentives and interests independent of the player.
- Whenever possible, model causal chains so players can investigate why outcomes occurred.
- Geography should matter to production, trade, administration, and warfare.
- Technology should transform how a civilization functions.
- Institutions should accumulate quality, knowledge, reputation, and history.
- The simulation should continue meaningfully when players are offline.
