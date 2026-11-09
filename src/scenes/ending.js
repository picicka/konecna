import Phaser from 'phaser';
import { ENDINGS, EPILOG } from '../script';
import { load, clearSave } from '../state';
import { holds } from '../story';
import { head, body, button, scanlines, CRT, WIDTH, HEIGHT } from '../ui';

// Závěr: nejdřív filmeček konce (ENDINGS[konec].shots) a epilog ve stylu Falloutu (snímek za každé místo, kde hráčka
// něco změnila, EPILOG s podmínkami nad stavem), pak obrazovka s názvem konce a textem; „Hrát znovu“ začne od titulku.
// Po smrti navíc „Zpátky na poslední místo“ (checkpoint z localStorage), smrt je konec s epilogem, ne game over.
export class EndingScene extends Phaser.Scene {
    constructor() {
        super('ending');
    }

    init(data) {
        this.result = data.result ?? 'death';
        this.shown = data.shown ?? false;
    }

    create() {
        const ending = ENDINGS[this.result] ?? ENDINGS.death;
        const state = this.registry.get('state');
        if (!this.shown) {
            const epilog = this.result === 'death' || !state ? [] : EPILOG.filter((e) => (!e.ending || e.ending === this.result) && holds(state, e.if)).map((e) => ({ image: e.image, lines: [e.line] }));
            const shots = [...(ending.shots ?? []), ...epilog];
            if (shots.length) {
                this.scene.start('cutscene', { shots, onDone: (cutscene) => cutscene.scene.start('ending', { result: this.result, shown: true }) });
                return;
            }
        }
        this.cameras.main.setBackgroundColor(CRT.bg);
        const image = ending.shots?.at(-1)?.image ?? 'cs_city';
        this.add.image(WIDTH / 2, 230, image).setOrigin(0.5, 0.5).setScale(1.2);
        head(this, WIDTH / 2, 460, ending.title.toUpperCase(), { fontSize: '24px', color: CRT.amber, align: 'center', wordWrap: { width: 1000 } }).setOrigin(0.5, 0.5);
        body(this, WIDTH / 2, 500, ending.text, { fontSize: '30px', color: CRT.text, align: 'center', wordWrap: { width: 1000 }, lineSpacing: -4 }).setOrigin(0.5, 0);

        const again = button(this, WIDTH / 2, 610, 480, 52, ENDINGS.again, () => { clearSave(); this.scene.start('title'); }, { primary: true, center: true, fontSize: 32 });
        if (this.result === 'death' && load()) {
            button(this, WIDTH / 2, 672, 480, 44, ENDINGS.resume, () => { this.registry.set('state', load()); this.scene.start('world'); }, { center: true, fontSize: 26 });
        }
        scanlines(this);
        this.input.keyboard.on('keydown-ENTER', () => again.press());
    }
}
