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
- 23.10.2026 (runda 7) — SECURITATE ANTI-FURT: link-uri audio semnate HMAC cu expirare 15 min (/api/media/sign, serve_file 403 fără sig — verificat: 403 fără, 200 cu, 403 expirat/modificat), Protection.jsx (fără click-dreapta/F12/Ctrl+U/S/P, fără drag pe imagini — disuasiv, onest documentat), RadioContext re-semnează automat la expirare; PLAYER BAR oficial din pachetul userului (.pb-: vinil rotativ, eq, pastilă LIVE, hairline progres cu glow) integrat în React cu transportul complet păstrat; pânza de păianjen → SVG inline real (ștersă imaginea); dovleac topit cu mască radială; fix overflow mobil 22px (grid minmax(0,1fr), shrink-0 pe rânduri) — scrollWidth=innerWidth; pastila LIVE vizibilă pe mobil; seek accesibil și cu o singură piesă; testat de agent: backend 32/32, toate fixurile confirmate (iteration_5.json)
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
