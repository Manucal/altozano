'use strict';
/* ================= OBJETIVOS, CLIMA CAMBIANTE Y TERRENO VIVO ================= */
// --- Objetivos: 3 puntos que empiezan en manos del defensor. El atacante gana si mantiene 2 durante OBJWIN segundos.
const OBJWIN=40;
const OBJTYPES={
 estandarte:{n:'Estandarte',art:'el estandarte',d:'Su dueño hace +10% de daño.'},
 pozo:{n:'Pozo sagrado',art:'el pozo sagrado',d:'Todo el ejército de su dueño regenera un 0,8% de vida por segundo.'},
 atalaya:{n:'Atalaya',art:'la atalaya',d:'Los tiradores de su dueño tienen +1 de alcance.'},
};
function placeObjectives(){
 const r=rng(S.seed^0x0b1),d=S.def,cands=[];
 for(let y=1;y<ROWS-1;y++)for(let x=1;x<COLS-1;x++){
  const dv=dvOf(d,x,y),v=S.map[y][x];if(dv<0.66||dv>0.98||BLOCK(v)||v===3||v===4)continue;
  let free=0;for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const w=S.map[y+j][x+i];if(!BLOCK(w)&&w!==3&&S.hgt[y+j][x+i]===S.hgt[y][x])free++}
  if(free>=7)cands.push({x,y,dv});
 }
 const pick=[];
 if(cands.length){
  pick.push(cands[(r()*cands.length)|0]);
  while(pick.length<3){let best=null,bd=-1;for(const c of cands){const dm=Math.min(...pick.map(p=>Math.hypot(p.x-c.x,p.y-c.y)))+r()*2;if(dm>bd){bd=dm;best=c}}if(!best)break;pick.push(best)}
 }
 const types=sortBy(Object.keys(OBJTYPES),()=>r());
 S.objs=pick.map((p,i)=>({x:p.x+0.5,y:p.y+0.5,c:p.x,r:p.y,type:types[i%3],owner:d,prog:d===0?-1:1}));
}
const objOwned=(side,type)=>S.objs?S.objs.filter(o=>o.owner===side&&(!type||o.type===type)).length:0;
function stepObjectives(dt,alive){
 if(!S.objs||S.dbg&&S.dbg.noObj)return;
 for(const o of S.objs){
  let n0=0,n1=0;for(const u of alive){if(u.rout>S.time)continue;if(Math.abs(u.x-o.x)>1.8||Math.abs(u.y-o.y)>1.8)continue;if(Math.hypot(u.x-o.x,u.y-o.y)<1.6){if(u.side)n1++;else n0++}}
  o.contested=n0&&n1;
  if(n0&&!n1)o.prog=Math.max(-1,o.prog-dt*0.09*Math.min(3,n0));
  else if(n1&&!n0)o.prog=Math.min(1,o.prog+dt*0.09*Math.min(3,n1));
  const was=o.owner;if(o.prog<=-1)o.owner=0;else if(o.prog>=1)o.owner=1;else if(Math.abs(o.prog)<0.05)o.owner=-1;
  if(was!==o.owner&&o.owner>=0){burst(o.x*T,o.y*T-14,o.owner?'#ff6a4f':'#4aa3ff',18);note(`${playerLabel(o.owner)} toma ${OBJTYPES[o.type].art}`)}
 }
 // regeneración del pozo
 for(const u of alive){if(objOwned(u.side,'pozo'))u.hp=Math.min(u.max,u.hp+u.max*0.008*dt)}
 // victoria del atacante por objetivos
 const att=1-S.def;
 if(S.objs.filter(o=>o.owner===att&&!o.contested).length>=2){S.objT=(S.objT||0)+dt;if(S.objT>=OBJWIN){S.objWin=true}}else S.objT=0;
}
function drawObjectiveOne(o,now){
 {
  const el=S.hgt[o.r][o.c]*8,x=Math.round(o.x*T),y=Math.round(o.y*T+4-el);
  const col=o.owner===0?'#4aa3ff':o.owner===1?'#ff6a4f':'#d8d0c0';
  // zona de captura
  ctx.strokeStyle='rgba(255,240,200,0.35)';ctx.setLineDash([3,4]);ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(x,y,1.6*T,1.6*T*0.6,0,0,6.283);ctx.stroke();ctx.setLineDash([]);
  // progreso
  const k=Math.abs(o.prog),pc=o.prog<0?'#4aa3ff':'#ff6a4f';ctx.strokeStyle=pc;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(x,y,14,8,0,-Math.PI/2,-Math.PI/2+6.283*k);ctx.stroke();
  // base de piedra
  ctx.fillStyle='#120c14';ctx.fillRect(x-9,y-4,19,7);ctx.fillStyle='#9a9384';ctx.fillRect(x-8,y-3,17,5);ctx.fillStyle='#b8b0a0';ctx.fillRect(x-8,y-3,17,1);
  if(o.type==='estandarte'){ctx.fillStyle='#120c14';ctx.fillRect(x-1,y-26,3,24);ctx.fillStyle='#8b5a2b';ctx.fillRect(x,y-25,1,22);const wv=Math.sin(now/250)*1;ctx.fillStyle='#120c14';ctx.fillRect(x+1,y-26,12,9+wv);ctx.fillStyle=col;ctx.fillRect(x+2,y-25,10,7+wv);ctx.fillStyle='#ffe066';ctx.fillRect(x+5,y-23,3,2)}
  else if(o.type==='pozo'){ctx.fillStyle='#120c14';ctx.fillRect(x-7,y-12,15,10);ctx.fillStyle='#8e8a78';ctx.fillRect(x-6,y-11,13,8);ctx.fillStyle='#3a8ad0';ctx.fillRect(x-4,y-10,9,3);ctx.fillStyle='#120c14';ctx.fillRect(x-7,y-20,1,9);ctx.fillRect(x+7,y-20,1,9);ctx.fillRect(x-8,y-22,17,3);ctx.fillStyle=col;ctx.fillRect(x-7,y-21,15,1)}
  else{ctx.fillStyle='#120c14';ctx.fillRect(x-6,y-30,13,28);ctx.fillStyle='#a8a192';ctx.fillRect(x-5,y-29,11,26);ctx.fillStyle='#6e685c';ctx.fillRect(x-5,y-29,11,2);ctx.fillRect(x-1,y-20,3,4);ctx.fillStyle=col;ctx.fillRect(x-5,y-33,11,4);ctx.fillStyle='#120c14';ctx.fillRect(x-5,y-34,11,1)}
 }
}
function objHUD(){
 if(!S.objs||!S.objs.length)return '';
 const att=1-S.def;
 return `<div class="objs">${S.objs.map(o=>`<span class="obj ${o.owner===0?'p1':o.owner===1?'p2':''}${o.contested?' cont':''}" title="${esc(OBJTYPES[o.type].n+': '+OBJTYPES[o.type].d)}">${esc(OBJTYPES[o.type].n)}</span>`).join('')}${objOwned(att)>=2?`<b class="objt">${playerLabel(att)} gana en ${Math.max(0,Math.ceil(OBJWIN-(S.objT||0)))} s</b>`:''}</div>`;
}

