#!/usr/bin/env bash
set -euo pipefail

# Only the ephemeral GitHub Actions cluster created by real-cluster-labs.yml.
# Learners should run the scripts inside a downloaded package instead.
fail() {
  printf 'Smoke check failed: %s\n' "$*" >&2
  exit 1
}

[[ ${GITHUB_ACTIONS:-} == true ]] || fail 'This script is reserved for the GitHub Actions test cluster.'
[[ -n ${RUNNER_TEMP:-} ]] || fail 'RUNNER_TEMP is required.'
[[ ${KUBECONFIG:-} == "$RUNNER_TEMP/learn-k8s-kubeconfig" ]] || fail 'Use the dedicated runner kubeconfig.'
[[ -f $KUBECONFIG ]] || fail 'The workflow must create the test cluster first.'
[[ $(kubectl config current-context) == kind-learn-k8s-ci ]] || fail 'Unexpected Kubernetes context.'
[[ $(kubectl config view --minify -o 'jsonpath={.clusters[0].cluster.server}') == https://127.0.0.1:* ]] || fail 'The test API server must be local to the runner.'
[[ $(kind get nodes --name learn-k8s-ci) == learn-k8s-ci-control-plane ]] || fail 'Expected the dedicated single-node kind cluster.'

SMOKE_REPO=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
SMOKE_LABS="$RUNNER_TEMP/learn-k8s-lab-packages"
SMOKE_EVIDENCE="$RUNNER_TEMP/learn-k8s-smoke-evidence"
mkdir "$SMOKE_LABS"
mkdir -p "$SMOKE_EVIDENCE"

assert_equal() {
  local label=$1 expected=$2 actual=$3
  [[ $actual == "$expected" ]] || fail "$label: expected '$expected', received '$actual'."
}

expect_verification_failure() {
  local slug=$1 stage=$2 diagnostic=$3 code=0
  local log="$SMOKE_EVIDENCE/$slug-$stage.log"
  "$SMOKE_LABS/$slug/verify.sh" >"$log" 2>&1 || code=$?
  cat "$log"
  # A missing executable or a runner timeout is not evidence of a broken lab.
  [[ $code == 1 ]] || fail "$slug/$stage: expected verify.sh to exit 1, received $code."
  [[ $(cat "$log") == *"$diagnostic"* ]] || fail "$slug/$stage: verification failed for an unexpected reason."
  printf 'Expected verification failure confirmed: %s/%s\n' "$slug" "$stage"
}

ready_endpoints() {
  kubectl -n "$1" get endpointslices -l kubernetes.io/service-name=web \
    -o 'jsonpath={range .items[*].endpoints[*]}{.conditions.ready}{"\n"}{end}'
}

wait_for_ready_endpoints() {
  local namespace=$1 deadline=$((SECONDS + 60))
  while (( SECONDS < deadline )); do
    if [[ $(ready_endpoints "$namespace") == *true* ]]; then
      return
    fi
    sleep 2
  done
  fail "$namespace: Service/web did not receive a ready endpoint."
}

wait_for_image_pull_failure() {
  local namespace=$1 reasons deadline=$((SECONDS + 90))
  while (( SECONDS < deadline )); do
    reasons=$(kubectl -n "$namespace" get pods -l app=web \
      -o 'jsonpath={range .items[*].status.containerStatuses[*]}{.state.waiting.reason}{"\n"}{end}')
    if [[ $reasons == *ErrImagePull* || $reasons == *ImagePullBackOff* ]]; then
      return
    fi
    sleep 2
  done
  fail "$namespace: the deliberately invalid image did not produce an image-pull failure."
}

cleanup_lab() {
  local slug=$1 namespace="learn-k8s-$1"
  "$SMOKE_LABS/$slug/cleanup.sh"
  assert_equal "$slug cleanup" '' "$(kubectl get namespace "$namespace" --ignore-not-found -o name)"
}

# Exercise the delivered ZIPs, including their paths and executable modes.
for slug in deployment-repair service-selector configmap-refresh; do
  unzip -q "$SMOKE_REPO/public/labs/$slug.zip" -d "$SMOKE_LABS"
done

printf '::group::Deployment repair\n'
slug=deployment-repair
namespace="learn-k8s-$slug"
"$SMOKE_LABS/$slug/start.sh"
assert_equal 'Broken Deployment image' 'nginx:1.27-learner-typo' \
  "$(kubectl -n "$namespace" get deployment web -o 'jsonpath={.spec.template.spec.containers[0].image}')"
wait_for_image_pull_failure "$namespace"
# This intentionally waits for the package's real 120-second rollout timeout.
expect_verification_failure "$slug" initial 'timed out waiting for the condition'
kubectl -n "$namespace" set image deployment/web web=nginx:1.27
kubectl -n "$namespace" rollout status deployment/web --timeout=120s
wait_for_ready_endpoints "$namespace"
"$SMOKE_LABS/$slug/verify.sh"
cleanup_lab "$slug"
printf '::endgroup::\n'

printf '::group::Service selector\n'
slug=service-selector
namespace="learn-k8s-$slug"
"$SMOKE_LABS/$slug/start.sh"
assert_equal 'Broken Service selector' 'api' \
  "$(kubectl -n "$namespace" get service web -o 'jsonpath={.spec.selector.app}')"
[[ $(ready_endpoints "$namespace") != *true* ]] || fail 'The broken Service unexpectedly has a ready endpoint.'
expect_verification_failure "$slug" initial 'Service/web has no ready endpoint.'
kubectl -n "$namespace" patch service web --type=merge -p '{"spec":{"selector":{"app":"web"}}}'
wait_for_ready_endpoints "$namespace"
"$SMOKE_LABS/$slug/verify.sh"
cleanup_lab "$slug"
printf '::endgroup::\n'

printf '::group::ConfigMap environment refresh\n'
slug=configmap-refresh
namespace="learn-k8s-$slug"
"$SMOKE_LABS/$slug/start.sh"
assert_equal 'Initial ConfigMap MODE' 'production' \
  "$(kubectl -n "$namespace" get configmap settings -o 'jsonpath={.data.MODE}')"
expect_verification_failure "$slug" initial 'ConfigMap settings must contain MODE=maintenance.'

# Capture process identity as well as Pod names. A restarted container could
# legitimately read the new value without a Deployment rollout.
pod_processes() {
  kubectl -n "$namespace" get pods -l app=web \
    -o 'jsonpath={range .items[*]}{.metadata.name}{"|"}{.metadata.uid}{"|"}{range .status.containerStatuses[?(@.name=="web")]}{.containerID}{"|"}{.restartCount}{end}{"\n"}{end}' | sort
}

pod_names=$(kubectl -n "$namespace" get pods -l app=web \
  -o 'jsonpath={range .items[*]}{.metadata.name}{"\n"}{end}')
readarray -t original_pods <<<"$pod_names"
assert_equal 'Initial web Pod count' 2 "${#original_pods[@]}"
original_processes=$(pod_processes)
for pod in "${original_pods[@]}"; do
  assert_equal "$pod initial MODE" 'production' "$(kubectl -n "$namespace" exec "$pod" -c web -- printenv MODE)"
done

kubectl apply -f "$SMOKE_LABS/$slug/settings-maintenance.yaml"
assert_equal 'Updated ConfigMap MODE' 'maintenance' \
  "$(kubectl -n "$namespace" get configmap settings -o 'jsonpath={.data.MODE}')"
for pod in "${original_pods[@]}"; do
  assert_equal "$pod MODE before rollout" 'production' "$(kubectl -n "$namespace" exec "$pod" -c web -- printenv MODE)"
done
assert_equal 'Existing Pod/container identities before rollout' "$original_processes" "$(pod_processes)"
expect_verification_failure "$slug" before-rollout 'still has MODE=production.'
assert_equal 'Pod/container identities after stale-env verification' "$original_processes" "$(pod_processes)"

kubectl -n "$namespace" rollout restart deployment/web
kubectl -n "$namespace" rollout status deployment/web --timeout=120s
for pod in "${original_pods[@]}"; do
  kubectl -n "$namespace" wait --for=delete "pod/$pod" --timeout=120s
done
"$SMOKE_LABS/$slug/verify.sh"
cleanup_lab "$slug"
printf '::endgroup::\n'

printf 'All three real-cluster lab lifecycles passed.\n'
