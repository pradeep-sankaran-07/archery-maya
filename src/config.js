export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const PALETTE = {
  sky: 0x7ec8e3,
  skyTop: 0x9bdcf2,
  skyBottom: 0xffd9b0,
  grass: 0x6dc36d,
  grassDark: 0x4ea84e,
  dirt: 0x8b5a3c,
  dirtDark: 0x6b3f25,
  water: 0x1f6ea8,
  waterTop: 0x3596d5,
  waterDeep: 0x0e3a66,
  sun: 0xfff1a8,
  pink: 0xff7eb3,
  red: 0xff5a5f,
  redDark: 0xc63b3e,
  gold: 0xffc94a,
  goldDark: 0xd99a1c,
  white: 0xffffff,
  black: 0x14131a,
  cream: 0xfff7e6,
  shadow: 0x2c2435,
  purple: 0x8b5fbf,
  green: 0x4caf50,
  greenDark: 0x2e7d32,
  blue: 0x4a90e2,
  blueDark: 0x2a5d9f,
  rainbow1: 0xff5a5f,
  rainbow2: 0xffa94a,
  rainbow3: 0xffc94a,
  rainbow4: 0x4caf50,
  rainbow5: 0x4a90e2,
  rainbow6: 0x8b5fbf,
};

export const CHARACTERS = [
  // Kids
  { id: 'maya', name: 'Maya', group: 'Kids', body: 0xff7eb3, accent: 0x9b1158, hair: 0x2b1a12, isPet: false, isAdult: false, isElder: false },
  { id: 'alya', name: 'Alya', group: 'Kids', body: 0xffa94a, accent: 0xb35900, hair: 0x3a1d05, isPet: false, isAdult: false, isElder: false },
  { id: 'lily', name: 'Lily', group: 'Kids', body: 0xff5a5f, accent: 0x8a1c20, hair: 0xffd166, isPet: false, isAdult: false, isElder: false },
  { id: 'amarah', name: 'Amarah', group: 'Kids', body: 0x8b5fbf, accent: 0x4b2a82, hair: 0x1a0e09, isPet: false, isAdult: false, isElder: false },
  { id: 'live', name: 'Live', group: 'Kids', body: 0x4caf50, accent: 0x1f5d22, hair: 0x402218, isPet: false, isAdult: false, isElder: false },
  { id: 'aisha', name: 'Aisha', group: 'Kids', body: 0xff9ec1, accent: 0xb8467a, hair: 0x1a0e09, isPet: false, isAdult: false, isElder: false },
  { id: 'isma', name: 'Isma', group: 'Kids', body: 0x4a90e2, accent: 0x1f4d8a, hair: 0x2b1a12, isPet: false, isAdult: false, isElder: false },
  { id: 'tejas', name: 'Tejas', group: 'Kids', body: 0xffc94a, accent: 0x8a6500, hair: 0x1a0e09, isPet: false, isAdult: false, isElder: false },
  { id: 'rhea', name: 'Rhea', group: 'Kids', body: 0xff8c69, accent: 0xb04520, hair: 0x1a0e09, isPet: false, isAdult: false, isElder: false },
  { id: 'dhruv', name: 'Dhruv', group: 'Kids', body: 0x20c8b0, accent: 0x0d7865, hair: 0x1a0e09, isPet: false, isAdult: false, isElder: false },
  { id: 'hennie', name: 'Hennie', group: 'Kids', body: 0xf6a5c0, accent: 0x9c4368, hair: 0x4a2f1a, isPet: false, isAdult: false, isElder: false },
  { id: 'mari', name: 'Mari', group: 'Kids', body: 0x9ad6a0, accent: 0x3f7a48, hair: 0x2b1a12, isPet: false, isAdult: false, isElder: false },
  { id: 'alise', name: 'Alise', group: 'Kids', body: 0xc3a3e0, accent: 0x6a4598, hair: 0x3a1d05, isPet: false, isAdult: false, isElder: false },
  { id: 'celine', name: 'Celine', group: 'Kids', body: 0xb0c95e, accent: 0x5e7320, hair: 0x1a0e09, isPet: false, isAdult: false, isElder: false },
  { id: 'kristiana', name: 'Kristiana', group: 'Kids', body: 0x7fb3e0, accent: 0x2f5e8a, hair: 0x3a1d05, isPet: false, isAdult: false, isElder: false },
  { id: 'inger', name: 'Inger', group: 'Kids', body: 0xe0a3b8, accent: 0x8a3a5a, hair: 0x4a2f1a, isPet: false, isAdult: false, isElder: false },
  { id: 'ida', name: 'Ida', group: 'Kids', body: 0xe8c66a, accent: 0x9c7a20, hair: 0x2b1a12, isPet: false, isAdult: false, isElder: false },
  // Grown-ups (parents, aunty/uncle, grandparents, periappa/periamma/tito mico all consolidated here)
  { id: 'pradeep', name: 'Pradeep', group: 'Grown-ups', body: 0x4a90e2, accent: 0x14315a, hair: 0x1a0e09, isPet: false, isAdult: true, isElder: false },
  { id: 'karen', name: 'Karen', group: 'Grown-ups', body: 0xff7eb3, accent: 0x6a1e44, hair: 0xb87333, isPet: false, isAdult: true, isElder: false },
  { id: 'ninang', name: 'Ninang', group: 'Grown-ups', body: 0xff9ec1, accent: 0x8a1c46, hair: 0x2b1a12, isPet: false, isAdult: true, isElder: false },
  { id: 'dk', name: 'DK', group: 'Grown-ups', body: 0x6ba368, accent: 0x2c5826, hair: 0x1a0e09, isPet: false, isAdult: true, isElder: false },
  { id: 'periappa', name: 'Periappa', group: 'Grown-ups', body: 0x6b4f3a, accent: 0x3a2818, hair: 0x1a0e09, isPet: false, isAdult: true, isElder: false },
  { id: 'periamma', name: 'Periamma', group: 'Grown-ups', body: 0xd4a5c3, accent: 0x7a4566, hair: 0x2b1a12, isPet: false, isAdult: true, isElder: false },
  { id: 'titomico', name: 'Tito Mico', group: 'Grown-ups', body: 0x4a7a5c, accent: 0x224a2f, hair: 0x1a0e09, isPet: false, isAdult: true, isElder: false },
  { id: 'thatha', name: 'Thatha', group: 'Grown-ups', body: 0xb8a48a, accent: 0x5e4a30, hair: 0xeeeeee, isPet: false, isAdult: true, isElder: true },
  { id: 'paati', name: 'Paati', group: 'Grown-ups', body: 0xf2c89c, accent: 0x7a3b3b, hair: 0xeeeeee, isPet: false, isAdult: true, isElder: true },
  { id: 'lolo', name: 'Lolo', group: 'Grown-ups', body: 0x9fbfa6, accent: 0x3f6b46, hair: 0xeeeeee, isPet: false, isAdult: true, isElder: true },
  { id: 'lola', name: 'Lola', group: 'Grown-ups', body: 0xe8b7c8, accent: 0x7a3a4a, hair: 0xeeeeee, isPet: false, isAdult: true, isElder: true },
  { id: 'debajit', name: 'Debajit', group: 'Grown-ups', body: 0xd4a040, accent: 0x7a5a10, hair: 0x1a0e09, isPet: false, isAdult: true, isElder: false },
  { id: 'krip', name: 'Krip', group: 'Grown-ups', body: 0x5c7a9e, accent: 0x2a4a6a, hair: 0x1a0e09, isPet: false, isAdult: true, isElder: false },
  // Pets
  { id: 'benji', name: 'Benji', group: 'Pets', body: 0xc88a52, accent: 0x6b4520, hair: 0x6b4520, isPet: true, isAdult: false, isElder: false },
];

