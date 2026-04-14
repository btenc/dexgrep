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

const RESULT_COLS = 17;

// Type Effectiveness

function chartEffectiveness(attackType, types) {
  const row = TYPE_CHART[attackType] || {};
  let mult = 1;
  for (const t of types) mult *= row[t] ?? 1;
  return mult;
}

function typeEffectiveness(attackType, pokemon) {
  for (const ability of pokemon.abilities) {
    if (ABILITY_TYPE_IMMUNITIES[ability] === attackType) return 0;
  }

  // Wonder Guard: only super-effective moves land
  if (pokemon.abilities.includes("wonder-guard")) {
    const base = chartEffectiveness(attackType, pokemon.types);
    if (base >= 2) return base;
    return 0;
  }

  let mult = chartEffectiveness(attackType, pokemon.types);
  for (const ability of pokemon.abilities) {
    if ((ABILITY_TYPE_HALVINGS[ability] || []).includes(attackType))
      mult *= 0.5;
    if (ABILITY_TYPE_BOOSTS[ability]?.[attackType])
      mult *= ABILITY_TYPE_BOOSTS[ability][attackType];
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
    const effectiveness = typeEffectiveness(type, pokemon);
    if (effectiveness === 0) groups.immune.push(type);
    else if (effectiveness <= 0.25) groups.quarter.push(type);
    else if (effectiveness <= 0.5) groups.half.push(type);
    else if (effectiveness >= 4) groups.quad.push(type);
    else if (effectiveness >= 2) groups.double.push(type);
  }
  return groups;
}

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
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json();
}

// Converts user input to a PokeAPI style slug (e.g. "Will O Wisp" -> "will-o-wisp")
function normalizeSlug(str) {
  return str.trim().toLowerCase().replace(/\s+/g, "-");
}

// PokeAPI

const POKEAPI = "https://pokeapi.co/api/v2";
const CACHE_KEY = "dg";

// prettier-ignore
const POKEAPI_STAT_KEYS = {
  hp: "hp", attack: "atk", defense: "def",
  "special-attack": "spatk", "special-defense": "spdef", speed: "speed",
};

// Regulation sets keyed by name, each a Set of PokeAPI names ("venusaur-mega")
const regulationSets = {};
const cachedMoveTypes = lsGet("dg_mt") || {};

let pokemonDatabase = {};
let isReady = false;

function loadRegulation(name) {
  if (!regulationSets[name] && FILTERS[name]) {
    regulationSets[name] = new Set(FILTERS[name]);
  }
}

function pokeapiName(pokemon) {
  if (pokemon.form) return pokemon.baseName + "-" + pokemon.form;
  return pokemon.baseName;
}

async function cacheMoveType(name) {
  if (cachedMoveTypes[name]) return;
  try {
    const data = await fetchJSON(`${POKEAPI}/move/${name}`);
    cachedMoveTypes[name] = data.type.name;
    lsSet("dg_mt", cachedMoveTypes);
  } catch {}
}

