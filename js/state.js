// ============================================
// TILSTAND
// ============================================

let currentScreen = 'menu';    // 'menu' eller 'game'
let currentMode = 'student';   // 'teacher' eller 'student'
let selectedThemeId = null;
let selectedDifficulty = 'easy';

let quizData = [];
let matches = {};
let selectedQuestion = null;
let isChecked = false;
let shuffledAnswerIndices = [];
let lockedMatches = new Set();

// ============================================
// LYD OG MØRK MODUS
// ============================================
let isMuted = localStorage.getItem('loko_muted') === 'true';
let isDark = localStorage.getItem('loko_dark') === 'true';

function applyTheme() {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    const btn = document.getElementById('darkmode-btn');
    if (btn) btn.textContent = isDark ? '☀️' : '🌙';
}

function toggleMute() {
    isMuted = !isMuted;
    localStorage.setItem('loko_muted', isMuted);
    const btn = document.getElementById('mute-btn');
    if (btn) btn.textContent = isMuted ? '🔇' : '🔊';
}

function toggleDarkMode() {
    isDark = !isDark;
    localStorage.setItem('loko_dark', isDark);
    applyTheme();
}

// Apply theme and mute state on load
applyTheme();
(function() {
    const muteBtn = document.getElementById('mute-btn');
    if (muteBtn) muteBtn.textContent = isMuted ? '🔇' : '🔊';
})();

// ============================================
// POENG OG STATISTIKK - GLOBALS
// ============================================
let gameStartTime = null;
let retryCount = 0;
let statsUpdatedThisGame = false;

const STATS_KEY = 'loko_stats';

function getStats() {
    try { return JSON.parse(localStorage.getItem(STATS_KEY) || '{}'); } catch(e) { return {}; }
}

function saveStats(s) {
    localStorage.setItem(STATS_KEY, JSON.stringify(s));
}

function updateStats(correctCount, score, elapsed) {
    const s = getStats();
    s.gamesPlayed = (s.gamesPlayed || 0) + 1;
    s.totalCorrect = (s.totalCorrect || 0) + correctCount;
    s.bestScore = Math.max(s.bestScore || 0, score);
    s.totalTimeSec = (s.totalTimeSec || 0) + elapsed;
    if (correctCount === 12) {
        s.perfectGames = (s.perfectGames || 0) + 1;
        if (s.fastestTime == null || elapsed < s.fastestTime) s.fastestTime = elapsed;
    }
    saveStats(s);
}

function resetStats() {
    if (confirm('Nullstill all statistikk?')) {
        localStorage.removeItem(STATS_KEY);
        renderMenu();
    }
}

// ============================================
// DEMO-MODUS
// ============================================
const DEMO_KEY = 'loko_demo_used';
const DEMO_LIMIT = 5;

function getDemoUsed() { return parseInt(localStorage.getItem(DEMO_KEY) || '0'); }
function incrementDemo() { localStorage.setItem(DEMO_KEY, getDemoUsed() + 1); }
function isDemoActive() { return getDemoUsed() < DEMO_LIMIT; }
function isLicensed() {
    const stored = getStoredLicense();
    return stored && validateLicenseKey(stored);
}

function showLicenseScreen() {
    const licenseScreen = document.getElementById('license-screen');
    const demoBtn = document.getElementById('demo-btn');
    const demoInfo = document.getElementById('demo-info');
    const remaining = DEMO_LIMIT - getDemoUsed();

    if (isDemoActive()) {
        demoBtn.textContent = `Prøv gratis (${remaining} spill igjen)`;
        demoBtn.style.display = '';
        demoInfo.style.display = '';
    } else {
        demoBtn.style.display = 'none';
        demoInfo.style.display = 'none';
    }

    licenseScreen.classList.remove('hidden');
}

function continueDemo() {
    document.getElementById('license-screen').classList.add('hidden');
    _pendingDemoStart = true;
    if (_pendingStartArgs) {
        startGame(..._pendingStartArgs);
    }
}

let _pendingStartArgs = null;
let _pendingDemoStart = false;
