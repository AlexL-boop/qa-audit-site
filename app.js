// ===== BOT TOKEN (server-only; safe for browser) =====
(() => {
  // In browser there is no `process`, so guard it
  const token =
    (typeof process !== "undefined" && process?.env)
      ? process.env.BOT_TOKEN
      : undefined;

  if (!token) {
    console.warn("BOT_TOKEN is not set — bot disabled");
  }
})();


// =================== UTIL ===================
const LS = {
  tab: "qa.tab",
  project: "qa.project",
  audit: "qa.audit",
};



function $(sel){ return document.querySelector(sel); }
function $all(sel){ return Array.from(document.querySelectorAll(sel)); }
function clamp(n,min,max){ return Math.max(min, Math.min(max, n)); }
function pad(n){ return String(n).padStart(2,"0"); }

function save(key, value){
  localStorage.setItem(key, JSON.stringify(value));
}
function load(key, fallback){
  try{
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  }catch{
    return fallback;
  }
}

// =================== TIME ===================
function updateTime(){
  const d = new Date();
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const el = $("#time");
  if (el) el.textContent = `${hh}:${mm}`;
}
updateTime();
setInterval(updateTime, 1000 * 15);

// =================== DATA ===================
const PROJECTS = [
  { id: "marketplace", name: "Marketplace / Web", meta: "Релизы: еженедельно • Команда: 12", tags: ["UI","API","E2E"] },
  { id: "mobile", name: "Mobile / iOS+Android", meta: "Релизы: 2/мес • Команда: 8", tags: ["API","Perf"] },
  { id: "backoffice", name: "Backoffice", meta: "Релизы: по запросу • Команда: 5", tags: ["UI","Data"] },
];

const PRODUCTS = [
  {
    id: "checker-audit",
    title: "Аудит по чекеру",
    subtitle: "два чеклиста + отчет",
    price: 10,
  },
  {
    id: "live-audit",
    title: "Живой аудит",
    subtitle: "100 часов, 10 лет опыта, внедрения + проверки + п.1",
    price: 1259,
  },
  { id: "opt-audit", title: "Оптимизационный аудит", subtitle: "быстрые улучшения процессов и качества", price: 459 },
  { id: "load-audit", title: "Нагрузочный аудит", subtitle: "перф-профиль, сценарии, отчёт", price: 869 },
  { id: "process-audit", title: "Процессный аудит", subtitle: "мягкий формализм, внедрение, метрики", price: 459 },
  { id: "uiux-audit", title: "UI/UX аудит", subtitle: "путь пользователя, боли, рекомендации", price: 1759 },

  // ✅ ДОБАВЛЕНИЕ: полный аудит за 4815
  {
    id: "full-audit-4815",
    title: "Полный QA+API+PROCESS+AQA аудит",
    subtitle: "комплексный аудит качества, API, процессов и автоматизации",
    price: 4815,
  },
];

// ✅ ADD more risks + categories
const RISKS = [
  { id: 1, title: "Latency /checkout", level: "high", category:"product", action: "Профилирование + перф-бюджет" },
  { id: 2, title: "Флейки UI", level: "med", category:"process", action: "Карантин + ремонт в спринт" },
  { id: 3, title: "Нестабильные тест-данные", level: "med", category:"process", action: "Сидирование + изоляция" },
  { id: 4, title: "Слабые контракты API", level: "low", category:"product", action: "Контрактные тесты + схемы" },

  // ✅ ADD
  { id: 5, title: "Провалы сроков из-за требований", level:"high", category:"project", action:"DoR/DoD + критерии приёмки + декомпозиция" },
  { id: 6, title: "Конфликты QA↔Dev/PO", level:"med", category:"relationship", action:"Единые правила приёмки + RACI + прозрачность" },
  { id: 7, title: "Бюджет не покрывает регресс", level:"med", category:"budget", action:"Risk-based regression + приоритизация + AQA план" },
  { id: 8, title: "Маркетинг обещает то, что не готово", level:"high", category:"marketing", action:"Release notes + feature flags + критерии готовности" },
  { id: 9, title: "Нет обучения новым фичам", level:"low", category:"training", action:"1-pager + чек-лист обучения + демо" },
];

// ===== ADD: risk category + sort + meat =====
const LS_RISK_MEAT = "qa.risks.meat";

function severityRank(level){
  return level === "high" ? 3 : level === "med" ? 2 : 1;
}

