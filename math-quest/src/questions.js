// The question bank: 100 story problems across 7 worlds.
//
// Each question:
//   id  unique id (never reuse one: progress is saved against it)
//   t   the story, as Maya will read it
//   x   the maths, written so the FIRST multiplication is
//       "number of groups * size of each group" (the hint draws it that way)
//   e   emoji for the thing being counted (drawn in groups in the hint)
//   m   (optional) the big picture next to the story, if not the same as e
//   u   unit shown after the answer box ("feathers", "kr"...)
//   who (Maya & Friends only) the friend in the story, from src/config.js
//
// The answer is worked out from `x`, so there is no answer to keep in sync.
// Run `npm run check:math` after adding questions.
//
// Level of difficulty follows Norwegian 3rd grade (3. trinn): times tables
// to 10, small 2-digit × 1-digit (12 × 2), sharing equally, and two-step
// problems (multiply, then add or take away a little).

export const QUESTIONS = {
  lionking: [
    { id: 'lk01', t: 'Zazu has 2 wings. Each wing has 6 shiny feathers. How many feathers does Zazu have?', x: '2*6', e: '🪶', m: '🐦', u: 'feathers' },
    { id: 'lk02', t: 'Pumbaa lifts 4 logs. Under each log there are 5 tasty bugs. How many bugs does Pumbaa find?', x: '4*5', e: '🐛', m: '🐗', u: 'bugs' },
    { id: 'lk03', t: 'Simba looks up at 6 trees. In each tree there are 3 birds. How many birds does he see?', x: '6*3', e: '🐦', u: 'birds' },
    { id: 'lk04', t: 'Timon eats 3 bugs for breakfast, 3 for lunch and 3 for dinner. How many bugs does he eat in 2 days?', x: '2*(3*3)', e: '🐛', u: 'bugs' },
    { id: 'lk05', t: 'Rafiki has 5 baskets with 6 melons in each. He gives 4 melons to Simba. How many melons does Rafiki have left?', x: '5*6-4', e: '🍈', m: '🐒', u: 'melons' },
    { id: 'lk06', t: '7 zebras splash in the water hole. Each zebra has 4 legs. How many legs are in the water?', x: '7*4', e: '🦵', m: '🦓', u: 'legs' },
    { id: 'lk07', t: 'Mufasa walks all the way around the Pride Lands 3 times a day. How many times does he walk around in 7 days?', x: '7*3', e: '👣', m: '🦁', u: 'times' },
    { id: 'lk08', t: 'The 3 hyenas, Shenzi, Banzai and Ed, each find 8 bones. How many bones do they find together?', x: '3*8', e: '🦴', u: 'bones' },
    { id: 'lk09', t: 'At the water hole, 9 elephants each make 2 big splashes. How many splashes is that?', x: '9*2', e: '💦', m: '🐘', u: 'splashes' },
    { id: 'lk10', t: 'Pumbaa has a pile of 30 grubs. He gobbles up 12 of them. How many grubs are left?', x: '30-12', e: '🐛', m: '🐗', u: 'grubs' },
    { id: 'lk11', t: '12 animals come to see baby Simba. Each one brings 2 flowers. How many flowers are there?', x: '12*2', e: '🌼', m: '🦁', u: 'flowers' },
    { id: 'lk12', t: '24 antelopes run across the plain in 4 equal groups. How many antelopes are in each group?', x: '24/4', e: '🦌', u: 'antelopes' },
    { id: 'lk13', t: 'Rafiki paints 6 rows of dots on his tree, with 5 dots in each row. Then he adds 3 more dots. How many dots are there now?', x: '6*5+3', e: '🔴', m: '🐒', u: 'dots' },
    { id: 'lk14', t: 'Each giraffe has 2 ears and 2 little horns. How many ears and horns do 10 giraffes have?', x: '10*(2+2)', e: '🔸', m: '🦒', u: 'ears and horns' },
    { id: 'lk15', t: 'Nala sees 5 groups of 7 butterflies. Then 6 butterflies fly away. How many butterflies are left?', x: '5*7-6', e: '🦋', u: 'butterflies' },
  ],

  mufasa: [
    { id: 'mu01', t: 'Young Mufasa swims past 6 lily pads. On each lily pad sit 2 frogs. How many frogs does he see?', x: '6*2', e: '🐸', u: 'frogs' },
    { id: 'mu02', t: 'Mufasa and Taka walk 8 km every day. How far do they walk in 4 days?', x: '4*8', e: '👣', m: '🦁', u: 'km' },
    { id: 'mu03', t: 'Rafiki points at 5 groups of stars in the night sky. Each group has 7 stars. How many stars is that?', x: '5*7', e: '⭐', m: '🐒', u: 'stars' },
    { id: 'mu04', t: '9 elephants walk to Milele. Each elephant has 1 trunk and 2 tusks. How many trunks and tusks are there altogether?', x: '9*(1+2)', e: '🔸', m: '🐘', u: 'trunks and tusks' },
    { id: 'mu05', t: 'Kiros leads 4 groups of 6 white lions. 5 lions get tired and go home. How many lions are still following Kiros?', x: '4*6-5', e: '🦁', u: 'lions' },
    { id: 'mu06', t: 'Sarabi finds 3 rows of flowers in Milele with 8 flowers in each row. Then 4 more flowers pop up. How many flowers are there?', x: '3*8+4', e: '🌸', u: 'flowers' },
    { id: 'mu07', t: 'There are 40 snowflakes on a rock in the snowy mountains. Mufasa\'s warm paw melts 15 of them. How many snowflakes are left?', x: '40-15', e: '❄️', u: 'snowflakes' },
    { id: 'mu08', t: 'Young Zazu flaps his wings 10 times every minute. How many flaps does he make in 7 minutes?', x: '7*10', e: '🪶', m: '🐦', u: 'flaps' },
    { id: 'mu09', t: 'Rafiki tells Kiara 4 stories every night for 5 nights. How many stories does she hear?', x: '5*4', e: '📖', m: '🐒', u: 'stories' },
    { id: 'mu10', t: '18 lion cubs share 3 caves. Each cave has the same number of cubs. How many cubs are in each cave?', x: '18/3', e: '🦁', u: 'cubs' },
    { id: 'mu11', t: 'Mufasa sees 3 branches. Each branch has 11 birds on it. How many birds are there?', x: '3*11', e: '🐦', u: 'birds' },
    { id: 'mu12', t: 'Taka and Mufasa each find 7 shiny stones. Then Mufasa finds 3 more. How many stones do they have together?', x: '2*7+3', e: '🪨', m: '🦁', u: 'stones' },
    { id: 'mu13', t: 'There are 9 lions in Mufasa\'s new pride. Each lion has 4 paws. How many paws is that?', x: '9*4', e: '🐾', m: '🦁', u: 'paws' },
  ],

  showman: [
    { id: 'gs01', t: '5 clowns run into the ring. Each clown juggles 3 balls. How many balls are flying in the air?', x: '5*3', e: '🤹', u: 'balls' },
    { id: 'gs02', t: 'Barnum sells 8 circus tickets. Each ticket costs 4 kr. How much money does he get?', x: '8*4', e: '🪙', m: '🎟️', u: 'kr' },
    { id: 'gs03', t: 'Anne swings on the trapeze 6 times in every show. She does 4 shows. How many swings is that?', x: '4*6', e: '🤸', u: 'swings' },
    { id: 'gs04', t: 'The circus tent has 7 rows of seats with 10 people in each row. How many people are watching?', x: '7*10', e: '🙂', m: '🎪', u: 'people' },
    { id: 'gs05', t: 'Lettie sings 3 songs in every show. There are 9 shows this week. How many songs does she sing?', x: '9*3', e: '🎤', u: 'songs' },
    { id: 'gs06', t: 'Each of the 3 circus elephants gets 5 apples. Then the keeper gives them 4 bonus apples. How many apples in all?', x: '3*5+4', e: '🍎', u: 'apples' },
    { id: 'gs07', t: 'Barnum has 36 top hats. He puts the same number on each of 4 shelves. How many hats are on each shelf?', x: '36/4', e: '🎩', u: 'hats' },
    { id: 'gs08', t: '12 circus horses each wear 2 big feathers on their heads. How many feathers is that?', x: '12*2', e: '🪶', m: '🐴', u: 'feathers' },
    { id: 'gs09', t: 'Phillip buys 6 bags of popcorn. Each bag costs 5 kr. He pays with 40 kr. How much change does he get back?', x: '40-6*5', e: '🪙', m: '🍿', u: 'kr' },
    { id: 'gs10', t: 'There are 50 balloons at the circus. 18 balloons float away. How many balloons are left?', x: '50-18', e: '🎈', u: 'balloons' },
    { id: 'gs11', t: 'Tom Thumb has 8 tiny carriages. Each carriage has 4 wheels. How many wheels are there?', x: '8*4', e: '🛞', u: 'wheels' },
    { id: 'gs12', t: 'Jenny Lind\'s dress has 7 rows of sparkles. Each row has 8 sparkles. How many sparkles are on her dress?', x: '7*8', e: '✨', u: 'sparkles' },
    { id: 'gs13', t: 'Charity bakes 4 trays with 6 cookies on each tray. Caroline and Helen eat 3 cookies. How many cookies are left?', x: '4*6-3', e: '🍪', u: 'cookies' },
    { id: 'gs14', t: '11 acrobats each do 3 flips in the air. How many flips is that?', x: '11*3', e: '🤸', m: '🎪', u: 'flips' },
  ],

  aladdin: [
    { id: 'al01', t: 'The Genie gives 3 wishes to each person he meets. He meets 4 people. How many wishes does he give?', x: '4*3', e: '✨', m: '🧞', u: 'wishes' },
    { id: 'al02', t: 'Abu grabs 5 bananas from each of 3 market stalls. How many bananas does he have?', x: '3*5', e: '🍌', u: 'bananas' },
    { id: 'al03', t: 'The magic carpet has 4 corners. Each corner has 6 golden tassels. How many tassels does it have?', x: '4*6', e: '🟡', m: '🧞', u: 'tassels' },
    { id: 'al04', t: '8 birds visit Jasmine\'s garden. She gives each bird 3 seeds. How many seeds does she give?', x: '8*3', e: '🐦', u: 'seeds' },
    { id: 'al05', t: 'The Sultan\'s palace has 9 towers. Each tower has 5 windows. How many windows is that?', x: '9*5', e: '🪟', m: '🕌', u: 'windows' },
    { id: 'al06', t: 'Aladdin finds 4 bags with 7 gold coins in each. He gives 10 coins to some hungry children. How many coins does he have left?', x: '4*7-10', e: '🪙', m: '🐒', u: 'coins' },
    { id: 'al07', t: 'In the Cave of Wonders there are 6 piles of rubies with 6 rubies in each pile. Abu adds 1 more ruby. How many rubies are there?', x: '6*6+1', e: '💎', m: '🐒', u: 'rubies' },
    { id: 'al08', t: 'Iago the parrot squawks 10 times every hour. How many times does he squawk in 5 hours?', x: '5*10', e: '💬', m: '🦜', u: 'squawks' },
    { id: 'al09', t: 'Jafar hides 28 lamps in 7 boxes, with the same number in each box. How many lamps are in each box?', x: '28/7', e: '🪔', u: 'lamps' },
    { id: 'al10', t: 'The Genie snaps his fingers 4 times. Every snap makes 9 camels appear. How many camels appear?', x: '4*9', e: '🐪', u: 'camels' },
    { id: 'al11', t: 'There are 45 steps up to the palace. Aladdin has climbed 20 steps. How many more steps does he need to climb?', x: '45-20', e: '🪜', u: 'steps' },
    { id: 'al12', t: 'Jasmine and Aladdin fly on the carpet for 3 hours every night. How many hours do they fly in 7 nights?', x: '7*3', e: '🕐', m: '🌙', u: 'hours' },
    { id: 'al13', t: 'The market has 5 stalls. Each stall has 8 melons. 6 melons get sold. How many melons are left?', x: '5*8-6', e: '🍉', u: 'melons' },
    { id: 'al14', t: 'Abu has 16 nuts. He shares them equally with Aladdin, so they get the same. How many nuts does each of them get?', x: '16/2', e: '🥜', u: 'nuts' },
    { id: 'al15', t: 'Each tiger has 4 legs and 1 tail. How many legs and tails do 7 tigers like Rajah have?', x: '7*(4+1)', e: '🔸', m: '🐅', u: 'legs and tails' },
  ],

  ducks: [
    { id: 'md01', t: 'The Ducks score 3 goals in each of their 4 games. How many goals do they score?', x: '4*3', e: '🥅', m: '🦆', u: 'goals' },
    { id: 'md02', t: 'There are 9 Ducks on the team. Each Duck has 2 skates. How many skates is that?', x: '9*2', e: '⛸️', u: 'skates' },
    { id: 'md03', t: 'Goldberg the goalie stops 5 pucks in every practice. How many pucks does he stop in 8 practices?', x: '8*5', e: '⚫', m: '🧤', u: 'pucks' },
    { id: 'md04', t: 'Coach Bombay buys 7 boxes of pucks. Each box has 6 pucks. How many pucks does he buy?', x: '7*6', e: '⚫', m: '🏒', u: 'pucks' },
    { id: 'md05', t: 'Fulton does 4 big slapshots in every game. He plays 9 games. How many slapshots is that?', x: '9*4', e: '💥', u: 'slapshots' },
    { id: 'md06', t: 'The Flying V has 5 players. The Ducks make 3 Flying Vs on the ice. How many players are skating?', x: '3*5', e: '🦆', u: 'players' },
    { id: 'md07', t: 'Charlie scores 2 goals in each of 6 games. Then he scores 3 more in the final! How many goals does he score altogether?', x: '6*2+3', e: '🥅', u: 'goals' },
    { id: 'md08', t: 'The Ducks bring 30 water bottles. They drink 14 at practice. How many bottles are left?', x: '30-14', e: '💧', m: '🦆', u: 'bottles' },
    { id: 'md09', t: '24 hockey kids ride to the game in 3 vans, with the same number in each van. How many kids are in each van?', x: '24/3', e: '🚐', m: '🦆', u: 'kids' },
    { id: 'md10', t: '8 Ducks each get 4 duck stickers for their helmets. 5 stickers are left over in the box. How many stickers were there?', x: '8*4+5', e: '🦆', u: 'stickers' },
    { id: 'md11', t: 'Connie and Guy each skate 6 laps. Averman skates 4 laps. How many laps do they skate in total?', x: '2*6+4', e: '⛸️', m: '🦆', u: 'laps' },
    { id: 'md12', t: 'There are 12 Ducks at practice. Each Duck has 3 pucks. How many pucks are on the ice?', x: '12*3', e: '⚫', m: '🦆', u: 'pucks' },
    { id: 'md13', t: 'The ice rink has 4 sides with 10 big lights on each side. 6 lights are broken. How many lights are working?', x: '4*10-6', e: '💡', m: '🏒', u: 'lights' },
    { id: 'md14', t: 'The Ducks win 7 games. The fans cheer "Quack! Quack!" 7 times for each win. How many cheers is that?', x: '7*7', e: '📣', u: 'cheers' },
  ],

  rock: [
    { id: 'sr01', t: 'Freddy hits his drum 4 times in every bar of music. He plays 6 bars. How many drum hits is that?', x: '6*4', e: '🥁', u: 'hits' },
    { id: 'sr02', t: 'A guitar has 6 strings. The band has 3 guitars. How many strings are there?', x: '3*6', e: '〰️', m: '🎸', u: 'strings' },
    { id: 'sr03', t: 'The band practices 3 hours every day for 5 days. How many hours do they practice?', x: '5*3', e: '⏰', m: '🎸', u: 'hours' },
    { id: 'sr04', t: 'Tomika sings 7 songs. Each song has 4 parts. How many parts does she sing?', x: '7*4', e: '🎵', m: '🎤', u: 'parts' },
    { id: 'sr05', t: 'Lawrence plays 5 groups of keys on his keyboard. Each group has 7 white keys. How many white keys does he play?', x: '5*7', e: '⬜', m: '🎹', u: 'keys' },
    { id: 'sr06', t: 'Dewey has 50 kr. He buys 4 guitar picks that cost 5 kr each. How much money does he have left?', x: '50-4*5', e: '🪙', m: '🎸', u: 'kr' },
    { id: 'sr07', t: 'Summer makes 9 posters for the big show. Each poster has 6 stars on it. How many stars is that?', x: '9*6', e: '⭐', u: 'stars' },
    { id: 'sr08', t: 'The class has 3 groups of 6 kids. Then 2 more kids join to help with the lights. How many kids are there now?', x: '3*6+2', e: '🧒', m: '🎸', u: 'kids' },
    { id: 'sr09', t: 'The crowd claps 10 times after every song. The band plays 6 songs. How many claps is that?', x: '6*10', e: '👏', u: 'claps' },
    { id: 'sr10', t: 'Katie has 32 stickers. She shares them equally with 4 band friends. How many stickers does each friend get?', x: '32/4', e: '🌟', u: 'stickers' },
    { id: 'sr11', t: 'Principal Mullins sets out 80 chairs. People sit on 35 of them. How many chairs are empty?', x: '80-35', e: '🪑', m: '🎤', u: 'chairs' },
    { id: 'sr12', t: 'Freddy breaks 2 drumsticks at every show. How many drumsticks does he break in 12 shows?', x: '12*2', e: '🥢', u: 'drumsticks' },
    { id: 'sr13', t: 'The school bus has 7 rows with 4 seats in each row. 5 seats are empty. How many kids are sitting on the bus?', x: '7*4-5', e: '💺', m: '🚌', u: 'kids' },
    { id: 'sr14', t: 'At the Battle of the Bands, each song lasts 3 minutes. The band plays 4 songs, then says thank you for 2 minutes. How long are they on stage?', x: '4*3+2', e: '⏱️', u: 'minutes' },
  ],

  friends: [
    { id: 'fr01', who: 'lolo', t: 'Lolo has 3 bags of mangoes. Each bag has 5 mangoes. How many mangoes does Lolo have?', x: '3*5', e: '🥭', u: 'mangoes' },
    { id: 'fr02', who: 'lily', t: 'Lily shoots 4 arrows at each target. There are 6 targets. How many arrows does she shoot?', x: '6*4', e: '🏹', u: 'arrows' },
    { id: 'fr03', who: 'alya', t: 'Maya and Alya each have 2 hands. Each hand has 5 fingers. How many fingers do they have together?', x: '2*2*5', e: '☝️', u: 'fingers' },
    { id: 'fr04', who: 'paati', t: 'Paati makes 4 plates of dosas with 6 dosas on each plate. Thatha eats 3 of them. How many dosas are left?', x: '4*6-3', e: '🥞', u: 'dosas' },
    { id: 'fr05', who: 'benji', t: 'Benji the dog gets 3 treats every day. How many treats does he get in a week of 7 days?', x: '7*3', e: '🦴', u: 'treats' },
    { id: 'fr06', who: 'amarah', t: 'Amarah\'s gumball machine has 30 gumballs. 12 gumballs fall out. How many are left in the machine?', x: '30-12', e: '🍬', u: 'gumballs' },
    { id: 'fr07', who: 'maya', t: 'Maya shares 18 cookies equally with Lily and Isma. Each of the 3 girls gets the same. How many cookies does each girl get?', x: '18/3', e: '🍪', u: 'cookies' },
    { id: 'fr08', who: 'tejas', t: 'Tejas builds 5 towers with 8 blocks in each. Then he puts 2 more blocks on top. How many blocks does he use?', x: '5*8+2', e: '🧱', u: 'blocks' },
    { id: 'fr09', who: 'lola', t: 'Lola buys ice cream for 9 kids. Each ice cream costs 10 kr. How much does she pay?', x: '9*10', e: '🪙', u: 'kr' },
    { id: 'fr10', who: 'pradeep', t: 'Pradeep counts 6 trees in the park. Each tree has 6 birds in it. How many birds does he count?', x: '6*6', e: '🐦', u: 'birds' },
    { id: 'fr11', who: 'live', t: 'Live hits 3 bullseyes in each round of archery. She plays 4 rounds, then gets 1 lucky extra bullseye. How many bullseyes?', x: '4*3+1', e: '🎯', u: 'bullseyes' },
    { id: 'fr12', who: 'karen', t: 'Karen bakes 2 trays of muffins. Each tray has 12 muffins. How many muffins does she bake?', x: '2*12', e: '🧁', u: 'muffins' },
    { id: 'fr13', who: 'isma', t: 'The 3 friends Isma, Rhea and Dhruv each have 8 marbles. They lose 4 marbles in the grass. How many marbles do they have now?', x: '3*8-4', e: '🔵', u: 'marbles' },
    { id: 'fr14', who: 'ninang', t: 'Ninang gives 7 kids 5 kr each. How much money does she give away?', x: '7*5', e: '🪙', u: 'kr' },
    { id: 'fr15', who: 'maya', t: 'Maya has 40 kr. She buys 3 bracelets that cost 8 kr each. How much money does she have left?', x: '40-3*8', e: '🪙', u: 'kr' },
  ],
};
