let currentGameCode = null;
let preSeededShuffle = null;

function startGame(fromCode = false, codeData = null) {
    // Sjekk tilgang: lisens eller demo
    if (!isLicensed()) {
        if (!_pendingDemoStart) {
            if (!isDemoActive()) {
                // Demo utløpt – vis lisensskjerm
                _pendingStartArgs = [fromCode, codeData];
                showLicenseScreen();
                return;
            }
            // Teller ett demospill
            incrementDemo();
            renderMenu(); // oppdater demobanner
        }
        _pendingDemoStart = false;
        _pendingStartArgs = null;
    }

    try {
        let theme, subtitle;
        currentGameCode = null;
        preSeededShuffle = null;

        const codeBanner = document.getElementById('game-code-banner');
        codeBanner.classList.add('hidden');

        if (fromCode && codeData) {
            // Spill fra spillkode
            theme = codeData.theme;
            subtitle = codeData.subtitle;
            rng = mulberry32(codeData.seed);
            quizData = theme.generate(codeData.difficulty || 'easy');
            preSeededShuffle = shuffleArray([...Array(12).keys()]);
            rng = Math.random;
        } else {
            theme = getAllThemes().find(t => t.id === selectedThemeId);
            if (!theme) return;

            if (currentMode === 'teacher') {
                // Generer seed og lag spillkode
                const seed = Math.floor(Math.random() * 24000000);
                rng = mulberry32(seed);
                quizData = theme.generate(selectedDifficulty);
                preSeededShuffle = shuffleArray([...Array(12).keys()]);
                rng = Math.random;

                if (theme.isCustom) {
                    const ct = getCustomThemes().find(c => c.id === theme.id);
                    if (ct) currentGameCode = encodeCustomGameCode(ct, seed);
                } else {
                    const themeIndex = BUILTIN_THEME_IDS.indexOf(theme.id);
                    if (themeIndex >= 0) currentGameCode = encodeGameCode(themeIndex, selectedDifficulty, seed);
                }
            } else {
                quizData = theme.generate(selectedDifficulty);
            }

            subtitle = theme.name;
            if (theme.hasDifficulty) {
                const diff = difficulties.find(d => d.id === selectedDifficulty);
                subtitle += ` – ${diff.label}`;
            }
        }

        gameSubtitleEl.textContent = subtitle;
        showScreen('game');
        gameStartTime = Date.now();
        retryCount = 0;
        statsUpdatedThisGame = false;
        initGame();

        // Vis spillkode-banner med QR-kode for lærere
        if (currentGameCode && currentMode === 'teacher') {
            document.getElementById('game-code-display').textContent = currentGameCode;
            codeBanner.classList.remove('hidden');
            updateQRCode();
        }
    } catch(e) {
        console.error('startGame feil:', e);
        showToast('Feil ved oppstart: ' + e.message);
    }
}

function showScreen(screen) {
    currentScreen = screen;
    const editorEl = document.getElementById('custom-theme-editor');

    menuEl.style.display = screen === 'menu' ? '' : 'none';
    appEl.classList.toggle('visible', screen === 'game');
    editorEl.classList.toggle('hidden', screen !== 'editor');

    // Hvis en SW-oppdatering ble utsatt mens brukeren var i spill, last på nytt nå
    if (screen !== 'game' && window._pendingSWReload) {
        window._pendingSWReload = false;
        window.location.reload();
    }
}

function goBackToMenu() {
    showScreen('menu');
    showMenuStep(1);
}

// ============================================
// HJELPEFUNKSJONER
// ============================================

