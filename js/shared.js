// Constants

// prettier-ignore
const TYPE_CHART = {
  normal:   { rock: 0.5, ghost: 0, steel: 0.5 },
  fire:     { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water:    { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass:    { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice:      { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison:   { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground:   { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying:   { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic:  { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug:      { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock:     { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost:    { normal: 0, fighting: 0, poison: 0.5, bug: 0.5, ghost: 2, dark: 0.5 },
  dragon:   { dragon: 2, steel: 0.5, fairy: 0 },
  dark:     { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel:    { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, fighting: 2, poison: 0, ground: 2, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5, fairy: 2 },
  fairy:    { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

// prettier-ignore
const ALL_TYPES = [
  "normal", "fire", "water", "electric", "grass", "ice",
  "fighting", "poison", "ground", "flying", "psychic", "bug",
  "rock", "ghost", "dragon", "dark", "steel", "fairy",
];

// prettier-ignore
const TYPE_SHORT = {
  normal: "nor", fire: "fir",  water: "wat", electric: "ele", grass: "gra",  ice: "ice",
  fighting: "fgt", poison: "poi", ground: "gnd", flying: "fly", psychic: "psy", bug: "bug",
  rock: "roc",  ghost: "gho", dragon: "dra", dark: "dar",  steel: "stl", fairy: "fai",
};

const ABILITY_TYPE_IMMUNITIES = {
  levitate: "ground",
  "volt-absorb": "electric",
  "lightning-rod": "electric",
  "motor-drive": "electric",
  "water-absorb": "water",
  "storm-drain": "water",
  "sap-sipper": "grass",
  "earth-eater": "ground",
  "well-baked-body": "fire",
  "flash-fire": "fire",
  "dry-skin": "water",
};

const ABILITY_TYPE_HALVINGS = {
  "thick-fat": ["fire", "ice"],
  heatproof: ["fire"],
  "purifying-salt": ["ghost"],
  "water-bubble": ["fire"],
};

const ABILITY_TYPE_BOOSTS = {
  "dry-skin": { fire: 1.25 },
  fluffy: { fire: 2 },
};

const TYPE_MATCHUP_ABILITIES = new Set([
  ...Object.keys(ABILITY_TYPE_IMMUNITIES),
  ...Object.keys(ABILITY_TYPE_HALVINGS),
  ...Object.keys(ABILITY_TYPE_BOOSTS),
  "wonder-guard",
]);

// populated asynchronously by filters.js from filters/index.json
const FILTERS = {};
const filterSets = {};

// Utilities

function lsGet(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}

function lsSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("HTTP " + res.status);
  }
  return res.json();
}

// Converts user input to a PokeAPI style slug (e.g. "Will O Wisp" -> "will-o-wisp")
function normalizeSlug(str) {
  return str.trim().toLowerCase().replace(/\s+/g, "-");
}

// Type Effectiveness

function chartEffectiveness(attackType, types) {
  const row = TYPE_CHART[attackType] || {};
  let mult = 1;
  for (const t of types) {
    mult *= row[t] ?? 1;
  }
  return mult;
}

function typeEffectiveness(attackType, pokemon) {
  for (const ability of pokemon.abilities) {
    if (ABILITY_TYPE_IMMUNITIES[ability] === attackType) {
      return 0;
    }
  }

  // Wonder Guard: only super-effective moves land
  if (pokemon.abilities.includes("wonder-guard")) {
    const base = chartEffectiveness(attackType, pokemon.types);
    if (base >= 2) {
      return base;
    }
    return 0;
  }

  let mult = chartEffectiveness(attackType, pokemon.types);
  for (const ability of pokemon.abilities) {
    if ((ABILITY_TYPE_HALVINGS[ability] || []).includes(attackType)) {
      mult *= 0.5;
    }
    if (
      ABILITY_TYPE_BOOSTS[ability] &&
      ABILITY_TYPE_BOOSTS[ability][attackType]
    ) {
      mult *= ABILITY_TYPE_BOOSTS[ability][attackType];
    }
  }
  return mult;
}

function abilityChangesMatchup(attackType, pokemon) {
  return (
    chartEffectiveness(attackType, pokemon.types) !==
    typeEffectiveness(attackType, pokemon)
  );
}

function typeMatchups(pokemon) {
  const groups = { immune: [], quarter: [], half: [], double: [], quad: [] };
  for (const type of ALL_TYPES) {
    const eff = typeEffectiveness(type, pokemon);
    if (eff === 0) {
      groups.immune.push(type);
    } else if (eff <= 0.25) {
      groups.quarter.push(type);
    } else if (eff <= 0.5) {
      groups.half.push(type);
    } else if (eff >= 4) {
      groups.quad.push(type);
    } else if (eff >= 2) {
      groups.double.push(type);
    }
  }
  return groups;
}

// PokeAPI

const POKEAPI = "https://pokeapi.co/api/v2";
const CACHE_KEY = "dg2";

// prettier-ignore
const POKEAPI_STAT_KEYS = {
  hp: "hp", attack: "atk", defense: "def",
  "special-attack": "spatk", "special-defense": "spdef", speed: "speed",
};

const cachedMoveTypes = lsGet(CACHE_KEY + "_mt") || {};
let pokemonDatabase = {};
let isReady = false;

function loadFilter(name) {
  if (!filterSets[name] && FILTERS[name]) {
    filterSets[name] = new Set(FILTERS[name]);
  }
}

function pokeapiName(pokemon) {
  if (pokemon.form) {
    return pokemon.baseName + "-" + pokemon.form;
  }
  return pokemon.baseName;
}

async function cacheMoveType(name) {
  if (cachedMoveTypes[name]) {
    return;
  }
  try {
    const data = await fetchJSON(`${POKEAPI}/move/${name}`);
    cachedMoveTypes[name] = data.type.name;
    lsSet(CACHE_KEY + "_mt", cachedMoveTypes);
  } catch {}
}

function parsePokemon(data) {
  const stats = {};
  for (const s of data.stats) {
    if (POKEAPI_STAT_KEYS[s.stat.name]) {
      stats[POKEAPI_STAT_KEYS[s.stat.name]] = s.base_stat;
    }
  }

  const moves = {};
  for (const m of data.moves) {
    moves[m.move.name] = true;
  }

  const baseName = data.species.name;
  const apiName = data.name;
  let form;
  if (apiName === baseName) {
    form = "";
  } else if (apiName.startsWith(baseName + "-")) {
    form = apiName.slice(baseName.length + 1);
  } else {
    form = apiName;
  }

  // Use the species URL ID so forms/megas share their base national dex number
  const id = parseInt(data.species.url.split("/").slice(-2, -1)[0]);

  return {
    id,
    baseName,
    form,
    types: data.types.map((t) => t.type.name),
    abilities: data.abilities.map((a) => a.ability.name),
    stats,
    moves,
  };
}

function setStatus(text) {
  const el = document.getElementById("status");
  if (el) {
    el.textContent = text;
  }
}

function setProgress(value) {
  const el = document.getElementById("prog");
  if (el) {
    el.value = value;
  }
}

function onReady() {
  isReady = true;
  buildDataLists();
  setProgress(100);
  const date = lsGet(CACHE_KEY + "_date");
  let statusText = `ready - ${Object.keys(pokemonDatabase).length} pokemon`;
  if (date) {
    statusText += ` - cached locally on ${date}`;
  }
  setStatus(statusText);
}

async function loadData() {
  setStatus("loading...");

  // If cache key is missing or outdated, wipe all dg* data and force a fresh fetch
  const storedKey = localStorage.getItem("cache_key");
  if (storedKey !== CACHE_KEY) {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith("dg")) {
        localStorage.removeItem(key);
      }
    }
    localStorage.setItem("cache_key", CACHE_KEY);
  }

  const cached = lsGet(CACHE_KEY + "_db");
  if (cached) {
    pokemonDatabase = cached;
    onReady();
    return;
  }

  const { results } = await fetchJSON(`${POKEAPI}/pokemon?limit=100000`);
  const fetchList = results.map((p) => ({
    name: p.name,
    url: p.url,
    id: parseInt(p.url.split("/").slice(-2, -1)[0]),
  }));
  const now = new Date();
  lsSet(
    CACHE_KEY + "_date",
    now.toISOString().split("T")[0] + " " + now.toTimeString().slice(0, 5),
  );

  let done = 0;
  for (let i = 0; i < fetchList.length; i += 40) {
    await Promise.all(
      fetchList.slice(i, i + 40).map(async (p) => {
        try {
          pokemonDatabase[p.id] = parsePokemon(await fetchJSON(p.url));
        } catch {
          console.warn("skipped", p.name);
        }
      }),
    );
    done += Math.min(40, fetchList.length - i);
    setProgress((done / fetchList.length) * 100);
    setStatus(`fetching ${done}/${fetchList.length}...`);
  }

  lsSet(CACHE_KEY + "_db", pokemonDatabase);
  onReady();
}

function buildDataLists() {
  const abilities = new Set();
  const moves = new Set();
  const pokemonNames = new Set();
  for (const p of Object.values(pokemonDatabase)) {
    for (const a of p.abilities) {
      abilities.add(a);
    }
    for (const m of Object.keys(p.moves)) {
      moves.add(m);
    }
    pokemonNames.add(pokeapiName(p));
  }

  function upsertDataList(id, items) {
    let dl = document.getElementById(id);
    if (!dl) {
      dl = document.createElement("datalist");
      dl.id = id;
      document.body.appendChild(dl);
    }
    dl.innerHTML = [...items]
      .sort()
      .map((v) => `<option value="${v}">`)
      .join("");
  }

  upsertDataList("ability-datalist", abilities);
  upsertDataList("move-datalist", moves);
  upsertDataList("pokemon-datalist", pokemonNames);
}

// Filters the pokemon-datalist to the selected filter's legal set (or all if none)
function updatePokemonDatalist(filterName) {
  const dl = document.getElementById("pokemon-datalist");
  if (!dl) {
    return;
  }
  loadFilter(filterName);
  let names;
  if (filterName) {
    names = [...(filterSets[filterName] || [])];
  } else {
    names = Object.values(pokemonDatabase).map(pokeapiName);
  }
  dl.innerHTML = names
    .sort()
    .map((v) => `<option value="${v}">`)
    .join("");
}

// Validation helpers, return arrays of slugs not found in the database

function unknownInDatabase(slugs, getItems) {
  const all = new Set();
  for (const p of Object.values(pokemonDatabase)) {
    for (const item of getItems(p)) {
      all.add(item);
    }
  }
  return slugs.filter((s) => !all.has(s));
}

function unknownMoveNames(slugs) {
  return unknownInDatabase(slugs, (p) => Object.keys(p.moves));
}
function unknownAbilityNames(slugs) {
  return unknownInDatabase(slugs, (p) => p.abilities);
}

// Looks up a pokemon by name or API slug (e.g. "charizard-mega-x").
function findPokemonByName(nameInput) {
  const slug = normalizeSlug(nameInput);
  if (!slug) {
    return null;
  }
  for (const p of Object.values(pokemonDatabase)) {
    if (pokeapiName(p) === slug) {
      return p;
    }
  }
  for (const p of Object.values(pokemonDatabase)) {
    if (p.baseName === slug) {
      return p;
    }
  }
  return null;
}

function refreshData() {
  const today = new Date().toISOString().split("T")[0];
  const refreshLog = lsGet("refresh_log") || {};
  const usedToday = refreshLog[today] || 0;
  if (usedToday >= 1) {
    alert("Refresh limit reached (1 per day). Try again tomorrow.");
    return;
  }
  if (!confirm("Clear cached Pokemon data and re-fetch from PokeAPI?")) {
    return;
  }
  lsSet("refresh_log", { ...refreshLog, [today]: usedToday + 1 });
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith(CACHE_KEY)) {
      localStorage.removeItem(key);
    }
  }
  pokemonDatabase = {};
  isReady = false;
  // cachedMoveTypes is a const so it can't be reassigned — clear it by deleting each key
  for (const k of Object.keys(cachedMoveTypes)) {
    delete cachedMoveTypes[k];
  }
  setProgress(0);
  loadData().catch((e) => {
    setStatus("error: " + e.message);
  });
}

// Dark mode

function toggleDark(on) {
  document.body.classList.toggle("dark", on);
  if (on) {
    localStorage.setItem("dark", "1");
  } else {
    localStorage.removeItem("dark");
  }
}

if (localStorage.getItem("dark")) {
  document.body.classList.add("dark");
}

// Layout

function injectLayout() {
  const isHome =
    location.pathname === "/" || location.pathname.endsWith("/index.html");

  let darkChecked = "";
  if (localStorage.getItem("dark")) {
    darkChecked = "checked";
  }

  let nav = "";
  if (!isHome) {
    nav = '<nav><a href="../index.html">← home</a></nav>';
  }

  let statusBar = "";
  if (!isHome) {
    statusBar =
      '<small id="status"></small><progress id="prog" value="0" max="100"></progress>';
  }

  const headerEl = document.getElementById("site-header");
  if (headerEl) {
    headerEl.innerHTML = `
      <h2>
        DEXGREP
        <small class="tagline">Pokédex tools that behave kinda like grep</small>
        <label class="dark-label"><input type="checkbox" id="dark-cb" onchange="toggleDark(this.checked)" ${darkChecked}> dark</label>
      </h2>
      ${nav}
      ${statusBar}
    `;
  }

  const footerEl = document.getElementById("site-footer");
  if (footerEl) {
    footerEl.innerHTML = `
      <small>Data from <a href="https://pokeapi.co">PokéAPI</a> (thank you!) - this site last updated: 2026-04-16 - <a href="https://github.com/btenc/dexgrep">README and source</a></small>
      <p class="validators">
        <a href="https://validator.w3.org/check?uri=referer"><img src="https://www.w3.org/Icons/valid-html401" alt="Valid HTML!"></a>
        <a href="https://jigsaw.w3.org/css-validator/check/referer"><img src="https://jigsaw.w3.org/css-validator/images/vcss" alt="Valid CSS!"></a>
      </p>
    `;
  }
}

injectLayout();
