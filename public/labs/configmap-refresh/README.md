# ConfigMap environment refresh

[Türkçe](README.tr.md)

Observe the difference between updating a ConfigMap and replacing the containers that consumed it as environment variables.

## Start

Use a disposable learning cluster selected in your kubeconfig. You need `kubectl`, a POSIX shell, permission to create namespaces and image-pull access for `nginx:1.27`.

```sh
kubectl config current-context
./start.sh
```

The script creates `learn-k8s-configmap-refresh`, applies `settings` with `MODE=production`, and waits for two web replicas. The namespace carries this lab's ownership label; the scripts refuse to modify a same-named namespace owned by something else. Re-running `start.sh` resets the experiment and its Pods. Cleanup can be repeated.

The Deployment uses YAML `envFrom`. nginx does not interpret `MODE`; the variable is an observable example of the container's startup environment.

## Change the configuration, then observe

```sh
kubectl -n learn-k8s-configmap-refresh exec deployment/web -c web -- printenv MODE
kubectl apply -f settings-maintenance.yaml
kubectl -n learn-k8s-configmap-refresh get configmap settings -o yaml
kubectl -n learn-k8s-configmap-refresh exec deployment/web -c web -- printenv MODE
```

The ConfigMap now says `maintenance`, while the existing container still prints `production`. Changing the object does not rewrite a running process's environment. A container created for another reason would read the new value.

## Refresh the containers

```sh
kubectl -n learn-k8s-configmap-refresh rollout restart deployment/web
kubectl -n learn-k8s-configmap-refresh rollout status deployment/web --timeout=120s
./verify.sh
```

Verification checks that the ConfigMap is `maintenance`, waits for the rollout, and reads `MODE` from every current web Pod. Terminating Pods from the old rollout are excluded. The check fails if the ConfigMap changed but current containers still carry the old value.

```sh
./cleanup.sh
```

Cleanup checks the ownership label and deletes the entire dedicated namespace.

## From the simulator to a real cluster

| Simulator | This package |
|---|---|
| Environment snapshot in model state | `kubectl exec … -- printenv MODE` reads the actual container environment. |
| Immediate replacement during rollout | `rollout status` waits for asynchronous controllers and readiness. |
| `lab tick` | There is no equivalent command; real processes and controllers advance with time. |

`envFrom` imports all keys at startup. The separate command `kubectl set env --from=configmap/NAME` enumerates keys into individual `env[].valueFrom.configMapKeyRef` entries; it does not create `envFrom`. This lab uses the YAML form so you can inspect that distinction directly.

## Sources and validation

- [Kubernetes: updating environment variables via ConfigMap and rollout](https://kubernetes.io/docs/tutorials/configuration/updating-configuration-via-a-configmap/)
- [Kubernetes: ConfigMap consumption and environment snapshots](https://kubernetes.io/docs/concepts/configuration/configmap/)
- [kubectl implementation: set env creates individual key references](https://github.com/kubernetes/kubectl/blob/master/pkg/cmd/set/set_env.go)

Repository checks parse the manifests, check shell syntax, exercise ownership guards with a fake `kubectl`, and verify reproducible archives. They do not run a live-cluster experiment. `verify.sh` validates the behavior when you run this package.
