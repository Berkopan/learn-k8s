/** Appearance is independent of the versioned learning record. */
export const THEME_KEY = 'learn-k8s:theme:v1';
export const THEMES = ['dark', 'light'];
export const normalizeTheme = value => THEMES.includes(value) ? value : null;
export const resolveTheme = (preference, systemDark) =>
  normalizeTheme(preference) ?? (systemDark ? 'dark' : 'light');
export function readTheme(storage) {
  try { return normalizeTheme(storage?.getItem(THEME_KEY)); } catch { return null; }
}
export function writeTheme(storage, preference) {
  const next = normalizeTheme(preference);
  if (!next) return false;
  try { storage?.setItem(THEME_KEY, next); return !!storage; } catch { return false; }
}
