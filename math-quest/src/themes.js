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

const SCENES = { lionking, mufasa, showman, aladdin, ducks, rock, friends };
const cache = {};
export function sceneSVG(id) {
  if (!cache[id]) cache[id] = (SCENES[id] || friends)();
  return cache[id];
}

/** A rainbow-ish scene for the menus. */
export function menuSVG() {
  return sceneSVG('friends');
}
