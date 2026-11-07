'use strict';
/* ================= DIBUJO ================= */
function drawSprite(img,x,y,flip){
 x=Math.round(x);y=Math.round(y);
 if(flip){ctx.save();ctx.translate(x+img.width,y);ctx.scale(-1,1);ctx.drawImage(img,0,0);ctx.restore()}else ctx.drawImage(img,x,y);
}
function shadow(px,py,col,big){ctx.fillStyle=col;const w=big?6:4;ctx.fillRect(px-w,py,w*2+1,1);ctx.fillRect(px-w+1,py-1,w*2-1,1);ctx.fillRect(px-w+1,py+1,w*2-1,1)}
function drawUnitAt(def,side,x,y,opts={}){
 const s=SPR[def.id],fr=opts.frame||0,img=s.f[fr],px=x*T,el=(opts.el||0)*8,fly=def.fly;
 let py=y*T+5-el;
 const lx=opts.lunge?opts.face*2:0;
 const col=side===0?'rgba(74,163,255,0.85)':'rgba(255,106,79,0.85)';
 if(fly){ctx.fillStyle='rgba(0,0,0,0.3)';ctx.fillRect(Math.round(px)-3,Math.round(py),7,2);shadow(Math.round(px),Math.round(py)+1,col,false);py-=10+Math.sin((opts.t||0)*6+x)*1.5}
 else shadow(Math.round(px),Math.round(py),col,def.big);
 const face=opts.face!==undefined?opts.face:(side?-1:1);
 const dx=px-img.width/2+lx,dy=py-img.height+1;
 if(opts.ghost)ctx.globalAlpha=0.4;
 drawSprite(img,dx,dy,face<0);ctx.globalAlpha=1;
 if(def.elite){const cx=Math.round(px),cy=Math.round(dy)-(opts.hp!==undefined&&opts.hp<1?9:4)-(opts.sh>0?3:0);ctx.fillStyle='#120c14';ctx.fillRect(cx-3,cy-1,7,4);ctx.fillStyle='#ffd34a';ctx.fillRect(cx-2,cy,5,2);ctx.fillRect(cx-2,cy-1,1,1);ctx.fillRect(cx,cy-1,1,1);ctx.fillRect(cx+2,cy-1,1,1)}
 if(opts.flash>0){ctx.globalAlpha=0.75;drawSprite(s.w[fr],dx,dy,face<0);ctx.globalAlpha=1}
 if(opts.sh>0){const bw=def.big?14:10,bx=Math.round(px-bw/2),by=Math.round(dy)-6;ctx.fillStyle='#120c14';ctx.fillRect(bx-1,by-1,bw+2,3);ctx.fillStyle='#ffe066';ctx.fillRect(bx,by,Math.max(1,Math.round(bw*opts.sh)),1)}
 if(opts.hp!==undefined&&opts.hp<1){const bw=def.big?14:10,bx=Math.round(px-bw/2),by=Math.round(dy)-3;ctx.fillStyle='#120c14';ctx.fillRect(bx-1,by-1,bw+2,4);ctx.fillStyle='#3a2a2a';ctx.fillRect(bx,by,bw,2);ctx.fillStyle=side?'#ff6a4f':'#4aa3ff';ctx.fillRect(bx,by,Math.max(1,Math.round(bw*opts.hp)),2)}
}
function drawTree(t){const img=treeSprite(S.weather.id==='snow',t.v);ctx.drawImage(img,Math.round(t.x-img.width),Math.round(t.y-t.lift-img.height*2+4),img.width*2,img.height*2)}
function drawCorpse(c){
 if(c.used)return;
 const img=SPR[c.def.id].f[0];ctx.save();ctx.globalAlpha=c.t<0.4?1-c.t*1.2:0.45;
 const px=Math.round(c.x*T),py=Math.round(c.y*T+3-(c.el||0)*8);
 ctx.translate(px,py);if(c.face<0)ctx.scale(-1,1);ctx.rotate(Math.PI/2);ctx.drawImage(img,-img.width/2-2,-img.height/2);ctx.restore();
}
function drawProj(p){
 const k=p.t/p.dur,tx=p.tgt.x*T,ty=p.tgt.y*T-6-elev(p.tgt)*8-(p.tgt.def.fly?10:0);
 const x=p.x0+(tx-p.x0)*k,arc=(p.kind==='arrow'||p.kind==='axe'||p.kind==='stone'||p.kind==='rock')?Math.sin(k*Math.PI)*Math.min(18,Math.abs(tx-p.x0)*0.15):0,y=p.y0+(ty-p.y0)*k-arc;
 const vx=x-p.lx,vy=y-p.ly;p.lx=x;p.ly=y;
 if(p.kind==='arrow'||p.kind==='bolt'){const l=Math.hypot(vx,vy)||1,ux=vx/l,uy=vy/l;ctx.fillStyle=p.kind==='bolt'?'#cfd8e3':'#efe0bf';for(let i=0;i<(p.kind==='bolt'?3:4);i++)ctx.fillRect(Math.round(x-ux*i),Math.round(y-uy*i),1,1);ctx.fillStyle='#ffffff';ctx.fillRect(Math.round(x),Math.round(y),1,1)}
 else if(p.kind==='fire'){const f=((p.t*24)|0)%2;ctx.fillStyle='#ff7a2a';ctx.fillRect(Math.round(x)-1,Math.round(y)-1,3,3);ctx.fillStyle=f?'#ffe066':'#ffb040';ctx.fillRect(Math.round(x),Math.round(y)-1,1,2);ctx.globalAlpha=0.5;ctx.fillStyle='#ff5a2a';ctx.fillRect(Math.round(x-vx*1.5),Math.round(y-vy*1.5),2,2);ctx.globalAlpha=1}
 else if(p.kind==='rock'||p.kind==='stone'){const rr=p.kind==='rock'?2:1;ctx.fillStyle='#120c14';ctx.fillRect(Math.round(x)-rr,Math.round(y)-rr,rr*2+1,rr*2+1);ctx.fillStyle='#9a9488';ctx.fillRect(Math.round(x)-rr+1,Math.round(y)-rr+1,rr*2-1,rr*2-1)}
 else if(p.kind==='magma'){ctx.fillStyle='#3a1610';ctx.fillRect(Math.round(x)-2,Math.round(y)-2,5,5);ctx.fillStyle='#ff7a1a';ctx.fillRect(Math.round(x)-1,Math.round(y)-1,3,3);ctx.fillStyle='#ffe066';ctx.fillRect(Math.round(x),Math.round(y),1,1);ctx.globalAlpha=0.5;ctx.fillStyle='#ff5a1a';ctx.fillRect(Math.round(x-vx*2)-1,Math.round(y-vy*2),3,2);ctx.globalAlpha=1}
 else if(p.kind==='light'){const l=Math.hypot(vx,vy)||1,ux=vx/l,uy=vy/l;ctx.fillStyle='#fff6c0';for(let i=0;i<5;i++)ctx.fillRect(Math.round(x-ux*i),Math.round(y-uy*i),1,1);ctx.fillStyle='#ffffff';ctx.fillRect(Math.round(x),Math.round(y),1,1)}
 else if(p.kind==='axe'){const ph=((p.t*20)|0)%2;ctx.fillStyle='#b8b8b0';ctx.fillRect(Math.round(x)-1,Math.round(y)-(ph?1:0),ph?1:3,ph?3:1);ctx.fillStyle='#8b5a2b';ctx.fillRect(Math.round(x),Math.round(y),1,1)}
 else{const c=p.kind==='heal'?'#7dff8a':(p.col||'#ffe066');ctx.fillStyle=c;ctx.fillRect(Math.round(x)-1,Math.round(y)-1,3,3);ctx.fillStyle='#ffffff';ctx.fillRect(Math.round(x),Math.round(y),1,1);ctx.globalAlpha=0.4;ctx.fillStyle=c;ctx.fillRect(Math.round(x-vx*2)-1,Math.round(y-vy*2),2,2);ctx.globalAlpha=1}
}
let last=performance.now();
function frame(now){
 const dt=Math.min(0.05,(now-last)/1000);last=now;
 if(S.state==='battle'&&!S.paused){let acc=dt*S.speed;while(acc>0&&S.state==='battle'){const h=Math.min(1/30,acc);step(h);acc-=h}}
 ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#0c0a10';ctx.fillRect(0,0,W,H);
 const z=S.cam.z;ctx.setTransform(z,0,0,z,-S.cam.x*z,-S.cam.y*z);
 ctx.drawImage(terrCv,0,0,W,H);
 // agua animada
 ctx.fillStyle='rgba(170,215,255,0.55)';
 for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)if(S.map[r][c]===3){const ph=Math.floor(now/260+c*1.7+r*2.3)%8;ctx.fillRect(c*T+((ph*10)%24)+4,r*T+8+(ph%3)*8,6,2)}
 // lava viva: burbujas que brillan
 for(const [lx,ly,ph] of S.lavaPx||[]){const k=Math.sin(now/520+ph*3);if(k>0.55){ctx.fillStyle=k>0.85?'#fff4b0':'#ffe070';ctx.fillRect(lx-1,ly-1,2,2)}}
 // zonas de despliegue
 if(S.state==='deploy'||S.state==='setup'){
  for(const side of [0,1]){if(S.state==='deploy'&&side!==S.side)continue;ctx.fillStyle=side?'rgba(255,106,79,0.13)':'rgba(74,163,255,0.15)';ctx.beginPath();if(side){ctx.moveTo(W,H);ctx.lineTo((1-ZV)*W,H);ctx.lineTo(W,(1-ZV)*H)}else{ctx.moveTo(0,0);ctx.lineTo(ZV*W,0);ctx.lineTo(0,ZV*H)}ctx.closePath();ctx.fill();ctx.strokeStyle=side?'rgba(255,106,79,0.6)':'rgba(74,163,255,0.6)';ctx.setLineDash([6,5]);ctx.lineWidth=2;ctx.stroke();ctx.setLineDash([])}
  ctx.fillStyle='rgba(255,240,200,0.5)';for(let i=0;i<=W;i+=7)ctx.fillRect(i,Math.round(H-i*H/W),2,1);
 }
 for(const c of S.corpses)drawCorpse(c);
 if(S.state==='battle')drawSelection();
 for(const f of S.fields||[]){const a=Math.min(1,f.t/1.2);const g=ctx.createRadialGradient(f.x*T,f.y*T,2,f.x*T,f.y*T,f.r*T);g.addColorStop(0,`rgba(255,200,80,${0.75*a})`);g.addColorStop(0.55,`rgba(240,90,20,${0.55*a})`);g.addColorStop(1,'rgba(120,20,10,0)');ctx.fillStyle=g;ctx.fillRect(f.x*T-f.r*T,f.y*T-f.r*T,f.r*T*2,f.r*T*2)}
 const list=S.trees.map(t=>({y:t.y,f:()=>drawTree(t)}));
 if(S.state==='battle'||S.state==='result'){
  for(const u of S.units)if(u.alive)list.push({y:u.y*T+5+(u.def.fly?30:0),f:()=>drawUnitAt(u.def,u.side,u.x,u.y,{frame:u.moving?(Math.floor(u.anim)%2):(u.def.fly?Math.floor(now/180)%2:0),face:u.face,el:elev(u),flash:u.flash,hp:u.hp/u.max,sh:u.shMax?u.sh/u.shMax:0,lunge:u.lunge>0,t:now/1000,ghost:u.def.stealth&&S.time>u.reveal})});
 }else if(S.state==='deploy'||S.state==='handoff'){
  for(const side of [0,1]){
   if(S.mode==='ai'&&side===1)continue;
   if(S.mode==='pvp'&&side!==S.side)continue;
   for(const it of S.armies[side].units){const def=UBY[it.id];for(const [ox,oy] of FORM[def.n])list.push({y:(it.r+0.5+oy)*T+5+(def.fly?30:0),f:()=>drawUnitAt(def,side,it.c+0.5+ox,it.r+0.5+oy,{el:def.fly?0:hgtTile(it.c,it.r),t:now/1000,frame:def.fly?Math.floor(now/180)%2:0})})}
  }
 }
 list.sort((a,b)=>a.y-b.y);for(const d of list)d.f();
 for(const p of S.proj)drawProj(p);
 for(const p of S.parts){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=140*dt;ctx.fillStyle=p.col;ctx.fillRect(Math.round(p.x),Math.round(p.y),1,1)}
 S.parts=S.parts.filter(p=>p.life>0);
 drawMarks(dt);
 // casilla bajo el cursor
 if(S.hover&&(S.state==='deploy'||S.state==='setup')){const ok=S.state==='setup'||inZone(S.hover,S.side);ctx.strokeStyle=ok?'rgba(255,240,200,0.9)':'rgba(255,120,100,0.6)';ctx.lineWidth=1;ctx.strokeRect(S.hover.c*T+0.5,S.hover.r*T+0.5,T-1,T-1)}
 ctx.setTransform(1,0,0,1,0,0);
 drawWeather(dt,now);
 drawMinimap();
 if(S.state==='battle'&&now-(S.lastHud||0)>200){S.lastHud=now;renderHud()}
 requestAnimationFrame(frame);
}
