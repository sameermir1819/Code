# Enterprise Deployment & Production Guide

This guide details industry-standard procedures for deploying **Futurex_Learning ERP** to **Vercel** (recommended for serverless Next.js), **Docker/VPS**, or **Container Clouds (Railway / Render / AWS)** with zero-downtime and high security.

---

## 1. Quick Deploy to Vercel (Recommended)

Next.js 14 App Router runs optimally on Vercel with automatic edge caching, global CDN, and server actions routing.

### Step 1: Connect GitHub Repository
1. Navigate to [vercel.com](https://vercel.com) and log in.
2. Click **"Add New..."** > **"Project"**.
3. Import the repository: `sameermir1819/Code`.
4. Framework Preset: **Next.js** (automatically detected).
5. Root Directory: `./` (leave default).

### Step 2: Environment Variables
Add the following environment variables in the Vercel Dashboard under **Project Settings > Environment Variables**:

| Variable | Description | Example / Source |
| :--- | :--- | :--- |
| `DATABASE_URL` | Supabase Transaction Pooler URL (Port 6543) | `postgresql://postgres.[id]:[pass]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10&pool_timeout=30` |
| `DIRECT_URL` | Supabase Direct Session URL (Port 5432) | `postgresql://postgres.[id]:[pass]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres` |
| `JWT_SECRET` | 64+ char random secret string | Generate via `openssl rand -base64 32` |
| `NEXTAUTH_SECRET` | Secret token for auth session cookies | Generate via `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Production URL | `https://your-custom-domain.com` |
| `SUPABASE_URL` | Supabase Project URL | `https://[id].supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase Anon / Publishable key | From Supabase API Settings |
| `SUPABASE_SECRET_KEY` | Supabase Service Role key | From Supabase API Settings |
| `NEXT_PUBLIC_APP_NAME` | Institute branding name | `Futurex_Learning ERP` |
| `NEXT_PUBLIC_APP_CURRENCY` | Currency code | `INR` |
| `NEXT_PUBLIC_APP_CURRENCY_SYMBOL` | Currency symbol | `₹` |
| `NEXT_PUBLIC_APP_TIMEZONE` | Timezone | `Asia/Kolkata` |

> **Important (Supabase Connection Pooling)**: Always use the Supabase **Pooler URL (port 6543)** with `pgbouncer=true` for `DATABASE_URL` to avoid exhausting database connection limits during serverless scaling.

### Step 3: Serverless Function Region
The project's [`vercel.json`](file:///vercel.json) has been configured with `"regions": ["bom1"]` (Mumbai, India). This co-locates the serverless compute functions directly in the same region as the Supabase Mumbai database (`ap-south-1`) for sub-10ms database query latency!

---

## 2. Docker & Containerized Deployment (VPS / AWS / Coolify)

A production-ready, multi-stage, non-root `Dockerfile` is included in the root directory.

### Build and Run with Docker Compose:
```bash
# 1. Ensure .env is populated with production secrets
cp .env.example .env

# 2. Build and launch container in detached mode
docker compose up -d --build

# 3. View live production logs
docker compose logs -f web
```

### Healthcheck
The container includes a built-in health check polling the `/api/health` endpoint:
```bash
curl -f http://localhost:3000/api/health
```

Expected JSON response:
```json
{
  "status": "healthy",
  "timestamp": "2026-09-23T04:20:00.000Z",
  "uptimeSeconds": 1420,
  "version": "1.0.0",
  "environment": "production",
  "responseTimeMs": 12,
  "services": {
    "web": { "status": "healthy" },
    "database": { "status": "healthy", "latencyMs": 8 }
  }
}
```

---

## 3. Database Migration & Schema Syncing

When rolling out updates with schema modifications, run:

```bash
# Push schema changes to Supabase PostgreSQL without downtime
npx prisma db push

# Generate fresh type-safe Prisma client
npx prisma generate
```

---

## 4. Continuous Integration (CI)

A GitHub Actions workflow is active in [`.github/workflows/ci.yml`](file:///.github/workflows/ci.yml). Every push to `main` automatically runs:
1. `npm ci`
2. `prisma generate`
3. `npm run lint`
4. `npm run build`

This guarantees that breaking changes never reach production.

