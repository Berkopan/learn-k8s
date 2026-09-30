/** Appearance is independent of the versioned learning record. */
export const THEME_KEY = 'learn-k8s:theme:v1';
export const THEMES = ['dark', 'light', 'system'];
export const normalizeTheme = value => THEMES.includes(value) ? value : 'dark';
export const resolveTheme = (preference, systemDark) =>
  normalizeTheme(preference) === 'system' ? (systemDark ? 'dark' : 'light') : normalizeTheme(preference);
export function readTheme(storage) {
  try { return normalizeTheme(storage?.getItem(THEME_KEY)); } catch { return 'dark'; }
}
export function writeTheme(storage, preference) {
  try { storage?.setItem(THEME_KEY, normalizeTheme(preference)); return !!storage; } catch { return false; }
}
