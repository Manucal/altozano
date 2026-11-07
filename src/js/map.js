'use strict';
/* ================= MAPA ================= */
// S.map: superficie (0 llanura, 2 bosque, 3 río, 4 rampa, 6 desierto, 7 ceniza volcánica, 8 lava, 9 ruinas, 10 muro, 11 casa, 12 camino).
const BLOCK=v=>v===8||v===10||v===11; // infranqueables a pie S.hgt: altura 0 (llano), 1 (colina) o 2 (montaña).
// Entre alturas distintas hay acantilado: solo se sube o baja por una rampa (casilla baja marcada como 4).
const grid=v=>Array.from({length:ROWS},()=>Array(COLS).fill(v));
// ruido suave (value noise + fbm) para que las regiones de bioma tengan formas orgánicas
function vnoise(seed){
 const hs=(i,j)=>{let h=Math.imul(i,374761393)^Math.imul(j,668265263)^Math.imul(seed|0,2246822519);h=Math.imul(h^h>>>13,1274126177);return((h^h>>>16)>>>0)/4294967296};
 const sm=t=>t*t*(3-2*t);
 const n=(x,y)=>{const i=Math.floor(x),j=Math.floor(y),fx=sm(x-i),fy=sm(y-j);const a=hs(i,j),b=hs(i+1,j),c=hs(i,j+1),d=hs(i+1,j+1);return a+(b-a)*fx+(c-a)*fy+(a-b-c+d)*fx*fy};
 return (x,y)=>(n(x,y)*0.57+n(x*2.03+17.1,y*2.03+5.3)*0.29+n(x*4.1+3.7,y*4.1+29.9)*0.14);
}
const BIOMES=[{id:'random',n:'Bioma aleatorio'},{id:'templado',n:'Templado'},{id:'mixto',n:'Mixto (desierto y volcán)'},{id:'desierto',n:'Desierto'},{id:'volcan',n:'Volcánico'},{id:'ruinas',n:'Ruinas antiguas'},{id:'pueblo',n:'Pueblo'}];
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
 // ruinas: suelo de losas en una o dos zonas (los muros se ponen después de las rampas)
 if(theme==='ruinas'){const nr=vnoise(seed^0x9a1);for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)if((m[y][x]===0)&&nr(x/7,y/7)>0.56)m[y][x]=9}
 // pueblo: caminos que cruzan el mapa pasando por los pueblos
 const villages=[];
 if(theme==='pueblo'){
  const nv=1+(r()<0.6?1:0);
  for(let i=0;i<nv;i++){let best=null,bs=-1;for(let k=0;k<30;k++){const side=i===0?d:(r()<0.5?d:A),dv=R(0.55,1.05),u=R(-1,1)*Math.min(dv,2-dv)*0.6,c=P(side,dv,u),cx=Math.floor(c.x),cy=Math.floor(c.y);if(cx<3||cy<3||cx>COLS-4||cy>ROWS-4)continue;let flat=0;for(let j=-3;j<=3;j++)for(let q=-3;q<=3;q++){if(h[cy+j]&&h[cy+j][cx+q]===0&&m[cy+j][cx+q]!==3)flat++}const sp=Math.min(99,...villages.map(v=>Math.hypot(v.x-cx,v.y-cy)));const sc=flat+Math.min(sp,14);if(sc>bs){bs=sc;best={x:cx,y:cy}}}if(best)villages.push(best)}
  const road=(x0,y0,x1,y1)=>{let x=x0,y=y0;for(let i=0;i<200;i++){if(x>=0&&y>=0&&x<COLS&&y<ROWS&&h[y][x]===0)m[y][x]=12;if(x===x1&&y===y1)break;const dx=x1-x,dy=y1-y;if(Math.abs(dx)>Math.abs(dy)||(Math.abs(dx)===Math.abs(dy)&&r()<0.5))x+=Math.sign(dx);else y+=Math.sign(dy);if(r()<0.12){if(dx)y+=r()<0.5?1:-1;else x+=r()<0.5?1:-1;y=clamp(y,0,ROWS-1);x=clamp(x,0,COLS-1)}}};
  const pts=[{x:0,y:Math.floor(R(4,ROWS-4))},...sortBy(villages,v=>v.x),{x:COLS-1,y:Math.floor(R(4,ROWS-4))}];
  for(let i=0;i<pts.length-1;i++)road(pts[i].x,pts[i].y,pts[i+1].x,pts[i+1].y);
  if(r()<0.6){const v=villages[0];road(v.x,v.y,v.x+(r()<0.5?-1:1)*4,r()<0.5?0:ROWS-1)}
 }
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
 // muros en ruinas y casas del pueblo (solo si no cortan el paso)
 if(theme==='ruinas'||theme==='pueblo'){
  const pass=(x1,y1,x2,y2)=>{if(BLOCK(m[y2][x2]))return false;const a=h[y1][x1],b=h[y2][x2];if(a===b)return true;if(Math.abs(a-b)>1)return false;return (a<b?m[y1][x1]:m[y2][x2])===4};
  const reach=()=>{let s0=null;for(let y=0;y<ROWS&&!s0;y++)for(let x=0;x<COLS&&!s0;x++)if(!BLOCK(m[y][x])&&dvOf(1-d,x,y)<0.3)s0=[x,y];if(!s0)return 0;const sn=grid(0),st=[s0];sn[s0[1]][s0[0]]=1;let n=1;
   while(st.length){const [x,y]=st.pop();for(const [i,j] of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+i,yy=y+j;if(xx<0||yy<0||xx>=COLS||yy>=ROWS||sn[yy][xx]||!pass(x,y,xx,yy))continue;sn[yy][xx]=1;n++;st.push([xx,yy])}}return n};
  const ok=(x,y)=>x>=0&&y>=0&&x<COLS&&y<ROWS&&Math.min(dvOf(0,x,y),dvOf(1,x,y))>=0.22&&m[y][x]!==4&&m[y][x]!==3&&m[y][x]!==12&&!BLOCK(m[y][x])&&![[1,0],[-1,0],[0,1],[0,-1]].some(([i,j])=>at(x+i,y+j)>=0&&m[y+j][x+i]===4);
  const place=(cells,v)=>{cells=cells.filter(([x,y])=>ok(x,y));if(!cells.length)return;const before=reach(),old=cells.map(([x,y])=>m[y][x]);for(const [x,y] of cells)m[y][x]=v;if(reach()<before-cells.length)cells.forEach(([x,y],i)=>m[y][x]=old[i])};
  if(theme==='ruinas'){
   const floor=[];for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)if(m[y][x]===9)floor.push([x,y]);
   const nw=Math.min(14,Math.floor(floor.length/9));
   for(let i=0;i<nw;i++){const [x,y]=floor[(r()*floor.length)|0],hz=r()<0.5,len=2+((r()*4)|0),cells=[];for(let k=0;k<len;k++){const cx=hz?x+k:x,cy=hz?y:y+k;if(at(cx,cy)!==h[y][x])break;if(r()<0.15&&k>0&&k<len-1)continue;cells.push([cx,cy])}
    // esquina: a veces el muro gira
    if(r()<0.4&&cells.length>1){const [ex,ey]=cells[cells.length-1];for(let k=1;k<3;k++)cells.push(hz?[ex,ey+k]:[ex+k,ey])}
    place(cells,10)}
  }
  if(theme==='pueblo'){
   for(const v of villages){const cand=[];for(let j=-4;j<=4;j++)for(let i=-5;i<=5;i++){const x=v.x+i,y=v.y+j;if(!ok(x,y)||h[y][x]!==0)continue;const nearRoad=[[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>at(x+a,y+b)>=0&&m[y+b][x+a]===12);if(nearRoad||r()<0.25)cand.push([x,y,Math.hypot(i,j*1.3)])}
    for(const [x,y] of sortBy(cand,c=>c[2]+r()*2).slice(0,9+((r()*5)|0))){if([[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]].filter(([a,b])=>at(x+a,y+b)>=0&&m[y+b][x+a]===11).length>=2)continue;place([[x,y]],11)}
    // plaza empedrada en el centro
    for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const x=v.x+i,y=v.y+j;if(at(x,y)===0&&m[y][x]===0)m[y][x]=12}
   }
  }
 }
 return {m,h};
}
function newField(keepSeed){
 if(!keepSeed)S.seed=(Math.random()*1e9)|0;
 S.def=S.defSel==='random'?(rng(S.seed^99)()<0.5?0:1):+S.defSel;
 const p0=S.preset==='oasis'?'desierto':S.preset==='caldera'?'volcan':null;
 S.biome=p0||(S.biomeSel!=='random'?S.biomeSel:(()=>{const x=rng(S.seed^55)();return x<0.25?'templado':x<0.45?'mixto':x<0.58?'desierto':x<0.71?'volcan':x<0.85?'ruinas':'pueblo'})());
 const g=genMap(S.preset,S.seed,S.def,S.biome);S.map=g.m;S.hgt=g.h;
 const p=PRESETS.find(p=>p.id===S.preset);
 S.mapName=S.preset==='random'?'Campo n.º '+(S.seed%1000):p.n;
 S.weather=S.weatherSel==='random'?WEATHERS[(rng(S.seed^77)()*WEATHERS.length)|0]:WEATHERS.find(w=>w.id===S.weatherSel);
 S.armies=[{fac:S.armies[0].fac,units:[]},{fac:S.armies[1].fac,units:[]}];
 S.map0=S.map.map(r=>r.slice());S.weather0=S.weather;S.scorch=null;S.fires=[];
 placeObjectives();planWeather();
 renderTerrain();buildTrees();initWeatherFx();renderFieldTag();
}
// deja el campo como estaba antes de la batalla (por si ardió o avanzó la lava)
function resetField(){
 const changed=S.scorch||S.weather!==S.weather0||S.map.some((r,y)=>r.some((v,x)=>v!==S.map0[y][x]));
 S.map=S.map0.map(r=>r.slice());S.weather=S.weather0;S.scorch=null;S.fires=[];S.wxDone=false;S.lavaNext=30;S.objT=0;S.objWin=false;S.notes=[];
 for(const o of S.objs||[]){o.owner=S.def;o.prog=S.def===0?-1:1;o.contested=false}
 if(changed){renderTerrain();buildTrees();initWeatherFx();renderFieldTag()}
}
const terrAtTile=(c,r)=>S.map[clamp(r,0,ROWS-1)][clamp(c,0,COLS-1)];
const terrAt=u=>terrAtTile(Math.floor(u.x),Math.floor(u.y));
const hgtTile=(c,r)=>S.hgt[clamp(r,0,ROWS-1)][clamp(c,0,COLS-1)];
// ¿se puede pasar de una casilla a otra vecina? (acantilados solo por rampa)
function stepOK(c1,r1,c2,r2){
 if(c2<0||r2<0||c2>=COLS||r2>=ROWS)return false;
 if(BLOCK(S.map[r2][c2]))return false;
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
   const sf=S.map[nr][nc],cost=w*(sf===3?2:sf===2?1.4:sf===6?1.15:sf===9?1.2:sf===12?0.85:1);const g=_g[cur]+cost;if(g<_g[k]){_g[k]=g;_par[k]=cur;push([g+hf(nc,nr),k])}}}
 const out=[];for(let k=best;k!==s&&k>=0;k=_par[k])out.push({x:k%COLS+0.5,y:((k/COLS)|0)+0.5});
 return out.reverse();
}

