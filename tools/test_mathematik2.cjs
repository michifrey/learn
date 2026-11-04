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
const curriculum = index.themen.filter(t => t.mathematik2Kapitel);
assert.equal(curriculum.length, 9);
assert.deepEqual(curriculum.map(t => t.mathematik2Kapitel), [1,2,3,4,5,6,7,8,9]);
const pi = Math.PI, r2 = x => Math.round(x * 100) / 100;
const expected = [
 [6,3,5,2,100*7/20,(21+3)/4,11+4,Math.sqrt(169)],
 [13,6**2+8**2,Math.hypot(9,12),Math.sqrt(13**2-5**2),8**2+15**2-17**2,90,Math.hypot(12,16),Math.sqrt(10**2-6**2)],
 [4*7,4*5,12/3*7,9/6*10,3*8/6,5*12/3,5+2*6,40/10*2.5],
 [2+3,6,5*4*3,18*7,2*12+16*5,48*6/3,4**2+4*(4*6/2),3500/1000],
 [200*.15,150*.8,(120-90)/120*100,200*1.08,54/1.08,4/.5,80*.9,150-40-25-35],
 [14/2,r2(pi*10),r2(pi*3**2),Math.sqrt(64),r2(90/360*2*pi*4),r2(180/360*pi*4**2),90,r2(pi*3+6)],
 [2,r2(2/6*100),2**2,100*.5*.5,28/80*100,(4+6)/2,11-3,120/300*100],
 [12/2,r2(2*pi*3),r2(pi*5**2),r2(pi*2**2*5),r2(2*pi*2*10),r2(2*pi*3**2+2*pi*3*4),1750/1000,80/4**2],
 [36/3,54/3.6,12*45/60,24/16*60,(12-4)/(3-1),30/(1.5+.5),18/300*100,200*7/100]
];
(async () => {
 api.seed(index, 8); let automatic=0, open=0, totalPoints=0;
 for (const [j,meta] of curriculum.entries()) {
  const t = await api.loadTopic(meta.id);
  assert.equal(t.lernzielBasis, 'selbst-formuliert');
  assert.equal(t.lernziele.length,8); assert.equal(t.lernen.length,9);
  assert.equal(t.karten.length,12); assert.equal(api.deck(t).length,20);
  assert.equal(t.uebungen.length,24); assert.equal(t.pruefungen.length,1);
  assert.equal(t.pruefungen[0].aufgaben.reduce((s,a)=>s+a.punkte,0),32);
  await api.renderTopic(meta.id,'lernen','lz-1');
  assert.match(view.innerHTML,/Eigene Lernziele/);
  assert(!view.innerHTML.includes('undefined'));
  for(const [i,g] of t.lernziele.entries()) {
   assert.equal(t.uebungen.filter(a=>a.lernziel===g.id).length,3);
   const a=t.uebungen.find(a=>a.id===`u${i+1}-2`);
   assert(Math.abs(a.antwort-expected[j][i])<1e-8,`${meta.id}/${a.id}: independently recalculated answer`);
  }
  for (const a of [...t.uebungen,...t.pruefungen[0].aufgaben]) {
   assert(!api.aufgabeHTML(a).includes('undefined'));
   assert(api.maxPunkte(a)>0);
   if(a.typ==='offen') {
    assert.equal(a.kriterien.reduce((s,k)=>s+k.punkte,0),a.punkte);
    assert(api.selfCheckHTML(a).includes('Musterlösung')); open++; continue;
   }
   const elFor=value=>({querySelectorAll:()=>[{value:String(value)}],querySelector:()=>({value:String(value)})});
   const correct=a.typ==='mc'?a.richtig:a.antwort;
   assert.equal(api.grade(a,elFor(correct)).ok,true);
   assert.equal(api.grade(a,elFor(a.typ==='mc'?1-a.richtig:correct+1)).ok,false);
   if(a.typ==='zahl') assert.equal(api.grade(a,elFor(String(correct).replace('.',','))).ok,true,'Decimal comma accepted');
   automatic++;
  }
  totalPoints+=32;
  const pdf=path.join(root,t.quellen[0].datei);
  assert(fs.readFileSync(pdf).subarray(0,5).equals(Buffer.from('%PDF-')));
 }
 const c=JSON.parse(fs.readFileSync(path.join(root,'content/mathematik2.json'),'utf8'));
 assert.equal(c.themen.length,9);
 assert.equal(automatic,144); assert.equal(open,144); assert.equal(totalPoints,288);
 const existing=JSON.parse(fs.readFileSync(path.join(root,'content/themen/mathe-pythagoras.json'),'utf8'));
 assert.equal(existing.uebungen.length,37); assert.equal(existing.pruefungen.length,2);
 console.log(`✓ Mathematik 2: 9 topics, 72 independent arithmetic checks, ${automatic} auto-graded and ${open} open tasks; existing Pythagoras retained.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
