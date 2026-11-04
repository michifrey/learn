/* Lernen – statische Lern-App (GitHub Pages, kein Build-Schritt). */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const view = $("#view");

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Minimal inline markup after escaping: **fett**, *kursiv*, `code`, Zeilenumbruch.
const fmt = (s) =>
  esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*(?!\s)(.+?)\*/g, "$1<em>$2</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br>");

const norm = (s) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[\s.\-–_/()]+/g, " ")
    .trim();

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const parseNum = (s) => {
  const m = String(s ?? "").replace(/'/g, "").replace(",", ".").match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : NaN;
};

const round1 = (n) => Math.round(n * 10) / 10;
const fmtNum = (n) => String(round1(n)).replace(/\.0$/, "");
// Schweizer Notenskala: Note = 1 + 5 · Punkte / Maximum
const note = (p, max) => (max ? Math.max(1, Math.min(6, 1 + (5 * p) / max)) : 1);
const noteClass = (n) => (n >= 5 ? "good" : n >= 4 ? "ok" : "low");

/* ---------- Speicher (nur dieser Browser) ---------- */

const STORE_KEY = "learn:v1";
const store = (() => {
  let mem = {};
  try { mem = JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch { mem = {}; }
  const save = () => { try { localStorage.setItem(STORE_KEY, JSON.stringify(mem)); } catch { /* privat/voll */ } };
  return {
    get: (k, d) => (k in mem ? mem[k] : d),
    set: (k, v) => { mem[k] = v; save(); },
  };
})();

/* ---------- Theme ---------- */

const applyTheme = (t) => {
  if (t) document.documentElement.dataset.theme = t;
  else delete document.documentElement.dataset.theme;
};
applyTheme(store.get("theme"));
$("[data-theme-toggle]").addEventListener("click", () => {
  const dark = document.documentElement.dataset.theme
    ? document.documentElement.dataset.theme === "dark"
    : matchMedia("(prefers-color-scheme: dark)").matches;
  const t = dark ? "light" : "dark";
  store.set("theme", t);
  applyTheme(t);
});

/* ---------- Icons ---------- */

const ICONS = {
  mathe: '<path d="M5 7h6M8 4v6M14 7h5M5 17l5-5M10 17l-5-5M14 15h5M14 19h5"/>',
  bio: '<path d="M12 21c0-6 0-10 6-14-1 6-3 9-6 10"/><path d="M12 21c0-4-1-7-6-9 0 4 2 7 6 8"/>',
  deutsch: '<path d="M4 19h6M7 19V5h3a4 4 0 0 1 0 8H7"/><path d="M14 9h6M17 9v10"/>',
  englisch: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  franz: '<path d="M4 6h16v12H4z"/><path d="M9.3 6v12M14.7 6v12"/>',
  nt: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/><path d="M7 15h10"/>',
  rzg: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
  nmg: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
  wah: '<path d="M4 10h16l-1 10H5z"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  erg: '<path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 11c0 5.5-7 10-7 10z"/>',
  mi: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  musik: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  default: '<path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/><path d="M8 7h6"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  cards: '<rect x="3" y="6" width="14" height="14" rx="2"/><path d="M7 3h12a2 2 0 0 1 2 2v12"/>',
  pencil: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  exam: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  print: '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M6 14h12v7H6z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  back: '<path d="M15 18l-6-6 6-6"/>',
  next: '<path d="M9 18l6-6-6-6"/>',
  copy: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
};
const icon = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] ?? ICONS.default}</svg>`;

/* ---------- Daten ---------- */

let INDEX = null;
const topicCache = new Map();

async function loadIndex() {
  if (INDEX) return INDEX;
  const res = await fetch("content/index.json", { cache: "no-cache" });
  INDEX = await res.json();
  return INDEX;
}

async function loadTopic(id) {
  if (topicCache.has(id)) return topicCache.get(id);
  const meta = INDEX.themen.find((t) => t.id === id);
  if (!meta) return null;
  let content = {};
  if (meta.status !== "geplant") {
    const res = await fetch(`content/${meta.datei}`, { cache: "no-cache" });
    if (!res.ok) throw new Error("Die Lerninhalte konnten nicht geladen werden.");
    content = await res.json();
  }
  const topic = { ...meta, ...content };
  topic.uebungen ??= [];
  topic.pruefungen ??= [];
  topic.karten ??= [];
  topic.lernziele ??= [];
  topic.lernen ??= [];
  topic.quellen ??= [];
  topicCache.set(id, topic);
  return topic;
}

const fachById = (id) => INDEX.faecher.find((f) => f.id === id) ?? { id, label: id, hue: 220 };
const stufeById = (id) => INDEX.stufen.find((s) => s.id === id);
const hasStufen = (klasse) => klasse >= INDEX.stufenAbKlasse;

function topicMatches(t, klasse, stufe) {
  if (t.klasse !== klasse) return false;
  if (!hasStufen(klasse) || !t.stufen?.length) return true;
  return t.stufen.includes(stufe);
}

/* ---------- Profil (Klasse / Stufe) ---------- */

const profile = () => store.get("profile", null);

function profileLabel(p) {
  if (!p) return "Klasse wählen";
  const s = hasStufen(p.klasse) && p.stufe ? ` · ${stufeById(p.stufe)?.short ?? p.stufe}` : "";
  return `${p.klasse}. Klasse${s}`;
}

function renderProfileBtn() {
  const p = profile();
  $("#profile-btn").innerHTML = `${icon("nmg")}<span>${esc(profileLabel(p))}</span>`;
}
$("#profile-btn").addEventListener("click", () => openProfilePicker());

function openProfilePicker() {
  const p = profile() ?? {};
  const dlg = document.createElement("dialog");
  dlg.className = "dialog";
  const draw = (k, s) => {
    dlg.innerHTML = `
      <form method="dialog" class="picker">
        <h2>Welche Klasse?</h2>
        <div class="grade-grid">
          ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button type="button" class="grade ${n === k ? "is-on" : ""}" data-k="${n}">${n}<small>${n <= 6 ? "Primar" : "Oberstufe"}</small></button>`).join("")}
        </div>
        ${k && hasStufen(k) ? `
          <h3>Welche Stufe?</h3>
          <div class="stufe-row">
            ${INDEX.stufen.map((st) => `<button type="button" class="chip ${st.id === s ? "is-on" : ""}" data-s="${st.id}"><strong>${esc(st.short)}</strong> ${esc(st.label)}</button>`).join("")}
          </div>` : ""}
        <div class="picker__actions">
          <button class="btn btn--ghost" value="cancel">Abbrechen</button>
          <button class="btn" value="ok" ${!k || (hasStufen(k) && !s) ? "disabled" : ""}>Los geht's</button>
        </div>
      </form>`;
    $$("[data-k]", dlg).forEach((b) => b.addEventListener("click", () => draw(+b.dataset.k, hasStufen(+b.dataset.k) ? s : null)));
    $$("[data-s]", dlg).forEach((b) => b.addEventListener("click", () => draw(k, b.dataset.s)));
    dlg.onclose = () => {
      if (dlg.returnValue === "ok" && k) {
        store.set("profile", { klasse: k, stufe: hasStufen(k) ? s : null });
        renderProfileBtn();
        if (location.hash.startsWith("#/t/") || location.hash === "#/material") location.hash = "#/";
        else route();
      }
      dlg.remove();
    };
  };
  draw(p.klasse ?? null, p.stufe ?? null);
  document.body.append(dlg);
  dlg.showModal();
}

/* ---------- Fortschritt ---------- */

const progressKey = (topicId) => `p:${topicId}`;
const getProgress = (topicId) => store.get(progressKey(topicId), { aufgaben: {}, karten: {}, pruefungen: {} });
const setProgress = (topicId, p) => store.set(progressKey(topicId), p);

