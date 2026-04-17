const _filtersBase = new URL("../", document.currentScript.src).href;

async function loadFilters() {
  const index = await fetchJSON(_filtersBase + "filters/index.json");

  await Promise.all(
    index.map(async ({ id, name }) => {
      const names = await fetchJSON(_filtersBase + "filters/" + id + ".json");
      FILTERS[id] = names;

      const select = document.getElementById("filter");
      if (select) {
        const opt = document.createElement("option");
        opt.value = id;
        opt.textContent = name;
        select.appendChild(opt);
      }
    }),
  );
}

const filtersReady = loadFilters().catch((e) => {
  console.error("failed to load filters:", e);
});
