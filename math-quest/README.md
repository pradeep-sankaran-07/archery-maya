# ⭐ Math Quest

Story math for Maya (8): times tables and two-step word problems set in her favourite movies, plus stories about her own friends and family.

**Play:** https://pradeep-sankaran-07.github.io/archery-maya/math-quest/

## How it plays

1. Pick who is playing (the whole Archery Maya cast is here).
2. Pick a world: **Lion King**, **Mufasa**, **The Greatest Showman**, **Aladdin**, **The Mighty Ducks**, **School of Rock**, **Maya & Friends**, or **Surprise Mix**.
3. A round is 5 story questions. Each world has its own background, picture and music, and the questions start easy and climb.
4. Type the answer on the big number pad (or a keyboard) and press ✔.
   - Right first time: ⭐⭐⭐, confetti and a spoken "Great job!"
   - First wrong answer: a gentle sound and a **picture hint** (e.g. 7 groups of 4 legs, split into steps).
   - Second wrong answer: **we solve it together**, step by step, then she types the answer for her star.
5. After the round, tap the **treasure chest** to win a sticker (42 to collect, a gold one in every world for perfect rounds).
6. Badges (29) for streaks, perfect rounds, finishing a world, playing on different days, and more. Total stars move her up the ranks from Math Cub 🐣 to Math Royalty 👑.

**🔊 Read to me** reads the question aloud. 🔊 / 🗣️ in the top bar switch sounds and the voice off.

The **Grown-ups** page shows right-first-time rates by question type and lists the questions she found tricky.

## The questions

100 questions in [`src/questions.js`](src/questions.js), at Norwegian 3rd grade level (3. trinn):

| Type | Count | Example |
|---|---|---|
| Times tables | 55 | Zazu has 2 wings with 6 feathers on each |
| Two steps (multiply, then add or take away) | 30 | 5 baskets of 6 melons, gives 4 away |
| Sharing equally | 8 | 24 antelopes in 4 equal groups |
| Adding / taking away | 7 | 30 gumballs, 12 fall out |

The answer is worked out from each question's maths (`x: '5*6-4'`), and so are the hint and the worked solution. To add questions, append to the list and run:

```
npm run check:math
```

It checks the maths, keeps answers between 0 and 100, and makes sure every number in the maths is in the story.

## Development

```
npm install
npm run dev:math   # http://localhost:5176
npm run build      # builds all three games into dist/
```

Plain JavaScript + Vite, no images or sound files: the movie-themed scenes are drawn in SVG (no movie pictures are used), sounds are made with Web Audio and the cheers use the browser's built-in voice. Progress is saved on the device (localStorage), per player.
