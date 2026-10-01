import {levels as sourceLevels, modules as sourceModules} from './curriculum.js';
import {commandClue, syntaxClue} from './curriculum/core.js';
import {guides} from './curriculum/guides/index.js';
import {glossary as sourceGlossary, quizzes as sourceQuizzes, cheats as sourceCheats} from './reference.js';
import first from './locales/en/lessons-01-04.js';
import second from './locales/en/lessons-05-08.js';
import third from './locales/en/lessons-09-12.js';
import fourth from './locales/en/lessons-13-16.js';
import {modules as englishModules, glossaryDefinitions, quizzes as englishQuizzes} from './locales/en/reference.js';
import {getLanguage, translate} from './i18n.js';
import {dockerCheats} from './command-help.js';

export const englishLessons = Object.freeze({...first, ...second, ...third, ...fourth});
const en = (message, values) => translate(message, values, 'en');
const caches = new Map();
function goalHint(goal) {
  switch (goal?.type) {
    case 'event': return ' This step requires an observation; changing an object alone is not enough.';
    case 'resource': return ` Verify the expected state on ${goal.kind}/${goal.name}.`;
    case 'absent': return ` Verify that ${goal.kind}/${goal.name} is no longer present.`;
    case 'count': return ` Check the resulting ${goal.kind} count.`;
    case 'all': return ' Several conditions must hold together; do not stop at an acceptance message.';
    case 'dockerImage': return ' The result belongs in the image inventory, not the running-container list.';
    case 'dockerContainer': return ' Observe the instance’s lifecycle and resulting state.';
    case 'dockerAbsent': return ' The container record should be gone; its image has a separate lifetime.';
    case 'state': return ' Verify the simulated state with the relevant observation.';
    default: return '';
  }
}
export function localizedCurriculum(locale = getLanguage()) {
  if (locale !== 'en') return {levels: sourceLevels, modules: sourceModules};
  if (caches.has('curriculum')) return caches.get('curriculum');
  const modules = sourceModules.map((module, index) => ({
    ...module,
    title: englishModules[index][0],
    subtitle: englishModules[index][1],
    badge: englishModules[index][2],
    syntax: index === 15 ? 'Observe → form a hypothesis → correct → verify' : module.syntax,
  }));
  const levels = sourceLevels.map(level => {
    const translated = englishLessons[level.id];
    if (!translated || translated.steps.length !== level.steps.length) {
      throw new Error(`Incomplete English lesson ${level.id}`);
    }
    return {...level, title: translated.title, concept: translated.why,
      mechanism: translated.how, caution: translated.caution,
      difficulty: en(level.difficulty),
      steps: level.steps.map((step, index) => ({...step,
        text: translated.steps[index],
        hint: level.id === 1 ? en(step.hint)
          : `${translated.title} · Step ${index + 1}: ${en(commandClue(step.command))}${goalHint(step.goal)}`,
        syntaxHint: en(syntaxClue(step.command)),
      })),
    };
  });
  const result = {levels, modules};
  caches.set('curriculum', result);
  return result;
}
export function localizedGuide(id, locale = getLanguage()) {
  return locale === 'en' ? englishLessons[id] : guides[id];
}
export function localizedReference(locale = getLanguage()) {
  const english = locale === 'en';
  return {
    glossary: english ? sourceGlossary.map((item, index) => ({...item,
      term: index === 7 ? 'Tag and digest' : item.term,
      definition: glossaryDefinitions[index],
    })) : sourceGlossary,
    quizzes: english ? sourceQuizzes.map((item, index) => ({...item,
      question: englishQuizzes[index][0], options: englishQuizzes[index][1],
      explanation: englishQuizzes[index][2],
    })) : sourceQuizzes,
    cheats: [dockerCheats(locale), ...sourceCheats.map(([title, commands]) =>
      [translate(title, [], locale), commands])],
  };
}