function shuffleArray(arr) {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function isAnswerUsed(answerIndex) {
    return Object.values(matches).includes(answerIndex);
}

function findQuestionUsingAnswer(answerIndex) {
    for (const [qIdx, aIdx] of Object.entries(matches)) {
        if (aIdx === answerIndex) return parseInt(qIdx);
    }
    return null;
}

function matchCount() {
    return Object.keys(matches).length;
}

// ============================================
// INITIALISERING
// ============================================

function initGame() {
    matches = {};
    selectedQuestion = null;
    isChecked = false;
    lockedMatches = new Set();
    _toastShownAt6 = false;
    resultArea.innerHTML = '';
    allMatchedMsg.innerHTML = '';

    if (preSeededShuffle) {
        shuffledAnswerIndices = preSeededShuffle;
        preSeededShuffle = null;
    } else {
        shuffledAnswerIndices = shuffleArray([...Array(12).keys()]);
    }

    render();
    renderRefGrid();
    renderImagePicker();
}

// ============================================
// GJENGIVELSE
// ============================================

function render() {
    renderQuestions();
    renderAnswers();
    renderMatchesList();
    renderUserGrid();
    updateCheckButton();
    updateInstructions();
}

function renderQuestions() {
    questionsList.innerHTML = '';

    quizData.forEach((q, i) => {
        const item = document.createElement('div');
        item.className = 'item';
        item.setAttribute('role', 'listitem');
        item.dataset.index = i;

        const isLocked = lockedMatches.has(i);

        if (selectedQuestion === i) item.classList.add('selected');

        const hasMatch = matches[i] !== undefined;
        if (hasMatch && !isChecked && !isLocked) item.classList.add('matched');

        if (isLocked) {
            item.classList.add('locked');
        } else if (isChecked) {
            item.classList.add('disabled');
            if (hasMatch) {
                item.classList.add(matches[i] === i ? 'correct' : 'incorrect');
            }
        }

        if (hasMatch) {
            const badge = document.createElement('span');
            badge.className = 'match-badge';
            badge.style.background = badgeColors[i];
            badge.textContent = i + 1;
            item.appendChild(badge);
        }

        const text = document.createElement('span');
        text.className = 'item-text';
        text.textContent = q.question;
        item.appendChild(text);

        if (isLocked) {
            const icon = document.createElement('span');
            icon.className = 'result-icon';
            icon.textContent = '✓';
            item.appendChild(icon);
        } else if (isChecked && hasMatch) {
            const icon = document.createElement('span');
            icon.className = 'result-icon';
            icon.textContent = matches[i] === i ? '✓' : '✗';
            item.appendChild(icon);
        }

        if (!isChecked && !isLocked) {
            item.addEventListener('click', () => onQuestionClick(i));
        }

        questionsList.appendChild(item);
    });
}

function renderAnswers() {
    answersList.innerHTML = '';

    shuffledAnswerIndices.forEach(origIndex => {
        const item = document.createElement('div');
        item.className = 'item';
        item.setAttribute('role', 'listitem');
        item.dataset.origIndex = origIndex;

        const used = isAnswerUsed(origIndex);
        const qUsingThis = findQuestionUsingAnswer(origIndex);
        const isLocked = qUsingThis !== null && lockedMatches.has(qUsingThis);

        if (used && !isChecked && !isLocked) item.classList.add('matched');

        if (isLocked) {
            item.classList.add('locked');
        } else if (isChecked) {
            item.classList.add('disabled');
            if (used) {
                item.classList.add(qUsingThis === origIndex ? 'correct' : 'incorrect');
            }
        }

        if (used) {
            const badge = document.createElement('span');
            badge.className = 'match-badge';
            badge.style.background = badgeColors[qUsingThis];
            badge.textContent = qUsingThis + 1;
            item.appendChild(badge);
        }

        const text = document.createElement('span');
        text.className = 'item-text';
        text.textContent = quizData[origIndex].answer;
        item.appendChild(text);

        if (isLocked) {
            const icon = document.createElement('span');
            icon.className = 'result-icon';
            icon.textContent = '✓';
            item.appendChild(icon);
        } else if (isChecked && used) {
            const icon = document.createElement('span');
            icon.className = 'result-icon';
            icon.textContent = qUsingThis === origIndex ? '✓' : '✗';
            item.appendChild(icon);
        }

        if (!isChecked && !isLocked) {
            item.addEventListener('click', () => onAnswerClick(origIndex));
        }

        answersList.appendChild(item);
    });
}

function renderMatchesList() {
    matchCountEl.textContent = `(${matchCount()} / 12)`;

    // Milestone-toast ved halvveis
    if (matchCount() === 6 && !isChecked && !_toastShownAt6) {
        _toastShownAt6 = true;
        showToast('Halvveis! 6 av 12 matcher satt.');
    }

    if (matchCount() === 0) {
        matchesList.innerHTML = '<p class="no-matches">Ingen matcher ennå</p>';
        allMatchedMsg.innerHTML = '';
        return;
    }

    const grid = document.createElement('div');
    grid.className = 'matches-grid';

    const sortedKeys = Object.keys(matches).map(Number).sort((a, b) => a - b);

    sortedKeys.forEach(qIdx => {
        const aIdx = matches[qIdx];
        const entry = document.createElement('div');
        entry.className = 'match-entry';

        const isLocked = lockedMatches.has(qIdx);

        if (isLocked) {
            entry.classList.add('correct');
        } else if (isChecked) {
            entry.classList.add(qIdx === aIdx ? 'correct' : 'incorrect');
        }

        const badge = document.createElement('span');
        badge.className = 'match-badge-small';
        badge.style.background = badgeColors[qIdx];
        badge.textContent = qIdx + 1;
        entry.appendChild(badge);

        const qText = document.createElement('span');
        qText.className = 'match-text';
        qText.textContent = quizData[qIdx].question;
        entry.appendChild(qText);

        const arrow = document.createElement('span');
        arrow.className = 'match-arrow';
        arrow.textContent = '→';
        entry.appendChild(arrow);

        const aText = document.createElement('span');
        aText.className = 'match-text';
        aText.textContent = quizData[aIdx].answer;
        entry.appendChild(aText);

        if (!isChecked && !isLocked) {
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-btn';
            removeBtn.textContent = '×';
            removeBtn.title = 'Fjern match';
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                removeMatch(qIdx);
            });
            entry.appendChild(removeBtn);
        }

        grid.appendChild(entry);
    });

    // Fremdriftslinje
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    const fill = document.createElement('div');
    fill.className = 'progress-fill';
    fill.style.width = `${(matchCount() / 12) * 100}%`;
    progressBar.appendChild(fill);

    matchesList.innerHTML = '';
    matchesList.appendChild(grid);
    matchesList.appendChild(progressBar);

    if (matchCount() === 12 && !isChecked) {
        allMatchedMsg.innerHTML = `<p class="all-matched-message">Alle 12 matcher er satt! ${actionVerb} «Sjekk svar» for å se resultatet.</p>`;
    } else {
        allMatchedMsg.innerHTML = '';
    }
}

