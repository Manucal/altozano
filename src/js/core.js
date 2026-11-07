'use strict';
const T=32,TT=16,COLS=44,ROWS=26,W=COLS*T,H=ROWS*T,ZV=0.6,CAP=60,CAPB=0,MAXU=30,TLIM=150,ELITEMAX=2;
// T: píxeles de pantalla por casilla. TT: tamaño de la textura del terreno (se dibuja a x2).
// MAXU: máximo de grupos por ejército. Cada grupo tiene def.n soldados.
const SQUAD={lancero:4,arquero:4,ballestero:3,caballero:3,clerigo:2,saqueador:4,hachero:4,jinete:3,bruto:1,chaman:2,guarda:4,danza:3,arboreo:1,druida:2,halcon:3,escamado:4,escupefuego:3,drakejinete:3,draco:1,sacerdotisa:2,esqueleto:5,arqesq:4,espectral:3,abominacion:1,nigromante:1,diablillo:4,cornudo:3,hechicera:3,sabueso:3,senor:1,guardian:3,arqluz:3,valquiria:2,sanadora:2,arcangel:1,paladin:1,caudillo:1,acechadora:2,magma:1,liche:1,segador:1,serafin:1};
// posiciones de cada soldado dentro de su casilla
const FORM={1:[[0,0]],2:[[-0.2,0],[0.2,0]],3:[[-0.2,-0.17],[0.2,-0.17],[0,0.2]],4:[[-0.2,-0.2],[0.2,-0.2],[-0.2,0.2],[0.2,0.2]],5:[[-0.24,-0.2],[0.24,-0.2],[0,0],[-0.24,0.22],[0.24,0.22]]};
// Geometría diagonal: v=0 esquina azul (arriba-izquierda), v=2 esquina roja (abajo-derecha); u recorre la línea del frente.
const vOf=(c,r)=>(c+0.5)/COLS+(r+0.5)/ROWS, uOf=(c,r)=>(c+0.5)/COLS-(r+0.5)/ROWS;
const dvOf=(side,c,r)=>side===0?vOf(c,r):2-vOf(c,r);
const cv=document.getElementById('cv'),ctx=cv.getContext('2d');
ctx.imageSmoothingEnabled=false;
const $=id=>document.getElementById(id);

function rng(seed){let a=seed>>>0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const sortBy=(arr,f)=>arr.map(t=>[f(t),t]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
