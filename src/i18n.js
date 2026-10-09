import ui from './locales/en/ui.js';
import engine from './locales/en/engine.js';
import hints from './locales/en/hints.js';
import extra from './locales/en/extra.js';
import learningImprovements from './locales/en/learning-improvements.js';
import workbenchImprovements from './locales/en/workbench-improvements.js';
import practiceImprovements from './locales/en/practice-improvements.js';
import engineImprovements from './locales/en/engine-improvements.js';

export const LANGUAGE_KEY = 'learn-k8s:language:v1';
export const SUPPORTED_LANGUAGES = Object.freeze(['tr', 'en']);
export const englishMessages = Object.freeze({...ui, ...engine, ...hints, ...extra, ...engineImprovements, ...learningImprovements, ...workbenchImprovements, ...practiceImprovements});
// Node-based model tests retain the source language. The browser initializes
// its saved/navigator preference before React mounts.
let language = 'tr';
const listeners = new Set();
let storageListenerInstalled = false;

export function resolveLanguage(saved, browserLanguages = []) {
  if (SUPPORTED_LANGUAGES.includes(saved)) return saved;
  for (const tag of browserLanguages) {
    const base = String(tag).toLowerCase().split(/[-_]/)[0];
    if (SUPPORTED_LANGUAGES.includes(base)) return base;
  }
  return 'en';
}
export const getLanguage = () => language;
export function subscribeLanguage(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function setLanguage(next, {persist = true} = {}) {
  if (!SUPPORTED_LANGUAGES.includes(next)) return false;
  if (persist && typeof window !== 'undefined') {
    try { window.localStorage.setItem(LANGUAGE_KEY, next); } catch { /* The in-memory choice still works. */ }
  }
  if (typeof document !== 'undefined') document.documentElement.lang = next;
  if (language !== next) {
    language = next;
    for (const notify of listeners) notify();
  }
  return true;
}
export function initializeLanguage() {
  if (typeof window === 'undefined') return language;
  let saved;
  try { saved = window.localStorage.getItem(LANGUAGE_KEY); } catch { /* Storage may be denied. */ }
  const browserLanguages = () => window.navigator.languages || [window.navigator.language];
  setLanguage(resolveLanguage(saved, browserLanguages()), {persist: false});
  if (!storageListenerInstalled) {
    window.addEventListener('storage', event => {
      if (event.key !== LANGUAGE_KEY && event.key !== null) return;
      setLanguage(resolveLanguage(event.newValue, browserLanguages()), {persist: false});
    });
    storageListenerInstalled = true;
  }
  return language;
}
export function translate(message, values = [], locale = language) {
  const source = String(message ?? '');
  let translated = locale === 'en' && Object.hasOwn(englishMessages, source)
    ? englishMessages[source] : source;
  if (Array.isArray(translated)) translated = translated[Number(values[0]) === 1 ? 0 : 1];
  // A single pass means interpolated names/braces are never parsed again.
  // React renders the result as text; no HTML or Markdown execution occurs.
  return translated.replace(/\{(\d+)\}/g, (placeholder, index) =>
    Object.hasOwn(values, index) ? String(values[index]) : placeholder);
}
export const t = translate;
export const formatNumber = value => Number(value).toLocaleString(language === 'tr' ? 'tr-TR' : 'en-US');
export const searchText = value => String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i').toLowerCase();
