import Phaser from 'phaser';
import { DEBUG } from '../debug';
import { BATTLES, BATTLE, ITEMS, ATTRIBUTE_ICONS } from '../script';
import { head, body, panel, button, scanlines, CRT, WIDTH, HEIGHT } from '../ui';
import { maxHp, difficultyOf } from '../state';
import { newFight, odds, step, supplyFor } from '../boj';

// Tahový boj nad světem (svět stojí, dokud boj neskončí). Pravidla jsou v src/boj.js (stejná počítá simulátor
// npm run boje); tady je jen obrazovka: vlastnosti nepřítele, co v tomto tahu chystá, tlačítka se šancemi a z událostí
// tahu text, otřes a zvuk. Výsledek přes onDone: 'win', 'flee' nebo 'dead'; životy hrdinky jsou ve stavu hry.
const pct = (p) => Math.round(p * 100);

export class BattleScene extends Phaser.Scene {
    constructor() {
        super('battle');
    }

    init(data) {
        this.key = data.enemy;
        this.def = BATTLES[data.enemy];
        this.onDone = data.onDone;
        this.state = this.registry.get('state');
        this.fight = newFight(this.state, data.enemy, { god: DEBUG.god });
        this.over = false;
        this.log = [];
    }

    create() {
        const sound = this.registry.get('sound');
        // souboj má vlastní hudbu; po něm se vrátí hudba místa
        sound?.music('battle');
        this.events.once('shutdown', () => sound?.musicBack());
        this.add.rectangle(0, 0, WIDTH, HEIGHT, 0x050806, 0.94).setOrigin(0, 0);
        panel(this, 40, 40, WIDTH - 80, 380);
        head(this, 64, 60, this.def.name.toUpperCase(), { color: CRT.amber });
        body(this, 64, 92, BATTLE.help, { fontSize: '24px', color: CRT.dim, wordWrap: { width: WIDTH - 140 } });
        // nepřítel vpravo, hrdinka vlevo, obojí zvětšené (pixel art bez vyhlazení)
        const frames = this.textures.get('atlas').getFrameNames().filter((n) => n.startsWith(`${this.def.sprite}_`));
        const enemyFrame = frames.length ? frames.sort()[0] : this.def.sprite;
        // druhý nepřítel dvojice (BATTLES.sprite2: menší vymahač) stojí o kus vedle a za prvním
        if (this.def.sprite2) this.add.image(WIDTH - 232, 314, 'atlas', `${this.def.sprite2}_0`).setOrigin(0.5, 1).setScale(this.def.scale ?? 3);
        this.enemy = this.add.image(WIDTH - 340, 320, 'atlas', enemyFrame).setOrigin(0.5, 1).setScale(this.def.scale ?? 3);
        this.hero = this.add.image(320, 330, 'atlas', 'hero_0').setOrigin(0.5, 1).setScale(4);
        this.add.image(160, 356, 'atlas', 'ico_heart').setScale(2).setOrigin(0, 0.5);
        this.add.image(WIDTH - 520, 356, 'atlas', 'ico_heart').setScale(2).setOrigin(0, 0.5);
        this.heroHp = body(this, 200, 340, '', { fontSize: '28px', color: CRT.text });
        this.foeHp = body(this, WIDTH - 480, 340, '', { fontSize: '28px', color: CRT.text });
        this.foeNerve = body(this, WIDTH - 520, 372, '', { fontSize: '28px', color: CRT.amber });
        panel(this, 40, 430, WIDTH - 80, 120);
        this.logText = body(this, 64, 440, '', { fontSize: '28px', color: CRT.bright, wordWrap: { width: WIDTH - 140 }, lineSpacing: -4 });
        // jak to nepříteli jde: jeho Ruka, Ústa a Oko vpravo nahoře, stejné ikony jako u hrdinky
        ['ruka', 'usta', 'oko'].forEach((k, i) => {
            const x = WIDTH - 300 + i * 84;
            this.add.image(x, 72, 'atlas', ATTRIBUTE_ICONS[k]).setScale(2).setOrigin(0, 0.5);
            body(this, x + 38, 56, String(this.def.stats[k]), { fontSize: '28px', color: CRT.amber });
        });
        // co nepřítel v tomto tahu chystá (mezi výpisem a tlačítky)
        this.intentText = body(this, 64, 552, '', { fontSize: '24px', color: CRT.amber });
        const w = 232, y = 634;
        const xs = [0, 1, 2, 3, 4].map((i) => 40 + w / 2 + i * (w + 4));
        this.buttons = [
            button(this, xs[0], y, w, 100, BATTLE.attack, () => this.act('attack'), { index: 1, primary: true, fontSize: 22, icon: ATTRIBUTE_ICONS.ruka }),
            button(this, xs[1], y, w, 100, this.def.talk, () => this.act('talk'), { index: 2, fontSize: 22, icon: ATTRIBUTE_ICONS.usta }),
            button(this, xs[2], y, w, 100, BATTLE.defend, () => this.act('defend'), { index: 3, fontSize: 22, icon: ATTRIBUTE_ICONS.oko }),
            button(this, xs[3], y, w, 100, '', () => this.act('bag'), { index: 4, fontSize: 22 }),
            button(this, xs[4], y, w, 100, `${BATTLE.flee}\n${BATTLE.fleeHint(difficultyOf(this.state).flee)}`, () => this.act('flee'), { index: 5, fontSize: 22 }),
        ];
        this.input.keyboard.on('keydown', (e) => { if (/^[1-5]$/.test(e.key)) this.buttons[Number(e.key) - 1].press(); });
        scanlines(this);
        this.say(this.def.intro);
        this.refresh();
        sound?.open();
    }

