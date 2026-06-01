import EN from './en.js';
import NO from './no.js';

const LANG_KEY = 'archery-maya.lang';
let _lang = 'en';

export function detectLanguage() {
  const saved = localStorage.getItem(LANG_KEY);
  if (saved === 'en' || saved === 'no') return saved;
  const nav = (navigator.language || '').toLowerCase();
  return (nav.startsWith('nb') || nav.startsWith('nn') || nav.startsWith('no')) ? 'no' : 'en';
}

export function init() {
  _lang = detectLanguage();
}

export function setLanguage(lang) {
  _lang = lang;
  localStorage.setItem(LANG_KEY, lang);
}

export function getCurrentLang() {
  return _lang;
}

export function t(key, vars = {}) {
  const map = _lang === 'no' ? NO : EN;
  const str = map[key] ?? EN[key] ?? key;
  return str.replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : `{{${k}}}`));
}