export const BOWS = [
  { id: 'classic', name: 'Classic', color: 0x8b5a2b, accent: 0x5c3815 },
  { id: 'recurve', name: 'Recurve', color: 0x2c3e50, accent: 0x1a2a38 },
  { id: 'sparkle', name: 'Sparkle', color: 0xffc94a, accent: 0xd99a1c },
  { id: 'heart', name: 'Heart', color: 0xff5a5f, accent: 0xb1383b },
];

export const ARROW_COLORS = [
  { id: 'red', color: 0xff5a5f, name: 'Red' },
  { id: 'blue', color: 0x4a90e2, name: 'Blue' },
  { id: 'rainbow', color: 0xff5a5f, name: 'Rainbow', rainbow: true },
];

export const PHYSICS = {
  gravity: 900,
  playerSpeed: 220,
  jumpVelocity: -560,
  swimGravity: 60,
  swimSpeed: 180,
  swimAccel: 280,
  // Archery: arrows arc gently. Aim still matters but center hits feel solid.
  arrowSpeed: 800,
  arrowGravity: 320,
};

// Norwegian kroner. Standard short form is "kr".
export const CURRENCY = {
  code: 'kr',
  name: 'kroner',
  format: (n) => `${n} kr`,
};

export const ITEMS = [
  { id: 'chocolate', name: 'Chocolate', price: 3, emoji: '🍫' },
  { id: 'apple', name: 'Apple', price: 2, emoji: '🍎' },
  { id: 'banana', name: 'Banana', price: 1, emoji: '🍌' },
  { id: 'toycar', name: 'Toy car', price: 5, emoji: '🚗' },
  { id: 'stickers', name: 'Stickers', price: 2, emoji: '✨' },
  { id: 'juice', name: 'Juice box', price: 4, emoji: '🧃' },
  { id: 'donut', name: 'Donut', price: 3, emoji: '🍩' },
  { id: 'icecream', name: 'Ice cream', price: 6, emoji: '🍦' },
  { id: 'pencil', name: 'Pencil', price: 1, emoji: '✏️' },
  { id: 'notebook', name: 'Notebook', price: 4, emoji: '📒' },
  { id: 'grapes', name: 'Grapes', price: 3, emoji: '🍇' },
  { id: 'milk', name: 'Milk', price: 2, emoji: '🥛' },
  { id: 'cookies', name: 'Cookies', price: 4, emoji: '🍪' },
  { id: 'strawberry', name: 'Strawberry', price: 2, emoji: '🍓' },
  { id: 'kite', name: 'Kite', price: 7, emoji: '🪁' },
];

export const SCENE_KEYS = {
  Boot: 'BootScene',
  Preload: 'PreloadScene',
  LanguageSelect: 'LanguageSelectScene',
  Title: 'TitleScene',
  CharacterSelect: 'CharacterSelectScene',
  BowSelect: 'BowSelectScene',
  House: 'HouseScene',
  Archery1: 'ArcheryRangeScene',
  Grocery: 'GroceryScene',
  Archery2: 'MovingArcheryScene',
  Adventure: 'AdventureScene',
  Victory: 'VictoryScene',
  Leaderboard: 'LeaderboardScene',
  LeaderboardView: 'LeaderboardViewScene',
  GiftShop: 'GiftShopScene',
  PrizeShowcase: 'PrizeShowcaseScene',
};
