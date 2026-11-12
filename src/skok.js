// Skoky z ladění (přepínače a popis adresy v src/debug.js): stav při příchodu na místo ze src/skoky.json (zapisuje
// průchod npm test) a přestavění světa.
import skoky from './skoky.json';
import { createState } from './state';
import { DEBUG } from './debug';

// Místa, na která jde skočit, v pořadí hry.
export const JUMP_PLACES = ['hlavak', 'vaclavak', 'nuselak', 'staromak', 'most', 'malastrana', 'hrad'];

// Stav pro skok: kopie stavu z průchodu (bez něj nový stav s hotovou tvorbou postavy), plus jízdenky z adresy.
export const jumpState = (place) => {
    const state = skoky[place] ? structuredClone(skoky[place]) : { ...createState(), flags: { created: true } };
    state.place = place;
    state.flags.created = true;
    state.tickets += DEBUG.tickets;
    return state;
};

// Skok: zastaví všechno, co běží, a postaví svět místa znovu (volitelně na dlaždici).
export const jump = (game, place, tile = null) => {
    game.registry.set('state', jumpState(place));
    game.registry.set('jumpTile', tile);
    ['title', 'cutscene', 'battle', 'ending', 'hud', 'world'].forEach((key) => { if (game.scene.isActive(key) || game.scene.isPaused(key)) game.scene.stop(key); });
    game.scene.start('world');
};
