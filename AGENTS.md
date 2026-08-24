# Instructions for AI agents

Before editing this frontend, read the complete cross-repository handoff:

- Local sibling repository: `../inventory-SaaS/AI_PROJECT_HANDOFF.md`
- Remote fallback: <https://github.com/mohrezvelayati/inventory-SaaS/blob/main/AI_PROJECT_HANDOFF.md>

Frontend rules:

- Keep the UI mobile-first, RTL, and Persian.
- Keep server calls in `src/features/*` API modules and types in
  `src/types/api.ts`.
- Use `apiRequest`, TanStack Query invalidation, and existing auth gates.
- Never treat frontend permission gates as security; backend enforcement is
  required.
- Normal signup is for store owners. Employees use `/invite/:token`.
- Validate login `next` with `getSafeNextPath`; never permit open redirects.
- Preserve the separate backend contract and tenant isolation rules.
- Before handoff run `npm test`, `npm run lint`, and `npm run build`.
