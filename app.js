(()=>{'use strict';
const $=s=>document.querySelector(s), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const MIDI={C:0,'C#':1,D:2,'D#':3,E:4,F:5,'F#':6,G:7,'G#':8,A:9,'A#':10,B:11};
const NAMES=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];const DRUMS=['kick','clap','hat','open'];const DRUM_LABEL={kick:'Kick',clap:'Clap / Snare',hat:'Hi-hat',open:'Open hat'};
let pianoViewKey=null;let editorVisible=true;
let clipSelection=new Set(),clipClipboard=null,pasteMode=false;let serial=0;const uid=()=>`id${Date.now().toString(36)}${(++serial).toString(36)}`;
let project={name:'Mon premier track',bpm:150,bars:8,master:.78,tracks:[]},selection={trackId:null,clipId:null},noteLength=2;
let live=null,loadTrackId=null,projectModified=false;let toastTimer=0,saveTimer=0,rafId=0,dragState=null,playing=false,metronome=false,looping=true,playInterval=null,ctx=null,liveNetwork=null,nextNoteTime=0,stepCounter=0,playStart=0,scopeRead=new Uint8Array(512);
const TYPE_ICON={drum:'▦',synth:'♫',audio:'◉'};const trackColor=t=>t.type==='drum'?'drums':t.type==='audio'?'audio':(t.inst||'lead');
const stepSec=()=>60/project.bpm/4;const barSec=()=>stepSec()*16;const totalSec=()=>project.bars*barSec();
const trackById=id=>project.tracks.find(t=>t.id===id);const selectedTrack=()=>trackById(selection.trackId);const selectedClip=()=>selectedTrack()?.clips.find(c=>c.id===selection.clipId);
function makeTrack(type,name,inst){return {id:uid(),type,name:name||({drum:'Drum Rack',synth:'Synthé',audio:'Audio'}[type]),inst:inst||'lead',vol:type==='drum'?.73:.55,pan:0,cutoff:20000,drive:0,mute:false,solo:false,clips:[],sampleName:'',sampleDataUrl:null,buffer:null,waveform:null};}
const freshHits=()=>Object.fromEntries(DRUMS.map(x=>[x,Array(16).fill(0)]));
function makeClip(t,start,copy=null){let clip={id:uid(),start,bars:1};if(t.type==='drum')clip.hits=copy?.hits?JSON.parse(JSON.stringify(copy.hits)):freshHits();if(t.type==='synth')clip.notes=copy?.notes?JSON.parse(JSON.stringify(copy.notes)):[];if(t.type==='audio')clip.bars=Math.max(1,Math.min(project.bars-start,Math.ceil((t.buffer?.duration||barSec())/barSec())));return clip;}
function addClip(t,start,copy=null){if(start<0||start>=project.bars)return null;let len=t.type==='audio'?Math.max(1,Math.min(project.bars-start,Math.ceil((t.buffer?.duration||barSec())/barSec()))):1;if(t.clips.some(c=>start<c.start+c.bars&&start+len>c.start)){toast('Cette mesure contient déjà un clip.');return null;}const c=makeClip(t,start,copy);t.clips.push(c);markChange();return c;}
function demo(){const drums=makeTrack('drum','DRUM RACK');drums.vol=.68;let bass=makeTrack('synth','DISTORTED BASS','bass');bass.vol=.5;bass.drive=15;bass.cutoff=2200;let lead=makeTrack('synth','RAVE LEAD','lead');lead.vol=.35;lead.cutoff=6500;let pad=makeTrack('synth','ATMOSPHÈRE','pad');pad.vol=.2;let audio=makeTrack('audio','SAMPLE / VOCAL');project.tracks=[drums,bass,lead,pad,audio];
 for(let i=0;i<8;i++){let c=addClip(drums,i);[0,4,8,12].forEach(x=>c.hits.kick[x]=1);[4,12].forEach(x=>c.hits.clap[x]=.8);[2,6,10,14].forEach(x=>c.hits.hat[x]=.7);if(i%2===1)c.hits.open[15]=.65;const b=addClip(bass,i);b.notes=[{pitch:36,step:0,length:3,velocity:.9},{pitch:36,step:4,length:3,velocity:.85},{pitch:39,step:8,length:3,velocity:.85},{pitch:34,step:12,length:3,velocity:.82}];if(i>=4){const l=addClip(lead,i);const keys=[60,63,67,70];l.notes=[{pitch:keys[(i-4)%4],step:0,length:4,velocity:.73},{pitch:keys[(i-3)%4],step:8,length:3,velocity:.7}];}if(i%2===0){const p=addClip(pad,i);p.notes=[{pitch:48+(i%4?3:0),step:0,length:16,velocity:.6},{pitch:55+(i%4?3:0),step:0,length:16,velocity:.45}];}}
 selection.trackId=drums.id;selection.clipId=drums.clips[0].id;projectModified=false;}
function emptyProject(){stop();clipSelection.clear();clipClipboard=null;pasteMode=false;project={name:'Nouveau morceau',bpm:150,bars:8,master:.78,tracks:[makeTrack('drum','DRUM RACK'),makeTrack('synth','SYNTHÉ','lead'),makeTrack('audio','AUDIO')]};selection={trackId:project.tracks[0].id,clipId:null};syncHeader();renderAll();markChange();toast('Projet vide créé.');}
function syncHeader(){ $('#projectName').value=project.name;$('#bpm').value=project.bpm;$('#bars').value=project.bars;$('#masterVol').value=Math.round(project.master*100);}
// Undo/redo history: keep AudioBuffer references, copy mutable clip contents.
const HISTORY_LIMIT=60;
let undoStack=[],redoStack=[],historyPresent=null,lastHistoryKey=null,lastHistoryTime=0;
function historySnapshot(){return {project:{...project,tracks:project.tracks.map(t=>({...t,clips:t.clips.map(c=>JSON.parse(JSON.stringify(c)))}))},selection:{...selection}};}
function historyControls(){const u=$('#undoBtn'),r=$('#redoBtn');if(u)u.disabled=!undoStack.length;if(r)r.disabled=!redoStack.length;}
function showStorageWarning(message){const el=$('#storageWarning');if(!el)return;el.textContent='⚠ '+message;el.hidden=false;}
function clearMissingSampleWarning(){const el=$('#storageWarning');if(el&&!el.hidden&&el.textContent.includes('samples manquent')&&project.tracks.every(t=>t.type!=='audio'||!t.sampleName||t.buffer)){el.hidden=true;el.textContent='';}}
async function writeAutosave(){
 const snapshot=serialize(false);
 try {await window.BoomifyStorage.saveProject(snapshot);}
 catch(e){console.error('Autosave IndexedDB:',e);showStorageWarning('Sauvegarde automatique indisponible. Utilise « ⇩ Projet » pour conserver ton travail et les samples.');}
 // Keep a tiny backward-compatible fallback; it does not include audio files.
 try{localStorage.setItem('boomify-browser-v1',JSON.stringify(snapshot));}catch(e){console.warn('LocalStorage indisponible:',e);}
}
function persistProject(){projectModified=true;clearTimeout(saveTimer);saveTimer=setTimeout(()=>{writeAutosave().catch(e=>{console.error(e);showStorageWarning('La sauvegarde automatique a échoué : exporte ton projet manuellement.');});},650);}

function markChange(coalesceKey=null){
 if(historyPresent){const now=Date.now(),merge=coalesceKey&&lastHistoryKey===coalesceKey&&now-lastHistoryTime<650;
  if(!merge){undoStack.push(historyPresent);if(undoStack.length>HISTORY_LIMIT)undoStack.shift();}
  historyPresent=historySnapshot();redoStack=[];lastHistoryKey=coalesceKey;lastHistoryTime=now;
  historyControls();}
 persistProject();
}
function applyHistory(snapshot){stop();const preferredSelection={...selection};project={...snapshot.project,tracks:snapshot.project.tracks.map(t=>({...t,clips:t.clips.map(c=>JSON.parse(JSON.stringify(c)))}))};selection=preferredSelection;
 if(!selectedTrack())selection={trackId:project.tracks[0]?.id||null,clipId:null};if(!selectedClip())selection.clipId=null;
 syncHeader();renderAll();persistProject();historyControls();}
function undoEdit(){if(!undoStack.length)return;redoStack.push(historyPresent);const prior=undoStack.pop();historyPresent=prior;lastHistoryKey=null;applyHistory(prior);toast('Modification annulée.');}
function redoEdit(){if(!redoStack.length)return;undoStack.push(historyPresent);const next=redoStack.pop();historyPresent=next;lastHistoryKey=null;applyHistory(next);toast('Modification rétablie.');}

function serialize(withAudio=true){return {version:1,name:project.name,bpm:project.bpm,bars:project.bars,master:project.master,tracks:project.tracks.map(({buffer,waveform,...t})=>({...t,sampleDataUrl:withAudio?t.sampleDataUrl:null,clips:t.clips.map(c=>JSON.parse(JSON.stringify(c)))}))};}
function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),3500);}
function download(name,data,mime){let blob=data instanceof Blob?data:new Blob([data],{type:mime});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);}
const slug=s=>(s||'boomify').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\w-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,60)||'boomify';
function selectedKind(){const t=selectedTrack();return t?.type||null;}
function renderAll(){renderTimeline();renderEditor();renderFx();renderSelectionActions();}
function renderTimeline(){const el=$('#timeline');el.style.setProperty('--bars',project.bars);let out=`<div class="ruler"><div class="ruler-label">PISTES / MESURES</div><div class="ruler-bars">${Array.from({length:project.bars},(_,i)=>`<div class="ruler-bar">${String(i+1).padStart(2,'0')}</div>`).join('')}</div></div>`;
for(let t of project.tracks){const isSelected=t.id===selection.trackId;out+=`<div class="track-row ${isSelected?'selected':''}" data-track="${t.id}"><div class="track-head"><div class="track-info"><span class="track-icon">${TYPE_ICON[t.type]}</span><input class="track-title" aria-label="Nom de la piste" data-name="${t.id}" value="${esc(t.name)}" maxlength="26"/><button title="Sélectionner la piste" class="mini" data-selecttrack="${t.id}">↳</button></div><div class="track-sub">${t.type==='audio'?(t.sampleName?esc(t.sampleName):'Aucun audio importé'):t.type==='drum'?'KICK • CLAP • HAT':t.inst.toUpperCase()}</div><div class="track-controls"><button class="mini ${t.mute?'active m':''}" data-mute="${t.id}" title="Mute">M</button><button class="mini ${t.solo?'active s':''}" data-solo="${t.id}" title="Solo">S</button><span style="font-size:10px;color:#8ea0b3">VOL</span><input class="vol" data-vol="${t.id}" type="range" min="0" max="100" value="${Math.round(t.vol*100)}" title="Volume de la piste"/></div></div><div class="track-lane" data-lane="${t.id}" style="width:calc(var(--barw) * ${project.bars})">${Array.from({length:project.bars},(_,i)=>`<div class="lane-bar" data-bar="${i}"></div>`).join('')}${t.clips.map(c=>renderClip(t,c)).join('')}<div class="playhead"></div></div></div>`;}
el.innerHTML=out;
if(playing)updatePlayhead();
}
function renderClip(t,c){const cls=trackColor(t);let info=t.type==='drum'?'BEAT':t.type==='audio'?'AUDIO':t.inst.toUpperCase();let preview='';if(t.type==='drum'){const hs=Array.from({length:16},(_,i)=>DRUMS.filter(d=>c.hits?.[d]?.[i]).length);preview=`<div class="clip-preview"><div class="clip-steps">${hs.map(n=>`<i style="height:${Math.max(2,n*8)}px;opacity:${n?.9:.15}"></i>`).join('')}</div></div>`;}else if(t.type==='synth'){let ns=c.notes||[];let ymin=Math.min(...ns.map(n=>n.pitch),48),ymax=Math.max(...ns.map(n=>n.pitch),60);let span=Math.max(12,ymax-ymin+2);preview=`<div class="clip-preview"><svg class="clip-svg" preserveAspectRatio="none" viewBox="0 0 160 38">${ns.map(n=>`<rect x="${n.step*10+1}" y="${Math.max(1,36-((n.pitch-ymin)/span)*32)}" width="${Math.max(5,(Math.min(16-n.step,n.length))*10-2)}" height="4" rx="1" fill="currentColor" opacity=".8"/>`).join('')}</svg></div>`;}else{preview=t.waveform?`<svg class="wave" viewBox="0 0 200 46" preserveAspectRatio="none"><path d="${t.waveform}" stroke="currentColor" fill="none" stroke-width="1.1" opacity=".65"/></svg>`:'<div class="clip-preview" style="font-size:10px;opacity:.7">♪ '+esc(t.sampleName||'Importer un son')+'</div>';}
return `<div class="clip ${cls} ${clipSelection.size?clipSelection.has(c.id)?'selected':'':c.id===selection.clipId?'selected':''}" draggable="true" data-clip="${c.id}" data-track="${t.id}" title="${esc(t.name)} • mesure ${c.start+1} • double-clic pour éditer" style="left:calc(var(--barw) * ${c.start} + 3px);width:calc(var(--barw) * ${c.bars} - 6px)"><div class="clip-top"><span>${info}</span><span class="clip-sub">${String(c.start+1).padStart(2,'0')}${c.bars>1?' → '+(c.start+c.bars):''}</span></div>${preview}</div>`;}
function renderSelectionActions(){
 const refs=selectedClipRefs(),count=refs.length;
 $('#duplicateClip').disabled=!count;
 $('#duplicateClip').textContent=count>1?'⧉ Dupliquer '+count+' clips':'⧉ Dupliquer →';
 $('#clearClip').disabled=count!==1||selectedKind()==='audio';
 $('#deleteClip').disabled=!count;
 $('#deleteClip').textContent=count>1?'✕ '+count+' clips':'✕ Clip';
 $('#copyClip').disabled=!count;
 $('#copyClips').disabled=!count;
 for(const id of ['pasteClip','pasteClips']){
  const btn=$('#'+id);
  btn.disabled=!clipClipboard;btn.classList.toggle('paste-active',pasteMode);
  btn.setAttribute('aria-pressed',String(pasteMode));
  btn.textContent=pasteMode?'⤵ Choisir une mesure':'⎘ Coller';
 }
 const status=$('#clipSelectionCount');
 status.textContent=count>1?count+' clips sélectionnés':'';
 status.hidden=count<=1;
 document.body.classList.toggle('paste-mode',pasteMode);
}
function renderEditor(){const t=selectedTrack(),c=selectedClip();const editor=$('#editor');$('#editorSubtitle').textContent=t?(t.name+' • '+(c?'mesure '+(c.start+1):'sélectionne ou crée un clip')):'Sélectionne une piste';if(!t){editor.innerHTML='<div class="no-selection">Ajoute une piste pour commencer.</div>';return;}if(t.type==='audio'){renderAudioEditor(t,c);return;}if(!c){editor.innerHTML=`<div class="no-selection">${esc(t.name)} : clique sur une mesure vide dans l'arrangement pour créer un clip ${t.type==='drum'?'de batterie':'MIDI'}.</div>`;return;}if(t.type==='drum')renderDrumEditor(c);else renderPianoEditor(t,c);}
function renderDrumEditor(c){let out=`<div class="editor-top"><div class="editor-meta">▦ DRUM SEQUENCER <span style="color:#93a6bd">/ 16 pas</span></div><div class="help">Clic : activer/désactiver • Maj + clic : accent fort</div></div><div class="grid-drums"><div class="drum-head"><div></div>${Array.from({length:16},(_,i)=>`<div class="step-num ${i%4===0?'beat':''}">${i+1}</div>`).join('')}</div>`;
for(const d of DRUMS){out+=`<div class="drum-row"><div class="drum-name">${DRUM_LABEL[d]}</div>${Array.from({length:16},(_,i)=>{let v=c.hits?.[d]?.[i]||0;return `<button aria-label="${DRUM_LABEL[d]} pas ${i+1}" class="drum-cell ${i%4===0?'beat':''} ${v?'on':''} ${v>=.95?'accent-hit':''}" data-hit="${d}" data-step="${i}" title="${DRUM_LABEL[d]} / ${i+1}"></button>`}).join('')}</div>`;}out+='</div><div class="hint">La batterie est synthétisée en temps réel : pas besoin de charger de fichiers. Tu peux importer tes propres sons sur une piste Audio.</div>';$('#editor').innerHTML=out;}
const midiName=p=>NAMES[p%12]+(Math.floor(p/12)-1);
function renderPianoEditor(t,c){const prevScroll=$('#pianoScroll');const viewKey=t.id+'|'+c.id;const scrollTop=(prevScroll&&pianoViewKey===viewKey)?prevScroll.scrollTop:null;$('#editor').innerHTML=`<div class="editor-top"><div class="editor-meta">♫ PIANO ROLL <span style="color:#93a6bd">/ ${esc(t.name)} • 1 mesure</span></div><div class="editor-actions"><label class="smalllabel" for="instSelect">Instrument</label><select id="instSelect"><option value="bass">Bass / Rave</option><option value="acid">Acid 303</option><option value="lead">Lead / Supersaw</option><option value="pluck">Pluck</option><option value="pad">Pad / Atmosphère</option></select><label class="smalllabel" for="noteLen">Longueur</label><select id="noteLen"><option value="1">1/16</option><option value="2">1/8</option><option value="4">1/4</option><option value="8">1/2</option><option value="16">1 mesure</option></select></div></div><div class="piano-wrap"><div class="piano-scroll" id="pianoScroll"><div class="piano-inner"><div class="piano-header"><div class="key-cap">NOTES</div><div class="beat-guides">${Array.from({length:16},(_,i)=>`<div>${i%4===0?Math.floor(i/4)+1:'.'}</div>`).join('')}</div></div><div class="piano-line" id="pianoLine"></div>${Array.from({length:60},(_,i)=>{let pitch=83-i;let isSharp=NAMES[pitch%12].includes('#');let root=pitch%12===0;return `<div class="piano-row ${isSharp?'sharp':''} ${root?'root':''}" data-row="${pitch}"><div class="piano-key" data-key="${pitch}">${midiName(pitch)}</div><div class="piano-gridrow" data-pitch="${pitch}">${Array.from({length:16},(_,s)=>`<div class="piano-cell" data-step="${s}"></div>`).join('')}${(c.notes||[]).filter(n=>n.pitch===pitch).map(n=>`<div class="piano-note" data-note="${c.notes.indexOf(n)}" title="${midiName(pitch)} • ${n.length} pas" style="left:${n.step/16*100}%;width:${Math.min(n.length,16-n.step)/16*100}%">${n.length>=3?midiName(pitch):''}<i class="note-resize" title="Redimensionner la note"></i></div>`).join('')}</div></div>`}).join('')}</div></div></div><div class="hint">Clique ou glisse pour dessiner une note. Déplace une note pour changer sa hauteur ou sa position. Tire sa poignée droite pour l'allonger. Clic droit sur une note pour la supprimer. Clique sur les touches à gauche pour l'écouter.</div>`;
$('#instSelect').value=t.inst;$('#noteLen').value=String(noteLength);const sc=$('#pianoScroll');const desired=t.inst==='bass'||t.inst==='acid'?42:t.inst==='pad'?54:62;const desiredIndex=83-desired;sc.scrollTop=scrollTop!==null?scrollTop:Math.max(0,desiredIndex*23-160);pianoViewKey=viewKey;if(playing)updatePlayhead();}
function renderAudioEditor(t,c){$('#editor').innerHTML=`<div class="editor-top"><div class="editor-meta">◉ PISTE AUDIO <span style="color:#93a6bd">/ Lecture de samples et stems</span></div><div class="editor-actions"><button class="btn small accent" id="chooseSample">↥ ${t.sampleName?'Remplacer le son':'Importer un WAV / MP3'}</button></div></div><div class="sample-area"><div class="sample-box"><div class="sample-drop" id="sampleDrop"><div><span style="font-size:34px;color:#d3b7ff">♫</span><br><b>${t.sampleName?esc(t.sampleName):'Glisse un fichier audio ici'}</b><br><span class="help">ou clique pour choisir un fichier (WAV, MP3, OGG, FLAC… selon navigateur)</span></div></div>${t.buffer?'<canvas class="sample-wave" id="sampleWave" width="850" height="105"></canvas>':''}</div><div class="sample-details"><b style="color:#c9baff">${t.buffer?'Audio prêt à être placé':'Aucun audio chargé'}</b><p>${t.buffer?'Durée : '+t.buffer.duration.toFixed(2)+' s • '+(t.buffer.sampleRate/1000).toFixed(1)+' kHz':'Importe un fichier, puis clique sur une mesure libre de cette piste pour le placer dans le morceau.'}</p><p>Le fichier est lu à sa vitesse d'origine : pas de time-stretch automatique pour cette première version.</p><p>${c?'Clip sélectionné, mesure '+(c.start+1)+', durée '+c.bars+' mesure(s).':'Aucun clip sélectionné.'}</p></div></div>`;if(t.buffer)drawWaveform(t);}
function renderFx(){const t=selectedTrack();if(!t){$('#fxStrip').innerHTML='';return;}$('#fxStrip').innerHTML=`<span class="smalllabel" style="color:#b3a1ff;margin-right:4px">03 / MIXER & FX</span><div class="control-group"><label for="fxVolume">Volume</label><input id="fxVolume" type="range" min="0" max="100" value="${Math.round(t.vol*100)}"/><span class="val" id="fxVolumeVal">${Math.round(t.vol*100)}%</span></div><div class="control-group"><label for="fxPan">Pan</label><input id="fxPan" type="range" min="-100" max="100" value="${Math.round(t.pan*100)}"/><span class="val" id="fxPanVal">${Math.round(t.pan*100)}</span></div><div class="control-group"><label for="fxCutoff">Filter</label><input id="fxCutoff" type="range" min="0" max="100" value="${Math.round(Math.log(t.cutoff/120)/Math.log(20000/120)*100)}"/><span class="val" id="fxCutoffVal">${Math.round(t.cutoff)} Hz</span></div><div class="control-group"><label for="fxDrive">Drive</label><input id="fxDrive" type="range" min="0" max="100" value="${Math.round(t.drive)}"/><span class="val" id="fxDriveVal">${t.drive}%</span></div><button class="btn small danger" id="removeTrack" style="margin-left:auto">Retirer piste</button>`;}
function drawWaveform(t){const canvas=$('#sampleWave');if(!canvas||!t.buffer)return;const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height,ch=t.buffer.getChannelData(0);c.clearRect(0,0,w,h);c.fillStyle='#12212f';c.fillRect(0,0,w,h);c.strokeStyle='#e3a5ce';c.lineWidth=1;for(let x=0;x<w;x++){let a=Math.floor(x/w*ch.length),b=Math.min(ch.length,Math.floor((x+1)/w*ch.length));let min=1,max=-1;let jump=Math.max(1,Math.floor((b-a)/40));for(let k=a;k<b;k+=jump){let v=ch[k];if(v<min)min=v;if(v>max)max=v;}c.beginPath();c.moveTo(x,h/2-min*h*.43);c.lineTo(x,h/2-max*h*.43);c.stroke();}}
function waveformPath(buffer){let ch=buffer.getChannelData(0),s=[];for(let x=0;x<200;x++){let a=Math.floor(x/200*ch.length),b=Math.min(ch.length,Math.floor((x+1)/200*ch.length));let max=0,step=Math.max(1,Math.floor((b-a)/18));for(let i=a;i<b;i+=step)max=Math.max(max,Math.abs(ch[i]));s.push(`M${x} ${23-max*20}L${x} ${23+max*20}`);}return s.join('');}
function selectedClipRefs(){
 const ids=new Set(clipSelection);
 let matches=project.tracks.flatMap(t=>t.clips.filter(c=>ids.has(c.id)).map(c=>({track:t,clip:c})));
 if(!matches.length&&selection.clipId)matches=project.tracks.flatMap(t=>t.clips.filter(c=>c.id===selection.clipId).map(c=>({track:t,clip:c})));
 return matches;
}
function selectClip(tid,cid,mode='single'){
 const refs=selectedClipRefs(),ids=new Set(refs.map(ref=>ref.clip.id));
 if(mode==='toggle'){
  if(ids.has(cid))ids.delete(cid);else ids.add(cid);
 }else if(mode==='range'){
  const anchor=selectedClip(),track=trackById(tid),target=track?.clips.find(c=>c.id===cid);
  if(anchor&&selection.trackId===tid&&target){
   const a=Math.min(anchor.start,target.start),b=Math.max(anchor.start,target.start);
   ids.clear();for(const c of track.clips)if(c.start>=a&&c.start<=b)ids.add(c.id);
  }else ids.add(cid);
 }else{ids.clear();if(cid)ids.add(cid);}
 clipSelection=ids;
 if(ids.has(cid)){selection={trackId:tid,clipId:cid};}
 else{const remaining=project.tracks.flatMap(t=>t.clips.filter(c=>ids.has(c.id)).map(c=>({tid:t.id,cid:c.id})))[0];
  selection=remaining?{trackId:remaining.tid,clipId:remaining.cid}:{trackId:tid,clipId:null};}
 renderAll();
}
function copySelectedClips(){
 const refs=selectedClipRefs();clipClipboard=window.BoomifyClipOps.buildClipboard(project.tracks,refs.map(x=>x.clip.id));
 if(!clipClipboard){toast('Sélectionne au moins un clip à copier.');return false;}
 pasteMode=false;renderSelectionActions();
 toast(clipClipboard.items.length+' clip(s) copié(s). Clique sur Coller puis choisis une mesure.');return true;
}
function setPasteMode(open){
 if(open&&!clipClipboard){toast('Commence par copier un ou plusieurs clips.');return;}
 pasteMode=!!open;renderSelectionActions();
 if(pasteMode)toast('Clique sur la mesure et la piste où coller. Échap pour annuler.');
}
function pasteGroupAt(group,row,start){
 const result=window.BoomifyClipOps.planPaste(group,project.tracks,row,start,project.bars);
 if(!result.ok){toast(result.reason);return false;}
 const inserted=[];
 for(const entry of result.insertions){
  const c={...entry.clip,id:uid()};
  trackById(entry.trackId).clips.push(c);
  inserted.push({trackId:entry.trackId,clipId:c.id});
 }
 clipSelection=new Set(inserted.map(x=>x.clipId));
 selection={trackId:inserted[0].trackId,clipId:inserted[0].clipId};
 pasteMode=false;markChange();renderAll();
 toast(inserted.length+' clip(s) collé(s) à partir de la mesure '+(start+1)+'.');return true;
}

