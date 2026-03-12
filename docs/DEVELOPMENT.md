Sample MkDocs directory tree for this project:

docs/
├─ mkdocs.yml
├─ README.md
├─ requirements.txt
├─ docs/
│ ├─ index.md
│ ├─ architecture/
│ │ ├─ overview.md
│ │ ├─ backend.md
│ │ ├─ frontend.md
│ │ └─ agent.md
│ ├─ setup/
│ │ ├─ initial.md
│ │ ├─ development.md
│ │ └─ docker.md
│ ├─ api/
│ │ ├─ backend-endpoints.md
│ │ ├─ auth.md
│ │ └─ agents.md
│ ├─ guides/
│ │ ├─ wake-on-lan.md
│ │ ├─ troubleshooting.md
│ │ └─ faq.md
│ ├─ operations/
│ │ ├─ deployment.md
│ │ ├─ monitoring.md
│ │ └─ security.md
│ └─ assets/
│ ├─ images/
│ └─ stylesheets/
│ └─ extra.css
└─ overrides/
└─ main.html

Brief explanation:

- mkdocs.yml: Main MkDocs navigation, theme, plugins, and build settings.
- docs/: All markdown pages grouped by topic (architecture, setup, API, guides, operations).
- docs/assets/: Static files used by docs pages (images and optional custom CSS).
- overrides/: Theme template overrides for custom layout/header/footer behavior.
- requirements.txt: Python dependencies for local docs build (mkdocs, material theme, plugins).
