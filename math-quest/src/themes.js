// The 7 worlds. Every background is drawn in SVG right here (no movie
// pictures are copied): a scene that says "this is the Lion King world",
// "this is the circus", and so on. viewBox is 1600×900 and the scene is
// cropped to fit the screen, so the important bits stay near the middle.

export const THEMES = [
  {
    id: 'lionking', name: 'Lion King', place: 'The Pride Lands', icon: '🦁',
    color: '#f0892b', dark: '#7a3410', ink: '#fff',
    praise: ['Hakuna Matata, that\'s right!', 'Roar! You got it!', 'Simba would be proud!', 'You\'re the queen of the Pride Lands!'],
  },
  {
    id: 'mufasa', name: 'Mufasa', place: 'The road to Milele', icon: '🌟',
    color: '#2f8fa3', dark: '#123a52', ink: '#fff',
    praise: ['Brave like Mufasa!', 'Milele! You found it!', 'Rafiki says: wonderful!', 'Strong and smart!'],
  },
  {
    id: 'showman', name: 'The Greatest Showman', place: 'The Big Top', icon: '🎪',
    color: '#d6334a', dark: '#4a0f2e', ink: '#fff',
    praise: ['This is the greatest show!', 'Ta-daa! Amazing!', 'Take a bow, superstar!', 'The crowd goes wild!'],
  },
  {
    id: 'aladdin', name: 'Aladdin', place: 'Agrabah', icon: '🪔',
    color: '#7a4bd6', dark: '#24135a', ink: '#fff',
    praise: ['Phenomenal cosmic brain power!', 'Genie says: you got it!', 'A whole new world of math!', 'Wish granted! Correct!'],
  },
  {
    id: 'ducks', name: 'The Mighty Ducks', place: 'The ice rink', icon: '🦆',
    color: '#2b9a5c', dark: '#123f3a', ink: '#fff',
    praise: ['Quack quack, GOAL!', 'Ducks fly together!', 'Score! Great shot!', 'You\'re the captain now!'],
  },
  {
    id: 'rock', name: 'School of Rock', place: 'The big stage', icon: '🎸',
    color: '#e0459b', dark: '#2a0f3a', ink: '#fff',
    praise: ['You rock!', 'That answer is LOUD and right!', 'Rock star math!', 'Encore! Encore!'],
  },
  {
    id: 'friends', name: 'Maya & Friends', place: 'Home sweet home', icon: '💖',
    color: '#ff6fa8', dark: '#7a1d4a', ink: '#fff',
    praise: ['Bullseye!', 'Hooray, you got it!', 'Best friends cheer for you!', 'Super duper!'],
  },
];

export const themeById = (id) => THEMES.find((t) => t.id === id) || THEMES[0];

// ── little helpers ─────────────────────────────────────────────

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function stars(n, seed, { maxY = 500, color = '#fff' } = {}) {
  const r = rng(seed);
  let out = '';
  for (let i = 0; i < n; i++) {
    const x = (r() * 1600).toFixed(0), y = (r() * maxY).toFixed(0);
    const rad = (0.8 + r() * 2.2).toFixed(1);
    const d = (r() * 3).toFixed(2);
    out += `<circle class="tw" style="animation-delay:-${d}s" cx="${x}" cy="${y}" r="${rad}" fill="${color}"/>`;
  }
  return out;
}

const svg = (body, defs = '') =>
  `<svg class="scene-svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>${defs}</defs>${body}</svg>`;

const sky = (id, stops) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops
    .map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`)
    .join('')}</linearGradient>`;

// ── scenes ─────────────────────────────────────────────────────

function acacia(x, y, s, fill) {
  return `<g transform="translate(${x} ${y}) scale(${s})" fill="${fill}">
    <path d="M-6 0 L-3 -120 L-40 -160 L-34 -164 L0 -132 L30 -170 L36 -166 L6 -120 L8 0 Z"/>
    <ellipse cx="-30" cy="-172" rx="90" ry="22"/><ellipse cx="40" cy="-180" rx="80" ry="20"/><ellipse cx="0" cy="-192" rx="70" ry="18"/>
  </g>`;
}

function giraffe(x, y, s, fill) {
  return `<g transform="translate(${x} ${y}) scale(${s})" fill="${fill}">
    <rect x="-30" y="-90" width="60" height="34" rx="16"/>
    <rect x="-28" y="-60" width="7" height="60"/><rect x="-14" y="-60" width="7" height="60"/>
    <rect x="10" y="-60" width="7" height="60"/><rect x="22" y="-60" width="7" height="60"/>
    <path d="M18 -82 L40 -180 L52 -178 L34 -80 Z"/>
    <path d="M38 -186 L70 -178 L68 -168 L40 -170 Z"/>
    <rect x="40" y="-196" width="4" height="12"/><rect x="48" y="-196" width="4" height="12"/>
  </g>`;
}

function bird(x, y, s, cls = 'fly') {
  return `<path class="${cls}" transform="translate(${x} ${y}) scale(${s})" d="M0 0 Q10 -10 20 0 Q30 -10 40 0" stroke="#3a1a10" stroke-width="4" fill="none" stroke-linecap="round"/>`;
}

