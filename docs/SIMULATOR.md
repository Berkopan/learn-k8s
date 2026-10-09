# Simulator scope

This is a teaching model, not a conformant Kubernetes implementation. Every command stays inside the browser. The source of truth is a cloned plain-JavaScript state. Real-world details are explicitly noted in lessons.

| Area | Modeled | Important limits |
|---|---|---|
| Discovery | get/describe, selected explain fields, aliases, namespace, labels, YAML/JSON/wide | Synthetic server, nodes and events; `get all` is only a conventional subset |
| Docker | pull, images, run, ps, tag, logs, inspect, stop, rm | No layers, filesystem, process, registry network or image signature verification |
| Pod | scheduling, image/config/PVC failures, startup environment snapshots, simplified probes and init | Known teaching image-name patterns represent pull failure; never-started image/config failures remain Pending; no arbitrary application execution |
| Deployment | desired replicas, replacement, revision history, image update, undo | New replacement set is created at once; maxSurge/maxUnavailable and rollout timing are not implemented |
| StatefulSet | stable ordinals and replica changes | No OrderedReady behavior, partitioned updates or volumeClaimTemplates controller |
| DaemonSet | one example Pod per teaching worker | No real node admission or complete eligibility behavior |
| Scheduling | two 2 CPU / 2 GiB nodes, requests, balanced placement, nodeSelector, NoSchedule taints/tolerations, cordon; pure `schedulingChecks` explains the same checks used for placement | Not the real scheduler score framework; no affinity, preemption or NoExecute eviction |
| Resources | CPU/memory quantities, request≤limit checks, numeric Pod quota | CPU throttling, OOM, LimitRange admission, memory pressure and quota scope selectors are not simulated |
| Service | label selection, ready EndpointSlices, cluster DNS names, targetPort check, local forward | No sockets or real iptables/IPVS/eBPF; example containers are assumed to listen on their declared teaching port |
| ConfigMap / Secret | creation, envFrom, individual configMapKeyRef/secretKeyRef, base64 storage, per-container environment snapshots, rollout refresh | No projected-volume refresh; no encryption, credentials or API tokens; exec uses the first container |
| Storage | PVC/class match, mock provisioning, PV binding and Retain/Released state, Pod PVC dependency | No disks or stored file content, resizing, actual CSI, reclaim deletion, topology or WaitForFirstConsumer |
| RBAC | namespaced Role/RoleBinding, ServiceAccount subjects, can-i; --as for get/describe/delete | No full authentication, groups, ClusterRole aggregation, API groups, resourceNames or subresource rules |
| Job / CronJob | finite job template, actual active workers, successful completion counts, batches bounded by parallelism and remaining completions, schedule/policy declarations, manual Job from CronJob | Each lab tick completes already running teaching workers; blocked or newly initialized workers do not finish; no cron clock, retry/backoff engine, deadline scheduler or exact-once guarantee |
| HPA | CPU request utilization ratio, ceiling, min/max and missing-request failure | No metrics scraping, stabilization, tolerance, readiness windows or custom/external metrics |
| PDB / maintenance | numeric minAvailable check against affected drain candidates; controlled Pod recreation; retained DaemonSet Pods do not spend budget | No complete eviction API or unhealthy eviction policy; direct delete is not blocked by PDB |
| NetworkPolicy | selected Pod ingress isolation, union of allowed rules, pod/namespace selectors and numeric ports; empty inner from/ports lists match all | No egress, IPBlock, matchExpressions, actual CNI or packet filtering; source-less lab request cannot model every host path |
| Ingress / TLS | API object, host/path/backend/TLS references | No controller, DNS, certificate validation, HTTPS or Gateway API execution |
| Helm | one fixed `./chart` teaching release with Deployment/Service, replicaCount, history, rollback, uninstall | Not a template engine; no arbitrary chart, hooks, dependency download, cluster-wide release storage or chart plugins |

## Operational restrictions

Commands are single invocations. Pipes, redirection, command chaining, arbitrary shells and external network requests are rejected. Flags are checked against the supported command, so a recognized option is never silently accepted for an unrelated operation. The parser is intentionally not a full shell or kubectl argument parser; some otherwise valid real syntax must be adapted to the documented subset.

`kubectl run`, `create`, `apply` and `delete` support `--dry-run=client|server|none`. Client and server previews both use the local model's validation and never persist resources, run controllers, or count as completed mutation tasks. They do not emulate real API discovery, admission webhooks, field ownership or the differences between client-side and server-side validation. Other commands reject dry-run instead of ignoring it. YAML and JSON output are supported for these four operations, including previews.

The educational maximum is 12 replicas, not a Kubernetes maximum. A level can have at most 25 editable lab YAML files and each editor document is bounded at 200 KB. The terminal bounds command size, visible transcript and command history. These limits keep accidental input from freezing the visual workbench; they are not a security sandbox for untrusted real-cluster artifacts.

`lab load N` changes a synthetic metric. `lab tick` advances modeled init/Job/HPA behavior, not wall-clock time. `lab request SERVICE` demonstrates one in-cluster HTTP path; it does not send traffic to any remote service. Synthetic Pod `status.ready` and `status.reason` are visualization fields, not real Kubernetes Pod API fields.

Successful `lab request`, container `wget`/`curl`, and local forwarded `curl` commands retain their normal events and add `request: {service, namespace, port, source, status: 200}`. The namespace and port identify the destination Service; source is the client Pod name or null. Failed requests add no success event. Task evaluation can compare these observations without requiring one exact command spelling. The exported `traffic` helper still returns output text; `trafficResult` also returns the normalized observation. Both append a trace to the supplied state, so read-only evaluators should pass a clone.

Readiness, liveness and startup probe declarations are shown, but only explicit teaching success/failure cases are calculated. A liveness failure has a synthetic restart counter advanced with logical steps; no real periodSeconds/failureThreshold timer runs.

`kubectl set env --from=configmap/NAME` and `--from=secret/NAME` enumerate existing keys into individual `env[].valueFrom` references, as kubectl does, while preserving unrelated `env` entries and `envFrom` sources. YAML `envFrom` remains a separate operation that imports all keys when a container starts. Configuration updates or deletion do not alter an already running container's environment; a newly started container resolves its references again, and missing required objects or keys block startup.

A Job's Complete condition is derived from successful workers, not the passage of a tick. For example, parallelism 2 and completions 4 requires two healthy worker batches. A tick may finish an init step or a running worker; it cannot skip an image, scheduling, configuration, storage or quota blocker. Readiness is not a Job completion requirement. Completed workers remain Succeeded and their successes stay counted if their Pod records are later deleted. This models finite teaching work, not arbitrary commands or exit codes.

A successful command is not proof a real application would be healthy. Use this workbench to learn what to inspect, then validate behavior in a disposable real cluster with the matching upstream docs.
