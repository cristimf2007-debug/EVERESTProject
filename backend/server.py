from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, UploadFile, File, Form, WebSocket, WebSocketDisconnect
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from typing import Optional, List
import os, uuid, logging, json, asyncio, time, re, io, wave, struct, math
import bcrypt, jwt, httpx, requests
import xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ---------- EMERGENT OBJECT STORAGE ----------
STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "bioxic"
_storage_key = None

def init_storage(force: bool = False):
    global _storage_key
    if _storage_key and not force:
        return _storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    resp.raise_for_status()
    _storage_key = resp.json()["storage_key"]
    return _storage_key

def put_object(path: str, data: bytes, content_type: str) -> dict:
    resp = requests.put(f"{STORAGE_URL}/objects/{path}",
                        headers={"X-Storage-Key": init_storage(), "Content-Type": content_type},
                        data=data, timeout=180)
    if resp.status_code == 404:
        init_storage(force=True)
        resp = requests.put(f"{STORAGE_URL}/objects/{path}",
                            headers={"X-Storage-Key": _storage_key, "Content-Type": content_type},
                            data=data, timeout=180)
    resp.raise_for_status()
    return resp.json()

def get_object(path: str):
    resp = requests.get(f"{STORAGE_URL}/objects/{path}",
                        headers={"X-Storage-Key": init_storage()}, timeout=120)
    if resp.status_code == 404 and not path.startswith(APP_NAME):
        init_storage(force=True)
        resp = requests.get(f"{STORAGE_URL}/objects/{path}",
                            headers={"X-Storage-Key": _storage_key}, timeout=120)
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

JWT_ALGORITHM = "HS256"
CHANNEL_ID = "UC2gQmatVSAB3nzqeDmYY3gw"
RSS_URL = f"https://www.youtube.com/feeds/videos.xml?channel_id={CHANNEL_ID}"

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ---------- AUTH ----------

def hash_password(p: str) -> str:
    return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()

def verify_password(p: str, h: str) -> bool:
    try:
        return bcrypt.checkpw(p.encode(), h.encode())
    except Exception:
        return False

def create_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "type": "access",
               "exp": datetime.now(timezone.utc) + timedelta(hours=12)}
    return jwt.encode(payload, os.environ["JWT_SECRET"], algorithm=JWT_ALGORITHM)

async def get_current_admin(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(401, "Neautentificat")
    try:
        payload = jwt.decode(token, os.environ["JWT_SECRET"], algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"_id": payload["sub"]})
        if not user:
            raise HTTPException(401, "Utilizator inexistent")
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expirat")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Token invalid")

class LoginInput(BaseModel):
    email: str
    password: str

@api_router.post("/auth/login")
async def login(input: LoginInput, request: Request, response: Response):
    email = input.email.lower().strip()
    identifier = f"{request.client.host}:{email}"
    attempts = await db.login_attempts.find_one({"identifier": identifier})
    if attempts and attempts.get("count", 0) >= 5:
        locked_until = attempts.get("locked_until")
        if locked_until and datetime.fromisoformat(locked_until) > datetime.now(timezone.utc):
            raise HTTPException(429, "Prea multe încercări. Reîncearcă în 15 minute.")
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(input.password, user["password_hash"]):
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$inc": {"count": 1}, "$set": {"locked_until": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()}},
            upsert=True)
        raise HTTPException(401, "Email sau parolă greșită")
    await db.login_attempts.delete_one({"identifier": identifier})
    token = create_token(user["_id"], email)
    response.set_cookie("access_token", token, httponly=True, secure=True, samesite="none", max_age=43200, path="/")
    return {"token": token, "user": {"email": email, "role": user.get("role", "admin")}}

@api_router.get("/auth/me")
async def auth_me(admin=Depends(get_current_admin)):
    return {"email": admin["email"], "role": admin.get("role", "admin")}

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}

async def seed_admin():
    email = os.environ.get("ADMIN_EMAIL", "admin@bioxic.ro").lower()
    password = os.environ.get("ADMIN_PASSWORD", "bioxic2024")
    existing = await db.users.find_one({"email": email})
    if not existing:
        await db.users.insert_one({"_id": str(uuid.uuid4()), "email": email,
                                   "password_hash": hash_password(password),
                                   "role": "admin", "created_at": datetime.now(timezone.utc).isoformat()})
    elif not verify_password(password, existing["password_hash"]):
        await db.users.update_one({"email": email}, {"$set": {"password_hash": hash_password(password)}})

# ---------- EMAIL (Resend managed, prin proxy Emergent) ----------
from html import escape as html_escape
from html.parser import HTMLParser
from urllib.parse import urlparse
import ipaddress

EMAIL_BASE_URL = "https://integrations.emergentagent.com"  # constant, nu din env
EMAIL_KEY = os.environ.get("EMERGENT_EMAIL_KEY")
EMAIL_FROM_NAME = os.environ.get("EMAIL_FROM_NAME", "BIOXIC")
SITE_URL = os.environ.get("SITE_URL", "")

