import Phaser from 'phaser';
import { createSound } from './sound';
import { WIDTH, HEIGHT } from './ui';
import { BootScene } from './scenes/boot';
import { TitleScene } from './scenes/title';
import { CutsceneScene } from './scenes/cutscene';
import { WorldScene } from './scenes/world';
import { HudScene } from './scenes/hud';
import { EndingScene } from './scenes/ending';
import { BattleScene } from './scenes/battle';
import { DEBUG } from './debug';

// Konečná. Nevystupovat.: samostatná stránka s hrou v Phaseru 3, pixel art 1280 × 720 bodů zobrazený 1:1, na menších displejích
// zmenšený bez vyhlazení. Boot načte atlas (pxl, art/) → titulek → úvodní filmeček → svět (WorldScene) s lištou a dialogy
// (HudScene). Boj, mini-hry a filmečky běží jako další scény nad světem. Konec je EndingScene.
const element = document.querySelector('[data-konecna]');

const start = () => {
    const game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: element,
        width: WIDTH,
        height: HEIGHT,
        backgroundColor: '#050806',
        pixelArt: true,
        roundPixels: true,
        // Plátno centruje CSS rodiče (flex); vlastní centrování Phaseru by se k němu přičetlo (poučení z Václaváku).
        scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.NO_CENTER },
        input: { activePointers: 2 },
        scene: [BootScene, TitleScene, CutsceneScene, WorldScene, HudScene, BattleScene, EndingScene],
    });

    // Zrychlený čas (?rychle, src/debug.js): krok hry dostane násobený čas, takže chůze, animace a časovače všech scén
    // běží rychleji; tweeny měří čas samy, mají vlastní násobek (Phaser ho při startu scény vrací na 1).
    if (DEBUG.speed > 1) {
        const step = game.step.bind(game);
        game.step = (time, delta) => step(time, delta * DEBUG.speed);
        game.events.once('ready', () => game.scene.scenes.forEach((scene) => {
            scene.tweens.timeScale = DEBUG.speed;
            scene.events.on('start', () => { scene.tweens.timeScale = DEBUG.speed; });
        }));
    }

    // Instance hry je na window kvůli ladění a Playwright průchodům (scény jdou řídit z konzole).
    window.konecna = game;
    const sound = createSound();
    game.registry.set('sound', sound);
    const unlock = () => { if (sound.unlock()) game.events.emit('sound-unlocked'); };
    ['pointerdown', 'keydown', 'touchstart'].forEach((type) => document.addEventListener(type, unlock, { passive: true }));
    game.registry.set('options', { images: `${import.meta.env.BASE_URL}images` });
};

// Pixelová písma musí být načtená dřív, než je Phaser poprvé vykreslí do textury.
const fonts = document.fonts ? Promise.all([document.fonts.load("16px 'Press Start 2P'"), document.fonts.load('28px VT323')]).catch(() => null) : Promise.resolve();
fonts.then(start);
