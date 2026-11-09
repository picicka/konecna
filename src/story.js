// Vykladač dialogů z src/script.js (DIALOGS): podmínky, účinky, paměť vyčerpaných voleb a návaznost uzlů.
// Texty sem nepatří; tady je jen logika. WorldScene volá runDialog(world, id) při rozhovoru se zastavením.
import { DIALOGS, ITEMS, QUESTS, HUD, BATTLES, CHECK, ATTRIBUTE_NAMES, ATTRIBUTE_ICONS, ATTRIBUTE_INFO, FACTIONS, SHOP, BAG, tickets as ticketWord } from './script';
import { ATTRIBUTES, hasItem, addItem, removeItem, gainXp, resolveEnding, attr as attrOf, maxHp, addSupply } from './state';

const list = (value) => (value === undefined ? [] : [].concat(value));

// Podmínka nad stavem hry. Prázdná podmínka platí vždy.
export const holds = (state, cond) => {
    if (!cond) return true;
    if (cond.any && !cond.any.some((c) => holds(state, c))) return false;
    if (list(cond.item).some((i) => !hasItem(state, i))) return false;
    if (list(cond.noItem).some((i) => hasItem(state, i))) return false;
    if (list(cond.flag).some((f) => !state.flags[f])) return false;
    if (list(cond.noFlag).some((f) => state.flags[f])) return false;
    if (cond.quest && Object.entries(cond.quest).some(([q, step]) => !list(step).includes(state.quests[q]))) return false;
    if (cond.questNot && Object.entries(cond.questNot).some(([q, step]) => list(step).includes(state.quests[q]))) return false;
    if (cond.tickets !== undefined && state.tickets < cond.tickets) return false;
    if (cond.poor !== undefined && state.tickets >= cond.poor) return false;
    if (cond.attr && Object.entries(cond.attr).some(([a, n]) => attrOf(state, a) < n)) return false;
    // důvěra skupiny: trust = aspoň, distrust = méně než (state.trust)
    if (cond.trust && Object.entries(cond.trust).some(([f, n]) => (state.trust[f] ?? 0) < n)) return false;
    if (cond.distrust && Object.entries(cond.distrust).some(([f, n]) => (state.trust[f] ?? 0) >= n)) return false;
    return true;
};

// Účinky, které se dají provést hned (předměty, výbava, zásoby, jízdenky, důvěra, úkoly, vlajky, zkušenosti, životy); boj, přestup a konec řeší
// runDialog až po odpovědi postavy. Vrací seznam hlášek do toastu a počet nových úrovní.
const apply = (world, fx) => {
    const { state } = world;
    const hud = world.hud;
    const notes = [];
    let levelled = 0;
    if (!fx) return { notes, levelled };
    list(fx.take).forEach((i) => {
        if (!hasItem(state, i)) return;
        if (ITEMS[i]?.use) addSupply(state, i, -1); else removeItem(state, i);
        notes.push(`${HUD.lostItem} ${ITEMS[i]?.name ?? i}`);
    });
    // výbava se sama nasadí, když je její slot prázdný
    list(fx.give).forEach((i) => {
        if (hasItem(state, i)) return;
        addItem(state, i);
        notes.push(`${HUD.newItem} ${ITEMS[i]?.name ?? i}`);
        const slot = ITEMS[i]?.slot;
        if (slot && !state.equip[slot]) { state.equip[slot] = i; notes.push(`${HUD.equipped} ${ITEMS[i].name}`); }
    });
    Object.entries(fx.supply ?? {}).forEach(([k, n]) => { addSupply(state, k, n); notes.push(`${HUD.newItem} ${ITEMS[k]?.name ?? k}${n > 1 ? ` ×${n}` : ''}`); });
    if (fx.tickets) { state.tickets = Math.max(0, state.tickets + fx.tickets); hud?.flashTickets(fx.tickets); }
    if (fx.trust) Object.entries(fx.trust).forEach(([k, n]) => notes.push(...changeTrust(state, k, n)));
    if (fx.quest) Object.entries(fx.quest).forEach(([q, step]) => { if (state.quests[q] !== step) { state.quests[q] = step; notes.push(`${HUD.questUpdate} ${QUESTS[q]?.title ?? q}`); } });
    list(fx.flag).forEach((f) => { state.flags[f] = true; });
    list(fx.unflag).forEach((f) => { delete state.flags[f]; });
    if (fx.hpMax) { state.hpMax += fx.hpMax; state.hp += fx.hpMax; }
    if (fx.heal) state.hp = Math.min(maxHp(state), state.hp + fx.heal);
    // zranění mimo boj (nepovedená zkouška) nezabije, nechá aspoň jeden život
    if (fx.hurt) { const before = state.hp; state.hp = Math.max(1, state.hp - fx.hurt); if (before > state.hp) notes.push(HUD.hurt(before - state.hp)); }
    if (fx.xp) levelled = gainXp(state, fx.xp);
    hud?.refresh();
    return { notes, levelled };
};