_SHORTENERS = ("bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "goo.gl", "rebrand.ly")
_CRED_ASK = ("reply with your password", "reply with the code", "send your password", "cvv",
             "send us your password", "enter your password below", "confirm your card number",
             "your full card number", "seed phrase", "recovery phrase", "verify your card",
             "social security number", "confirm your bank details")
_HOSTISH = re.compile(r"\b(?:https?://)?((?:[a-z0-9-]+\.)+[a-z]{2,})", re.I)

def _host_ok(host: str) -> bool:
    if not host or "xn--" in host:
        return False
    try:
        ipaddress.ip_address(host)
        return False
    except ValueError:
        pass
    return not any(host == s or host.endswith("." + s) for s in _SHORTENERS)

def _same_site(shown: str, real: str) -> bool:
    return shown == real or real.endswith("." + shown) or shown.endswith("." + real)

class _EmailScan(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags, self.urls, self.anchors = set(), [], []
        self._href, self._text = None, []
    def handle_starttag(self, tag, attrs):
        self.tags.add(tag.lower())
        self.urls += [v for k, v in attrs if k.lower() in ("href", "src") and v]
        if tag.lower() == "a":
            self._href = dict((k.lower(), v) for k, v in attrs).get("href")
            self._text = []
    def handle_data(self, data):
        if self._href is not None:
            self._text.append(data)
    def handle_endtag(self, tag):
        if tag.lower() == "a" and self._href is not None:
            self.anchors.append((self._href, "".join(self._text)))
            self._href, self._text = None, []

def _assert_safe_email(subject: str, html: str) -> None:
    scan = _EmailScan(); scan.feed(html)
    if scan.tags & {"form", "input", "textarea", "select"}:
        raise ValueError("No forms in email (G2)")
    body = f"{subject}\n{html}".lower()
    for p in _CRED_ASK:
        if p in body:
            raise ValueError(f"Credential ask in email: {p!r} (G2)")
    for url in scan.urls:
        low = url.strip().lower()
        if low.startswith(("mailto:", "tel:", "cid:", "#")):
            continue
        if not low.startswith("https://"):
            raise ValueError(f"Email links must be absolute https: {url!r} (G3)")
        host = urlparse(low).hostname or ""
        if not _host_ok(host) or urlparse(low).username is not None:
            raise ValueError(f"Bad URL host: {url!r} (G3)")
    for href, text in scan.anchors:
        real = urlparse(href.strip().lower()).hostname or ""
        if not real:
            continue
        for m in _HOSTISH.finditer(text):
            if not _same_site(m.group(1).lower(), real):
                raise ValueError(f"Anchor text {m.group(1)!r} != link host {real!r} (G3)")

async def send_email(*, to: str, subject: str, html: str):
    """Trimite email; niciodată nu aruncă — notificările nu blochează fluxul principal."""
    if not EMAIL_KEY:
        logger.warning("EMERGENT_EMAIL_KEY lipsă — email netrimis")
        return None
    try:
        _assert_safe_email(subject, html)
    except ValueError as ex:
        logger.error(f"Email blocat de gate: {ex}")
        return None
    payload = {"to": [to], "subject": subject, "html": html, "from_name": EMAIL_FROM_NAME}
    try:
        async with httpx.AsyncClient(timeout=30) as http:
            resp = await http.post(f"{EMAIL_BASE_URL}/api/v1/email/send",
                                   headers={"X-Email-Key": EMAIL_KEY}, json=payload)
        resp.raise_for_status()
        return resp.json().get("id")
    except Exception as ex:
        logger.warning(f"Email către {to} eșuat: {ex}")
        return None

def email_template(titlu: str, mesaj: str, cta_text: str, cta_url: str) -> str:
    return (f'<table role="presentation" width="100%" style="background:#050805;padding:32px 0"><tr><td align="center">'
            f'<table role="presentation" width="560" style="background:#0a120a;border:1px solid rgba(57,255,20,0.3);padding:32px;font-family:Arial,sans-serif">'
            f'<tr><td><p style="color:#39FF14;font-size:26px;font-weight:900;letter-spacing:-1px;margin:0">BIOXIC</p>'
            f'<h1 style="color:#ffffff;font-size:20px;margin:24px 0 12px">{html_escape(titlu)}</h1>'
            f'<p style="color:#a1a1aa;font-size:14px;line-height:1.6">{html_escape(mesaj)}</p>'
            f'<a href="{html_escape(cta_url)}" style="display:inline-block;margin-top:20px;background:#39FF14;color:#050805;'
            f'font-weight:bold;font-size:13px;letter-spacing:2px;text-transform:uppercase;padding:14px 28px;text-decoration:none">{html_escape(cta_text)}</a>'
            f'<p style="color:#52525b;font-size:11px;margin-top:32px">Ai primit acest email pentru că te-ai abonat pe site-ul BIOXIC. '
            f'Nu îți cerem niciodată parola sau date de card prin email.</p></td></tr></table></td></tr></table>')

async def notify_subscribers(titlu: str, mesaj: str, cta_text: str, cta_url: str, subject: str):
    """Notifică abonații newsletter + fanii înregistrați (liste proprii, cu acord)."""
    if not SITE_URL:
        return
    html = email_template(titlu, mesaj, cta_text, cta_url)
    recipients = set()
    async for d in db.newsletter.find({}, {"_id": 0, "email": 1}):
        recipients.add(d["email"])
    async for d in db.users.find({"role": "fan"}, {"_id": 0, "email": 1}):
        recipients.add(d["email"])
    for to in list(recipients)[:500]:
        await send_email(to=to, subject=subject, html=html)
    logger.info(f"Notificare trimisă către {len(recipients)} abonați: {subject}")

# ---------- FAN ACCOUNTS (email/parolă + Google) ----------

class FanRegister(BaseModel):
    name: str
    email: str
    password: str

class FanLogin(BaseModel):
    email: str
    password: str

def create_fan_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "type": "fan",
               "exp": datetime.now(timezone.utc) + timedelta(days=7)}
    return jwt.encode(payload, os.environ["JWT_SECRET"], algorithm=JWT_ALGORITHM)

def fan_out(u: dict) -> dict:
    return {"user_id": u.get("user_id") or u.get("_id"), "name": u.get("name", "Fan"),
            "email": u["email"], "picture": u.get("picture", ""), "role": u.get("role", "fan")}

async def get_current_fan(request: Request) -> dict:
    # 1. session_token (Google OAuth)
    st = request.cookies.get("session_token")
    if st:
        sess = await db.user_sessions.find_one({"session_token": st})
        if sess:
            exp = sess["expires_at"]
            if isinstance(exp, str):
                exp = datetime.fromisoformat(exp)
            if exp.tzinfo is None:
                exp = exp.replace(tzinfo=timezone.utc)
            if exp > datetime.now(timezone.utc):
                user = await db.users.find_one({"user_id": sess["user_id"]})
                if user:
                    return user
    # 2. JWT (Bearer sau cookie fan_token)
    token = request.cookies.get("fan_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(401, "Intră în cont pentru a continua")
    try:
        payload = jwt.decode(token, os.environ["JWT_SECRET"], algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"$or": [{"user_id": payload["sub"]}, {"_id": payload["sub"]}]})
        if not user:
            raise HTTPException(401, "Cont inexistent")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Sesiune expirată — autentifică-te din nou")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Sesiune invalidă")

