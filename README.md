# Trishakti HR System

Trishakti HR is an AI-assisted recruitment and onboarding system for Trikshati Poly Packs. It centralizes jobs, applications, candidates, CV screening, interviews, communication, offers, onboarding, and employee records.

AI is used as decision support. HR remains responsible for the final hiring decision.

## Design

The source design is maintained in [Figma](https://www.figma.com/design/5SB0Ob4nxl1KEAqDVPz0EF/trishakti_hr).

See [docs/design.md](docs/design.md) for the screen inventory, design tokens, component library, naming rules, and design-to-code guidance.

## Repository Layout

```text
backend/                 Node.js and Express API
frontend/                React, TypeScript, and Vite application
infrastructure/          Local infrastructure configuration
keycloak-export/         Keycloak realm export without runtime secrets
docs/                    Project and design documentation
docker-compose.yml       Local PostgreSQL and Keycloak services
```

## Prerequisites

- Node.js 20 or newer
- npm
- Docker Desktop with Docker Compose
- A local Keycloak development configuration

## Local Setup

1. Create local environment files from the documented variable names. Keep real values only in ignored `.env` files.
2. Start the local infrastructure:

   ```bash
   docker compose up -d postgres app-postgres keycloak
   ```

3. Start the backend:

   ```bash
   cd backend
   npm install
   npm run dev
   ```

4. Start the frontend in a second terminal:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

The development services use these local addresses:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`
- Keycloak: `http://localhost:8080`

The ports and URLs are development defaults. Do not expose them as production configuration.

## Secret Safety

Never commit passwords, tokens, private keys, client secrets, database credentials, or personal HR records.

- Keep `.env` and nested `.env` files local.
- Commit only `.env.example` files containing placeholder values.
- Do not place credentials in README files, screenshots, Figma descriptions, seed data, or exported realm files.
- Do not paste access tokens into issues, commits, chat messages, or logs.
- Review `git diff --cached` before every commit.

Useful checks before committing:

```bash
git status --short
git diff --cached --check
git grep -n -I -E "(password|secret|token|api[_-]?key|private[_-]?key)" -- ':!package-lock.json'
```

The last command is a review aid, not proof that a value is safe. Inspect every match before committing.

## Current Scope

The MVP focuses on authentication and RBAC, job management, candidate management, CV upload and metadata, TF-IDF plus cosine-similarity screening, required-skill checks, interviews, communication, offer generation, onboarding, employee record creation, security, testing, and documentation.

Payroll, attendance, performance management, contract renewal, full offboarding, external job-platform integrations, and advanced analytics remain future enhancements.

## AI Screening

The MVP uses:

- TF-IDF to represent CV and job-description text
- Cosine similarity to calculate relevance
- Explicit required-skill checks and configurable business weighting
- HR review as the final decision step

The MVP does not train or call a GPT, BERT, Llama, or other generative model for candidate decisions.

## Git Workflow

Use focused commits with a clear validation note. Never force-push shared branches without explicit agreement.

```bash
git status
git add README.md docs/design.md
git diff --cached --check
git commit -m "docs: add project and design documentation"
git push origin HEAD
```
