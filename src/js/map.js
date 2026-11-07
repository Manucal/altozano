'use strict';
/* ================= MAPA ================= */
// S.map: superficie (0 llanura, 2 bosque, 3 río, 4 rampa). S.hgt: altura 0 (llano), 1 (colina) o 2 (montaña).
// Entre alturas distintas hay acantilado: solo se sube o baja por una rampa (casilla baja marcada como 4).
const grid=v=>Array.from({length:ROWS},()=>Array(COLS).fill(v));
function genMap(preset,seed,d){
 const r=rng(seed),m=grid(0),h=grid(0),A=1-d;
 const R=(a,b)=>a+r()*(b-a);
 const P=(side,dv,u)=>{const v=side===0?dv:2-dv;return {x:(v+u)/2*COLS,y:(v-u)/2*ROWS}};
 // forma redondeada con borde ondulado suave (sin picos de una casilla)
 const shape=(side,dv,u,rad,fn)=>{const c=P(side,dv,u),p1=r()*6.28,p2=r()*6.28,a1=R(0.08,0.2),a2=R(0.04,0.12),sx=R(0.8,1.25);
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){const dx=(x+0.5-c.x)/sx,dy=(y+0.5-c.y)*sx,th=Math.atan2(dy,dx),rr=rad*(1+a1*Math.sin(3*th+p1)+a2*Math.sin(5*th+p2)),dd=Math.hypot(dx,dy);if(dd<=rr)fn(x,y,dd/rr)}};
 const hill=(side,dv,u,rad)=>shape(side,dv,u,rad,(x,y)=>{h[y][x]=Math.max(h[y][x],1)});
 const mount=(side,dv,u,rad)=>shape(side,dv,u,rad,(x,y,k)=>{h[y][x]=Math.max(h[y][x],k<0.55?2:1)});
 const forest=(side,dv,u,rad)=>shape(side,dv,u,rad,(x,y)=>{m[y][x]=2});
 const river=(rv,w,fords)=>{for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){const dv=dvOf(d,x,y),u=uOf(x,y);if(Math.abs(dv-rv)<w){h[y][x]=0;m[y][x]=fords.some(f=>Math.abs(u-f)<0.06)?0:3}}};
 if(preset==='fortaleza'){mount(d,R(0.36,0.46),R(-0.15,0.15),R(5.5,6.5));forest(d,R(0.6,0.75),R(-0.6,-0.4),R(2.5,3.2));forest(d,R(0.6,0.75),R(0.4,0.6),R(2.5,3.2));hill(A,R(0.6,0.75),R(-0.3,0.3),R(2.6,3.4));forest(A,R(0.85,0.95),R(-0.5,0.5),R(1.8,2.4))}
 else if(preset==='rio'){hill(d,R(0.35,0.5),R(-0.3,0.3),R(3.4,4.2));mount(d,R(0.3,0.4),r()<0.5?-0.55:0.55,R(4,4.8));hill(A,R(0.5,0.65),R(-0.4,0.4),R(2.6,3.2));forest(d,R(0.55,0.65),R(-0.6,0.6),R(2.2,2.8));river(R(0.8,0.86),0.04,[R(-0.5,-0.2),R(0.2,0.5)])}
 else if(preset==='emboscada'){forest(d,R(0.82,0.92),R(-0.45,-0.25),R(3.4,4));forest(d,R(0.82,0.92),R(0.25,0.45),R(3.4,4));mount(d,R(0.32,0.42),R(-0.2,0.2),R(4.2,5));hill(A,R(0.55,0.7),R(-0.5,0.5),R(2.4,3))}
 else if(preset==='paso'){mount(d,R(0.92,1.0),-0.62,R(5.5,6.5));mount(d,R(0.92,1.0),0.62,R(5.5,6.5));hill(d,R(0.45,0.55),R(-0.1,0.1),R(3,3.6));hill(A,R(0.55,0.7),R(-0.2,0.2),R(2.2,2.8))}
 else if(preset==='cumbre'){mount(d,R(0.88,0.95),R(-0.1,0.1),R(6.5,7.5));forest(A,R(0.7,0.8),R(-0.6,-0.3),R(2.4,3));forest(d,R(0.6,0.7),R(0.3,0.6),R(2.4,3));hill(A,R(0.45,0.55),R(0.2,0.5),R(2.4,3))}
 else{
  mount(r()<0.7?d:A,R(0.35,0.9),R(-0.5,0.5),R(4.5,6.5));
  const nh=1+(r()*2|0),nf=1+(r()*3|0);
  for(let i=0;i<nh;i++)hill(d,R(0.3,0.8),R(-0.6,0.6),R(2.4,4));
  for(let i=0;i<nf;i++)forest(r()<0.7?d:A,R(0.5,1.05),R(-0.6,0.6),R(2,3.6));
  if(r()<0.6)hill(A,R(0.4,0.8),R(-0.6,0.6),R(2,3.2));
  if(r()<0.35)river(R(0.78,0.95),0.04,[R(-0.6,-0.1),R(0.1,0.6)]);
 }
 // limpieza: sin salientes de una casilla; la montaña siempre rodeada de colina
 const at=(x,y)=>x<0||y<0||x>=COLS||y>=ROWS?-1:h[y][x];
 for(let it=0;it<2;it++)for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){const v=h[y][x];if(!v)continue;const n=[at(x+1,y),at(x-1,y),at(x,y+1),at(x,y-1)].filter(k=>k>=v||k===-1).length;if(n<2)h[y][x]=v-1}
 for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)if(h[y][x]===2){for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const k=at(x+i,y+j);if(k===0)h[y][x]=1}}
 for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)if(h[y][x]&&m[y][x]===3)m[y][x]=0;
 // rampas: cada meseta recibe varias, repartidas por su borde
 for(const L of [1,2]){
  const seen=grid(0);
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
   if(h[y][x]<L||seen[y][x])continue;
   const comp=[],st=[[x,y]];seen[y][x]=1;
   while(st.length){const [cx,cy]=st.pop();comp.push([cx,cy]);for(const [i,j] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=cx+i,ny=cy+j;if(at(nx,ny)>=L&&!seen[ny][nx]){seen[ny][nx]=1;st.push([nx,ny])}}}
   const cands=[];
   for(const [cx,cy] of comp){if(h[cy][cx]!==L)continue;for(const [i,j] of [[1,0],[-1,0],[0,1],[0,-1]]){const rx=cx+i,ry=cy+j,bx=rx+i,by=ry+j;if(at(rx,ry)===L-1&&at(bx,by)===L-1&&m[ry][rx]!==3&&m[by][bx]!==3)cands.push([rx,ry])}}
   const want=Math.min(4,2+Math.floor(comp.length/45)),pick=[];
   if(cands.length){pick.push(cands[(r()*cands.length)|0]);
    while(pick.length<want){let best=null,bd=-1;for(const c of cands){const dm=Math.min(...pick.map(p=>Math.hypot(p[0]-c[0],p[1]-c[1])));if(dm>bd){bd=dm;best=c}}if(!best||bd<4)break;pick.push(best)}}
   for(const [rx,ry] of pick)m[ry][rx]=4;
  }
 }
 return {m,h};
}
function newField(keepSeed){
 if(!keepSeed)S.seed=(Math.random()*1e9)|0;
 S.def=S.defSel==='random'?(rng(S.seed^99)()<0.5?0:1):+S.defSel;
 const g=genMap(S.preset,S.seed,S.def);S.map=g.m;S.hgt=g.h;
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
   const cost=w*(S.map[nr][nc]===3?2:S.map[nr][nc]===2?1.4:1);const g=_g[cur]+cost;if(g<_g[k]){_g[k]=g;_par[k]=cur;push([g+hf(nc,nr),k])}}}
 const out=[];for(let k=best;k!==s&&k>=0;k=_par[k])out.push({x:k%COLS+0.5,y:((k/COLS)|0)+0.5});
 return out.reverse();
}

