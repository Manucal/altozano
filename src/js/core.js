'use strict';
const T=16,COLS=30,ROWS=18,W=COLS*T,H=ROWS*T,ZV=0.64,CAP=60,CAPB=0,MAXU=50,TLIM=120;
// Geometría diagonal: v=0 esquina azul (arriba-izquierda), v=2 esquina roja (abajo-derecha); u recorre la línea del frente.
const vOf=(c,r)=>(c+0.5)/COLS+(r+0.5)/ROWS, uOf=(c,r)=>(c+0.5)/COLS-(r+0.5)/ROWS;
const dvOf=(side,c,r)=>side===0?vOf(c,r):2-vOf(c,r);
const cv=document.getElementById('cv'),ctx=cv.getContext('2d');
ctx.imageSmoothingEnabled=false;
const $=id=>document.getElementById(id);

function rng(seed){let a=seed>>>0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const sortBy=(arr,f)=>arr.map(t=>[f(t),t]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
