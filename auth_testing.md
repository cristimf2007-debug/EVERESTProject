# BIOXIC — Auth Testing Playbook

## Fan auth (email/parolă + Google OAuth Emergent)
- POST /api/fans/register {name, email, password} → {token, user}; validări: email valid, parolă min 6, duplicat → 400 RO
- POST /api/fans/login {email, password} → {token, user}; greșit → 401 „Email sau parolă greșită"
- GET /api/fans/me — cookie `fan_token`/`session_token` sau Bearer JWT
- POST /api/fans/logout — șterge cookie-urile + sesiunea
- POST /api/auth/google/session {session_id} — schimb server-side cu Emergent OAuth, setează cookie `session_token` (7 zile), creează/actualizează user fan
- Frontend: AppRoutes detectează `location.hash` cu `session_id=` SINCRON → AuthCallback; FanContext sare peste /fans/me dacă hash-ul are session_id

## Test rapid
```bash
curl -X POST $API/api/fans/register -H 'Content-Type: application/json' -d '{"name":"T","email":"t@t.ro","password":"parola123"}'
TOKEN=... # din răspuns
curl $API/api/fans/me -H "Authorization: Bearer $TOKEN"
curl -X POST $API/api/fans/favorites/<track_id> -H "Authorization: Bearer $TOKEN"
```

## Admin auth
- POST /api/auth/login (admin@bioxic.ro / bioxic2024) — vezi /app/memory/test_credentials.md
- Brute force: 5 încercări → blocare 15 min (colecția login_attempts)

## Sesiuni Google
- db.user_sessions: {user_id, session_token, expires_at} — TTL index pe expires_at
- Mongo naive datetime → adaugă tzinfo=utc la comparații
