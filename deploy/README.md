# Self-hosted catalog templates

These are the source files for Cut's one-click entries in the **Coolify** and
**Dokploy** template catalogs. Both deploy the published image
[`ghcr.io/mendylanda/cut`](https://github.com/MendyLanda/cut/pkgs/container/cut)
(built by [`.github/workflows/docker-publish.yml`](../.github/workflows/docker-publish.yml))
alongside a private, persistent Redis — so each is a self-contained stack.

They're kept here so the canonical definitions live with the app; the actual
catalog listings live in the upstream repos below.

## `coolify/`

- `cut.yaml` — the Compose service template (uses Coolify magic vars:
  `SERVICE_FQDN_CUT_3000` for routing, `SERVICE_PASSWORD_ADMIN` for the admin
  password).
- `svgs/cut.svg` — the logo.

Submitted to [`coollabsio/coolify`](https://github.com/coollabsio/coolify)
(default branch `v4.x`) as `templates/compose/cut.yaml` + `public/svgs/cut.svg`
(the template's `logo: svgs/cut.svg` resolves under `public/`).
See <https://coolify.io/docs/get-started/contribute/service>.

## `dokploy/`

- `docker-compose.yml` — the stack.
- `template.toml` — Dokploy config: generates the domain (`${domain}`) and a
  strong `ADMIN_PASSWORD` (`${password:24}`), and maps the domain to the `cut`
  service on port 3000.
- `cut.svg` — the logo.
- `meta.entry.json` — the object to add to the catalog's root `meta.json`.

Submitted to [`Dokploy/templates`](https://github.com/Dokploy/templates) as
`blueprints/cut/{docker-compose.yml,template.toml,cut.svg}` + an entry in
`meta.json`.

## Updating the image

Both templates pin `:latest`. Cutting a `v*.*.*` release tag (or pushing to
`main`) rebuilds and republishes the image via the GHCR workflow; existing
deployments pull the new image on their next redeploy.
