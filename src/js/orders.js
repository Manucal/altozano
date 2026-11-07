'use strict';
/* ================= ÓRDENES DURANTE LA BATALLA ================= */
// Clic izquierdo: seleccionar grupo (Mayús para añadir; arrastrar para seleccionar con un recuadro).
// Clic derecho sobre un enemigo: atacar ese grupo. Clic derecho en el suelo: moverse allí.
// H: mantener posición. G y luego clic: atacar zona (avanza y lucha con lo que encuentre).
// Espacio: pausa. Esc: cancelar. En pantalla táctil, tocar con tropas seleccionadas da la orden.
const ORD={down:null,box:null,hoverEnemy:false};
const wT=p=>{const w=toWorld(p);return {x:w.x/T,y:w.y/T}};
const ctrlSides=()=>S.mode==='pvp'?[0,1]:[0];
const canOrder=()=>S.state==='battle';
// posición dibujada (los sprites se elevan con la altura y al volar)
const vpos=u=>({x:u.x,y:u.y-(elev(u)*8+(u.def.fly?10:0)+5)/T});
function unitAt(w,filter){let best=null,bd=1e9;for(const u of S.units){if(!u.alive||(filter&&!filter(u)))continue;const p=vpos(u),d=Math.hypot(p.x-w.x,p.y-w.y),rr=u.def.big?0.7:0.5;if(d<rr&&d<bd){bd=d;best=u}}return best}
const selUnits=()=>S.units.filter(u=>u.alive&&S.selG.has(u.gid));
const selSide=()=>{const u=selUnits()[0];return u?u.side:null};
function selectGroups(gids,add){if(!add)S.selG.clear();for(const g of gids)S.selG.add(g);if(!S.selG.size)setG(false);renderOrders()}
function setG(on){S.gMode=on&&S.selG.size>0;updCursor();renderOrders()}
function mark(x,y,col){S.marks.push({x,y,t:0,col})}
function centroid(list){let x=0,y=0;for(const u of list){x+=u.x;y+=u.y}return {x:x/list.length,y:y/list.length}}
function prepOrder(u){u.guard=false;u.hold=false;if(u.dest){S.claims.delete(u.dest.k);u.dest=null}u.path=null;u.pt=0}
// mover o atacar zona: cada grupo conserva su forma, comprimida si estaba muy repartida
function orderPoint(w,type){
 const us=selUnits();if(!us.length)return;
 const byG={};for(const u of us)(byG[u.gid]=byG[u.gid]||[]).push(u);
 const c=centroid(us),gs=Object.values(byG),spread=Math.max(...gs.map(g=>{const k=centroid(g);return Math.hypot(k.x-c.x,k.y-c.y)}),0.01),sc=Math.min(1,(1+Math.sqrt(gs.length)*0.9)/spread);
 for(const g of gs){const k=centroid(g);for(const u of g){prepOrder(u);let tx=clamp(w.x+(k.x-c.x)*sc+(u.x-k.x),0.4,COLS-0.4),ty=clamp(w.y+(k.y-c.y)*sc+(u.y-k.y),0.4,ROWS-0.4);
  if(!u.def.fly&&S.map[Math.floor(ty)][Math.floor(tx)]===8){tx=w.x;ty=w.y}
  const d=Math.hypot(tx-u.x,ty-u.y);u.order={type,x:tx,y:ty,until:S.time+d/Math.max(0.3,speedOf(u))*2+4}}}
 mark(w.x,w.y,type==='amove'?'#ff6a4f':'#7ddc7a');
}
function orderAttack(e){const us=selUnits();for(const u of us){prepOrder(u);u.order={type:'attack',gid:e.gid};u.tgt=e}mark(e.x,e.y,'#ff3a2a')}
function orderHold(){const us=selUnits();if(!us.length)return;const all=us.every(u=>u.order&&u.order.type==='hold');for(const u of us){prepOrder(u);u.order=all?null:{type:'hold'}}renderOrders();toastOrd(all?'Tropas libres: vuelven a decidir solas.':'Mantienen la posición: solo atacan lo que tengan a su alcance.')}
function orderFree(){for(const u of selUnits())u.order=null;renderOrders()}
function toastOrd(m){toast(m)}
// orden con el botón derecho (o un toque en pantalla táctil)
function giveOrder(w){
 if(!S.selG.size)return;const side=selSide();
 if(S.gMode){orderPoint(w,'amove');setG(false);return}
 const e=unitAt(w,u=>u.side!==side);
 if(e)orderAttack(e);else orderPoint(w,'move');
 renderOrders();
}
// cursores dibujados a mano
const CUR_TARGET=`url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><circle cx="16" cy="16" r="10" fill="none" stroke="#120c14" stroke-width="5"/><circle cx="16" cy="16" r="10" fill="none" stroke="#ff4a3a" stroke-width="2.5"/><path d="M16 1v9M16 22v9M1 16h9M22 16h9" stroke="#120c14" stroke-width="4"/><path d="M16 2v8M16 22v8M2 16h8M22 16h8" stroke="#ffe066" stroke-width="2"/></svg>')}") 16 16, crosshair`;
const CUR_SWORD=`url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><path d="M3 3l16 16M19 19l-3 3M19 19l3-3M20 20l7 7" stroke="#120c14" stroke-width="6" stroke-linecap="round"/><path d="M3 3l16 16" stroke="#e8ecf2" stroke-width="3" stroke-linecap="round"/><path d="M15 23l8-8" stroke="#d4a52a" stroke-width="3" stroke-linecap="round"/><path d="M21 21l6 6" stroke="#8b5a2b" stroke-width="3" stroke-linecap="round"/></svg>')}") 3 3, pointer`;
function updCursor(){cv.style.cursor=S.state!=='battle'?'':S.gMode?CUR_TARGET:ORD.hoverEnemy?CUR_SWORD:''}

