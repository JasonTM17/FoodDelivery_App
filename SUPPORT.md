# Support

## Where to Get Help

| Channel | Purpose |
|---------|---------|
| [GitHub Issues](https://github.com/JasonTM17/foodflow/issues) | Bug reports |
| [GitHub Discussions](https://github.com/JasonTM17/foodflow/discussions) | Questions, ideas, community |
| Email (jasonbmt06@gmail.com) | Security vulnerabilities (see [SECURITY.md](SECURITY.md)) |

## Before You Open an Issue

1. **Search existing issues** — your problem may already have a solution
2. **Check the documentation**:
   - [System Architecture](docs/system-architecture.md)
   - [API Reference](docs/api-reference.md)
   - [Deployment Guide](docs/deployment-guide.md)
   - [Code Standards](docs/code-standards.md)
   - [Testing Guide](docs/testing-guide.md)
3. **Try the latest version** — your issue may be fixed in `main`
4. **Use Discussions** for questions and ideas; **use Issues** for reproducible bugs

## Bug Report

When reporting a bug, include:

- **Environment**: OS, Docker version, Node.js version, browser (if web)
- **Steps to reproduce**: exact commands or click path
- **Expected behavior**: what should have happened
- **Actual behavior**: what actually happened (error messages, logs, screenshots)
- **Minimal reproduction**: the smallest example that triggers the bug

Use the [Bug Report template](https://github.com/JasonTM17/foodflow/issues/new?template=bug_report.md) when available.

## Feature Request

When suggesting a feature:

- **Problem statement**: what problem are you trying to solve?
- **Proposed solution**: how would it work?
- **Alternatives considered**: other approaches you have thought about
- **Impact**: who benefits and how?

Use the [Feature Request template](https://github.com/JasonTM17/foodflow/issues/new?template=feature_request.md) when available.

## Community Resources

- **API Docs**: Swagger UI at `http://localhost:3001/api/docs` when running locally
- **N8N Workflows**: See `infra/n8n/workflows/` for AI assistant automation
- **Database Schema**: `prisma studio` at `http://localhost:5555` after `pnpm db:studio` in `backend/`
- **Bull Board**: Queue monitoring at `http://localhost:3004` when Docker Compose is running
- **Grafana**: Metrics dashboards at `http://localhost:3005` (admin/admin)
- **Prometheus**: Raw metrics at `http://localhost:9090`
