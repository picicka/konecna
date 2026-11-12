import Phaser from 'phaser';
import { DEBUG } from '../debug';
import { BATTLES, BATTLE, ITEMS, ATTRIBUTE_ICONS } from '../script';
import { head, body, panel, button, scanlines, CRT, WIDTH, HEIGHT } from '../ui';
import { attr, maxHp, weaponOf, useSupply } from '../state';

// Tahový boj nad světem (svět stojí, dokud boj neskončí). Deterministický: náhoda ze semínka hry, klíče boje a čísla tahu,
// takže stejné rozhodnutí dá stejný výsledek a Playwright jím projde. Každá vlastnost má svou akci:
// - Ruka, Udeřit: zásah s pravděpodobností 0,65 + 0,05 × Oko (+ 0,1 se štěstím od Nepomuckého, − 0,15 proti uhýbavým),
//   zranění Ruka + zbraň až o 1 víc; bere životy;
// - Ústa, Zařvat / Domluvit: bere vůli, Ústa až o 1 víc, vždy;
// - Oko, Uhnout: na útoky v tomto tahu uhnete s pravděpodobností 0,35 + 0,1 × Oko a každý uhnutý vrátíte úderem;
// - Taška: obvaz nebo jídlo místo úderu (nejmenší zásoba, která doplní chybějící životy), nepřítel útočí;
// - Utéct: vždy, ale nepřítel ještě jednou zaútočí.
// Vlastnosti a životy jsou i s výbavou (src/state.js attr, maxHp), zbraň přidává k úderu.
// Nepřítel zasahuje s pravděpodobností 0,7 − 0,04 × Oko, zranění podle BATTLES; twice útočí dvakrát, dodge uhýbá úderům.
// Komu dojdou životy, nebo vůle, prohrál. Výsledek přes onDone: 'win', 'flee' nebo 'dead'; životy hrdinky jsou ve stavu hry.
const mulberry = (seed) => () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const hashKey = (s) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);
const pct = (p) => Math.round(Math.max(0.05, Math.min(0.95, p)) * 100);

export class BattleScene extends Phaser.Scene {
    constructor() {
        super('battle');
    }

    init(data) {
        this.key = data.enemy;
        this.def = BATTLES[data.enemy];
        this.onDone = data.onDone;
        this.state = this.registry.get('state');
        this.enemyHp = this.def.hp;
        this.enemyNerve = this.def.nerve ?? 99;
        this.turn = 0;
        this.over = false;
        this.log = [];
    }

    // Čísla pro tlačítka i pro tah, na jednom místě.
    odds() {
        const a = { ruka: attr(this.state, 'ruka'), usta: attr(this.state, 'usta'), oko: attr(this.state, 'oko') };
        const weapon = weaponOf(this.state);
        return {
            hit: 0.65 + 0.05 * a.oko + (this.state.flags.stesti ? 0.1 : 0) - (this.def.special === 'dodge' ? 0.15 : 0),
            dmg: [a.ruka + weapon, a.ruka + weapon + 1],
            talk: [a.usta, a.usta + 1],
            dodge: 0.35 + 0.1 * a.oko,
            foe: 0.7 - 0.04 * a.oko,
        };
    }

