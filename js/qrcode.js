// ============================================
// SPILLKODE-SYSTEM (Seeded PRNG)
// ============================================

let rng = Math.random;

function mulberry32(seed) {
    return function() {
        seed |= 0;
        seed = seed + 0x6D2B79F5 | 0;
        let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

// ============================================
// QR-KODE GENERATOR
// Copyright (c) Project Nayuki. (MIT License)
// https://www.nayuki.io/page/qr-code-generator-library
// Ported to plain JavaScript IIFE for embedding.
// ============================================
const QrCode = (function() {
    const ECC_CODEWORDS_PER_BLOCK = [
        [-1,7,10,15,20,26,18,20,24,30,18,20,24,26,30,22,24,28,30,28,28,28,28,30,30,26,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30],
        [-1,10,16,26,18,24,16,18,22,22,26,30,22,22,24,24,28,28,26,26,26,26,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28],
        [-1,13,22,18,26,18,24,18,22,20,24,28,26,24,20,30,24,28,28,26,30,28,30,30,30,30,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30],
        [-1,17,28,22,16,22,28,26,26,24,28,24,28,22,24,24,30,28,28,26,28,30,24,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30],
    ];
    const NUM_ERROR_CORRECTION_BLOCKS = [
        [-1,1,1,1,1,1,2,2,2,2,4,4,4,4,4,6,6,6,6,7,8,8,9,9,10,12,12,12,13,14,15,16,17,18,19,19,20,21,22,24,25],
        [-1,1,1,1,2,2,4,4,4,5,5,5,8,9,9,10,10,11,13,14,16,17,17,18,20,21,23,25,26,28,29,31,33,35,37,38,40,43,45,47,49],
        [-1,1,1,2,2,4,4,6,6,8,8,8,10,12,16,12,17,16,18,21,20,23,23,25,27,29,34,34,35,38,40,43,45,48,51,53,56,59,62,65,68],
        [-1,1,1,2,4,4,4,5,6,8,8,11,11,16,16,18,16,19,21,25,25,25,34,30,32,35,37,40,42,45,48,51,54,57,60,63,66,70,74,77,81],
    ];
    // ECL formatBits: LOW=1, MEDIUM=0, QUARTILE=3, HIGH=2
    const ECL_FORMATBITS = [1, 0, 3, 2];

    function getNumRawDataModules(ver) {
        let result = (16 * ver + 128) * ver + 64;
        if (ver >= 2) {
            const numAlign = Math.floor(ver / 7) + 2;
            result -= (25 * numAlign - 10) * numAlign - 55;
            if (ver >= 7) result -= 36;
        }
        return result;
    }

    function getNumDataCodewords(ver, ecl) {
        return Math.floor(getNumRawDataModules(ver) / 8) -
            ECC_CODEWORDS_PER_BLOCK[ecl][ver] * NUM_ERROR_CORRECTION_BLOCKS[ecl][ver];
    }

    function getAlignmentPatternPositions(ver) {
        if (ver === 1) return [];
        const numAlign = Math.floor(ver / 7) + 2;
        const step = (ver === 32) ? 26 :
            Math.floor((ver * 8 + numAlign * 3 + 5) / (numAlign * 4 - 4)) * 2;
        const result = [6];
        for (let pos = ver * 4 + 10; result.length < numAlign; pos -= step)
            result.splice(1, 0, pos);
        return result;
    }

    function reedSolomonComputeDivisor(degree) {
        const result = [];
        for (let i = 0; i < degree - 1; i++) result.push(0);
        result.push(1);
        let root = 1;
        for (let i = 0; i < degree; i++) {
            for (let j = 0; j < result.length; j++) {
                result[j] = reedSolomonMultiply(result[j], root);
                if (j + 1 < result.length) result[j] ^= result[j + 1];
            }
            root = reedSolomonMultiply(root, 0x02);
        }
        return result;
    }

    function reedSolomonComputeRemainder(data, divisor) {
        const result = divisor.map(() => 0);
        for (const b of data) {
            const factor = b ^ result.shift();
            result.push(0);
            divisor.forEach((coef, i) => result[i] ^= reedSolomonMultiply(coef, factor));
        }
        return result;
    }

    function reedSolomonMultiply(x, y) {
        let z = 0;
        for (let i = 7; i >= 0; i--) {
            z = (z << 1) ^ ((z >>> 7) * 0x11D);
            z ^= ((y >>> i) & 1) * x;
        }
        return z;
    }

    function getBit(x, i) { return ((x >>> i) & 1) !== 0; }

    function toUtf8ByteArray(str) {
        str = encodeURI(str);
        const result = [];
        for (let i = 0; i < str.length; i++) {
            if (str.charAt(i) !== '%') result.push(str.charCodeAt(i));
            else { result.push(parseInt(str.substring(i + 1, i + 3), 16)); i += 2; }
        }
        return result;
    }

    function encode(text, ecl) {
        // ecl: 0=LOW, 1=MEDIUM, 2=QUARTILE, 3=HIGH
        const dataBytes = toUtf8ByteArray(text);

        // Find minimal version
        let version, dataUsedBits;
        for (version = 1; version <= 40; version++) {
            const dataCapacityBits = getNumDataCodewords(version, ecl) * 8;
            const ccbits = (version <= 9) ? 8 : 16;
            const usedBits = 4 + ccbits + dataBytes.length * 8;
            if (usedBits <= dataCapacityBits) { dataUsedBits = usedBits; break; }
        }
        if (version > 40) throw new Error('Data too long');

        // Build bit buffer: mode indicator + char count + data + terminator + padding
        const dataCapacityBits = getNumDataCodewords(version, ecl) * 8;
        const bb = [];
        const appendBits = (val, len) => { for (let i = len - 1; i >= 0; i--) bb.push((val >>> i) & 1); };

        appendBits(0x4, 4); // Byte mode indicator
        appendBits(dataBytes.length, version <= 9 ? 8 : 16);
        for (const b of dataBytes) appendBits(b, 8);
        appendBits(0, Math.min(4, dataCapacityBits - bb.length));
        appendBits(0, (8 - bb.length % 8) % 8);
        for (let padByte = 0xEC; bb.length < dataCapacityBits; padByte ^= 0xEC ^ 0x11)
            appendBits(padByte, 8);

        // Pack bits into bytes
        const dataCodewords = [];
        while (dataCodewords.length * 8 < bb.length) dataCodewords.push(0);
        bb.forEach((b, i) => dataCodewords[i >>> 3] |= b << (7 - (i & 7)));

        // === Build QR Code ===
        const size = version * 4 + 17;
        const modules = Array.from({length: size}, () => new Array(size).fill(false));
        const isFunction = Array.from({length: size}, () => new Array(size).fill(false));
        const setFunctionModule = (x, y, val) => { modules[y][x] = val; isFunction[y][x] = true; };

        // Draw timing patterns first (will be partially overwritten by finders)
        for (let i = 0; i < size; i++) {
            setFunctionModule(6, i, i % 2 === 0);
            setFunctionModule(i, 6, i % 2 === 0);
        }

        // Draw 3 finder patterns (overwrites some timing modules)
        for (const [cx, cy] of [[3, 3], [size - 4, 3], [3, size - 4]]) {
            for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
                const xx = cx + dx, yy = cy + dy;
                if (0 <= xx && xx < size && 0 <= yy && yy < size)
                    setFunctionModule(xx, yy, Math.max(Math.abs(dx), Math.abs(dy)) !== 2 && Math.max(Math.abs(dx), Math.abs(dy)) !== 4);
            }
        }

        // Draw alignment patterns
        const alignPatPos = getAlignmentPatternPositions(version);
        const numAlign = alignPatPos.length;
        for (let i = 0; i < numAlign; i++) for (let j = 0; j < numAlign; j++) {
            if ((i === 0 && j === 0) || (i === 0 && j === numAlign - 1) || (i === numAlign - 1 && j === 0)) continue;
            for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++)
                setFunctionModule(alignPatPos[i] + dx, alignPatPos[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
        }

        // Draw format bits (dummy, mask=0) and version bits — marks as function modules
        drawFormatBits(0);
        drawVersion();

        // === ECC and interleave (Nayuki's addEccAndInterleave) ===
        const numBlocks = NUM_ERROR_CORRECTION_BLOCKS[ecl][version];
        const blockEccLen = ECC_CODEWORDS_PER_BLOCK[ecl][version];
        const rawCodewords = Math.floor(getNumRawDataModules(version) / 8);
        const numShortBlocks = numBlocks - rawCodewords % numBlocks;
        const shortBlockLen = Math.floor(rawCodewords / numBlocks);
        const rsDiv = reedSolomonComputeDivisor(blockEccLen);

        const blocks = [];
        for (let i = 0, k = 0; i < numBlocks; i++) {
            const dat = dataCodewords.slice(k, k + shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1));
            k += dat.length;
            const ecc = reedSolomonComputeRemainder(dat, rsDiv);
            if (i < numShortBlocks) dat.push(0);
            blocks.push(dat.concat(ecc));
        }

        const allCodewords = [];
        for (let i = 0; i < blocks[0].length; i++) {
            blocks.forEach((block, j) => {
                if (i !== shortBlockLen - blockEccLen || j >= numShortBlocks)
                    allCodewords.push(block[i]);
            });
        }

        // === Draw codewords ===
        let bitIdx = 0;
        for (let right = size - 1; right >= 1; right -= 2) {
            if (right === 6) right = 5;
            for (let vert = 0; vert < size; vert++) {
                for (let j = 0; j < 2; j++) {
                    const x = right - j;
                    const upward = ((right + 1) & 2) === 0;
                    const y = upward ? size - 1 - vert : vert;
                    if (!isFunction[y][x] && bitIdx < allCodewords.length * 8) {
                        modules[y][x] = getBit(allCodewords[bitIdx >>> 3], 7 - (bitIdx & 7));
                        bitIdx++;
                    }
                }
            }
        }

        // === Masking ===
        let bestMask = -1, minPenalty = Infinity;
        for (let m = 0; m < 8; m++) {
            applyMask(m);
            drawFormatBits(m);
            const penalty = getPenaltyScore();
            if (penalty < minPenalty) { bestMask = m; minPenalty = penalty; }
            applyMask(m); // Undo via XOR
        }
        applyMask(bestMask);
        drawFormatBits(bestMask);

        return { size, modules };

        // --- Helper functions (closure over modules/isFunction/size/version/ecl) ---

        function drawFormatBits(mask) {
            const data = ECL_FORMATBITS[ecl] << 3 | mask;
            let rem = data;
            for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
            const bits = (data << 10 | rem) ^ 0x5412;
            // First copy
            for (let i = 0; i <= 5; i++) setFunctionModule(8, i, getBit(bits, i));
            setFunctionModule(8, 7, getBit(bits, 6));
            setFunctionModule(8, 8, getBit(bits, 7));
            setFunctionModule(7, 8, getBit(bits, 8));
            for (let i = 9; i < 15; i++) setFunctionModule(14 - i, 8, getBit(bits, i));
            // Second copy
            for (let i = 0; i < 8; i++) setFunctionModule(size - 1 - i, 8, getBit(bits, i));
            for (let i = 8; i < 15; i++) setFunctionModule(8, size - 15 + i, getBit(bits, i));
            setFunctionModule(8, size - 8, true); // Always dark
        }

        function drawVersion() {
            if (version < 7) return;
            let rem = version;
            for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
            const bits = version << 12 | rem;
            for (let i = 0; i < 18; i++) {
                const color = getBit(bits, i);
                const a = size - 11 + i % 3, b = Math.floor(i / 3);
                setFunctionModule(a, b, color);
                setFunctionModule(b, a, color);
            }
        }

        function applyMask(mask) {
            for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
                let invert;
                switch (mask) {
                    case 0: invert = (x + y) % 2 === 0; break;
                    case 1: invert = y % 2 === 0; break;
                    case 2: invert = x % 3 === 0; break;
                    case 3: invert = (x + y) % 3 === 0; break;
                    case 4: invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
                    case 5: invert = x * y % 2 + x * y % 3 === 0; break;
                    case 6: invert = (x * y % 2 + x * y % 3) % 2 === 0; break;
                    case 7: invert = ((x + y) % 2 + x * y % 3) % 2 === 0; break;
                }
                if (!isFunction[y][x] && invert) modules[y][x] = !modules[y][x];
            }
        }

        function getPenaltyScore() {
            let result = 0;
            // Adjacent modules in row having same color, and finder-like patterns
            for (let y = 0; y < size; y++) {
                let runColor = false, runX = 0;
                const runHistory = [0,0,0,0,0,0,0];
                for (let x = 0; x < size; x++) {
                    if (modules[y][x] === runColor) {
                        runX++;
                        if (runX === 5) result += 3;
                        else if (runX > 5) result++;
                    } else {
                        finderPenaltyAddHistory(runX, runHistory);
                        if (!runColor) result += finderPenaltyCountPatterns(runHistory) * 40;
                        runColor = modules[y][x];
                        runX = 1;
                    }
                }
                result += finderPenaltyTerminateAndCount(runColor, runX, runHistory) * 40;
            }
            // Adjacent modules in column having same color, and finder-like patterns
            for (let x = 0; x < size; x++) {
                let runColor = false, runY = 0;
                const runHistory = [0,0,0,0,0,0,0];
                for (let y = 0; y < size; y++) {
                    if (modules[y][x] === runColor) {
                        runY++;
                        if (runY === 5) result += 3;
                        else if (runY > 5) result++;
                    } else {
                        finderPenaltyAddHistory(runY, runHistory);
                        if (!runColor) result += finderPenaltyCountPatterns(runHistory) * 40;
                        runColor = modules[y][x];
                        runY = 1;
                    }
                }
                result += finderPenaltyTerminateAndCount(runColor, runY, runHistory) * 40;
            }
            // 2x2 blocks of modules having same color
            for (let y = 0; y < size - 1; y++) for (let x = 0; x < size - 1; x++) {
                const c = modules[y][x];
                if (c === modules[y][x+1] && c === modules[y+1][x] && c === modules[y+1][x+1]) result += 3;
            }
            // Balance of dark and light modules
            let dark = 0;
            for (const row of modules) dark = row.reduce((s, c) => s + (c ? 1 : 0), dark);
            const total = size * size;
            const k = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1;
            result += k * 10;
            return result;
        }

        function finderPenaltyCountPatterns(runHistory) {
            const n = runHistory[1];
            const core = n > 0 && runHistory[2] === n && runHistory[3] === n * 3 && runHistory[4] === n && runHistory[5] === n;
            return (core && runHistory[0] >= n * 4 && runHistory[6] >= n ? 1 : 0)
                 + (core && runHistory[6] >= n * 4 && runHistory[0] >= n ? 1 : 0);
        }

        function finderPenaltyTerminateAndCount(currentRunColor, currentRunLength, runHistory) {
            if (currentRunColor) { finderPenaltyAddHistory(currentRunLength, runHistory); currentRunLength = 0; }
            currentRunLength += size;
            finderPenaltyAddHistory(currentRunLength, runHistory);
            return finderPenaltyCountPatterns(runHistory);
        }

        function finderPenaltyAddHistory(currentRunLength, runHistory) {
            if (runHistory[0] === 0) currentRunLength += size;
            runHistory.pop();
            runHistory.unshift(currentRunLength);
        }
    }

    return { encode };
})();

