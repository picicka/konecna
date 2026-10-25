import Phaser from 'phaser';
import { CUTSCENES, HUD } from '../script';
import { body, panel, button, scanlines, CRT, WIDTH, HEIGHT } from '../ui';

// Filmeček ve stylu diapozitivů Falloutu: pixelový obrázek 640 × 360 zvětšený 2× s pomalým nájezdem a titulky psané
// po písmenech. Klepnutí, Enter nebo mezerník dopíšou řádek, další klepnutí ho přepne; tlačítko vpravo nahoře přeskočí.
// Snímek může mít flash (záblesk), shake (otřes) a toll (zvon); efekty specifické pro Václavák (hvězda, meteorit) nebrat.
const IMAGE_Y = 250;

export class CutsceneScene extends Phaser.Scene {
    constructor() {
        super('cutscene');
    }

    init(data) {
        this.shots = CUTSCENES[data.key] ?? [];
        this.onDone = data.onDone;
        this.shotIndex = 0;
        this.lineIndex = 0;
        this.finished = false;
    }

    create() {
        this.cameras.main.setBackgroundColor(CRT.bg);
        this.image = this.add.image(WIDTH / 2, IMAGE_Y, this.shots[0]?.image ?? 'cs_city').setOrigin(0.5, 0.5).setScale(2);
        panel(this, 40, 520, WIDTH - 80, 170).setDepth(2);
        this.caption = body(this, 64, 540, '', { fontSize: '32px', color: CRT.bright, wordWrap: { width: WIDTH - 128 }, lineSpacing: -2 }).setDepth(3);
        this.hint = body(this, WIDTH - 64, 676, `${HUD.next} ▸`, { fontSize: '24px', color: CRT.dim }).setOrigin(1, 1).setDepth(3);
        this.tweens.add({ targets: this.hint, alpha: 0.2, duration: 600, yoyo: true, repeat: -1 });
        button(this, WIDTH - 110, 36, 180, 40, HUD.skip, () => this.finish(), { fontSize: 24, center: true }).setDepth(5);
        scanlines(this);

        this.readyAt = this.time.now + 300;
        this.input.on('pointerdown', () => this.advance());
        this.input.keyboard.on('keydown-ENTER', () => this.advance());
        this.input.keyboard.on('keydown-SPACE', () => this.advance());
        if (this.shots.length) this.showShot(); else this.finish();
    }

    showShot() {
        const shot = this.shots[this.shotIndex];
        this.image.setTexture(shot.image).setScale(2).setAlpha(0);
        this.tweens.add({ targets: this.image, alpha: 1, duration: 400 });
        this.tweens.add({ targets: this.image, scaleX: 2.16, scaleY: 2.16, duration: 9000, ease: 'Sine.easeOut' });
        const sound = this.registry.get('sound');
        if (shot.flash) this.time.delayedCall(300, () => { this.cameras.main.flash(300, 255, 220, 160); sound.boom(); });
        if (shot.toll) this.time.delayedCall(200, () => sound.toll());
        if (shot.shake) this.time.delayedCall(350, () => this.cameras.main.shake(400, 0.01));
        this.lineIndex = 0;
        this.showLine();
    }

    // Psaní po písmenech; další klepnutí před dopsáním řádek dokončí.
    showLine() {
        const line = this.shots[this.shotIndex].lines[this.lineIndex];
        this.typing?.remove();
        this.caption.setText('');
        let shown = 0;
        const sound = this.registry.get('sound');
        this.typing = this.time.addEvent({ delay: 28, repeat: line.length - 1, callback: () => { shown++; this.caption.setText(line.slice(0, shown)); if (!/\s/.test(line[shown - 1])) sound.tick(); } });
        this.fullLine = line;
    }

    advance() {
        if (this.finished || this.time.now < this.readyAt) return;
        if (this.typing && this.typing.getOverallProgress() < 1) {
            this.typing.remove();
            this.caption.setText(this.fullLine);
            return;
        }
        const shot = this.shots[this.shotIndex];
        if (this.lineIndex < shot.lines.length - 1) {
            this.lineIndex++;
            this.showLine();
        } else if (this.shotIndex < this.shots.length - 1) {
            this.shotIndex++;
            this.showShot();
        } else {
            this.finish();
        }
    }

    finish() {
        if (this.finished) return;
        this.finished = true;
        this.onDone?.(this);
    }
}
