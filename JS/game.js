/* ============================================
   TYPEFLOW - Games Hub (3 Games)
   ============================================ */

// ============================================
// GAMES HUB NAVIGATION
// ============================================
const GamesDOM = {
    gamesGrid: document.querySelector('.games-grid'),
    gamePlayArea: document.getElementById('gamePlayArea'),
    gameContent: document.getElementById('gameContent'),
    btnBackGames: document.getElementById('btnBackGames'),
    gameButtons: document.querySelectorAll('.btn-game'),
};

GamesDOM.gameButtons.forEach(btn => {
    btn.addEventListener('click', function() {
        const game = this.dataset.game;
        startGame(game);
    });
});

GamesDOM.btnBackGames.addEventListener('click', backToGamesHub);

function backToGamesHub() {
    GamesDOM.gamesGrid.style.display = '';
    GamesDOM.gamePlayArea.classList.add('hidden');
    GamesDOM.gameContent.innerHTML = '';
    
    // Clear any running game intervals
    if (window._gameIntervals) {
        window._gameIntervals.forEach(clearInterval);
        window._gameIntervals = [];
    }
}

function startGame(game) {
    GamesDOM.gamesGrid.style.display = 'none';
    GamesDOM.gamePlayArea.classList.remove('hidden');
    
    switch(game) {
        case 'scramble':
            initWordScramble();
            break;
        case 'falling':
            initFallingWords();
            break;
        case 'race':
            initSpeedRace();
            break;
    }
}

// Store intervals for cleanup
window._gameIntervals = [];

// ============================================
// GAME 1: WORD SCRAMBLE
// ============================================
const ScrambleState = {
    score: 0,
    timeLeft: 60,
    isRunning: false,
    currentWord: '',
    scrambledWord: '',
    wordsUsed: [],
};

const ScrambleWords = [
    'keyboard', 'monitor', 'printer', 'speaker', 'camera',
    'browser', 'program', 'compile', 'design', 'create',
    'typing', 'skill', 'practice', 'master', 'learn',
    'function', 'variable', 'object', 'array', 'string',
    'coding', 'debug', 'script', 'style', 'layout',
    'python', 'java', 'react', 'vue', 'node',
    'build', 'deploy', 'server', 'client', 'route',
];

function scrambleWord(word) {
    const arr = word.split('');
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    // Make sure it's different from original
    const scrambled = arr.join('');
    return scrambled === word ? scrambleWord(word) : scrambled;
}

function initWordScramble() {
    ScrambleState.score = 0;
    ScrambleState.timeLeft = 60;
    ScrambleState.isRunning = false;
    ScrambleState.wordsUsed = [];
    
    GamesDOM.gameContent.innerHTML = `
        <div class="game-scramble-area">
            <h2><i class="fas fa-random"></i> Word Scramble</h2>
            <p>Unscramble the letters to form the correct word!</p>
            
            <div class="scramble-stats" style="display:flex; gap:20px; justify-content:center; margin:16px 0;">
                <div class="stat-card">
                    <span class="stat-value" id="scrambleScore">0</span>
                    <span class="stat-label">Score</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value" id="scrambleTime">60</span>
                    <span class="stat-label">Seconds</span>
                </div>
            </div>
            
            <div class="scramble-word" id="scrambleWordDisplay">?????</div>
            
            <input type="text" class="scramble-input" id="scrambleInput" placeholder="Type your answer..." disabled>
            
            <br><br>
            <button class="btn btn-primary" id="btnScrambleStart">
                <i class="fas fa-play"></i> Start Game
            </button>
            <button class="btn btn-primary hidden" id="btnScrambleRestart">
                <i class="fas fa-redo"></i> Play Again
            </button>
            
            <div class="scramble-result hidden" id="scrambleResult" style="margin-top:16px; font-weight:600;"></div>
        </div>
    `;
    
    const btnStart = document.getElementById('btnScrambleStart');
    const btnRestart = document.getElementById('btnScrambleRestart');
    const input = document.getElementById('scrambleInput');
    
    btnStart.addEventListener('click', startScramble);
    btnRestart.addEventListener('click', initWordScramble);
    
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') checkScrambleAnswer();
    });
}

