// Všechny texty pro hráčku na jednom místě, s literálními pevnými mezerami (U+00A0) podle české typografie.
// Do scén se texty nepíšou. Kontrola proti mapě a rodu (hrdinka = žena) je pravidelný krok, ne jednorázová oprava.
// Zatím jen kostra: titulek, lišta, úvodní filmeček a konce; dialogy míst přijdou s krokem 2 plánu (Hlavák).

export const TITLE = {
    name: 'KONEČNÁ',
    subtitle: 'Nevystupovat.',
    loading: 'NAČÍTÁM PRAHU…',
    start: 'Vystoupit',
    resume: 'Pokračovat z posledního místa',
    hint: 'Klepnutím nebo šipkami chodíte, Enter potvrdí, čísla vybírají, Q otevře deník.',
};

export const HUD = {
    next: 'Dál',
    skip: 'Přeskočit',
    close: 'Zavřít',
    quests: 'Deník',
    tickets: 'jízdenek',
    hp: 'ŽIVOTY',
    level: 'ÚROVEŇ',
};

export const ATTRIBUTE_NAMES = { sila: 'Síla', huba: 'Huba', postreh: 'Postřeh' };

// Měna: jízdenky na 90 minut. Skloňování podle počtu.
export const tickets = (n) => `${n} ${n === 1 ? 'jízdenka' : n >= 2 && n <= 4 ? 'jízdenky' : 'jízdenek'}`;

export const QUEST = {
    title: 'DENÍK',
    hero: 'HRDINKA',
    itemsTitle: 'V tašce',
    questsTitle: 'Úkoly',
    empty: 'Zatím nic. Zásilka a vlastní krk.',
    noItems: 'Jen zásilka. A ta se nepočítá.',
};

// Úvodní filmeček: obrázky z art/scenes.px.js (cs_*), repliky se píšou po písmenech. Kostra, texty k rozstřílení.
export const CUTSCENES = {
    intro: [
        { image: 'cs_city', lines: [
            'Praha. Rok po tom, co se stalo.',
            'Vltava teče jinudy, Nuselák je na dva kusy a na Hradě se svítí, ale nikdo neví, kdo tam je.',
        ] },
        { image: 'cs_metro', toll: true, lines: [
            'V metru jezdí jediná souprava. Řídí se ručně a staví, kde chce řidič.',
            '„Konečná. Nevystupovat.“',
            'Vystoupíte.',
        ] },
    ],
};

export const ENDINGS = {
    trziste: { title: 'Všechno je na prodej', text: 'Zásilka změnila majitele. Hlavák má nový stánek a vy slevu.' },
    metro: { title: 'Řád', text: 'Souprava zase staví podle jízdního řádu. Na Hradě se přestalo svítit.' },
    lodkari: { title: 'Po vodě', text: 'Z loďky je vidět zlomený Nuselák. Vyšehrad svítí. Praha je najednou docela malá.' },
    death: { title: 'Konečná', text: 'Praha po pádu si vás nechala. Někdo si vezme boty, někdo zásilku.' },
    again: 'Hrát znovu',
    resume: 'Zpátky na poslední místo',
};
