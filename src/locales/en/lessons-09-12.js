export default {
  65: {
    title: 'Is Running enough?',
    steps: ['Apply the Deployment with a readiness probe.'],
    caution: 'A failed readiness check normally removes a Pod from ready Service targets; it is not a reason to restart the container.',
    why: 'A shop can have its lights on before it is ready to serve customers. Likewise, an application process may be running while it is still preparing connections or loading data. We need to separate “is it alive?” from “can it handle a request?”',
    how: 'A readiness probe checks whether a container is ready for traffic. An HTTP probe checks a particular path and port. Failing readiness keeps the Pod out of normal ready Service targets without itself restarting the container. This example checks the nginx root path.',
    practice: 'Apply ready.yaml and inspect the readinessProbe in the template. Watch both replicas become ready. Read the ready count, not just the Running label. The model shows the relationship immediately rather than running real probe intervals and timeouts.'
  },
  66: {
    title: 'Running, but receiving no traffic',
    steps: ['Inspect the Pod running states.', 'Read the empty ready-endpoint list as YAML.'],
    caution: 'Direct Pod-IP access may bypass a Service’s readiness selection. Readiness is not an access-control or security boundary.',
    why: 'When an application appears to run but receives no requests, a network failure is not the only explanation. The system may deliberately exclude an instance that reports it is not ready. Learn to read those two facts together.',
    how: 'The Pod’s Running phase and Ready condition answer different questions. This workload checks /broken, which the example application does not serve successfully. The containers can run while the Service has no ready targets. The model exposes that distinction in its endpoint view.',
    practice: 'Compare the Pod status and readiness columns, then inspect the EndpointSlice YAML. Do not fix anything in this level: observe how a running process and an empty ready-target list can coexist. That evidence points toward readiness configuration rather than proving the application package is missing.'
  },
  67: {
    title: 'Repair the probe path',
    steps: ["Set the readiness path in ready.yaml to /, save it, and apply it.", "Verify a healthy response through the Service."],
    caution: 'Choose real probe paths, timeouts and thresholds for your application. The root path is appropriate for this prepared nginx example, not a universal health endpoint.',
    why: 'A health check knocking on the wrong door can mark a healthy application unavailable. Restarting unrelated components will not fix the address of that check. Make the narrow correction that the evidence supports.',
    how: "A readiness probe must check an endpoint the application actually serves. Both the live Deployment and ready.yaml currently use the incorrect /broken path. Repair readinessProbe.httpGet.path in the saved definition. Instances produced from the corrected template can become ready Service targets.",
    practice: "Open ready.yaml in Files, change the readiness path to /, and save. Apply it in the terminal, then request web through the Service. The saved file, ready replicas and successful request are all checked. Here / suits this nginx example; repair the check instead of removing it.",
    hints: ["In Files, locate readinessProbe.httpGet.path. Repair readiness rather than adding liveness; saving the file and applying it are separate actions.", null],
    syntaxHints: ["readinessProbe.httpGet.path: / → save → kubectl apply -f ready.yaml", null],
  },
  68: {
    title: 'Liveness: deciding when to restart',
    steps: ['Inspect the reason web is restarting.', 'Read logs from the previous container instance.'],
    caution: 'Treating an external database outage as a liveness failure can create a restart storm. Keep liveness and readiness responsibilities separate.',
    why: 'A process can be alive but stuck, and a restart may help it recover. However, a badly designed health check can repeatedly terminate a healthy process and create its own incident. First learn what the restart decision is based on.',
    how: 'A liveness probe can trigger a container restart after its failure threshold is exceeded. Unlike readiness, its purpose is not traffic selection. Here the liveness path is /broken. `logs --previous` reads the terminated container instance’s records rather than only the current one.',
    practice: 'Describe web, then read the previous logs. Connect the probe definition, restart information and application evidence. This level asks for diagnosis only. Consider why a dependency being temporarily unavailable should not automatically cause every otherwise healthy application process to restart.'
  },
  69: {
    title: 'Stop the restart storm',
    steps: ['Apply the corrected liveness definition.', 'Verify that the rollout completes.'],
    caution: 'The simulation shows a simplified relationship between a failed check and restarts. It does not run real kubelet backoff timers.',
    why: 'When the fault is in the health-check configuration, changing the application package may miss the cause. After diagnosis, a small correction is easier to explain and verify than rebuilding the whole workload.',
    how: 'web has a liveness check pointed at an invalid path. live.yaml provides the intended path and probe settings in its Pod template. Applying that definition produces replacement instances, and rollout status checks whether the target is now available.',
    practice: 'Apply live.yaml and verify web’s rollout. Identify the changed liveness setting rather than expecting a new image version. The lab does not wait through real backoff intervals; it demonstrates the effect of correcting the check that was causing unnecessary restarts.'
  },
  70: {
    title: 'Give a slow application time to start',
    steps: ['Read the startup probe definition.', 'Apply the Pod with a startup budget.'],
    caution: 'The lab does not actually wait 150 seconds. A startup probe and a readiness probe answer different questions.',
    why: 'Some applications load substantial data before they can operate. Judging them too early by normal running-health checks can restart them before they ever finish starting. A separate startup budget allows that preparation without weakening ongoing checks forever.',
    how: 'A startup probe holds off liveness and readiness probes until startup succeeds. In this file, periodSeconds: 5 and failureThreshold: 30 describe an approximately 150-second failure budget. That calculation is a useful model, not an exact wall-clock guarantee in every situation.',
    practice: 'Read startup.yaml and interpret those two fields, then create slow from the manifest. Distinguish “has startup completed?” from “can this instance receive traffic now?” This task teaches the configuration; it does not reproduce a real 150-second startup process.'
  },
  71: {
    title: 'Preparation before the application',
    steps: ['Apply the Pod containing an init container.', 'Advance its preparation with a lab tick.'],
    caution: 'lab tick is a learning helper, not kubectl. In a real cluster, kubelet observes init completion without a user manually approving it.',
    why: 'A job may need its workspace prepared before it can begin. An application can have similar startup prerequisites. Making preparation a separate stage is clearer than hiding every prerequisite in one large startup command.',
    how: 'Regular init containers run in sequence and must complete successfully before the application containers start. The prepared manifest contains a small initialization step. The real kubelet observes completion; this model uses a logical tick to make the dependency visible.',
    practice: 'Apply init.yaml, observe the initial pending state, and advance the model with lab tick. Watch the application become ready after preparation completes. What matters is the ordering relationship, not the idea that real Kubernetes needs a manual tick to start applications.'
  },
  72: {
    title: 'Checkpoint: wait for a condition',
    steps: ['Create the healthy web Pod.', 'Verify its Ready condition.'],
    caution: 'wait checks the model’s current condition and returns a simulated timeout on failure. It does not open a real watch connection.',
    why: 'An order being accepted and an order being ready are different moments. Automation should not proceed just because a creation request succeeded. Checking a meaningful condition is more reliable than assuming readiness or sleeping for an arbitrary time.',
    how: '`wait` checks a specified resource condition. Ready is the relevant Pod condition here, and the timeout limits how long a real wait may continue. The browser model evaluates the present state immediately and reports the corresponding simulated result.',
    practice: 'Create web, then verify Ready. Explain why those are separate task steps. You first express an intention and then check its outcome. The same pattern applies later to release availability and batch-job completion, even though the conditions differ.'
  },
  73: {
    title: 'Longer than a container, shorter than a Pod',
    steps: ['Read the emptyDir and mount definition.', 'Apply the Pod using temporary storage.'],
    caution: 'Deleting the Pod removes its emptyDir data. This site models volume definitions and relationships, not real file contents.',
    why: 'Temporary working files may need to survive a process restart without surviving the entire workload instance. Choose storage by the lifetime your data needs, rather than treating every directory as equally persistent.',
    how: 'An emptyDir volume belongs to a Pod’s lifetime. Containers in that Pod can share it, and its data can survive a container restart, but it is lost when the Pod is removed. volumes defines the volume; volumeMounts describes its location inside a container.',
    practice: 'Find cache in the volume definition and in the /cache mount in scratch.yaml, then apply it. Trace the relationship between those fields. No real files are written here, and emptyDir should not be mistaken for a backup or storage independent of the Pod.'
  },
  74: {
    title: 'Ask for storage with a PVC',
    steps: ['Apply the data claim requesting 1Gi.', 'Verify the PVC status.'],
    caution: 'A real claim can remain Pending when provisioners or capacity are unavailable. This lab allocates no physical disk.',
    why: 'You may need data to outlive a replaceable application instance. Separating an application’s storage request from the infrastructure that supplies it makes this requirement easier to express and manage.',
    how: 'A PersistentVolumeClaim, or PVC, requests properties such as capacity and access mode. A PersistentVolume, or PV, represents supplied storage. A StorageClass describes provisioning behavior. When a suitable resource is assigned, the claim becomes Bound.',
    practice: 'Apply claim.yaml for data’s 1Gi request and inspect its status. The model has a prepared standard class and synthetic provisioner, so binding can succeed. Recognize that the same manifest on another real cluster might wait for infrastructure that this training environment assumes is available.'
  },
  75: {
    title: 'Match the claim to its volume',
    steps: ['Inspect the bound data claim.', 'List PersistentVolumes as YAML.'],
    caution: 'ReadWriteOnce generally means read-write mounting from one node, not necessarily one Pod. ReadWriteOncePod is a separate access mode.',
    why: 'After a storage request is fulfilled, you should be able to identify which resource satisfies which claim. Keeping those as separate objects divides the application requirement from the infrastructure responsibility.',
    how: 'A Bound PVC is associated with a PV. Pods usually refer to a PVC rather than choosing a PV directly. The PV’s claim reference identifies the claim and namespace it serves. Capacity, class and access modes form part of that storage contract.',
    practice: 'Describe data, then inspect PV YAML. Match the claim’s name and namespace to the reference on the volume. You are reading ownership and allocation, not testing data contents. Avoid interpreting an access-mode label as more specific than its actual node or Pod scope.'
  },
  76: {
    title: 'A pending claim with the wrong class',
    steps: ['Inspect the Pending data claim.', 'Remove the unused incorrect claim.', 'Recreate it with the correct StorageClass.'],
    caution: 'Deleting a used or bound PVC can cause data loss. This scenario deliberately uses an empty, unbound claim; do not generalize the deletion approach to live data.',
    why: 'An order for a service that does not exist can wait indefinitely. A storage claim requesting a nonexistent class has a similar problem. Diagnose the missing class before choosing a repair appropriate for the data’s actual state.',
    how: 'storageClassName selects the requested provisioning class. data asks for nonexistent, so it remains Pending. This particular claim is unused and has no bound data. The exercise replaces it with a correct definition rather than pretending an immutable storage property can always be patched.',
    practice: 'Inspect the failed claim, remove this unused one, and apply claim.yaml with standard. Verify Bound afterward. The safe scope is important: a real migration of data-bearing storage needs a separate preservation and recovery plan, not blind deletion.'
  },
  77: {
    title: 'Mount the claim into a container',
    steps: ['Apply the Pod that uses the data PVC.'],
    caution: 'The site does not mount real disks or enforce filesystem permissions. Durability still depends on the storage backend, reclaim policy and backups.',
    why: 'Allocating storage does not tell an application where to find it. The workload needs a connection from its storage claim to a directory inside its container. Now you will describe that last part of the relationship.',
    how: 'The Pod’s volumes section references a PVC through claimName. A container’s volumeMounts section maps that volume name to a path. Here the requested claim is data and the application path is /data. Volume names and claim names describe different fields even when their spelling matches.',
    practice: 'Apply storage-pod.yaml and inspect writer’s volume-to-claim-to-mount relationship. Watch the Pod become ready. Bound and Ready indicate modeled resource conditions; they do not by themselves prove that real data has been written, verified or backed up.'
  },
  78: {
    title: 'StatefulSet: order and identity',
    steps: ['Apply the headless Service and StatefulSet.'],
    caution: 'A StatefulSet does not automatically configure database replication or backups. The model demonstrates ordinal identities rather than complete OrderedReady behavior.',
    why: 'Some applications need recognizable members rather than interchangeable anonymous copies. Stable names and ordering can matter to a system that tracks particular participants. StatefulSet addresses that identity requirement.',
    how: 'A StatefulSet manages ordinal Pod names such as db-0 and db-1. A headless Service supports member discovery without the usual single ClusterIP front door. Stable identity is useful, but it does not itself implement the application’s data replication or recovery protocol.',
    practice: 'Apply stateful.yaml with its headless Service and two-member StatefulSet. Compare the Pod names with Deployment-generated names. This lab teaches the identity model, not a functioning database cluster or a full ordered-startup and storage implementation.'
  },
  79: {
    title: 'The next ordinal',
    steps: ['Scale the db StatefulSet to three replicas.'],
    caution: 'PVC lifetimes during scale-down or StatefulSet deletion depend on retention settings. A stable name alone is not a data-safety guarantee.',
    why: 'Adding a member to an identity-sensitive application should not randomly rename all the existing members. You want additional capacity while preserving recognizable participants. Observe how ordinal naming handles that change.',
    how: 'Increasing a StatefulSet’s replica count creates the next ordinal member. A two-member db group gains db-2 while db-0 and db-1 remain. This naming convention does not distribute database data or configure replication; the application still owns those responsibilities.',
    practice: 'Scale the prepared db group to three. Identify the new db-2 and confirm the earlier identities remain recognizable. Separate the management of member count and names from the unmodeled tasks of joining a database, transferring data and verifying consistency.'
  },
  80: {
    title: 'Checkpoint: recreate the identity',
    steps: ['Delete db-0 and observe its replacement.', 'Verify that the data PVC remains Bound.'],
    caution: 'This scenario compares object lifetimes. It does not prove database recovery or the correctness of stored data.',
    why: 'A shop can reopen under the same name even though the physical instance has changed. A replaced StatefulSet Pod has a similar distinction: a stable visible name does not mean it is the same object as before.',
    how: 'The controller creates a new Pod named db-0 after the old one is removed. In real Kubernetes, its UID changes. The separate data PVC in this lab has its own lifetime. Its continued existence does not prove that db-0 was writing data to that claim.',
    practice: 'Delete db-0, watch the ordinal name return, and inspect data’s Bound state. Compare name stability, object replacement and storage-resource lifetime without conflating them. The exercise demonstrates management relationships rather than reading disk data or recovering a real database.'
  },
  81: {
    title: 'Give a workload an identity',
    steps: ['Create the reader ServiceAccount.'],
    caution: 'Real access requires authentication and authorization together. This training model issues no actual tokens.',
    why: 'An application that talks to the Kubernetes API needs an identity. Having an identity is not permission to perform every operation. Keeping those ideas separate is the first step toward granting only the access a workload needs.',
    how: 'A ServiceAccount is a namespace-scoped identity for workloads, not the same kind of object as a human user account. Authentication asks who is making a request; authorization asks what that identity may do. Creating the account alone does not grant broad Pod access.',
    practice: 'Create reader and locate it in Resources. Do not add a role or binding yet. The following labs build identity, permission definition and assignment as separate pieces, making it easier to diagnose missing access without reflexively granting administrator privileges.'
  },
  82: {
    title: 'Role: what may be done?',
    steps: ['Create reader with get and list permissions on Pods.'],
    caution: 'Wildcard permissions are convenient but can grant more than required. Start narrowly and expand only for demonstrated needs.',
    why: 'An observer may need to read a list without being able to delete its contents. Expressing that requirement as a narrow list of actions avoids unnecessary power. First we will define permissions independently of who receives them.',
    how: 'A Role specifies allowed verbs on resource kinds within a namespace. get reads one Pod; list reads a collection. Creating this Role records the permission definition, but does not assign it to a ServiceAccount by itself.',
    practice: 'Create reader with only the requested read verbs for pods. Inspect the distinction between the resource and the operations. There should be no delete or modification permission. The next step will connect this narrow definition to the intended workload identity.'
  },
  83: {
    title: 'Binding: who may do it?',
    steps: ['Bind reader to the default:reader ServiceAccount.'],
    caution: 'A RoleBinding references permissions through roleRef. A subject with the wrong namespace is a different identity, even if its name matches.',
    why: 'Writing a job description does not assign anyone to that job. Likewise, a Role and a ServiceAccount can exist separately without granting access between them. Their relationship needs an explicit assignment.',
    how: 'A RoleBinding points to a permission definition with roleRef and to receiving identities with subjects. Here reader refers to the ServiceAccount in default. The namespace is part of that identity; another reader account elsewhere is not automatically the same subject.',
    practice: 'Create reader-binding between the prepared role and account. Inspect roleRef and subjects as distinct links. You are assigning existing permissions rather than writing a new permission list. The next lab verifies the effective result instead of trusting names alone.'
  },
  84: {
    title: 'Ask about permission instead of guessing',
    steps: ['Verify that reader may list Pods.'],
    caution: 'Real --as impersonation requires its own authorization. This lab conceptually performs the query from an administrator’s perspective.',
    why: 'It is safer to ask whether an operation is allowed than to infer it from one configuration file. A missing binding or incorrect subject can invalidate an otherwise plausible setup. Effective-permission checks expose that gap.',
    how: '`auth can-i` asks whether an identity may perform an action on a resource. `--as` chooses the identity whose access is being checked. The query evaluates authorization; it does not itself fetch the Pod collection or change its contents.',
    practice: 'Ask whether reader can list pods and expect yes from the prepared binding. Identify the subject, verb and resource in the command. You will keep the identity constant in the next lab and change only the requested action to test the intended boundary.'
  },
  85: {
    title: 'Read, but not delete',
    steps: ['Verify that reader cannot delete Pods.'],
    caution: 'RBAC permissions are additive. Another binding can grant an action absent from this Role, so inspect effective access rather than one file alone.',
    why: 'A secure setup needs both necessary operations to work and unnecessary operations to remain unavailable. A reader being unable to delete is a success condition, not evidence that the application’s identity is broken.',
    how: 'reader has get and list, but no delete permission in this scenario. Asking about another verb can therefore return a different answer for the same identity. Other bindings could add access in a real cluster, which is why checking the effective result matters.',
    practice: 'Query delete pods for reader and verify no. The permission query itself succeeds; its answer is negative. Do not try to delete an object to prove this task, and do not expand the role to make the answer yes. The denied operation is the boundary you intend to preserve.'
  },
  86: {
    title: 'Take back unnecessary permission',
    steps: ['Apply the narrower get/list-only Role.', 'Verify that deletion is no longer allowed.'],
    caution: 'Review dependent workflows before reducing permissions. Real RBAC API-group and subresource matching is more detailed than this model.',
    why: 'A workload may have been granted too much access during setup. Repairing that does not have to mean disabling every useful operation. Preserve what is required while removing the unnecessary privilege.',
    how: 'The prepared reader Role also allows delete. reader-role.yaml replaces it with read-only permissions. Bindings that reference the Role use the updated permission definition. Other grants could still affect the result, so a follow-up effective-access query is important.',
    practice: 'Apply the narrow Role and check that reader cannot delete Pods. You changed permissions without deleting the identity or binding. In this known scenario deletion is unnecessary; outside the lab, first assess applications that may depend on a permission before removing it.'
  },
  87: {
    title: 'Reduce container privileges',
    steps: ['Read the security context.', 'Apply the Pod with restricted privileges.'],
    caution: 'Runtime and kernel behavior enforce these settings in reality. The image must support non-root execution; this site does not test operating-system isolation.',
    why: 'What an application may do through the API is different from its privileges inside the operating system. Avoiding unnecessary administrator-like powers can limit the consequences of an application defect. SecurityContext controls that separate layer.',
    how: 'The example requests non-root execution, disallows privilege escalation, makes the root filesystem read-only and drops Linux capabilities. These restrictions describe the container’s execution environment. They do not replace RBAC permissions, network policy or an image designed to work under those restrictions.',
    practice: 'Read secure.yaml, identify its Pod and container security fields, and apply it. Interpret the values as a defense-in-depth definition. A successful model result is not proof of a real kernel sandbox or evidence that an arbitrary image will run correctly without writable paths.'
  },
  88: {
    title: 'Do not mount an unnecessary token',
    steps: ['Apply the Pod with automatic token mounting disabled.'],
    caution: 'Disabling this mount does not disable networking or revoke credentials supplied by another route. Keep the scope of each control clear.',
    why: 'An application that never uses the Kubernetes API may not need API credentials in its workspace. Not supplying an unused key removes an unnecessary access path. This is different from handing out a powerful key and hoping it is never used.',
    how: '`automountServiceAccountToken: false` disables the default ServiceAccount token mount for this Pod. It is not a network firewall or a blanket revocation of every possible credential. Identity, authorization, token delivery and network access are separate controls.',
    practice: 'Create public-web from no-token.yaml and inspect the false value in the Pod definition. The task does not require a broader role or another Service. You are deliberately withholding an access mechanism that this particular workload does not need.'
  },
  89: {
    title: 'A task that finishes, not an endless service',
    steps: ['Create the report Job.', 'List the active Job.'],
    caution: 'A Job may retry. Design its work so repeating the same input is safe rather than assuming exactly-once execution.',
    why: 'A web server should stay available, but a report generator should eventually finish. Repeatedly restarting a successful report just because its process exited would be the wrong lifecycle. Jobs express work whose useful outcome is completion.',
    how: 'A Job manages Pods expected to finish successfully. Their completion result matters more than maintaining a permanently running server count. Because work can be retried, application logic should account for duplicate execution and external side effects.',
    practice: 'Create report with its prepared container command, then inspect the Job list. This level observes the active definition; the next advances its completion. Distinguish kubectl’s options from the command after --. The browser models the task without creating a real report file.'
  },
  90: {
    title: 'Successful is not the same as ready',
    steps: ['Advance the Job to completion in the model.', 'Verify report’s Complete condition.'],
    caution: 'The sample success path finishes with one logical tick. In reality, application runtime and exit status determine completion.',
    why: 'For a report, a process waiting to serve requests is not the desired result: the finished work is. The condition you check should reflect that lifecycle. A service-readiness check would answer the wrong question for a completed batch task.',
    how: 'A successful Job reports completed work and a Complete condition. Its Pod may be Succeeded without needing to restart like a continuously running service. Waiting for Complete therefore differs from waiting for a Pod’s Ready condition.',
    practice: 'Advance the prepared report Job with lab tick, then query Complete. One step moves this educational model forward; the other verifies its state. A real Kubernetes job is not completed by a user typing lab tick, but by the application finishing its work successfully.'
  },
  91: {
    title: 'Parallelism is not the total target',
    steps: ['Read the parallel Job definition.', 'Apply the Job with two workers and four required completions.'],
    caution: "Each lab tick completes only the workers currently running. Two workers need two steps for four completions; Pending or blocked workers are never counted as successful.",
    why: 'Two people can move four boxes. The amount of work and the number of workers doing it simultaneously are different numbers. Batch scheduling uses that distinction to control resource use while describing a larger overall task.',
    how: "parallelism limits active workers; completions is the total success target. The prepared Job allows two workers and asks for four completions. Each logical tick finishes the already running batch and lets the controller create any next batch. This models the two separate counts without running real processes.",
    practice: "Read parallel.yaml, then apply it and inspect the two active workers and four-completion target. You can experiment with two lab ticks to see the batches finish. Workers that cannot start must be repaired first; a missing image or dependency cannot be turned into success by advancing the teaching clock.",
  },
  92: {
    title: 'Do not retry forever',
    steps: ['Apply the bounded retry policy.', 'Inspect the bounded Job.'],
    caution: 'The model records these policy fields but does not run real retry, backoff or deadline timers.',
    why: 'An endlessly failing job can waste resources and delay recovery. Limiting the number of retries and limiting total elapsed work address different risks. Express both deliberately rather than treating them as the same budget.',
    how: 'backoffLimit bounds retry behavior after failures. activeDeadlineSeconds limits the Job’s overall active time. bounded.yaml carries a retry limit of two and a 120-second time budget. One value concerns attempts; the other concerns time.',
    practice: 'Apply bounded.yaml and describe bounded. Locate both policy fields and explain what each limits. You will not actually wait 120 seconds or generate repeated failures here. The exercise teaches how to read a bounded work definition, not the real controller’s timer implementation.'
  },
  93: {
    title: 'Put work on a schedule',
    steps: ['Create backup with a schedule every five minutes.'],
    caution: 'CronJob is not an exactly-once guarantee. Consider repeat safety, time zones, missed schedules and task duration.',
    why: 'Some tasks should begin periodically instead of running continuously, such as a regular backup. A schedule is not the same object as one execution. First define the recurring plan, which can produce separate runs over time.',
    how: 'A CronJob creates Jobs according to its schedule expression. `*/5 * * * *` describes five-minute intervals, and its spaces mean the expression must be passed as one command argument. The resulting runs still need safe behavior when duplicated or retried.',
    practice: 'Create backup with the supplied schedule and inspect its definition. This browser does not run a real wall-clock scheduler. Explain how a reusable job template plus a recurring plan differs from one endlessly running container. Later tasks examine overlap and manual execution.'
  },
  94: {
    title: 'Prevent overlapping scheduled runs',
    steps: ['Set backup’s concurrency policy to Forbid.'],
    caution: 'Forbid does not lock unrelated CronJobs against each other. This site models policy definitions rather than real schedule timing.',
    why: 'A task scheduled every five minutes might take ten minutes to finish. Those runs can overlap unless you choose a policy for that situation. Scheduling frequency and concurrency policy answer different operational questions.',
    how: '`concurrencyPolicy: Forbid` prevents a new scheduled run of the same CronJob while its earlier Job remains active. Allow permits overlap, while Replace requests replacement behavior. This policy is scoped to the CronJob’s scheduled runs, not every job in the cluster.',
    practice: 'Change backup’s policy to Forbid. Notice that you changed overlap behavior, not the schedule expression. There is no real timing race in this model. The goal is to recognize the policy decision that becomes important when a job takes longer than its scheduling interval.'
  },
  95: {
    title: 'Try the job without waiting for its schedule',
    steps: ['Create backup-now from the backup CronJob.', 'Advance the new Job to completion.'],
    caution: 'A manually created Job can still cause real external side effects or overlap with scheduled work. The data and execution here are synthetic.',
    why: 'You may want to test scheduled work now without altering when it normally runs. Creating one separate execution from the same template is clearer than changing the recurring schedule just for a trial.',
    how: '`--from=cronjob/backup` uses the existing Job template to create a distinct Job named backup-now. The CronJob’s schedule remains unchanged. The manual run has its own identity, and real effects or overlap still require operational care.',
    practice: 'Create backup-now from backup, then advance the educational model with lab tick. Distinguish the unchanged schedule object from the new execution. No real backup is produced: you are learning the relationship between a reusable plan, a particular run and its completion.'
  },
  96: {
    title: 'Checkpoint: pause new scheduled work',
    steps: ['Suspend new backup scheduling.', 'Verify the CronJob definition.'],
    caution: 'Resuming a real CronJob interacts with missed schedules and startingDeadlineSeconds. Suspension is not cancellation of already-running Jobs.',
    why: 'During maintenance, you might want no new work to begin while allowing existing work to finish. Pausing a schedule and canceling active tasks are different intentions. This checkpoint pauses future scheduling without deleting the plan.',
    how: '`suspend: true` stops new scheduled Jobs from being created by the CronJob. It does not automatically terminate existing Jobs or erase the schedule expression. When resuming a real schedule, missed runs and start-deadline policies require separate consideration.',
    practice: 'Set backup’s suspend field, then read its YAML. Verify that the schedule is still present and suspension is enabled. Separate future execution intent from the lifetime of active or historical Jobs. The model exposes the policy without actually running a recurring clock.'
  }
};
