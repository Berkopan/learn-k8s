import diagnostics from './locales/en/engine.js';
import extra from './locales/en/extra.js';
import {getLanguage, translate} from './i18n.js';
import {helpText} from './command-help.js';

// Translate only recognized model prose, never arbitrary DOM nodes or data values.
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
const proseActions = new Set(['lab load','lab tick','docker tag','config use-context','explain','port-forward','helm rollback']);
export function terminalOutput(entry, locale = getLanguage()) {
  if (!entry) return '';
  const text = String(entry.output ?? '');
  const event = entry.event;
  if (event?.action === 'help') return helpText(event.topic || '', locale);
  if (locale !== 'en') return text;
  if (entry.error) return runtimeText(text, locale);
  if (!event) return text; // Command history and old raw entries are user data.
  if (event.kind === 'Event') {
    return text.split('\n').map(line => {
      const split = line.indexOf('\t');
      return split < 0 ? line : line.slice(0, split + 1) + runtimeText(line.slice(split + 1), locale);
    }).join('\n');
  }
  if (event.output === 'yaml' || event.output === 'json') return text;
  if (event.action === 'describe' && event.kind === 'Pod') {
    // describe's appended model diagnostic is not part of the resource YAML.
    return text.replace(/\nEvents: ([^\n]*)(?=\n---\n|$)/g,
      (_, message) => `\nEvents: ${runtimeText(message, locale)}`);
  }
  if (event.action === 'logs') {
    return text.startsWith('ERROR: ') ? 'ERROR: ' + runtimeText(text.slice(7), locale) : runtimeText(text, locale);
  }
  if (event.action === 'diff') {
    return text.split('\n').map(line => line.startsWith('= ') ? runtimeText(line, locale) : line).join('\n');
  }
  if (proseActions.has(event.action)) return runtimeText(text, locale);
  // cat, exec, dry-run, inspect, object tables and container/image names stay exact.
  return text;
}
