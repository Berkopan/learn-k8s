import React from 'react';
import {stringify} from 'yaml';
import {t} from './i18n.js';
import {Icon} from './icons.jsx';

/** Reference edits stay explicit: showing a solution never changes the learner's files. */
export function ReferenceSolution({step, onCommand}) {
  const commands = step.solutionCommands || [step.command];
  return <div className="solution-box">
    <span>{t('Komutu anlamını düşünerek çalıştır.')}</span>
    {Object.entries(step.referenceFiles || {}).map(([filename, documents]) =>
      <div className="reference-file" key={filename}>
        <b>{filename}</b>
        <p>{t('Dosyalar sekmesinde bu YAML’i düzenle ve kaydet; sonra komutu çalıştır.')}</p>
        <pre><code>{documents.map(document => stringify(document)).join('---\n')}</code></pre>
      </div>
    )}
    {commands.filter(Boolean).map((command, index) => <div className="reference-command" key={index}>
      <code>{command}</code>
      <button onClick={() => onCommand(command)}>{t('Terminale yerleştir')}<Icon name="arrow" size={13}/></button>
    </div>)}
  </div>;
}
