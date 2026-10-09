import React, {useState} from 'react';
import {stringify} from 'yaml';
import {t} from './i18n.js';
import {Icon} from './icons.jsx';
import {Modal} from './ui.jsx';
import {isUnlocked, lessonId, reviewQueue} from './progress.js';

export const realClusterLabs = Object.freeze([
  {id:'deployment-repair',title:'Deployment onarımı',description:'Bozuk image referansını düzelt, rollout sonucunu doğrula.'},
  {id:'service-selector',title:'Service hedefleri',description:'Yanlış selector’ı bul ve istemciden HTTP erişimini geri getir.'},
  {id:'configmap-refresh',title:'ConfigMap yenileme',description:'Çalışan sürecin eski ayarı neden tuttuğunu gözle, yeni süreçte doğrula.'},
]);

export function PracticeCenter({open,onClose,progress,levels,challengeKinds,onReview,onAllReviews,onChallenge}) {
  const [seed,setSeed]=useState('1');
  const number=Number(seed), validSeed=/^\d+$/.test(seed)&&Number.isInteger(number)&&number>=0&&number<=2147483647;
  const queue=reviewQueue(progress).map(item=>levels.find(level=>level.key===item.key));
  return <Modal open={open} onOpenChange={value=>!value&&onClose()} title={t('Alıştırmalar')}
    description={t('Bir konuyu yeniden çalış, bağımsız bir arızayı çöz veya gerçek kümeye geç.')} wide>
    <div className="practice-center">
      <section aria-labelledby="review-heading">
        <h3 id="review-heading">{t('Tekrar zamanı')}</h3>
        <p>{t('Önce yardımla tamamladığın, sonra üzerinden en az yedi gün geçen lab’lar önerilir. XP yalnız ilk tamamlamada verilir.')}</p>
        {queue.length?<div className="review-list">{queue.map(level=><button key={level.key} onClick={()=>onReview(level.id)}>
          <span className="mono">{String(level.id).padStart(3,'0')}</span>
          <span><b>{level.title}</b><small>{progress.practice[level.key]?.lastIndependentSuccess?t('Bilgini tazele'):t('İpucu açmadan yeniden dene')}</small></span>
          <Icon name="arrow" size={15}/>
        </button>)}</div>:<p className="practice-empty">{t('Şimdilik tekrar önerisi yok. Tamamladığın lab’lar burada görünecek.')}</p>}
        <button className="text-button" onClick={onAllReviews}>{t('Bütün tekrar önerileri')}<Icon name="arrow" size={14}/></button>
      </section>
      <section aria-labelledby="challenge-heading">
        <h3 id="challenge-heading">{t('Bağımsız senaryolar')}</h3>
        <p>{t('Belirti ve hedef verilir; inceleme sırasını sen seçersin. Aynı senaryo numarası aynı başlangıcı üretir.')}</p>
        <label className="scenario-seed">{t('Senaryo numarası')}<input type="number" min="0" max="2147483647" step="1" value={seed} onChange={event=>setSeed(event.target.value)} aria-invalid={!validSeed}/></label>
        <div className="practice-grid">{challengeKinds.map(item=>{
          const unlocked=isUnlocked(progress,item.sourceKey);
          return <article key={item.kind}>
            <h4>{t(item.title)}</h4><p>{t('Lab {0} konularıyla bağımsız çalışma',[lessonId(item.sourceKey)])}</p>
            <button className="button secondary small" disabled={!validSeed||!unlocked} onClick={()=>onChallenge(item.kind,number)}>{unlocked?t('Senaryoyu başlat'):t('Ön koşullar bekleniyor')}<Icon name={unlocked?'arrow':'lock'} size={14}/></button>
          </article>;
        })}</div>
        {challengeKinds.some(item=>!isUnlocked(progress,item.sourceKey))&&<p className="dialog-footnote">{t('Saha lab’larına ilerle veya Ayarlar’dan serbest keşfi aç.')}</p>}
      </section>
      <section aria-labelledby="real-cluster-heading">
        <h3 id="real-cluster-heading">{t('Gerçek kümede dene')}</h3>
        <p>{t('Ayrı bir kind veya minikube kümesi için başlangıç YAML’i, görev, doğrulama ve temizlik komutları. Paketler Türkçe ve İngilizce yönergeler içerir.')}</p>
        <div className="practice-grid">{realClusterLabs.map(lab=><article key={lab.id}>
          <h4>{t(lab.title)}</h4><p>{t(lab.description)}</p>
          <a className="button secondary small" href={`${import.meta.env.BASE_URL}labs/${lab.id}.zip`} download><Icon name="download" size={14}/>{t('Paketi indir')}<span className="sr-only"> — {t(lab.title)}</span></a>
        </article>)}</div>
      </section>
    </div>
  </Modal>;
}

export function Prediction({prediction,choice,onChoice}) {
  if(!prediction)return null;
  return <details className="prediction-check">
    <summary><Icon name="hint" size={15}/>{t('Önce tahmin et · isteğe bağlı')}</summary>
    <div className="prediction-content"><h3>{prediction.question}</h3>
      <div className="prediction-options" role="group" aria-label={prediction.question}>{prediction.options.map((option,index)=>
        <button key={index} aria-pressed={choice===index} className={choice===index?(choice===prediction.answer?'correct':'incorrect'):''} onClick={()=>onChoice(index)}>{option}</button>
      )}</div>
      {Number.isInteger(choice)&&<p role="status"><b>{choice===prediction.answer?t('Doğru. '):t('Bir daha düşün. ')}</b>{prediction.explanation}</p>}
    </div>
  </details>;
}

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
