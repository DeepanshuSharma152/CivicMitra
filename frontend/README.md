# CivicMitra Frontend

The Next.js Phase 1 client implements the current household-to-worker flow:

1. Authenticate with `POST /api/v1/auth/login`.
2. Citizen uploads GREEN and BLUE bin photos (RED and BLACK are optional) to `POST /api/v1/segregation/submit`.
3. The backend returns a provisional score and, on approval, a short-lived QR image/token.
4. Worker verifies the token through `POST /api/v1/segregation/verify-qr` with their current GPS location.

## Run it locally

Prerequisites: Node.js 20.9+ and the Spring Boot backend running on port `8080`.

```powershell
cd frontend
Copy-Item .env.local.example .env.local
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## How the frontend is organized

- `app/page.tsx` — one responsive Phase 1 workspace with citizen and worker experiences.
- `lib/api.ts` — typed wrappers for the existing Spring Boot API contract.
- `app/globals.css` — design system and responsive glass/eco styling.

## Design system

The UI uses the municipal civic palette: teal (`#0F766E`) for the platform and primary actions, blue (`#2563EB`) for movement and verification flow, green (`#16A34A`) for successful waste outcomes, amber (`#F59E0B`) for attention states, and red (`#DC2626`) for unsafe or rejected conditions. White cards sit on a `#F8FAFC` background with restrained glass depth.

## Current backend integration details

The existing login response includes a JWT, name, and role, but does not include a linked household or worker record. The UI therefore asks for the relevant numeric `householdId` or `workerId` at the point of action. When the backend adds those IDs to the login response, those fields can be removed.

The backend already produces a QR image. The worker view currently accepts the accompanying QR token as text; native camera decoding is a focused next increment, after the device-testing workflow is stable.

The current worker endpoint records a valid pickup, expiry, reuse, or GPS mismatch. It does not yet accept a worker rejection reason or evidence, so the frontend intentionally does not render a fake reject button.

## Verify the project

```powershell
pnpm build
```