@api_router.post("/fans/register")
async def fan_register(f: FanRegister, response: Response):
    email = f.email.lower().strip()
    name = f.name.strip()[:60]
    if not name:
        raise HTTPException(400, "Completează numele")
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
        raise HTTPException(400, "Adresa de email nu pare validă")
    if len(f.password) < 6:
        raise HTTPException(400, "Parola trebuie să aibă minimum 6 caractere")
    if await db.users.find_one({"email": email}):
        raise HTTPException(400, "Există deja un cont cu acest email. Încearcă să te autentifici.")
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    await db.users.insert_one({"user_id": user_id, "email": email, "name": name,
                               "password_hash": hash_password(f.password), "role": "fan",
                               "created_at": datetime.now(timezone.utc).isoformat()})
    token = create_fan_token(user_id, email)
    response.set_cookie("fan_token", token, httponly=True, secure=True, samesite="none", max_age=604800, path="/")
    return {"token": token, "user": fan_out({"user_id": user_id, "email": email, "name": name})}

@api_router.post("/fans/login")
async def fan_login(f: FanLogin, response: Response):
    email = f.email.lower().strip()
    user = await db.users.find_one({"email": email, "role": "fan"})
    if not user or not user.get("password_hash") or not verify_password(f.password, user["password_hash"]):
        raise HTTPException(401, "Email sau parolă greșită")
    token = create_fan_token(user["user_id"], email)
    response.set_cookie("fan_token", token, httponly=True, secure=True, samesite="none", max_age=604800, path="/")
    return {"token": token, "user": fan_out(user)}

@api_router.get("/fans/me")
async def fan_me(fan=Depends(get_current_fan)):
    return fan_out(fan)

@api_router.post("/fans/logout")
async def fan_logout(request: Request, response: Response):
    st = request.cookies.get("session_token")
    if st:
        await db.user_sessions.delete_one({"session_token": st})
    response.delete_cookie("session_token", path="/")
    response.delete_cookie("fan_token", path="/")
    return {"ok": True}

class GoogleSessionInput(BaseModel):
    session_id: str

