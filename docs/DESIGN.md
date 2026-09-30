# Interface direction: Kubernetes Expeditions

## Design brief (before implementation)

The learning engine and 128 lessons already work. The original cream-and-green
workbench does not have a strong identity: too many similar rounded panels,
small low-emphasis labels, and no distinct place to understand the whole journey.
This redesign changes the information architecture, not just the accent color.

Reference: [Boot.dev](https://www.boot.dev/) and its
[course catalogue](https://www.boot.dev/courses). The useful reference is a
coherent learning world, visible progression, and an exercise-first workspace.
Do not reproduce its illustrations, characters, branding, text, or exact layout.

## Identity

**Kubernetes Expeditions / Küme Seferleri.** Kubernetes' helm becomes a compass
for a journey from container fundamentals to cluster operations. The interface
is an atlas and a navigator's logbook, not a generic SaaS dashboard or a fantasy
skin pasted over technical content. All lessons keep their existing technical
names and explanations. Visual metaphors must not replace technical labels.

- A small original compass/helm mark; four route landmarks; module insignia.
- Restrained brass rules, inset borders, numbered waypoints and chapter headings.
- Slightly squared panels, with small-radius controls and clear selected states.
- No gradient text, glowing blobs, glassmorphism, stock mascot, repeated statistic
  cards, decorative fake charts, or gratuitous perpetual motion.

## Palette

| Role | Night watch (dark) | Day watch (light) |
| --- | --- | --- |
| Canvas | `#101722` | `#f3eee3` |
| Primary surface | `#182231` | `#fffcf5` |
| Recessed surface | `#121b29` | `#e9e2d4` |
| Raised surface | `#202d3e` | `#fffef9` |
| Primary text | `#ece7db` | `#202a36` |
| Secondary text | `#a9b5c6` | `#596575` |
| Brass/copper text | `#e5b66f` | `#875322` |
| Primary action fill | `#e5b66f` | `#875322` |
| Primary action text | `#182231` | `#fffaf0` |
| Success | `#8dccb1` | `#24694f` |
| Error | `#f0a2a2` | `#a63236` |
| Information | `#9abfe4` | `#2c5e88` |

Use semantic CSS variables for surfaces, text, borders, focus, states, terminal,
editor, diagrams and overlays. Light is a designed daylight palette, not an
inverted dark theme. Terminal and editor participate in both palettes. Color is
never the only indication of status. Check the actual rendered contrast.

## Typography and spacing

- Georgia / native serif for editorial titles and chapter names.
- System sans-serif for prose, controls and resource labels; native monospace for
  commands and small operational counters. No external font service is needed.
- Main prose 15–16 px; comfortable 1.7 line height; small metadata at least 12 px.
- An 8 px spacing rhythm, modest 4–8 px radii, consistent thin rules.
- Long Turkish headings and resource names wrap instead of forcing overflow.

## Information architecture

### Sefer haritası (home)

A bounded editorial introduction and original route illustration establish the
identity. A prominent resume panel shows the current lesson and its chapter's
eight waypoints. A navigator's logbook shows real progress, earned insignia, XP
and streak. Sixteen modules are grouped into four stages of four modules, each
with its own subject-related insignia and honest locked/completed state.

The main action is to start/resume learning. Module cards open the existing
searchable lesson catalogue; locked lessons can be previewed without awarding
progress. No account, leaderboard, fake ranking or new backend.

### Laboratuvar (exercise)

Keep the atlas out of the exercise's way. A compact global header, breadcrumb,
lesson title and eight connected waypoints frame the workbench. The left column
is the lesson's reading and task journal. The wider right column is the simulated
cluster, event trace and terminal/editor. Bound the graph's vertical growth and
keep command entry close to the visualization. Resource detail dialogs and all
existing helpers remain available.

### Completion

A brass seal, exact earned XP, lesson title and next action. Module rewards have
a distinct insignia. Replaying a lesson does not create another reward. Preserve
optional quizzes and the ability to continue experimenting.

## Theme behavior

Always-visible light, dark and system controls with accessible names and pressed
states. Default to dark for a first visit. Save the explicit choice separately
from curriculum progress. Apply it before first paint; system mode follows OS
changes. A theme change must not reset a lab, terminal history, editor draft,
notes or XP. A blocked localStorage must not prevent use of either theme.

## Responsive and accessibility requirements

Desktop: bounded home layout and a two-column exercise workbench. Tablet: reduce
margins before collapsing. Phone: one reading/working flow, wrapping waypoints,
scrollable code output only, touch-sized controls, no page-level horizontal
scroll. Keep the theme control reachable without opening a menu.

Use semantic headings, landmarks, real buttons, visible keyboard focus, named
icon controls, reduced-motion support, and existing Radix dialog focus behavior.
Original SVG landmarks are decorative; their actions have HTML labels.

## Verification plan

1. Preserve all engine, curriculum, progress and 128-level browser regressions.
2. Test atlas → lesson → atlas, module filters, bookmarks, notes and rewards.
3. Test both themes, persistence, system changes and blocked storage.
4. Check theme switching while typing a command and editing unsaved YAML.
5. Run axe (including contrast) on atlas, populated lab and dialogs in both
   palettes; inspect desktop and phone screenshots of both palettes.
6. Build the actual Vite bundle and inspect it; do not judge a mockup alone.

## Boundaries

This is a frontend redesign, not a curriculum rewrite. No simulation semantics,
existing progress schema or deployment destination should change. Use existing
React and Radix primitives; the visual system is custom, not a new theme package.