function getRiskCategory(){
  return $("#riskCategorySelect")?.value || "all";
}
function getRiskSort(){
  return $("#riskSortSelect")?.value || "severity_desc";
}

function applyRiskFiltersAndSort(items){
  const cat = getRiskCategory();
  let out = items.slice();

  if (cat !== "all") out = out.filter(r => r.category === cat);

  const sort = getRiskSort();
  out.sort((a,b) => {
    if (sort === "severity_desc") return severityRank(b.level) - severityRank(a.level);
    if (sort === "severity_asc") return severityRank(a.level) - severityRank(b.level);
    if (sort === "title_asc") return a.title.localeCompare(b.title, "ru");
    if (sort === "category_asc") return (a.category||"").localeCompare((b.category||""), "ru");
    return 0;
  });

  return out;
}

function renderRisksAdvanced(levelFilter){
  const table = $("#riskTable");
  if (!table) return;

  table.innerHTML = `
    <div class="row head">
      <span>Риск</span><span>Уровень</span><span>Действие</span>
    </div>
  `;

  let items = RISKS.slice();
  if (levelFilter !== "all") items = items.filter(r => r.level === levelFilter);

  items = applyRiskFiltersAndSort(items);

  items.forEach(r => {
    const pill = r.level === "high" ? "high" : r.level === "med" ? "med" : "low";
    const label = r.level.toUpperCase();
    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = `
      <span>${r.title} <span class="muted">• ${r.category}</span></span>
      <span class="pill ${pill}">${label}</span>
      <span>${r.action}</span>
    `;
    table.appendChild(row);
  });

  if (items.length === 0){
    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = `<span>Нет рисков по фильтру</span><span class="pill low">OK</span><span>—</span>`;
    table.appendChild(row);
  }
}

// подключаем селекты
$("#riskCategorySelect")?.addEventListener("change", () => {
  const active = document.querySelector(".filter-btn.is-active")?.dataset.filter || "all";
  renderRisksAdvanced(active);
});
$("#riskSortSelect")?.addEventListener("change", () => {
  const active = document.querySelector(".filter-btn.is-active")?.dataset.filter || "all";
  renderRisksAdvanced(active);
});

// “мясо” сохранение
function loadRiskMeat(){
  return load(LS_RISK_MEAT, { case:"", cost:"", limits:"", evidence:"" });
}
function restoreRiskMeat(){
  const m = loadRiskMeat();
  $("#meatCase") && ($("#meatCase").value = m.case || "");
  $("#meatCost") && ($("#meatCost").value = m.cost || "");
  $("#meatLimits") && ($("#meatLimits").value = m.limits || "");
  $("#meatEvidence") && ($("#meatEvidence").value = m.evidence || "");
}
$("#saveRiskMeatBtn")?.addEventListener("click", () => {
  save(LS_RISK_MEAT, {
    case: $("#meatCase")?.value || "",
    cost: $("#meatCost")?.value || "",
    limits: $("#meatLimits")?.value || "",
    evidence: $("#meatEvidence")?.value || "",
  });
});
$("#exportRiskMeatBtn")?.addEventListener("click", () => {
  // в упрощённом виде: допишем это в поле комментария заказа
  const m = loadRiskMeat();
  const text =
`[RISKS MEAT]
Case: ${m.case}
Cost: ${m.cost}
Limits: ${m.limits}
Evidence: ${m.evidence}`;
  const ta = document.querySelector('textarea[name="pain"]');
  if (ta) ta.value = (ta.value ? ta.value + "\n\n" : "") + text;
  setHash("order");
});



// =================== ROUTING (hash) ===================
const titles = {
  projects: "Проекты",
  products: "Продукты",
  audit: "Аудит тестирования",
  metrics: "Метрики",
  risks: "Риски",
  order: "Заказать аудит"
};

function getTabFromHash(){
  const raw = (location.hash || "").replace("#", "").replace("/", "");
  return raw || null;
}
function setHash(tab){
  location.hash = `/${tab}`;
}

function openTab(tab){
  const tabs = $all(".tab");
  const screens = $all(".screen");
  const pageTitle = $("#pageTitle");

  tabs.forEach(t => {
    const on = t.dataset.tab === tab;
    t.classList.toggle("is-active", on);
    t.setAttribute("aria-selected", on ? "true" : "false");
  });

  screens.forEach(s => s.classList.toggle("is-active", s.dataset.screen === tab));
  if (pageTitle) pageTitle.textContent = titles[tab] ?? "QA";

  save(LS.tab, tab);
}

