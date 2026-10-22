# BIOXIC — PRD

## Problem statement (original)
Site oficial complet pentru artistul/producătorul BIOXIC (Manele Remixate + Manele Artificiale AI): pagină de intrare, home cu videoclipuri YouTube live din RSS, player muzical propriu persistent, pagină LIVE cu chat realtime și reacții, galerie videoclipuri, despre, contact/booking, panou admin (upload piese, control live, moderare, statistici), conturi de fan cu Google + email, notificări email la lansări, Discord BIOXIC HOUSE, temă dark verde-toxic (#39FF14 / #050805), română.

## Stack (adaptat la platformă)
React (CRA/craco) + FastAPI + MongoDB (motor). Uploaduri → Emergent Object Storage. Auth: JWT (bcrypt) + Emergent Google OAuth. Email: Resend managed prin proxy Emergent. WS propriu pentru chat live. YouTube RSS fără cheie API.

## Identitate & reguli de brand
- Numele: BIOXIC (mereu caps). Motto: „No risks, no hits." — NICIODATĂ „virus"/„infecție" în copy (utilizatorul a interzis explicit).
- Citat: „Un tinerel în curs de perfeționare" — Nicolae Guță.
- Despre: Cristi, 19 ani, 50M+ vizualizări, colaborări: Nicolae Guță, Nek Music, Șușanu, 210 Production, AMMA, Big Up Music.
- Logo: logo.png (mare, italic) = hero/first page; logo-alt.png (orizontal) = navbar/cont/favicon. Nu repeta logo-ul excesiv.
- Linkuri: YouTube @djbioxic (UC2gQmatVSAB3nzqeDmYY3gw), TikTok @bioxic.exe, Instagram @crss.exe_, Spotify artist 4tlelg9L2y1OFOVpUkIiAK, Discord https://discord.gg/PJ5A45SkRs, WhatsApp +44 7400 998964.
- Ecranul de intrare cu tranziție GSAP a fost ELIMINAT la cererea utilizatorului (22.10) — site-ul intră direct pe Home.

## Implementat (22.10.2026, iter 2)
- Home curățat: fără secțiunea „Ultimele videoclipuri"; secțiune ANUNȚURI (admin postează → apare pe Home + notificare on-site + email).
- Canalul BIOXIC (/muzica): header de canal cu Follow (contor), listă piese stil Spotify, secțiune Everest Manele cu cele 5 piese oficiale (Apple Music/YT Music) + linkuri platforme (Spotify = „în curând").
- Live: prezență cu nume+avatar (join/leave în chat), tap-tap likes cu contor, panou donații (PayPal + transfer UK), follow direct din pagină, profiluri clickabile din chat.
- Profil fan: editare nume/bio/avatar/banner (upload în object storage), profil public /fan/:id.
- Gaming (/gaming): control live separat din admin, clipuri gaming uploadate (MP4), CTA Discord.
- Notificări on-site: clopoțel în navbar cu badge necitite (live/gaming/piesă/video/anunț).
- Admin: taburi noi — Video (upload MP4), Anunțuri, Admini (multi-admin), control Gaming.
- Securitate: rutele admin verifică role=admin (fanii primesc 401/403).
- Curățenie brand: eliminate toate imaginile/referințele „toxic"/virus (inclusiv coverurile demo).

## Implementat (22.10.2026, iter 1)
- Home: hero cu poza artistului + logo + „No risks, no hits.", card Ultima lansare, ticker marquee, videoclipuri YouTube din RSS cu filtre (Toate/Remixuri/AI/Originale) + badge NOU, stats, carduri Remixate vs AI, citat Guță, secțiune Discord BIOXIC HOUSE + cont fan, CTA live.
- Muzică: player persistent (play/pause/next/prev/shuffle/repeat/volum/progres/vizualizare), filtre, like (+favorite în cont), ascultări, share link, download per piesă, comentarii.
- Live: embed YouTube live, chat WS realtime, reacții animate (fire/heart/crown), contor spectatori, cereri de piese, program + countdown.
- Videoclipuri: galerie RSS + lightbox + căutare.
- Despre: poveste, citat, colaborări, timeline.
- Contact: formular booking, WhatsApp, Discord, social, newsletter.
- Cont fan: email/parolă + Google (Emergent OAuth), profil, favorite, notificări.
- Admin /admin: login, upload/edit/ștergere piese (audio+cover în object storage), control LIVE + program, moderare chat/comentarii (ban/șterge), cereri, mesaje, statistici, editare texte.
- Automatizări: detectare videoclip nou din RSS → banner mare pe site (poll 60s) + email abonați; email la piesă nouă / live pornit (Resend managed); newsletter.
- SEO: title/OG/favicon; performanță: imagini optimizate (artist.jpg 172KB), lazy loading, canvas particles ușor.

## Placeholdere rămase (de completat de utilizator)
- [EMAIL_OFICIAL] — email oficial contact
- [LINK_PAYPAL] — link donații PayPal
- YOUTUBE_API_KEY — pentru contoare live abonați/vizualizări (altfel fallback static)
- Logo-urile colaboratorilor (acum text)
- Piese reale MP3 (acum 4 demo generate, marcate [DEMO])

## Backlog
- P0: nimic blocant
- P1: toggle EN/RO, PWA manifest complet, mod „Party" vizualizator fullscreen, story-uri/postări pe profilul fanilor, mesaje private între fani
- P2: RTMP direct (Mux/Cloudflare Stream), apeluri audio/video fan→fan (WebRTC — necesită infra separată), waveform real (WebAudio analyser)