function startScramble() {
    ScrambleState.isRunning = true;
    ScrambleState.score = 0;
    ScrambleState.timeLeft = 60;
    
    document.getElementById('btnScrambleStart').classList.add('hidden');
    document.getElementById('scrambleInput').disabled = false;
    document.getElementById('scrambleInput').focus();
    document.getElementById('scrambleResult').classList.add('hidden');
    
    updateScrambleDisplay();
    pickNewScrambleWord();
    
    const timerInterval = setInterval(() => {
        ScrambleState.timeLeft--;
        document.getElementById('scrambleTime').textContent = ScrambleState.timeLeft;
        
        if (ScrambleState.timeLeft <= 0) {
            endScramble();
        }
    }, 1000);
    
    window._gameIntervals.push(timerInterval);
}

function pickNewScrambleWord() {
    // Pick a word not used yet
    let available = ScrambleWords.filter(w => !ScrambleState.wordsUsed.includes(w));
    if (available.length === 0) {
        ScrambleState.wordsUsed = [];
        available = ScrambleWords;
    }
    
    const word = available[Math.floor(Math.random() * available.length)];
    ScrambleState.currentWord = word;
    ScrambleState.scrambledWord = scrambleWord(word);
    ScrambleState.wordsUsed.push(word);
    
    document.getElementById('scrambleWordDisplay').textContent = ScrambleState.scrambledWord.toUpperCase();
    document.getElementById('scrambleInput').value = '';
    document.getElementById('scrambleResult').classList.add('hidden');
}

function checkScrambleAnswer() {
    if (!ScrambleState.isRunning) return;
    
    const input = document.getElementById('scrambleInput');
    const answer = input.value.trim().toLowerCase();
    const correct = ScrambleState.currentWord.toLowerCase();
    
    if (answer === correct) {
        ScrambleState.score += 10;
        document.getElementById('scrambleResult').textContent = '✅ Correct! +10 points';
        document.getElementById('scrambleResult').style.color = '#48bb78';
        updateScrambleDisplay();
        pickNewScrambleWord();
    } else {
        document.getElementById('scrambleResult').textContent = '❌ Try again!';
        document.getElementById('scrambleResult').style.color = '#fc8181';
        if (window.playErrorSound) window.playErrorSound();
    }
    
    document.getElementById('scrambleResult').classList.remove('hidden');
}

function updateScrambleDisplay() {
    document.getElementById('scrambleScore').textContent = ScrambleState.score;
}

function endScramble() {
    ScrambleState.isRunning = false;
    document.getElementById('scrambleInput').disabled = true;
    document.getElementById('btnScrambleRestart').classList.remove('hidden');
    document.getElementById('scrambleResult').textContent = 
        `🏆 Game Over! Final Score: ${ScrambleState.score}`;
    document.getElementById('scrambleResult').style.color = '#6c5ce7';
    document.getElementById('scrambleResult').classList.remove('hidden');
    
    if (ScrambleState.score > 100 && window.triggerConfetti) {
        window.triggerConfetti();
    }
}

// ============================================
// GAME 2: FALLING WORDS
// ============================================
const FallingState = {
    score: 0,
    lives: 5,
    isRunning: false,
    words: [],
    speed: 1,
};

const FallingWords = [
    'cat', 'dog', 'run', 'jump', 'fly', 'eat', 'sleep', 'read', 'write', 'code',
    'type', 'fast', 'slow', 'big', 'small', 'hot', 'cold', 'red', 'blue', 'green',
    'sun', 'moon', 'star', 'sky', 'sea', 'tree', 'bird', 'fish', 'book', 'game',
    'play', 'work', 'home', 'love', 'hope', 'dream', 'light', 'dark', 'fire', 'water',
];

