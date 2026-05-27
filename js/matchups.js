let selectedMatchupsGen = 0; // 0 = no generation mechanics; 1–9 = specific generation

let team = Array.from({ length: 6 }, () => ({ name: "", ability: "" }));

function onMatchupsGenChange(value) {
  selectedMatchupsGen = parseInt(value) || 0;
}

function renderTeamInputs() {
  document.getElementById("team-slots").innerHTML = team
    .map(
      (slot, si) => `
      <div class="filter-row">
        <b>slot ${si + 1}</b>&nbsp;
        <input type="text" value="${escapeHTML(slot.name)}" size="20" placeholder="pokemon name"
          list="pokemon-datalist"
          onchange="team[${si}].name = this.value">
        &nbsp;ability:&nbsp;
        <input type="text" value="${escapeHTML(slot.ability)}" size="18" placeholder="optional"
          list="ability-datalist"
          onchange="team[${si}].ability = this.value">
      </div>
    `,
    )
    .join("");
}

// URL sharing
//
// The URL encodes the team so it can be bookmarked or shared.
//
// Format:
//   ?gen=5
//     Generation context (omitted when no generation mechanics are active).
//   &team=tyranitar,excadrill,rotom-wash:levitate,corviknight,,
//     Comma-separated list of up to 6 slots.
//     Each slot is "name" or "name:ability". Empty slots are blank.
//     Trailing empty slots are omitted to keep URLs short.

function pushTeamToURL() {
  const params = new URLSearchParams();

  if (selectedMatchupsGen) {
    params.set("gen", selectedMatchupsGen);
  }

  const slots = team.map((slot) => {
    const name = slot.name.trim();
    const ability = slot.ability.trim();
    if (!name) return "";
    return ability ? name + ":" + ability : name;
  });

  while (slots.length > 0 && slots[slots.length - 1] === "") {
    slots.pop();
  }
  if (slots.length > 0) {
    params.set("team", slots.join(","));
  }

  setURLParams(params);
}

function loadTeamFromURL() {
  const params = new URLSearchParams(window.location.search);
  if (params.toString() === "") {
    return;
  }

  const genParam = params.get("gen");
  selectedMatchupsGen = genParam ? parseInt(genParam) || 0 : 0;
  const genSelect = document.getElementById("gen-select");
  if (genSelect) {
    genSelect.value = selectedMatchupsGen || "";
  }

  const teamParam = params.get("team");
  if (teamParam) {
    const parts = teamParam.split(",");
    team = Array.from({ length: 6 }, (_, i) => {
      const part = parts[i] || "";
      const colonIdx = part.indexOf(":");
      if (colonIdx !== -1) {
        return {
          name: part.slice(0, colonIdx),
          ability: part.slice(colonIdx + 1),
        };
      }
      return { name: part, ability: "" };
    });
  }
}

function calculateMatchups() {
  if (!isReady) return;

  const gen = selectedMatchupsGen;

  const resolved = team
    .filter((slot) => slot.name.trim())
    .map((slot) => {
      const pokemon = findPokemonByName(slot.name);
      const abilitySlug = normalizeSlug(slot.ability);

      // Types and abilities for the selected generation
      const genTypes = pokemon ? pokemonTypesForGen(pokemon, gen) : null;
      const genAbilities = pokemon
        ? pokemonAbilitiesForGen(pokemon, gen)
        : null;

      // Abilities are only considered for matchup math if explicitly entered.
      // We use the gen-adjusted ability list for validation only.
      let effectiveAbilities = [];
      if (abilitySlug) {
        effectiveAbilities = [abilitySlug];
      }

      // The effective pokemon object uses gen-adjusted types with the
      // explicitly entered ability (or none) for matchup calculations.
      let effective = null;
      if (pokemon) {
        effective = {
          ...pokemon,
          types: genTypes,
          abilities: effectiveAbilities,
        };
      }

      return {
        label: normalizeSlug(slot.name),
        ability: abilitySlug,
        pokemon: effective,
        baseTypes: genTypes,
        baseAbilities: genAbilities, // gen-adjusted, used for legality validation
      };
    });

  if (resolved.length === 0) {
    alert("enter at least one Pokémon");
    return;
  }

  const issues = [];
  const badPokemon = resolved.filter((s) => !s.pokemon).map((s) => s.label);
  const enteredAbilities = resolved.map((s) => s.ability).filter(Boolean);
  const badAbilities = unknownAbilityNames(enteredAbilities);

  const futureGenPokemon = gen
    ? resolved
        .filter((s) => s.pokemon && !pokemonExistsInGen(s.pokemon, gen))
        .map((s) => s.label)
    : [];

  const illegalAbilities = resolved
    .filter(
      (s) =>
        s.baseAbilities &&
        s.ability &&
        !badAbilities.includes(s.ability) &&
        !s.baseAbilities.includes(s.ability),
    )
    .map(
      (s) => `${s.label} cannot have ${s.ability} in gen ${gen || "current"}`,
    );

  if (badPokemon.length) {
    issues.push("unknown pokémon: " + badPokemon.join(", "));
  }
  if (futureGenPokemon.length) {
    issues.push(`not in gen ${gen}: ` + futureGenPokemon.join(", "));
  }
  if (gen && gen <= 2 && enteredAbilities.length > 0) {
    issues.push("abilities did not exist until gen 3");
  } else {
    if (badAbilities.length) {
      issues.push("unknown abilities: " + badAbilities.join(", "));
    }
    if (illegalAbilities.length) {
      issues.push(illegalAbilities.join(", "));
    }
  }
  if (issues.length) {
    alert(issues.join("\n"));
    return;
  }

  pushTeamToURL();
  renderMatchupsGrid(resolved, gen);
}

