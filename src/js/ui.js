'use strict';
/* ================= INTERFAZ ================= */
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ICON={};
function swatch(t){const c=document.createElement('canvas');c.width=16;c.height=16;c.getContext('2d').drawImage(terrCvSample(t),0,0);return c.toDataURL()}
const sampleCache={};
function terrCvSample(t){if(sampleCache[t])return sampleCache[t];const c=document.createElement('canvas');c.width=16;c.height=16;const x=c.getContext('2d'),r=rng(t+5),cols=TER[t].col;
 for(let j=0;j<16;j++)for(let i=0;i<16;i++){x.fillStyle=r()<0.6?cols[0]:r()<0.5?cols[1]:cols[2];
  if((t===1&&j>=12)||(t===5&&j>=8))x.fillStyle=j%4===0?'#5c4027':r()<0.5?'#7a5a38':'#6a4c2e';if((t===1&&j===11)||(t===5&&j===7))x.fillStyle='#d4e090';if(t===4&&j%4===0)x.fillStyle='#8a7048';x.fillRect(i,j,1,1)}
 if(t===2){const tr=treeSprite(false,0);x.drawImage(tr,1,2)}
 if(t===6){x.fillStyle='#bfa462';for(let i=0;i<16;i+=5){x.fillRect(i,4+(i%3),3,1);x.fillRect(i+2,11-(i%2),3,1)}}
 if(t===7){x.fillStyle='#2a2222';x.fillRect(3,5,5,1);x.fillRect(8,6,4,1);x.fillRect(6,11,6,1);x.fillStyle='#ff7a2a';x.fillRect(12,3,1,1)}
 if(t===8){x.fillStyle='#7a2410';x.fillRect(0,6,7,1);x.fillRect(7,7,9,1);x.fillRect(4,12,8,1);x.fillStyle='#ffe070';x.fillRect(10,3,2,2)}
 return sampleCache[t]=c}
