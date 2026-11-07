'use strict';
/* ================= PIXEL ART POR PARTES ================= */
const COMMON={e:'#1b1420',w:'#8b5a2b',t:'#efe6c8',g:'#4f9a3a',G:'#2d6a2e',L:'#8fd05a',k:'#7a5532',K:'#4e341e',y:'#ffe066'};
const blank=(w,h)=>Array.from({length:h},()=>Array(w).fill('.'));
function stamp(g,rows,x0,y0){rows.forEach((r,j)=>{for(let i=0;i<r.length;i++){const ch=r[i];if(ch!=='.'){const y=y0+j,x=x0+i;if(g[y]&&x>=0&&x<g[0].length)g[y][x]=ch}}})}
function ops(g,list,dx=0,dy=0){for(const [x,y,ch] of list){const yy=y+dy,xx=x+dx;if(g[yy]&&xx>=0&&xx<g[0].length)g[yy][xx]=ch}}
const vline=(x,y0,y1,ch)=>{const o=[];for(let y=y0;y<=y1;y++)o.push([x,y,ch]);return o};
const HEADS={
 helm:['......mmmm','.....mmmmmm','.....mmsses','.....mssss','......sss'],
 hood:['......cccc','.....cccccc','.....ccsses','.....cssss','......sss'],
 orc:['......hhhh','.....ssssss','.....sssses','.....sssst','......sss'],
 orcHelm:['....t.mmmm.t','....tmmmmmmt','.....mmsses','.....sssst','......sss'],
 elf:['......hhhh','.....hhhhhh','.....hhsses','.....hhsssss','......sss'],
 elfHood:['......cccc','.....cccccc','.....ccsses','.....cssss','......sss'],
};
const TORSO={
 armor:['.....aaaaaa','....aaabbaaa','....saabbaas','.....aaaaaa','.....dddddd'],
 leather:['.....bbbbbb','....sbbaabbs','....sbbaabbs','.....bbbbbb','.....dddddd'],
 robe:['.....cccccc','....ccccbccc','....sccbcccs','....cccccccc','....cccccccc'],
};
const LEGS={
 pants:[['.....dd..dd','.....dd..dd','.....dd..dd','....eee..eee'],['.....dd..dd','....dd....dd','....dd....dd','...eee....eee']],
 robe:[['....cccccccc','....cccccccc','.....cccccc','.....ee..ee'],['....cccccccc','....cccccccc','.....cccccc','....ee....ee']],
};
const WEAP={
 spear:[...vline(12,2,13,'w'),[12,0,'m'],[12,1,'m'],[11,1,'m'],[13,1,'m']],
 shield:(()=>{const o=[];for(let y=7;y<=12;y++)for(let x=2;x<=5;x++)o.push([x,y,(x===2||x===5||y===7||y===12)?'m':'b']);o.push([3,9,'c'],[4,9,'c'],[3,10,'c'],[4,10,'c']);return o})(),
 sword:[...vline(12,2,8,'m'),[11,9,'b'],[12,9,'b'],[13,9,'b'],[12,10,'w']],
 sword2:[...vline(3,4,9,'m'),[2,10,'b'],[3,10,'b'],[4,10,'b']],
 bow:[[12,4,'w'],[13,5,'w'],[13,6,'w'],[14,7,'w'],[14,8,'w'],[14,9,'w'],[13,10,'w'],[13,11,'w'],[12,12,'w'],...vline(12,5,11,'t')],
 crossbow:[[9,9,'w'],[10,9,'w'],[11,9,'w'],[12,9,'w'],[13,9,'w'],[14,7,'m'],[14,8,'m'],[14,9,'m'],[14,10,'m'],[14,11,'m'],[13,8,'d'],[13,10,'d']],
 staff:[...vline(12,3,14,'w'),[12,1,'y'],[11,2,'y'],[12,2,'y'],[13,2,'y'],[12,0,'t']],
 axe:[...vline(12,4,12,'w'),[13,3,'m'],[13,4,'m'],[14,4,'m'],[13,5,'m'],[14,5,'m'],[14,6,'m'],[14,3,'m']],
 haxe:[...vline(12,6,11,'w'),[13,5,'m'],[13,6,'m'],[14,6,'m'],[13,7,'m'],[3,10,'w'],[3,11,'w'],[2,10,'m'],[2,9,'m']],
};
const MBODY=['..............kk..','...k.........kkkK.','..kkccccccccckkk..','.k.kccccccccckk...','...kkkkkkkkkkk....'];
const WBODY=['..............k.k.','.............kkkkK','..kkkkkkkkkkkkkk..','kk.kkkkkkkkkkkk...','...kkkkkkkkkkk....'];
const MLEGS=[['...k.k.....k.k....','...k.k.....k.k....','...K.K.....K.K....'],['..k...k...k...k...','.k.....k.k.....k..','.K.....K.K.....K..']];
const BRUTE_TOP=['.......hhhhhh.......','......ssssssss......','......sssssesst.....','......ssssssstt.....','.......ssssss.......','....aaaaaaaaaaaa....','...ssaaaabbaaaass...','..sssaaabbbbaaasss..','..sss.aaabbaaa.sss..','..ss..aaaaaaaa..ss..','..ss..dddddddd..ss..','......aaaaaaaa......'];
const BRUTE_LEGS=[['.......ddd..ddd.....','.......ddd..ddd.....','......eeee..eeee....'],['......ddd....ddd....','......ddd....ddd....','.....eeee....eeee...']];
const CLUB=[...vline(17,1,10,'w'),...vline(18,1,4,'w'),[16,1,'w'],[16,2,'w'],[19,2,'m'],[16,4,'m'],[19,4,'m'],[18,0,'m']];
const TREANT_TOP=['......gg.gg.........','....gggLggggg.......','...ggLLgggggGgg.....','..gggLgggggggGgg....','...gggggggggGgg.....','.....kkkkkkkk.......','....kkkykkykkk......','....kkkkkkkkkk......','..kkkkKkkkkKkkkk....','.kk.kkkkKkkkkk.kk...','kk..kkKkkkkKkk..kk..','g...kkkkkkkkkk...g..','.....kkkKkkkkk......'];
const TREANT_LEGS=[['.....kkk..kkk.......','....kkkk..kkkk......','...KKKK....KKKK.....'],['.....kkk...kkk......','....kkkk....kkkk....','...KKKK......KKKK...']];
const BIRD=[['a..........a','aa........aa','.aaa.bb.aaa.','..aaabbbaa..','....bbbbet..','.....bbb....','......b.....'],['............','............','....bbb.....','..aabbbbaa..','.aaabbbbeta.','aa...bbb..aa','a.....b....a']];
const TREE=['.....gggg.....','...gggLLggg...','..ggLLLgggGg..','.ggLLgggggGGg.','.gggggggggGGg.','ggggggggGgGGGg','gGgggggGGGGGGg','.gGGgGGGGGGGg.','..gGGGGGGGGg..','....GGwGG.....','......ww......','......ww......','.....wwww.....'];