const terrCv=document.createElement('canvas');terrCv.width=COLS*TT;terrCv.height=ROWS*TT;
const hex=c=>[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)];
function rampDir(c,r){const L=S.hgt[r][c]+1;for(const [i,j] of [[0,-1],[0,1],[-1,0],[1,0]]){const x=c+i,y=r+j;if(x>=0&&y>=0&&x<COLS&&y<ROWS&&S.hgt[y][x]===L)return [i,j]}return [0,-1]}
const PAL={ru:['#8f887a','#857e70','#9a9384'],co:['#a3916e','#968563','#b09e7a'],gv:['#5d7a3c','#668444','#55703a'],fv:['#4a4f36','#42472f','#3a3f2a'],s0:['#d8c07a','#e0c988','#cdb46c'],s1:['#e2cc8a','#e9d597','#d6be7a'],s2:['#ecd9a2','#f2e2b0','#e2cd92'],a0:['#4e4646','#575050','#463e3e'],a1:['#5a5150','#635a58','#524948'],a2:['#675d5a','#706562','#5e5552'],lava:['#ffb040','#ff7a1a','#e0501a','#ffe070'],sandCliff:['#b8834e','#a5703e','#6e4626','#c99660'],ashCliff:['#3a3333','#302a2a','#1c1818','#4a4242'],g0:['#5f9e48','#69aa4f','#578f41'],g1:['#8fc25c','#9bcc66','#84b553'],g2:['#bcc08e','#c8cb9a','#adb281'],f:['#45793a','#3e7033','#376629'],w:['#2f6fa8','#3579b5','#2a6299'],ramp:['#b39466','#a68759','#c2a374'],cliff:['#7a5634','#684828','#4a321c','#8a6a44']};
function renderTerrain(){
 const x=terrCv.getContext('2d'),img=x.createImageData(COLS*TT,ROWS*TT),d=img.data,m=S.map,hg=S.hgt,wid=S.weather.id;
 let r=rng(S.seed^0x9e37);
 const tint=wid==='snow'?[[236,242,250],0.3]:wid==='rain'?[[30,45,80],0.2]:wid==='heat'?[[235,190,90],0.14]:wid==='fog'?[[150,160,170],0.12]:null;
 const put=(px,py,rgb,mul=1)=>{let a=rgb[0]*mul,b=rgb[1]*mul,c=rgb[2]*mul;if(tint){const[t,k]=tint;a=a*(1-k)+t[0]*k;b=b*(1-k)+t[1]*k;c=c*(1-k)+t[2]*k}const i=(py*COLS*TT+px)*4;d[i]=a;d[i+1]=b;d[i+2]=c;d[i+3]=255};
 const H_=(c,rr)=>c<0||rr<0||c>=COLS||rr>=ROWS?null:hg[rr][c];
 const P={};for(const k in PAL)P[k]=PAL[k].map(hex);
 const FOAM=hex('#d6ecf2'),SAND=hex('#c9b27a'),DARKG=hex('#3c6e2c'),STONE=hex('#8e8a78'),FL=['#e8d36a','#e88aa0','#f0f0f0'].map(hex),PEB=hex('#a08860'),CRACK=hex('#2a2222'),EMBER=hex('#ff7a2a'),LAVAC=hex('#7a2410'),MOSS=hex('#6a8a4a'),WT=['#b4ad9e','#a8a192','#bdb7a8'].map(hex),WF=hex('#6e685c'),WD=hex('#4a463e');
 const pick=a=>r()<0.6?a[0]:r()<0.5?a[1]:a[2];
 // indicadores de bioma por casilla, interpolados por píxel con ruido: bordes orgánicos, sin cuadros
 const isD=(c,rr)=>{const v=m[rr][c];if(v===6)return 1;if(v===4){for(const [i,j] of [[1,0],[-1,0],[0,1],[0,-1]]){const x2=c+i,y2=rr+j;if(x2>=0&&y2>=0&&x2<COLS&&y2<ROWS&&m[y2][x2]===6)return 1}}return 0};
 const isA=(c,rr)=>{const v=m[rr][c];if(v===7||v===8)return 1;if(v===4){for(const [i,j] of [[1,0],[-1,0],[0,1],[0,-1]]){const x2=c+i,y2=rr+j;if(x2>=0&&y2>=0&&x2<COLS&&y2<ROWS&&(m[y2][x2]===7||m[y2][x2]===8))return 1}}return 0};
 const DI=[],AI=[],LI=[],FI=[],WI=[],RI=[],CI=[];for(let j=0;j<ROWS;j++){DI.push([]);AI.push([]);LI.push([]);FI.push([]);WI.push([]);RI.push([]);CI.push([]);for(let i=0;i<COLS;i++){const v=m[j][i];DI[j].push(isD(i,j));AI[j].push(isA(i,j));LI[j].push(v===8?1:0);FI[j].push(v===2?1:0);WI[j].push(v===3?1:0);RI[j].push(v===9||v===10||(S.scorch&&S.scorch[j][i]===2)?1:0);CI[j].push(v===12?1:0)}}
 computeCover();
 const WB=WI.map((row,j)=>row.map((_,i)=>{let a=0,n=0;for(let jj=-1;jj<=1;jj++)for(let ii=-1;ii<=1;ii++){const y=j+jj,x=i+ii;if(y<0||x<0||y>=ROWS||x>=COLS)continue;a+=WI[y][x];n++}return a/n}));
 const bil=(G,fx,fy)=>{const x=fx-0.5,y=fy-0.5,i=Math.floor(x),j=Math.floor(y),ax=x-i,ay=y-j;const g=(ii,jj)=>G[clamp(jj,0,ROWS-1)][clamp(ii,0,COLS-1)];return g(i,j)*(1-ax)*(1-ay)+g(i+1,j)*ax*(1-ay)+g(i,j+1)*(1-ax)*ay+g(i+1,j+1)*ax*ay};
 S.lavaPx=[];const pnA=vnoise(S.seed^0x5151),pnB=vnoise(S.seed^0x2b2b),pnC=vnoise(S.seed^0x7777);
 const WPX=COLS*TT,K=new Uint8Array(WPX*ROWS*TT);
 const anyD=DI.some(r_=>r_.some(v=>v)),anyA=AI.some(r_=>r_.some(v=>v)),anyR=RI.some(r_=>r_.some(v=>v)),anyC=CI.some(r_=>r_.some(v=>v));
 const ground=(tx,ty,px,py,h)=>{
  const fx=tx+(px+0.5)/TT,fy=ty+(py+0.5)/TT,n1=pnA(fx*1.3,fy*1.3)-0.5;
  let c=pick(h===2?P.g2:h===1?P.g1:S.biome==='volcan'?P.gv:P.g0),kind=0,mul=1;
  {const k=clamp((bil(FI,fx,fy)+n1*0.6-0.34)/0.26,0,1);if(k>0&&r()<k){c=pick(S.biome==='volcan'?P.fv:P.f);mul=h===2?1.25:h===1?1.12:1;if(r()<0.05)c=DARKG;kind=4}}
  if(anyD){const k=clamp((bil(DI,fx,fy)+n1*0.6-0.36)/0.28,0,1);if(k>0&&r()<k){c=pick(h===2?P.s2:h===1?P.s1:P.s0);kind=1}}
  if(anyA){const k=clamp((bil(AI,fx,fy)+n1*0.6-0.36)/0.28,0,1);if(k>0&&r()<k){c=pick(h===2?P.a2:h===1?P.a1:P.a0);kind=2}}
  if(anyR){const k=clamp((bil(RI,fx,fy)+n1*0.6-0.36)/0.28,0,1);if(k>0&&r()<k){c=pick(P.ru);kind=5;const gx=fx*2,gy=fy*2+(Math.floor(fx*2)%2)*0.5;if(gx%1<0.09||gy%1<0.09)mul=0.74;else if(r()<0.05)c=MOSS;else if(Math.abs(pnB(fx*3,fy*3)-0.5)<0.01)c=CRACK}}
  if(anyC){const k=clamp((bil(CI,fx,fy)+n1*0.35-0.42)/0.16,0,1);if(k>0&&r()<k){c=pick(P.co);kind=6;if(Math.sin(fx*13.1)*Math.sin(fy*13.1+Math.floor(fx*2))>0.55)mul=0.82}}
  if(S.scorch&&S.scorch[ty][tx]===1&&kind!==3&&r()<0.75){c=r()<0.5?CRACK:hex('#3a3430');kind=7}
  if(kind===0||kind===4){const q=pnC(fx*0.32,fy*0.32);mul*=0.9+0.2*q;if(kind===0&&q>0.62&&r()<(q-0.62)*1.6)c=pick(h?P.g2:P.g1)}
  if(kind===0){if(h===2&&r()<0.06)c=STONE;if(h===0&&r()<0.04)c=DARKG;if(r()<0.008&&S.biome!=='volcan')c=FL[(r()*3)|0]}
  else if(kind===1){if(Math.sin((fx*1.7+fy*0.9)*6.283+n1*7)>0.86)mul=0.9;if(r()<0.006)c=PEB}
  else if(kind===2){const q=pnB(fx*2.2,fy*2.2);if(Math.abs(q-0.5)<0.012)c=CRACK;else if(r()<0.004)c=EMBER;}
  if(m[ty][tx]===8){const lv=bil(LI,fx,fy)+n1*0.5;
   if(lv>0.62){if(r()<0.02)S.lavaPx.push([tx*T+px*2+1,ty*T+py*2+1,r()*6.28]);const q=pnB(fx*2.6+9,fy*2.6+3);c=Math.abs(q-0.5)<0.03?LAVAC:q>0.6?P.lava[3]:q>0.45?P.lava[0]:q>0.3?P.lava[1]:P.lava[2];mul=1;kind=3}
   else if(lv>0.5){c=CRACK;mul=1}}
  return [c,mul,kind];
 };
 for(let ty=0;ty<ROWS;ty++)for(let tx=0;tx<COLS;tx++){
  r=rng((S.seed^0x9e37)+ty*7919+tx*104729);
  const t=m[ty][tx],h=hg[ty][tx];
  const hs=H_(tx,ty+1),hn=H_(tx,ty-1),hw=H_(tx-1,ty),he=H_(tx+1,ty);
  const drop=hs===null?0:Math.max(0,h-hs);
  const southRampUp=hs!==null&&m[ty+1][tx]===4&&hs===h-1&&rampDir(tx,ty+1)[1]===-1;
  const face=southRampUp?0:drop*5;
  const rd=t===4?rampDir(tx,ty):null;
  // esquinas cóncavas de los ríos: el agua se redondea un poco sobre la casilla vecina (solo dibujo)
  const isWt=(i,j)=>{const xx=tx+i,yy=ty+j;return xx>=0&&yy>=0&&xx<COLS&&yy<ROWS&&m[yy][xx]===3};
  const cornerW=t!==3&&h===0&&(t===0||t===6||t===12||t===9)&&((isWt(1,0)||isWt(-1,0))&&(isWt(0,1)||isWt(0,-1)));
  const CL=DI[ty][tx]?P.sandCliff:AI[ty][tx]?P.ashCliff:P.cliff,LIP=DI[ty][tx]?hex('#f2e0a8'):AI[ty][tx]?hex('#7a6e6a'):hex('#d4e090');
  for(let py=0;py<TT;py++)for(let px=0;px<TT;px++){
   const X=tx*TT+px,Y=ty*TT+py;let c,mul=1;
   if(t===3||cornerW){const fx=tx+(px+0.5)/TT,fy=ty+(py+0.5)/TT,wv=0.45*bil(WI,fx,fy)+0.55*bil(WB,fx,fy)*1.25+(pnA(fx*1.3,fy*1.3)-0.5)*0.4-(t===3?0:0.1);if(wv>0.47){c=pick(P.w);const dp=clamp((wv-0.5)/0.35,0,1);mul=1.1-0.24*dp;if(wv<0.51&&r()<0.7){c=FOAM;mul=1}else if(r()<0.012*(1-dp))c=FOAM}else if(wv>0.4){c=SAND;mul=wv>0.45?0.86:1}else{const gr=ground(tx,ty,px,py,h);c=gr[0];mul=gr[1];K[Y*WPX+X]=gr[2]+1}}
   else if(t===4){c=pick(DI[ty][tx]?P.sandCliff:AI[ty][tx]?P.ashCliff:P.ramp);if(AI[ty][tx])mul=1.4;const along=rd[1]!==0?py:px;if(along%4===0)mul=0.8;if(along%4===1)mul=1.08;
    const k=rd[1]===-1?1-py/15:rd[1]===1?py/15:rd[0]===-1?1-px/15:px/15;mul*=0.85+0.3*k;const side=rd[1]!==0?px:py;if(side===0||side===15)c=P.cliff[2];else if(side===1||side===14)mul*=0.8}
   else if(t===10){const isW=(i,j)=>{const xx=tx+i,yy=ty+j;return xx>=0&&yy>=0&&xx<COLS&&yy<ROWS&&m[yy][xx]===10};
    const L=isW(-1,0),Rr=isW(1,0),N=isW(0,-1),So=isW(0,1),inX=(L||px>=3)&&(Rr||px<=12),inY=(N||py>=3);
    if(!inX||!inY){const gr=ground(tx,ty,px,py,h);c=gr[0];mul=gr[1]}
    else if(!So&&py>=11){c=py===15?WD:WF;mul=(px+(py%2)*3)%6===0?0.8:1}
    else{c=pick(WT);const row=Math.floor(py/4);if(py%4===0||(px+row*3)%7===0)mul=0.78;if(r()<0.04)c=MOSS}}
   else{const gr=ground(tx,ty,px,py,h);c=gr[0];mul=gr[1];K[Y*WPX+X]=gr[2]+1}
   if(h>0&&t!==4){
    if(face&&py>=TT-face-1)K[Y*WPX+X]=0;
    if(face&&py>=TT-face){const k=TT-py;c=py===TT-face?CL[2]:(k%4===0?CL[2]:r()<0.5?CL[0]:CL[1]);if(drop===2&&py===TT-5)c=CL[2];if(py===TT-1)c=CL[2];mul=1-0.04*(py-(TT-face))}
    else if(face&&py===TT-face-1)c=LIP;
    else{if(hn!==null&&hn<h&&py===0)mul=1.2;if(hw!==null&&hw<h&&px===0)mul=0.62;else if(hw!==null&&hw<h&&px===1)mul=0.85;if(he!==null&&he<h&&px===15)mul=0.62;else if(he!==null&&he<h&&px===14)mul=0.85}
   }
   put(X,Y,c,mul);
  }
 }
 decorate(d,K,WPX,hg);
 x.putImageData(img,0,0);
 // sombra suave al pie de los acantilados (oclusión ambiental)
 for(let ty=0;ty<ROWS-1;ty++)for(let tx=0;tx<COLS;tx++){const k=hg[ty][tx]-hg[ty+1][tx];if(k>0&&m[ty+1][tx]!==4){const n=3+3*k;for(let i=0;i<n;i++){x.fillStyle=`rgba(10,6,14,${(0.3+0.08*k)*(1-i/n)})`;x.fillRect(tx*TT,(ty+1)*TT+i,TT,1)}}}
 for(let ty=0;ty<ROWS;ty++)for(let tx=1;tx<COLS;tx++){const k=hg[ty][tx-1]-hg[ty][tx];if(k>0&&m[ty][tx]!==4){const n=2+2*k;for(let i=0;i<n;i++){x.fillStyle=`rgba(10,6,14,${0.24*(1-i/n)})`;x.fillRect(tx*TT+i,ty*TT,1,TT)}}}
}
// detalles sobre la hierba: matas, arbustos y piedras (solo donde el suelo es hierba)
function decorate(d,K,WPX,hg){
 const r=rng(S.seed^0xdec0),HPX=ROWS*TT,snow=S.weather.id==='snow',volc=S.biome==='volcan';
 const isG=(x,y)=>x>=0&&y>=0&&x<WPX&&y<HPX&&K[y*WPX+x]===1;
 const mulPx=(x,y,f)=>{if(!isG(x,y))return;const i=(y*WPX+x)*4;d[i]=Math.min(255,d[i]*f);d[i+1]=Math.min(255,d[i+1]*f);d[i+2]=Math.min(255,d[i+2]*f)};
 const setPx=(x,y,c)=>{if(!isG(x,y))return;const i=(y*WPX+x)*4;d[i]=c[0];d[i+1]=c[1];d[i+2]=c[2]};
 const BU=[hex(snow?'#dfe6ee':volc?'#4f5a34':'#3f7a34'),hex(snow?'#f4f8fc':volc?'#66733f':'#5c9a46'),hex(snow?'#b8c2cc':volc?'#343a22':'#2c5a26')],RK=[hex('#9a9488'),hex('#c2bcae'),hex('#5e5850')];
 for(let ty=0;ty<ROWS;ty++)for(let tx=0;tx<COLS;tx++){
  const x0=tx*TT,y0=ty*TT;if(!isG(x0+8,y0+8))continue;
  // matas de hierba
  const nt=2+((r()*4)|0);for(let k=0;k<nt;k++){const x=x0+1+((r()*14)|0),y=y0+3+((r()*12)|0);if(!isG(x,y-2))continue;mulPx(x,y,0.62);mulPx(x-1,y-1,0.78);mulPx(x+1,y-1,0.78);mulPx(x,y-1,1.18);mulPx(x,y-2,1.32);mulPx(x-1,y-2,1.12)}
  // arbusto
  if(r()<0.05){const x=x0+3+((r()*9)|0),y=y0+4+((r()*8)|0);let ok=true;for(let j=-1;j<=2;j++)for(let i=-1;i<=4;i++)if(!isG(x+i,y+j))ok=false;
   if(ok){for(let i=0;i<5;i++)mulPx(x+i-0,y+2,0.62);[[1,-1],[2,-1],[0,0],[1,0],[2,0],[3,0],[0,1],[1,1],[2,1],[3,1],[4,1]].forEach(([i,j])=>setPx(x+i,y+j,BU[0]));[[1,-1],[2,-1],[1,0]].forEach(([i,j])=>setPx(x+i,y+j,BU[1]));[[3,1],[4,1],[2,1]].forEach(([i,j])=>setPx(x+i,y+j,BU[2]))}}
  // piedras
  if(r()<(hg[ty][tx]===2?0.18:0.04)){const x=x0+2+((r()*11)|0),y=y0+3+((r()*10)|0);if(isG(x+2,y+1)){setPx(x,y,RK[0]);setPx(x+1,y,RK[1]);setPx(x+2,y,RK[0]);setPx(x+1,y-1,RK[1]);setPx(x,y+1,RK[2]);setPx(x+1,y+1,RK[2]);setPx(x+2,y+1,RK[2])}}
 }
}
// cobertura: casillas pegadas a un muro o a una casa
function computeCover(){S.cover=grid(0);for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){const v=S.map[y][x];if(v!==10&&v!==11)continue;for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const xx=x+i,yy=y+j;if(xx>=0&&yy>=0&&xx<COLS&&yy<ROWS)S.cover[yy][xx]=1}}}
function buildTrees(){
 const r=rng(S.seed^0x51ed);S.trees=[];S.houses=[];
 for(let ty=0;ty<ROWS;ty++)for(let tx=0;tx<COLS;tx++)if(S.map[ty][tx]===11)S.houses.push({c:tx,r:ty,x:tx*T,y:ty*T+T,lift:S.hgt[ty][tx]*8,v:(tx*7+ty*3)%3});
 for(let ty=0;ty<ROWS;ty++)for(let tx=0;tx<COLS;tx++)if(S.map[ty][tx]===2){
  const rr=rng(S.seed^(ty*97+tx*13));const jx=(rr()-0.5)*5,jy=(rr()-0.5)*3;
  let v=(rr()*2)|0,dz=0,az=0;for(let j=-2;j<=2;j++)for(let i=-2;i<=2;i++){const x=tx+i,y=ty+j;if(x<0||y<0||x>=COLS||y>=ROWS)continue;const k=S.map[y][x];if(k===6)dz++;if(k===7||k===8)az++}
  if(S.biome==='volcan'||az>=3)v=rr()<0.7?'burnt':v;else if(S.biome==='desierto'||dz>=3)v=rr()<0.8?'palm':v;
  S.trees.push({x:tx*T+16+jx*2,y:ty*T+27+jy*2,lift:S.hgt[ty][tx]*8,v});
 }
}