@api_router.post("/auth/google/session")
async def google_session(input: GoogleSessionInput, response: Response):
    try:
        async with httpx.AsyncClient(timeout=15) as http:
            r = await http.get("https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                               headers={"X-Session-ID": input.session_id})
            r.raise_for_status()
            data = r.json()
    except Exception as ex:
        logger.warning(f"Google session-data eșuat: {ex}")
        raise HTTPException(401, "Autentificarea Google a eșuat. Încearcă din nou.")
    email = data["email"].lower().strip()
    user = await db.users.find_one({"email": email})
    if user:
        user_id = user.get("user_id") or user.get("_id")
        await db.users.update_one({"email": email},
                                  {"$set": {"name": data.get("name", user.get("name")), "picture": data.get("picture", "")}})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({"user_id": user_id, "email": email, "name": data.get("name", "Fan"),
                                   "picture": data.get("picture", ""), "role": "fan",
                                   "created_at": datetime.now(timezone.utc).isoformat()})
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.user_sessions.insert_one({"user_id": user_id, "session_token": data["session_token"],
                                       "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
                                       "created_at": datetime.now(timezone.utc)})
    response.set_cookie("session_token", data["session_token"], httponly=True, secure=True,
                        samesite="none", max_age=604800, path="/")
    user = await db.users.find_one({"user_id": user_id})
    return {"user": fan_out(user)}

# ---------- FAVORITE ----------

@api_router.post("/fans/favorites/{track_id}")
async def toggle_favorite(track_id: str, fan=Depends(get_current_fan)):
    uid = fan.get("user_id") or fan.get("_id")
    existing = await db.fan_favorites.find_one({"user_id": uid, "track_id": track_id})
    if existing:
        await db.fan_favorites.delete_one({"user_id": uid, "track_id": track_id})
        return {"favorited": False}
    await db.fan_favorites.insert_one({"user_id": uid, "track_id": track_id,
                                       "created_at": datetime.now(timezone.utc).isoformat()})
    return {"favorited": True}

@api_router.get("/fans/favorites")
async def list_favorites(fan=Depends(get_current_fan)):
    uid = fan.get("user_id") or fan.get("_id")
    favs = await db.fan_favorites.find({"user_id": uid}, {"_id": 0}).to_list(200)
    ids = [f["track_id"] for f in favs]
    tracks = await db.tracks.find({"id": {"$in": ids}}, {"_id": 0}).to_list(200)
    return tracks

# ---------- TRACKS ----------

def track_out(t):
    t.pop("_id", None)
    return t

@api_router.get("/tracks")
async def list_tracks(genre: Optional[str] = None):
    q = {}
    if genre and genre != "toate":
        if genre == "noi":
            pass
        else:
            q["genre"] = genre
    sort = [("created_at", -1)] if genre == "noi" else [("created_at", -1)]
    tracks = await db.tracks.find(q, {"_id": 0}).sort(sort).to_list(200)
    return tracks

@api_router.get("/tracks/{track_id}")
async def get_track(track_id: str):
    t = await db.tracks.find_one({"id": track_id}, {"_id": 0})
    if not t:
        raise HTTPException(404, "Piesa nu există")
    return t

@api_router.post("/tracks/{track_id}/play")
async def count_play(track_id: str):
    await db.tracks.update_one({"id": track_id}, {"$inc": {"plays": 1}})
    return {"ok": True}

@api_router.post("/tracks/{track_id}/like")
async def like_track(track_id: str):
    await db.tracks.update_one({"id": track_id}, {"$inc": {"likes": 1}})
    t = await db.tracks.find_one({"id": track_id}, {"_id": 0, "likes": 1})
    return {"likes": t.get("likes", 0) if t else 0}

@api_router.get("/tracks/{track_id}/download")
async def download_track(track_id: str):
    t = await db.tracks.find_one({"id": track_id}, {"_id": 0})
    if not t or not t.get("download_enabled"):
        raise HTTPException(403, "Download dezactivat pentru această piesă")
    rec = await db.files.find_one({"serve_url": t.get("audio_url"), "is_deleted": False})
    if not rec:
        raise HTTPException(404, "Fișier indisponibil")
    try:
        data, ct = await asyncio.to_thread(get_object, rec["storage_path"])
    except Exception:
        raise HTTPException(404, "Fișier indisponibil")
    ext = rec["storage_path"].rsplit(".", 1)[-1]
    return Response(content=data, media_type=ct,
                    headers={"Content-Disposition": f'attachment; filename="BIOXIC - {t["title"]}.{ext}"'})

# ---------- FILE SERVING (public, din object storage) ----------

@api_router.get("/files/{path:path}")
async def serve_file(path: str):
    rec = await db.files.find_one({"storage_path": path, "is_deleted": False})
    if not rec:
        raise HTTPException(404, "Fișier inexistent")
    try:
        data, ct = await asyncio.to_thread(get_object, path)
    except Exception:
        raise HTTPException(404, "Fișier indisponibil")
    return Response(content=data, media_type=rec.get("content_type") or ct,
                    headers={"Cache-Control": "public, max-age=86400"})

ALLOWED_AUDIO = {".mp3", ".wav", ".ogg", ".m4a"}
ALLOWED_IMG = {".jpg", ".jpeg", ".png", ".webp"}
MIME = {".mp3": "audio/mpeg", ".wav": "audio/wav", ".ogg": "audio/ogg", ".m4a": "audio/mp4",
        ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"}

async def save_upload(file: UploadFile, sub: str, allowed: set) -> str:
    ext = Path(file.filename).suffix.lower()
    if ext not in allowed:
        raise HTTPException(400, f"Format neacceptat: {ext}")
    content = await file.read()
    if len(content) > 100 * 1024 * 1024:
        raise HTTPException(400, "Fișier prea mare (max 100MB)")
    path = f"{APP_NAME}/uploads/{sub}/{uuid.uuid4().hex}{ext}"
    ct = MIME.get(ext, "application/octet-stream")
    try:
        result = await asyncio.to_thread(put_object, path, content, ct)
    except Exception as ex:
        logger.error(f"Storage upload failed: {ex}")
        raise HTTPException(502, "Upload-ul a eșuat. Reîncearcă.")
    serve_url = f"/api/files/{result['path']}"
    await db.files.insert_one({"id": str(uuid.uuid4()), "storage_path": result["path"],
                               "serve_url": serve_url, "original_filename": file.filename,
                               "content_type": ct, "size": result.get("size", len(content)),
                               "is_deleted": False, "created_at": datetime.now(timezone.utc).isoformat()})
    return serve_url

@api_router.post("/admin/tracks")
async def create_track(
    title: str = Form(...), genre: str = Form("remix"), tags: str = Form(""),
    lyrics: str = Form(""), download_enabled: bool = Form(False),
    cover_url: str = Form(""),
    audio: Optional[UploadFile] = File(None), cover: Optional[UploadFile] = File(None),
    admin=Depends(get_current_admin)):
    if not audio:
        raise HTTPException(400, "Fișierul audio este obligatoriu")
    audio_url = await save_upload(audio, "audio", ALLOWED_AUDIO)
    final_cover = cover_url
    if cover and cover.filename:
        final_cover = await save_upload(cover, "covers", ALLOWED_IMG)
    track = {"id": str(uuid.uuid4()), "title": title, "artist": "BIOXIC", "genre": genre,
             "tags": [t.strip() for t in tags.split(",") if t.strip()], "lyrics": lyrics,
             "audio_url": audio_url, "cover_url": final_cover,
             "download_enabled": download_enabled, "plays": 0, "likes": 0,
             "created_at": datetime.now(timezone.utc).isoformat()}
    await db.tracks.insert_one(track)
    track.pop("_id", None)
    asyncio.create_task(notify_subscribers(
        titlu="Piesă nouă: " + title,
        mesaj="BIOXIC tocmai a lansat o piesă nouă pe site. Ascult-o prima dată aici, înainte să ajungă peste tot.",
        cta_text="Ascultă acum", cta_url=f"{SITE_URL}/muzica?track={track['id']}",
        subject=f"Piesă nouă BIOXIC: {title[:60]}"))
    return track

@api_router.patch("/admin/tracks/{track_id}")
async def update_track(track_id: str, request: Request, admin=Depends(get_current_admin)):
    data = await request.json()
    allowed = {k: v for k, v in data.items() if k in {"title", "genre", "tags", "lyrics", "download_enabled", "cover_url"}}
    if not allowed:
        raise HTTPException(400, "Nimic de actualizat")
    await db.tracks.update_one({"id": track_id}, {"$set": allowed})
    t = await db.tracks.find_one({"id": track_id}, {"_id": 0})
    if not t:
        raise HTTPException(404, "Piesa nu există")
    return t

@api_router.delete("/admin/tracks/{track_id}")
async def delete_track(track_id: str, admin=Depends(get_current_admin)):
    res = await db.tracks.delete_one({"id": track_id})
    if res.deleted_count == 0:
        raise HTTPException(404, "Piesa nu există")
    await db.comments.delete_many({"track_id": track_id})
    return {"ok": True}

# ---------- COMMENTS ----------

class CommentInput(BaseModel):
    name: str
    text: str

@api_router.get("/tracks/{track_id}/comments")
async def get_comments(track_id: str):
    return await db.comments.find({"track_id": track_id}, {"_id": 0}).sort("created_at", -1).to_list(100)

@api_router.post("/tracks/{track_id}/comments")
async def add_comment(track_id: str, c: CommentInput):
    name = c.name.strip()[:40]
    if await db.banned_names.find_one({"name": name.lower()}):
        raise HTTPException(403, "Acest nume este blocat")
    doc = {"id": str(uuid.uuid4()), "track_id": track_id, "name": name or "Fan",
           "text": c.text.strip()[:500], "created_at": datetime.now(timezone.utc).isoformat()}
    await db.comments.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.get("/admin/comments")
async def list_all_comments(admin=Depends(get_current_admin)):
    return await db.comments.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)

@api_router.delete("/admin/comments/{comment_id}")
async def delete_comment(comment_id: str, admin=Depends(get_current_admin)):
    await db.comments.delete_one({"id": comment_id})
    return {"ok": True}

# ---------- YOUTUBE (RSS + fallback) ----------

_yt_cache = {"videos": None, "ts": 0}

FALLBACK_VIDEOS = [
    {"id": "dQw4w9WgXcQ", "title": "BIOXIC — Videoclip nou în curând [PLACEHOLDER]",
     "published": "2024-01-01T00:00:00+00:00",
     "thumbnail": "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"},
]

@api_router.get("/youtube/videos")
async def youtube_videos():
    now = time.time()
    if _yt_cache["videos"] and now - _yt_cache["ts"] < 600:
        return _yt_cache["videos"]
    try:
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as http:
            r = await http.get(RSS_URL)
            r.raise_for_status()
        ns = {"a": "http://www.w3.org/2005/Atom", "yt": "http://www.youtube.com/xml/schemas/2015",
              "m": "http://search.yahoo.com/mrss/"}
        root = ET.fromstring(r.text)
        videos = []
        for e in root.findall("a:entry", ns):
            vid = e.find("yt:videoId", ns).text
            thumb = e.find("m:group/m:thumbnail", ns)
            videos.append({
                "id": vid,
                "title": e.find("a:title", ns).text,
                "published": e.find("a:published", ns).text,
                "thumbnail": thumb.get("url") if thumb is not None else f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg",
            })
        _yt_cache.update({"videos": videos[:24], "ts": now})
        # detectare videoclip NOU → notificare abonați (în fundal)
        if videos:
            newest = videos[0]
            meta = await db.meta.find_one({"key": "last_video"})
            if meta and meta.get("video_id") != newest["id"]:
                asyncio.create_task(notify_subscribers(
                    titlu="Videoclip nou pe canal!",
                    mesaj=f"Tocmai a apărut „{newest['title']}” pe YouTube. Fii printre primii care îl văd.",
                    cta_text="Vezi videoclipul", cta_url=f"{SITE_URL}/videoclipuri",
                    subject=f"Lansare nouă BIOXIC: {newest['title'][:60]}"))
            if not meta or meta.get("video_id") != newest["id"]:
                await db.meta.update_one({"key": "last_video"},
                                         {"$set": {"key": "last_video", "video_id": newest["id"], "title": newest["title"]}},
                                         upsert=True)
        return videos[:24]
    except Exception as ex:
        logger.warning(f"YouTube RSS fallback: {ex}")
        return FALLBACK_VIDEOS

@api_router.get("/youtube/stats")
async def youtube_stats():
    # YouTube Data API necesită cheie (YOUTUBE_API_KEY în .env). Fără cheie → fallback static.
    api_key = os.environ.get("YOUTUBE_API_KEY")
    if api_key:
        try:
            async with httpx.AsyncClient(timeout=10) as http:
                r = await http.get("https://www.googleapis.com/youtube/v3/channels",
                                   params={"part": "statistics", "id": CHANNEL_ID, "key": api_key})
                data = r.json()
                s = data["items"][0]["statistics"]
                return {"subscribers": int(s["subscriberCount"]), "views": int(s["viewCount"]),
                        "videos": int(s["videoCount"]), "fallback": False}
        except Exception as ex:
            logger.warning(f"YouTube API fallback: {ex}")
    return {"subscribers": None, "views": None, "videos": None, "fallback": True}

# ---------- LIVE ----------

async def get_live_doc():
    doc = await db.live.find_one({"key": "status"}, {"_id": 0})
    if not doc:
        doc = {"key": "status", "is_live": False, "youtube_video_id": "", "title": "BIOXIC LIVE"}
    return doc

@api_router.get("/live/status")
async def live_status():
    doc = await get_live_doc()
    doc.pop("_id", None)
    doc["viewers"] = ws_manager.count
    return doc

class LiveUpdate(BaseModel):
    is_live: bool
    youtube_video_id: Optional[str] = ""
    title: Optional[str] = "BIOXIC LIVE"

@api_router.post("/admin/live")
async def set_live(update: LiveUpdate, admin=Depends(get_current_admin)):
    await db.live.update_one({"key": "status"},
                             {"$set": {"key": "status", "is_live": update.is_live,
                                       "youtube_video_id": update.youtube_video_id, "title": update.title}},
                             upsert=True)
    await ws_manager.broadcast({"type": "live", "is_live": update.is_live})
    if update.is_live:
        asyncio.create_task(notify_subscribers(
            titlu="BIOXIC e LIVE acum!",
            mesaj="Stream-ul a pornit. Intră pe site pentru live, chat cu fanii și cereri de piese.",
            cta_text="Intră pe live", cta_url=f"{SITE_URL}/live",
            subject="BIOXIC este LIVE ACUM"))
    return {"ok": True}

class ScheduleInput(BaseModel):
    title: str
    date: str

@api_router.get("/live/schedule")
async def get_schedule():
    return await db.live_schedule.find({}, {"_id": 0}).sort("date", 1).to_list(20)

@api_router.post("/admin/live/schedule")
async def add_schedule(s: ScheduleInput, admin=Depends(get_current_admin)):
    doc = {"id": str(uuid.uuid4()), "title": s.title, "date": s.date}
    await db.live_schedule.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.delete("/admin/live/schedule/{sid}")
async def del_schedule(sid: str, admin=Depends(get_current_admin)):
    await db.live_schedule.delete_one({"id": sid})
    return {"ok": True}

class RequestInput(BaseModel):
    name: str
    song: str

@api_router.post("/live/requests")
async def add_request(r: RequestInput):
    doc = {"id": str(uuid.uuid4()), "name": r.name.strip()[:40] or "Fan",
           "song": r.song.strip()[:120], "created_at": datetime.now(timezone.utc).isoformat()}
    await db.song_requests.insert_one(doc)
    doc.pop("_id", None)
    await ws_manager.broadcast({"type": "request", "name": doc["name"], "song": doc["song"]})
    return doc

@api_router.get("/admin/requests")
async def list_requests(admin=Depends(get_current_admin)):
    return await db.song_requests.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)

