/* ============================================
   TYPEFLOW - Typing Test Engine
   ============================================ */

// ============================================
// TYPING TEST STATE
// ============================================
const TypingTestState = {
    difficulty: 'easy',
    timerDuration: 60,
    timeLeft: 60,
    isRunning: false,
    isFinished: false,
    timerInterval: null,
    currentWordIndex: 0,
    currentCharIndex: 0,
    totalKeystrokes: 0,
    correctKeystrokes: 0,
    errors: 0,
    words: [],
    typedWords: [],
    startTime: null,
};

// ============================================
// DOM ELEMENTS
// ============================================
const TypingTestDOM = {
    paragraphDisplay: document.getElementById('paragraphDisplay'),
    typingInput: document.getElementById('typingInput'),
    btnStart: document.getElementById('btnStart'),
    btnRestart: document.getElementById('btnRestart'),
    liveWPM: document.getElementById('liveWPM'),
    liveAccuracy: document.getElementById('liveAccuracy'),
    liveTimer: document.getElementById('liveTimer'),
    virtualKeyboard: document.getElementById('virtualKeyboard'),
    resultsModal: document.getElementById('resultsModal'),
    resultWPM: document.getElementById('resultWPM'),
    resultAccuracy: document.getElementById('resultAccuracy'),
    resultChars: document.getElementById('resultChars'),
    resultErrors: document.getElementById('resultErrors'),
    btnRetry: document.getElementById('btnRetry'),
    btnNextTest: document.getElementById('btnNextTest'),
    difficultyOptions: document.getElementById('difficultyOptions'),
    timerOptions: document.getElementById('timerOptions'),
};

// ============================================
// WORD POOLS FOR RANDOM PARAGRAPH GENERATOR
// ============================================
const WordPools = {
    easy: [
        'the', 'is', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at',
        'to', 'for', 'of', 'with', 'from', 'by', 'up', 'down', 'out', 'over',
        'cat', 'dog', 'sun', 'run', 'eat', 'big', 'red', 'hat', 'sit', 'top',
        'can', 'see', 'go', 'we', 'he', 'she', 'it', 'you', 'me', 'my',
        'not', 'so', 'if', 'be', 'was', 'are', 'all', 'did', 'get', 'had',
        'has', 'her', 'him', 'his', 'how', 'its', 'let', 'may', 'new', 'now',
        'old', 'our', 'say', 'two', 'use', 'way', 'who', 'boy', 'day', 'end',
        'fun', 'got', 'hot', 'job', 'key', 'lot', 'men', 'net', 'oil', 'put',
        'row', 'saw', 'try', 'win', 'yes', 'zoo', 'air', 'bag', 'cup', 'dry',
    ],
    medium: [
        'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'for',
        'they', 'with', 'this', 'from', 'which', 'would', 'there', 'their',
        'about', 'people', 'because', 'through', 'between', 'without', 'another',
        'computer', 'keyboard', 'typing', 'practice', 'speed', 'develop', 'create',
        'language', 'system', 'program', 'function', 'design', 'project', 'manage',
        'important', 'different', 'possible', 'problem', 'solution', 'example',
        'complete', 'understand', 'together', 'business', 'education', 'research',
        'experience', 'technology', 'information', 'communication', 'development',
        'application', 'knowledge', 'opportunity', 'organization', 'professional',
        'particularly', 'significant', 'environment', 'relationship', 'performance',
        'recognition', 'requirement', 'achievement', 'improvement', 'considerable',
    ],
    hard: [
        'sophisticated', 'phenomenon', 'extraordinary', 'comprehensive', 'simultaneously',
        'unprecedented', 'revolutionary', 'metamorphosis', 'juxtaposition', 'idiosyncratic',
        'quintessential', 'paradigm', 'epistemology', 'hermeneutics', 'existentialism',
        'consciousness', 'infrastructure', 'entrepreneurship', 'sustainability', 'globalization',
        'implementation', 'collaboratively', 'determination', 'configuration', 'specification',
        'interpretation', 'authentication', 'experimentation', 'characteristic', 'constitutional',
        'administration', 'pharmaceutical', 'discrimination', 'rehabilitation', 'transformation',
        'accountability', 'correspondence', 'recommendation', 'differentiation', 'diversification',
        'acknowledgment', 'aforementioned', 'unconsciousness', 'incomprehensible', 'circumstantial',
        'procrastination', 'neuroplasticity', 'lexicographical', 'counterintuitive', 'pseudoscience',
    ],
};

