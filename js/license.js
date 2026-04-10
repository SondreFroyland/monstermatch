// ============================================
// LISENSHÅNDTERING
// ============================================

const LICENSE_STORAGE_KEY = 'loko_license';
const _C = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const _S = [83,107,48,108,101,70,106,111,114,76,79,75,79].map(c => String.fromCharCode(c)).join('');

function _computeChecksum(base) {
    let h = 0x5F3A1B;
    for (let i = 0; i < base.length; i++) {
        h = ((h << 5) - h + base.charCodeAt(i) + _S.charCodeAt(i % _S.length)) | 0;
        h = ((h >>> 0) * 0x45D9F3B) >>> 0;
    }
    let result = '';
    for (let i = 0; i < 5; i++) {
        h = ((h * 0x41C64E6D + 0x3039) >>> 0);
        result += _C[(h >>> 16) % _C.length];
    }
    return result;
}

function validateLicenseKey(key) {
    const clean = key.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (clean.length !== 19) return false;
    if (clean.substring(0, 4) !== 'LOKO') return false;
    const base = clean.substring(4, 14);
    const check = clean.substring(14, 19);
    for (let i = 0; i < base.length; i++) {
        if (_C.indexOf(base[i]) === -1) return false;
    }
    return _computeChecksum(base) === check;
}

function getStoredLicense() {
    var ls = localStorage.getItem(LICENSE_STORAGE_KEY);
    if (ls) return ls;
    // Fallback: les fra cookie (deles mellom Safari og PWA på iOS)
    var match = document.cookie.match(/loko_license=([^;]+)/);
    if (match) {
        localStorage.setItem(LICENSE_STORAGE_KEY, match[1]);
        return match[1];
    }
    return null;
}

function setStoredLicense(key) {
    localStorage.setItem(LICENSE_STORAGE_KEY, key);
    document.cookie = 'loko_license=' + key + ';path=/;max-age=31536000;SameSite=Lax';
}

function checkLicense() {
    // Viser aldri lisensskjermen ved lasting – kun når en funksjon krever tilgang
    const licenseScreen = document.getElementById('license-screen');
    licenseScreen.classList.add('hidden');
    document.getElementById('menu').style.display = '';
}

function activateLicense() {
    const input = document.getElementById('license-input');
    const errorEl = document.getElementById('license-error');
    const successEl = document.getElementById('license-success');
    const key = input.value.trim();

    errorEl.textContent = '\u00A0';
    errorEl.classList.remove('hidden');
    successEl.classList.add('hidden');
    input.classList.remove('error', 'success');

    if (!key) {
        errorEl.textContent = 'Skriv inn en lisenskode';
        input.classList.add('error');
        return;
    }

    if (validateLicenseKey(key)) {
        setStoredLicense(key);
        input.classList.add('success');
        errorEl.classList.add('hidden');
        successEl.textContent = 'Lisens aktivert!';
        successEl.classList.remove('hidden');
        setTimeout(() => {
            document.getElementById('license-screen').classList.add('hidden');
            document.getElementById('menu').style.display = '';
            renderMenu();
            if (_pendingStartArgs) {
                _pendingDemoStart = true;
                startGame(..._pendingStartArgs);
            }
        }, 1000);
    } else {
        errorEl.textContent = 'Ugyldig lisenskode';
        input.classList.add('error');
    }
}

// Formatering av lisenskode-input
function formatLicenseInput(e) {
    const input = e.target;
    let val = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Legg til LOKO-prefix automatisk hvis brukeren ikke har skrevet det
    if (val.length > 0 && !val.startsWith('LOKO')) {
        // Sjekk om de skriver starten av LOKO
        const lokoPrefix = 'LOKO';
        let isTypingLoko = true;
        for (let i = 0; i < Math.min(val.length, 4); i++) {
            if (val[i] !== lokoPrefix[i]) { isTypingLoko = false; break; }
        }
        if (!isTypingLoko) {
            val = 'LOKO' + val;
        }
    }

    // Begrens til 19 tegn (LOKO + 15 tegn)
    if (val.length > 19) val = val.substring(0, 19);

    // Formater med bindestreker: LOKO-XXXXX-XXXXX-XXXXX
    let formatted = '';
    for (let i = 0; i < val.length; i++) {
        if (i === 4 || i === 9 || i === 14) formatted += '-';
        formatted += val[i];
    }

    input.value = formatted;
}

// Event listeners for lisensskjerm
document.getElementById('license-activate-btn').addEventListener('click', activateLicense);
document.getElementById('license-input').addEventListener('input', formatLicenseInput);
document.getElementById('license-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') activateLicense();
});
