#!/bin/sh
set -eu
LAB_DIR=$(CDPATH='' cd -P "$(dirname "$0")" && pwd)
. "$LAB_DIR/lab.sh"
check_namespace allow-missing
kubectl delete namespace "$LAB_NAMESPACE" --ignore-not-found=true --timeout=120s
printf 'Cleanup complete for %s.\n' "$LAB_NAMESPACE"
