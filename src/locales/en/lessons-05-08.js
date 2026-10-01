// English presentation. Execution, object names and saved progress IDs stay shared.
export default {
  33: {
    title: 'State the desired count',
    steps: ['Create a web Deployment with two replicas.'],
    caution: 'A replica count alone does not guarantee high availability. Failure domains, readiness and application design also matter.',
    why: 'Starting two processes once is not the same as asking a system to keep two available. An instance can disappear after you create it. A Deployment lets you describe an ongoing target rather than a one-time action.',
    how: 'A Deployment combines a Pod template with a desired replica count. Its controller manages ReplicaSets, which create the necessary Pods. The target remains recorded even when individual Pod names change. You manage the application through that stable parent object.',
    practice: 'Create web with the specified nginx image and two replicas. Watch the controller produce two Pod instances from one template. Read the desired and ready counts together: the request describes what should exist, while readiness tells you what has actually become available.'
  },
  34: {
    title: 'More instances, the same recipe',
    steps: ['Scale the web Deployment to three replicas.'],
    caution: 'More replicas do not remove shared-state, connection-pool or external-service bottlenecks. Measure the real application before scaling.',
    why: 'When more people arrive at a service desk, adding another clerk can increase capacity without changing how the work is done. Horizontal scaling follows that idea: increase the number of application instances while keeping the same application recipe.',
    how: '`scale` changes the Deployment’s replica target. The controller compares the current number of Pods with the new target and creates the missing instance. It does not need a new image or a different Pod template just to change the count.',
    practice: 'Increase web to three replicas. Find the extra Pod in the diagram and check that all three use the same image. Distinguish this count change from a software release: you requested more copies of the existing version, not a new version of the application.'
  },
  35: {
    title: 'Zero is a target too',
    steps: ['Scale the web Deployment down to zero replicas.'],
    caution: 'Scaling to zero interrupts availability unless another mechanism handles requests. The model does not provide scale-to-zero request buffering.',
    why: 'You may want to pause an application without forgetting how to run it. Deleting its entire definition would lose that convenient starting point. Keeping the recipe while requesting no running instances separates configuration from current activity.',
    how: 'A replica target of zero tells the controller to remove the Deployment’s running Pods. The Deployment and its Pod template remain. You can later scale up again from that definition. Zero Pods therefore does not necessarily mean the application resource was deleted.',
    practice: 'Scale web to zero and inspect the diagram. Its Pod boxes should disappear, but the Deployment should remain in the resource inventory. Explain what is still stored and what has stopped running. This is a deliberate desired state, not a scheduling failure.'
  },
  36: {
    title: 'The controller in between: ReplicaSet',
    steps: ['List the ReplicaSets.', 'Inspect the web Deployment’s details.'],
    caution: 'Directly editing a ReplicaSet managed by a Deployment can conflict with its controller. Change the owning Deployment instead.',
    why: 'The application you manage and the processes you see are connected through intermediate objects. Understanding that chain makes it easier to explain where Pods came from and why old groups may remain during a release.',
    how: 'A Deployment manages revisions of a Pod template through ReplicaSets. Each ReplicaSet maintains a number of Pods for its template. The chain is Deployment → ReplicaSet → Pod. Scaling changes a count; changing the template can introduce a new ReplicaSet representing a new revision.',
    practice: 'List ReplicaSets, then inspect web. Match the parent, replica group and Pod instances in the resource view. Do not edit the middle object in this task. The goal is to recognize ownership so that later you change the object responsible for the desired behavior.'
  },
  37: {
    title: 'Why did the deleted Pod return?',
    steps: ['Delete the currently running Pods.', 'Read the replacement Pods and their locations.'],
    caution: 'Deleting all Pods is disruptive in a real namespace. Use narrow selectors and an intentional maintenance plan outside this lab.',
    why: 'Earlier, deleting a standalone Pod left an empty cluster. Now the same kind of deletion produces a different result. The important difference is the persistent instruction to keep the application at a particular replica count.',
    how: 'A Deployment’s controller observes that the actual Pod count has fallen below the desired count. It creates replacements through the ReplicaSet. These are new Pod objects with new identities, not the deleted objects brought back to life.',
    practice: 'Delete the prepared Pods, then list Pods with their node information. Watch the count return to the Deployment’s target and compare the new names with the previous ones. Explain why deleting children did not remove the parent’s desired state.'
  },
  38: {
    title: 'A new image, a new revision',
    steps: ['Update web to nginx:1.28.', 'Check the rollout status.'],
    caution: 'This is a simplified rollout model, not a full implementation of maxSurge, maxUnavailable or real scheduling and readiness delays.',
    why: 'Updating an application should be more controlled than stopping every instance and hoping the new ones work. A rollout connects a change in the application recipe to an observable replacement process.',
    how: 'Changing the image in a Deployment changes its Pod template. The controller produces instances of the new revision and works toward the requested replica count. A successful API update is not the same as a completed rollout; new instances must become ready.',
    practice: 'Set web’s image to the requested new tag, then read the rollout status. Watch the old and new replica groups in the resource view. The task is complete when the new desired version is available, not merely when the edit command has been accepted.'
  },
  39: {
    title: 'Follow the revision history',
    steps: ['Update web to nginx:1.28.', 'Read the rollout history.'],
    caution: 'Real Deployments retain only the configured revision history. Scaling alone does not create a new Pod-template revision.',
    why: 'When a new release behaves differently, knowing what changed is more useful than guessing. A revision history gives you a trail of application templates, which is different from a list of every command ever entered.',
    how: 'Deployment revisions track changes to the Pod template, including image changes. The controller can retain older ReplicaSets as history. Replica counts may change without creating another template revision, so history is not a record of every scaling event.',
    practice: 'Change web’s image, then inspect its rollout history. Identify the older and newer revisions and relate them to the image change. You are learning where a rollback can obtain an earlier template, while remembering that history is limited and does not cover external application data.'
  },
  40: {
    title: 'Checkpoint: recover from a broken release',
    steps: ['Publish the deliberately invalid image tag.', 'Inspect the Pod statuses.', 'Undo the latest rollout.', 'Verify that the rollout is healthy again.'],
    caution: 'Rolling back a Deployment does not undo database migrations, external configuration changes or other release side effects.',
    why: 'A release can be accepted as a valid configuration yet fail to start. Recovery should follow the evidence and restore a known application template, not delete unrelated resources until something happens.',
    how: 'The bad-tag image deliberately fails in this model. Pod status reveals the startup problem. `rollout undo` restores a retained template revision, and `rollout status` checks whether the controller has reached that target. Rollback concerns the workload template, not every side effect of a release.',
    practice: 'Introduce the prepared image error, observe it in the Pod list, and roll back. Finish by verifying the rollout instead of assuming undo means recovery is complete. Watch the known working nginx version become ready again while preserving the Deployment’s role as the stable parent.'
  },
  41: {
    title: 'A stable address in front of Pods',
    steps: ['Expose web through a Service on port 80.'],
    caution: 'The default ClusterIP Service is for cluster-internal access. Creating it does not publish the application on the Internet.',
    why: 'Pod instances can be replaced, and their addresses can change. Clients should not need a new list of addresses after every replacement. A Service gives them a stable way to reach the current application group.',
    how: 'A Service selects Pods by labels and describes how traffic should reach them. Its port is the client-facing port; targetPort identifies the destination port on the selected Pods. Matching ready endpoints connect this stable front door to disposable instances.',
    practice: 'Expose the prepared web Deployment on port 80. Locate the Service and its relationships in the diagram. You created an access abstraction, not another application process. Keep its internal scope in mind: a ClusterIP is not automatically an external public address.'
  },
  42: {
    title: 'A Service has two ports',
    steps: ['Inspect the web Service.', 'Send a simulated request to web on port 8080.'],
    caution: 'Declaring containerPort does not make a process listen. The application must actually listen on the target port in a real cluster.',
    why: 'A building’s public entrance and the room where work happens can have different numbers. Similarly, a Service can accept traffic on one port and send it to a different application port. Confusing these sides causes avoidable connection problems.',
    how: 'The prepared Service exposes port 8080 while its targetPort is 80. A client uses the Service port, and forwarding reaches the application’s listening port. The port fields describe a mapping; they do not start a listener inside the container.',
    practice: 'Read web’s Service details and identify both ports before issuing the request. Then target web:8080 in the lab. A successful result demonstrates that you used the Service-facing address. Do not substitute the container’s port just because it appears elsewhere in the definition.'
  },
  43: {
    title: 'The real targets: EndpointSlice',
    steps: ['List EndpointSlices.', 'Inspect the EndpointSlice YAML.'],
    caution: 'EndpointSlice is the scalable endpoint representation. Read readiness as well as addresses rather than treating every listed Pod as a traffic target.',
    why: 'A front door is useful only if it leads somewhere. Seeing a Service object proves that its definition exists, but does not prove that it has usable application targets. We need to inspect the connection behind that front door.',
    how: 'EndpointSlices describe the addresses, ports and readiness of endpoints associated with a Service. They help you distinguish a valid-looking Service from one that currently has no ready destinations. Pod selection and Pod readiness both affect what can receive normal traffic.',
    practice: 'List the endpoint slices, then open their YAML. Match the target addresses and readiness information to the Pods in the diagram. This is a read-only investigation: you are verifying the Service’s actual targets, not merely its name or advertised port.'
  },
  44: {
    title: 'No endpoints: a selector mismatch',
    steps: ['Correct web’s Service selector to app=web.', 'Verify the Service with a simulated request.'],
    caution: 'A Service selects matching Pods in its own namespace. Equal names do not substitute for matching labels and readiness.',
    why: 'A receptionist with the wrong team directory may have no one to send visitors to, even when the team is present. A Service selector can make the same mistake: the application is healthy, but the Service is looking for the wrong labels.',
    how: 'This Service selects app=wrong, while the prepared Pods carry app=web. Their similar names do not connect them. Correcting the selector lets the endpoint controller identify matching ready Pods and populate usable targets.',
    practice: 'Apply the narrow selector correction, then send the verification request. Watch endpoints appear before considering the repair successful. You are fixing the relationship between existing resources, not rebuilding the image, restarting healthy Pods or creating another Service.'
  },
  45: {
    title: 'What does NodePort add?',
    steps: ['Expose web as a NodePort Service.', 'Read the resulting Service details.'],
    caution: 'Real NodePort access depends on networking and firewall configuration. This simulation opens no host ports and makes no external connections.',
    why: 'Cluster-internal naming is not the only access pattern. Sometimes traffic reaches an application through an address and port on a node. NodePort extends the Service abstraction to describe that entry point.',
    how: 'A NodePort Service includes a node-level port in addition to the Service’s internal port and targetPort mapping. It is not an HTTP routing rule and does not choose backends by URL path. The same label-selected ready endpoints still provide the application destinations.',
    practice: 'Create the requested NodePort Service, then read its type and port information. Separate the node port, Service port and application destination in the output. This task models the configuration relationship; it does not make your browser or a real machine listen on that port.'
  },
  46: {
    title: 'Use DNS instead of memorizing IPs',
    steps: ['Resolve web.default from the client Pod.', 'Request the web Service from the client Pod.'],
    caution: 'DNS search domains, caching, TTLs and CoreDNS operation are simplified. Resolving a name alone does not prove HTTP application health.',
    why: 'An understandable service name is easier to maintain than an address copied into every client. DNS lets clients discover the address behind a stable name. But finding an address and getting a useful response are separate checks.',
    how: 'A Service name can resolve to its cluster address. The prepared client can first perform a name lookup, then request the application. In `kubectl exec`, the arguments after `--` describe the command inside the container rather than options for kubectl itself.',
    practice: 'Resolve web.default and then make the HTTP request using web’s name. Read both results: one demonstrates discovery, the other exercises access to the application. If discovery succeeds but the request fails, investigate ports, endpoints and readiness rather than assuming DNS is the problem.'
  },
  47: {
    title: 'A temporary diagnostic tunnel',
    steps: ['Forward local port 8080 to the web Service on port 80.', 'Request localhost on the forwarded port.'],
    caution: 'Real port-forward lasts while its command process runs. It is a diagnostic tool, not a durable production publishing mechanism.',
    why: 'You sometimes need to examine an application without creating a public entry point. A temporary connection from your local machine can help with diagnosis while leaving the normal Service configuration unchanged.',
    how: '`port-forward` maps a local listening port to a port on a selected workload. Using a Service as the target helps select a backing Pod. The local side and destination side can use different port numbers; here the requested mapping is 8080 to 80.',
    practice: 'Establish the model’s forwarding rule, then request localhost:8080. Watch how that address reaches the prepared web application. The important distinction is temporary local access versus permanent publication. The browser lab records the mapping without opening an actual network tunnel.'
  },
  48: {
    title: 'Checkpoint: make the application reachable',
    steps: ['Expose web on port 8080 with target port 80.', 'Inspect the EndpointSlice.', 'Verify access with a simulated request.'],
    caution: 'This checkpoint verifies cluster-internal Service access, not external DNS, TLS, ingress rules or firewall configuration.',
    why: 'An application can be running and still be unreachable through its intended address. A useful access check follows the whole internal path: the front door, the chosen targets and the response. This checkpoint connects the earlier Service lessons.',
    how: 'The Service provides a client port and selects Pods. EndpointSlices show whether those Pods are ready destinations. A request then exercises the mapping from Service port to target port. Each step answers a different question, so no single object’s existence proves the whole path works.',
    practice: 'Create the 8080-to-80 mapping, inspect its endpoint slice and make the request. Expect ready targets and a successful response. Keep the scope precise: you have made the application reachable through this internal Service, not deployed a complete Internet-facing system.'
  },
  49: {
    title: 'Separate configuration from the image',
    steps: ['Create settings with MODE=production.'],
    caution: 'ConfigMaps are for non-sensitive configuration, not secrets or large file storage. The application must still be connected to them.',
    why: 'Rebuilding the same application package just to change an environment-specific setting creates unnecessary work. Keep the code package stable and provide configuration separately, like choosing a device’s settings without manufacturing a different device.',
    how: 'A ConfigMap stores non-sensitive key-value configuration. Creating settings with MODE=production records data in the cluster. It does not automatically inject that value into every process or tell the application how to interpret it. Consumption is a separate connection.',
    practice: 'Create the requested ConfigMap and find it in Resources. No new application instance needs to start. At this stage you have stored a setting; you have not yet proved that any application reads it. The next labs will make that distinction explicit.'
  },
  50: {
    title: 'Data is not behavior',
    steps: ['Read the settings ConfigMap as YAML.'],
    caution: 'ConfigMap environment variables and mounted files have different update behavior. A stored data change does not guarantee that a running process has adopted it.',
    why: 'Writing “production” on a label does not itself change how a machine operates. A configuration object similarly holds information; application code decides what that information means. Inspect the data before assuming it has caused a behavior change.',
    how: 'The ConfigMap’s data section contains string values. MODE is a key and production is its stored value. YAML output shows this definition, not a live view of the application’s internal settings. Consumption through environment variables or mounted files happens elsewhere.',
    practice: 'Open settings as YAML and locate MODE. Separate the resource’s metadata from the actual configuration data. You are verifying what was stored. Do not interpret this read as proof that web is using the value or that an existing process has refreshed its environment.'
  },
  51: {
    title: 'Connect a ConfigMap to the application',
    steps: ['Load settings into web’s environment.'],
    caution: 'Environment variables are read when a container starts. Updating the ConfigMap does not automatically rewrite a running process’s environment.',
    why: 'A configuration file on a shelf has no effect until the application is told to use it. Now you will connect the separate data object to the workload, making the relationship between stored settings and process startup visible.',
    how: 'Loading a ConfigMap into a Deployment’s environment changes the Pod template. New containers receive the referenced values during startup. The controller rolls out the template change; it is not editing environment memory inside an already-running process.',
    practice: 'Connect settings to web with the requested environment operation. Inspect the new Pod state and configuration relationship. The image can stay the same while startup settings change. Remember the snapshot behavior: a later ConfigMap edit is not by itself a refresh of existing container environments.'
  },
  52: {
    title: 'Set one environment variable',
    steps: ['Set LOG_LEVEL=debug on web.'],
    caution: 'Debug logging may increase volume and expose sensitive details. Enable it deliberately and consider how to restore the normal level.',
    why: 'Not every setting needs a separate configuration object. For a small, explicit change, you can put one environment variable directly in a workload template. The application still decides whether and how that variable affects its behavior.',
    how: '`set env` updates the Deployment’s Pod template. Setting LOG_LEVEL=debug gives newly created containers that environment value and causes a rollout of the changed template. The container image remains the same; this is a startup-configuration change rather than a new build.',
    practice: 'Add the requested variable to web and watch the replacement instances. Inspect their configuration rather than expecting an image change. The model records the environment value; it does not run a real application whose logging volume you can measure.'
  },
  53: {
    title: 'Secret: a separate object and responsibility',
    steps: ['Create credentials with the demonstration password.'],
    caution: 'Secret is not automatic encryption. Real CLI values may enter shell history; never use a real password in this browser lab.',
    why: 'Passwords and ordinary display settings should not be handled as though they have the same sensitivity. A separate object kind helps applications reference sensitive values and lets operators manage access more deliberately. It is still only one part of protecting a secret.',
    how: 'A Secret stores data that workloads can reference. Creating credentials does not automatically connect it to web. Its encoded representation is not proof of encryption or safe access control. Permissions, storage encryption and operational handling remain important in a real cluster.',
    practice: 'Create the Secret using only the supplied demo-only value. Find the separate resource in the inventory without expecting a new application process. You have established a named dependency that a workload can consume later, not made a real password safe merely by choosing this kind.'
  },
  54: {
    title: 'Base64 is not encryption',
    steps: ['Inspect the credentials Secret as YAML.'],
    caution: 'Do not share real Secret YAML in logs, screenshots or issues. Someone able to read the encoded value can recover its original contents.',
    why: 'A value can look unreadable without being protected. Changing its representation is like writing the same information in another alphabet, not putting it behind a lock. This distinction is essential when examining Secret data.',
    how: 'Secret data in YAML is commonly represented with base64 encoding. Encoding makes bytes convenient to transport in text; it does not require a secret key to reverse. Authorization determines who can read the object, while encryption and storage controls address other risks.',
    practice: 'Read credentials as YAML and recognize the encoded data field. Use only the prepared demonstration value. The lesson is not to collect passwords, but to avoid mistaking an unfamiliar-looking string for confidential ciphertext or a safe thing to paste into a public report.'
  },
  55: {
    title: 'A missing reference blocks startup',
    steps: ['Inspect the Pod statuses.', 'Create the missing credentials Secret.'],
    caution: 'References are namespace-scoped. A Secret with the right name in another namespace does not satisfy this workload’s dependency.',
    why: 'An application may have a valid package and a suitable machine, yet be unable to start because a required input is missing. Fixing the image would not address that problem. First identify which dependency the workload is waiting for.',
    how: 'The prepared Deployment references credentials for its environment, but that Secret does not exist. The model reports a configuration startup error. Supplying the correct object in the correct namespace lets the containers receive their required input.',
    practice: 'Observe the failing Pod statuses, then create credentials with the provided dummy password. Watch the application become ready without changing its image. You are repairing a missing reference, not a network route or a resource-capacity problem.'
  },
  56: {
    title: 'New configuration needs a new process',
    steps: ['Apply the updated settings.yaml.', 'Restart web’s rollout to refresh its environment.', 'Verify the rollout.'],
    caution: 'Mounted ConfigMap files have different update rules and delays; subPath mounts do not receive automatic updates. This lab focuses on environment snapshots.',
    why: 'Updating the place where settings are stored does not necessarily update the processes that already read them. Think of a printed instruction sheet: changing the master copy leaves earlier printouts unchanged. A fresh startup can load the new value.',
    how: 'Environment values from a ConfigMap are captured when containers start. Applying settings.yaml updates the source data. A rollout restart then replaces web’s Pods so their new processes receive the updated environment. These are two separate operations.',
    practice: 'Apply the maintenance setting, restart the workload and inspect rollout status. Distinguish the data update from the consumer refresh. The application image does not need to be rebuilt, but the old processes do need replacement in this particular consumption model.'
  },
  57: {
    title: 'Requests: the language of placement',
    steps: ['Set web’s CPU and memory requests.'],
    caution: 'Requests guide scheduling; they are not measurements of current use. Real allocatable capacity also accounts for system reservations.',
    why: 'Before assigning several jobs to a machine, a planner needs an estimate of what each will require. Resource requests express that planning budget. Without it, apparent spare capacity and safely placeable work are easy to confuse.',
    how: 'CPU and memory requests are recorded in the Pod template and considered during scheduling. 100m is one tenth of a CPU, while 64Mi describes a memory quantity. Each replica carries its own request; these values are not a live performance reading.',
    practice: 'Set the requested CPU and memory values on web. Watch the resource-reservation view and inspect the workload definition. Explain the difference between what the scheduler budgets and what the application is currently consuming. This task changes the former, not a synthetic traffic load.'
  },
  58: {
    title: 'Limits: understanding the upper boundary',
    steps: ['Set web’s CPU and memory limits.'],
    caution: 'Real CPU limits can cause throttling and memory limits can lead to OOM termination. This browser model does not enforce kernel resource controls.',
    why: 'Reserving enough capacity for a job and restricting how much it may consume are different policies. Requests help choose a home; limits describe an upper boundary. Treating them as synonyms can lead to misleading capacity plans.',
    how: 'Limits are recorded alongside requests in a container’s resource configuration. In a real runtime, CPU and memory limits have different enforcement behavior. The lab models the fields and their relationship, not actual CPU throttling or memory pressure.',
    practice: 'Add the specified upper boundaries to web and inspect them together with its requests. Do not read a configured limit as current usage or as a guarantee that the application can perform well within it. The goal is to identify which field supports placement and which constrains consumption.'
  },
  59: {
    title: 'Pending: nowhere suitable to run',
    steps: ['Read the scheduling events.', 'Correct web’s oversized resource request.'],
    caution: 'Do not blindly reduce production requests to make Pods fit. Measure requirements and add capacity when the original request is justified.',
    why: 'A job can wait even when machines appear idle if its declared needs exceed every machine’s capacity. That is a placement problem, not necessarily a broken application. The scheduler’s evidence helps you tell the difference.',
    how: 'The prepared workload requests more CPU than either two-CPU node can provide. Its Pods remain Pending. Events explain the failed placement. This scenario deliberately contains an incorrect request, so correcting that value gives the scheduler a feasible placement.',
    practice: 'Read the events before changing anything, then set the provided smaller CPU and memory request. Watch the Pods become schedulable and ready. You are correcting a known lab mistake; in a real system, the right answer might instead be larger nodes or fewer concurrent workloads.'
  },
  60: {
    title: 'Give a node a selectable property',
    steps: ['Label worker-2 with disk=ssd.'],
    caution: 'A label is a declaration, not hardware verification. Restrict who may set labels used for sensitive workload-placement decisions.',
    why: 'Machines can differ in useful ways: disk type, location or specialized hardware. A planner needs a way to describe those properties before a workload can request them. Labels provide that vocabulary without moving any work by themselves.',
    how: 'A node label is key-value metadata. disk=ssd makes worker-2 selectable by that condition. Adding the label does not install a disk, verify the hardware or automatically relocate existing Pods. It simply supplies a property that placement constraints can refer to.',
    practice: 'Label worker-2 and inspect the node’s metadata. Notice that the action changes a description rather than starting an application. In the next lab, you will connect a workload’s requirement to this property and observe the scheduling consequence.'
  },
  61: {
    title: 'Choose a particular node group',
    steps: ['Label worker-2 with disk=ssd.', 'Apply the SSD-selecting Pod manifest.'],
    caution: 'nodeSelector is a hard placement requirement. A Pod can remain Pending when no suitable node matches; affinity is not fully modeled here.',
    why: 'Some work needs a machine with a specific property rather than any available machine. After giving nodes descriptive labels, you can state that requirement in a workload. This links the description of a machine to an actual placement decision.',
    how: '`nodeSelector` requires a Pod’s node to match the specified labels. The fast Pod in ssd.yaml asks for disk=ssd. The scheduler still needs capacity on a matching node; a selector narrows the candidates rather than creating resources or adding hardware.',
    practice: 'Prepare the label on worker-2, then apply ssd.yaml. Watch fast appear on the matching node. Compare the node metadata with the Pod’s requirement. Neither a Pod name nor an image name caused that placement: the label-selector relationship did.'
  },
  62: {
    title: 'Taints: not every workload belongs here',
    steps: ['Add the dedicated=gpu:NoSchedule taint to worker-1.'],
    caution: 'NoSchedule blocks new placement but does not evict already-running Pods. NoExecute behavior is outside this model.',
    why: 'Sometimes the default should be to keep ordinary work away from a specialized machine. Requiring every unrelated workload to explicitly avoid it is inconvenient. A taint lets the node announce a restriction that workloads must tolerate.',
    how: 'A NoSchedule taint prevents new Pods without a matching toleration from being scheduled onto the node. This is a repelling rule, not a selection preference. It also does not mean existing Pods are removed as soon as the taint is added.',
    practice: 'Add the dedicated=gpu restriction to worker-1 and inspect its node details. Distinguish the new placement rule from eviction. No new workload is required in this task; the next level will show how a deliberately qualified Pod can tolerate that restriction.'
  },
  63: {
    title: 'A toleration permits; it does not promise',
    steps: ['Taint worker-1 for dedicated GPU work.', 'Apply the matching gpu-task Pod manifest.'],
    caution: 'Avoid unnecessarily broad tolerations. Tolerating a taint alone does not force placement on that node.',
    why: 'Being allowed into a room does not mean you have been assigned to it. Tolerations and selectors express that same distinction: one removes an obstacle, while the other identifies a required destination.',
    how: 'A toleration lets a Pod pass a matching taint restriction. It does not by itself attract the Pod to the tainted node. In this scenario, gpu-task also has a node-selection requirement for worker-1, so permission and selection work together.',
    practice: 'Apply the taint, then the prepared gpu.yaml manifest. Watch gpu-task reach worker-1. Explain both reasons: the toleration permits placement despite the taint, and the node selector chooses the destination. Capacity and other constraints would still matter in a real cluster.'
  },
  64: {
    title: 'A budget for a namespace',
    steps: ['Apply the namespace quota manifest.', 'Inspect the team-budget ResourceQuota.'],
    caution: 'A quota is an admission budget, not a way to resize existing Pods. This model enforces Pod counts rather than every real ResourceQuota dimension.',
    why: 'Even when a cluster has spare capacity, one team may need a usage budget so it cannot consume everything. A namespace quota expresses that shared-environment boundary separately from the hardware capacity of individual nodes.',
    how: 'ResourceQuota limits selected resource totals inside a namespace. The prepared policy limits the Pod count to four. Admission checks the budget when resources are created; it does not manufacture capacity or change each Pod’s CPU and memory settings.',
    practice: 'Apply quota.yaml and inspect team-budget’s configured allowance and usage. You do not need to force a fifth Pod into the namespace in this task. Learn to distinguish the team-level budget from the per-container request and the node’s available capacity.'
  }
};
