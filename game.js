class CrystalQuestGame {
    constructor() {
        this.generator = new PuzzleGenerator();
        this.currentLevel = 1;
        this.score = 0;
        this.mistakes = 0;
        this.maxMistakes = 3;
        this.gridSize = 8;
        this.difficulty = 'easy';
        this.selectedCrystal = null;
        this.hints = {
            reveal: 3,
            hint: 3,
            check: 3
        };
        this.currentPuzzle = null;
        this.grid = [];
        this.gameState = 'playing'; // playing, won, lost
        
        this.init();
    }

    init() {
        this.loadProgress();
        this.setupEventListeners();
        this.startLevel();
    }

    setupEventListeners() {
        document.getElementById('back-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to exit?')) {
                this.backToMenu();
            }
        });

        document.getElementById('settings-btn').addEventListener('click', () => {
            this.showSettings();
        });
    }

    loadProgress() {
        const saved = localStorage.getItem('crystalQuestProgress');
        if (saved) {
            const progress = JSON.parse(saved);
            this.currentLevel = progress.level || 1;
            this.score = progress.score || 0;
        }
    }

    saveProgress() {
        const progress = {
            level: this.currentLevel,
            score: this.score
        };
        localStorage.setItem('crystalQuestProgress', JSON.stringify(progress));
    }

    startLevel() {
        // Determine difficulty and size based on level
        this.gridSize = this.calculateGridSize(this.currentLevel);
        this.difficulty = this.calculateDifficulty(this.currentLevel);
        
        // Reset level state
        this.mistakes = 0;
        this.hints = { reveal: 3, hint: 3, check: 3 };
        this.selectedCrystal = null;
        this.gameState = 'playing';

        // Generate puzzle
        this.currentPuzzle = this.generator.generatePuzzle(this.gridSize, this.difficulty);
        this.grid = this.currentPuzzle.puzzle.map(row => row.map(cell => cell ? {...cell} : null));

        // Update UI
        this.updateUI();
        this.renderGrid();
        this.renderCrystalsToPlace();
        this.updateHintButtons();
        
        // Hide modals
        this.hideAllModals();
    }

    calculateGridSize(level) {
        if (level <= 5) return 8;
        if (level <= 10) return 9;
        if (level <= 15) return 10;
        if (level <= 20) return 11;
        if (level <= 25) return 12;
        return Math.min(15, 8 + Math.floor(level / 5));
    }

    calculateDifficulty(level) {
        if (level <= 3) return 'easy';
        if (level <= 7) return 'medium';
        if (level <= 12) return 'hard';
        return 'expert';
    }

    updateUI() {
        document.getElementById('level-display').textContent = this.currentLevel;
        document.getElementById('score-display').textContent = this.score;
        document.getElementById('difficulty-display').textContent = 
            this.difficulty.charAt(0).toUpperCase() + this.difficulty.slice(1);
        
        // Update mistake hearts
        const hearts = document.querySelectorAll('.heart');
        hearts.forEach((heart, index) => {
            if (index < this.mistakes) {
                heart.classList.add('lost');
            } else {
                heart.classList.remove('lost');
            }
        });
    }

    renderGrid() {
        const container = document.getElementById('grid-container');
        container.innerHTML = '';
        container.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`;

        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;

                if (this.grid[row][col]) {
                    cell.textContent = this.grid[row][col].emoji;
                    cell.classList.add(this.grid[row][col].class, 'crystal');
                }

                cell.addEventListener('click', () => this.handleCellClick(row, col));
                cell.addEventListener('dblclick', () => this.handleCellDoubleClick(row, col));
                cell.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.handleCellRightClick(row, col);
                });

                container.appendChild(cell);
            }
        }
    }

    renderCrystalsToPlace() {
        const container = document.getElementById('crystals-to-place');
        container.innerHTML = '';

        const crystalsUsed = {};
        this.grid.flat().forEach(cell => {
            if (cell) {
                crystalsUsed[cell.id] = (crystalsUsed[cell.id] || 0) + 1;
            }
        });

        this.currentPuzzle.crystals.forEach(crystal => {
            const count = this.currentPuzzle.solution.flat().filter(c => c?.id === crystal.id).length;
            const placed = crystalsUsed[crystal.id] || 0;
            const remaining = count - placed;

            for (let i = 0; i < remaining; i++) {
                const crystalEl = document.createElement('div');
                crystalEl.className = `crystal-item ${crystal.class}`;
                crystalEl.textContent = crystal.emoji;
                crystalEl.dataset.crystalId = crystal.id;
                
                crystalEl.addEventListener('click', () => {
                    this.selectCrystal(crystal);
                });

                container.appendChild(crystalEl);
            }
        });
    }

    selectCrystal(crystal) {
        // Deselect if already selected
        if (this.selectedCrystal?.id === crystal.id) {
            this.selectedCrystal = null;
        } else {
            this.selectedCrystal = crystal;
        }

        // Update UI
        document.querySelectorAll('.crystal-item').forEach(el => {
            el.classList.remove('selected');
        });

        if (this.selectedCrystal) {
            document.querySelectorAll(`.crystal-item[data-crystal-id="${crystal.id}"]`)
                .forEach(el => el.classList.add('selected'));
        }
    }

    handleCellClick(row, col) {
        if (this.gameState !== 'playing') return;
        if (!this.selectedCrystal) {
            this.showMessage('Select a crystal first!', 'warning');
            return;
        }

        // Validate move
        const validation = this.generator.validateMove(
            this.grid, row, col, this.selectedCrystal, this.gridSize
        );

        if (validation.valid) {
            // Place crystal
            this.grid[row][col] = {...this.selectedCrystal};
            this.renderGrid();
            this.renderCrystalsToPlace();
            this.checkWinCondition();
        } else {
            // Invalid move
            this.mistakes++;
            this.updateUI();
            this.showMessage(validation.reason, 'error');
            
            if (this.mistakes >= this.maxMistakes) {
                this.gameOver();
            }
        }
    }

    handleCellDoubleClick(row, col) {
        if (this.gameState !== 'playing') return;
        if (!this.grid[row][col]) return;

        // Confirm placement (optional feature)
        const cell = document.querySelector(`.grid-cell[data-row="${row}"][data-col="${col}"]`);
        cell.classList.add('check-correct');
        setTimeout(() => cell.classList.remove('check-correct'), 500);
    }

    handleCellRightClick(row, col) {
        if (this.gameState !== 'playing') return;
        
        const cell = document.querySelector(`.grid-cell[data-row="${row}"][data-col="${col}"]`);
        cell.classList.toggle('marked');
    }

    checkWinCondition() {
        // Check if all crystals are placed correctly
        let allCorrect = true;
        let allPlaced = true;

        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const current = this.grid[row][col];
                const solution = this.currentPuzzle.solution[row][col];

                if (solution && !current) {
                    allPlaced = false;
                    break;
                }

                if (current?.id !== solution?.id) {
                    allCorrect = false;
                    break;
                }
            }
            if (!allPlaced || !allCorrect) break;
        }

        if (allCorrect && allPlaced) {
            this.levelComplete();
        }
    }

    levelComplete() {
        this.gameState = 'won';
        const levelScore = this.calculateLevelScore();
        this.score += levelScore;
        this.saveProgress();

        document.getElementById('final-score').textContent = levelScore;
        document.getElementById('level-complete-modal').classList.remove('hidden');
    }

    calculateLevelScore() {
        const baseScore = this.gridSize * 100;
        const difficultyMultiplier = {
            'easy': 1,
            'medium': 1.5,
            'hard': 2,
            'expert': 3
        }[this.difficulty];
        
        const mistakePenalty = this.mistakes * 100;
        const hintPenalty = (9 - (this.hints.reveal + this.hints.hint + this.hints.check)) * 50;

        return Math.max(100, Math.floor(baseScore * difficultyMultiplier - mistakePenalty - hintPenalty));
    }

    gameOver() {
        this.gameState = 'lost';
        document.getElementById('game-over-modal').classList.remove('hidden');
    }

    useHint(type) {
        if (this.gameState !== 'playing') return;
        if (this.hints[type] <= 0) {
            this.showMessage('No hints remaining!', 'warning');
            return;
        }

        this.hints[type]--;
        this.updateHintButtons();

        switch(type) {
            case 'reveal':
                this.useRevealHint();
                break;
            case 'hint':
                this.useStrategicHint();
                break;
            case 'check':
                this.useCheckHint();
                break;
        }
    }

    useRevealHint() {
        const hint = this.generator.getHintInfo(this.grid, this.currentPuzzle.solution, this.gridSize);
        if (!hint) {
            this.showMessage('No hints available!', 'warning');
            return;
        }

        const cell = document.querySelector(`.grid-cell[data-row="${hint.row}"][data-col="${hint.col}"]`);
        cell.textContent = hint.crystal.emoji;
        cell.classList.add(hint.crystal.class, 'crystal', 'hint-reveal');
        this.grid[hint.row][hint.col] = {...hint.crystal};

        setTimeout(() => {
            cell.classList.remove('hint-reveal');
            this.renderCrystalsToPlace();
            this.checkWinCondition();
        }, 1000);
    }

    useStrategicHint() {
        const hint = this.generator.getStrategicHint(this.grid, this.currentPuzzle.solution, this.gridSize);
        this.showMessage(hint, 'info', 5000);
    }

    useCheckHint() {
        // Check 3 random empty cells
        const emptyCells = [];
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (!this.grid[row][col]) {
                    emptyCells.push({ row, col });
                }
            }
        }

        if (emptyCells.length === 0) {
            this.showMessage('Grid is full!', 'warning');
            return;
        }

        // Shuffle and pick 3
        this.generator.shuffleArray(emptyCells);
        const cellsToCheck = emptyCells.slice(0, 3);

        cellsToCheck.forEach(({ row, col }) => {
            const cell = document.querySelector(`.grid-cell[data-row="${row}"][data-col="${col}"]`);
            const hasCrystal = this.currentPuzzle.solution[row][col] !== null;

            if (hasCrystal) {
                cell.classList.add('check-correct');
                setTimeout(() => cell.classList.remove('check-correct'), 1000);
            } else {
                cell.classList.add('check-wrong');
                setTimeout(() => cell.classList.remove('check-wrong'), 1000);
            }
        });
    }

    updateHintButtons() {
        document.getElementById('hint-reveal-count').textContent = this.hints.reveal;
        document.getElementById('hint-hint-count').textContent = this.hints.hint;
        document.getElementById('hint-check-count').textContent = this.hints.check;

        document.getElementById('hint-reveal').disabled = this.hints.reveal === 0;
        document.getElementById('hint-hint').disabled = this.hints.hint === 0;
        document.getElementById('hint-check').disabled = this.hints.check === 0;
    }

    showMessage(message, type = 'info', duration = 3000) {
        const modal = document.getElementById('modal-overlay');
        const content = document.getElementById('modal-content');
        
        const colors = {
            'info': '#667eea',
            'warning': '#f39c12',
            'error': '#e74c3c'
        };

        content.innerHTML = `
            <div style="padding: 20px; background: ${colors[type]}; color: white; border-radius: 15px;">
                <p style="font-size: 18px; font-weight: bold;">${message}</p>
            </div>
        `;
        
        modal.classList.remove('hidden');
        
        setTimeout(() => {
            modal.classList.add('hidden');
        }, duration);
    }

    hideAllModals() {
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.classList.add('hidden');
        });
    }

    nextLevel() {
        this.currentLevel++;
        this.startLevel();
    }

    retryLevel() {
        this.startLevel();
    }

    backToMenu() {
        if (confirm('Save progress and return to menu?')) {
            this.saveProgress();
            // In a real app, this would navigate to menu
            alert('Returning to main menu...');
        }
    }

    showSettings() {
        const soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
        const newSound = !soundEnabled;
        localStorage.setItem('soundEnabled', newSound);
        this.showMessage(newSound ? 'Sound enabled' : 'Sound disabled', 'info');
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new CrystalQuestGame();
});

// Global functions for HTML onclick handlers
function useHint(type) {
    if (window.game) {
        window.game.useHint(type);
    }
}

function nextLevel() {
    if (window.game) {
        window.game.nextLevel();
    }
}

function retryLevel() {
    if (window.game) {
        window.game.retryLevel();
    }
}

function backToMenu() {
    if (window.game) {
        window.game.backToMenu();
    }
}