@api_router.delete("/admin/requests/{rid}")
async def del_request(rid: str, admin=Depends(get_current_admin)):
    await db.song_requests.delete_one({"id": rid})
    return {"ok": True}

# ---------- CHAT (WebSocket realtime) ----------

class WSManager:
    def __init__(self):
        self.clients: List[WebSocket] = []

    @property
    def count(self):
        return len(self.clients)

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.clients.append(ws)
        await self.broadcast({"type": "viewers", "count": self.count})

    def disconnect(self, ws: WebSocket):
        if ws in self.clients:
            self.clients.remove(ws)
        asyncio.create_task(self.broadcast({"type": "viewers", "count": self.count}))

    async def broadcast(self, msg: dict):
        dead = []
        for ws in self.clients:
            try:
                await ws.send_text(json.dumps(msg))
            except Exception:
                dead.append(ws)
        for ws in dead:
            if ws in self.clients:
                self.clients.remove(ws)

ws_manager = WSManager()
REACTIONS = {"fire", "heart", "crown"}

@app.websocket("/api/ws/chat")
async def chat_ws(ws: WebSocket):
    await ws_manager.connect(ws)
    try:
        history = await db.chat.find({}, {"_id": 0}).sort("ts", -1).limit(50).to_list(50)
        await ws.send_text(json.dumps({"type": "history", "messages": list(reversed(history))}))
        while True:
            raw = await ws.receive_text()
            try:
                data = json.loads(raw)
            except Exception:
                continue
            if data.get("type") == "message":
                name = str(data.get("name", "Fan"))[:40].strip() or "Fan"
                banned = await db.banned_names.find_one({"name": name.lower()})
                if banned:
                    await ws.send_text(json.dumps({"type": "error", "detail": "Ești blocat pe chat"}))
                    continue
                text = str(data.get("text", ""))[:300].strip()
                if not text:
                    continue
                msg = {"type": "message", "id": str(uuid.uuid4()), "name": name, "text": text,
                       "ts": datetime.now(timezone.utc).isoformat()}
                await db.chat.insert_one({k: v for k, v in msg.items() if k != "type"})
                await ws_manager.broadcast(msg)
            elif data.get("type") == "reaction" and data.get("emoji") in REACTIONS:
                await ws_manager.broadcast({"type": "reaction", "id": str(uuid.uuid4()), "emoji": data["emoji"]})
    except WebSocketDisconnect:
        pass
    finally:
        ws_manager.disconnect(ws)

