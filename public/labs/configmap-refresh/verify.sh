#!/bin/sh
set -eu
LAB_DIR=$(CDPATH='' cd -P "$(dirname "$0")" && pwd)
. "$LAB_DIR/lab.sh"
check_namespace
kubectl -n "$LAB_NAMESPACE" rollout status deployment/web --timeout=120s
LAB_MODE=$(kubectl -n "$LAB_NAMESPACE" get configmap settings -o 'jsonpath={.data.MODE}')
if [ "$LAB_MODE" != 'maintenance' ]; then
  printf '%s\n' 'ConfigMap settings must contain MODE=maintenance. Apply settings-maintenance.yaml.' >&2
  exit 1
fi
# Ignore terminating Pods from the previous rollout; inspect every current Pod.
LAB_PODS=$(kubectl -n "$LAB_NAMESPACE" get pods -l app=web -o 'go-template={{range .items}}{{if not .metadata.deletionTimestamp}}{{.metadata.name}}{{"\n"}}{{end}}{{end}}')
if [ -z "$LAB_PODS" ]; then
  printf '%s\n' 'No current web Pods found.' >&2
  exit 1
fi
for LAB_POD in $LAB_PODS; do
  LAB_MODE=$(kubectl -n "$LAB_NAMESPACE" exec "$LAB_POD" -c web -- printenv MODE)
  if [ "$LAB_MODE" != 'maintenance' ]; then
    printf '%s still has MODE=%s. Replace the old containers with rollout restart.\n' "$LAB_POD" "$LAB_MODE" >&2
    exit 1
  fi
done
printf '%s\n' 'Verified: ConfigMap and every current web container use MODE=maintenance.'
