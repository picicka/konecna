import { createAudio } from './audio';

// Zvuk hry: všechno se syntetizuje přes Web Audio (žádné soubory), převzato z Václaváku. Kontext se odemkne prvním
// klepnutím nebo klávesou, do té doby je ticho. Vypínač v liště drží stav v localStorage (konecna.sound). Kompresor na
// výstupu je od začátku (poučení z Václaváku: syntetizované zvuky byly potichu). Jednorázové efekty (klik, tik psacího
// stroje, krok, mince, zvonek, dopad, zvon), smyčky (bzučení, vítr, oheň) a tichý ambient. Složitější hudba (MIDI přes
// spessasynth_lib) může přijít později, rozhraní music(on) zůstane.
const STORAGE_KEY = 'konecna.sound';

export const createSound = () => {
    const getAudio = createAudio({ masterGain: 1, reverbSeconds: 1.2, decayPower: 3, wetGain: 0.25 });
    const LEVEL = 1;
    let compressor = null;
    let enabled = localStorage.getItem(STORAGE_KEY) !== 'off';
    let unlocked = false;
    let noiseBuffer = null;
    const loops = {};
    let musicTimer = null;
    let stepParity = 0;

    // Kompresor na výstupu drží špičky, takže jednotlivé zvuky mohou být výrazně hlasitější bez praskání.
    const audio = () => {
        if (!unlocked) return null;
        const a = getAudio();
        if (!a) return null;
        if (!compressor) {
            compressor = a.context.createDynamicsCompressor();
            compressor.threshold.value = -14;
            compressor.knee.value = 12;
            compressor.ratio.value = 6;
            compressor.attack.value = 0.003;
            compressor.release.value = 0.2;
            a.master.disconnect();
            a.master.connect(compressor);
            compressor.connect(a.context.destination);
        }
        a.master.gain.value = enabled ? LEVEL : 0;
        return a;
    };

    const noise = (a) => {
        if (!noiseBuffer) {
            noiseBuffer = a.context.createBuffer(1, a.context.sampleRate * 2, a.context.sampleRate);
            const data = noiseBuffer.getChannelData(0);
            for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        }
        const source = a.context.createBufferSource();
        source.buffer = noiseBuffer;
        return source;
    };

    // Tón: typ, frekvence (případně sklouznutí), obálka attack/decay, hlasitost, dozvuk.
    const tone = (type, from, to, attack, decay, gain, wet = false) => {
        const a = audio();
        if (!a) return;
        const t = a.context.currentTime;
        const osc = a.context.createOscillator();
        const g = a.context.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(from, t);
        if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, t + attack + decay);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(gain, t + attack);
        g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
        osc.connect(g);
        g.connect(a.master);
        if (wet) g.connect(a.reverb);
        osc.start(t);
        osc.stop(t + attack + decay + 0.05);
    };

    // Šum přes filtr: kroky, tiknutí, prasknutí, dopad.
    const burst = (filterType, frequency, decay, gain, q = 1, wet = false) => {
        const a = audio();
        if (!a) return;
        const t = a.context.currentTime;
        const source = noise(a);
        const filter = a.context.createBiquadFilter();
        filter.type = filterType;
        filter.frequency.value = frequency;
        filter.Q.value = q;
        const g = a.context.createGain();
        g.gain.setValueAtTime(gain, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
        source.connect(filter);
        filter.connect(g);
        g.connect(a.master);
        if (wet) g.connect(a.reverb);
        source.start(t);
        source.stop(t + decay + 0.05);
    };

    // Smyčka šumu přes filtr s vlastní hlasitostí (vítr, oheň); vrací ovladač hlasitosti.
    const noiseLoop = (key, filterType, frequency, q, gain) => {
        const a = audio();
        if (!a || loops[key]) return loops[key];
        const source = noise(a);
        source.loop = true;
        const filter = a.context.createBiquadFilter();
        filter.type = filterType;
        filter.frequency.value = frequency;
        filter.Q.value = q;
        const g = a.context.createGain();
        g.gain.value = gain;
        source.connect(filter);
        filter.connect(g);
        g.connect(a.master);
        source.start();
        loops[key] = { source, gain: g, filter, timers: [] };
        return loops[key];
    };

    const stopLoop = (key) => {
        const loop = loops[key];
        if (!loop) return;
        loop.timers.forEach(clearInterval);
        try { loop.source.stop(); } catch (error) { /* už zastaveno */ }
        delete loops[key];
    };

    return {
        get enabled() { return enabled; },
        // První gesto uživatele: odemkne zvuk; vrací true, když se právě odemkl.
        unlock() {
            if (unlocked) return false;
            unlocked = true;
            audio();
            return true;
        },
        toggle() {
            enabled = !enabled;
            localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off');
            const a = audio();
            if (a) a.master.gain.value = enabled ? LEVEL : 0;
            return enabled;
        },
        click() { tone('square', 1400, 900, 0.005, 0.05, 0.22); },
        tick() { burst('highpass', 3000, 0.03, 0.3); },
        open() { tone('triangle', 500, 800, 0.01, 0.12, 0.25); },
        // Krok podle povrchu (stone dlažba a asfalt, wood prkna lávky a mola, soft tráva a hlína); echo = v hale a v podchodu
        // se krok vrací od stěn (dozvuk a dvě slábnoucí ozvěny).
        step(surface = 'stone', echo = false) {
            stepParity = 1 - stepParity;
            const one = (k) => {
                if (surface === 'wood') {
                    burst('bandpass', stepParity ? 270 : 215, 0.09, 0.9 * k, 2.5, echo);
                    tone('sine', stepParity ? 150 : 128, 100, 0.004, 0.07, 0.22 * k, echo);
                    if (k === 1 && Math.random() < 0.12) tone('sawtooth', 620 + Math.random() * 200, 540, 0.02, 0.09, 0.03);
                } else if (surface === 'soft') {
                    burst('lowpass', stepParity ? 240 : 200, 0.11, 0.45 * k, 0.6, echo);
                    burst('highpass', 2600, 0.04, 0.05 * k);
                } else burst('lowpass', stepParity ? 500 : 380, 0.07, 0.6 * k, 0.7, echo);
            };
            one(1);
            if (echo) { setTimeout(() => one(0.3), 170); setTimeout(() => one(0.12), 350); }
        },
        coin() { tone('sine', 1320, 1320, 0.005, 0.1, 0.35, true); setTimeout(() => tone('sine', 1760, 1760, 0.005, 0.18, 0.35, true), 70); },
        bell() { tone('triangle', 880, 870, 0.005, 0.7, 0.5, true); tone('sine', 1760, 1750, 0.005, 0.4, 0.18, true); },
        drop() { tone('triangle', 520, 180, 0.005, 0.25, 0.3); },
        wrong() { tone('sawtooth', 220, 110, 0.01, 0.35, 0.35); },
        boom() { burst('lowpass', 180, 1.2, 1.4, 0.5, true); tone('sine', 90, 30, 0.02, 1.0, 0.9, true); },
        // Ruch: štěknutí a zavrčení voříška, vzlet holubů (třepot křídel), písknutí krysy.
        bark() { tone('sawtooth', 560, 240, 0.008, 0.1, 0.5); burst('bandpass', 900, 0.09, 0.5, 1.5); },
        growl() { tone('sawtooth', 95, 70, 0.06, 0.55, 0.3); burst('lowpass', 240, 0.5, 0.25, 2); },
        flutter() { for (let i = 0; i < 9; i++) setTimeout(() => burst('bandpass', 1300 + Math.random() * 900, 0.05, 0.3 - i * 0.025, 1.2), i * 55 + Math.random() * 20); },
        squeak() { tone('sine', 3100, 4300, 0.005, 0.06, 0.1); setTimeout(() => tone('sine', 3400, 4000, 0.005, 0.05, 0.07), 90); },
        // Boj: úder, rána do prázdna, zařvání, zásah hrdinky, výhra a prohra.
        hit() { burst('lowpass', 320, 0.13, 1.1, 0.8); tone('square', 170, 70, 0.005, 0.11, 0.4); },
        swish() { burst('bandpass', 1800, 0.16, 0.3, 0.8); },
        shout() { tone('sawtooth', 280, 430, 0.03, 0.2, 0.3); tone('sawtooth', 283, 436, 0.03, 0.2, 0.2); },
        hurt() { burst('lowpass', 220, 0.2, 1.1, 0.7); tone('sawtooth', 210, 90, 0.01, 0.28, 0.35); },
        win() { [392, 494, 587].forEach((f, i) => setTimeout(() => tone('triangle', f, f, 0.01, 0.3, 0.35, true), i * 130)); },
        lose() { [294, 233, 175].forEach((f, i) => setTimeout(() => tone('triangle', f, f * 0.98, 0.02, 0.7, 0.35, true), i * 260)); },
        // Nová úroveň a povedená zkouška vlastnosti.
        level() { [440, 554, 659, 880].forEach((f, i) => setTimeout(() => tone('triangle', f, f, 0.01, 0.35, 0.32, true), i * 110)); },
        pass() { tone('triangle', 660, 660, 0.005, 0.12, 0.3, true); setTimeout(() => tone('triangle', 880, 880, 0.005, 0.2, 0.3, true), 90); },
        // Šplouchání vody u břehu a u lávek: hlasitost podle blízkosti (0 = daleko, 1 = u vody), vlny přicházejí a odcházejí.
        water(level) {
            if (level <= 0) { if (loops.water) loops.water.level = 0; if (loops.water) loops.water.gain.gain.setTargetAtTime(0, audio()?.context.currentTime ?? 0, 0.5); return; }
            const loop = noiseLoop('water', 'lowpass', 700, 0.4, 0);
            if (!loop) return;
            loop.level = level;
            if (!loop.timers.length) loop.timers.push(setInterval(() => { const a = audio(); if (!a) return; loop.gain.gain.setTargetAtTime((0.05 + Math.random() * 0.13) * (loop.level ?? 0), a.context.currentTime, 0.7); loop.filter.frequency.setTargetAtTime(450 + Math.random() * 700, a.context.currentTime, 0.7); }, 1400));
        },
        // Zvon (Orloj, katedrála): tři údery s dozvukem, k = hlasitost podle vzdálenosti.
        toll(k = 1) {
            [0, 900, 1800].forEach((delay) => setTimeout(() => { tone('sine', 196, 194, 0.01, 1.6, 0.8 * k, true); tone('triangle', 392, 390, 0.01, 0.9, 0.3 * k, true); }, delay));
        },
        // Bzučení zářivky nebo neonu (metro, tržiště): pilové tóny síťového brumu přes dolní propust; prasknutí při probliknutí.
        neon(on) {
            if (!on) { stopLoop('neon'); return; }
            const a = audio();
            if (!a || loops.neon) return;
            const g = a.context.createGain();
            g.gain.value = 0.1;
            const filter = a.context.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 600;
            [50, 100, 150].forEach((f, i) => { const osc = a.context.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = f; const og = a.context.createGain(); og.gain.value = [1, 0.4, 0.15][i]; osc.connect(og); og.connect(filter); osc.start(); loops.neon = loops.neon ?? { timers: [], oscs: [] }; loops.neon.oscs.push(osc); });
            filter.connect(g);
            g.connect(a.master);
            loops.neon.gain = g;
            loops.neon.source = { stop: () => loops.neon.oscs.forEach((osc) => osc.stop()) };
        },
        // Neon na mapě (obálka na domě Na Můstku): bzučí podle blízkosti (0 = neslyšet, 1 = pod ním).
        hum(level) {
            if (level <= 0) { stopLoop('neon'); return; }
            this.neon(true);
            if (loops.neon?.gain) loops.neon.gain.gain.setTargetAtTime(0.09 * level, audio()?.context.currentTime ?? 0, 0.3);
        },
        crackle(dark) {
            if (loops.neon?.gain) loops.neon.gain.gain.setTargetAtTime(dark ? 0.01 : 0.1, audio()?.context.currentTime ?? 0, 0.02);
            if (dark) burst('bandpass', 2500, 0.05, 0.3, 2);
        },
        // Vítr v prázdných ulicích.
        wind(on) {
            if (!on) { stopLoop('wind'); return; }
            const loop = noiseLoop('wind', 'bandpass', 400, 0.6, 0.06);
            if (!loop || loop.timers.length) return;
            loop.timers.push(setInterval(() => { const a = audio(); if (!a) return; const target = 0.035 + Math.random() * 0.07; loop.gain.gain.setTargetAtTime(target, a.context.currentTime, 1.5); loop.filter.frequency.setTargetAtTime(300 + Math.random() * 400, a.context.currentTime, 1.5); }, 2500));
        },
        // Praskání ohně: hlasitost podle vzdálenosti (0 = u ohně, 1 = daleko).
        fire(distance) {
            const level = Math.max(0, 1 - distance);
            if (level <= 0) { if (loops.fire) loops.fire.level = 0; if (loops.fire) loops.fire.gain.gain.setTargetAtTime(0, audio()?.context.currentTime ?? 0, 0.3); return; }
            // Podklad je jen tiché hluboké hučení plamene; oheň dělají jednotlivá prasknutí: krátké ostré lupance
            // v nepravidelných shlucích, občas hlasitější rána polena. Souvislý šum ve výškách zněl jako moře.
            const loop = noiseLoop('fire', 'lowpass', 160, 0.5, 0);
            if (!loop) return;
            const a = audio();
            loop.level = level;
            loop.gain.gain.setTargetAtTime(0.07 * level, a.context.currentTime, 0.3);
            if (loop.timers.length) return;
            let spree = 0;
            loop.timers.push(setInterval(() => {
                const l = loop.level ?? 0;
                if (l <= 0.02) return;
                if (spree <= 0 && Math.random() < 0.12) spree = 2 + Math.floor(Math.random() * 6);
                if (spree > 0 ? Math.random() < 0.7 : Math.random() < 0.06) {
                    spree--;
                    burst('bandpass', 1400 + Math.random() * 4200, 0.006 + Math.random() * 0.016, l * (0.2 + Math.random() ** 2 * 0.7), 4);
                }
                if (Math.random() < 0.012) { burst('lowpass', 500 + Math.random() * 300, 0.05, l * 0.8, 1); burst('highpass', 3000, 0.012, l * 0.6); }
            }, 45));
        },
        // Ambient: hluboký dron a občasný tón z mollové pentatoniky s dozvukem.
        music(on) {
            if (!on) { clearInterval(musicTimer); musicTimer = null; stopLoop('drone'); return; }
            const a = audio();
            if (!a || musicTimer) return;
            const g = a.context.createGain();
            g.gain.value = 0.1;
            const oscs = [55, 55.4, 82.4].map((f) => { const osc = a.context.createOscillator(); osc.type = 'sine'; osc.frequency.value = f; osc.connect(g); osc.start(); return osc; });
            g.connect(a.master);
            loops.drone = { source: { stop: () => oscs.forEach((osc) => osc.stop()) }, gain: g, timers: [] };
            const scale = [220, 261.6, 293.7, 329.6, 392, 440, 523.3];
            musicTimer = setInterval(() => { if (Math.random() < 0.7) tone('sine', scale[Math.floor(Math.random() * scale.length)], scale[0] * 1.0001, 0.6, 2.4, 0.14, true); }, 2600);
        },
        stopAll() {
            Object.keys(loops).forEach(stopLoop);
            clearInterval(musicTimer);
            musicTimer = null;
        },
    };
};
