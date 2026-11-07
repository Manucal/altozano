'use strict';
/* ================= BATALLA ================= */
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function computeSyn(list){const cnt={};for(const it of list)for(const t of UBY[it.id].tr)cnt[t]=(cnt[t]||0)+1;const o={};for(const k in cnt){const tr=TRAITS[k].tiers;o[k]=cnt[k]>=tr[1]?2:cnt[k]>=tr[0]?1:0}return {tier:o,cnt}}
const tier=(side,t)=>S.syn[side].tier[t]||0;
function mkUnit(def,side,x,y){
 const u={def,side,x,y,hp:def.hp/def.n,max:def.hp/def.n,cd:0.3+Math.random()*0.6,tgt:null,ret:0,moved:0,anim:Math.random()*2,lunge:0,flash:0,alive:true,hold:false,dest:null,face:side?-1:1,moving:false,rad:def.big?0.34:def.mount?0.24:0.17,mass:def.big?3:def.mount?2:1,sh:0,shMax:0,burn:0,raiseT:4,raised:0,risen:false};
 if(def.tr.includes('Draconico')){const t=tier(side,'Draconico');u.max=u.hp=def.hp/def.n*(t===2?1.35:t===1?1.2:1)}
 if(def.tr.includes('Celestial')){const t=tier(side,'Celestial');u.sh=u.shMax=u.max*(t===2?0.4:t===1?0.25:0)}
 return u;
}
function startBattle(){
 S.units=[];S.proj=[];S.parts=[];S.corpses=[];S.time=0;S.result=null;S.claims=new Set();
 S.stats=[{dmg:0,kills:0,byType:{}},{dmg:0,kills:0,byType:{}}];
 for(const side of [0,1]){
  const a=S.armies[side];S.syn[side]=computeSyn(a.units);
  for(const it of a.units){const def=UBY[it.id];for(const [ox,oy] of FORM[def.n])S.units.push(mkUnit(def,side,it.c+0.5+ox,it.r+0.5+oy))}
 }
 for(const u of S.units){if(u.def.rng>1&&!u.def.heal&&elev(u)>=1)u.hold=true;if(u.side===S.def&&!u.def.heal)u.guard=true}
 S.total=[0,1].map(s=>S.units.filter(u=>u.side===s).reduce((a,u)=>a+u.def.cost/u.def.n,0));S.count0=[0,1].map(s=>S.units.filter(u=>u.side===s).length);
 S.state='battle';S.lastPanel=0;renderPanel();
}
const elev=u=>u.def.fly?0:hgtTile(Math.floor(u.x),Math.floor(u.y));
function effRange(u,tg){
 let rg=u.def.rng;if(rg<=1)return rg;
 const hl=elev(u),wid=S.weather.id;
 if(wid==='fog')rg=Math.min(rg,4)+hl;else rg+=hl===2?3:hl===1?2:0;
 if(tg&&(wid==='windE'||wid==='windW')&&!u.def.heal){const dir=Math.sign(tg.x-u.x),fav=wid==='windE'?1:-1;rg+=dir===fav?2:-2}
 return Math.max(2,rg);
}
function speedOf(u){
 let s=u.def.spd;const t=terrAt(u),wid=S.weather.id;
 if(!u.def.fly){
  if(t===4)s*=TER[4].mv;
  else if(t===2&&!u.def.tr.includes('Silvano'))s*=TER[2].mv;
  else if(t===3)s*=wid==='rain'?0.3:wid==='heat'?0.8:TER[3].mv;
 }
 if(wid==='snow'&&!u.def.tr.includes('Bestia')&&!u.def.tr.includes('NoMuerto'))s*=0.7;
 if(u.def.tr.includes('Montado')&&tier(u.side,'Montado')>=1)s*=1.2;
 return s;
}
function cool(u){let c=u.def.as*u.def.n;if(S.weather.id==='heat'&&u.def.arm>=4)c*=1.25;if(S.weather.id==='snow'&&u.def.tr.includes('Draconico'))c*=1.2;if(u.def.frenzy&&u.hp<u.max*0.5)c*=0.67;if(u.def.fly){const t=tier(u.side,'Volador');c/=t===2?1.5:t===1?1.25:1}return c*(0.92+Math.random()*0.16)}
function pickTarget(u){
 let best=null,bd=1e9;const ranged=u.def.fly||u.def.hunter;
 for(const e of S.units){if(!e.alive||e.side===u.side)continue;let d=dist(u,e);if(ranged&&e.def.rng>1)d*=0.45;if(d<bd){bd=d;best=e}}
 return best;
}
function pickHeal(u){let best=null,br=0.92;for(const a of S.units){if(!a.alive||a.side!==u.side||a===u)continue;const r=a.hp/a.max;if(r<br&&dist(u,a)<8){br=r;best=a}}return best}
function seekHill(u){
 const cur=elev(u);if(cur>=2||u.def.fly||!u.tgt)return;
 if(u.dest&&S.claims.has(u.dest.k))return;
 const dT=dist(u,u.tgt);let best=null,bd=1e9;
 const c0=Math.floor(u.x),r0=Math.floor(u.y);
 for(let r=r0-7;r<=r0+7;r++)for(let c=c0-7;c<=c0+7;c++){
  if(r<0||c<0||r>=ROWS||c>=COLS||S.hgt[r][c]<=cur||S.map[r][c]===4)continue;const k=c+','+r;if(S.claims.has(k))continue;
  const p={x:c+0.5,y:r+0.5};const d=dist(u,p);if(d>7)continue;if(dist(p,u.tgt)>dT-0.5)continue;const sc=d-2*S.hgt[r][c];if(sc<bd){bd=sc;best={x:p.x,y:p.y,k}}
 }
 if(best){u.dest=best;S.claims.add(best.k)}
}
// mueve sin cruzar acantilados (si choca, se desliza por el borde)
function tryMove(u,nx,ny){
 if(u.def.fly){u.x=nx;u.y=ny;return true}
 const c1=Math.floor(u.x),r1=Math.floor(u.y);
 if(canMove(c1,r1,Math.floor(nx),Math.floor(ny))){u.x=nx;u.y=ny;return true}
 if(canMove(c1,r1,Math.floor(nx),r1)){u.x=nx;return true}
 if(canMove(c1,r1,c1,Math.floor(ny))){u.y=ny;return true}
 return false;
}
// camina hacia un punto buscando camino si hay acantilados por medio
function goTo(u,gx,gy,dt,stop){
 if(u.def.fly){moveTo(u,gx,gy,dt,stop);return}
 if(Math.hypot(gx-u.x,gy-u.y)<=stop){u.moving=false;return}
 u.pt=(u.pt||0)-dt;
 if(u.pt<=0){u.pt=1+Math.random()*0.6;u.path=lineClear(u.x,u.y,gx,gy)?null:findPath(Math.floor(u.x),Math.floor(u.y),Math.floor(gx),Math.floor(gy))}
 if(u.path&&u.path.length){
  while(u.path.length>1&&lineClear(u.x,u.y,u.path[1].x,u.path[1].y))u.path.shift();
  const p=u.path[0];if(Math.hypot(p.x-u.x,p.y-u.y)<0.25){u.path.shift();if(!u.path.length)u.path=null;return}
  moveTo(u,p.x,p.y,dt,0);
 }else moveTo(u,gx,gy,dt,stop);
}
function moveTo(u,tx,ty,dt,stop){
 const dx=tx-u.x,dy=ty-u.y,d=Math.hypot(dx,dy);if(d<=stop){u.moving=false;return}
 const st=Math.min(speedOf(u)*dt,d-stop);if(!tryMove(u,u.x+dx/d*st,u.y+dy/d*st)){u.pt=0;u.moving=false;return}u.moved+=st;u.moving=true;u.anim+=dt*speedOf(u)*2.6;
 if(Math.abs(dx)>0.05)u.face=Math.sign(dx);
}
function attack(u,tg){
 let base=u.def.atk;const ranged=u.def.rng>1,wid=S.weather.id;
 if(ranged){const t=tier(u.side,'Tirador');base*=t===2?1.3:t===1?1.15:1}
 if(u.def.tr.includes('Bestia')){const t=tier(u.side,'Bestia');base*=t===2?1.3:t===1?1.15:1}
 if(u.def.tr.includes('Silvano')){if(terrAt(u)===2){const t=tier(u.side,'Silvano');base*=t===2?1.4:t===1?1.25:1}if(wid==='fog')base*=1.2}
 if(wid==='heat'&&(u.def.tr.includes('Draconico')||u.def.tr.includes('Infernal')))base*=1.15;
 if(wid==='rain'&&u.def.tr.includes('Infernal'))base*=0.85;
 if(wid==='fog'&&u.def.tr.includes('Celestial'))base*=0.85;
 if(u.def.holy&&(tg.def.tr.includes('NoMuerto')||tg.def.tr.includes('Infernal')))base*=1.5;
 const eu=elev(u),et=elev(tg);
 if(ranged&&eu>et)base*=eu-et>=2?1.4:1.25;
 if(!ranged&&!u.def.fly&&eu<et)base*=1-0.2*(et-eu);
 if(u.def.anti&&tg.def.tr.includes(u.def.anti))base*=2;
 if(u.def.charge&&u.moved>=3&&wid!=='snow'){base*=tier(u.side,'Montado')>=2?2.5:2;burst(tg.x*T,tg.y*T,'#ffe066',8)}
 u.moved=0;
 if(ranged){S.proj.push({x0:u.x*T,y0:(u.y*T)-6-eu*8,t:0,dur:Math.max(0.15,dist(u,tg)/11),kind:u.def.proj,tgt:tg,att:u,base,lx:u.x*T,ly:u.y*T,col:u.def.sp.pal&&u.def.sp.pal.y})}
 else{u.lunge=0.15;deal(u,tg,base,false);if(u.def.splash){const t=tier(u.side,'Gigante'),f=t===2?0.7:t===1?0.5:0.35;for(const e of S.units)if(e.alive&&e.side!==u.side&&e!==tg&&dist(e,tg)<1.15)deal(u,e,base*f,false);burst(tg.x*T,tg.y*T,'#c9b27a',6)}}
}
function deal(att,tg,base,ranged){
 if(!tg.alive)return;
 let d=base;const wid=S.weather.id;
 if(ranged){
  const fire=att.def.proj==='fire';
  if(!tg.def.fly&&terrAt(tg)===2)d*=fire?1.25:0.6;
  if(tg.def.bones)d*=0.7;
  if(fire&&wid!=='rain'&&!tg.def.tr.includes('Infernal')){tg.burn=3;tg.burnDps=Math.max(tg.burnDps&&tg.burn>0?tg.burnDps:0,base*0.12)}
  if(tg.def.tr.includes('Escudo')){const t=tier(tg.side,'Escudo');d*=t===2?0.55:t===1?0.75:1}
  if(wid==='rain')d*=0.75;
 }
 if(tg.def.dodge&&Math.random()<tg.def.dodge){burst(tg.x*T,tg.y*T-8,'#ffffff',2);return}
 let arm=tg.def.arm;if(tg.def.tr.includes('Infanteria')){const t=tier(tg.side,'Infanteria');arm+=t===2?4:t===1?2:0}
 if(!tg.def.fly&&terrAt(tg)===3)arm-=3;
 if(att.def.pierce)arm=0;
 d=Math.max(1,d-Math.max(0,arm));
 const st=S.stats[att.side];st.dmg+=d;st.byType[att.def.id]=(st.byType[att.def.id]||0)+d;
 tg.flash=0.1;
 if(tg.sh>0){const a=Math.min(tg.sh,d);tg.sh-=a;d-=a;if(d<=0)return}
 tg.hp-=d;
 if(tg.hp<=0)kill(tg,att);
}
function kill(tg,att){
 if(tg.def.tr.includes('NoMuerto')&&!tg.risen){const t=tier(tg.side,'NoMuerto'),ch=t===2?0.45:t===1?0.25:0;if(Math.random()<ch){tg.risen=true;tg.hp=tg.max*0.4;tg.burn=0;burst(tg.x*T,tg.y*T-6,'#b06aff',12);return}}
 tg.alive=false;
 if(att){S.stats[att.side].kills++;if(att.alive&&att.def.tr.includes('Infernal')){const t=tier(att.side,'Infernal');if(t)att.hp=Math.min(att.max,att.hp+att.max*(t===2?0.35:0.2))}}
 S.corpses.push({x:tg.x,y:tg.y,def:tg.def,face:tg.face,el:elev(tg),t:0});burst(tg.x*T,tg.y*T-4,tg.def.tr.includes('NoMuerto')?'#e6e0cc':'#b23a2a',10);if(tg.dest)S.claims.delete(tg.dest.k);
}
function doHeal(u,ally){
 let a=u.def.heal;const t=tier(u.side,'Mistico');a*=t===2?1.6:t===1?1.3:1;if(S.weather.id==='rain')a*=1.2;
 S.proj.push({x0:u.x*T,y0:u.y*T-8,t:0,dur:Math.max(0.2,dist(u,ally)/8),kind:'heal',tgt:ally,att:u,base:a});
}
function burst(x,y,col,n){for(let i=0;i<n;i++)S.parts.push({x,y,vx:(Math.random()-0.5)*60,vy:-Math.random()*50-10,life:0.4+Math.random()*0.4,col})}
function step(dt){
 S.time+=dt;
 const alive=S.units.filter(u=>u.alive);
 for(let i=alive.length-1;i>0;i--){const j=(Math.random()*(i+1))|0;const t=alive[i];alive[i]=alive[j];alive[j]=t}
 for(const u of alive){
  if(!u.alive)continue;
  u.flash=Math.max(0,u.flash-dt);u.lunge=Math.max(0,u.lunge-dt);u.cd-=dt;u.ret-=dt;
  if(u.burn>0){u.burn-=dt;u.hp-=(u.burnDps||2)*dt;if(Math.random()<dt*6)S.parts.push({x:u.x*T+(Math.random()-0.5)*6,y:u.y*T-4,vx:0,vy:-25,life:0.35,col:'#ff9a30'});if(u.hp<=0){kill(u,null);continue}}
  if(u.def.raise){u.raiseT-=dt;if(u.raiseT<=0){u.raiseT=1;for(let q=0;q<2&&u.raised<8;q++){const c=S.corpses.find(c=>!c.used&&!c.def.big&&Math.hypot(c.x-u.x,c.y-u.y)<5);if(c){c.used=true;u.raised++;u.raiseT=4;const z=mkUnit(UBY.esqueleto,u.side,c.x,c.y);z.risen=true;S.units.push(z);burst(c.x*T,c.y*T-4,'#b06aff',12)}}}}
  if(u.def.tr.includes('Silvano')){const t=tier(u.side,'Silvano');if((t>=1&&terrAt(u)===2)||t>=2)u.hp=Math.min(u.max,u.hp+u.max*0.03*dt)}
  if(u.ret<=0||!u.tgt||!u.tgt.alive){u.tgt=pickTarget(u);u.ret=0.4+Math.random()*0.2;if(u.def.rng>1&&!u.def.heal&&!u.hold&&!(u.seekCD>S.time))seekHill(u)}
  if(u.def.heal){
   const ally=pickHeal(u);
   if(ally){const d=dist(u,ally),hr=effRange(u,null);if(d<=hr){u.moving=false;u.face=Math.sign(ally.x-u.x)||u.face;if(u.cd<=0){doHeal(u,ally);u.cd=cool(u)}continue}else if(d<8){goTo(u,ally.x,ally.y,dt,hr*0.8);continue}}
  }
  const tg=u.tgt;if(!tg){u.moving=false;continue}
  const d=dist(u,tg),rg=effRange(u,tg);
  const reach=u.def.rng<=1?0.42+(tg.def.big?0.2:0)+(u.def.big?0.2:0)+(tg.def.mount?0.06:0)+(u.def.mount?0.06:0):rg;
  const blocked=u.def.rng<=1&&!u.def.fly&&!tg.def.fly&&d<=reach&&!lineClear(u.x,u.y,tg.x,tg.y);
  if(d<=reach&&!blocked){u.idle=0;u.moving=false;u.face=Math.sign(tg.x-u.x)||u.face;if(u.cd<=0){attack(u,tg);u.cd=cool(u)}}
  else{
   if(u.guard){if(d<rg+5||S.time>60||u.hp<u.max)u.guard=false;else{u.moving=false;u.face=Math.sign(tg.x-u.x)||u.face;continue}}
   if(u.hold){u.idle=(u.idle||0)+dt;if(u.side!==S.def&&((S.time>20&&d>rg+6)||u.idle>6)){u.hold=false;u.seekCD=S.time+25}else{u.moving=false;u.face=Math.sign(tg.x-u.x)||u.face;continue}}
   if(u.dest){goTo(u,u.dest.x,u.dest.y,dt,0.05);if(dist(u,u.dest)<0.2){S.claims.delete(u.dest.k);u.dest=null;if(elev(u))u.hold=true}}
   else goTo(u,tg.x,tg.y,dt,blocked?0:reach*0.9);
  }
 }
 // separación
 const al=S.units.filter(u=>u.alive);
 for(let i=0;i<al.length;i++){const a=al[i];for(let j=i+1;j<al.length;j++){const b=al[j];if(!!a.def.fly!==!!b.def.fly)continue;const dx=b.x-a.x,dy=b.y-a.y,rr=a.rad+b.rad,d2=dx*dx+dy*dy;if(d2<rr*rr&&d2>1e-6){const d=Math.sqrt(d2),p=(rr-d),nx=dx/d,ny=dy/d,tm=a.mass+b.mass;const fa=(a.hold?0.15:1)*b.mass/tm,fb=(b.hold?0.15:1)*a.mass/tm;tryMove(a,a.x-nx*p*fa,a.y-ny*p*fa);tryMove(b,b.x+nx*p*fb,b.y+ny*p*fb)}}}
 for(const u of al){u.x=clamp(u.x,0.3,COLS-0.3);u.y=clamp(u.y,0.3,ROWS-0.3)}
 // proyectiles
 for(const p of S.proj){p.t+=dt;if(p.t>=p.dur){p.done=true;if(p.tgt.alive){if(p.kind==='heal'){p.tgt.hp=Math.min(p.tgt.max,p.tgt.hp+p.base);for(let i=0;i<4;i++)S.parts.push({x:p.tgt.x*T+(Math.random()-0.5)*8,y:p.tgt.y*T-6,vx:0,vy:-20,life:0.5,col:'#7dff8a'})}else{deal(p.att,p.tgt,p.base,true);if(p.att.def.splash){const t=tier(p.att.side,'Gigante'),f=t===2?0.7:t===1?0.5:0.35;for(const e of S.units)if(e.alive&&e.side!==p.att.side&&e!==p.tgt&&dist(e,p.tgt)<1.2)deal(p.att,e,p.base*f,true);burst(p.tgt.x*T,p.tgt.y*T-4,'#ff9a30',6)}}}}}
 S.proj=S.proj.filter(p=>!p.done);
 for(const c of S.corpses)c.t+=dt;
 const n0=al.filter(u=>u.side===0).length,n1=al.filter(u=>u.side===1).length;
 if(n0===0||n1===0||S.time>=TLIM)endBattle(n0,n1);
}
function valueLeft(side){return S.units.filter(u=>u.alive&&u.side===side).reduce((a,u)=>a+u.def.cost/u.def.n*u.hp/u.max,0)}
function endBattle(n0,n1){
 let win;if(n0===0&&n1===0)win=-1;else if(n1===0)win=0;else if(n0===0)win=1;else win=S.def;
 S.result={win,n:[n0,n1],timeout:S.time>=TLIM};S.state='result';renderPanel();showResult();
}
