'use strict';
/* ================= VENTANAS FLOTANTES ================= */
// El panel de mando flota sobre el mapa: se puede plegar y arrastrar por su barra de título.
const WIN={el:$('win'),drag:null,lastState:null};
const narrow=()=>matchMedia('(max-width:760px)').matches;
function setWinMin(on){WIN.el.classList.toggle('min',on);const b=$('win-min');b.textContent=on?'+':'−';b.setAttribute('aria-expanded',String(!on));b.setAttribute('aria-label',on?'Desplegar ventana':'Plegar ventana')}
function syncWin(){
 const t={setup:'Campo de batalla',deploy:'Tu ejército',handoff:'Tu ejército',battle:'Batalla',result:'Batalla',reveal:'Revelación'}[S.state]||'Altozano';
 $('win-title').textContent=S.state==='deploy'?playerLabel(S.side):t;
 // al cambiar de fase se vuelve a abrir (salvo en batalla en pantallas pequeñas, para ver el mapa)
 if(S.state!==WIN.lastState){WIN.lastState=S.state;setWinMin(S.state==='battle'&&narrow())}
}
$('win-min').onclick=()=>setWinMin(!WIN.el.classList.contains('min'));
$('win-head').addEventListener('pointerdown',e=>{
 if(e.target.closest('button')||narrow())return;
 const r=WIN.el.getBoundingClientRect();WIN.drag={dx:e.clientX-r.left,dy:e.clientY-r.top};
 try{$('win-head').setPointerCapture(e.pointerId)}catch(_){}e.preventDefault();
});
$('win-head').addEventListener('pointermove',e=>{
 if(!WIN.drag)return;const w=WIN.el.offsetWidth,h=$('win-head').offsetHeight;
 const x=clamp(e.clientX-WIN.drag.dx,0,innerWidth-w),y=clamp(e.clientY-WIN.drag.dy,0,innerHeight-h);
 WIN.el.style.left=x+'px';WIN.el.style.top=y+'px';WIN.el.style.right='auto';
});
const endDrag=()=>{WIN.drag=null};
$('win-head').addEventListener('pointerup',endDrag);$('win-head').addEventListener('pointercancel',endDrag);
$('win-head').addEventListener('dblclick',e=>{if(!e.target.closest('button'))setWinMin(!WIN.el.classList.contains('min'))});
// si la ventana queda fuera al cambiar el tamaño, vuelve a su sitio
addEventListener('resize',()=>{if(narrow()||WIN.el.getBoundingClientRect().right>innerWidth||WIN.el.getBoundingClientRect().bottom>innerHeight+40){WIN.el.style.left='';WIN.el.style.top='';WIN.el.style.right=''}});
