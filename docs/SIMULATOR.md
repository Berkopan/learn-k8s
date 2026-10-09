# Simulator scope

This is a teaching model, not a conformant Kubernetes implementation. Every command stays inside the browser. The source of truth is a cloned plain-JavaScript state. Real-world details are explicitly noted in lessons.

| Area | Modeled | Important limits |
|---|---|---|
| Discovery | get/describe, selected explain fields, aliases, namespace, labels, YAML/JSON/wide | Synthetic server, nodes and events; `get all` is only a conventional subset |
| Docker | pull, images, run, ps, tag, logs, inspect, stop, rm | No layers, filesystem, process, registry network or image signature verification |
| Pod | scheduling, image/config/PVC failures, simplified probes and init | Known teaching image-name patterns represent pull failure; no arbitrary application execution |
| Deployment | desired replicas, replacement, revision history, image update, undo | New replacement set is created at once; maxSurge/maxUnavailable and rollout timing are not implemented |
| StatefulSet | stable ordinals and replica changes | No OrderedReady behavior, partitioned updates or volumeClaimTemplates controller |
| DaemonSet | one example Pod per teaching worker | No real node admission or complete eligibility behavior |
| Scheduling | two 2 CPU / 2 GiB nodes, requests, balanced placement, nodeSelector, NoSchedule taints/tolerations, cordon | Not the real scheduler score framework; no affinity, preemption or NoExecute eviction |
| Resources | CPU/memory quantities, request≤limit checks, numeric Pod quota | CPU throttling, OOM, LimitRange admission, memory pressure and quota scope selectors are not simulated |
| Service | label selection, ready EndpointSlices, cluster DNS names, targetPort check, local forward | No sockets or real iptables/IPVS/eBPF; example containers are assumed to listen on their declared teaching port |
| ConfigMap / Secret | creation, envFrom, base64 storage, decoded environment snapshot, rollout refresh | No projected-volume refresh; no encryption, credentials or API tokens |
| Storage | PVC/class match, mock provisioning, PV binding and Retain/Released state, Pod PVC dependency | No disks or stored file content, resizing, actual CSI, reclaim deletion, topology or WaitForFirstConsumer |
| RBAC | namespaced Role/RoleBinding, ServiceAccount subjects, can-i; --as for get/describe/delete | No full authentication, groups, ClusterRole aggregation, API groups, resourceNames or subresource rules |
| Job / CronJob | finite job template, active workers, completion, schedule/policy declarations, manual Job from CronJob | lab tick completes the teaching job; no cron clock, retry/backoff engine, deadline scheduler or exact-once guarantee |
| HPA | CPU request utilization ratio, ceiling, min/max and missing-request failure | No metrics scraping, stabilization, tolerance, readiness windows or custom/external metrics |
| PDB / maintenance | numeric minAvailable check for drain; controlled Pod recreation | No complete eviction API or unhealthy eviction policy; direct delete is not blocked by PDB |
| NetworkPolicy | selected Pod ingress isolation, union of allowed rules, pod/namespace selectors and numeric ports | No egress, IPBlock, matchExpressions, actual CNI or packet filtering; source-less lab request cannot model every host path |
| Ingress / TLS | API object, host/path/backend/TLS references | No controller, DNS, certificate validation, HTTPS or Gateway API execution |
| Helm | one fixed `./chart` teaching release with Deployment/Service, replicaCount, history, rollback, uninstall | Not a template engine; no arbitrary chart, hooks, dependency download, cluster-wide release storage or chart plugins |

## Operational restrictions

Commands are single invocations. Pipes, redirection, command chaining, arbitrary shells and external network requests are rejected. Flags are checked against the supported command, so a recognized option is never silently accepted for an unrelated operation. The parser is intentionally not a full shell or kubectl argument parser; some otherwise valid real syntax must be adapted to the documented subset.

`kubectl run`, `create`, `apply` and `delete` support `--dry-run=client|server|none`. Client and server previews both use the local model's validation and never persist resources, run controllers, or count as completed mutation tasks. They do not emulate real API discovery, admission webhooks, field ownership or the differences between client-side and server-side validation. Other commands reject dry-run instead of ignoring it. YAML and JSON output are supported for these four operations, including previews.

The educational maximum is 12 replicas, not a Kubernetes maximum. A level can have at most 25 editable lab YAML files and each editor document is bounded at 200 KB. The terminal bounds command size, visible transcript and command history. These limits keep accidental input from freezing the visual workbench; they are not a security sandbox for untrusted real-cluster artifacts.

`lab load N` changes a synthetic metric. `lab tick` advances modeled init/Job/HPA behavior, not wall-clock time. `lab request SERVICE` demonstrates one in-cluster HTTP path; it does not send traffic to any remote service. Synthetic Pod `status.ready` and `status.reason` are visualization fields, not real Kubernetes Pod API fields.

Readiness, liveness and startup probe declarations are shown, but only explicit teaching success/failure cases are calculated. A liveness failure has a synthetic restart counter advanced with logical steps; no real periodSeconds/failureThreshold timer runs.

A successful command is not proof a real application would be healthy. Use this workbench to learn what to inspect, then validate behavior in a disposable real cluster with the matching upstream docs.
