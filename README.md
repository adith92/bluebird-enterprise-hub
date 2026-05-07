# 🐦 Bluebird Enterprise Hub

> 🚀 **Public demo-ready** B2B Fleet Management Hub (Sales, Operations, Finance, Clients) built with a modern TypeScript monorepo.

## ✨ Highlights

- 🧭 **Role-based app**: GM, Sales, Operations, Finance
- 📦 **Monorepo (pnpm workspace)**: shared DB + API client + app artifacts
- 🧩 **Frontend**: React + Vite + Tailwind + shadcn/ui + Radix
- 🧠 **Data layer**: React Query + typed API client
- 🔐 **Auth**: username/password + Google sign-in (session cookie)
- 🗃️ **Backend**: Express 5 + PostgreSQL + Drizzle + Zod
- 🧾 **Invoicing flow**: completing an order issues an invoice (demo domain rule)

## 🧱 Workspace Layout

- 🖥️ `artifacts/bluebird-hub` — Main web app (React/Vite)
- 🧰 `artifacts/api-server` — API server (Express)
- 🗄️ `lib/db` — Drizzle schema + DB access
- 🧬 `lib/api-spec` / `lib/api-zod` / `lib/api-client-react` — OpenAPI + generated types/hooks
- 🧪 `scripts` — utilities + demo seeding

## ✅ Requirements

- 🟩 Node.js **24**
- 📦 pnpm (recommended via Corepack)
- 🐘 PostgreSQL (local or hosted)

## 🛠️ Quick Start (Local)

1. 📦 Install

```bash
corepack enable
pnpm install
```

2. 🧪 Configure env

Create `artifacts/api-server/.env` (or set env vars in your shell):

```bash
PORT=3001
DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/DB
SESSION_SECRET=change-me

# ✅ Google Sign-In (optional)
GOOGLE_CLIENT_ID=your-google-oauth-client-id

# ✅ Demo admin (seed)
DEMO_ADMIN_USERNAME=admin
DEMO_ADMIN_PASSWORD=admin
```

3. 🗄️ Push DB schema (dev only)

```bash
pnpm --filter @workspace/db run push
```

4. 🌱 Seed demo data

```bash
pnpm --filter @workspace/scripts run seed-bluebird
```

5. 🧪 Run API + Web

```bash
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/bluebird-hub run dev
```

Open the app:
- 🌐 Web: `http://localhost:5173`
- 🔌 API: `http://localhost:3001/api`

## 🔑 Demo Login

### 👤 Username/Password

- 🔐 Default demo accounts:
  - `gm` / `bluebird`
  - `sales` / `bluebird`
  - `operations` / `bluebird`
  - `finance` / `bluebird`
- 👑 Admin demo:
  - `admin` / `admin` (configurable via `DEMO_ADMIN_*`)

### 🟦 Continue With Google

When `GOOGLE_CLIENT_ID` is set on the API and `VITE_GOOGLE_CLIENT_ID` is set on the web app, users can sign in with Google.

## 🔒 Security Notes (Read This) 🧯

- ✅ Passwords are stored as **bcrypt hashes** (never plaintext).
- ✅ Frontend uses **session cookies** (`credentials: "include"`).
- ⚠️ For production:
  - 🔐 Set `SESSION_SECRET` to a strong random value
  - 🍪 Use `secure` cookies + `sameSite` strategy behind HTTPS
  - 🛡️ Add rate-limits + CSRF protection + audit logs
  - 🧰 Use a proper session store (Redis) instead of in-memory sessions

## 🌍 Deploy (Vercel Demo)

This repo is a monorepo: simplest demo path is:

- ▲ **Vercel**: deploy `artifacts/bluebird-hub`
- 🧠 **API**: deploy `artifacts/api-server` to a Node host (Railway/Render/Fly) and point the web app to it

If you want **API on Vercel** (serverless), you’ll need to adapt Express to Vercel Functions and revisit sessions.

## 🧠 Prompt Guide (for contributors) 🧑‍💻

Use these prompts when continuing development with an AI/coding assistant:

### 1) “Add feature” prompt

```text
Repo: bluebird-enterprise-hub
Goal: Add <FEATURE> to Bluebird Hub
Constraints:
- Keep enterprise UI (dense, scan-friendly), no marketing hero
- Use existing patterns: React Query + wouter + shadcn/ui + Zod validation
- Add API route in artifacts/api-server + types in OpenAPI if needed
- Add minimal tests or runtime assertions where risk is high
Deliver:
- Working UI + API
- Updated README/CHANGELOG (SemVer)
```

### 2) “Security review” prompt

```text
Review auth/session/database code for security risks.
Focus on: cookie settings, CORS, CSRF, password handling, rate limits, session store, RBAC, and input validation.
Return actionable fixes with file paths.
```

### 3) “Vercel deploy prep” prompt

```text
Prepare artifacts/bluebird-hub for Vercel deployment.
Ensure build works, environment variables are documented, and API base URL is configurable.
Add a vercel.json if needed and document steps in README.
```

## 🧾 Changelog

See [CHANGELOG.md](./CHANGELOG.md) 📌

