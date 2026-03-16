// ブラウザ版 駅検索ロジック

let stations = [];

async function loadStations() {
  const countEl = document.getElementById("results-count");
  const resultsEl = document.getElementById("results");

  try {
    const res = await fetch("data.json", { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    stations = Array.isArray(data.stations) ? data.stations : [];

    countEl.textContent = `データ件数: ${stations.length.toLocaleString()} 件`;
    resultsEl.innerHTML =
      '<div class="message">検索条件を入力して「検索」ボタンを押してください。</div>';
  } catch (err) {
    console.error(err);
    countEl.textContent = "データ読み込みエラー";
    resultsEl.innerHTML =
      '<div class="message error">data.json が読み込めませんでした。<br />同じフォルダに data.json を置いて、ブラウザからこの HTML を開いてください。</div>';
  }
}

/**
 * Tkinter 版と同じ検索ロジック
 * mode:
 *  - "partial" : 部分一致
 *  - "prefix"  : 前方一致
 *  - "suffix"  : 後方一致
 *  - "exact"   : 完全一致
 */
function searchStations(keyword, field, mode) {
  keyword = keyword.trim();
  if (!keyword) return [];

  const match = (value) => {
    if (typeof value !== "string") value = String(value ?? "");
    if (mode === "prefix") return value.startsWith(keyword);
    if (mode === "suffix") return value.endsWith(keyword);
    if (mode === "exact") return value === keyword;
    // デフォルト: 部分一致
    return value.includes(keyword);
  };

  return stations.filter((s) => match(s[field] ?? ""));
}

function getSelectedValue(name, defaultValue) {
  const checked = document.querySelector(`input[name="${name}"]:checked`);
  return checked ? checked.value : defaultValue;
}

function renderResults(list, { keyword, field, mode }) {
  const resultsEl = document.getElementById("results");
  const countEl = document.getElementById("results-count");
  const metaEl = document.getElementById("results-meta");

  if (!keyword.trim()) {
    resultsEl.innerHTML =
      '<div class="message">検索文字列を入力してください。</div>';
    metaEl.textContent = "";
    return;
  }

  if (!list.length) {
    resultsEl.innerHTML =
      '<div class="message">該当するデータはありませんでした。</div>';
    countEl.textContent = "0 件";
    metaEl.textContent = "";
    return;
  }

  countEl.textContent = `${list.length.toLocaleString()} 件ヒット`;

  const fieldLabel = field === "kana" ? "ふりがな" : "駅名";
  const modeLabel =
    mode === "prefix"
      ? "前方一致"
      : mode === "suffix"
      ? "後方一致"
      : mode === "exact"
      ? "完全一致"
      : "部分一致";

  metaEl.textContent = `検索項目: ${fieldLabel} / 検索方法: ${modeLabel} / キーワード: 「${keyword}」`;

  const frag = document.createDocumentFragment();

  list.forEach((s) => {
    const card = document.createElement("div");
    card.className = "station-card";

    const header = document.createElement("div");
    header.className = "station-header";

    const nameEl = document.createElement("div");
    nameEl.className = "station-name";
    nameEl.textContent = s.name ?? "";

    const kanaEl = document.createElement("div");
    kanaEl.className = "station-kana";
    kanaEl.textContent = s.kana ?? "";

    header.appendChild(nameEl);
    header.appendChild(kanaEl);

    const body = document.createElement("div");
    body.className = "station-body";

    const prefectures = s.prefectures ?? "";
    const lineList = Array.isArray(s.line) ? s.line : s.line ? [s.line] : [];
    const urlList = Array.isArray(s.url) ? s.url : s.url ? [s.url] : [];

    const prefLine = document.createElement("div");
    prefLine.innerHTML = `<span class="pill">都道府県</span> ${prefectures}`;

    const linesLine = document.createElement("div");
    linesLine.innerHTML = `<span class="pill">路線</span> ${
      lineList.length ? lineList.join(", ") : "-"
    }`;

    const urlLine = document.createElement("div");
    urlLine.className = "url-list";
    if (urlList.length) {
      urlLine.innerHTML =
        '<span class="pill">URL</span> ' +
        urlList
          .map(
            (u, i) =>
              `<a href="${u}" target="_blank" rel="noopener noreferrer">リンク${i + 1}</a>`
          )
          .join(" / ");
    } else {
      urlLine.innerHTML = '<span class="pill">URL</span> -';
    }

    body.appendChild(prefLine);
    body.appendChild(linesLine);
    body.appendChild(urlLine);

    card.appendChild(header);
    card.appendChild(body);

    frag.appendChild(card);
  });

  resultsEl.innerHTML = "";
  resultsEl.appendChild(frag);
}

function setupEvents() {
  const keywordInput = document.getElementById("keyword");
  const searchBtn = document.getElementById("search-btn");
  const clearBtn = document.getElementById("clear-btn");

  function doSearch() {
    const keyword = keywordInput.value;
    const field = getSelectedValue("field", "name");
    const mode = getSelectedValue("mode", "partial");
    const hits = searchStations(keyword, field, mode);
    renderResults(hits, { keyword, field, mode });
  }

  searchBtn.addEventListener("click", () => {
    doSearch();
    keywordInput.focus();
  });

  clearBtn.addEventListener("click", () => {
    keywordInput.value = "";
    keywordInput.focus();
    const resultsEl = document.getElementById("results");
    const countEl = document.getElementById("results-count");
    const metaEl = document.getElementById("results-meta");
    countEl.textContent = "クリアしました";
    metaEl.textContent = "";
    resultsEl.innerHTML =
      '<div class="message">検索条件を入力して「検索」ボタンを押してください。</div>';
  });

  keywordInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      doSearch();
    }
  });
}

window.addEventListener("DOMContentLoaded", () => {
  setupEvents();
  loadStations();
});