function renderUserGrid(justPlaced) {
    const lokoSection = userGrid.closest('.loko-section');
    if (lokoSection) {
        lokoSection.style.display = (currentMode === 'teacher' || isChecked) ? '' : 'none';
    }

    userGrid.innerHTML = '';

    for (let i = 0; i < 12; i++) {
        const brick = document.createElement('div');
        brick.className = 'brick';

        if (matches[i] !== undefined) {
            const style = getBrickStyle(matches[i]);
            brick.style.backgroundImage = style.backgroundImage;
            brick.style.backgroundSize = style.backgroundSize;
            brick.style.backgroundPosition = style.backgroundPosition;
            brick.classList.add('filled');
            if (justPlaced === i) {
                brick.classList.add('just-placed');
            }
        } else {
            brick.classList.add('empty');
        }

        userGrid.appendChild(brick);
    }
}

function renderRefGrid() {
    const refWrapper = refGrid.closest('.loko-grid-wrapper');

    // I elevmodus: skjul fasitmønster inntil svar er sjekket
    if (currentMode === 'student' && !isChecked) {
        refWrapper.style.display = 'none';
    } else {
        refWrapper.style.display = '';
    }

    refGrid.innerHTML = '';

    for (let i = 0; i < 12; i++) {
        const brick = document.createElement('div');
        brick.className = 'brick filled';
        const style = getBrickStyle(i);
        brick.style.backgroundImage = style.backgroundImage;
        brick.style.backgroundSize = style.backgroundSize;
        brick.style.backgroundPosition = style.backgroundPosition;
        refGrid.appendChild(brick);
    }
}