function initFallingWords() {
    FallingState.score = 0;
    FallingState.lives = 5;
    FallingState.isRunning = false;
    FallingState.words = [];
    FallingState.speed = 1;
    
    GamesDOM.gameContent.innerHTML = `
        <div class="game-falling-container" style="text-align:center;">
            <h2><i class="fas fa-arrow-down"></i> Falling Words</h2>
            <p>Type the words before they hit the ground!</p>
            
            <div class="falling-stats" style="display:flex; gap:20px; justify-content:center; margin:16px 0;">
                <div class="stat-card">
                    <span class="stat-value" id="fallingScore">0</span>
                    <span class="stat-label">Score</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value" id="fallingLives">❤️❤️❤️❤️❤️</span>
                    <span class="stat-label">Lives</span>
                </div>
            </div>
            
            <div class="game-falling-area" id="fallingArea" style="position:relative; height:400px; background:var(--bg-tertiary); border-radius:16px; overflow:hidden;">
                <p style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); color:var(--text-muted);" id="fallingPlaceholder">
                    Press Start to play!
                </p>
            </div>
            
            <input type="text" class="scramble-input" id="fallingInput" placeholder="Type here..." disabled style="margin-top:12px;">
            
            <br>
            <button class="btn btn-primary" id="btnFallingStart" style="margin-top:12px;">
                <i class="fas fa-play"></i> Start Game
            </button>
            <button class="btn btn-primary hidden" id="btnFallingRestart" style="margin-top:12px;">
                <i class="fas fa-redo"></i> Play Again
            </button>
        </div>
    `;
    
    document.getElementById('btnFallingStart').addEventListener('click', startFalling);
    document.getElementById('btnFallingRestart').addEventListener('click', initFallingWords);
    
    document.getElementById('fallingInput').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') checkFallingWord();
    });
}

function startFalling() {
    FallingState.isRunning = true;
    FallingState.score = 0;
    FallingState.lives = 5;
    FallingState.words = [];
    
    document.getElementById('btnFallingStart').classList.add('hidden');
    document.getElementById('fallingInput').disabled = false;
    document.getElementById('fallingInput').focus();
    document.getElementById('fallingPlaceholder').style.display = 'none';
    
    updateFallingDisplay();
    spawnFallingWord();
    
    // Spawn words periodically
    const spawnInterval = setInterval(() => {
        if (FallingState.isRunning) spawnFallingWord();
    }, 2500);
    
    window._gameIntervals.push(spawnInterval);
}

function spawnFallingWord() {
    if (!FallingState.isRunning) return;
    
    const area = document.getElementById('fallingArea');
    const word = FallingWords[Math.floor(Math.random() * FallingWords.length)];
    
    const wordEl = document.createElement('div');
    wordEl.className = 'falling-word';
    wordEl.textContent = word;
    wordEl.dataset.word = word;
    
    const leftPos = Math.random() * (area.clientWidth - 100) + 10;
    wordEl.style.left = leftPos + 'px';
    wordEl.style.top = '-30px';
    wordEl.style.position = 'absolute';
    wordEl.style.fontFamily = "'JetBrains Mono', monospace";
    wordEl.style.fontSize = '1.2rem';
    wordEl.style.padding = '4px 12px';
    wordEl.style.background = 'var(--card-bg)';
    wordEl.style.borderRadius = '8px';
    wordEl.style.border = '1px solid var(--border)';
    wordEl.style.color = 'var(--text-primary)';
    wordEl.style.zIndex = '1';
    
    area.appendChild(wordEl);
    
    const wordData = {
        element: wordEl,
        word: word,
        top: -30,
    };
    
    FallingState.words.push(wordData);
    
    // Animate the word falling
    const fallSpeed = 0.5 + FallingState.speed * 0.1;
    const fallInterval = setInterval(() => {
        if (!FallingState.isRunning) {
            clearInterval(fallInterval);
            return;
        }
        
        wordData.top += fallSpeed;
        wordEl.style.top = wordData.top + 'px';
        
        // Check if word hit the ground
        if (wordData.top > area.clientHeight - 30) {
            clearInterval(fallInterval);
            wordEl.remove();
            FallingState.words = FallingState.words.filter(w => w !== wordData);
            
            FallingState.lives--;
            updateFallingDisplay();
            
            if (window.playErrorSound) window.playErrorSound();
            
            if (FallingState.lives <= 0) {
                endFalling();
            }
        }
        
        // Remove if word was typed
        if (!area.contains(wordEl)) {
            clearInterval(fallInterval);
        }
    }, 16);
    
    window._gameIntervals.push(fallInterval);
}

