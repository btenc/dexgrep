const RESULT_COLS = 17;

// State

let selectedGen = 0; // 0 = no generation mechanics; 1–9 = specific generation

let nameFilters = []; // [{ mode: "includes"|"excludes", texts: [] }]
let pokemonTypeFilters = []; // [{ mode: "is"|"is-not", types: [] }]
let moveGroups = []; // [{ moves: [{ name, stab }] }]
let abilityFilter = []; // ability names, OR-ed
let typeFilters = []; // [{ mode, types: [] }]
let statFilters = []; // [{ stat, op, val }]

// Generation selector

function onGenChange(value) {
  selectedGen = parseInt(value) || 0;
  pruneTypesForGen(selectedGen);
  renderPokemonTypeRows();
  renderTypeRows();
}

// Called when the regulation filter changes.
// If the selected filter has a gen defined, automatically applies it.
function onFilterChange(filterId) {
  const meta = FILTER_META[filterId];
  if (meta && meta.gen) {
    selectedGen = meta.gen;
    const genSelect = document.getElementById("gen-select");
    if (genSelect) genSelect.value = selectedGen;
    pruneTypesForGen(selectedGen);
    renderPokemonTypeRows();
    renderTypeRows();
  }
}

// Removes types from active type filter state that don't exist in the given gen.
// Called whenever the generation changes to prevent silently filtering on invalid types.
function pruneTypesForGen(gen) {
  const valid = new Set(typesExistingInGen(gen));
  for (const f of pokemonTypeFilters) {
    f.types = f.types.filter((t) => valid.has(t));
  }
  for (const f of typeFilters) {
    f.types = f.types.filter((t) => valid.has(t));
  }
}

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
// When a gen is selected, only show types that existed in that gen.

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
  const options = typesExistingInGen(selectedGen)
    .map(
      (t) =>
        `<option value="${t}" ${t === selectedType ? "selected" : ""}>${t}</option>`,
    )
    .join("");
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
// When a gen is selected, only show types that existed in that gen.

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

  const typeCheckboxes = typesExistingInGen(selectedGen)
    .map(
      (type) => `
      <label>
        <input type="checkbox" ${filter.types.includes(type) ? "checked" : ""}
          onchange="toggleType(${i},'${type}',this.checked)">
        <span class="t-${type}">${type}</span>
      </label>
    `,
    )
    .join("");

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

const STAT_CHOICES = [
  "id",
  "hp",
  "atk",
  "def",
  "spatk",
  "spdef",
  "speed",
  "bst",
];
const OP_CHOICES = [">", ">=", "<", "<=", "="];

