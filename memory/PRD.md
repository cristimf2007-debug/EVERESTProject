# BIOXIC — Site oficial (Radio Live 24/7)

## Concept curent (după rebuild-ul din 23 oct 2026)
Site în stil de **canal YouTube** pentru artistul BIOXIC (manele / remixuri / mashup-uri).
Feature-ul central: **RADIO LIVE 24/7 sincronizat** — toți vizitatorii aud aceeași piesă, la aceeași secundă, ca la radio.
Tagline: „No risks, no hits." — fără estetică generică AI, fără termeni „virus/toxic".

## Structură
- `/` — Live 24/7: vinyl rotativ, equalizer, badge LIVE + contor ascultători (heartbeat), „Acum la radio", „Urmează", playlistul în rotație
- `/piese` — carduri stil YouTube cu cover, redări, durată; play individual → revine automat la live la final
- `/despre` — bio, statistici, social (YouTube @djbioxic, TikTok @bioxic.exe, IG @crss.exe_, Spotify)
- `/admin` — DOAR upload muzică (MP3/WAV + cover), listă piese, ștergere, „sari la piesa următoare"

## Arhitectură
- Frontend: React + Tailwind, `RadioContext` (audio global, sync 12s, drift >3s, heartbeat 30s), `ChannelHeader`, `PlayerBar` persistent, `Equalizer`
- Backend: FastAPI + MongoDB; motor radio: colecția `radio` (index + started_at), durată piesă calculată cu mutagen la upload/leneș, ascultători în `radio_listeners` (75s fereastră), abonați în `channel_subs`
- Storage: Emergent Object Storage (`/api/files/...`)
- Auth: JWT admin (admin@bioxic.ro / bioxic2024 — TEST)

## Endpoint-uri cheie
- `GET /api/radio/now` · `POST /api/radio/heartbeat` · `POST /api/admin/radio/skip`
- `GET /api/channel/stats` · `POST /api/channel/subscribe`
- `GET /api/tracks` · `POST /api/admin/tracks` · `DELETE /api/admin/tracks/{id}`
- `POST /api/auth/login`

