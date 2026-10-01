# learn-k8s

### Learn Kubernetes by doing.

Understand an idea. Run a command. Watch the cluster change.

**128 interactive labs** take you from your first container to troubleshooting a small platform—all in your browser, with no setup or account.

**[Start learning →](https://berkopan.github.io/learn-k8s/)** · [Türkçe](README.tr.md) · [Contributing](CONTRIBUTING.md)

## A little theory. A lot of practice.

- **Learn the why, then try the how.** Each lab pairs a plain-language explanation with concrete tasks, hints and a working terminal.
- **See what your commands change.** Follow Pods, controllers, Services and their relationships in an interactive cluster view. Edit YAML and inspect the result.
- **Make the journey yours.** English and Turkish lessons, light and dark themes, local progress, bookmarks and notes. Switch languages without losing your work.

The path covers containers, Pods, Deployments, networking, configuration, storage, security, Jobs, autoscaling and Helm—ending with multi-step repair missions.

Stuck on a command? Try `help`, `help docker`, or `docker run --help`. The command reference and Tab completion are there when you need them.

## Run locally

Use Node.js **22.12+**.

```sh
npm ci
npm run dev
```

Run `npm test` and `npm run build` for the core checks. See [contributing](CONTRIBUTING.md) for browser tests, [architecture](docs/ARCHITECTURE.md) for the code, and [deployment](docs/DEPLOYMENT.md) for hosting.

## Open to contributions

Found a confusing explanation, a missing command or an idea for a better lab? [Open an issue](https://github.com/Berkopan/learn-k8s/issues) or send a pull request. Small improvements make the next learner’s journey better.

[MIT licensed](LICENSE). Third-party components retain their own licenses; see [notices](THIRD-PARTY-NOTICES.md).

<sub>learn-k8s is an educational simulation, not a real Kubernetes cluster or shell. It implements a documented subset of commands; no real images or infrastructure are started. Never paste real credentials. [Simulation details](docs/SIMULATOR.md).</sub>
