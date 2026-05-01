const FILTERS_BASE = new URL("../", document.currentScript.src).href;

async function loadFilters() {
  const index = await fetchJSON(FILTERS_BASE + "filters/index.json");

  // Fetch all filter files concurrently, then insert options in index order.
  // (Without the collect-then-insert step, options would appear in whichever
  // order the requests happened to finish.)
  const results = await Promise.all(
    index.map(async ({ id, name }) => {
      const names = await fetchJSON(FILTERS_BASE + "filters/" + id + ".json");
      return { id, name, names };
    }),
  );

  const select = document.getElementById("filter");
  for (const { id, name, names } of results) {
    FILTERS[id] = names;
    if (select) {
      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = name;
      select.appendChild(opt);
    }
  }
}

const filtersReady = loadFilters().catch((e) => {
  console.error("failed to load filters:", e);
  setStatus("error: failed to load filters");
});
