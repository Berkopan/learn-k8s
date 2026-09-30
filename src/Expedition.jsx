import React, {useEffect, useState} from 'react';
import {levels, modules} from './curriculum.js';
import {isUnlocked, moduleDone, xpTotal, streak} from './progress.js';
import {Icon} from './icons.jsx';
import {IconButton, ProgressBar} from './ui.jsx';
import {THEME_KEY, readTheme, writeTheme, normalizeTheme, resolveTheme} from './theme.js';

const pad = n => String(n).padStart(2, '0');
const stages = [
  {title:'Kıyıdan ayrıl', subtitle:'Container’dan ilk manifestine', range:'001 — 032', name:'TEMELLER'},
  {title:'Rotanı kur', subtitle:'Uygulamayı çalıştır, bağla, ölçekle', range:'033 — 064', name:'SİSTEMLER'},
  {title:'Derin sular', subtitle:'Sağlık, veri ve güvenlik', range:'065 — 096', name:'İŞLETİM'},
  {title:'Dümen sende', subtitle:'Arızaları çöz, platformu ayağa kaldır', range:'097 — 128', name:'SAHA'},
];
const moduleIcons = ['cube','compass','hexagon','file','grid','link','key','server','activity','database','shield','clock','search','anchor','layers','flag'];

export function Helm({size=40, className=''}) {
  return <svg className={`helm ${className}`} width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
    <path d="M20 3h24l17 17v24L44 61H20L3 44V20Z" stroke="currentColor"/>
    <circle cx="32" cy="32" r="18" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="32" cy="32" r="12" stroke="currentColor" strokeWidth=".6"/>
    {[0,45,90,135].map(angle=><path key={angle} d="M32 7v8m0 34v8" transform={`rotate(${angle} 32 32)`} stroke="currentColor" strokeWidth="1.5"/>)}
    <path d="m32 17 4 11 11 4-11 4-4 11-4-11-11-4 11-4Z" fill="currentColor"/>
    <circle cx="32" cy="32" r="3.5" className="helm-center"/>
  </svg>;
}
export function Insignia({module=0, size=46}) {
  return <span className="insignia" style={{'--sigil-size':`${size}px`}} aria-hidden="true"><Icon name={moduleIcons[module]} size={Math.round(size*.48)}/></span>;
}
export function useAppearance() {
  const [preference, setPreference] = useState(()=>{try{return readTheme(window.localStorage);}catch{return 'dark';}});
  useEffect(()=>{
    const media=window.matchMedia('(prefers-color-scheme: dark)');
    const apply=()=>{
      const theme=resolveTheme(preference,media.matches);
      document.documentElement.dataset.theme=theme;
      document.documentElement.style.colorScheme=theme;
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='dark'?'#101722':'#f3eee3');
    };
    apply(); media.addEventListener('change',apply);
    return ()=>media.removeEventListener('change',apply);
  },[preference]);
  useEffect(()=>{
    const sync=e=>{if(e.key===THEME_KEY)setPreference(normalizeTheme(e.newValue));};
    window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync);
  },[]);
  return [preference, value=>{
    const next=normalizeTheme(value);setPreference(next);
    try{writeTheme(window.localStorage,next);}catch{/* Keep the in-memory choice if persistence is unavailable. */}
  }];
}
export function ThemeSwitch({value,onChange}) {
  return <div className="theme-switch" role="group" aria-label="Görünüm teması">
    {[['light','sun','Aydınlık tema'],['dark','moon','Karanlık tema'],['system','monitor','Sistem teması']].map(([key,icon,label])=>
      <button type="button" key={key} aria-label={label} title={label} aria-pressed={value===key} onClick={()=>onChange(key)}><Icon name={icon} size={17}/></button>)}
  </div>;
}
export function ExpeditionShell({view,progress,onMap,onLab,onCourse,onModal,children}) {
  const [theme,setTheme]=useAppearance();
  return <>
    <a className="skip-link" href={view==='atlas'?'#atlas-content':'#lesson'}>İçeriğe geç</a>
    <header className="masthead"><div className="masthead-inner">
      <a className="brand" href="#map" onClick={e=>{e.preventDefault();onMap();}}><Helm/><span><strong>learn-k8s</strong><small>KÜME SEFERLERİ</small></span></a>
      <nav className="global-nav" aria-label="Ana gezinti">
        <button aria-current={view==='atlas'?'page':undefined} onClick={onMap}><Icon name="compass" size={16}/><span>Sefer haritası</span></button>
        <button aria-current={view==='lab'?'page':undefined} onClick={onLab}><Icon name="terminal" size={16}/><span>Laboratuvar</span></button>
        <button onClick={()=>onModal('glossary')}><Icon name="book" size={16}/><span>Sözlük</span></button>
        <button onClick={()=>onModal('badges')}><Icon name="trophy" size={16}/><span>Rozetler</span></button>
      </nav>
      <div className="masthead-tools">
        <span className="xp-counter"><Icon name="zap" size={15}/>{xpTotal(progress).toLocaleString('tr')} <small>XP</small></span>
        <IconButton icon="search" label="Seviye kataloğunu aç" onClick={()=>onCourse()}/>
        <ThemeSwitch value={theme} onChange={setTheme}/>
        <IconButton icon="settings" label="Ayarlar" onClick={()=>onModal('settings')}/>
      </div>
    </div></header>
    <main className={`main main-${view}`}>{children}</main>
    <footer className="site-footer"><span><Helm size={20}/>learn-k8s <i>/</i> Küme seferleri</span><p>Gerçek komutlar. Simüle bir dünya.</p><button onClick={()=>onModal('about')}>Simülasyonun sınırları <Icon name="external" size={13}/></button></footer>
  </>;
}
function Chart({progress}) {
  return <div className="atlas-chart" role="group" aria-label="Dört aşamalı öğrenme rotası">
    <svg className="chart-lines" viewBox="0 0 520 220" fill="none" aria-hidden="true">
      <path className="chart-grid" d="M0 44h520M0 88h520M0 132h520M0 176h520M52 0v220M104 0v220M156 0v220M208 0v220M260 0v220M312 0v220M364 0v220M416 0v220M468 0v220"/>
      <g className="chart-contours"><path d="m15 160 32-28 28 5 16-28 24-2 11 24 30 18-3 28-32 8-16 29-35-13-15-23-29 3Z"/><path d="m33 158 19-12 28 8 17-27 15 17 27 13-17 15-22 25-22-11-15-19Z"/><path d="m163 55 25-35 37-5 27 28 3 19 21 19-20 24-42 3-15-25-32-3Z"/><path d="m179 58 18-25 24-5 20 19-3 20 21 14-10 11-29 1-11-19-24-6Z"/><path d="m289 149 24-18 35 3 19-28 37 5 4 24 19 20-17 24-34 7-26-14-30 9-30-11Z"/><path d="m308 149 19-4 25 5 22-31 19 4-3 18 20 17-10 9-23 6-26-13-27 9Z"/><path d="m408 45 24-20 28 9 10 16 31 4 13 23-28 14-30-8-17 9-30-13Z"/></g>
      <path className="chart-route" d="M63 152C132 151 127 51 217 61S265 171 355 153s55-84 104-90"/>
      <g className="chart-soundings"><path d="M140 196h25m-20 4h20M295 34h30m-25 4h25M444 193h28m-20 4h20"/><path d="M20 24v20m-10-10h20M483 119v18m-9-9h18"/></g>
    </svg>
    {stages.map((stage,index)=>{
      const count=levels.filter(l=>Math.floor(l.module/4)===index&&progress.completed[l.id]).length;
      return <a key={stage.name} href={`#stage-${index}`} className={`chart-waypoint waypoint-${index} ${count===32?'charted':''}`} onClick={e=>{e.preventDefault();document.getElementById(`stage-${index}`)?.scrollIntoView({behavior:progress.settings.reduced||window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}} aria-label={`${stage.title}, ${count}/32 seviye`}><span>{count===32?<Icon name="check" size={17}/>:['I','II','III','IV'][index]}</span><small>{stage.name}</small></a>;
    })}
    <span className="chart-corner">KÜME SULARI</span><span className="chart-scale">16 BÖLÜM · 128 DURAK</span>
  </div>;
}
export function Atlas({progress,onGo,onCourse,onModal}) {
  const total=Object.keys(progress.completed).length;
  const next=levels.find(l=>!progress.completed[l.id])||levels.at(-1);
  const active=modules[next.module];
  const earned=modules.filter(m=>moduleDone(progress,m.id));
  const rank=total===128?'Küme kaptanı':total>=96?'Baş dümenci':total>=64?'Seyir ustası':total>=32?'Küme kaşifi':'Yeni mürettebat';
  return <div className="atlas" id="atlas-content" tabIndex={-1}>
    <section className="atlas-intro">
      <div className="intro-copy"><div className="overline"><span className="tiny-diamond"/> KUBERNETES İÇİN BİR ÖĞRENME SEFERİ</div><h1>Kümeyi tanı.<br/><em>Dümeni ele al.</em></h1><p>Önce mantığını kavra. Sonra komutunu yaz.<br className="desktop-break"/> Bir kümenin nasıl çalıştığını, değişimi izleyerek öğren.</p><div className="intro-spec"><span>128 laboratuvar</span><i/><span>16 bölüm</span><i/><span>Sıfır kurulum</span></div></div>
      <Chart progress={progress}/>
    </section>
    <div className="journey-layout">
      <section className="resume-panel" aria-labelledby="resume-title">
        <div className="panel-corners" aria-hidden="true"/>
        <div className="resume-topline"><span className="overline">{total===128?'SEFER TAMAMLANDI':total?'KALDIĞIN YERDEN':'İLK DURAK'}</span><span className="mono">{String(next.id).padStart(3,'0')} / 128</span></div>
        <div className="resume-main"><Insignia module={next.module} size={66}/><div><span className="resume-chapter">BÖLÜM {pad(next.module+1)} <span>/</span> {active.title}</span><h2 id="resume-title">{total===128?'Rotanın tamamı artık tanıdık.':next.title}</h2><p>{total===128?'Bir bölümü yeniden ziyaret et veya saha görevlerinde kendini sına.':active.subtitle}</p></div></div>
        <div className="resume-bottom"><div className="mini-route" role="group" aria-label="Sıradaki bölümün seviyeleri">{levels.filter(l=>l.module===next.module).map(l=><button key={l.id} disabled={!isUnlocked(progress,l.id)} aria-label={`Seviye ${l.id}: ${l.title}`} aria-current={l.id===next.id?'step':undefined} className={`${progress.completed[l.id]?'done':''} ${l.id===next.id?'current':''}`} onClick={()=>onGo(l.id)}>{progress.completed[l.id]?<Icon name="check" size={14}/>:pad((l.id-1)%8+1)}</button>)}</div><button className="button primary resume-action" onClick={()=>onGo(next.id)}>{total===128?'Finali yeniden oyna':total?'Devam et':'Sefere başla'}<Icon name="arrow" size={17}/></button></div>
      </section>
      <aside className="logbook" aria-labelledby="logbook-title"><div className="logbook-title"><h2 id="logbook-title">Seyir defteri</h2><span>No. 001</span></div><div className="navigator"><Helm size={42}/><div><small>ÖĞRENME RÜTBESİ</small><strong>{rank}</strong></div></div><div className="logbook-progress"><span>{total} / 128 durak</span><b>%{Math.round(total/128*100)}</b></div><ProgressBar value={total} max={128} label="Kurs ilerlemesi"/><div className="logbook-stats"><span><Icon name="zap" size={15}/><b>{xpTotal(progress).toLocaleString('tr')}</b> XP</span><span><Icon name="flame" size={15}/><b>{streak(progress)}</b> günlük seri</span></div><button className="logbook-badges" onClick={()=>onModal('badges')}><Icon name="trophy" size={16}/>{earned.length} / 16 rozet<Icon name="chevron" size={14}/></button></aside>
    </div>
    <section className="route-catalogue" aria-labelledby="route-title"><div className="route-heading"><div><span className="overline">BÜTÜN YOLCULUK</span><h2 id="route-title">Sefer rotası</h2></div><button className="catalogue-search" onClick={()=>onCourse()}><Icon name="search" size={17}/><span>Bir konu bul</span><kbd>⌘ K</kbd></button></div>
      {stages.map((stage,stageIndex)=><section className="stage" key={stage.name} id={`stage-${stageIndex}`} aria-labelledby={`stage-title-${stageIndex}`}><div className="stage-heading"><span className="stage-numeral">{['I','II','III','IV'][stageIndex]}</span><div><h3 id={`stage-title-${stageIndex}`}>{stage.title}</h3><p>{stage.subtitle}</p></div><span className="stage-range">{stage.range}</span></div><div className="module-grid">{modules.slice(stageIndex*4,stageIndex*4+4).map(m=>{
        const count=levels.filter(l=>l.module===m.id&&progress.completed[l.id]).length;
        const current=m.id===next.module,locked=!isUnlocked(progress,m.id*8+1),done=count===8;
        return <button type="button" key={m.id} className={`module-card ${current?'is-current':''} ${locked?'is-locked':''} ${done?'is-done':''}`} onClick={()=>onCourse(m.id)} aria-label={`${m.id+1}. ${m.title}, ${count}/8 seviye${locked?', kilitli':''}; seviyeleri incele`}><div className="module-card-top"><span className="module-index">BÖLÜM {pad(m.id+1)}</span><span className="module-card-status">{done?<><Icon name="check" size={12}/>TAMAMLANDI</>:current?'SIRADAKİ':locked?<><Icon name="lock" size={12}/>KİLİTLİ</>:'AÇIK'}</span></div><Insignia module={m.id}/><h4>{m.title}</h4><p>{m.subtitle}</p><div className="module-card-bottom"><div className="chapter-ticks" aria-hidden="true">{Array.from({length:8},(_,i)=><i key={i} className={progress.completed[m.id*8+i+1]?'done':''}/>)}</div><span>{count}/8<Icon name="arrow" size={15}/></span></div></button>;
      })}</div></section>)}
    </section>
    <div className="atlas-footnote"><Icon name="info" size={17}/><p>Bu rota tamamen tarayıcında çalışır. Komutlar bir simülasyonu değiştirir; gerçek bir kümeye bağlanmaz. İlerlemen bu cihazda saklanır.</p><button onClick={()=>onModal('settings')}>Kaydını yönet <Icon name="arrow" size={15}/></button></div>
  </div>;
}
