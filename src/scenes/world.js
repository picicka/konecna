import Phaser from 'phaser';
import * as ISO from '../iso';
import { ensureWalk, CRT } from '../ui';
import { save } from '../state';

// Svět: zatím zkušební plácek 24 × 14 dlaždic (ulice, chodníky, tráva, voda), hrdinka, chůze klepnutím a šipkami,
// kamera. Slouží k ověření rozlišení 128 × 64 a pipeline (pxl → atlas → Phaser → Playwright). Skutečná místa přijdou
// z generátoru nad daty z OpenStreetMap (krok 1 plánu). Pravidla, která platí od začátku:
// - každý interaktivní objekt má přístupovou dlaždici a při startu se kontroluje, že je průchozí;
// - hloubka je vždy ISO.depthOf(a, b, lift), žádné výjimky po jednom;
// - po zavření dialogu this.input.keyboard.resetKeys(), jinak Enter z poslední repliky hned znovu spustí rozhovor;
// - všechno herní se resetuje v init/create, Phaser drží instanci scény mezi restarty.
const LEN = 24;
const WID = 14;
const SPEED = 180; // bodů za vteřinu

const groundTile = (a, b) => {
    if (b >= 11) return 't_water';
    if (b === 10) return 't_pave';
    if (b === 4 || b === 5) return ISO.pick(['t_road', 't_road', 't_road_crack'], a, b, 1);
    if (b === 3 || b === 6) return 't_pave';
    if (b <= 2) return ISO.pick(['t_grass', 't_grass', 't_rubble'], a, b, 2);
    return ISO.pick(['t_pave', 't_pave', 't_mosaic'], a, b, 3);
};

export class WorldScene extends Phaser.Scene {
    constructor() {
        super('world');
    }

    init() {
        this.state = this.registry.get('state');
        this.busy = false;
        this.path = [];
        this.moving = null;
        this.blocked = new Set();
    }

    create() {
        this.cameras.main.setBackgroundColor(CRT.bg);
        this.scene.launch('hud');
        this.hud = this.scene.get('hud');
        this.buildGround();
        this.spawnPlayer({ a: 2, b: 7 });
        this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
        this.input.on('pointerdown', (pointer) => this.onPointer(pointer));
        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.keyboard.addCapture(['UP', 'DOWN', 'LEFT', 'RIGHT']);
        // Checkpoint: příchod na místo ukládá stav.
        this.state.visited[this.state.place] = true;
        save(this.state);
    }

    inside(a, b) {
        return a >= 0 && a < LEN && b >= 0 && b < WID;
    }

    center(tile) {
        return ISO.toScreen(tile.a, tile.b);
    }