@api_router.get("/admin/chat")
async def chat_history(admin=Depends(get_current_admin)):
    return await db.chat.find({}, {"_id": 0}).sort("ts", -1).to_list(200)

@api_router.delete("/admin/chat/{mid}")
async def delete_chat(mid: str, admin=Depends(get_current_admin)):
    await db.chat.delete_one({"id": mid})
    await ws_manager.broadcast({"type": "delete", "id": mid})
    return {"ok": True}

class BanInput(BaseModel):
    name: str

@api_router.post("/admin/chat/ban")
async def ban_name(b: BanInput, admin=Depends(get_current_admin)):
    await db.banned_names.update_one({"name": b.name.lower()}, {"$set": {"name": b.name.lower()}}, upsert=True)
    await db.chat.delete_many({"name": b.name})
    return {"ok": True}

# ---------- CONTACT / NEWSLETTER ----------

class ContactInput(BaseModel):
    name: str
    email: str
    subject: str
    message: str

@api_router.post("/contact")
async def contact(c: ContactInput):
    doc = {"id": str(uuid.uuid4()), "name": c.name.strip()[:80], "email": c.email.strip()[:120],
           "subject": c.subject.strip()[:120], "message": c.message.strip()[:2000],
           "created_at": datetime.now(timezone.utc).isoformat()}
    await db.contacts.insert_one(doc)
    return {"ok": True}