function renderMatchupsGrid(resolved, gen = 0) {
  // Only show types that existed in the selected generation
  const typesToShow = typesExistingInGen(gen);

  const typeHeaders = typesToShow
    .map((t) => `<th class="t-${t}" title="${t}">${TYPE_SHORT[t]}</th>`)
    .join("");

  if (resolved.length === 0) {
    document.getElementById("matchups-grid").innerHTML = `
      <div class="team-grid">
        <table>
          <thead><tr><th>pokémon</th>${typeHeaders}</tr></thead>
          <tbody><tr><td colspan="${typesToShow.length + 1}">calculate to see results</td></tr></tbody>
        </table>
      </div>
    `;
    return;
  }

  const rows = resolved
    .map((slot) => {
      if (!slot.pokemon) {
        return `<tr>
          <td class="form-col">${escapeHTML(slot.label)} <small>(?)</small></td>
          ${typesToShow.map(() => `<td class="form-col">?</td>`).join("")}
        </tr>`;
      }
      const typeBadges = slot.baseTypes.map(typeBadge).join("");
      let abilityLabel = "";
      if (slot.ability) {
        abilityLabel = ` <small class="form-col">${escapeHTML(slot.ability)}</small>`;
      }
      const cells = typesToShow
        .map((atk) => {
          const mult = typeEffectiveness(atk, slot.pokemon, gen);
          return `<td class="${effClass(mult)}">${effLabel(mult)}</td>`;
        })
        .join("");
      return `<tr><td>${escapeHTML(slot.label)} ${typeBadges}${abilityLabel}</td>${cells}</tr>`;
    })
    .join("");

  const WEAK_CLS = ["", "agg-w1", "agg-w2", "agg-w3"];
  const RESIST_CLS = ["", "agg-r1", "agg-r2", "agg-r3"];

  const weakCells = typesToShow
    .map((atk) => {
      const n = resolved.filter(
        (s) => s.pokemon && typeEffectiveness(atk, s.pokemon, gen) >= 2,
      ).length;
      return `<td class="${WEAK_CLS[Math.min(n, 3)]}">${n}</td>`;
    })
    .join("");

  const resistCells = typesToShow
    .map((atk) => {
      const n = resolved.filter(
        (s) => s.pokemon && typeEffectiveness(atk, s.pokemon, gen) <= 0.5,
      ).length;
      return `<td class="${RESIST_CLS[Math.min(n, 3)]}">${n}</td>`;
    })
    .join("");

  document.getElementById("matchups-grid").innerHTML = `
    <div class="team-grid">
      <table>
        <thead><tr><th>pokémon</th>${typeHeaders}</tr></thead>
        <tbody>
          ${rows}
          <tr class="agg-row"><td># weak</td>${weakCells}</tr>
          <tr class="agg-row"><td># resist</td>${resistCells}</tr>
        </tbody>
      </table>
    </div>
  `;
}

function loadExample() {
  team = [
    { name: "tyranitar", ability: "" },
    { name: "excadrill", ability: "" },
    { name: "corviknight", ability: "" },
    { name: "rotom-wash", ability: "levitate" },
    { name: "sinistcha", ability: "" },
    { name: "incineroar", ability: "" },
  ];
  selectedMatchupsGen = 9;
  document.getElementById("gen-select").value = 9;
  renderTeamInputs();
  renderMatchupsGrid([]);
}

function resetMatchups() {
  team = Array.from({ length: 6 }, () => ({ name: "", ability: "" }));
  selectedMatchupsGen = 0;
  renderTeamInputs();
  document.getElementById("gen-select").value = "";
  renderMatchupsGrid([]);
  clearURLParams();
}

// Init

bindEnterKey(calculateMatchups);

loadTeamFromURL();
renderTeamInputs();
renderMatchupsGrid([]);

loadData()
  .then(() => {
    if (window.location.search) {
      calculateMatchups();
    }
  })
  .catch((e) => {
    setStatus("error: " + e.message);
  });