function getLaneBar(lane,clientX){const rect=lane.getBoundingClientRect();return Math.max(0,Math.min(project.bars-1,Math.floor((clientX-rect.left)/(rect.width/project.bars))));}
function addTrack(type){const label=type==='drum'?'DRUM RACK':type==='audio'?'SAMPLE AUDIO':'NOUVEAU SYNTHÉ';const t=makeTrack(type,label);project.tracks.push(t);clipSelection.clear();selection={trackId:t.id,clipId:null};renderAll();markChange();toast('Piste ajoutée. Clique sur une mesure pour créer un clip.');}
function duplicateSelected(){const group=window.BoomifyClipOps.buildClipboard(project.tracks,selectedClipRefs().map(x=>x.clip.id));if(!group)return;pasteGroupAt(group,group.anchorRow,group.maxEnd);}
function deleteSelected(){const refs=selectedClipRefs();if(!refs.length)return;if(refs.length>1&&!confirm('Supprimer les '+refs.length+' clips sélectionnés ?'))return;const ids=new Set(refs.map(x=>x.clip.id));for(const t of project.tracks)t.clips=t.clips.filter(c=>!ids.has(c.id));clipSelection.clear();selection.clipId=null;markChange();renderAll();}
function clearSelected(){const t=selectedTrack(),c=selectedClip();if(!c||!t)return;if(t.type==='drum')c.hits=freshHits();else if(t.type==='synth')c.notes=[];markChange();renderAll();}

