# Verlyn Math Game

A lightweight browser-based starter slice for Verlyn Math Game.

## Current playable loop

- Generates quick addition and subtraction questions.
- Shows exactly 3 answer choices for every question with 1 correct answer.
- Awards 5 points for correct answers.
- Applies a 2 point penalty for wrong answers or timeouts.
- Uses a tightening timer profile across levels: 10 seconds, 8 seconds, then 6 seconds per question.
- Treats wrong answers and timeouts as misses with the same 2 point penalty.
- Tracks a live correct-answer streak and best streak during each run.
- Shows run accuracy and a correct-versus-misses breakdown as first-class player stats.
- Persists lifetime correct answers, misses, best score, and highest level in local browser storage.
- Advances the player to the next level when they reach 20 points, shows a level-clear transition, and resets progress for the next timer tier.
- Displays the live round count alongside score, progress, level, timer, streak tracking, and operator guidance.

## Run locally

Open `index.html` in a browser.
