# Shared helpers for this self-contained lab package.
LAB_ID='deployment-repair'
LAB_NAMESPACE='learn-k8s-deployment-repair'

require_kubectl() {
  if ! command -v kubectl >/dev/null 2>&1; then
    printf '%s\n' 'kubectl is required and must point to your disposable learning cluster.' >&2
    return 1
  fi
}

check_namespace() {
  require_kubectl
  LAB_NAMESPACE_RECORD=$(kubectl get namespace "$LAB_NAMESPACE" --ignore-not-found -o 'jsonpath={.metadata.name}{"|"}{.metadata.labels.learn-k8s\.io/lab}')
  case "$LAB_NAMESPACE_RECORD" in
    '')
      if [ "${1:-existing}" != 'allow-missing' ]; then
        printf 'Namespace %s is missing. Run ./start.sh first.\n' "$LAB_NAMESPACE" >&2
        return 1
      fi
      ;;
    "$LAB_NAMESPACE|$LAB_ID") ;;
    *)
      printf 'Refusing to modify %s: it is not labeled as this learn-k8s lab.\n' "$LAB_NAMESPACE" >&2
      return 1
      ;;
  esac
}