$all(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    const tab = btn.dataset.tab;
    setHash(tab);
  });
});

window.addEventListener("hashchange", () => {
  const t = getTabFromHash() || load(LS.tab, "projects");
  openTab(t);
});

// =================== PROJECTS ===================
let activeProjectId = load(LS.project, PROJECTS[0].id);

function renderProjects(){
  const list = $("#projectsList");
  if (!list) return;
  list.innerHTML = "";

  PROJECTS.forEach(p => {
    const item = document.createElement("div");
    item.className = "project-item" + (p.id === activeProjectId ? " is-active" : "");
    item.setAttribute("role", "button");
    item.setAttribute("tabindex", "0");
    item.setAttribute("aria-label", `Выбрать проект ${p.name}`);

    item.innerHTML = `
      <div class="project-name">${p.name}</div>
      <div class="project-meta">${p.meta}</div>
      <div class="project-badges">
        ${p.tags.map(t => `<span class="badge">${t}</span>`).join("")}
      </div>
    `;

    const select = () => {
      activeProjectId = p.id;
      save(LS.project, activeProjectId);
      renderProjects();
      applyProjectContext();
    };

    item.addEventListener("click", select);
    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") select();
    });

    list.appendChild(item);
  });
}

function applyProjectContext(){
  const p = PROJECTS.find(x => x.id === activeProjectId) ?? PROJECTS[0];

  $("#activeProjectName").textContent = p.name;
  $("#activeProjectTags").textContent = p.tags.join(", ");

  $("#auditTitleProject").textContent = `Аудит тестирования — ${p.name}`;
  $("#metricsTitleProject").textContent = `Недельный срез — ${p.name}`;
  $("#risksTitleProject").textContent = `Риски — ${p.name}`;

  // заполняем форму заказа по умолчанию
  const orderProject = $("#orderProject");
  if (orderProject) orderProject.value = p.name;
}

// =================== PRODUCTS ===================
function money(n){
  return `$${Number(n).toFixed(2)}`;
}

function renderProducts(){
  const wrap = $("#productCards");
  if (!wrap) return;
  wrap.innerHTML = "";

  const sumEl = $("#productsSum");
  const sum = PRODUCTS.reduce((acc, x) => acc + x.price, 0);
  if (sumEl) sumEl.textContent = money(sum);

  PRODUCTS.forEach(prod => {
    const card = document.createElement("div");
    card.className = "pcard";
    card.innerHTML = `
      <div>
        <div class="pcard-top">
          <div class="pcard-ic">
            <img src="./assets/icon-product.svg" alt="">
          </div>
          <button class="pcard-btn" type="button" data-action="details" aria-label="Детали">⋯</button>
        </div>

        <div class="pcard-title">${prod.title}</div>
        <div class="pcard-sub">${prod.subtitle}</div>
      </div>

      <div>
        <div class="pcard-price">$${prod.price}<small>usd</small></div>

        <div class="pcard-actions">
          <button class="pcard-btn" type="button" data-action="select">Выбрать</button>
          <button class="pcard-btn primary" type="button" data-action="order">Заказать</button>
        </div>
      </div>
    `;

    card.querySelector('[data-action="order"]').addEventListener("click", () => {
      // заполнить форму заказа
      const p = PROJECTS.find(x => x.id === activeProjectId) ?? PROJECTS[0];
      $("#orderProject").value = p.name;
      $("#orderProduct").value = `${prod.title} — ${prod.price} USD`;
      setHash("order");
    });

    card.querySelector('[data-action="select"]').addEventListener("click", () => {
      // быстро перейти в аудит и подсветить, что выбран продукт
      $("#orderProduct").value = `${prod.title} — ${prod.price} USD`;
      setHash("audit");
    });

    wrap.appendChild(card);
  });
}

// =================== METRICS (dynamic SVG chart) ===================
function randomSeries(seed){
  // простая стабильная генерация
  let x = seed;
  const out = [];
  for (let i = 0; i < 28; i++){
    x = (x * 9301 + 49297) % 233280;
    const v = 70 + (x / 233280) * 130; // 70..200
    out.push(Math.round(v));
  }
  return out;
}

const SERIES = {
  testruns: randomSeries(1),
  incidents: randomSeries(2).map(v => Math.round(v * 0.7)),
  delivery: randomSeries(3).map(v => Math.round(v * 0.85)),
};

