# Altozano: notas para Claude

- El usuario (Manuel) escribe en español. Responde y escribe el texto del juego en español.
- Juego original inspirado en el género de auto-battlers de ejércitos. No copies nombres, personajes, arte ni niveles de juegos existentes.
- Objetivo de diseño: 8 o 9 facciones con 15 tropas cada una; el terreno y el clima deben ser decisivos; máximo 50 unidades por jugador; el foco es el PvP.
- Los scripts de `src/js/` son scripts clásicos que comparten el ámbito global, cargados en el orden de `src/index.html`. No uses módulos ES (la página tiene que funcionar abriéndola como archivo).
- Para añadir una tropa: una entrada en `UNITS` (`src/js/data.js`) con su receta de sprite `sp`. Las piezas de sprite están en `src/js/sprites.js`.
- Después de cambiar la simulación, ejecuta `python3 tools/build.py && node tools/balance.js` y revisa que el atacante gane cerca del 50% y ninguna facción se aleje mucho del 50%.
- `dist/altozano.html` se publica como Artifact en https://claude.ai/artifact/RD9iWW57gs2Wh3TxzsiqQ1 (publica siempre en esa URL).