function renderImagePicker() {
    imagePickerRow.innerHTML = '';
    const uploadRow = uploadBtn.parentElement;

    // I elevmodus: skjul bildevelger og opplasting
    if (currentMode === 'student') {
        imagePickerRow.style.display = 'none';
        uploadRow.style.display = 'none';
        return;
    }
    imagePickerRow.style.display = '';
    uploadRow.style.display = '';

    defaultImages.forEach((img, idx) => {
        const thumb = document.createElement('div');
        thumb.className = 'image-thumb' + (selectedImageId === idx ? ' active' : '');
        thumb.style.backgroundImage = `url('${img.url}')`;
        thumb.title = img.name;
        thumb.addEventListener('click', () => {
            selectedImageId = idx;
            puzzleImageUrl = img.url;
            renderImagePicker();
            renderRefGrid();
            renderUserGrid();
            updateQRCode();
        });
        imagePickerRow.appendChild(thumb);
    });
}

function updateCheckButton() {
    const enabled = matchCount() >= 12 && !isChecked;
    checkBtn.disabled = !enabled;
    if (checkHelper) {
        checkHelper.style.display = enabled || isChecked ? 'none' : '';
    }
}

// ============================================
// SPILLLOGIKK
// ============================================

function onQuestionClick(index) {
    if (isChecked) return;

    if (selectedQuestion === index) {
        selectedQuestion = null;
    } else {
        selectedQuestion = index;
    }

    render();
}

function onAnswerClick(answerOrigIndex) {
    if (isChecked) return;
    if (selectedQuestion === null) return;

    const qIdx = selectedQuestion;

    const otherQ = findQuestionUsingAnswer(answerOrigIndex);
    if (otherQ !== null && otherQ !== qIdx) {
        delete matches[otherQ];
    }

    matches[qIdx] = answerOrigIndex;
    selectedQuestion = null;

    playMatchSound();

    renderQuestions();
    renderAnswers();
    renderMatchesList();
    renderUserGrid(qIdx);
    updateCheckButton();
    updateInstructions();
}

function removeMatch(qIdx) {
    if (isChecked || lockedMatches.has(qIdx)) return;

    delete matches[qIdx];

    if (selectedQuestion === qIdx) {
        selectedQuestion = null;
    }

    render();
}

function checkAnswers() {
    if (matchCount() < 12) return;

    isChecked = true;

    let correct = 0;
    for (let i = 0; i < 12; i++) {
        if (matches[i] === i) correct++;
    }

    // Beregn poeng
    const elapsed = gameStartTime ? Math.round((Date.now() - gameStartTime) / 1000) : 0;
    const wrongCount = 12 - correct;
    const baseScore = correct * 100;
    const timePenalty = Math.min(elapsed * 2, 400);
    const wrongPenalty = wrongCount * 30;
    const retryPenalty = retryCount * 80;
    const score = Math.max(0, baseScore - timePenalty - wrongPenalty - retryPenalty);

    // Oppdater statistikk (kun én gang per spill)
    if (!statsUpdatedThisGame) {
        statsUpdatedThisGame = true;
        updateStats(correct, score, elapsed);
    }

    const msg = document.createElement('div');
    msg.className = 'result-message';

    if (correct === 12) {
        msg.classList.add('perfect');
        msg.textContent = `Fantastisk! ${correct} av 12 riktige! 🎉`;
        playCorrectSound();
        showConfetti();
    } else if (correct >= 9) {
        msg.classList.add('good');
        msg.textContent = `Bra jobbet! ${correct} av 12 riktige.`;
        playCorrectSound();
    } else {
        msg.classList.add('poor');
        msg.textContent = `${correct} av 12 riktige.`;
        playIncorrectSound();
    }

    // Vis poeng og tid
    const scoreEl = document.createElement('div');
    scoreEl.className = 'score-display';
    scoreEl.textContent = `⭐ ${score} poeng  •  ⏱ ${elapsed} sek`;

    resultArea.innerHTML = '';
    resultArea.appendChild(msg);
    resultArea.appendChild(scoreEl);

    // Vis "Prøv igjen"-knapp hvis ikke alle er riktige
    if (correct < 12) {
        const retryBtn = document.createElement('button');
        retryBtn.className = 'retry-btn';
        retryBtn.textContent = 'Prøv igjen';
        retryBtn.addEventListener('click', retryWrongAnswers);
        resultArea.appendChild(retryBtn);
    }

    render();
    renderRefGrid();
}

