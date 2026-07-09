// ============================================
// MENYLOGIKK
// ============================================

// ============================================
// PASSORD FOR LÆRERMODUS
// ============================================

const TEACHER_PW_KEY = 'loko_teacher_password';

function getStoredPassword() {
    return localStorage.getItem(TEACHER_PW_KEY) || null;
}

function setStoredPassword(pw) {
    localStorage.setItem(TEACHER_PW_KEY, pw);
}

let modalResolve = null;

function showPasswordModal(mode) {
    // mode: 'set' (opprett passord), 'enter' (skriv inn passord), 'change' (endre passord)
    modalPassword.value = '';
    modalPasswordConfirm.value = '';
    modalError.textContent = '';

    if (mode === 'set') {
        modalTitle.textContent = 'Opprett lærerpassord';
        modalDesc.textContent = 'Lag et passord for å beskytte lærermodus';
        modalPasswordConfirm.style.display = '';
        modalOkBtn.textContent = 'Lagre';
    } else if (mode === 'enter') {
        modalTitle.textContent = 'Logg inn som lærer';
        modalDesc.textContent = 'Skriv inn passordet for lærermodus';
        modalPasswordConfirm.style.display = 'none';
        modalOkBtn.textContent = 'Logg inn';
    } else if (mode === 'verify-old') {
        modalTitle.textContent = 'Bekreft nåværende passord';
        modalDesc.textContent = 'Skriv inn ditt nåværende passord for å endre det';
        modalPasswordConfirm.style.display = 'none';
        modalOkBtn.textContent = 'Bekreft';
    } else if (mode === 'change') {
        modalTitle.textContent = 'Endre passord';
        modalDesc.textContent = 'Skriv inn nytt passord for lærermodus';
        modalPasswordConfirm.style.display = '';
        modalOkBtn.textContent = 'Lagre';
    }

    passwordModal.classList.remove('hidden');
    modalPassword.focus();

    return new Promise(resolve => {
        modalResolve = resolve;
    });
}

function hidePasswordModal(result) {
    passwordModal.classList.add('hidden');
    if (modalResolve) {
        modalResolve(result);
        modalResolve = null;
    }
}

modalCancelBtn.addEventListener('click', () => hidePasswordModal(false));

modalOkBtn.addEventListener('click', () => {
    const pw = modalPassword.value;
    const confirmVisible = modalPasswordConfirm.style.display !== 'none';

    if (!pw) {
        modalError.textContent = 'Passord kan ikke være tomt';
        return;
    }

    if (confirmVisible) {
        // Opprett / endre modus
        const confirm = modalPasswordConfirm.value;
        if (pw !== confirm) {
            modalError.textContent = 'Passordene er ikke like';
            return;
        }
        if (pw.length < 3) {
            modalError.textContent = 'Passordet må ha minst 3 tegn';
            return;
        }
        setStoredPassword(pw);
        hidePasswordModal(true);
    } else {
        // Innlogging eller verifisering av gammelt passord
        if (pw === getStoredPassword()) {
            hidePasswordModal(true);
        } else {
            modalError.textContent = 'Feil passord';
            modalPassword.value = '';
            modalPassword.focus();
        }
    }
});

// Tillat Enter-tast i passordfelter
modalPassword.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') modalOkBtn.click();
});
modalPasswordConfirm.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') modalOkBtn.click();
});

// Klikk på bakgrunn lukker modalen
passwordModal.addEventListener('click', (e) => {
    if (e.target === passwordModal) hidePasswordModal(false);
});

async function tryEnterTeacherMode() {
    const hasPassword = getStoredPassword() !== null;
    const ok = await showPasswordModal(hasPassword ? 'enter' : 'set');
    if (ok) {
        currentMode = 'teacher';
        renderModeOptions();
        renderMenu();
    }
}

async function changeTeacherPassword() {
    // Steg 1: Bekreft gammelt passord
    const verified = await showPasswordModal('verify-old');
    if (!verified) return;

    // Steg 2: Sett nytt passord
    await showPasswordModal('change');
}

