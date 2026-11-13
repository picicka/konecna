// UI ve stylu Pip-Boye: zelený fosfor na černé, pixelová písma, panely s dvojitým rámečkem, scanlines.
// Plátno je 1280 × 720 bodů zobrazené 1:1 (na menších displejích zmenšené bez vyhlazení, na 4K zdvojené),
// takže všechny rozměry jsou v herních pixelech. Převzato z Václaváku (320 × 560), čísla přepočítaná.
export const WIDTH = 1280;
export const HEIGHT = 720;

export const FONT_HEAD = "'Press Start 2P', monospace";
export const FONT_BODY = "'VT323', monospace";
export const SIZE_HEAD = 16;
export const SIZE_BODY = 28;

export const CRT = {
    bg: 0x050806,
    panel: 0x07140b,
    panelLight: 0x0c2213,
    line: 0x2ee86b,
    lineDim: 0x1a7a3c,
    text: '#9fe8b0',
    bright: '#d8ffe0',
    accent: '#2ee86b',
    dim: '#4c8a5c',
    amber: '#ffc33d',
    red: '#ff5d5d',
};

export const head = (scene, x, y, content, style = {}) => scene.add.text(x, y, content, {
    fontFamily: FONT_HEAD, fontSize: `${SIZE_HEAD}px`, color: CRT.accent, resolution: 1, ...style,
});

export const body = (scene, x, y, content, style = {}) => scene.add.text(x, y, content, {
    fontFamily: FONT_BODY, fontSize: `${SIZE_BODY}px`, color: CRT.text, resolution: 1, ...style,
});

// Panel: černý podklad, světlý rámeček, uvnitř tmavší linka a nýty v rozích.
export const panel = (scene, x, y, w, h, options = {}) => {
    const g = scene.add.graphics();
    g.fillStyle(CRT.panel, options.alpha ?? 0.96);
    g.fillRect(x, y, w, h);
    g.lineStyle(2, CRT.line, 1);
    g.strokeRect(x + 1, y + 1, w - 2, h - 2);
    g.lineStyle(2, CRT.lineDim, 1);
    g.strokeRect(x + 5, y + 5, w - 10, h - 10);
    g.fillStyle(CRT.line, 1);
    [[x + 2, y + 2], [x + w - 6, y + 2], [x + 2, y + h - 6], [x + w - 6, y + h - 6]].forEach(([rx, ry]) => g.fillRect(rx, ry, 4, 4));
    return g;
};

// Tlačítko jako řádek terminálu: „> text“, při najetí nebo zvýraznění se podsvítí. Výška min. 44 px kvůli dotyku.
export const button = (scene, x, y, width, height, label, onPress, options = {}) => {
    const container = scene.add.container(x, y);
    const box = scene.add.rectangle(0, 0, width, height, options.primary ? CRT.panelLight : CRT.panel, 1).setStrokeStyle(2, options.disabled ? CRT.lineDim : CRT.line);
    const prefix = options.index ? `${options.index}. ` : '';
    const caption = scene.add.text(-width / 2 + 14, 0, `${prefix}${label}`, {
        fontFamily: FONT_BODY, fontSize: `${options.fontSize ?? SIZE_BODY}px`, color: options.disabled ? CRT.dim : options.primary ? CRT.bright : CRT.text,
        wordWrap: { width: width - 28 }, resolution: 1, lineSpacing: -4,
    }).setOrigin(0, 0.5);
    if (options.center) caption.setX(0).setOrigin(0.5, 0.5).setAlign('center');
    container.add([box, caption]);
    // Ikona vlastnosti (Ruka, Ústa, Oko) vpravo na tlačítku, vedle ní požadovaná úroveň: volba, která na vlastnosti stojí.
    if (options.icon) {
        const icon = scene.add.image(width / 2 - 12, 0, 'atlas', options.icon).setOrigin(1, 0.5).setScale(2);
        container.add(icon);
        let badgeW = 0;
        if (options.badge !== undefined) {
            const badge = scene.add.text(width / 2 - 50, 0, String(options.badge), {
                fontFamily: FONT_BODY, fontSize: `${options.fontSize ?? SIZE_BODY}px`, color: options.disabled ? CRT.red : CRT.amber, resolution: 1,
            }).setOrigin(1, 0.5);
            container.add(badge);
            badgeW = badge.width + 12;
        }
        caption.setWordWrapWidth(width - 28 - 44 - Math.max(badgeW, options.badge !== undefined ? 36 : 0));
    }
    container.setSize(width, height);
    container.box = box;
    container.caption = caption;
    container.disabled = Boolean(options.disabled);
    if (!options.disabled) {
        box.setInteractive({ useHandCursor: true });
        box.on('pointerover', () => box.setFillStyle(CRT.panelLight));
        box.on('pointerout', () => box.setFillStyle(options.primary ? CRT.panelLight : CRT.panel));
        box.on('pointerdown', (pointer, localX, localY, event) => { event?.stopPropagation(); container.press(); });
    }
    container.press = () => {
        if (container.disabled) return;
        scene.registry.get('sound')?.click();
        box.setFillStyle(CRT.line);
        scene.time.delayedCall(60, () => box.setFillStyle(options.primary ? CRT.panelLight : CRT.panel));
        onPress();
    };
    container.highlight = (on) => box.setStrokeStyle(on ? 4 : 2, on ? CRT.line : options.disabled ? CRT.lineDim : CRT.line);
    return container;
};

