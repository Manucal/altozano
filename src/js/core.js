'use strict';
const T=16,COLS=30,ROWS=18,W=COLS*T,H=ROWS*T,ZONE=7,CAP=60,MAXU=50,TLIM=120;
const cv=document.getElementById('cv'),ctx=cv.getContext('2d');
ctx.imageSmoothingEnabled=false;
const $=id=>document.getElementById(id);

function rng(seed){let a=seed>>>0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const sortBy=(arr,f)=>arr.map(t=>[f(t),t]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
