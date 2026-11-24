// Level 2: 15 new questions per world, a small step up from Level 1.
// Same fields as questions.js, plus:
//   e2    emoji for the second group in "two kinds" questions
//   quot  true when a division means "how many groups of N?" (not sharing)
//
// Every world uses the same 15 kinds of story once each, so no two
// questions in a world work the same way:
//   1 times table (6-9 tables)          9  money: change from a note
//   2 two-digit × one-digit (23 × 3)    10 two kinds added (4 × 5 + 3 × 6)
//   3 "times as many"                   11 "how many more" (8 × 5 − 6 × 4)
//   4 sharing equally                   12 each has two things (5 × (3 + 4))
//   5 "how many groups of N?"           13 multiply, then share
//   6 adding / taking away, 2 digits    14 "times as many", then together
//   7 multiply, then add a few          15 share, then change one group
//   8 multiply, then take some away
// `npm run check:math` makes sure no maths is repeated anywhere in the game.

export const QUESTIONS_L2 = {
  lionking: [
    { id: 'lk2-01', t: '8 fireflies glow on each acacia tree. There are 8 trees glowing tonight. How many fireflies are glowing?', x: '8*8', e: '✨', m: '🌳', u: 'fireflies' },
    { id: 'lk2-02', t: 'Timon digs 3 tunnels under the grass. Each tunnel is 13 steps long. How many steps of tunnel does he dig?', x: '3*13', e: '👣', m: '🕳️', u: 'steps' },
    { id: 'lk2-03', t: 'Nala catches 8 falling leaves. Simba catches twice as many. How many leaves does Simba catch?', x: '2*8', e: '🍃', m: '🦁', u: 'leaves' },
    { id: 'lk2-04', t: '6 hippos share 42 lily pads equally. How many lily pads does each hippo get?', x: '42/6', e: '🪷', m: '🦛', u: 'lily pads' },
    { id: 'lk2-05', t: 'Pumbaa has 48 grubs for his midnight snack. He eats 8 grubs every hour. How many hours until they are all gone?', x: '48/8', e: '🐛', m: '🐗', u: 'hours', quot: true },
    { id: 'lk2-06', t: '64 zebras drink at the river. 27 zebras run off when a crocodile swims by. How many zebras are still drinking?', x: '64-27', e: '🦓', m: '🐊', u: 'zebras' },
    { id: 'lk2-07', t: 'Rafiki hangs 6 bunches of coconuts in his tree, with 7 coconuts in each bunch. Then he hangs up 5 loose coconuts. How many coconuts are in his tree?', x: '6*7+5', e: '🥥', m: '🐒', u: 'coconuts' },
    { id: 'lk2-08', t: 'Flamingos stand in the moonlit lake in 9 rows, with 6 flamingos in each row. 8 flamingos fly away. How many are still standing in the lake?', x: '9*6-8', e: '🦩', u: 'flamingos' },
    { id: 'lk2-09', t: 'Zazu has 60 seconds to fly home. He stops at 7 water holes for 8 seconds at each one. How many seconds does he have left?', x: '60-7*8', e: '⏱️', m: '🐦', u: 'seconds' },
    { id: 'lk2-10', t: 'At the night meeting, Sarabi counts 4 rows of 5 gazelles and 3 rows of 6 buffalo. How many animals does she count?', x: '4*5+3*6', e: '🦌', e2: '🐃', m: '🦁', u: 'animals' },
    { id: 'lk2-11', t: 'Nala jumps across 8 rocks, 5 jumps on each rock. Simba jumps across 6 rocks, 4 jumps on each rock. How many more jumps does Nala do?', x: '8*5-6*4', e: '💥', m: '🦁', u: 'jumps' },
    { id: 'lk2-12', t: '5 meerkat families live by Pride Rock. Each family has 3 grown-ups and 4 babies. How many meerkats is that?', x: '5*(3+4)', e: '🐿️', m: '🕳️', u: 'meerkats' },
    { id: 'lk2-13', t: 'Simba finds 3 fig trees with 8 figs on each. He shares all the figs equally between 4 friends. How many figs does each friend get?', x: '3*8/4', e: '🍑', m: '🦁', u: 'figs' },
    { id: 'lk2-14', t: 'Timon finds 9 beetles. Pumbaa finds 4 times as many. How many beetles do they find altogether?', x: '4*9+9', e: '🪲', m: '🐗', u: 'beetles' },
    { id: 'lk2-15', t: '28 birds sit on Pride Rock in 4 equal groups. Zazu joins one of the groups. How many birds are in Zazu\'s group now?', x: '28/4+1', e: '🐦', u: 'birds' },
  ],

  mufasa: [
    { id: 'mu2-01', t: 'Behind the waterfall, Mufasa finds 7 rows of glowing crystals with 9 crystals in each row. How many crystals does he find?', x: '7*9', e: '💎', m: '💧', u: 'crystals' },
    { id: 'mu2-02', t: 'Mufasa and Taka cross 4 rope bridges. Each bridge is 15 metres long. How many metres do they cross?', x: '4*15', e: '🌉', m: '🦁', u: 'metres' },
    { id: 'mu2-03', t: '10 monkeys play in a small tree. The giant tree has 3 times as many monkeys. How many monkeys are in the giant tree?', x: '3*10', e: '🐒', m: '🌳', u: 'monkeys' },
    { id: 'mu2-04', t: '56 buffalo cross the river in 7 equal groups. How many buffalo are in each group?', x: '56/7', e: '🦬', m: '🌊', u: 'buffalo' },
    { id: 'mu2-05', t: 'Kiros\'s lions must climb 40 metres up the cliff. They climb 5 metres at a time. How many climbs does it take?', x: '40/5', e: '🧗', m: '🏔️', u: 'climbs', quot: true },
    { id: 'mu2-06', t: 'Rafiki counts 38 parrots on one side of the waterfall and 45 parrots on the other side. How many parrots are there altogether?', x: '38+45', e: '🦜', m: '🐒', u: 'parrots' },
    { id: 'mu2-07', t: 'Mufasa carries 4 bundles of sticks to build a den, with 8 sticks in each bundle. Taka adds 9 more sticks. How many sticks are in the den?', x: '4*8+9', e: '🪵', m: '🦁', u: 'sticks' },
    { id: 'mu2-08', t: 'Sarabi gathers 9 piles of berries with 5 berries in each pile. Zazu gobbles up 7 berries. How many berries are left?', x: '9*5-7', e: '🫐', m: '🐦', u: 'berries' },
    { id: 'mu2-09', t: 'Milele is 80 km away. Each day the herd walks 9 km. After 7 days, how far away is Milele now?', x: '80-7*9', e: '👣', m: '🦁', u: 'km' },
    { id: 'mu2-10', t: 'On the riverbank there are 3 groups of 9 zebras and 4 groups of 5 giraffes. How many animals are on the riverbank?', x: '3*9+4*5', e: '🦓', e2: '🦒', m: '🌊', u: 'animals' },
    { id: 'mu2-11', t: 'Mufasa swims 6 laps of the pool with 8 strokes in each lap. Taka swims 5 laps with 7 strokes in each lap. How many more strokes does Mufasa swim?', x: '6*8-5*7', e: '💦', m: '🦁', u: 'strokes' },
    { id: 'mu2-12', t: '4 lion cubs each carry 2 big leaves and 5 small leaves to the den. How many leaves do they carry?', x: '4*(2+5)', e: '🍃', m: '🦁', u: 'leaves' },
    { id: 'mu2-13', t: 'Rafiki has 5 gourds with 8 seeds in each. He plants all the seeds in 4 equal rows. How many seeds are in each row?', x: '5*8/4', e: '🌱', m: '🐒', u: 'seeds' },
    { id: 'mu2-14', t: 'Taka finds 12 shiny shells in the river. Mufasa finds 3 times as many. How many shells do they find together?', x: '3*12+12', e: '🐚', m: '🦁', u: 'shells' },
    { id: 'mu2-15', t: '42 fish swim in 7 equal groups. A heron catches 2 fish from one group. How many fish are left in that group?', x: '42/7-2', e: '🐟', m: '🌊', u: 'fish' },
  ],

  showman: [
    { id: 'gs2-01', t: 'The circus band has 8 trumpet players. Each one plays 9 loud notes in the opening song. How many notes do they play?', x: '8*9', e: '🎺', m: '🎪', u: 'notes' },
    { id: 'gs2-02', t: 'W.D. rides his unicycle around the ring 3 times. Each lap is 16 metres. How many metres does he ride?', x: '3*16', e: '📏', m: '🎪', u: 'metres' },
    { id: 'gs2-03', t: 'Phillip sells 10 tickets in the morning. In the evening he sells 10 times as many. How many tickets does he sell in the evening?', x: '10*10', e: '🎟️', u: 'tickets' },
    { id: 'gs2-04', t: 'Barnum has 72 sparkly costumes. He gives the same number to each of 8 acts. How many costumes does each act get?', x: '72/8', e: '👗', m: '🎩', u: 'costumes' },
    { id: 'gs2-05', t: 'Lettie has 27 roses. She ties them in bunches of 3 roses. How many bunches can she make?', x: '27/3', e: '🌹', m: '🎤', u: 'bunches', quot: true },
    { id: 'gs2-06', t: 'There are 71 people waiting in line for the show. 36 people go inside. How many people are still waiting?', x: '71-36', e: '🧍', m: '🎪', u: 'people' },
    { id: 'gs2-07', t: 'The strongman lifts 3 bars with 9 weights on each bar. Then he lifts 7 more weights with one finger! How many weights does he lift?', x: '3*9+7', e: '🏋️', m: '💪', u: 'weights' },
    { id: 'gs2-08', t: 'Caroline and Helen fill 3 bags with balloons, 12 balloons in each bag. Then 8 balloons pop! How many balloons are left?', x: '3*12-8', e: '🎈', u: 'balloons' },
    { id: 'gs2-09', t: 'The big show lasts 100 minutes. There are 9 acts and each act takes 9 minutes. How many minutes are left for the grand finale?', x: '100-9*9', e: '⏱️', m: '🎪', u: 'minutes' },
    { id: 'gs2-10', t: 'In the parade there are 2 wagons with 8 clowns in each and 4 wagons with 7 dancers in each. How many performers are in the parade?', x: '2*8+4*7', e: '🤡', e2: '💃', m: '🎪', u: 'performers' },
    { id: 'gs2-11', t: 'In each show, the horses gallop around the ring 9 times and the zebras 6 times. After 4 shows, how many more laps have the horses done?', x: '4*9-4*6', e: '🐴', e2: '🦓', u: 'laps' },
    { id: 'gs2-12', t: '3 acrobats each balance 4 plates on one hand and 5 plates on the other hand. How many plates are they balancing?', x: '3*(4+5)', e: '🍽️', m: '🤸', u: 'plates' },
    { id: 'gs2-13', t: 'Barnum buys 2 boxes of top hats with 9 hats in each box. He shares all the hats equally among 3 clowns. How many hats does each clown get?', x: '2*9/3', e: '🎩', m: '🤡', u: 'hats' },
    { id: 'gs2-14', t: 'Tom Thumb has 8 medals. Jenny Lind has 5 times as many. How many medals do they have together?', x: '5*8+8', e: '🏅', m: '🎤', u: 'medals' },
    { id: 'gs2-15', t: '36 children sit in 3 equal rows around the ring. 3 more children squeeze into the front row. How many children are in the front row now?', x: '36/3+3', e: '🧒', m: '🎪', u: 'children' },
  ],

  aladdin: [
    { id: 'al2-01', t: 'A market stall has 6 shelves. Each shelf holds 8 shiny pots. How many pots are on the stall?', x: '6*8', e: '🏺', m: '🕌', u: 'pots' },
    { id: 'al2-02', t: 'A silk scarf costs 25 kr. Jasmine wants 3 scarves, one for each of her best friends. How much will the 3 scarves cost?', x: '3*25', e: '🪙', m: '🧣', u: 'kr' },
    { id: 'al2-03', t: 'Abu has 10 olives. The Genie magics up 4 times as many olives. How many olives does the Genie make?', x: '4*10', e: '🫒', m: '🧞', u: 'olives' },
    { id: 'al2-04', t: 'The Sultan shares 35 gold coins equally among his 7 palace guards. How many coins does each guard get?', x: '35/7', e: '🪙', m: '👑', u: 'coins' },
    { id: 'al2-05', t: 'Aladdin has 64 oranges to pack. Each crate holds 8 oranges. How many crates does he need?', x: '64/8', e: '🍊', m: '📦', u: 'crates', quot: true },
    { id: 'al2-06', t: 'Iago counts 56 camels at the morning market. 27 more camels arrive at noon. How many camels are at the market now?', x: '56+27', e: '🐪', m: '🦜', u: 'camels' },
    { id: 'al2-07', t: 'The Genie makes 9 trays of sweets appear, with 3 sweets on each tray. Then he pulls 8 more sweets out of his ear! How many sweets is that?', x: '9*3+8', e: '🍬', m: '🧞', u: 'sweets' },
    { id: 'al2-08', t: 'A fruit seller has 7 baskets with 8 pomegranates in each. Abu sneaks away 9 of them. How many pomegranates are left?', x: '7*8-9', e: '🍎', m: '🐒', u: 'pomegranates' },
    { id: 'al2-09', t: 'A cup of mint tea costs 9 kr. Aladdin orders 8 cups for his friends. He hands over 90 kr. How much should the tea seller give back?', x: '90-8*9', e: '🪙', m: '🍵', u: 'kr' },
    { id: 'al2-10', t: 'Jasmine\'s garden has 5 rows of 6 roses and 3 rows of 4 tulips. How many flowers are in her garden?', x: '5*6+3*4', e: '🌹', e2: '🌷', m: '🌺', u: 'flowers' },
    { id: 'al2-11', t: 'The Genie stacks 8 piles of cushions with 3 cushions in each pile. Iago stacks 5 piles with 3 in each pile. How many more cushions does the Genie stack?', x: '8*3-5*3', e: '🟪', m: '🧞', u: 'cushions' },
    { id: 'al2-12', t: '4 camels each carry 6 bags of spices and 3 bags of rice. How many bags are the camels carrying?', x: '4*(6+3)', e: '👜', m: '🐪', u: 'bags' },
    { id: 'al2-13', t: 'Abu finds 7 bags with 4 figs in each bag. He shares all the figs equally with Rajah. How many figs does each of them get?', x: '7*4/2', e: '🍑', m: '🐒', u: 'figs' },
    { id: 'al2-14', t: 'Jafar has 15 magic charms. The Genie has 3 times as many. How many charms do they have together?', x: '3*15+15', e: '🔮', m: '🧞', u: 'charms' },
    { id: 'al2-15', t: '40 lanterns hang above the market in 8 equal rows. Jasmine hangs 4 more lanterns in one row. How many lanterns are in that row now?', x: '40/8+4', e: '🏮', m: '🕌', u: 'lanterns' },
  ],

  ducks: [
    { id: 'md2-01', t: '9 Ducks practise on the frozen pond. Each Duck makes 9 passes. How many passes do they make?', x: '9*9', e: '🏒', m: '🦆', u: 'passes' },
    { id: 'md2-02', t: 'The Ducks skate around the big pond 4 times. Each lap is 21 metres. How many metres do they skate?', x: '4*21', e: '⛸️', m: '🦆', u: 'metres' },
    { id: 'md2-03', t: 'Goldberg stops 7 pucks in the first half. In the second half he stops twice as many. How many pucks does he stop in the second half?', x: '2*7', e: '⚫', m: '🧤', u: 'pucks' },
    { id: 'md2-04', t: 'Hans has 63 new skate laces. He gives the same number to each of 9 Ducks. How many laces does each Duck get?', x: '63/9', e: '🧵', m: '⛸️', u: 'laces' },
    { id: 'md2-05', t: 'Coach Bombay has 81 cones. He puts them in lines of 9 cones. How many lines does he make?', x: '81/9', e: '🔶', m: '🦆', u: 'lines', quot: true },
    { id: 'md2-06', t: 'The rink has room for 90 fans. 48 fans are already inside. How many more fans can come in?', x: '90-48', e: '🙋', m: '🏟️', u: 'fans' },
    { id: 'md2-07', t: 'Banks practises 5 sets of wrist shots with 9 shots in each set. Then he does 6 bonus shots. How many shots does he take?', x: '5*9+6', e: '🥅', m: '🦆', u: 'shots' },
    { id: 'md2-08', t: 'Connie brings 3 boxes of hot cocoa with 8 packets in each box. The team drinks 9 packets. How many packets are left?', x: '3*8-9', e: '☕', m: '🦆', u: 'packets' },
    { id: 'md2-09', t: 'The Ducks need 70 points to win the skating challenge. They finish 8 rounds and get 8 points in every round. How many more points do they need?', x: '70-8*8', e: '⭐', m: '🦆', u: 'points' },
    { id: 'md2-10', t: 'In the winter cup, Julie makes 2 saves in each of 9 games. Goldberg makes 3 saves in each of 7 games. How many saves do the two goalies make?', x: '9*2+7*3', e: '🧤', e2: '🥅', m: '🦆', u: 'saves' },
    { id: 'md2-11', t: 'Averman eats 4 bags of popcorn with 8 pieces in each. Guy eats 3 bags with 7 pieces in each. How many more pieces does Averman eat?', x: '4*8-3*7', e: '🍿', m: '🦆', u: 'pieces' },
    { id: 'md2-12', t: '6 Ducks each bring 5 red pucks and 4 black pucks to the pond. How many pucks do they bring?', x: '6*(5+4)', e: '🔴', m: '🦆', u: 'pucks' },
    { id: 'md2-13', t: 'Goldberg has 5 packs of snow cones with 4 in each pack. He shares them all equally among 10 friends. How many snow cones does each friend get?', x: '5*4/10', e: '🍧', m: '🧤', u: 'snow cones' },
    { id: 'md2-14', t: 'Guy has 7 team stickers. Connie has 5 times as many. How many stickers do they have together?', x: '5*7+7', e: '🦆', u: 'stickers' },
    { id: 'md2-15', t: 'The team has 36 snacks in 6 equal bags. Goldberg eats 2 snacks from one bag. How many snacks are left in that bag?', x: '36/6-2', e: '🥨', m: '🧤', u: 'snacks' },
  ],

  rock: [
    { id: 'sr2-01', t: 'Billy sews 5 rock costumes. Each costume has 6 shiny buttons. How many buttons does he sew on?', x: '5*6', e: '🔘', m: '🧵', u: 'buttons' },
    { id: 'sr2-02', t: 'Zack plays his guitar riff 5 times. Each riff has 12 notes. How many notes does he play?', x: '5*12', e: '🎵', m: '🎸', u: 'notes' },
    { id: 'sr2-03', t: 'Marta has 5 song sheets. Dewey has 5 times as many. How many song sheets does Dewey have?', x: '5*5', e: '📄', m: '🎤', u: 'song sheets' },
    { id: 'sr2-04', t: 'Summer shares 45 concert tickets equally among 5 helpers. How many tickets does each helper get?', x: '45/5', e: '🎟️', m: '📋', u: 'tickets' },
    { id: 'sr2-05', t: 'The band has 30 minutes to practise. Each song takes 6 minutes. How many songs can they play?', x: '30/6', e: '⏱️', m: '🎸', u: 'songs', quot: true },
    { id: 'sr2-06', t: 'The band gets 47 new fans on Saturday and 35 new fans on Sunday. How many new fans is that?', x: '47+35', e: '🙌', m: '🤘', u: 'fans' },
    { id: 'sr2-07', t: 'Lawrence plays 4 songs with 7 chords in each. Then he plays 9 extra chords just for fun. How many chords does he play?', x: '4*7+9', e: '🎹', u: 'chords' },
    { id: 'sr2-08', t: 'Billy has 7 jars of glitter with 7 spoonfuls in each jar. He spills 8 spoonfuls on the floor. How many spoonfuls are left?', x: '7*7-8', e: '✨', m: '🧵', u: 'spoonfuls' },
    { id: 'sr2-09', t: 'Dewey\'s songbook has 50 pages. The band has learned 6 songs, and every song is 7 pages long. How many pages are still left to learn?', x: '50-6*7', e: '📖', m: '🎸', u: 'pages' },
    { id: 'sr2-10', t: 'Freddy crashes the cymbal 7 times in each of 3 songs and bangs the big drum 8 times in each of 2 songs. How many crashes and bangs is that?', x: '3*7+2*8', e: '💥', e2: '🥁', m: '🥁', u: 'crashes and bangs' },
    { id: 'sr2-11', t: 'Freddy hits the drum 8 times in each of 6 songs. Lawrence rings a bell 7 times in each of 6 songs. How many more hits does Freddy make?', x: '6*8-6*7', e: '🥁', e2: '🔔', m: '🥁', u: 'hits' },
    { id: 'sr2-12', t: '4 band kids each bring 5 pencils and 3 erasers to class. How many pencils and erasers do they bring?', x: '4*(5+3)', e: '✏️', m: '🎒', u: 'pencils and erasers' },
    { id: 'sr2-13', t: 'Summer prints 6 pages with 6 band photos on each page. She gives all the photos equally to 9 band members. How many photos does each one get?', x: '6*6/9', e: '📸', m: '📋', u: 'photos' },
    { id: 'sr2-14', t: 'Katie has 16 guitar picks. Zack has twice as many. How many picks do they have together?', x: '2*16+16', e: '🔺', m: '🎸', u: 'picks' },
    { id: 'sr2-15', t: 'Dewey puts 32 cookies on 8 plates, the same number on each plate. How many cookies are on 5 of the plates?', x: '32/8*5', e: '🍪', m: '🎸', u: 'cookies' },
  ],

  friends: [
    { id: 'fr2-01', who: 'thatha', t: 'Thatha buys 8 boxes of ice lollies for the beach. Each box has 10 lollies. How many ice lollies does he buy?', x: '8*10', e: '🍭', u: 'ice lollies' },
    { id: 'fr2-02', who: 'hennie', t: 'Hennie, Mari and Alise each find 14 pebbles on the beach. How many pebbles do the 3 girls find?', x: '3*14', e: '🪨', u: 'pebbles' },
    { id: 'fr2-03', who: 'benji', t: 'Benji digs 4 holes in the sand. Then he digs 4 times as many! How many holes does he dig the second time?', x: '4*4', e: '🕳️', u: 'holes' },
    { id: 'fr2-04', who: 'periamma', t: 'Periamma packs 54 sandwiches equally into 6 cool bags. How many sandwiches are in each bag?', x: '54/6', e: '🥪', u: 'sandwiches' },
    { id: 'fr2-05', who: 'tejas', t: 'Tejas has 49 little flags. He puts 7 flags on each sandcastle. How many sandcastles can he decorate?', x: '49/7', e: '🚩', u: 'sandcastles', quot: true },
    { id: 'fr2-06', who: 'dhruv', t: 'Dhruv\'s kite string is 82 metres long. He winds in 19 metres. How many metres of string are still out?', x: '82-19', e: '🪁', u: 'metres' },
    { id: 'fr2-07', who: 'karen', t: 'Karen packs 7 bags with 5 apples in each bag. Then she adds 9 plums. How many pieces of fruit does she pack?', x: '7*5+9', e: '🍎', u: 'pieces of fruit' },
    { id: 'fr2-08', who: 'lily', t: 'Lily dips her bubble wand 9 times and makes 6 bubbles each time. 7 bubbles pop straight away. How many bubbles are still floating?', x: '9*6-7', e: '🫧', u: 'bubbles' },
    { id: 'fr2-09', who: 'pradeep', t: 'Pradeep takes 100 kr to the beach kiosk. A bottle of juice costs 12 kr, and he buys one for each of the 7 kids. What change does he get?', x: '100-7*12', e: '🪙', u: 'kr' },
    { id: 'fr2-10', who: 'lola', t: 'Lola makes 4 plates with 6 mango slices each and 5 plates with 3 watermelon slices each. How many slices does she make?', x: '4*6+5*3', e: '🥭', e2: '🍉', u: 'slices' },
    { id: 'fr2-11', who: 'aisha', t: 'Aisha fills 9 buckets with 4 shells in each. Amarah fills 5 buckets with 6 shells in each. How many more shells does Aisha have?', x: '9*4-5*6', e: '🐚', u: 'shells' },
    { id: 'fr2-12', who: 'ninang', t: 'Ninang, DK and Tito Mico each bring 8 sausages and 2 corn cobs to the beach barbecue. How much food do the 3 of them bring?', x: '3*(8+2)', e: '🌭', u: 'pieces of food' },
    { id: 'fr2-13', who: 'paati', t: 'Paati makes 6 plates of laddoos with 3 laddoos on each plate. She shares them all equally between 2 grandchildren. How many laddoos does each one get?', x: '6*3/2', e: '🟠', u: 'laddoos' },
    { id: 'fr2-14', who: 'inger', t: 'Inger finds 11 starfish in the rock pools. Ida finds 3 times as many. How many starfish do they find together?', x: '3*11+11', e: '⭐', u: 'starfish' },
    { id: 'fr2-15', who: 'celine', t: 'Celine shares 48 stickers equally among 4 friends. Then she gives each friend 2 more. How many stickers does each friend have now?', x: '48/4+2', e: '✨', u: 'stickers' },
  ],
};
