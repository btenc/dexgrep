const RESULT_COLS = 17;

// Search-specific utilities

function bst(pokemon) {
  return Object.values(pokemon.stats).reduce((sum, n) => sum + n, 0);
}

function statValue(pokemon, key) {
  if (key === "id") {
    return pokemon.id;
  }
  if (key === "bst") {
    return bst(pokemon);
  }
  return pokemon.stats[key] || 0;
}

// When an ability filter is active, type matchups use only the matched ability.
// This returns the pokemon object to use for matchup calculations.
function filterAbilitiesForMatchup(pokemon, normalizedAbilities) {
  if (normalizedAbilities.length === 0) {
    return pokemon;
  }
  return {
    ...pokemon,
    abilities: pokemon.abilities.filter((a) => normalizedAbilities.includes(a)),
  };
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
  if (nameFilters[gi].texts.length === 0) {
    nameFilters.splice(gi, 1);
  }
  renderNameFilters();
}

function renderNameFilterText(text, gi, ti) {
  return `
    ${ti > 0 ? "<small>or</small>" : ""}
    <input type="text" value="${escapeHTML(text)}" size="18" placeholder="e.g. mega"
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
  if (pokemonTypeFilters[gi].types.length === 0) {
    pokemonTypeFilters.splice(gi, 1);
  }
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
      <input type="text" value="${escapeHTML(name)}" size="18" placeholder="ability name"
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
  if (moveGroups[gi].moves.length === 0) {
    moveGroups.splice(gi, 1);
  }
  renderMoveRows();
}

function renderMoveEntry(move, gi, mi) {
  return `
    ${mi > 0 ? "<small>or</small>" : ""}
    <input type="text" value="${escapeHTML(move.name)}" size="18" placeholder="move name"
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
    if (!typeFilters[i].types.includes(type)) {
      typeFilters[i].types.push(type);
    }
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
  const selectOptions = function (choices, current) {
    return choices
      .map((c) => `<option ${c === current ? "selected" : ""}>${c}</option>`)
      .join("");
  };

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

// URL sharing
//
// The URL encodes the full query so it can be bookmarked or shared.
//
// Format rules:
//   Commas   ( , ) = OR multiple values within one filter row
//   Repeated key  = AND multiple rows of the same filter
//
// Full example:
//   ?name=includes:mega,mega-x    name includes "mega" OR "mega-x"
//   &name=excludes:gmax           AND name excludes "gmax"
//   &ptype=is:fire,dragon         AND pokemon type is fire OR dragon
//   &moves=thunderbolt.stab,discharge.stab  AND knows thunderbolt OR discharge (with STAB)
//   &moves=will-o-wisp            AND knows will-o-wisp (no STAB required)
//   &ability=levitate,flash-fire  AND ability is levitate OR flash-fire
//   &etype=resists:fire,water     AND resists fire AND water
//   &etype=weak:electric          AND weak to electric
//   &stat=speed.gt.80             AND speed > 80
//   &stat=hp.gte.100              AND hp >= 100
//   &sort=spatk.desc
//   &reg=reg-ma

const OP_TO_PARAM = {
  ">": "gt",
  ">=": "gte",
  "<": "lt",
  "<=": "lte",
  "=": "eq",
};
const PARAM_TO_OP = { gt: ">", gte: ">=", lt: "<", lte: "<=", eq: "=" };
const STAB_SUFFIX = ".stab";

// Splits a "mode:val1,val2" string into its mode and values array.
// Used by name, ptype, and etype filters which all share this format.
function parseModeValues(str) {
  const colonIdx = str.indexOf(":");
  if (colonIdx === -1) {
    return null;
  }
  const mode = str.slice(0, colonIdx);
  const values = str.slice(colonIdx + 1).split(",");
  return { mode: mode, values: values };
}

// Saves all active filters into the URL query string.
function pushFiltersToURL() {
  const params = new URLSearchParams();

  // Name filters
  for (const f of nameFilters) {
    const texts = f.texts.filter(function (t) {
      return t.trim() !== "";
    });
    if (texts.length > 0) {
      params.append("name", f.mode + ":" + texts.join(","));
    }
  }

  // Pokemon type filters
  for (const f of pokemonTypeFilters) {
    if (f.types.length > 0) {
      params.append("ptype", f.mode + ":" + f.types.join(","));
    }
  }

  // Move groups
  for (const g of moveGroups) {
    const entries = [];
    for (const m of g.moves) {
      if (m.name.trim() !== "") {
        let entry = m.name.trim();
        if (m.stab) {
          entry = entry + STAB_SUFFIX;
        }
        entries.push(entry);
      }
    }
    if (entries.length > 0) {
      params.append("moves", entries.join(","));
    }
  }

  // Ability filter
  const activeAbilities = abilityFilter.filter(function (a) {
    return a.trim() !== "";
  });
  if (activeAbilities.length > 0) {
    params.set("ability", activeAbilities.join(","));
  }

  // Type effectiveness filters
  for (const f of typeFilters) {
    if (f.types.length > 0) {
      params.append("etype", f.mode + ":" + f.types.join(","));
    }
  }

  // Stat filters
  for (const f of statFilters) {
    params.append("stat", f.stat + "." + OP_TO_PARAM[f.op] + "." + f.val);
  }

  // Sort: only saved when not the default (id, asc)
  const sortStat = document.getElementById("sort-stat").value;
  const sortDir = document.getElementById("sort-dir").value;
  if (sortStat !== "id" || sortDir !== "asc") {
    params.set("sort", sortStat + "." + sortDir);
  }

  // Regulation/format filter
  const filterName = document.getElementById("filter").value;
  if (filterName) {
    params.set("reg", filterName);
  }

  setURLParams(params);
}

function loadFiltersFromURL() {
  const params = new URLSearchParams(window.location.search);

  if (params.toString() === "") {
    reset();
    return;
  }

  nameFilters = [];
  for (const row of params.getAll("name")) {
    const parsed = parseModeValues(row);
    if (parsed) {
      nameFilters.push({ mode: parsed.mode, texts: parsed.values });
    }
  }

  pokemonTypeFilters = [];
  for (const row of params.getAll("ptype")) {
    const parsed = parseModeValues(row);
    if (parsed) {
      pokemonTypeFilters.push({ mode: parsed.mode, types: parsed.values });
    }
  }

  // Move groups
  moveGroups = [];
  for (const group of params.getAll("moves")) {
    const moves = [];
    for (const entry of group.split(",")) {
      let moveName = entry;
      let stabRequired = false;
      if (entry.endsWith(STAB_SUFFIX)) {
        moveName = entry.slice(0, -STAB_SUFFIX.length);
        stabRequired = true;
      }
      moves.push({ name: moveName, stab: stabRequired });
    }
    moveGroups.push({ moves: moves });
  }

  // Ability filter
  const abilityParam = params.get("ability");
  if (abilityParam) {
    abilityFilter = abilityParam.split(",");
  } else {
    abilityFilter = [];
  }

  // Type effectiveness filters
  typeFilters = [];
  for (const row of params.getAll("etype")) {
    const parsed = parseModeValues(row);
    if (parsed) {
      typeFilters.push({ mode: parsed.mode, types: parsed.values });
    }
  }

  const VALID_STATS = new Set([
    "id",
    "hp",
    "atk",
    "def",
    "spatk",
    "spdef",
    "speed",
    "bst",
  ]);
  statFilters = [];
  for (const entry of params.getAll("stat")) {
    const parts = entry.split(".");
    const stat = parts[0];
    const opParam = parts[1];
    const valStr = parts[2];
    if (!VALID_STATS.has(stat)) {
      continue;
    }
    const op = PARAM_TO_OP[opParam] || ">";
    const val = parseInt(valStr) || 0;
    statFilters.push({ stat: stat, op: op, val: val });
  }

  // Sort
  const sortParam = params.get("sort");
  let lastDot = -1;
  if (sortParam) {
    lastDot = sortParam.lastIndexOf(".");
  }
  if (sortParam && lastDot !== -1) {
    document.getElementById("sort-stat").value = sortParam.slice(0, lastDot);
    document.getElementById("sort-dir").value = sortParam.slice(lastDot + 1);
  } else {
    document.getElementById("sort-stat").value = "id";
    document.getElementById("sort-dir").value = "asc";
  }

  // Re-render all filter UI sections to reflect the loaded state
  renderNameFilters();
  renderPokemonTypeRows();
  renderMoveRows();
  renderTypeRows();
  renderStats();
  renderAbilities();
}

// Query

async function runQuery() {
  if (!isReady) {
    alert("still loading");
    return;
  }

  const allMoveNames = moveGroups
    .flatMap((group) => group.moves)
    .map((move) => normalizeSlug(move.name))
    .filter(Boolean);
  try {
    await Promise.all(allMoveNames.map(cacheMoveType));
  } catch (e) {
    alert("failed to fetch move type data: " + e.message);
    return;
  }

  const filterName = document.getElementById("filter").value;
  if (filterName) {
    loadFilter(filterName);
  }

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

  if (filterName && !filterSets[filterName]) {
    alert("filter not yet loaded, please try again");
    return;
  }

  const badMoves = unknownMoveNames(allMoveNames);
  const badAbilities = unknownAbilityNames(normalizedAbilities);
  const issues = [];
  if (badMoves.length) {
    issues.push("unknown moves: " + badMoves.join(", "));
  }
  if (badAbilities.length) {
    issues.push("unknown abilities: " + badAbilities.join(", "));
  }
  if (issues.length) {
    alert(issues.join("\n"));
    return;
  }

  // P1: cheap filters
  // These don't need type matchup math so we run them first to narrow the list.
  const candidates = Object.values(pokemonDatabase).filter((pokemon) => {
    const fullName = pokeapiName(pokemon);

    for (const f of nameFilters) {
      const activeTexts = f.texts.map(normalizeSlug).filter(Boolean);
      if (activeTexts.length === 0) {
        continue;
      }
      const hasMatch = activeTexts.some((text) => fullName.includes(text));
      if (f.mode === "includes" && !hasMatch) {
        return false;
      }
      if (f.mode === "excludes" && hasMatch) {
        return false;
      }
    }

    for (const f of pokemonTypeFilters) {
      if (f.types.length === 0) {
        continue;
      }
      const hasAny = f.types.some((t) => pokemon.types.includes(t));
      if (f.mode === "is" && !hasAny) {
        return false;
      }
      if (f.mode === "is-not" && hasAny) {
        return false;
      }
    }

    if (normalizedAbilities.length > 0) {
      if (!normalizedAbilities.some((a) => pokemon.abilities.includes(a))) {
        return false;
      }
    }

    if (
      filterName &&
      filterSets[filterName] &&
      !filterSets[filterName].has(fullName)
    ) {
      return false;
    }

    for (const group of normalizedMoveGroups) {
      const groupMatches = group.some((move) => {
        if (!pokemon.moves[move.name]) {
          return false;
        }
        if (move.stab && (!move.type || !pokemon.types.includes(move.type))) {
          return false;
        }
        return true;
      });
      if (!groupMatches) {
        return false;
      }
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
          if (filter.mode === "resists" && effectiveness > 0.5) {
            return false;
          }
          if (filter.mode === "xresists" && effectiveness > 0.25) {
            return false;
          }
          if (filter.mode === "immune" && effectiveness !== 0) {
            return false;
          }
          if (filter.mode === "weak" && effectiveness < 2) {
            return false;
          }
          if (filter.mode === "not-weak" && effectiveness >= 2) {
            return false;
          }
        }
      }

      for (const f of statFilters) {
        const v = statValue(pokemon, f.stat);
        if (f.op === ">" && !(v > f.val)) {
          return false;
        }
        if (f.op === ">=" && !(v >= f.val)) {
          return false;
        }
        if (f.op === "<" && !(v < f.val)) {
          return false;
        }
        if (f.op === "<=" && !(v <= f.val)) {
          return false;
        }
        if (f.op === "=" && v !== f.val) {
          return false;
        }
      }

      return true;
    },
  );

  const sortStat = document.getElementById("sort-stat").value;
  const sortDir = document.getElementById("sort-dir").value;
  results.sort((a, b) => {
    const valA = statValue(a.pokemon, sortStat);
    const valB = statValue(b.pokemon, sortStat);
    if (sortDir === "asc") {
      return valA - valB;
    }
    return valB - valA;
  });

  pushFiltersToURL();
  renderResults(results, sortStat, sortDir, normalizedAbilities);
}