// ============================================
// PARAGRAPH GENERATOR
// ============================================
function generateParagraph(difficulty) {
    const pool = WordPools[difficulty];
    const count = difficulty === 'easy' ? 35 : difficulty === 'medium' ? 50 : 45;
    const words = [];
    
    for (let i = 0; i < count; i++) {
        const randomIndex = Math.floor(Math.random() * pool.length);
        let word = pool[randomIndex];
        
        // Capitalize first word
        if (i === 0) {
            word = word.charAt(0).toUpperCase() + word.slice(1);
        }
        
        // Add punctuation occasionally
        if (i === count - 1) {
            word += '.';
        } else if (i > 0 && i % 8 === 0) {
            word += ',';
        } else if (i > 0 && i % 15 === 0) {
            word += '.';
            // Next word will be capitalized
            if (i + 1 < count) {
                const nextWord = pool[Math.floor(Math.random() * pool.length)];
                words.push(word);
                word = nextWord.charAt(0).toUpperCase() + nextWord.slice(1);
                i++;
            }
        }
        
        words.push(word);
    }
    
    return words;
}

// ============================================
// DISPLAY PARAGRAPH
// ============================================
function displayParagraph(words) {
    TypingTestDOM.paragraphDisplay.innerHTML = '';
    words.forEach((word, index) => {
        const span = document.createElement('span');
        span.className = 'word';
        span.textContent = word;
        if (index === 0) span.classList.add('current');
        TypingTestDOM.paragraphDisplay.appendChild(span);
        // Add space after each word
        if (index < words.length - 1) {
            TypingTestDOM.paragraphDisplay.appendChild(document.createTextNode(' '));
        }
    });
}

// ============================================
// INIT TYPING TEST
// ============================================
function initTypingTest() {
    resetTest();
    
    // Update difficulty from active button
    const activeDifficulty = document.querySelector('#difficultyOptions .option-btn.active');
    if (activeDifficulty) {
        TypingTestState.difficulty = activeDifficulty.dataset.difficulty;
    }
    
    // Update timer from active button
    const activeTimer = document.querySelector('#timerOptions .option-btn.active');
    if (activeTimer) {
        TypingTestState.timerDuration = parseInt(activeTimer.dataset.time);
        TypingTestState.timeLeft = parseInt(activeTimer.dataset.time);
    }
    
    // Generate paragraph
    TypingTestState.words = generateParagraph(TypingTestState.difficulty);
    displayParagraph(TypingTestState.words);
    
    // Update UI
    TypingTestDOM.liveTimer.textContent = TypingTestState.timeLeft;
    TypingTestDOM.liveWPM.textContent = '0';
    TypingTestDOM.liveAccuracy.textContent = '100%';
    
    // Show/hide virtual keyboard for easy mode
    if (TypingTestState.difficulty === 'easy' && window.AppState && window.AppState.keyboardVisible) {
        createVirtualKeyboard();
        TypingTestDOM.virtualKeyboard.classList.remove('hidden');
    } else {
        TypingTestDOM.virtualKeyboard.classList.add('hidden');
    }
    
    // Setup difficulty option buttons
    setupOptionButtons();
}

// ============================================
// OPTION BUTTONS
// ============================================
function setupOptionButtons() {
    // Difficulty buttons
    const diffButtons = document.querySelectorAll('#difficultyOptions .option-btn');
    diffButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            diffButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            if (!TypingTestState.isRunning) {
                TypingTestState.difficulty = this.dataset.difficulty;
                TypingTestState.words = generateParagraph(TypingTestState.difficulty);
                displayParagraph(TypingTestState.words);
                
                // Toggle keyboard visibility
                if (TypingTestState.difficulty === 'easy' && window.AppState && window.AppState.keyboardVisible) {
                    createVirtualKeyboard();
                    TypingTestDOM.virtualKeyboard.classList.remove('hidden');
                } else {
                    TypingTestDOM.virtualKeyboard.classList.add('hidden');
                }
            }
        });
    });
    
    // Timer buttons
    const timeButtons = document.querySelectorAll('#timerOptions .option-btn');
    timeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            timeButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            if (!TypingTestState.isRunning) {
                TypingTestState.timerDuration = parseInt(this.dataset.time);
                TypingTestState.timeLeft = parseInt(this.dataset.time);
                TypingTestDOM.liveTimer.textContent = TypingTestState.timeLeft;
            }
        });
    });
}