const terrCv=document.createElement('canvas');terrCv.width=COLS*TT;terrCv.height=ROWS*TT;
const hex=c=>[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)];
function rampDir(c,r){const L=S.hgt[r][c]+1;for(const [i,j] of [[0,-1],[0,1],[-1,0],[1,0]]){const x=c+i,y=r+j;if(x>=0&&y>=0&&x<COLS&&y<ROWS&&S.hgt[y][x]===L)return [i,j]}return [0,-1]}
const PAL={g0:['#5f9e48','#69aa4f','#578f41'],g1:['#8fc25c','#9bcc66','#84b553'],g2:['#bcc08e','#c8cb9a','#adb281'],f:['#45793a','#3e7033','#376629'],w:['#2f6fa8','#3579b5','#2a6299'],ramp:['#b39466','#a68759','#c2a374'],cliff:['#7a5634','#684828','#4a321c','#8a6a44']};
function renderTerrain(){
 const x=terrCv.getContext('2d'),img=x.createImageData(COLS*TT,ROWS*TT),d=img.data,r=rng(S.seed^0x9e37),m=S.map,hg=S.hgt,wid=S.weather.id;
 const tint=wid==='snow'?[[236,242,250],0.3]:wid==='rain'?[[30,45,80],0.2]:wid==='heat'?[[235,190,90],0.14]:wid==='fog'?[[150,160,170],0.12]:null;
 const put=(px,py,rgb,mul=1)=>{let a=rgb[0]*mul,b=rgb[1]*mul,c=rgb[2]*mul;if(tint){const[t,k]=tint;a=a*(1-k)+t[0]*k;b=b*(1-k)+t[1]*k;c=c*(1-k)+t[2]*k}const i=(py*COLS*TT+px)*4;d[i]=a;d[i+1]=b;d[i+2]=c;d[i+3]=255};
 const H_=(c,rr)=>c<0||rr<0||c>=COLS||rr>=ROWS?null:hg[rr][c];
 const P={};for(const k in PAL)P[k]=PAL[k].map(hex);
 const SAND=hex('#c9b27a'),DARKG=hex('#3c6e2c'),STONE=hex('#8e8a78'),FL=['#e8d36a','#e88aa0','#f0f0f0'].map(hex);
 const pick=a=>r()<0.6?a[0]:r()<0.5?a[1]:a[2];
 for(let ty=0;ty<ROWS;ty++)for(let tx=0;tx<COLS;tx++){
  const t=m[ty][tx],h=hg[ty][tx];
  const hs=H_(tx,ty+1),hn=H_(tx,ty-1),hw=H_(tx-1,ty),he=H_(tx+1,ty);
  const drop=hs===null?0:Math.max(0,h-hs);
  const southRampUp=hs!==null&&m[ty+1][tx]===4&&hs===h-1&&rampDir(tx,ty+1)[1]===-1;
  const face=southRampUp?0:drop*5;
  const rd=t===4?rampDir(tx,ty):null;
  for(let py=0;py<TT;py++)for(let px=0;px<TT;px++){
   const X=tx*TT+px,Y=ty*TT+py;let c,mul=1;
   if(t===3){c=pick(P.w);if((py===0&&hn!==null&&m[ty-1][tx]!==3)||(py===15&&hs!==null&&m[ty+1][tx]!==3)||(px===0&&hw!==null&&m[ty][tx-1]!==3)||(px===15&&he!==null&&m[ty][tx+1]!==3))c=SAND}
   else if(t===4){c=pick(P.ramp);const along=rd[1]!==0?py:px;if(along%4===0)mul=0.8;if(along%4===1)mul=1.08;
    const k=rd[1]===-1?1-py/15:rd[1]===1?py/15:rd[0]===-1?1-px/15:px/15;mul*=0.85+0.3*k;const side=rd[1]!==0?px:py;if(side===0||side===15)c=P.cliff[2];else if(side===1||side===14)mul*=0.8}
   else if(t===2){c=pick(P.f);mul=h===2?1.25:h===1?1.12:1;if(r()<0.05)c=DARKG}
   else{c=pick(h===2?P.g2:h===1?P.g1:P.g0);if(h===2&&r()<0.06)c=STONE;if(h===0&&r()<0.04)c=DARKG;if(r()<0.008)c=FL[(r()*3)|0]}
   if(h>0&&t!==4){
    if(face&&py>=TT-face){const k=TT-py;c=py===TT-face?P.cliff[2]:(k%4===0?P.cliff[2]:r()<0.5?P.cliff[0]:P.cliff[1]);if(drop===2&&py===TT-5)c=P.cliff[2];if(py===TT-1)c=P.cliff[2];mul=1-0.04*(py-(TT-face))}
    else if(face&&py===TT-face-1)c=hex('#d4e090');
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
  S.trees.push({x:tx*T+16+jx*2,y:ty*T+27+jy*2,lift:S.hgt[ty][tx]*8,v:(rr()*2)|0});
 }
}
