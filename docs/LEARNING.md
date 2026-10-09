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
