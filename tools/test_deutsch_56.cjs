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
const metas=index.themen.filter(t=>t.deutsch56Paket);
assert.deepEqual(metas.map(t=>t.klasse),[5,5,6,6]);
assert.equal(new Set(metas.map(t=>t.datei)).size,2);
const cl={toggle(){}};
const inputFor=(a,bad=false)=>{
 let es=[];
 if(a.typ==='mc')es=[{value:String(bad?(a.richtig+1)%a.optionen.length:a.richtig)}];
 if(a.typ==='luecke')es=a.luecken.map((xs,i)=>({dataset:{gap:String(i)},value:bad?'FALSCH':xs[0],classList:cl}));
 if(a.typ==='zuordnen')es=a.paare.map((xs,i)=>({dataset:{pair:String(i)},value:bad?'FALSCH':xs[1],classList:cl}));
 return {querySelectorAll:()=>es};
};
(async()=>{
 let auto=0,open=0;const seen=new Set();
 for(const m of metas){
  api.seed(index,m.klasse);const t=await api.loadTopic(m.id);
  await api.renderTopic(m.id,'lernen','lz-1');assert(view.innerHTML.includes(m.titel));
  assert.match(view.innerHTML,/Eigene Lernziele/);assert.equal(t.lernziele.length,12);
  assert.equal(t.lernen.length,13);assert.equal(t.uebungen.length,36);assert.equal(t.karten.length,12);
  if(seen.has(m.datei))continue;seen.add(m.datei);
  for(const lz of t.lernziele)assert.equal(t.uebungen.filter(a=>a.lernziel===lz.id).length,3);
  for(const a of [...t.uebungen,...t.pruefungen.flatMap(p=>p.aufgaben)]){
   assert(!api.aufgabeHTML(a).includes('undefined'));
   if(a.typ==='offen'){assert.equal(a.kriterien.reduce((s,k)=>s+k.punkte,0),a.punkte);open++;continue;}
   assert.equal(api.grade(a,inputFor(a)).ok,true,`${m.id}/${a.id}`);
   assert.equal(api.grade(a,inputFor(a,true)).ok,false,`${m.id}/${a.id}`);
   if(a.typ==='luecke')assert.equal(a.exakt,true);auto++;
  }
  assert(fs.readFileSync(path.join(root,t.quellen[0].datei)).subarray(0,5).equals(Buffer.from('%PDF-')));
 }
 assert.equal(auto,56);assert.equal(open,57);
 const t=JSON.parse(fs.readFileSync(path.join(root,'content/themen/deutsch-kommas-zeichensetzung.json'),'utf8'));
 assert.deepEqual(t.pruefungen.map(p=>p.aufgaben.reduce((s,a)=>s+a.punkte,0)),[48,25,28]);
 const k=t.pruefungen.find(p=>p.id==='vorlage-kommas').aufgaben.find(a=>a.id==='k5');
 assert(k.musterloesung.includes('nicht, keine Angst'),'Updated infinitive comma present');
 const r=JSON.parse(fs.readFileSync(path.join(root,'content/themen/deutsch-rechtschreibung-56.json'),'utf8'));
 const a=r.uebungen.find(a=>a.id==='u9-1');
 const swapped={querySelectorAll:()=>[{dataset:{gap:'0'},value:'seit',classList:cl},{dataset:{gap:'1'},value:'seid',classList:cl}]};
 assert.equal(api.grade(a,swapped).punkte,0,'seit and seid cannot be interchanged');
 console.log(`✓ Deutsch 5-6: 4 class views, 2 files, ${auto} auto-graded and ${open} open tasks; test totals and spelling contrasts verified.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
