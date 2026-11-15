# ⚽ Football Blah-Blah

A short 3D football game for kids, designed by Maya (8) and built on the Archery Maya cast.

**Play:** https://pradeep-sankaran-07.github.io/archery-maya/football-blah-blah/

## How it plays

1. Tap **PLAY**, pick who you are (everyone from Archery Maya is here, Benji the dog too).
2. Pick a world: **Aladdin** (magic carpet, genie lamp, Rajah the tiger) or **Circus** (cannon, balloons, elephant).
3. Pick a job: **Score goals** or **Be the goalie**.
4. Play the cup: 3 teams, 2 quick matches of 80 seconds each. The table decides who gets the 🥇🥈🥉 trophies.
5. Open your trophy for a surprise (sometimes a diaper 🍼), save your score, buy gifts, see your prizes.

## Controls

| | Phone | Keyboard |
|---|---|---|
| Run | Drag anywhere on the left half | Arrow keys / WASD |
| Kick / shoot / header / dive / throw | Big red button | Space |
| Pass (your teammate always passes back) | Blue button | Shift |
| Magic power | Gold button (when it glows) | E |
| Pause | ⏸ top left | Esc |

The kick button changes with the moment: **SHOOT**, **HEADER** for a high ball, **🦜 CARPET** / **🤸 JUMP** for a sky ball, **🌟 SUPER** while flying.

## Magic

- A magic lamp (Aladdin) or top hat (Circus) appears on the pitch. Run over it, then tap the gold button.
  - Score goals: fly on the magic carpet or get shot out of the circus cannon. Nobody can catch you, and **SUPER** always scores.
  - Goalie: giant genie hands or a circus net stop every shot for a while.
- Once a match, when the other team gets close to your goal, Rajah the tiger (or the circus elephant) runs in and scares them off.

## Development

From the repo root:

```
npm install
npm run dev:football   # http://localhost:5175
npm run build          # builds Archery Maya into dist/ and this game into dist/football-blah-blah/
```

Three.js, vanilla JS, no image or sound files: models are built from shapes in code and sounds are synthesized with Web Audio. The character list is imported from `../src/config.js`, so friends added to Archery Maya show up here automatically.

## Shared leaderboard (one-time setup)

Scores go to the same Supabase project as Archery Maya, but to a separate table so the two boards don't mix. Until the table exists, the game keeps scores on the device. To switch on the shared board, run this once in the Supabase SQL editor:

```sql
create table football_scores (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 24),
  score int not null check (score between 0 and 100000),
  created_at timestamptz not null default now()
);
alter table football_scores enable row level security;
create policy "read" on football_scores for select to anon using (true);
create policy "insert" on football_scores for insert to anon with check (true);
```

See `PLAN.md` for the design and the 8-year-old checklist.