// ============================================
// START TEST
// ============================================
function startTest() {
    if (TypingTestState.isRunning) return;
    
    TypingTestState.isRunning = true;
    TypingTestState.isFinished = false;
    TypingTestState.currentWordIndex = 0;
    TypingTestState.currentCharIndex = 0;
    TypingTestState.totalKeystrokes = 0;
    TypingTestState.correctKeystrokes = 0;
    TypingTestState.errors = 0;
    TypingTestState.startTime = Date.now();
    
    TypingTestDOM.typingInput.disabled = false;
    TypingTestDOM.typingInput.value = '';
    TypingTestDOM.typingInput.focus();
    TypingTestDOM.btnStart.classList.add('hidden');
    TypingTestDOM.btnRestart.classList.add('hidden');
    
    // Highlight first word
    highlightCurrentWord();
    
    // Start timer
    TypingTestState.timerInterval = setInterval(updateTimer, 1000);
    
    // Update live stats periodically
    TypingTestState.statsInterval = setInterval(updateLiveStats, 200);
}

// ============================================
// UPDATE TIMER
// ============================================
function updateTimer() {
    TypingTestState.timeLeft--;
    TypingTestDOM.liveTimer.textContent = TypingTestState.timeLeft;
    
    if (TypingTestState.timeLeft <= 0) {
        endTest();
    }
    
    // Warning animation when time is low
    if (TypingTestState.timeLeft <= 10) {
        TypingTestDOM.liveTimer.style.color = '#fc8181';
        TypingTestDOM.liveTimer.style.animation = 'pulse 0.5s infinite';
    }
}

// ============================================
// UPDATE LIVE STATS
// ============================================
function updateLiveStats() {
    if (!TypingTestState.isRunning) return;
    
    const elapsedMinutes = (Date.now() - TypingTestState.startTime) / 60000;
    const wordsTyped = TypingTestState.correctKeystrokes / 5; // Standard: 5 chars = 1 word
    const wpm = elapsedMinutes > 0 ? Math.round(wordsTyped / elapsedMinutes) : 0;
    const accuracy = TypingTestState.totalKeystrokes > 0 
        ? Math.round((TypingTestState.correctKeystrokes / TypingTestState.totalKeystrokes) * 100) 
        : 100;
    
    TypingTestDOM.liveWPM.textContent = wpm;
    TypingTestDOM.liveAccuracy.textContent = accuracy + '%';
}

// ============================================
// HANDLE TYPING INPUT
// ============================================
TypingTestDOM.typingInput.addEventListener('input', function(e) {
    if (!TypingTestState.isRunning || TypingTestState.isFinished) return;
    
    const inputVal = this.value;
    const words = TypingTestState.words;
    const currentWord = words[TypingTestState.currentWordIndex];
    
    // Check if user typed a space (word separator)
    if (inputVal.endsWith(' ')) {
        const typedWord = inputVal.trim();
        
        // Compare typed word with current word
        if (typedWord === currentWord) {
            // Correct word
            markWordCorrect(TypingTestState.currentWordIndex);
            TypingTestState.correctKeystrokes += currentWord.length;
        } else {
            // Incorrect word
            markWordIncorrect(TypingTestState.currentWordIndex);
            TypingTestState.errors++;
            // Calculate correct characters
            let correctChars = 0;
            for (let i = 0; i < Math.min(typedWord.length, currentWord.length); i++) {
                if (typedWord[i] === currentWord[i]) correctChars++;
            }
            TypingTestState.correctKeystrokes += correctChars;
            
            if (window.playErrorSound) window.playErrorSound();
        }
        
        TypingTestState.totalKeystrokes += currentWord.length;
        
        // Move to next word
        TypingTestState.currentWordIndex++;
        this.value = '';
        
        // Check if all words typed
        if (TypingTestState.currentWordIndex >= words.length) {
            endTest();
            return;
        }
        
        highlightCurrentWord();
    }
});

// ============================================
// PREVENT SPACE AT START
// ============================================
TypingTestDOM.typingInput.addEventListener('keydown', function(e) {
    if (e.key === ' ' && this.value === '') {
        e.preventDefault();
    }
});

