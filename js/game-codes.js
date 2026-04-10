// ============================================
// SPILLKODE-SYSTEM
// ============================================
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const BUILTIN_THEME_IDS = ['capitals', 'addition', 'subtraction', 'multiplication', 'division', 'antonyms', 'counties'];

function encodeGameCode(themeIndex, difficultyId, seed) {
    const diffIndex = difficulties.findIndex(d => d.id === difficultyId);
    const di = diffIndex >= 0 ? diffIndex : 0;
    const combo = themeIndex * 5 + di;

    let code = '';
    code += CODE_CHARS[Math.floor(combo / 30)];
    code += CODE_CHARS[combo % 30];

    let s = seed;
    for (let i = 0; i < 5; i++) {
        code += CODE_CHARS[s % 30];
        s = Math.floor(s / 30);
    }
    return code.substring(0, 3) + '-' + code.substring(3);
}

function decodeGameCode(code) {
    const clean = code.replace(/[-\s]/g, '').toUpperCase();
    if (clean.length !== 7) return null;

    const c0 = CODE_CHARS.indexOf(clean[0]);
    const c1 = CODE_CHARS.indexOf(clean[1]);
    if (c0 < 0 || c1 < 0) return null;

    const combo = c0 * 30 + c1;
    const themeIndex = Math.floor(combo / 5);
    const diffIndex = combo % 5;

    if (themeIndex < 0 || themeIndex >= BUILTIN_THEME_IDS.length) return null;
    if (diffIndex < 0 || diffIndex >= difficulties.length) return null;

    let seed = 0;
    let mult = 1;
    for (let i = 2; i < 7; i++) {
        const ci = CODE_CHARS.indexOf(clean[i]);
        if (ci < 0) return null;
        seed += ci * mult;
        mult *= 30;
    }

    return {
        themeId: BUILTIN_THEME_IDS[themeIndex],
        difficultyId: difficulties[diffIndex].id,
        seed: seed
    };
}

function encodeCustomGameCode(customTheme, seed) {
    // Kompakt format: navn|ikon|seed|q1\ta1|q2\ta2|...
    const parts = [customTheme.name, customTheme.icon, seed];
    customTheme.pairs.forEach(p => parts.push(p.question + '\t' + p.answer));
    const str = parts.join('|');
    const b64 = btoa(unescape(encodeURIComponent(str)));
    return 'C-' + b64;
}

function decodeCustomGameCode(code) {
    if (!code.startsWith('C-')) return null;
    try {
        const b64 = code.substring(2);
        const str = decodeURIComponent(escape(atob(b64)));
        const parts = str.split('|');
        if (parts.length < 15) {
            // Prøv gammelt JSON-format for bakoverkompatibilitet
            const json = str;
            const data = JSON.parse(json);
            return {
                name: data.n,
                icon: data.i,
                pairs: data.p.map(([q, a]) => ({ question: q, answer: a })),
                seed: data.s
            };
        }
        const name = parts[0];
        const icon = parts[1];
        const seed = parseInt(parts[2]);
        const pairs = [];
        for (let i = 3; i < parts.length; i++) {
            const [q, a] = parts[i].split('\t');
            if (q && a) pairs.push({ question: q, answer: a });
        }
        if (pairs.length !== 12) return null;
        return { name, icon, pairs, seed };
    } catch (e) {
        return null;
    }
}
