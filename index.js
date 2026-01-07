let scrambles = [];
let timerInterval;
let startTime;
let elapsedTime = 0;
let isRunning = false;
let currentScrambleIndex = 0;
let isInspecting = false;
let solveHistory = [];
let scrambleSeedCounter = 0;  // Counter to vary scrambles on regenerate

// Load history from localStorage
function loadHistory() {
    const stored = localStorage.getItem('solveHistory');
    if (stored) {
        solveHistory = JSON.parse(stored);
    }
    displayHistory();
}

// Save history to localStorage
function saveHistory() {
    localStorage.setItem('solveHistory', JSON.stringify(solveHistory));
}

// Simple scramble generator for 3x3 Rubik's Cube
function generateScramble() {
    const moves = ['R', 'L', 'U', 'D', 'F', 'B'];
    const modifiers = ['', "'", '2'];
    let scramble = [];
    let lastMove = '';
    for (let i = 0; i < 20; i++) {  // 20 moves for a standard scramble
        let move;
        do {
            move = moves[Math.floor(Math.random() * moves.length)];
        } while (move === lastMove);
        lastMove = move;
        scramble.push(move + modifiers[Math.floor(Math.random() * modifiers.length)]);
    }
    return scramble.join(' ');
}

function generateScrambles() {
    const num = parseInt(document.getElementById('numScrambles').value);
    const today = new Date().toDateString();
    scrambles = [];
    Math.seedrandom(today + scrambleSeedCounter);  // Vary seed with counter
    scrambleSeedCounter++;  // Increment for next generation
    for (let i = 0; i < num; i++) {
        scrambles.push(generateScramble());
    }
    currentScrambleIndex = 0;  // Reset to first scramble
    displayScrambles();
    updateCurrentScramble();
}

function displayScrambles() {
    const container = document.getElementById('scrambles');
    container.innerHTML = '';
    scrambles.forEach((scramble, index) => {
        const div = document.createElement('div');
        div.className = 'scramble';
        div.innerHTML = `<strong>Scramble ${index + 1}:</strong> ${scramble}`;
        if (localStorage.getItem(`complete-${new Date().toDateString()}-${index}`)) {
            div.classList.add('completed');
        }
        container.appendChild(div);
    });
}

function updateCurrentScramble() {
    const textElement = document.getElementById('currentScrambleText');
    if (currentScrambleIndex < scrambles.length) {
        textElement.textContent = scrambles[currentScrambleIndex];
    } else {
        textElement.textContent = 'All scrambles completed!';
    }
}

// Timer functions
function toggleTimer() {
    if (isRunning) {
        stopTimer();
    } else if (isInspecting) {
        startTimer();
    }
}

function startTimer() {
    if (currentScrambleIndex >= scrambles.length) {
        alert("You've already solved all scrambles today, come back tomorrow.");
        return;
    }
    if (!isRunning) {
        startTime = Date.now() - elapsedTime;
        timerInterval = setInterval(updateTimer, 10);
        isRunning = true;
        isInspecting = false;
        updateTimerColor();
    }
}

function stopTimer() {
    if (isRunning) {
        clearInterval(timerInterval);
        isRunning = false;
        logSolve();
        markComplete(currentScrambleIndex);
        currentScrambleIndex++;
        updateCurrentScramble();
        updateTimerColor();
        // Do not reset timer here - let user do it manually
    }
}

function resetTimer() {
    clearInterval(timerInterval);
    elapsedTime = 0;
    isRunning = false;
    isInspecting = false;
    document.getElementById('timer').textContent = '00:00.00';
    updateTimerColor();
}

function updateTimer() {
    elapsedTime = Date.now() - startTime;
    const minutes = Math.floor(elapsedTime / 60000);
    const seconds = Math.floor((elapsedTime % 60000) / 1000);
    const milliseconds = Math.floor((elapsedTime % 1000) / 10);
    document.getElementById('timer').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
}

function updateTimerColor() {
    const timerElement = document.getElementById('timer');
    timerElement.classList.remove('inspection', 'running');
    if (isInspecting) {
        timerElement.classList.add('inspection');  // Orange
    } else if (isRunning) {
        timerElement.classList.add('running');  // Green
    }  // Default is red (stopped)
}

function logSolve() {
    const solve = {
        scramble: scrambles[currentScrambleIndex],
        time: document.getElementById('timer').textContent,
        dateTime: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
        favorited: false
    };
    solveHistory.unshift(solve);  // Add to top
    saveHistory();
    displayHistory();
}

function displayHistory() {
    const logDiv = document.getElementById('solveLog');
    const listDiv = document.getElementById('solveList');
    listDiv.innerHTML = '';
    solveHistory.forEach((solve, index) => {
        const entryDiv = document.createElement('div');
        entryDiv.className = 'solve-entry';
        if (solve.favorited) {
            entryDiv.classList.add('favorited');
        }
        entryDiv.innerHTML = `
            <div class="entry-actions">
                <button class="favorite-btn ${solve.favorited ? 'favorited' : ''}" onclick="toggleFavorite(${index})">${solve.favorited ? '★' : '☆'}</button>
                <button class="delete-btn" onclick="deleteSolve(${index})">🗑️</button>
            </div>
            <p><strong>Scramble:</strong> ${solve.scramble}</p>
            <p><strong>Time:</strong> ${solve.time}</p>
            <p><strong>Date and Time:</strong> ${solve.dateTime}</p>
        `;
        listDiv.appendChild(entryDiv);
    });
    if (solveHistory.length > 0) {
        logDiv.style.display = 'block';
    } else {
        logDiv.style.display = 'none';
    }
}

function toggleFavorite(index) {
    solveHistory[index].favorited = !solveHistory[index].favorited;
    saveHistory();
    displayHistory();
}

function deleteSolve(index) {
    solveHistory.splice(index, 1);
    saveHistory();
    displayHistory();
}

function markComplete(index) {
    const key = `complete-${new Date().toDateString()}-${index}`;
    localStorage.setItem(key, 'true');
    displayScrambles();
}

// Keyboard event listeners for space bar
document.addEventListener('keydown', function(event) {
    if (event.code === 'Space' && !isRunning) {
        event.preventDefault();
        isInspecting = true;
        updateTimerColor();
    }
});

document.addEventListener('keyup', function(event) {
    if (event.code === 'Space') {
        event.preventDefault();
        toggleTimer();
    }
});

// Load on page load
window.onload = function() {
    loadHistory();
    generateScrambles();
};