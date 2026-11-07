'use strict';
/* ================= EJÉRCITO AUTOMÁTICO / IA ================= */
function zoneTiles(side){const o=[];for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)if(dvOf(side,c,r)<ZV)o.push({c,r});return o}
const inZone=(t,side)=>!!t&&dvOf(side,t.c,t.r)<ZV;
const capFor=side=>side===S.def?CAP:CAP+CAPB;
function autoArmy(side,fi){
 const pool=UNITS.filter(u=>u.f===fi),r=Math.random;
 const role=u=>u.heal?'heal':u.fly?'fly':u.rng>1?'ranged':u.big?'big':u.charge?'mount':'melee';
 const by={};pool.forEach(u=>(by[role(u)]=by[role(u)]||[]).push(u));
 const zone=zoneTiles(side),m=S.map,wid=S.weather.id;
 const hills=zone.filter(t=>m[t.r][t.c]===1);
 const wf=wid==='windE'?(side===0?1:-1):wid==='windW'?(side===1?1:-1):0;
 const isDef=side===S.def;
 const wts={ranged:0.36+(hills.length>=6?0.16:0)+(wid==='fog'||wid==='rain'?-0.16:0)+wf*0.1,heal:0.1,melee:0.3,big:0.12,mount:wid==='snow'?0.03:isDef?0.07:0.12,fly:0.08};
 let cap=capFor(side);const picks=[];const minC=Math.min(...pool.map(p=>p.cost));
 for(let tries=0;tries<500&&picks.length<MAXU&&cap>=minC;tries++){
  const roles=Object.keys(wts).filter(k=>by[k]);const tot=roles.reduce((a,k)=>a+wts[k],0);let x=r()*tot,k=roles[0];
  for(const kk of roles){x-=wts[kk];if(x<=0){k=kk;break}}
  if(k==='heal'&&picks.filter(p=>p.heal).length>=3)continue;
  const u=by[k][(r()*by[k].length)|0];if(u.cost<=cap){picks.push(u);cap-=u.cost}
 }
 const occ=new Set(),units=[];
 const depth=t=>(ZV-dvOf(side,t.c,t.r))*10;
 const fl=t=>Math.abs(uOf(t.c,t.r))*9;
 const sil=u=>u.tr.includes('Silvano');
 const key={
  ranged:(t,u)=>m[t.r][t.c]===1?depth(t)*0.2+r()*0.3:(sil(u)&&m[t.r][t.c]===2)?5+depth(t)*0.2+r()*0.3:10-depth(t)+fl(t)*0.05+r()*0.6,
  big:t=>depth(t)+fl(t)*0.1+r()*0.5,
  melee:t=>depth(t)+fl(t)*0.06+r()*0.8,
  mount:t=>depth(t)*0.6-fl(t)*0.3+r()*0.6,
  heal:t=>Math.abs(depth(t)-3.5)+fl(t)*0.1+r()*0.5,
  fly:t=>Math.abs(depth(t)-4)+r(),
 };
 for(const k of ['ranged','big','melee','mount','heal','fly']){
  for(const u of picks.filter(p=>role(p)===k)){
   const cands=sortBy(zone,t=>key[k](t,u));
   for(const t of cands){const kk=t.c+','+t.r;if(!occ.has(kk)){occ.add(kk);units.push({id:u.id,c:t.c,r:t.r});break}}
  }
 }
 return {fac:fi,units};
}

function aiArmy(){
 const f=(Math.random()*FACTIONS.length)|0;if(Math.random()>0.35)return autoArmy(1,f);
 const g=(f+1+((Math.random()*(FACTIONS.length-1))|0))%FACTIONS.length;
 const A=autoArmy(1,f),B=autoArmy(1,g);const occ=new Set(),units=[];let cost=0;
 const all=sortBy([...A.units,...B.units],()=>Math.random());
 for(const u of all){const k=u.c+','+u.r,c=UBY[u.id].cost;if(occ.has(k)||cost+c>capFor(1)||units.length>=MAXU)continue;occ.add(k);units.push(u);cost+=c}
 return {fac:f,units};
}
