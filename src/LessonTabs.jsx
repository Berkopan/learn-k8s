import {t} from './i18n.js';
import React, {useRef, useState} from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import {localizedGuide} from './localize.js';
import {Icon} from './icons.jsx';

// Text-only inline code: never interpret lesson copy as HTML or executable Markdown.
function GuideText({text}) {
  return <p>{text.split(/(`[^`]+`)/g).map((part, index) =>
    part.startsWith('`') && part.endsWith('`')
      ? <code key={index}>{part.slice(1, -1)}</code>
      : <React.Fragment key={index}>{part}</React.Fragment>
  )}</p>;
}

// A level change remounts the card; a language change deliberately does not.
export function LessonTabs({level, done, children}) {
  const [tab, setTab] = useState('guide');
  const practiceTrigger = useRef(null);
  const guide = level.guide || localizedGuide(level);
  const total = level.steps.length;
  function startPractice() {
    setTab('practice');
    requestAnimationFrame(() => practiceTrigger.current?.focus({preventScroll: true}));
  }
  return <Tabs.Root className="lesson-card" value={tab} onValueChange={setTab}>
    <Tabs.List className="lesson-tab-list" aria-label={t('Ders görünümü')}>
      <Tabs.Trigger value="guide"><Icon name="book" size={15}/><span>{t('Görevi anla')}</span></Tabs.Trigger>
      <Tabs.Trigger value="practice" ref={practiceTrigger} aria-label={t('Şimdi uygula')}>
        <Icon name="flag" size={15}/><span>{t('Şimdi uygula')}</span>
        <span className={`lesson-tab-count ${done === total ? 'is-complete' : ''}`} aria-hidden="true">{done}/{total}</span>
      </Tabs.Trigger>
    </Tabs.List>
    {/* Preserve each panel's reading position and prevent duplicate focus targets. */}
    <Tabs.Content value="guide" forceMount hidden={tab !== 'guide'} className="lesson-tab-panel guide-panel">
      <article className="lesson-guide" aria-labelledby={`guide-title-${level.id}`}>
        <header className="guide-title">
          <span className="eyebrow">{t('ÖNCE FİKRİ KUR')}</span>
          <h2 id={`guide-title-${level.id}`}>{level.title}</h2>
        </header>
        <section className="guide-section" data-guide-section="why">
          <h3>{t('Neden buna ihtiyaç var?')}</h3>
          <GuideText text={guide.why}/>
        </section>
        <section className="guide-section" data-guide-section="how">
          <h3>{t('Nasıl çalışır?')}</h3>
          <GuideText text={guide.how}/>
        </section>
        <section className="guide-section guide-practice" data-guide-section="practice">
          <h3>{t('Bu seviyede ne yapacaksın?')}</h3>
          <GuideText text={guide.practice}/>
        </section>
        <footer className="guide-footer">
          <a className="source-link" href={level.source} target="_blank" rel="noopener noreferrer">{t('Resmî dokümanda devam et')}<Icon name="external" size={13}/></a>
          <button type="button" className="button secondary small" onClick={startPractice}>{t('Uygulamaya geç')}<Icon name="arrow" size={14}/></button>
        </footer>
      </article>
    </Tabs.Content>
    <Tabs.Content value="practice" forceMount hidden={tab !== 'practice'} className="lesson-tab-panel practice-panel">
      {children}
    </Tabs.Content>
  </Tabs.Root>;
}