function lionking() {
  const defs = sky('lkSky', [[0, '#ff9a3c'], [0.45, '#ffc65c'], [0.75, '#ffd98a'], [1, '#f7b26a']])
    + `<radialGradient id="lkSun"><stop offset="0" stop-color="#fff6c8"/><stop offset="0.6" stop-color="#ffe58a"/><stop offset="1" stop-color="#ffd06a" stop-opacity="0"/></radialGradient>`;
  return svg(`
    <rect width="1600" height="900" fill="url(#lkSky)"/>
    <circle cx="1060" cy="560" r="420" fill="url(#lkSun)" opacity=".9"/>
    <circle cx="1060" cy="560" r="230" fill="#fff0b0" opacity=".95"/>
    ${bird(560, 180, 1)} ${bird(620, 150, .8)} ${bird(500, 140, .7)} ${bird(1280, 240, .9)}
    <path d="M0 640 Q200 600 420 630 T900 620 T1600 640 V900 H0Z" fill="#d98a3a" opacity=".6"/>
    ${giraffe(1340, 690, .9, '#7a3a1a')} ${giraffe(1440, 700, .7, '#7a3a1a')}
    ${acacia(960, 700, 1.1, '#5a2a12')} ${acacia(1240, 720, .7, '#6a3416')}
    <path d="M0 330 L120 300 L300 330 L520 380 L640 400 L660 430 L520 440 L470 470 L520 560 L560 700 L0 720 Z" fill="#4a2414"/>
    <path d="M520 380 L640 400 L660 430 L520 440 Z" fill="#6b3a1e"/>
    <path d="M0 700 Q300 660 640 700 T1300 690 T1600 700 V900 H0 Z" fill="#c9731f"/>
    <path d="M0 780 Q400 740 800 780 T1600 770 V900 H0 Z" fill="#a85a18"/>
    <g fill="#8a4612">${Array.from({ length: 30 }, (_, i) => `<path d="M${i * 55} 900 l10 -60 l8 60 Z"/>`).join('')}</g>
  `, defs);
}

function mufasa() {
  const defs = sky('muSky', [[0, '#0b1d3a'], [0.5, '#1d4a6e'], [0.8, '#4a8a9a'], [1, '#9fd0c8']])
    + `<linearGradient id="muRiver" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7fd6ff"/><stop offset="1" stop-color="#2a8ac0"/></linearGradient>`;
  const lion = [[700, 120], [760, 100], [820, 115], [860, 160], [930, 170], [1000, 150], [1040, 190], [980, 220], [860, 210], [780, 190]];
  return svg(`
    <rect width="1600" height="900" fill="url(#muSky)"/>
    ${stars(110, 7, { maxY: 460 })}
    <g stroke="#fff6c0" stroke-width="2" opacity=".55" fill="none"><polyline points="${lion.map((p) => p.join(',')).join(' ')}"/></g>
    ${lion.map(([x, y]) => `<circle class="tw" cx="${x}" cy="${y}" r="5" fill="#fff6c0"/>`).join('')}
    <path d="M0 560 L180 330 L260 400 L420 250 L560 420 L700 300 L860 470 L1000 280 L1160 430 L1300 290 L1460 420 L1600 330 V900 H0Z" fill="#2b4a63"/>
    <path d="M180 330 L220 380 L190 372 L160 386 L140 380 Z M420 250 L470 310 L430 300 L400 316 L380 300 Z M1000 280 L1050 340 L1010 330 L980 344 L960 332 Z M1300 290 L1340 340 L1300 332 L1270 344 Z" fill="#eef7ff"/>
    <path d="M0 640 Q300 560 600 620 T1200 600 T1600 620 V900 H0Z" fill="#2f7a4f"/>
    <path d="M760 900 C 820 800, 640 760, 760 690 S 980 640, 900 600" stroke="url(#muRiver)" stroke-width="70" fill="none" stroke-linecap="round" opacity=".95"/>
    <path class="flow" d="M760 900 C 820 800, 640 760, 760 690 S 980 640, 900 600" stroke="#dff6ff" stroke-width="6" fill="none" stroke-dasharray="20 40" opacity=".7"/>
    <g fill="#1d3a2a"><rect x="1230" y="560" width="70" height="200" rx="20"/><ellipse cx="1265" cy="560" rx="160" ry="46"/><ellipse cx="1190" cy="530" rx="70" ry="30"/><ellipse cx="1340" cy="530" rx="70" ry="30"/></g>
    <path d="M0 760 Q400 720 800 770 T1600 750 V900 H0Z" fill="#245e3c"/>
  `, defs);
}

function showman() {
  const defs = sky('gsSky', [[0, '#1a0830'], [0.6, '#4a1458'], [1, '#8a2a5a']])
    + `<pattern id="gsStripe" width="80" height="10" patternUnits="userSpaceOnUse"><rect width="40" height="10" fill="#e8283c"/><rect x="40" width="40" height="10" fill="#fff4e0"/></pattern>`
    + `<linearGradient id="gsBeam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6c0" stop-opacity=".7"/><stop offset="1" stop-color="#fff6c0" stop-opacity="0"/></linearGradient>`;
  const bulbs = Array.from({ length: 22 }, (_, i) => {
    const x = 60 + i * 70; const y = 120 + Math.sin(i / 21 * Math.PI) * 60;
    return `<circle class="tw" style="animation-delay:-${(i % 5) * 0.3}s" cx="${x}" cy="${y}" r="9" fill="#ffd94a"/>`;
  }).join('');
  return svg(`
    <rect width="1600" height="900" fill="url(#gsSky)"/>
    ${stars(70, 3, { maxY: 380 })}
    <g class="sway" style="transform-origin:300px 900px"><polygon points="300,900 220,0 420,0" fill="url(#gsBeam)" opacity=".5"/></g>
    <g class="sway2" style="transform-origin:1300px 900px"><polygon points="1300,900 1180,0 1380,0" fill="url(#gsBeam)" opacity=".5"/></g>
    <path d="M60 120 Q800 260 1540 120" stroke="#2a1030" stroke-width="3" fill="none"/>${bulbs}
    <path d="M800 170 L1300 560 L300 560 Z" fill="url(#gsStripe)" transform="rotate(0)"/>
    <path d="M800 170 L1300 560 L300 560 Z" fill="none" stroke="#ffd94a" stroke-width="8"/>
    <rect x="360" y="560" width="880" height="240" fill="#c81f36"/>
    <g fill="#fff4e0">${Array.from({ length: 11 }, (_, i) => `<rect x="${380 + i * 80}" y="560" width="40" height="240"/>`).join('')}</g>
    <path d="M700 800 L700 640 Q800 560 900 640 L900 800 Z" fill="#2a0a20"/>
    <path d="M360 560 Q405 600 450 560 Q495 600 540 560 Q585 600 630 560 Q675 600 720 560 Q765 600 810 560 Q855 600 900 560 Q945 600 990 560 Q1035 600 1080 560 Q1125 600 1170 560 Q1205 600 1240 560" fill="#ffd94a"/>
    <line x1="800" y1="170" x2="800" y2="80" stroke="#ffd94a" stroke-width="8"/>
    <path class="flag" d="M800 80 L880 100 L800 120 Z" fill="#ff4a6a"/>
    <rect y="800" width="1600" height="100" fill="#3a0f24"/>
    <path d="M0 800 Q800 760 1600 800" stroke="#ffd94a" stroke-width="6" fill="none"/>
  `, defs);
}

