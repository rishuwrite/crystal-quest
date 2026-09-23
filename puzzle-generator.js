class PuzzleGenerator {
    constructor() {
        this.crystalTypes = [
            { id: 'red', emoji: '', class: 'crystal-red' },
            { id: 'blue', emoji: '🔵', class: 'crystal-blue' },
            { id: 'green', emoji: '🟢', class: 'crystal-green' },
            { id: 'yellow', emoji: '🟡', class: 'crystal-yellow' },
            { id: 'purple', emoji: '🟣', class: 'crystal-purple' },
            { id: 'orange', emoji: '🟠', class: 'crystal-orange' },
            { id: 'pink', emoji: '🩷', class: 'crystal-pink' },
            { id: 'cyan', emoji: '🔷', class: 'crystal-cyan' }
        ];
    }

    generatePuzzle(size, difficulty) {
        // Initialize empty grid
        const grid = Array(size).fill(null).map(() => Array(size).fill(null));
        const solution = Array(size).fill(null).map(() => Array(size).fill(null));
        
        // Calculate number of crystals based on difficulty and size
        const numCrystals = this.calculateNumCrystals(size, difficulty);
        
        // Select crystal types to use
        const selectedCrystals = this.crystalTypes.slice(0, numCrystals);
        
        // Generate solution using backtracking
        if (!this.solvePuzzle(grid, solution, selectedCrystals, 0, size)) {
            // If generation fails, retry
            return this.generatePuzzle(size, difficulty);
        }
        
        // Create puzzle by removing some crystals
        const puzzle = this.createPuzzleFromSolution(solution, difficulty);
        
        return {
            solution: solution,
            puzzle: puzzle,
            crystals: selectedCrystals,
            size: size
        };
    }

    calculateNumCrystals(size, difficulty) {
        // Base number on size and difficulty
        const baseNum = Math.floor(size * 0.6);
        
        switch(difficulty) {
            case 'easy':
                return Math.max(3, baseNum - 2);
            case 'medium':
                return Math.max(4, baseNum - 1);
            case 'hard':
                return Math.max(5, baseNum);
            case 'expert':
                return Math.max(6, baseNum + 1);
            default:
                return baseNum;
        }
    }

    solvePuzzle(grid, solution, crystals, index, size) {
        if (index >= crystals.length) {
            return true; // All crystals placed
        }

        const crystal = crystals[index];
        const positions = this.getValidPositions(grid, size);

        // Shuffle positions for randomness
        this.shuffleArray(positions);

        for (const pos of positions) {
            const { row, col } = pos;

            if (this.canPlaceCrystal(grid, row, col, size)) {
                // Place crystal
                grid[row][col] = crystal;
                solution[row][col] = crystal;

                // Recursively place next crystal
                if (this.solvePuzzle(grid, solution, crystals, index + 1, size)) {
                    return true;
                }

                // Backtrack
                grid[row][col] = null;
                solution[row][col] = null;
            }
        }

        return false;
    }

    canPlaceCrystal(grid, row, col, size) {
        // Check if cell is empty
        if (grid[row][col] !== null) {
            return false;
        }

        // Check row and column
        for (let i = 0; i < size; i++) {
            if (grid[row][i] !== null || grid[i][col] !== null) {
                return false;
            }
        }

        // Check all 8 directions (no touching including diagonals)
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];

        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;

            if (newRow >= 0 && newRow < grid.length && 
                newCol >= 0 && newCol < grid[0].length) {
                if (grid[newRow][newCol] !== null) {
                    return false;
                }
            }
        }

        return true;
    }

    getValidPositions(grid, size) {
        const positions = [];
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                positions.push({ row, col });
            }
        }
        return positions;
    }

    createPuzzleFromSolution(solution, difficulty) {
        const size = solution.length;
        const puzzle = solution.map(row => [...row]);
        
        // Calculate how many crystals to hide based on difficulty
        let hidePercentage;
        switch(difficulty) {
            case 'easy': hidePercentage = 0.3; break;
            case 'medium': hidePercentage = 0.5; break;
            case 'hard': hidePercentage = 0.7; break;
            case 'expert': hidePercentage = 0.85; break;
            default: hidePercentage = 0.5;
        }

        const numToHide = Math.floor(solution.flat().filter(c => c !== null).length * hidePercentage);
        let hidden = 0;

        while (hidden < numToHide) {
            const row = Math.floor(Math.random() * size);
            const col = Math.floor(Math.random() * size);
            
            if (puzzle[row][col] !== null) {
                puzzle[row][col] = null;
                hidden++;
            }
        }

        return puzzle;
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    validateMove(grid, row, col, crystal, size) {
        // Check if cell is empty
        if (grid[row][col] !== null) {
            return { valid: false, reason: 'Cell already occupied' };
        }

        // Check row
        for (let c = 0; c < size; c++) {
            if (grid[row][c]?.id === crystal.id) {
                return { valid: false, reason: 'Crystal already in row' };
            }
        }

        // Check column
        for (let r = 0; r < size; r++) {
            if (grid[r][col]?.id === crystal.id) {
                return { valid: false, reason: 'Crystal already in column' };
            }
        }

        // Check touching (all 8 directions)
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];

        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;

            if (newRow >= 0 && newRow < size && newCol >= 0 && newCol < size) {
                if (grid[newRow][newCol] !== null) {
                    return { valid: false, reason: 'Crystals cannot touch' };
                }
            }
        }

        return { valid: true };
    }

    getHintInfo(grid, solution, size) {
        // Find an empty cell that should have a crystal
        const emptyCells = [];
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                if (grid[row][col] === null && solution[row][col] !== null) {
                    emptyCells.push({ row, col, crystal: solution[row][col] });
                }
            }
        }

        if (emptyCells.length === 0) {
            return null;
        }

        // Return a random empty cell
        return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }

    getStrategicHint(grid, solution, size) {
        // Analyze the grid and provide strategic advice
        const hints = [];

        // Check rows without crystals
        for (let row = 0; row < size; row++) {
            let hasCrystal = false;
            for (let col = 0; col < size; col++) {
                if (grid[row][col] !== null) {
                    hasCrystal = true;
                    break;
                }
            }
            if (!hasCrystal) {
                hints.push(`Row ${row + 1} needs a crystal`);
            }
        }

        // Check columns without crystals
        for (let col = 0; col < size; col++) {
            let hasCrystal = false;
            for (let row = 0; row < size; row++) {
                if (grid[row][col] !== null) {
                    hasCrystal = true;
                    break;
                }
            }
            if (!hasCrystal) {
                hints.push(`Column ${col + 1} needs a crystal`);
            }
        }

        // Find cells with limited options
        const limitedCells = this.findLimitedOptions(grid, solution, size);
        if (limitedCells.length > 0) {
            const cell = limitedCells[0];
            hints.push(`Try placing ${cell.crystal.emoji} at row ${cell.row + 1}, column ${cell.col + 1}`);
        }

        return hints.length > 0 ? hints[Math.floor(Math.random() * hints.length)] : "Look for rows or columns that don't have crystals yet";
    }

    findLimitedOptions(grid, solution, size) {
        const options = [];
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                if (grid[row][col] === null && solution[row][col] !== null) {
                    options.push({
                        row,
                        col,
                        crystal: solution[row][col]
                    });
                }
            }
        }
        return options;
    }
}