function renderChart(kind){
  const data = SERIES[kind] ?? SERIES.testruns;
  const W = 760, H = 340;
  const padding = { l: 60, r: 30, t: 18, b: 44 };

  const innerW = W - padding.l - padding.r;
  const innerH = H - padding.t - padding.b;

  const maxY = 200;
  const barW = Math.floor(innerW / data.length) - 4;

  const bars = data.map((v, i) => {
    const h = Math.round((v / maxY) * innerH);
    const x = padding.l + i * (barW + 4);
    const y = padding.t + (innerH - h);
    return `<rect x="${x}" y="${y}" width="${barW}" height="${h}" fill="rgba(20,20,20,.10)" stroke="rgba(20,20,20,.7)" stroke-width="2" rx="2" />`;
  }).join("");

  const gridLines = [50,100,150,200].map(val => {
    const y = padding.t + (innerH - (val / maxY) * innerH);
    return `<line x1="${padding.l}" y1="${y}" x2="${W - padding.r}" y2="${y}" stroke="rgba(20,20,20,.18)" stroke-width="2" />`;
  }).join("");

  const svg = `
  <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="График">
    <rect x="10" y="10" width="${W-20}" height="${H-20}" rx="18" fill="none" stroke="rgba(20,20,20,.18)" stroke-width="2"/>
    ${gridLines}
    ${bars}
  </svg>`;

  $("#chartContainer").innerHTML = svg;

  // KPI (примерно)
  $("#kpiFlaky").textContent = `${Math.max(2, Math.round(18 - data[0] / 20))}%`;
  $("#kpiMttr").textContent = `${Math.max(2, Math.round(data[5] / 50))}h`;
  $("#kpiLead").textContent = `${Math.max(1, Math.round(data[8] / 60))}d`;
  $("#kpiEscaped").textContent = `${Math.max(0, Math.round((200 - data[10]) / 40))}`;
}

$("#sourceSelect")?.addEventListener("change", (e) => {
  renderChart(e.target.value);
});

function updateLive(){
  const el = $("#liveTime");
  if (!el) return;
  const d = new Date();
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const date = d.toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric" });
  el.textContent = `${time} ${date}`;
}
updateLive();
setInterval(updateLive, 1000 * 30);

// =================== RISKS ===================
function renderRisks(filter){
  const table = $("#riskTable");
  if (!table) return;

  table.innerHTML = `
    <div class="row head">
      <span>Риск</span><span>Уровень</span><span>Действие</span>
    </div>
  `;

  const items = RISKS.filter(r => filter === "all" ? true : r.level === filter);

  items.forEach(r => {
    const pill = r.level === "high" ? "high" : r.level === "med" ? "med" : "low";
    const label = r.level.toUpperCase();

    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = `
      <span>${r.title}</span>
      <span class="pill ${pill}">${label}</span>
      <span>${r.action}</span>
    `;
    table.appendChild(row);
  });

  if (items.length === 0){
    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = `<span>Нет рисков по фильтру</span><span class="pill low">OK</span><span>—</span>`;
    table.appendChild(row);
  }
}

$all(".filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    $all(".filter-btn").forEach(b => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    renderRisks(btn.dataset.filter);
  });
});

// =================== AUDIT SCORING + SAVE ===================
const scoreTotalEl = $("#scoreTotal");
const scoreLabelEl = $("#scoreLabel");

const sProcess = $("#sProcess");
const sAuto = $("#sAuto");
const sQuality = $("#sQuality");
const sDataObs = $("#sDataObs");
const sRisk = $("#sRisk");

const recommendText = $("#recommendText");

const checklistA = $("#checklistA");
const checklistB = $("#checklistB");
const surveyEl = $("#survey");
const checkerStatus = $("#checkerStatus");

function toPercent(earned, max){
  if (!max) return 0;
  return Math.round((earned / max) * 100);
}

function labelForScore(p){
  if (p >= 85) return "Стабильно. Можно ускоряться.";
  if (p >= 70) return "Хорошо. Есть узкие места.";
  if (p >= 50) return "Средне. Нужен план улучшений.";
  return "Рискованно. Сначала стабилизируем базу.";
}
function recommendationForScore(p){
  if (p >= 85) return "Фокус: ускорение релиза, SLO, перф/секьюрити проверки, наблюдаемость.";
  if (p >= 70) return "Фокус: убрать флейки, усилить контракт/API, quality-gates в CI.";
  if (p >= 50) return "Фокус: DoD, тест-данные, базовый smoke/регресс, метрики.";
  return "Фокус: процессы + стабильность окружений. Без этого метрики будут шумом.";
}

