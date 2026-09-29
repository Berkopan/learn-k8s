# Static deployment

The application is a Vite SPA with a relative asset base and hash navigation (`#level=42`). It works beneath a repository path; no server-side rewrite or backend is required.

## GitHub Pages

In the repository settings, open **Pages → Build and deployment → Source → GitHub Actions**. The included **Publish learning workbench** workflow builds `dist/` and deploys through the Pages artifact API. Push to `main` or run that workflow manually after enabling Pages.

The expected project-site location for this repository is `https://berkopan.github.io/learn-k8s/`. It becomes available only after Pages is enabled and a deployment succeeds. A workflow file alone does not prove the site is published.

Deployment uses `contents: read`, `pages: write`, and `id-token: write`. The verification workflow only needs read access. No repository secrets, cloud credentials or paid infrastructure are needed by this application.

## Other static hosts

Run `npm run build` and upload the contents of `dist/`. Preserve the generated asset paths. Use HTTPS for the normal browser security model. The simulator itself makes no network requests; official documentation links open external pages only when clicked.

## Release checks

Run the engine/curriculum/progress suite and production build. The browser suite then completes the 128-level guided route once on desktop, checks mobile layout, exercises YAML errors and repairs, and records screenshots and accessibility evidence. Review the latest workflow result rather than treating this document as a promise that every future revision passes.

Dependencies are declared in package.json. Commit and maintain a package-lock.json when changing dependencies; use `npm ci` once a verified lockfile is present. Do not hand-edit a lockfile.
