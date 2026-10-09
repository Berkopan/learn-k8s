# Architecture and teaching contract

## Layers

`src/curriculum/core.js` holds the course schema and reusable fixture factories. `src/curriculum/01.js` through `16.js` register eight deliberately authored lessons each. `src/curriculum.js` imports them in pedagogical order. A level contains a concept, mechanism, real-world caution, task list, initial resources, optional manifests and official documentation source. Explicit immutable keys identify lessons independently of the displayed order; the original ordinal mapping is retained for migration and translated guides.

`src/model.js` builds serializable Kubernetes-like resources. `src/simulator-core.js` owns tokenization, model validation, scheduling, controller reconciliation, resource queries and traffic checks. `src/engine.js` executes supported commands against that core and emits teaching traces. Neither module uses a DOM, fetch, shell, eval, WebSocket or a Kubernetes runtime. The pure engine runs under Node's built-in test runner.

`run(state, command)` returns `{state, output, error, event}`. A rejected command does not partially change cluster objects. This transactional error model is intentionally safer and simpler than multi-resource real kubectl operations. Events represent successful observations or mutations; output strings are not the source of truth for goals.

`src/learning.js` owns `evaluateTask` and `advanceSession`. The UI latches **one current task per successful command** with evidence belonging to that task. Observations include identity, namespace and semantic HTTP request fields, so unrelated exec output and stale checks do not count. An incident also verifies its explicit final conditions; earlier transient goals are not all rechecked. `goalMet` remains a compatibility helper for model tests, not the UI progression entry point. See [the assessment contract](LEARNING.md).

`src/progress.js` owns the v2 local learning record. Completions, notes, bookmarks and the active lesson use immutable keys. Valid v1 records migrate using the original published mapping; the v1 backup remains available if a new record becomes corrupt. XP is derived from the curriculum and first-completion set. Every later successful practice updates its date, assistance record and activity day without adding XP. The review queue prioritizes lessons never completed without help, then those last practiced at least seven days ago. Imports whitelist known fields and bound notes and counters.

`src/session.js` stores the **last active lab** separately under `learn-k8s:session:v1`: resources, parsed files, per-file text drafts, current task evidence, command history and the unfinished terminal command. In-memory sessions also preserve other labs visited within the open tab. The same validator governs save and load, with a 2 MB UTF-8 cap; a failed save keeps the previous valid record and produces a visible warning. The progress JSON export intentionally excludes this session snapshot. A session schema change must preserve or explicitly invalidate existing records, rather than attach a saved state to an incompatible lesson.

`App.jsx` coordinates route, lesson, tasks, progress and dialogs. `PracticeTools.jsx` presents optional predictions, review suggestions, three reproducible independent incidents and the real-cluster package links. Challenge URLs include the source lesson, kind and seed; progress stays attached to the source lesson while each variant has its own session key. `Lab.jsx` renders the cluster, timeline, terminal, YAML workbench and object inspector. The topology reflects the current calculated state; the timeline replays the events explaining that transition, not an actual distributed-time simulation. Commands remain usable while the explanatory animation plays. `workbench.js` computes contextual completion, serializable YAML drafts, before/after differences and resource diagnostics. Pending-Pod explanations use the same pure `schedulingChecks` calculation as the scheduler.

## Accessibility and interaction

Radix Dialog supplies focus trapping, dismissal, labels and focus restoration; Radix Tabs supplies keyboard tab navigation. Controls have labels, the terminal has a real input, output is text (never HTML), status announcements are bounded, and reduced-motion preferences are honored. Sound is optional and off by default. Terminal Tab cycles supported context-aware candidates only when a completion exists; Shift+Tab and Escape retain their normal exit behavior. Unsupported flags are not suggested.

Course search uses Ctrl/Command+K. Terminal history uses up/down arrows; Ctrl+L clears visible history. YAML accepts Ctrl/Command+Enter for save, not apply. Mobile layout stacks the learning and lab areas, offers a collapsible topology and keeps the active task beside the terminal tools. Resource differences and diagnostic details remain collapsed until requested.

## Testing

- All 128 canonical scenarios replay in Turkish and English, including explicit saved-YAML edits. Independent incidents add multiple reproducible seeds and adversarial final-state cases.
- Regression tests cover parsing, namespace ownership, reconciliation, readiness, quantities, HPA, Service target ports, RBAC, NetworkPolicy, quotas, PDB and retained PV state.
- Progress/session tests cover v1 migration, immutable identity, duplicate XP, independent practice, review priority, malformed records, storage limits, drafts and reloads.
- Browser tests use the production build, complete the guided curriculum, inspect topology and diagnostics, repair YAML, reload guided/independent sessions, exercise keyboard completion, check responsive overflow and capture accessibility evidence.
- Download package tests parse the real YAML, check shell syntax, exercise namespace ownership refusal with a fake kubectl, and verify deterministic ZIP contents. These checks do not claim live-cluster execution; the included verify scripts perform that check when a learner runs a package. See [the package index](../public/labs/README.md).

No source code is generated at runtime. Curriculum modules are plain code/data and can be reviewed independently. Keep the simulator contract narrower than the real API rather than silently claiming unsupported semantics.