// Render results

function typeBadge(type) {
  return `<span class="tb t-${type}">${type}</span>`;
}

function compactType(type, pokemon) {
  let star = "";
  if (abilityChangesMatchup(type, pokemon)) {
    star = "*";
  }
  return `<span class="ct t-${type}">${TYPE_SHORT[type]}${star}</span>`;
}

function renderResults(results, sortStat, sortDir, normalizedAbilities) {
  document.getElementById("result-count").textContent =
    `${results.length} result(s)`;

  document.querySelectorAll("#results-table th").forEach((th) => {
    th.className = "";
  });
  const sortTh = document.getElementById("th-" + sortStat);
  if (sortTh) {
    sortTh.className = "sort-" + sortDir;
  }

  if (results.length === 0) {
    document.getElementById("results-body").innerHTML =
      `<tr><td colspan="${RESULT_COLS}">no results</td></tr>`;
    return;
  }

  document.getElementById("results-body").innerHTML = results
    .map(({ pokemon, withAbilityFiltered }) => {
      const matchupGroups = typeMatchups(withAbilityFiltered);
      function col(types) {
        return types.map((t) => compactType(t, withAbilityFiltered)).join(" ");
      }

      const abilities = pokemon.abilities
        .map((ability) => {
          const affectsMatchup = TYPE_MATCHUP_ABILITIES.has(ability);
          let star = "";
          if (affectsMatchup) {
            star = "*";
          }
          // Bold = actively selected; fall back to bolding matchup-modifying abilities when no filter is set
          let bold;
          if (normalizedAbilities.length > 0) {
            bold = normalizedAbilities.includes(ability);
          } else {
            bold = affectsMatchup;
          }
          if (bold) {
            return `<b>${escapeHTML(ability)}${star}</b>`;
          }
          return `${escapeHTML(ability)}${star}`;
        })
        .join(", ");

      return `<tr>
        <td class="dex">${pokemon.id}</td>
        <td>${escapeHTML(pokemon.baseName)}</td>
        <td class="form-col">${escapeHTML(pokemon.form)}</td>
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
    if (current === "desc") {
      document.getElementById("sort-dir").value = "asc";
    } else {
      document.getElementById("sort-dir").value = "desc";
    }
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
  document.getElementById("filter").value = "";
  document.getElementById("result-count").textContent = "";
  document.getElementById("results-body").innerHTML =
    `<tr><td colspan="${RESULT_COLS}">run a query to see result(s)</td></tr>`;
  clearURLParams();
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
  if (e.key === "Enter" && e.target.tagName !== "BUTTON") {
    runQuery();
  }
});

// Render filter UI immediately (regulation dropdown may not be ready yet)
loadFiltersFromURL();

// Once both filters index and pokemon data are loaded, restore regulation and auto-run
Promise.all([filtersReady, loadData()])
  .then(() => {
    const params = new URLSearchParams(window.location.search);
    const reg = params.get("reg");
    if (reg) {
      document.getElementById("filter").value = reg;
    }
    if (window.location.search) {
      runQuery();
    }
  })
  .catch((e) => {
    setStatus("error: " + e.message);
  });