function dome(x, y, w, h, fill) {
  return `<path d="M${x - w / 2} ${y} Q${x - w / 2} ${y - h * .7} ${x} ${y - h} Q${x + w / 2} ${y - h * .7} ${x + w / 2} ${y} Z" fill="${fill}"/><rect x="${x - 3}" y="${y - h - 30}" width="6" height="30" fill="${fill}"/><circle cx="${x}" cy="${y - h - 34}" r="7" fill="${fill}"/>`;
}

function aladdin() {
  const defs = sky('alSky', [[0, '#0d0a3a'], [0.55, '#3a2a8a'], [0.85, '#a0509a'], [1, '#e89a6a']])
    + `<linearGradient id="alDune" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2b45a"/><stop offset="1" stop-color="#c47a2a"/></linearGradient>`;
  return svg(`
    <rect width="1600" height="900" fill="url(#alSky)"/>
    ${stars(120, 11, { maxY: 520 })}
    <circle cx="1300" cy="170" r="80" fill="#fff4c0"/><circle cx="1336" cy="146" r="74" fill="#1b1350"/>
    <g fill="#1a0f3a">
      <rect x="420" y="500" width="760" height="180"/>
      ${dome(800, 500, 260, 220, '#1a0f3a')}
      ${dome(560, 520, 140, 120, '#1a0f3a')} ${dome(1040, 520, 140, 120, '#1a0f3a')}
      <rect x="380" y="330" width="44" height="350"/>${dome(402, 330, 60, 60, '#1a0f3a')}
      <rect x="1176" y="330" width="44" height="350"/>${dome(1198, 330, 60, 60, '#1a0f3a')}
    </g>
    <g fill="#ffd27a" opacity=".85">${[500, 620, 740, 860, 980, 1100].map((x) => `<path d="M${x} 640 v-40 q12 -22 24 0 v40 z"/>`).join('')}</g>
    <path d="M0 700 Q300 620 700 690 T1600 660 V900 H0Z" fill="url(#alDune)"/>
    <path d="M0 800 Q500 720 1000 790 T1600 770 V900 H0Z" fill="#d98a3a"/>
    <g class="bob">
      <g transform="translate(220 300) rotate(-6)">
        <path d="M0 0 Q90 -16 180 0 Q270 16 300 0 L290 40 Q200 56 110 40 Q40 30 -10 40 Z" fill="#8a2be2"/>
        <path d="M0 0 Q90 -16 180 0 Q270 16 300 0" stroke="#ffd94a" stroke-width="6" fill="none"/>
        <path d="M-10 40 Q40 30 110 40 Q200 56 290 40" stroke="#ffd94a" stroke-width="6" fill="none"/>
        <g stroke="#ffd94a" stroke-width="4">${[0, 1, 2, 3].map((i) => `<line x1="${-4 - i * 2}" y1="${6 + i * 10}" x2="${-24 - i * 2}" y2="${8 + i * 10}"/><line x1="${296 - i * 2}" y1="${6 + i * 10}" x2="${318 - i * 2}" y2="${8 + i * 10}"/>`).join('')}</g>
        <circle cx="150" cy="22" r="10" fill="#ffd94a"/>
      </g>
    </g>
  `, defs);
}

function ducks() {
  const defs = sky('mdArena', [[0, '#0e1a2a'], [1, '#22384a']])
    + `<linearGradient id="mdIce" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eaf6ff"/><stop offset="1" stop-color="#c4e2f5"/></linearGradient>`;
  const r = rng(5);
  const crowd = Array.from({ length: 220 }, (_, i) => {
    const row = Math.floor(i / 44), col = i % 44;
    const cols = ['#f4c542', '#2b9a5c', '#ffffff', '#7a4bd6', '#e8453c', '#4a90e2'];
    return `<circle cx="${20 + col * 36 + (row % 2) * 18}" cy="${230 + row * 34}" r="13" fill="${cols[Math.floor(r() * cols.length)]}" opacity=".8"/>`;
  }).join('');
  return svg(`
    <rect width="1600" height="900" fill="url(#mdArena)"/>
    <g fill="#fff8d0">${[200, 600, 1000, 1400].map((x) => `<rect x="${x - 70}" y="40" width="140" height="26" rx="8"/>`).join('')}</g>
    <g fill="#fff8d0" opacity=".18">${[200, 600, 1000, 1400].map((x) => `<polygon points="${x - 60},66 ${x + 60},66 ${x + 200},420 ${x - 200},420"/>`).join('')}</g>
    <rect x="560" y="110" width="480" height="80" rx="14" fill="#123f3a" stroke="#f4c542" stroke-width="6"/>
    <text x="800" y="166" text-anchor="middle" font-size="46" font-family="Fredoka, sans-serif" font-weight="700" fill="#f4c542">GO DUCKS!</text>
    ${crowd}
    <rect y="400" width="1600" height="500" fill="url(#mdIce)"/>
    <rect y="400" width="1600" height="70" fill="#fff"/><rect y="452" width="1600" height="18" fill="#f4c542"/>
    <rect y="400" width="1600" height="6" fill="#9ab"/>
    <rect x="780" y="470" width="40" height="430" fill="#e8453c" opacity=".75"/>
    <rect x="420" y="470" width="30" height="430" fill="#3a7ad8" opacity=".6"/><rect x="1150" y="470" width="30" height="430" fill="#3a7ad8" opacity=".6"/>
    <ellipse cx="800" cy="700" rx="200" ry="120" fill="none" stroke="#3a7ad8" stroke-width="8" opacity=".6"/>
    <circle cx="800" cy="700" r="12" fill="#3a7ad8"/>
    <g transform="translate(1420 560)">
      <path d="M0 0 L120 0 L140 110 L-20 110 Z" fill="none" stroke="#e8453c" stroke-width="10"/>
      <g stroke="#ffffff" stroke-width="2" opacity=".8">${Array.from({ length: 8 }, (_, i) => `<line x1="${i * 16}" y1="0" x2="${-20 + i * 22}" y2="110"/>`).join('')}${[25, 55, 85].map((y) => `<line x1="${-y / 5}" y1="${y}" x2="${120 + y / 5.5}" y2="${y}"/>`).join('')}</g>
    </g>
    <ellipse class="slide" cx="520" cy="780" rx="22" ry="9" fill="#111"/>
  `, defs);
}

