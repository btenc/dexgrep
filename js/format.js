// Loads Smogon usage stats and exposes them to search.js.
//
// smogon.com/stats does not send CORS headers, so browser JS can't read it directly.
// We route requests through a Cloudflare Worker (WORKER_URL) that fetches smogon.com
// server-side and adds the required CORS header. The data is public; we're just bridging
// a browser restriction.
//
// How it works:
//   1. Page load  -> fetch smogon.com/stats/ -> parse month links -> populate month dropdown
//   2. Pick month -> fetch smogon.com/stats/YYYY-MM/ -> parse format links -> populate format dropdown
//   3. Pick format -> fetch the .txt usage file -> parse it -> expose data to search.js

const SMOGON_STATS_URL = "https://www.smogon.com/stats";
// Cloudflare Worker that proxies smogon.com/stats with CORS headers.
const WORKER_URL = "https://dexgrep.wten.workers.dev";

// Fetch via CORS-enabled worker. The worker mirrors smogon.com/stats at its root,
// so we strip the smogon base URL and prepend the worker URL.
async function smogonFetch(url) {
  const path = url.replace(SMOGON_STATS_URL, "");
  const res = await fetch(WORKER_URL + path);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

// Extract month and format links from smogon.com/stats/.
function parseLinks(html, pattern) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return [...doc.querySelectorAll("a[href]")]
    .map((a) => a.getAttribute("href"))
    .filter((href) => pattern.test(href));
}

// Parses a Smogon stats .txt file and returns a Map of Smogon name -> usage %.
// Each data line looks like:  |  1 | Landorus-Therian          |  56.789% | ...
function parseUsageFile(text) {
  const usage = new Map();
  for (const line of text.split("\n")) {
    const match = line.match(/^\s*\|\s*\d+\s*\|\s*([^|]+?)\s*\|\s*([\d.]+)%/);
    if (match) usage.set(match[1].trim(), parseFloat(match[2]));
  }
  return usage;
}

// slug-map.json handles the Pokemon where Smogon display names don't
// directly convert to PokeAPI slugs (e.g. "Mr. Mime" -> "mr-mime", "Aegislash"
// -> "aegislash-shield"). Everything else is handled by lowercase and space stripping (replacing with "-").

const SLUG_MAP_URL = new URL("slug-map.json", document.currentScript.src).href;
let slugMap = null;

async function loadSlugMap() {
  if (slugMap) return slugMap;
  try {
    const res = await fetch(SLUG_MAP_URL);
    const data = await res.json();
    delete data["_comment"];
    slugMap = data;
  } catch (e) {
    console.warn("[format] Could not load slug-map.json:", e.message);
    slugMap = {};
  }
  return slugMap;
}

// Converts a Smogon display name to one or more PokeAPI slugs.
// Returns an array: usually one slug, sometimes two (e.g. gender forms), never zero
// (unless the name is explicitly mapped to null in slug-map.json, meaning we have
// no mapping for it yet).
function smogonNameToSlugs(name, map) {
  if (Object.prototype.hasOwnProperty.call(map, name)) {
    const v = map[name];
    if (v === null) return []; // known gap - needs an entry in slug-map.json
    return Array.isArray(v) ? v : [v];
  }
  // Default: lowercase and replace spaces with hyphens
  return [name.toLowerCase().replace(/\s+/g, "-")];
}

// State
// These are read directly by search.js.

let usageMap = null; // Map<pokeapiSlug, usagePct> | null  (null = no format loaded)
let usageFormatId = null; // e.g. "gen9vgc2026regma-0"
let usageYearMonth = null; // e.g. "2026-04"
let allFormatIds = []; // full list for the selected month, before cutoff filtering

// Init

// Fetches the month list and populates the month <select> on page load.
// Returns a promise so search.js can wait for it before restoring URL state.
async function initFormatMonthDropdown() {
  const select = document.getElementById("format-month");
  if (!select) return;
  const statusEl = document.getElementById("format-status");
  if (statusEl) statusEl.textContent = "loading...";
  const html = await smogonFetch(SMOGON_STATS_URL + "/");
  // Links look like "2026-04/" - strip the trailing slash, show newest first.
  const months = parseLinks(html, /^\d{4}-\d{2}\/$/)
    .map((h) => h.slice(0, -1))
    .reverse();
  select.innerHTML =
    '<option value="">month</option>' +
    months
      .map((m) => `<option value="${escapeHTML(m)}">${escapeHTML(m)}</option>`)
      .join("");
  if (statusEl) statusEl.textContent = "";
}

const formatMonthsReady = initFormatMonthDropdown().catch((e) => {
  console.warn("[format] Could not load month list:", e.message);
  const select = document.getElementById("format-month");
  if (select) select.innerHTML = '<option value="">unavailable</option>';
});

// Event handlers

// Populates the format dropdown from allFormatIds, filtered by the checkbox state.
function populateFormatDropdown(showAll) {
  const formatSelect = document.getElementById("format-id");
  const ids = showAll
    ? allFormatIds
    : allFormatIds.filter((id) => id.endsWith("-0"));
  formatSelect.innerHTML =
    '<option value="">format</option>' +
    ids
      .map(
        (id) => `<option value="${escapeHTML(id)}">${escapeHTML(id)}</option>`,
      )
      .join("");
}

