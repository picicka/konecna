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
        step() {
            stepParity = 1 - stepParity;
            burst('lowpass', stepParity ? 500 : 380, 0.07, 0.6, 0.7);
        },
        coin() { tone('sine', 1320, 1320, 0.005, 0.1, 0.35, true); setTimeout(() => tone('sine', 1760, 1760, 0.005, 0.18, 0.35, true), 70); },
        bell() { tone('triangle', 880, 870, 0.005, 0.7, 0.5, true); tone('sine', 1760, 1750, 0.005, 0.4, 0.18, true); },
        drop() { tone('triangle', 520, 180, 0.005, 0.25, 0.3); },
        wrong() { tone('sawtooth', 220, 110, 0.01, 0.35, 0.35); },
        boom() { burst('lowpass', 180, 1.2, 1.4, 0.5, true); tone('sine', 90, 30, 0.02, 1.0, 0.9, true); },
        // Zvon (Orloj, Loreta): tři údery s dozvukem.
        toll() {
            [0, 900, 1800].forEach((delay) => setTimeout(() => { tone('sine', 196, 194, 0.01, 1.6, 0.8, true); tone('triangle', 392, 390, 0.01, 0.9, 0.3, true); }, delay));
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
            if (level <= 0) { if (loops.fire) loops.fire.gain.gain.setTargetAtTime(0, audio()?.context.currentTime ?? 0, 0.3); return; }
            const loop = noiseLoop('fire', 'bandpass', 1800, 0.8, 0);
            if (!loop) return;
            const a = audio();
            loop.gain.gain.setTargetAtTime(0.35 * level, a.context.currentTime, 0.3);
            if (!loop.timers.length) loop.timers.push(setInterval(() => { if (Math.random() < 0.5 && loop.gain.gain.value > 0.005) burst('highpass', 2500, 0.03, loop.gain.gain.value * 0.8); }, 120));
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