function calcChecklist(root){
  const inputs = root ? root.querySelectorAll('input[type="checkbox"]') : [];
  let earned = 0;
  let max = 0;
  const byDomain = {};
  inputs.forEach(ch => {
    const w = Number(ch.dataset.weight || 0);
    const d = ch.dataset.domain || "other";
    max += w;
    byDomain[d] ??= { earned:0, max:0 };
    byDomain[d].max += w;
    if (ch.checked){
      earned += w;
      byDomain[d].earned += w;
    }
  });
  return { earned, max, byDomain };
}

function calcSurvey(){
  const qs = surveyEl ? surveyEl.querySelectorAll(".q") : [];
  let earned = 0;
  let max = 0;
  const byDomain = {};
  qs.forEach(q => {
    const w = Number(q.dataset.qweight || 0);
    const d = q.dataset.domain || "other";
    const checked = q.querySelector('input[type="radio"]:checked');
    const v = checked ? Number(checked.value) : 3;
    const norm = (v - 1) / 4;

    max += w;
    earned += w * norm;

    byDomain[d] ??= { earned:0, max:0 };
    byDomain[d].max += w;
    byDomain[d].earned += w * norm;
  });
  return { earned, max, byDomain };
}

function mergeDomains(a, b){
  const all = new Set([...Object.keys(a), ...Object.keys(b)]);
  const out = {};
  all.forEach(k => {
    const x = a[k] || { earned:0, max:0 };
    const y = b[k] || { earned:0, max:0 };
    out[k] = { earned: x.earned + y.earned, max: x.max + y.max };
  });
  return out;
}

function mapSubscores(domainMap){
  const get = (k) => domainMap[k] || { earned:0, max:0 };

  const process = get("process");
  const automation = get("automation");
  const quality = get("quality");
  const risk = get("risk");
  const data = get("data");
  const obs = get("observability");

  const dataObs = { earned: data.earned + obs.earned, max: data.max + obs.max };

  return {
    process: toPercent(process.earned, process.max),
    automation: toPercent(automation.earned, automation.max),
    quality: toPercent(quality.earned, quality.max),
    risk: toPercent(risk.earned, risk.max),
    dataObs: toPercent(dataObs.earned, dataObs.max),
  };
}

function snapshotAudit(){
  // сохраняем состояния чекбоксов + радиокнопок
  const snap = {
    checklistA: $all("#checklistA input[type=checkbox]").map(i => i.checked),
    checklistB: $all("#checklistB input[type=checkbox]").map(i => i.checked),
    survey: $all("#survey .q").map((q, idx) => {
      const name = `q${idx+1}`;
      const checked = q.querySelector(`input[name="${name}"]:checked`);
      return checked ? checked.value : "3";
    }),
    checker: checkerStatus?.textContent ?? "",
  };
  save(LS.audit, snap);
}

function restoreAudit(){
  const snap = load(LS.audit, null);
  if (!snap) return;

  const a = $all("#checklistA input[type=checkbox]");
  const b = $all("#checklistB input[type=checkbox]");
  a.forEach((el, idx) => el.checked = !!snap.checklistA?.[idx]);
  b.forEach((el, idx) => el.checked = !!snap.checklistB?.[idx]);

  $all("#survey .q").forEach((q, idx) => {
    const name = `q${idx+1}`;
    const val = snap.survey?.[idx] ?? "3";
    const el = q.querySelector(`input[name="${name}"][value="${val}"]`);
    if (el) el.checked = true;
  });

  if (snap.checker && checkerStatus) checkerStatus.textContent = snap.checker;
}

function updateAuditScore(){
  const ca = calcChecklist(checklistA);
  const cb = calcChecklist(checklistB);
  const sv = calcSurvey();

  const domains = mergeDomains(mergeDomains(ca.byDomain, cb.byDomain), sv.byDomain);

  const totalEarned = ca.earned + cb.earned + sv.earned;
  const totalMax = ca.max + cb.max + sv.max;
  const totalPct = clamp(toPercent(totalEarned, totalMax), 0, 100);

  if (scoreTotalEl) scoreTotalEl.textContent = String(totalPct);
  if (scoreLabelEl) scoreLabelEl.textContent = labelForScore(totalPct);

  const subs = mapSubscores(domains);
  if (sProcess) sProcess.textContent = `${subs.process}%`;
  if (sAuto) sAuto.textContent = `${subs.automation}%`;
  if (sQuality) sQuality.textContent = `${subs.quality}%`;
  if (sRisk) sRisk.textContent = `${subs.risk}%`;
  if (sDataObs) sDataObs.textContent = `${subs.dataObs}%`;

  if (recommendText) recommendText.textContent = recommendationForScore(totalPct);

  snapshotAudit();
}