// --- Avisos sobre el mapa
function note(msg){S.notes=S.notes||[];S.notes.push({msg,t:0});if(S.notes.length>3)S.notes.shift()}
function drawNotes(dt){
 if(!S.notes||!S.notes.length)return;ctx.save();ctx.font='600 26px "Barlow Semi Condensed", sans-serif';ctx.textAlign='center';
 S.notes.forEach((n,i)=>{n.t+=dt;const a=n.t<0.3?n.t/0.3:n.t>3?Math.max(0,1-(n.t-3)/0.6):1;ctx.globalAlpha=a;const y=150+i*34;const w=ctx.measureText(n.msg).width+28;ctx.fillStyle='rgba(18,12,20,0.82)';ctx.fillRect(W/2-w/2,y-24,w,32);ctx.fillStyle='#ffe9b0';ctx.fillText(n.msg,W/2,y)});
 ctx.restore();S.notes=S.notes.filter(n=>n.t<3.6);
}

// --- Clima que cambia a mitad de batalla (se anuncia en el pronóstico)
function planWeather(){
 const r=rng(S.seed^0x3e3);S.wx2=null;S.wxT=0;
 if(r()<0.55){let w;do{w=WEATHERS[(r()*WEATHERS.length)|0]}while(w.id===S.weather.id);S.wx2=w;S.wxT=Math.round(45+r()*45)}
}
function stepWeather(){
 if(!S.wx2||S.wxDone||S.time<S.wxT)return;S.wxDone=true;S.weather=S.wx2;
 note('El clima cambia: '+S.weather.n);S.terrDirty=true;initWeatherFx();renderFieldTag();
}

