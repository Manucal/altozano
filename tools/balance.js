// Simula batallas IA contra IA para revisar el equilibrio.
// Uso: python3 tools/build.py && node tools/balance.js [n]
const {chromium}=require('playwright');const path=require('path');
(async()=>{
 const n=+process.argv[2]||90;
 const b=await chromium.launch();const p=await b.newPage();
 await p.goto('file://'+path.resolve(__dirname,'../dist/altozano.html'));await p.waitForTimeout(500);
 const out=await p.evaluate((n)=>{const S=window.__altozano,A=window.__alt,F=A.FACTIONS.length;const res={},presets=['random','gemelas','vado','bosque','meseta'];const times=[];let mirror=[0,0,0];
  for(let i=0;i<n;i++){S.preset=presets[i%5];S.weatherSel='random';A.newField();const f0=i%F,f1=Math.floor(i/F)%F;S.armies[0]=A.autoArmy(0,f0);S.armies[1]=A.autoArmy(1,f1);A.startBattle();
   while(S.state==='battle')A.step(1/30);times.push(S.time);const k=f0+'v'+f1;res[k]=res[k]||[0,0,0];res[k][S.result.win===-1?2:S.result.win]++;
   // espejo: mismo ejército en ambos lados, para detectar sesgo de lado
   const a=S.armies[0];S.armies[1]={fac:a.fac,units:a.units.map(u=>({id:u.id,c:29-u.c,r:u.r}))};A.startBattle();while(S.state==='battle')A.step(1/30);mirror[S.result.win===-1?2:S.result.win]++}
  S.state='setup';times.sort((a,b)=>a-b);return {porEnfrentamiento:res,espejo_azul_rojo_empate:mirror,duracionMediana:Math.round(times[n>>1]),agotanTiempo:times.filter(t=>t>=120).length}},n);
 console.log(JSON.stringify(out,null,1));await b.close();})();
