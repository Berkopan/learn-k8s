# Contributing a useful lab

A lesson should teach one new distinction and ask the learner to observe its consequence. A realistic failure plus a narrow repair is usually more valuable than repeating an unrelated create command.

1. Add or revise the relevant file under `src/curriculum/`. Preserve sequential IDs and update progression validation when expanding the curriculum.
2. Write original `concept`, `mechanism`, and `caution` text. Link the most specific official Kubernetes, Docker or Helm page. Explicitly label simulation shortcuts.
3. Give the lesson its own isolated seed and virtual YAML files. Use only dummy credentials. Do not depend on a previous lesson's in-memory cluster.
4. Define each task with a readable request, a reference command, a hint and a state/event goal. Prefer `R` for actual resource state; use `E` when the learning objective is an observation. Do not compare command strings.
5. Run `npm test`, then build and run browser tests. Add regression cases for every new engine behavior and for nearby failure paths.

Never add eval, a real shell, credential collection, cloud calls, analytics or a hidden backend to make a simulation appear real. Reject unsupported behavior honestly. A new controller or policy feature must update `docs/SIMULATOR.md`.

## UI changes

Retain readable contrast, focus indication, reduced motion, touch targets and mobile overflow checks. Prefer Radix primitives where they solve focus or keyboard interaction. Do not replace semantic buttons/inputs with clickable divs or animate information that becomes inaccessible when motion is disabled.

## Reproducibility

Use Node 22.12+. Resolve dependencies with npm, commit the generated lockfile, and use the lock in CI. Do not manually author integrity hashes. Browser screenshots and accessibility reports are evidence to inspect, not a substitute for testing the learning tasks.
