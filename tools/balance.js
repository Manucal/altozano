// Simula batallas IA contra IA para revisar el equilibrio.
// Uso: python3 tools/build.py && node tools/balance.js [n] [banderas JSON] [--det]
// Reparte las n batallas entre 4 navegadores en paralelo.
// Muestra el % de victorias de cada facción, el % del atacante (objetivo: cerca del 50%)
// y el % del atacante en cada tipo de campo. Con --det añade el detalle por clima de cada facción.
const {chromium}=require('playwright');const path=require('path');
const PRE=['random','fortaleza','rio','emboscada','paso','cumbre','oasis','caldera','valle','altiplano'];
async function worker(n,dbg,off){
 const b=await chromium.launch();const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file://'+path.resolve(__dirname,'../dist/altozano.html'));await p.waitForTimeout(500);
 const recs=await p.evaluate(([n,dbg,off,pre])=>{const S=window.__altozano,A=window.__alt,F=A.FACTIONS.length;S.sim=true;S.dbg=dbg;const out=[];
  for(let i=0;i<n;i++){S.preset=dbg.preset||pre[(i+off)%pre.length];S.weatherSel=dbg.wx||'random';S.defSel='random';A.newField();
   const f0=dbg.f0!=null?dbg.f0:(Math.random()*F)|0,f1=dbg.f1!=null?dbg.f1:(Math.random()*F)|0;S.armies[0]=A.autoArmy(0,f0);S.armies[1]=A.autoArmy(1,f1);
   const wx=S.weather.id,riv=S.map.reduce((a,r)=>a+r.filter(v=>v===3).length,0),bio=S.biome;A.startBattle();
   let k=0;while(S.state==='battle'&&k++<20000)A.step(1/30);
   const ut={};for(const sd of [0,1]){const cnt={};for(const it of S.armies[sd].units)cnt[it.id]=(cnt[it.id]||0)+1;for(const id in cnt)ut[sd+id]=[cnt[id],S.stats[sd].byType[id]||0]}
   out.push({ut,f0,f1,win:S.result.win,def:S.def,pre:S.preset,wx,riv,bio,t:S.time,to:S.result.timeout?1:0,ob:S.result.obj?1:0,rt:S.units.filter(u=>u.rout>0||u.mor<60).length})}
  S.state='setup';return {out,names:A.FACTIONS.map(f=>f.name),costs:Object.fromEntries(A.UNITS.map(u=>[u.id,u.cost]))}},[n,dbg,off,PRE]);
 await b.close();return {...recs,errs};
}
(async()=>{
 const n=+process.argv[2]||140,dbg=JSON.parse(process.argv[3]&&process.argv[3][0]==='{'?process.argv[3]:'{}'),det=process.argv.includes('--det');
 const W=Math.min(4,n),per=Math.ceil(n/W);
 const rs=await Promise.all(Array.from({length:W},(_,i)=>worker(per,dbg,i*3)));
 const R=rs.flatMap(r=>r.out),names=rs[0].names,errs=rs.flatMap(r=>r.errs);
 const pct=(a,b)=>b?Math.round(100*a/b)+'%':'-';
 const fac=names.map(()=>[0,0]);const grp=(key)=>{const o={};for(const r of R){const k=key(r),m=o[k]=o[k]||[0,0];m[0]+=r.win===1-r.def?1:0;m[1]++}return Object.fromEntries(Object.entries(o).map(([k,v])=>[k,pct(v[0],v[1])+' ('+v[1]+')']))};
 for(const r of R){fac[r.f0][1]++;fac[r.f1][1]++;if(r.win===0)fac[r.f0][0]++;else if(r.win===1)fac[r.f1][0]++}
 const times=R.map(r=>r.t).sort((a,b)=>a-b);
 const out={batallas:R.length,facciones:Object.fromEntries(names.map((nm,i)=>[nm,pct(fac[i][0],fac[i][1])])),
  atacanteGana:pct(R.filter(r=>r.win===1-r.def).length,R.length),porCampo:grp(r=>r.pre),
  duracionMediana:Math.round(times[times.length>>1])+'s',porTiempo:R.filter(r=>r.to).length,porObjetivos:R.filter(r=>r.ob).length,moralBajaMedia:Math.round(R.reduce((a,r)=>a+r.rt,0)/R.length)};
 if(det){
  out.atacantePorClima=grp(r=>r.wx);out.atacantePorBioma=grp(r=>r.bio);
  // % de victorias de cada facción según el clima inicial, el bioma y la cantidad de río
  const cut=(key)=>Object.fromEntries(names.map((nm,i)=>{const o={};for(const r of R)for(const [f,s] of [[r.f0,0],[r.f1,1]]){if(f!==i||r.f0===r.f1)continue;const k=key(r),m=o[k]=o[k]||[0,0];m[0]+=r.win===s?1:0;m[1]++}return [nm,Object.fromEntries(Object.entries(o).sort().map(([k,v])=>[k,pct(v[0],v[1])+' ('+v[1]+')']))]}));
  out.facPorClima=cut(r=>r.wx);out.facPorRio=cut(r=>r.riv<12?'sin río':r.riv<60?'algo de río':'mucho río');out.facPorBioma=cut(r=>r.bio);
 }
 if(process.argv.includes('--units')){
  // daño medio por punto de coste de cada tropa, y % de victorias de los ejércitos que la llevan
  const U={};for(const r of R)for(const k in r.ut){const sd=+k[0],id=k.slice(1),m=U[id]=U[id]||[0,0,0,0];m[0]+=r.ut[k][0];m[1]+=r.ut[k][1];m[2]++;m[3]+=r.win===sd?1:0}
  const costs=rs[0].costs;out.tropas=Object.fromEntries(Object.entries(U).sort((a,b)=>a[1][1]/a[1][0]/costs[a[0]]-b[1][1]/b[1][0]/costs[b[0]]).map(([id,m])=>[id,Math.round(m[1]/m[0]/costs[id])+' daño/coste, gana '+pct(m[3],m[2])+' ('+m[2]+')']));
 }
 console.log(JSON.stringify(out,null,1));if(errs.length)console.log('ERRORES',errs.slice(0,3));
})();
