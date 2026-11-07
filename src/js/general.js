'use strict';
/* ================= HABILIDADES DEL GENERAL ================= */
// Cada ejército elige GENMAX antes de la batalla y cada una se usa una sola vez.
// aim: 'enemy' o 'ally' = se apunta con un clic en el mapa; null = efecto inmediato.
const GENMAX=2;
const GEN=[
 {id:'flechas',n:'Lluvia de flechas',aim:'enemy',r:2.5,d:'Tres oleadas de flechas sobre una zona. El bosque, las ruinas y la cobertura protegen.'},
 {id:'meteoro',n:'Meteoro',aim:'enemy',r:1.6,d:'Cae al segundo y medio: mucho daño en una zona pequeña. Prende bosques y casas.'},
 {id:'muro',n:'Muro de escudos',aim:'ally',r:3,d:'Tus tropas de la zona ganan +4 de armadura durante 8 s.'},
 {id:'cura',n:'Curación',aim:'ally',r:3,d:'Cura el 40% de la vida a tus tropas de la zona.'},
 {id:'grito',n:'Grito de guerra',aim:null,d:'Todo tu ejército ataca más rápido durante 6 s y recupera la moral.'},
 {id:'raices',n:'Raíces',aim:'enemy',r:2.5,d:'Los enemigos de la zona no pueden moverse durante 4 s (los voladores se libran).'},
 {id:'humo',n:'Cortina de humo',aim:'ally',r:3,d:'Durante 10 s, los disparos contra tropas dentro del humo hacen un 60% menos.'},
 {id:'bendicion',n:'Bendición',aim:'ally',r:3,d:'Un escudo del 30% de la vida para tus tropas de la zona.'},
 {id:'refuerzos',n:'Refuerzos',aim:null,d:'Llegan dos grupos de infantería por tu esquina del mapa.'},
 {id:'rayo',n:'Rayo',aim:'enemy',r:3,d:'Fulmina a la tropa enemiga más grande cerca del punto, sin contar armadura. Con lluvia, +50%.'},
];
const GBY=Object.fromEntries(GEN.map(g=>[g.id,g]));
const randGen=()=>sortBy(GEN.map(g=>g.id),()=>Math.random()).slice(0,GENMAX);
// "atacante" ficticio para el daño de las habilidades (cuenta en las estadísticas como General)
const genAtt=side=>({def:{id:'general',name:'General',tr:[],proj:'arrow'},side,alive:false,x:0,y:0});
// lados que maneja la IA: el rojo contra la IA, y los dos en la simulación de equilibrio
const aiSides=()=>S.sim?[0,1]:S.mode==='ai'?[1]:[];
function initGen(){
 S.gen=[0,1].map(s=>{const a=S.armies[s];if(!a.gen||!a.gen.length)a.gen=randGen();return {ids:a.gen.slice(0,GENMAX),used:{}}});
 S.aim=null;S.strikes=[];S.smoke=[];S.genAI=[8+Math.random()*6,8+Math.random()*6];
}
const genLeft=(side,id)=>S.gen&&S.gen[side].ids.includes(id)&&!S.gen[side].used[id];
function useGen(side,id,x,y){
 if(!genLeft(side,id))return false;const g=GBY[id],al=S.units.filter(u=>u.alive);
 const inR=(u,r)=>Math.hypot(u.x-x,u.y-y)<r;
 const foes=al.filter(u=>u.side!==side),mine=al.filter(u=>u.side===side);
 if(id==='flechas')S.strikes.push({k:'flechas',x,y,r:g.r,side,t:0,waves:3,next:0.3});
 else if(id==='meteoro')S.strikes.push({k:'meteoro',x,y,r:g.r,side,t:0,at:1.5});
 else if(id==='muro'){for(const u of mine)if(inR(u,g.r))u.wallT=S.time+8;ringAt(x,y,g.r,'#cfd8e3')}
 else if(id==='cura'){for(const u of mine)if(inR(u,g.r)){u.hp=Math.min(u.max,u.hp+u.max*0.4);S.parts.push({x:u.x*T,y:u.y*T-6,vx:0,vy:-24,life:0.7,col:'#7dff8a'})}ringAt(x,y,g.r,'#7dff8a')}
 else if(id==='grito'){for(const u of mine){u.rage=S.time+6;u.mor=100;if(u.rout>S.time)u.rout=S.time}for(const u of mine.filter((_,i)=>i%6===0))ring(u,1.2,'#ff5a3a')}
 else if(id==='raices'){for(const u of foes)if(inR(u,g.r)&&!u.def.fly){u.rootT=S.time+4;u.moving=false}ringAt(x,y,g.r,'#6fbf4a')}
 else if(id==='humo')S.smoke.push({x,y,r:g.r,t:10});
 else if(id==='bendicion'){for(const u of mine)if(inR(u,g.r)){u.sh=Math.max(u.sh,u.max*0.3);u.shMax=Math.max(u.shMax,u.sh)}ringAt(x,y,g.r,'#fff0a0')}
 else if(id==='refuerzos'){if(!reinforce(side))return false}
 else if(id==='rayo'){
  let b=null;for(const u of foes)if(inR(u,g.r)&&(!b||u.max>b.max))b=u;if(!b)return false;
  let d=70*(S.weather.id==='rain'?1.5:1);if(b.sh>0){const a=Math.min(b.sh,d);b.sh-=a;d-=a}b.hp-=d;b.flash=0.3;
  S.stats[side].dmg+=d;S.stats[side].byType.general=(S.stats[side].byType.general||0)+d;
  for(let i=0;i<14;i++)S.parts.push({x:b.x*T+(Math.random()-0.5)*4,y:b.y*T-10-i*14,vx:(Math.random()-0.5)*20,vy:0,life:0.25,col:i%2?'#ffffff':'#bfe4ff'});burst(b.x*T,b.y*T-6,'#bfe4ff',16);
  if(b.hp<=0)kill(b,genAtt(side));
 }
 S.gen[side].used[id]=true;note(`${playerLabel(side)}: ${g.n}`);return true;
}
function ringAt(x,y,r,col){ring({x,y},r,col)}
// dos grupos de la infantería más barata de la facción entran por la esquina propia
function reinforce(side){
 const fac=S.armies[side].fac,pool=UNITS.filter(u=>u.f===fac&&!u.elite&&u.rng<=1&&!u.heal&&!u.fly&&u.n>=3);
 const def=sortBy(pool.length?pool:UNITS.filter(u=>u.f===fac&&!u.elite),u=>u.cost)[0];if(!def)return false;
 const tiles=sortBy(zoneTiles(side),t=>dvOf(side,t.c,t.r)+Math.random()*0.05).slice(0,2);
 for(const t of tiles){const gid=S.gidN++;for(const [ox,oy] of FORM[def.n]){const u=mkUnit(def,side,t.c+0.5+ox,t.r+0.5+oy);u.gid=gid;S.units.push(u)}S.count0[side]+=def.n;burst((t.c+0.5)*T,(t.r+0.5)*T,side?'#ff6a4f':'#4aa3ff',16)}
 return tiles.length>0;
}
const inSmoke=u=>S.smoke&&S.smoke.some(s=>Math.hypot(u.x-s.x,u.y-s.y)<s.r);
function stepGen(dt){
 if(!S.gen)return;
 for(const s of S.strikes){
  s.t+=dt;const foes=S.units.filter(u=>u.alive&&u.side!==s.side&&Math.hypot(u.x-s.x,u.y-s.y)<s.r);
  if(s.k==='flechas'){
   if(Math.random()<dt*40){const a=Math.random()*6.283,rr=Math.sqrt(Math.random())*s.r;S.parts.push({x:(s.x+Math.cos(a)*rr)*T,y:(s.y+Math.sin(a)*rr*0.8)*T-40,vx:-6,vy:160,life:0.25,col:'#efe0bf'})}
   if(s.t>=s.next){s.next+=0.7;s.waves--;const A=genAtt(s.side);for(const u of foes)deal(A,u,9,true)}
   if(s.waves<=0)s.done=true;
  }else if(s.k==='meteoro'&&s.t>=s.at){
   const A=genAtt(s.side);for(const u of foes)deal(A,u,32,false);
   for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++)ignite(Math.floor(s.x)+i,Math.floor(s.y)+j);
   burst(s.x*T,s.y*T,'#ffb040',40);burst(s.x*T,s.y*T,'#5a4a4a',24);s.done=true;
  }
 }
 S.strikes=S.strikes.filter(s=>!s.done);
 for(const m of S.smoke)m.t-=dt;S.smoke=S.smoke.filter(m=>m.t>0);
 // la IA usa sus habilidades
 if(!(S.dbg&&S.dbg.noGen))for(const side of aiSides()){S.genAI[side]-=dt;if(S.genAI[side]>0)continue;S.genAI[side]=1+Math.random()*0.6;aiGen(side)}
}
// mejor punto: la tropa de la lista con más tropas de la lista alrededor
function bestSpot(list,r,filter){let b=null,bn=0;for(const u of list){let n=0;for(const v of list)if(Math.hypot(u.x-v.x,u.y-v.y)<r&&(!filter||filter(v)))n++;if(n>bn){bn=n;b=u}}return {u:b,n:bn}}
function aiGen(side){
 if(S.time<8)return;const al=S.units.filter(u=>u.alive),foes=al.filter(u=>u.side!==side),mine=al.filter(u=>u.side===side);if(!foes.length||!mine.length)return;
 const late=S.time>TLIM*0.75,fought=mine.filter(u=>u.tgt&&u.tgt.alive&&dist(u,u.tgt)<3);
 const near=(u,r)=>foes.some(e=>Math.hypot(e.x-u.x,e.y-u.y)<r);
 for(const id of S.gen[side].ids){
  if(!genLeft(side,id))continue;const g=GBY[id];let spot=null;
  if(id==='flechas'||id==='meteoro'||id==='raices'){const b=bestSpot(foes,g.r*0.9,id==='raices'?v=>!v.def.fly:null);if(b.n>=(late?3:id==='flechas'?8:6)&&(id!=='meteoro'||!mine.some(m=>Math.hypot(m.x-b.u.x,m.y-b.u.y)<g.r+0.5)))spot=b.u}
  else if(id==='rayo'){const b=sortBy(foes,u=>-u.max)[0];if(b&&(b.max>=90||late))spot=b}
  else if(id==='cura'){const b=bestSpot(mine,g.r*0.9,v=>v.hp<v.max*0.55);if(b.n>=(late?2:5))spot=b.u}
  else if(id==='muro'||id==='bendicion'){const b=bestSpot(fought,g.r*0.9);if(b.n>=(late?2:6))spot=b.u}
  else if(id==='humo'){const shooters=foes.filter(e=>e.def.rng>1&&!e.def.heal).length;if(shooters>=6||late){const b=bestSpot(mine,g.r*0.9,v=>near(v,8));if(b.n>=(late?2:6))spot=b.u}}
  else if(id==='grito'){if(fought.length>=Math.max(4,mine.length*0.4)||late){useGen(side,id,0,0);return}}
  else if(id==='refuerzos'){if(mine.length<S.count0[side]*0.6||late){useGen(side,id,0,0);return}}
  if(spot){useGen(side,id,spot.x,spot.y);return}
 }
}