// ============================================
// WORD HIGHLIGHTING
// ============================================
function highlightCurrentWord() {
    const wordElements = TypingTestDOM.paragraphDisplay.querySelectorAll('.word');
    wordElements.forEach(el => el.classList.remove('current'));
    
    if (TypingTestState.currentWordIndex < wordElements.length) {
        wordElements[TypingTestState.currentWordIndex].classList.add('current');
        
        // Scroll word into view
        wordElements[TypingTestState.currentWordIndex].scrollIntoView({
            behavior: 'smooth',
            block: 'center',
        });
    }
}

function markWordCorrect(index) {
    const wordElements = TypingTestDOM.paragraphDisplay.querySelectorAll('.word');
    if (index < wordElements.length) {
        wordElements[index].classList.remove('current', 'incorrect');
        wordElements[index].classList.add('correct');
    }
}

function markWordIncorrect(index) {
    const wordElements = TypingTestDOM.paragraphDisplay.querySelectorAll('.word');
    if (index < wordElements.length) {
        wordElements[index].classList.remove('current', 'correct');
        wordElements[index].classList.add('incorrect');
    }
}

// ============================================
// END TEST
// ============================================
function endTest() {
    TypingTestState.isRunning = false;
    TypingTestState.isFinished = true;
    
    clearInterval(TypingTestState.timerInterval);
    clearInterval(TypingTestState.statsInterval);
    
    TypingTestDOM.typingInput.disabled = true;
    TypingTestDOM.btnRestart.classList.remove('hidden');
    
    // Reset timer color
    TypingTestDOM.liveTimer.style.color = '';
    TypingTestDOM.liveTimer.style.animation = '';
    
    // Calculate final stats
    const elapsedMinutes = (Date.now() - TypingTestState.startTime) / 60000;
    const wordsTyped = TypingTestState.correctKeystrokes / 5;
    const wpm = elapsedMinutes > 0 ? Math.round(wordsTyped / elapsedMinutes) : 0;
    const accuracy = TypingTestState.totalKeystrokes > 0 
        ? Math.round((TypingTestState.correctKeystrokes / TypingTestState.totalKeystrokes) * 100) 
        : 100;
    
    // Show results
    showResults(wpm, accuracy);
    
    // Save to history
    saveTestResult(wpm, accuracy);
    
    // Trigger confetti for good scores
    if (wpm > 50 && accuracy > 90 && window.triggerConfetti) {
        window.triggerConfetti();
    }
}

// ============================================
// SHOW RESULTS MODAL
// ============================================
function showResults(wpm, accuracy) {
    TypingTestDOM.resultWPM.textContent = wpm;
    TypingTestDOM.resultAccuracy.textContent = accuracy + '%';
    TypingTestDOM.resultChars.textContent = TypingTestState.correctKeystrokes;
    TypingTestDOM.resultErrors.textContent = TypingTestState.errors;
    TypingTestDOM.resultsModal.classList.remove('hidden');
}

// ============================================
// SAVE TEST RESULT
// ============================================
function saveTestResult(wpm, accuracy) {
    const result = {
        date: new Date().toISOString(),
        wpm: wpm,
        accuracy: accuracy,
        difficulty: TypingTestState.difficulty,
        duration: TypingTestState.timerDuration,
        characters: TypingTestState.correctKeystrokes,
        errors: TypingTestState.errors,
        type: 'typing-test',
    };
    
    // Save to localStorage
    let history = [];
    const saved = localStorage.getItem('typeflow_history');
    if (saved) {
        try {
            history = JSON.parse(saved);
        } catch(e) {
            history = [];
        }
    }
    history.unshift(result);
    // Keep only last 100 results
    if (history.length > 100) history = history.slice(0, 100);
    localStorage.setItem('typeflow_history', JSON.stringify(history));
}