function buildGrids(sp){
 if(sp.k==='foot')return [0,1].map(f=>{const g=blank(16,16);stamp(g,LEGS[sp.legs][f],0,12);stamp(g,TORSO[sp.torso],0,7);stamp(g,HEADS[sp.head],0,2);for(const w of sp.weap)ops(g,WEAP[w]);return g});
 if(sp.k==='mount')return [0,1].map(f=>{const g=blank(18,16);const body=sp.mount==='wolf'?WBODY:MBODY;stamp(g,[...body,...MLEGS[f]],0,8);stamp(g,TORSO[sp.torso].slice(0,4),1,5);stamp(g,HEADS[sp.head],1,0);for(const w of sp.weap)ops(g,WEAP[w],1,-2);return g});
 if(sp.k==='brute')return [0,1].map(f=>{const g=blank(20,15);stamp(g,[...BRUTE_TOP,...BRUTE_LEGS[f]],0,0);ops(g,CLUB);return g});
 if(sp.k==='treant')return [0,1].map(f=>{const g=blank(20,16);stamp(g,[...TREANT_TOP,...TREANT_LEGS[f]],0,0);return g});
 if(sp.k==='bird')return [0,1].map(f=>{const g=blank(12,7);stamp(g,BIRD[f],0,0);return g});
}
function raster(g,pal,white){
 const h=g.length,w=g[0].length,c=document.createElement('canvas');c.width=w+2;c.height=h+2;const x=c.getContext('2d');
 const op=(i,j)=>j>=0&&j<h&&i>=0&&i<w&&g[j][i]!=='.';
 for(let j=-1;j<=h;j++)for(let i=-1;i<=w;i++){
  if(op(i,j)){x.fillStyle=white?'#ffffff':(pal[g[j][i]]||'#ff00ff');x.fillRect(i+1,j+1,1,1)}
  else if(op(i-1,j)||op(i+1,j)||op(i,j-1)||op(i,j+1)){x.fillStyle=white?'#ffffff':'#120c14';x.fillRect(i+1,j+1,1,1)}
 }
 // luz suave arriba-izquierda: aclara el primer píxel opaco de cada fila
 if(!white){const id=x.getImageData(0,0,w+2,h+2),d=id.data;for(let j=0;j<h+2;j++){let seen=0;for(let i=0;i<w+2;i++){const k=(j*(w+2)+i)*4;if(d[k+3]&&!(d[k]===18&&d[k+1]===12&&d[k+2]===20)){if(seen<1){d[k]=Math.min(255,d[k]+28);d[k+1]=Math.min(255,d[k+1]+28);d[k+2]=Math.min(255,d[k+2]+22)}seen++}}}x.putImageData(id,0,0)}
 return c;
}
const SPR={};
function spritePal(u){
 const fp=FACTIONS[u.f].pal;let pal={...COMMON,...fp,...(u.sp.pal||{})};
 if(u.sp.k==='bird')pal={...pal,a:'#7fd0ff',b:'#d8f4ff',t:'#ffd34a'};
 return pal;
}
function buildSprites(){
 for(const u of UNITS){const grids=buildGrids(u.sp),pal=spritePal(u);SPR[u.id]={f:grids.map(g=>raster(g,pal)),w:grids.map(g=>raster(g,pal,true))}}
 SPR.tree=[0,1].map(v=>{const g=blank(14,13);stamp(g,TREE,0,0);return g});
}
function treeSprite(snow,variant){
 const key='tree'+(snow?'s':'')+variant;if(SPR[key])return SPR[key];
 const pal=snow?{...COMMON,g:'#e8eef4',L:'#ffffff',G:'#a9bccb'}:variant?{...COMMON,g:'#3f8a36',L:'#7cc04e',G:'#245a26'}:COMMON;
 return SPR[key]=raster(SPR.tree[0],pal);
}
function iconURL(id){const s=SPR[id].f[0],c=document.createElement('canvas');const sc=Math.floor(46/Math.max(s.width,s.height))||1;c.width=48;c.height=48;const x=c.getContext('2d');x.imageSmoothingEnabled=false;x.drawImage(s,Math.round((48-s.width*sc)/2),Math.round((48-s.height*sc)/2),s.width*sc,s.height*sc);return c.toDataURL()}