// --- Terreno vivo: el fuego prende bosques y casas; la lava avanza
function ignite(c,r){
 if(c<0||r<0||c>=COLS||r>=ROWS||S.weather.id==='rain'||S.weather.id==='snow')return;const v=S.map[r][c];if(v!==2&&v!==11)return;
 S.fires=S.fires||[];if(S.fires.some(f=>f.c===c&&f.r===r))return;S.fires.push({c,r,t:v===11?10:7,v});
}
function tryIgniteAt(x,y){const c=Math.floor(x),r=Math.floor(y);if(Math.random()<0.3)ignite(c,r);if(Math.random()<0.25){for(const [i,j] of [[1,0],[-1,0],[0,1],[0,-1]])if(S.map[r+j]&&S.map[r+j][c+i]===11){ignite(c+i,r+j);break}}}
function stepFires(dt,alive){
 if(!S.fires||!S.fires.length)return;
 for(const f of S.fires){
  f.t-=dt;
  // quema a quien está dentro o pegado
  for(const u of alive){if(u.def.fly)continue;if(Math.abs(u.x-(f.c+0.5))<1&&Math.abs(u.y-(f.r+0.5))<1){u.hp-=6*dt;if(u.hp<=0)kill(u,null)}}
  if(Math.random()<dt*10)S.parts.push({x:(f.c+Math.random())*T,y:(f.r+0.4+Math.random()*0.5)*T-S.hgt[f.r][f.c]*8,vx:(Math.random()-0.5)*10,vy:-30-Math.random()*30,life:0.6,col:Math.random()<0.5?'#ff9a30':'#ffe066'});
  if(Math.random()<dt*0.5){const [i,j]=[[1,0],[-1,0],[0,1],[0,-1]][(Math.random()*4)|0];ignite(f.c+i,f.r+j)}
  if(f.t<=0){S.scorch=S.scorch||grid(0);if(f.v===11){S.map[f.r][f.c]=9;S.scorch[f.r][f.c]=2}else{S.map[f.r][f.c]=0;S.scorch[f.r][f.c]=1}S.terrDirty=true}
 }
 S.fires=S.fires.filter(f=>f.t>0);
}
function stepLava(){
 if(S.biome!=='volcan'&&S.biome!=='mixto')return;
 if(S.time<(S.lavaNext||30))return;S.lavaNext=S.time+25;
 const cand=[];for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){if(S.map[y][x]!==7||S.hgt[y][x]!==0||Math.min(dvOf(0,x,y),dvOf(1,x,y))<0.3)continue;if([[1,0],[-1,0],[0,1],[0,-1]].some(([i,j])=>S.map[y+j]&&S.map[y+j][x+i]===8&&S.hgt[y+j][x+i]===0))cand.push([x,y])}
 let n=0;for(const [x,y] of sortBy(cand,()=>Math.random())){if(n>=5)break;if(S.objs&&S.objs.some(o=>Math.abs(o.c-x)<=1&&Math.abs(o.r-y)<=1))continue;const before=reachCount();S.map[y][x]=8;if(reachCount()<before-1){S.map[y][x]=7;continue}n++;
  for(const u of S.units)if(u.alive&&!u.def.fly&&Math.floor(u.x)===x&&Math.floor(u.y)===y){u.hp-=30;if(u.hp<=0)kill(u,null)}}
 if(n){S.terrDirty=true;note('La lava avanza')}
}
// cuántas casillas se alcanzan a pie desde la zona del atacante (para no cerrar caminos)
function reachCount(){
 let s0=null;for(let y=0;y<ROWS&&!s0;y++)for(let x=0;x<COLS&&!s0;x++)if(!BLOCK(S.map[y][x])&&dvOf(1-S.def,x,y)<0.3)s0=[x,y];if(!s0)return 0;
 const sn=new Uint8Array(COLS*ROWS),st=[s0];sn[s0[1]*COLS+s0[0]]=1;let n=1;
 while(st.length){const [x,y]=st.pop();for(const [i,j] of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+i,yy=y+j;if(xx<0||yy<0||xx>=COLS||yy>=ROWS||sn[yy*COLS+xx]||!stepOK(x,y,xx,yy))continue;sn[yy*COLS+xx]=1;n++;st.push([xx,yy])}}return n;
}
// el terreno se vuelve a dibujar como mucho una vez por segundo
function refreshTerrain(now){if(S.terrDirty&&now-(S.terrT||0)>1000){S.terrDirty=false;S.terrT=now;renderTerrain();buildTrees()}}
