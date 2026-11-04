/* Integration checks for planned Prisma topics and the existing exercise engine. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const index = JSON.parse(fs.readFileSync(path.join(root, 'content/index.json'), 'utf8'));
const view = { innerHTML: '', addEventListener() {} };
const empty = { addEventListener() {}, classList: { remove() {}, contains() { return false; } } };
let fetches = 0;
const context = {
  document: {
    querySelector: (selector) => selector === '#view' ? view : empty,
    querySelectorAll: () => [], documentElement: { dataset: {} }, body: empty,
    addEventListener() {},
  },
  localStorage: { getItem: () => null, setItem() {} },
  window: { addEventListener() {} }, console, Math, setInterval, clearInterval,
  fetch: async (url) => {
    fetches++;
    const filename = path.resolve(root, url);
    assert(filename.startsWith(root + path.sep));
    const exists = fs.existsSync(filename);
    return { ok: exists, json: async () => JSON.parse(fs.readFileSync(filename, 'utf8')) };
  },
};
vm.createContext(context);
const app = fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8').split('/* ---------- Start ---------- */')[0];
vm.runInContext(app + `\nthis.api = { loadTopic, renderTopic, renderHome, aufgabeHTML, grade, maxPunkte, selfCheckHTML, deck,
  seed: (index, klasse) => { INDEX = index; store.set('profile', { klasse, stufe: 'sek' }); } };`, context);
const api = context.api;
const catalog = index.themen.filter((t) => t.prismaThema);
assert.equal(catalog.length, 21);
assert.equal(new Set(catalog.map((t) => t.prismaThema)).size, 21);
assert.deepEqual(catalog.filter((t) => t.klasse === 7).map((t) => t.prismaThema), [1, 2, 3, 4, 5, 6, 7]);
assert.deepEqual(catalog.filter((t) => t.klasse === 8).map((t) => t.prismaThema), [8, 9, 10, 11, 12, 13, 14, 15]);
assert.deepEqual(catalog.filter((t) => t.klasse === 9).map((t) => t.prismaThema), [16, 17, 18, 19, 20, 21]);

(async () => {
  api.seed(index, 7);
  for (const meta of catalog.filter((t) => t.status === 'geplant')) {
    const before = fetches;
    await api.renderTopic(meta.id, 'lernen');
    assert.equal(fetches, before, 'Planned topics must not fetch missing content');
    assert.match(view.innerHTML, /Dieses Thema ist vorgemerkt/);
    assert(!view.innerHTML.includes('role="tab"'), 'No unusable study tabs for planned content');
  }
  api.renderHome();
  assert.match(view.innerHTML, /0 Themen zum Lernen · 7 weitere geplant/);
  api.seed(index, 9); api.renderHome();
  assert.match(view.innerHTML, /0 Themen zum Lernen · 6 weitere geplant/);
  api.seed(index, 8); api.renderHome();
  assert(!view.innerHTML.includes('weitere geplant'));

  let automatic = 0; let open = 0;
  for (const meta of catalog.filter((t) => t.lernzielBasis === 'selbst-formuliert')) {
    const topic = await api.loadTopic(meta.id);
    assert.equal(topic.lernziele.length, 8); assert.equal(topic.lernen.length, 9);
    assert.equal(topic.uebungen.length, 24); assert.equal(api.deck(topic).length, 20);
    assert.equal(topic.pruefungen.length, 1);
    assert.equal(topic.pruefungen[0].aufgaben.reduce((s, a) => s + a.punkte, 0), 32);
    await api.renderTopic(meta.id, 'lernen', 'lz-1');
    assert.match(view.innerHTML, /Eigene Lernziele/);
    for (const a of [...topic.uebungen, ...topic.pruefungen[0].aufgaben]) {
      assert(!api.aufgabeHTML(a).includes('undefined'), a.id);
      assert(api.maxPunkte(a) > 0);
      if (a.typ === 'offen') {
        assert.equal(a.kriterien.reduce((s, k) => s + k.punkte, 0), a.punkte);
        assert(api.selfCheckHTML(a).includes('Musterlösung')); open++; continue;
      }
      const cl = { toggle() {} }; let elements = [];
      if (a.typ === 'mc') elements = (Array.isArray(a.richtig) ? a.richtig : [a.richtig]).map((i) => ({ value: String(i) }));
      if (a.typ === 'luecke') elements = a.luecken.map((xs, i) => ({ dataset: { gap: String(i) }, value: xs[0], classList: cl }));
      if (a.typ === 'zuordnen') elements = a.paare.map((xs, i) => ({ dataset: { pair: String(i) }, value: xs[1], classList: cl }));
      if (a.typ === 'reihenfolge') elements = a.items.map((_, i) => ({ dataset: { ord: String(i) }, value: String(i), classList: cl }));
      const el = { querySelectorAll: () => elements, querySelector: () => ({ value: String(a.antwort) }) };
      assert.equal(api.grade(a, el).ok, true, `${meta.id}/${a.id}`);
      if (a.typ === 'mc' && !Array.isArray(a.richtig)) {
        const wrong = { querySelectorAll: () => [{ value: String((a.richtig + 1) % a.optionen.length) }] };
        assert.equal(api.grade(a, wrong).ok, false, 'Wrong MC choices must be rejected');
      }
      automatic++;
    }
  }
  assert.equal(automatic, 112); assert.equal(open, 112);
  console.log(`✓ 21 Prisma topics, 13 planned routes without missing requests, ${automatic} auto-graded and ${open} open tasks checked.`);
})().catch((error) => { console.error(error); process.exitCode = 1; });