function rock() {
  const defs = sky('srBg', [[0, '#0a0614'], [0.7, '#2a0f3a'], [1, '#3a1450']])
    + ['#ff4fb0', '#40d8ff', '#ffe04a'].map((c, i) => `<linearGradient id="srBeam${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}" stop-opacity=".75"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></linearGradient>`).join('');
  const amp = (x, y) => `<g transform="translate(${x} ${y})"><rect width="200" height="150" rx="10" fill="#111"/><rect x="10" y="10" width="180" height="130" rx="6" fill="#222"/>${[0, 1].map((r) => [0, 1].map((c) => `<circle cx="${55 + c * 90}" cy="${42 + r * 66}" r="28" fill="#333" stroke="#555" stroke-width="4"/>`).join('')).join('')}</g>`;
  const bars = Array.from({ length: 24 }, (_, i) => `<rect class="eq" style="animation-delay:-${((i * 7) % 10) / 10}s" x="${30 + i * 64}" y="640" width="40" height="120" rx="6" fill="${['#ff4fb0', '#40d8ff', '#ffe04a', '#7aff7a'][i % 4]}" opacity=".55"/>`).join('');
  return svg(`
    <rect width="1600" height="900" fill="url(#srBg)"/>
    <g class="sway" style="transform-origin:300px 0px"><polygon points="300,0 240,0 60,800 540,800" fill="url(#srBeam0)" opacity=".55"/></g>
    <g class="sway2" style="transform-origin:800px 0px"><polygon points="800,0 760,0 600,800 1000,800" fill="url(#srBeam1)" opacity=".5"/></g>
    <g class="sway" style="transform-origin:1300px 0px"><polygon points="1300,0 1260,0 1060,800 1540,800" fill="url(#srBeam2)" opacity=".5"/></g>
    <g fill="#333">${[300, 800, 1300].map((x) => `<rect x="${x - 40}" y="0" width="80" height="30" rx="6"/>`).join('')}</g>
    ${bars}
    ${amp(60, 560)} ${amp(60, 410)} ${amp(1340, 560)} ${amp(1340, 410)}
    <g transform="translate(800 640)">
      <ellipse cx="0" cy="40" rx="110" ry="80" fill="#c81f6a" stroke="#ddd" stroke-width="8"/>
      <ellipse cx="0" cy="40" rx="60" ry="44" fill="#ff4fb0"/>
      <ellipse cx="-170" cy="-10" rx="60" ry="14" fill="#e8c34a"/><rect x="-173" y="-10" width="6" height="110" fill="#aaa"/>
      <ellipse cx="170" cy="-30" rx="60" ry="14" fill="#e8c34a"/><rect x="167" y="-30" width="6" height="130" fill="#aaa"/>
      <ellipse cx="-110" cy="20" rx="44" ry="20" fill="#ddd"/><ellipse cx="110" cy="20" rx="44" ry="20" fill="#ddd"/>
    </g>
    <rect y="760" width="1600" height="140" fill="#1a0a1e"/>
    <rect y="756" width="1600" height="8" fill="#ff4fb0"/>
    <g font-size="64" fill="#fff" opacity=".65" font-family="serif">
      <text class="float" x="460" y="300">♪</text><text class="float" style="animation-delay:-1.5s" x="1120" y="260">♫</text><text class="float" style="animation-delay:-3s" x="980" y="420">♪</text>
    </g>
  `, defs);
}

function friends() {
  const defs = sky('frSky', [[0, '#7ec8f3'], [1, '#d8f1ff']]);
  const cloud = (x, y, s, cls) => `<g class="${cls}"><g transform="translate(${x} ${y}) scale(${s})" fill="#fff"><ellipse cx="0" cy="0" rx="70" ry="40"/><ellipse cx="60" cy="-20" rx="60" ry="46"/><ellipse cx="120" cy="0" rx="70" ry="38"/></g></g>`;
  const rainbow = ['#ff5a5f', '#ffa94a', '#ffd94a', '#4caf50', '#4a90e2', '#8b5fbf']
    .map((c, i) => `<path d="M${260 + i * 26} 720 A ${540 - i * 26} ${540 - i * 26} 0 0 1 ${1340 - i * 26} 720" stroke="${c}" stroke-width="26" fill="none" opacity=".75"/>`).join('');
  const flowers = Array.from({ length: 26 }, (_, i) => {
    const x = 30 + i * 62, y = 830 + ((i * 37) % 40);
    const c = ['#ff7eb3', '#ffd94a', '#ffffff', '#c38cff'][i % 4];
    return `<g transform="translate(${x} ${y})"><circle r="10" cx="-9" fill="${c}"/><circle r="10" cx="9" fill="${c}"/><circle r="10" cy="-9" fill="${c}"/><circle r="10" cy="9" fill="${c}"/><circle r="7" fill="#ffb02e"/></g>`;
  }).join('');
  return svg(`
    <rect width="1600" height="900" fill="url(#frSky)"/>
    <circle cx="1440" cy="130" r="70" fill="#fff07a"/><circle class="tw" cx="1440" cy="130" r="96" fill="#fff07a" opacity=".3"/>
    ${rainbow}
    ${cloud(180, 150, 1, 'drift')} ${cloud(900, 110, .8, 'drift2')}
    <path d="M0 640 Q400 560 800 640 T1600 620 V900 H0Z" fill="#7fd36a"/>
    <g transform="translate(150 520)">
      <rect x="0" y="60" width="220" height="150" fill="#fff4e0"/><path d="M-20 70 L110 -30 L240 70 Z" fill="#e8453c"/>
      <rect x="90" y="130" width="50" height="80" fill="#8b5a3c"/><rect x="25" y="95" width="45" height="40" fill="#9fd8ff"/><rect x="155" y="95" width="45" height="40" fill="#9fd8ff"/>
    </g>
    <g transform="translate(1330 600)">
      <rect x="-6" y="0" width="12" height="160" fill="#8b5a3c" transform="rotate(12)"/><rect x="-6" y="0" width="12" height="160" fill="#8b5a3c" transform="rotate(-12)"/>
      ${['#ffffff', '#222', '#4a90e2', '#e8453c', '#ffd94a'].map((c, i) => `<circle cx="0" cy="0" r="${80 - i * 16}" fill="${c}"/>`).join('')}
    </g>
    <path d="M0 760 Q500 700 1000 760 T1600 740 V900 H0Z" fill="#5cbf4a"/>
    ${flowers}
  `, defs);
}

