# Altozano

Juego de estrategia de batallas de ejércitos en pixel art. Armas un ejército con capacidad limitada (60 de capacidad, máximo 30 grupos), lo despliegas y la batalla se juega sola. El terreno y el clima deciden la estrategia.

Nombre provisional. Prototipo 0.7.

## Jugar

- **Desarrollo:** abre `src/index.html` en el navegador (no necesita servidor).
- **Versión de un solo archivo:** `python3 tools/build.py` genera `dist/altozano.html`.

## Contenido actual

- Cada tropa se coloca como un grupo de soldados (lanceros x4, caballería x3, sacerdotes x2, gigantes x1; ver `SQUAD` en `src/js/core.js`). La vida y la cadencia del grupo se reparten entre sus soldados.
- 7 facciones x 16 tropas (15 normales y 1 élite), 112 en total: Legión de Hierro, Clan Colmillo, Círculo del Bosque, Draconianos, Muertos vivientes, Demonios y Ángeles. Los ejércitos se pueden mezclar.
- Élites (máximo 2 por ejército), cada una con una mecánica propia: Paladín abanderado (aura de daño y armadura), Caudillo de guerra (grito que acelera los ataques), Acechadora (invisible hasta que dispara), Invocadora de magma (charcos de magma), Liche (absorbe vida en área), Segador de almas (se teletransporta) y Serafín (curación en área, vuela).
- Mecánicas de tropa: veneno, ralentizar, romper armadura, explotar, regenerarse, robar vida, espinas, cazar tiradores, asedio de largo alcance, auras y gritos de guerra.
- 13 rasgos con sinergias por número de tropas.
- Mecánicas por facción: fuego que quema (y castiga al bosque), resurrección y nigromancia, curación al matar y frenesí, escudo divino y daño sagrado.
- Campo dividido en diagonal: azul arriba a la izquierda, rojo abajo a la derecha.
- Atacante y defensor: el mapa no es simétrico; el lado del defensor tiene el mejor terreno. El defensor espera en posición y gana si resiste 120 s; el atacante tiene que eliminarlo.
- Mapa de 44x26 casillas. Campos: Fortaleza en la colina, Río fronterizo (con vados), Bosque de la emboscada, Paso estrecho, Cumbre central, Valle de los ríos, Tierras altas, Oasis del desierto, Caldera volcánica y aleatorio.
- Biomas: templado, mixto, desierto y volcánico. Desierto (lento, castiga la armadura pesada), ceniza volcánica (quema poco a poco salvo a Dracónicos e Infernales, que pegan más fuerte) y lava (infranqueable a pie). Las regiones salen de ruido suave y los bordes se mezclan por píxel.
- Zoom de x1 (vista general) a x3,5 con minimapa: rueda o pellizco para acercar, arrastrar para moverse (al desplegar, botón derecho o dos dedos), teclas + - 0 y flechas.
- Los mapas tienen varias colinas repartidas y ríos que serpentean en cualquier dirección, con vados.
- Alturas de 2 niveles: colina (altura 1) y montaña (altura 2). Entre alturas hay acantilados que solo se cruzan por rampas; las tropas buscan el camino (A*).
- Tiradores en altura: colina +2 alcance y +25% daño, montaña +3 y +40%. Cuerpo a cuerpo cuesta arriba: -20% por nivel.
- Terreno: llanura, colina, montaña, rampa, bosque (cobertura contra proyectiles), río (lento, -3 armadura).
- 7 climas: despejado, lluvia, niebla, ventisca, viento del oeste, viento del este, sol abrasador.
- Modos: contra la IA y 2 jugadores en el mismo dispositivo.

## Estructura

```
src/index.html      página y orden de carga de los scripts
src/css/style.css   estilos
src/js/core.js      constantes (tamaño del mapa, capacidad, límites) y utilidades
src/js/data.js      facciones, rasgos, tropas, terrenos, climas y tipos de campo
src/js/sprites.js   pixel art por partes (cabezas, torsos, piernas, armas, monturas)
src/js/state.js     estado global S
src/js/map.js       generación de mapas, biomas y dibujo del terreno
src/js/weather.js   efectos visuales del clima
src/js/ai.js        composición y despliegue automático de ejércitos
src/js/battle.js    simulación de combate
src/js/render.js    dibujo del campo, unidades y proyectiles
src/js/ui.js        paneles, resultado y despliegue con el puntero
src/js/camera.js    zoom, desplazamiento y minimapa
src/js/main.js      arranque
tools/build.py      empaqueta todo en dist/altozano.html
tools/balance.js    simula batallas IA contra IA para revisar el equilibrio
```

## Equilibrio

```
python3 tools/build.py && node tools/balance.js 90
```

Necesita Playwright. Muestra el % de victorias de cada facción y el % del atacante, en total y por tipo de campo. El atacante debe ganar cerca del 50%.
