// Presentation only: IDs, commands, goals, seed resources and manifests stay canonical.
export default {
  1: {
    title: 'One image, many possibilities',
    steps: ['Pull the nginx:1.27 image into the local store.', 'Check the local image list.'],
    caution: 'This site downloads no images. Real tags can change; use a verified digest when you need reproducible content.',
    why: 'Moving an application to another computer takes more than copying its code. It also needs its files, dependencies and startup instructions. Think of these as a portable package. Having the package does not mean the application is running: that is the distinction we will establish first.',
    how: 'An image is that read-only package and template. A registry stores images. In `nginx:1.27`, nginx is the repository name and 1.27 is the selected tag. A `pull` brings the image into your local store; it does not create a running container.',
    practice: 'Pull nginx, then inspect the image inventory. Watch the local image store fill while the container area stays empty. At the end you can say “the application package is available,” but not yet “the web server is running.”'
  },
  2: {
    title: 'From a package to a running process',
    steps: ['Start an nginx container named web.'],
    caution: 'A container is not a virtual machine. In a typical Linux setup it shares the host kernel.',
    why: 'A recipe is not the same as the meal being cooked from it. Likewise, an image holds an application’s files and instructions; a running instance gives those instructions a life of their own. Now we will make the difference visible.',
    how: 'A container is an instance started from an image, with its own lifecycle. `run` creates and starts it; a missing local image may be pulled first. `--name` supplies a recognizable instance name, and `-d` requests background execution. The container name and its image reference identify different things.',
    practice: 'Start web from the nginx image. Look for web and its Running status in the container area. The image store still holds the package; the new container is its running instance. That package can be reused to start more instances later.'
  },
  3: {
    title: 'Running, or just present?',
    steps: ['List the running containers.', 'Inspect the image used by the web instance.'],
    caution: 'Use docker ps -a or docker ps --all to include stopped containers. Both forms are supported here.',
    why: 'An installed application and an open application answer different questions. Containers have the same distinction: “which packages are available?” is not “which instances are running?” Choosing the right inventory prevents conclusions drawn from the wrong list.',
    how: '`docker images` lists image references, while `docker ps` lists running containers. A list provides a summary; `inspect` opens the details of one instance. Read its name, image and status together to connect a process to the package it came from.',
    practice: 'This lab already has a running web container. List running instances, then find the image in web’s details. You do not need to start anything new. The goal is to read the existing relationship between a stored package and a running process.'
  },
  4: {
    title: 'When a process speaks: logs',
    steps: ['Read the web container logs.'],
    caution: 'Do not write passwords, tokens or personal data to logs. This lab uses synthetic examples.',
    why: 'A running label tells you little about what an application is doing. Startup messages, incoming requests and errors leave useful evidence. Reading those records is a way to investigate without immediately changing the system.',
    how: 'Applications can write messages to standard output and standard error: stdout and stderr. The container runtime makes those streams available as logs. `logs` reads the messages; it does not restart the container or modify its image. Normal activity can be just as informative as errors.',
    practice: 'Open the prepared web container’s logs and read the events it reports. Compare that information with the simple Running label. These records are synthetic, but the habit carries over to Kubernetes: observe what the application said before deciding what to change.'
  },
  5: {
    title: 'The same image, two containers',
    steps: ['Start a second instance named web-copy.', 'List the two running instances.'],
    caution: 'This example publishes no ports. Two real containers cannot bind the same host address and port at the same time.',
    why: 'You may need two independent copies of an application: one for a trial while another keeps serving, or several to share work. You do not have to rebuild the package for every copy. A single template can produce multiple instances.',
    how: 'An image is reusable; each container has its own name and lifecycle. Two containers can use the same image reference. Stopping one does not automatically stop the other. The number of packages and the number of running instances need not match.',
    practice: 'Add web-copy beside the existing web container, then list running containers. Expect two instances but one nginx image reference. This lab is about reusing a package, not publishing network ports. Notice which part of the diagram grows and which stays unchanged.'
  },
  6: {
    title: 'A tag is a reference',
    steps: ['Add the local/web:v1 tag to the image.'],
    caution: 'latest does not guarantee the newest or safest release. A digest addresses content; a registry tag can be reassigned.',
    why: 'Giving a file another name does not rewrite its contents. Image tags provide readable names in a similar way. We will separate changing a reference from building new application content or starting a new process.',
    how: 'A tag is a human-readable reference to an image. Adding `local/web:v1` to the existing nginx image creates another name for the same content. `tag` starts no container. Because tags can be reassigned, an unchanged tag is not a permanent guarantee of unchanged content.',
    practice: 'Give the prepared nginx image the requested additional tag. Watch two references appear in the image store without another container appearing. The key distinction is that a new name does not necessarily mean new content, and certainly does not mean a running application.'
  },
  7: {
    title: 'Stopping is not deleting',
    steps: ['Stop the web container.', 'List containers including the stopped instance.'],
    caution: 'Do not entrust persistent data to a container’s disposable writable layer. Later volume labs separate these lifetimes.',
    why: 'Closing an application is different from uninstalling it. Stopping a container ends its running process, but its record does not immediately disappear. Understanding what still exists matters when you inspect or clean up an environment.',
    how: '`stop` moves a running container into a stopped state. A normal `ps` listing shows only running containers, so web disappears from that view. `--all` includes stopped records too. The image inventory is separate: stopping an instance does not remove its package.',
    practice: 'Stop web, then request a list that includes stopped containers. You should still find its Exited record. Compare the container and image areas, and distinguish “not running,” “not present,” and “its package is unavailable.” Those are three different conditions.'
  },
  8: {
    title: 'Checkpoint: a clean shutdown',
    steps: ['Stop the web process.', 'Remove the stopped web instance.', 'Check that the image is still available locally.'],
    caution: 'Modern Kubernetes nodes use a CRI-compatible runtime. Knowing the Docker CLI is useful, but Docker Engine need not be installed on the node.',
    why: 'After an experiment, stopping the application may not be enough: you may also want to remove the instance’s record. Keeping its package lets you start a fresh instance later. This checkpoint combines the lifecycle distinctions from the first module.',
    how: 'Stop a running container before removing its record. `stop` and `rm` therefore perform different operations. The image belongs to a separate inventory and remains available when the container is deleted. Reusing it later creates a new instance, not the old running process.',
    practice: 'Stop web, remove its stopped record, and inspect the image list. The container area should be empty while nginx remains in the local store. For each action, explain whether you changed the package, the instance’s running state, or the instance’s existence.'
  },
  9: {
    title: 'Where does a command go?',
    steps: ['Read the cluster connection summary.', 'Find the client/server distinction in the version output.'],
    caution: 'The .local addresses on this site are part of a visual model. No requests or credentials are sent to real servers.',
    why: 'Managing work across several machines becomes awkward if you must connect to each one separately. Kubernetes gives you a shared management entry point. You state what you need there; the system coordinates how that request reaches the machines.',
    how: '`kubectl` is your client. The API server accepts requests for the cluster. Other control-plane components store state and reconcile it with reality. A kubectl command is not a shell session opened directly on a worker node.',
    practice: 'Read the connection summary, then inspect the client and server version information. Separate the two sides and their responsibilities. You are not creating a workload yet; you are identifying the management layer that future commands will talk to. The shown addresses make no real connections.'
  },
  10: {
    title: 'Nodes: where workloads live',
    steps: ['List the worker nodes.'],
    caution: 'A Ready node does not guarantee healthy applications. Node health and application readiness are separate questions.',
    why: 'A management layer can plan work, but applications still need machines on which to run. Think of these machines as workstations in a workshop. Their availability is one of the first conditions for placing a workload.',
    how: 'A node is a physical or virtual machine that runs Pods. Its kubelet watches assigned Pods and works with a container runtime to run their processes. Ready means the node is available from the cluster’s perspective, not that every application on it is healthy.',
    practice: 'List the two worker nodes and read their status column. Match the names to the node boxes in the diagram. Before creating a Pod, you can now identify its possible homes. Keep machine health and application health separate as the labs become more complex.'
  },
  11: {
    title: 'Learn to read capacity',
    steps: ['Inspect the details of worker-1.'],
    caution: 'Real capacity and allocatable resources may differ. Account for resources reserved for system components.',
    why: 'Before assigning work to a machine, you need to know what it can accommodate. Just as a bus needs enough seats for its passengers, a node needs capacity for the CPU and memory requests of its workloads.',
    how: 'Node details include CPU, memory, labels and health conditions. The scheduler matches workload requests to suitable nodes. Each worker in this lab has 2 CPU and 2 GiB of memory. These figures describe capacity, not an application’s current consumption.',
    practice: 'Open worker-1’s details rather than relying on its list row. Locate capacity, labels and Ready information. You are gathering evidence, not editing the node. Later, when a Pod cannot be scheduled, you will know which machine properties to inspect.'
  },
  12: {
    title: 'Before writing to the wrong cluster',
    steps: ['Check the active context.', 'List the configured contexts.'],
    caution: 'Here, learning and staging refer to the same simulated cluster with different default namespaces. They are not separate real clusters.',
    why: 'A correct command sent to the wrong environment is still a mistake. You do not want a deletion intended for a test cluster to affect another environment. Build the habit of asking “where am I connected, and as whom?” before making changes.',
    how: 'A context combines a cluster connection, a user identity and a default namespace into a connection profile. `current-context` shows the active profile; `get-contexts` lists available ones. Changing context can change which resources an otherwise identical command addresses.',
    practice: 'Inspect the active context, then the context list. This task asks you to verify your selection, not switch it. In this model, learning and staging use one simulated cluster with different default namespaces; their names alone do not imply different infrastructure.'
  },
  13: {
    title: 'Create your own workspace',
    steps: ['Create the team-a namespace.', 'Verify the namespace list.'],
    caution: 'A namespace alone is not strong security or network isolation. RBAC and NetworkPolicy provide additional controls.',
    why: 'Separate rooms help teams organize their belongings inside one building. Similarly, namespaces organize resource names inside a cluster. Giving a team its own naming scope does not require creating a separate set of physical machines.',
    how: 'A namespace scopes the names of many resource kinds. Two namespaces can each contain a Pod with the same name. Cluster-scoped objects, such as nodes, do not belong inside a namespace. Creating a namespace alone does not block network traffic or configure all access permissions.',
    practice: 'Create team-a and verify it in the namespace list. Notice that the node count stays unchanged: you added a logical scope, not another machine. This distinction will help you find the right team’s resources without confusing organization with infrastructure or security.'
  },
  14: {
    title: 'The same name, a different namespace',
    steps: ['Start the web Pod in staging.', 'List the Pods in staging.'],
    caution: 'No resources found does not always mean a resource is absent. You may be looking in the wrong namespace.',
    why: 'Two people can share a name while belonging to different teams. Resources can likewise share a name across namespaces. Knowing only the name is not enough to identify the intended object; scope belongs in your mental address too.',
    how: '`-n` selects the namespace for one command. web in staging and web in default are different objects. Creating a resource in staging and then searching default can produce an empty list even though creation succeeded.',
    practice: 'Create web in staging, then list Pods in that same namespace. Make the scope consistent across both commands. The lesson is not just how to create a Pod: it is to think of an object as a combination of kind, name and namespace.'
  },
  15: {
    title: 'The API’s vocabulary',
    steps: ['List the available API resource kinds.'],
    caution: 'A real cluster’s resource list depends on its version and installed CRDs. This lab models only its documented subset.',
    why: 'You do not need to memorize a tool’s whole vocabulary before using it. Kubernetes describes running applications, network access and configuration with different object kinds. Learning to ask which kinds exist is more useful than guessing names.',
    how: 'API resources are the kinds of objects a cluster recognizes, including Pods, Services and Deployments. `api-resources` lists those kinds and, on a real cluster, details such as short names. It describes the vocabulary, not the individual objects currently in the cluster.',
    practice: 'List the supported resource kinds and find familiar names. Compare this with `get pods`: one asks which kinds can exist; the other asks which Pod instances currently exist. Here you see the educational model’s vocabulary, not every resource a real cluster might support.'
  },
  16: {
    title: 'Use the schema, not your memory',
    steps: ['Explain the Pod container fields.'],
    caution: 'explain provides short offline summaries here. Use the official source link for complete field definitions.',
    why: 'When filling out a form, reading a field’s description is safer than guessing what it means. Kubernetes manifests have many fields, and you will not remember them all. Learn to consult the schema when you need a precise definition.',
    how: '`explain` describes an API field and its children. The dotted path `pod.spec.containers` points to the container list in a Pod’s desired configuration. This is not reading the values of a live Pod: it is learning what the field is designed to hold.',
    practice: 'Open the container-field explanation and recognize concepts such as image, environment and resources. You do not need to change any values yet. Keep the tools distinct: explain for field definitions, get or describe for the current values of an existing object.'
  },
  17: {
    title: 'Create your first Pod',
    steps: ['Create the web Pod using nginx:1.27.'],
    caution: 'A standalone Pod has no Deployment controller to recreate it after deletion.',
    why: 'You have started a container on one machine. Now you will express that intention to Kubernetes, which needs a recognizable unit of work to assign to a suitable node. That unit carries more information than an image reference alone.',
    how: 'A Pod is the smallest unit Kubernetes schedules onto a node. This example contains one nginx container. The request is stored through the API, the scheduler selects a node, and components on that node start the container. A Pod can also contain several containers that work together.',
    practice: 'Create web from the nginx image and follow the request through the visual event flow. Look for its Pod box on a node. This is a directly created Pod, not yet one managed by a Deployment that would maintain a replacement if it were deleted.'
  },
  18: {
    title: 'Which node hosts the Pod?',
    steps: ['Read Pod locations using wide output.'],
    caution: 'Real schedulers consider plugins and constraints. Placement here is a simplified, deterministic model.',
    why: 'Knowing an application’s name does not tell you where it runs. Location matters when a problem affects one machine or when you want to inspect how replicas are distributed. A slightly wider list reveals that missing context.',
    how: '`get pods` provides a compact status summary. `-o wide` adds fields such as node name and Pod IP. The Pod’s identity, its host node and its network address are separate pieces of information. A replacement Pod can have a different IP.',
    practice: 'List the prepared web and api Pods with wide output. Match each node column to the diagram. You are observing placement, not changing it. Avoid treating a Pod IP as a permanent application address; later Service labs provide a more stable access abstraction.'
  },
  19: {
    title: 'Desired state, observed state',
    steps: ['Display the web Pod as YAML.'],
    caution: 'Normally you do not copy status into a manifest and manage it yourself. The relevant cluster components update it.',
    why: 'Asking for an outcome and having achieved it are different things. Even after requesting an application, you still need to verify its actual condition. Kubernetes objects keep both the requested configuration and the observed result.',
    how: '`spec` expresses what is wanted, while `status` reports what the system observes. A Pod’s requested image belongs in spec; information such as its IP and readiness is reported in status. YAML output exposes details that a compact table leaves out.',
    practice: 'Read the prepared web Pod in YAML form. Find the requested image first, then the observed state. You are only inspecting. When you later write a manifest, remember not to mistake system-maintained status fields for configuration you should copy and control.'
  },
  20: {
    title: 'Label and group',
    steps: ['Label the web Pod with tier=frontend.'],
    caution: 'Labels are unsuitable for sensitive data. Arbitrarily changing a controller’s selectors can also disrupt ownership relationships.',
    why: 'Managing many objects by their individual names is cumbersome. Like subject labels in a library, resource labels give you a way to describe and select groups. You can ask for the frontend without memorizing every member’s name.',
    how: 'A label is a key-value pair in metadata. In `tier=frontend`, tier is the key and frontend is its value. Adding it does not rename the Pod or change its image. Labels can later be used in queries and in selectors for resources such as Services.',
    practice: 'Add the frontend label to the existing web Pod. Notice that the object remains the same while its metadata changes. The useful property is not just describing it to a person: the label can participate in a machine-readable selection.'
  },
  21: {
    title: 'Find the right group in a crowd',
    steps: ['Filter Pods with the app=web label.'],
    caution: 'Multiple equality requirements are combined with AND. A misspelled label can produce an empty but successful query.',
    why: 'When replicas come and go, keeping a handwritten list of Pod names quickly becomes fragile. A shared label lets you discover the current group without knowing its membership in advance. Now you will use that property in a query.',
    how: 'A selector is a condition over labels. `-l app=web` selects Pods whose app label equals web. It does not check whether their names begin with web. Later, the same idea will determine which Pods a Service can send traffic to.',
    practice: 'Filter the prepared web-a, web-b and db objects down to the web group. The two web Pods should remain in the output while db is excluded. Nothing was deleted: only your view changed. When a result is empty, check the labels as well as the names.'
  },
  22: {
    title: 'An explanation, not a selector',
    steps: ['Add the owner annotation to web.'],
    caution: 'Do not put large or secret data in metadata. An annotation is not a Secret mechanism.',
    why: 'Selecting a resource and explaining it to a person are different needs. You might want to attach an owner or an operational note without changing the group that receives traffic. Annotations provide a place for that additional context.',
    how: 'An annotation is key-value metadata that is not used for label-selector grouping. It can hold an ownership note or a documentation reference. Adding one does not change the application image, and it does not make the attached information confidential.',
    practice: 'Add owner=platform to web as an annotation. Distinguish the labels and annotations in the object’s details. Their syntax looks similar, but their roles differ: labels support selection; annotations carry extra context. The Pod should not move or restart.'
  },
  23: {
    title: 'The limit of a standalone Pod',
    steps: ['Delete the standalone web Pod.', 'Observe that the Pod list is empty.'],
    caution: 'A container restart and a Pod replacement are different. Compare this with a controller-managed Pod in the Deployment module.',
    why: 'It is easy to assume Kubernetes automatically brings back every missing application. But you must tell it what to keep present. We will first see what happens when a Pod has no workload controller maintaining its existence.',
    how: 'A standalone Pod is an object created directly. Without a controller responsible for producing a replacement, deleting it leaves it absent. Restarting a container inside the same Pod is a different lifecycle event; here the entire Pod object is removed.',
    practice: 'Delete the prepared web Pod, then inspect the list. Its box should disappear without a replacement appearing. Later, repeat the comparison with a Deployment. The difference is not whether Kubernetes is present, but whether a controller has an explicit desired state to maintain.'
  },
  24: {
    title: 'ImagePullBackOff: check the image first',
    steps: ['Inspect the image-pull error on web.', 'Correct the web container’s image reference.'],
    caution: 'Image references containing missing, nonexistent or bad-tag deliberately fail in this model. No registry requests are made.',
    why: 'If an application package could not be obtained, debugging the application’s HTTP code is premature. Identify the stage at which startup failed before changing unrelated settings. This lab separates an image-fetch problem from a running application error.',
    how: 'ImagePullBackOff means an image pull failed and retries are being delayed. Causes can include an invalid tag or registry access problems. `describe` exposes the evidence. In this prepared scenario, the known cause is web’s `nginx:missing` reference.',
    practice: 'Inspect web first, then correct the image of the container named web to the provided working tag. Watch both the image reference and readiness change. Do not generalize this into “always change the tag”: this lab deliberately gives you one specific cause to repair.'
  },
  25: {
    title: 'Reading a manifest',
    steps: ['Read pod.yaml in the terminal.'],
    caution: 'YAML indentation is meaningful. The editor rejects invalid YAML but does not implement every Kubernetes field validation.',
    why: 'To recreate an environment, a file describing the final state is easier to share and review than a long command history. People can read that file and compare changes. First, we will learn to read the description without applying it.',
    how: 'A manifest defines a target Kubernetes object. `apiVersion` and `kind` identify the API and resource kind, `metadata` identifies the object, and `spec` describes its desired behavior. YAML expresses that structure through indentation. A file’s presence does not mean its objects exist in the cluster.',
    practice: 'Read the prepared pod.yaml file in the terminal; the Files tab shows the same definition. Locate the web name and nginx image. `cat` only displays the file. No Pod should appear in the cluster yet, and that is the expected result.'
  },
  26: {
    title: 'From a file to a live object',
    steps: ['Apply pod.yaml.', 'Read the web Pod from the API.'],
    caution: 'This app validates and stores a manifest in its local model; it does not model real client/server-side apply field ownership.',
    why: 'A written plan needs to be submitted before it can change a system. A manifest is still just a description while it sits in a file. Now you will submit that desired state and independently check the live result.',
    how: '`apply -f` sends the object definition in a file to the API. Kubernetes then works toward that desired state. A subsequent `get` reads the resulting live object. Reading a file, applying it and inspecting the cluster are three different operations.',
    practice: 'Apply pod.yaml, then query web. Its Pod should appear on a node in the diagram. Do not stop at the command’s acceptance message: inspect the object’s state. This builds the distinction between “the file looks right” and “the application is actually ready.”'
  },
  27: {
    title: 'A Pod factory instead of a single Pod',
    steps: ["Set the Pod template label in deployment.yaml to app=web, save it, and apply two replicas."],
    caution: "Deployment metadata.labels and template.metadata.labels are different. Edit spec.template.metadata.labels here so that the Pod labels match the controller selector.",
    why: 'Instead of manually creating one instance, you may want to say “keep two copies of this application available.” That requires both a recipe for producing copies and a target count. A Deployment expresses this broader intention.',
    how: "A Deployment manifest contains a Pod template and replica count. Its spec.selector.matchLabels must match the labels of the Pods it produces. Changing the Deployment’s own metadata labels is different. The prepared file has the wrong template label; you will repair that link before creating two instances.",
    practice: "Open deployment.yaml in Files. Set spec.template.metadata.labels.app to web, save, and apply it in the terminal. Watch one Deployment produce two ready Pods. Both the saved definition and live result are checked; creating two unrelated Pods does not fulfill the task.",
    hints: ["In Files, find spec.template.metadata.labels.app. Repair the label of the Pods to be produced, not the Deployment’s own metadata label."],
    syntaxHints: ["spec.template.metadata.labels.app: web → save → kubectl apply -f deployment.yaml"],
  },
  28: {
    title: 'Preview before creating',
    steps: ['Generate an nginx Deployment YAML draft without creating it.'],
    caution: 'A client dry-run does not guarantee that admission policies and all real server-side validations will accept the object.',
    why: 'Previewing a definition before creating anything helps you learn and prepare changes. Think of it as checking a form before submitting it. You can inspect the intended object without leaving live resources behind.',
    how: '`--dry-run=client` produces an object draft on the client without saving it to the server. `-o yaml` displays that draft as text. It is a useful starting point, not evidence that every real server policy or validation has passed.',
    practice: 'Generate the YAML for a web Deployment using nginx. The terminal should display the definition, while the cluster inventory remains unchanged. That difference is the point of this task: you created a description, not a live Deployment. Saving and applying it would be later steps.'
  },
  29: {
    title: 'See the change first',
    steps: ['Inspect the difference between deployment.yaml and the current state.'],
    caution: 'Real kubectl diff may exit with code 1 when differences exist; that is not an execution error. This model shows a simplified object comparison.',
    why: 'Seeing what will change before submitting it reduces surprises. Comparing the old and new image, replica count or access settings makes a review much more concrete. In this lab, you will inspect a change without performing it.',
    how: '`diff` compares the file’s desired definition with the current cluster object. The prepared live web Deployment has one replica, while the manifest requests three. A difference report is a preview: it does not itself update the target or create Pods.',
    practice: 'Compare deployment.yaml with the live web Deployment. Find the replica count’s current and proposed values. Do not apply the file in this task; the cluster should still have one instance. Reading the preview is the step before making the change.'
  },
  30: {
    title: 'Declarative scaling',
    steps: ["Edit deployment.yaml to request three replicas, save it, and apply it."],
    caution: 'Keep the source file updated in real team workflows. Divergence between the live cluster and Git’s desired state is configuration drift.',
    why: 'Changing a live environment while leaving its recipe outdated makes it easy to restore the wrong target later. Tracking the desired state in a file reduces that confusion. Now we will submit a scaling request through the manifest.',
    how: "The spec.replicas field records the requested Pod count. The saved file and live API object are separate states: saving does not change the cluster, and scale does not update the file. After saving and applying the new definition, the controller creates missing instances and the two targets agree.",
    practice: "Both deployment.yaml and web initially request one replica. In Files, change the count to three and save; you can inspect the change with diff before applying it. Using scale alone grows the live cluster but leaves the file check incomplete. Feedback tells you which definition is still out of date.",
    hints: ["Edit spec.replicas in the file. Save, optionally inspect the diff, then apply; changing the live object with scale does not update the saved definition."],
    syntaxHints: ["spec.replicas: 3 → save → kubectl diff -f deployment.yaml → kubectl apply -f deployment.yaml"],
  },
  31: {
    title: 'One file, several resources',
    steps: ['Apply stack.yaml containing a Deployment and a Service.', 'List the resulting EndpointSlice.'],
    caution: 'Real multi-document apply is not atomic: some objects may succeed while others fail. This educational engine rolls back command errors.',
    why: 'Running an application and making it reachable often need several resources. Keeping related definitions in one file makes their relationship easier to read. Sharing a file does not turn them into a single object or a single responsibility.',
    how: '`---` separates YAML documents. stack.yaml defines a Deployment and a Service. The Deployment produces Pods; the Service provides access to matching targets. EndpointSlices describe the addresses and readiness of those targets. These resources remain distinct even when applied together.',
    practice: 'Apply stack.yaml and then list EndpointSlices. Verify that ready targets exist alongside the application and Service. In real Kubernetes, success for one document does not prove success for the others, so learn to inspect the related parts rather than trusting one acceptance message.'
  },
  32: {
    title: 'State the same target again',
    steps: ['Apply the Deployment manifest once.', 'Apply the same file again without multiplying objects.'],
    caution: 'Idempotence does not mean every side effect is absent. Application behavior and admission webhooks still matter.',
    why: 'Automation often sends the same request more than once. If every repeat produced extra applications, reliable setup would be difficult. Describing a desired final state should not unnecessarily multiply the resources that implement it.',
    how: 'Idempotent behavior reaches the same final state when the same target is applied again. With the same kind, namespace and name, applying a Deployment manifest a second time does not request another independent Deployment. The controller still maintains the specified replica count.',
    practice: 'Apply the two-replica manifest twice. After the second application, expect one Deployment and two Pods, not two Deployments or four Pods. Focus on “what final state am I asking for?” rather than “how many times have I entered the command?”'
  }
};
