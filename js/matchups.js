let team = Array.from({ length: 6 }, () => ({ name: "", ability: "" }));

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

function calculateMatchups() {
  if (!isReady) {
    alert("still loading");
    return;
  }

  const filterName = document.getElementById("filter").value;
  if (filterName) {
    loadFilter(filterName);
  }

  const resolved = team
    .filter((slot) => slot.name.trim())
    .map((slot) => {
      const pokemon = findPokemonByName(slot.name);
      const abilitySlug = normalizeSlug(slot.ability);

      // Abilities are only considered if explicitly entered
      let effectiveAbilities = [];
      if (abilitySlug) {
        effectiveAbilities = [abilitySlug];
      }

      let effective = null;
      if (pokemon) {
        effective = { ...pokemon, abilities: effectiveAbilities };
      }

      let baseTypes = null;
      if (pokemon) {
        baseTypes = pokemon.types;
      }

      return {
        label: slot.name.trim(),
        ability: abilitySlug,
        pokemon: effective,
        baseTypes: baseTypes,
      };
    });

  if (resolved.length === 0) {
    document.getElementById("matchups-grid").innerHTML =
      "<p>enter at least one Pokémon</p>";
    return;
  }

  const issues = [];
  const badPokemon = resolved.filter((s) => !s.pokemon).map((s) => s.label);
  const enteredAbilities = resolved.map((s) => s.ability).filter(Boolean);
  const badAbilities = unknownAbilityNames(enteredAbilities);

  if (badPokemon.length) {
    issues.push("unknown pokémon: " + badPokemon.join(", "));
  }
  if (badAbilities.length) {
    issues.push("unknown abilities: " + badAbilities.join(", "));
  }
  if (filterName && !filterSets[filterName]) {
    issues.push("filter not yet loaded, please try again");
  } else if (filterName) {
    const illegal = resolved
      .filter(
        (s) => s.pokemon && !filterSets[filterName].has(pokeapiName(s.pokemon)),
      )
      .map((s) => s.label);
    if (illegal.length) {
      issues.push("not in " + filterName + ": " + illegal.join(", "));
    }
  }
  if (issues.length) {
    alert(issues.join("\n"));
    return;
  }

  renderMatchupsGrid(resolved);
}

function effClass(mult) {
  if (mult === 0) {
    return "eff-0";
  }
  if (mult <= 0.25) {
    return "eff-025";
  }
  if (mult <= 0.5) {
    return "eff-05";
  }
  if (mult >= 4) {
    return "eff-4";
  }
  if (mult >= 2) {
    return "eff-2";
  }
  return "";
}

function effLabel(mult) {
  if (mult === 0) {
    return "0";
  }
  if (mult <= 0.25) {
    return "¼";
  }
  if (mult <= 0.5) {
    return "½";
  }
  if (mult >= 4) {
    return "4";
  }
  if (mult >= 2) {
    return "2";
  }
  return "";
}

function renderMatchupsGrid(resolved) {
  const typeHeaders = ALL_TYPES.map(
    (t) => `<th class="t-${t}" title="${t}">${TYPE_SHORT[t]}</th>`,
  ).join("");

  const rows = resolved
    .map((slot) => {
      if (!slot.pokemon) {
        return `<tr>
          <td class="form-col">${slot.label} <small>(?)</small></td>
          ${ALL_TYPES.map(() => `<td class="form-col">?</td>`).join("")}
        </tr>`;
      }
      const typeBadges = slot.baseTypes
        .map((t) => `<span class="tb t-${t}">${t}</span>`)
        .join("");
      let abilityLabel = "";
      if (slot.ability) {
        abilityLabel = ` <small class="form-col">${slot.ability}</small>`;
      }
      const cells = ALL_TYPES.map((atk) => {
        const mult = typeEffectiveness(atk, slot.pokemon);
        return `<td class="${effClass(mult)}">${effLabel(mult)}</td>`;
      }).join("");
      return `<tr><td>${slot.label} ${typeBadges}${abilityLabel}</td>${cells}</tr>`;
    })
    .join("");

  const WEAK_CLS = ["", "agg-w1", "agg-w2", "agg-w3"];
  const RESIST_CLS = ["", "agg-r1", "agg-r2", "agg-r3"];

  const weakCells = ALL_TYPES.map((atk) => {
    const n = resolved.filter(
      (s) => s.pokemon && typeEffectiveness(atk, s.pokemon) >= 2,
    ).length;
    return `<td class="${WEAK_CLS[Math.min(n, 3)]}">${n}</td>`;
  }).join("");

  const resistCells = ALL_TYPES.map((atk) => {
    const n = resolved.filter(
      (s) => s.pokemon && typeEffectiveness(atk, s.pokemon) <= 0.5,
    ).length;
    return `<td class="${RESIST_CLS[Math.min(n, 3)]}">${n}</td>`;
  }).join("");

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
  renderTeamInputs();
  document.getElementById("matchups-grid").innerHTML = "";
}

function resetMatchups() {
  team = Array.from({ length: 6 }, () => ({ name: "", ability: "" }));
  renderTeamInputs();
  document.getElementById("filter").value = "";
  document.getElementById("matchups-grid").innerHTML = "";
}

// Init

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target.tagName !== "BUTTON") {
    calculateMatchups();
  }
});

renderTeamInputs();
loadData().catch((e) => {
  setStatus("error: " + e.message);
});
