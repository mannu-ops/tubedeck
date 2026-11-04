/**
 * Lightweight i18n framework.
 *
 * - Stores the chosen language in localStorage (default: 'en').
 * - Sets `document.documentElement.lang` accordingly.
 * - Provides `t(key)` for UI strings. Missing keys fall back to English, so
 *   applying `t()` to any string is safe and never breaks rendering.
 *
 * Full translation of every in-app string is incremental: you can wrap any
 * string with `t('...')` and add the translation below. Fallback is English.
 */

export const LANGUAGES = {
  en: { label: 'English', dir: 'ltr' },
  hi: { label: 'हिन्दी', dir: 'ltr' },
  es: { label: 'Español', dir: 'ltr' },
};

const DICTIONARY = {
  en: {
    'app.title': 'TubeDeck — YouTube Video, Shorts & Playlist Downloader',
    'nav.blog': 'BLOG',
    'nav.queue': 'Queue',
    'nav.history': 'History',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'nav.privacy': 'Privacy',
    'nav.terms': 'Terms',
    'cta.fetch': 'FETCH INFO',
    'cta.download': 'DOWNLOAD',
    'cta.zip': 'DOWNLOAD AS ZIP',
    'input.placeholder': 'Paste a YouTube link…',
    'toast.offline': 'Backend offline — running in simulated preview mode.',
  },
  hi: {
    'app.title': 'TubeDeck — YouTube वीडियो, Shorts और Playlist डाउनलोडर',
    'nav.blog': 'ब्लॉग',
    'nav.queue': 'कतार',
    'nav.history': 'इतिहास',
    'nav.about': 'हमारे बारे में',
    'nav.contact': 'संपर्क',
    'nav.privacy': 'गोपनीयता',
    'nav.terms': 'शर्तें',
    'cta.fetch': 'जानकारी लें',
    'cta.download': 'डाउनलोड करें',
    'cta.zip': 'ZIP के रूप में डाउनलोड करें',
    'input.placeholder': 'YouTube लिंक पेस्ट करें…',
    'toast.offline': 'बैकएंड ऑफ़लाइन — सिम्युलेटेड मोड।',
  },
  es: {
    'app.title': 'TubeDeck — Descargador de videos, Shorts y listas de YouTube',
    'nav.blog': 'BLOG',
    'nav.queue': 'Cola',
    'nav.history': 'Historial',
    'nav.about': 'Acerca de',
    'nav.contact': 'Contacto',
    'nav.privacy': 'Privacidad',
    'nav.terms': 'Términos',
    'cta.fetch': 'OBTENER INFO',
    'cta.download': 'DESCARGAR',
    'cta.zip': 'DESCARGAR COMO ZIP',
    'input.placeholder': 'Pega un enlace de YouTube…',
    'toast.offline': 'Backend sin conexión: modo de simulación.',
  },
};

const KEY = 'tubedeck_lang';

export function getCurrentLang() {
  const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
  if (saved && LANGUAGES[saved]) return saved;
  const nav = (typeof navigator !== 'undefined' && navigator.language || 'en').slice(0, 2).toLowerCase();
  return LANGUAGES[nav] ? nav : 'en';
}

export function setLang(lang) {
  if (!LANGUAGES[lang]) lang = 'en';
  if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, lang);
  applyLang(lang);
  return lang;
}

export function applyLang(lang) {
  const l = LANGUAGES[lang] ? lang : 'en';
  document.documentElement.setAttribute('lang', l);
  document.documentElement.setAttribute('dir', LANGUAGES[l].dir);
}

export function t(key, lang = getCurrentLang()) {
  const dict = DICTIONARY[lang] || DICTIONARY.en;
  return dict[key] ?? DICTIONARY.en[key] ?? key;
}

/** Dispatches a tiny event so the app can re-render after a language switch. */
export function initI18n() {
  const lang = setLang(getCurrentLang());
  document.dispatchEvent(new CustomEvent('tubedeck:lang', { detail: { lang } }));
  return { lang, t };
}