cv.addEventListener('pointerdown',e=>{
 if(!canOrder())return;const p=scr(e);if(inMinimap(p))return;const w=wT(p);
 if(e.pointerType==='touch'){ORD.down={p,w,touch:true,id:e.pointerId};return} // el arrastre lo gestiona la cámara
 if(e.button===2){ORD.down={p,w,right:true};return}
 if(e.button!==0)return;
 if(S.gMode){giveOrder(w);e.stopImmediatePropagation();return}
 ORD.down={p,w,left:true,shift:e.shiftKey};ORD.box=null;try{cv.setPointerCapture(e.pointerId)}catch(_){}
 e.stopImmediatePropagation();e.preventDefault();
},true);
cv.addEventListener('pointermove',e=>{
 if(!canOrder()){return}const p=scr(e),w=wT(p);
 if(ORD.down&&ORD.down.left&&Math.hypot(p.x-ORD.down.p.x,p.y-ORD.down.p.y)>6){ORD.box={a:ORD.down.w,b:w};e.stopImmediatePropagation();return}
 const side=selSide(),he=side!==null&&!!unitAt(w,u=>u.side!==side);if(he!==ORD.hoverEnemy){ORD.hoverEnemy=he;updCursor()}
},true);
cv.addEventListener('pointerup',e=>{
 const d=ORD.down;ORD.down=null;if(!d||!canOrder())return;const p=scr(e),w=wT(p),moved=Math.hypot(p.x-d.p.x,p.y-d.p.y);
 if(d.left){
  if(ORD.box){const a=ORD.box.a,b=ORD.box.b,x0=Math.min(a.x,b.x),x1=Math.max(a.x,b.x),y0=Math.min(a.y,b.y),y1=Math.max(a.y,b.y),sides=ctrlSides();let pick=S.units.filter(u=>u.alive&&sides.includes(u.side)&&(()=>{const q=vpos(u);return q.x>=x0&&q.x<=x1&&q.y>=y0&&q.y<=y1})());
   if(pick.length){const s0=pick[0].side;pick=pick.filter(u=>u.side===s0)}selectGroups(new Set(pick.map(u=>u.gid)),d.shift);ORD.box=null;return}
  const u=unitAt(w,u=>ctrlSides().includes(u.side));
  if(u){if(d.shift&&S.selG.has(u.gid)){S.selG.delete(u.gid);renderOrders()}else if(d.shift&&selSide()!==null&&selSide()!==u.side)selectGroups([u.gid],false);else selectGroups([u.gid],d.shift)}else selectGroups([],false);
  return;
 }
 if(d.right&&moved<8){giveOrder(w);return}
 if(d.touch&&moved<10&&CAM.ptrs.size===0){
  const own=unitAt(w,u=>ctrlSides().includes(u.side));
  if(own&&!S.gMode){if(S.selG.has(own.gid)){S.selG.delete(own.gid);renderOrders()}else selectGroups([own.gid],selSide()===own.side);return}
  giveOrder(w);
 }
},true);
window.addEventListener('keydown',e=>{
 if(!canOrder()||/^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement&&document.activeElement.tagName))return;
 const k=e.key.toLowerCase();
 if(k==='h'){orderHold();e.preventDefault()}
 else if(k==='g'){setG(!S.gMode);e.preventDefault()}
 else if(k===' '){togglePause();e.preventDefault()}
 else if(k==='escape'){if(S.gMode)setG(false);else selectGroups([],false)}
},true);
function togglePause(){S.paused=!S.paused;const b=$('o-pause');if(b)b.textContent=S.paused?'Reanudar':'Pausa';renderOrders()}

