# Rhythm Rush

<img width="1391" height="623" alt="image" src="https://github.com/user-attachments/assets/1afa5af5-e8c1-4498-be9f-5d6fc921af05" />

Rhythm Rush is a browser-based rhythm game inspired by *Piano Tiles*.  
Tap the falling tiles as they reach the bottom line to score points.  
Built with HTML5 Canvas and JavaScript, it works smoothly on both desktop and mobile. 

## Live Demo

Try the game in your browser: Rhythm Rush on GitHub Pages. (No installation required – just open the link and start playing.)

    https://adityapatil343.github.io/RhythmRush/

## Features

- **Responsive Gameplay** – Smooth HTML5 Canvas graphics that adapt to any screen size, desktop or mobile.  
- **Light & Dark Themes** – Switch between light and dark mode with a single click.  
- **Scoring & High Score** – Live score updates and your best score saved locally in the browser.  
- **Audio Feedback** – Simple sound effects for hits and a unique tone when the game ends.  
- **Pause & Resume** – Take a break anytime and continue right where you left off.  
- **Multiple Inputs** – Play with touch, mouse clicks, or keyboard (Space bar to start/pause).  

## How to Play

- **Start the game:** Click the “Play” button on the screen (or press the **Space** key) to begin a round.  

- **Tap the tiles:** Black tiles will start falling down through four columns. Tap each tile as it reaches the horizontal *hit line* at the bottom of the screen.  

- **Score points:** Each successful tile tap earns you 1 point. The tile will light up or flash to indicate a correct hit.  

- **Avoid misses:** If a tile passes the hit line without being tapped, or if you tap when no tile is there, the game ends immediately (**Game Over**).  

- **Pause/Resume:** You can pause the game by clicking **Pause** (or pressing **Space**). To continue, press **Space** again or click the **Resume** button.  

- **High score:** After the game is over, your final score is shown and compared to your best score. Try again to beat it!  

## How it Works (Game Logic)

- The game runs completely in your browser using **HTML5 canvas** for graphics.  
- A continuous game loop makes the tiles fall smoothly down the screen.  
- New tiles appear randomly in one of four columns. As time passes, they drop faster and more often to make the game harder.  
- When you tap a tile right as it crosses the hit line:
  - The game counts it as a **hit**.  
  - A short tone plays for feedback.  
  - Your score goes up by 1.  
- If your score beats your previous best, the new **high score** is saved in your browser so it’s there next time.  
- If you miss a tile or tap the wrong spot:
  - The game ends immediately (**Game Over**).  
  - A different sound plays.  
  - An overlay shows your final score and your best score.  

## Open Source and Contributing

- **Rhythm Rush** is open source under the MIT License.  
- Anyone is welcome to use it, improve it, or share new ideas.  
- Found a bug or have a feature in mind?  
  - Open an issue in the GitHub repo, or  
  - Send a pull request with your changes.  
- All feedback and contributions are appreciated — the goal is to keep making Rhythm Rush better together.  