// ── Level 2 scenes: same worlds, a new place to visit ──────────

function pine(x, y, s, fill = '#1f4a3a', snow = true) {
  return `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-8" y="-20" width="16" height="30" fill="#4a2a1a"/>
    <path d="M0 -190 L60 -100 L30 -100 L80 -20 L-80 -20 L-30 -100 L-60 -100 Z" fill="${fill}"/>
    ${snow ? '<path d="M0 -190 L22 -157 L8 -150 L-6 -158 L-22 -157 Z M-30 -100 L-12 -106 L4 -100 L22 -106 L30 -100 L44 -80 L-44 -80 Z" fill="#f4fbff" opacity=".9"/>' : ''}</g>`;
}

function lionking2() {
  const defs = sky('lk2Sky', [[0, '#0b1240'], [0.55, '#2a2a6e'], [0.85, '#5a3a7a'], [1, '#8a4a6a']])
    + `<radialGradient id="lk2Moon"><stop offset="0" stop-color="#fffbe0"/><stop offset=".6" stop-color="#fff2b0" stop-opacity=".5"/><stop offset="1" stop-color="#fff2b0" stop-opacity="0"/></radialGradient>`;
  const r = rng(21);
  const flies = Array.from({ length: 26 }, () => `<circle class="tw" style="animation-delay:-${(r() * 3).toFixed(2)}s" cx="${(r() * 1600).toFixed(0)}" cy="${(560 + r() * 260).toFixed(0)}" r="${(3 + r() * 3).toFixed(1)}" fill="#e8ff7a"/>`).join('');
  return svg(`
    <rect width="1600" height="900" fill="url(#lk2Sky)"/>
    ${stars(140, 31, { maxY: 520 })}
    <circle cx="1180" cy="230" r="260" fill="url(#lk2Moon)"/>
    <circle cx="1180" cy="230" r="110" fill="#fff6d0"/>
    <circle cx="1145" cy="205" r="18" fill="#efe2b0"/><circle cx="1215" cy="260" r="12" fill="#efe2b0"/>
    <path d="M0 620 Q260 560 520 610 T1050 590 T1600 610 V900 H0Z" fill="#2a1d48"/>
    ${acacia(380, 640, 1.2, '#140c26')} ${acacia(1380, 650, .9, '#140c26')}
    ${giraffe(1000, 640, .8, '#140c26')}
    <path d="M0 700 Q400 660 800 700 T1600 690 V900 H0Z" fill="#1d1436"/>
    <ellipse cx="800" cy="790" rx="420" ry="60" fill="#36508a"/>
    <ellipse cx="830" cy="790" rx="120" ry="16" fill="#fff6d0" opacity=".55"/>
    <ellipse class="flow" cx="800" cy="790" rx="360" ry="44" fill="none" stroke="#9ab8f0" stroke-width="3" stroke-dasharray="30 50" opacity=".5"/>
    ${flies}
  `, defs);
}

function mufasa2() {
  const defs = sky('mu2Sky', [[0, '#8fd8f8'], [1, '#d8f6e8']])
    + `<linearGradient id="mu2Fall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8fbff"/><stop offset="1" stop-color="#7fd0f0"/></linearGradient>`;
  const leaf = (x, y, r, c) => `<ellipse cx="${x}" cy="${y}" rx="120" ry="40" fill="${c}" transform="rotate(${r} ${x} ${y})"/>`;
  const rainbow = ['#ff5a5f', '#ffa94a', '#ffd94a', '#4caf50', '#4a90e2', '#8b5fbf']
    .map((c, i) => `<path d="M${560 + i * 14} 520 A ${260 - i * 14} ${260 - i * 14} 0 0 1 ${1080 - i * 14} 520" stroke="${c}" stroke-width="14" fill="none" opacity=".55"/>`).join('');
  return svg(`
    <rect width="1600" height="900" fill="url(#mu2Sky)"/>
    ${rainbow}
    <path d="M0 160 L380 120 L520 240 L560 900 L0 900Z" fill="#3f6a4a"/>
    <path d="M1600 140 L1180 110 L1060 240 L1040 900 L1600 900Z" fill="#3f6a4a"/>
    <path d="M520 240 L1060 240 L1060 260 L520 260Z" fill="#2f5a3a"/>
    <rect x="600" y="250" width="400" height="520" fill="url(#mu2Fall)"/>
    <g stroke="#ffffff" stroke-width="6" opacity=".8">${[640, 700, 760, 820, 880, 940].map((x, i) => `<line class="flow" style="animation-delay:-${i * 0.3}s" x1="${x}" y1="250" x2="${x}" y2="770" stroke-dasharray="40 60"/>`).join('')}</g>
    <ellipse cx="800" cy="790" rx="420" ry="80" fill="#4ab0d8"/>
    <g fill="#ffffff" opacity=".85">${[650, 720, 800, 880, 950].map((x) => `<circle class="tw" cx="${x}" cy="770" r="22"/>`).join('')}</g>
    ${leaf(120, 700, -30, '#2f8a4a')} ${leaf(260, 780, 20, '#3fa85a')} ${leaf(1480, 700, 30, '#2f8a4a')} ${leaf(1340, 790, -20, '#3fa85a')}
    ${leaf(180, 300, 40, '#2f8a4a')} ${leaf(1420, 320, -40, '#2f8a4a')}
    <g stroke="#2a6a3a" stroke-width="8" fill="none"><path d="M360 120 Q340 300 380 460"/><path d="M1240 110 Q1270 280 1230 420"/></g>
    <path d="M0 840 Q800 800 1600 840 V900 H0Z" fill="#2f7a4f"/>
  `, defs);
}