// Audio: all scheduling uses the AudioContext clock, not setTimeout timing.
function makeDistortion(k){const n=1024,curve=new Float32Array(n),amount=k/100*160;for(let i=0;i<n;i++){let x=i*2/(n-1)-1;curve[i]=amount?(3+amount)*x*20*Math.PI/180/(Math.PI+amount*Math.abs(x)):x;}return curve;}
function createNetwork(ac){const master=ac.createGain();master.gain.value=project.master;const compressor=ac.createDynamicsCompressor();compressor.threshold.value=-13;compressor.knee.value=15;compressor.ratio.value=4;compressor.attack.value=.003;compressor.release.value=.18;master.connect(compressor);let analyser=null;if(ac.createAnalyser){analyser=ac.createAnalyser();analyser.fftSize=1024;compressor.connect(analyser);analyser.connect(ac.destination);}else compressor.connect(ac.destination);
const nodes=new Map();const anySolo=project.tracks.some(t=>t.solo);for(const t of project.tracks){let input=ac.createGain(),filter=ac.createBiquadFilter(),shaper=ac.createWaveShaper(),pan=ac.createStereoPanner(),gain=ac.createGain();filter.type='lowpass';filter.frequency.value=Math.min(20000,Math.max(120,t.cutoff));filter.Q.value=.8;shaper.curve=makeDistortion(t.drive);shaper.oversample='2x';pan.pan.value=t.pan;gain.gain.value=(t.mute||(anySolo&&!t.solo))?0:t.vol;input.connect(filter);filter.connect(shaper);shaper.connect(pan);pan.connect(gain);gain.connect(master);nodes.set(t.id,{input,filter,shaper,pan,gain});}
return{master,compressor,analyser,nodes,noise:null};}
function makeNoise(ac,network){if(network.noise)return network.noise;let b=ac.createBuffer(1,ac.sampleRate,ac.sampleRate);let d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;network.noise=b;return b;}
function makeEnv(ac,input,t,a,d,s,r,duration,velocity=1){const g=ac.createGain();g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(Math.max(.0001,velocity),t+Math.max(.001,a));g.gain.exponentialRampToValueAtTime(Math.max(.0001,velocity*s),t+Math.max(.001,a+d));g.gain.setValueAtTime(Math.max(.0001,velocity*s),t+Math.max(a+d,duration));g.gain.exponentialRampToValueAtTime(.0001,t+Math.max(a+d,duration)+r);g.connect(input);return g;}
function playSynth(ac,dest,when,pitch,dur,inst='lead',vel=.8){const hz=440*2**((pitch-69)/12);const pad=inst==='pad',bass=inst==='bass',acid=inst==='acid',pluck=inst==='pluck';const attack=pad?.14:pluck?.003:.006,decay=pad?.2:pluck?.18:.12,sustain=pluck?.12:pad?.65:acid?.65:.72,release=pad?.35:pluck?.1:.12;const d=Math.max(.045,dur*.9);const filter=ac.createBiquadFilter();filter.type='lowpass';filter.Q.value=acid?12:bass?2:.9;filter.frequency.setValueAtTime(acid?550:bass?1100:pluck?2800:pad?2300:4200,when);if(acid){filter.frequency.exponentialRampToValueAtTime(2800,when+.05);filter.frequency.exponentialRampToValueAtTime(430,when+Math.min(.3,d+.06));}filter.connect(makeEnv(ac,dest,when,attack,decay,sustain,release,d,vel*(pad?.23:bass?.25:acid?.23:.19)));
const oscs=bass?[["sawtooth",-5,.5],["square",5,.34]]:acid?[["sawtooth",0,.8]]:pluck?[["triangle",0,.7],["sawtooth",7,.17]]:pad?[["sawtooth",-8,.3],["sawtooth",9,.3],["triangle",0,.25]]:[["sawtooth",-8,.32],["sawtooth",8,.32],["triangle",0,.22]];
for(let [type,detune,level] of oscs){const osc=ac.createOscillator(),v=ac.createGain();osc.type=type;osc.frequency.setValueAtTime(hz,when);osc.detune.value=detune;v.gain.value=level;osc.connect(v);v.connect(filter);osc.start(when);osc.stop(when+d+release+.03);}}
function playDrum(ac,dest,network,when,kind,vel){if(kind==='kick'){let o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.setValueAtTime(165,when);o.frequency.exponentialRampToValueAtTime(45,when+.16);g.gain.setValueAtTime(Math.max(.0001,.72*vel),when);g.gain.exponentialRampToValueAtTime(.0001,when+.36);o.connect(g);g.connect(dest);o.start(when);o.stop(when+.38);return;}
const noise=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain(),open=kind==='open',clap=kind==='clap';noise.buffer=makeNoise(ac,network);f.type=clap?'bandpass':'highpass';f.frequency.value=clap?1600:open?5000:6500;f.Q.value=.7;let length=clap?.23:open?.43:.075;g.gain.setValueAtTime(Math.max(.0001,(clap?.35:.22)*vel),when);if(clap){g.gain.exponentialRampToValueAtTime(.018,when+.035);g.gain.setValueAtTime(.2*vel,when+.06);g.gain.exponentialRampToValueAtTime(.0001,when+.23);}else g.gain.exponentialRampToValueAtTime(.0001,when+length);noise.connect(f);f.connect(g);g.connect(dest);noise.start(when);noise.stop(when+length+.02);}
function playMetro(ac,dest,when,high){let o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.value=high?1200:850;g.gain.setValueAtTime(.06,when);g.gain.exponentialRampToValueAtTime(.0001,when+.045);o.connect(g);g.connect(dest);o.start(when);o.stop(when+.05);}
function scheduleStep(ac,network,absStep,time,withMetro=false){let songStep=absStep%(project.bars*16),bar=Math.floor(songStep/16),step=songStep%16,dt=stepSec();
if(withMetro&&step%4===0)playMetro(ac,network.master,time,step===0);
for(const t of project.tracks){const dest=network.nodes.get(t.id)?.input;if(!dest)continue;const c=t.clips.find(c=>bar>=c.start&&bar<c.start+c.bars);if(!c)continue;if(t.type==='drum'){for(const d of DRUMS){const vel=c.hits?.[d]?.[step]||0;if(vel)playDrum(ac,dest,network,time,d,vel);}}else if(t.type==='synth'){for(const n of (c.notes||[])){if(n.step===step)playSynth(ac,dest,time,n.pitch,n.length*dt,t.inst,n.velocity||.8);}}else if(t.buffer&&step===0&&bar===c.start){const source=ac.createBufferSource();source.buffer=t.buffer;source.connect(dest);source.start(time);const playable=Math.min(t.buffer.duration,c.bars*16*dt,(project.bars-bar)*16*dt);source.stop(time+Math.max(.001,playable));}}
}
function start(){if(playing)return;try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio){toast('Ce navigateur ne prend pas en charge Web Audio.');return;}ctx=new Audio({latencyHint:'interactive'});ctx.resume();liveNetwork=createNetwork(ctx);stepCounter=0;nextNoteTime=ctx.currentTime+.11;playStart=nextNoteTime;playing=true;$('#engineStatus').textContent='● LECTURE';$('#playBtn').textContent='❚❚ STOP';$('#playBtn').classList.add('is-on');tick();playInterval=setInterval(tick,22);animate();}catch(e){console.error(e);toast('Lecture indisponible : '+e.message);stop();}}
function tick(){if(!playing||!ctx)return;let lookAhead=ctx.currentTime+.14;while(nextNoteTime<lookAhead){if(!looping&&stepCounter>=project.bars*16){stop();return;}scheduleStep(ctx,liveNetwork,stepCounter,nextNoteTime,metronome);nextNoteTime+=stepSec();stepCounter++;}}
function stop(){playing=false;if(playInterval)clearInterval(playInterval);playInterval=null;if(rafId)cancelAnimationFrame(rafId);rafId=0;const old=ctx;ctx=null;liveNetwork=null;if(old){try{old.close();}catch(e){}}$('#playBtn').textContent='▶ LIRE';$('#playBtn').classList.remove('is-on');$('#engineStatus').textContent='● PRÊT';$('#counter').textContent='01:1';$('#meterFill').style.width='0%';document.querySelectorAll('.playhead,.piano-line').forEach(x=>x.style.display='none');document.querySelectorAll('.drum-cell.playstep').forEach(x=>x.classList.remove('playstep'));}
function currentPlayStep(){if(!ctx)return 0;const elapsed=Math.max(0,ctx.currentTime-playStart);return Math.floor(elapsed/stepSec())%(project.bars*16);}
function updatePlayhead(){if(!playing)return;let e=Math.max(0,ctx.currentTime-playStart),step=e/stepSec(),length=project.bars*16;let normalized=looping?step%length:Math.min(length,step);const bar=Math.floor(normalized/16),s=Math.floor(normalized%16);$('#counter').textContent=String(bar+1).padStart(2,'0')+':'+(Math.floor(s/4)+1);document.querySelectorAll('.track-lane .playhead').forEach(x=>{x.style.display='block';x.style.left=(normalized/length*100)+'%';});let pn=$('#pianoLine');if(pn){pn.style.display='block';pn.style.left='calc(70px + (100% - 70px) * '+((s+(normalized%1))/16)+')';}document.querySelectorAll('.drum-cell.playstep').forEach(x=>x.classList.remove('playstep'));document.querySelectorAll(`.drum-cell[data-step="${s}"]`).forEach(x=>x.classList.add('playstep'));
if(liveNetwork?.analyser){liveNetwork.analyser.getByteTimeDomainData(scopeRead);let v=0;for(let x of scopeRead)v+=(x-128)**2;$('#meterFill').style.width=Math.min(100,Math.sqrt(v/scopeRead.length)/.7)+'%';}}
function animate(){if(!playing)return;updatePlayhead();rafId=requestAnimationFrame(animate);}
async function preview(pitch){try{const A=window.AudioContext||window.webkitAudioContext;const ac=new A();await ac.resume();let gain=ac.createGain();gain.gain.value=.8;gain.connect(ac.destination);playSynth(ac,gain,ac.currentTime+.025,pitch,stepSec()*2,selectedTrack()?.inst||'lead',.85);setTimeout(()=>ac.close().catch(()=>{}),1300);}catch(e){toast('Préécoute audio impossible.');}}
async function decodeAudio(data){const A=window.AudioContext||window.webkitAudioContext;if(!A)throw Error('Web Audio API non disponible');let ac=new A();try{return await ac.decodeAudioData(data.slice(0));}finally{ac.close().catch(()=>{});}}
async function useAudioFile(file,tid,startAt=null){if(!file)return;if(!file.type.startsWith('audio/')&&!/\.(wav|mp3|ogg|flac|m4a|aac|opus)$/i.test(file.name)){toast('Sélectionne un fichier audio valide.');return;}const t=trackById(tid);if(!t||t.type!=='audio')return;if(file.size>120*1024*1024){toast('Fichier volumineux : limite de 120 Mo pour cette version.');return;}$('#loaderText').textContent='Décodage du fichier audio...';$('#loader').style.display='flex';try{const arr=await file.arrayBuffer();const buffer=await decodeAudio(arr);let reader=new FileReader();const dataUrl=await new Promise((resolve,reject)=>{reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});const newSampleId=uid();
 try{await window.BoomifyStorage.saveSample(newSampleId,file);t.sampleId=newSampleId;}
 catch(e){console.error('Enregistrement du sample:',e);t.sampleId=null;showStorageWarning('Sample importé mais NON sauvegardé automatiquement. Exporte le projet via « ⇩ Projet » pour ne pas perdre cet audio.');}
 t.buffer=buffer;t.sampleDataUrl=dataUrl;t.sampleName=file.name;t.waveform=waveformPath(buffer);if(t.clips.length){for(let c of t.clips)c.bars=Math.max(1,Math.min(project.bars-c.start,Math.ceil(buffer.duration/barSec())));}if(startAt!==null){t.clips=[];let c=addClip(t,startAt);selection={trackId:t.id,clipId:c?.id||null};}markChange();renderAll();clearMissingSampleWarning();toast('Audio chargé : '+file.name);}catch(e){console.error(e);toast('Impossible de décoder : '+e.message);}finally{$('#loader').style.display='none';$('#audioFile').value='';}}
