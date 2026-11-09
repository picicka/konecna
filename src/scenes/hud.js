import Phaser from 'phaser';
import { HUD, QUEST, BAG, CARD, CREATE, DIALOGS, ITEMS, ATTRIBUTE_NAMES, ATTRIBUTE_ICONS, ATTRIBUTE_INFO, FACTIONS, tickets } from '../script';
import { journal, factions, trustLevel, itemStats } from '../story';
import { ATTRIBUTES, XP_LEVELS, attr, maxHp, equipItem, useSupply } from '../state';

const MAP_KEY = 'konecna.map';
const CARD_W = 312;
import { head, body, panel, button, scanlines, soundButton, CRT, WIDTH, HEIGHT } from '../ui';

// Lišta a dialogy nad světem ve stylu Pip-Boye, převzato z Václaváku a zobecněno. Nahoře životy, úroveň a jízdenky;
// dole dialog s portrétem, jménem a replikou, volby jako číslované řádky. Klávesy: Enter / mezerník potvrdí, 1–9 vyberou,
// šipky nahoru a dolů přepínají zvýraznění, Q otevře deník (i uprostřed rozhovoru), T tašku, M schová a ukáže mapu.
// Nedostupné volby se skrývají, ne šednou. Při rozhovoru je vpravo karta postavy (celá postava, vlastnosti, kdo to je).
export class HudScene extends Phaser.Scene {
    constructor() {
        super('hud');
    }

    create() {
        this.state = this.registry.get('state');
        panel(this, 0, 0, WIDTH, 52).setDepth(10);
        this.hpText = body(this, 24, 26, '', { fontSize: '26px', color: CRT.red }).setOrigin(0, 0.5).setDepth(11);
        this.levelText = body(this, 300, 26, '', { fontSize: '26px', color: CRT.text }).setOrigin(0, 0.5).setDepth(11);
        // vlastnosti jako obrázky s číslem (Ruka, Ústa, Oko); s výbavou zeleně
        this.attrTexts = ATTRIBUTES.map((attribute, i) => {
            const x = 866 + i * 78;
            this.add.image(x, 26, 'atlas', ATTRIBUTE_ICONS[attribute]).setScale(2).setOrigin(0, 0.5).setDepth(11);
            return body(this, x + 38, 26, '', { fontSize: '26px', color: CRT.text }).setOrigin(0, 0.5).setDepth(11);
        });
        this.ticketText = body(this, WIDTH - 24, 26, '', { fontSize: '26px', color: CRT.amber }).setOrigin(1, 0.5).setDepth(11);
        soundButton(this, 494, 26, 11, 124);
        this.questButton = button(this, 622, 26, 116, 36, HUD.quests, () => this.toggleQuests(), { fontSize: 22, center: true }).setDepth(11);
        this.mapButton = button(this, 746, 26, 116, 36, HUD.map, () => this.toggleMap(), { fontSize: 22, center: true }).setDepth(11);

        this.toastBox = this.add.container(WIDTH / 2, 100).setDepth(30).setAlpha(0);
        this.toastBack = this.add.rectangle(0, 0, 10, 10, 0x000000, 0.85).setStrokeStyle(2, CRT.lineDim);
        this.toastText = body(this, 0, 0, '', { fontSize: '26px', color: CRT.amber, align: 'center', wordWrap: { width: WIDTH - 200 } }).setOrigin(0.5, 0.5);
        this.toastBox.add([this.toastBack, this.toastText]);

        this.panel = null;
        this.quests = null;
        this.card = null;
        this.buttons = [];
        this.focus = -1;
        scanlines(this, 900);
        this.input.keyboard.addCapture(['UP', 'DOWN', 'LEFT', 'RIGHT', 'SPACE', 'ENTER']);
        this.input.keyboard.on('keydown', (event) => this.onKey(event));
        this.createPortrait();
        this.createMinimap();
        this.refresh();
        if (!this.state.flags.created) this.createHero();
    }

    // Portrét hrdinky vlevo nahoře pod lištou: obličej v rámečku Pip-Boye a jméno podle uniformy.
    createPortrait() {
        const x = 12, y = 62;
        panel(this, x, y, 132, 150).setDepth(10);
        this.add.image(x + 8, y + 8, 'atlas', 'face_hero').setOrigin(0, 0).setScale(2).setDepth(11);
        this.add.rectangle(x + 8, y + 8, 116, 116, 0x000000, 0).setOrigin(0, 0).setStrokeStyle(2, CRT.lineDim).setDepth(11);
        head(this, x + 66, y + 136, HUD.hero, { fontSize: '12px', color: CRT.amber }).setOrigin(0.5, 0.5).setDepth(11);
    }