// ============================================
// RESET TEST
// ============================================
function resetTest() {
    TypingTestState.isRunning = false;
    TypingTestState.isFinished = false;
    TypingTestState.currentWordIndex = 0;
    TypingTestState.currentCharIndex = 0;
    TypingTestState.totalKeystrokes = 0;
    TypingTestState.correctKeystrokes = 0;
    TypingTestState.errors = 0;
    
    clearInterval(TypingTestState.timerInterval);
    clearInterval(TypingTestState.statsInterval);
    
    TypingTestDOM.typingInput.disabled = true;
    TypingTestDOM.typingInput.value = '';
    TypingTestDOM.btnStart.classList.remove('hidden');
    TypingTestDOM.btnRestart.classList.add('hidden');
    TypingTestDOM.resultsModal.classList.add('hidden');
    
    TypingTestDOM.liveTimer.style.color = '';
    TypingTestDOM.liveTimer.style.animation = '';
    
    // Get current timer setting
    const activeTimer = document.querySelector('#timerOptions .option-btn.active');
    if (activeTimer) {
        TypingTestState.timerDuration = parseInt(activeTimer.dataset.time);
        TypingTestState.timeLeft = parseInt(activeTimer.dataset.time);
    }
    
    TypingTestDOM.liveTimer.textContent = TypingTestState.timeLeft;
    TypingTestDOM.liveWPM.textContent = '0';
    TypingTestDOM.liveAccuracy.textContent = '100%';
    
    // Regenerate paragraph
    TypingTestState.words = generateParagraph(TypingTestState.difficulty);
    displayParagraph(TypingTestState.words);
}

// ============================================
// EVENT LISTENERS
// ============================================
TypingTestDOM.btnStart.addEventListener('click', startTest);
TypingTestDOM.btnRestart.addEventListener('click', resetTest);
TypingTestDOM.btnRetry.addEventListener('click', resetTest);
TypingTestDOM.btnNextTest.addEventListener('click', () => {
    resetTest();
    startTest();
});

// Close results modal on Escape
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && TypingTestDOM.resultsModal) {
        TypingTestDOM.resultsModal.classList.add('hidden');
    }
});

// Click outside results modal to close
TypingTestDOM.resultsModal.addEventListener('click', function(e) {
    if (e.target === this) {
        this.classList.add('hidden');
    }
});

