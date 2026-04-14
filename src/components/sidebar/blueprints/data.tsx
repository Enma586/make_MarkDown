import {
  FileText, Terminal, Database, Container, Cpu,
  Shield, GitBranch, Settings,
  AlertTriangle, Network, ClipboardCheck, Users,
} from "lucide-react";
import type { Blueprint } from "./types";

export const BLUEPRINTS: Blueprint[] = [
  {
    id: "sys-design",
    label: "System Design",
    icon: <Network className="w-4 h-4" />,
    category: "Structure",
    content: `# System Design — [Feature Name]

**Author:** [Name] · **Date:** [YYYY-MM-DD] · **Status:** Draft

---

## 1. Context & Motivation

Describe the business problem this system solves and why we need it now. Include relevant metrics, user feedback, or incidents that triggered this initiative.

## 2. Goals & Non-Goals

### Goals
- G1: [Primary objective with measurable success criteria]
- G2: [Secondary objective]

### Non-Goals
- NG1: [Explicitly out of scope and why]
- NG2: [Deferred to future iteration]

## 3. High-Level Architecture

\`\`\`
┌──────────┐     ┌──────────────┐     ┌───────────┐
│  Client   │────▶│   API Gateway │────▶│  Service   │
└──────────┘     └──────┬───────┘     └─────┬─────┘
                        │                    │
                 ┌──────▼───────┐     ┌─────▼─────┐
                 │  Auth Service │     │  Database  │
                 └──────────────┘     └───────────┘
\`\`\`

## 4. Data Model

| Entity | Key Fields | Relationships |
|--------|-----------|---------------|
| \`User\` | id, email, role | has many Workspaces |
| \`Workspace\` | id, name, plan | belongs to User |

## 5. API Surface

\`POST /api/v1/resources\` → 201 Created
\`GET  /api/v1/resources/:id\` → 200 OK
\`PUT  /api/v1/resources/:id\` → 200 OK
\`DELETE /api/v1/resources/:id\` → 204 No Content

## 6. Failure Modes & Mitigations

| Failure | Impact | Mitigation |
|---------|--------|------------|
| DB connection timeout | 500 to clients | Circuit breaker + retry with exponential backoff |
| Third-party API down | Feature degradation | Graceful fallback with cached response |

## 7. Open Questions

- [ ] What is the expected QPS at launch?
- [ ] Do we need multi-region support from day one?
- [ ] Who is the on-call engineer for this service?`,
  },
  {
    id: "adr",
    label: "Architecture Decision",
    icon: <ClipboardCheck className="w-4 h-4" />,
    category: "Structure",
    content: `# ADR-[NNNN]: [Decision Title]

**Date:** [YYYY-MM-DD] · **Status:** Accepted | Proposed | Deprecated | Superseded by ADR-XXXX

---

## Context

We need to make a decision about [topic]. The current situation is [describe state]. This affects [teams/services/users].

## Decision

We will [chosen approach] because [primary reason].

## Alternatives Considered

### Option A — [Name]
- **Pros:** [advantage 1], [advantage 2]
- **Cons:** [disadvantage 1], [disadvantage 2]
- **Rejected because:** [reason]

### Option B — [Name]
- **Pros:** [advantage 1]
- **Cons:** [disadvantage 1], [disadvantage 2]
- **Rejected because:** [reason]

## Consequences

### Positive
- [benefit 1]
- [benefit 2]

### Negative
- [trade-off 1]
- [trade-off 2]

### Risks
- [risk 1] — Mitigation: [plan]

## Compliance & Security

- [ ] Data residency requirements met
- [ ] No PII exposed in logs
- [ ] Reviewed by security team: [Name/Date]`,
  },
  {
    id: "prd",
    label: "Feature Spec (PRD)",
    icon: <FileText className="w-4 h-4" />,
    category: "Structure",
    content: `# PRD: [Feature Name]

**Owner:** [Name] · **Target Release:** [vX.Y] · **Priority:** P0 | P1 | P2

---

## Problem Statement

[Clear description of the user pain point. Include supporting data: support tickets, analytics, user interviews.]

## User Stories

\`As a [role], I want [action] so that [benefit].\`

| ID | User Story | Priority | Acceptance Criteria |
|----|-----------|----------|-------------------|
| US-1 | As a user, I want to export my data as CSV | P0 | Export completes within 10s for datasets < 50K rows |
| US-2 | As an admin, I want to set export permissions per team | P1 | Only users with \`data:export\` scope can trigger exports |

## Success Metrics

| Metric | Current Baseline | Target | Measurement |
|--------|-----------------|--------|-------------|
| Task completion rate | 62% | 85% | Mixpanel funnel |
| Time to export | N/A | < 10s | Server-side latency p99 |

## Technical Considerations

- **Rate limiting:** Max 5 exports/hour per user.
- **Storage:** Generated files stored in S3 with 24h TTL.
- **Notifications:** Email delivery via SendGrid webhook.

## Out of Scope

- Real-time streaming export
- Custom column selection UI
- Export scheduling / recurring jobs`,
  },
  {
    id: "docker-compose",
    label: "Docker Compose",
    icon: <Container className="w-4 h-4" />,
    category: "Infra",
    content: `## Local Development Environment

\`\`\`yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/app_dev
      - REDIS_URL=redis://cache:6379
    volumes:
      - ./src:/app/src
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=app_dev
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 3s
      retries: 5

  cache:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s

volumes:
  pgdata:
\`\`\`

### Commands

\`\`\`bash
docker compose up -d          # Start all services
docker compose logs -f app    # Tail app logs
docker compose exec db psql   # Open PostgreSQL shell
docker compose down -v        # Stop and remove volumes
\`\`\``,
  },
  {
    id: "db-migration",
    label: "DB Migration",
    icon: <Database className="w-4 h-4" />,
    category: "Infra",
    content: `## Database Migration — [migration_id]

**Author:** [Name] · **Created:** [YYYY-MM-DD] · **Rollback:** Safe | Destructive

---

### Summary

[One-line description of what this migration changes.]

### Up Migration

\`\`\`sql
-- [migration_id]_up.sql

BEGIN;

CREATE TABLE IF NOT EXISTS organizations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    slug        VARCHAR(100) UNIQUE NOT NULL,
    plan        VARCHAR(20) NOT NULL DEFAULT 'free',
    settings    JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_organizations_slug ON organizations(slug);

ALTER TABLE users
    ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

COMMIT;
\`\`\`

### Down Migration

\`\`\`sql
-- [migration_id]_down.sql

BEGIN;

ALTER TABLE users DROP COLUMN IF EXISTS organization_id;
DROP TABLE IF EXISTS organizations;

COMMIT;
\`\`\`

### Impact Assessment

| Area | Impact | Notes |
|------|--------|-------|
| Read latency | Negligible | New table, no data yet |
| Write latency | Negligible | Single ALTER on users table |
| Downtime required | No | Online migration, no lock contention |
| Backfill needed | Yes | Populate organization_id from existing tenant mapping |`,
  },
  {
    id: "api-spec",
    label: "OpenAPI Endpoint",
    icon: <Terminal className="w-4 h-4" />,
    category: "Backend",
    content: `## API Reference — Users

### \`POST /api/v1/users\`

Create a new user account.

**Request Headers**

| Header | Value |
|--------|-------|
| \`Content-Type\` | application/json |
| \`Authorization\` | Bearer \`<jwt>\` |
| \`X-Request-Id\` | UUID v4 (required for tracing) |

**Request Body**

\`\`\`json
{
  "email": "user@example.com",
  "name": "Jane Doe",
  "role": "member",
  "team_id": "550e8400-e29b-41d4-a716-446655440000"
}
\`\`\`

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| \`email\` | string | Yes | RFC 5322, max 255 chars |
| \`name\` | string | Yes | 1-120 chars |
| \`role\` | enum | Yes | \`admin\` \| \`member\` \| \`viewer\` |
| \`team_id\` | uuid | No | Must exist in teams table |

**Responses**

\`\`\`json
// 201 Created
{
  "data": {
    "id": "a1b2c3d4-...",
    "email": "user@example.com",
    "name": "Jane Doe",
    "role": "member",
    "created_at": "2025-04-05T14:30:00Z"
  }
}

// 409 Conflict
{
  "error": {
    "code": "EMAIL_ALREADY_EXISTS",
    "message": "A user with this email already exists",
    "request_id": "550e8400-..."
  }
}

// 422 Unprocessable Entity
{
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
\`\`\`

**Rate Limit:** 100 requests/minute per IP. Headers: \`X-RateLimit-Limit\`, \`X-RateLimit-Remaining\`.`,
  },
  {
    id: "auth-flow",
    label: "OAuth 2.0 Flow",
    icon: <Shield className="w-4 h-4" />,
    category: "Backend",
    content: `## Authentication — OAuth 2.0 + PKCE

### Flow Diagram

\`\`\`
┌────────┐         ┌──────────┐         ┌──────────────┐
│ Client │────────▶│ Auth     │────────▶│ Authorization│
│ (SPA)  │         │ Server   │         │ Server       │
└───┬────┘         └────┬─────┘         └──────┬───────┘
    │                   │                      │
    │  1. POST /auth/code-verifier            │
    │◀──────────────────│                      │
    │  { code_challenge, state }              │
    │                   │                      │
    │  2. Redirect to /authorize               │
    │──────────────────────────────────────────▶
    │                   │                      │
    │  3. User authenticates & consents        │
    │◀──────────────────────────────────────────
    │  { code, state }                        │
    │                   │                      │
    │  4. POST /auth/token                     │
    │──────────────────▶│                      │
    │  { code, code_verifier }                │
    │                   │                      │
    │  5. { access_token, refresh_token, id_token }
    │◀──────────────────│                      │
\`\`\`

### Token Details

| Token | Lifetime | Storage | Usage |
|-------|----------|---------|-------|
| Access (JWT) | 15 min | Memory | API Authorization header |
| Refresh | 7 days | httpOnly cookie | Silent token renewal |
| ID Token (JWT) | 15 min | Memory | User profile claims |

### Security Requirements

- All tokens signed with RS256 (\`/\.well-known/jwks.json\`).
- Refresh token rotation on every use (detect theft).
- \`SameSite=Strict; Secure; HttpOnly\` on refresh cookie.
- CSRF protection via \`state\` parameter validation.`,
  },
  {
    id: "runbook",
    label: "Incident Runbook",
    icon: <AlertTriangle className="w-4 h-4" />,
    category: "Ops",
    content: `# Runbook — [Incident Type]

**Service:** [service-name] · **Severity:** SEV1 | SEV2 | SEV3 · **Last Updated:** [YYYY-MM-DD]

---

## Detection

- **Alert:** [PagerDuty/Datadog alert name]
- **Dashboard:** [link to Grafana dashboard]
- **SLA:** Acknowledge within 5 min (SEV1), resolve within 30 min

## Symptoms

- [Observable symptom 1, e.g., "API returns 502 on /health"]
- [Observable symptom 2, e.g., "Error rate > 5% in last 5 minutes"]

## Triage Checklist

1. [ ] Confirm the alert is not a false positive (check dashboards)
2. [ ] Identify blast radius (which services/users are affected?)
3. [ ] Check recent deployments in the last 2 hours
4. [ ] Post in \`#incidents\` channel with severity and summary

## Root Causes & Mitigations

### RC-1: Database connection pool exhausted

\`\`\`bash
# Check active connections
kubectl exec -it deploy/app -- psql -c "SELECT count(*) FROM pg_stat_activity;"

# Kill idle connections older than 5 min
kubectl exec -it deploy/app -- psql -c "
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE state = 'idle' AND query_start < now() - interval '5 minutes';
"
\`\`\`

### RC-2: Upstream service timeout

\`\`\`bash
# Check upstream health
curl -s -o /dev/null -w "%{http_code}" https://upstream.example.com/health

# Enable circuit breaker (temporary)
kubectl set env deploy/app CIRCUIT_BREAKER_OPEN=true
\`\`\`

## Escalation Path

| Severity | Notify | Comms |
|----------|--------|-------|
| SEV1 | Engineering manager + VP Eng | Statuspage update within 15 min |
| SEV2 | Engineering manager | Slack \`#incidents\` |
| SEV3 | On-call only | Ticket created |

## Post-Incident

- [ ] File incident in [tracker]
- [ ] Schedule blameless post-mortem within 48h
- [ ] Update this runbook with new findings`,
  },
  {
    id: "ci-pipeline",
    label: "CI/CD Pipeline",
    icon: <Cpu className="w-4 h-4" />,
    category: "Ops",
    content: `## CI/CD Pipeline — [service-name]

### Pipeline Stages

\`\`\`yaml
stages:
  - validate
  - test
  - build
  - deploy

variables:
  DOCKER_REGISTRY: registry.example.com
  IMAGE_TAG: $CI_COMMIT_SHORT_SHA

validate:
  stage: validate
  script:
    - npm ci
    - npm run lint
    - npm run typecheck
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"

test:
  stage: test
  script:
    - npm ci
    - npm run test:coverage -- --reporter=default --reporter=junit
  coverage: '/All files[^|]*\\|[^|]*\\s+([\\d.]+)/'
  artifacts:
    reports:
      junit: reports/junit.xml
      coverage_report:
        coverage_format: cobertura
        path: reports/cobertura-coverage.xml
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"

build:
  stage: build
  image: docker:24
  services:
    - docker:24-dind
  script:
    - docker build -t $DOCKER_REGISTRY/$IMAGE_TAG .
    - docker push $DOCKER_REGISTRY/$IMAGE_TAG
  rules:
    - if: $CI_COMMIT_BRANCH == "main"

deploy-staging:
  stage: deploy
  script:
    - helm upgrade --install app ./helm/app
        --set image.tag=$IMAGE_TAG
        --namespace staging
  environment:
    name: staging
    url: https://staging.example.com
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
\`\`\`

### Branch Strategy

| Branch | Deploys To | Protection |
|--------|-----------|------------|
| \`main\` | staging (auto) | Require 2 approvals, passing CI |
| \`release/v*\` | production (manual) | Require QA sign-off |
| \`feat/*\` | preview (ephemeral) | None |`,
  },
  {
    id: "changelog",
    label: "Changelog Entry",
    icon: <GitBranch className="w-4 h-4" />,
    category: "Ops",
    content: `## Changelog

All notable changes to this project are documented below. Format follows [Keep a Changelog](https://keepachangelog.com/).

---

### [2.1.0] — 2025-04-05

#### Added
- \`POST /api/v1/bulk-import\` endpoint for batch resource creation (max 10K records).
- WebSocket-based real-time notifications for workspace collaborators.
- Support for SAML 2.0 SSO as enterprise authentication method.
- Dark mode toggle persisted per-user preference.

#### Changed
- Pagination now uses cursor-based strategy instead of offset for improved performance on large datasets.
- Rate limit increased from 100 to 200 req/min for \`tier:business\` accounts.
- Upgraded PostgreSQL driver from \`pg@8.11\` to \`pg@8.13\` (fixes connection leak under load).

#### Fixed
- Resolved race condition in concurrent \`PATCH /users/:id\` requests causing intermittent data loss.
- Fixed CSV export truncating fields containing newline characters.
- Corrected timezone handling in scheduled report delivery (UTC → user local time).

#### Security
- Patched CVE-2025-XXXX in \`lodash\` dependency (bumped to 4.17.21).
- Added \`Content-Security-Policy\` headers to all API responses.
- Enabled parameterized queries across remaining raw SQL in audit log service.

#### Deprecated
- \`GET /api/v1/users/list\` — Use \`GET /api/v1/users\` with query params instead. Removal target: v3.0.0.

### [2.0.1] — 2025-03-20

#### Fixed
- Hotfix: login redirect loop on Safari 17.x due to SameSite cookie policy. ([#1234](https://github.com/org/repo/issues/1234))`,
  },
  {
    id: "onboarding",
    label: "Dev Onboarding",
    icon: <Users className="w-4 h-4" />,
    category: "Docs",
    content: `# Developer Onboarding — [Team/Project]

Welcome to the team. This guide will get your local environment running in ~15 minutes.

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | >= 20 LTS | [fnm](https://github.com/Schniz/fnm) |
| Docker | >= 24 | [Docker Desktop](https://docs.docker.com/desktop/) |
| pnpm | >= 9 | \`corepack enable && corepack prepare pnpm@latest --activate\` |
| Git | >= 2.40 | System package manager |

## Setup

\`\`\`bash
# 1. Clone with SSH (ensure your key is added to GitHub)
git clone git@github.com:org/repo.git
cd repo

# 2. Install dependencies
pnpm install

# 3. Copy environment template
cp .env.example .env.local

# 4. Start infrastructure (Postgres, Redis, MinIO)
docker compose up -d

# 5. Run database migrations
pnpm db:migrate

# 6. Seed development data
pnpm db:seed

# 7. Start development server
pnpm dev
\`\`\`

Open \`http://localhost:3000\` — you should see the app running with seed data.

## Project Structure

\`\`\`
src/
├── modules/          # Feature modules (bounded contexts)
│   ├── auth/         # Authentication & authorization
│   ├── users/        # User management
│   └── billing/      # Subscription & payments
├── shared/           # Cross-cutting concerns
│   ├── kernel/       # Database, logger, config
│   └── http/         # Middleware, validators, errors
└── server.ts         # Entry point
\`\`\`

## Useful Commands

| Command | Description |
|---------|-------------|
| \`pnpm dev\` | Start dev server with hot reload |
| \`pnpm test\` | Run unit tests |
| \`pnpm test:watch\` | Run tests in watch mode |
| \`pnpm test:e2e\` | Run Playwright E2E tests |
| \`pnpm lint\` | ESLint + Prettier check |
| \`pnpm db:migrate\` | Run pending migrations |
| \`pnpm db:studio\` | Open Prisma Studio (DB GUI) |

## Key Contacts

- **Tech Lead:** [Name] — Slack: \`@handle\`
- **On-call rotation:** See \`#oncall\` channel
- **Architecture questions:** Post in \`#engineering\``,
  },
  {
    id: "slo",
    label: "SLO / SLA Definition",
    icon: <ClipboardCheck className="w-4 h-4" />,
    category: "Docs",
    content: `# Service Level Objectives — [service-name]

**Service Owner:** [Name] · **Document Version:** 1.0 · **Last Review:** [YYYY-MM-DD]

---

## Availability SLO

| Metric | Target | Measurement Window |
|--------|--------|-------------------|
| API Availability | 99.95% | Rolling 30 days |
| Error Budget | 21.9 min/month | Derived from SLO |

**Definition of "available":** HTTP responses with status code < 500, excluding client errors (4xx) and health check endpoints.

## Latency SLO

| Endpoint | p50 | p95 | p99 |
|----------|-----|-----|-----|
| \`GET /api/v1/resources\` | < 50ms | < 200ms | < 500ms |
| \`POST /api/v1/resources\` | < 100ms | < 400ms | < 1000ms |
| \`GET /api/v1/resources/:id\` | < 30ms | < 100ms | < 300ms |

## Error Rate SLO

| Error Type | Threshold | Alert |
|------------|-----------|-------|
| 5xx rate | < 0.1% of total requests | PagerDuty SEV2 |
| 4xx rate | < 5% of total requests | Slack warning |

## Error Budget Policy

| Budget Remaining | Action |
|-----------------|--------|
| > 50% | Normal feature development |
| 25-50% | Prioritize reliability work, freeze non-critical deploys |
| < 25% | All hands on reliability only. No new features until budget recovers. |
| 0% | Incident review required. Freeze all deploys. |

## Dashboards

- **Grafana SLO Overview:** [link]
- **Error Budget Burn Rate:** [link]
- **Latency Heatmap:** [link]`,
  },
  {
    id: "config-ref",
    label: "Config Reference",
    icon: <Settings className="w-4 h-4" />,
    category: "Docs",
    content: `# Configuration Reference

All configuration is managed through environment variables. Values can be set in \`.env\` (local), CI/CD secrets (staging/prod), or your infrastructure config (Kubernetes ConfigMaps/Secrets).

---

## Application

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| \`APP_PORT\` | number | 3000 | HTTP server listen port |
| \`APP_ENV\` | string | development | Environment: \`development\` \| \`staging\` \| \`production\` |
| \`APP_LOG_LEVEL\` | string | info | Log verbosity: \`debug\` \| \`info\` \| \`warn\` \| \`error\` |
| \`APP_TRUST_PROXY\` | boolean | false | Trust X-Forwarded-* headers (required behind load balancer) |

## Database

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| \`DATABASE_URL\` | string | — | PostgreSQL connection string (required) |
| \`DATABASE_POOL_SIZE\` | number | 10 | Max concurrent DB connections |
| \`DATABASE_SSL\` | boolean | false | Enable SSL for DB connections (required in production) |
| \`DATABASE_STATEMENT_TIMEOUT\` | number | 30000 | Query timeout in milliseconds |

## Redis

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| \`REDIS_URL\` | string | redis://localhost:6379 | Redis connection string |
| \`REDIS_TTL\` | number | 3600 | Default cache TTL in seconds |

## Auth

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| \`JWT_SECRET\` | string | — | RSA private key for signing JWTs (required) |
| \`JWT_PUBLIC_KEY\` | string | — | RSA public key for verification (required) |
| \`JWT_ACCESS_TTL\` | number | 900 | Access token lifetime in seconds |
| \`JWT_REFRESH_TTL\` | number | 604800 | Refresh token lifetime in seconds |
| \`CORS_ORIGINS\` | string | * | Comma-separated allowed origins (use explicit list in prod) |

## Third-Party

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| \`STRIPE_SECRET_KEY\` | string | — | Stripe API secret key |
| \`STRIPE_WEBHOOK_SECRET\` | string | — | Stripe webhook signing secret |
| \`SENDGRID_API_KEY\` | string | — | SendGrid API key for transactional email |
| \`S3_BUCKET\` | string | — | S3 bucket name for file storage |
| \`S3_REGION\` | string | us-east-1 | S3 region |`,
  },
];