    // Minimapa vpravo nahoře: celá mapa místa v izometrii jako hra (dlaždice 6 × 3 body), domy a landmarky tmavé,
    // horní úroveň (magistrála) světlejší, zastavení jantarové tečky, hrdinka bliká. Klepnutí pošle hrdinku na místo.
    createMinimap() {
        const world = this.scene.get('world');
        if (!world?.map) return;
        const map = world.map;
        const S = 3; // půl šířky dlaždice na minimapě
        const w = (map.len + map.wid) * S + 4, h = (map.len + map.wid) * (S / 2) + 4;
        const ox = 2, oy = map.len * (S / 2) + 2;
        const key = `minimap_${world.state.place}`;
        if (this.textures.exists(key)) this.textures.remove(key);
        const canvas = this.textures.createCanvas(key, w, h);
        const ctx = canvas.getContext();
        const COLORS = { m: '#5a4630', x: '#5a4630', z: '#3e3328', r: '#2c2a26', p: '#58544a', g: '#5a5236', f: '#7e7152', t: '#4a3a2a', n: '#4e4b45', b: '#1a1816', L: '#3b352b', w: '#24394a', h: '#3a3024', '.': '#4a4436' };
        const toMini = (a, b) => ({ x: ox + (a + b) * S, y: oy + (b - a) * (S / 2) });
        for (let a = map.len - 1; a >= 0; a--) for (let b = 0; b < map.wid; b++) {
            const c = map.ground[a][b];
            const { x, y } = toMini(a, b);
            ctx.fillStyle = COLORS[c] ?? '#3a3630';
            ctx.fillRect(x, y, S * 2, S);
            if (c === 'b') { ctx.fillStyle = '#0e0d0c'; ctx.fillRect(x, y + S / 2, S * 2, S / 2); }
        }
        // horní úroveň (vozovka magistrály, rampy) přes halu
        world.upper.forEach((height, k) => { const [a, b] = k.split(',').map(Number); const { x, y } = toMini(a, b); ctx.fillStyle = height > 100 ? '#6a6458' : '#5c574d'; ctx.fillRect(x, y, S * 2, S); });
        canvas.refresh();
        const px = WIDTH - w - 22, py = 62;
        this.minimapBox = { x: px + 8, y: py + 30, w, h, ox, oy, S };
        const parts = [panel(this, px, py, w + 16, h + 40).setDepth(10)];
        // zdroje dat mapy (OSM chce uvedení u zobrazené mapy)
        parts.push(body(this, px + w + 8, py + h + 48, HUD.mapCredit, { fontSize: '16px', color: CRT.dim }).setOrigin(1, 0).setDepth(11));
        parts.push(head(this, px + 10, py + 10, HUD.places[world.state.place] ?? world.state.place.toUpperCase(), { fontSize: '12px', color: CRT.amber }).setDepth(11));
        this.minimap = this.add.image(px + 8, py + 30, key).setOrigin(0, 0).setDepth(11).setInteractive({ useHandCursor: true });
        parts.push(this.minimap);
        this.minimap.on('pointerdown', (pointer, lx, ly, event) => {
            event?.stopPropagation();
            // zpět z minimapy na dlaždici: inverze izometrie
            const X = (lx - ox - S) / S, Y = (ly - oy - S / 2) / (S / 2); // X = a + b, Y = b − a
            const a = Math.round((X - Y) / 2), b = Math.round((X + Y) / 2);
            const wsc = this.scene.get('world');
            if (wsc.busy || this.panel || this.quests) return;
            wsc.goTo({ a, b, L: wsc.walkable(a, b, 0) ? 0 : 1 });
        });
        this.miniStops = this.add.graphics().setDepth(12);
        Object.values(world.stops ?? {}).forEach((stop) => {
            const { x, y } = toMini(stop.npc.a, stop.npc.b);
            this.miniStops.fillStyle(0xffc33d, 1).fillRect(px + 8 + x + 1, py + 30 + y - 1, 3, 3);
        });
        this.miniPlayer = this.add.graphics().setDepth(13);
        parts.push(this.miniStops, this.miniPlayer);
        this.miniParts = parts;
        this.toMini = (a, b) => { const p = toMini(a, b); return { x: px + 8 + p.x + S, y: py + 30 + p.y + S / 2 }; };
        this.mapOpen = localStorage.getItem(MAP_KEY) !== '0';
        this.showMap();
    }

