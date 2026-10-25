import Phaser from 'phaser';
import { TITLE } from '../script';
import { head, body, button, scanlines, soundButton, CRT, WIDTH, HEIGHT } from '../ui';
import { createState, load, clearSave } from '../state';

// Titulní obrazovka: tmavá Praha z úvodního filmečku, nad ní nápis KONEČNÁ jako cedule na nástupišti a podtitul.
// Start spustí úvodní filmeček a pak svět; když je uložená pozice, nabídne i pokračování z posledního místa.
const BUTTON_DELAY = 1200;

export class TitleScene extends Phaser.Scene {
    constructor() {
        super('title');
    }

    create() {
        this.cameras.main.setBackgroundColor(CRT.bg);
        this.add.image(WIDTH / 2, HEIGHT / 2, 'cs_city').setScale(2).setAlpha(0.45);
        // Cedule: tmavý obdélník s rámečkem jako tabule s názvem stanice, bílý text, červený pruh metra pod ním.
        this.add.rectangle(WIDTH / 2, 240, 760, 150, 0x0a0c12, 0.92).setStrokeStyle(4, 0x3a3f4a);
        head(this, WIDTH / 2, 222, TITLE.name, { fontSize: '64px', color: '#ece9df' }).setOrigin(0.5, 0.5);
        this.add.rectangle(WIDTH / 2, 282, 700, 6, 0xb3261e);
        body(this, WIDTH / 2, 330, TITLE.subtitle, { fontSize: '40px', color: CRT.amber }).setOrigin(0.5, 0.5);
        scanlines(this);
        const sound = this.registry.get('sound');
        const hum = () => { if (this.scene.isActive()) sound.neon(true); };
        hum();
        this.game.events.on('sound-unlocked', hum);
        this.events.once('shutdown', () => { this.game.events.off('sound-unlocked', hum); sound.neon(false); });
        soundButton(this, WIDTH - 100, 36);

        this.ready = false;
        this.time.delayedCall(BUTTON_DELAY, () => {
            const saved = load();
            const start = button(this, WIDTH / 2, 470, 480, 52, TITLE.start, () => this.start(), { primary: true, center: true, fontSize: 32 }).setAlpha(0);
            const controls = [start];
            if (saved) controls.push(button(this, WIDTH / 2, 536, 480, 44, TITLE.resume, () => this.resume(saved), { center: true, fontSize: 26 }).setAlpha(0));
            const cursor = body(this, WIDTH / 2 - 256, 470, '>', { fontSize: '32px', color: CRT.accent }).setOrigin(0.5, 0.5).setAlpha(0);
            body(this, WIDTH / 2, 640, TITLE.hint, { fontSize: '24px', color: CRT.dim, align: 'center', wordWrap: { width: 900 } }).setOrigin(0.5, 0.5);
            this.tweens.add({ targets: [...controls, cursor], alpha: 1, duration: 600 });
            this.tweens.add({ targets: cursor, alpha: 0, duration: 500, yoyo: true, repeat: -1, delay: 600 });
            this.ready = true;
            this.input.keyboard.on('keydown-ENTER', () => start.press());
            this.input.keyboard.on('keydown-SPACE', () => start.press());
        });
    }

    start() {
        if (!this.ready) return;
        clearSave();
        this.registry.set('state', createState());
        this.scene.start('cutscene', { key: 'intro', onDone: (cutscene) => cutscene.scene.start('world') });
    }

    resume(saved) {
        if (!this.ready) return;
        this.registry.set('state', saved);
        this.scene.start('world');
    }
}
