'use strict';
/* ================= CÁMARA: zoom y desplazamiento ================= */
// S.cam.z: 1 = vista general (todo el mapa), hasta ZMAX = vista cercana. x,y: esquina superior izquierda en píxeles del mundo.
const ZMAX=3.5;
S.cam={z:1,x:0,y:0};
function clampCam(){const c=S.cam;c.z=clamp(c.z,1,ZMAX);c.x=clamp(c.x,0,W-W/c.z);c.y=clamp(c.y,0,H-H/c.z)}
// acerca o aleja manteniendo fijo el punto (sx,sy) de la pantalla (en píxeles del canvas)
function zoomAt(f,sx,sy){const c=S.cam,wx=c.x+sx/c.z,wy=c.y+sy/c.z;c.z=clamp(c.z*f,1,ZMAX);c.x=wx-sx/c.z;c.y=wy-sy/c.z;clampCam();updZoomUI()}
function centerOn(wx,wy){const c=S.cam;c.x=wx-W/c.z/2;c.y=wy-H/c.z/2;clampCam()}
function resetCam(){S.cam.z=1;S.cam.x=0;S.cam.y=0;updZoomUI()}
const scr=e=>{const r=cv.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*W,y:(e.clientY-r.top)/r.height*H}};
const toWorld=p=>({x:S.cam.x+p.x/S.cam.z,y:S.cam.y+p.y/S.cam.z});
// minimapa (solo con zoom): esquina inferior izquierda
const MM={w:Math.round(W/6),h:Math.round(H/6),pad:10};
const mmRect=()=>({x:MM.pad,y:H-MM.h-MM.pad,w:MM.w,h:MM.h});
function drawMinimap(){
 if(S.cam.z<=1.02)return;const r=mmRect();
 ctx.fillStyle='#120c14';ctx.fillRect(r.x-3,r.y-3,r.w+6,r.h+6);ctx.drawImage(terrCv,r.x,r.y,r.w,r.h);
 const sx=r.w/W,sy=r.h/H;
 if(S.state==='battle'||S.state==='result'){for(const u of S.units)if(u.alive){ctx.fillStyle=u.side?'#ff6a4f':'#4aa3ff';ctx.fillRect(Math.round(r.x+u.x*T*sx)-1,Math.round(r.y+u.y*T*sy)-1,u.def.big?4:2,u.def.big?4:2)}}
 else for(const side of [0,1]){if(S.mode==='ai'&&side===1&&S.state!=='reveal')continue;if(S.mode==='pvp'&&side!==S.side&&S.state!=='setup'&&S.state!=='reveal')continue;for(const it of S.armies[side].units){ctx.fillStyle=side?'#ff6a4f':'#4aa3ff';ctx.fillRect(Math.round(r.x+(it.c+0.5)*T*sx)-1,Math.round(r.y+(it.r+0.5)*T*sy)-1,3,3)}}
 const c=S.cam;ctx.strokeStyle='#ffe9b0';ctx.lineWidth=2;ctx.strokeRect(r.x+c.x*sx,r.y+c.y*sy,W/c.z*sx,H/c.z*sy);
}
function inMinimap(p){if(S.cam.z<=1.02)return false;const r=mmRect();return p.x>=r.x&&p.y>=r.y&&p.x<=r.x+r.w&&p.y<=r.y+r.h}
function minimapJump(p){const r=mmRect();centerOn((p.x-r.x)/r.w*W,(p.y-r.y)/r.h*H)}
function updZoomUI(){const b=$('z-fit');if(b)b.disabled=S.cam.z<=1.02;const l=$('z-lvl');if(l)l.textContent='x'+S.cam.z.toFixed(1).replace('.',',')}

// --- entrada ---
const CAM={ptrs:new Map(),pan:null,pinch:null};
cv.addEventListener('wheel',e=>{e.preventDefault();zoomAt(Math.exp(-e.deltaY*(e.deltaMode?0.05:0.0016)),scr(e).x,scr(e).y)},{passive:false});
// fase de captura: se ejecuta antes que el pintado de tropas de ui.js
cv.addEventListener('pointerdown',e=>{
 const p=scr(e);CAM.ptrs.set(e.pointerId,p);
 if(CAM.ptrs.size===2){endPaint();const [a,b]=[...CAM.ptrs.values()];CAM.pinch={d:Math.hypot(a.x-b.x,a.y-b.y),m:{x:(a.x+b.x)/2,y:(a.y+b.y)/2}};CAM.pan=null;e.stopImmediatePropagation();return}
 if(e.button===0&&inMinimap(p)){CAM.mm=true;minimapJump(p);e.stopImmediatePropagation();try{cv.setPointerCapture(e.pointerId)}catch(_){}return}
 // en el despliegue el botón izquierdo coloca tropas; se mueve con el derecho/central o con dos dedos
 if(e.button===1||e.button===2||(S.state!=='deploy'&&e.button===0)){CAM.pan={x:p.x,y:p.y,cx:S.cam.x,cy:S.cam.y};try{cv.setPointerCapture(e.pointerId)}catch(_){}e.stopImmediatePropagation();e.preventDefault()}
},true);
cv.addEventListener('pointermove',e=>{
 if(!CAM.ptrs.has(e.pointerId))return;const p=scr(e);CAM.ptrs.set(e.pointerId,p);
 if(CAM.mm){minimapJump(p);return}
 if(CAM.pinch&&CAM.ptrs.size>=2){const [a,b]=[...CAM.ptrs.values()];const d=Math.hypot(a.x-b.x,a.y-b.y),m={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
  S.cam.x-=(m.x-CAM.pinch.m.x)/S.cam.z;S.cam.y-=(m.y-CAM.pinch.m.y)/S.cam.z;clampCam();if(CAM.pinch.d>8)zoomAt(d/CAM.pinch.d,m.x,m.y);CAM.pinch={d,m};return}
 if(CAM.pan){S.cam.x=CAM.pan.cx-(p.x-CAM.pan.x)/S.cam.z;S.cam.y=CAM.pan.cy-(p.y-CAM.pan.y)/S.cam.z;clampCam()}
},true);
const camUp=e=>{CAM.ptrs.delete(e.pointerId);if(CAM.ptrs.size<2)CAM.pinch=null;if(!CAM.ptrs.size){CAM.pan=null;CAM.mm=false}};
cv.addEventListener('pointerup',camUp,true);cv.addEventListener('pointercancel',camUp,true);
window.addEventListener('keydown',e=>{
 if(/^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement&&document.activeElement.tagName))return;
 const k=e.key,st=120/S.cam.z;if(k.startsWith('Arrow')&&S.cam.z<=1.02)return;
 if(k==='+'||k==='='){zoomAt(1.25,W/2,H/2)}else if(k==='-'||k==='_'){zoomAt(0.8,W/2,H/2)}else if(k==='0'){resetCam()}
 else if(k==='ArrowLeft'||k==='a'){S.cam.x-=st;clampCam()}else if(k==='ArrowRight'||k==='d'){S.cam.x+=st;clampCam()}
 else if(k==='ArrowUp'||k==='w'){S.cam.y-=st;clampCam()}else if(k==='ArrowDown'||k==='s'){S.cam.y+=st;clampCam()}else return;
 e.preventDefault();
});
$('z-in').onclick=()=>zoomAt(1.5,W/2,H/2);
$('z-out').onclick=()=>zoomAt(1/1.5,W/2,H/2);
$('z-fit').onclick=resetCam;
updZoomUI();
