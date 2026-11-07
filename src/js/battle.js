'use strict';
/* ================= BATALLA ================= */
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function computeSyn(list){const cnt={};for(const it of list)for(const t of UBY[it.id].tr)cnt[t]=(cnt[t]||0)+1;const o={};for(const k in cnt){const tr=TRAITS[k].tiers;o[k]=cnt[k]>=tr[1]?2:cnt[k]>=tr[0]?1:0}return {tier:o,cnt}}
const tier=(side,t)=>S.syn[side].tier[t]||0;
function startBattle(){
 S.units=[];S.proj=[];S.parts=[];S.corpses=[];S.time=0;S.result=null;S.claims=new Set();
 S.stats=[{dmg:0,kills:0,byType:{}},{dmg:0,kills:0,byType:{}}];
 for(const side of [0,1]){
  const a=S.armies[side];S.syn[side]=computeSyn(a.units);
  for(const it of a.units){const def=UBY[it.id];S.units.push({def,side,x:it.c+0.5,y:it.r+0.5,hp:def.hp,max:def.hp,cd:0.3+Math.random()*0.6,tgt:null,ret:0,moved:0,anim:Math.random()*2,lunge:0,flash:0,alive:true,hold:false,dest:null,face:side?-1:1,moving:false,rad:def.big?0.55:def.mount?0.45:0.36,mass:def.big?3:def.mount?2:1})}
 }
 for(const u of S.units)if(u.def.rng>1&&!u.def.heal&&terrAt(u)===1)u.hold=true;
 S.total=[0,1].map(s=>S.units.filter(u=>u.side===s).reduce((a,u)=>a+u.def.cost,0));
 S.state='battle';S.lastPanel=0;renderPanel();
}
const elev=u=>(!u.def.fly&&terrAt(u)===1)?1:0;
function effRange(u,tg){
 let rg=u.def.rng;if(rg<=1)return rg;
 const hill=elev(u)===1,wid=S.weather.id;
 if(wid==='fog')rg=Math.min(rg,4)+(hill?1:0);else if(hill)rg+=2;
 if(tg&&(wid==='windE'||wid==='windW')&&!u.def.heal){const dir=Math.sign(tg.x-u.x),fav=wid==='windE'?1:-1;rg+=dir===fav?2:-2}
 return Math.max(2,rg);
}
function speedOf(u){
 let s=u.def.spd;const t=terrAt(u),wid=S.weather.id;
 if(!u.def.fly){
  if(t===1)s*=TER[1].mv;
  else if(t===2&&!u.def.tr.includes('Silvano'))s*=TER[2].mv;
  else if(t===3)s*=wid==='rain'?0.3:wid==='heat'?0.8:TER[3].mv;
 }
 if(wid==='snow'&&!u.def.tr.includes('Bestia'))s*=0.7;
 if(u.def.tr.includes('Montado')&&tier(u.side,'Montado')>=1)s*=1.2;
 return s;
}
function cool(u){let c=u.def.as;if(S.weather.id==='heat'&&u.def.arm>=4)c*=1.25;if(u.def.fly){const t=tier(u.side,'Volador');c/=t===2?1.5:t===1?1.25:1}return c*(0.92+Math.random()*0.16)}
function pickTarget(u){
 let best=null,bd=1e9;const ranged=u.def.fly;
 for(const e of S.units){if(!e.alive||e.side===u.side)continue;let d=dist(u,e);if(ranged&&e.def.rng>1)d*=0.45;if(d<bd){bd=d;best=e}}
 return best;
}
function pickHeal(u){let best=null,br=0.92;for(const a of S.units){if(!a.alive||a.side!==u.side||a===u)continue;const r=a.hp/a.max;if(r<br&&dist(u,a)<8){br=r;best=a}}return best}
function seekHill(u){
 if(elev(u)||u.def.fly||!u.tgt)return;
 if(u.dest&&S.claims.has(u.dest.k))return;
 const dT=dist(u,u.tgt);let best=null,bd=1e9;
 const c0=Math.floor(u.x),r0=Math.floor(u.y);
 for(let r=r0-5;r<=r0+5;r++)for(let c=c0-5;c<=c0+5;c++){
  if(r<0||c<0||r>=ROWS||c>=COLS||S.map[r][c]!==1)continue;const k=c+','+r;if(S.claims.has(k))continue;
  const p={x:c+0.5,y:r+0.5};const d=dist(u,p);if(d>5)continue;if(dist(p,u.tgt)>dT+1)continue;if(d<bd){bd=d;best={x:p.x,y:p.y,k}}
 }
 if(best){u.dest=best;S.claims.add(best.k)}
}
function moveTo(u,tx,ty,dt,stop){
 const dx=tx-u.x,dy=ty-u.y,d=Math.hypot(dx,dy);if(d<=stop){u.moving=false;return}
 const st=Math.min(speedOf(u)*dt,d-stop);u.x+=dx/d*st;u.y+=dy/d*st;u.moved+=st;u.moving=true;u.anim+=dt*speedOf(u)*2.6;
 if(Math.abs(dx)>0.05)u.face=Math.sign(dx);
}
function attack(u,tg){
 let base=u.def.atk;const ranged=u.def.rng>1,wid=S.weather.id;
 if(ranged){const t=tier(u.side,'Tirador');base*=t===2?1.3:t===1?1.15:1}
 if(u.def.tr.includes('Bestia')){const t=tier(u.side,'Bestia');base*=t===2?1.3:t===1?1.15:1}
 if(u.def.tr.includes('Silvano')){if(terrAt(u)===2){const t=tier(u.side,'Silvano');base*=t===2?1.4:t===1?1.25:1}if(wid==='fog')base*=1.2}
 const eu=elev(u),et=elev(tg);
 if(ranged&&eu>et)base*=1.25;
 if(!ranged&&!u.def.fly&&eu<et)base*=0.8;
 if(u.def.anti&&tg.def.tr.includes(u.def.anti))base*=2;
 if(u.def.charge&&u.moved>=3&&wid!=='snow'){base*=tier(u.side,'Montado')>=2?2.5:2;burst(tg.x*T,tg.y*T,'#ffe066',8)}
 u.moved=0;
 if(ranged){S.proj.push({x0:u.x*T,y0:(u.y*T)-6-(eu?3:0),t:0,dur:Math.max(0.15,dist(u,tg)/11),kind:u.def.proj,tgt:tg,att:u,base,lx:u.x*T,ly:u.y*T,col:u.def.sp.pal&&u.def.sp.pal.y})}
 else{u.lunge=0.15;deal(u,tg,base,false);if(u.def.splash){const t=tier(u.side,'Gigante'),f=t===2?1:t===1?0.75:0.5;for(const e of S.units)if(e.alive&&e.side!==u.side&&e!==tg&&dist(e,tg)<1.15)deal(u,e,base*f,false);burst(tg.x*T,tg.y*T,'#c9b27a',6)}}
}
function deal(att,tg,base,ranged){
 if(!tg.alive)return;
 let d=base;const wid=S.weather.id;
 if(ranged){
  if(!tg.def.fly&&terrAt(tg)===2)d*=0.6;
  if(tg.def.tr.includes('Escudo')){const t=tier(tg.side,'Escudo');d*=t===2?0.55:t===1?0.75:1}
  if(wid==='rain')d*=0.75;
 }
 if(tg.def.dodge&&Math.random()<tg.def.dodge){burst(tg.x*T,tg.y*T-8,'#ffffff',2);return}
 let arm=tg.def.arm;if(tg.def.tr.includes('Infanteria')){const t=tier(tg.side,'Infanteria');arm+=t===2?4:t===1?2:0}
 if(!tg.def.fly&&terrAt(tg)===3)arm-=3;
 if(att.def.pierce)arm=0;
 d=Math.max(1,d-Math.max(0,arm));
 tg.hp-=d;tg.flash=0.1;
 const st=S.stats[att.side];st.dmg+=d;st.byType[att.def.id]=(st.byType[att.def.id]||0)+d;
 if(tg.hp<=0){tg.alive=false;st.kills++;S.corpses.push({x:tg.x,y:tg.y,def:tg.def,face:tg.face,el:elev(tg),t:0});burst(tg.x*T,tg.y*T-4,'#b23a2a',10);if(tg.dest)S.claims.delete(tg.dest.k)}
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
  if(u.def.tr.includes('Silvano')){const t=tier(u.side,'Silvano');if((t>=1&&terrAt(u)===2)||t>=2)u.hp=Math.min(u.max,u.hp+3*dt)}
  if(u.ret<=0||!u.tgt||!u.tgt.alive){u.tgt=pickTarget(u);u.ret=0.4+Math.random()*0.2;if(u.def.rng>1&&!u.def.heal&&!u.hold)seekHill(u)}
  if(u.def.heal){
   const ally=pickHeal(u);
   if(ally){const d=dist(u,ally),hr=effRange(u,null);if(d<=hr){u.moving=false;u.face=Math.sign(ally.x-u.x)||u.face;if(u.cd<=0){doHeal(u,ally);u.cd=cool(u)}continue}else if(d<8){moveTo(u,ally.x,ally.y,dt,hr*0.8);continue}}
  }
  const tg=u.tgt;if(!tg){u.moving=false;continue}
  const d=dist(u,tg),rg=effRange(u,tg);
  const reach=u.def.rng<=1?0.78+(tg.def.big?0.22:0)+(u.def.big?0.22:0):rg;
  if(d<=reach){u.idle=0;u.moving=false;u.face=Math.sign(tg.x-u.x)||u.face;if(u.cd<=0){attack(u,tg);u.cd=cool(u)}}
  else{
   if(u.hold){u.idle=(u.idle||0)+dt;if((S.time>20&&d>rg+6)||u.idle>6)u.hold=false;else{u.moving=false;u.face=Math.sign(tg.x-u.x)||u.face;continue}}
   if(u.dest){moveTo(u,u.dest.x,u.dest.y,dt,0.05);if(dist(u,u.dest)<0.2){S.claims.delete(u.dest.k);u.dest=null;if(elev(u))u.hold=true}}
   else moveTo(u,tg.x,tg.y,dt,reach*0.9);
  }
 }
 // separación
 const al=S.units.filter(u=>u.alive);
 for(let i=0;i<al.length;i++){const a=al[i];for(let j=i+1;j<al.length;j++){const b=al[j];if(!!a.def.fly!==!!b.def.fly)continue;const dx=b.x-a.x,dy=b.y-a.y,rr=a.rad+b.rad,d2=dx*dx+dy*dy;if(d2<rr*rr&&d2>1e-6){const d=Math.sqrt(d2),p=(rr-d),nx=dx/d,ny=dy/d,tm=a.mass+b.mass;const fa=(a.hold?0.15:1)*b.mass/tm,fb=(b.hold?0.15:1)*a.mass/tm;a.x-=nx*p*fa;a.y-=ny*p*fa;b.x+=nx*p*fb;b.y+=ny*p*fb}}}
 for(const u of al){u.x=clamp(u.x,0.3,COLS-0.3);u.y=clamp(u.y,0.3,ROWS-0.3)}
 // proyectiles
 for(const p of S.proj){p.t+=dt;if(p.t>=p.dur){p.done=true;if(p.tgt.alive){if(p.kind==='heal'){p.tgt.hp=Math.min(p.tgt.max,p.tgt.hp+p.base);for(let i=0;i<4;i++)S.parts.push({x:p.tgt.x*T+(Math.random()-0.5)*8,y:p.tgt.y*T-6,vx:0,vy:-20,life:0.5,col:'#7dff8a'})}else deal(p.att,p.tgt,p.base,true)}}}
 S.proj=S.proj.filter(p=>!p.done);
 for(const c of S.corpses)c.t+=dt;
 const n0=al.filter(u=>u.side===0).length,n1=al.filter(u=>u.side===1).length;
 if(n0===0||n1===0||S.time>=TLIM)endBattle(n0,n1);
}
function valueLeft(side){return S.units.filter(u=>u.alive&&u.side===side).reduce((a,u)=>a+u.def.cost*u.hp/u.max,0)}
function endBattle(n0,n1){
 let win;if(n0===0&&n1===0)win=-1;else if(n1===0)win=0;else if(n0===0)win=1;else{const v0=valueLeft(0),v1=valueLeft(1);win=Math.abs(v0-v1)<0.5?-1:v0>v1?0:1}
 S.result={win,n:[n0,n1],timeout:S.time>=TLIM};S.state='result';renderPanel();showResult();
}
