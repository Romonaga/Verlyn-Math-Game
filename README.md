# Verlyn Math Game

A lightweight browser-based starter slice for Verlyn Math Game.

## Current playable loop

- Scales difficulty across levels with addition, subtraction, multiplication, division, and mixed-operation prompts.
- Shows exactly 3 answer choices for every question with 1 correct answer.
- Awards 2 points for correct answers.
- Applies a 2 point penalty for wrong answers.
- Counts timeouts as misses without changing score.
- Uses a tightening timer profile across levels: 10 seconds, 8 seconds, 6 seconds, then 5-6 second mixed-operation rounds.
- Gives each level 12 questions to reach the 20 point milestone.
- Shows a visible level-clear transition before the next level starts.
- Exposes a level-fail state with a retry button when the target is missed.
- Tracks a live correct-answer streak and best streak during each run.
- Shows run accuracy and a correct-versus-misses breakdown as first-class player stats.
- Persists lifetime correct answers, misses, best score, and highest level in local browser storage.
- Displays the live round count alongside score, progress, level, timer, streak tracking, and operator guidance.

## Run locally

Open `index.html` in a browser.