function renderQRToCanvas(canvas, qr) {
    const quietZone = 2;
    const totalModules = qr.size + quietZone * 2;
    const dpr = window.devicePixelRatio || 1;
    const displaySize = 160;
    const moduleSize = Math.max(2, Math.ceil((displaySize * dpr) / totalModules));
    const canvasSize = totalModules * moduleSize;

    canvas.width = canvasSize;
    canvas.height = canvasSize;
    canvas.style.width = displaySize + 'px';
    canvas.style.height = displaySize + 'px';

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    ctx.fillStyle = '#000000';
    for (let y = 0; y < qr.size; y++) {
        for (let x = 0; x < qr.size; x++) {
            if (qr.modules[y][x]) {
                ctx.fillRect((x + quietZone) * moduleSize, (y + quietZone) * moduleSize, moduleSize, moduleSize);
            }
        }
    }
}

function updateQRCode() {
    const code = document.getElementById('game-code-display').textContent;
    if (!code) return;
    let url = window.location.origin + window.location.pathname + '?code=' + encodeURIComponent(code);
    if (selectedImageId >= 0) url += '&img=' + selectedImageId;
    const storedLicense = getStoredLicense();
    if (storedLicense) url += '&license=' + encodeURIComponent(storedLicense);
    const canvas = document.getElementById('qr-canvas');
    try {
        const qr = QrCode.encode(url, 0); // 0 = LOW error correction
        renderQRToCanvas(canvas, qr);
        canvas.style.display = 'block';
    } catch (e) {
        console.warn('QR-generering feilet:', e);
        canvas.style.display = 'none';
    }
}