function renderModeOptions() {
    modeOptionsEl.innerHTML = '';

    const modes = [
        { id: 'teacher', icon: '👩‍🏫', name: 'Lærer', desc: 'Se fasit og velg bilder' },
        { id: 'student', icon: '👦', name: 'Elev', desc: 'Spill og sjekk svar' },
    ];

    modes.forEach(mode => {
        const card = document.createElement('div');
        card.className = 'mode-card' + (currentMode === mode.id ? ' selected' : '');
        card.innerHTML = `
            <span class="mode-icon">${mode.icon}</span>
            <h4>${mode.name}</h4>
            <p>${mode.desc}</p>
        `;
        card.addEventListener('click', () => {
            if (mode.id === 'teacher' && currentMode !== 'teacher') {
                tryEnterTeacherMode();
            } else if (mode.id === 'student') {
                currentMode = 'student';
                renderModeOptions();
                renderMenu();
            }
        });
        modeOptionsEl.appendChild(card);
    });

    // Vis «Endre passord»-lenke i lærermodus
    if (currentMode === 'teacher') {
        const link = document.createElement('span');
        link.className = 'change-password-link';
        link.textContent = '🔒 Endre passord';
        link.addEventListener('click', changeTeacherPassword);
        modeOptionsEl.appendChild(link);
    }
}

// ============================================
// TEMA-EDITOR
// ============================================

let editingThemeId = null;
let selectedEditorEmoji = EMOJI_OPTIONS[0];

function openCustomThemeEditor(existingId = null) {
    editingThemeId = existingId;
    const nameInput = document.getElementById('editor-theme-name');
    const errorEl = document.getElementById('editor-error');
    const titleEl = document.getElementById('editor-title');
    errorEl.textContent = '';

    // Fyll emoji-velger
    const emojiPicker = document.getElementById('emoji-picker');
    emojiPicker.innerHTML = '';
    EMOJI_OPTIONS.forEach(emoji => {
        const btn = document.createElement('button');
        btn.className = 'emoji-option' + (selectedEditorEmoji === emoji ? ' selected' : '');
        btn.textContent = emoji;
        btn.type = 'button';
        btn.addEventListener('click', () => {
            selectedEditorEmoji = emoji;
            emojiPicker.querySelectorAll('.emoji-option').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        });
        emojiPicker.appendChild(btn);
    });

    // Fyll par-grid
    const pairsGrid = document.getElementById('pairs-grid');
    pairsGrid.innerHTML = '';

    let existingPairs = null;
    if (existingId) {
        const ct = getCustomThemes().find(t => t.id === existingId);
        if (ct) {
            nameInput.value = ct.name;
            selectedEditorEmoji = ct.icon;
            existingPairs = ct.pairs;
            titleEl.textContent = 'Rediger tema';
            // Oppdater emoji-velger
            emojiPicker.querySelectorAll('.emoji-option').forEach(b => {
                b.classList.toggle('selected', b.textContent === ct.icon);
            });
        }
    } else {
        nameInput.value = '';
        selectedEditorEmoji = EMOJI_OPTIONS[0];
        titleEl.textContent = 'Lag eget tema';
        emojiPicker.querySelector('.emoji-option').classList.add('selected');
    }

    for (let i = 0; i < 12; i++) {
        const row = document.createElement('div');
        row.className = 'pair-row';

        const num = document.createElement('span');
        num.className = 'pair-num';
        num.textContent = i + 1;

        const qInput = document.createElement('input');
        qInput.type = 'text';
        qInput.className = 'pair-input';
        qInput.placeholder = 'Spørsmål';
        qInput.id = `pair-q-${i}`;
        qInput.value = existingPairs ? existingPairs[i].question : '';

        const aInput = document.createElement('input');
        aInput.type = 'text';
        aInput.className = 'pair-input';
        aInput.placeholder = 'Svar';
        aInput.id = `pair-a-${i}`;
        aInput.value = existingPairs ? existingPairs[i].answer : '';

        row.appendChild(num);
        row.appendChild(qInput);
        row.appendChild(aInput);
        pairsGrid.appendChild(row);
    }

    showScreen('editor');
}