    create() {
        const sound = this.registry.get('sound');
        this.add.rectangle(0, 0, WIDTH, HEIGHT, 0x050806, 0.94).setOrigin(0, 0);
        panel(this, 40, 40, WIDTH - 80, 380);
        head(this, 64, 60, this.def.name.toUpperCase(), { color: CRT.amber });
        body(this, 64, 92, BATTLE.help, { fontSize: '24px', color: CRT.dim, wordWrap: { width: WIDTH - 140 } });
        // nepřítel vpravo, hrdinka vlevo, obojí zvětšené (pixel art bez vyhlazení)
        const frames = this.textures.get('atlas').getFrameNames().filter((n) => n.startsWith(`${this.def.sprite}_`));
        const enemyFrame = frames.length ? frames.sort()[0] : this.def.sprite;
        this.enemy = this.add.image(WIDTH - 340, 320, 'atlas', enemyFrame).setOrigin(0.5, 1).setScale(this.def.scale ?? 3);
        this.hero = this.add.image(320, 330, 'atlas', 'hero_0').setOrigin(0.5, 1).setScale(4);
        this.heroHp = body(this, 160, 340, '', { fontSize: '28px', color: CRT.text });
        this.foeHp = body(this, WIDTH - 520, 340, '', { fontSize: '28px', color: CRT.text });
        this.foeNerve = body(this, WIDTH - 520, 372, '', { fontSize: '28px', color: CRT.amber });
        panel(this, 40, 430, WIDTH - 80, 120);
        this.logText = body(this, 64, 440, '', { fontSize: '28px', color: CRT.bright, wordWrap: { width: WIDTH - 140 }, lineSpacing: -4 });
        const o = this.odds();
        const w = 232, y = 630;
        const xs = [0, 1, 2, 3, 4].map((i) => 40 + w / 2 + i * (w + 4));
        this.buttons = [
            button(this, xs[0], y, w, 100, `${BATTLE.attack}\n${BATTLE.attackHint(pct(o.hit), o.dmg[0], o.dmg[1])}`, () => this.act('attack'), { index: 1, primary: true, fontSize: 22, icon: ATTRIBUTE_ICONS.ruka }),
            button(this, xs[1], y, w, 100, `${this.def.talk ?? 'Zařvat'}\n${BATTLE.talkHint(o.talk[0], o.talk[1])}`, () => this.act('talk'), { index: 2, fontSize: 22, icon: ATTRIBUTE_ICONS.usta }),
            button(this, xs[2], y, w, 100, `${BATTLE.defend}\n${BATTLE.defendHint(pct(o.dodge))}`, () => this.act('defend'), { index: 3, fontSize: 22, icon: ATTRIBUTE_ICONS.oko }),
            button(this, xs[3], y, w, 100, '', () => this.act('bag'), { index: 4, fontSize: 22 }),
            button(this, xs[4], y, w, 100, `${BATTLE.flee}\n${BATTLE.fleeHint}`, () => this.act('flee'), { index: 5, fontSize: 22 }),
        ];
        this.input.keyboard.on('keydown', (e) => { if (/^[1-5]$/.test(e.key)) this.buttons[Number(e.key) - 1].press(); });
        scanlines(this);
        this.say(this.def.intro);
        this.refresh();
        sound?.open();
    }

    // Zásoba pro tlačítko Taška: nejmenší, která doplní chybějící životy, jinak největší.
    supply() {
        const missing = maxHp(this.state) - this.state.hp;
        const have = Object.entries(this.state.supplies ?? {}).filter(([k, n]) => n > 0 && ITEMS[k]?.use?.heal).map(([k]) => k)
            .sort((p, q) => ITEMS[p].use.heal - ITEMS[q].use.heal);
        return have.find((k) => ITEMS[k].use.heal >= missing) ?? have.at(-1) ?? null;
    }

    refresh() {
        const pick = this.supply();
        this.buttons[3].caption.setText(`4. ${BATTLE.bag}\n${pick ? BATTLE.bagHint(ITEMS[pick].name, this.state.supplies[pick], ITEMS[pick].use.heal) : BATTLE.bagEmpty}`);
        const bar = (n, max, full = '■', empty = '□') => `${full.repeat(Math.max(0, n))}${empty.repeat(Math.max(0, max - n))}`;
        this.heroHp.setText(`${BATTLE.hp} ${bar(this.state.hp, maxHp(this.state))} ${this.state.hp}/${maxHp(this.state)}`);
        this.foeHp.setText(`${BATTLE.hp} ${bar(this.enemyHp, this.def.hp)} ${this.enemyHp}/${this.def.hp}`);
        this.foeNerve.setText(this.def.nerve ? `${BATTLE.nerve} ${bar(this.enemyNerve, this.def.nerve, '◆', '◇')} ${this.enemyNerve}/${this.def.nerve}` : '');
    }

