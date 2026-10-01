import React, {useSyncExternalStore} from 'react';
import {getLanguage, setLanguage, subscribeLanguage, t} from './i18n.js';
import './styles/language.css';

export function useLanguage() {
  return useSyncExternalStore(subscribeLanguage, getLanguage, () => 'tr');
}
export function LanguageSwitch() {
  const language = useLanguage();
  return <label className="language-switch">
    <span className="sr-only">{t('Arayüz dili')}</span>
    <select value={language} onChange={event => setLanguage(event.target.value)} title={t('Dili değiştir')} aria-label={t('Arayüz dili')}>
      <option value="en" lang="en">EN</option>
      <option value="tr" lang="tr">TR</option>
    </select>
  </label>;
}