function saveCustomTheme() {
    const name = document.getElementById('editor-theme-name').value.trim();
    const errorEl = document.getElementById('editor-error');
    errorEl.textContent = '';

    if (!name) {
        errorEl.textContent = 'Skriv inn et temanavn';
        return;
    }

    const pairs = [];
    let hasEmpty = false;
    for (let i = 0; i < 12; i++) {
        const q = document.getElementById(`pair-q-${i}`).value.trim();
        const a = document.getElementById(`pair-a-${i}`).value.trim();
        if (!q || !a) {
            hasEmpty = true;
            if (!q) document.getElementById(`pair-q-${i}`).classList.add('error');
            if (!a) document.getElementById(`pair-a-${i}`).classList.add('error');
        } else {
            document.getElementById(`pair-q-${i}`).classList.remove('error');
            document.getElementById(`pair-a-${i}`).classList.remove('error');
        }
        pairs.push({ question: q, answer: a });
    }

    if (hasEmpty) {
        errorEl.textContent = 'Fyll ut alle 12 spørsmål og svar';
        return;
    }

    const list = getCustomThemes();

    if (editingThemeId) {
        const idx = list.findIndex(t => t.id === editingThemeId);
        if (idx >= 0) {
            list[idx].name = name;
            list[idx].icon = selectedEditorEmoji;
            list[idx].pairs = pairs;
        }
    } else {
        list.push({
            id: 'custom_' + Date.now(),
            name: name,
            icon: selectedEditorEmoji,
            pairs: pairs,
        });
    }

    saveCustomThemes(list);
    showScreen('menu');
    renderMenu();
    updateStartButton();
}

// Event listeners for editor
document.getElementById('editor-save-btn').addEventListener('click', saveCustomTheme);
document.getElementById('editor-cancel-btn').addEventListener('click', () => {
    showScreen('menu');
    renderMenu();
});
document.getElementById('editor-back-btn').addEventListener('click', () => {
    showScreen('menu');
    renderMenu();
});

// Fjern error-klasse ved input
document.getElementById('pairs-grid').addEventListener('input', (e) => {
    if (e.target.classList.contains('pair-input')) {
        e.target.classList.remove('error');
    }
});

function renderMenu() {
    themeGridEl.innerHTML = '';
    const allThemes = getAllThemes();

    allThemes.forEach(theme => {
        const card = document.createElement('div');
        card.className = 'theme-card' + (selectedThemeId === theme.id ? ' selected' : '');

        card.innerHTML = `
            <span class="theme-icon">${theme.icon}</span>
            <h3>${theme.name}</h3>
            <p>${theme.description}</p>
        `;

        // Rediger/slett-knapper for egne temaer (kun lærermodus)
        if (theme.isCustom && currentMode === 'teacher') {
            const actions = document.createElement('div');
            actions.className = 'theme-card-actions';

            const editBtn = document.createElement('button');
            editBtn.className = 'theme-edit-btn';
            editBtn.textContent = '✏️';
            editBtn.title = 'Rediger';
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                openCustomThemeEditor(theme.id);
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'theme-delete-btn';
            deleteBtn.textContent = '🗑️';
            deleteBtn.title = 'Slett';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`Slette "${theme.name}"?`)) {
                    const list = getCustomThemes().filter(ct => ct.id !== theme.id);
                    saveCustomThemes(list);
                    if (selectedThemeId === theme.id) selectedThemeId = null;
                    renderMenu();
                    updateStartButton();
                }
            });

            actions.appendChild(editBtn);
            actions.appendChild(deleteBtn);
            card.appendChild(actions);
        }

        card.addEventListener('click', () => {
            selectedThemeId = theme.id;
            renderMenu();
            if (theme.hasDifficulty) {
                showMenuStep(2);
            } else {
                startGame();
            }
        });

        themeGridEl.appendChild(card);
    });

    // "Lag eget tema"-kort (kun lærermodus)
    if (currentMode === 'teacher') {
        const createCard = document.createElement('div');
        createCard.className = 'theme-card';
        createCard.innerHTML = `
            <span class="theme-icon">✏️</span>
            <h3>Lag eget tema</h3>
            <p>Opprett egne oppgaver</p>
        `;
        createCard.addEventListener('click', () => openCustomThemeEditor());
        themeGridEl.appendChild(createCard);
    }

    // Statistikk-seksjon
    const menuEl2 = document.getElementById('menu');
    let statsSection = document.getElementById('stats-section');
    if (!statsSection) {
        statsSection = document.createElement('details');
        statsSection.id = 'stats-section';
        statsSection.className = 'stats-section';
        menuEl2.appendChild(statsSection);
    }

    const s = getStats();
    const gamesPlayed = s.gamesPlayed || 0;
    const fastestTime = s.fastestTime != null ? `${s.fastestTime} sek` : '–';

    statsSection.innerHTML = `
        <summary>📊 Min statistikk</summary>
        <div class="stats-grid">
            <div class="stat-card">
                <span class="stat-value">${gamesPlayed}</span>
                <div class="stat-label">Spilte runder</div>
            </div>
            <div class="stat-card">
                <span class="stat-value">${s.perfectGames || 0}</span>
                <div class="stat-label">Perfekte runder</div>
            </div>
            <div class="stat-card">
                <span class="stat-value">${s.bestScore || 0}</span>
                <div class="stat-label">Beste poeng</div>
            </div>
            <div class="stat-card">
                <span class="stat-value">${fastestTime}</span>
                <div class="stat-label">Raskeste tid (12/12)</div>
            </div>
        </div>
        <span class="stats-reset-link" onclick="resetStats()">Nullstill statistikk</span>
    `;

    renderAppQRCode();
    updateStartButton();
}

