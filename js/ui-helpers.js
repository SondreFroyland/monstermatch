// ============================================
// DOM-REFERANSER
// ============================================

const menuEl = document.getElementById('menu');
const appEl = document.getElementById('app');
const modeOptionsEl = document.getElementById('mode-options');
const themeGridEl = document.getElementById('theme-grid');
const difficultySectionEl = document.getElementById('difficulty-section');
const difficultyOptionsEl = document.getElementById('difficulty-options');
const startBtnEl = document.getElementById('start-btn');
const nesteBtnEl = document.getElementById('neste-btn');
const backStepBtnEl = document.getElementById('back-step-btn');
const backBtnEl = document.getElementById('back-btn');
const gameSubtitleEl = document.getElementById('game-subtitle');

const questionsList = document.getElementById('questions-list');
const answersList = document.getElementById('answers-list');
const matchesList = document.getElementById('matches-list');
const matchCountEl = document.getElementById('match-count');
const allMatchedMsg = document.getElementById('all-matched-msg');
const userGrid = document.getElementById('user-grid');
const refGrid = document.getElementById('ref-grid');
const checkBtn = document.getElementById('check-btn');
const resetBtn = document.getElementById('reset-btn');
const resultArea = document.getElementById('result-area');
const confettiCanvas = document.getElementById('confetti-canvas');
const uploadBtn = document.getElementById('upload-btn');
const imageInput = document.getElementById('image-input');
const imagePickerRow = document.getElementById('image-picker-row');

const passwordModal = document.getElementById('password-modal');
const modalTitle = document.getElementById('modal-title');
const modalDesc = document.getElementById('modal-desc');
const modalPassword = document.getElementById('modal-password');
const modalPasswordConfirm = document.getElementById('modal-password-confirm');
const modalError = document.getElementById('modal-error');
const modalOkBtn = document.getElementById('modal-ok-btn');
const modalCancelBtn = document.getElementById('modal-cancel-btn');

// ============================================
// TOUCH-DETEKSJON OG HJELPEFUNKSJONER
// ============================================

const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
const actionVerb = isTouchDevice ? 'Trykk' : 'Klikk';
const checkHelper = document.getElementById('check-helper');
const gameInstructions = document.getElementById('game-instructions');

function updateInstructions() {
    if (!gameInstructions) return;
    if (isChecked) {
        gameInstructions.textContent = '';
        return;
    }
    if (selectedQuestion !== null) {
        gameInstructions.textContent = `${actionVerb} nå på riktig svar for oppgave ${selectedQuestion + 1}.`;
        gameInstructions.style.color = '#3b82f6';
        gameInstructions.style.fontWeight = '600';
    } else if (matchCount() === 12) {
        gameInstructions.textContent = `Alle matcher er satt! ${actionVerb} «Sjekk svar».`;
        gameInstructions.style.color = '#22c55e';
        gameInstructions.style.fontWeight = '600';
    } else if (matchCount() === 0) {
        gameInstructions.textContent = `${actionVerb} på en oppgave, deretter på riktig svar.`;
        gameInstructions.style.color = '#475569';
        gameInstructions.style.fontWeight = '';
    } else {
        gameInstructions.textContent = `${matchCount()} av 12 matcher satt. ${actionVerb} på neste oppgave.`;
        gameInstructions.style.color = '#475569';
        gameInstructions.style.fontWeight = '';
    }
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('visible'), 10);
    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

let _toastShownAt6 = false;

function playTone(frequency, duration) {
    if (isMuted) return;
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = frequency;
        gain.gain.value = 0.1;
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.stop(ctx.currentTime + duration);
    } catch(e) { /* lyd ikke støttet */ }
}

function playMatchSound() { playTone(660, 0.1); }
function playCorrectSound() { playTone(880, 0.15); }
function playIncorrectSound() { playTone(220, 0.3); }
