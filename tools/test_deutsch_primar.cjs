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
const metas=index.themen.filter(t=>t.deutschPrimarPaket);
assert.deepEqual(metas.map(t=>t.klasse),[1,2,2,3]);
assert.equal(new Set(metas.map(t=>t.datei)).size,3);
const cl={toggle(){}};
const inputFor=(a,bad=false)=>{
 let es=[];
 if(a.typ==='mc')es=[{value:String(bad?(a.richtig+1)%a.optionen.length:a.richtig)}];
 if(a.typ==='luecke')es=a.luecken.map((xs,i)=>({dataset:{gap:String(i)},value:bad?'FALSCH':xs[0],classList:cl}));
 if(a.typ==='zuordnen')es=a.paare.map((xs,i)=>({dataset:{pair:String(i)},value:bad?'FALSCH':xs[1],classList:cl}));
 if(a.typ==='reihenfolge')es=a.items.map((_,i)=>({dataset:{ord:String(i)},value:String(bad?(i+1)%a.items.length:i),classList:cl}));
 return {querySelectorAll:()=>es};
};
(async()=>{
 let automatic=0,open=0;const seen=new Set();
 for(const meta of metas){
  api.seed(index,meta.klasse);api.renderHome();assert.match(view.innerHTML,/zum Lernen/);
  const t=await api.loadTopic(meta.id);await api.renderTopic(meta.id,'lernen','lz-1');
  assert.match(view.innerHTML,/Eigene Lernziele/);assert(view.innerHTML.includes(meta.titel));assert(!view.innerHTML.includes('undefined'));
  assert.equal(t.karten.length,12);assert.equal(t.uebungen.length,t.lernziele.length*3);
  if(seen.has(meta.datei))continue;seen.add(meta.datei);
  for(const a of [...t.uebungen,...t.pruefungen.flatMap(p=>p.aufgaben)]){
   assert(!api.aufgabeHTML(a).includes('undefined'));
   if(a.typ==='offen'){assert.equal(a.kriterien.reduce((s,k)=>s+k.punkte,0),a.punkte);open++;continue;}
   assert.equal(api.grade(a,inputFor(a)).ok,true,`${meta.id}/${a.id}`);
   assert.equal(api.grade(a,inputFor(a,true)).ok,false,`${meta.id}/${a.id}`);
   if(a.typ==='luecke')assert.equal(a.exakt,true);automatic++;
  }
  assert(fs.readFileSync(path.join(root,t.quellen[0].datei)).subarray(0,5).equals(Buffer.from('%PDF-')));
 }
 assert.equal(automatic,59);assert.equal(open,65);
 const task={typ:'luecke',punkte:1,exakt:true,luecken:[['Bücher']],text:'{{0}}'};
 const el=v=>({querySelectorAll:()=>[{dataset:{gap:'0'},value:v,classList:cl}]});
 for(const good of ['Bücher',' Bücher ','Bücher'])assert.equal(api.grade(task,el(good)).ok,true);
 for(const bad of ['Bucher','bücher',''])assert.equal(api.grade(task,el(bad)).ok,false);
 const dot={...task,luecken:[['.']]};assert.equal(api.grade(dot,el('.')).ok,true);
 for(const bad of ['', '?'])assert.equal(api.grade(dot,el(bad)).ok,false);
 assert.equal(api.grade({...task,exakt:false},el('bücher')).ok,true,'Existing tolerant tasks stay compatible');
 const t=JSON.parse(fs.readFileSync(path.join(root,'content/themen/deutsch-direkte-indirekte-rede.json'),'utf8'));
 assert.deepEqual(t.pruefungen.map(p=>p.aufgaben.reduce((s,a)=>s+a.punkte,0)),[32,45]);
 console.log(`✓ Deutsch Primar: 4 class views, 3 files, ${automatic} auto-graded and ${open} open tasks; exact spelling and backward compatibility checked.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
