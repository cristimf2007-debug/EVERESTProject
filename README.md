# Here are your Instructions


## Frontend visual system

Shared dark tokens and component styles live in `frontend/src/index.css`; Tailwind UI colors reference the same tokens. The floating header keeps `/logo.png` centered. Below 800px, a menu button reveals all eight destinations in a two-column navigation; Escape closes it and returns focus to the button. Navigation also closes after changing routes. The homepage uses a dedicated editorial hero grid with responsive portrait cropping.

Radio metadata polling does not load audio or show the persistent player before an explicit playback action. Existing playback, search, account and settings integrations remain in place. The official Sample Pack checkout is `47UXM5YBBLLPQ`; it must not be presented as a donation on Contact.

Validation: run `npm run build` and `npm test -- --watchAll=false` from `frontend`. Check desktop/mobile layouts, keyboard navigation and reduced motion using the existing development service. Live media, authentication and payment transactions additionally require their configured services and are not implied by a successful frontend build.

## Independent runtime services

The active API is `backend/server.py` (FastAPI + MongoDB). Uploaded files are now stored on local persistent disk under `BIOXIC_STORAGE_DIR` (default: `backend/uploads`); deployments must mount that directory on durable storage. Google sign-in uses the BIOXIC Google OAuth client and `/api/auth/google/callback`. Outbound email is optional and uses standard SMTP settings (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM_EMAIL`).

Before deploying this change, export the existing MongoDB data and every previously uploaded object, then copy uploaded objects into the configured local storage directory while preserving their `storage_path`. The old database and object-store contents have not been migrated or deleted by this source change.