// --- entrada: botones del panel y clic en el mapa para apuntar
function armGen(side,id){
 if(S.state!=='battle'||!genLeft(side,id))return;const g=GBY[id];
 if(!g.aim){useGen(side,id,0,0);S.aim=null}else S.aim=S.aim&&S.aim.id===id&&S.aim.side===side?null:{side,id};
 if(S.aim)setG(false);updCursor();renderGenBox();
}
function genHTML(){return `<div class="sec" id="genbox"></div>`}
function renderGenBox(){
 const box=$('genbox');if(!box||!S.gen)return;const sides=ctrlSides();
 box.innerHTML=`<h2>General</h2>${sides.map(side=>`${sides.length>1?`<p class="note"><b>${esc(playerLabel(side))}</b></p>`:''}<div class="row">${S.gen[side].ids.map((id,i)=>{const g=GBY[id],used=S.gen[side].used[id];return `<button class="btn gen" data-gs="${side}" data-gid="${id}" ${used?'disabled':''} aria-pressed="${!!(S.aim&&S.aim.id===id&&S.aim.side===side)}" title="${esc(g.d)}">${side===0&&sides.length===1?`<kbd>${i+1}</kbd> `:''}${esc(g.n)}${used?' (usada)':''}</button>`}).join('')}</div>`).join('')}
 <p class="note">${S.aim?`<b style="color:var(--gold)">Elige dónde lanzar ${esc(GBY[S.aim.id].n)}.</b> Clic derecho o Esc para cancelar.`:'Cada habilidad se usa una vez. Las que tienen zona se lanzan con un clic en el mapa.'}</p>`;
 box.querySelectorAll('[data-gid]').forEach(b=>b.onclick=()=>armGen(+b.dataset.gs,b.dataset.gid));
}
cv.addEventListener('pointerdown',e=>{
 if(S.state!=='battle'||!S.aim)return;
 if(e.button===2){S.aim=null;updCursor();renderGenBox();e.stopImmediatePropagation();e.preventDefault();return}
 if(e.button!==0)return;const p=scr(e);if(inMinimap(p))return;const w=wT(p);
 const a=S.aim;S.aim=null;if(!useGen(a.side,a.id,w.x,w.y))toast('Ahí no hay ningún objetivo.');
 mark(w.x,w.y,'#ffe066');updCursor();renderGenBox();e.stopImmediatePropagation();e.preventDefault();
},true);
cv.addEventListener('pointermove',e=>{S.mouseW=wT(scr(e))});
window.addEventListener('keydown',e=>{
 if(S.state!=='battle'||/^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement&&document.activeElement.tagName))return;
 if(e.key==='Escape'&&S.aim){S.aim=null;updCursor();renderGenBox();e.stopImmediatePropagation();return}
 if((e.key==='1'||e.key==='2')&&S.mode==='ai'&&S.gen){const id=S.gen[0].ids[+e.key-1];if(id)armGen(0,id);e.preventDefault()}
},true);

