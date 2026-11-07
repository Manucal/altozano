// Simula batallas IA contra IA para revisar el equilibrio.
// Uso: python3 tools/build.py && node tools/balance.js [n]
// Muestra el % de victorias de cada facción, el % del atacante (objetivo: cerca del 50%)
// y el % del atacante en cada tipo de campo.
const {chromium}=require('playwright');const path=require('path');
(async()=>{
 const n=+process.argv[2]||140;
 const b=await chromium.launch();const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file://'+path.resolve(__dirname,'../dist/altozano.html'));await p.waitForTimeout(500);
 const out=await p.evaluate((n)=>{const S=window.__altozano,A=window.__alt,F=A.FACTIONS.length;
  const w=Array(F).fill(0),g=Array(F).fill(0),pre=['random','fortaleza','rio','emboscada','paso','cumbre','oasis','caldera','valle','altiplano'],byMap={};let att=0,tot=0,to=0;const times=[];
  for(let i=0;i<n;i++){S.preset=pre[i%10];S.weatherSel='random';S.defSel='random';A.newField();
   const f0=(Math.random()*F)|0,f1=(Math.random()*F)|0;S.armies[0]=A.autoArmy(0,f0);S.armies[1]=A.autoArmy(1,f1);A.startBattle();
   let k=0;while(S.state==='battle'&&k++<20000)A.step(1/30);times.push(S.time);if(S.result.timeout)to++;
   const win=S.result.win;g[f0]++;g[f1]++;if(win===0)w[f0]++;else if(win===1)w[f1]++;
   const aw=win===1-S.def?1:0;att+=aw;tot++;const m=byMap[S.preset]=byMap[S.preset]||[0,0];m[0]+=aw;m[1]++}
  S.state='setup';times.sort((a,b)=>a-b);
  return {facciones:Object.fromEntries(A.FACTIONS.map((f,i)=>[f.name,Math.round(100*w[i]/Math.max(1,g[i]))+'%'])),
   atacanteGana:Math.round(100*att/tot)+'%',porCampo:Object.fromEntries(Object.entries(byMap).map(([k,v])=>[k,Math.round(100*v[0]/v[1])+'%'])),
   duracionMediana:Math.round(times[times.length>>1])+'s',porTiempo:to}},n);
 console.log(JSON.stringify(out,null,1));if(errs.length)console.log('ERRORES',errs.slice(0,3));await b.close();})();