function showMenuStep(step, direction = 'forward') {
    const step1 = document.getElementById('menu-step-1');
    const step2 = document.getElementById('menu-step-2');
    if (step === 2) {
        step1.style.display = 'none';
        step2.style.display = 'block';
        step2.classList.remove('back');
        void step2.offsetWidth; // force reflow for animation
        step2.classList.add('menu-step');

        const theme = getAllThemes().find(t => t.id === selectedThemeId);
        if (theme) {
            document.getElementById('step2-title').textContent = `${theme.icon} ${theme.name}`;
        }
        updateDifficultySection();
        // Update demo banner
        const demoBanner = document.getElementById('demo-banner');
        if (demoBanner) {
            const buyLink = `<a href="https://sondrefox.gumroad.com/l/vyiyty" target="_blank" style="font-weight:600;text-decoration:underline;color:inherit;">Kjøp her</a>`;
            if (!isLicensed()) {
                const remaining = DEMO_LIMIT - getDemoUsed();
                demoBanner.style.display = '';
                demoBanner.classList.remove('demo-banner-warning', 'demo-banner-expired');
                if (remaining > 0) {
                    demoBanner.classList.add('demo-banner-warning');
                    demoBanner.innerHTML = `Demo: ${remaining} av ${DEMO_LIMIT} prøvespill igjen. ${buyLink} for ubegrenset tilgang.`;
                } else {
                    demoBanner.classList.add('demo-banner-expired');
                    demoBanner.innerHTML = `Demo-perioden er over. ${buyLink} for å fortsette.`;
                }
            } else {
                demoBanner.style.display = 'none';
            }
        }
    } else {
        step2.style.display = 'none';
        step1.style.display = 'block';
        step1.classList.add('back');
        void step1.offsetWidth;
        step1.classList.remove('back');
    }
}

function updateDifficultySection() {
    const theme = getAllThemes().find(t => t.id === selectedThemeId);
    if (theme && theme.hasDifficulty) {
        difficultySectionEl.classList.add('visible');
        renderDifficultyOptions();
    } else {
        difficultySectionEl.classList.remove('visible');
    }
}

function renderDifficultyOptions() {
    difficultyOptionsEl.innerHTML = '';

    difficulties.forEach(diff => {
        const btn = document.createElement('button');
        btn.className = 'diff-btn' + (selectedDifficulty === diff.id ? ' selected' : '');
        btn.textContent = `${diff.label} (${diff.description})`;

        btn.addEventListener('click', () => {
            selectedDifficulty = diff.id;
            renderDifficultyOptions();
        });

        difficultyOptionsEl.appendChild(btn);
    });
}

function updateStartButton() {
    nesteBtnEl.disabled = !selectedThemeId;
}

