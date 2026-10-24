# BIOXIC — Site oficial (Radio Live 24/7) · tema OBSIDIAN

## Concept curent (rebuild OBSIDIAN, 24 oct 2026)
Site-canal pentru artistul BIOXIC (manele / remixuri / mashup-uri), temă vizuală „OBSIDIAN": obiect de lux într-o cameră întunecată — obsidian lucios, oțel periat, sticlă fumurie, lumânare portocalie (flame #FF7A1A), Halloween Limited 2026 discret (ștampilă gravată, fum fin, zero elemente cartoonish). Fonturi: Space Grotesk (display), Inter (body), JetBrains Mono (etichete).
Feature central: **RADIO LIVE 24/7 sincronizat** — toți aud aceeași piesă, la aceeași secundă.
Regulă de aur: backend-ul rămâne neatins la rebuild-uri vizuale; noi rute doar pentru profiluri/feed (faza viitoare).

## Structură rute (OBSIDIAN v2, faza 1)
- `/` — Acasă: hero 100vh cu wordmark glossy care urmărește mouse-ul + fum canvas + lumânare, panou „De la ultima vizită" (CeENou, pe baza bioxic_last_visit), bandă „Acum la radio" → camera live, Ultimele piese (reflexie oglindă + tilt), Videoclipuri (3 preview), Cifre (contoare animate), footer BIOXIC gigantic gravat
- `/muzica` — control segmentat Live · Piese · Playlisturi (rute: /muzica, /muzica/piese, /muzica/playlisturi); Live = consolă (vinyl CSS cu șanțuri+sheen, knob play cu inel de progres, waveform AnalyserNode, chat panou sticlă / bottom sheet pe mobil, coada „În rotație")
- `/clipuri` + `/clipuri/:id` — zonă video separată, FĂRĂ player bar; player custom (tastatură, viteze, PiP, fullscreen, resume, autoplay-next)
- `/pareri`, `/despre` (Despre/Contact mutate din taburi în footer), `/admin` (protejat, lazy), `*` → 404
- Redirecturi: `/piese` → `/muzica/piese`, `/live` → `/muzica`
- Header: pilulă plutitoare (Acasă · Muzică · Video + LIVE·N + căutare + clopoțel + Abonează-te + avatar); mobil: bară jos 3 icoane + avatar; meniu avatar: Panou admin (dacă sesiune admin), Setări→Accesibilitate, Ieșire
- Auto-update: `/version.json` + `/changelog.json` (public, no-store), verificare la load/5min/refocus, toast „Versiune nouă" (nu întrerupe video/input), „Mai târziu" snooze 30min, după reload toast „Actualizat ✓"
- Accesibilitate: Setări→4 toggle-uri (clase pe <html>: a11y-rm/contrast/big/noflash), respectă prefers-reduced-motion/contrast, ținte touch ≥44px (pointer:coarse), aria-live pe chat + „Acum la radio"

## Arhitectură
- Frontend: React + Tailwind; `RadioContext` = UN SINGUR element <audio> pentru radio + piese on-demand; MUTEX audio global: `<audio onPlay>` emite `bioxic:audio-play` → VideoPlayer se pune pauză; la play video → pauză radio + `window.__bioxicVideoPlaying` (citit de VersionChecker). Niciodată două surse simultan
- Chat optimizat: buffer + flush 1×/frame (rAF), max 200 mesaje, rânduri memoizate, burst mode (peste 12 msg/s oprește animația de intrare), auto-scroll inteligent + pastilă „X mesaje noi", reconnect backoff 1→2→5→10s + „Se reconectează…", trimitere optimistic, reacții throttled (8/s, max 20), WS unic, hook de stres `window.__bioxicChatStress(n, perSec)`
- Efecte: Preloader (000→100, o dată/sesiune), PageCurtain (0.4s), Cursor custom (desktop, „PLAY" pe covere), Lenis smooth scroll (desktop), reveal .rv prin IntersectionObserver, grain 3% + vignette
- Backend: FastAPI + MongoDB (NEATINS în această rundă); motor radio `radio` + `radio_listeners`; audio semnat cu expirare + Range 206
- Auth: admin cookie httpOnly (admin@bioxic.ro / bioxic2024 — TEST); fani: email/parolă + Google (Emergent)

## Testare
- iteration_7.json: 40/43 backend (2 erori fixture-only), frontend ~98% — toate fluxurile critice verificate; redirecturi single-hop; mutex audio verificat; update-toast verificat cu version.json interceptat; stress chat: FPS constant în timpul injecției (23→23, limita mediului headless), DOM < 200, input responsive; mobil: nav jos + sheet chat fără suprapuneri
- Cunoscut (mediu preview): ingress rescrie SameSite=Strict→None (cod corect); fixture test_signed_audio cere cover_url

## Changelog
- 24.10.2026 — OBSIDIAN v1+v2(faza 1+9+10): rebuild vizual complet frontend-only; navigație 3 taburi + avatar; /muzica cu segmente; redirecturi; CeENou; auto-update version.json; Setări Accesibilitate; chat rescris (batching/memo/backoff/optimistic/burst); FIX STABILITATE AUDIO (mutex global radio↔video); vinyl CSS realist; preloader/cursor/curtain/Lenis; șterse HalloweenIntro/Snowfall; warning react-hooks loadSrc reparat
- 23.10.2026 (runda 11) — 4 piese noi în rotație (total 6, playlist „HIT-uri De Dragoste 2027 by Bioxic"); prev/next verificate; fallback cover = logo
- 23.10.2026 (runda 10) — ROUTE AUDIT: docs dezactivate, 404 stilizat, /adminpanel→404, robots.txt, conturi demo șterse
- 23.10.2026 (runda 9) — SECURITY HARDENING complet (cookie httpOnly, CSP, CORS restrâns, rate limits, chat sanitizat, sourcemaps off)
- 23.10.2026 (runda 8) — FIX BUG CRITIC live-loop (Range 206, offset ceas, drift 3s) + redesign Halloween
- (ulterior) 12 videoclipuri urcate + pagini dedicate /clipuri/{id} cu player custom + descriere standard BIOXIC pe toate

## Backlog prioritizat (din brief-ul OBSIDIAN v2 — ordinea cerută de user)
- P0 următor: Faza 2+3+4+5 — Live POPUP full-screen (/live ca overlay cu URL propriu, shared-element vinyl), vinyl cu spectrum circular 96–128 bare (fftSize 2048, peak-hold, beat kick 20–150Hz, moduri Ring/Liquid/Minimal, particule la kick, culori din cover), titlu animat literă cu literă, chips artiști, story card 1080×1920 la share, chat „bule de lumină" + Moments (separator la schimbarea piesei) + reacții din vinyl + Hype meter + reply/@mențiuni + /cere piesă
- P1: Faza 6 — Playlist cover flow 3D + pagină playlist cu hero mozaic + timeline + drawer „Urmează" în player bar
- P1: Faza 8 — Video: fundal WebGL interactiv (particule reactiv la mouse/touch), tilt pe thumbnails, preview mut la hover
- P2: Faza 7 — Profiluri + feed comunitate (SINGURA fază cu backend nou: users/profiles/posts/follows/likes/comments/reports, upload avatar/banner WebP, moderare, notificări, ștergere cont)
- P2: Stripe donații „Susține-l pe BIOXIC" (în așteptarea confirmării userului)
- P2: Pagina /artist (toate colaborările unui artist)
