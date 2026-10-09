import {levels, LEGACY_ID_TO_KEY} from '../curriculum.js';

const predictions = {
  [LEGACY_ID_TO_KEY[37]]: {
    answer: 1,
    tr: {
      question: 'Deployment’ın iki Pod’unu silersen ne bekliyorsun?',
      options: ['Aynı Pod nesneleri aynı kimliklerle geri açılır.', 'Controller, yeni kimlikli iki Pod üretir.', 'Deployment’ın replica hedefi otomatik sıfıra iner.'],
      explanation: 'Deployment’ın iki replica hedefi kalır. Controller eksik örnekleri yeni Pod nesneleriyle tamamlar; silinen nesneler dirilmez.',
    },
    en: {
      question: 'What do you expect after deleting a Deployment’s two Pods?',
      options: ['The same Pod objects reopen with the same identities.', 'The controller creates two Pods with new identities.', 'The Deployment’s replica target automatically drops to zero.'],
      explanation: 'The Deployment still requests two replicas. Its controller replaces missing instances with new Pod objects; deleted objects do not return.',
    },
  },
  [LEGACY_ID_TO_KEY[56]]: {
    answer: 0,
    tr: {
      question: 'Yalnız ConfigMap’te MODE değişirse mevcut container’ların env değeri ne olur?',
      options: ['Başlangıçta aldıkları değer, yeniden başlatılana kadar kalır.', 'ConfigMap kaydedilir kaydedilmez yeni değere geçer.', 'MODE silinir; container’lar yapılandırma hatasına düşer.'],
      explanation: 'Environment başlangıç anlık görüntüsüdür. ConfigMap’in yeni değeri, bu senaryoda rollout restart ile oluşturulan yeni süreçlere geçer.',
    },
    en: {
      question: 'If only MODE in the ConfigMap changes, what happens to existing container environments?',
      options: ['They keep the value read at startup until restarted.', 'They change as soon as the ConfigMap is saved.', 'MODE disappears and the containers enter a configuration error.'],
      explanation: 'An environment is a startup snapshot. In this scenario, rollout restart creates new processes that read the changed ConfigMap value.',
    },
  },
  [LEGACY_ID_TO_KEY[66]]: {
    answer: 2,
    tr: {
      question: 'Readiness başarısız ama uygulama çalışıyor. Hangi sonucu bekliyorsun?',
      options: ['Container hemen yeniden başlar; Service hedefi olarak kalır.', 'Pod ve Deployment nesneleri kaldırılır.', 'Pod çalışmaya devam eder; hazır Service hedefleri arasına girmez.'],
      explanation: 'Readiness trafik uygunluğunu kontrol eder. Burada Running ile Ready ayrılır; başarısız readiness tek başına restart başlatmaz.',
    },
    en: {
      question: 'Readiness fails while the application is running. What do you expect?',
      options: ['The container immediately restarts and stays a Service target.', 'The Pod and Deployment objects are removed.', 'The Pod keeps running but is excluded from ready Service targets.'],
      explanation: 'Readiness checks traffic eligibility. Running and Ready are different; a readiness failure alone does not restart the container.',
    },
  },
};

export function predictionFor(levelOrKey, locale = 'tr') {
  if (levelOrKey?.challenge) return null;
  const key = typeof levelOrKey === 'object' ? levelOrKey.key
    : typeof levelOrKey === 'number' ? levels.find(level => level.id === levelOrKey)?.key : levelOrKey;
  const prediction = predictions[key];
  return prediction ? {key: `prediction.${key}`, answer: prediction.answer, ...structuredClone(prediction[locale === 'en' ? 'en' : 'tr'])} : null;
}
