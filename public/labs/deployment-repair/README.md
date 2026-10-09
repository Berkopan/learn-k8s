# Deployment repair

[Türkçe](README.tr.md)

Repair an image reference, then verify that two real Pods serve HTTP through a Service. This package runs against the Kubernetes context selected by your local `kubectl`.

## Start

Use a disposable learning cluster with a Ready worker node and permission to create namespaces. You need `kubectl`, a POSIX shell, and image-pull access for the course examples `nginx:1.27` and `busybox:1.37`. The package requires no Ingress or external load balancer.

```sh
kubectl config current-context
./start.sh
```

The script creates `learn-k8s-deployment-repair`, labeled for this lab. If that name already belongs to something else, the script stops. Running it again resets the lab's named resources and removes your previous repair. `cleanup.sh` can be repeated safely.

`namespace.yaml` creates the namespace. `starter.yaml` contains a Deployment, Service and client Pod. The web image tag deliberately contains `learner-typo`; the client should become Ready while the web Pods cannot pull their image.

## Investigate and repair

```sh
kubectl -n learn-k8s-deployment-repair get pods
kubectl -n learn-k8s-deployment-repair describe pods -l app=web
kubectl -n learn-k8s-deployment-repair get deployment web -o yaml
```

Identify the failing image in the Pod events. Change the Deployment's container template so replacements use an available nginx image. The container is named `web`.

<details>
<summary>Example repair</summary>

```sh
kubectl -n learn-k8s-deployment-repair set image deployment/web web=nginx:1.27
kubectl -n learn-k8s-deployment-repair rollout status deployment/web --timeout=120s
```

</details>

## Verify and clean up

```sh
./verify.sh
./cleanup.sh
```

Verification waits for the rollout and client readiness, checks ready EndpointSlices, then runs `wget` from the client through `Service/web`. It inspects the resulting system, so editing and applying the Deployment YAML is also a valid solution. Cleanup deletes the entire dedicated namespace after checking its ownership label.

## From the simulator to a real cluster

| Simulator | This package |
|---|---|
| Immediate controller reconciliation | Controllers run asynchronously; wait for `rollout status`. |
| `lab request web` | `kubectl -n learn-k8s-deployment-repair exec client -- wget -T 10 -qO- http://web:80/` |
| Synthetic `status.ready` / `status.reason` | Inspect Pod conditions, container statuses and events. |

There is no real-cluster `lab tick` command. A pull error can also come from registry access, so inspect the event message rather than assuming every failure is the deliberate typo.

## Sources and validation

- [Kubernetes: Deployments and image updates](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
- [Kubernetes: performing a rolling update and diagnosing an unavailable image](https://kubernetes.io/docs/tutorials/kubernetes-basics/update/update-intro/)
- [Kubernetes: debugging Services and EndpointSlices](https://kubernetes.io/docs/tasks/debug/debug-application/debug-service/)

Repository checks parse these manifests, check shell syntax, test the namespace ownership guard with a fake `kubectl`, and verify reproducible archives. They do not constitute a live-cluster test. `verify.sh` performs the real checks when you run the package.
