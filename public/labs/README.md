# Real Kubernetes labs

Each ZIP is a self-contained exercise with English and Turkish instructions, actual Kubernetes manifests, an idempotent reset script, verification and namespace cleanup.

| Archive | Exercise | Dedicated namespace |
|---|---|---|
| [deployment-repair.zip](deployment-repair.zip) | Repair an image reference and verify real HTTP service | `learn-k8s-deployment-repair` |
| [service-selector.zip](service-selector.zip) | Connect a Service to healthy Pods through correct labels | `learn-k8s-service-selector` |
| [configmap-refresh.zip](configmap-refresh.zip) | Observe environment snapshots, then refresh containers | `learn-k8s-configmap-refresh` |

These packages use the learner's local `kubectl` context. The website does not connect to a cluster. Start with a disposable learning cluster and follow the README inside the archive.

## Rebuild the downloads

From the repository root, using its supported Node.js version:

```sh
node scripts/package-labs.mjs
node scripts/package-labs.mjs --check
```

The generator uses sorted entries, fixed ZIP timestamps, fixed executable permissions and stored compression. The same source bytes produce identical archives without an extra archiver dependency. Source edits must be followed by regeneration; `npm test` detects outdated archives.

## Validation boundary

Repository checks parse YAML, enforce namespace scoping and the intended starter faults, run shell syntax checks, exercise the namespace ownership guard with a fake `kubectl`, and check archive reproducibility. They do not run against an actual Kubernetes cluster.

A future optional CI smoke job can create a disposable kind cluster, run each `start.sh`, apply the documented repair, call `verify.sh`, then `cleanup.sh`, and destroy the cluster in an always-run cleanup step. That needs container runtime and registry access; it is separate from the current static checks.
