import diagnostics from './locales/en/engine.js';
import extra from './locales/en/extra.js';
import {getLanguage, translate} from './i18n.js';
import {helpText} from './command-help.js';

// Canonical model state/history remains language-independent. This adapter is
// only for the model's generated prose, not arbitrary DOM text or resource data.
const messages = {...diagnostics, ...extra};
const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const templates = Object.keys(messages).filter(key => /\{\d+\}/.test(key)).map(key => {
  const indices = [];
  let previous = 0, pattern = '^';
  for (const match of key.matchAll(/\{(\d+)\}/g)) {
    pattern += escape(key.slice(previous, match.index)) + '([\\s\\S]*?)';
    indices.push(Number(match[1]));
    previous = match.index + match[0].length;
  }
  return {key, indices, regex: new RegExp(pattern + escape(key.slice(previous)) + '$')};
});
export function runtimeText(value, locale = getLanguage()) {
  const text = String(value ?? '');
  if (locale !== 'en') return text;
  if (Object.hasOwn(messages, text)) return translate(text, [], locale);
  for (const {key, indices, regex} of templates) {
    const match = text.match(regex);
    if (!match) continue;
    const values = [];
    indices.forEach((index, offset) => { values[index] = match[offset + 1]; });
    return translate(key, values, locale);
  }
  return text;
}
export function terminalOutput(entry, locale = getLanguage()) {
  if (!entry) return '';
  const text = String(entry.output ?? '');
  if (entry.event?.action === 'help') return helpText(entry.event.topic || '', locale);
  if (locale !== 'en') return text;
  if (entry.error) return runtimeText(text, locale);
  const event = entry.event;
  // Files, JSON/YAML, environment variables, hostnames and user-provided values
  // are deliberately never translated. They remain suitable for copy/paste.
  if (event?.action === 'cat' || event?.action === 'exec' || event?.action === 'docker inspect') return text;
  if (event?.action === 'describe') {
    return text.replace(/\nEvents: ([^\n]*)/g, (_, message) => `\nEvents: ${runtimeText(message, locale)}`);
  }
  if (event?.output === 'yaml' || event?.output === 'json') return text;
  if (event?.kind === 'Event') {
    return text.split('\n').map(line => {
      const split = line.indexOf('\t');
      return split < 0 ? line : line.slice(0, split + 1) + runtimeText(line.slice(split + 1), locale);
    }).join('\n');
  }
  if (event?.action === 'logs') {
    // Only this simulator-generated error prefix is prose; normal log bytes stay intact.
    return text.startsWith('ERROR: ') ? 'ERROR: ' + runtimeText(text.slice(7), locale) : runtimeText(text, locale);
  }
  const whole = runtimeText(text, locale);
  if (whole !== text) return whole;
  return text.split('\n').map(line => runtimeText(line, locale)).join('\n');
}
