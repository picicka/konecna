import Phaser from 'phaser';
import { HUD, QUEST, ATTRIBUTE_NAMES, tickets } from '../script';
import { ATTRIBUTES } from '../state';
import { head, body, panel, button, scanlines, soundButton, CRT, WIDTH, HEIGHT } from '../ui';

// Lišta a dialogy nad světem ve stylu Pip-Boye, převzato z Václaváku a zobecněno. Nahoře životy, úroveň a jízdenky;
// dole dialog s portrétem, jménem a replikou, volby jako číslované řádky. Klávesy: Enter / mezerník potvrdí, 1–9 vyberou,
// šipky nahoru a dolů přepínají zvýraznění, Q otevře deník (i uprostřed rozhovoru). Nedostupné volby se skrývají, ne šednou.
export class HudScene extends Phaser.Scene {
    constructor() {
        super('hud');
    }

    create() {
        this.state = this.registry.get('state');
        panel(this, 0, 0, WIDTH, 52).setDepth(10);
        this.hpText = body(this, 24, 26, '', { fontSize: '26px', color: CRT.red }).setOrigin(0, 0.5).setDepth(11);
        this.levelText = body(this, 300, 26, '', { fontSize: '26px', color: CRT.text }).setOrigin(0, 0.5).setDepth(11);
        this.ticketText = body(this, WIDTH - 24, 26, '', { fontSize: '26px', color: CRT.amber }).setOrigin(1, 0.5).setDepth(11);
        this.questButton = button(this, WIDTH / 2 + 120, 26, 140, 36, HUD.quests, () => this.toggleQuests(), { fontSize: 22, center: true }).setDepth(11);
        soundButton(this, WIDTH / 2 - 60, 26, 11);

        this.toastBox = this.add.container(WIDTH / 2, 100).setDepth(30).setAlpha(0);
        this.toastBack = this.add.rectangle(0, 0, 10, 10, 0x000000, 0.85).setStrokeStyle(2, CRT.lineDim);
        this.toastText = body(this, 0, 0, '', { fontSize: '26px', color: CRT.amber, align: 'center', wordWrap: { width: WIDTH - 200 } }).setOrigin(0.5, 0.5);
        this.toastBox.add([this.toastBack, this.toastText]);

        this.panel = null;
        this.quests = null;
        this.buttons = [];
        this.focus = -1;
        scanlines(this, 900);
        this.input.keyboard.addCapture(['UP', 'DOWN', 'LEFT', 'RIGHT', 'SPACE', 'ENTER']);
        this.input.keyboard.on('keydown', (event) => this.onKey(event));
        this.refresh();
    }

    refresh() {
        this.hpText.setText(`${HUD.hp} ${'■'.repeat(Math.max(0, this.state.hp))}${'□'.repeat(Math.max(0, this.state.hpMax - this.state.hp))}`);
        this.levelText.setText(`${HUD.level} ${this.state.level}`);
        this.ticketText.setText(tickets(this.state.tickets));
    }

    // Změna jízdenek: plovoucí „+6 jízdenek“ u počítadla (zelené) nebo „−3 jízdenky“ (červené).
    flashTickets(delta) {
        if (!delta) return;
        const text = body(this, WIDTH - 24, 56, `${delta > 0 ? '+' : '−'}${tickets(Math.abs(delta))}`, { fontSize: '26px', color: delta > 0 ? CRT.accent : CRT.red }).setOrigin(1, 0).setDepth(35);
        this.tweens.add({ targets: text, y: 100, alpha: 0, duration: 1600, ease: 'Quad.easeOut', onComplete: () => text.destroy() });
        const sound = this.registry.get('sound');
        if (delta > 0) sound?.coin(); else sound?.drop();
    }

    toast(message) {
        this.registry.get('sound')?.open();
        this.toastText.setText(message);
        this.toastBack.setSize(this.toastText.width + 40, this.toastText.height + 20);
        this.toastTween?.stop();
        this.toastBox.setAlpha(0);
        this.toastTween = this.tweens.add({ targets: this.toastBox, alpha: 1, duration: 150, hold: 2600, yoyo: true });
    }

