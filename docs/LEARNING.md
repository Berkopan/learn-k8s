# Learning and assessment

## Lesson identity

Each `L` declaration has an explicit, immutable `key`, such as
`manifests.declarative-scaling`. The sequential `id` remains the displayed lesson
number. Do not generate keys from the current title or array position.

`src/curriculum/legacy.js` records the **published v1 ID → key** mapping. Never
regenerate that mapping when lessons are reordered. It allows the progress layer
to migrate old records without assigning achievements or notes to another lesson.
The original numeric `legacyId` also keeps existing lesson narratives and English
translations attached to the same content after a reorder.

New lessons need a new key. Keep an existing key when repairing or improving that
lesson; changing its wording does not create a different learning identity.

## Task evidence and completion

`advanceSession(level, session, result)` is the single progression entry point.
It accepts an engine command result and returns a progression patch; the UI owns
the transcript, drafts, persistence and rewards. Error/help results cannot advance
a task. Observations describe the latest successful command in the current task,
so an old rollout check cannot satisfy a later post-change verification.

Use semantic event fields rather than comparing command strings. HTTP goals match
the destination Service, namespace, port, source when required, and success status.
RBAC observations name the subject and namespace being checked. Equivalent
`curl`/`wget` requests can therefore satisfy the same objective.

The idempotence lesson explicitly marks its two-apply evidence with `scope:
'lesson'`; this deliberate repeated-action count spans its two tasks. Other event
goals must not opt into historical evidence merely to make a reference path pass.

An incident's `completionGoal` describes the final state in addition to its last
observation. It is not the union of every intermediate step: earlier transient
states can intentionally disappear. Final checks run against a clone when the
simulator would otherwise append a trace. Failed checks return localizable,
structured feedback without awarding progress.

## Writing YAML

Labs 27, 30 and 67 start with a definition the learner must edit and save: a Pod
template label, the replica count, and a readiness path. Their goals check both a
`fileResource` in the saved file and the live resource. Saving alone does not apply
the file; an imperative live change alone does not repair the saved source.

The `referenceFiles` field supplies the optional solution and test fixture.
`applyReferenceEdits` is a pure helper for unit reference solvers, not automatic
learner behavior. Browser replays use `applyReferenceFiles` to enter and save the
same content through the real editor before running the reference command.