async function saveWav(){if(playing)stop();const Audio=window.OfflineAudioContext||window.webkitOfflineAudioContext;if(!Audio){toast('Export audio non pris en charge dans ce navigateur.');return;}$('#loaderText').textContent='Rendu WAV hors ligne...';$('#loader').style.display='flex';await new Promise(r=>setTimeout(r,75));try{const rate=44100,duration=totalSec(),samples=Math.ceil(duration*rate);if(samples>rate*130){throw Error('Projet trop long pour cette version.');}const ac=new Audio(2,samples,rate);const network=createNetwork(ac);for(let s=0;s<project.bars*16;s++)scheduleStep(ac,network,s,s*stepSec(),false);const rendered=await ac.startRendering();$('#loaderText').textContent='Encodage du fichier...';await new Promise(r=>setTimeout(r,50));download(slug(project.name)+'.wav',audioBufferToWav(rendered),'audio/wav');toast('Export WAV terminé ('+duration.toFixed(1)+' s).');}catch(e){console.error(e);toast('Erreur export WAV : '+e.message);}finally{$('#loader').style.display='none';}}
function audioBufferToWav(b){let n=b.length,bytes=44+n*4,arr=new ArrayBuffer(bytes),dv=new DataView(arr),left=b.getChannelData(0),right=b.numberOfChannels>1?b.getChannelData(1):left;let off=0;const str=s=>{for(let c of s)dv.setUint8(off++,c.charCodeAt(0));},u16=v=>{dv.setUint16(off,v,true);off+=2;},u32=v=>{dv.setUint32(off,v,true);off+=4;};str('RIFF');u32(bytes-8);str('WAVE');str('fmt ');u32(16);u16(1);u16(2);u32(b.sampleRate);u32(b.sampleRate*4);u16(4);u16(16);str('data');u32(n*4);for(let i=0;i<n;i++){let a=Math.max(-1,Math.min(1,left[i]));let c=Math.max(-1,Math.min(1,right[i]));dv.setInt16(off,a<0?a*32768:a*32767,true);off+=2;dv.setInt16(off,c<0?c*32768:c*32767,true);off+=2;}return new Blob([arr],{type:'audio/wav'});}
async function openProject(file){if(!file)return;stop();$('#loaderText').textContent='Ouverture du projet...';$('#loader').style.display='flex';try{let p=JSON.parse(await file.text());if(!p||p.version!==1||!Array.isArray(p.tracks))throw Error('Format de projet non reconnu');if(p.tracks.length>70)throw Error('Trop de pistes');project={name:p.name||'Projet importé',bpm:Math.max(50,Math.min(240,+p.bpm||150)),bars:[8,16,32,64].includes(+p.bars)?+p.bars:8,master:Math.max(0,Math.min(1,+p.master||.78)),tracks:p.tracks.map(t=>({...makeTrack(t.type||'synth',t.name,t.inst),...t,buffer:null,waveform:null,clips:Array.isArray(t.clips)?t.clips:[]}))};for(let t of project.tracks){if(t.type==='audio'&&t.sampleDataUrl){try{let res=await fetch(t.sampleDataUrl);const audioData=await res.blob();t.buffer=await decodeAudio(await audioData.arrayBuffer());t.waveform=waveformPath(t.buffer);
 t.sampleId=uid();try{await window.BoomifyStorage.saveSample(t.sampleId,audioData);}catch(error){console.error(error);t.sampleId=null;showStorageWarning('Impossible de conserver les samples importés pour la restauration automatique. Exporte le projet manuellement.');}}catch(e){console.error(e);toast('Un sample du projet n’a pas pu être restauré.');}}}selection={trackId:project.tracks[0]?.id||null,clipId:project.tracks[0]?.clips[0]?.id||null};clipSelection.clear();clipClipboard=null;pasteMode=false;syncHeader();renderAll();markChange();clearMissingSampleWarning();toast('Projet ouvert : '+project.name);}catch(e){console.error(e);toast('Impossible de charger le projet : '+e.message);}finally{$('#loader').style.display='none';$('#projectFile').value='';}}