    // Dialog: portrét vlevo, jméno a replika vpravo, pod tím tlačítka. Předchozí panel se zahodí.
    renderPanel({ speaker, face, body: text, buttons }) {
        this.closePanel();
        const x = 24;
        const width = WIDTH - 48;
        const container = this.add.container(0, 0).setDepth(20);
        const parts = [];
        const textX = face ? 160 : 28;
        let y = 20;
        if (speaker) {
            parts.push(head(this, textX, y, speaker.toUpperCase(), { color: CRT.amber, wordWrap: { width: width - textX } }));
            y += 28;
        }
        const bodyText = body(this, textX, y, text, { fontSize: '30px', wordWrap: { width: width - textX - 16 }, lineSpacing: -4 });
        parts.push(bodyText);
        if (face) {
            parts.push(this.add.image(28, 20, 'atlas', face).setOrigin(0, 0).setScale(2));
            parts.push(this.add.rectangle(28, 20, 112, 112, 0x000000, 0).setOrigin(0, 0).setStrokeStyle(2, CRT.lineDim));
        }
        y = Math.max(y + bodyText.height, face ? 140 : 0) + 14;
        this.buttons = buttons.map((item, index) => {
            const control = button(this, width / 2 + x, y + 24, width - 32, 46, item.label, () => item.onPress(index), { primary: item.primary, disabled: item.disabled, index: buttons.length > 1 ? index + 1 : null, center: buttons.length === 1, fontSize: 28 });
            y += 52;
            return control;
        });
        const height = y + 10;
        const back = panel(this, x, 0, width, height);
        container.add([back, ...parts, ...this.buttons]);
        container.setY(HEIGHT - 16 - height);
        this.panel = container;
        this.focus = -1;
    }

    closePanel() {
        this.panel?.destroy();
        this.panel = null;
        this.buttons = [];
    }

    say(speaker, lines, face = null) {
        return [].concat(lines).reduce((chain, line) => chain.then(() => new Promise((resolve) => {
            this.renderPanel({ speaker, face, body: line, buttons: [{ label: HUD.next, primary: true, onPress: () => { this.closePanel(); resolve(); } }] });
        })), Promise.resolve());
    }

    // Nedostupné volby (podmínka na stav nebo atribut) se nezobrazí vůbec; volajícímu se vrací index v původním poli.
    choose(speaker, prompt, options, face = null) {
        const visible = options.map((option, index) => ({ option, index })).filter(({ option }) => !option.disabled);
        return new Promise((resolve) => {
            this.renderPanel({
                speaker,
                face,
                body: prompt,
                buttons: visible.map(({ option, index }) => ({ label: option.label, onPress: () => { this.closePanel(); resolve(index); } })),
            });
        });
    }

    // Deník: hrdinka (atributy), úkoly a věci v tašce. Otevře ho tlačítko nebo Q, zavře klepnutí nebo Q.
    toggleQuests() {
        this.registry.get('sound')?.open();
        if (this.quests) { this.quests.destroy(); this.quests = null; return; }
        const container = this.add.container(0, 0).setDepth(40);
        const back = panel(this, 40, 70, WIDTH - 80, HEIGHT - 110);
        const lines = [];
        let y = 90;
        const add = (text, style = {}) => { const t = body(this, 64, y, text, { fontSize: '26px', wordWrap: { width: WIDTH - 160 }, lineSpacing: -4, ...style }); lines.push(t); y += t.height + 4; };
        const title = (text) => { lines.push(head(this, 64, y, text.toUpperCase(), { color: CRT.amber })); y += 32; };
        title(QUEST.hero);
        add(ATTRIBUTES.map((attribute) => `${ATTRIBUTE_NAMES[attribute]} ${this.state.attributes[attribute]}`).join('   ') + `   ${HUD.level} ${this.state.level}`);
        y += 12;
        title(QUEST.questsTitle);
        const quests = Object.entries(this.state.quests);
        if (quests.length) quests.forEach(([quest, step]) => add(`${step === 'done' ? '[OK]' : '[  ]'} ${quest}: ${step}`, { color: step === 'done' ? CRT.accent : CRT.text }));
        else add(QUEST.empty, { color: CRT.dim });
        y += 12;
        title(QUEST.itemsTitle);
        add(this.state.items.length ? this.state.items.map((item) => `• ${item}`).join('\n') : QUEST.noItems, { color: this.state.items.length ? CRT.text : CRT.dim });
        const close = button(this, WIDTH / 2, HEIGHT - 70, 240, 44, HUD.close, () => this.toggleQuests(), { center: true, fontSize: 26 });
        container.add([back, ...lines, close]);
        this.quests = container;
    }

    onKey(event) {
        if (event.key === 'q' || event.key === 'Q' || (event.key === 'Escape' && this.quests)) { this.toggleQuests(); return; }
        if (this.quests) return;
        if (!this.panel || !this.buttons.length) return;
        const enabled = (index) => this.buttons[index] && !this.buttons[index].disabled;
        if (event.key === 'Enter' || event.key === ' ') {
            if (this.focus >= 0) this.buttons[this.focus].press();
            else if (this.buttons.length === 1) this.buttons[0].press();
            return;
        }
        if (/^[1-9]$/.test(event.key)) {
            const index = Number(event.key) - 1;
            if (enabled(index)) this.buttons[index].press();
            return;
        }
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            const step = event.key === 'ArrowDown' ? 1 : -1;
            this.setFocus((this.focus + step + this.buttons.length) % this.buttons.length);
        }
    }

    setFocus(index) {
        this.focus = index;
        this.buttons.forEach((control, i) => control.highlight(i === index));
    }
}
