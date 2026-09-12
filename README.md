# Inventory SaaS Frontend

رابط کاربری موبایل‌محور و راست‌به‌چپ برای مدیریت فروشگاه، موجودی، فروش‌ها و درخواست مشتریان.

## Live demo

- Frontend: <https://inventory-saas-frontend-evln.onrender.com>
- Backend API: <https://inventory-saas-api-k6wp.onrender.com>
- API documentation: <https://inventory-saas-api-k6wp.onrender.com/api/v1/docs/>

Set `VITE_DEMO_MODE_ENABLED=true` for the portfolio deployment. The login page
then shows **ورود به نسخهٔ نمایشی**, which opens the shared writable demo store
without asking for credentials. A visible in-app notice explains that visitor
changes remain until the backend resets the synthetic tenant.

## Development

```bash
npm install
npm run dev
```

## Quality checks

```bash
npm test
npm run lint
npm run build
```

## Production deployment

Render builds this repository as a Vite Static Site from `main` after the
required GitHub checks pass. The build command is `npm ci && npm run build` and
the publish directory is `dist`. Set `VITE_API_BASE_URL` to the Render API
including `/api/v1`, add the Sentry DSN when monitoring is enabled, and keep
password reset disabled until the SMS provider is configured. A Render rewrite
from `/*` to `/index.html` preserves direct navigation to React Router paths.

## Current status

- React, TypeScript and Vite foundation
- RTL responsive application shell
- Home, products, sales, requests and more pages
- JWT authentication, registration and store onboarding
- Automatic access-token refresh using session storage
- Django API integration through TanStack Query
- Product and variant creation
- Draft sale, line items and checkout flow
- Wanted-product request creation
- Customer, inventory, category and member management
- Capability-aware navigation and route protection
- Shared navigation, filters, cards and status components
- Phone-bound employee invitation creation, copy, revoke and resend workflows
- Public invitation registration and existing-account acceptance
- Safe internal login return paths for invitation acceptance
- Financial and inventory analytics reports
- Vitest coverage for API contracts, invitation states, redirects and shared UI
- One-click public demo login and shared-account status banner

During development, Vite proxies `/api` requests to Django at
`http://127.0.0.1:8000`. Set `VITE_API_BASE_URL` when a custom API URL is
needed; `.env.example` documents the complete frontend configuration contract.
