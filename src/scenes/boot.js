import Phaser from 'phaser';
import { TITLE, CUTSCENES, ENDINGS, EPILOG } from '../script';
import { head, body, CRT, WIDTH, HEIGHT } from '../ui';
import art from '../../art/version.json';
import { DEBUG } from '../debug';
import { JUMP_PLACES, jumpState } from '../skok';

// Načtení atlasu a obrázků filmečků s ukazatelem ve stylu terminálu.
export class BootScene extends Phaser.Scene {
    constructor() {
        super('boot');
    }

    preload() {
        const options = this.registry.get('options');
        this.cameras.main.setBackgroundColor(CRT.bg);
        head(this, WIDTH / 2, HEIGHT / 2 - 40, TITLE.loading).setOrigin(0.5, 0.5);
        const bar = this.add.graphics();
        this.load.on('progress', (value) => {
            bar.clear();
            bar.lineStyle(2, CRT.line, 1);
            bar.strokeRect(WIDTH / 2 - 200, HEIGHT / 2, 400, 16);
            bar.fillStyle(CRT.line, 1);
            bar.fillRect(WIDTH / 2 - 196, HEIGHT / 2 + 4, Math.floor(392 * value), 8);
        });
        // Verze z art/version.json (zapisuje npm run art) v adrese, aby prohlížeč nedržel starý atlas (poučení z Václaváku).
        const v = `?v=${art.version}`;
        this.load.atlas('atlas', `${options.images}/atlas.png${v}`, `${options.images}/atlas.json${v}`);
        ['landmarks', 'landmarks2', 'landmarks3', 'landmarks4', 'landmarks_vaclavak', 'landmarks_staromak', 'landmarks_hrad', 'landmarks_sm_tyn', 'landmarks_sm_radnice', 'landmarks_sm_namesti', 'landmarks_most', 'landmarks_mostovka', 'landmarks_svah', 'landmarks_kuriozity', 'landmarks_nusle', 'landmarks_nusle_most', 'landmarks_kostely'].forEach((key) => this.load.atlas(key, `${options.images}/${key}.png${v}`, `${options.images}/${key}.json${v}`));
        const images = new Set([...Object.values(CUTSCENES).flat(), ...Object.values(ENDINGS).flatMap((e) => e.shots ?? []), ...EPILOG].map((shot) => shot.image).filter(Boolean));
        images.forEach((key) => this.load.image(key, `${options.images}/${key}.png${v}`));
        this.load.on('loaderror', (file) => body(this, WIDTH / 2, HEIGHT / 2 + 60, `Nejde načíst ${file.key}`, { color: CRT.red }).setOrigin(0.5, 0));
    }

    create() {
        // ladění: ?misto=<místo> rovnou do světa se stavem z průchodu (src/debug.js)
        if (JUMP_PLACES.includes(DEBUG.place)) {
            this.registry.set('state', jumpState(DEBUG.place));
            this.registry.set('jumpTile', DEBUG.tile);
            this.scene.start('world');
            return;
        }
        this.scene.start('title');
    }
}
