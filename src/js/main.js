'use strict';
/* ================= ARRANQUE ================= */
buildSprites();
for(const u of UNITS)ICON[u.id]=iconURL(u.id);
S.armies[1].fac=1;
newField();renderPanel();renderHud();updateTileInfo();
requestAnimationFrame(frame);
window.__altozano=S;window.__alt={step,startBattle,autoArmy,newField,FACTIONS,UNITS,SPR};
