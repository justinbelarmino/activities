const dataDragonBase = "https://ddragon.leagueoflegends.com";
const featuredChampion = document.getElementById("featuredChampion");
const championGrid = document.getElementById("championGrid");
const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const errorMessage = document.getElementById("errorMessage");
const versionLabel = document.getElementById("versionLabel");
const rosterCount = document.getElementById("rosterCount");
const emptyMessage = document.getElementById("emptyMessage");
const rosterPagination = document.getElementById("rosterPagination");
const currentPageLabel = document.getElementById("currentPage");
const previousPageButton = document.getElementById("previousPage");
const nextPageButton = document.getElementById("nextPage");

let champions = [];
let version = "";
let selectionRequest = 0;
let rosterResults = [];
const urlParams = new URLSearchParams(window.location.search);
const initialChampionId = urlParams.get("id");
const requestedPage = Number.parseInt(urlParams.get("page"), 10);
let page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
const perPage = 20;

function updateUrlState(champion) {
  const url = new URL(window.location.href);
  url.searchParams.set("page", page);
  if (champion) {
    url.searchParams.set("id", champion.id);
  }
  window.history.replaceState(null, "", url);
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`The champion archive returned ${response.status}. Please try again.`);
  }
  return response.json();
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove("d-none");
}

function hideError() {
  errorMessage.textContent = "";
  errorMessage.classList.add("d-none");
}

function renderChampion(champion) {
  const splashUrl = `${dataDragonBase}/cdn/img/champion/splash/${encodeURIComponent(champion.id)}_0.jpg`;

  featuredChampion.innerHTML = `
    <article class="feature-panel">
      <div class="row g-0 align-items-stretch">
        <div class="col-md-6 feature-art" role="img"></div>
        <div class="col-md-6 p-4 p-lg-5 d-flex align-items-center">
          <div class="feature-content">
            <p class="eyebrow small mb-2"></p>
            <h2 class="champion-title mb-3"></h2>
            <div class="d-flex flex-wrap gap-2 mb-4"></div>
            <p class="muted lh-lg mb-0"></p>
            <div class="mt-4 pt-3 border-top" style="border-color: var(--line) !important;">
              <p class="eyebrow small mb-2">Lore</p>
              <p class="small lh-lg mb-0"></p>
            </div>
          </div>
        </div>
      </div>
    </article>`;
  const article = featuredChampion.querySelector("article");
  article.querySelector(".feature-art").setAttribute("aria-label", `${champion.name} splash artwork`);
  article.querySelector(".feature-art").style.backgroundImage = `url("${splashUrl}")`;
  article.querySelector(".eyebrow").textContent = champion.title;
  article.querySelector(".champion-title").textContent = champion.name;
  article.querySelector(".muted.lh-lg").textContent = champion.blurb;
  article.querySelector(".small.lh-lg").textContent = champion.lore;

  const roles = article.querySelector(".d-flex.flex-wrap.gap-2");
  champion.tags.forEach((tag) => {
    const badge = document.createElement("span");
    badge.className = "badge rounded-pill role-badge px-3 py-2";
    badge.textContent = tag;
    roles.append(badge);
  });
}

async function selectChampion(champion, updateUrl = true) {
  const requestId = ++selectionRequest;
  hideError();
  if (updateUrl) updateUrlState(champion);
  featuredChampion.innerHTML = `
    <div class="feature-panel p-5 text-center status-message" role="status">
      <div class="spinner-border spinner-border-sm text-warning me-2" aria-hidden="true"></div>
      Loading champion details…
    </div>`;

  try {
    const response = await fetchJson(
      `${dataDragonBase}/cdn/${version}/data/en_US/champion/${encodeURIComponent(champion.id)}.json`
    );
    if (requestId === selectionRequest) {
      renderChampion(response.data[champion.id]);
    }
  } catch (error) {
    if (requestId === selectionRequest) {
      featuredChampion.innerHTML = "";
      showError(error instanceof Error ? error.message : "Could not load champion details. Please try again.");
    }
  }
}

function renderRoster(list, resetPage = true) {
  rosterResults = list;
  if (resetPage) page = 1;
  emptyMessage.classList.toggle("d-none", list.length > 0);
  rosterCount.textContent = `${list.length} champion${list.length === 1 ? "" : "s"}`;
  renderRosterPage();
}

