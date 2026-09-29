# Architecture and teaching contract

## Layers

`src/curriculum/core.js` holds the course schema and reusable fixture factories. `src/curriculum/01.js` through `16.js` register eight deliberately authored lessons each. `src/curriculum.js` imports them in pedagogical order. A level contains a concept, mechanism, real-world caution, task list, initial resources, optional manifests and official documentation source.

`src/model.js` builds serializable Kubernetes-like resources. `src/simulator-core.js` owns tokenization, model validation, scheduling, controller reconciliation, resource queries and traffic checks. `src/engine.js` executes supported commands against that core, emits teaching traces and evaluates task goals. Neither module has a DOM, fetch, shell, eval, WebSocket or runtime dependency. The pure engine runs under Node's built-in test runner.

`run(state, command)` returns `{state, output, error, event}`. A rejected command does not partially change cluster objects. This transactional error model is intentionally safer and simpler than multi-resource real kubectl operations. Events represent successful observations or mutations; output strings are not the source of truth for goals.

`goalMet(state, goal)` supports resource subsets, absence, counts, state predicates, successful observation events, Docker objects and conjunctions. The UI latches **one current task per successful command**. A later deletion does not erase credit for an earlier creation task. Completing a level does not require matching its solution string exactly.

`src/progress.js` owns the versioned local learning record. XP is derived from the fixed curriculum and completion set, never imported as a trusted number. Replays do not grant duplicate XP. Imports whitelist known fields, constrain IDs and bound notes. Session resources, files and terminal history are not persisted; notes and completed levels are.

`App.jsx` coordinates route, lesson, tasks, progress and dialogs. `Lab.jsx` renders the cluster, timeline, terminal, YAML workbench and object inspector. The topology reflects the current calculated state; the timeline replays the events explaining that transition, not an actual distributed-time simulation. Commands remain usable while the explanatory animation plays.

## Accessibility and interaction

Radix Dialog supplies focus trapping, dismissal, labels and focus restoration; Radix Tabs supplies keyboard tab navigation. Controls have labels, the terminal has a real input, output is text (never HTML), status announcements are bounded, and reduced-motion preferences are honored. Sound is optional and off by default. Terminal Tab completes only when a completion exists; Shift+Tab exits normally.

Course search uses Ctrl/Command+K. Terminal history uses up/down arrows; Ctrl+L clears visible history. YAML accepts Ctrl/Command+Enter for save, not apply. Mobile layout moves the course rail into a dismissible drawer and stacks the learning and lab areas.

## Testing

- 128 independent scenario replays validate every reference solution and its state/event goal.
- Regression tests cover parsing, namespace ownership, reconciliation, readiness, quantities, HPA, Service target ports, RBAC, NetworkPolicy, quotas, PDB and retained PV state.
- Progress tests cover idempotent XP, guided unlocks, imports, storage failures and daily streaks.
- Browser tests use the production build, complete the guided curriculum, inspect topology, repair YAML, check responsive overflow and capture accessibility evidence.

No source code is generated at runtime. Curriculum modules are plain code/data and can be reviewed independently. Keep the simulator contract narrower than the real API rather than silently claiming unsupported semantics.
