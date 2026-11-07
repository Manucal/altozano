'use strict';
/* ================= CLIMA (efectos visuales) ================= */
function initWeatherFx(){
 const id=S.weather.id,n=id==='rain'?150:id==='snow'?130:id==='fog'?8:(id==='windE'||id==='windW')?26:id==='heat'?0:0;
 S.wx=Array.from({length:n},()=>({x:Math.random()*W,y:Math.random()*H,s:0.5+Math.random(),p:Math.random()*6.28}));
}
function drawWeather(dt,now){
 const id=S.weather.id;
 if(id==='rain'){ctx.fillStyle='rgba(20,30,60,0.12)';ctx.fillRect(0,0,W,H);ctx.fillStyle='rgba(185,205,255,0.55)';for(const p of S.wx){p.y+=dt*260*p.s;p.x-=dt*60*p.s;if(p.y>H){p.y=-6;p.x=Math.random()*(W+60)}if(p.x<0)p.x+=W;ctx.fillRect(p.x|0,p.y|0,1,4)}}
 else if(id==='snow'){ctx.fillStyle='#ffffff';for(const p of S.wx){p.y+=dt*28*p.s;p.x+=Math.sin(now/700+p.p)*dt*14;if(p.y>H){p.y=-2;p.x=Math.random()*W}ctx.fillRect(p.x|0,p.y|0,p.s>1.1?2:1,p.s>1.1?2:1)}}
 else if(id==='fog'){ctx.fillStyle='rgba(215,222,232,0.14)';ctx.fillRect(0,0,W,H);for(const p of S.wx){p.x+=dt*6*p.s;if(p.x>W+120)p.x=-120;const g=ctx.createRadialGradient(p.x,p.y,4,p.x,p.y,110);g.addColorStop(0,'rgba(225,230,238,0.33)');g.addColorStop(1,'rgba(225,230,238,0)');ctx.fillStyle=g;ctx.fillRect(p.x-110,p.y-110,220,220)}}
 else if(id==='windE'||id==='windW'){const dir=id==='windE'?1:-1;ctx.fillStyle='rgba(255,255,255,0.28)';for(const p of S.wx){p.x+=dir*dt*150*p.s;if(p.x>W+20)p.x=-20;if(p.x<-20)p.x=W+20;ctx.fillRect(p.x|0,(p.y+Math.sin(now/400+p.p)*3)|0,10,1)}}
 else if(id==='heat'){ctx.fillStyle='rgba(255,170,60,0.07)';ctx.fillRect(0,0,W,H)}
}
