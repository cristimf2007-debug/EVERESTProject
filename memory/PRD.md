# BIOXIC — Site oficial (Radio Live 24/7) · OBSIDIAN GLASS (cyan)

## Concept curent (actualizat 24 oct 2026, runda „glass + super-admin")
Site-comunitate pentru artistul BIOXIC / Everest Music (Cristi, 19 ani, Focșani). Temă: deep obsidian (#07090e), glassmorphism 3D ușor, accent cyan #00F0FF (+ roșu live #FF0055). Fonturi: Plus Jakarta Sans (display), Inter (body), JetBrains Mono (etichete). Performanță întâi: zero canvas global, zero efecte pointer-follow, blur doar pe suprafețe plutitoare.
Feature central: **RADIO LIVE 24/7 sincronizat** — NU pornește singur; doar la click explicit; buton mute în player bar.
Regulă de aur: backend-ul rămâne neatins la rebuild-uri vizuale.

## Structură rute
- `/` — Noutăți: hero cu logo oficial UNIC (o singură apariție a brandului pe primul ecran), butoane PayPal + Discord (BIOXIC House, discord.gg/jhCDSq7vqu), banner artist (/artist.jpg, gradient obsidian), card bio (Cristi · 19 ani · Focșani · colaborări Nek Music, LuCash, AMMA, Big Up, Bogdan de la Ploiești, Costel Biju, Jador), CeENou, feed noutăți, linkuri rapide
- `/contact` — WhatsApp +44 7400 998964, email contact@everestmanele.com, PayPal oficial (formular ncp/payment/A8F6WTGW3RU94, fără SDK → CSP neatins), Transfer UK (C Maxim · 20-25-98 · 73583767, butoane Copiază), Discord + socialuri, formular → /api/contact
- `/muzica` — LiveConsole (radio 24/7) + discografie în „stream deck" numerotat (vinil slide-out la hover, tag gen, redări, durată, fire/like, share, versuri dacă există) + Playlisturi
- `/clipuri` — canal video: PRIMII clipurile uploadate (12, „Clipuri BIOXIC", thumbnails din cadre video), apoi rând orizontal „Everest Manele" (YouTube RSS, DOAR canalul Everest); filtre TOATE / CLIPURI BIOXIC / EVEREST MANELE + căutare; FĂRĂ player bar
- `/clipuri/:id` — player intern stil YouTube (viteze, PiP, resume, comentarii, up-next, autoplay)
- `/live` — camera live full-screen (fără header/footer/playerbar): header stream sus, viewport sticlă cu vinyl+spectrum, titlu animat cu spații corecte, transport jos, chat dreapta; mobil: coloană scrollabilă
- `/tv` — BIOXIC TV: stream HLS live (stream.tequilamusic.net/hls/tequila_tv.m3u8 — H.264 1080p50 + AAC, CORS deschis) prin hls.js (Safari: nativ), fără autoplay (overlay play → salt la live edge), controale play/mute/fullscreen, auto-recovery la erori rețea, mesaj clar dacă browserul nu are H.264, chat live alături (LiveChat inRoom), mutex cu radioul; PlayerBar ascunsă; tab TV în header + mnav; CSP media-src/connect-src + stream.tequilamusic.net
- ATENȚIE teste: podul headless NU are codecuri H.264/AAC — redarea video nu e verificabilă în pod (nici clipurile uploadate); pe browsere reale funcționează
- `/secret-mod` — PANOU SUPER ADMIN secret (nelistat): gate login → overview live (fani/abonați/online/logări azi/piese/clipuri/contacte), taburi Utilizatori (kick/mute/ban one-click + flaguri + ultima activitate + abonați), Activitate (tracking logări), Loguri (căutare + filtre)
- `/admin` — panoul clasic de conținut (același login admin), `/pareri`, `*` → 404
- Redirecturi: `/piese` → `/muzica`, `/radio` → `/muzica`, `/despre` → `/contact`

## Poartă de autentificare (24.10, la cererea userului)
- Site-ul public e blocat de un LoginModal `blocking` (fără X, fără dismiss pe backdrop, scroll blocat) până când vizitatorul intră în cont (Google sau email/parolă)
- `/admin` și `/secret-mod` NU sunt afectate (au login admin separat)
- LoginModal blochează scrollul body cât e deschis (orice context)

## Header (taskbar full-width, idee din designul vechi, pe tema actuală)
- Stânga: Noutăți · Muzică & Radio | Centru: LOGO imagine (click → fulger+tunet+șoaptă „No risks, no hits" → LogoModal „Cine sunt eu") | Dreapta: Video · Contact · LIVE·N · Căutare · Clopoțel · Abonează-te · profil (avatar+nume+rang VIP/Fan)
- Mobil: bară jos (Noutăți · Muzică · Video · Contact + avatar)
- Logo-ul mare din hero → StoryModal „De ce există site-ul ăsta" (3 strike-uri YouTube · caz penal · 0 ștergeri aici · 24/7 live)

## Super Admin (backend nou, 24.10)
- Credențiale EXCLUSIVE din .env: cristimf2007@gmail.com / mfcristi2007! — la startup, orice alt cont admin e retrogradat la fan; contul cu emailul din .env e promovat/parolă resincronizată (fără change-password în UI)
- Endpoints (toate `Depends(get_current_admin)`): GET /api/admin/panel/overview, GET /api/admin/panel/users, GET /api/admin/panel/activity?type&q&limit, POST /api/admin/panel/moderate {action: kick|ban|unban|mute|unmute, user_id?, name?, email?}
- Jurnal central `activity_log` (login admin/fan/Google, register, subscribe, contact, moderation) cu IP + ts
- Moderare reală: kick = șterge sesiuni + închide WS (ws_manager.kick_user, mesaj `kicked`); ban = `banned_users` + `banned_names` + kick; ban blocat la /fans/login, /auth/google/session, get_current_fan, WS connect (`banned` → clientul oprește reconectarea); mute = `muted_users` verificat la fiecare mesaj chat
- Fix: conturile fan au _id ObjectId → create_token(str(_id)) + get_current_admin încearcă și ObjectId

## Arhitectură (neschimbată la bază)
- RadioContext = UN SINGUR <audio>; sincronizare la 12s; drift 3s; cooldown seek 15s; link audio semnat cu expirare + Range 206
- **Autoplay OFF**: `wantPlayRef` — onLoaded pornește doar dacă userul a apăsat play (play/playTrack/backToLive setează intenția; pause/stop o șterg)
- MUTEX audio: audio onPlay → `bioxic:audio-play` → VideoPlayer pauză; video play → pauză radio + `__bioxicVideoPlaying`
- Chat: batching rAF, max 200, memo rows, backoff, optimistic (cu retragere la `error` de la server — rate limit/mute), history MERGE la reconectare (fără flicker), `kicked`/`banned` blochează inputul
- Reveal .rv: IntersectionObserver + MutationObserver (conținut montat târziu nu mai rămâne invizibil)
- VideoDust (canvas pointer-reactive) ELIMINAT — cauza latenței de mouse; tilt rămâne doar per-card (transform-only)
- FanContext: cache sessionStorage + revalidare (avatarul nu mai dispare); AvatarImg cu fallback la inițială

## Testare
- iteration_8.json (testing agent): 13/13 pytest backend panel (401 neauth, login greșit, overview, users, activity, mute/unmute persist, ban→403 la login→unban repară, acțiune greșită→400, retrogradare admin vechi); frontend /secret-mod gate+login+taburi+moderare; /live fără header/footer bleed, titlu cu spații, mobil OK; home logo+banner OK; deck numerotat OK
- Verificări manuale după: fără autoplay (paused=true la load, „Ascultă live"), play+mute funcționale, login modal OK, taskbar logo centrat, ambele modale de logo, /clipuri uploads-first + Everest-only + thumbnails din cadre video

## Changelog (rezumat)
- 24.10.2026 — Runda TV & conținut: pagina /tv (HLS hls.js + chat + mutex radio), „Programul de azi" pe /tv (endpoint public GET /api/tv/schedule + editor în /admin: POST/DELETE /api/admin/tv/schedule, highlight „Urmează" după ora curentă), editor VERSURI per piesă în /admin (PATCH lyrics — butonul de lyrics din deck/player apare automat când piesa are text), ALERTĂ PREMIERĂ completă: la upload de clip se trimit acum emailuri abonaților + push (la piese exista deja); curățat datele de test rămase
- 24.10.2026 — FIX LIVE: migrat conținutul preview→producție prin API-ul admin al live-ului (fără Replace-DB, pentru că live-ul are 10+ fani reali): 5 piese + 12 clipuri urcate pe bioxic.ro (clipul de 121MB re-encodat H.264 CRF27 → 65MB din cauza nginx 413); redare verificată pe producție (206 pe audio semnat + video). Live-ul rulează codul nou; vechiul admin (admin@bioxic.ro/bioxic2024) era încă activ pe prod — la următorul redeploy seed-ul îl retrogradează automat. Poarta de login OBLIGATORIE a fost SCOASĂ la cererea userului (conținutul e public; login rămâne pentru chat/pareri). Clipurile Everest Manele se redau acum pe site prin player YouTube embed oficial (youtube-nocookie, modal o singură instanță, pune pauză radioului); CSP: frame-src youtube(+nocookie). Fix: admin login 500 pe conturi Google fără parolă. GOOGLE OAUTH PROPRIU: GET /api/auth/google/start + /api/auth/google/callback (state HMAC fără stocare, x-forwarded-proto/host, cookie session_token+fan_token, fallback la auth.emergentagent.com până la chei; cheile GOOGLE_CLIENT_ID/SECRET sunt setate ca secrets; pe live consimțământul arată bioxic.ro); fix 404 pe /auth/success (rută recunoscută și fără hash session_id)
- 24.10.2026 — GLASS round: 4 pagini (Noutăți/Muzică/Video/Contact), taskbar full-width cu logo centrat, PlayerBar dockable (coadă/versuri/minimize), LiveRoom refăcut fără suprapuneri, VideoDust eliminat, autoplay oprit, stream deck discografie, banner artist, canal video uploads-first + Everest-only, StoryModal+LogoModal, Contact cu date reale, SUPER ADMIN /secret-mod + moderare + jurnal activitate, credențiale admin exclusive, intro „univers" construit și apoi SCOS la cererea userului
- 24.10.2026 — OBSIDIAN v1+v2: rebuild vizual, chat rescris, mutex audio, auto-update, accesibilitate
- 23.10.2026 — hardening securitate, fix live-loop (Range 206), 12 clipuri uploadate

## Backlog
- P1: link real Discord invite (userul trebuie să-l trimită — butonul există, toast „în curând")
- P1: versuri pentru piese (câmpul lyrics există; butonul apare doar dacă are conținut)
- P2: profiluri + feed comunitate (necesită backend nou — de discutat)
- P2: pagina /artist (toate colaborările unui artist)
- P2: email direct la contact@everestmanele.com pentru formularul de contact (acum se salvează în DB + panou admin)
- NOTĂ: seed-ul rulează doar pe baza goală — pe site-ul live (deployat) datele noi din preview nu se copiază decât la primul Deploy
