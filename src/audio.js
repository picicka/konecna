// Zvuk přes Web Audio společný hrám: master hlasitost a jednoduchý dozvuk (konvoluce se šumem, který slábne
// podle `decayPower`). Kontext vzniká až při prvním zavolání, tedy po interakci uživatele, jinak by ho prohlížeč
// nechal pozastavený; při dalších voláních se případně jen probudí.
export const createAudio = ({ masterGain, reverbSeconds, decayPower, wetGain }) => {
    let audio = null;
    return () => {
        if (audio) {
            if (audio.context.state === 'suspended') audio.context.resume();
            return audio;
        }
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return null;
        const context = new AudioContextClass();
        const master = context.createGain();
        master.gain.value = masterGain;
        master.connect(context.destination);

        const impulse = context.createBuffer(2, Math.floor(context.sampleRate * reverbSeconds), context.sampleRate);
        for (let channel = 0; channel < 2; channel++) {
            const data = impulse.getChannelData(channel);
            for (let i = 0; i < data.length; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, decayPower);
            }
        }
        const reverb = context.createConvolver();
        reverb.buffer = impulse;
        const wet = context.createGain();
        wet.gain.value = wetGain;
        reverb.connect(wet);
        wet.connect(master);

        audio = { context, master, reverb };
        return audio;
    };
};