function showman2() {
  const defs = `<radialGradient id="gs2Bg" cx=".5" cy=".35" r=".8"><stop offset="0" stop-color="#5a1a4a"/><stop offset="1" stop-color="#14051a"/></radialGradient>
    <radialGradient id="gs2Spot"><stop offset="0" stop-color="#fff6c0" stop-opacity=".8"/><stop offset="1" stop-color="#fff6c0" stop-opacity="0"/></radialGradient>
    <pattern id="gs2Ring" width="60" height="60" patternUnits="userSpaceOnUse"><rect width="30" height="60" fill="#c81f36"/><rect x="30" width="30" height="60" fill="#f2e6c8"/></pattern>`;
  const curtain = (x, flip) => `<path d="M${x} 0 ${flip ? `L${x - 260} 0 Q${x - 160} 400 ${x - 230} 900 L${x} 900 Z` : `L${x + 260} 0 Q${x + 160} 400 ${x + 230} 900 L${x} 900 Z`}" fill="#a01028"/>
    <g stroke="#6a0818" stroke-width="10" fill="none" opacity=".7">${[60, 130, 200].map((d) => `<path d="M${flip ? x - d : x + d} 0 Q${flip ? x - d + 30 : x + d - 30} 450 ${flip ? x - d + 10 : x + d - 10} 900"/>`).join('')}</g>`;
  return svg(`
    <rect width="1600" height="900" fill="url(#gs2Bg)"/>
    ${stars(50, 9, { maxY: 300, color: '#ffd94a' })}
    <g stroke="#ccc" stroke-width="3"><line x1="620" y1="0" x2="660" y2="300"/><line x1="820" y1="0" x2="780" y2="300"/>
      <line x1="980" y1="0" x2="1000" y2="220"/><line x1="1140" y1="0" x2="1120" y2="220"/></g>
    <g class="sway" style="transform-origin:720px 0px"><rect x="650" y="296" width="140" height="10" rx="5" fill="#ffd94a"/></g>
    <g class="sway2" style="transform-origin:1060px 0px"><rect x="990" y="216" width="140" height="10" rx="5" fill="#ffd94a"/></g>
    <ellipse cx="800" cy="760" rx="700" ry="160" fill="#3a0f24"/>
    <ellipse cx="800" cy="750" rx="640" ry="130" fill="url(#gs2Ring)"/>
    <ellipse cx="800" cy="750" rx="560" ry="104" fill="#e8c27a"/>
    <ellipse cx="800" cy="750" rx="560" ry="104" fill="none" stroke="#ffd94a" stroke-width="6"/>
    <ellipse class="tw" cx="560" cy="740" rx="160" ry="44" fill="url(#gs2Spot)"/>
    <ellipse class="tw" style="animation-delay:-1.3s" cx="1060" cy="760" rx="160" ry="44" fill="url(#gs2Spot)"/>
    <g transform="translate(800 720)"><rect x="-60" y="-70" width="120" height="70" rx="10" fill="#4a90e2"/><rect x="-60" y="-70" width="120" height="14" fill="#ffd94a"/>
      <path d="M0 -60 l8 18 h20 l-16 12 l6 20 l-18 -12 l-18 12 l6 -20 l-16 -12 h20z" fill="#fff"/></g>
    ${curtain(0, false)} ${curtain(1600, true)}
    <path d="M0 0 H1600 V70 Q1500 110 1400 70 Q1300 110 1200 70 Q1100 110 1000 70 Q900 110 800 70 Q700 110 600 70 Q500 110 400 70 Q300 110 200 70 Q100 110 0 70 Z" fill="#c81f36"/>
    <path d="M0 70 Q100 110 200 70 Q300 110 400 70 Q500 110 600 70 Q700 110 800 70 Q900 110 1000 70 Q1100 110 1200 70 Q1300 110 1400 70 Q1500 110 1600 70" stroke="#ffd94a" stroke-width="6" fill="none"/>
  `, defs);
}

