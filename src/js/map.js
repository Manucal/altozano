'use strict';
/* ================= MAPA ================= */
function genMap(preset,seed){
 const r=rng(seed),m=Array.from({length:ROWS},()=>Array(COLS).fill(0));
 const blob=(type,cx,cy,rad)=>{for(let y=0;y<ROWS;y++)for(let x=0;x<15;x++){const dx=x+0.5-cx,dy=(y+0.5-cy)*1.15;if(Math.hypot(dx,dy)<=rad+(r()-0.5)*0.9)m[y][x]=type}};
 const R=(a,b)=>a+r()*(b-a);
 let river=false;
 if(preset==='gemelas'){blob(1,R(2.5,4),R(5,13),R(2.4,3));if(r()<0.7)blob(1,R(9,11),r()<0.5?R(2,4):R(14,16),R(1.4,2));blob(2,R(11,13.5),R(4,14),R(1.6,2.4))}
 else if(preset==='vado'){river=true;blob(1,R(3,6),R(3,6),R(1.6,2.2));blob(1,R(3,6),R(12,15),R(1.4,2));blob(2,R(8,11),R(7,11),R(1.5,2.2))}
 else if(preset==='bosque'){for(let i=0;i<4;i++)blob(2,R(12,15),R(1,17),R(1.8,2.6));blob(1,R(4,7),R(2,5),R(1.8,2.3));blob(1,R(4,7),R(13,16),R(1.8,2.3))}
 else if(preset==='meseta'){blob(1,15,R(7.5,10.5),R(3.4,4.2));blob(2,R(5,8),R(1,4),R(1.4,2));blob(2,R(5,8),R(14,17),R(1.4,2))}
 else{const nh=1+(r()*3|0),nf=1+(r()*3|0);for(let i=0;i<nh;i++)blob(1,R(1,14),R(1,17),R(1.4,3));for(let i=0;i<nf;i++)blob(2,R(5,15),R(1,17),R(1.3,2.6));river=r()<0.4}
 if(river){let w=0;for(let y=0;y<ROWS;y++){if(r()<0.25)w=1-w;m[y][14]=3;if(w)m[y][13]=3;else if(m[y][13]===3)m[y][13]=0}}
 for(let y=0;y<ROWS;y++)for(let x=0;x<15;x++)m[y][COLS-1-x]=m[y][x];
 return m;
}
function newField(keepSeed){
 if(!keepSeed)S.seed=(Math.random()*1e9)|0;
 S.map=genMap(S.preset,S.seed);
 const p=PRESETS.find(p=>p.id===S.preset);
 S.mapName=S.preset==='random'?'Campo n.º '+(S.seed%1000):p.n;
 S.weather=S.weatherSel==='random'?WEATHERS[(rng(S.seed^77)()*WEATHERS.length)|0]:WEATHERS.find(w=>w.id===S.weatherSel);
 S.armies=[{fac:S.armies[0].fac,units:[]},{fac:S.armies[1].fac,units:[]}];
 renderTerrain();buildTrees();initWeatherFx();renderFieldTag();
}
const terrAtTile=(c,r)=>S.map[clamp(r,0,ROWS-1)][clamp(c,0,COLS-1)];
const terrAt=u=>terrAtTile(Math.floor(u.x),Math.floor(u.y));

const terrCv=document.createElement('canvas');terrCv.width=W;terrCv.height=H;
const hex=c=>[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)];
function renderTerrain(){
 const x=terrCv.getContext('2d'),img=x.createImageData(W,H),d=img.data,r=rng(S.seed^0x9e37),m=S.map,wid=S.weather.id;
 const tint=wid==='snow'?[[236,242,250],0.3]:wid==='rain'?[[30,45,80],0.2]:wid==='heat'?[[235,190,90],0.14]:wid==='fog'?[[150,160,170],0.12]:null;
 const put=(px,py,rgb,mul=1)=>{let a=rgb[0]*mul,b=rgb[1]*mul,c=rgb[2]*mul;if(tint){const[t,k]=tint;a=a*(1-k)+t[0]*k;b=b*(1-k)+t[1]*k;c=c*(1-k)+t[2]*k}const i=(py*W+px)*4;d[i]=a;d[i+1]=b;d[i+2]=c;d[i+3]=255};
 const isT=(c,rr,t)=>c>=0&&c<COLS&&rr>=0&&rr<ROWS&&m[rr][c]===t;
 const CL=['#7a5a38','#6a4c2e','#5c4027'].map(hex),HI=hex('#c4dc78'),SAND=hex('#c9b27a'),DARKG=hex('#3c6e2c');
 const FL=['#e8d36a','#e88aa0','#f0f0f0'].map(hex);
 for(let ty=0;ty<ROWS;ty++)for(let tx=0;tx<COLS;tx++){
  const t=m[ty][tx],cols=TER[t].col.map(hex);
  for(let py=0;py<T;py++)for(let px=0;px<T;px++){
   const X=tx*T+px,Y=ty*T+py;let c=r()<0.6?cols[0]:r()<0.5?cols[1]:cols[2],mul=1;
   if(t===0){if(r()<0.04)c=DARKG;if(r()<0.01)c=FL[(r()*3)|0]}
   if(t===1){
    const south=!isT(tx,ty+1,1);
    if(south&&py>=12){c=CL[py===12?2:(r()<0.5?0:1)]}
    else if(south&&py===11)c=HI;
    else if(!isT(tx,ty-1,1)&&py===0)c=HI;
    if(!isT(tx-1,ty,1)&&px===0&&!(south&&py>=12))mul=0.82;
    if(!isT(tx+1,ty,1)&&px===15&&!(south&&py>=12))mul=0.82;
   }
   if(t===2&&r()<0.05)c=DARKG;
   if(t===3){
    if((py===0&&!isT(tx,ty-1,3))||(py===15&&!isT(tx,ty+1,3))||(px===0&&!isT(tx-1,ty,3))||(px===15&&!isT(tx+1,ty,3)))c=SAND;
   }
   put(X,Y,c,mul);
  }
 }
 // sombra de colina sobre la casilla inferior
 x.putImageData(img,0,0);
 x.fillStyle='rgba(0,0,0,0.18)';
 for(let ty=0;ty<ROWS-1;ty++)for(let tx=0;tx<COLS;tx++)if(m[ty][tx]===1&&m[ty+1][tx]!==1)x.fillRect(tx*T,(ty+1)*T,T,3);
}
function buildTrees(){
 const r=rng(S.seed^0x51ed);S.trees=[];
 for(let ty=0;ty<ROWS;ty++)for(let tx=0;tx<COLS;tx++)if(S.map[ty][tx]===2){
  const mx=tx<15?tx:COLS-1-tx;const rr=rng(S.seed^(ty*97+mx*13));const jx=(rr()-0.5)*5,jy=(rr()-0.5)*3;
  const flip=tx>=15;
  S.trees.push({x:tx*T+8+(flip?-jx:jx),y:ty*T+13+jy,v:(rr()*2)|0});
 }
}