function retryWrongAnswers() {
    retryCount++;
    // Lås riktige matcher og fjern feil
    for (let i = 0; i < 12; i++) {
        if (matches[i] === i) {
            lockedMatches.add(i);
        } else if (matches[i] !== undefined) {
            delete matches[i];
        }
    }

    isChecked = false;
    selectedQuestion = null;
    _toastShownAt6 = false;
    resultArea.innerHTML = '';
    allMatchedMsg.innerHTML = '';

    render();
    renderRefGrid();
    renderImagePicker();
    updateCheckButton();
}

function resetGame() {
    lockedMatches = new Set();
    gameStartTime = Date.now();
    retryCount = 0;
    statsUpdatedThisGame = false;
    initGame();
}

// ============================================
// KONFETTIANIMASJON
// ============================================

function showConfetti() {
    const ctx = confettiCanvas.getContext('2d');
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;

    const colors = ['#E74C3C', '#3498DB', '#2ECC71', '#F1C40F', '#9B59B6', '#E67E22', '#1ABC9C', '#E91E63'];

    const particles = [];
    for (let i = 0; i < 180; i++) {
        particles.push({
            x: Math.random() * confettiCanvas.width,
            y: -Math.random() * confettiCanvas.height * 0.6 - 20,
            vx: (Math.random() - 0.5) * 5,
            vy: Math.random() * 3 + 1.5,
            color: colors[Math.floor(Math.random() * colors.length)],
            w: Math.random() * 10 + 4,
            h: Math.random() * 6 + 3,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.15,
        });
    }

    let frame = 0;
    const maxFrames = 220;

    function animate() {
        ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

        particles.forEach(p => {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();

            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.04;
            p.rotation += p.rotSpeed;
            p.vx *= 0.99;
        });

        frame++;
        if (frame < maxFrames) {
            requestAnimationFrame(animate);
        } else {
            ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        }
    }

    animate();
}

// ============================================
// EVENT LISTENERS
// ============================================

nesteBtnEl.addEventListener('click', () => {
    const theme = getAllThemes().find(t => t.id === selectedThemeId);
    if (theme && theme.hasDifficulty) {
        showMenuStep(2);
    } else {
        startGame();
    }
});

backStepBtnEl.addEventListener('click', () => showMenuStep(1));

startBtnEl.addEventListener('click', () => startGame());
backBtnEl.addEventListener('click', () => {
    if (matchCount() > 0 && !isChecked) {
        if (confirm('Du har ulagrede matcher. Vil du gå tilbake til menyen?')) {
            goBackToMenu();
        }
    } else {
        goBackToMenu();
    }
});
checkBtn.addEventListener('click', checkAnswers);
resetBtn.addEventListener('click', () => {
    if (matchCount() > 0) {
        if (confirm('Nullstille alle matcher?')) {
            resetGame();
        }
    } else {
        resetGame();
    }
});

// Spillkode – koble til
document.getElementById('join-game-btn').addEventListener('click', joinGameFromCode);
document.getElementById('game-code-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') joinGameFromCode();
});
document.getElementById('copy-link-btn').addEventListener('click', () => {
    const code = document.getElementById('game-code-display').textContent;
    let url = window.location.origin + window.location.pathname + '?code=' + encodeURIComponent(code);
    if (selectedImageId >= 0) url += '&img=' + selectedImageId;
    navigator.clipboard.writeText(url).then(() => {
        const btn = document.getElementById('copy-link-btn');
        btn.textContent = '✓ Kopiert!';
        setTimeout(() => btn.textContent = '📋 Kopier lenke', 2000);
    });
});

