#!/bin/sh
set -eu
LAB_DIR=$(CDPATH='' cd -P "$(dirname "$0")" && pwd)
. "$LAB_DIR/lab.sh"
check_namespace
kubectl -n "$LAB_NAMESPACE" rollout status deployment/web --timeout=120s
kubectl -n "$LAB_NAMESPACE" wait --for=condition=Ready pod/client --timeout=120s
LAB_READY_ENDPOINTS=$(kubectl -n "$LAB_NAMESPACE" get endpointslices -l kubernetes.io/service-name=web -o 'jsonpath={range .items[*].endpoints[*]}{.conditions.ready}{"\n"}{end}')
case "$LAB_READY_ENDPOINTS" in
  *true*) ;;
  *) printf '%s\n' 'Service/web has no ready endpoint. Inspect its selector and Pod readiness.' >&2; exit 1 ;;
esac
kubectl -n "$LAB_NAMESPACE" exec client -- wget -T 10 -qO- http://web:80/ >/dev/null
printf '%s\n' 'Verified: rollout ready, Service has ready endpoints, and the in-cluster HTTP request succeeded.'