// ============================================
// VIRTUAL KEYBOARD
// ============================================
function createVirtualKeyboard() {
    const keyboard = TypingTestDOM.virtualKeyboard;
    const rows = [
        ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
        ['Tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
        ['Caps', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", 'Enter'],
        ['Shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'Shift'],
        ['Space'],
    ];
    
    keyboard.innerHTML = '';
    
    rows.forEach(row => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'keyboard-row';
        
        row.forEach(key => {
            const keyDiv = document.createElement('div');
            keyDiv.className = 'keyboard-key';
            keyDiv.textContent = key === 'Space' ? '' : key;
            keyDiv.dataset.key = key.toLowerCase();
            
            if (key === 'Space') {
                keyDiv.classList.add('space-key');
                keyDiv.innerHTML = '<i class="fas fa-long-arrow-alt-down"></i>';
            }
            
            rowDiv.appendChild(keyDiv);
        });
        
        keyboard.appendChild(rowDiv);
    });
}

// Highlight key on physical keypress (Easy mode)
document.addEventListener('keydown', function(e) {
    if (TypingTestState.difficulty !== 'easy' || !TypingTestState.isRunning) return;
    
    const key = e.key.toLowerCase();
    const keyElements = TypingTestDOM.virtualKeyboard.querySelectorAll('.keyboard-key');
    
    keyElements.forEach(el => {
        if (el.dataset.key === key) {
            el.classList.add('active');
            setTimeout(() => el.classList.remove('active'), 150);
        }
    });
});

// ============================================
// 100 WORDS CHALLENGE
// ============================================
const HundredWordsState = {
    isRunning: false,
    isFinished: false,
    words: [],
    typedWords: [],
    currentWordIndex: 0,
    correctKeystrokes: 0,
    totalKeystrokes: 0,
    errors: 0,
    startTime: null,
    timerInterval: null,
};

const HundredWordsDOM = {
    paragraphDisplay: document.getElementById('hwParagraphDisplay'),
    typingInput: document.getElementById('hwTypingInput'),
    btnStart: document.getElementById('btnHWStart'),
    wordsLeft: document.getElementById('hwWordsLeft'),
    timer: document.getElementById('hwTimer'),
    accuracy: document.getElementById('hwAccuracy'),
    results: document.getElementById('hwResults'),
    resultWPM: document.getElementById('hwResultWPM'),
    resultTime: document.getElementById('hwResultTime'),
    resultAccuracy: document.getElementById('hwResultAccuracy'),
    btnRetry: document.getElementById('btnHWRetry'),
};

function initHundredWords() {
    resetHundredWords();
}

function generateHundredWordsParagraph() {
    // Mix all difficulty pools for variety
    const allWords = [...WordPools.easy, ...WordPools.medium, ...WordPools.hard];
    const words = [];
    
    for (let i = 0; i < 100; i++) {
        const randomIndex = Math.floor(Math.random() * allWords.length);
        let word = allWords[randomIndex];
        
        if (i === 0) word = word.charAt(0).toUpperCase() + word.slice(1);
        if (i === 99) word += '.';
        else if (i > 0 && i % 10 === 0) word += ',';
        else if (i > 0 && i % 20 === 0) {
            word += '.';
            if (i + 1 < 100) {
                words.push(word);
                const nextWord = allWords[Math.floor(Math.random() * allWords.length)];
                word = nextWord.charAt(0).toUpperCase() + nextWord.slice(1);
                i++;
            }
        }
        
        words.push(word);
    }
    
    return words;
}

function displayHundredWordsParagraph(words) {
    HundredWordsDOM.paragraphDisplay.innerHTML = '';
    words.forEach((word, index) => {
        const span = document.createElement('span');
        span.className = 'word';
        span.textContent = word;
        if (index === 0) span.classList.add('current');
        HundredWordsDOM.paragraphDisplay.appendChild(span);
        if (index < words.length - 1) {
            HundredWordsDOM.paragraphDisplay.appendChild(document.createTextNode(' '));
        }
    });
}

function startHundredWords() {
    if (HundredWordsState.isRunning) return;
    
    HundredWordsState.isRunning = true;
    HundredWordsState.isFinished = false;
    HundredWordsState.currentWordIndex = 0;
    HundredWordsState.correctKeystrokes = 0;
    HundredWordsState.totalKeystrokes = 0;
    HundredWordsState.errors = 0;
    HundredWordsState.startTime = Date.now();
    
    HundredWordsState.words = generateHundredWordsParagraph();
    displayHundredWordsParagraph(HundredWordsState.words);
    
    HundredWordsDOM.typingInput.disabled = false;
    HundredWordsDOM.typingInput.value = '';
    HundredWordsDOM.typingInput.focus();
    HundredWordsDOM.btnStart.classList.add('hidden');
    HundredWordsDOM.results.classList.add('hidden');
    
    HundredWordsDOM.wordsLeft.textContent = '100';
    HundredWordsDOM.accuracy.textContent = '100%';
    HundredWordsDOM.timer.textContent = '00:00';
    
    // Start timer (counts up)
    HundredWordsState.timerInterval = setInterval(updateHundredWordsTimer, 100);
}

function updateHundredWordsTimer() {
    if (!HundredWordsState.isRunning) return;
    
    const elapsed = Math.floor((Date.now() - HundredWordsState.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    HundredWordsDOM.timer.textContent = 
        String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
}

function updateHundredWordsStats() {
    const wordsLeft = 100 - HundredWordsState.currentWordIndex;
    HundredWordsDOM.wordsLeft.textContent = wordsLeft;
    
    const accuracy = HundredWordsState.totalKeystrokes > 0
        ? Math.round((HundredWordsState.correctKeystrokes / HundredWordsState.totalKeystrokes) * 100)
        : 100;
    HundredWordsDOM.accuracy.textContent = accuracy + '%';
}

HundredWordsDOM.typingInput.addEventListener('input', function(e) {
    if (!HundredWordsState.isRunning || HundredWordsState.isFinished) return;
    
    const inputVal = this.value;
    const currentWord = HundredWordsState.words[HundredWordsState.currentWordIndex];
    
    if (inputVal.endsWith(' ')) {
        const typedWord = inputVal.trim();
        
        if (typedWord === currentWord) {
            markHundredWordsCorrect(HundredWordsState.currentWordIndex);
            HundredWordsState.correctKeystrokes += currentWord.length;
        } else {
            markHundredWordsIncorrect(HundredWordsState.currentWordIndex);
            HundredWordsState.errors++;
            let correctChars = 0;
            for (let i = 0; i < Math.min(typedWord.length, currentWord.length); i++) {
                if (typedWord[i] === currentWord[i]) correctChars++;
            }
            HundredWordsState.correctKeystrokes += correctChars;
            if (window.playErrorSound) window.playErrorSound();
        }
        
        HundredWordsState.totalKeystrokes += currentWord.length;
        HundredWordsState.currentWordIndex++;
        this.value = '';
        
        updateHundredWordsStats();
        
        if (HundredWordsState.currentWordIndex >= 100) {
            endHundredWords();
            return;
        }
        
        highlightHundredWordsCurrent();
    }
});

HundredWordsDOM.typingInput.addEventListener('keydown', function(e) {
    if (e.key === ' ' && this.value === '') {
        e.preventDefault();
    }
});

function highlightHundredWordsCurrent() {
    const wordElements = HundredWordsDOM.paragraphDisplay.querySelectorAll('.word');
    wordElements.forEach(el => el.classList.remove('current'));
    if (HundredWordsState.currentWordIndex < wordElements.length) {
        wordElements[HundredWordsState.currentWordIndex].classList.add('current');
        wordElements[HundredWordsState.currentWordIndex].scrollIntoView({
            behavior: 'smooth',
            block: 'center',
        });
    }
}

function markHundredWordsCorrect(index) {
    const wordElements = HundredWordsDOM.paragraphDisplay.querySelectorAll('.word');
    if (index < wordElements.length) {
        wordElements[index].classList.remove('current', 'incorrect');
        wordElements[index].classList.add('correct');
    }
}

function markHundredWordsIncorrect(index) {
    const wordElements = HundredWordsDOM.paragraphDisplay.querySelectorAll('.word');
    if (index < wordElements.length) {
        wordElements[index].classList.remove('current', 'correct');
        wordElements[index].classList.add('incorrect');
    }
}

function endHundredWords() {
    HundredWordsState.isRunning = false;
    HundredWordsState.isFinished = true;
    
    clearInterval(HundredWordsState.timerInterval);
    HundredWordsDOM.typingInput.disabled = true;
    
    const elapsedMinutes = (Date.now() - HundredWordsState.startTime) / 60000;
    const wordsTyped = HundredWordsState.correctKeystrokes / 5;
    const wpm = elapsedMinutes > 0 ? Math.round(wordsTyped / elapsedMinutes) : 0;
    const accuracy = HundredWordsState.totalKeystrokes > 0
        ? Math.round((HundredWordsState.correctKeystrokes / HundredWordsState.totalKeystrokes) * 100)
        : 100;
    const elapsed = Math.floor((Date.now() - HundredWordsState.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    
    HundredWordsDOM.resultWPM.textContent = wpm;
    HundredWordsDOM.resultAccuracy.textContent = accuracy + '%';
    HundredWordsDOM.resultTime.textContent = 
        String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
    HundredWordsDOM.results.classList.remove('hidden');
    
    // Save result
    const result = {
        date: new Date().toISOString(),
        wpm: wpm,
        accuracy: accuracy,
        time: elapsed,
        type: '100-words',
    };
    
    let history = [];
    const saved = localStorage.getItem('typeflow_history');
    if (saved) {
        try { history = JSON.parse(saved); } catch(e) {}
    }
    history.unshift(result);
    if (history.length > 100) history = history.slice(0, 100);
    localStorage.setItem('typeflow_history', JSON.stringify(history));
    
    if (wpm > 50 && accuracy > 90 && window.triggerConfetti) {
        window.triggerConfetti();
    }
}

function resetHundredWords() {
    HundredWordsState.isRunning = false;
    HundredWordsState.isFinished = false;
    HundredWordsState.currentWordIndex = 0;
    HundredWordsState.correctKeystrokes = 0;
    HundredWordsState.totalKeystrokes = 0;
    HundredWordsState.errors = 0;
    
    clearInterval(HundredWordsState.timerInterval);
    
    HundredWordsDOM.typingInput.disabled = true;
    HundredWordsDOM.typingInput.value = '';
    HundredWordsDOM.btnStart.classList.remove('hidden');
    HundredWordsDOM.results.classList.add('hidden');
    
    HundredWordsDOM.wordsLeft.textContent = '100';
    HundredWordsDOM.timer.textContent = '00:00';
    HundredWordsDOM.accuracy.textContent = '100%';
    
    HundredWordsState.words = generateHundredWordsParagraph();
    displayHundredWordsParagraph(HundredWordsState.words);
}

HundredWordsDOM.btnStart.addEventListener('click', startHundredWords);
HundredWordsDOM.btnRetry.addEventListener('click', resetHundredWords);

// ============================================
// EXPORT FOR APP.JS
// ============================================
window.initTypingTest = initTypingTest;
window.initHundredWords = initHundredWords;
window.resetTest = resetTest;