# Football Blah-Blah: game plan (working title was "Football Maya")

Built from a chat between Maya (8) and her dad. This file is the design spec. The 8-year-old check is at the bottom.

## What Maya asked for, and where it ends up

| Maya's idea | In the game |
|---|---|
| Football with all her friends and family on different teams | All characters from Archery Maya play, with their names floating over their heads. You pick one of them to be you. |
| On a school pitch ("like in the alumni school") | A small school pitch with a fence round it (like a Norwegian *ballbinge*). The walls bounce the ball back, so there are no throw-ins. |
| Kick, pass, header | **KICK** shoots at the goal. **PASS** gives the ball to your teammate, who always passes back. When the ball is at head height, KICK turns into **HEADER**. |
| A goalie button | Before you play you choose: "⚽ Score goals" or "🧤 Be the goalie". |
| Whole team gets a trophy: 1st, 2nd, 3rd place | A short **Maya Cup** with 3 teams. You play 2 quick matches, and the third match (between the other 2 teams) is played by the computer. The table decides the 🥇🥈🥉 trophies. |
| Goal scorers get extra prizes | Every goal scorer gets a medal, and the top scorer gets the **Golden Boot 👟**. |
| Open the trophy for a surprise (ice cream, a funny diaper...) | Tap your trophy to open it: ice cream, teddy, diamond... or a **DIAPER 🍼😂**. If it's a diaper you can buy a new trophy with your coins, or play again. |
| Bird button, then a flying carpet takes you up to kick a ball that is high in the air | When your teammate kicks a **sky ball**, a 🦜 **CARPET** button appears. Tap it and the carpet lifts you up to volley the ball. |
| Magic carpet power: fly so nobody can catch you, then score | A magic lamp sometimes appears on the pitch. Run over it and the gold **power button** lights up. Tap it to fly on the carpet with the ball (nobody can catch you), then press KICK for a **SUPER SHOT**, which always scores. |
| Aladdin + Greatest Showman | Choose a world: **Aladdin** (desert palace, palm trees, carpet, genie lamp, Rajah the tiger) or **Circus** (big top tent, lights, cannon + balloons, elephant). |
| Rajah the tiger | Once per match, when the other team is about to score, Rajah (or the circus elephant) runs in and scares them away. |
| Not too long | Each match is 80 seconds. The whole cup takes about 4 to 5 minutes. |
| Gift shop + leaderboard, like Archery Maya | Coins (kr) earned in the cup go to the leaderboard, then to a gift shop with Aladdin and circus toys (and diapers). |

## Screens (one decision per screen, big buttons)

1. **Title**: "Football Blah-Blah ⚽", one big **PLAY** button. Small: 🏆 leaderboard, 🔊 sound, 🇬🇧/🇳🇴 language.
2. **Choose your player**: big faces with names. The last pick (Maya by default) is pre-selected.
3. **Choose your world**: two big picture cards, 🧞 Aladdin and 🎪 Circus.
4. **Choose your job**: two big picture cards, ⚽ Score goals and 🧤 Be the goalie.
5. **Line-ups**: the 3 teams of 3 with names. One big **KICK OFF** button.
6. **Match** (80 s).
7. **Cup table**, showing the other match's result. **Next match**.
8. **Match 2**.
9. **Podium**: the 3 teams on the 🥇🥈🥉 steps, plus scorer medals and the Golden Boot.
10. **Open your trophy**: tap to open. On a diaper: buy a new trophy, or keep it.
11. **Leaderboard**: your name is already filled in, so one tap saves it.
12. **Gift shop**: tap to buy, ✕ to give back. **Done**.
13. **Your prizes**: everything you won, then **Play again**.

## Controls

**Phone (main target)**
- Put your thumb anywhere on the left half of the screen and a joystick appears under it. Drag to run.
- Right side: a big **KICK** button. Above it, a smaller **PASS** button. The gold **POWER** button shows up only when you have a power.
- The KICK label changes with the situation: SHOOT, HEADER, 🦜 CARPET, SUPER SHOT, DIVE (goalie), THROW (goalie).
- Works in landscape and portrait. In portrait the camera sits behind you and you attack "up" the screen. In landscape it's a TV-style side view and you attack to the right.

**Laptop**
- Arrow keys or WASD to run, **Space** to kick, **Shift** or **P** to pass, **E** or **Enter** for power. The on-screen buttons also work with a mouse.

## Making it easy (but not too easy)

- You run faster than the other team. The ball sticks to your feet when you get it.
- Your teammate always passes back to you, often into a good spot near the goal.
- KICK aims for itself: it picks the side of the goal away from the goalie. Pushing the joystick up or down picks a side.
- Shots from close are mostly goals (about 6 in 10). Far shots are mostly saved. Headers and carpet volleys sit in between. Super shots always score.
- If the other team gets the ball, run into them to take it back. They're slow at stealing from you.
- As goalie, a glowing circle shows where the shot is going a moment before it's kicked, so you can move there and tap DIVE.

## Coins (kr)

| Thing | kr |
|---|---|
| Your goal | 20 (+10 header, +10 carpet volley) |
| Team goal (someone else) | 5 |
| Save (goalie) | 10 |
| Match win / draw | 30 / 15 |
| Trophy: gold / silver / bronze | 50 / 30 / 15 |
| Golden Boot | 25 |

The leaderboard score is the kr you earned in the cup.

## Tech

- Three.js 3D (low-poly cartoon look, toon shading, blob shadows) and HTML/CSS overlay screens.
- Lives in `football-blah-blah/` of the archery-maya repo and reuses its character list (`src/config.js`), so new friends added to Archery Maya also turn up in Football Blah-Blah.
- Built by the same GitHub Pages workflow into `dist/football-blah-blah/`.
- Sounds made in the browser with Web Audio (kick, whistle, crowd, roar, cannon). No audio files.
- Leaderboard: a Supabase table `football_scores`, kept separate from the Archery board. If the table isn't there yet, the game keeps scores on the device.
- English and Norwegian.

## Check: can an 8-year-old play this without help?

| Question | Answer |
|---|---|
| Can she start without reading instructions? | Yes. Every screen has one big glowing button and a pre-selected choice, so tapping the big button 5 times starts a match. |
| Does she know which player she is? | A big "YOU" arrow and a glowing ring under her player, plus her name. |
| Does she know what to do in the match? | The first few seconds show "🕹️ Drag here to run" and "⚽ Tap KICK to shoot", with arrows. The goal she attacks has a bouncing arrow. |
| Can she read the buttons? | One or two words each, always with an emoji. |
| What if she stands still or gets lost? | Her teammate gets the ball and passes it to her, and the camera always follows the ball. |
| Will she score? | Yes. The tuning targets 2 to 5 goals per match for a kid who mostly runs at the goal and presses KICK. |
| Will she lose every time? | The other team is slower, and Rajah or the elephant comes to the rescue once a match. |
| Powers | A sparkly lamp or top hat with a beam of light and the message "Run to the magic lamp!". After that one gold button pulses. |
| Ending | Podium, then tap the trophy, then a surprise. The diaper is a joke with a way out (buy a new trophy). |
| Too long? | 2 × 80 s of play. |