    // Mapa se dá schovat (tlačítko Mapa, klávesa M); stav se pamatuje. Během rozhovoru ji zakrývá karta postavy.
    showMap() {
        const on = this.mapOpen && !this.card;
        this.miniParts?.forEach((part) => part.setVisible(on));
    }

    toggleMap() {
        this.mapOpen = !this.mapOpen;
        try { localStorage.setItem(MAP_KEY, this.mapOpen ? '1' : '0'); } catch (error) { /* soukromé okno */ }
        this.registry.get('sound')?.open();
        this.showMap();
    }

    update(time) {
        const world = this.scene.get('world');
        if (!this.miniPlayer?.visible || !world?.tile) return;
        const t = world.moving?.tile && world.moving.t > 0.5 ? world.moving.tile : world.tile;
        const { x, y } = this.toMini(t.a, t.b);
        const on = Math.floor(time / 300) % 2 === 0;
        this.miniPlayer.clear();
        this.miniPlayer.fillStyle(0x000000, 1).fillRect(x - 3, y - 3, 7, 7);
        this.miniPlayer.fillStyle(on ? 0x2ee86b : 0xd8ffe0, 1).fillRect(x - 2, y - 2, 5, 5);
    }

    refresh() {
        const max = maxHp(this.state);
        this.hpText.setText(`${HUD.hp} ${'■'.repeat(Math.max(0, this.state.hp))}${'□'.repeat(Math.max(0, max - this.state.hp))}`);
        this.levelText.setText(`${HUD.level} ${this.state.level}`);
        this.ticketText.setText(tickets(this.state.tickets));
        this.attrTexts?.forEach((t, i) => {
            const a = ATTRIBUTES[i], value = attr(this.state, a);
            t.setText(String(value)).setColor(value > this.state.attributes[a] ? CRT.accent : CRT.text);
        });
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
        const width = WIDTH - 48 - (this.card ? CARD_W + 8 : 0);
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
            const control = button(this, width / 2 + x, y + 24, width - 32, 46, item.label, () => item.onPress(index), { primary: item.primary, disabled: item.disabled, index: buttons.length > 1 ? index + 1 : null, center: buttons.length === 1, fontSize: 28, icon: item.icon, badge: item.badge });
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
    // keepDisabled: nedostupné se ukážou zašedlé (obchod: zboží, na které nejsou jízdenky).
    choose(speaker, prompt, options, face = null, { keepDisabled = false } = {}) {
        const visible = options.map((option, index) => ({ option, index })).filter(({ option }) => keepDisabled || !option.disabled);
        return new Promise((resolve) => {
            this.renderPanel({
                speaker,
                face,
                body: prompt,
                buttons: visible.map(({ option, index }) => ({ label: option.label, icon: option.icon, badge: option.badge, disabled: option.disabled, onPress: () => { this.closePanel(); resolve(index); } })),
            });
        });
    }

    // Deník: jedna obrazovka pro všechno. Vlevo velká pošťačka, kolem ní výbava ve slotech, pod ní životy, úroveň
    // a vlastnosti; vpravo záložky Taška (výbava v tašce, zásoby, věci), Úkoly a Kdo vám věří. Q otevře úkoly, T tašku,
    // šipky doleva a doprava přepínají záložky, Esc nebo stejná klávesa zavře.
    toggleQuests() { this.toggleJournal('quests'); }

    toggleBag() { this.toggleJournal('bag'); }

    toggleJournal(tab) {
        this.registry.get('sound')?.open();
        if (this.quests && (!tab || tab === this.tab)) { this.quests.destroy(); this.quests = null; return; }
        this.renderJournal(tab ?? this.tab ?? 'quests');
    }

    renderJournal(tab, message = '') {
        this.quests?.destroy();
        this.tab = tab;
        const st = this.state;
        const parts = [panel(this, 40, 64, WIDTH - 80, HEIGHT - 84)];
        const text = (x, y, value, style = {}) => { const t = body(this, x, y, value, { fontSize: '22px', lineSpacing: -4, ...style }); parts.push(t); return t; };
        const stats = itemStats;
        const rerender = (msg = '') => { this.refresh(); this.renderJournal(this.tab, msg); };

        // —— vlevo pošťačka ——
        parts.push(head(this, 64, 84, `${HUD.hero} · ${HUD.level} ${st.level}`, { color: CRT.amber, fontSize: '14px' }));
        parts.push(this.add.image(140, 450, 'atlas', 'hero_0').setOrigin(0.5, 1).setScale(5));
        parts.push(this.add.ellipse(140, 450, 120, 20, 0x000000, 0.4));
        let sy = 116;
        Object.entries(BAG.slots).forEach(([slot, label]) => {
            const key = st.equip[slot];
            parts.push(this.add.rectangle(232, sy, 220, 96, 0x000000, 0.25).setOrigin(0, 0).setStrokeStyle(2, key ? CRT.line : CRT.lineDim));
            text(242, sy + 6, label.toUpperCase(), { fontSize: '18px', color: CRT.dim });
            text(242, sy + 26, key ? ITEMS[key].name : BAG.empty, { fontSize: '22px', color: key ? CRT.bright : CRT.dim, wordWrap: { width: 200 } });
            if (key) text(242, sy + 70, stats(ITEMS[key]), { fontSize: '18px', color: CRT.accent });
            sy += 108;
        });
        let ly = 468;
        const next = XP_LEVELS[st.level];
        text(64, ly, `${HUD.hp} ${st.hp}/${maxHp(st)}${next !== undefined ? ` · ${BAG.xp(next - st.xp)}` : ''}`, { fontSize: '20px', color: CRT.red });
        ly += 30;
        ATTRIBUTES.forEach((a) => {
            const value = attr(st, a), base = st.attributes[a];
            parts.push(this.add.image(64, ly + 14, 'atlas', ATTRIBUTE_ICONS[a]).setScale(2).setOrigin(0, 0.5));
            text(104, ly, `${ATTRIBUTE_NAMES[a]} ${value}${value > base ? ` (${base} + ${value - base})` : ''}`, { fontSize: '24px', color: value > base ? CRT.accent : CRT.bright });
            text(104, ly + 24, ATTRIBUTE_INFO[a], { fontSize: '18px', color: CRT.dim, wordWrap: { width: 340 } });
            ly += 54;
        });

        // —— vpravo záložky ——
        const tabs = Object.keys(BAG.tabs);
        tabs.forEach((key, i) => {
            const b = button(this, 560 + i * 196, 96, 186, 40, BAG.tabs[key], () => this.renderJournal(key), { fontSize: 24, center: true, primary: key === tab });
            if (key === tab) b.highlight(true);
            parts.push(b);
        });
        parts.push(this.add.rectangle(468, 124, WIDTH - 80 - 452, 2, CRT.lineDim).setOrigin(0, 0));
        const col = { x: 484, w: 720, y: 136 };
        const add = (value, style = {}) => { const t = text(col.x, col.y, value, { wordWrap: { width: col.w }, ...style }); col.y += t.height + 2; return t; };
        const title = (value) => { parts.push(head(this, col.x, col.y, value.toUpperCase(), { color: CRT.amber, fontSize: '14px' })); col.y += 24; };
        const act = (label, x, y, onPress) => parts.push(button(this, x, y, 150, 36, label, onPress, { fontSize: 22, center: true }));
        if (tab === 'bag') {
            col.w = 520;
            title(BAG.things);
            const gearItems = st.items.filter((k) => ITEMS[k]?.slot);
            if (!gearItems.length) add(BAG.noThings, { color: CRT.dim });
            gearItems.forEach((key) => {
                const item = ITEMS[key], on = st.equip[item.slot] === key, y = col.y;
                add(`${item.name}${on ? ` (${BAG.worn})` : ''}`, { color: on ? CRT.bright : CRT.text });
                add(`${BAG.slots[item.slot]}: ${stats(item)}`, { fontSize: '20px', color: CRT.accent });
                act(on ? BAG.takeOff : BAG.wear, 1130, y + 22, () => { equipItem(st, key); rerender(); });
                col.y = Math.max(col.y, y + 50);
            });
            col.y += 8;
            title(BAG.supplies);
            const supplies = Object.entries(st.supplies ?? {}).filter(([, n]) => n > 0);
            if (!supplies.length) add(BAG.noSupplies, { color: CRT.dim });
            supplies.forEach(([key, n]) => {
                const y = col.y;
                add(`${ITEMS[key].name} ×${n} (${stats(ITEMS[key])})`, { color: CRT.text });
                act(BAG.use, 1130, y + 12, () => {
                    const healed = useSupply(st, key);
                    if (healed) this.registry.get('sound')?.coin();
                    rerender(healed ? HUD.healed(healed) : BAG.full);
                });
                col.y = Math.max(col.y, y + 40);
            });
            col.y += 8;
            col.w = 720;
            title(BAG.items);
            const other = st.items.filter((k) => !ITEMS[k]?.slot);
            add(other.length ? other.map((k) => ITEMS[k]?.name ?? k).join(', ') : BAG.noThings, { fontSize: '20px', color: other.length ? CRT.text : CRT.dim });
            add(tickets(st.tickets), { fontSize: '20px', color: CRT.amber });
        } else if (tab === 'quests') {
            const j = journal(st);
            title(QUEST.questsTitle);
            const open = j.quests.filter((q) => !q.done), done = j.quests.filter((q) => q.done);
            if (!j.quests.length) add(QUEST.empty, { color: CRT.dim });
            open.forEach((q) => add(`• ${q.title}: ${q.text}`));
            if (done.length) { col.y += 6; add(`${QUEST.done} ${done.map((q) => q.title).join(', ')}`, { fontSize: '20px', color: CRT.dim }); }
        } else {
            title(FACTIONS.title);
            const known = factions(st);
            add(known.length ? FACTIONS.intro : FACTIONS.unknown, { color: CRT.dim });
            known.forEach((f) => {
                col.y += 6;
                add(`${f.name}${f.level ? `: ${f.level}` : ''}`, { color: CRT.bright });
                add(`${FACTIONS.metLabel} ${f.met.join(', ')}. ${f.want}`, { fontSize: '20px', color: CRT.text });
                f.perks.forEach((p) => add(`+ ${p}`, { fontSize: '20px', color: CRT.accent }));
                if (f.next) add(`${FACTIONS.nextLabel} ${f.next}`, { fontSize: '20px', color: CRT.dim });
            });
        }
        text(484, HEIGHT - 50, message || BAG.tabHint, { fontSize: '20px', color: message ? CRT.amber : CRT.dim }).setOrigin(0, 0.5);
        parts.push(button(this, WIDTH - 160, HEIGHT - 50, 180, 40, HUD.close, () => this.toggleJournal(), { center: true, fontSize: 24 }));
        const container = this.add.container(0, 0).setDepth(40);
        container.add(parts);
        this.quests = container;
    }

    // Tvorba postavy na začátku hry: velká pošťačka a tři volby, kým byla před pádem; vybraná vlastnost +1.
    // Jde přes panel a tlačítka dialogu, takže funguje klávesami 1–3 a svět mezitím stojí.
    createHero() {
        return new Promise((resolve) => {
            this.closePanel();
            const parts = [this.add.rectangle(0, 0, WIDTH, HEIGHT, 0x050806, 0.85).setOrigin(0, 0), panel(this, 40, 40, WIDTH - 80, HEIGHT - 80)];
            parts.push(this.add.image(190, 600, 'atlas', 'hero_0').setOrigin(0.5, 1).setScale(7));
            parts.push(this.add.ellipse(190, 600, 160, 24, 0x000000, 0.45));
            parts.push(head(this, 360, 72, CREATE.title.toUpperCase(), { color: CRT.amber, fontSize: '20px' }));
            parts.push(body(this, 360, 112, CREATE.intro, { fontSize: '26px', wordWrap: { width: 840 }, lineSpacing: -4 }));
            this.buttons = ATTRIBUTES.map((a, i) => button(this, 780, 250 + i * 116, 840, 104, `${ATTRIBUTE_NAMES[a]} +1\n${CREATE.options[a]}`, () => {
                this.state.attributes[a] += 1;
                this.state.flags.created = true;
                this.closePanel();
                this.refresh();
                resolve(a);
            }, { index: i + 1, fontSize: 24, icon: ATTRIBUTE_ICONS[a] }));
            parts.push(body(this, 360, 610, CREATE.later, { fontSize: '22px', color: CRT.dim, wordWrap: { width: 840 } }));
            const container = this.add.container(0, 0).setDepth(45);
            container.add([...parts, ...this.buttons]);
            this.panel = container;
            this.focus = -1;
        });
    }

    // Karta postavy vpravo vedle rozhovoru: jméno, skupina a její důvěra, celá postava zvětšená, vlastnosti a kdo to je.
    // Jen u postav se stats (DIALOGS); obrázek je sprite zastavení ve světě, zvětšený celým násobkem, aby zůstal ostrý.
    showCard(id) {
        this.hideCard();
        const dialog = DIALOGS[id];
        const stop = this.scene.get('world')?.stops?.[id];
        if (!dialog?.stats || !stop?.sprite) return;
        const x = WIDTH - 24 - CARD_W, y = 62, h = HEIGHT - 16 - y;
        const c = this.add.container(0, 0).setDepth(19);
        c.add(panel(this, x, y, CARD_W, h));
        let ty = y + 16;
        const name = head(this, x + 16, ty, dialog.name.toUpperCase(), { color: CRT.amber, fontSize: '14px', wordWrap: { width: CARD_W - 32 } });
        c.add(name); ty += name.height + 8;
        const faction = dialog.faction && FACTIONS.list[dialog.faction];
        if (faction) {
            const level = faction.perks ? ` · ${trustLevel(this.state.trust[dialog.faction] ?? 0)}` : '';
            const t = body(this, x + 16, ty, `${faction.name}${level}`, { fontSize: '22px', color: CRT.text, wordWrap: { width: CARD_W - 32 } });
            c.add(t); ty += t.height + 4;
        }
        // spodek karty: vlastnosti a popis; postava vyplní, co zbude
        const about = body(this, x + 16, 0, dialog.about ?? '', { fontSize: '20px', color: CRT.dim, wordWrap: { width: CARD_W - 32 }, lineSpacing: -4 });
        const aboutY = y + h - 16 - about.height;
        about.setY(aboutY);
        // vlastnosti postavy proti vašim: k čemu jsou a jak by dopadla zkouška
        const hint = body(this, x + 16, 0, CARD.hint, { fontSize: '18px', color: CRT.dim, wordWrap: { width: CARD_W - 32 }, lineSpacing: -4 });
        const statsY = aboutY - 12 - hint.height - 4 - 3 * 50;
        hint.setY(statsY);
        c.add(hint);
        ATTRIBUTES.forEach((a, i) => {
            const ry = statsY + hint.height + 4 + i * 50;
            const theirs = dialog.stats[a], mine = attr(this.state, a), diff = mine - theirs;
            c.add(this.add.image(x + 16, ry + 16, 'atlas', ATTRIBUTE_ICONS[a]).setScale(2).setOrigin(0, 0.5));
            c.add(body(this, x + 54, ry, String(theirs), { fontSize: '28px', color: CRT.bright }));
            c.add(body(this, x + 80, ry + 3, `${CARD.you} ${mine} · ${CARD.odds(diff)}`, { fontSize: '22px', color: diff >= 1 ? CRT.accent : diff >= -1 ? CRT.amber : CRT.red }));
            c.add(body(this, x + 54, ry + 27, CARD.use[a], { fontSize: '18px', color: CRT.dim }));
        });
        c.add(about);
        const frame = stop.sprite.frame;
        const room = { w: CARD_W - 32, h: statsY - 16 - ty };
        const scale = Math.max(1, Math.min(5, Math.floor(Math.min(room.w / frame.width, room.h / frame.height))));
        c.add(this.add.rectangle(x + 16, statsY - 8, room.w, 2, CRT.lineDim).setOrigin(0, 0));
        c.add(this.add.image(x + CARD_W / 2, statsY - 12, frame.texture.key, frame.name).setOrigin(0.5, 1).setScale(scale));
        this.card = c;
        this.showMap();
    }

    hideCard() {
        this.card?.destroy();
        this.card = null;
        this.showMap();
    }

    onKey(event) {
        const key = event.key.toLowerCase();
        if (key === 'm') { this.toggleMap(); return; }
        if (key === 't' || key === 'i') { this.toggleBag(); return; }
        if (key === 'q') { this.toggleQuests(); return; }
        if (this.quests) {
            if (event.key === 'Escape') this.toggleJournal();
            const tabs = Object.keys(BAG.tabs), step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
            if (step) this.renderJournal(tabs[(tabs.indexOf(this.tab) + step + tabs.length) % tabs.length]);
            return;
        }
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
