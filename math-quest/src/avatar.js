// Little portrait of an Archery Maya character, drawn in SVG in the same
// style as the main game's sprites (skin tone, hair cap, rosy cheeks,
// glasses for Thatha and Lolo, a bun for Paati and Lola, Benji is a dog).
import { CHARACTERS } from '../../src/config.js';

export const charById = (id) => CHARACTERS.find((c) => c.id === id) || CHARACTERS[0];
const hex = (n) => `#${n.toString(16).padStart(6, '0')}`;
const SKIN = '#f5c89a';

function dog(c) {
  return `<svg viewBox="0 0 100 100" class="avatar" aria-hidden="true">
    <circle cx="50" cy="50" r="48" fill="#fff6e6"/>
    <ellipse cx="50" cy="92" rx="34" ry="22" fill="${hex(c.body)}"/>
    <ellipse cx="24" cy="44" rx="12" ry="22" fill="${hex(c.accent)}" transform="rotate(18 24 44)"/>
    <ellipse cx="76" cy="44" rx="12" ry="22" fill="${hex(c.accent)}" transform="rotate(-18 76 44)"/>
    <circle cx="50" cy="50" r="27" fill="${hex(c.body)}"/>
    <ellipse cx="50" cy="62" rx="15" ry="11" fill="#f2dcc0"/>
    <circle cx="40" cy="46" r="4" fill="#14131a"/><circle cx="60" cy="46" r="4" fill="#14131a"/>
    <circle cx="41" cy="45" r="1.3" fill="#fff"/><circle cx="61" cy="45" r="1.3" fill="#fff"/>
    <ellipse cx="50" cy="57" rx="5" ry="3.6" fill="#14131a"/>
    <path d="M44 64 Q50 69 56 64" stroke="#14131a" stroke-width="2" fill="none" stroke-linecap="round"/>
    <ellipse cx="50" cy="70" rx="4" ry="5" fill="#ff7e9a"/>
  </svg>`;
}

export function avatarSVG(id) {
  const c = charById(id);
  if (c.isPet) return dog(c);
  const hair = hex(c.hair);
  const hairTop = c.isElder
    ? `<ellipse cx="27" cy="48" rx="7" ry="9" fill="${hair}"/><ellipse cx="73" cy="48" rx="7" ry="9" fill="${hair}"/><rect x="38" y="23" width="24" height="5" rx="2.5" fill="${hair}"/>`
    : `<path d="M24 46 A26 26 0 0 1 76 46 Z" fill="${hair}"/><rect x="27" y="40" width="46" height="7" fill="${hair}"/><path d="M60 41 L74 41 L70 50 Z" fill="${hair}"/>`
      + (c.isAdult ? '' : `<ellipse cx="24" cy="56" rx="6" ry="14" fill="${hair}"/><ellipse cx="76" cy="56" rx="6" ry="14" fill="${hair}"/>`);
  const bun = (c.id === 'paati' || c.id === 'lola') ? `<circle cx="50" cy="20" r="9" fill="${hair}"/>` : '';
  const glasses = (c.id === 'thatha' || c.id === 'lolo')
    ? `<g stroke="#14131a" stroke-width="1.8" fill="none"><circle cx="41" cy="52" r="6"/><circle cx="59" cy="52" r="6"/><line x1="47" y1="52" x2="53" y2="52"/></g>` : '';
  return `<svg viewBox="0 0 100 100" class="avatar" aria-hidden="true">
    <circle cx="50" cy="50" r="48" fill="#fff6e6"/>
    <path d="M18 100 Q20 76 50 74 Q80 76 82 100 Z" fill="${hex(c.body)}"/>
    <rect x="18" y="90" width="64" height="3" fill="${hex(c.accent)}" opacity=".7"/>
    ${bun}
    <circle cx="50" cy="50" r="26" fill="${SKIN}"/>
    ${hairTop}
    <circle cx="41" cy="52" r="2.8" fill="#14131a"/><circle cx="59" cy="52" r="2.8" fill="#14131a"/>
    <circle cx="42" cy="51" r="1" fill="#fff"/><circle cx="60" cy="51" r="1" fill="#fff"/>
    <circle cx="35" cy="59" r="3.2" fill="#ff7eb3" opacity=".5"/><circle cx="65" cy="59" r="3.2" fill="#ff7eb3" opacity=".5"/>
    <path d="M43 61 Q50 68 57 61" stroke="#14131a" stroke-width="2" fill="none" stroke-linecap="round"/>
    ${glasses}
  </svg>`;
}