// Slovo pro důvěru skupiny (FACTIONS.levels) a výhody, které od ní hrdinka má (perks s prahem).
export const trustLevel = (n) => FACTIONS.levels.filter(([min]) => n >= min).at(-1)[1];

// Změna důvěry: hláška, kam se důvěra posunula, a výhoda, která se tím otevřela nebo zavřela (důvěra mění průběh hry).
const changeTrust = (state, key, n) => {
    const f = FACTIONS.list[key];
    const before = state.trust[key] ?? 0;
    const after = before + n;
    state.trust[key] = after;
    if (!f || !n) return [];
    const notes = [`${f.name}: ${n > 0 ? HUD.trustUp : HUD.trustDown} (${trustLevel(after)})`];
    (f.perks ?? []).forEach(([min, text]) => {
        if (before < min && after >= min) notes.push(`${HUD.perkOpen} ${text}`);
        if (before >= min && after < min) notes.push(`${HUD.perkClosed} ${text}`);
    });
    return notes;
};

// Nová úroveň: bod do vlastnosti podle volby hráčky (Ruka, Ústa, Oko), u každé obrázek a k čemu je.
const levelUp = async (world, levelled) => {
    for (let i = 0; i < levelled; i++) {
        const pick = await world.hud.choose(`${HUD.levelUp} ${world.state.level - levelled + i + 1}`, HUD.levelPrompt, ATTRIBUTES.map((a) => ({ label: `${ATTRIBUTE_NAMES[a]} ${world.state.attributes[a]} → ${world.state.attributes[a] + 1}: ${ATTRIBUTE_INFO[a]}`, icon: ATTRIBUTE_ICONS[a] })));
        world.state.attributes[ATTRIBUTES[pick]] += 1;
    }
};

const notify = (world, notes) => { if (notes.length) world.hud.toast(notes.join('\n')); };

// Zkouška vlastnosti u volby: check proti vlastnosti postavy (stats), nebo požadavek v if.attr. Vrací { a, n } nebo null.
export const checkOf = (id, choice) => {
    if (choice.check) return { a: choice.check, n: DIALOGS[id]?.stats?.[choice.check] ?? 2 };
    const [a, n] = Object.entries(choice.if?.attr ?? {})[0] ?? [];
    return a ? { a, n } : null;
};
// Šance, že zkouška vyjde: o bod víc než požadavek jistě, na požadavek 70 %, o bod méně 35 %, jinak se volba neukáže.
export const chanceOf = (state, id, choice) => {
    const c = checkOf(id, choice);
    if (!c) return 1;
    const diff = attrOf(state, c.a) - c.n;
    return diff >= 1 ? 1 : CHECK.chance[diff] ?? 0;
};
// Hod pro zkoušku: ze semínka hry, volby a hodnoty vlastnosti, takže opakování na stejné úrovni dopadne stejně.
const rollFor = (state, key, value) => {
    let h = (state.seed ?? 1) ^ Math.imul(value + 1, 2654435761);
    for (const ch of key) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15;
    return (h >>> 0) / 4294967296;
};
const failKey = (id, choice) => `${id}.${choice.id}`;

// Volby uzlu, které se mají ukázat: platí podmínka (vlastnosti se zkouškou stačí o bod méně), nejsou vyčerpané (once)
// a nepovedená zkouška se ukáže zase, až je vlastnost vyšší než při pokusu.
export const visibleChoices = (state, id, node) => (node.choices ?? []).filter((c) => {
    if (c.shop) return wares(state, id).length > 0;
    if (c.once && state.asked[id]?.includes(c.id)) return false;
    const check = checkOf(id, c);
    if (!check) return holds(state, c.if);
    const { attr: _skip, ...rest } = c.if ?? {};
    if (!holds(state, rest) || chanceOf(state, id, c) <= 0) return false;
    const failedAt = state.failed?.[failKey(id, c)];
    return failedAt === undefined || attrOf(state, check.a) > failedAt;
});

