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

## Validation scope

Repository checks parse YAML, enforce namespace scoping and the intended starter faults, run shell syntax checks, exercise the namespace ownership guard with a fake `kubectl`, and check archive reproducibility. These static checks do not require a cluster.

The separate [Real cluster labs workflow](https://github.com/Berkopan/learn-k8s/actions/workflows/real-cluster-labs.yml) is configured for pull requests, pushes to `main`, and manual runs. Its single job creates a fresh kind v0.31.0 / Kubernetes v1.35.0 cluster on a GitHub-hosted Ubuntu runner, extracts these ZIPs, and exercises each package's `start.sh` → failing initial `verify.sh` → documented repair → successful `verify.sh` → `cleanup.sh` sequence. The ConfigMap case also checks that the original Pod and container identities retain `MODE=production` after the ConfigMap changes, and that the new containers read `maintenance` after rollout.

The workflow uses a dedicated kubeconfig and a digest-pinned node image, then deletes its cluster in an always-run cleanup step. It uploads command logs, plus cluster diagnostics on failure. `scripts/smoke-real-labs.sh` refuses a normal local invocation; learners use the standalone package scripts with their chosen learning cluster.

A successful workflow run for a specific commit is the live-cluster result for that revision. Adding this workflow or passing the static checks alone does not establish a live pass. This one-version smoke test covers the included exercises, not every Kubernetes distribution or configuration.

Pinned tool sources: [kind v0.31.0 release and image digests](https://github.com/kubernetes-sigs/kind/releases/tag/v0.31.0), [official binary asset checksums](https://api.github.com/repos/kubernetes-sigs/kind/releases/tags/v0.31.0), [kubectl binary verification](https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/).