function lernzielStatus(topic, lzId) {
  const prog = getProgress(topic.id);
  const tasks = topic.uebungen.filter((a) => lzList(a).includes(lzId));
  if (!tasks.length) return null;
  const done = tasks.filter((a) => prog.aufgaben[a.id]?.ok).length;
  return { done, total: tasks.length };
}

function topicSummary(topic) {
  const prog = getProgress(topic.id);
  const ueb = topic.uebungen.length;
  const ok = topic.uebungen.filter((a) => prog.aufgaben[a.id]?.ok).length;
  const best = Object.values(prog.pruefungen ?? {}).flat().reduce((m, r) => Math.max(m, r.note ?? 0), 0);
  return { ueb, ok, best };
}

/* ---------- Router ---------- */

function parseHash() {
  const h = location.hash.replace(/^#\/?/, "");
  const parts = h.split("/").filter(Boolean);
  return parts;
}

async function route() {
  await loadIndex();
  renderProfileBtn();
  const [a, b, c, d] = parseHash();
  $$(".topnav [data-nav]").forEach((n) => n.classList.toggle("is-on", n.dataset.nav === a));
  stopTimer();
  try {
    if (a === "t" && b) await renderTopic(b, c || "lernen", d);
    else if (a === "material") await renderMaterial();
    else if (a === "alle") await renderAll();
    else renderHome();
  } catch (err) {
    console.error(err);
    view.innerHTML = `<div class="empty"><h2>Da ist etwas schiefgelaufen</h2><p>${esc(err.message)}</p><a class="btn" href="#/">Zur Startseite</a></div>`;
  }
}
window.addEventListener("hashchange", () => { route(); window.scrollTo(0, 0); });

/* ---------- Startseite ---------- */

function renderHome() {
  const p = profile();
  if (!p) {
    view.innerHTML = `
      <section class="hero">
        <p class="eyebrow">Willkommen</p>
        <h1>Lernen, üben, Prüfung bestehen.</h1>
        <p class="lead">Lerninhalte, Karteikarten, Übungen und Testprüfungen – erstellt aus deinen Unterlagen aus der Schule. Wähle zuerst deine Klasse.</p>
        <button class="btn btn--big" id="start">${icon("nmg")} Klasse wählen</button>
      </section>
      ${howItWorks()}`;
    $("#start").addEventListener("click", openProfilePicker);
    return;
  }
  const topics = INDEX.themen.filter((t) => topicMatches(t, p.klasse, p.stufe));
  const planned = topics.filter((t) => t.status === "geplant").length;
  const ready = topics.length - planned;
  const byFach = new Map();
  for (const t of topics) byFach.set(t.fach, [...(byFach.get(t.fach) ?? []), t]);
  const faecher = INDEX.faecher.filter((f) => (f.klassen ?? [1, 9]).length === 2 && p.klasse >= f.klassen[0] && p.klasse <= f.klassen[1]);
  const withTopics = faecher.filter((f) => byFach.has(f.id));
  const without = faecher.filter((f) => !byFach.has(f.id));

  view.innerHTML = `
    <section class="hero hero--compact">
      <p class="eyebrow">${esc(profileLabel(p))}</p>
      <h1>Was lernst du heute?</h1>
      <p class="lead">${topics.length ? `${ready} ${ready === 1 ? "Thema" : "Themen"} zum Lernen${planned ? ` · ${planned} weitere geplant` : ""}.` : "Für deine Klasse gibt es noch keine Themen."} Neues Material? <a href="#/material">So kommt es in die App.</a></p>
    </section>
    ${withTopics.map((f) => `
      <section class="fach" style="--h:${f.hue}">
        <h2 class="fach__title"><span class="fach__icon">${icon(f.icon ?? f.id)}</span>${esc(f.label)}</h2>
        <div class="topic-grid">${byFach.get(f.id).map(topicCard).join("")}</div>
      </section>`).join("")}
    ${without.length ? `
      <section class="fach fach--empty">
        <h2 class="fach__title small">Weitere Fächer</h2>
        <div class="chips">${without.map((f) => `<a class="chip chip--fach" style="--h:${f.hue}" href="#/material" title="Noch kein Material – hochladen">${icon(f.icon ?? f.id)} ${esc(f.label)}</a>`).join("")}</div>
        <p class="muted small">Noch kein Material. Lade Unterlagen hoch, dann entstehen hier Lerninhalte und Prüfungen.</p>
      </section>` : ""}
    <p class="center"><a class="link" href="#/alle">Alle Themen aller Klassen ansehen</a></p>`;
}

function topicCard(t) {
  const f = fachById(t.fach);
  const cached = topicCache.get(t.id);
  const s = cached ? topicSummary(cached) : null;
  const stufen = t.stufen?.length && hasStufen(t.klasse) ? t.stufen.map((id) => stufeById(id)?.short ?? id).join(" · ") : "";
  return `
    <a class="topic-card" href="#/t/${esc(t.id)}" style="--h:${f.hue}">
      <span class="topic-card__band">${icon(f.icon ?? f.id)}<span>${esc(f.label)} · ${t.klasse}. Kl.${stufen ? ` · ${esc(stufen)}` : ""}</span></span>
      <strong class="topic-card__title">${esc(t.titel)}</strong>
      <span class="topic-card__sub">${esc(t.untertitel ?? "")}</span>
      <span class="topic-card__meta">
        ${t.prismaBand ? `<span class="pill">Prisma ${t.prismaBand} · Thema ${t.prismaThema}</span>` : ""}
        ${(t.angebot ?? []).map((x) => `<span class="pill">${esc(x)}</span>`).join("")}
      </span>
      ${s && s.ueb ? `<span class="bar" title="${s.ok} von ${s.ueb} Übungen richtig"><span style="width:${(100 * s.ok) / s.ueb}%"></span></span>` : ""}
    </a>`;
}

function howItWorks() {
  return `
    <section class="steps">
      <div class="step"><span class="step__n">1</span><h3>Material hochladen</h3><p>Arbeitsblätter, Merkblätter, Lernziele oder Fotos aus dem Unterricht.</p></div>
      <div class="step"><span class="step__n">2</span><h3>Lerninhalt entsteht</h3><p>Erklärungen, Lernziele mit Antworten, Karteikarten und Übungen.</p></div>
      <div class="step"><span class="step__n">3</span><h3>Testprüfung schreiben</h3><p>Mit Richtzeit, Punkten, Lösungen und Note – online oder ausgedruckt.</p></div>
    </section>`;
}

async function renderAll() {
  const groups = new Map();
  for (const t of INDEX.themen) groups.set(t.klasse, [...(groups.get(t.klasse) ?? []), t]);
  const ks = [...groups.keys()].sort((a, b) => a - b);
  view.innerHTML = `
    <a class="back" href="#/">${icon("back")} Zurück</a>
    <h1 class="page-title">Alle Themen</h1>
    ${ks.map((k) => `<section class="fach"><h2 class="fach__title">${k}. Klasse</h2><div class="topic-grid">${groups.get(k).map(topicCard).join("")}</div></section>`).join("") || `<p class="muted">Noch keine Themen.</p>`}`;
}

/* ---------- Thema ---------- */

const TABS = [
  { id: "lernen", label: "Lernen", icon: "book" },
  { id: "ziele", label: "Lernziele", icon: "target" },
  { id: "karten", label: "Karteikarten", icon: "cards" },
  { id: "ueben", label: "Üben", icon: "pencil" },
  { id: "pruefung", label: "Testprüfung", icon: "exam" },
  { id: "material", label: "Material", icon: "file" },
];

async function renderTopic(id, tab, sub) {
  const topic = await loadTopic(id);
  if (!topic) {
    view.innerHTML = `<div class="empty"><h2>Thema nicht gefunden</h2><a class="btn" href="#/">Zur Startseite</a></div>`;
    return;
  }
  const f = fachById(topic.fach);
  document.title = `${topic.titel} · Lernen`;
  if (topic.status === "geplant") {
    view.innerHTML = `<div class="topic" style="--h:${f.hue}">
      <a class="back" href="#/">${icon("back")} Übersicht</a>
      <header class="topic__head"><p class="eyebrow">${esc(f.label)} · ${topic.klasse}. Klasse · ${esc(topic.kapitel ?? "")}</p><h1>${esc(topic.titel)}</h1></header>
      <section class="card"><span class="pill">Geplant</span><h2>Dieses Thema ist vorgemerkt</h2>
      <p>Die Themenübersicht ist angelegt. Lerntexte, Übungen und Testprüfung werden später ergänzt.</p>
      <p>Unterlagen und Lernziele aus der Schule helfen, das Thema passend auszuarbeiten.</p>
      <a class="btn" href="#/material">Unterlagen ergänzen</a></section></div>`;
    return;
  }
  const counts = {
    lernen: topic.lernen.length,
    ziele: topic.lernziele.length,
    karten: deck(topic).length,
    ueben: topic.uebungen.length,
    pruefung: topic.pruefungen.length,
    material: topic.quellen.length,
  };
  view.innerHTML = `
    <div class="topic" style="--h:${f.hue}">
      <a class="back" href="#/">${icon("back")} Übersicht</a>
      <header class="topic__head">
        <p class="eyebrow">${icon(f.icon ?? f.id)} ${esc(f.label)} · ${topic.klasse}. Klasse${topic.kapitel ? ` · ${esc(topic.kapitel)}` : ""}</p>
        <h1>${esc(topic.titel)}</h1>
        ${topic.untertitel ? `<p class="lead">${esc(topic.untertitel)}</p>` : ""}
        ${topic.lernzielBasis === "selbst-formuliert" ? `<div class="box box--tipp"><strong>Eigene Lernziele</strong><p>Die Lernziele wurden passend zum Thema formuliert. Gleiche sie vor einer Prüfung mit den Vorgaben deiner Lehrperson ab.</p></div>` : ""}
      </header>
      <nav class="tabs" role="tablist">
        ${TABS.filter((t) => counts[t.id]).map((t) => `<a role="tab" class="tab ${t.id === tab ? "is-on" : ""}" aria-selected="${t.id === tab}" href="#/t/${topic.id}/${t.id}">${icon(t.icon)}<span>${t.label}</span></a>`).join("")}
      </nav>
      <div id="tab-body" class="tab-body"></div>
    </div>`;
  const body = $("#tab-body");
  const renderers = { lernen: tabLernen, ziele: tabZiele, karten: tabKarten, ueben: tabUeben, pruefung: tabPruefung, material: tabMaterial };
  (renderers[tab] ?? tabLernen)(topic, body, sub);
}

/* ----- Lernen ----- */

function blockHTML(b) {
  switch (b.t) {
    case "p": return `<p>${fmt(b.text)}</p>`;
    case "h": return `<h3>${fmt(b.text)}</h3>`;
    case "merke": return `<div class="box box--merke">${b.titel ? `<strong class="box__title">${fmt(b.titel)}</strong>` : ""}<div>${fmt(b.text)}</div></div>`;
    case "achtung": return `<div class="box box--achtung">${b.titel ? `<strong class="box__title">${fmt(b.titel)}</strong>` : `<strong class="box__title">Achtung</strong>`}<div>${fmt(b.text)}</div></div>`;
    case "formel": return `<div class="formel"><span class="formel__f">${fmt(b.text)}</span>${b.notiz ? `<span class="formel__n">${fmt(b.notiz)}</span>` : ""}</div>`;
    case "liste": return `<ul class="list">${b.items.map((i) => `<li>${fmt(i)}</li>`).join("")}</ul>`;
    case "schritte": return `${b.titel ? `<h4>${fmt(b.titel)}</h4>` : ""}<ol class="steps-list">${b.items.map((i) => `<li>${fmt(i)}</li>`).join("")}</ol>`;
    case "tabelle": return `<div class="table-wrap"><table>${b.kopf ? `<thead><tr>${b.kopf.map((k) => `<th>${fmt(k)}</th>`).join("")}</tr></thead>` : ""}<tbody>${b.zeilen.map((z) => `<tr>${z.map((c) => `<td>${fmt(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
    case "beispiel": return `<div class="beispiel">${b.titel ? `<strong class="beispiel__t">${fmt(b.titel)}</strong>` : ""}${b.aufgabe ? `<p>${fmt(b.aufgabe)}</p>` : ""}<div class="rechnung">${b.zeilen.map((z) => `<div>${fmt(z)}</div>`).join("")}</div>${b.notiz ? `<p class="muted small">${fmt(b.notiz)}</p>` : ""}</div>`;
    case "bild": return `<figure class="figure ${b.klein ? "figure--small" : ""}"><img src="${esc(b.src)}" alt="${esc(b.alt ?? "")}" loading="lazy">${b.caption ? `<figcaption>${fmt(b.caption)}</figcaption>` : ""}</figure>`;
    case "svg": return `<figure class="figure figure--svg ${b.klein ? "figure--small" : ""}">${b.svg}${b.caption ? `<figcaption>${fmt(b.caption)}</figcaption>` : ""}</figure>`;
    case "spalten": return `<div class="cols">${b.spalten.map((col) => `<div>${col.map(blockHTML).join("")}</div>`).join("")}</div>`;
    default: return "";
  }
}

function tabLernen(topic, body, sub) {
  const idx = Math.max(0, topic.lernen.findIndex((k) => k.id === sub));
  const k = topic.lernen[idx];
  const prev = topic.lernen[idx - 1];
  const next = topic.lernen[idx + 1];
  body.innerHTML = `
    <div class="learn">
      <aside class="toc">
        <p class="side-label">Kapitel</p>
        <ol>${topic.lernen.map((x, i) => `<li><a class="${i === idx ? "is-on" : ""}" href="#/t/${topic.id}/lernen/${x.id}"><span class="toc__n">${i + 1}</span>${esc(x.titel)}</a></li>`).join("")}</ol>
      </aside>
      <article class="lesson card">
        <p class="eyebrow">Kapitel ${idx + 1} von ${topic.lernen.length}${k.lernziele?.length ? ` · Lernziel ${k.lernziele.join(", ")}` : ""}</p>
        <h2>${esc(k.titel)}</h2>
        ${k.intro ? `<p class="lead">${fmt(k.intro)}</p>` : ""}
        ${k.bloecke.map(blockHTML).join("")}
        <div class="pager">
          ${prev ? `<a class="btn btn--ghost" href="#/t/${topic.id}/lernen/${prev.id}">${icon("back")} ${esc(prev.titel)}</a>` : "<span></span>"}
          ${next ? `<a class="btn" href="#/t/${topic.id}/lernen/${next.id}">${esc(next.titel)} ${icon("next")}</a>` : `<a class="btn" href="#/t/${topic.id}/ueben">Jetzt üben ${icon("next")}</a>`}
        </div>
      </article>
    </div>`;
}

/* ----- Lernziele (Lernspick) ----- */

function tabZiele(topic, body) {
  const groups = [];
  for (const lz of topic.lernziele) {
    const g = lz.gruppe ?? "";
    if (!groups.length || groups.at(-1).g !== g) groups.push({ g, items: [] });
    groups.at(-1).items.push(lz);
  }
  body.innerHTML = `
    <div class="toolbar">
      <p class="muted">Decke die Antworten zuerst ab und sage sie dir selbst auf. Dann aufdecken und vergleichen.</p>
      <div class="toolbar__actions">
        <button class="btn btn--ghost" id="lz-toggle">Alle aufdecken</button>
        <button class="btn btn--ghost" id="lz-print">${icon("print")} Lernspick drucken</button>
      </div>
    </div>
    ${groups.map((g) => `
      <section class="lz-group">
        ${g.g ? `<h3 class="lz-group__t">${esc(g.g)}</h3>` : ""}
        ${g.items.map((lz) => {
          const st = lernzielStatus(topic, lz.id);
          return `
          <details class="lz card">
            <summary>
              <span class="lz__n">${esc(lz.nr ?? lz.id)}</span>
              <span class="lz__text">${fmt(lz.text)}</span>
              ${st ? `<span class="lz__st ${st.done === st.total ? "is-done" : ""}" title="Übungen richtig gelöst">${st.done}/${st.total}</span>` : ""}
            </summary>
            <div class="lz__answer">${fmt(lz.antwort)}${lz.bild ? `<img src="${esc(lz.bild)}" alt="" loading="lazy">` : ""}
              <div class="lz__links">
                ${topic.lernen.filter((k) => k.lernziele?.includes(lz.nr ?? lz.id)).map((k) => `<a class="link" href="#/t/${topic.id}/lernen/${k.id}">${icon("book")} ${esc(k.titel)}</a>`).join("")}
                ${st ? `<a class="link" href="#/t/${topic.id}/ueben/${encodeURIComponent(lz.id)}">${icon("pencil")} Dazu üben</a>` : ""}
              </div>
            </div>
          </details>`;
        }).join("")}
      </section>`).join("")}`;
  let open = false;
  $("#lz-toggle").addEventListener("click", (e) => {
    open = !open;
    $$("details.lz", body).forEach((d) => (d.open = open));
    e.currentTarget.textContent = open ? "Alle zudecken" : "Alle aufdecken";
  });
  $("#lz-print").addEventListener("click", () => printSpick(topic));
}

function printSpick(topic) {
  printHTML(`
    <h1>${esc(topic.titel)} – Lernspick</h1>
    <p class="muted">${esc(fachById(topic.fach).label)} · ${topic.klasse}. Klasse</p>
    ${topic.lernzielBasis === "selbst-formuliert" ? `<p class="small"><strong>Eigene Lernziele:</strong> Vor einer Prüfung mit den Vorgaben der Lehrperson abgleichen.</p>` : ""}
    <div class="print-cols">
      ${topic.lernziele.map((lz) => `<div class="print-lz"><strong>${esc(lz.nr ?? lz.id)}. ${fmt(lz.text)}</strong><div>→ ${fmt(lz.antwort)}</div></div>`).join("")}
    </div>`);
}

/* ----- Karteikarten ----- */

function deck(topic) {
  const fromLz = topic.lernziele.filter((lz) => lz.karte !== false).map((lz) => ({
    id: `lz-${lz.id}`, vorne: lz.frage ?? lz.text, hinten: lz.antwort, lernziel: lz.id,
  }));
  return [...topic.karten.map((k, i) => ({ id: k.id ?? `k${i}`, ...k })), ...fromLz];
}

function tabKarten(topic, body) {
  const cards = deck(topic);
  const prog = getProgress(topic.id);
  // Einfache Leitner-Boxen 0–3: Karten mit tiefer Box kommen zuerst.
  let queue = shuffle(cards).sort((a, b) => (prog.karten[a.id] ?? 0) - (prog.karten[b.id] ?? 0));
  let i = 0;
  let flipped = false;

  const boxes = () => [0, 1, 2, 3].map((n) => cards.filter((c) => (getProgress(topic.id).karten[c.id] ?? 0) === n).length);

  const draw = () => {
    const c = queue[i];
    const bx = boxes();
    body.innerHTML = `
      <div class="flash">
        <div class="flash__stats">
          ${["Neu", "Nochmal", "Fast", "Sitzt"].map((l, n) => `<span class="box-stat b${n}"><strong>${bx[n]}</strong> ${l}</span>`).join("")}
        </div>
        ${c ? `
          <button class="flashcard ${flipped ? "is-flipped" : ""}" id="card" type="button" aria-label="Karte umdrehen">
            <span class="flashcard__face flashcard__front">
              <span class="flashcard__hint">Frage · ${i + 1}/${queue.length}</span>
              <span class="flashcard__text">${fmt(c.vorne)}</span>
              ${c.bild ? `<img src="${esc(c.bild)}" alt="">` : ""}
              <span class="flashcard__tap">Tippen zum Umdrehen</span>
            </span>
            <span class="flashcard__face flashcard__back">
              <span class="flashcard__hint">Antwort</span>
              <span class="flashcard__text">${fmt(c.hinten)}</span>
            </span>
          </button>
          <div class="flash__actions" ${flipped ? "" : "hidden"}>
            <button class="btn btn--bad" data-r="0">${icon("x")} Nochmal</button>
            <button class="btn btn--ok" data-r="1">Fast</button>
            <button class="btn btn--good" data-r="2">${icon("check")} Gewusst</button>
          </div>` : `
          <div class="empty card"><h2>Runde geschafft! 🎉</h2><p>Alle Karten einmal durch.</p><button class="btn" id="again">${icon("refresh")} Neue Runde</button></div>`}
      </div>`;
    $("#card")?.addEventListener("click", () => { flipped = !flipped; draw(); });
    $$("[data-r]", body).forEach((b) => b.addEventListener("click", () => {
      const p = getProgress(topic.id);
      const cur = p.karten[c.id] ?? 0;
      const r = +b.dataset.r;
      p.karten[c.id] = r === 0 ? 1 : r === 1 ? Math.max(2, cur) : Math.min(3, Math.max(cur, 1) + 1);
      setProgress(topic.id, p);
      if (r === 0) queue.push(c); // falsch → später nochmal
      i++; flipped = false; draw();
    }));
    $("#again")?.addEventListener("click", () => {
      const p = getProgress(topic.id);
      queue = shuffle(cards).sort((a, b) => (p.karten[a.id] ?? 0) - (p.karten[b.id] ?? 0));
      i = 0; draw();
    });
  };
  draw();
}

/* ---------- Aufgaben-Engine ---------- */

const lzList = (a) => (Array.isArray(a.lernziel) ? a.lernziel : a.lernziel ? [a.lernziel] : []);

function maxPunkte(a) {
  if (a.punkte != null) return a.punkte;
  if (a.typ === "offen") return (a.kriterien ?? []).reduce((s, k) => s + k.punkte, 0) || 1;
  // Ohne Angabe: 1 Punkt pro Teilantwort
  if (a.typ === "zuordnen") return a.paare.length;
  if (a.typ === "reihenfolge") return a.items.length;
  if (a.typ === "luecke") return a.luecken.length;
  return 1;
}

// Rendert eine Aufgabe. `order` hält zufällige Reihenfolgen stabil, solange die Aufgabe sichtbar ist.
function aufgabeHTML(a, { nr, showPoints = true } = {}) {
  const pts = maxPunkte(a);
  const head = `
    <header class="task__head">
      ${nr != null ? `<span class="task__nr">${esc(nr)}</span>` : ""}
      <div class="task__q">${a.titel ? `<strong>${fmt(a.titel)}</strong><br>` : ""}${fmt(a.frage)}</div>
      ${showPoints ? `<span class="task__pts">${fmtNum(pts)} P</span>` : ""}
    </header>
    ${a.bild ? `<figure class="figure figure--task"><img src="${esc(a.bild)}" alt="${esc(a.bildAlt ?? "Abbildung zur Aufgabe")}" loading="lazy"></figure>` : ""}
    ${a.svg ? `<figure class="figure figure--svg figure--task">${a.svg}</figure>` : ""}`;
  let inner = "";
  const name = `a-${a.id}-${Math.random().toString(36).slice(2, 7)}`;
  switch (a.typ) {
    case "mc": {
      const multi = Array.isArray(a.richtig);
      const order = a.mischen === false ? a.optionen.map((_, i) => i) : shuffle(a.optionen.map((_, i) => i));
      inner = `<div class="options">${order.map((i) => `
        <label class="option"><input type="${multi ? "checkbox" : "radio"}" name="${name}" value="${i}"><span>${fmt(a.optionen[i])}</span></label>`).join("")}</div>
        ${multi ? `<p class="muted small">Mehrere Antworten möglich.</p>` : ""}`;
      break;
    }
    case "zahl":
      inner = `<label class="num">${a.vor ? `<span>${fmt(a.vor)}</span>` : ""}<input type="text" inputmode="decimal" autocomplete="off" data-in>${a.einheit ? `<span class="num__unit">${fmt(a.einheit)}</span>` : ""}</label>`;
      break;
    case "luecke": {
      let n = 0;
      inner = `<p class="cloze">${esc(a.text).replace(/\{\{(\d+)\}\}/g, (_, k) => `<input type="text" autocomplete="off" spellcheck="false" data-gap="${k}" size="${Math.max(6, Math.min(22, (a.luecken[k]?.[0] ?? "").length + 2))}" aria-label="Lücke ${++n}">`).replace(/\n/g, "<br>")}</p>`;
      if (a.woerter) inner = `<div class="wordbank">${shuffle(a.woerter).map((w) => `<span class="pill">${esc(w)}</span>`).join("")}</div>` + inner;
      break;
    }
    case "zuordnen": {
      const rights = shuffle([...new Set([...a.paare.map((p) => p[1]), ...(a.ablenker ?? [])])]);
      inner = `<div class="match">${a.paare.map((p, i) => `
        <label class="match__row"><span class="match__l">${fmt(p[0])}</span>
          <select data-pair="${i}"><option value="">– wählen –</option>${rights.map((r) => `<option>${esc(r)}</option>`).join("")}</select>
        </label>`).join("")}</div>`;
      break;
    }
    case "reihenfolge": {
      const order = shuffle(a.items.map((_, i) => i));
      inner = `<div class="match">${order.map((i) => `
        <label class="match__row"><select data-ord="${i}" class="ord"><option value="">#</option>${a.items.map((_, k) => `<option value="${k}">${k + 1}</option>`).join("")}</select>
          <span class="match__l">${fmt(a.items[i])}</span></label>`).join("")}</div>`;
      break;
    }
    case "offen":
      inner = `<textarea rows="${a.zeilen ?? 4}" placeholder="${a.skizze ? "Skizze auf Papier zeichnen – hier Notizen / Rechenweg" : "Deine Antwort / dein Rechenweg"}" data-in></textarea>
        ${a.skizze ? `<p class="muted small">${icon("pencil")} Zeichne die Skizze auf ein Blatt. Vergleiche danach mit der Lösung.</p>` : ""}`;
      break;
  }
  return `<article class="task card" data-task="${esc(a.id)}">${head}<div class="task__body">${inner}</div><div class="task__fb" hidden></div></article>`;
}

function loesungText(a) {
  switch (a.typ) {
    case "mc": return (Array.isArray(a.richtig) ? a.richtig : [a.richtig]).map((i) => a.optionen[i]).join(" · ");
    case "zahl": return `${a.vor ? a.vor + " " : ""}${String(a.antwort).replace(".", ".")}${a.einheit ? " " + a.einheit : ""}`;
    case "luecke": return a.luecken.map((l) => l[0]).join(" · ");
    case "zuordnen": return a.paare.map((p) => `${p[0]} → ${p[1]}`).join("\n");
    case "reihenfolge": return a.items.map((t, i) => `${i + 1}. ${t}`).join("\n");
    default: return "";
  }
}

// Bewertet automatisch korrigierbare Aufgaben. Gibt {punkte, max, ok, auto} zurück.
function grade(a, el) {
  const max = maxPunkte(a);
  const r = (frac) => ({ punkte: Math.round(max * frac * 2) / 2, max, ok: frac >= 0.999, auto: true, frac });
  switch (a.typ) {
    case "mc": {
      const sel = $$("input:checked", el).map((x) => +x.value).sort();
      const want = (Array.isArray(a.richtig) ? a.richtig : [a.richtig]).slice().sort();
      return r(sel.length === want.length && sel.every((v, i) => v === want[i]) ? 1 : 0);
    }
    case "zahl": {
      const v = parseNum($("[data-in]", el).value);
      const tol = a.toleranz ?? 0.05;
      const ok = [a.antwort, ...(a.auchRichtig ?? [])].some((x) => Math.abs(v - x) <= tol + 1e-9);
      return r(ok ? 1 : 0);
    }
    case "luecke": {
      const gaps = $$("[data-gap]", el);
      let good = 0;
      gaps.forEach((g) => {
        const acc = a.luecken[+g.dataset.gap].map(norm);
        const ok = acc.includes(norm(g.value));
        g.classList.toggle("is-ok", ok); g.classList.toggle("is-bad", !ok);
        if (ok) good++;
      });
      return r(good / gaps.length);
    }
    case "zuordnen": {
      const sels = $$("[data-pair]", el);
      let good = 0;
      sels.forEach((s) => {
        const ok = s.value === a.paare[+s.dataset.pair][1];
        s.classList.toggle("is-ok", ok); s.classList.toggle("is-bad", !ok);
        if (ok) good++;
      });
      return r(good / sels.length);
    }
    case "reihenfolge": {
      const sels = $$("[data-ord]", el);
      let good = 0;
      sels.forEach((s) => {
        const ok = s.value !== "" && +s.value === +s.dataset.ord;
        s.classList.toggle("is-ok", ok); s.classList.toggle("is-bad", !ok);
        if (ok) good++;
      });
      return r(good / sels.length);
    }
    default:
      return { punkte: 0, max, ok: false, auto: false, frac: 0 };
  }
}

function lockTask(el) {
  $$("input, select, textarea", el).forEach((x) => (x.disabled = true));
}

function musterHTML(a) {
  const m = Array.isArray(a.musterloesung) ? a.musterloesung : [a.musterloesung ?? ""];
  return `<div class="muster"><strong>Musterlösung</strong>${a.loesungBild ? `<img src="${esc(a.loesungBild)}" alt="Lösungsskizze">` : ""}<div class="rechnung">${m.map((z) => `<div>${fmt(z)}</div>`).join("")}</div></div>`;
}

function feedbackHTML(a, g) {
  if (!g.auto) return "";
  const cls = g.ok ? "good" : g.punkte > 0 ? "ok" : "bad";
  const head = g.ok ? "Richtig!" : g.punkte > 0 ? `Teilweise richtig (${fmtNum(g.punkte)} von ${fmtNum(g.max)} P)` : "Leider falsch.";
  return `<div class="fb fb--${cls}"><strong>${icon(g.ok ? "check" : "x")} ${head}</strong>
    ${!g.ok ? `<div class="fb__sol"><span class="muted small">Lösung:</span> ${fmt(loesungText(a))}</div>` : ""}
    ${a.erklaerung ? `<div class="fb__exp">${fmt(a.erklaerung)}</div>` : ""}</div>`;
}

// Selbstbewertung offener Aufgaben über Kriterien (Bewertungsraster).
function selfCheckHTML(a) {
  const krit = a.kriterien?.length ? a.kriterien : [{ text: "Antwort stimmt mit der Musterlösung überein", punkte: maxPunkte(a) }];
  return `${musterHTML(a)}
    ${a.erklaerung ? `<div class="fb__exp">${fmt(a.erklaerung)}</div>` : ""}
    <div class="selfcheck"><strong>Bewerte dich selbst – ehrlich!</strong>
      ${krit.map((k, i) => `<label class="option option--crit"><input type="checkbox" data-crit="${i}" data-p="${k.punkte}"><span>${fmt(k.text)}</span><em>${fmtNum(k.punkte)} P</em></label>`).join("")}
    </div>`;
}
const selfPoints = (el) => $$("[data-crit]:checked", el).reduce((s, x) => s + +x.dataset.p, 0);

/* ----- Üben ----- */

function tabUeben(topic, body, lzFilter) {
  const lzSel = lzFilter ? decodeURIComponent(lzFilter) : "";
  const pool = topic.uebungen.filter((a) => !lzSel || lzList(a).includes(lzSel));
  const prog = getProgress(topic.id);
  const lzOptions = topic.lernziele.filter((lz) => topic.uebungen.some((a) => lzList(a).includes(lz.id)));
  let mode = store.get("uebenModus", "alle");
  const pick = () => {
    let list = pool;
    if (mode === "offen") list = pool.filter((a) => !prog.aufgaben[a.id]?.ok);
    return mode === "mix" ? shuffle(list) : list;
  };
  let list = pick();
  let i = 0;
  let score = { p: 0, max: 0, n: 0 };

  const header = () => `
    <div class="toolbar">
      <label class="select">Lernziel
        <select id="lz-filter"><option value="">Alle Lernziele (${topic.uebungen.length})</option>
          ${lzOptions.map((lz) => `<option value="${esc(lz.id)}" ${lz.id === lzSel ? "selected" : ""}>${esc(lz.nr ?? lz.id)}. ${esc(lz.kurz ?? lz.text).slice(0, 60)}</option>`).join("")}
        </select></label>
      <div class="segmented" role="group" aria-label="Reihenfolge">
        ${[["alle", "Der Reihe nach"], ["mix", "Gemischt"], ["offen", "Nur noch nicht gekonnte"]].map(([v, l]) => `<button type="button" data-mode="${v}" aria-pressed="${mode === v}">${l}</button>`).join("")}
      </div>
    </div>`;

  const draw = () => {
    const a = list[i];
    const done = pool.filter((x) => prog.aufgaben[x.id]?.ok).length;
    body.innerHTML = `${header()}
      <div class="practice">
        <div class="practice__bar"><span class="bar"><span style="width:${list.length ? (100 * i) / list.length : 100}%"></span></span>
          <span class="muted small">${Math.min(i + 1, list.length)} / ${list.length} · insgesamt ${done}/${pool.length} gekonnt</span></div>
        ${a ? aufgabeHTML(a, { nr: i + 1 }) + `
          <div class="practice__actions">
            ${a.hilfe ? `<button class="btn btn--ghost" id="hint">💡 Tipp</button>` : ""}
            <button class="btn btn--ghost" id="skip">Überspringen</button>
            <button class="btn" id="check">${a.typ === "offen" ? "Lösung zeigen" : "Prüfen"}</button>
          </div>
          ${a.hilfe ? `<div class="box box--tipp" id="hint-box" hidden>${fmt(a.hilfe)}</div>` : ""}` : `
          <div class="empty card">
            <h2>${list.length ? "Fertig! 🎉" : "Keine Aufgaben"}</h2>
            ${list.length ? `<p>${fmtNum(score.p)} von ${fmtNum(score.max)} Punkten in dieser Runde.</p>` : `<p>${mode === "offen" ? "Du kannst schon alle Aufgaben. Stark!" : ""}</p>`}
            <div class="row"><button class="btn" id="restart">${icon("refresh")} Nochmal</button>
            <a class="btn btn--ghost" href="#/t/${topic.id}/pruefung">Zur Testprüfung</a></div>
          </div>`}
      </div>`;
    $("#lz-filter").addEventListener("change", (e) => { location.hash = `#/t/${topic.id}/ueben${e.target.value ? "/" + encodeURIComponent(e.target.value) : ""}`; });
    $$("[data-mode]", body).forEach((b) => b.addEventListener("click", () => { mode = b.dataset.mode; store.set("uebenModus", mode); list = pick(); i = 0; draw(); }));
    $("#restart")?.addEventListener("click", () => { list = pick(); i = 0; score = { p: 0, max: 0, n: 0 }; draw(); });
    if (!a) return;
    const el = $(".task", body);
    $("#hint")?.addEventListener("click", () => ($("#hint-box").hidden = false));
    $("#skip").addEventListener("click", () => { i++; draw(); });
    const fb = $(".task__fb", el);
    const record = (ok) => {
      prog.aufgaben[a.id] = { ok, t: Date.now() };
      setProgress(topic.id, prog);
    };
    const toNext = (btn) => {
      btn.textContent = i + 1 < list.length ? "Weiter" : "Abschliessen";
      btn.onclick = () => { i++; draw(); };
      $("#skip").hidden = true;
      btn.focus();
    };
    $("#check").addEventListener("click", function onCheck(e) {
      const btn = e.currentTarget;
      btn.removeEventListener("click", onCheck);
      if (a.typ === "offen") {
        fb.hidden = false;
        fb.innerHTML = selfCheckHTML(a);
        lockTask(el);
        btn.textContent = "Bewertung übernehmen";
        btn.onclick = () => {
          const p = selfPoints(fb);
          const max = maxPunkte(a);
          score.p += p; score.max += max;
          record(p >= max * 0.8);
          $$("[data-crit]", fb).forEach((x) => (x.disabled = true));
          fb.insertAdjacentHTML("beforeend", `<div class="fb fb--${p >= max * 0.8 ? "good" : p > 0 ? "ok" : "bad"}"><strong>${fmtNum(p)} von ${fmtNum(max)} Punkten</strong></div>`);
          toNext(btn);
        };
        return;
      }
      const g = grade(a, el);
      score.p += g.punkte; score.max += g.max;
      record(g.ok);
      lockTask(el);
      fb.hidden = false;
      fb.innerHTML = feedbackHTML(a, g);
      toNext(btn);
    });
    // Enter in einem Eingabefeld = Prüfen
    $$("input[type=text]", el).forEach((inp) => inp.addEventListener("keydown", (e) => { if (e.key === "Enter") $("#check").click(); }));
  };
  draw();
}

/* ----- Testprüfung ----- */

let timerId = null;
const stopTimer = () => { if (timerId) clearInterval(timerId); timerId = null; };

function examMax(ex) { return ex.aufgaben.reduce((s, a) => s + maxPunkte(a), 0); }

function tabPruefung(topic, body, exId) {
  const ex = topic.pruefungen.find((e) => e.id === exId);
  if (!ex) return examOverview(topic, body);
  examRun(topic, ex, body);
}

function examOverview(topic, body) {
  const prog = getProgress(topic.id);
  body.innerHTML = `<div class="exam-list">${topic.pruefungen.map((ex) => {
    const hist = prog.pruefungen?.[ex.id] ?? [];
    const best = hist.reduce((m, r) => Math.max(m, r.note), 0);
    return `
      <article class="card exam-card">
        <div>
          <p class="eyebrow">${icon("exam")} Testprüfung</p>
          <h2>${esc(ex.titel)}</h2>
          ${ex.hinweis ? `<p class="muted">${fmt(ex.hinweis)}</p>` : ""}
          <ul class="facts">
            <li>${icon("clock")} Richtzeit ${ex.richtzeit} Min.</li>
            <li>${icon("target")} ${fmtNum(examMax(ex))} Punkte</li>
            <li>${icon("pencil")} ${ex.aufgaben.length} Aufgaben</li>
          </ul>
          ${hist.length ? `<p class="small">Bisher: ${hist.slice(-5).map((r) => `<span class="note note--${noteClass(r.note)}">${fmtNum(r.note)}</span>`).join(" ")} · Beste Note <strong>${fmtNum(best)}</strong></p>` : ""}
        </div>
        <div class="exam-card__actions">
          <a class="btn btn--big" href="#/t/${topic.id}/pruefung/${ex.id}">Prüfung starten</a>
          <button class="btn btn--ghost" data-print="${ex.id}">${icon("print")} Ausdrucken</button>
          <button class="btn btn--ghost" data-print-sol="${ex.id}">${icon("print")} Lösungen drucken</button>
        </div>
      </article>`;
  }).join("")}
  <p class="muted small">Tipp: Schreibe die Prüfung wie in der Schule – ohne Unterlagen, mit Uhr. Danach korrigierst du mit den Lösungen und erhältst eine Note (Note = 1 + 5 · Punkte / Maximum).</p></div>`;
  $$("[data-print]", body).forEach((b) => b.addEventListener("click", () => printExam(topic, topic.pruefungen.find((e) => e.id === b.dataset.print), false)));
  $$("[data-print-sol]", body).forEach((b) => b.addEventListener("click", () => printExam(topic, topic.pruefungen.find((e) => e.id === b.dataset.printSol), true)));
}

function examRun(topic, ex, body) {
  const max = examMax(ex);
  const start = Date.now();
  let submitted = false;
  body.innerHTML = `
    <div class="exam">
      <div class="exam__bar">
        <a class="link" href="#/t/${topic.id}/pruefung">${icon("back")} Abbrechen</a>
        <strong>${esc(ex.titel)}</strong>
        <span class="timer" id="timer">${icon("clock")} <span>0:00</span> / ${ex.richtzeit}:00</span>
      </div>
      ${ex.hinweis ? `<div class="box box--merke">${fmt(ex.hinweis)}</div>` : ""}
      ${ex.aufgaben.map((a, i) => `${a.abschnitt ? `<h3 class="exam__section">${esc(a.abschnitt)}</h3>` : ""}${aufgabeHTML(a, { nr: a.nr ?? i + 1 })}`).join("")}
      <div class="exam__submit card">
        <p>Fertig? Kontrolliere nochmals Einheiten und Rechenwege.</p>
        <button class="btn btn--big" id="submit">Prüfung abgeben</button>
      </div>
      <div id="result"></div>
    </div>`;
  const timer = $("#timer span");
  const tick = () => {
    const s = Math.floor((Date.now() - start) / 1000);
    timer.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
    $("#timer").classList.toggle("is-over", s > ex.richtzeit * 60);
  };
  timerId = setInterval(tick, 1000);

  $("#submit").addEventListener("click", () => {
    if (submitted) return;
    const empty = ex.aufgaben.filter((a, i) => {
      const el = $$(".task", body)[i];
      return !$$("input:checked, input[type=text], select, textarea", el).some((x) => (x.type === "radio" || x.type === "checkbox" ? x.checked : x.value.trim()));
    }).length;
    if (empty && !confirm(`${empty} Aufgabe(n) sind noch leer. Trotzdem abgeben?`)) return;
    submitted = true;
    stopTimer();
    const minutes = Math.round((Date.now() - start) / 60000);
    const els = $$(".task", body);
    const results = ex.aufgaben.map((a, i) => {
      const el = els[i];
      const g = grade(a, el);
      lockTask(el);
      const fb = $(".task__fb", el);
      fb.hidden = false;
      if (a.typ === "offen") {
        fb.innerHTML = selfCheckHTML(a);
      } else {
        fb.innerHTML = feedbackHTML(a, g);
        el.insertAdjacentHTML("afterbegin", `<span class="task__score task__score--${g.ok ? "good" : g.punkte > 0 ? "ok" : "bad"}">${fmtNum(g.punkte)}/${fmtNum(g.max)}</span>`);
      }
      return { a, g, el, fb };
    });
    $(".exam__submit", body).hidden = true;
    const runId = Date.now();
    const update = () => {
      const pts = results.reduce((s, r) => s + (r.a.typ === "offen" ? selfPoints(r.fb) : r.g.punkte), 0);
      const n = note(pts, max);
      const openCount = results.filter((r) => r.a.typ === "offen").length;
      $("#result").innerHTML = `
        <div class="result card">
          <div class="result__note note--${noteClass(n)}"><span>Note</span><strong>${fmtNum(n)}</strong></div>
          <div>
            <h2>${fmtNum(pts)} von ${fmtNum(max)} Punkten</h2>
            <p class="muted">Zeit: ${minutes} Min. (Richtzeit ${ex.richtzeit} Min.)${openCount ? ` · ${openCount} offene Aufgaben: hake bei jeder Aufgabe oben die erfüllten Kriterien an – die Note passt sich an.` : ""}</p>
            ${weakSpots(topic, results)}
            <div class="row">
              <a class="btn" href="#/t/${topic.id}/pruefung">Zur Übersicht</a>
              <button class="btn btn--ghost" id="retry">${icon("refresh")} Nochmal schreiben</button>
            </div>
          </div>
        </div>`;
      $("#retry").addEventListener("click", () => examRun(topic, ex, body));
      const prog = getProgress(topic.id);
      prog.pruefungen ??= {};
      const hist = (prog.pruefungen[ex.id] ??= []);
      const rec = { id: runId, punkte: pts, max, note: round1(n), min: minutes };
      const at = hist.findIndex((r) => r.id === runId);
      if (at >= 0) hist[at] = rec; else hist.push(rec);
      setProgress(topic.id, prog);
    };
    body.addEventListener("change", (e) => { if (e.target.matches("[data-crit]")) update(); });
    update();
    $("#result").scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function weakSpots(topic, results) {
  const miss = new Map();
  for (const r of results) {
    const frac = r.a.typ === "offen" ? selfPoints(r.fb) / maxPunkte(r.a) : r.g.frac;
    if (frac < 0.75) for (const lz of lzList(r.a)) miss.set(lz, (miss.get(lz) ?? 0) + 1);
  }
  if (!miss.size) return `<p class="fb fb--good">Super – keine klaren Lücken!</p>`;
  const items = [...miss.keys()].map((id) => topic.lernziele.find((lz) => lz.id === id)).filter(Boolean);
  if (!items.length) return "";
  return `<div class="weak"><strong>Das solltest du nochmals anschauen:</strong><ul>${items.map((lz) => `<li><a class="link" href="#/t/${topic.id}/ueben/${encodeURIComponent(lz.id)}">Lernziel ${esc(lz.nr ?? lz.id)}: ${esc(lz.kurz ?? lz.text)}</a></li>`).join("")}</ul></div>`;
}

/* ----- Drucken ----- */

function printHTML(html) {
  const area = $("#print-area");
  area.innerHTML = html;
  document.body.classList.add("is-printing");
  const done = () => { document.body.classList.remove("is-printing"); area.innerHTML = ""; window.removeEventListener("afterprint", done); };
  window.addEventListener("afterprint", done);
  // Bilder laden lassen, dann drucken
  const imgs = $$("img", area).filter((i) => !i.complete);
  Promise.all(imgs.map((i) => new Promise((r) => { i.onload = i.onerror = r; }))).then(() => window.print());
}

function printTask(a, nr, withSol) {
  const pts = maxPunkte(a);
  let body = "";
  if (!withSol) {
    switch (a.typ) {
      case "mc": body = `<ul class="p-opts">${a.optionen.map((o) => `<li>☐ ${fmt(o)}</li>`).join("")}</ul>`; break;
      case "zahl": body = `<div class="p-lines" style="--n:${a.zeilen ?? 3}"></div>`; break;
      case "luecke": body = `<p>${esc(a.text).replace(/\{\{\d+\}\}/g, "<span class='p-gap'></span>").replace(/\n/g, "<br>")}</p>`; break;
      case "zuordnen": body = `<table class="p-match">${a.paare.map((p) => `<tr><td>${fmt(p[0])}</td><td class="p-blank"></td></tr>`).join("")}</table>${a.woerterDruck !== false ? `<p class="small">Auswahl: ${shuffle([...new Set([...a.paare.map((p) => p[1]), ...(a.ablenker ?? [])])]).map(esc).join(" · ")}</p>` : ""}`; break;
      case "reihenfolge": body = `<ul class="p-opts">${shuffle(a.items).map((t) => `<li>___ ${fmt(t)}</li>`).join("")}</ul>`; break;
      case "offen": body = a.skizze ? `<div class="p-box" style="--h:${a.druckHoehe ?? 6}cm"></div>` : `<div class="p-lines" style="--n:${a.zeilen ?? 4}"></div>`; break;
    }
  } else {
    body = a.typ === "offen"
      ? `${musterHTML(a)}${a.kriterien?.length ? `<ul class="small">${a.kriterien.map((k) => `<li>${fmt(k.text)} (${fmtNum(k.punkte)} P)</li>`).join("")}</ul>` : ""}`
      : `<div class="muster"><strong>Lösung:</strong> ${fmt(loesungText(a))}${a.erklaerung ? `<div class="small">${fmt(a.erklaerung)}</div>` : ""}</div>`;
  }
  return `<section class="p-task"><div class="p-task__head"><strong>${esc(nr)} ${a.titel ? fmt(a.titel) + " – " : ""}</strong>${fmt(a.frage)}<span class="p-pts">___ / ${fmtNum(pts)} P</span></div>
    ${a.bild ? `<img class="p-img" src="${esc(a.bild)}" alt="">` : ""}${a.svg ? `<div class="p-img">${a.svg}</div>` : ""}${body}</section>`;
}

function printExam(topic, ex, withSol) {
  printHTML(`
    <header class="p-head">
      <div><p class="small">${esc(fachById(topic.fach).label)} · ${topic.klasse}. Klasse · ${withSol ? "LÖSUNGEN" : "TESTPRÜFUNG"}</p><h1>${esc(ex.titel)}</h1></div>
      ${withSol ? "" : `<div class="p-name">Name: ____________________<br>Datum: ____________<br>Punkte: _____ / ${fmtNum(examMax(ex))} · Note: _____</div>`}
    </header>
    <p class="small">Richtzeit: ${ex.richtzeit} Minuten · Total ${fmtNum(examMax(ex))} Punkte${ex.hinweis ? ` · ${fmt(ex.hinweis)}` : ""}</p>
    ${ex.aufgaben.map((a, i) => `${a.abschnitt ? `<h2 class="p-section">${esc(a.abschnitt)}</h2>` : ""}${printTask(a, a.nr ?? i + 1, withSol)}`).join("")}`);
}

/* ----- Material ----- */

function tabMaterial(topic, body) {
  body.innerHTML = `
    <div class="card">
      <h2>Unterlagen zu diesem Thema</h2>
      <p class="muted">Aus diesen Dateien wurden die Lerninhalte, Übungen und Prüfungen erstellt.</p>
      <ul class="files">${topic.quellen.map((q) => `<li><a class="file" href="${esc(q.datei)}" target="_blank" rel="noopener">${icon("file")}<span><strong>${esc(q.titel)}</strong><small>${esc(q.art ?? "")}${q.seiten ? ` · ${q.seiten} Seiten` : ""}</small></span></a></li>`).join("")}</ul>
    </div>`;
}

async function renderMaterial() {
  document.title = "Material · Lernen";
  const repo = INDEX.repo;
  const p = profile();
  const folder = p ? `material/klasse-${p.klasse}${p.stufe ? "-" + p.stufe : ""}/` : "material/klasse-8-sek/";
  const prompt = `Ich habe neues Material hochgeladen: ${folder}<fach>/<thema>/\nBitte erstelle daraus Lerninhalt, Lernziele, Karteikarten, Übungen und eine Testprüfung für die App (siehe CLAUDE.md).`;
  await Promise.all(INDEX.themen.map((t) => loadTopic(t.id)));
  view.innerHTML = `
    <a class="back" href="#/">${icon("back")} Zurück</a>
    <h1 class="page-title">Material hochladen</h1>
    <p class="lead">Aus deinen Unterlagen entstehen Lerninhalte, Karteikarten, Übungen und Testprüfungen. So geht's:</p>
    <ol class="howto">
      <li class="card">
        <h3>1 · Dateien hochladen</h3>
        <p>PDFs, Fotos (JPG/PNG) oder Word-Dateien: Arbeitsblätter, Lernziele, Merkblätter, alte Prüfungen. Je mehr, desto besser – besonders die <strong>Lernziele</strong>.</p>
        <p>Ordner-Schema: <code>${esc(folder)}&lt;fach&gt;/&lt;thema&gt;/</code><br><span class="muted small">z. B. <code>material/klasse-8-sek/mathe/pythagoras/</code></span></p>
        <div class="row">
          <a class="btn" href="https://github.com/${esc(repo)}/upload/main/${esc(folder)}" target="_blank" rel="noopener">${icon("upload")} Auf GitHub hochladen</a>
          <span class="muted small">oder die Dateien direkt im Chat mit Claude anhängen.</span>
        </div>
      </li>
      <li class="card">
        <h3>2 · Claude Bescheid geben</h3>
        <p>In Claude Code (Web oder App) mit diesem Repository:</p>
        <pre class="prompt" id="prompt">${esc(prompt)}</pre>
        <button class="btn btn--ghost" id="copy">${icon("copy")} Text kopieren</button>
      </li>
      <li class="card">
        <h3>3 · Lernen</h3>
        <p>Nach dem Merge ist das neue Thema nach ca. einer Minute hier in der App – unter der passenden Klasse und dem Fach.</p>
      </li>
    </ol>
    <h2 class="page-sub">Bereits verarbeitetes Material</h2>
    ${INDEX.themen.filter((t) => t.status !== "geplant").map((t) => {
      const topic = topicCache.get(t.id);
      return `<div class="card mat-row"><a class="link" href="#/t/${t.id}"><strong>${esc(t.titel)}</strong></a> <span class="muted small">${esc(fachById(t.fach).label)} · ${t.klasse}. Klasse</span>
        <ul class="files files--compact">${topic.quellen.map((q) => `<li><a class="file" href="${esc(q.datei)}" target="_blank" rel="noopener">${icon("file")}<span>${esc(q.titel)}</span></a></li>`).join("")}</ul></div>`;
    }).join("")}`;
  $("#copy").addEventListener("click", async (e) => {
    try { await navigator.clipboard.writeText(prompt); e.currentTarget.textContent = "Kopiert ✓"; } catch { /* ignore */ }
  });
}

/* ---------- Start ---------- */

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && document.body.classList.contains("is-printing")) document.body.classList.remove("is-printing");
});

loadIndex().then(() => {
  // Themen der aktuellen Klasse vorladen, damit Fortschrittsbalken erscheinen
  const p = profile();
  const pre = p ? INDEX.themen.filter((t) => topicMatches(t, p.klasse, p.stufe)) : [];
  Promise.all(pre.map((t) => loadTopic(t.id))).finally(route);
});