function bindAudit(){
  checklistA?.addEventListener("change", updateAuditScore);
  checklistB?.addEventListener("change", updateAuditScore);
  surveyEl?.addEventListener("change", updateAuditScore);
}

// reset
$("#resetAuditBtn")?.addEventListener("click", () => {
  $all('#checklistA input[type="checkbox"]').forEach(i => i.checked = false);
  $all('#checklistB input[type="checkbox"]').forEach(i => i.checked = false);
  $all("#survey .q").forEach((q, idx) => {
    const name = `q${idx+1}`;
    const el = q.querySelector(`input[name="${name}"][value="3"]`);
    if (el) el.checked = true;
  });
  if (checkerStatus) checkerStatus.textContent = "Чекер: не запускался.";
  updateAuditScore();
});

// mock checker
$("#runCheckerBtn")?.addEventListener("click", async () => {
  if (!checkerStatus) return;
  checkerStatus.textContent = "Чекер: запуск…";
  await new Promise(r => setTimeout(r, 700));
  // мок-результат
  const ok = Math.random() > 0.25;
  checkerStatus.textContent = ok
    ? "Чекер: OK — базовые параметры в норме."
    : "Чекер: WARN — найдены несоответствия (см. чек-листы).";
  snapshotAudit();
});

// report download (markdown)
$("#downloadReportBtn")?.addEventListener("click", () => {
  const p = PROJECTS.find(x => x.id === activeProjectId) ?? PROJECTS[0];
  const md = `# QA Audit Report

Project: **${p.name}**

## Total score
- **${scoreTotalEl?.textContent ?? "0"}%**
- ${scoreLabelEl?.textContent ?? ""}

## Subscores
- Processes: ${sProcess?.textContent ?? "0%"}
- Automation: ${sAuto?.textContent ?? "0%"}
- Quality: ${sQuality?.textContent ?? "0%"}
- Data/Observability: ${sDataObs?.textContent ?? "0%"}
- Risks: ${sRisk?.textContent ?? "0%"}

## Checker
- ${checkerStatus?.textContent ?? ""}

## Recommendation
${recommendText?.textContent ?? ""}

`;
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `qa-audit-report-${p.id}.md`;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
});

// =================== ORDER FORM (demo) ===================
$("#orderForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const hint = $("#orderHint");
  if (hint) hint.textContent = "Принято (демо). Подключим бэкенд — будет отправка.";
});

// =================== INIT ===================
function init(){
  renderProjects();
  applyProjectContext();

  renderProducts();

  restoreAudit();
  bindAudit();
  updateAuditScore();

  renderChart($("#sourceSelect")?.value ?? "testruns");
  renderRisks("all");
  // ✅ ADD: advanced risks render after existing
  renderRisksAdvanced("all");
  restoreRiskMeat();


  // initial tab from hash / storage
  const t = getTabFromHash() || load(LS.tab, "projects");
  openTab(t);
}
init();

/* =======================================================================
   ✅ ДОБАВЛЕНИЯ ДЛЯ ИНТЕГРАЦИИ (НЕ МЕНЯЮ И НЕ УДАЛЯЮ СУЩЕСТВУЮЩЕЕ)
   - Перехват submit формы в capture-фазе (чтобы старый demo-handler не сработал)
   - Отправка заявки на backend: POST /api/order
   - Показ deepLink на Telegram-бота (если backend вернул)
   ======================================================================= */