function renderStatFilterRow(f, i) {
  const statOptions = STAT_CHOICES.map(
    (c) => `<option ${c === f.stat ? "selected" : ""}>${c}</option>`,
  ).join("");
  const opOptions = OP_CHOICES.map(
    (c) => `<option ${c === f.op ? "selected" : ""}>${c}</option>`,
  ).join("");

  return `
    ${i > 0 ? "<small>AND</small>" : ""}
    <div>
      <select onchange="statFilters[${i}].stat = this.value">${statOptions}</select>
      <select onchange="statFilters[${i}].op = this.value">${opOptions}</select>
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
//   ?gen=5                        generation context (omitted when current)
//   &name=includes:mega,mega-x    name includes "mega" OR "mega-x"
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
  return { mode, values };
}

// Saves all active filters into the URL query string.
function pushFiltersToURL() {
  const params = new URLSearchParams();

  // Generation context (omitted when no generation mechanics are active)
  if (selectedGen) {
    params.set("gen", selectedGen);
  }

  // Name filters
  for (const f of nameFilters) {
    const texts = f.texts.filter((t) => t.trim() !== "");
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
  const activeAbilities = abilityFilter.filter((a) => a.trim() !== "");
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

  // Generation context
  const genParam = params.get("gen");
  if (genParam) {
    selectedGen = parseInt(genParam) || 0;
  } else {
    selectedGen = 0;
  }
  const genSelect = document.getElementById("gen-select");
  if (genSelect) {
    genSelect.value = selectedGen || "";
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
    moveGroups.push({ moves });
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

  statFilters = [];
  for (const entry of params.getAll("stat")) {
    const parts = entry.split(".");
    const stat = parts[0];
    const opParam = parts[1];
    const valStr = parts[2];
    if (!STAT_CHOICES.includes(stat)) {
      continue;
    }
    const op = PARAM_TO_OP[opParam] || ">";
    const val = parseInt(valStr) || 0;
    statFilters.push({ stat, op, val });
  }

  // Sort
  document.getElementById("sort-stat").value = "id";
  document.getElementById("sort-dir").value = "asc";
  const sortParam = params.get("sort");
  if (sortParam) {
    const lastDot = sortParam.lastIndexOf(".");
    if (lastDot !== -1) {
      document.getElementById("sort-stat").value = sortParam.slice(0, lastDot);
      document.getElementById("sort-dir").value = sortParam.slice(lastDot + 1);
    }
  }

  // Prune any types from state that don't exist in the restored gen, then render.
  pruneTypesForGen(selectedGen);
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

  const gen = selectedGen;

  const allMoveNames = moveGroups
    .flatMap((group) => group.moves)
    .map((move) => normalizeSlug(move.name))
    .filter(Boolean);

  const normalizedAbilities = abilityFilter.map(normalizeSlug).filter(Boolean);
  const filterName = document.getElementById("filter").value;
  if (filterName) {
    loadFilter(filterName);
  }

  // Validate before hitting PokeAPI — unknown moves would cause a confusing HTTP 404.
  const badMoves = unknownMoveNames(allMoveNames);
  const badAbilities = unknownAbilityNames(normalizedAbilities);

  // Moves that exist but weren't learnable by any pokemon in the selected gen.
  let movesNotInGen = [];
  if (gen) {
    movesNotInGen = allMoveNames.filter(
      (name) =>
        !badMoves.includes(name) &&
        !Object.values(pokemonDatabase).some((p) =>
          moveAvailableInGen(p.moves[name] ?? 0, gen),
        ),
    );
  }

  const issues = [];
  if (badMoves.length) {
    issues.push("unknown moves: " + badMoves.join(", "));
  }
  if (badAbilities.length) {
    issues.push("unknown abilities: " + badAbilities.join(", "));
  }
  if (gen && gen <= 2 && normalizedAbilities.length > 0) {
    issues.push("abilities did not exist until gen 3");
  }
  if (movesNotInGen.length) {
    issues.push(`move not in gen ${gen}: ` + movesNotInGen.join(", "));
  }
  if (issues.length) {
    alert(issues.join("\n"));
    return;
  }

  if (filterName && !filterSets[filterName]) {
    alert("filter not yet loaded, please try again");
    return;
  }

  // Fetch move types for STAB checking — only for known moves (unknown already rejected above).
  try {
    await Promise.all(allMoveNames.map(cacheMoveType));
  } catch (e) {
    alert("failed to fetch move type data: " + e.message);
    return;
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

  // P1: cheap filters — narrow the list without type matchup math.
  const candidates = Object.values(pokemonDatabase).filter((pokemon) => {
    if (gen && pokemon.id > GENERATION_MAX_DEX[gen]) {
      return false;
    }

    const fullName = pokeapiName(pokemon);

    // Resolve types and abilities for the selected gen so all filters below
    // operate on what the pokemon actually was in that generation.
    const genTypes = pokemonTypesForGen(pokemon, gen);
    const genAbilities = pokemonAbilitiesForGen(pokemon, gen);

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
      const hasAny = f.types.some((t) => genTypes.includes(t));
      if (f.mode === "is" && !hasAny) {
        return false;
      }
      if (f.mode === "is-not" && hasAny) {
        return false;
      }
    }

    if (normalizedAbilities.length > 0) {
      if (!normalizedAbilities.some((a) => genAbilities.includes(a))) {
        return false;
      }
    }

    if (filterName && !filterSets[filterName].has(fullName)) {
      return false;
    }

    for (const group of normalizedMoveGroups) {
      const groupMatches = group.some((move) => {
        const genBits = pokemon.moves[move.name] ?? 0;
        let moveKnown;
        if (gen) {
          moveKnown = moveAvailableInGen(genBits, gen);
        } else {
          moveKnown = genBits !== 0;
        }
        if (!moveKnown) {
          return false;
        }
        if (move.stab && (!move.type || !genTypes.includes(move.type))) {
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

  // P2+P3: build gen-adjusted view and apply type effectiveness + stat filters.
  const results = candidates
    .map((pokemon) => {
      const genPokemon = pokemonForGen(pokemon, gen);
      let abilities = genPokemon.abilities;
      if (normalizedAbilities.length > 0) {
        abilities = genPokemon.abilities.filter((a) =>
          normalizedAbilities.includes(a),
        );
      }
      return {
        pokemon,
        genPokemon,
        withAbilityFiltered: { ...genPokemon, abilities },
      };
    })
    .filter(({ genPokemon, withAbilityFiltered }) => {
      for (const filter of typeFilters) {
        for (const type of filter.types) {
          const effectiveness = typeEffectiveness(
            type,
            withAbilityFiltered,
            gen,
          );
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
        const v = statValue(genPokemon, f.stat);
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
    });

  const sortStat = document.getElementById("sort-stat").value;
  const sortDir = document.getElementById("sort-dir").value;
  results.sort((a, b) => {
    const valA = statValue(a.genPokemon, sortStat);
    const valB = statValue(b.genPokemon, sortStat);
    if (sortDir === "asc") {
      return valA - valB;
    }
    return valB - valA;
  });

  pushFiltersToURL();
  renderResults(results, sortStat, sortDir, normalizedAbilities, gen);
}

// Render results

function compactType(type, pokemon, gen) {
  let star = "";
  if (abilityChangesMatchup(type, pokemon, gen)) {
    star = "*";
  }
  return `<span class="ct t-${type}">${TYPE_SHORT[type]}${star}</span>`;
}

function renderResults(results, sortStat, sortDir, normalizedAbilities, gen) {
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
    .map(({ pokemon, genPokemon, withAbilityFiltered }) => {
      const matchupGroups = typeMatchups(withAbilityFiltered, gen);
      const col = (types) =>
        types.map((t) => compactType(t, withAbilityFiltered, gen)).join(" ");

      const abilities = genPokemon.abilities
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
        <td>${genPokemon.types.map(typeBadge).join("")}</td>
        <td class="form-col">${abilities}</td>
        <td class="sv">${genPokemon.stats.hp}</td>
        <td class="sv">${genPokemon.stats.atk}</td>
        <td class="sv">${genPokemon.stats.def}</td>
        <td class="sv">${genPokemon.stats.spatk}</td>
        <td class="sv">${genPokemon.stats.spdef}</td>
        <td class="sv">${genPokemon.stats.speed}</td>
        <td class="sv">${bst(genPokemon)}</td>
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
  selectedGen = 0;
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
  document.getElementById("gen-select").value = "";
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
