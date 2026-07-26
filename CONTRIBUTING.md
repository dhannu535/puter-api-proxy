# Contributing to Puter API Proxy

Thanks for your interest in contributing! This project is open to everyone.

## 🚀 Quick Setup

```bash
git clone https://github.com/dhannu535/puter-api-proxy.git
cd puter-api-proxy
npm install
cp .env.example .env
# Add your PUTER_AUTH_TOKEN from https://puter.com/dashboard
npm start
```

Dashboard dev mode (hot reload):
```bash
cd dashboard && npm install && npm run dev
```

## 🤝 How to Contribute

### 1. Report a Bug
- Open an [issue](https://github.com/dhannu535/puter-api-proxy/issues)
- Include: what happened, what you expected, steps to reproduce

### 2. Suggest a Feature
- Open an issue with the `enhancement` label
- Describe the use case and why it's useful

### 3. Submit a Pull Request

```bash
# Fork the repo, then:
git checkout -b your-feature
# Make your changes
git commit -m "feat: your change description"
git push origin your-feature
# Open a PR on GitHub
```

## 💡 Good First Contributions

| Area | Ideas |
|------|-------|
| 🧠 **Models** | Add new models to `server/models.mjs` as Puter adds them |
| 📊 **Dashboard** | Add new charts, improve UI, add dark/light theme toggle |
| 🔌 **Endpoints** | Add `/v1/embeddings`, `/v1/images/generations` support |
| 🛡️ **Router** | Improve fallback logic, add cost-aware routing, latency-based selection |
| 📖 **Docs** | Fix typos, add examples for more clients, write tutorials |
| 🐳 **Docker** | Optimize image size, add health check improvements |
| 🧪 **Testing** | Add tests for router logic, API endpoints |
| 🌐 **i18n** | Translate dashboard to other languages |

## 📏 Guidelines

- Keep it simple — this project is intentionally minimal (no Express, no ORMs)
- Match the existing code style (no semicolons preference is fine, just be consistent)
- Test your changes locally before submitting
- One PR per feature/fix
- Update the README if you add a new feature or endpoint

## 📁 Project Structure

```
server/
├── index.mjs      # HTTP server, all API routes
├── router.mjs     # Smart routing + fallback logic
├── models.mjs     # Model catalog (4 tiers)
└── analytics.mjs  # Request tracking

dashboard/
└── src/
    ├── App.jsx    # Main app
    ├── styles.css # All styles
    └── pages/     # Each dashboard tab
```

## 🏷️ Commit Messages

Use conventional commits:
- `feat: add embeddings endpoint`
- `fix: handle timeout in router`
- `docs: update README examples`
- `style: dashboard button alignment`

## ❓ Questions?

Open an issue or start a discussion. No question is too simple.