function audioBlobToDataUrl(blob){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error||new Error('Impossible de lire le sample'));reader.readAsDataURL(blob);});}
async function autosaveRestore(){
 let p=null;
 try {p=await window.BoomifyStorage.loadProject();}
 catch(error){console.error('Stockage local:',error);showStorageWarning('Le stockage automatique du navigateur est indisponible. Utilise « ⇩ Projet » pour conserver ton travail.');}
 if(!p){try{p=JSON.parse(localStorage.getItem('boomify-browser-v1')||'null');}catch(e){console.warn('Ancien autosave invalide',e);}}
 if(!p||p.version!==1||!Array.isArray(p.tracks))return false;
 try{
  project={name:p.name||'Projet restauré',bpm:p.bpm||150,bars:p.bars||8,master:p.master??.78,tracks:p.tracks.map(t=>({...makeTrack(t.type,t.name,t.inst),...t,buffer:null,waveform:null,clips:t.clips||[]}))};
  const missing=[];
  for(const t of project.tracks){if(t.type!=='audio'||!t.sampleName)continue;
   try{
    let blob=t.sampleId?await window.BoomifyStorage.loadSample(t.sampleId):null;
    if(!blob&&t.sampleDataUrl){const response=await fetch(t.sampleDataUrl);blob=await response.blob();}
    if(!blob){missing.push(t.name+' ('+t.sampleName+')');continue;}
    t.buffer=await decodeAudio(await blob.arrayBuffer());t.waveform=waveformPath(t.buffer);t.sampleDataUrl=await audioBlobToDataUrl(blob);
   }catch(error){console.error('Restauration du sample:',error);missing.push(t.name+' ('+t.sampleName+')');}
  }
  selection={trackId:project.tracks[0]?.id||null,clipId:project.tracks[0]?.clips[0]?.id||null};
  if(missing.length)showStorageWarning('Des samples manquent après restauration : '+missing.join(', ')+'. Réimporte ces fichiers, puis utilise « ⇩ Projet » pour créer une sauvegarde complète.');
  return true;
 }catch(e){console.error('Autosave non restaurable:',e);showStorageWarning('Projet automatique illisible. Vérifie tes sauvegardes manuelles.');return false;}
}
// Global events
$('#undoBtn').addEventListener('click',undoEdit);$('#redoBtn').addEventListener('click',redoEdit);
$('#playBtn').addEventListener('click',()=>playing?stop():start());$('#stopBtn').addEventListener('click',stop);$('#loopBtn').addEventListener('click',()=>{looping=!looping;$('#loopBtn').classList.toggle('is-on',looping);toast(looping?'Boucle activée':'Lecture unique activée');});$('#metroBtn').addEventListener('click',()=>{metronome=!metronome;const btn=$('#metroBtn');btn.classList.toggle('is-on',metronome);btn.setAttribute('aria-pressed',String(metronome));btn.setAttribute('aria-label',metronome?'Désactiver le métronome':'Activer le métronome');btn.title=metronome?'Désactiver le métronome':'Activer le métronome';toast(metronome?'Métronome activé':'Métronome désactivé');});
$('#bpm').addEventListener('change',e=>{let n=Math.max(50,Math.min(240,Math.round(+e.target.value||150)));if(n===project.bpm){e.target.value=n;return;}if(playing)stop();project.bpm=n;e.target.value=n;renderAll();markChange();});$('#bars').addEventListener('change',e=>{const n=+e.target.value;if(n===project.bars)return;if(n<project.bars&&project.tracks.some(t=>t.clips.some(c=>c.start+c.bars>n))&&!confirm('Réduire l’arrangement supprimera ou raccourcira certains clips. Continuer ?')){e.target.value=project.bars;return;}if(playing)stop();project.bars=n;for(const t of project.tracks)t.clips=t.clips.filter(c=>c.start<n).map(c=>({...c,bars:Math.min(c.bars,n-c.start)}));if(!selectedClip())selection.clipId=null;renderAll();markChange();});$('#projectName').addEventListener('input',e=>{project.name=e.target.value;markChange('project-name');});$('#masterVol').addEventListener('input',e=>{project.master=+e.target.value/100;if(liveNetwork)liveNetwork.master.gain.value=project.master;markChange('master-volume');});
$('#saveBtn').addEventListener('click',()=>{download(slug(project.name)+'.boomify.json',JSON.stringify(serialize(true),null,2),'application/json');projectModified=false;toast('Projet enregistré (avec les samples).');});$('#loadBtn').addEventListener('click',()=>$('#projectFile').click());$('#projectFile').addEventListener('change',e=>openProject(e.target.files[0]));$('#exportBtn').addEventListener('click',saveWav);$('#newBtn').addEventListener('click',()=>$('#newModal').style.display='flex');$('#cancelNew').addEventListener('click',()=>$('#newModal').style.display='none');$('#confirmNew').addEventListener('click',()=>{$('#newModal').style.display='none';emptyProject();});$('#newModal').addEventListener('click',e=>{if(e.target.id==='newModal')e.currentTarget.style.display='none';});