@api_router.get("/admin/contacts")
async def list_contacts(admin=Depends(get_current_admin)):
    return await db.contacts.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)

class NewsletterInput(BaseModel):
    email: str

@api_router.post("/newsletter")
async def newsletter(n: NewsletterInput):
    email = n.email.strip().lower()[:120]
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
        raise HTTPException(400, "Email invalid")
    await db.newsletter.update_one({"email": email}, {"$set": {"email": email}}, upsert=True)
    return {"ok": True}

# ---------- STATS / VISITS / CONTENT ----------

@api_router.post("/visit")
async def track_visit(request: Request):
    data = await request.json() if request.headers.get("content-type", "").startswith("application/json") else {}
    sid = str(data.get("sid", ""))[:64]
    if sid:
        await db.visits.update_one({"sid": sid}, {"$set": {"sid": sid, "ts": datetime.now(timezone.utc).isoformat()}}, upsert=True)
    return {"ok": True}

@api_router.get("/admin/stats")
async def admin_stats(admin=Depends(get_current_admin)):
    tracks = await db.tracks.find({}, {"_id": 0}).to_list(500)
    total_plays = sum(t.get("plays", 0) for t in tracks)
    total_likes = sum(t.get("likes", 0) for t in tracks)
    top = sorted(tracks, key=lambda t: t.get("plays", 0), reverse=True)[:5]
    visitors = await db.visits.count_documents({})
    return {"total_plays": total_plays, "total_likes": total_likes, "total_tracks": len(tracks),
            "visitors": visitors, "top_tracks": top}