(function addOrderIntegrationWithoutModifyingExistingHandlers(){
  const form = document.getElementById("orderForm");
  if (!form) return;

  // ✅ capture=true — этот обработчик отработает раньше bubble-обработчиков
  form.addEventListener("submit", async (e) => {
    // Остановим дальнейшую обработку (demo-handler ниже не отработает)
    e.preventDefault();
    e.stopImmediatePropagation();

    const hint = document.getElementById("orderHint");
    const deepWrap = document.getElementById("tgDeepLinkHint");
    const deepLinkA = document.getElementById("tgDeepLink");

    if (hint) hint.textContent = "Отправляю…";
    if (deepWrap) deepWrap.style.display = "none";

    const payload = {
      project: document.getElementById("orderProject")?.value || "",
      product: document.getElementById("orderProduct")?.value || "",
      contact: form.elements?.contact?.value || "",
      email: document.getElementById("orderEmail")?.value || "",
      tgUsername: document.getElementById("orderTg")?.value || "",
      comment: form.elements?.pain?.value || ""
    };

    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!data || data.ok !== true) {
        throw new Error((data && data.error) ? data.error : "Ошибка отправки");
      }

      if (hint) hint.textContent = "Заявка принята ✅ Проверьте почту и Telegram.";

      // ✅ Если сервер вернул deepLink — покажем + можно открыть
      if (data.deepLink && deepWrap && deepLinkA) {
        deepLinkA.href = data.deepLink;
        deepLinkA.textContent = "Открыть бота (мы свяжемся в течение 4 часов)";
        deepWrap.style.display = "block";

        // Дополнительно: можно сразу открыть в новой вкладке
        // window.open(data.deepLink, "_blank");
      }
    } catch (err) {
      if (hint) hint.textContent = `Ошибка: ${err.message}`;
    }
  }, true);
})();

// ===== ADD: Lighthouse run =====
$("#runLighthouseBtn")?.addEventListener("click", async () => {
  const url = $("#siteUrlInput")?.value?.trim();
  const out = $("#lighthouseResult");
  if (!url) {
    if (out) out.textContent = "Укажи URL (например https://example.com)";
    return;
  }

  if (out) out.textContent = "Запуск Lighthouse… (может занять 10–25 сек)";
  try {
    const res = await fetch(`/api/lighthouse?url=${encodeURIComponent(url)}`);
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || "Lighthouse error");

    // покажем сводку
    const s = data.scores;
    if (out) out.innerHTML =
      `✅ Готово<br>
      Performance: <b>${s.performance}</b><br>
      SEO: <b>${s.seo}</b><br>
      Best Practices: <b>${s.bestPractices}</b><br>
      Accessibility: <b>${s.accessibility}</b><br>
      <span class="muted">Report:</span> <a href="${data.reportUrl}" target="_blank" rel="noopener">скачать HTML</a>`;
  } catch (e) {
    if (out) out.textContent = `Ошибка Lighthouse: ${e.message}`;
  }
});

// ===== ADD: audit modules toggling =====
(function(){
  const buttons = $all("[data-audit-module]");
  if (!buttons.length) return;

  const mod1 = $("#surveyModule1");
  const mod2 = $("#surveyModule2");
  const grid = document.querySelector(".audit-grid");
  const valueCard = document.querySelector(".value-card");

  function setModule(name){
    buttons.forEach(b => b.classList.toggle("is-active", b.dataset.auditModule === name));

    const isReport = name === "report";
    if (grid) grid.style.display = isReport ? "" : "none";
    if (valueCard) valueCard.style.display = isReport ? "" : "";

    if (mod1) mod1.style.display = (name === "survey1") ? "" : "none";
    if (mod2) mod2.style.display = (name === "survey2") ? "" : "none";
  }

  buttons.forEach(b => b.addEventListener("click", () => setModule(b.dataset.auditModule)));
  setModule("report");
})();


/* ===================== ADD: Prototype UI components logic ===================== */

// (1) dropdown pill behavior: show selected text
(function(){
  const sel = document.getElementById("analyticsModeSelect");
  const hint = document.getElementById("analyticsModeHint");
  if (!sel || !hint) return;

  const render = () => {
    const txt = sel.options[sel.selectedIndex]?.textContent || "";
    hint.textContent = `Выбрано: ${txt}`;
  };

  sel.addEventListener("change", render);
  render();
})();

// (2) toggles: just reflect state to localStorage (optional)
(function(){
  const toggles = [
    ["toggleChecker", "qa.toggle.checker"],
    ["toggleLighthouse", "qa.toggle.lighthouse"],
    ["toggleSecurity", "qa.toggle.security"],
    ["togglePdf", "qa.toggle.pdf"]
  ];

  toggles.forEach(([id,key]) => {
    const el = document.getElementById(id);
    if (!el) return;

    // restore
    const v = localStorage.getItem(key);
    if (v === "0") el.checked = false;
    if (v === "1") el.checked = true;

    el.addEventListener("change", () => {
      localStorage.setItem(key, el.checked ? "1" : "0");
    });
  });
})();