const VIEW_PREFS_KEY='boomify-ui-prefs-v1';
const DEFAULT_VIEW={scale:100,compact:false,timelineZoom:120,editorVisible:true};
let viewPrefs={...DEFAULT_VIEW};
try{const saved=JSON.parse(localStorage.getItem(VIEW_PREFS_KEY)||'null');if(saved&&typeof saved==='object')viewPrefs={...viewPrefs,...saved};}catch(_){}
function storeViewPrefs(){try{localStorage.setItem(VIEW_PREFS_KEY,JSON.stringify(viewPrefs));}catch(_){}}
function setViewMenu(open){$('#viewMenu').hidden=!open;$('#viewBtn').setAttribute('aria-expanded',String(open));if(open)setLibraryVisible(false);}
function applyViewPrefs(){
 const scale=[80,90,100,110,125].includes(+viewPrefs.scale)?+viewPrefs.scale:100;
 viewPrefs.scale=scale;
 document.body.style.zoom=String(scale/100);
 $('#uiScale').value=String(scale);
 const compact=!!viewPrefs.compact;document.body.classList.toggle('compact-view',compact);
 $('#compactBtn').setAttribute('aria-pressed',String(compact));
 $('#compactBtn').textContent=compact?'◧ Mode compact : activé':'◫ Mode compact : désactivé';
 const timelineZoom=Math.min(220,Math.max(80,Number(viewPrefs.timelineZoom)||120));
 viewPrefs.timelineZoom=timelineZoom;$('#timelineZoom').value=String(timelineZoom);
 document.documentElement.style.setProperty('--barw',timelineZoom+'px');
 setEditorVisible(viewPrefs.editorVisible!==false);
}
function restoreDefaultView(){viewPrefs={...DEFAULT_VIEW};applyViewPrefs();storeViewPrefs();toast('Affichage réinitialisé.');}
function syncFullscreenControl(){const active=!!document.fullscreenElement;$('#fullscreenBtn').setAttribute('aria-pressed',String(active));$('#fullscreenBtn').textContent=active?'⤢ Quitter le plein écran':'⛶ Plein écran';document.body.classList.toggle('fullscreen-view',active);}
async function toggleFullscreen(){
 try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else toast('Plein écran non disponible dans ce navigateur.');}
 catch(_){toast('Plein écran refusé. Essaie depuis le site en HTTPS.');}
}
$('#viewBtn').addEventListener('click',()=>setViewMenu($('#viewMenu').hidden));
$('#uiScale').addEventListener('change',e=>{viewPrefs.scale=Number(e.target.value);applyViewPrefs();storeViewPrefs();});
$('#compactBtn').addEventListener('click',()=>{viewPrefs.compact=!viewPrefs.compact;applyViewPrefs();storeViewPrefs();});
$('#resetViewBtn').addEventListener('click',restoreDefaultView);
$('#fullscreenBtn').addEventListener('click',toggleFullscreen);
document.addEventListener('fullscreenchange',syncFullscreenControl);
document.addEventListener('click',e=>{if(!e.target.closest('.view-wrap'))setViewMenu(false);});
function setLibraryVisible(open){const menu=$('#libraryMenu');menu.hidden=!open;$('#libraryBtn').setAttribute('aria-expanded',String(open));}
function setEditorVisible(open){editorVisible=open;$('#editorWorkspace').hidden=!open;$('#toggleEditor').textContent=open?'Masquer l’éditeur':'Afficher l’éditeur';$('#toggleEditor').setAttribute('aria-expanded',String(open));}
$('#copyClip').addEventListener('click',copySelectedClips);$('#copyClips').addEventListener('click',copySelectedClips);
$('#pasteClip').addEventListener('click',()=>setPasteMode(!pasteMode));$('#pasteClips').addEventListener('click',()=>setPasteMode(!pasteMode));
$('#libraryBtn').addEventListener('click',()=>setLibraryVisible($('#libraryMenu').hidden));
document.addEventListener('click',e=>{if(!e.target.closest('.library-wrap'))setLibraryVisible(false);});
$('#toggleEditor').addEventListener('click',()=>{setEditorVisible(!editorVisible);viewPrefs.editorVisible=editorVisible;storeViewPrefs();});
$('#timelineZoom').addEventListener('input',e=>{viewPrefs.timelineZoom=+e.target.value;document.documentElement.style.setProperty('--barw',`${viewPrefs.timelineZoom}px`);storeViewPrefs();});
$('#addDrum').addEventListener('click',()=>addTrack('drum'));$('#addSynth').addEventListener('click',()=>addTrack('synth'));$('#addAudio').addEventListener('click',()=>addTrack('audio'));$('#libraryMenu').addEventListener('click',e=>{if(e.target.closest('#addDrum,#addSynth,#addAudio'))setLibraryVisible(false);});$('#duplicateClip').addEventListener('click',duplicateSelected);$('#deleteClip').addEventListener('click',deleteSelected);$('#clearClip').addEventListener('click',clearSelected);
$('#timeline').addEventListener('click',e=>{
 const target=e.target,lane=target.closest('.track-lane');
 if(pasteMode&&lane){const row=project.tracks.findIndex(t=>t.id===lane.dataset.lane);pasteGroupAt(clipClipboard,row,getLaneBar(lane,e.clientX));return;}
 const mute=target.closest('[data-mute]'),solo=target.closest('[data-solo]'),sel=target.closest('[data-selecttrack]');
 if(mute||solo){const t=trackById((mute||solo).dataset[mute?'mute':'solo']);if(!t)return;if(mute)t.mute=!t.mute;else t.solo=!t.solo;syncNetwork();renderTimeline();markChange();return;}
 if(sel){const t=trackById(sel.dataset.selecttrack);selectClip(t.id,t.clips[0]?.id||null);return;}
 if(target.closest('input'))return;
 const clip=target.closest('.clip');
 if(clip){selectClip(clip.dataset.track,clip.dataset.clip,e.ctrlKey||e.metaKey?'toggle':e.shiftKey?'range':'single');return;}
 if(lane){const t=trackById(lane.dataset.lane),bar=getLaneBar(lane,e.clientX);if(!t)return;
  if(e.ctrlKey||e.metaKey||e.shiftKey)return;
  const existing=t.clips.find(c=>bar>=c.start&&bar<c.start+c.bars);
  if(existing){selectClip(t.id,existing.id);return;}
  const c=addClip(t,bar);if(c)selectClip(t.id,c.id);
 }
});
$('#timeline').addEventListener('dblclick',e=>{const clip=e.target.closest('.clip');if(!clip)return;selectClip(clip.dataset.track,clip.dataset.clip);setEditorVisible(true);$('#editorSection').scrollIntoView({behavior:'smooth',block:'nearest'});toast('Clip ouvert dans l’éditeur.');});
$('#timeline').addEventListener('change',e=>{if(e.target.matches('.track-title')){let t=trackById(e.target.dataset.name);t.name=e.target.value.slice(0,26)||'Piste';markChange();renderAll();}});
$('#timeline').addEventListener('input',e=>{if(e.target.matches('[data-vol]')){let t=trackById(e.target.dataset.vol);t.vol=+e.target.value/100;syncNetwork();if(selection.trackId===t.id){let fx=$('#fxVolume');if(fx){fx.value=+e.target.value;$('#fxVolumeVal').textContent=e.target.value+'%';}}markChange('track-volume-'+t.id);}});
$('#timeline').addEventListener('dragstart',e=>{let el=e.target.closest('.clip');if(!el)return;dragState={tid:el.dataset.track,cid:el.dataset.clip};e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain','boomify-clip');});$('#timeline').addEventListener('dragover',e=>{if(e.target.closest('.track-lane')){e.preventDefault();e.dataTransfer.dropEffect='move';}});
$('#timeline').addEventListener('drop',e=>{let lane=e.target.closest('.track-lane');if(!lane)return;e.preventDefault();if(e.dataTransfer.files?.length){const t=trackById(lane.dataset.lane);if(t?.type==='audio'){loadTrackId=t.id;useAudioFile(e.dataTransfer.files[0],t.id,getLaneBar(lane,e.clientX));}else toast('Dépose ton fichier sur une piste Audio.');dragState=null;return;}if(!dragState)return;const t=trackById(dragState.tid),c=t?.clips.find(x=>x.id===dragState.cid);if(!t||!c||t.id!==lane.dataset.lane){toast('Le déplacement entre pistes n’est pas encore disponible.');dragState=null;return;}const newStart=getLaneBar(lane,e.clientX);if(newStart+c.bars<=project.bars&&!t.clips.some(x=>x.id!==c.id&&newStart<x.start+x.bars&&newStart+c.bars>x.start)){c.start=newStart;clipSelection=new Set([c.id]);selection={trackId:t.id,clipId:c.id};renderAll();markChange();}else toast('Emplacement indisponible.');dragState=null;});$('#timeline').addEventListener('dragend',()=>dragState=null);
$('#editor').addEventListener('click',e=>{const hit=e.target.closest('[data-hit]');if(hit){const c=selectedClip();if(!c)return;let d=hit.dataset.hit,s=+hit.dataset.step,old=c.hits[d][s];c.hits[d][s]=e.shiftKey?(old>=.95?0:1):(old?0:.75);markChange();renderTimeline();renderDrumEditor(c);return;}const key=e.target.closest('[data-key]');if(key){preview(+key.dataset.key);return;}if(e.target.closest('#chooseSample')||e.target.closest('#sampleDrop')){loadTrackId=selection.trackId;$('#audioFile').click();return;}});
$('#editor').addEventListener('change',e=>{if(e.target.id==='instSelect'){let t=selectedTrack();t.inst=e.target.value;markChange();renderAll();}if(e.target.id==='noteLen')noteLength=+e.target.value;});
let drawing=null,noteDrag=null;
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
$('#editor').addEventListener('pointerdown',e=>{
 if(e.button!==0&&e.button!==2)return;
 const note=e.target.closest('.piano-note:not(.ghost)');
 if(note){
  const clip=selectedClip(),index=Number(note.dataset.note),n=clip?.notes?.[index];if(!n)return;
  if(e.button===2){clip.notes.splice(index,1);markChange();renderTimeline();renderPianoEditor(selectedTrack(),clip);e.preventDefault();return;}
  const grid=note.closest('.piano-gridrow');noteDrag={element:note,grid,pointerId:e.pointerId,index,startX:e.clientX,startY:e.clientY,original:{...n},resize:!!e.target.closest('.note-resize'),step:n.step,pitch:n.pitch,length:n.length};
  e.preventDefault();note.setPointerCapture(e.pointerId);note.classList.add('dragging');return;
 }
 if(e.button!==0)return;
 const target=e.target.closest('.piano-cell');if(!target)return;
 const grid=target.closest('.piano-gridrow');if(!grid)return;
 const pitch=+grid.dataset.pitch,start=+target.dataset.step;
 drawing={pitch,start,end:start,grid,pointerId:e.pointerId};e.preventDefault();grid.setPointerCapture(e.pointerId);showGhost();
});
function showGhost(){if(!drawing)return;let {grid,start,end}=drawing;grid.querySelector('.piano-note.ghost')?.remove();const ghost=document.createElement('div');ghost.className='piano-note ghost';ghost.style.left=(start/16*100)+'%';ghost.style.width=(Math.max(1,end-start+1)/16*100)+'%';grid.appendChild(ghost);}
$('#editor').addEventListener('pointermove',e=>{
 if(noteDrag){const d=noteDrag,stepWidth=d.grid.getBoundingClientRect().width/16;
  const deltaSteps=Math.round((e.clientX-d.startX)/stepWidth);
  if(d.resize){d.length=clamp(d.original.length+deltaSteps,1,16-d.original.step);d.element.style.width=d.length/16*100+'%';}
  else{d.step=clamp(d.original.step+deltaSteps,0,16-d.original.length);d.pitch=clamp(d.original.pitch+Math.round((d.startY-e.clientY)/23),24,83);d.element.style.left=d.step/16*100+'%';d.element.style.transform=`translateY(${(d.original.pitch-d.pitch)*23}px)`;}
  return;
 }
 if(!drawing)return;const r=drawing.grid.getBoundingClientRect();const step=Math.floor((e.clientX-r.left)/r.width*16);drawing.end=clamp(Math.max(drawing.start,step),drawing.start,15);showGhost();
});
function finishEdit(e){
 if(noteDrag){const d=noteDrag;noteDrag=null;try{d.element.releasePointerCapture(d.pointerId);}catch(_){}
  const c=selectedClip(),n=c?.notes?.[d.index];if(n){n.pitch=d.pitch;n.step=d.step;n.length=d.length;markChange();renderTimeline();renderPianoEditor(selectedTrack(),c);}return;
 }
 if(!drawing)return;const {pitch,start,end,grid}=drawing;drawing=null;try{grid.releasePointerCapture(e.pointerId);}catch(_){}grid.querySelector('.ghost')?.remove();const len=end===start?noteLength:end-start+1;const c=selectedClip();if(c){c.notes.push({pitch,step:start,length:Math.min(len,16-start),velocity:.85});markChange();renderTimeline();renderPianoEditor(selectedTrack(),c);preview(pitch);}
}
$('#editor').addEventListener('pointerup',finishEdit);
$('#editor').addEventListener('pointercancel',e=>{if(noteDrag){const d=noteDrag;noteDrag=null;d.element.style.transform='';renderPianoEditor(selectedTrack(),selectedClip());}drawing=null;});
$('#editor').addEventListener('contextmenu',e=>{if(e.target.closest('.piano-note,.piano-cell'))e.preventDefault();});
$('#audioFile').addEventListener('change',e=>useAudioFile(e.target.files[0],loadTrackId));$('#editor').addEventListener('dragover',e=>{if(e.target.closest('#sampleDrop')){e.preventDefault();$('#sampleDrop').classList.add('dragover');}});$('#editor').addEventListener('dragleave',e=>{if(e.target.closest('#sampleDrop'))$('#sampleDrop').classList.remove('dragover');});$('#editor').addEventListener('drop',e=>{if(e.target.closest('#sampleDrop')){e.preventDefault();loadTrackId=selection.trackId;useAudioFile(e.dataTransfer.files[0],loadTrackId);}});
function syncNetwork(){if(!liveNetwork)return;const anySolo=project.tracks.some(t=>t.solo);for(let t of project.tracks){let n=liveNetwork.nodes.get(t.id);if(n){n.gain.gain.value=t.mute||(anySolo&&!t.solo)?0:t.vol;n.pan.pan.value=t.pan;n.filter.frequency.value=t.cutoff;n.shaper.curve=makeDistortion(t.drive);}}}
$('#fxStrip').addEventListener('input',e=>{let t=selectedTrack();if(!t)return;const {id,value}=e.target;if(id==='fxVolume'){t.vol=+value/100;$('#fxVolumeVal').textContent=value+'%';const v=document.querySelector(`[data-vol="${t.id}"]`);if(v)v.value=value;}else if(id==='fxPan'){t.pan=+value/100;$('#fxPanVal').textContent=value;}else if(id==='fxCutoff'){t.cutoff=Math.round(120*(20000/120)**(+value/100));$('#fxCutoffVal').textContent=t.cutoff+' Hz';}else if(id==='fxDrive'){t.drive=+value;$('#fxDriveVal').textContent=value+'%';}syncNetwork();markChange('fx-'+t.id+'-'+id);});
$('#fxStrip').addEventListener('click',e=>{if(e.target.id==='removeTrack'){let t=selectedTrack();if(!t||!confirm('Supprimer la piste « '+t.name+' » ?'))return;stop();project.tracks=project.tracks.filter(x=>x.id!==t.id);selection={trackId:project.tracks[0]?.id||null,clipId:project.tracks[0]?.clips[0]?.id||null};renderAll();markChange();}});
window.addEventListener('keydown',e=>{
 if(e.key==='Escape'){setLibraryVisible(false);setViewMenu(false);if(pasteMode)setPasteMode(false);return;}
 const tag=e.target.tagName.toLowerCase(),inField=['input','textarea','select'].includes(tag),ctrl=e.ctrlKey||e.metaKey;
 if(ctrl&&e.key.toLowerCase()==='s'){e.preventDefault();$('#saveBtn').click();return;}
 if(inField)return;
 if(ctrl&&e.key.toLowerCase()==='c'){e.preventDefault();copySelectedClips();return;}
 if(ctrl&&e.key.toLowerCase()==='v'){e.preventDefault();setPasteMode(true);return;}
 if(ctrl&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redoEdit():undoEdit();return;}
 if(ctrl&&e.key.toLowerCase()==='y'){e.preventDefault();redoEdit();return;}
 if(e.code==='Space'){e.preventDefault();playing?stop():start();}
 if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();deleteSelected();}
});
window.addEventListener('beforeunload',e=>{if(projectModified&&project.tracks.some(t=>t.type==='audio'&&t.buffer)){e.preventDefault();e.returnValue='';}});
async function boot(){
 $('#statusText').textContent='Chargement du projet et des samples locaux…';
 let restored=false;try{restored=await autosaveRestore();}catch(error){console.error(error);showStorageWarning('Restauration automatique impossible. Exporte tes projets en JSON pour les conserver.');}
 if(!restored)demo();syncHeader();renderAll();applyViewPrefs();syncFullscreenControl();historyPresent=historySnapshot();historyControls();
 $('#statusText').textContent=restored?'Projet local restauré.':'Démo préchargée. Clique sur ▶ LIRE pour entendre le projet.';
}
boot();
})();
