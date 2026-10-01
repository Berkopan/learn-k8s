export default {
  97: {
    title: 'An observer for every node',
    steps: ['Apply the node-agent manifest.', 'Inspect how the agents are distributed across nodes.'],
    caution: 'Real node eligibility depends on selectors, tolerations and operating-system compatibility. This lab treats both workers as eligible.',
    why: 'Some applications are needed because a machine exists, not because user traffic has increased. A log collector on every node is one example. Express that relationship directly instead of manually keeping a replica count equal to the number of machines.',
    how: 'A DaemonSet maintains a Pod on each eligible node. This differs from a Deployment’s target of a particular total replica count. Real eligibility depends on placement rules and compatibility; the training model considers both worker nodes eligible.',
    practice: 'Apply agent.yaml and inspect the wide Pod list. Verify more than a total of two instances: there should be one agent on each worker. No actual log collection runs here. You are learning the difference between node-associated work and a general application replica target.'
  },
  98: {
    title: 'Start with the event trail',
    steps: ['List the events.', 'Inspect the failure reason on web.'],
    caution: 'Real Events can expire and are not a permanent audit trail. The lab keeps a bounded event history for the current session.',
    why: 'The first short status label you see rarely tells the whole story. Immediately deleting and recreating a resource can erase useful evidence. This level emphasizes observation before intervention.',
    how: 'Pod status is a summary. Events record observations by components, while describe combines configuration and status details. An image-pull problem can mean the application code has never started. Neither Events nor one status column should be treated as a complete historical record.',
    practice: 'List events, then inspect web and identify the image problem. Do not repair it in this task. Explain the failing stage: scheduling, fetching the package or running the application. That distinction tells you which kind of correction would be relevant next.'
  },
  99: {
    title: 'What did the previous container say?',
    steps: ['Inspect the restarts and probe definition.', 'Read the previous container’s logs.'],
    caution: 'Logs here are synthetic. Correlate them with probe settings and Events rather than declaring a real root cause from one log line.',
    why: 'The newest process’s logs may not explain why its predecessor stopped. Investigating a restart often requires evidence from the instance immediately before it. Pair that evidence with the current configuration instead of reading each in isolation.',
    how: '`logs --previous` requests output from the prior terminated container instance; it is not an archive of every past process. Describe provides restart and probe information. Here the deliberately wrong liveness path links those observations to a particular cause.',
    practice: 'Inspect web’s restart and liveness details, then read the previous log. Explain how the two sources complement each other. You are practicing diagnosis, not fixing the workload yet. A synthetic example illustrates the method without proving that one message identifies every real restart incident.'
  },
  100: {
    title: 'Wrong tag, working controller',
    steps: ['Observe the Pod failures.', 'Correct web’s container image to the verified training tag.', 'Verify the rollout result.'],
    caution: 'This scenario has an incorrect tag. Real ImagePullBackOff incidents can instead involve registry access, credentials or other causes.',
    why: 'When every replacement instance has the same defect, repairing individual Pods is not a durable answer. Their parent will keep producing the same bad recipe. Choose the level of the system where the incorrect intention is stored.',
    how: 'web’s Deployment template contains an invalid image reference, so its generated Pods cannot become ready. Correcting the template lets the controller create instances from the right package. Rollout status verifies availability of the intended replacement, not merely acceptance of the edit.',
    practice: 'Observe the Pod states, correct the image on the Deployment and check its rollout. Keep the controller and healthy surrounding resources intact. The known error here is a tag; carry the evidence-first approach to real incidents rather than automatically changing every failing image reference.'
  },
  101: {
    title: 'A Service exists, but its endpoints are empty',
    steps: ['Inspect the empty endpoint list.', 'Correct the Service selector to app=web.', 'Verify that traffic reaches a ready Pod.'],
    caution: 'Correct the specific mismatched field before recreating the Service. Its stable address can remain while its endpoints change.',
    why: 'A stable address can exist without any usable destination behind it. Recreating that address does not help if the targeting rule is wrong. Diagnose the broken relationship instead of replacing the entire access layer.',
    how: 'web’s Service selects app=old, but the ready Pods are labeled app=web. Consequently it has no ready endpoints. Correcting the selector recalculates the targets without requiring a different Service address. Readiness is another possible cause of empty targets, so connect the symptom to the configuration.',
    practice: 'Read the EndpointSlice YAML, correct the selector and issue the verification request. These steps cover evidence, intervention and service outcome. The Pods were already healthy; the problem was how the Service selected them.'
  },
  102: {
    title: 'Not missing: in another namespace',
    steps: ['Search Pods across namespaces.', 'Inspect web in staging.'],
    caution: '-A broadens a supported list operation. Do not assume every mutation command automatically targets all namespaces.',
    why: 'Not finding a document in one folder does not prove that it was deleted. The same applies to cluster resources: an empty query may reveal a scope mistake rather than a missing application.',
    how: 'A namespace scopes a resource’s name. `-A` lists across namespaces, while `-n staging` explicitly chooses one. This web Pod belongs to staging. Another namespace could contain a different object with the same visible name.',
    practice: 'Find web in the all-namespace list, then describe it specifically in staging. No resource needs to be recreated or deleted. You repaired your view of the system. Keep broad observation distinct from an intention to change resources everywhere.'
  },
  103: {
    title: 'An oversized request leaves work waiting',
    steps: ['Inspect scheduling events.', 'Set the scenario’s appropriate CPU and memory request.'],
    caution: 'The 500m value is a training assumption, not a measured production requirement. Measure demand or add capacity rather than shrinking requests blindly.',
    why: 'The cluster’s total resources can look sufficient while no individual node can fit a Pod. A Pod’s CPU request is not divided across several small machines. Start with the fit between one workload instance and one candidate node.',
    how: 'Each web replica asks for 3 CPU, but each worker has only 2 CPU. The scheduler cannot place it. Deleting a Pod without changing its template reproduces the same impossible request. Events provide the evidence for this placement failure.',
    practice: 'Read the scheduling events, then use the provided 500m CPU and 64Mi memory request. Watch the new instances become ready. That correction is appropriate for this prepared scenario; in reality you may need larger nodes, better measurements or a different workload design.'
  },
  104: {
    title: 'Checkpoint: running is not ready',
    steps: ['Read the EndpointSlice status.', 'Apply the correct readiness definition.', 'Verify an end-to-end simulated request.'],
    caution: 'Removing liveness checks does not repair a readiness problem. Keep each probe’s purpose explicit.',
    why: 'If the process runs but traffic fails, avoid jumping straight to “the network is broken.” Several layers affect whether an application becomes a Service target. This checkpoint connects process state, readiness and the visible response.',
    how: 'web’s readiness check points at /broken. Its running Pods therefore do not qualify as normal ready Service destinations. healthy.yaml replaces the check with the appropriate root path. Ready replacements can then populate the endpoint list.',
    practice: 'Inspect endpoints first, apply the corrected definition, and make the final request. Notice that the repair is neither deleting the Service nor disabling an unrelated liveness probe. A precise understanding of the health question keeps the intervention small.'
  },
  105: {
    title: 'Usage is not reservation',
    steps: ['Read Pod resource usage.', 'Read node resource usage.'],
    caution: 'Real kubectl top needs a Metrics API provider. This lab supplies controlled synthetic values, not performance measurements.',
    why: 'Reserved hotel rooms and currently occupied rooms are not necessarily the same number. Resource requests and resource consumption have the same distinction. This time you will read usage rather than the configured placement budget.',
    how: '`kubectl top` reports Pod or node usage metrics. Requests describe scheduling needs, so their values need not equal the measurements. A real cluster requires a Metrics API provider; this model supplies synthetic observations for predictable learning scenarios.',
    practice: 'Read Pod usage, then node usage. Explain which view concerns application instances and which concerns machines. Do not draw real performance conclusions from these sample numbers. The following labs use them to demonstrate how a metric can influence a replica target.'
  },
  106: {
    title: 'Give the HPA a target',
    steps: ['Create a CPU-targeted HPA.', 'Inspect the HPA definition.'],
    caution: 'HPA changes workload replicas, not node count. New Pods can remain Pending when the cluster lacks capacity.',
    why: 'You may not want to adjust replica counts manually whenever demand changes. A controller can follow a chosen metric within explicit boundaries. The important step is defining what it should measure and what changes it is allowed to make.',
    how: 'HorizontalPodAutoscaler, or HPA, adjusts a workload’s replica target. CPU utilization is relative to CPU requests, not the node’s total CPU percentage. Minimum and maximum replicas constrain the result. Adding nodes is a different autoscaling responsibility.',
    practice: 'Configure web with a minimum of two, maximum of six and CPU target of 60 percent, then inspect the YAML. Identify the workload reference, metric and bounds. You created a rule based on a chosen signal, not a system that automatically understands every aspect of service quality.'
  },
  107: {
    title: 'When load rises',
    steps: ['Set synthetic CPU utilization to 90 percent of requests.', 'Advance the HPA reconciliation step.'],
    caution: 'Real HPA behavior includes tolerance, missing metrics, readiness and scaling policies. The lab models the basic ratio and replica bounds.',
    why: 'When existing replicas carry more load than the target, adding another instance may spread the work. Small numbers make the basic autoscaling ratio understandable instead of turning percentages into values to memorize.',
    how: 'The simplified desired count is the current replicas multiplied by observed utilization divided by target utilization, rounded up. Two replicas at 90 percent against a 60 percent target produce three. Real HPA behavior has additional timing and policy considerations.',
    practice: 'Set the synthetic load to 90, then advance the model with lab tick. Watch the Deployment target rise from two to three. load changes the metric; tick advances the decision. Neither command generates actual traffic or benchmarks a real cluster.'
  },
  108: {
    title: 'Keep a floor when load falls',
    steps: ['Set a low synthetic load.', 'Advance the model and verify the two-replica minimum.'],
    caution: 'Real downscale stabilization can delay shrinking. Do not infer production timing from this immediate model.',
    why: 'Reducing replicas when demand falls can save resources, but you may still want a minimum amount of available capacity. The configured floor can intentionally override the simple mathematical recommendation.',
    how: 'Four replicas at 10 percent utilization against a 60 percent target produce a basic recommendation of one after rounding up. minReplicas:2 raises that result to two. A real controller may additionally stabilize or rate-limit the downward change.',
    practice: 'Lower the prepared workload’s synthetic utilization to 10 and advance the HPA with a tick. Expect two replicas, not one. Explain the difference between the ratio’s recommendation and the permitted range. A minimum count is useful, but is not by itself protection against every failure scenario.'
  },
  109: {
    title: 'The percentage has no denominator',
    steps: ['Expose the missing-request condition.', 'Define a CPU request for the containers.', 'Advance the HPA calculation again.'],
    caution: 'A raw CPU-usage target and a request-relative utilization target are different metrics. Missing requests affect the latter calculation.',
    why: 'A percentage only makes sense when its reference quantity is known. An available usage measurement is not enough if the baseline it should be divided by is absent. This lab exposes that missing input to autoscaling.',
    how: 'CPU utilization compares consumption to CPU requests. Without a CPU request on web’s containers, the model cannot calculate that ratio and reports a metric condition. This does not mean every possible autoscaling metric has the same requirement.',
    practice: 'Tick once to reveal the condition, set the specified CPU and memory requests, then tick again. Verify that the calculation can proceed. You supplied a missing input rather than deleting the HPA or changing an unrelated Service.'
  },
  110: {
    title: 'Cordon: stop new placements',
    steps: ['Cordon worker-1.', 'Verify that existing Pod placements remain.'],
    caution: 'Cordon is not network isolation or machine shutdown. Special placement mechanisms such as directly specifying nodeName need separate consideration.',
    why: 'Before maintaining a machine, you may want to stop new work arriving there without immediately removing existing work. Splitting those decisions into steps makes the impact easier to control.',
    how: '`cordon` marks a node unschedulable for normal new Pod placements. It does not evict its current Pods, power off the node or block its network. Existing applications remaining there is expected behavior, not failure of the command.',
    practice: 'Cordon worker-1 and read the wide Pod list. Compare the SchedulingDisabled marker with the unchanged existing placements. This step closes admission to new work; the following drain exercise deals with moving suitable existing workloads away.'
  },
  111: {
    title: 'Drain: a controlled evacuation',
    steps: ['Drain worker-1.', 'Uncordon it after the simulated maintenance.'],
    caution: 'Real drain can be blocked by disruption budgets, local data or unmanaged Pods. Understand force and data-deletion flags before using them.',
    why: 'Maintenance may require more than preventing new work: eligible running applications also need to leave the machine. Controlled eviction makes that intention clearer than deleting random Pods. Other nodes still need enough capacity for replacements.',
    how: '`drain` makes a node unschedulable and attempts to evict eligible Pods. Workload controllers can create replacements on other suitable nodes. `uncordon` later permits new placement again; it does not automatically move those replacement Pods back.',
    practice: 'Drain worker-1 and observe web’s replacements on worker-2, then reopen worker-1. The scenario has enough capacity for this move. Do not generalize it into unconditional success: real disruption policies, unmanaged workloads and storage concerns can legitimately stop a drain.'
  },
  112: {
    title: 'Checkpoint: a disruption budget',
    steps: ['Require at least one ready replica to remain.', 'Drain worker-1 within that budget.'],
    caution: 'This model checks numeric minAvailable during drain. Real eviction APIs and concurrent changes involve more detailed behavior.',
    why: 'During planned maintenance, losing every healthy replica at once may be unacceptable. An explicit availability budget constrains voluntary eviction. It is not a shield against every kind of outage or deletion.',
    how: 'A PodDisruptionBudget, or PDB, constrains voluntary disruptions for its selected group. minAvailable:1 requests that one ready member remain. It does not prevent all direct Pod deletions or unexpected node failures. The workload controller independently maintains its replica target.',
    practice: 'Apply budget.yaml for the two ready web instances, then drain worker-1. Separate preserving a ready instance from producing a replacement for an evicted one. The exercise shows how the budget and workload controller contribute different pieces to controlled maintenance.'
  },
  113: {
    title: 'Route an HTTP path to a Service',
    steps: ['Create the host-based Ingress definition.', 'Read its routing rule.'],
    caution: 'No Ingress controller or real DNS runs here. The Ingress API is frozen; also explore Gateway API for newer routing features.',
    why: 'Several web applications may share access through domain names and URL paths. That is a higher-level routing decision than simply opening a port. First describe which Service should receive a matching HTTP request.',
    how: 'An Ingress object connects host and path rules to Service backends. A separate Ingress controller must implement those rules. Creating the object alone does not create a working proxy or DNS record. ingressClassName identifies the intended controller class.',
    practice: 'Define demo.local’s route to web on port 80, then inspect the YAML. Trace host → path → Service. This level teaches the routing definition; without a real controller and DNS, it does not establish an Internet-facing application.'
  },
  114: {
    title: 'A TLS reference is not certificate management',
    steps: ['Read the manifest’s TLS reference.', 'Apply the Ingress TLS definition.'],
    caution: 'Never paste real private keys here. Training placeholders are not valid production certificates or credentials.',
    why: 'HTTPS needs certificate material as well as a routing rule. Referencing a certificate, obtaining one and renewing it are separate responsibilities. This level focuses on how the configuration pieces refer to each other.',
    how: 'An Ingress TLS section associates host names with a Secret containing certificate and key material. secretName is only a reference; it does not generate a certificate. A working controller, valid material and suitable DNS are still needed for real HTTPS.',
    practice: 'Read hosts, secretName and the backend port in tls-ingress.yaml, then apply it. The definition references web-tls; the task does not issue a certificate or create real key material. Interpret the result as a configuration relationship, not a successful cryptographic handshake.'
  },
  115: {
    title: 'Start by limiting incoming traffic',
    steps: ['Apply the default-deny ingress policy for web.', 'Inspect its selection and empty allowance list.'],
    caution: 'A supporting network plugin is required in reality. This model supports selected ingress selectors and numeric TCP ports, not full egress or packet filtering.',
    why: 'A running application need not accept connections from everyone. Establishing isolation and then adding the required narrow paths can make the policy easier to reason about. Network access remains a different layer from API authorization.',
    how: 'A NetworkPolicy selects Pods and describes allowed connections. Selecting web for ingress isolation with an empty ingress allowance list denies incoming traffic in that direction. The Pods are not deleted, and the application process does not need to stop.',
    practice: 'Apply deny.yaml and read isolate-web’s Pod selector and empty ingress list. Notice that you changed connectivity policy rather than workload health. The browser simulates a limited set of incoming TCP rules; a real cluster needs a plugin that enforces the policy.'
  },
  116: {
    title: 'Open a door only for the client',
    steps: ['Apply the policy allowing the client to reach web.', 'Send a request from the client Pod.'],
    caution: 'podSelector and namespaceSelector in the same peer combine; separate from entries offer alternative peers. Keep the intended scope narrow.',
    why: 'Blocking everything can remove the function you need. Restoring that function does not require deleting every protection. Add permission for the specific caller and destination while preserving the default isolation.',
    how: 'NetworkPolicy allowances are additive. A rule can permit Pods labeled app=client to reach web on TCP port 80 alongside the existing isolation policy. Selector placement matters: combining selectors inside one peer differs from listing alternative peers.',
    practice: 'Apply allow-client.yaml and request web from client. Keep the isolation policy present. A successful authorized request demonstrates the allowed path, but does not alone prove every other source is denied. Real testing should include both allowed and disallowed traffic pairs.'
  },
  117: {
    title: 'Package Kubernetes definitions',
    steps: ['Install the sample chart as the shop release.', 'List the releases.'],
    caution: './chart is a fixed educational model. There is no real template engine, repository download, hook execution or third-party chart installation.',
    why: 'An application often needs several Kubernetes objects that you want to install together with adjustable settings. Packaging their recipes reduces repeated manual setup. Helm distinguishes that package from a particular installed copy.',
    how: 'A chart packages resource templates and configurable values. A release is an installation of that chart under a particular name. One release can manage several resources. The training chart is deliberately fixed rather than a real Helm template engine.',
    practice: 'Install the sample as shop and list releases. Observe the Deployment and Service it creates. Keep chart, release and Pod distinct: the first is a package, the second an installation record, and the third a workload instance managed through the resulting resources.'
  },
  118: {
    title: 'Change a value and upgrade the release',
    steps: ['Upgrade shop to three replicas.', 'Inspect the release revision history.'],
    caution: 'Helm is not a continuously reconciling GitOps controller. Workload controllers manage the resources produced by an install or upgrade.',
    why: 'You may want to change one package setting while retaining a useful history of the installation. Updating the release expresses that intention more clearly than recreating all its resources by hand.',
    how: '`helm upgrade` updates a release with a chart and values. In this teaching chart, replicaCount controls the Deployment count. The change becomes a new release revision. That value name is a property of this chart, not a universal key in every chart.',
    practice: 'Upgrade the prepared one-replica shop release to replicaCount=3, then inspect history. Connect the changed workload count to the new release revision. The Deployment controller keeps the resulting replica target; Helm is not continuously running its own replacement loop in the background.'
  },
  119: {
    title: 'Return to a release configuration',
    steps: ['Roll shop back to revision one.', 'Verify that rollback creates a new history entry.'],
    caution: 'Deployment rollout undo and Helm rollback have different scopes. Neither automatically reverses database migrations or external side effects.',
    why: 'Returning to an earlier configuration is not the same as turning back time for every connected system. Understand the scope of the saved history before relying on rollback as a recovery action.',
    how: '`helm rollback` targets the selected release revision’s configuration and records a new revision. Its scope is the chart release, while Deployment rollout undo focuses on Pod-template history. External changes require separate recovery decisions.',
    practice: 'Restore shop’s first, one-replica configuration and inspect its history. Watch the current three-replica target return to one while rollback itself appears as a new action. This is management of installation configuration, not a demonstration of real data restoration.'
  },
  120: {
    title: 'Checkpoint: clean up the release',
    steps: ['Uninstall the shop release.', 'Verify that the release list is empty.'],
    caution: 'Check data and dependencies before a real uninstall. This example neither operates on real storage nor creates a backup.',
    why: 'After an experiment, you should be able to remove the resource group you installed. But removing a package does not automatically mean every associated data or external dependency has been safely handled.',
    how: '`helm uninstall` removes resources managed by the release. This teaching chart contains a Deployment and Service; removing the Deployment also removes its managed Pods. Real charts can have retained data, hooks and dependencies that require additional review.',
    practice: 'Uninstall shop and inspect the empty release list. Observe the managed application resources disappearing. Be precise about what was cleaned: this lab has no real disk contents to preserve. Production cleanup needs a data and dependency plan before applying the same high-level command.'
  },
  121: {
    title: 'Field mission 01: a failed release',
    steps: ['Read the failure’s scope from the Pod list.', 'Restore the verified image.', 'Verify rollout completion.', 'Verify the Service response.'],
    caution: 'An accepted or configured response does not prove readiness. Finish the repair with an observable service-level check.',
    why: 'A repair should restore something a user can actually observe, not merely make an edit command return success. This mission joins startup evidence, workload configuration, rollout state and application access into one recovery sequence.',
    how: 'The prepared release contains an invalid image in the Deployment template. New Pods cannot become ready. Restoring the working image repairs that desired state; the controller then creates usable replicas. A Service request checks a different part of the result from the rollout query.',
    practice: 'Inspect the Pods, restore the provided nginx tag, verify the rollout and request web. Explain which fact each observation proves. Do not stop at configured: the last check is there to establish that the repaired application can actually answer through its intended Service.'
  },
  122: {
    title: 'Field mission 02: two independent traffic faults',
    steps: ['Correct the Service selector.', 'Correct the readiness definition.', 'Verify that both repairs restore service.'],
    caution: 'Reevaluate your hypothesis after each change. Prefer evidence-based corrections to broad, random resource deletion.',
    why: 'If the service still fails after one correct repair, that does not necessarily make the repair wrong. Two independent faults may coexist. This mission challenges the assumption that every incident has only one relevant cause.',
    how: 'The Service selects the wrong label, and the workload probes the wrong readiness path. Correct selection cannot help if there are no ready targets. Correct readiness cannot help if the Service looks for a different group. Both relationships must work.',
    practice: 'Fix the selector, apply healthy.yaml and make the verification request. Explain why the first change alone was insufficient. Keep the existing resources and make two narrow corrections rather than hiding the causal structure by deleting and rebuilding the whole application.'
  },
  123: {
    title: 'Field mission 03: missing dependencies',
    steps: ['Create the missing ConfigMap.', 'Create the demonstration credentials Secret.', 'Verify the rollout after both dependencies are available.'],
    caution: 'Use only the dummy password supplied by the lesson. Real Secret access, storage protection and rotation require separate design.',
    why: 'A correct application package still needs its startup inputs. When several dependencies are required, providing only one may not let the application run. Identify and complete the whole declared dependency chain.',
    how: 'web’s environment references both settings and credentials. These are different resource kinds with different responsibilities, and their names and namespaces must match the template references. Once the required data sources exist, the containers can finish starting.',
    practice: 'Create settings with MODE=production and credentials with demo-only, then inspect the rollout. Expect the two application instances to become ready. No image change was needed: the repair supplied missing inputs instead of changing the application package.'
  },
  124: {
    title: 'Field mission 04: capacity and placement',
    steps: ['Read the scheduling events.', 'Correct the request to the scenario’s intended value.', 'Inspect the resulting Pod placements.'],
    caution: '250m is an exercise assumption, not a real performance measurement. Smaller requests do not guarantee good performance; real workloads need measurements and load tests.',
    why: 'Deleting the same Pending Pod repeatedly cannot solve an impossible requirement in its parent template. Target the cause that each replacement inherits. Here the mismatch is between an instance’s request and the available machines.',
    how: 'web requests 5 CPU per instance, beyond the capacity of either training node. The scheduler keeps rejecting that placement. Correcting the Deployment request changes the conditions for new instances, and wide output shows where they can actually run.',
    practice: 'Read Events, apply the provided 250m CPU and 64Mi memory request, and inspect the two ready replicas’ locations. Treat those values as the scenario’s assumptions. In real operations, the justified solution could instead be larger nodes or a measured change in workload requirements.'
  },
  125: {
    title: 'Field mission 05: storage that will not bind',
    steps: ['Inspect why the claim is Pending.', 'Remove the incorrect claim with no bound data.', 'Create the claim using the correct class.'],
    caution: 'This deletion applies only to this unbound, data-free scenario. A production PVC can require migration, backup and protection-aware handling.',
    why: 'Changing an image is not a useful first repair when storage is preventing startup. Follow the dependency that blocks readiness. This mission connects the waiting writer Pod to its unfulfilled storage request.',
    how: 'writer depends on data, whose nonexistent StorageClass leaves it Pending. No data has been bound in this exercise. Replacing the incorrect claim with the standard-class manifest can satisfy that dependency. The simulation does not implement every real PVC protection and deletion rule.',
    practice: 'Describe the claim, replace only this deliberately data-free one and verify the result in the resource view. Both Bound storage and a ready writer matter. Do not transfer the deletion sequence blindly to a real used volume; data-bearing recovery needs its own plan.'
  },
  126: {
    title: 'Field mission 06: identity without authorization',
    steps: ['Create the missing role assignment.', 'Verify the required read permission.', 'Verify that unnecessary deletion permission is absent.'],
    caution: 'Broad temporary grants are easy to forget. A durable repair assigns the narrowest permissions needed in the correct scope.',
    why: 'Giving an application the broadest role can make an access error disappear while creating unnecessary risk. Sometimes the required narrow permissions already exist, and only the assignment is missing.',
    how: 'The reader ServiceAccount and Pod-reading Role are prepared, but no RoleBinding connects them. Adding the binding assigns the existing permissions to the correct identity. Verification should include a required operation and an operation that must remain unavailable.',
    practice: 'Create reader-binding, then ask about list pods and delete pods for the same identity. Expect yes and no respectively. You restored the application’s intended capability while checking that it did not gain unnecessary power. The solution is a precise relationship, not cluster-admin.'
  },
  127: {
    title: 'Field mission 07: restore access without removing isolation',
    steps: ['Apply the narrow network allowance.', 'Request web from the permitted client.', 'Verify that the baseline isolation policy remains.'],
    caution: 'One successful request does not prove all other sources are blocked. Test both permitted and denied traffic when validating real policies.',
    why: 'Healthy Pods and a correctly selected Service can still reject a particular caller through network policy. Restoring access should not automatically mean discarding every security boundary. Repair the required path while keeping the intended isolation.',
    how: 'web has ingress isolation. allow-client.yaml adds a TCP 80 allowance for appropriately labeled clients. Policy allowances combine, so the base isolation does not have to be removed. Network access to the application is separate from permission to modify Kubernetes objects.',
    practice: 'Apply the allowance, request web from client and list policies to confirm isolate-web remains. The exercise verifies an authorized path and the presence of the baseline definition. A complete real-world validation would also test callers and ports that must stay denied.'
  },
  128: {
    title: 'Final: bring a small platform online',
    steps: ['Create the application settings.', 'Apply the platform manifest.', 'Inspect the ready Service endpoints.', 'Verify the first successful request.', 'Raise synthetic CPU utilization to 80 percent of requests.', 'Advance the HPA and verify its four-replica target.'],
    caution: 'The next step is an isolated kind or minikube cluster with official documentation and safe examples. This simulation is preparation, not a substitute for real-cluster experience.',
    why: 'A platform consists of related pieces with different responsibilities. Treating settings, workloads, health, access, capacity and maintenance policy as one thing makes troubleshooting harder. The final lab connects them through observable results.',
    how: 'The ConfigMap supplies settings. The Deployment manages three application replicas and readiness checks. The Service targets ready instances. CPU requests provide the baseline for HPA utilization, while the HPA adjusts replica count. The PDB separately constrains planned disruption; these are not alternate names for one controller.',
    practice: 'Create settings, apply platform.yaml, inspect endpoints and verify an HTTP response. Raise synthetic utilization to 80 percent and tick: three replicas against a 60 percent target should produce four after rounding up. Explain what each observation establishes. There is no real networking, disk or load test here; carry the reasoning into a safe real practice cluster next.'
  }
};