function checkFallingWord() {
    if (!FallingState.isRunning) return;
    
    const input = document.getElementById('fallingInput');
    const typed = input.value.trim().toLowerCase();
    
    if (!typed) return;
    
    // Find matching falling word
    const matchIndex = FallingState.words.findIndex(w => w.word === typed);
    
    if (matchIndex !== -1) {
        // Word found!
        const wordData = FallingState.words[matchIndex];
        wordData.element.style.background = '#48bb78';
        wordData.element.style.color = '#ffffff';
        wordData.element.style.transition = 'all 0.2s ease';
        wordData.element.style.transform = 'scale(1.2)';
        
        setTimeout(() => {
            wordData.element.remove();
        }, 200);
        
        FallingState.words.splice(matchIndex, 1);
        FallingState.score += 5;
        
        // Increase speed gradually
        if (FallingState.score % 50 === 0) {
            FallingState.speed += 0.5;
        }
    } else {
        if (window.playErrorSound) window.playErrorSound();
    }
    
    input.value = '';
    updateFallingDisplay();
}

function updateFallingDisplay() {
    document.getElementById('fallingScore').textContent = FallingState.score;
    const hearts = '❤️'.repeat(Math.max(0, FallingState.lives)) + '🖤'.repeat(Math.max(0, 5 - FallingState.lives));
    document.getElementById('fallingLives').textContent = hearts;
}

function endFalling() {
    FallingState.isRunning = false;
    document.getElementById('fallingInput').disabled = true;
    document.getElementById('btnFallingRestart').classList.remove('hidden');
    
    // Clear all words
    const area = document.getElementById('fallingArea');
    FallingState.words.forEach(w => w.element.remove());
    FallingState.words = [];
    
    const placeholder = document.getElementById('fallingPlaceholder');
    if (placeholder) {
        placeholder.style.display = 'block';
        placeholder.textContent = `🏆 Game Over! Score: ${FallingState.score}`;
    }
    
    if (FallingState.score > 50 && window.triggerConfetti) {
        window.triggerConfetti();
    }
}

// ============================================
// GAME 3: SPEED RACE
// ============================================
const RaceState = {
    score: 0,
    timeLeft: 45,
    isRunning: false,
    targetScore: 30,
    currentWord: '',
    wordsCompleted: 0,
};

const RaceWords = [
    'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog',
    'speed', 'race', 'typing', 'fast', 'keyboard', 'challenge',
    'winner', 'turbo', 'boost', 'rocket', 'flash', 'storm',
    'blaze', 'dash', 'sprint', 'rush', 'zoom', 'swift',
    'rapid', 'fleet', 'haste', 'velocity', 'momentum', 'agile',
];

function initSpeedRace() {
    RaceState.score = 0;
    RaceState.timeLeft = 45;
    RaceState.isRunning = false;
    RaceState.wordsCompleted = 0;
    
    GamesDOM.gameContent.innerHTML = `
        <div class="game-race-area">
            <h2><i class="fas fa-flag-checkered"></i> Speed Race</h2>
            <p>Type as many words as possible before time runs out!</p>
            
            <div class="race-stats" style="display:flex; gap:20px; justify-content:center; margin:16px 0;">
                <div class="stat-card">
                    <span class="stat-value" id="raceScore">0</span>
                    <span class="stat-label">Words Typed</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value" id="raceTime">45</span>
                    <span class="stat-label">Seconds</span>
                </div>
            </div>
            
            <div class="race-progress">
                <div class="race-progress-bar" id="raceProgressBar" style="width:0%;"></div>
            </div>
            
            <div class="race-word-display" id="raceWordDisplay" style="font-size:2.5rem; font-family:'JetBrains Mono',monospace; color:var(--accent-primary);">
                Ready?
            </div>
            
            <input type="text" class="scramble-input" id="raceInput" placeholder="Type the word..." disabled style="font-size:1.3rem; width:280px;">
            
            <br>
            <button class="btn btn-primary" id="btnRaceStart" style="margin-top:12px;">
                <i class="fas fa-play"></i> Start Race
            </button>
            <button class="btn btn-primary hidden" id="btnRaceRestart" style="margin-top:12px;">
                <i class="fas fa-redo"></i> Race Again
            </button>
            
            <div class="race-result hidden" id="raceResult" style="margin-top:16px; font-weight:600;"></div>
        </div>
    `;
    
    document.getElementById('btnRaceStart').addEventListener('click', startRace);
    document.getElementById('btnRaceRestart').addEventListener('click', initSpeedRace);
    
    document.getElementById('raceInput').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') checkRaceWord();
    });
}

