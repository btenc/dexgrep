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
  if (moveGroups[gi].moves.length === 0) {
    moveGroups.splice(gi, 1);
  }
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

// URL param serialization

const OP_TO_PARAM = { ">": "gt", ">=": "gte", "<": "lt", "<=": "lte", "=": "eq" };
const PARAM_TO_OP = Object.fromEntries(
  Object.entries(OP_TO_PARAM).map(([k, v]) => [v, k]),
);

function pushFiltersToURL() {
  const params = new URLSearchParams();

  const activeNameFilters = nameFilters.filter(
    (f) => f.texts.some((t) => t.trim()),
  );
  if (activeNameFilters.length > 0) {
    params.set(
      "name",
      activeNameFilters
        .map((f) => f.mode + ":" + f.texts.filter((t) => t.trim()).join(","))
        .join("|"),
    );
  }

  const activePTypeFilters = pokemonTypeFilters.filter(
    (f) => f.types.length > 0,
  );
  if (activePTypeFilters.length > 0) {
    params.set(
      "ptype",
      activePTypeFilters
        .map((f) => f.mode + ":" + f.types.join(","))
        .join("|"),
    );
  }

  const activeMoveGroups = moveGroups.filter(
    (g) => g.moves.some((m) => m.name.trim()),
  );
  if (activeMoveGroups.length > 0) {
    params.set(
      "moves",
      activeMoveGroups
        .map((g) =>
          g.moves
            .filter((m) => m.name.trim())
            .map((m) => m.name.trim() + "." + (m.stab ? "1" : "0"))
            .join(","),
        )
        .join("|"),
    );
  }

  const activeAbilities = abilityFilter.filter((a) => a.trim());
  if (activeAbilities.length > 0) {
    params.set("ability", activeAbilities.join(","));
  }

  const activeTypeFilters = typeFilters.filter((f) => f.types.length > 0);
  if (activeTypeFilters.length > 0) {
    params.set(
      "etype",
      activeTypeFilters
        .map((f) => f.mode + ":" + f.types.join(","))
        .join("|"),
    );
  }

  if (statFilters.length > 0) {
    params.set(
      "stats",
      statFilters
        .map((f) => f.stat + "." + OP_TO_PARAM[f.op] + "." + f.val)
        .join("|"),
    );
  }

  const sortStat = document.getElementById("sort-stat").value;
  const sortDir = document.getElementById("sort-dir").value;
  if (sortStat !== "id" || sortDir !== "asc") {
    params.set("sort", sortStat + "." + sortDir);
  }

  const filterName = document.getElementById("filter").value;
  if (filterName) {
    params.set("reg", filterName);
  }

  const qs = params.toString();
  history.replaceState(null, "", qs ? "?" + qs : window.location.pathname);
}

function loadFiltersFromURL() {
  const params = new URLSearchParams(window.location.search);
  if (params.toString() === "") {
    reset();
    return;
  }

  // Name filters
  const nameParam = params.get("name");
  if (nameParam) {
    nameFilters = nameParam.split("|").map((row) => {
      const [mode, ...rest] = row.split(":");
      return { mode, texts: rest.join(":").split(",") };
    });
  } else {
    nameFilters = [];
  }

  // Pokemon type filters
  const ptypeParam = params.get("ptype");
  if (ptypeParam) {
    pokemonTypeFilters = ptypeParam.split("|").map((row) => {
      const [mode, ...rest] = row.split(":");
      return { mode, types: rest.join(":").split(",") };
    });
  } else {
    pokemonTypeFilters = [];
  }

  // Move groups
  const movesParam = params.get("moves");
  if (movesParam) {
    moveGroups = movesParam.split("|").map((group) => ({
      moves: group.split(",").map((entry) => {
        const lastDot = entry.lastIndexOf(".");
        return {
          name: entry.substring(0, lastDot),
          stab: entry.substring(lastDot + 1) === "1",
        };
      }),
    }));
  } else {
    moveGroups = [];
  }

  // Ability filter
  const abilityParam = params.get("ability");
  abilityFilter = abilityParam ? abilityParam.split(",") : [];

  // Type effectiveness filters
  const etypeParam = params.get("etype");
  if (etypeParam) {
    typeFilters = etypeParam.split("|").map((row) => {
      const [mode, ...rest] = row.split(":");
      return { mode, types: rest.join(":").split(",") };
    });
  } else {
    typeFilters = [];
  }

  // Stat filters
  const statsParam = params.get("stats");
  if (statsParam) {
    statFilters = statsParam.split("|").map((entry) => {
      const parts = entry.split(".");
      return {
        stat: parts[0],
        op: PARAM_TO_OP[parts[1]] || ">",
        val: parseInt(parts[2]) || 0,
      };
    });
  } else {
    statFilters = [];
  }

  // Sort
  const sortParam = params.get("sort");
  if (sortParam) {
    const [stat, dir] = sortParam.split(".");
    document.getElementById("sort-stat").value = stat;
    document.getElementById("sort-dir").value = dir;
  } else {
    document.getElementById("sort-stat").value = "id";
    document.getElementById("sort-dir").value = "asc";
  }

  // Regulation filter
  const regParam = params.get("reg");
  document.getElementById("filter").value = regParam || "";

  // Render all filter UIs
  renderNameFilters();
  renderPokemonTypeRows();
  renderMoveRows();
  renderTypeRows();
  renderStats();
  renderAbilities();
}

function shareQuery() {
  pushFiltersToURL();
  const url = window.location.href;
  if (navigator.share) {
    navigator.share({ title: "DEXGREP Search", url }).catch(() => {});
  } else {
    navigator.clipboard.writeText(url).then(() => {
      const btn = document.querySelector('button[onclick="shareQuery()"]');
      const orig = btn.textContent;
      btn.textContent = "copied!";
      setTimeout(() => { btn.textContent = orig; }, 1500);
    });
  }
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
  await Promise.all(allMoveNames.map(cacheMoveType));

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
        if (move.stab && move.type && !pokemon.types.includes(move.type)) {
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
            return `<b>${ability}${star}</b>`;
          }
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
  history.replaceState(null, "", window.location.pathname);
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
