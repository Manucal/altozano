# Altozano

Juego de estrategia de batallas de ejércitos en pixel art. Armas un ejército con capacidad limitada (60 de capacidad, máximo 50 unidades), lo despliegas y la batalla se juega sola. El terreno y el clima deciden la estrategia.

Nombre provisional. Prototipo 0.3.

## Jugar

- **Desarrollo:** abre `src/index.html` en el navegador (no necesita servidor).
- **Versión de un solo archivo:** `python3 tools/build.py` genera `dist/altozano.html`.

## Contenido actual

- 7 facciones x 5 tropas: Legión de Hierro, Clan Colmillo, Círculo del Bosque, Draconianos, Muertos vivientes, Demonios y Ángeles. Los ejércitos se pueden mezclar.
- 13 rasgos con sinergias por número de tropas.
- Mecánicas por facción: fuego que quema (y castiga al bosque), resurrección y nigromancia, curación al matar y frenesí, escudo divino y daño sagrado.
- Campo dividido en diagonal: azul arriba a la izquierda, rojo abajo a la derecha.
- Atacante y defensor: el mapa no es simétrico; el lado del defensor tiene el mejor terreno. El defensor espera en posición y gana si resiste 120 s; el atacante tiene que eliminarlo.
- Campos: Fortaleza en la colina, Río fronterizo (con vados), Bosque de la emboscada, Paso estrecho y aleatorio.
- Terreno: llanura, colina (tiradores +2 alcance y +25% daño), bosque (cobertura contra proyectiles), río (lento, -3 armadura).
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
src/js/map.js       generación de mapas simétricos y dibujo del terreno
src/js/weather.js   efectos visuales del clima
src/js/ai.js        composición y despliegue automático de ejércitos
src/js/battle.js    simulación de combate
src/js/render.js    dibujo del campo, unidades y proyectiles
src/js/ui.js        paneles, resultado y despliegue con el puntero
src/js/main.js      arranque
tools/build.py      empaqueta todo en dist/altozano.html
tools/balance.js    simula batallas IA contra IA para revisar el equilibrio
```

## Equilibrio

```
python3 tools/build.py && node tools/balance.js 90
```

Necesita Playwright. Muestra el % de victorias de cada facción y el % del atacante, en total y por tipo de campo. El atacante debe ganar cerca del 50%.
