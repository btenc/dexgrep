// Constants

const SITE_UPDATED = "2026-05-08";

// Gen 6+ (current): 18 types including Fairy.
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
  ghost:    { normal: 0, ghost: 2, psychic: 2, dark: 0.5 },
  dragon:   { dragon: 2, steel: 0.5, fairy: 0 },
  dark:     { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel:    { electric: 0.5, fairy: 2, fire: 0.5, ice: 2, rock: 2, steel: 0.5, water: 0.5 },
  fairy:    { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

// Gen 2–5: no Fairy type.
// Steel also resisted Ghost and Dark in these gens (resistance was removed in Gen 6).
// prettier-ignore
const TYPE_CHART_GEN2_5 = {
  normal:   { rock: 0.5, ghost: 0, steel: 0.5 },
  fire:     { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water:    { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass:    { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice:      { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2 },
  poison:   { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0 },
  ground:   { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying:   { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic:  { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug:      { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5 },
  rock:     { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost:    { normal: 0, ghost: 2, psychic: 2, dark: 0.5, steel: 0.5 }, 
  dragon:   { dragon: 2, steel: 0.5 },
  dark:     { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, steel: 0.5 },
  steel:    { electric: 0.5, fire: 0.5, ice: 2, rock: 2, steel: 0.5, water: 0.5 },
};

// Gen 1: Dark, Steel, and Fairy types did not exist.
// Poison was 2x against Bug; Bug was 2x against Poison (both changed in Gen 2).
// Ghost could not hit Psychic (0x) (a well-known programming bug in the original games).
// prettier-ignore
const TYPE_CHART_GEN1 = {
  normal:   { rock: 0.5, ghost: 0 },
  fire:     { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5 },
  water:    { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass:    { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5 },
  ice:      { water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0 },
  poison:   { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, bug: 2 },
  ground:   { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2 },
  flying:   { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5 },
  psychic:  { fighting: 2, poison: 2, psychic: 0.5 },
  bug:      { fire: 0.5, grass: 2, fighting: 0.5, poison: 2, flying: 0.5, psychic: 2, ghost: 0.5 },
  rock:     { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2 },
  ghost:    { normal: 0, psychic: 0, ghost: 2 },
  dragon:   { dragon: 2 },
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

// Generation data

// Maps PokeAPI version group names to their generation number.
// prettier-ignore
const VERSION_GROUP_TO_GEN = {
  // Gen 1
  "red-blue": 1, "yellow": 1, "red-green-japan": 1, "blue-japan": 1,
  // Gen 2
  "gold-silver": 2, "crystal": 2,
  // Gen 3
  "ruby-sapphire": 3, "emerald": 3, "firered-leafgreen": 3, "colosseum": 3, "xd": 3,
  // Gen 4
  "diamond-pearl": 4, "platinum": 4, "heartgold-soulsilver": 4,
  // Gen 5
  "black-white": 5, "black-2-white-2": 5,
  // Gen 6
  "x-y": 6, "omega-ruby-alpha-sapphire": 6,
  // Gen 7
  "sun-moon": 7, "ultra-sun-ultra-moon": 7, "lets-go-pikachu-lets-go-eevee": 7,
  // Gen 8
  "sword-shield": 8, "the-isle-of-armor": 8, "the-crown-tundra": 8,
  "brilliant-diamond-shining-pearl": 8, "legends-arceus": 8,
  // Gen 9
  "scarlet-violet": 9, "the-teal-mask": 9, "the-indigo-disk": 9,
};

// Maps PokeAPI generation names (used in past_types / past_abilities / past_stats) to numbers.
// prettier-ignore
const GENERATION_NUMBER = {
  "generation-i": 1, "generation-ii": 2, "generation-iii": 3,
  "generation-iv": 4, "generation-v": 5,  "generation-vi": 6,
  "generation-vii": 7, "generation-viii": 8, "generation-ix": 9,
};

// The highest national dex ID introduced in each generation.
// prettier-ignore
const GENERATION_MAX_DEX = {
  1: 151, 2: 251, 3: 386, 4: 493,
  5: 649, 6: 721, 7: 809, 8: 905, 9: 1025,
};

// populated asynchronously by filters.js from filters/index.json
const FILTERS = {};
const FILTER_META = {}; // { filterId: { gen: number|null } }
const filterSets = {};

// Utilities

// localStorage helpers that transparently handle JSON serialization.
// Returns null on missing key or parse error; silently drops writes if storage is unavailable.
function storageGet(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}

function storageSet(key, value) {
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

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// URL helpers

function setURLParams(params) {
  const qs = params.toString().replace(/%2C/gi, ",").replace(/%3A/gi, ":");
  if (qs) {
    history.replaceState(null, "", "?" + qs);
  } else {
    history.replaceState(null, "", window.location.pathname);
  }
}

function clearURLParams() {
  history.replaceState(null, "", window.location.pathname);
}

// Binds the Enter key to a callback, ignoring presses from buttons and selects.
function bindEnterKey(callback) {
  document.addEventListener("keydown", function (e) {
    if (
      e.key === "Enter" &&
      e.target.tagName !== "BUTTON" &&
      e.target.tagName !== "SELECT"
    ) {
      callback();
    }
  });
}

// Share the current page URL via the native share sheet, or copy to clipboard as fallback.
// `button` is the triggering element (used for "copied!" feedback on clipboard fallback).
function shareCurrentURL(button) {
  const url = window.location.href;
  if (navigator.share) {
    navigator.share({ title: document.title, url }).catch(function () {});
  } else {
    navigator.clipboard.writeText(url).then(function () {
      const orig = button.textContent;
      button.textContent = "copied!";
      setTimeout(function () {
        button.textContent = orig;
      }, 1500);
    });
  }
}

// Type Effectiveness

// Returns the appropriate type chart for a given generation (0 = current gen 9).
function getTypeChart(gen) {
  if (!gen || gen >= 6) return TYPE_CHART;
  if (gen === 1) return TYPE_CHART_GEN1;
  return TYPE_CHART_GEN2_5; // gen 2–5
}

// Returns the subset of ALL_TYPES that existed in the given generation.
// Used to restrict type matchup calculations and display to relevant types only.
function typesExistingInGen(gen) {
  if (!gen || gen >= 6) return ALL_TYPES;
  if (gen === 1)
    return ALL_TYPES.filter(
      (t) => t !== "dark" && t !== "steel" && t !== "fairy",
    );
  return ALL_TYPES.filter((t) => t !== "fairy"); // gen 2–5: no fairy
}

// Raw chart effectiveness of an attack type against a list of defending types.
// Does not account for abilities. Uses the type chart appropriate for the given gen.
function chartEffectiveness(attackType, types, gen = 0) {
  const chart = getTypeChart(gen);
  const row = chart[attackType] || {};
  let mult = 1;
  for (const t of types) {
    mult *= row[t] ?? 1;
  }
  return mult;
}

// Full type effectiveness including ability modifiers.
// The pokemon object should already have gen-adjusted types and abilities before being passed here;
// gen is used only to select the correct type chart for chartEffectiveness.
function typeEffectiveness(attackType, pokemon, gen = 0) {
  for (const ability of pokemon.abilities) {
    if (ABILITY_TYPE_IMMUNITIES[ability] === attackType) {
      return 0;
    }
  }

  let mult = chartEffectiveness(attackType, pokemon.types, gen);

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

  // Wonder Guard: only super-effective moves land (checked after other modifiers)
  if (pokemon.abilities.includes("wonder-guard") && mult < 2) {
    return 0; // common shedninja L
  }

  return mult;
}

function abilityChangesMatchup(attackType, pokemon, gen = 0) {
  return (
    chartEffectiveness(attackType, pokemon.types, gen) !==
    typeEffectiveness(attackType, pokemon, gen)
  );
}

// Groups all attacking types by their effectiveness against the given pokemon.
// Only checks types that existed in the given generation.
function typeMatchups(pokemon, gen = 0) {
  const groups = { immune: [], quarter: [], half: [], double: [], quad: [] };
  for (const type of typesExistingInGen(gen)) {
    const eff = typeEffectiveness(type, pokemon, gen);
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

// Display utilities

function typeBadge(type) {
  return `<span class="tb t-${type}">${type}</span>`;
}

function effClass(mult) {
  if (mult === 0) return "eff-0";
  if (mult <= 0.25) return "eff-025";
  if (mult <= 0.5) return "eff-05";
  if (mult >= 4) return "eff-4";
  if (mult >= 2) return "eff-2";
  return "";
}

function effLabel(mult) {
  if (mult === 0) return "0";
  if (mult <= 0.25) return "¼";
  if (mult <= 0.5) return "½";
  if (mult >= 4) return "4";
  if (mult >= 2) return "2";
  return "";
}

// Pokemon data utilities

function bst(pokemon) {
  return Object.values(pokemon.stats).reduce((sum, n) => sum + n, 0);
}

function statValue(pokemon, key) {
  if (key === "id") return pokemon.id;
  if (key === "bst") return bst(pokemon);
  return pokemon.stats[key] || 0;
}

// PokeAPI

const POKEAPI = "https://pokeapi.co/api/v2";
// Increment this to bust all locally cached Pokémon data (e.g. after a schema change).
const CACHE_KEY = "dg3";

// prettier-ignore
const POKEAPI_STAT_KEYS = {
  hp: "hp", attack: "atk", defense: "def",
  "special-attack": "spatk", "special-defense": "spdef", speed: "speed",
};

let cachedMoveTypes = storageGet(CACHE_KEY + "_mt") || {};
let pokemonDatabase = {};
let isReady = false;

// Generation-aware Pokemon helpers

// Returns true if a move (stored as a generation bitmask) was learnable in the given generation.
// The bitmask has bit N-1 set for each generation N where the move was available.
function moveAvailableInGen(genBits, gen) {
  return (genBits & (1 << (gen - 1))) !== 0;
}

// Returns the Pokemon's types as they were in the given generation.
// pastTypes entries are sorted ascending by upToGen, so the first entry whose
// upToGen >= gen gives us the types that applied at that point in history.
function pokemonTypesForGen(pokemon, gen) {
  if (!gen) return pokemon.types;
  for (const { upToGen, types } of pokemon.pastTypes) {
    if (gen <= upToGen) return types;
  }
  return pokemon.types;
}

// Returns the Pokemon's ability list as it was in the given generation.
// Abilities were introduced in gen 3, so gens 1 and 2 always return an empty list.
// For gen 3+, we start from the current ability slots and apply past overrides.
// Entries are sorted ascending so the closest applicable entry (smallest upToGen >= gen)
// wins for each slot (later entries for the same slot are ignored).
function pokemonAbilitiesForGen(pokemon, gen) {
  if (!gen) return pokemon.abilities;
  if (gen <= 2) return [];

  const slotMap = { ...pokemon.abilitySlots };
  const appliedSlots = new Set();

  for (const { upToGen, slotOverrides } of pokemon.pastAbilities) {
    if (gen <= upToGen) {
      for (const [slot, name] of Object.entries(slotOverrides)) {
        if (!appliedSlots.has(slot)) {
          slotMap[slot] = name; // name is null if this slot didn't exist yet
          appliedSlots.add(slot);
        }
      }
    }
  }

  return Object.keys(slotMap)
    .sort((a, b) => Number(a) - Number(b))
    .map((slot) => slotMap[slot])
    .filter(Boolean);
}

// Returns the Pokemon's base stats as they were in the given generation.
// Entries are sorted ascending so the closest applicable entry (smallest upToGen >= gen)
// wins for each stat (later entries for the same stat are ignored).
function pokemonStatsForGen(pokemon, gen) {
  if (!gen) return pokemon.stats;
  const stats = { ...pokemon.stats };
  const appliedStats = new Set();

  for (const { upToGen, statOverrides } of pokemon.pastStats) {
    if (gen <= upToGen) {
      for (const [stat, value] of Object.entries(statOverrides)) {
        if (!appliedStats.has(stat)) {
          stats[stat] = value;
          appliedStats.add(stat);
        }
      }
    }
  }
  return stats;
}

// Returns a copy of the Pokemon with its types, abilities, and stats set to their
// values for the given generation. Callers should use this result everywhere instead
// of the raw pokemon object when a generation is selected.
function pokemonForGen(pokemon, gen) {
  if (!gen) return pokemon;
  return {
    ...pokemon,
    types: pokemonTypesForGen(pokemon, gen),
    abilities: pokemonAbilitiesForGen(pokemon, gen),
    stats: pokemonStatsForGen(pokemon, gen),
  };
}

// Returns true if the given pokemon existed in the given generation.
// Checks dex number range, then learnset data for alternate forms.
// Falls back to hard minimums for known form types with no learnset in PokeAPI.
function pokemonExistsInGen(pokemon, gen) {
  if (!gen) return true;
  if (pokemon.id > GENERATION_MAX_DEX[gen]) return false;
  if (pokemon.form) {
    const moveBits = Object.values(pokemon.moves);
    if (moveBits.length > 0) {
      const mask = (1 << gen) - 1;
      if (!moveBits.some((bits) => (bits & mask) !== 0)) return false;
    } else {
      if (pokemon.form === "gmax" && gen < 8) return false;
      if (pokemon.form.startsWith("mega") && gen < 6) return false;
    }
  }
  return true;
}

// Filter and lookup utilities

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
  const data = await fetchJSON(`${POKEAPI}/move/${name}`);
  cachedMoveTypes[name] = data.type.name;
  storageSet(CACHE_KEY + "_mt", cachedMoveTypes);
}

function parsePokemon(data) {
  // Base stats
  const stats = {};
  for (const s of data.stats) {
    if (POKEAPI_STAT_KEYS[s.stat.name]) {
      stats[POKEAPI_STAT_KEYS[s.stat.name]] = s.base_stat;
    }
  }

  // Current abilities stored as both a flat array (for compatibility) and a slot-keyed
  // map. The slot map is needed to apply per-generation ability overrides correctly.
  const abilities = [];
  const abilitySlots = {};
  const sortedAbilities = [...data.abilities].sort((a, b) => a.slot - b.slot);
  for (const a of sortedAbilities) {
    if (a.ability) {
      abilities.push(a.ability.name);
      abilitySlots[a.slot] = a.ability.name;
    }
  }

  // Moves stored as a generation bitmask: bit N-1 is set if the move was learnable
  // in generation N. This lets us efficiently check move availability per gen.
  const moves = {};
  for (const m of data.moves) {
    let genBits = 0;
    for (const vgd of m.version_group_details) {
      const gen = VERSION_GROUP_TO_GEN[vgd.version_group.name];
      if (gen) {
        genBits |= 1 << (gen - 1);
      }
    }
    if (genBits > 0) {
      moves[m.move.name] = genBits;
    }
  }

  // Past types: each entry means "the Pokemon used these types up to and including
  // this generation." Sorted ascending so pokemonTypesForGen can find the first match.
  const pastTypes = (data.past_types || [])
    .map((entry) => ({
      upToGen: GENERATION_NUMBER[entry.generation.name],
      types: entry.types.map((t) => t.type.name),
    }))
    .filter((e) => e.upToGen)
    .sort((a, b) => a.upToGen - b.upToGen);

  // Past abilities: each entry records which ability slots were different (or absent)
  // up to and including that generation. Only the changed slots are listed per entry.
  // Sorted ascending so pokemonAbilitiesForGen can find the closest applicable entry.
  const pastAbilities = (data.past_abilities || [])
    .map((entry) => ({
      upToGen: GENERATION_NUMBER[entry.generation.name],
      slotOverrides: Object.fromEntries(
        entry.abilities.map((a) => [a.slot, a.ability ? a.ability.name : null]),
      ),
    }))
    .filter((e) => e.upToGen)
    .sort((a, b) => a.upToGen - b.upToGen);

  // Past stats: each entry means "the Pokemon had these base stats up to and
  // including this generation." The gen 1 "special" stat (before the spatk/spdef
  // split in gen 2) is mapped to both spatk and spdef.
  // Sorted ascending so pokemonStatsForGen can find the closest applicable entry.
  const pastStats = (data.past_stats || [])
    .map((entry) => {
      const upToGen = GENERATION_NUMBER[entry.generation.name];
      if (!upToGen) return null;
      const statOverrides = {};
      for (const s of entry.stats) {
        if (s.stat.name === "special") {
          statOverrides.spatk = s.base_stat;
          statOverrides.spdef = s.base_stat;
        } else if (POKEAPI_STAT_KEYS[s.stat.name]) {
          statOverrides[POKEAPI_STAT_KEYS[s.stat.name]] = s.base_stat;
        }
      }
      return { upToGen, statOverrides };
    })
    .filter(Boolean)
    .sort((a, b) => a.upToGen - b.upToGen);

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
    abilities,
    abilitySlots,
    stats,
    moves,
    pastTypes,
    pastAbilities,
    pastStats,
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
  const date = storageGet(CACHE_KEY + "_date");
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

  const cached = storageGet(CACHE_KEY + "_db");
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
  storageSet(
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

  storageSet(CACHE_KEY + "_db", pokemonDatabase);
  onReady();
}

function buildDataLists() {
  const abilities = new Set();
  const moves = new Set();
  const pokemonNames = new Set();
  for (const p of Object.values(pokemonDatabase)) {
    for (const a of p.abilities) abilities.add(a);
    for (const m of Object.keys(p.moves)) moves.add(m);
    pokemonNames.add(pokeapiName(p));
  }

  function makeDataList(id, items) {
    const dl = document.createElement("datalist");
    dl.id = id;
    dl.innerHTML = [...items]
      .sort()
      .map((v) => `<option value="${escapeHTML(v)}">`)
      .join("");
    document.body.appendChild(dl);
  }

  makeDataList("ability-datalist", abilities);
  makeDataList("move-datalist", moves);
  makeDataList("pokemon-datalist", pokemonNames);
}

// Validation helpers (return slugs not found in the database)

function unknownMoveNames(slugs) {
  const all = new Set(
    Object.values(pokemonDatabase).flatMap((p) => Object.keys(p.moves)),
  );
  return slugs.filter((s) => !all.has(s));
}

function unknownAbilityNames(slugs) {
  const all = new Set(
    Object.values(pokemonDatabase).flatMap((p) => p.abilities),
  );
  return slugs.filter((s) => !all.has(s));
}

// Looks up a pokemon by name or API slug (e.g. "charizard-mega-x").
// Exact API name takes priority over base name; both resolved in one pass.
function findPokemonByName(nameInput) {
  const slug = normalizeSlug(nameInput);
  if (!slug) {
    return null;
  }
  let baseMatch = null;
  for (const p of Object.values(pokemonDatabase)) {
    if (pokeapiName(p) === slug) {
      return p;
    }
    if (!baseMatch && p.baseName === slug) {
      baseMatch = p;
    }
  }
  return baseMatch;
}

function refreshData() {
  const today = new Date().toISOString().split("T")[0];
  const refreshLog = storageGet("refresh_log") || {};
  const usedToday = refreshLog[today] || 0;
  if (usedToday >= 1) {
    alert("Refresh limit reached (1 per day). Try again tomorrow.");
    return;
  }
  if (!confirm("Clear cached Pokemon data and re-fetch from PokeAPI?")) {
    return;
  }
  storageSet("refresh_log", { ...refreshLog, [today]: usedToday + 1 });
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith(CACHE_KEY)) {
      localStorage.removeItem(key);
    }
  }
  pokemonDatabase = {};
  cachedMoveTypes = {};
  isReady = false;
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
        <small class="tagline">Free and open source Pokédex tools that behave kinda like grep</small>
        <label class="dark-label"><input type="checkbox" id="dark-cb" onchange="toggleDark(this.checked)" ${darkChecked}> dark</label>
      </h2>
      ${nav}
      ${statusBar}
    `;
  }

  const footerEl = document.getElementById("site-footer");
  if (footerEl) {
    footerEl.innerHTML = `
      <small>Data from <a href="https://pokeapi.co">PokéAPI</a> (thank you!) - this site last updated: ${SITE_UPDATED} - <a href="https://github.com/btenc/dexgrep">README and source</a></small>
      <p class="validators">
        <a href="https://validator.w3.org/check?uri=referer"><img src="https://www.w3.org/Icons/valid-html401" alt="Valid HTML!"></a>
        <a href="https://jigsaw.w3.org/css-validator/check/referer"><img src="https://jigsaw.w3.org/css-validator/images/vcss" alt="Valid CSS!"></a>
      </p>
    `;
  }
}

injectLayout();
