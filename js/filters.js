const FILTERS_BASE = new URL("../", document.currentScript.src).href;

async function loadFilters() {
  const index = await fetchJSON(FILTERS_BASE + "filters/index.json");

  // Fetch all filter files concurrently, then insert options in index order.
  // (Without the collect-then-insert step, options would appear in whichever
  // order the requests happened to finish.)
  const results = await Promise.all(
    index.map(async ({ id, name, gen, category }) => {
      const names = await fetchJSON(FILTERS_BASE + "filters/" + id + ".json");
      return { id, name, gen: gen || null, category: category || null, names };
    }),
  );

  for (const { id, name, gen, category, names } of results) {
    FILTERS[id] = names;
    FILTER_META[id] = { gen, name, category };
  }
}

const filtersReady = loadFilters().catch((e) => {
  console.error("failed to load filters:", e);
  setStatus("error: failed to load filters");
});
