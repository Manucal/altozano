'use strict';
/* ================= PROGRESIÓN DE TROPAS ================= */
// Contra la IA, cada tipo de tropa que usas gana experiencia. Al subir de nivel (máximo 5) eliges 1 de 2 mejoras.
// Se guarda en este navegador. En el modo de 2 jugadores no se aplica, para que el duelo sea parejo.
const PROGKEY='altozano.progreso.v1';
const LVLXP=[0,60,150,280,450];
const UPS={
 vida:{n:'+8% de vida'},ataque:{n:'+8% de ataque'},armadura:{n:'+1 de armadura'},velocidad:{n:'+6% de velocidad'},cadencia:{n:'Ataca un 6% más rápido'},
};
let PROG={};
try{PROG=JSON.parse(localStorage.getItem(PROGKEY)||'{}')||{}}catch(_){PROG={}}
function saveProg(){try{localStorage.setItem(PROGKEY,JSON.stringify(PROG))}catch(_){}}
const progOn=side=>S.mode==='ai'&&side===0&&!S.sim;
const progOf=id=>PROG[id]||(PROG[id]={xp:0,lvl:1,ups:{},pend:[]});
const lvlFor=xp=>{let l=1;for(let i=1;i<LVLXP.length;i++)if(xp>=LVLXP[i])l=i+1;return l};
const lvlOf=id=>PROG[id]?PROG[id].lvl:1;
function applyProg(u,side){
 if(!progOn(side))return;const p=PROG[u.def.id];if(!p)return;const k=p.ups;
 if(k.vida){u.max*=1+0.08*k.vida;u.hp=u.max}
 if(k.ataque)u.atkM=1+0.08*k.ataque;if(k.armadura)u.armB=k.armadura;if(k.velocidad)u.spdM=1+0.06*k.velocidad;if(k.cadencia)u.cdM=Math.pow(0.94,k.cadencia);
}
// experiencia tras la batalla: base + daño causado por ese tipo + bonus si ganas
function grantXP(){
 if(!progOn(0)||!S.result)return [];if(S.result.gains)return S.result.gains;
 const ids=[...new Set(S.armies[0].units.map(u=>u.id))],by=S.stats[0].byType,won=S.result.win===0,out=[];
 for(const id of ids){
  const p=progOf(id);if(p.lvl>=5)continue;const g=Math.round(Math.min(70,12+(by[id]||0)/25+(won?12:0)));p.xp+=g;
  const nl=lvlFor(p.xp);while(p.lvl<nl){p.lvl++;p.pend.push(sortBy(Object.keys(UPS),()=>Math.random()).slice(0,2))}
  out.push({id,g,lvl:p.lvl});
 }
 saveProg();return S.result.gains=out;
}
function progHTML(gains){
 if(!progOn(0))return '';
 const pend=Object.entries(PROG).filter(([,p])=>p.pend&&p.pend.length);
 const up=gains.filter(x=>x.lvl>1).length;
 return `<div class="prog"><p class="muted">Tus tropas ganan experiencia${gains.length?': '+gains.slice(0,6).map(x=>`${esc(UBY[x.id].name)} +${x.g}`).join(', ')+(gains.length>6?'…':''):''}.${up?'':''}</p>
 ${pend.slice(0,3).map(([id,p])=>`<div class="lvlup"><span><b>${esc(UBY[id].name)}</b> sube a nivel ${p.lvl-p.pend.length+1}. Elige mejora:</span><div class="row">${p.pend[0].map(k=>`<button class="btn" data-up="${id}" data-k="${k}">${esc(UPS[k].n)}</button>`).join('')}</div></div>`).join('')}</div>`;
}
function bindProg(gains){
 document.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>{const p=PROG[b.dataset.up];if(!p||!p.pend.length)return;const k=b.dataset.k;p.ups[k]=(p.ups[k]||0)+1;p.pend.shift();saveProg();const box=document.querySelector('.prog');if(box){box.outerHTML=progHTML(gains);bindProg(gains)}});
}
function upsText(id){const p=PROG[id];if(!p)return '';return Object.entries(p.ups).filter(([,v])=>v).map(([k,v])=>UPS[k].n.replace(/\d+%/,m=>parseInt(m)*v+'%').replace('+1 ','+'+v+' ')).join(', ')}
function resetProg(){PROG={};saveProg()}
