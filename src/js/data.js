'use strict';
/* ================= DATOS ================= */
const FACTIONS=[
 {name:'Legión de Hierro',blurb:'Humanos disciplinados: escudos, ballestas y caballería pesada.',pal:{s:'#e8b48a',a:'#8d9bb0',b:'#d4a52a',d:'#4a5468',m:'#dfe6ee',h:'#6b4423',c:'#2f4f9a'}},
 {name:'Clan Colmillo',blurb:'Orcos de la estepa: baratos, rápidos y fuertes en manada.',pal:{s:'#79a84e',a:'#7a4a2a',b:'#b23a2a',d:'#3a281a',m:'#b8b8b0',h:'#2a1a10',c:'#6a3a1e'}},
 {name:'Círculo del Bosque',blurb:'Silvanos: buena puntería y dueños del bosque.',pal:{s:'#f1d2b0',a:'#3f7a3a',b:'#cdb65a',d:'#253f25',m:'#e3ecd6',h:'#e0c26a',c:'#2d6a3a'}},
];
const TRAITS={
 Infanteria:{n:'Infantería',tiers:[4,8],fx:['+2 armadura','+4 armadura']},
 Escudo:{n:'Escudo',tiers:[3,6],fx:['-25% daño de proyectiles','-45% daño de proyectiles']},
 Tirador:{n:'Tirador',tiers:[4,8],fx:['+15% daño a distancia','+30% daño a distancia']},
 Montado:{n:'Montado',tiers:[2,4],fx:['+20% velocidad','+20% vel. y carga x2,5']},
 Bestia:{n:'Bestia',tiers:[5,10],fx:['+15% daño','+30% daño']},
 Mistico:{n:'Místico',tiers:[2,4],fx:['+30% curación','+60% curación']},
 Silvano:{n:'Silvano',tiers:[3,6],fx:['En bosque: +25% daño y regeneran','En bosque +40%; regeneran siempre']},
 Gigante:{n:'Gigante',tiers:[2,3],fx:['Golpe en área al 75%','Golpe en área al 100%']},
 Volador:{n:'Volador',tiers:[3,6],fx:['+25% vel. de ataque','+50% vel. de ataque']},
};
const UNITS=[
 {id:'lancero',f:0,name:'Lancero',cost:2,hp:110,atk:12,rng:1,as:1.1,spd:1.1,arm:3,tr:['Infanteria','Escudo'],anti:'Montado',desc:'Doble daño contra montados.',sp:{k:'foot',head:'helm',torso:'armor',legs:'pants',weap:['spear','shield']}},
 {id:'arquero',f:0,name:'Arquero',cost:2,hp:60,atk:9,rng:6,as:1.2,spd:1.2,arm:0,tr:['Tirador'],proj:'arrow',desc:'Tirador básico. En colina es otro.',sp:{k:'foot',head:'hood',torso:'leather',legs:'pants',weap:['bow']}},
 {id:'ballestero',f:0,name:'Ballestero',cost:3,hp:75,atk:24,rng:7,as:2.4,spd:1.0,arm:1,tr:['Tirador','Infanteria'],pierce:true,proj:'bolt',desc:'Perforante: ignora la armadura. Recarga lenta.',sp:{k:'foot',head:'helm',torso:'leather',legs:'pants',weap:['crossbow']}},
 {id:'caballero',f:0,name:'Caballero',cost:5,hp:230,atk:20,rng:1,as:1.2,spd:2.2,arm:5,tr:['Montado','Escudo'],charge:true,mount:true,desc:'Carga: tras galopar 3 casillas, el golpe hace doble daño.',sp:{k:'mount',mount:'horse',head:'helm',torso:'armor',weap:['spear'],pal:{k:'#e8e0d0',K:'#9a8f80'}}},
 {id:'clerigo',f:0,name:'Clérigo',cost:4,hp:70,atk:5,rng:4,as:1.6,spd:1.0,arm:1,tr:['Mistico','Infanteria'],heal:14,proj:'orb',desc:'Cura al aliado más herido.',sp:{k:'foot',head:'hood',torso:'robe',legs:'robe',weap:['staff'],pal:{c:'#e9e2cf',y:'#ffe066'}}},
 {id:'saqueador',f:1,name:'Saqueador',cost:1,hp:75,atk:10,rng:1,as:0.9,spd:1.5,arm:0,tr:['Bestia','Infanteria'],desc:'Barato y rápido: llena las 50 plazas.',sp:{k:'foot',head:'orc',torso:'leather',legs:'pants',weap:['axe']}},
 {id:'hachero',f:1,name:'Lanzahachas',cost:2,hp:70,atk:13,rng:4,as:1.5,spd:1.3,arm:0,tr:['Bestia','Tirador'],proj:'axe',desc:'Alcance corto, golpe fuerte.',sp:{k:'foot',head:'orc',torso:'leather',legs:'pants',weap:['haxe']}},
 {id:'jinete',f:1,name:'Jinete de lobo',cost:4,hp:150,atk:15,rng:1,as:0.9,spd:2.7,arm:2,tr:['Bestia','Montado'],charge:true,mount:true,desc:'El más rápido. Carga y flanquea.',sp:{k:'mount',mount:'wolf',head:'orcHelm',torso:'leather',weap:['axe'],pal:{k:'#8a8a92',K:'#55555e'}}},
 {id:'bruto',f:1,name:'Bruto',cost:5,hp:330,atk:30,rng:1,as:1.9,spd:0.85,arm:4,tr:['Bestia','Gigante'],splash:true,big:true,desc:'Golpe en área (50% a los de alrededor).',sp:{k:'brute'}},
 {id:'chaman',f:1,name:'Chamán',cost:3,hp:65,atk:6,rng:4,as:1.4,spd:1.1,arm:0,tr:['Mistico','Bestia'],heal:10,proj:'orb',desc:'Cura y cuenta para la manada.',sp:{k:'foot',head:'orcHelm',torso:'robe',legs:'robe',weap:['staff'],pal:{c:'#5a2a6a',y:'#ff6040'}}},
 {id:'guarda',f:2,name:'Guardabosques',cost:2,hp:60,atk:10,rng:6,as:1.1,spd:1.4,arm:0,tr:['Tirador','Silvano'],proj:'arrow',desc:'Buen alcance; el bosque no lo frena.',sp:{k:'foot',head:'elfHood',torso:'leather',legs:'pants',weap:['bow']}},
 {id:'danza',f:2,name:'Danzaespadas',cost:3,hp:105,atk:15,rng:1,as:0.7,spd:1.8,arm:1,tr:['Infanteria','Silvano'],dodge:0.25,desc:'Esquiva el 25% de los golpes.',sp:{k:'foot',head:'elf',torso:'armor',legs:'pants',weap:['sword','sword2']}},
 {id:'arboreo',f:2,name:'Arbóreo',cost:6,hp:450,atk:22,rng:1,as:1.6,spd:0.7,arm:6,tr:['Gigante','Silvano'],splash:true,big:true,desc:'Muralla viviente con golpe en área.',sp:{k:'treant'}},
 {id:'druida',f:2,name:'Druida',cost:4,hp:70,atk:6,rng:4,as:1.4,spd:1.1,arm:0,tr:['Mistico','Silvano'],heal:11,proj:'orb',desc:'Cura. Con lluvia, aún más.',sp:{k:'foot',head:'elf',torso:'robe',legs:'robe',weap:['staff'],pal:{c:'#5a7a2a',y:'#7dff8a'}}},
 {id:'halcon',f:2,name:'Halcón espíritu',cost:3,hp:55,atk:9,rng:1,as:0.6,spd:3.2,arm:0,tr:['Volador','Silvano'],fly:true,desc:'Vuela sobre todo terreno y caza tiradores.',sp:{k:'bird'}},
];
const UBY=Object.fromEntries(UNITS.map(u=>[u.id,u]));
const TER=[
 {n:'Llanura',mv:1,col:['#5f9e48','#69aa4f','#578f41'],d:'Sin efectos.'},
 {n:'Colina',mv:0.75,col:['#a3c264','#b0cd70','#96b558'],d:'Elevada. Tiradores: +2 de alcance y +25% de daño contra unidades más bajas. Atacar cuerpo a cuerpo cuesta arriba: -20%.'},
 {n:'Bosque',mv:0.6,col:['#45793a','#3e7033','#376629'],d:'Cobertura: -40% de daño de proyectiles. Frena el paso (a los Silvanos no).'},
 {n:'Río',mv:0.45,col:['#2f6fa8','#3579b5','#2a6299'],d:'Muy lento de cruzar y -3 de armadura dentro del agua. Los voladores lo ignoran.'},
];
const WEATHERS=[
 {id:'clear',n:'Despejado',d:'Sin efectos.'},
 {id:'rain',n:'Lluvia',d:'Proyectiles -25% de daño. El río frena todavía más. Los místicos curan +20%.'},
 {id:'fog',n:'Niebla',d:'Los tiradores no ven más allá de 4 casillas (la colina suma solo +1). Los Silvanos hacen +20% de daño.'},
 {id:'snow',n:'Ventisca',d:'Todos se mueven un 30% más lento, salvo las Bestias. Los montados no pueden cargar.'},
 {id:'windE',n:'Viento del oeste',d:'Ayuda al azul: proyectiles hacia el este +2 de alcance, hacia el oeste -2.'},
 {id:'windW',n:'Viento del este',d:'Ayuda al rojo: proyectiles hacia el oeste +2 de alcance, hacia el este -2.'},
 {id:'heat',n:'Sol abrasador',d:'Armadura pesada (4 o más) ataca un 25% más lento. El río baja y se cruza más rápido.'},
];
const PRESETS=[
 {id:'random',n:'Aleatorio'},
 {id:'gemelas',n:'Colinas gemelas'},
 {id:'vado',n:'El vado'},
 {id:'bosque',n:'Bosque partido'},
 {id:'meseta',n:'Meseta central'},
];