function parsePokemon(data) {
  const stats = {};
  for (const stat of data.stats) {
    if (POKEAPI_STAT_KEYS[stat.stat.name]) {
      stats[POKEAPI_STAT_KEYS[stat.stat.name]] = stat.base_stat;
    }
  }

  const moves = {};
  for (const move of data.moves) {
    moves[move.move.name] = true;
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
  const nationalDexNum = parseInt(data.species.url.split("/").slice(-2, -1)[0]);

  return {
    id: nationalDexNum,
    baseName,
    form,
    types: data.types.map((t) => t.type.name),
    abilities: data.abilities.map((a) => a.ability.name),
    stats,
    moves,
  };
}

async function loadData() {
  document.getElementById("status").textContent = "loading...";

  let list = lsGet(CACHE_KEY + "_list");
  if (!list) {
    const { results } = await fetchJSON(`${POKEAPI}/pokemon?limit=100000`);
    list = results.map((p) => ({
      name: p.name,
      url: p.url,
      id: parseInt(p.url.split("/").slice(-2, -1)[0]),
    }));
    lsSet(CACHE_KEY + "_list", list);
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.toTimeString().slice(0, 5);
    lsSet(CACHE_KEY + "_date", `${dateStr} ${timeStr}`);
  }

  const toFetch = list.filter((p) => !lsGet(CACHE_KEY + "_p" + p.id));
  let done = 0;
  for (let i = 0; i < toFetch.length; i += 40) {
    await Promise.all(
      toFetch.slice(i, i + 40).map(async (p) => {
        try {
          const pokemon = parsePokemon(await fetchJSON(p.url));
          lsSet(CACHE_KEY + "_p" + p.id, pokemon);
          pokemonDatabase[p.id] = pokemon;
        } catch {
          console.warn("skipped", p.name);
        }
      }),
    );
    done += Math.min(40, toFetch.length - i);
    document.getElementById("prog").value = (done / toFetch.length) * 100;
    document.getElementById("status").textContent =
      `fetching ${done}/${toFetch.length}...`;
  }

  for (const p of list) {
    if (!pokemonDatabase[p.id]) {
      const cached = lsGet(CACHE_KEY + "_p" + p.id);
      if (cached) pokemonDatabase[p.id] = cached;
    }
  }

  isReady = true;
  buildDataLists();
  document.getElementById("prog").value = 100;
  const cacheDate = lsGet(CACHE_KEY + "_date");
  const cacheDateNote = cacheDate ? ` - cached locally on ${cacheDate}` : "";
  document.getElementById("status").textContent =
    `ready - ${Object.keys(pokemonDatabase).length} pokemon${cacheDateNote}`;
}

function buildDataLists() {
  const abilities = new Set();
  const moves = new Set();
  for (const p of Object.values(pokemonDatabase)) {
    for (const a of p.abilities) abilities.add(a);
    for (const m of Object.keys(p.moves)) moves.add(m);
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
}

// State

let nameFilters = []; // [{ mode: "includes"|"excludes", texts: [] }]
let pokemonTypeFilters = []; // [{ mode: "is"|"is-not", types: [] }]
let moveGroups = []; // [{ moves: [{ name, stab }] }]
let abilityFilter = []; // ability names, OR-ed
let typeFilters = []; // [{ mode, types: [] }]
let statFilters = []; // [{ stat, op, val }]

// Name filter

function addNameFilter() {
  nameFilters.push({ mode: "includes", texts: [""] });
  renderNameFilters();
}

function addTextToNameFilter(gi) {
  nameFilters[gi].texts.push("");
  renderNameFilters();
}

function removeTextFromNameFilter(gi, ti) {
  nameFilters[gi].texts.splice(ti, 1);
  if (nameFilters[gi].texts.length === 0) nameFilters.splice(gi, 1);
  renderNameFilters();
}

function renderNameFilterText(text, gi, ti) {
  return `
    ${ti > 0 ? "<small>or</small>" : ""}
    <input type="text" value="${text}" size="18" placeholder="e.g. mega"
      onchange="nameFilters[${gi}].texts[${ti}] = this.value">
    <button onclick="removeTextFromNameFilter(${gi},${ti})">x</button>
  `;
}

function renderNameFilterRow(f, gi) {
  return `
    ${gi > 0 ? "<small>AND</small>" : ""}
    <div class="filter-row">
      <select onchange="nameFilters[${gi}].mode = this.value">
        <option value="includes" ${f.mode === "includes" ? "selected" : ""}>includes</option>
        <option value="excludes" ${f.mode === "excludes" ? "selected" : ""}>excludes</option>
      </select>
      ${f.texts.map((text, ti) => renderNameFilterText(text, gi, ti)).join("")}
      <br>
      <button onclick="addTextToNameFilter(${gi})">+ or</button>
      &nbsp;
      <button onclick="nameFilters.splice(${gi},1);renderNameFilters()">- row</button>
    </div>
  `;
}

function renderNameFilters() {
  document.getElementById("name-rows").innerHTML = nameFilters
    .map(renderNameFilterRow)
    .join("");
}

// Pokemon type filter

function addPokemonTypeRow() {
  pokemonTypeFilters.push({ mode: "is", types: ["normal"] });
  renderPokemonTypeRows();
}

function addTypeToPokemonTypeRow(gi) {
  pokemonTypeFilters[gi].types.push("normal");
  renderPokemonTypeRows();
}

function removeTypeFromPokemonTypeRow(gi, ti) {
  pokemonTypeFilters[gi].types.splice(ti, 1);
  if (pokemonTypeFilters[gi].types.length === 0)
    pokemonTypeFilters.splice(gi, 1);
  renderPokemonTypeRows();
}

function renderTypeSelect(selectedType, gi, ti) {
  const options = ALL_TYPES.map(
    (t) =>
      `<option value="${t}" ${t === selectedType ? "selected" : ""}>${t}</option>`,
  ).join("");
  return `
    ${ti > 0 ? "<small>or</small>" : ""}
    <select onchange="pokemonTypeFilters[${gi}].types[${ti}] = this.value">${options}</select>
    <button onclick="removeTypeFromPokemonTypeRow(${gi},${ti})">x</button>
  `;
}

function renderPokemonTypeFilterRow(filter, gi) {
  return `
    ${gi > 0 ? "<small>AND</small>" : ""}
    <div class="filter-row">
      <select onchange="pokemonTypeFilters[${gi}].mode = this.value">
        <option value="is"     ${filter.mode === "is" ? "selected" : ""}>is</option>
        <option value="is-not" ${filter.mode === "is-not" ? "selected" : ""}>is not</option>
      </select>
      ${filter.types.map((type, ti) => renderTypeSelect(type, gi, ti)).join("")}
      <br>
      <button onclick="addTypeToPokemonTypeRow(${gi})">+ or</button>
      &nbsp;
      <button onclick="pokemonTypeFilters.splice(${gi},1);renderPokemonTypeRows()">- row</button>
    </div>
  `;
}

function renderPokemonTypeRows() {
  document.getElementById("pokemon-type-rows").innerHTML = pokemonTypeFilters
    .map(renderPokemonTypeFilterRow)
    .join("");
}

// Ability filter

function addAbility() {
  abilityFilter.push("");
  renderAbilities();
}

function renderAbilities() {
  document.getElementById("ability-rows").innerHTML = abilityFilter
    .map(
      (name, i) => `
      ${i > 0 ? "<small>or</small>" : ""}
      <input type="text" value="${name}" size="18" placeholder="ability name"
        list="ability-datalist" onchange="abilityFilter[${i}] = this.value">
      <button onclick="abilityFilter.splice(${i},1);renderAbilities()">x</button>
    `,
    )
    .join("");
}

// Move filter

function addMoveRow() {
  moveGroups.push({ moves: [{ name: "", stab: false }] });
  renderMoveRows();
}

function addMoveToGroup(gi) {
  moveGroups[gi].moves.push({ name: "", stab: false });
  renderMoveRows();
}

function removeMoveFromGroup(gi, mi) {
  moveGroups[gi].moves.splice(mi, 1);
  if (moveGroups[gi].moves.length === 0) moveGroups.splice(gi, 1);
  renderMoveRows();
}

function renderMoveEntry(move, gi, mi) {
  return `
    ${mi > 0 ? "<small>or</small>" : ""}
    <input type="text" value="${move.name}" size="18" placeholder="move name"
      list="move-datalist" onchange="moveGroups[${gi}].moves[${mi}].name = this.value">
    <label>
      <input type="checkbox" ${move.stab ? "checked" : ""}
        onchange="moveGroups[${gi}].moves[${mi}].stab = this.checked"> stab
    </label>
    <button onclick="removeMoveFromGroup(${gi},${mi})">x</button>
  `;
}

function renderMoveGroupRow(group, gi) {
  return `
    ${gi > 0 ? "<small>AND</small>" : ""}
    <div class="filter-row">
      ${group.moves.map((move, mi) => renderMoveEntry(move, gi, mi)).join("")}
      <br>
      <button onclick="addMoveToGroup(${gi})">+ or</button>
      &nbsp;
      <button onclick="moveGroups.splice(${gi},1);renderMoveRows()">- row</button>
    </div>
  `;
}

function renderMoveRows() {
  document.getElementById("move-rows").innerHTML = moveGroups
    .map(renderMoveGroupRow)
    .join("");
}

// Type effectiveness filter

const TYPE_MODES = [
  { value: "resists", label: "resists (<=0.5x)" },
  { value: "xresists", label: "extremely resists (<=0.25x)" },
  { value: "immune", label: "immune (0x)" },
  { value: "weak", label: "weak to (>=2x)" },
  { value: "not-weak", label: "not weak to (<2x)" },
];

function addTypeRow() {
  typeFilters.push({ mode: "resists", types: [] });
  renderTypeRows();
}

function toggleType(i, type, checked) {
  if (checked) {
    if (!typeFilters[i].types.includes(type)) typeFilters[i].types.push(type);
  } else {
    typeFilters[i].types = typeFilters[i].types.filter((t) => t !== type);
  }
}

function renderTypeFilterRow(filter, i) {
  const modeOptions = TYPE_MODES.map(
    (m) =>
      `<option value="${m.value}" ${m.value === filter.mode ? "selected" : ""}>${m.label}</option>`,
  ).join("");

  const typeCheckboxes = ALL_TYPES.map(
    (type) => `
      <label>
        <input type="checkbox" ${filter.types.includes(type) ? "checked" : ""}
          onchange="toggleType(${i},'${type}',this.checked)">
        <span class="t-${type}">${type}</span>
      </label>
    `,
  ).join("");

  return `
    ${i > 0 ? "<small>AND</small>" : ""}
    <div class="filter-row">
      <select onchange="typeFilters[${i}].mode = this.value">${modeOptions}</select>
      <button onclick="typeFilters.splice(${i},1);renderTypeRows()">x</button>
      <div class="type-grid">${typeCheckboxes}</div>
    </div>
  `;
}

function renderTypeRows() {
  document.getElementById("type-rows").innerHTML = typeFilters
    .map(renderTypeFilterRow)
    .join("");
}

// Stat filter

function addStat() {
  statFilters.push({ stat: "speed", op: ">", val: 80 });
  renderStats();
}

function renderStatFilterRow(f, i) {
  const selectOptions = (choices, current) =>
    choices
      .map((c) => `<option ${c === current ? "selected" : ""}>${c}</option>`)
      .join("");

  return `
    ${i > 0 ? "<small>AND</small>" : ""}
    <div>
      <select onchange="statFilters[${i}].stat = this.value">
        ${selectOptions(["id", "hp", "atk", "def", "spatk", "spdef", "speed", "bst"], f.stat)}
      </select>
      <select onchange="statFilters[${i}].op = this.value">
        ${selectOptions([">", ">=", "<", "<=", "="], f.op)}
      </select>
      <input type="text" value="${f.val}" size="5"
        onchange="statFilters[${i}].val = parseInt(this.value) || 0">
      <button onclick="statFilters.splice(${i},1);renderStats()">x</button>
    </div>
  `;
}

function renderStats() {
  document.getElementById("stat-rows").innerHTML = statFilters
    .map(renderStatFilterRow)
    .join("");
}

// Query

function bst(pokemon) {
  return Object.values(pokemon.stats).reduce((sum, n) => sum + n, 0);
}

function statValue(pokemon, key) {
  if (key === "id") return pokemon.id;
  if (key === "bst") return bst(pokemon);
  return pokemon.stats[key] || 0;
}

// When an ability filter is active, type matchups use only the matched ability.
// This returns the pokemon object to use for matchup calculations.
function filterAbilitiesForMatchup(pokemon, normalizedAbilities) {
  if (normalizedAbilities.length === 0) return pokemon;
  return {
    ...pokemon,
    abilities: pokemon.abilities.filter((a) => normalizedAbilities.includes(a)),
  };
}

async function runQuery() {
  if (!isReady) {
    alert("still loading");
    return;
  }

  const allMoveNames = moveGroups
    .flatMap((group) => group.moves)
    .map((move) => normalizeSlug(move.name))
    .filter(Boolean);
  await Promise.all(allMoveNames.map(cacheMoveType));

  const regName = document.getElementById("regulation").value;
  if (regName) loadRegulation(regName);

  const normalizedMoveGroups = moveGroups
    .map((group) =>
      group.moves
        .filter((move) => move.name.trim())
        .map((move) => {
          const name = normalizeSlug(move.name);
          return { name, stab: move.stab, type: cachedMoveTypes[name] || null };
        }),
    )
    .filter((g) => g.length > 0);

  const normalizedAbilities = abilityFilter.map(normalizeSlug).filter(Boolean);

  // P1: cheap filters
  // These don't need type matchup math so we run them first to narrow the list.
  const candidates = Object.values(pokemonDatabase).filter((pokemon) => {
    const fullName = pokeapiName(pokemon);

    for (const f of nameFilters) {
      const activeTexts = f.texts.map(normalizeSlug).filter(Boolean);
      if (activeTexts.length === 0) continue;
      const hasMatch = activeTexts.some((text) => fullName.includes(text));
      if (f.mode === "includes" && !hasMatch) return false;
      if (f.mode === "excludes" && hasMatch) return false;
    }

    for (const f of pokemonTypeFilters) {
      if (f.types.length === 0) continue;
      const hasAny = f.types.some((t) => pokemon.types.includes(t));
      if (f.mode === "is" && !hasAny) return false;
      if (f.mode === "is-not" && hasAny) return false;
    }

    if (normalizedAbilities.length > 0) {
      if (!normalizedAbilities.some((a) => pokemon.abilities.includes(a)))
        return false;
    }

    if (regName && !regulationSets[regName].has(fullName)) return false;

    for (const group of normalizedMoveGroups) {
      const groupMatches = group.some((move) => {
        if (!pokemon.moves[move.name]) return false;
        if (move.stab && move.type && !pokemon.types.includes(move.type))
          return false;
        return true;
      });
      if (!groupMatches) return false;
    }

    return true;
  });

  // P2: determine which ability to use for type matchup math.
  const candidatesWithAbilityFiltered = candidates.map((pokemon) => ({
    pokemon,
    withAbilityFiltered: filterAbilitiesForMatchup(
      pokemon,
      normalizedAbilities,
    ),
  }));

  // P3: type effectiveness and stat filters (these need the matchup from phase 2)
  const results = candidatesWithAbilityFiltered.filter(
    ({ pokemon, withAbilityFiltered }) => {
      for (const filter of typeFilters) {
        for (const type of filter.types) {
          const effectiveness = typeEffectiveness(type, withAbilityFiltered);
          if (filter.mode === "resists" && effectiveness > 0.5) return false;
          if (filter.mode === "xresists" && effectiveness > 0.25) return false;
          if (filter.mode === "immune" && effectiveness !== 0) return false;
          if (filter.mode === "weak" && effectiveness < 2) return false;
          if (filter.mode === "not-weak" && effectiveness >= 2) return false;
        }
      }

      for (const f of statFilters) {
        const v = statValue(pokemon, f.stat);
        if (f.op === ">" && !(v > f.val)) return false;
        if (f.op === ">=" && !(v >= f.val)) return false;
        if (f.op === "<" && !(v < f.val)) return false;
        if (f.op === "<=" && !(v <= f.val)) return false;
        if (f.op === "=" && v !== f.val) return false;
      }

      return true;
    },
  );

  const sortStat = document.getElementById("sort-stat").value;
  const sortDir = document.getElementById("sort-dir").value;
  results.sort((a, b) => {
    const valA = statValue(a.pokemon, sortStat);
    const valB = statValue(b.pokemon, sortStat);
    return sortDir === "asc" ? valA - valB : valB - valA;
  });

  renderResults(results, sortStat, sortDir, normalizedAbilities);
}

// Render results

function typeBadge(type) {
  return `<span class="tb t-${type}">${type}</span>`;
}

function compactType(type, pokemon) {
  const star = abilityChangesMatchup(type, pokemon) ? "*" : "";
  return `<span class="ct t-${type}">${TYPE_SHORT[type]}${star}</span>`;
}

function renderResults(results, sortStat, sortDir, normalizedAbilities) {
  document.getElementById("result-count").textContent =
    `${results.length} result(s)`;

  document
    .querySelectorAll("#results-table th")
    .forEach((th) => (th.className = ""));
  const sortTh = document.getElementById("th-" + sortStat);
  if (sortTh) sortTh.className = "sort-" + sortDir;

  if (results.length === 0) {
    document.getElementById("results-body").innerHTML =
      `<tr><td colspan="${RESULT_COLS}">no results</td></tr>`;
    return;
  }

  document.getElementById("results-body").innerHTML = results
    .map(({ pokemon, withAbilityFiltered }) => {
      const matchupGroups = typeMatchups(withAbilityFiltered);
      const col = (types) =>
        types.map((t) => compactType(t, withAbilityFiltered)).join(" ");

      const abilities = pokemon.abilities
        .map((ability) => {
          const affectsMatchup = TYPE_MATCHUP_ABILITIES.has(ability);
          const star = affectsMatchup ? "*" : "";
          // Bold = actively selected; fall back to bolding matchup-modifying abilities when no filter is set
          let bold;
          if (normalizedAbilities.length > 0) {
            bold = normalizedAbilities.includes(ability);
          } else {
            bold = affectsMatchup;
          }
          if (bold) return `<b>${ability}${star}</b>`;
          return `${ability}${star}`;
        })
        .join(", ");

      return `<tr>
        <td class="dex">${pokemon.id}</td>
        <td>${pokemon.baseName}</td>
        <td class="form-col">${pokemon.form}</td>
        <td>${pokemon.types.map(typeBadge).join("")}</td>
        <td class="form-col">${abilities}</td>
        <td class="sv">${pokemon.stats.hp}</td>
        <td class="sv">${pokemon.stats.atk}</td>
        <td class="sv">${pokemon.stats.def}</td>
        <td class="sv">${pokemon.stats.spatk}</td>
        <td class="sv">${pokemon.stats.spdef}</td>
        <td class="sv">${pokemon.stats.speed}</td>
        <td class="sv">${bst(pokemon)}</td>
        <td>${col(matchupGroups.immune)}</td>
        <td>${col(matchupGroups.quarter)}</td>
        <td>${col(matchupGroups.half)}</td>
        <td>${col(matchupGroups.double)}</td>
        <td>${col(matchupGroups.quad)}</td>
      </tr>`;
    })
    .join("");
}

function sortBy(stat) {
  if (document.getElementById("sort-stat").value === stat) {
    const current = document.getElementById("sort-dir").value;
    document.getElementById("sort-dir").value =
      current === "desc" ? "asc" : "desc";
  } else {
    document.getElementById("sort-stat").value = stat;
    document.getElementById("sort-dir").value = "desc";
  }
  runQuery();
}

// Reset

function reset() {
  nameFilters = [];
  pokemonTypeFilters = [];
  moveGroups = [];
  typeFilters = [];
  statFilters = [];
  abilityFilter = [];
  renderNameFilters();
  renderPokemonTypeRows();
  renderMoveRows();
  renderTypeRows();
  renderStats();
  renderAbilities();
  document.getElementById("sort-stat").value = "id";
  document.getElementById("sort-dir").value = "asc";
  document.getElementById("regulation").value = "";
  document.getElementById("result-count").textContent = "";
  document.getElementById("results-body").innerHTML =
    `<tr><td colspan="${RESULT_COLS}">run a query to see result(s)</td></tr>`;
}

function refreshData() {
  const today = new Date().toISOString().split("T")[0];
  const refreshLog = lsGet("dg_refresh") || {};
  const usedToday = refreshLog[today] || 0;
  if (usedToday >= 1) {
    alert("Refresh limit reached (1 per day). Try again tomorrow.");
    return;
  }
  if (!confirm("Clear cached Pokemon data and re-fetch from PokeAPI?")) return;
  lsSet("dg_refresh", { ...refreshLog, [today]: usedToday + 1 });
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith(CACHE_KEY)) localStorage.removeItem(key);
  }
  pokemonDatabase = {};
  isReady = false;
  Object.keys(cachedMoveTypes).forEach((k) => delete cachedMoveTypes[k]);
  document.getElementById("prog").value = 0;
  loadData().catch((e) => {
    document.getElementById("status").textContent = "error: " + e.message;
  });
}

function loadExample() {
  reset();

  moveGroups = [
    {
      moves: [
        { name: "thunderbolt", stab: true },
        { name: "discharge", stab: true },
      ],
    },
    { moves: [{ name: "will-o-wisp", stab: false }] },
  ];
  renderMoveRows();

  typeFilters = [{ mode: "immune", types: ["fighting"] }];
  renderTypeRows();

  statFilters = [{ stat: "speed", op: ">", val: 80 }];
  renderStats();

  document.getElementById("sort-stat").value = "spatk";
  document.getElementById("sort-dir").value = "desc";
}

// Init

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target.tagName !== "BUTTON") runQuery();
});

function toggleDark(on) {
  document.body.classList.toggle("dark", on);
  if (on) {
    localStorage.setItem("dg_dark", "1");
  } else {
    localStorage.removeItem("dg_dark");
  }
}

if (localStorage.getItem("dg_dark")) {
  document.body.classList.add("dark");
  document.getElementById("dark-cb").checked = true;
}

reset();
loadData().catch((e) => {
  document.getElementById("status").textContent = "error: " + e.message;
});