// Co věc dělá, krátce: „úder +2“, „životy +1, Ústa +1“, „+5 životů“ (deník, obchod).
export const itemStats = (item) => [
    item.weapon ? BAG.weapon(item.weapon) : '',
    item.hp ? BAG.hp(item.hp) : '',
    ...Object.entries(item.bonus ?? {}).map(([a, n]) => `${ATTRIBUTE_NAMES[a]} +${n}`),
    item.use?.heal ? BAG.heal(item.use.heal) : '',
].filter(Boolean).join(', ');

// Zboží postavy, které se teď nabízí: platí podmínka a výbavu ani věc hrdinka ještě nemá (zásoby jdou koupit vždy).
export const wares = (state, id) => (DIALOGS[id]?.shop ?? []).filter((w) => holds(state, w.if) && (ITEMS[w.item]?.use || !hasItem(state, w.item)));

// Obchod: seznam zboží s cenou, na co nejsou jízdenky, je vidět, ale nejde koupit. Po nákupu odpověď prodavače
// a zpátky do seznamu; Nic, díky vrátí rozhovor do uzlu, odkud se šlo nakupovat.
const shop = async (world, id, speaker, face) => {
    const { state, hud } = world;
    for (;;) {
        const list = wares(state, id);
        if (!list.length) { await hud.say(speaker, SHOP.empty, face); return; }
        const options = [...list.map((w) => {
            const item = ITEMS[w.item];
            const short = state.tickets < w.price;
            return { label: SHOP.ware(item.name, BAG.slots[item.slot], itemStats(item)), icon: 'ico_ticket', badge: short ? SHOP.missing(w.price - state.tickets) : w.price, disabled: short };
        }), { label: SHOP.leave }];
        const pick = await hud.choose(speaker, SHOP.prompt(state.tickets), options, face, { keepDisabled: true });
        if (pick >= list.length) return;
        const w = list[pick];
        const fx = ITEMS[w.item]?.use ? { tickets: -w.price, supply: { [w.item]: 1 } } : { tickets: -w.price, give: w.item };
        const r = apply(world, fx);
        if (w.reply) await hud.say(speaker, w.reply, face);
        notify(world, r.notes);
    }
};

// Volba, která stojí na vlastnosti, nese její obrázek a požadovanou úroveň, nebo šanci, když není jistá.
export const choiceIcon = (state, id, choice) => {
    const c = checkOf(id, choice);
    if (!c) return {};
    const p = chanceOf(state, id, choice);
    return { icon: ATTRIBUTE_ICONS[c.a], badge: p < 1 ? `${Math.round(p * 100)}\u00a0%` : c.n };
};

// Jméno postavy a její skupina („Dispečerka · Metro“), ať je vidět, kdo k čemu patří.
export const speakerName = (dialog) => {
    const faction = dialog.faction && (FACTIONS.list[dialog.faction] ?? FACTIONS[dialog.faction]);
    return faction ? `${dialog.name} · ${faction.name}` : dialog.name;
};

export const entryNode = (state, dialog) => (dialog.entry.find((e) => holds(state, e.if)) ?? dialog.entry.at(-1)).node;

// Rozhovor: uzly za sebou, dokud volba nebo uzel neřeknou konec. Vrací { travel }, { ending } nebo { dead }, když se má něco stát
// se světem po zavření dialogu.
export async function runDialog(world, id) {
    const dialog = DIALOGS[id];
    if (!dialog) return {};
    const { hud } = world;
    const speaker = speakerName(dialog), face = dialog.face;
    hud.showCard?.(id);
    try {
        return await converse(world, id, dialog, speaker, face);
    } finally {
        hud.hideCard?.();
    }
}

