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

During development, Vite proxies `/api` requests to Django at
`http://127.0.0.1:8000`. Copy `.env.example` when a custom API URL is needed.