function renderRosterPage() {
  const finalPage = Math.max(1, Math.ceil(rosterResults.length / perPage));
  page = Math.min(page, finalPage);
  const start = (page - 1) * perPage;
  championGrid.replaceChildren();
  currentPageLabel.textContent = `${page} / ${finalPage}`;
  rosterPagination.classList.toggle("d-none", finalPage <= 1);
  updateUrlState();

  const fragment = document.createDocumentFragment();
  rosterResults.slice(start, start + perPage).forEach((champion) => {
    const column = document.createElement("div");
    column.className = "col-6 col-sm-4 col-md-3 col-lg-2";
    const card = document.createElement("button");
    card.className = "champion-card card text-start w-100 p-0";
    card.type = "button";
    card.setAttribute("aria-label", `View ${champion.name}`);
    const image = document.createElement("img");
    image.src = `${dataDragonBase}/cdn/${version}/img/champion/${encodeURIComponent(champion.image.full)}`;
    image.alt = "";
    image.loading = "lazy";
    const cardBody = document.createElement("span");
    cardBody.className = "card-body d-block p-3";
    const name = document.createElement("span");
    name.className = "d-block fw-semibold text-light";
    name.textContent = champion.name;
    const title = document.createElement("span");
    title.className = "d-block small muted text-truncate";
    title.textContent = champion.title;
    cardBody.append(name, title);
    card.append(image, cardBody);
    card.addEventListener("click", () => {
      selectChampion(champion);
      featuredChampion.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    column.append(card);
    fragment.append(column);
  });
  championGrid.append(fragment);
}

function prev() {
  const finalPage = Math.max(1, Math.ceil(rosterResults.length / perPage));
  page = page <= 1 ? finalPage : page - 1;
  renderRosterPage();
}

function next() {
  const finalPage = Math.max(1, Math.ceil(rosterResults.length / perPage));
  page = page >= finalPage ? 1 : page + 1;
  renderRosterPage();
}

previousPageButton.addEventListener("click", prev);
nextPageButton.addEventListener("click", next);

function findChampion(query) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return null;
  return champions.find((champion) =>
    champion.name.toLocaleLowerCase() === normalizedQuery ||
    champion.id.toLocaleLowerCase() === normalizedQuery ||
    champion.key === normalizedQuery
  ) || champions.find((champion) =>
    champion.name.toLocaleLowerCase().includes(normalizedQuery) ||
    champion.id.toLocaleLowerCase().includes(normalizedQuery) ||
    champion.key.includes(normalizedQuery)
  );
}

function findChampionById(id) {
  const normalizedId = id.trim().toLocaleLowerCase();
  return champions.find((champion) =>
    champion.id.toLocaleLowerCase() === normalizedId ||
    champion.key === id.trim()
  );
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  hideError();
  const query = searchInput.value.trim();
  if (!query) {
    showError("Enter a champion name or ID to search.");
    searchInput.focus();
    return;
  }

  const champion = findChampion(query);
  if (!champion) {
    showError(`No champion found for “${query}”. Check the spelling and try again.`);
    return;
  }

  selectChampion(champion);
  searchInput.value = champion.name;
});

searchInput.addEventListener("input", () => {
  hideError();
  const query = searchInput.value.trim().toLocaleLowerCase();
  const filtered = query
    ? champions.filter((champion) =>
      champion.name.toLocaleLowerCase().includes(query) ||
      champion.id.toLocaleLowerCase().includes(query) ||
      champion.key.includes(query)
    )
    : champions;
  renderRoster(filtered);
});

async function loadChampions() {
  try {
    const versions = await fetchJson(`${dataDragonBase}/api/versions.json`);
    version = versions[0];
    const response = await fetchJson(`${dataDragonBase}/cdn/${version}/data/en_US/champion.json`);
    champions = Object.values(response.data).sort((a, b) => a.name.localeCompare(b.name));
    versionLabel.textContent = `DATA DRAGON · PATCH ${version}`;
    page = Math.min(page, Math.max(1, Math.ceil(champions.length / perPage)));
    renderRoster(champions, false);

    const defaultChampion = champions.find((champion) => champion.id === "Ahri") || champions[0];
    const initialChampion = initialChampionId
      ? findChampionById(initialChampionId)
      : defaultChampion;
    if (initialChampion) {
      await selectChampion(initialChampion, false);
    }
    if (initialChampionId && !initialChampion) {
      if (defaultChampion) await selectChampion(defaultChampion, false);
      showError(`No champion found for ID “${initialChampionId}”.`);
    }
  } catch (error) {
    versionLabel.textContent = "Could not connect to the Data Dragon archive.";
    featuredChampion.innerHTML = "";
    showError(error instanceof Error ? error.message : "Could not load champion data. Please try again.");
  }
}

loadChampions();