    say(...lines) {
        this.log = [...this.log, ...lines].slice(-3);
        this.logText.setText(this.log.join('\n'));
    }

    shake(target) {
        this.tweens.add({ targets: target, x: target.x + 10, duration: 50, yoyo: true, repeat: 2 });
    }

    // Jeden tah: akce hrdinky, pak útok nepřítele (pokud boj trvá). Náhoda jde z jednoho proudu na tah.
    act(action) {
        if (this.over) return;
        this.turn += 1;
        const rand = mulberry((this.state.seed ?? 1) ^ hashKey(this.key) ^ Math.imul(this.turn, 2654435761));
        const o = this.odds();
        const roll = ([lo, hi]) => lo + Math.floor(rand() * (hi - lo + 1));
        const sound = this.registry.get('sound');
        const strike = (prefix) => {
            const dmg = Math.max(1, roll(o.dmg));
            this.enemyHp = Math.max(0, this.enemyHp - dmg);
            this.say(`${prefix} ${dmg}. ${this.def.hurt}`);
            this.shake(this.enemy);
            sound?.click();
        };
        let dodging = false;
        let free = false;
        if (action === 'attack') {
            if (this.def.special === 'dodge' && rand() < 0.25) this.say(this.def.dodge);
            else if (rand() < o.hit) strike(BATTLE.hit);
            else this.say(BATTLE.miss);
        } else if (action === 'talk') {
            const n = roll(o.talk);
            this.enemyNerve = Math.max(0, this.enemyNerve - n);
            this.say(`${this.def.shout} ${BATTLE.shout} −${n}.`);
            this.shake(this.enemy);
        } else if (action === 'defend') {
            dodging = true;
            this.say(BATTLE.guard);
        } else if (action === 'bag') {
            const pick = this.supply();
            const healed = pick ? useSupply(this.state, pick) : null;
            if (!healed) { this.turn -= 1; sound?.wrong(); return; }
            this.say(BATTLE.bagUsed(ITEMS[pick].name, healed));
            sound?.coin();
        } else if (action === 'flee') {
            free = true;
            this.say(BATTLE.fleeing);
        }
        this.refresh();
        if (this.enemyHp <= 0) { this.say(this.def.win); return this.finish('win'); }
        if (this.enemyNerve <= 0) { this.say(this.def.yield); return this.finish('win'); }
        // útok nepřítele (twice = dvakrát za tah); při útěku jen jeden a bez uhýbání
        const attacks = free ? 1 : this.def.special === 'twice' ? 2 : 1;
        for (let i = 0; i < attacks; i++) {
            if (dodging && rand() < o.dodge) {
                if (this.enemyHp > 0) strike(BATTLE.counter); else this.say(BATTLE.dodged);
                continue;
            }
            if (rand() < o.foe) {
                const dmg = roll(this.def.attack);
                this.state.hp = Math.max(DEBUG.god ? 1 : 0, this.state.hp - dmg);
                this.say(i === 1 ? `${this.def.twice} −${dmg}` : `${this.def.hit} −${dmg}`);
                this.shake(this.hero);
                sound?.wrong();
            } else if (i === 0) this.say(this.def.miss);
            if (this.state.hp <= 0) break;
        }
        this.refresh();
        if (this.state.hp <= 0) { this.say(BATTLE.dead); return this.finish('dead'); }
        if (this.enemyHp <= 0) { this.say(this.def.win); return this.finish('win'); }
        if (free) { this.say(this.def.flee); return this.finish('flee'); }
    }

    finish(result) {
        this.over = true;
        this.buttons.forEach((b) => { b.disabled = true; });
        this.time.delayedCall(1400, () => {
            this.scene.stop();
            this.onDone?.(result);
        });
    }
}
