# 🚀 Pornire aplicație BIOXIC (PostgreSQL + Node.js + Prisma) în VS Code

Acest fișier explică pașii exact pe care trebuie să îi urmezi în terminalul VS Code pentru a instala, configură și porni aplicația după migrarea de la MongoDB la PostgreSQL.

---

## 1. Preivezere structură

```
EVERESTProject_V2/
├── backend-node/          # Backend Node.js + Express + Prisma + PostgreSQL
│   ├── prisma/
│   │   ├── schema.prisma  # Schema relațională (28 tabele)
│   │   ├── seed.js        # Seed admin + date demo
│   │   └── migrations/    # Migrații Prisma generate automat
│   ├── src/
│   │   ├── index.js       # Punct de intrare server (Express + WebSocket chat)
│   │   ├── controllers/   # 25 controlere (toate endpoint-urile originale)
│   │   ├── routes/        # 20 fișiere de rute (calea /api păstrată)
│   │   ├── lib/           # prisma.js, storage.js, auth.js
│   │   └── middleware/    # auth.js, security.js, errorHandler.js
│   ├── .env               # Variabile locale (NU se commita)
│   ├── .env.example       # Template fără credențiale reale
│   ├── package.json
│   └── INSTRUCTIUNI_VS_CODE.md
└── frontend/              # React (Craco/Tailwind) - fără modificări design
```

---

## 2. Instalare PostgreSQL (Windows)

Dacă nu ai PostgreSQL instalat:

1. Descarcă instalatorul de la: https://www.postgresql.org/download/windows/
   - Alege versiunea 14 sau 16
2. Rulează instalatorul:
   - Setează o parolă pentru utilizatorul `postgres` ( Exemplu: `postgres` )
   - Portul default este `5432`
3. După instalare, deschide **pgAdmin 4** sau rulează `psql`:
   ```sql
   CREATE DATABASE bioxic;
   ```
4. Verifică că PostgreSQL ascultă pe `localhost:5432`.

---

## 3. Configurare variabile de mediu (`backend-node/.env`)

Fișierul `backend-node/.env` este deja creat. Asigură-te că `DATABASE_URL` conține credentialele tale reale:

```env
DATABASE_URL="postgresql://postgres:REPLACE_ME@localhost:5432/bioxic"
PORT=5000
CORS_ORIGINS=http://localhost:3000
JWT_SECRET=un-secret-mare-cu-peste-32-de-caractere
ADMIN_EMAIL=admin@bioxic.ro
ADMIN_PASSWORD=alege-o-parolă-unică-de-minim-16-caractere
```

- `DATABASE_URL` — string de conexiune PostgreSQL
- `JWT_SECRET` — secret aleatoriu de cel puțin 32 de bytes, unic mediului
- `CORS_ORIGINS` — origini permise pentru frontend (separate prin virgulă)
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — contul admin configurat la pornire; parola trebuie să aibă 16–72 bytes

Generează valori reale înainte de pornire. Nu folosi valorile exemplu drept credențiale și nu comita fișiere `.env`.
Fișierul `backend-node/.env.example` este doar un șablon cu valori `REPLACE_ME`.

---

## 4. Comenzi terminal VS Code (în `backend-node/`)

Deschide terminalul în VS Code (`Ctrl + ` ``) și navează în `backend-node`:

```powershell
cd backend-node
```

### Pasul 1 — Instalează dependințele (doar prima dată sau după modificări în `package.json`)
```powershell
npm install
```

### Pasul 2 — Generează Prisma Client
```powershell
npx prisma generate
```

### Pasul 3 — Creează și aplică migrația inițială
```powershell
npx prisma migrate dev --name init
```

Dacă adaugi tabele noi ulterior:
```powershell
npx prisma migrate dev --name nume_migrare
```

### Pasul 4 — Rulează seed-ul (admin + demo tracks)
```powershell
node prisma/seed.js
```

### Pasul 5 — Pornește serverul
```powershell
node src/index.js
```

Output așteptat:
```
✅ Conectat la PostgreSQL
✅ Admin verificat/creat
🚀 BIOXIC backend pornit pe http://localhost:5000
📊 WebSocket chat: ws://localhost:5000/api/ws/chat
```

---

## 5. Verificare endpoint-uri

Într-un alt terminal sau browser, testează:

```powershell
curl.exe http://localhost:5000/health
# {"status":"ok","service":"bioxic-backend"}

curl.exe http://localhost:5000/api/tracks
# lista de piese demo

curl.exe http://localhost:5000/api/radio/now
# status radio

curl.exe http://localhost:5000/api/admin/announcements
# lista de anunțuri
```

---

## 6. Configurare front-end (`frontend/`)

Verifică `frontend/.env` — `REACT_APP_BACKEND_URL` trebuie să pointeze spre backend-ul Node:

```env
REACT_APP_BACKEND_URL=http://localhost:5000
```

Pornire front-end (în terminal separat, în `frontend/`):
```powershell
cd frontend
npm start
```

Front-endul rulează pe `http://localhost:3000` și consumă API-urile de pe `http://localhost:5000/api`.

---

## 7. Resetare completă bazei de date (dacă e nevoie)

```powershell
npx prisma migrate reset
node prisma/seed.js
```

⚠️ `migrate reset` șterge toate datele și re-apliquează migrațiile de la zero.

---

## 8. Comenzi utile Prisma

```powershell
# Vezi schema în baza de date
npx prisma studio

# Generează din nou clientul după modificări în schema.prisma
npx prisma generate

# Aplică migrațiile pendente
npx prisma migrate dev
```

---

## 9. Depanare

| Eroare | Cauză probabilă | Soluție |
|--------|-----------------|---------|
| `Authentication failed` | `DATABASE_URL` greșit | Verifică user/parolă în `.env` |
| `Cannot find module '...'` | Dependențe lipsă | Rulează `npm install` |
| `Prisma schema validation` | Eroare în `schema.prisma` | Rulează `npx prisma validate` |
| Port 5000 ocupat | Alt proces pe 5000 | Schimbă `PORT` în `.env` sau oprește procesul |

---

## 10. Resetare server (Ctrl + C)

Pentru a opri serverul, apasă `Ctrl + C` în terminalul VS Code.
