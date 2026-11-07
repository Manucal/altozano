# Altozano

Juego de estrategia de batallas de ejércitos en pixel art. Armas un ejército con capacidad limitada (60 de capacidad, máximo 30 grupos), lo despliegas y la batalla se juega sola. El terreno y el clima deciden la estrategia.

Nombre provisional. Prototipo 1.0.

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
- Atacante y defensor: el mapa no es simétrico; el lado del defensor tiene el mejor terreno. El defensor espera en posición y gana si resiste 150 s; el atacante gana si lo elimina o si mantiene 2 de los 3 objetivos durante 40 s seguidos sin que se los disputen.
- Mapa de 44x26 casillas. Campos: Fortaleza en la colina, Río fronterizo (con vados), Bosque de la emboscada, Paso estrecho, Cumbre central, Valle de los ríos, Tierras altas, Oasis del desierto, Caldera volcánica y aleatorio.
- Objetivos: estandarte (+10% daño), pozo sagrado (regeneración) y atalaya (+1 alcance a tiradores). Empiezan en manos del defensor y se toman quedándose cerca sin enemigos al lado.
- Despliegue a ciegas: nadie ve al rival al desplegar. Luego se revelan los dos ejércitos y hay 15 s para recolocar hasta 3 grupos (a 2 jugadores, primero el defensor y después el atacante).
- Habilidades del general: eliges 2 de 10 (lluvia de flechas, meteoro, muro de escudos, curación, grito de guerra, raíces, cortina de humo, bendición, refuerzos y rayo) y cada una se usa una vez por batalla. Teclas 1 y 2 contra la IA.
- Moral: baja con las bajas del grupo y de los vecinos y al verse rodeado; por debajo de 25 el soldado huye 4 s (bandera blanca) y recibe +25% de daño. Las élites y los No muertos no huyen; los Gigantes aguantan el doble.
- Clima que cambia: a veces el pronóstico avisa de un cambio de clima a mitad de batalla.
- Terreno vivo: el fuego prende bosques y casas (el bosque quemado queda en llanura y la casa en ruinas) y la lava avanza sobre la ceniza en los biomas volcánicos.
- Progresión contra la IA: cada tipo de tropa gana experiencia y sube hasta el nivel 5; en cada nivel eliges 1 de 2 mejoras. Se guarda en el navegador y no cuenta a 2 jugadores.
- Biomas: templado, mixto, desierto, volcánico, ruinas antiguas y pueblo. Desierto (lento, castiga la armadura pesada), ceniza volcánica (quema poco a poco salvo a Dracónicos e Infernales, que pegan más fuerte) y lava (infranqueable a pie). Ruinas: suelo de losas que frena a montados y grandes y protege de proyectiles (-25%); los sanadores curan +25% en ellas; los muros en ruinas no se cruzan y dan cobertura (-20% de proyectiles) a su lado. Pueblo: caminos que dan +20% de velocidad y cruzan los ríos, y casas que bloquean el paso, dan cobertura y arden con el fuego. Las regiones salen de ruido suave y los bordes se mezclan por píxel.
- Zoom de x1 (vista general) a x3,5 con minimapa: rueda o pellizco para acercar, arrastrar para moverse (al desplegar, botón derecho o dos dedos), teclas + - 0 y flechas.
- Los mapas tienen varias colinas repartidas y ríos que serpentean en cualquier dirección, con vados.
- Alturas de 2 niveles: colina (altura 1) y montaña (altura 2). Entre alturas hay acantilados que solo se cruzan por rampas; las tropas buscan el camino (A*).
- Tiradores en altura: colina +2 alcance y +25% daño, montaña +3 y +40%. Cuerpo a cuerpo cuesta arriba: -20% por nivel.
- Terreno: llanura, colina, montaña, rampa, bosque (cobertura contra proyectiles), río (lento, -3 armadura).
- 7 climas: despejado, lluvia, niebla, ventisca, viento del oeste, viento del este, sol abrasador.
- Órdenes en batalla: clic en una tropa para seleccionar su grupo (Mayús para sumar, recuadro arrastrando). Clic derecho sobre un enemigo: atacar ese grupo. Clic derecho en el suelo: ir y quedarse. H: mantener posición. G y clic: atacar zona (cursor de mira). Espacio: pausa. En táctil: tocar tropas y luego el destino.
- Interfaz dentro del campo: el mapa ocupa toda la pantalla y el panel de mando es una ventana flotante que se puede plegar (−) y arrastrar por su barra. En pantallas estrechas pasa a ser una hoja inferior plegable.
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
src/js/battle.js    simulación de combate y moral
src/js/events.js    objetivos, clima cambiante, fuego y lava
src/js/general.js   habilidades del general
src/js/progress.js  experiencia y mejoras de las tropas
src/js/render.js    dibujo del campo, unidades y proyectiles
src/js/ui.js        paneles, resultado y despliegue con el puntero
src/js/reveal.js    revelación de 15 s tras el despliegue a ciegas
src/js/orders.js    selección de grupos y órdenes durante la batalla
src/js/camera.js    zoom, desplazamiento y minimapa
src/js/windows.js   ventana flotante del panel (plegar y arrastrar)
src/js/main.js      arranque
tools/build.py      empaqueta todo en dist/altozano.html
tools/balance.js    simula batallas IA contra IA para revisar el equilibrio
```

## Equilibrio

```
python3 tools/build.py && node tools/balance.js 90
```

Necesita Playwright. Muestra el % de victorias de cada facción y el % del atacante, en total y por tipo de campo. El atacante debe ganar cerca del 50%.
