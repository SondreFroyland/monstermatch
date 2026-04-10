// ============================================
// MATTEGENERATOR
// ============================================

function getDiffRange(diff) {
    if (diff === 'easy')    return { min: 1,   max: 10 };
    if (diff === 'medium')  return { min: 1,   max: 20 };
    if (diff === 'hard')    return { min: 1,   max: 50 };
    if (diff === 'vhard')   return { min: 50,  max: 100 };
    if (diff === 'extreme') return { min: 100, max: 1000 };
    return { min: 1, max: 50 };
}

function randInt(min, max) {
    return Math.floor(rng() * (max - min + 1)) + min;
}

function generateMathQuiz(op, difficulty) {
    const { min, max } = getDiffRange(difficulty);
    const usedAnswers = new Set();
    const items = [];
    let attempts = 0;

    while (items.length < 12 && attempts < 5000) {
        attempts++;
        let a, b, question, answer;

        if (op === '+') {
            if (difficulty === 'easy') {
                a = randInt(1, 10); b = randInt(1, 10);       // svar 2-20
            } else if (difficulty === 'medium') {
                a = randInt(5, 30); b = randInt(5, 30);       // svar 10-60
            } else if (difficulty === 'hard') {
                a = randInt(10, 100); b = randInt(10, 100);   // svar 20-200
            } else if (difficulty === 'vhard') {
                a = randInt(50, 500); b = randInt(50, 500);   // svar 100-1000
            } else {
                a = randInt(100, 5000); b = randInt(100, 5000); // svar 200-10000
            }
            question = `${a} + ${b}`;
            answer = a + b;
        } else if (op === '−') {
            if (difficulty === 'easy') {
                a = randInt(2, 15); b = randInt(1, a - 1);    // svar 1-14
            } else if (difficulty === 'medium') {
                a = randInt(10, 40); b = randInt(1, a - 1);   // svar 1-39
            } else if (difficulty === 'hard') {
                a = randInt(20, 100); b = randInt(1, a - 1);  // svar 1-99
            } else if (difficulty === 'vhard') {
                a = randInt(50, 500); b = randInt(1, a - 1);  // svar 1-499
            } else {
                a = randInt(500, 5000); b = randInt(1, a - 1); // svar 1-4999
            }
            question = `${a} − ${b}`;
            answer = a - b;
        } else if (op === '×') {
            if (difficulty === 'extreme') {
                // 20-100 × 10-50 → svar ~200-5000
                a = randInt(20, 100);
                b = randInt(10, 50);
            } else if (difficulty === 'vhard') {
                // 10-30 × 5-20 → svar ~50-600
                a = randInt(10, 30);
                b = randInt(5, 20);
            } else if (difficulty === 'hard') {
                // 5-15 × 3-12 → svar ~15-180
                a = randInt(5, 15);
                b = randInt(3, 12);
            } else if (difficulty === 'medium') {
                // 2-10 × 2-10 → svar 4-100 (gangetabellen)
                a = randInt(2, 10);
                b = randInt(2, 10);
            } else {
                // Easy: 2-5 × 2-5 → svar 4-25 (enkel gangetabell)
                a = randInt(2, 5);
                b = randInt(2, 5);
            }
            question = `${a} × ${b}`;
            answer = a * b;
        } else if (op === '÷') {
            if (difficulty === 'extreme') {
                // f.eks. 1440 ÷ 32 = 45
                b = randInt(12, 50);
                answer = randInt(10, 100);
            } else if (difficulty === 'vhard') {
                // f.eks. 168 ÷ 12 = 14
                b = randInt(6, 20);
                answer = randInt(5, 30);
            } else if (difficulty === 'hard') {
                // f.eks. 72 ÷ 8 = 9
                b = randInt(3, 12);
                answer = randInt(2, 15);
            } else if (difficulty === 'medium') {
                // f.eks. 36 ÷ 6 = 6
                b = randInt(2, 10);
                answer = randInt(2, 10);
            } else {
                // Easy: f.eks. 15 ÷ 3 = 5
                b = randInt(2, 5);
                answer = randInt(1, 12);
            }
            a = b * answer;
            question = `${a} ÷ ${b}`;
        }

        const answerStr = String(answer);

        if (!usedAnswers.has(answerStr)) {
            usedAnswers.add(answerStr);
            items.push({ question, answer: answerStr });
        }
    }

    // Sikkerhetsnett: Fyll opp med enkle oppgaver hvis ikke nok unike
    let fallbackN = 50;
    while (items.length < 12) {
        fallbackN++;
        const answerStr = String(fallbackN);
        if (!usedAnswers.has(answerStr)) {
            usedAnswers.add(answerStr);
            if (op === '+') items.push({ question: `${fallbackN} + 0`, answer: answerStr });
            else if (op === '−') items.push({ question: `${fallbackN} − 0`, answer: answerStr });
            else if (op === '×') items.push({ question: `${fallbackN} × 1`, answer: answerStr });
            else if (op === '÷') items.push({ question: `${fallbackN} ÷ 1`, answer: answerStr });
        }
    }

    return items;
}
