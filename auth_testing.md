# Auth Testing Playbook (Emergent Google Auth) — rezumat operațional

Flow: buton login → `https://auth.emergentagent.com/?redirect=${encodeURIComponent(window.location.origin + '/')}` → revine cu `#session_id=...` → detectare SINCRON în render via `useLocation().hash` → POST /api/auth/google/session {session_id} (backend schimbă la demobackend.emergentagent.com/auth/v1/env/oauth/session-data cu header X-Session-ID) → cookie httpOnly `session_token` (7 zile, secure, samesite=none) → curăță hash-ul.

REGULI CRITICE:
- REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
- session-data se cheamă DOAR din backend
- AuthProvider sare peste /fans/me dacă hash conține session_id=
- AuthCallback folosește useRef flag (StrictMode safe)
- Useri: câmp custom user_id (UUID), proiecție {"_id": 0} mereu
- Sesiuni: db.user_sessions {user_id, session_token, expires_at}; comparare datetime tz-aware
- Logout: POST /api/fans/logout șterge sesiunea + cookie-urile (session_token, fan_token)

## Test manual (fără cont Google real — backend):
1. Inserează user+s sesiune de test în Mongo (bioxic db): db.users.insertOne({user_id:'user_test123', email:'test.fan@example.com', name:'Test Fan', picture:'', role:'fan', created_at:new Date().toISOString()}); db.user_sessions.insertOne({user_id:'user_test123', session_token:'test_session_ABC', expires_at:new Date(Date.now()+7*864e5), created_at:new Date()})
2. curl /api/fans/me cu header `Authorization: Bearer test_session_ABC` — NOTĂ: bearer trece prin ramura JWT, deci pentru session_token folosește cookie: curl -H "Cookie: session_token=test_session_ABC"
3. Cleanup: șterge userul/sesiunea de test.

## Test browser: set cookie session_token + navighează — chip-ul de utilizator trebuie să apară în header.
