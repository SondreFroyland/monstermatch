// ============================================
// TEMADATA
// ============================================

const themes = [
    {
        id: 'capitals',
        name: 'Hovedsteder i Europa',
        icon: '🌍',
        description: '12 land og hovedsteder',
        hasDifficulty: false,
        generate: () => [
            { question: 'Norge',         answer: 'Oslo' },
            { question: 'Sverige',       answer: 'Stockholm' },
            { question: 'Danmark',       answer: 'København' },
            { question: 'Finland',       answer: 'Helsinki' },
            { question: 'Island',        answer: 'Reykjavik' },
            { question: 'Tyskland',      answer: 'Berlin' },
            { question: 'Frankrike',     answer: 'Paris' },
            { question: 'Spania',        answer: 'Madrid' },
            { question: 'Italia',        answer: 'Roma' },
            { question: 'Portugal',      answer: 'Lisboa' },
            { question: 'Polen',         answer: 'Warszawa' },
            { question: 'Storbritannia', answer: 'London' },
        ],
    },
    {
        id: 'addition',
        name: 'Addisjon',
        icon: '➕',
        description: 'Pluss-regnestykker',
        hasDifficulty: true,
        generate: (diff) => generateMathQuiz('+', diff),
    },
    {
        id: 'subtraction',
        name: 'Subtraksjon',
        icon: '➖',
        description: 'Minus-regnestykker',
        hasDifficulty: true,
        generate: (diff) => generateMathQuiz('−', diff),
    },
    {
        id: 'multiplication',
        name: 'Multiplikasjon',
        icon: '✖️',
        description: 'Gange-regnestykker',
        hasDifficulty: true,
        generate: (diff) => generateMathQuiz('×', diff),
    },
    {
        id: 'division',
        name: 'Divisjon',
        icon: '➗',
        description: 'Dele-regnestykker',
        hasDifficulty: true,
        generate: (diff) => generateMathQuiz('÷', diff),
    },
    {
        id: 'antonyms',
        name: 'Antonymer',
        icon: '🔄',
        description: 'Finn motsetningsordet',
        hasDifficulty: false,
        generate: () => shuffleArray([
            { question: 'Stor',    answer: 'Liten' },
            { question: 'Varm',    answer: 'Kald' },
            { question: 'Lys',     answer: 'Mørk' },
            { question: 'Rask',    answer: 'Treg' },
            { question: 'Glad',    answer: 'Trist' },
            { question: 'Ung',     answer: 'Gammel' },
            { question: 'Lett',    answer: 'Tung' },
            { question: 'Lang',    answer: 'Kort' },
            { question: 'Rik',     answer: 'Fattig' },
            { question: 'Sterk',   answer: 'Svak' },
            { question: 'Våt',     answer: 'Tørr' },
            { question: 'Modig',   answer: 'Feig' },
        ]).slice(0, 12),
    },
    {
        id: 'counties',
        name: 'Norske fylker',
        icon: '🇳🇴',
        description: 'Koble fylke til riktig by',
        hasDifficulty: false,
        generate: () => [
            { question: 'Oslo',              answer: 'Oslo' },
            { question: 'Rogaland',          answer: 'Stavanger' },
            { question: 'Vestland',          answer: 'Bergen' },
            { question: 'Møre og Romsdal',   answer: 'Molde' },
            { question: 'Trøndelag',         answer: 'Steinkjer' },
            { question: 'Nordland',          answer: 'Bodø' },
            { question: 'Troms',             answer: 'Tromsø' },
            { question: 'Finnmark',          answer: 'Vadsø' },
            { question: 'Innlandet',         answer: 'Hamar' },
            { question: 'Viken',             answer: 'Drammen' },
            { question: 'Vestfold',          answer: 'Tønsberg' },
            { question: 'Agder',             answer: 'Kristiansand' },
        ],
    },
];

// ============================================
// EGENDEFINERTE TEMAER
// ============================================

const CUSTOM_THEMES_KEY = 'loko_custom_themes';
const EMOJI_OPTIONS = ['📚', '🎯', '🌟', '💡', '🎨', '🎵', '🔬', '📐', '🌍', '🧪', '🎲', '🏆'];

function getCustomThemes() {
    try {
        const stored = localStorage.getItem(CUSTOM_THEMES_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch(e) {
        return [];
    }
}

function saveCustomThemes(list) {
    localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(list));
}

function getAllThemes() {
    const custom = getCustomThemes().map(ct => ({
        id: ct.id,
        name: ct.name,
        icon: ct.icon,
        description: `${ct.pairs.length} egne oppgaver`,
        hasDifficulty: false,
        isCustom: true,
        generate: () => [...ct.pairs],
    }));
    return [...themes, ...custom];
}

const difficulties = [
    { id: 'easy',    label: 'Lett',         description: 'Tall 1–10' },
    { id: 'medium',  label: 'Middels',      description: 'Tall 1–20' },
    { id: 'hard',    label: 'Vanskelig',    description: 'Tall 1–50' },
    { id: 'vhard',   label: 'Ekstra',       description: 'Tall 50–100' },
    { id: 'extreme', label: 'Utfordrende',  description: 'Tall 100–1000' },
];