function joinGameFromCode() {
    const input = document.getElementById('game-code-input');
    const errorEl = document.getElementById('game-code-error');
    const code = input.value.trim();
    errorEl.classList.add('hidden');

    if (!code) return;

    // Prøv kort kode (innebygd tema)
    const decoded = decodeGameCode(code);
    if (decoded) {
        const theme = themes.find(t => t.id === decoded.themeId);
        if (theme) {
            const diff = difficulties.find(d => d.id === decoded.difficultyId);
            let subtitle = theme.name;
            if (theme.hasDifficulty && diff) subtitle += ` – ${diff.label}`;

            startGame(true, {
                theme: theme,
                difficulty: decoded.difficultyId,
                seed: decoded.seed,
                subtitle: subtitle
            });
            input.value = '';
            return;
        }
    }

    // Prøv lang kode (egendefinert tema)
    const customData = decodeCustomGameCode(code);
    if (customData) {
        const tempTheme = {
            id: 'shared_custom',
            name: customData.name,
            icon: customData.icon,
            hasDifficulty: false,
            generate: () => [...customData.pairs],
        };
        startGame(true, {
            theme: tempTheme,
            difficulty: null,
            seed: customData.seed,
            subtitle: customData.name
        });
        input.value = '';
        return;
    }

    // Ugyldig kode
    errorEl.textContent = 'Ugyldig spillkode';
    errorEl.classList.remove('hidden');
}

uploadBtn.addEventListener('click', () => imageInput.click());
imageInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
        handleImageUpload(e.target.files[0]);
        selectedImageId = -1;
        renderImagePicker();
        imageInput.value = '';
    }
});

window.addEventListener('resize', () => {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
});

window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
    }, 100);
});

// ============================================
// OPPSTART
// ============================================
generateAllDefaultImages();
puzzleImageUrl = defaultImages[0].url;

// Auto-lisens fra URL-parameter (?license=...)
(function() {
    const params = new URLSearchParams(window.location.search);
    const licenseParam = params.get('license');
    if (licenseParam && validateLicenseKey(licenseParam)) {
        setStoredLicense(licenseParam);
    }
})();

checkLicense();
renderModeOptions();
renderMenu();

// Auto-start fra URL-parameter (?code=...)
(function() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
        // Sett bilde fra URL-parameter (?img=...)
        const imgParam = params.get('img');
        if (imgParam !== null) {
            const imgIdx = parseInt(imgParam, 10);
            if (!isNaN(imgIdx) && imgIdx >= 0 && imgIdx < defaultImages.length) {
                selectedImageId = imgIdx;
                puzzleImageUrl = defaultImages[imgIdx].url;
            }
        }
        // Fjern parametere fra URL-en uten reload
        window.history.replaceState({}, '', window.location.pathname);
        // Sett koden i input og start
        document.getElementById('game-code-input').value = code;
        joinGameFromCode();
    }
})();

