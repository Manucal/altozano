# Encargo: octava facción de Altozano

Instrucciones para la próxima tarea grande. Antes de empezar, lee el `CLAUDE.md` del repositorio: sus reglas siguen valiendo.

## Objetivo

Añadir la octava facción. Debe estar a la altura de las otras siete: 16 tropas (15 normales y una élite), con una identidad clara ligada al terreno o al clima, sprites propios y equilibrada con el resto.

## Concepto propuesto: Hijos de la Marea (provisional)

Pueblo anfibio de pantanos y costas. Es la primera facción que saca ventaja del agua. Ahora mismo el río solo estorba: ralentiza y quita 3 de armadura a quien está dentro (`battle.js`).

- **Fuerte en ríos y con lluvia.** Se mueven por el río como por llanura, no pierden armadura en el agua y con lluvia ganan algo (por ejemplo velocidad o regeneración).
- **Débil con calor y en desierto.** Pierden velocidad o vida con calor (`heat`) y sobre arena (superficie 6). Así es el reflejo inverso de los Draconianos.
- **Rasgo nuevo `Anfibio`** en `TRAITS` (tiers [3,6]), con el bonus en el agua que escala con el número de tropas.
- **Estilo de juego:** control y desgaste. Redes que ralentizan, venenos de ciénaga, arponeros que atraen enemigos y tropas que se esconden en el río. Debe ser distinto del Círculo del Bosque, que ya es el especialista de un terreno.
- **Élite:** algo que cambie el mapa. Por ejemplo, una sacerdotisa de las mareas que inunda casillas de llanura durante unos segundos, convirtiéndolas en río temporal. `resetField()` ya restaura `S.map` entre batallas, como hace con el fuego y la lava.

Si al diseñarla ves una idea mejor, propónla a Manuel antes de implementarla.

## Requisitos

1. **Datos (`src/js/data.js`):** la facción en `FACTIONS` (nombre, texto y paleta `pal`), el rasgo en `TRAITS`, 15 tropas normales y una élite (`elite:true`) en `UNITS`. Incluye el tamaño de grupo en `SQUAD` (`core.js`) o con `n`. Mezcla de roles parecida a las demás facciones: infantería barata, tiradores, una tropa grande, sanador o místico, móvil u montada, y alguna voladora o especial.
2. **Mecánicas:** reutiliza las banderas que ya existen (poison, slow, sunder, regen, stealth...). Las banderas nuevas (por ejemplo `pull` para el arpón, `net` o `flood`) van en `step()`/`abilities()` de `battle.js`, sin romper a las demás facciones.
3. **Terreno y clima:** la interacción con río, lluvia, calor y desierto tiene que notarse y verse en la descripción de cada tropa. Añade también la superficie temporal de inundación si haces esa élite.
4. **Sprites (`src/js/sprites.js`):** piezas nuevas que hagan falta (cabeza anfibia, arpón, red, caparazón, montura de agua...), en pixel art del mismo estilo y tamaño que el resto.
5. **IA (`ai.js`):** que la IA sepa usar la facción (que prefiera desplegarla cerca del agua y la elija más con lluvia).
6. **Interfaz:** que la facción aparezca en el selector y en los textos. Todo el texto del juego, en español.
7. **Mapas:** comprueba que la mayoría de campos tienen agua suficiente para que la facción no sea inútil. Si no, ajusta la generación o un par de campos sin romper su equilibrio.

## Equilibrio

- Después de cada cambio en la simulación: `python3 tools/build.py && node tools/balance.js`.
- Meta: el atacante gana cerca del 50% y todas las facciones, incluida la nueva, quedan entre 42% y 58%.
- La facción nueva debe ganar claramente más en mapas con río y con lluvia que en desierto y con calor: separa sus resultados por mapa y clima para comprobarlo.
- Pendiente del hilo anterior: el atacante gana demasiado en Cumbre central y Valle de los ríos. Si da tiempo, acerca los objetivos al defensor en esos dos mapas.

## Entrega

1. Commit en la rama de trabajo y push.
2. Publicar `dist/altozano.html` en el Artifact de siempre: https://claude.ai/artifact/RD9iWW57gs2Wh3TxzsiqQ1
3. Copiar el juego a `/mnt/project-files/juego/altozano.html`.
4. Resumen para Manuel: la facción con sus tropas, cómo se juega y los números de la simulación.
5. Actualizar la memoria del proyecto (facciones: ahora son 8).