// --- dibujo (coordenadas del mundo)
function drawGen(now){
 for(const m of S.smoke||[]){const a=Math.min(1,m.t/1.5)*0.55;for(let i=0;i<9;i++){const an=i/9*6.283+now/4000,rr=m.r*0.55*T;const g=ctx.createRadialGradient(m.x*T+Math.cos(an)*rr,m.y*T+Math.sin(an)*rr*0.6,2,m.x*T+Math.cos(an)*rr,m.y*T+Math.sin(an)*rr*0.6,m.r*0.6*T);g.addColorStop(0,`rgba(200,200,196,${a})`);g.addColorStop(1,'rgba(200,200,196,0)');ctx.fillStyle=g;ctx.fillRect(m.x*T-m.r*2*T,m.y*T-m.r*2*T,m.r*4*T,m.r*4*T)}}
 for(const s of S.strikes||[]){if(s.k!=='meteoro')continue;const k=Math.min(1,s.t/s.at);ctx.strokeStyle='rgba(255,120,40,0.85)';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(s.x*T,s.y*T,s.r*T*k,s.r*T*0.6*k,0,0,6.283);ctx.stroke();
  const mx=s.x*T+(1-k)*160,my=s.y*T-(1-k)*420;ctx.fillStyle='#3a1610';ctx.fillRect(mx-5,my-5,11,11);ctx.fillStyle='#ff7a1a';ctx.fillRect(mx-4,my-4,9,9);ctx.fillStyle='#ffe066';ctx.fillRect(mx-2,my-2,4,4);for(let i=1;i<6;i++){ctx.globalAlpha=0.5-i*0.08;ctx.fillStyle='#ff9a30';ctx.fillRect(mx+i*7-3,my-i*18-3,6,6)}ctx.globalAlpha=1}
 // raíces sobre las tropas atrapadas
 for(const u of S.units){if(!u.alive||!(u.rootT>S.time))continue;const x=Math.round(u.x*T),y=Math.round(u.y*T+4-elev(u)*8);ctx.fillStyle='#3d6a28';ctx.fillRect(x-5,y-1,2,3);ctx.fillRect(x+3,y-1,2,3);ctx.fillStyle='#6fbf4a';ctx.fillRect(x-4,y-3,1,3);ctx.fillRect(x+4,y-3,1,3);ctx.fillRect(x-1,y,3,1)}
 // vista previa al apuntar
 if(S.aim&&S.mouseW){const g=GBY[S.aim.id];ctx.strokeStyle=g.aim==='ally'?'rgba(125,220,122,0.9)':'rgba(255,120,80,0.9)';ctx.fillStyle=g.aim==='ally'?'rgba(125,220,122,0.12)':'rgba(255,120,80,0.12)';ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.beginPath();ctx.ellipse(S.mouseW.x*T,S.mouseW.y*T,g.r*T,g.r*T*0.6,0,0,6.283);ctx.fill();ctx.stroke();ctx.setLineDash([])}
}
