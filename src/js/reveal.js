'use strict';
/* ================= DESPLIEGUE A CIEGAS Y REVELACIÓN ================= */
// Cada bando despliega sin ver al otro. Después se revelan los dos ejércitos y hay REVT segundos
// para recolocar hasta REVMOVES grupos propios dentro de la zona. Contra la IA solo mueves tú;
// a 2 jugadores mueve primero el defensor y después el atacante.
const REVT=15,REVMOVES=3;
function startReveal(){
 S.state='reveal';S.revOrder=S.mode==='ai'?[0]:[S.def,1-S.def];S.revIdx=0;beginRevSide();
}
function beginRevSide(){
 S.side=S.revOrder[S.revIdx];S.revT=REVT;S.revMoves=0;S.revPick=null;S.revWait=S.mode==='pvp';
 renderPanel();renderHud();
 if(S.revWait){showOverlay(`<h2>Revelación: ${esc(playerLabel(S.side))}</h2><p>Ya se ven los dos ejércitos. Tienes ${REVT} s para mover hasta ${REVMOVES} de tus grupos dentro de tu zona.</p><button class="btn primary" id="ov-go">Empezar</button>`);$('ov-go').onclick=()=>{hideOverlay();S.revWait=false}}
}
function endRevSide(){
 S.revPick=null;S.revIdx++;
 if(S.revIdx<S.revOrder.length)beginRevSide();else{startBattle();renderHud()}
}
function stepReveal(dt){
 if(S.state!=='reveal'||S.revWait)return;S.revT-=dt;if(S.revT<=0)endRevSide();
}
function revHTML(){
 const left=REVMOVES-S.revMoves;
 return `<div class="sec"><div class="who"><span class="dot ${S.side?'p2':'p1'}"></span><h3>${esc(playerLabel(S.side))}: revelación</h3></div>
  <p class="note" style="color:var(--ink)">Ya ves el ejército rival. Toca uno de tus grupos y luego una casilla libre de tu zona para moverlo. Te quedan <b>${left}</b> ${left===1?'movimiento':'movimientos'}.</p>
  <div class="meter"><span>Tiempo</span><div class="bar"><i id="rev-bar" style="width:${Math.max(0,S.revT/REVT*100)}%"></i></div><b id="rev-t">${Math.max(0,Math.ceil(S.revT))} s</b></div></div>
  <div class="sec"><h2>Rival · ${esc(armyFacName(S.armies[1-S.side]))}</h2>${synHTML(S.armies[1-S.side].units,null)}</div>
  <button class="btn primary" id="b-revgo">${S.revIdx<S.revOrder.length-1?'Terminar mi turno':'¡A la batalla!'}</button>`;
}
function bindRev(){$('b-revgo').onclick=()=>{if(S.state==='reveal')endRevSide()}}
function updRevTimer(){const b=$('rev-bar'),t=$('rev-t');if(b)b.style.width=Math.max(0,S.revT/REVT*100)+'%';if(t)t.textContent=Math.max(0,Math.ceil(S.revT))+' s'}
cv.addEventListener('pointerdown',e=>{
 if(S.state!=='reveal'||S.revWait||e.button!==0)return;const p=scr(e);if(inMinimap(p))return;
 const t=tileOf(e);if(!t)return;const a=S.armies[S.side],idx=a.units.findIndex(u=>u.c===t.c&&u.r===t.r);
 if(e.pointerType==='touch'){REV.touch={t,idx,p};return}
 revClick(t,idx);e.stopImmediatePropagation();e.preventDefault();
},true);
const REV={touch:null};
cv.addEventListener('pointerup',e=>{const d=REV.touch;REV.touch=null;if(!d||S.state!=='reveal'||CAM.ptrs.size>1)return;const q=scr(e);if(Math.hypot(q.x-d.p.x,q.y-d.p.y)>12)return;revClick(d.t,d.idx)},true);
function revClick(t,idx){
 const a=S.armies[S.side];
 if(idx>=0){S.revPick=S.revPick===idx?null:idx;return}
 if(S.revPick==null){toast('Toca primero uno de tus grupos.');return}
 if(S.revMoves>=REVMOVES){toast('Ya usaste tus '+REVMOVES+' movimientos.');S.revPick=null;return}
 if(!inZone(t,S.side)){toast('Solo puedes moverlo dentro de tu zona.');return}
 const it=a.units[S.revPick];it.c=t.c;it.r=t.r;S.revMoves++;S.revPick=null;
 S.marks.push({x:t.c+0.5,y:t.r+0.5,t:0,col:'#7ddc7a'});renderPanel();
}
