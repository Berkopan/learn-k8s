# Service selector repair

[Türkçe](README.tr.md)

The web Pods are healthy, but a Service selects the wrong labels. Follow the path from Pod labels to EndpointSlices to an actual HTTP request.

## Start

Use a disposable learning cluster selected in your local kubeconfig. You need `kubectl`, a POSIX shell, permission to create namespaces, and image-pull access for `nginx:1.27` and `busybox:1.37`.

```sh
kubectl config current-context
./start.sh
```

The script creates `learn-k8s-service-selector`, then applies the Deployment, Service and client Pod from `starter.yaml`. It waits for both the web rollout and client readiness. It refuses to reuse a namespace that does not carry this lab's ownership label. Running it again resets the exercise; cleanup can also be repeated.

## Investigate

```sh
kubectl -n learn-k8s-service-selector get pods --show-labels
kubectl -n learn-k8s-service-selector get service web -o yaml
kubectl -n learn-k8s-service-selector get endpointslices -l kubernetes.io/service-name=web -o yaml
kubectl -n learn-k8s-service-selector exec client -- wget -T 5 -qO- http://web:80/
```

The final command should fail before the repair. Depending on the cluster network, the connection may be refused or time out. Compare the Service's selector with the labels on the healthy Pods. A Ready Pod alone does not guarantee that this Service can reach it.

## Repair and verify

Correct the selector and inspect the EndpointSlices again.

<details>
<summary>Example repair</summary>

```sh
kubectl -n learn-k8s-service-selector patch service web --type=merge -p '{"spec":{"selector":{"app":"web"}}}'
```

You can instead change `spec.selector.app` in `starter.yaml` and apply that file. Run `kubectl apply -f starter.yaml`, not `start.sh`, to preserve your edit without resetting the lab.

</details>

```sh
./verify.sh
./cleanup.sh
```

`verify.sh` checks the rollout, ready Service endpoints and a real in-cluster HTTP response. Cleanup checks the namespace label before deleting the entire dedicated namespace.

## From the simulator to a real cluster

| Simulator | This package |
|---|---|
| `lab request web` | `kubectl -n learn-k8s-service-selector exec client -- wget -T 10 -qO- http://web:80/` |
| Instant endpoint update | The EndpointSlice controller reconciles asynchronously; inspect again if it has not caught up. |
| A modeled `503` for no endpoints | The actual symptom depends on Service networking and the client. |

No external DNS, Ingress or load balancer is involved. The client resolves `web` inside the same namespace, and the Service forwards to the selected containers' named `http` port.

## Sources and validation

- [Kubernetes: Services, selectors and ports](https://kubernetes.io/docs/concepts/services-networking/service/)
- [Kubernetes: debugging a Service through EndpointSlices](https://kubernetes.io/docs/tasks/debug/debug-application/debug-service/)

Repository checks cover manifest structure, shell syntax, namespace ownership guards with a fake `kubectl`, and archive reproducibility. These checks have not executed this package in a live cluster. Run `verify.sh` for the actual cluster result.
