# Rhythm Rush

<img width="1391" height="623" alt="image" src="https://github.com/user-attachments/assets/1afa5af5-e8c1-4498-be9f-5d6fc921af05" />

Rhythm Rush is a browser-based rhythm tapping game inspired by the popular Piano Tiles. It challenges players to tap on falling tiles in time as they cross the bottom of the screen. Built with HTML5 Canvas and JavaScript, the game runs entirely in the browser and adapts to both desktop and mobile screens.

## Features

Canvas-Based, Responsive Gameplay: Smooth graphics are rendered on an HTML5 canvas. The layout scales to different screen sizes (desktop or mobile) for a responsive experience.

Light and Dark Theme Support: Toggle between light mode and dark mode for a comfortable visual experience in different environments.

Scoring and High Score Tracking: Earn points for each tile you hit. Your current score is displayed live, and your all-time best score is saved locally and shown as the “Best” score.

Audio Feedback: Enjoy simple sound effects for each successful hit, plus a distinctive tone when the game ends, providing audio feedback as you play.

Pause and Resume Controls: Pause the game at any time and resume exactly where you left off using the on-screen button or the spacebar. This allows you to take breaks and continue the game seamlessly.

Keyboard & Touch/Mouse Input: Supports multiple input methods – tap with a finger on touchscreens, click with a mouse, or use keyboard controls (e.g. press the Space bar to start/pause the game).

## Live Demo

Try the game in your browser: Rhythm Rush on GitHub Pages. (No installation required – just open the link and start playing.)

    https://adityapatil343.github.io/RhythmRush/

## How to Play

- **Start the game:** Click the “Play” button on the screen (or press the **Space** key) to begin a round.  

- **Tap the tiles:** Black tiles will start falling down through four columns. Tap each tile as it reaches the horizontal *hit line* at the bottom of the screen.  

- **Score points:** Each successful tile tap earns you 1 point. The tile will light up or flash to indicate a correct hit.  

- **Avoid misses:** If a tile passes the hit line without being tapped, or if you tap when no tile is there, the game ends immediately (**Game Over**).  

- **Pause/Resume:** You can pause the game by clicking **Pause** (or pressing **Space**). To continue, press **Space** again or click the **Resume** button.  

- **High score:** After the game is over, your final score is shown and compared to your best score. Try again to beat it!  

## Project Logic Overview

Behind the scenes, Rhythm Rush runs entirely in the browser using an HTML5 canvas and a continuous game loop to animate the falling tiles. The game spawns tiles at random in one of four columns, and as time goes on, the tiles fall faster and appear more frequently to increase the challenge. When a tile is tapped at the correct time (as it crosses the hit area), the game registers a “hit” — a tone plays and the score increases. If the current score surpasses the previous high score, the stored high score is updated in local storage. Conversely, if the player misses a tile or taps incorrectly, the game triggers a Game Over state (accompanied by a sound effect and an overlay showing the final score and best score).

## Open Source and Contributing

Rhythm Rush is an open-source project (released under the MIT License), and others are welcome to contribute. If you find a bug or have an idea for an enhancement, feel free to open an issue or submit a pull request on the GitHub repository. We appreciate feedback and contributions from the community to help make Rhythm Rush even better.