function aladdin2() {
  const defs = sky('al2Sky', [[0, '#6ec8f0'], [1, '#ffe6b0']])
    + `<linearGradient id="al2Wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2c48a"/><stop offset="1" stop-color="#d89a5a"/></linearGradient>`;
  const awning = (x, w, c1, c2) => {
    const n = 6, sw = w / n;
    return `<g>${Array.from({ length: n }, (_, i) => `<path d="M${x + i * sw} 470 L${x + (i + 1) * sw} 470 L${x + (i + 1) * sw} 540 Q${x + i * sw + sw / 2} 565 ${x + i * sw} 540 Z" fill="${i % 2 ? c2 : c1}"/>`).join('')}</g>`;
  };
  const stall = (x, c1, c2, goods) => `<g>
    <rect x="${x}" y="540" width="300" height="200" fill="#8a4a1e"/><rect x="${x + 10}" y="560" width="280" height="12" fill="#6a3a12"/>
    ${awning(x - 10, 320, c1, c2)}
    <g>${Array.from({ length: 8 }, (_, i) => `<circle cx="${x + 30 + (i % 4) * 75}" cy="${610 + Math.floor(i / 4) * 60}" r="22" fill="${goods[i % goods.length]}"/>`).join('')}</g></g>`;
  const lanterns = [260, 520, 800, 1080, 1340].map((x, i) => `<g class="fly" style="animation-delay:-${i * 0.5}s"><line x1="${x}" y1="0" x2="${x}" y2="150" stroke="#6a3a12" stroke-width="3"/>
    <path d="M${x - 20} 150 Q${x} 120 ${x + 20} 150 L${x + 14} 200 Q${x} 214 ${x - 14} 200 Z" fill="${['#ff5a5f', '#ffd94a', '#40d8ff', '#8b5fbf', '#ff9a3c'][i]}"/></g>`).join('');
  return svg(`
    <rect width="1600" height="900" fill="url(#al2Sky)"/>
    <g fill="#f8e0b8">${dome(800, 380, 300, 220, '#f8e0b8')}<rect x="640" y="380" width="320" height="120"/></g>
    <circle cx="800" cy="300" r="16" fill="#ffd94a"/>
    <rect y="420" width="1600" height="480" fill="url(#al2Wall)"/>
    <g fill="#c47a3a" opacity=".5">${[120, 460, 1140, 1480].map((x) => `<path d="M${x - 40} 520 v-60 q40 -50 80 0 v60 z"/>`).join('')}</g>
    ${stall(80, '#e8453c', '#fff4e0', ['#ff9a3c', '#ffd94a', '#e8453c'])}
    ${stall(1220, '#4a90e2', '#fff4e0', ['#7a4bd6', '#4caf50', '#a0d468'])}
    ${stall(650, '#8b5fbf', '#ffd94a', ['#e8453c', '#ff7eb3', '#ffd94a'])}
    ${lanterns}
    <rect y="760" width="1600" height="140" fill="#e2b072"/>
    <g fill="#c99052">${Array.from({ length: 16 }, (_, i) => `<rect x="${i * 100 + 10}" y="790" width="80" height="20" rx="6"/>`).join('')}</g>
  `, defs);
}

function ducks2() {
  const defs = sky('md2Sky', [[0, '#2a3a7a'], [0.45, '#d86a8a'], [0.75, '#ffb27a'], [1, '#ffe0b0']])
    + `<linearGradient id="md2Ice" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfeaff"/><stop offset="1" stop-color="#9ccdf0"/></linearGradient>`;
  const r = rng(77);
  const snow = Array.from({ length: 60 }, () => `<circle class="float" style="animation-delay:-${(r() * 4.5).toFixed(2)}s" cx="${(r() * 1600).toFixed(0)}" cy="${(200 + r() * 600).toFixed(0)}" r="${(2 + r() * 4).toFixed(1)}" fill="#fff"/>`).join('');
  return svg(`
    <rect width="1600" height="900" fill="url(#md2Sky)"/>
    <circle cx="300" cy="470" r="90" fill="#ffe08a" opacity=".9"/>
    <path d="M0 520 Q300 420 600 500 T1200 480 T1600 500 V900 H0Z" fill="#eef6ff"/>
    ${pine(120, 600, 1.1)} ${pine(260, 580, .8)} ${pine(1340, 590, 1.2)} ${pine(1480, 610, .9)} ${pine(1210, 600, .7)}
    <ellipse cx="800" cy="720" rx="640" ry="150" fill="url(#md2Ice)"/>
    <g stroke="#ffffff" stroke-width="4" opacity=".7" fill="none"><path d="M380 700 Q520 680 640 720"/><path d="M900 760 Q1040 730 1180 750"/><path d="M700 650 Q800 640 900 660"/></g>
    <g transform="translate(1110 640)"><path d="M0 0 L90 0 L100 70 L-10 70 Z" fill="none" stroke="#e8453c" stroke-width="8"/>
      <g stroke="#fff" stroke-width="2">${[0, 1, 2, 3, 4].map((i) => `<line x1="${i * 22}" y1="0" x2="${-6 + i * 26}" y2="70"/>`).join('')}</g></g>
    <ellipse class="slide" cx="420" cy="740" rx="18" ry="7" fill="#111"/>
    <g transform="translate(560 560)"><rect x="0" y="0" width="160" height="60" rx="8" fill="#2b9a5c"/><text x="80" y="42" text-anchor="middle" font-size="30" font-family="Fredoka, sans-serif" font-weight="700" fill="#fff">POND</text><rect x="70" y="60" width="20" height="80" fill="#6a4a2a"/></g>
    ${snow}
  `, defs);
}

function rock2() {
  const defs = sky('sr2Wall', [[0, '#f4e6c8'], [1, '#e8d2a8']]);
  return svg(`
    <rect width="1600" height="900" fill="url(#sr2Wall)"/>
    <rect y="0" width="1600" height="40" fill="#c8a878"/>
    <g>${[0, 1].map((i) => `<g transform="translate(${80 + i * 1260} 120)"><rect width="200" height="260" fill="#9fd8ff" stroke="#fff" stroke-width="12"/><line x1="100" y1="0" x2="100" y2="260" stroke="#fff" stroke-width="8"/><line x1="0" y1="130" x2="200" y2="130" stroke="#fff" stroke-width="8"/><circle cx="60" cy="60" r="26" fill="#fff07a"/></g>`).join('')}</g>
    <rect x="420" y="90" width="760" height="380" rx="10" fill="#8a5a2a"/>
    <rect x="440" y="110" width="720" height="340" fill="#24463a"/>
    <g font-family="'Comic Sans MS', Fredoka, sans-serif" fill="#f0f0e0" font-weight="700">
      <text x="800" y="200" text-anchor="middle" font-size="64">SCHOOL OF ROCK</text>
      <text x="520" y="300" font-size="48">3 × 4 = 12</text>
      <text x="880" y="300" font-size="48">🎸 + 🥁 = 🤘</text>
      <text x="520" y="390" font-size="44">♪ ♫ ♪  ♫ ♪</text>
    </g>
    <rect x="440" y="450" width="720" height="16" fill="#6a4a2a"/>
    <rect y="620" width="1600" height="280" fill="#b8865a"/>
    <g stroke="#9a6a40" stroke-width="3">${Array.from({ length: 9 }, (_, i) => `<line x1="0" y1="${650 + i * 30}" x2="1600" y2="${650 + i * 30}"/>`).join('')}</g>
    <g transform="translate(160 560)"><rect width="200" height="150" rx="10" fill="#111"/><circle cx="60" cy="75" r="40" fill="#333" stroke="#555" stroke-width="5"/><circle cx="145" cy="75" r="40" fill="#333" stroke="#555" stroke-width="5"/></g>
    <g transform="translate(1290 470) rotate(-14)">
      <rect x="40" y="-110" width="18" height="220" fill="#6a3a1a"/>
      <path d="M49 110 C -20 110 -30 200 30 220 C 0 260 40 320 90 300 C 150 320 170 250 130 220 C 180 190 140 110 49 110 Z" fill="#e8453c"/>
      <circle cx="65" cy="215" r="18" fill="#2a0a0a"/>
    </g>
    <g transform="translate(560 620)"><rect width="240" height="110" fill="#c89a5a"/><rect x="10" y="110" width="12" height="80" fill="#6a4a2a"/><rect x="218" y="110" width="12" height="80" fill="#6a4a2a"/></g>
    <g transform="translate(860 640)"><rect width="240" height="110" fill="#c89a5a"/><rect x="10" y="110" width="12" height="80" fill="#6a4a2a"/><rect x="218" y="110" width="12" height="80" fill="#6a4a2a"/></g>
    <g font-size="60" fill="#8b5fbf" opacity=".6" font-family="serif"><text class="float" x="1240" y="200">♪</text><text class="float" style="animation-delay:-2s" x="320" y="520">♫</text></g>
  `, defs);
}

