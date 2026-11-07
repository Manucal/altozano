'use strict';
/* ================= MAPA ================= */
// S.map: superficie (0 llanura, 2 bosque, 3 río, 4 rampa, 6 desierto, 7 ceniza volcánica, 8 lava). S.hgt: altura 0 (llano), 1 (colina) o 2 (montaña).
// Entre alturas distintas hay acantilado: solo se sube o baja por una rampa (casilla baja marcada como 4).
const grid=v=>Array.from({length:ROWS},()=>Array(COLS).fill(v));
// ruido suave (value noise + fbm) para que las regiones de bioma tengan formas orgánicas
function vnoise(seed){
 const hs=(i,j)=>{let h=Math.imul(i,374761393)^Math.imul(j,668265263)^Math.imul(seed|0,2246822519);h=Math.imul(h^h>>>13,1274126177);return((h^h>>>16)>>>0)/4294967296};
 const sm=t=>t*t*(3-2*t);
 const n=(x,y)=>{const i=Math.floor(x),j=Math.floor(y),fx=sm(x-i),fy=sm(y-j);const a=hs(i,j),b=hs(i+1,j),c=hs(i,j+1),d=hs(i+1,j+1);return a+(b-a)*fx+(c-a)*fy+(a-b-c+d)*fx*fy};
 return (x,y)=>(n(x,y)*0.57+n(x*2.03+17.1,y*2.03+5.3)*0.29+n(x*4.1+3.7,y*4.1+29.9)*0.14);
}
const BIOMES=[{id:'random',n:'Bioma aleatorio'},{id:'templado',n:'Templado'},{id:'mixto',n:'Mixto (desierto y volcán)'},{id:'desierto',n:'Desierto'},{id:'volcan',n:'Volcánico'}];
function genMap(preset,seed,d,theme){
 const r=rng(seed),m=grid(0),h=grid(0),A=1-d;
 const R=(a,b)=>a+r()*(b-a);
 const P=(side,dv,u)=>{const v=side===0?dv:2-dv;return {x:(v+u)/2*COLS,y:(v-u)/2*ROWS}};
 // forma redondeada con borde ondulado suave (sin picos de una casilla)
 const shape=(side,dv,u,rad,fn)=>{const c=P(side,dv,u),p1=r()*6.28,p2=r()*6.28,a1=R(0.08,0.2),a2=R(0.04,0.12),sx=R(0.8,1.25);
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){const dx=(x+0.5-c.x)/sx,dy=(y+0.5-c.y)*sx,th=Math.atan2(dy,dx),rr=rad*(1+a1*Math.sin(3*th+p1)+a2*Math.sin(5*th+p2)),dd=Math.hypot(dx,dy);if(dd<=rr)fn(x,y,dd/rr)}};
 const hill=(side,dv,u,rad)=>shape(side,dv,u,rad,(x,y)=>{if(m[y][x]!==3)h[y][x]=Math.max(h[y][x],1)});
 const mount=(side,dv,u,rad)=>shape(side,dv,u,rad,(x,y,k)=>{if(m[y][x]!==3)h[y][x]=Math.max(h[y][x],k<0.55?2:1)});
 const forest=(side,dv,u,rad)=>shape(side,dv,u,rad,(x,y)=>{if(m[y][x]!==3)m[y][x]=2});
 const pond=(side,dv,u,rad)=>shape(side,dv,u,rad,(x,y)=>{h[y][x]=0;m[y][x]=3});
 // río que serpentea en cualquier dirección, con vados cada 7-10 casillas
 const meander=()=>{const nzm=vnoise((seed^0x77)+(r()*1e6|0));const c0={x:R(COLS*0.25,COLS*0.75),y:R(ROWS*0.25,ROWS*0.75)},th0=r()*6.283,wid=R(0.95,1.3);const pts=[];
  for(const dir of [1,-1]){let x=c0.x,y=c0.y;const tb=th0+(dir<0?Math.PI:0);for(let i=0;i<300;i++){const th=tb+(nzm(i*0.05,dir*7)-0.5)*2.2*dir;x+=Math.cos(th)*0.5;y+=Math.sin(th)*0.5;if(x<-1||y<-1||x>COLS+1||y>ROWS+1)break;if(dir>0)pts.push([x,y]);else pts.unshift([x,y])}}
  const fords=[];for(let i=6+((r()*10)|0);i<pts.length-4;i+=20+((r()*8)|0))fords.push(pts[i]);
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){let dm=9;for(const p of pts){const d=Math.hypot(x+0.5-p[0],y+0.5-p[1]);if(d<dm)dm=d}if(dm<wid&&h[y][x]===0){m[y][x]=fords.some(f=>Math.hypot(x+0.5-f[0],y+0.5-f[1])<1.3)?0:3}}};
 // colinas repartidas: de varios candidatos, la más alejada de las alturas que ya hay
 const extraHills=n=>{for(let i=0;i<n;i++){let best=null,bs=-1;for(let k=0;k<12;k++){const side=r()<0.55?d:A,dv=R(0.3,1.0),u=R(-1,1)*Math.min(dv,2-dv)*0.8,c=P(side,dv,u);let dm=99;for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)if(h[y][x]){const dd=Math.hypot(x+0.5-c.x,(y+0.5-c.y)*1.3);if(dd<dm)dm=dd}if(dm>bs){bs=dm;best=[side,dv,u]}}hill(best[0],best[1],best[2],R(2.3,3.4))}};
 const river=(rv,w,fords)=>{for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){const dv=dvOf(d,x,y),u=uOf(x,y);if(Math.abs(dv-rv)<w){h[y][x]=0;m[y][x]=fords.some(f=>Math.abs(u-f)<0.06)?0:3}}};
 if(preset==='valle'){meander();meander();if(r()<0.5)meander();extraHills(4);mount(r()<0.6?d:A,R(0.4,0.8),R(-0.5,0.5),R(4,5));forest(d,R(0.5,0.9),R(-0.5,0.5),R(2,3));forest(A,R(0.5,0.9),R(-0.5,0.5),R(2,3))}
 else if(preset==='altiplano'){mount(d,R(0.4,0.6),R(-0.3,0.3),R(4.5,5.5));extraHills(5);forest(r()<0.5?d:A,R(0.6,0.9),R(-0.5,0.5),R(2,2.8));if(r()<0.7)meander()}
 else if(preset==='fortaleza'){mount(d,R(0.36,0.46),R(-0.15,0.15),R(5.5,6.5));forest(d,R(0.6,0.75),R(-0.6,-0.4),R(2.5,3.2));forest(d,R(0.6,0.75),R(0.4,0.6),R(2.5,3.2));hill(A,R(0.6,0.75),R(-0.3,0.3),R(2.6,3.4));forest(A,R(0.85,0.95),R(-0.5,0.5),R(1.8,2.4))}
 else if(preset==='rio'){hill(d,R(0.35,0.5),R(-0.3,0.3),R(3.4,4.2));mount(d,R(0.3,0.4),r()<0.5?-0.55:0.55,R(4,4.8));hill(A,R(0.5,0.65),R(-0.4,0.4),R(2.6,3.2));forest(d,R(0.55,0.65),R(-0.6,0.6),R(2.2,2.8));river(R(0.8,0.86),0.04,[R(-0.5,-0.2),R(0.2,0.5)])}
 else if(preset==='emboscada'){forest(d,R(0.82,0.92),R(-0.45,-0.25),R(3.4,4));forest(d,R(0.82,0.92),R(0.25,0.45),R(3.4,4));mount(d,R(0.32,0.42),R(-0.2,0.2),R(4.2,5));hill(A,R(0.55,0.7),R(-0.5,0.5),R(2.4,3))}
 else if(preset==='paso'){mount(d,R(0.92,1.0),-0.62,R(5.5,6.5));mount(d,R(0.92,1.0),0.62,R(5.5,6.5));hill(d,R(0.45,0.55),R(-0.1,0.1),R(3,3.6));hill(A,R(0.55,0.7),R(-0.2,0.2),R(2.2,2.8))}
 else if(preset==='oasis'){hill(d,R(0.3,0.45),R(-0.4,0.4),R(3.2,4));pond(d,R(0.72,0.8),R(-0.15,0.15),R(1.8,2.3));forest(d,R(0.66,0.84),R(-0.3,0.3),R(3.2,3.8));hill(A,R(0.55,0.7),R(-0.55,-0.3),R(2.6,3.2));hill(A,R(0.55,0.7),R(0.3,0.55),R(2.6,3.2));mount(r()<0.5?d:A,R(0.9,1.0),r()<0.5?-0.6:0.6,R(3.6,4.4))}
 else if(preset==='caldera'){mount(d,R(0.5,0.62),R(-0.15,0.15),R(6,7));hill(A,R(0.45,0.6),R(-0.5,0.5),R(2.6,3.4));forest(A,R(0.75,0.9),R(-0.6,0.6),R(2,2.6));river(R(0.95,1.02),0.035,[R(-0.55,-0.25),R(0.05,0.2),R(0.35,0.6)])}
 else if(preset==='cumbre'){mount(d,R(0.88,0.95),R(-0.1,0.1),R(6.5,7.5));forest(A,R(0.7,0.8),R(-0.6,-0.3),R(2.4,3));forest(d,R(0.6,0.7),R(0.3,0.6),R(2.4,3));hill(A,R(0.45,0.55),R(0.2,0.5),R(2.4,3))}
 else{
  const nr=r()<0.35?0:r()<0.77?1:2;for(let i=0;i<nr;i++)meander();
  mount(r()<0.7?d:A,R(0.35,0.9),R(-0.5,0.5),R(4.5,6.5));
  const nh=2+(r()*3|0),nf=1+(r()*3|0);
  extraHills(nh);
  for(let i=0;i<nf;i++)forest(r()<0.7?d:A,R(0.5,1.05),R(-0.6,0.6),R(2,3.6));
  if(r()<0.6)hill(A,R(0.4,0.8),R(-0.6,0.6),R(2,3.2));
  if(r()<0.25)river(R(0.78,0.95),0.04,[R(-0.6,-0.1),R(0.1,0.6)]);

 }
 if(preset!=='random'&&preset!=='valle'&&preset!=='altiplano'){extraHills(1+(r()*2|0));if(preset==='rio'||preset==='oasis'||(preset!=='paso'&&r()<0.35))meander()}
 // limpieza: sin salientes de una casilla; la montaña siempre rodeada de colina
 const at=(x,y)=>x<0||y<0||x>=COLS||y>=ROWS?-1:h[y][x];
 for(let it=0;it<2;it++)for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){const v=h[y][x];if(!v)continue;const n=[at(x+1,y),at(x-1,y),at(x,y+1),at(x,y-1)].filter(k=>k>=v||k===-1).length;if(n<2)h[y][x]=v-1}
 for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)if(h[y][x]===2){for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const k=at(x+i,y+j);if(k===0)h[y][x]=1}}
 for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)if(h[y][x]&&m[y][x]===3)m[y][x]=0;
 // biomas: desierto (6) y ceniza (7) por regiones de ruido suave; el bosque y el agua conservan una franja verde (oasis)
 const nz=vnoise(seed^0x3c1),nz2=vnoise(seed^0x7a5);
 const near=(x,y,k,rad)=>{for(let j=-rad;j<=rad;j++)for(let i=-rad;i<=rad;i++){const xx=x+i,yy=y+j;if(xx>=0&&yy>=0&&xx<COLS&&yy<ROWS&&m[yy][xx]===k&&i*i+j*j<=rad*rad+1)return true}return false};
 let hasH2=false;for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)if(h[y][x]===2)hasH2=true;
 const dH2=grid(99);for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)if(h[y][x]===2)for(let j=-6;j<=6;j++)for(let i=-6;i<=6;i++){const xx=x+i,yy=y+j;if(xx>=0&&yy>=0&&xx<COLS&&yy<ROWS)dH2[yy][xx]=Math.min(dH2[yy][xx],Math.hypot(i,j))}
 for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
  if(m[y][x]!==0)continue;
  const a=nz(x/8.5,y/8.5),b=nz2(x/7,y/7);
  if(theme==='desierto'){if(a>0.3&&!near(x,y,2,1)&&!near(x,y,3,2))m[y][x]=6}
  else if(theme==='volcan'){if(b>0.34&&!near(x,y,2,1))m[y][x]=7}
  else if(theme==='mixto'){
   const vol=hasH2&&dH2[y][x]<3.2+b*3;
   if(vol&&!near(x,y,2,1))m[y][x]=7;else if(a>0.6&&!near(x,y,2,1)&&!near(x,y,3,1))m[y][x]=6;
  }
 }
 if(theme==='volcan'||theme==='mixto')for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)if(m[y][x]===3)m[y][x]=theme==='volcan'?8:3;
 // rampas: cada meseta recibe varias, repartidas por su borde
 for(const L of [1,2]){
  const seen=grid(0);
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
   if(h[y][x]<L||seen[y][x])continue;
   const comp=[],st=[[x,y]];seen[y][x]=1;
   while(st.length){const [cx,cy]=st.pop();comp.push([cx,cy]);for(const [i,j] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=cx+i,ny=cy+j;if(at(nx,ny)>=L&&!seen[ny][nx]){seen[ny][nx]=1;st.push([nx,ny])}}}
   const cands=[];
   for(const [cx,cy] of comp){if(h[cy][cx]!==L)continue;for(const [i,j] of [[1,0],[-1,0],[0,1],[0,-1]]){const rx=cx+i,ry=cy+j,bx=rx+i,by=ry+j;if(at(rx,ry)===L-1&&at(bx,by)===L-1&&m[ry][rx]!==3&&m[by][bx]!==3&&m[ry][rx]!==8&&m[by][bx]!==8)cands.push([rx,ry])}}
   const want=Math.min(4,2+Math.floor(comp.length/45)),pick=[];
   if(cands.length){pick.push(cands[(r()*cands.length)|0]);
    while(pick.length<want){let best=null,bd=-1;for(const c of cands){const dm=Math.min(...pick.map(p=>Math.hypot(p[0]-c[0],p[1]-c[1])));if(dm>bd){bd=dm;best=c}}if(!best||bd<4)break;pick.push(best)}}
   for(const [rx,ry] of pick)m[ry][rx]=4;
  }
 }
 // lava: cráter en la cima de la montaña y charcos en el llano (solo si no cortan caminos)
 if(theme==='volcan'||theme==='mixto'){
  const pass=(x1,y1,x2,y2)=>{if(m[y2][x2]===8)return false;const a=h[y1][x1],b=h[y2][x2];if(a===b)return true;if(Math.abs(a-b)>1)return false;return (a<b?m[y1][x1]:m[y2][x2])===4};
  const reach=()=>{let s0=null;for(let y=0;y<ROWS&&!s0;y++)for(let x=0;x<COLS&&!s0;x++)if(m[y][x]!==8&&dvOf(1-d,x,y)<0.3)s0=[x,y];if(!s0)return 0;const sn=grid(0),st=[s0];sn[s0[1]][s0[0]]=1;let n=1;
   while(st.length){const [x,y]=st.pop();for(const [i,j] of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+i,yy=y+j;if(xx<0||yy<0||xx>=COLS||yy>=ROWS||sn[yy][xx]||!pass(x,y,xx,yy))continue;sn[yy][xx]=1;n++;st.push([xx,yy])}}return n};
  const tryLava=cells=>{if(!cells.length)return;const before=reach(),old=cells.map(([x,y])=>m[y][x]);for(const [x,y] of cells)m[y][x]=8;if(reach()<before-cells.length){cells.forEach(([x,y],i)=>m[y][x]=old[i])}};
  const crater=[];for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){if(h[y][x]!==2||m[y][x]===4)continue;let ok=true;for(let j=-2;j<=2&&ok;j++)for(let i=-2;i<=2&&ok;i++){if(i*i+j*j>5)continue;if(at(x+i,y+j)!==2)ok=false}if(ok)crater.push([x,y])}
  if(crater.length>2)tryLava(crater);
  const lv=vnoise(seed^0x1f3),pools=[];const thr=theme==='volcan'?0.7:0.76;
  for(let y=1;y<ROWS-1;y++)for(let x=1;x<COLS-1;x++){if(m[y][x]!==7&&m[y][x]!==0&&m[y][x]!==6)continue;if(h[y][x]!==0)continue;if(Math.min(dvOf(0,x,y),dvOf(1,x,y))<0.3)continue;
   let flat=true;for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++)if(h[y+j][x+i]!==0||m[y+j][x+i]===4||m[y+j][x+i]===3||m[y+j][x+i]===2)flat=false;
   if(flat&&lv(x/5,y/5)>thr&&(theme==='volcan'||m[y][x]===7))pools.push([x,y])}
  // agrupa en charcos y los prueba uno a uno
  const seenP=new Set();for(const c of pools){const k=c+'';if(seenP.has(k))continue;const blob=[],st=[c];seenP.add(k);while(st.length){const q=st.pop();blob.push(q);for(const o of pools){const ko=o+'';if(!seenP.has(ko)&&Math.abs(o[0]-q[0])+Math.abs(o[1]-q[1])===1){seenP.add(ko);st.push(o)}}}if(blob.length>=2&&blob.length<=14)tryLava(blob)}
  // la lava siempre queda rodeada de ceniza
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)if(m[y][x]===0||m[y][x]===6){if(near(x,y,8,1))m[y][x]=7}
 }
 return {m,h};
}
function newField(keepSeed){
 if(!keepSeed)S.seed=(Math.random()*1e9)|0;
 S.def=S.defSel==='random'?(rng(S.seed^99)()<0.5?0:1):+S.defSel;
 const p0=S.preset==='oasis'?'desierto':S.preset==='caldera'?'volcan':null;
 S.biome=p0||(S.biomeSel!=='random'?S.biomeSel:(()=>{const x=rng(S.seed^55)();return x<0.35?'templado':x<0.65?'mixto':x<0.83?'desierto':'volcan'})());
 const g=genMap(S.preset,S.seed,S.def,S.biome);S.map=g.m;S.hgt=g.h;
 const p=PRESETS.find(p=>p.id===S.preset);
 S.mapName=S.preset==='random'?'Campo n.º '+(S.seed%1000):p.n;
 S.weather=S.weatherSel==='random'?WEATHERS[(rng(S.seed^77)()*WEATHERS.length)|0]:WEATHERS.find(w=>w.id===S.weatherSel);
 S.armies=[{fac:S.armies[0].fac,units:[]},{fac:S.armies[1].fac,units:[]}];
 renderTerrain();buildTrees();initWeatherFx();renderFieldTag();
}
const terrAtTile=(c,r)=>S.map[clamp(r,0,ROWS-1)][clamp(c,0,COLS-1)];
const terrAt=u=>terrAtTile(Math.floor(u.x),Math.floor(u.y));
const hgtTile=(c,r)=>S.hgt[clamp(r,0,ROWS-1)][clamp(c,0,COLS-1)];
// ¿se puede pasar de una casilla a otra vecina? (acantilados solo por rampa)
function stepOK(c1,r1,c2,r2){
 if(c2<0||r2<0||c2>=COLS||r2>=ROWS)return false;
 if(S.map[r2][c2]===8)return false;
 const h1=S.hgt[r1][c1],h2=S.hgt[r2][c2];if(h1===h2)return true;if(Math.abs(h1-h2)>1)return false;
 const low=h1<h2?S.map[r1][c1]:S.map[r2][c2];return low===4;
}
function canMove(c1,r1,c2,r2){
 if(c1===c2&&r1===r2)return true;
 if(c1!==c2&&r1!==r2)return stepOK(c1,r1,c2,r1)&&stepOK(c2,r1,c2,r2)&&stepOK(c1,r1,c1,r2)&&stepOK(c1,r2,c2,r2);
 return stepOK(c1,r1,c2,r2);
}
function lineClear(x0,y0,x1,y1){
 const d=Math.hypot(x1-x0,y1-y0),n=Math.ceil(d/0.2);let pc=Math.floor(x0),pr=Math.floor(y0);
 for(let i=1;i<=n;i++){const t=i/n,c=Math.floor(x0+(x1-x0)*t),r=Math.floor(y0+(y1-y0)*t);if(c!==pc||r!==pr){if(Math.abs(c-pc)>1||Math.abs(r-pr)>1||!canMove(pc,pr,c,r))return false;pc=c;pr=r}}
 return true;
}
// A* en la cuadrícula (8 direcciones). Si no llega, devuelve el camino a la casilla más cercana al objetivo.
const NB8=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.414],[1,-1,1.414],[-1,1,1.414],[-1,-1,1.414]];
let _g=null,_par=null,_cl=null;
function findPath(sc,sr,tc,tr){
 const N=COLS*ROWS;if(!_g||_g.length!==N){_g=new Float32Array(N);_par=new Int32Array(N);_cl=new Uint8Array(N)}
 _g.fill(1e9);_cl.fill(0);const hf=(c,r)=>{const dx=Math.abs(c-tc),dy=Math.abs(r-tr);return Math.max(dx,dy)+0.414*Math.min(dx,dy)};
 const s=sr*COLS+sc,goal=tr*COLS+tc;_g[s]=0;_par[s]=-1;const heap=[[hf(sc,sr),s]];let best=s,bh=hf(sc,sr),exp=0;
 const push=e=>{heap.push(e);let i=heap.length-1;while(i>0){const p=(i-1)>>1;if(heap[p][0]<=heap[i][0])break;[heap[p],heap[i]]=[heap[i],heap[p]];i=p}};
 const pop=()=>{const top=heap[0],last=heap.pop();if(heap.length){heap[0]=last;let i=0;for(;;){const l=2*i+1,rr=l+1;let m=i;if(l<heap.length&&heap[l][0]<heap[m][0])m=l;if(rr<heap.length&&heap[rr][0]<heap[m][0])m=rr;if(m===i)break;[heap[m],heap[i]]=[heap[i],heap[m]];i=m}}return top};
 while(heap.length&&exp<2500){const [,cur]=pop();if(_cl[cur])continue;_cl[cur]=1;exp++;if(cur===goal){best=cur;break}
  const c=cur%COLS,r=(cur/COLS)|0,hh=hf(c,r);if(hh<bh){bh=hh;best=cur}
  for(const [i,j,w] of NB8){const nc=c+i,nr=r+j;if(nc<0||nr<0||nc>=COLS||nr>=ROWS)continue;const k=nr*COLS+nc;if(_cl[k]||!canMove(c,r,nc,nr))continue;
   const sf=S.map[nr][nc],cost=w*(sf===3?2:sf===2?1.4:sf===6?1.15:1);const g=_g[cur]+cost;if(g<_g[k]){_g[k]=g;_par[k]=cur;push([g+hf(nc,nr),k])}}}
 const out=[];for(let k=best;k!==s&&k>=0;k=_par[k])out.push({x:k%COLS+0.5,y:((k/COLS)|0)+0.5});
 return out.reverse();
}