    // Podlaha do jedné textury: dlaždice se kreslí od zadní řady dopředu, voda je neprůchozí.
    buildGround() {
        const corners = [this.center({ a: 0, b: 0 }), this.center({ a: LEN, b: 0 }), this.center({ a: 0, b: WID }), this.center({ a: LEN, b: WID })];
        const minX = Math.min(...corners.map((c) => c.x)) - ISO.TW / 2;
        const maxX = Math.max(...corners.map((c) => c.x)) + ISO.TW / 2;
        const minY = Math.min(...corners.map((c) => c.y)) - ISO.TH / 2;
        const maxY = Math.max(...corners.map((c) => c.y)) + ISO.TH / 2;
        this.bounds = { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
        const rt = this.add.renderTexture(minX, minY, this.bounds.w, this.bounds.h).setOrigin(0, 0).setDepth(-100000);
        for (let a = LEN - 1; a >= 0; a--) {
            for (let b = 0; b < WID; b++) {
                const tile = groundTile(a, b);
                const { x, y } = this.center({ a, b });
                rt.draw(this.textures.getFrame('atlas', tile), x - minX - ISO.TW / 2, y - minY - ISO.TH / 2);
                if (tile === 't_water') this.blocked.add(ISO.key(a, b));
            }
        }
        this.cameras.main.setBounds(minX - 200, minY - 200, this.bounds.w + 400, this.bounds.h + 400);
    }

    spawnPlayer(tile) {
        this.tile = { ...tile };
        const { x, y } = this.center(tile);
        ensureWalk(this, 'hero');
        this.shadow = this.add.ellipse(x, y + ISO.TH / 2, 40, 16, 0x000000, 0.35).setDepth(ISO.depthOf(tile.a, tile.b, -1));
        this.player = this.add.sprite(x, y + ISO.TH / 2, 'atlas', 'hero_0').setOrigin(0.5, 1).setDepth(ISO.depthOf(tile.a, tile.b));
    }

    onPointer(pointer) {
        if (this.busy || this.hud?.panel || this.hud?.quests) return;
        const world = pointer.positionToCamera(this.cameras.main);
        const target = ISO.toGrid(world.x, world.y);
        if (!this.inside(target.a, target.b)) return;
        this.goTo(target);
    }

    goTo(target) {
        this.path = ISO.findPath(this.tile, target, { inside: (a, b) => this.inside(a, b), blocked: this.blocked });
        if (!this.path.length) this.registry.get('sound')?.wrong();
    }

    // Klávesy: držená šipka, kombinace dvou směrů; pohyb po jedné dlaždici, klouzání podél překážky.
    keyStep() {
        const c = this.cursors;
        let da = 0;
        let db = 0;
        if (c.up.isDown) { da += 1; db -= 1; }
        if (c.down.isDown) { da -= 1; db += 1; }
        if (c.right.isDown) { da += 1; db += 1; }
        if (c.left.isDown) { da -= 1; db -= 1; }
        da = Math.sign(da); db = Math.sign(db);
        if (!da && !db) return null;
        const free = (a, b) => this.inside(a, b) && !this.blocked.has(ISO.key(a, b));
        const options = [[da, db], [da, 0], [0, db]].filter(([x, y]) => (x || y) && free(this.tile.a + x, this.tile.b + y));
        return options.length ? { a: this.tile.a + options[0][0], b: this.tile.b + options[0][1] } : null;
    }

    update(time, delta) {
        if (!this.player) return;
        if (!this.moving) {
            if (!this.path.length && !this.busy && !this.hud?.panel && !this.hud?.quests) {
                const step = this.keyStep();
                if (step) this.path = [step];
            }
            if (this.path.length) {
                const next = this.path.shift();
                const target = this.center(next);
                this.moving = { from: { x: this.player.x, y: this.player.y }, to: { x: target.x, y: target.y + ISO.TH / 2 }, tile: next, t: 0 };
                this.player.setFlipX(next.a + next.b > this.tile.a + this.tile.b ? false : next.a + next.b < this.tile.a + this.tile.b ? true : this.player.flipX);
                this.player.play('hero_walk', true);
            } else if (this.player.anims.isPlaying) {
                this.player.stop();
                this.player.setFrame('hero_0');
            }
        }
        if (this.moving) {
            const m = this.moving;
            const length = Math.hypot(m.to.x - m.from.x, m.to.y - m.from.y) || 1;
            m.t = Math.min(1, m.t + (SPEED * delta / 1000) / length);
            this.player.setPosition(Math.round(m.from.x + (m.to.x - m.from.x) * m.t), Math.round(m.from.y + (m.to.y - m.from.y) * m.t));
            if (m.t >= 1) {
                this.tile = { ...m.tile };
                this.moving = null;
                this.registry.get('sound')?.step();
            }
            const depth = ISO.depthOf(this.tile.a, this.tile.b);
            this.player.setDepth(depth);
            this.shadow.setPosition(this.player.x, this.player.y).setDepth(depth - 1);
        }
    }

    // Smrt v boji: epilog smrti; checkpoint z posledního místa zůstává v localStorage.
    die() {
        this.scene.stop('hud');
        this.scene.start('ending', { result: 'death' });
    }
}