function friends2() {
  const defs = sky('fr2Sky', [[0, '#5ab8f0'], [1, '#c8ecff']])
    + `<linearGradient id="fr2Sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a9ad8"/><stop offset="1" stop-color="#5ad0e8"/></linearGradient>`;
  const waves = Array.from({ length: 3 }, (_, k) => `<path class="drift" style="animation-duration:${18 + k * 6}s" d="M-300 ${560 + k * 40} ${Array.from({ length: 22 }, (_, i) => `q50 -18 100 0`).join(' ')}" stroke="#fff" stroke-width="5" fill="none" opacity=".6"/>`).join('');
  return svg(`
    <rect width="1600" height="900" fill="url(#fr2Sky)"/>
    <circle cx="1350" cy="140" r="80" fill="#fff07a"/><circle class="tw" cx="1350" cy="140" r="110" fill="#fff07a" opacity=".3"/>
    <rect y="480" width="1600" height="260" fill="url(#fr2Sea)"/>
    ${waves}
    <g class="bob"><g transform="translate(980 440)"><path d="M0 60 L120 60 L100 90 L20 90 Z" fill="#e8453c"/><rect x="58" y="-60" width="6" height="120" fill="#6a3a1a"/><path d="M64 -56 L64 50 L120 50 Z" fill="#fff"/><path d="M58 -40 L58 50 L10 50 Z" fill="#ffd94a"/></g></g>
    <path d="M0 700 Q400 650 800 690 T1600 680 V900 H0Z" fill="#f6dca0"/>
    <g transform="translate(300 600)"><line x1="0" y1="0" x2="20" y2="200" stroke="#6a3a1a" stroke-width="8"/><path d="M-160 20 Q0 -100 170 30 Z" fill="#ff7eb3"/><path d="M-160 20 Q-80 -60 0 -10 Z" fill="#fff" opacity=".5"/></g>
    <g transform="translate(760 760)"><circle r="44" fill="#fff"/><path d="M-44 0 A44 44 0 0 1 0 -44 L0 0 Z" fill="#e8453c"/><path d="M0 -44 A44 44 0 0 1 44 0 L0 0 Z" fill="#4a90e2"/><path d="M44 0 A44 44 0 0 1 0 44 L0 0 Z" fill="#ffd94a"/></g>
    <g transform="translate(1240 700)"><path d="M0 0 L60 -100 L120 0 Z" fill="#e8c27a"/><rect x="0" y="0" width="120" height="60" fill="#e8c27a"/><rect x="45" y="20" width="30" height="40" fill="#c89a5a"/><path d="M60 -100 L60 -140 L90 -128 L60 -118" fill="#e8453c"/></g>
    <g fill="#f4a0b8">${[180, 520, 1040, 1460].map((x, i) => `<path d="M${x} ${820 + (i % 2) * 30} l14 -20 l14 20 z"/>`).join('')}</g>
  `, defs);
}

const SCENES = { lionking, mufasa, showman, aladdin, ducks, rock, friends, lionking2, mufasa2, showman2, aladdin2, ducks2, rock2, friends2 };
const cache = {};
export function sceneSVG(id) {
  if (!cache[id]) cache[id] = (SCENES[id] || friends)();
  return cache[id];
}
export const sceneId = (world, lv = 1) => (lv === 2 ? `${world}2` : world);

/** Level 2 of each world: a new place and new cheers. */
export const LEVEL2 = {
  lionking: { place: 'The Pride Lands at night', praise: ['Under the stars, you shine!', 'Moonlight maths magic!', 'The whole pride cheers for you!'] },
  mufasa: { place: 'The hidden waterfall', praise: ['Splash! That\'s right!', 'You found the hidden answer!', 'Mufasa roars for you!'] },
  showman: { place: 'Inside the ring', praise: ['Spotlight on you, superstar!', 'What a showstopper!', 'Standing ovation!'] },
  aladdin: { place: 'The Agrabah market', praise: ['A bargain! Correct!', 'The whole market cheers!', 'Genie high five!'] },
  ducks: { place: 'The frozen pond', praise: ['Ice cold and totally right!', 'Ducks on the pond, GOAL!', 'Quack-tastic!'] },
  rock: { place: 'Rock class', praise: ['A plus, rock star!', 'Class rocks!', 'Turn it up! Correct!'] },
  friends: { place: 'Beach day', praise: ['Making waves! Correct!', 'Sunny and super smart!', 'Beach day hero!'] },
};
export function placeFor(world, lv) { return lv === 2 ? LEVEL2[world].place : themeById(world).place; }
export function praiseFor(world, lv) { return lv === 2 ? LEVEL2[world].praise : themeById(world).praise; }