async function converse(world, id, dialog, speaker, face) {
    const { state, hud } = world;
    let nodeId = entryNode(state, dialog);
    let last = null;
    for (let guard = 0; nodeId && guard < 40; guard++) {
        const node = dialog.nodes[nodeId];
        if (!node) break;
        const fresh = nodeId !== last;
        last = nodeId;
        if (fresh && node.do) {
            const r = apply(world, node.do);
            notify(world, r.notes);
            if (r.levelled) await levelUp(world, r.levelled);
        }
        const lines = [].concat(node.say ?? []);
        const choices = visibleChoices(state, id, node);
        if (!node.choices) {
            await hud.say(speaker, lines, face);
            if (!node.next) break;
            nodeId = node.next; continue;
        }
        // Při návratu do uzlu po volbě zazní jen poslední replika (otázka), ne celý úvod znovu.
        const intro = fresh ? lines.slice(0, -1) : [];
        if (intro.length) await hud.say(speaker, intro, face);
        const options = [...choices.map((c) => ({ label: c.label, ...choiceIcon(state, id, c) })), { label: HUD.leave }];
        const pick = await hud.choose(speaker, lines.at(-1) ?? '', options, face);
        if (pick >= choices.length) break;
        const choice = choices[pick];
        if (choice.shop) { await shop(world, id, speaker, face); last = nodeId; continue; }
        // zkouška vlastnosti: nepovedený pokus stojí (CHECK.cost nebo fail), volba zmizí do další úrovně té vlastnosti
        const check = checkOf(id, choice);
        if (check && rollFor(state, failKey(id, choice), attrOf(state, check.a)) >= chanceOf(state, id, choice)) {
            state.failed = { ...state.failed, [failKey(id, choice)]: attrOf(state, check.a) };
            const cost = choice.fail ?? (check.a === 'usta' && dialog.faction && FACTIONS.list[dialog.faction]?.perks ? { trust: { [dialog.faction]: -1 } } : CHECK.cost[check.a]);
            const r = apply(world, cost);
            await hud.say(speaker, choice.failReply ?? CHECK.fail[check.a], face);
            notify(world, [...r.notes, CHECK.retry(ATTRIBUTE_NAMES[check.a])]);
            last = nodeId;
            continue;
        }
        if (choice.once) state.asked[id] = [...(state.asked[id] ?? []), choice.id];
        const { fight, travel, ending, ...now } = choice.do ?? {};
        const r = apply(world, now);
        world.refreshStops?.(); // co se vyřešilo, se přehraje hned (psi odběhnou, zatímco Robin mluví)
        if (choice.reply) await hud.say(speaker, choice.reply, face);
        notify(world, r.notes);
        if (r.levelled) await levelUp(world, r.levelled);
        if (fight) {
            hud.hideCard?.();
            const result = await world.fight(fight);
            hud.showCard?.(id);
            if (result === 'dead') return { dead: true };
            if (result === 'win') {
                // kořist z boje (BATTLES.loot) spolu s účinkem výhry
                const loot = BATTLES[fight]?.loot ?? {};
                const w = apply(world, { ...loot, ...choice.win });
                world.refreshStops?.();
                notify(world, w.notes);
                if (w.levelled) await levelUp(world, w.levelled);
            } else break; // útěk: rozhovor končí, smečka zůstává
        }
        if (travel) return { travel };
        if (ending) return { ending: resolveEnding(state, ending) };
        if (choice.end) break;
        if (choice.next && choice.next !== nodeId) nodeId = choice.next;
        else last = nodeId; // zpátky do téhož uzlu: jen otázka
    }
    return {};
}

// Skupiny do deníku: jen ty, z nichž hrdinka někoho potkala; jmenují se jen potkaní lidé, co skupina chce, se ukáže,
// až to hrdinka zjistí (want.flag), a výhody důvěry: získané a nejbližší další.
export const factions = (state) => Object.entries(FACTIONS.list).map(([key, f]) => {
    const met = f.members.filter(([, flag]) => state.flags[flag]).map(([name]) => name);
    if (!met.length) return null;
    const trust = state.trust[key] ?? 0;
    const counts = f.perks !== undefined;
    return {
        key, name: f.name, met,
        level: counts ? trustLevel(trust) : null,
        want: list(f.want.flag).some((flag) => state.flags[flag]) ? f.want.text : FACTIONS.wantUnknown,
        perks: (f.perks ?? []).filter(([min]) => trust >= min).map(([, text]) => text),
        next: (f.perks ?? []).find(([min]) => trust < min)?.[1] ?? null,
    };
}).filter(Boolean);

// Text deníku: úkoly s názvy a kroky, věci v tašce s popisem (pro HudScene).
export const journal = (state) => ({
    quests: Object.entries(state.quests).map(([q, step]) => ({ done: step === 'done', title: QUESTS[q]?.title ?? q, text: QUESTS[q]?.steps?.[step] ?? step })),
    items: state.items.map((i) => `${ITEMS[i]?.name ?? i}${Object.values(state.equip ?? {}).includes(i) ? ` (${HUD.inHand})` : ''}`),
    tickets: ticketWord(state.tickets),
});
