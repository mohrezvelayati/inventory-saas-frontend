# Inventory SaaS Frontend

رابط کاربری موبایل‌محور و راست‌به‌چپ برای مدیریت فروشگاه، موجودی، فروش‌ها و درخواست مشتریان.

## Development

```bash
npm install
npm run dev
```

## Quality checks

```bash
npm run lint
npm run build
```

## Production deployment

Vercel builds this repository as a Vite SPA. Copy `.env.example` for local
configuration. In Vercel, set `VITE_API_BASE_URL` to the Render API including
`/api/v1`, add the Sentry DSN, and keep password reset disabled until the SMS
provider is configured. `vercel.json` preserves direct navigation to React
Router paths.

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

## AI and developer handoff

The cross-repository architecture, product decisions, API contracts, security
invariants, verification commands, and continuation rules are documented in:

- Local sibling checkout: `../inventory-SaaS/AI_PROJECT_HANDOFF.md`
- GitHub: [`AI_PROJECT_HANDOFF.md`](https://github.com/mohrezvelayati/inventory-SaaS/blob/main/AI_PROJECT_HANDOFF.md)

Read that document before changing frontend behavior or API assumptions.

During development, Vite proxies `/api` requests to Django at
`http://127.0.0.1:8000`. Set `VITE_API_BASE_URL` when a custom API URL is
needed; `.env.example` documents the complete frontend configuration contract.
