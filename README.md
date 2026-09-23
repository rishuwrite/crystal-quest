# Crystal Quest - Puzzle Game

A challenging puzzle game where you place crystals on a grid following specific rules.

## Features

- **Progressive Difficulty**: Levels 1-∞ with increasing grid sizes (8x8 to 15x15)
- **Three Hint Systems**:
  - 🔮 Reveal Crystal: Directly places a crystal
  - 💡 Strategic Hint: Provides solving advice
  - 🔍 Check Spot: Verifies if 3 random cells should have crystals
- **Three Lives System**: Make 3 mistakes and game over
- **Multiple Color Themes**: 8 different crystal colors
- **Auto-save Progress**: Never lose your progress

## Game Rules

1. **One crystal per color**: Each color can only be used once
2. **One crystal per row and column**: No duplicates in rows or columns
3. **No touching**: Crystals cannot touch each other (including diagonally)

## Installation

### Prerequisites
- Node.js (v18 or higher)
- Java JDK 17
- Android SDK

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/crystal-quest.git
cd crystal-quest

# Install dependencies
npm install

# Install Cordova globally
npm install -g cordova

# Add Android platform
cordova platform add android

# Run locally
npm start