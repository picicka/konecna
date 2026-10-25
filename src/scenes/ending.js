import Phaser from 'phaser';
import { ENDINGS } from '../script';
import { load, clearSave } from '../state';
import { head, body, button, scanlines, CRT, WIDTH, HEIGHT } from '../ui';

// Závěr: obrázek, název konce a text; „Hrát znovu“ začne od titulku. Po smrti navíc „Zpátky na poslední místo“
// (checkpoint z localStorage), protože smrt je konec s epilogem, ne game over bez pokračování.
export class EndingScene extends Phaser.Scene {
    constructor() {
        super('ending');
    }

    init(data) {
        this.result = data.result ?? 'death';
    }

    create() {
        const ending = ENDINGS[this.result] ?? ENDINGS.death;
        this.cameras.main.setBackgroundColor(CRT.bg);
        this.add.image(WIDTH / 2, 230, 'cs_city').setOrigin(0.5, 0.5).setScale(1.2);
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