// ============================================
// QR-SCANNER (innebygd kamera-skanner)
// Bruker BarcodeDetector der tilgjengelig, jsQR som fallback
// ============================================
(function() {
    const scanBtn = document.getElementById('scan-qr-btn');
    const overlay = document.getElementById('qr-scanner-overlay');
    const video = document.getElementById('qr-scanner-video');
    const canvas = document.getElementById('qr-scanner-canvas');
    const closeBtn = document.getElementById('qr-scanner-close');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    let stream = null;
    let scanning = false;
    let jsQRLoaded = false;

    // BarcodeDetector (innebygd i Safari 16.4+, Chrome 83+)
    const hasBarcodeDetector = typeof BarcodeDetector !== 'undefined';
    let detector = null;
    if (hasBarcodeDetector) {
        try { detector = new BarcodeDetector({ formats: ['qr_code'] }); } catch(e) {}
    }

    // Last jsQR fra CDN som fallback
    function loadJsQR() {
        return new Promise((resolve, reject) => {
            if (window.jsQR) { jsQRLoaded = true; resolve(); return; }
            const s = document.createElement('script');
            s.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
            s.onload = () => { jsQRLoaded = true; resolve(); };
            s.onerror = reject;
            document.head.appendChild(s);
        });
    }

    function stopScanner() {
        scanning = false;
        if (stream) {
            stream.getTracks().forEach(t => t.stop());
            stream = null;
        }
        video.srcObject = null;
        overlay.classList.add('hidden');
    }

    function handleQrResult(url) {
        stopScanner();
        try {
            const parsed = new URL(url);
            const params = new URLSearchParams(parsed.search);
            const license = params.get('license');
            if (license && validateLicenseKey(license)) {
                setStoredLicense(license);
                checkLicense();
            }
            const code = params.get('code');
            if (code) {
                const imgParam = params.get('img');
                if (imgParam !== null) {
                    const imgIdx = parseInt(imgParam, 10);
                    if (!isNaN(imgIdx) && imgIdx >= 0 && imgIdx < defaultImages.length) {
                        selectedImageId = imgIdx;
                        puzzleImageUrl = defaultImages[imgIdx].url;
                    }
                }
                document.getElementById('game-code-input').value = code;
                joinGameFromCode();
            }
        } catch (e) {
            document.getElementById('game-code-input').value = url;
            joinGameFromCode();
        }
    }

    async function scanFrame() {
        if (!scanning) return;
        if (video.readyState !== video.HAVE_ENOUGH_DATA) {
            requestAnimationFrame(scanFrame);
            return;
        }
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        // Prøv BarcodeDetector først
        if (detector) {
            try {
                const barcodes = await detector.detect(canvas);
                if (barcodes.length > 0) {
                    handleQrResult(barcodes[0].rawValue);
                    return;
                }
            } catch (e) {}
        }

        // Fallback: jsQR
        if (jsQRLoaded && window.jsQR) {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const result = window.jsQR(imageData.data, canvas.width, canvas.height, {
                inversionAttempts: 'dontInvert'
            });
            if (result && result.data) {
                handleQrResult(result.data);
                return;
            }
        }

        requestAnimationFrame(scanFrame);
    }

    scanBtn.addEventListener('click', async () => {
        // Last jsQR i bakgrunnen hvis BarcodeDetector ikke finnes
        if (!detector && !jsQRLoaded) {
            try {
                await loadJsQR();
            } catch (e) {
                alert('Kunne ikke laste QR-skanner. Sjekk internettforbindelsen, eller skriv inn koden manuelt.');
                return;
            }
        }

        overlay.classList.remove('hidden');
        scanning = true;
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
            });
            video.srcObject = stream;
            video.play();
            // Liten forsinkelse for at kameraet starter
            setTimeout(scanFrame, 300);
        } catch (e) {
            stopScanner();
            alert('Kunne ikke åpne kameraet. Sjekk at appen har tilgang til kamera.');
        }
    });

    closeBtn.addEventListener('click', stopScanner);

    // Pre-last jsQR i bakgrunnen hvis BarcodeDetector mangler
    if (!detector) {
        loadJsQR().catch(() => {});
    }
})();

// Registrer Service Worker for PWA-støtte med auto-oppdatering
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(reg => {
        // Sjekk for oppdateringer regelmessig (hvert 60. sekund)
        setInterval(() => reg.update(), 60000);
        reg.addEventListener('updatefound', () => {
            const newSW = reg.installing;
            if (newSW) {
                newSW.addEventListener('statechange', () => {
                    if (newSW.state === 'activated' && navigator.serviceWorker.controller) {
                        // Ikke kast brukeren ut av et pågående spill – utsett til menyen
                        if (currentScreen === 'game') {
                            window._pendingSWReload = true;
                        } else {
                            window.location.reload();
                        }
                    }
                });
            }
        });
    }).catch(() => {});
}