@api_router.get("/content")
async def get_content():
    docs = await db.site_content.find({}, {"_id": 0}).to_list(100)
    return {d["key"]: d["value"] for d in docs}

@api_router.put("/admin/content")
async def put_content(request: Request, admin=Depends(get_current_admin)):
    data = await request.json()
    for k, v in data.items():
        await db.site_content.update_one({"key": k}, {"$set": {"key": k, "value": str(v)[:5000]}}, upsert=True)
    return {"ok": True}

# ---------- SEED & STARTUP ----------

DEMO_COVERS = {
    "remix": "https://images.pexels.com/photos/7542650/pexels-photo-7542650.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "ai": "https://images.pexels.com/photos/5474035/pexels-photo-5474035.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "collab": "https://images.pexels.com/photos/13137879/pexels-photo-13137879.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
}

def gen_wav_bytes(base: float, dur: float = 10.0) -> bytes:
    fr = 22050
    buf = io.BytesIO()
    w = wave.open(buf, "wb")
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(fr)
    frames = b""
    for i in range(int(fr * dur)):
        t = i / fr
        f = base * (1 + 0.3 * math.sin(2 * math.pi * 0.5 * t))
        v = 0.35 * math.sin(2 * math.pi * f * t) + 0.15 * math.sin(2 * math.pi * f * 2 * t)
        beat = 1.0 if (t * 2) % 1 < 0.12 else 0.85
        frames += struct.pack("<h", int(32767 * v * beat))
    w.writeframes(frames)
    w.close()
    return buf.getvalue()

async def seed_tracks():
    if await db.tracks.count_documents({}) > 0:
        return
    demos = [
        ("Demo Remix Toxic [DEMO]", "remix", 110, ["manele", "remix"]),
        ("Demo Manea Artificială [DEMO]", "ai", 130, ["ai", "manele-artificiale"]),
        ("Demo Colaborare [DEMO]", "collab", 98, ["colaborare"]),
        ("Demo Remix Nou [DEMO]", "remix", 146, ["manele", "nou"]),
    ]
    for title, genre, freq, tags in demos:
        audio_url = ""
        try:
            wav = gen_wav_bytes(freq)
            path = f"{APP_NAME}/uploads/audio/{uuid.uuid4().hex}.wav"
            result = await asyncio.to_thread(put_object, path, wav, "audio/wav")
            audio_url = f"/api/files/{result['path']}"
            await db.files.insert_one({"id": str(uuid.uuid4()), "storage_path": result["path"],
                                       "serve_url": audio_url, "original_filename": "demo.wav",
                                       "content_type": "audio/wav", "size": result.get("size", len(wav)),
                                       "is_deleted": False, "created_at": datetime.now(timezone.utc).isoformat()})
        except Exception as ex:
            logger.error(f"Seed audio upload failed: {ex}")
            continue
        await db.tracks.insert_one({
            "id": str(uuid.uuid4()), "title": title, "artist": "BIOXIC", "genre": genre, "tags": tags,
            "lyrics": "", "audio_url": audio_url,
            "cover_url": DEMO_COVERS.get(genre, DEMO_COVERS["remix"]),
            "download_enabled": True, "plays": 0, "likes": 0,
            "created_at": datetime.now(timezone.utc).isoformat()})

@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_id")
    await db.user_sessions.create_index("session_token")
    await db.user_sessions.create_index("expires_at", expireAfterSeconds=0)
    await db.login_attempts.create_index("identifier")
    await db.tracks.create_index("id", unique=True)
    await db.files.create_index("storage_path", unique=True)
    try:
        await asyncio.to_thread(init_storage)
        logger.info("Object storage inițializat")
    except Exception as ex:
        logger.error(f"Storage init failed: {ex}")
    await seed_admin()
    await seed_tracks()
    logger.info("BIOXIC backend pornit")

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