// dibujo (coordenadas del mundo)
function drawSelection(){
 if(!S.selG||!S.selG.size)return;
 ctx.lineWidth=2;
 for(const u of S.units){if(!u.alive||!S.selG.has(u.gid))continue;const el=elev(u)*8,px=u.x*T,py=u.y*T+5-el,w=u.def.big?10:u.def.mount?8:6;ctx.strokeStyle='#120c14';ctx.beginPath();ctx.ellipse(px,py+1,w,w*0.5,0,0,6.283);ctx.stroke();ctx.strokeStyle='#ffe066';ctx.beginPath();ctx.ellipse(px,py,w,w*0.5,0,0,6.283);ctx.stroke()}
 // líneas hacia el destino de cada grupo
 const byG={};for(const u of S.units)if(u.alive&&S.selG.has(u.gid)&&u.order&&u.order.type!=='hold')(byG[u.gid]=byG[u.gid]||[]).push(u);
 ctx.setLineDash([4,4]);ctx.lineWidth=1.5;
 for(const g of Object.values(byG)){const c=centroid(g),o=g[0].order;let tx,ty;if(o.type==='attack'){const t=g.find(u=>u.tgt&&u.tgt.alive);if(!t)continue;tx=t.tgt.x;ty=t.tgt.y}else{const k=centroid(g.map(u=>({x:u.order.x,y:u.order.y})));tx=k.x;ty=k.y}
  ctx.strokeStyle=o.type==='move'?'rgba(125,220,122,0.8)':'rgba(255,90,70,0.85)';ctx.beginPath();ctx.moveTo(c.x*T,c.y*T);ctx.lineTo(tx*T,ty*T);ctx.stroke()}
 ctx.setLineDash([]);
 // icono de "mantener" sobre los grupos quietos
 for(const g of S.selG){const us=S.units.filter(u=>u.alive&&u.gid===g);if(!us.length||!us[0].order||us[0].order.type!=='hold')continue;const c=centroid(us),x=Math.round(c.x*T),y=Math.round(c.y*T-22-elev(us[0])*8);ctx.fillStyle='#120c14';ctx.fillRect(x-4,y-4,9,9);ctx.fillStyle='#ffe066';ctx.fillRect(x-3,y-3,2,7);ctx.fillRect(x+2,y-3,2,7);ctx.fillRect(x-1,y,3,1)}
}
function drawMarks(dt){
 for(const m of S.marks||[]){m.t+=dt;const k=m.t/0.7,r=4+k*14;ctx.globalAlpha=Math.max(0,1-k);ctx.strokeStyle=m.col;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(m.x*T,m.y*T,r,r*0.55,0,0,6.283);ctx.stroke()}
 ctx.globalAlpha=1;if(S.marks)S.marks=S.marks.filter(m=>m.t<0.7);
 if(ORD.box){const a=ORD.box.a,b=ORD.box.b;ctx.fillStyle='rgba(255,224,102,0.12)';ctx.strokeStyle='#ffe066';ctx.lineWidth=1;ctx.fillRect(Math.min(a.x,b.x)*T,Math.min(a.y,b.y)*T,Math.abs(a.x-b.x)*T,Math.abs(a.y-b.y)*T);ctx.strokeRect(Math.min(a.x,b.x)*T,Math.min(a.y,b.y)*T,Math.abs(a.x-b.x)*T,Math.abs(a.y-b.y)*T)}
}
// caja de órdenes del panel
function ordersHTML(){
 return `<div class="sec" id="ordbox"></div>`;
}
function renderOrders(){
 const box=$('ordbox');updCursor();if(!box)return;
 const us=S.state==='battle'?selUnits():[],ng=new Set(us.map(u=>u.gid)).size;
 const names=[...new Set(us.map(u=>u.def.name))];
 box.innerHTML=`<h2>Órdenes</h2>
 <p class="note" style="color:var(--ink)">${ng?`<b>${ng} ${ng===1?'grupo':'grupos'}</b> (${us.length} soldados): ${esc(names.slice(0,4).join(', '))}${names.length>4?'…':''}`:'Ningún grupo seleccionado.'}${S.gMode?' · <b style="color:var(--bad)">Elige dónde atacar</b>':''}</p>
 <div class="row"><button class="btn" id="o-hold" ${ng?'':'disabled'}>Mantener (H)</button><button class="btn" id="o-g" aria-pressed="${S.gMode}" ${ng?'':'disabled'}>Atacar zona (G)</button></div>
 <div class="row"><button class="btn" id="o-free" ${ng?'':'disabled'}>Que decidan solas</button><button class="btn" id="o-pause">${S.paused?'Reanudar':'Pausa'}</button></div>
 <p class="note">Clic en una tropa tuya para seleccionar su grupo (Mayús para sumar, o arrastra un recuadro). Clic derecho sobre un enemigo: atacarlo. Clic derecho en el suelo: ir allí y quedarse. Espacio: pausa. En pantalla táctil, toca tus tropas y luego el destino.</p>`;
 $('o-hold').onclick=orderHold;$('o-g').onclick=()=>setG(!S.gMode);$('o-free').onclick=orderFree;$('o-pause').onclick=togglePause;
}
