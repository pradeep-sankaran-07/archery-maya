# 🏹 Archery Maya

A 2D adventure game for kids. Pick a hero, choose your bow and arrow, then run through four levels: target archery, grocery store math, moving-target archery, and a Mario-style platformer that takes you from land into the sea and back to a victory flag.

## ▶ Play now

**[https://pradeep-sankaran-07.github.io/archery-maya/](https://pradeep-sankaran-07.github.io/archery-maya/)**

## Controls

- `←` / `→` &nbsp; walk
- `↑` &nbsp; jump (or aim up / swim up)
- `↓` &nbsp; aim down / swim down
- `Space` &nbsp; shoot your arrow
- `Enter` &nbsp; pick an answer / shoot
- `M` &nbsp; mute / unmute

Works in any browser. Touch controls auto-appear on iPad.

## Cast (17 characters)

**Kids:** Maya, Alya, Lily, Amarah, Live, Aisha, Isma, Tejas
**Grown-ups:** Pradeep, Karen
**Grandparents:** Thatha, Paati, Lolo, Lola
**Aunty & Uncle:** Ninang, DK
**Pet:** Benji (a dog who lunges instead of shooting!)

## How it plays

1. **Choose your hero** and **pick a bow** (4 shapes × 3 arrow colors)
2. **Archery Range** — Hit bullseyes to earn money. Bullseye = $5.
3. **Grocery Store** — 6 random math problems from a pool of 30+ templates. Different every play, scaled for a 2nd-grader (2-digit addition, repeated addition, change-making, "can you afford it" using your live money).
4. **Moving Targets** — Same archery, harder, more money per hit.
5. **Adventure!** — Mario-style platformer:
   - **Land:** Jump over snakes 🐍, shoot tigers 🐅, collect coins
   - **Pipe down to underwater:** Shoot sharks 🦈 and fish 🐟, swim around jellyfish (they can't be shot — dodge!)
   - **Pipe back up:** Reach the flag and hoist it for victory 🎉

Three hearts. Death respawns you at the last checkpoint with full hearts — never boots to title.

## Run locally

```
npm install
npm run dev    # http://localhost:5174
npm run build  # production build into dist/
```

## Tech

Vite + Phaser 3, vanilla JS. All sprites are drawn procedurally (no external image files). All sound effects synthesized via Web Audio. Progress saved to `localStorage`.

Made with love for a brave 7-year-old. 💖
