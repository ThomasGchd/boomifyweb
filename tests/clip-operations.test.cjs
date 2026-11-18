// No external dependencies: node --test tests/clip-operations.test.cjs
const test=require('node:test'), assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const ctx={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../clip-operations.js'),'utf8'),ctx);
const {buildClipboard,planPaste}=ctx.window.BoomifyClipOps;
const clip=(id,start,bars=1)=>({id,start,bars,notes:[{pitch:49,step:0,length:4,velocity:.8}]});
const track=(id,type,clips=[])=>({id,type,clips});
const base=()=>[track('s1','synth',[clip('a',1),clip('b',3)]),track('s2','synth',[]),track('d','drum',[{id:'x',start:1,bars:1,hits:{kick:[1]}}]),track('a','audio',[{id:'w',start:0,bars:2}])];
test('copie simple à la mesure choisie, notes indépendantes',()=>{
 const ts=base(),group=buildClipboard(ts,['a']),p=planPaste(group,ts,0,6,16);
 assert.equal(p.ok,true);assert.equal(p.insertions[0].clip.start,6);
 p.insertions[0].clip.notes[0].pitch=60;assert.equal(ts[0].clips[0].notes[0].pitch,49);
});
test('groupe non contigu : conservation des écarts',()=>{
 const ts=base(),group=buildClipboard(ts,['a','b']),p=planPaste(group,ts,0,7,16);
 assert.equal(p.ok,true);assert.deepEqual(Array.from(p.insertions,v=>v.clip.start),[7,9]);
});
test('duplication groupée à droite du groupe',()=>{
 const ts=base(),group=buildClipboard(ts,['a','b']),p=planPaste(group,ts,group.anchorRow,group.maxEnd,16);
 assert.equal(p.ok,true);assert.deepEqual(Array.from(p.insertions,v=>v.clip.start),[4,6]);
});
test('sélection multi-pistes : préservation des pistes relatives',()=>{
 const ts=base(),group=buildClipboard(ts,['a','x']),p=planPaste(group,ts,0,7,16);
 assert.equal(p.ok,true);assert.deepEqual(Array.from(p.insertions,v=>v.trackId),['s1','d']);
});
test('copie sur autre piste de même type',()=>{
 const ts=base(),p=planPaste(buildClipboard(ts,['a']),ts,1,5,16);
 assert.equal(p.ok,true);assert.equal(p.insertions[0].trackId,'s2');
});
test('copie sur piste incompatible refusée',()=>{
 const ts=base(),p=planPaste(buildClipboard(ts,['a','x']),ts,1,7,16);
 assert.equal(p.ok,false);assert.match(p.reason,/incompatibles/);
});
test('collision : refus atomique sans modifier les clips',()=>{
 const ts=base(),before=JSON.stringify(ts),p=planPaste(buildClipboard(ts,['a','b']),ts,0,1,16);
 assert.equal(p.ok,false);assert.equal(JSON.stringify(ts),before);
});
test('dépassement de timeline refusé',()=>{
 const ts=base(),p=planPaste(buildClipboard(ts,['a','b']),ts,0,15,16);
 assert.equal(p.ok,false);assert.match(p.reason,/dépasse/);
});
test('sample audio : copie sur piste source seulement',()=>{
 const ts=base(),group=buildClipboard(ts,['w']);assert.equal(planPaste(group,ts,3,3,16).ok,true);
 ts.push(track('a2','audio',[]));assert.equal(planPaste(group,ts,4,3,16).ok,false);
});
test('copie réutilisable et protégée des modifications ultérieures',()=>{
 const ts=base(),group=buildClipboard(ts,['a']);ts[0].clips[0].notes[0].pitch=77;
 assert.equal(group.items[0].clip.notes[0].pitch,49);
 assert.equal(planPaste(group,ts,0,5,16).ok,true);
 assert.equal(planPaste(group,ts,0,7,16).ok,true);
});
test('aucune sélection = presse-papiers vide',()=>assert.equal(buildClipboard(base(),[]),null));
