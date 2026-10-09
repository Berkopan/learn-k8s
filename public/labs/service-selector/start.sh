#!/bin/sh
set -eu
LAB_DIR=$(CDPATH='' cd -P "$(dirname "$0")" && pwd)
. "$LAB_DIR/lab.sh"
check_namespace allow-missing
kubectl apply -f "$LAB_DIR/namespace.yaml"
# Reset only the named resources in this lab's dedicated namespace.
kubectl -n "$LAB_NAMESPACE" delete -f "$LAB_DIR/starter.yaml" --ignore-not-found=true --wait=true --timeout=120s
kubectl -n "$LAB_NAMESPACE" apply -f "$LAB_DIR/starter.yaml"
kubectl -n "$LAB_NAMESPACE" rollout status deployment/web --timeout=120s
kubectl -n "$LAB_NAMESPACE" wait --for=condition=Ready pod/client --timeout=120s
printf "Lab ready in namespace %s. Follow README.md or README.tr.md.\n" "$LAB_NAMESPACE"