    // Čísla na obrazovce: životy, vůle, záměr nepřítele a tlačítka se šancemi pro tento tah.
    refresh() {
        const f = this.fight;
        const o = odds(f);
        const pick = supplyFor(this.state);
        this.buttons[0].caption.setText(`1. ${BATTLE.attack}\n${BATTLE.attackHint(pct(o.hit), o.dmg[0], o.dmg[1])}`);
        this.buttons[1].caption.setText(`2. ${this.def.talk}\n${BATTLE.talkHint(pct(o.talkP), o.talk[0], o.talk[1])}`);
        this.buttons[2].caption.setText(`3. ${BATTLE.defend}\n${BATTLE.defendHint(pct(o.dodge))}`);
        this.buttons[3].caption.setText(`4. ${BATTLE.bag}\n${pick ? BATTLE.bagHint(ITEMS[pick].name, this.state.supplies[pick], ITEMS[pick].use.heal) : BATTLE.bagEmpty}`);
        // ukazatel má nejvýš 20 dílků (na těžkou obtížnost má nepřítel i 30 srdcí), delší se přepočítá
        const bar = (n, max, full = '■', empty = '□') => { const cells = Math.min(max, 20), on = Math.max(0, Math.ceil(n / max * cells)); return `${full.repeat(on)}${empty.repeat(cells - on)}`; };
        this.heroHp.setText(`${bar(this.state.hp, maxHp(this.state))} ${this.state.hp}/${maxHp(this.state)}`);
        this.foeHp.setText(`${bar(f.hp, f.maxHp)} ${f.hp}/${f.maxHp}`);
        this.foeNerve.setText(`${BATTLE.nerve} ${bar(f.nerve, f.maxNerve, '◆', '◇')} ${f.nerve}/${f.maxNerve}`);
        const plan = f.intent === 'rana' ? `${this.def.heavy} ${BATTLE.intent.rana(pct(o.foe), o.foeDmg[0], o.foeDmg[1])}`
            : f.intent === 'vaha' ? `${this.def.waver} ${BATTLE.intent.vaha}`
                : BATTLE.intent.utok(pct(o.foe), o.foeDmg[0], o.foeDmg[1], o.attacks > 1);
        this.intentText.setText(f.over ? '' : plan).setColor(f.intent === 'rana' ? CRT.red : f.intent === 'vaha' ? CRT.bright : CRT.amber);
    }

    say(...lines) {
        this.log = [...this.log, ...lines].slice(-3);
        this.logText.setText(this.log.join('\n'));
    }

    shake(target) {
        this.tweens.add({ targets: target, x: target.x + 10, duration: 50, yoyo: true, repeat: 2 });
    }

    // Jeden tah: pravidla spočítá step (src/boj.js), tady se z jeho událostí stane text, otřes a zvuk.
    act(action) {
        if (this.over) return;
        const sound = this.registry.get('sound');
        const events = step(this.fight, action);
        if (!events) { sound?.wrong(); return; }
        const d = this.def;
        const hitFoe = (prefix, n) => { this.say(`${prefix} ${n}. ${d.hurt}`); this.shake(this.enemy); sound?.hit(); };
        events.forEach((e) => ({
            hit: () => hitFoe(BATTLE.hit, e.n),
            counter: () => hitFoe(BATTLE.counter, e.n),
            miss: () => { this.say(d.dodge ?? BATTLE.miss); sound?.swish(); },
            talk: () => { this.say(`${d.shout} ${BATTLE.shout} −${e.n}.`); this.shake(this.enemy); sound?.shout(); },
            deaf: () => { this.say(BATTLE.deaf); sound?.swish(); },
            guard: () => this.say(BATTLE.guard),
            bag: () => { this.say(BATTLE.bagUsed(ITEMS[e.item].name, e.n)); sound?.coin(); },
            fleeing: () => this.say(BATTLE.fleeing),
            waver: () => {},
            foeHit: () => { this.say(`${e.second ? d.twice : d.hit}${e.blocked ? ` ${BATTLE.blocked}` : ''} −${e.n}`); this.shake(this.hero); sound?.hurt(); },
            foeMiss: () => this.say(d.miss),
            win: () => this.say(d.win),
            yield: () => this.say(d.yield),
            dead: () => this.say(BATTLE.dead),
            flee: () => this.say(d.flee),
        })[e.type]());
        this.refresh();
        if (this.fight.over) this.finish(this.fight.over);
    }

    finish(result) {
        this.over = true;
        this.buttons.forEach((b) => { b.disabled = true; });
        if (result === 'win') this.registry.get('sound')?.win(); else if (result === 'dead') this.registry.get('sound')?.lose();
        this.time.delayedCall(1400, () => {
            this.scene.stop();
            this.onDone?.(result);
        });
    }
}