const terrCv=document.createElement('canvas');terrCv.width=COLS*TT;terrCv.height=ROWS*TT;
const hex=c=>[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)];
function rampDir(c,r){const L=S.hgt[r][c]+1;for(const [i,j] of [[0,-1],[0,1],[-1,0],[1,0]]){const x=c+i,y=r+j;if(x>=0&&y>=0&&x<COLS&&y<ROWS&&S.hgt[y][x]===L)return [i,j]}return [0,-1]}
const PAL={gv:['#5d7a3c','#668444','#55703a'],fv:['#4a4f36','#42472f','#3a3f2a'],s0:['#d8c07a','#e0c988','#cdb46c'],s1:['#e2cc8a','#e9d597','#d6be7a'],s2:['#ecd9a2','#f2e2b0','#e2cd92'],a0:['#4e4646','#575050','#463e3e'],a1:['#5a5150','#635a58','#524948'],a2:['#675d5a','#706562','#5e5552'],lava:['#ffb040','#ff7a1a','#e0501a','#ffe070'],sandCliff:['#b8834e','#a5703e','#6e4626','#c99660'],ashCliff:['#3a3333','#302a2a','#1c1818','#4a4242'],g0:['#5f9e48','#69aa4f','#578f41'],g1:['#8fc25c','#9bcc66','#84b553'],g2:['#bcc08e','#c8cb9a','#adb281'],f:['#45793a','#3e7033','#376629'],w:['#2f6fa8','#3579b5','#2a6299'],ramp:['#b39466','#a68759','#c2a374'],cliff:['#7a5634','#684828','#4a321c','#8a6a44']};
function renderTerrain(){
 const x=terrCv.getContext('2d'),img=x.createImageData(COLS*TT,ROWS*TT),d=img.data,r=rng(S.seed^0x9e37),m=S.map,hg=S.hgt,wid=S.weather.id;
 const tint=wid==='snow'?[[236,242,250],0.3]:wid==='rain'?[[30,45,80],0.2]:wid==='heat'?[[235,190,90],0.14]:wid==='fog'?[[150,160,170],0.12]:null;
 const put=(px,py,rgb,mul=1)=>{let a=rgb[0]*mul,b=rgb[1]*mul,c=rgb[2]*mul;if(tint){const[t,k]=tint;a=a*(1-k)+t[0]*k;b=b*(1-k)+t[1]*k;c=c*(1-k)+t[2]*k}const i=(py*COLS*TT+px)*4;d[i]=a;d[i+1]=b;d[i+2]=c;d[i+3]=255};
 const H_=(c,rr)=>c<0||rr<0||c>=COLS||rr>=ROWS?null:hg[rr][c];
 const P={};for(const k in PAL)P[k]=PAL[k].map(hex);
 const SAND=hex('#c9b27a'),DARKG=hex('#3c6e2c'),STONE=hex('#8e8a78'),FL=['#e8d36a','#e88aa0','#f0f0f0'].map(hex),PEB=hex('#a08860'),CRACK=hex('#2a2222'),EMBER=hex('#ff7a2a'),LAVAC=hex('#7a2410');
 const pick=a=>r()<0.6?a[0]:r()<0.5?a[1]:a[2];
 // indicadores de bioma por casilla, interpolados por píxel con ruido: bordes orgánicos, sin cuadros
 const isD=(c,rr)=>{const v=m[rr][c];if(v===6)return 1;if(v===4){for(const [i,j] of [[1,0],[-1,0],[0,1],[0,-1]]){const x2=c+i,y2=rr+j;if(x2>=0&&y2>=0&&x2<COLS&&y2<ROWS&&m[y2][x2]===6)return 1}}return 0};
 const isA=(c,rr)=>{const v=m[rr][c];if(v===7||v===8)return 1;if(v===4){for(const [i,j] of [[1,0],[-1,0],[0,1],[0,-1]]){const x2=c+i,y2=rr+j;if(x2>=0&&y2>=0&&x2<COLS&&y2<ROWS&&(m[y2][x2]===7||m[y2][x2]===8))return 1}}return 0};
 const DI=[],AI=[],LI=[],FI=[],WI=[];for(let j=0;j<ROWS;j++){DI.push([]);AI.push([]);LI.push([]);FI.push([]);WI.push([]);for(let i=0;i<COLS;i++){DI[j].push(isD(i,j));AI[j].push(isA(i,j));LI[j].push(m[j][i]===8?1:0);FI[j].push(m[j][i]===2?1:0);WI[j].push(m[j][i]===3?1:0)}}
 const bil=(G,fx,fy)=>{const x=fx-0.5,y=fy-0.5,i=Math.floor(x),j=Math.floor(y),ax=x-i,ay=y-j;const g=(ii,jj)=>G[clamp(jj,0,ROWS-1)][clamp(ii,0,COLS-1)];return g(i,j)*(1-ax)*(1-ay)+g(i+1,j)*ax*(1-ay)+g(i,j+1)*(1-ax)*ay+g(i+1,j+1)*ax*ay};
 S.lavaPx=[];const pnA=vnoise(S.seed^0x5151),pnB=vnoise(S.seed^0x2b2b);
 const anyD=DI.some(r_=>r_.some(v=>v)),anyA=AI.some(r_=>r_.some(v=>v));
 const ground=(tx,ty,px,py,h)=>{
  const fx=tx+(px+0.5)/TT,fy=ty+(py+0.5)/TT,n1=pnA(fx*1.3,fy*1.3)-0.5;
  let c=pick(h===2?P.g2:h===1?P.g1:S.biome==='volcan'?P.gv:P.g0),kind=0,mul=1;
  {const k=clamp((bil(FI,fx,fy)+n1*0.6-0.34)/0.26,0,1);if(k>0&&r()<k){c=pick(S.biome==='volcan'?P.fv:P.f);mul=h===2?1.25:h===1?1.12:1;if(r()<0.05)c=DARKG;kind=4}}
  if(anyD){const k=clamp((bil(DI,fx,fy)+n1*0.6-0.36)/0.28,0,1);if(k>0&&r()<k){c=pick(h===2?P.s2:h===1?P.s1:P.s0);kind=1}}
  if(anyA){const k=clamp((bil(AI,fx,fy)+n1*0.6-0.36)/0.28,0,1);if(k>0&&r()<k){c=pick(h===2?P.a2:h===1?P.a1:P.a0);kind=2}}
  if(kind===0){if(h===2&&r()<0.06)c=STONE;if(h===0&&r()<0.04)c=DARKG;if(r()<0.008&&S.biome!=='volcan')c=FL[(r()*3)|0]}
  else if(kind===1){if(Math.sin((fx*1.7+fy*0.9)*6.283+n1*7)>0.86)mul=0.9;if(r()<0.006)c=PEB}
  else{const q=pnB(fx*2.2,fy*2.2);if(Math.abs(q-0.5)<0.012)c=CRACK;else if(r()<0.004)c=EMBER;}
  if(m[ty][tx]===8){const lv=bil(LI,fx,fy)+n1*0.5;
   if(lv>0.62){if(r()<0.02)S.lavaPx.push([tx*T+px*2+1,ty*T+py*2+1,r()*6.28]);const q=pnB(fx*2.6+9,fy*2.6+3);c=Math.abs(q-0.5)<0.03?LAVAC:q>0.6?P.lava[3]:q>0.45?P.lava[0]:q>0.3?P.lava[1]:P.lava[2];mul=1;kind=3}
   else if(lv>0.5){c=CRACK;mul=1}}
  return [c,mul,kind];
 };
 for(let ty=0;ty<ROWS;ty++)for(let tx=0;tx<COLS;tx++){
  const t=m[ty][tx],h=hg[ty][tx];
  const hs=H_(tx,ty+1),hn=H_(tx,ty-1),hw=H_(tx-1,ty),he=H_(tx+1,ty);
  const drop=hs===null?0:Math.max(0,h-hs);
  const southRampUp=hs!==null&&m[ty+1][tx]===4&&hs===h-1&&rampDir(tx,ty+1)[1]===-1;
  const face=southRampUp?0:drop*5;
  const rd=t===4?rampDir(tx,ty):null;
  const CL=DI[ty][tx]?P.sandCliff:AI[ty][tx]?P.ashCliff:P.cliff,LIP=DI[ty][tx]?hex('#f2e0a8'):AI[ty][tx]?hex('#7a6e6a'):hex('#d4e090');
  for(let py=0;py<TT;py++)for(let px=0;px<TT;px++){
   const X=tx*TT+px,Y=ty*TT+py;let c,mul=1;
   if(t===3){const fx=tx+(px+0.5)/TT,fy=ty+(py+0.5)/TT,wv=bil(WI,fx,fy)+(pnA(fx*1.3,fy*1.3)-0.5)*0.45;if(wv>0.47)c=pick(P.w);else if(wv>0.4)c=SAND;else{const gr=ground(tx,ty,px,py,h);c=gr[0];mul=gr[1]}}
   else if(t===4){c=pick(DI[ty][tx]?P.sandCliff:AI[ty][tx]?P.ashCliff:P.ramp);if(AI[ty][tx])mul=1.4;const along=rd[1]!==0?py:px;if(along%4===0)mul=0.8;if(along%4===1)mul=1.08;
    const k=rd[1]===-1?1-py/15:rd[1]===1?py/15:rd[0]===-1?1-px/15:px/15;mul*=0.85+0.3*k;const side=rd[1]!==0?px:py;if(side===0||side===15)c=P.cliff[2];else if(side===1||side===14)mul*=0.8}
   else{const gr=ground(tx,ty,px,py,h);c=gr[0];mul=gr[1]}
   if(h>0&&t!==4){
    if(face&&py>=TT-face){const k=TT-py;c=py===TT-face?CL[2]:(k%4===0?CL[2]:r()<0.5?CL[0]:CL[1]);if(drop===2&&py===TT-5)c=CL[2];if(py===TT-1)c=CL[2];mul=1-0.04*(py-(TT-face))}
    else if(face&&py===TT-face-1)c=LIP;
    else{if(hn!==null&&hn<h&&py===0)mul=1.2;if(hw!==null&&hw<h&&px===0)mul=0.62;else if(hw!==null&&hw<h&&px===1)mul=0.85;if(he!==null&&he<h&&px===15)mul=0.62;else if(he!==null&&he<h&&px===14)mul=0.85}
   }
   put(X,Y,c,mul);
  }
 }
 x.putImageData(img,0,0);
 // sombra del acantilado sobre la casilla de abajo
 for(let ty=0;ty<ROWS-1;ty++)for(let tx=0;tx<COLS;tx++){const k=hg[ty][tx]-hg[ty+1][tx];if(k>0&&m[ty+1][tx]!==4){x.fillStyle=`rgba(0,0,0,${0.18+0.08*k})`;x.fillRect(tx*TT,(ty+1)*TT,TT,2+2*k)}}
 for(let ty=0;ty<ROWS;ty++)for(let tx=1;tx<COLS;tx++){const k=hg[ty][tx-1]-hg[ty][tx];if(k>0&&m[ty][tx]!==4){x.fillStyle='rgba(0,0,0,0.2)';x.fillRect(tx*TT,ty*TT,2*k+1,TT)}}
}
function buildTrees(){
 const r=rng(S.seed^0x51ed);S.trees=[];
 for(let ty=0;ty<ROWS;ty++)for(let tx=0;tx<COLS;tx++)if(S.map[ty][tx]===2){
  const rr=rng(S.seed^(ty*97+tx*13));const jx=(rr()-0.5)*5,jy=(rr()-0.5)*3;
  let v=(rr()*2)|0,dz=0,az=0;for(let j=-2;j<=2;j++)for(let i=-2;i<=2;i++){const x=tx+i,y=ty+j;if(x<0||y<0||x>=COLS||y>=ROWS)continue;const k=S.map[y][x];if(k===6)dz++;if(k===7||k===8)az++}
  if(S.biome==='volcan'||az>=3)v=rr()<0.7?'burnt':v;else if(S.biome==='desierto'||dz>=3)v=rr()<0.8?'palm':v;
  S.trees.push({x:tx*T+16+jx*2,y:ty*T+27+jy*2,lift:S.hgt[ty][tx]*8,v});
 }
}
