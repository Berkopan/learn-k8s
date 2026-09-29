# Security scope

learn-k8s does not contact Kubernetes, Docker, Helm repositories or a backend. The terminal parses a documented command subset; it never invokes a shell. UI output uses text rendering, not injected HTML.

Do not enter real passwords, tokens, kubeconfigs or private company manifests. YAML editing occurs in memory; local learning notes and progress are persisted in browser storage. Progress exports contain your notes. Clearing browser site data deletes local progress.

Report vulnerabilities privately through the repository's available security-reporting channel or contact the maintainer rather than posting active secrets in public issues. Dependency updates should be tested against the full curriculum and browser suite.

The simulator's limits are pedagogical controls, not an isolation boundary for executing untrusted code. No arbitrary code or image is executed by design.