// Scanlines a vinětace přes celou obrazovku (textura 2×4 px se jednou vygeneruje; při 1:1 zobrazení je linka každé 4 body).
export const scanlines = (scene, depth = 1000) => {
    if (!scene.textures.exists('scanline')) {
        const canvas = scene.textures.createCanvas('scanline', 2, 4);
        const ctx = canvas.getContext();
        ctx.fillStyle = 'rgba(0,0,0,0.14)';
        ctx.fillRect(0, 3, 2, 1);
        canvas.refresh();
    }
    const lines = scene.add.tileSprite(0, 0, WIDTH, HEIGHT, 'scanline').setOrigin(0, 0).setDepth(depth).setScrollFactor(0);
    const vignette = scene.add.graphics().setDepth(depth).setScrollFactor(0);
    vignette.fillStyle(0x000000, 0.35);
    vignette.fillRect(0, 0, WIDTH, 6); vignette.fillRect(0, HEIGHT - 6, WIDTH, 6); vignette.fillRect(0, 0, 6, HEIGHT); vignette.fillRect(WIDTH - 6, 0, 6, HEIGHT);
    return lines;
};

export const shuffle = (items) => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};

// Animace chůze z atlasu (pxl rozbalí anim na name_0, name_1, …).
export const ensureWalk = (scene, key, frames = 4) => {
    if (scene.anims.exists(`${key}_walk`)) return;
    scene.anims.create({ key: `${key}_walk`, frames: Array.from({ length: frames }, (_, i) => ({ key: 'atlas', frame: `${key}_${i}` })), frameRate: 8, repeat: -1 });
};

// Vypínač zvuku; stav drží sound.js v localStorage.
export const soundButton = (scene, x, y, depth = 50, width = 160) => {
    const sound = scene.registry.get('sound');
    const label = () => (sound.enabled ? 'ZVUK: ANO' : 'ZVUK: NE');
    const control = button(scene, x, y, width, 36, label(), () => {
        sound.unlock();
        sound.toggle();
        control.caption.setText(label());
    }, { fontSize: 22, center: true }).setDepth(depth);
    return control;
};

// Okno O hře (texty ABOUT ze src/script.js): zdroje dat, autoři, ukládání. Tmavý podklad bere klepnutí, aby nešla
// pod ním hra; vrací { close }.
export const aboutPanel = (scene, texts, onClose, depth = 60) => {
    const w = 900, x = (WIDTH - w) / 2, parts = [];
    const shade = scene.add.rectangle(0, 0, WIDTH, HEIGHT, 0x000000, 0.6).setOrigin(0, 0).setDepth(depth).setInteractive();
    shade.on('pointerdown', (pointer, lx, ly, event) => event?.stopPropagation());
    const lines = texts.lines.map((line) => body(scene, 0, 0, line, { fontSize: '24px', color: CRT.text, wordWrap: { width: w - 64 }, lineSpacing: -2 }).setDepth(depth + 2));
    const h = 76 + lines.reduce((sum, line) => sum + line.height + 12, 0) + 70, y = Math.round((HEIGHT - h) / 2);
    parts.push(shade, panel(scene, x, y, w, h).setDepth(depth + 1), head(scene, x + 32, y + 28, texts.title, { fontSize: '16px', color: CRT.amber }).setDepth(depth + 2), ...lines);
    let top = y + 70;
    lines.forEach((line) => { line.setPosition(x + 32, top); top += line.height + 12; });
    const api = { close: () => { parts.forEach((part) => part.destroy()); onClose?.(); } };
    parts.push(button(scene, WIDTH / 2, y + h - 40, 220, 40, texts.close, () => api.close(), { fontSize: 24, center: true }).setDepth(depth + 2));
    return api;
};