function renderFieldTag(){
 $('fieldtag').innerHTML=`<span class="chip">Campo <b>${esc(S.mapName)}</b></span><span class="chip">Bioma <b>${esc(BIOMES.find(b=>b.id===S.biome).n.replace(/ \(.*\)/,''))}</b></span><span class="chip">Defiende <b>${S.def?'Rojo':'Azul'}</b></span><span class="chip">Clima <b>${esc(S.weather.n)}</b></span>`;
}
function armyFacName(a){const fs=[...new Set(a.units.map(u=>UBY[u.id].f))];return fs.length===1?FACTIONS[fs[0]].name:fs.length?'Ejército mixto':'Sin tropas'}
function armyCost(a){return a.units.reduce((s,u)=>s+UBY[u.id].cost,0)}
function synHTML(units,fac){
 const {tier:tt,cnt}=computeSyn(units);const traits=new Set([...Object.keys(cnt),...(fac==null?[]:UNITS.filter(u=>u.f===fac).flatMap(u=>u.tr))]);
 return `<div class="syn">${[...traits].map(k=>{const t=tt[k]||0,tr=TRAITS[k],c=cnt[k]||0;const next=t<2?tr.tiers[t]:null;return `<div class="${t?'on':'off'}"><span>${tr.n}</span><span class="pip">${c}/${next??tr.tiers[1]}</span><span>${t?esc(tr.fx[t-1]):'Con '+tr.tiers[0]+': '+esc(tr.fx[0])}</span></div>`}).join('')}</div>`;
}
function legendHTML(){
 const has=new Set([0,1,2]);for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){const k=S.map[r][c],h=S.hgt[r][c];has.add(k);if(h)has.add(h===2?5:1)}
 return `<ul class="legend">${TER.map((t,i)=>!has.has(i)?'':`<li><img class="sw" alt="" src="${swatch(i)}"><span><b>${t.n}.</b> ${esc(t.d)}</span></li>`).join('')}</ul>`;
}
function playerLabel(side){if(S.mode==='ai')return side===0?'Tu ejército':'IA';return side===0?'Jugador 1':'Jugador 2'}
function renderPanel(){
 const P=$('panel');
 if(S.state==='setup'){
  P.innerHTML=`
  <div class="sec"><h2>Modo</h2><div class="seg" role="group">
   <button id="m-ai" aria-pressed="${S.mode==='ai'}">Contra la IA</button><button id="m-pvp" aria-pressed="${S.mode==='pvp'}">2 jugadores, mismo equipo</button></div></div>
  <div class="sec"><h2>Campo de batalla</h2>
   <div class="row"><select id="sel-map" aria-label="Tipo de campo">${PRESETS.map(p=>`<option value="${p.id}" ${p.id===S.preset?'selected':''}>${p.n}</option>`).join('')}</select>
   <select id="sel-wx" aria-label="Clima"><option value="random" ${S.weatherSel==='random'?'selected':''}>Clima aleatorio</option>${WEATHERS.map(w=>`<option value="${w.id}" ${w.id===S.weatherSel?'selected':''}>${w.n}</option>`).join('')}</select></div>
   <select id="sel-bio" aria-label="Bioma" ${S.preset==='oasis'||S.preset==='caldera'?'disabled':''}>${BIOMES.map(b=>`<option value="${b.id}" ${b.id===S.biomeSel?'selected':''}>${b.n}</option>`).join('')}</select>
   <select id="sel-def" aria-label="Quién defiende"><option value="random" ${S.defSel==='random'?'selected':''}>Defensor aleatorio</option><option value="0" ${S.defSel==='0'?'selected':''}>Defiende el azul</option><option value="1" ${S.defSel==='1'?'selected':''}>Defiende el rojo</option></select>
   <button class="btn" id="b-reroll">Generar otro campo</button></div>
  <div class="sec"><h2>Atacante y defensor</h2><p class="note" style="color:var(--ink)">Defiende el <b>${S.def?'rojo':'azul'}</b>: tiene el terreno a favor y gana si resiste ${TLIM} s. El atacante debe eliminar a todo el ejército defensor antes de que acabe el tiempo.</p></div>
  <div class="sec"><h2>Clima: ${esc(S.weather.n)}</h2><p class="note" style="color:var(--ink)">${esc(S.weather.d)}</p></div>
  <div class="sec"><h2>Terreno</h2>${legendHTML()}<p class="note">El campo se divide en diagonal: azul arriba, rojo abajo. El mapa no es simétrico: el lado del defensor tiene mejor terreno.</p></div>
  <button class="btn primary" id="b-go">Armar ejército</button>`;
  $('m-ai').onclick=()=>{S.mode='ai';renderPanel()};$('m-pvp').onclick=()=>{S.mode='pvp';renderPanel()};
  $('sel-map').onchange=e=>{S.preset=e.target.value;newField();renderPanel()};
  $('sel-wx').onchange=e=>{S.weatherSel=e.target.value;newField(true);renderPanel()};
  $('sel-bio').onchange=e=>{S.biomeSel=e.target.value;newField(true);renderPanel()};
  $('sel-def').onchange=e=>{S.defSel=e.target.value;newField(true);renderPanel()};
  $('b-reroll').onclick=()=>{newField();renderPanel()};
  $('b-go').onclick=()=>{S.side=0;S.sel=null;S.state='deploy';renderPanel();renderHud()};
 }
 else if(S.state==='deploy'){
  const a=S.armies[S.side],cost=armyCost(a),n=a.units.length,fac=a.fac;
  const fu=UNITS.filter(u=>u.f===fac);
  P.innerHTML=`
  <div class="sec"><div class="who"><span class="dot ${S.side?'p2':'p1'}"></span><h3>${playerLabel(S.side)}</h3></div>
   <p class="note">${S.side===S.def?'<b>Defiendes</b>: aguanta '+TLIM+' s y ganas.':'<b>Atacas</b>: elimina a todo el ejército defensor antes de '+TLIM+' s.'} Elige una tropa y toca casillas de tu zona (el triángulo ${S.side?'rojo, abajo':'azul, arriba'}). Arrastra para colocar varias. Toca una tropa colocada para quitarla.</p></div>
  <div class="sec"><h2>Facción</h2><div class="seg" role="group">${FACTIONS.map((f,i)=>`<button data-fac="${i}" aria-pressed="${i===fac}">${esc(f.name)}</button>`).join('')}</div><p class="note">${esc(FACTIONS[fac].blurb)} Puedes mezclar tropas de varias facciones: los rasgos se suman entre todas.</p></div>
  <div class="sec">
   <div class="meter"><span>Capacidad</span><div class="bar"><i style="width:${cost/capFor(S.side)*100}%"></i></div><b>${cost}/${capFor(S.side)}</b></div>
   <div class="meter"><span>Grupos</span><div class="bar"><i style="width:${n/MAXU*100}%"></i></div><b>${n}/${MAXU}</b></div>
   <p class="note">${a.units.reduce((s,u)=>s+UBY[u.id].n,0)} soldados en total · Élites ${a.units.filter(u=>UBY[u.id].elite).length}/${ELITEMAX}</p>
  </div>
  <div class="sec"><h2>Tropas</h2><div class="cards">${fu.map(u=>`<button class="card${u.elite?' elite':''}" data-u="${u.id}" aria-pressed="${S.sel===u.id}">
   <img alt="" src="${ICON[u.id]}"><span><span class="nm">${u.elite?'<span class="badge">Élite</span> ':''}${esc(u.name)}${u.n>1?' x'+u.n:''}</span>
   <span class="st"> · ${u.n>1?'Grupo de '+u.n+' · Vida '+Math.round(u.hp/u.n)+' c/u':'Vida '+u.hp} · Ataque ${u.atk}${u.heal?' · Cura '+u.heal:''} · Alcance ${u.rng} · Armadura ${u.arm}</span>
   <span class="trs">${u.tr.map(t=>`<span class="tr">${TRAITS[t].n}</span>`).join('')}</span><span class="ds">${esc(u.desc)}</span></span>
   <span class="cost">${u.cost}<small>cap.</small></span></button>`).join('')}</div></div>
  <div class="sec"><h2>Sinergias</h2>${synHTML(a.units,fac)}</div>
  <div class="row"><button class="btn" id="b-auto">Desplegar automático</button><button class="btn" id="b-clear">Vaciar</button></div>
  <div class="row"><button class="btn" id="b-back">Volver al campo</button><button class="btn primary" id="b-ready" ${n?'':'disabled'}>${S.mode==='pvp'&&S.side===0?'Listo, turno del J2':'¡A la batalla!'}</button></div>`;
  P.querySelectorAll('[data-fac]').forEach(b=>b.onclick=()=>{const i=+b.dataset.fac;if(i===a.fac)return;a.fac=i;S.sel=null;renderPanel()});
  P.querySelectorAll('[data-u]').forEach(b=>b.onclick=()=>{S.sel=b.dataset.u;P.querySelectorAll('[data-u]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.u===S.sel))});
  $('b-auto').onclick=()=>{S.armies[S.side]=autoArmy(S.side,a.fac);renderPanel()};
  $('b-clear').onclick=()=>{a.units=[];renderPanel()};
  $('b-back').onclick=()=>{S.state='setup';renderPanel();renderHud()};
  $('b-ready').onclick=ready;
 }
 else if(S.state==='battle'||S.state==='result'){
  P.innerHTML=`
  <div class="sec"><h2>Velocidad</h2><div class="seg" role="group">${[1,2,4].map(s=>`<button data-sp="${s}" aria-pressed="${S.speed===s}">x${s}</button>`).join('')}</div></div>
  ${S.state==='battle'?ordersHTML():''}
  ${[0,1].map(side=>`<div class="sec"><div class="who"><span class="dot ${side?'p2':'p1'}"></span><h3>${playerLabel(side)} · ${esc(armyFacName(S.armies[side]))}</h3></div>${synHTML(S.armies[side].units,null)}</div>`).join('')}
  <button class="btn" id="b-end">${S.state==='battle'?'Terminar ya (gana el defensor)':'Ver resultado'}</button>`;
  if(S.state==='battle')renderOrders();else{S.gMode=false;updCursor()}
  P.querySelectorAll('[data-sp]').forEach(b=>b.onclick=()=>{S.speed=+b.dataset.sp;P.querySelectorAll('[data-sp]').forEach(x=>x.setAttribute('aria-pressed',+x.dataset.sp===S.speed))});
  $('b-end').onclick=()=>{if(S.state==='battle'){S.time=TLIM;const al=S.units.filter(u=>u.alive);endBattle(al.filter(u=>!u.side).length,al.filter(u=>u.side).length)}else showResult()};
 }
}
function ready(){
 if(S.mode==='pvp'&&S.side===0){S.state='handoff';S.sel=null;showOverlay(`<h2>Turno del Jugador 2</h2><p>Pásale el dispositivo. El ejército del Jugador 1 queda oculto hasta la batalla.</p><button class="btn primary" id="ov-go">Soy el Jugador 2</button>`);$('ov-go').onclick=()=>{hideOverlay();S.side=1;S.state='deploy';renderPanel();renderHud()};return}
 if(S.mode==='ai')S.armies[1]=aiArmy();
 hideOverlay();startBattle();renderHud();
}
function showOverlay(html){const o=$('overlay');o.innerHTML=`<div class="box">${html}</div>`;o.hidden=false}
function hideOverlay(){$('overlay').hidden=true}
function showResult(){
 const R_=S.result;const lbl=s=>playerLabel(s);
 let title=R_.win===-1?'Empate':S.mode==='ai'?(R_.win===0?'Victoria':'Derrota'):`Gana ${lbl(R_.win)}`;
 const best=s=>{const b=S.stats[s].byType;const k=Object.keys(b).sort((x,y)=>b[y]-b[x])[0];return k?UBY[k].name:'—'};
 showOverlay(`<h2>${title}</h2>${R_.timeout?'<p class="muted">Se acabó el tiempo: el defensor resistió.</p>':''}
 <div class="res-table"><span class="h"></span><span class="h">${esc(lbl(0))}</span><span class="h">${esc(lbl(1))}</span>
 <span>Soldados vivos</span><b>${R_.n[0]}/${S.count0[0]}</b><b>${R_.n[1]}/${S.count0[1]}</b>
 <span>Daño causado</span><b>${Math.round(S.stats[0].dmg)}</b><b>${Math.round(S.stats[1].dmg)}</b>
 <span>Bajas causadas</span><b>${S.stats[0].kills}</b><b>${S.stats[1].kills}</b>
 <span>Tropa más dañina</span><b>${esc(best(0))}</b><b>${esc(best(1))}</b></div>
 <div class="row"><button class="btn primary" id="ov-re">Revancha</button></div>
 <div class="row"><button class="btn" id="ov-army">Cambiar ejército</button><button class="btn" id="ov-new">Nuevo campo</button></div>
 <button class="btn" id="ov-look">Ver el campo</button>`);
 $('ov-re').onclick=()=>{hideOverlay();if(S.mode==='ai'){const f=S.armies[1].fac;S.armies[1]=autoArmy(1,f)}startBattle();renderHud()};
 $('ov-army').onclick=()=>{hideOverlay();S.units=[];S.corpses=[];S.proj=[];S.side=0;S.state='deploy';renderPanel();renderHud()};
 $('ov-new').onclick=()=>{hideOverlay();S.units=[];S.corpses=[];S.proj=[];S.state='setup';newField();renderPanel();renderHud()};
 $('ov-look').onclick=()=>hideOverlay();
}
function renderHud(){
 const h=$('hud');
 if(S.state==='battle'||S.state==='result'){
  const v=[0,1].map(s=>valueLeft(s)/Math.max(1,S.total[s])*100),n=[0,1].map(s=>S.units.filter(u=>u.alive&&u.side===s).length);
  h.innerHTML=`<div class="side"><span>${esc(playerLabel(0))} · ${n[0]}</span><div class="bar"><i style="width:${v[0]}%"></i></div></div><div class="clock">${Math.max(0,Math.ceil(TLIM-S.time))}s</div><div class="side r"><span>${n[1]} · ${esc(playerLabel(1))}</span><div class="bar"><i style="width:${v[1]}%"></i></div></div>`;
 }else if(S.state==='deploy'){
  h.innerHTML=`<div class="side"><span>${esc(playerLabel(S.side))}: ${S.side===S.def?'defiende':'ataca'} desde el triángulo ${S.side?'rojo':'azul'}</span></div><div></div><div></div>`;
 }else h.innerHTML=`<div class="side"><span>Estudia el campo antes de elegir tropas</span></div><div></div><div></div>`;
}
const HINT='Pasa el cursor por el mapa para ver qué hace cada terreno. Rueda del ratón o pellizco para acercar; arrastra para moverte (al colocar tropas, con el botón derecho o con dos dedos).';
let toastT=0;
function toast(msg){const el=$('tileinfo');el.textContent=msg;el.classList.add('warn');clearTimeout(toastT);toastT=setTimeout(()=>{el.classList.remove('warn');updateTileInfo()},2200)}
function updateTileInfo(){
 const el=$('tileinfo');if(el.classList.contains('warn'))return;const t=S.hover;
 if(!t){el.innerHTML=HINT;return}
 const sf=S.map[t.r][t.c],hh=S.hgt[t.r][t.c],own=sf===2||sf===6||sf===7||sf===8,ter=TER[own||sf===3||sf===4?sf:hh===2?5:hh===1?1:0],up=own&&hh;el.innerHTML=`<b>${ter.n}${up?(hh===2?' en montaña':' en colina'):''}.</b> ${esc(ter.d)}${up?' '+esc(TER[hh===2?5:1].d):''}`;
}
function tileOf(e){const w=toWorld(scr(e));const c=Math.floor(w.x/T),rr=Math.floor(w.y/T);if(c<0||rr<0||c>=COLS||rr>=ROWS)return null;return {c,r:rr}}
let paint=null,lastPaint=null;
function applyPaint(t){
 if(!t||!inZone(t,S.side))return;const k=t.c+','+t.r;if(k===lastPaint)return;lastPaint=k;
 const a=S.armies[S.side],idx=a.units.findIndex(u=>u.c===t.c&&u.r===t.r);
 if(paint==='del'){if(idx>=0){a.units.splice(idx,1);renderPanel()}return}
 if(idx>=0)return;
 if(!S.sel){toast('Primero elige una tropa en el panel.');return}
 const def=UBY[S.sel];
 if(a.units.length>=MAXU){toast('Límite de '+MAXU+' grupos.');return}
 if(def.elite&&a.units.filter(u=>UBY[u.id].elite).length>=ELITEMAX){toast('Máximo '+ELITEMAX+' élites por ejército.');return}
 if(armyCost(a)+def.cost>capFor(S.side)){toast('No queda capacidad: '+def.name+' cuesta '+def.cost+'.');return}
 a.units.push({id:def.id,c:t.c,r:t.r});renderPanel();
}
cv.addEventListener('pointerdown',e=>{
 if(S.state!=='deploy'||e.button!==0)return;const t=tileOf(e);if(!t)return;
 if(!inZone(t,S.side)){toast('Solo puedes desplegar en tu franja.');return}
 const a=S.armies[S.side];paint=a.units.some(u=>u.c===t.c&&u.r===t.r)?'del':'add';lastPaint=null;applyPaint(t);
 try{cv.setPointerCapture(e.pointerId)}catch(_){}
 e.preventDefault();
});
cv.addEventListener('pointermove',e=>{if(CAM.pinch)return;const t=tileOf(e);const ch=!S.hover||!t||t.c!==S.hover.c||t.r!==S.hover.r;S.hover=t;if(ch)updateTileInfo();if(paint)applyPaint(t)});
const endPaint=()=>{paint=null;lastPaint=null};
cv.addEventListener('pointerup',endPaint);cv.addEventListener('pointercancel',endPaint);
cv.addEventListener('pointerleave',()=>{if(!paint){S.hover=null;updateTileInfo()}});
cv.addEventListener('contextmenu',e=>e.preventDefault());