// Called when the user toggles the "all ratings" checkbox.
function onFormatCutoffToggle(showAll) {
  populateFormatDropdown(showAll);
}

// Called when the user picks a month. Loads that month's format list.
async function onFormatMonthChange(yearMonth) {
  const formatSelect = document.getElementById("format-id");
  const statusEl = document.getElementById("format-status");

  // Clear previous state
  usageMap = null;
  usageFormatId = null;
  usageYearMonth = yearMonth || null;
  allFormatIds = [];
  formatSelect.innerHTML = '<option value="">format</option>';
  statusEl.textContent = "";

  if (!yearMonth) return;

  statusEl.textContent = "loading...";
  try {
    const html = await smogonFetch(`${SMOGON_STATS_URL}/${yearMonth}/`);
    // Links look like "gen9vgc2026regma-0.txt" : strip the .txt extension.
    allFormatIds = parseLinks(html, /\.txt$/)
      .map((h) => h.slice(0, -4))
      .reverse();
    const showAll =
      document.getElementById("format-all-cutoffs")?.checked || false;
    populateFormatDropdown(showAll);
    statusEl.textContent = "";
  } catch (e) {
    statusEl.textContent = "not found";
    console.warn("[format] Failed to load formats for", yearMonth, e.message);
  }
}

// Called when the user picks a format. Fetches and parses the usage .txt file.
async function onFormatChange(formatId) {
  const statusEl = document.getElementById("format-status");

  if (!formatId) {
    usageMap = null;
    usageFormatId = null;
    statusEl.textContent = "";
    return;
  }

  statusEl.textContent = "loading...";
  try {
    // Fetch the slug map and the usage file in parallel.
    const [map, txt] = await Promise.all([
      loadSlugMap(),
      smogonFetch(`${SMOGON_STATS_URL}/${usageYearMonth}/${formatId}.txt`),
    ]);

    const smogonUsage = parseUsageFile(txt); // Map<smogonName, pct>
    const result = new Map(); // Map<pokeapiSlug, pct>

    for (const [smogonName, pct] of smogonUsage) {
      for (const slug of smogonNameToSlugs(smogonName, map)) {
        result.set(slug, (result.get(slug) || 0) + pct);
      }
    }

    // Warn about any slugs that have no match in our Pokemon database.
    // These need a mapping added to js/slug-map.json.
    let unmatched = 0;
    if (isReady) {
      const dbSlugs = new Set(Object.values(pokemonDatabase).map(pokeapiName));
      for (const [slug] of result) {
        if (!dbSlugs.has(slug)) {
          unmatched++;
          console.error(
            `[format] "${slug}" not in database (${usageYearMonth}/${formatId}) - add to js/slug-map.json`,
          );
        }
      }
    }

    usageMap = result;
    usageFormatId = formatId;
    if (unmatched > 0) {
      statusEl.innerHTML =
        `${result.size} Pokémon` +
        ` <span style="color:red">(${unmatched} unmatched, so <a href="https://github.com/btenc/dexgrep/issues" target="_blank">please report</a>: ${escapeHTML(usageYearMonth)}/${escapeHTML(formatId)} as having an issue.)</span>`;
    } else {
      statusEl.textContent = `${result.size} Pokémon`;
    }
  } catch (e) {
    usageMap = null;
    usageFormatId = null;
    statusEl.textContent = "failed";
    console.warn("[format] Failed to load usage data:", e.message);
  }
}

// Resets all format/usage state and clears the UI.
function clearFormat() {
  usageMap = null;
  usageFormatId = null;
  usageYearMonth = null;
  allFormatIds = [];
  const monthEl = document.getElementById("format-month");
  const formatEl = document.getElementById("format-id");
  const statusEl = document.getElementById("format-status");
  const cutoffsEl = document.getElementById("format-all-cutoffs");
  if (monthEl) monthEl.value = "";
  if (formatEl) formatEl.innerHTML = '<option value="">format</option>';
  if (statusEl) statusEl.textContent = "";
  if (cutoffsEl) cutoffsEl.checked = false;
}

// Restores format state from URL params. Called after the month dropdown is ready.
async function restoreFormat(yearMonth, formatId) {
  const monthEl = document.getElementById("format-month");
  if (monthEl) monthEl.value = yearMonth;
  usageYearMonth = yearMonth;
  await onFormatMonthChange(yearMonth);
  const formatEl = document.getElementById("format-id");
  if (formatEl && formatId) {
    // If restoring a non-zero cutoff, expand the dropdown to show all rating tiers.
    if (!formatId.endsWith("-0")) {
      const cbEl = document.getElementById("format-all-cutoffs");
      if (cbEl) cbEl.checked = true;
      populateFormatDropdown(true);
    }
    formatEl.value = formatId;
    if (formatEl.value === formatId) {
      await onFormatChange(formatId);
    }
  }
}