function startRace() {
    RaceState.isRunning = true;
    RaceState.score = 0;
    RaceState.timeLeft = 45;
    RaceState.wordsCompleted = 0;
    
    document.getElementById('btnRaceStart').classList.add('hidden');
    document.getElementById('raceInput').disabled = false;
    document.getElementById('raceInput').focus();
    document.getElementById('raceResult').classList.add('hidden');
    
    pickNewRaceWord();
    updateRaceDisplay();
    
    const timerInterval = setInterval(() => {
        RaceState.timeLeft--;
        document.getElementById('raceTime').textContent = RaceState.timeLeft;
        
        if (RaceState.timeLeft <= 0) {
            endRace();
        }
    }, 1000);
    
    window._gameIntervals.push(timerInterval);
}

function pickNewRaceWord() {
    RaceState.currentWord = RaceWords[Math.floor(Math.random() * RaceWords.length)];
    document.getElementById('raceWordDisplay').textContent = RaceState.currentWord;
    document.getElementById('raceInput').value = '';
}

function checkRaceWord() {
    if (!RaceState.isRunning) return;
    
    const input = document.getElementById('raceInput');
    const typed = input.value.trim().toLowerCase();
    
    if (typed === RaceState.currentWord.toLowerCase()) {
        RaceState.score++;
        RaceState.wordsCompleted++;
        updateRaceDisplay();
        pickNewRaceWord();
        
        // Flash effect
        const wordDisplay = document.getElementById('raceWordDisplay');
        wordDisplay.style.color = '#48bb78';
        setTimeout(() => {
            wordDisplay.style.color = 'var(--accent-primary)';
        }, 150);
    } else {
        if (window.playErrorSound) window.playErrorSound();
        const wordDisplay = document.getElementById('raceWordDisplay');
        wordDisplay.style.color = '#fc8181';
        setTimeout(() => {
            wordDisplay.style.color = 'var(--accent-primary)';
        }, 300);
    }
}

function updateRaceDisplay() {
    document.getElementById('raceScore').textContent = RaceState.score;
    const progress = Math.min((RaceState.wordsCompleted / RaceState.targetScore) * 100, 100);
    document.getElementById('raceProgressBar').style.width = progress + '%';
}

function endRace() {
    RaceState.isRunning = false;
    document.getElementById('raceInput').disabled = true;
    document.getElementById('btnRaceRestart').classList.remove('hidden');
    
    let rating = '';
    if (RaceState.score >= 25) rating = '🏆 Legendary!';
    else if (RaceState.score >= 18) rating = '🔥 Great Job!';
    else if (RaceState.score >= 12) rating = '👍 Good Effort!';
    else if (RaceState.score >= 6) rating = '📚 Keep Practicing!';
    else rating = '💪 Try Again!';
    
    const resultEl = document.getElementById('raceResult');
    resultEl.textContent = `${rating} You typed ${RaceState.score} words!`;
    resultEl.style.color = '#6c5ce7';
    resultEl.classList.remove('hidden');
    
    if (RaceState.score >= 18 && window.triggerConfetti) {
        window.triggerConfetti();
    }
}