// (3) temperature panel: +/- changes degrees and updates percent ring
(function(){
  const minus = document.getElementById("tempMinus");
  const plus = document.getElementById("tempPlus");
  const numEl = document.getElementById("tempNumber");
  const pctEl = document.getElementById("tempPercent");
  const labelEl = document.getElementById("tempLabel");
  const ringFg = document.getElementById("ringFg");

  if (!minus || !plus || !numEl || !pctEl || !labelEl || !ringFg) return;

  // temp state
  let temp = Number(numEl.textContent || "18.5");

  // mapping temp -> percent for demo
  // 14..24 => 0..100
  const tMin = 14.0;
  const tMax = 24.0;

  const CIRC = 2 * Math.PI * 46; // r=46
  ringFg.style.strokeDasharray = String(CIRC);

  function clamp(n,min,max){ return Math.max(min, Math.min(max, n)); }

  function tempToPercent(t){
    const p = ((t - tMin) / (tMax - tMin)) * 100;
    return clamp(p, 0, 100);
  }

  function percentToLabel(p){
    if (p >= 75) return "Warm";
    if (p >= 45) return "Neutral";
    return "Cold";
  }

  function render(){
    numEl.textContent = temp.toFixed(1);

    const p = tempToPercent(temp);
    pctEl.textContent = p.toFixed(1);
    labelEl.textContent = percentToLabel(p);

    const offset = CIRC * (1 - p/100);
    ringFg.style.strokeDashoffset = String(offset);
  }

  minus.addEventListener("click", () => { temp = clamp(temp - 0.5, tMin, tMax); render(); });
  plus.addEventListener("click", () => { temp = clamp(temp + 0.5, tMin, tMax); render(); });

  render();
})();

/* ===================== ADD: Prototype UI components logic ===================== */

// (1) dropdown pill behavior: show selected text
(function(){
  const sel = document.getElementById("analyticsModeSelect");
  const hint = document.getElementById("analyticsModeHint");
  if (!sel || !hint) return;

  const render = () => {
    const txt = sel.options[sel.selectedIndex]?.textContent || "";
    hint.textContent = `Выбрано: ${txt}`;
  };

  sel.addEventListener("change", render);
  render();
})();

// (2) toggles: just reflect state to localStorage (optional)
(function(){
  const toggles = [
    ["toggleChecker", "qa.toggle.checker"],
    ["toggleLighthouse", "qa.toggle.lighthouse"],
    ["toggleSecurity", "qa.toggle.security"],
    ["togglePdf", "qa.toggle.pdf"]
  ];

  toggles.forEach(([id,key]) => {
    const el = document.getElementById(id);
    if (!el) return;

    // restore
    const v = localStorage.getItem(key);
    if (v === "0") el.checked = false;
    if (v === "1") el.checked = true;

    el.addEventListener("change", () => {
      localStorage.setItem(key, el.checked ? "1" : "0");
    });
  });
})();

// (3) temperature panel: +/- changes degrees and updates percent ring
(function(){
  const minus = document.getElementById("tempMinus");
  const plus = document.getElementById("tempPlus");
  const numEl = document.getElementById("tempNumber");
  const pctEl = document.getElementById("tempPercent");
  const labelEl = document.getElementById("tempLabel");
  const ringFg = document.getElementById("ringFg");

  if (!minus || !plus || !numEl || !pctEl || !labelEl || !ringFg) return;

  // temp state
  let temp = Number(numEl.textContent || "18.5");

  // mapping temp -> percent for demo
  // 14..24 => 0..100
  const tMin = 14.0;
  const tMax = 24.0;

  const CIRC = 2 * Math.PI * 46; // r=46
  ringFg.style.strokeDasharray = String(CIRC);

  function clamp(n,min,max){ return Math.max(min, Math.min(max, n)); }

  function tempToPercent(t){
    const p = ((t - tMin) / (tMax - tMin)) * 100;
    return clamp(p, 0, 100);
  }

  function percentToLabel(p){
    if (p >= 75) return "Warm";
    if (p >= 45) return "Neutral";
    return "Cold";
  }

  function render(){
    numEl.textContent = temp.toFixed(1);

    const p = tempToPercent(temp);
    pctEl.textContent = p.toFixed(1);
    labelEl.textContent = percentToLabel(p);

    const offset = CIRC * (1 - p/100);
    ringFg.style.strokeDashoffset = String(offset);
  }

  minus.addEventListener("click", () => { temp = clamp(temp - 0.5, tMin, tMax); render(); });
  plus.addEventListener("click", () => { temp = clamp(temp + 0.5, tMin, tMax); render(); });

  render();
})();



