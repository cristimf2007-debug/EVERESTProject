# Google OAuth testing

The fan login flow uses BIOXIC's own Google OAuth client and the FastAPI callback:

1. Configure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` on the backend.
2. Register `https://your-domain.example/api/auth/google/callback` as an authorized Google redirect URI.
3. Configure the frontend backend URL and the backend's `SITE_URL`/`CORS_ORIGINS`.
4. Open the account dialog, continue with Google, and verify that the callback returns to `/auth/success` with an authenticated fan session.
5. Log out and confirm that `/api/fans/me` returns no user.

The application stores its own session in `user_sessions`; the browser receives an HTTP-only cookie. Never place OAuth secrets in frontend code or commit them to the repository.