## Changelog
- 23.10.2026 (runda 9) — SECURITY HARDENING complet (iteration_6.json): cookie admin httpOnly+Secure+SameSite=Strict 24h, fără token în localStorage; /admin lazy-loaded (codul de admin nu intră în bundle-ul public); headere pe toate /api: CSP strict, X-Frame-Options DENY, nosniff, Referrer-Policy, HSTS, Permissions-Policy; CORS restrâns la domeniul site-ului; rate limit global 120/min/IP + login lockout per IP real (x-forwarded-for — fix bypass prin load-balancer); chat WS: payload max 2KB, nume 24 car, text 200 car, HTML curățat server-side, filtru cuvinte vulgare, 1 msg/2s + 20/min, reacții max 5/s; GENERATE_SOURCEMAP=false; mesaj copyright în consolă; controlsList nodownload pe audio. Limitare de mediu documentată: ingress-ul de preview rescrie SameSite=Strict→None;Partitioned (codul e corect; în producție rămâne Strict): suport HTTP Range (206, Accept-Ranges) în serve_file — cauza principală a repornirilor la seek; offset de ceas server−client din server_time; poziție așteptată calculată local între poll-uri; prag drift 3s; sursa se schimbă DOAR la trackId nou (data-track); verificat: timeline monoton 16s peste un ciclu de poll, fără restart. PART 2 vizual: fonturi Dela Gothic One + Manrope, paleta oficială --site-* (bg #0A0807, panel rgba(21,16,13,.72), accent #E8731A, live #C21D1D), vignette grea, taburi underline portocaliu cu glow + tab ADMIN, waveform audio-reactiv pe canvas (AnalyserNode, partea cântată portocalie), halo pe vinyl pulsând pe bas, Piese ca grid de covere cu hover lift+glow, chat limită 60 mesaje DOM
- 23.10.2026 (runda 8) — FIX BUG CRITIC live-loop (HTTP Range 206, offset ceas server, drift 3s, sursa doar la trackId nou) + redesign Halloween complet: fonturi Dela Gothic One + Manrope, paleta --site-*, vignette, taburi underline cu glow + ADMIN, waveform AnalyserNode, halo vinyl pe bas, Piese grid covere
- 23.10.2026 (runda 10) — ROUTE AUDIT & CLEANUP: docs/Swagger/openapi dezactivate (404); catch-all → pagină 404 stilizată (NotFound.jsx) în loc de Live; /adminpanel și orice variantă → 404 fără redirect; robots.txt (doar pagini publice, fără /admin); șterse conturile fan demo/test (fan@test.ro, fan.demo@test.ro) — a rămas 1 admin + contul real al userului; verificat: toate endpointurile /admin/* dau 401 fără cookie; /.env, /.git, /package.json etc. returnează shell-ul SPA, NU fișierele reale; piesa #2 + playlistul userului funcționează (2 piese în rotație, grupuri pe /piese)
- 23.10.2026 (runda 7) — SECURITATE ANTI-FURT: link-uri audio semnate HMAC (15 min, 403 fără/expirat), Protection.jsx (fără F12/click-dreapta), player bar oficial .pb- din pachetul userului, cobweb SVG, dovleac cu mască, fix overflow mobil, testat agent 32/32 (iteration_5.json)
- 23.10.2026 (runda 6) — HALLOWEEN LIMITED 2026 (doar strat vizual, toată logica intactă): paletă near-black #0A0907 + portocaliu ars #E8731A + roșu-sânge #8B0E0E + alb-os #EDE6D6; assets generate (dovleac fotorealist + pânză păianjen în /public/halloween/); ninsoarea înlocuită cu jăratic plutitor (densitate redusă pe mobil), liliac ocazional la 20-40s, ceață joasă; banner desaturat + vignette + 2 straturi de ceață; lumânare pâlpâitoare în spatele logo-ului; badge HALLOWEEN·LIMITED 2026 + tag EDITION 31/10/2026·Nº001; text vertical outline „LIMITED 2026" fix pe margine; titlu RADIO BIOXIC cu mască distressed + jăratic din litere; vinyl cu rim portocaliu + pânză; buton live gradient sânge→portocaliu; reacții chat 🎃🔥💀 + placeholder „Scrie ceva… dacă ai curaj"; intro cinematografic 2.6s o dată/sesiune (skippable); easter egg logo: fulger 0.3s + tunet sintetizat WebAudio + șoaptă „NO RISKS, NO HITS."; toate animațiile GPU-only + prefers-reduced-motion respectat
- 23.10.2026 (runda 5b) — MEMORIE ABONAȚI server-side: /api/channel/status (după sid + cont + email), abonarea supraviețuiește pe orice dispozitiv dacă ești logat; FIX COMPLET player: controller unic cu stări (idle/loading/playing/paused/stopped/error), transport complet (prev/play/stop/next/seek/volum/mute), fără reporniri (drift 6s + cooldown + guard readyState/seeking), Stop nu repornește singur, sfârșit de playlist → revine la live fără buclă infinită; buton Stop pe pagina Live; chat redesenat stil streaming (avatar, nume colorate, timestamp la hover)
- 23.10.2026 (runda 4) — CONTACT funcțional pe /despre; pagină PĂRERI cu stele; admin: Mesaje contact + Păreri fani
- 23.10.2026 (runda 3) — LOGO INTERACTIV pe banner: click → panou 3D „Cine sunt eu" (portal în body, tilt care urmărește mouse-ul, poza + info Cristi aka BIOXIC); reacții chat inimă/foc/coroană cu iconițe plutitoare la toți conectații; PLAYLISTURI TEMATICE (câmp playlist la upload + edit per piesă, grupare + filtre pe /piese); MODERARE CHAT în /admin (ștergere + ban în 2 pași, fără window.confirm); ban case-insensitive; keepalive WS; testat (iteration_3.json: backend 24/24) + fixuri verificate manual
- 23.10.2026 (runda 2) — REVENIRE la tema veche de iarnă (verde-pădure + auriu, Unbounded/Onest, ninsoare, glass) peste structura de canal; banner cu poza reală a artistului (/artist.jpg) + logo.png; CHAT LIVE realtime sub radio (WS /api/ws/chat, nume fan, inimi plutitoare, contor spectatori); buton SHARE pe piese (WhatsApp direct, TikTok/copy link cu OG page /api/share/{id}); mini-player plutitor cu efect 3D de apariție + shimmer auriu; playlist restilizat (rânduri numerotate); testat 100% backend+frontend (iteration_2.json)
- 23.10.2026 — REBUILD TOTAL: șters conceptul vechi (teme Iarnă/Ianuarie, chat, gaming, conturi fan, pagina piesei #01 dedicată); reconstruit ca canal YouTube cu radio 24/7; reparat bugul critic „Maximum update depth exceeded" (countdown cu dep instabilă) care îngheța toată navigarea; testat 100% (iteration_1.json)
- mai devreme — teme Iarnă/Ianuarie, auth Google+fani, anunțuri, pagină Track #01 (eliminate la rebuild)

## Backlog prioritizat
- P0: utilizatorul urcă piesele reale din /admin (radioul le preia automat în rotație)
- P1: link SoundCloud real pentru BIOXIC (dacă mai e dorit undeva pe site)
- P2: chat live sub radio (tip YouTube Live), playlist-uri, program live-uri anunțate
- P2: refactor server.py (1450+ linii) în routers separate
