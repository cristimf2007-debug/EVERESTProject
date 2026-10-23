from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, UploadFile, File, Form, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
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
YT_CHANNELS = [
    {"id": "UC2gQmatVSAB3nzqeDmYY3gw", "name": "BIOXIC"},
    {"id": "UCNg7-CLdLxeiP3RgK2R68zQ", "name": "Everest Manele"},
]

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
               "exp": datetime.now(timezone.utc) + timedelta(hours=24)}
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
        if user.get("role") != "admin":
            raise HTTPException(403, "Acces interzis — doar administratori")
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
    response.set_cookie("access_token", token, httponly=True, secure=True, samesite="strict", max_age=86400, path="/")
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

# ---------- ADMINI MULTIPLI ----------

class AdminCreate(BaseModel):
    email: str
    password: str

@api_router.get("/admin/admins")
async def list_admins(admin=Depends(get_current_admin)):
    return await db.users.find({"role": "admin"}, {"_id": 0, "email": 1, "created_at": 1}).to_list(50)

@api_router.post("/admin/admins")
async def create_admin(a: AdminCreate, admin=Depends(get_current_admin)):
    email = a.email.lower().strip()
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
        raise HTTPException(400, "Email invalid")
    if len(a.password) < 8:
        raise HTTPException(400, "Parola admin trebuie să aibă minimum 8 caractere")
    if await db.users.find_one({"email": email}):
        raise HTTPException(400, "Există deja un cont cu acest email")
    await db.users.insert_one({"_id": str(uuid.uuid4()), "email": email,
                               "password_hash": hash_password(a.password), "role": "admin",
                               "created_at": datetime.now(timezone.utc).isoformat()})
    return {"ok": True, "email": email}

@api_router.delete("/admin/admins/{email}")
async def delete_admin(email: str, admin=Depends(get_current_admin)):
    email = email.lower().strip()
    if email == admin["email"]:
        raise HTTPException(400, "Nu te poți șterge pe tine însuți")
    if email == os.environ.get("ADMIN_EMAIL", "").lower():
        raise HTTPException(400, "Contul principal de admin nu poate fi șters")
    await db.users.delete_one({"email": email, "role": "admin"})
    return {"ok": True}

# ---------- NOTIFICĂRI ON-SITE ----------

async def push_notification(kind: str, title: str, text: str, url: str = "/"):
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()), "kind": kind, "title": title[:120], "text": text[:300], "url": url,
        "created_at": datetime.now(timezone.utc).isoformat()})
    await ws_manager.broadcast({"type": "notification", "kind": kind, "title": title[:120]})

@api_router.get("/notifications")
async def list_notifications():
    return await db.notifications.find({}, {"_id": 0}).sort("created_at", -1).to_list(20)

# ---------- ANUNȚURI ----------

class AnnouncementInput(BaseModel):
    title: str
    text: str

@api_router.get("/announcements")
async def list_announcements():
    return await db.announcements.find({}, {"_id": 0}).sort("created_at", -1).to_list(10)

@api_router.post("/admin/announcements")
async def add_announcement(a: AnnouncementInput, admin=Depends(get_current_admin)):
    doc = {"id": str(uuid.uuid4()), "title": a.title.strip()[:120], "text": a.text.strip()[:1000],
           "created_at": datetime.now(timezone.utc).isoformat()}
    await db.announcements.insert_one(doc)
    doc.pop("_id", None)
    asyncio.create_task(push_notification("anunt", doc["title"], doc["text"], "/"))
    asyncio.create_task(notify_subscribers(
        titlu=doc["title"], mesaj=doc["text"],
        cta_text="Vezi site-ul", cta_url=SITE_URL or "https://bioxic-ai.preview.emergentagent.com",
        subject=f"Anunț BIOXIC: {doc['title'][:60]}"))
    return doc

@api_router.delete("/admin/announcements/{aid}")
async def delete_announcement(aid: str, admin=Depends(get_current_admin)):
    await db.announcements.delete_one({"id": aid})
    return {"ok": True}

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
            "email": u["email"], "picture": u.get("picture", ""), "role": u.get("role", "fan"),
            "bio": u.get("bio", ""), "banner": u.get("banner", "")}

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
    response.set_cookie("fan_token", token, httponly=True, secure=True, samesite="lax", max_age=604800, path="/")
    return {"token": token, "user": fan_out({"user_id": user_id, "email": email, "name": name})}

@api_router.post("/fans/login")
async def fan_login(f: FanLogin, response: Response):
    email = f.email.lower().strip()
    user = await db.users.find_one({"email": email, "role": "fan"})
    if not user or not user.get("password_hash") or not verify_password(f.password, user["password_hash"]):
        raise HTTPException(401, "Email sau parolă greșită")
    token = create_fan_token(user["user_id"], email)
    response.set_cookie("fan_token", token, httponly=True, secure=True, samesite="lax", max_age=604800, path="/")
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
                        samesite="lax", max_age=604800, path="/")
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

# ---------- FOLLOW CANAL + PROFIL FAN ----------

async def get_optional_fan(request: Request):
    try:
        return await get_current_fan(request)
    except HTTPException:
        return None

@api_router.post("/fans/follow")
async def toggle_follow(fan=Depends(get_current_fan)):
    uid = fan.get("user_id") or fan.get("_id")
    existing = await db.follows.find_one({"user_id": uid})
    if existing:
        await db.follows.delete_one({"user_id": uid})
        following = False
    else:
        await db.follows.insert_one({"user_id": uid, "created_at": datetime.now(timezone.utc).isoformat()})
        following = True
    count = await db.follows.count_documents({})
    return {"following": following, "followers": count}

@api_router.get("/follow/status")
async def follow_status(request: Request):
    count = await db.follows.count_documents({})
    fan = await get_optional_fan(request)
    following = False
    if fan:
        uid = fan.get("user_id") or fan.get("_id")
        following = bool(await db.follows.find_one({"user_id": uid}))
    return {"followers": count, "following": following}

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None

@api_router.patch("/fans/me")
async def update_profile(p: ProfileUpdate, fan=Depends(get_current_fan)):
    uid = fan.get("user_id") or fan.get("_id")
    updates = {}
    if p.name is not None and p.name.strip():
        updates["name"] = p.name.strip()[:60]
    if p.bio is not None:
        updates["bio"] = p.bio.strip()[:300]
    if updates:
        await db.users.update_one({"user_id": uid}, {"$set": updates})
    user = await db.users.find_one({"user_id": uid})
    out = fan_out(user)
    out["bio"] = user.get("bio", "")
    return out

async def _save_image_upload(file: UploadFile, sub: str) -> str:
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_IMG:
        raise HTTPException(400, "Doar imagini (jpg, png, webp)")
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(400, "Imagine prea mare (max 10MB)")
    path = f"{APP_NAME}/uploads/{sub}/{uuid.uuid4().hex}{ext}"
    ct = MIME.get(ext, "image/jpeg")
    try:
        result = await asyncio.to_thread(put_object, path, content, ct)
    except Exception as ex:
        logger.error(f"Upload failed: {ex}")
        raise HTTPException(502, "Upload-ul a eșuat. Reîncearcă.")
    serve_url = f"/api/files/{result['path']}"
    await db.files.insert_one({"id": str(uuid.uuid4()), "storage_path": result["path"],
                               "serve_url": serve_url, "original_filename": file.filename,
                               "content_type": ct, "size": result.get("size", len(content)),
                               "is_deleted": False, "created_at": datetime.now(timezone.utc).isoformat()})
    return serve_url

@api_router.post("/fans/me/avatar")
async def upload_avatar(avatar: UploadFile = File(...), fan=Depends(get_current_fan)):
    serve_url = await _save_image_upload(avatar, "avatars")
    uid = fan.get("user_id") or fan.get("_id")
    await db.users.update_one({"user_id": uid}, {"$set": {"picture": serve_url}})
    return {"picture": serve_url}

@api_router.post("/fans/me/banner")
async def upload_banner(banner: UploadFile = File(...), fan=Depends(get_current_fan)):
    serve_url = await _save_image_upload(banner, "banners")
    uid = fan.get("user_id") or fan.get("_id")
    await db.users.update_one({"user_id": uid}, {"$set": {"banner": serve_url}})
    return {"banner": serve_url}

@api_router.get("/fans/{user_id}/public")
async def public_profile(user_id: str):
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(404, "Profil inexistent")
    favs = await db.fan_favorites.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    ids = [f["track_id"] for f in favs]
    tracks = await db.tracks.find({"id": {"$in": ids}}, {"_id": 0}).to_list(100)
    return {"user_id": user_id, "name": user.get("name", "Fan"), "picture": user.get("picture", ""),
            "bio": user.get("bio", ""), "banner": user.get("banner", ""),
            "created_at": user.get("created_at", ""), "favorites": tracks}

# ---------- VIDEOCLIPURI UPLOADATE (admin) ----------

ALLOWED_VIDEO = {".mp4", ".webm", ".mov"}
MIME_VIDEO = {".mp4": "video/mp4", ".webm": "video/webm", ".mov": "video/quicktime"}

@api_router.get("/videos")
async def list_videos(category: Optional[str] = None):
    q = {"category": category} if category else {}
    return await db.videos.find(q, {"_id": 0}).sort("created_at", -1).to_list(100)

@api_router.post("/videos/{video_id}/view")
async def count_view(video_id: str):
    await db.videos.update_one({"id": video_id}, {"$inc": {"views": 1}})
    return {"ok": True}

@api_router.post("/admin/videos")
async def upload_video(
    title: str = Form(...), category: str = Form("muzica"), description: str = Form(""),
    video: UploadFile = File(...), thumb: Optional[UploadFile] = File(None),
    admin=Depends(get_current_admin)):
    ext = Path(video.filename).suffix.lower()
    if ext not in ALLOWED_VIDEO:
        raise HTTPException(400, "Doar fișiere video (mp4, webm, mov)")
    content = await video.read()
    if len(content) > 500 * 1024 * 1024:
        raise HTTPException(400, "Videoclip prea mare (max 500MB)")
    path = f"{APP_NAME}/uploads/videos/{uuid.uuid4().hex}{ext}"
    ct = MIME_VIDEO.get(ext, "video/mp4")
    try:
        result = await asyncio.to_thread(put_object, path, content, ct)
    except Exception as ex:
        logger.error(f"Video upload failed: {ex}")
        raise HTTPException(502, "Upload-ul a eșuat. Reîncearcă.")
    video_url = f"/api/files/{result['path']}"
    await db.files.insert_one({"id": str(uuid.uuid4()), "storage_path": result["path"],
                               "serve_url": video_url, "original_filename": video.filename,
                               "content_type": ct, "size": result.get("size", len(content)),
                               "is_deleted": False, "created_at": datetime.now(timezone.utc).isoformat()})
    thumb_url = ""
    if thumb and thumb.filename:
        thumb_url = await save_upload(thumb, "covers", ALLOWED_IMG)
    doc = {"id": str(uuid.uuid4()), "title": title.strip()[:120], "category": category,
           "description": description.strip()[:1000], "video_url": video_url, "thumb_url": thumb_url,
           "views": 0, "created_at": datetime.now(timezone.utc).isoformat()}
    await db.videos.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.delete("/admin/videos/{video_id}")
async def delete_video(video_id: str, admin=Depends(get_current_admin)):
    res = await db.videos.delete_one({"id": video_id})
    if res.deleted_count == 0:
        raise HTTPException(404, "Videoclip inexistent")
    return {"ok": True}

# ---------- GAMING ----------

@api_router.get("/gaming/status")
async def gaming_status():
    doc = await db.live.find_one({"key": "gaming_status"}, {"_id": 0})
    if not doc:
        doc = {"key": "gaming_status", "is_live": False, "youtube_video_id": "", "title": "BIOXIC Gaming"}
    doc.pop("_id", None)
    return doc

class GamingUpdate(BaseModel):
    is_live: bool
    youtube_video_id: Optional[str] = ""
    title: Optional[str] = "BIOXIC Gaming"

@api_router.post("/admin/gaming")
async def set_gaming(update: GamingUpdate, admin=Depends(get_current_admin)):
    await db.live.update_one({"key": "gaming_status"},
                             {"$set": {"key": "gaming_status", "is_live": update.is_live,
                                       "youtube_video_id": update.youtube_video_id, "title": update.title}},
                             upsert=True)
    await ws_manager.broadcast({"type": "gaming_live", "is_live": update.is_live})
    if update.is_live:
        asyncio.create_task(push_notification("gaming", "BIOXIC e LIVE pe Gaming!", "Ne jucăm cu abonații. Intră în lobby.", "/gaming"))
        asyncio.create_task(notify_subscribers(
            titlu="BIOXIC e LIVE pe Gaming!",
            mesaj="A pornit stream-ul de gaming cu abonații. Intră și joacă-te cu noi.",
            cta_text="Intră în gaming", cta_url=f"{SITE_URL}/gaming",
            subject="BIOXIC Gaming LIVE ACUM"))
    return {"ok": True}

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
    t = await db.tracks.find_one({"$or": [{"id": track_id}, {"slug": track_id}]}, {"_id": 0})
    if not t:
        raise HTTPException(404, "Piesa nu există")
    return t

# OG share — pagini HTML cu meta pentru WhatsApp/TikTok/Facebook
@api_router.get("/share/{slug}")
async def share_track(slug: str):
    t = await db.tracks.find_one({"$or": [{"slug": slug}, {"id": slug}]}, {"_id": 0})
    if not t:
        raise HTTPException(404, "Piesa nu există")
    base = SITE_URL or "https://bioxic-ai.preview.emergentagent.com"
    cover = t.get("cover_url", "")
    if cover.startswith("/"):
        cover = base + cover
    title = html_escape(f"BIOXIC — {t['title']}")
    desc = html_escape("Ascultă piesa doar aici, în seif. No risks, no hits.")
    page_url = f"{base}/piese"
    html = f"""<!doctype html><html lang="ro"><head>
<meta charset="utf-8"><title>{title}</title>
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:type" content="music.song">
<meta property="og:image" content="{html_escape(cover)}">
<meta property="og:url" content="{page_url}">
<meta name="twitter:card" content="summary_large_image">
<meta http-equiv="refresh" content="0; url={page_url}">
</head><body style="background:#06110d;color:#eaf2ed;font-family:sans-serif;display:grid;place-items:center;height:100vh">
<p>Se deschide piesa… <a style="color:#f3c46a" href="{page_url}">{title}</a></p>
</body></html>"""
    from fastapi.responses import HTMLResponse
    return HTMLResponse(html)

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

import hmac as _hmac, hashlib as _hashlib

FILE_SIGN_SECRET = (os.environ.get("JWT_SECRET", "") + ":bioxic-fileguard").encode()

def sign_file_url(serve_url: str, ttl: int = 900) -> str:
    """Link audio semnat, valabil `ttl` secunde — linkurile copiate expiră."""
    exp = int(time.time()) + ttl
    sig = _hmac.new(FILE_SIGN_SECRET, f"{serve_url}|{exp}".encode(), _hashlib.sha256).hexdigest()[:32]
    sep = "&" if "?" in serve_url else "?"
    return f"{serve_url}{sep}exp={exp}&sig={sig}"

def verify_file_sig(serve_url: str, exp: str, sig: str) -> bool:
    try:
        if int(exp) < time.time():
            return False
    except (TypeError, ValueError):
        return False
    expect = _hmac.new(FILE_SIGN_SECRET, f"{serve_url}|{exp}".encode(), _hashlib.sha256).hexdigest()[:32]
    return bool(sig) and _hmac.compare_digest(expect, sig)

@api_router.get("/media/sign")
async def media_sign(u: str):
    """Dă un link semnat cu expirare pentru un fișier audio din catalog."""
    if not u.startswith("/api/files/"):
        raise HTTPException(400, "URL invalid")
    if "/uploads/audio/" not in u:
        return {"url": u}  # coverele rămân publice
    exists = await db.files.find_one({"serve_url": u, "is_deleted": False}, {"_id": 1})
    if not exists:
        raise HTTPException(404, "Fișier inexistent")
    return {"url": sign_file_url(u)}

@api_router.get("/files/{path:path}")
async def serve_file(path: str, request: Request, exp: str = "", sig: str = ""):
    rec = await db.files.find_one({"storage_path": path, "is_deleted": False})
    if not rec:
        raise HTTPException(404, "Fișier inexistent")
    # piesele audio nu se servesc fără link semnat și neexpirat
    if "/uploads/audio/" in path:
        if not verify_file_sig(rec["serve_url"], exp, sig):
            raise HTTPException(403, "Link expirat — reia redarea de pe site")
    try:
        data, ct = await asyncio.to_thread(get_object, path)
    except Exception:
        raise HTTPException(404, "Fișier indisponibil")
    media_type = rec.get("content_type") or ct
    total = len(data)
    is_audio = "/uploads/audio/" in path
    base_headers = {"Accept-Ranges": "bytes",
                    "Cache-Control": "private, no-store" if is_audio else "public, max-age=86400"}
    # HTTP Range — OBLIGATORIU pentru audio: fără 206, seek-ul resetează stream-ul
    range_h = request.headers.get("range")
    if range_h and range_h.startswith("bytes="):
        try:
            rng = range_h[6:].split(",")[0].strip()
            start_s, end_s = rng.split("-", 1)
            start = int(start_s) if start_s else 0
            end = int(end_s) if end_s else total - 1
            start = max(0, min(start, total - 1))
            end = max(start, min(end, total - 1))
            chunk = data[start:end + 1]
            return Response(content=chunk, status_code=206, media_type=media_type, headers={
                **base_headers,
                "Content-Range": f"bytes {start}-{end}/{total}",
                "Content-Length": str(len(chunk)),
            })
        except (ValueError, IndexError):
            pass
    return Response(content=data, media_type=media_type,
                    headers={**base_headers, "Content-Length": str(total)})

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
    cover_url: str = Form(""), playlist: str = Form(""),
    audio: Optional[UploadFile] = File(None), cover: Optional[UploadFile] = File(None),
    admin=Depends(get_current_admin)):
    if not audio:
        raise HTTPException(400, "Fișierul audio este obligatoriu")
    raw = await audio.read()
    duration = None
    try:
        from mutagen import File as MutagenFile
        mf = MutagenFile(io.BytesIO(raw))
        if mf is not None and getattr(mf, "info", None) and getattr(mf.info, "length", None):
            duration = round(float(mf.info.length), 2)
    except Exception:
        duration = None
    await audio.seek(0)
    audio_url = await save_upload(audio, "audio", ALLOWED_AUDIO)
    final_cover = cover_url
    if cover and cover.filename:
        final_cover = await save_upload(cover, "covers", ALLOWED_IMG)
    track = {"id": str(uuid.uuid4()), "title": title, "artist": "BIOXIC", "genre": genre,
             "tags": [t.strip() for t in tags.split(",") if t.strip()], "lyrics": lyrics,
             "audio_url": audio_url, "cover_url": final_cover, "duration": duration,
             "playlist": playlist.strip(),
             "download_enabled": download_enabled, "plays": 0, "likes": 0,
             "created_at": datetime.now(timezone.utc).isoformat()}
    await db.tracks.insert_one(track)
    track.pop("_id", None)
    asyncio.create_task(push_notification("piesa", "Piesă nouă: " + title, "Disponibilă acum pe canal.", "/piese"))
    asyncio.create_task(notify_subscribers(
        titlu="Piesă nouă: " + title,
        mesaj="BIOXIC tocmai a lansat o piesă nouă pe site. Ascult-o prima dată aici, înainte să ajungă peste tot.",
        cta_text="Ascultă acum", cta_url=f"{SITE_URL}/piese",
        subject=f"Piesă nouă BIOXIC: {title[:60]}"))
    return track

@api_router.patch("/admin/tracks/{track_id}")
async def update_track(track_id: str, request: Request, admin=Depends(get_current_admin)):
    data = await request.json()
    allowed = {k: v for k, v in data.items() if k in {"title", "artist", "genre", "tags", "lyrics", "download_enabled",
                                                      "cover_url", "story", "links", "stats", "badges", "timeline",
                                                      "featured", "nr", "slug", "published", "playlist"}}
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

# ---------- RADIO 24/7 (sincronizat — toți ascultătorii aud aceeași secundă) ----------

RADIO_FALLBACK_DURATION = 240.0

async def radio_queue():
    return await db.tracks.find({}, {"_id": 0}).sort([("created_at", 1)]).to_list(500)

async def track_duration(t) -> float:
    d = t.get("duration")
    if d:
        return float(d)
    try:
        rec = await db.files.find_one({"serve_url": t.get("audio_url"), "is_deleted": False})
        if rec:
            data, _ct = await asyncio.to_thread(get_object, rec["storage_path"])
            from mutagen import File as MutagenFile
            mf = await asyncio.to_thread(MutagenFile, io.BytesIO(data))
            if mf is not None and getattr(mf, "info", None) and getattr(mf.info, "length", None):
                dur = round(float(mf.info.length), 2)
                await db.tracks.update_one({"id": t["id"]}, {"$set": {"duration": dur}})
                return dur
    except Exception as ex:
        logger.warning(f"Durata necunoscută pentru piesa {t.get('id')}: {ex}")
    return RADIO_FALLBACK_DURATION

async def radio_resolve(state: dict, tracks: list, now: datetime) -> dict:
    """Avansează starea radio peste piesele terminate — matematic, oricât timp a trecut."""
    durs = [await track_duration(t) for t in tracks]
    total = sum(durs) or RADIO_FALLBACK_DURATION
    started = datetime.fromisoformat(state["started_at"])
    elapsed = max(0.0, (now - started).total_seconds())
    idx = state.get("index", 0) % len(tracks)
    offset_before = sum(durs[:idx])
    pos = (offset_before + elapsed) % total
    acc = 0.0
    new_idx, in_track = 0, 0.0
    for i, d in enumerate(durs):
        if pos < acc + d:
            new_idx, in_track = i, pos - acc
            break
        acc += d
    new_started = now - timedelta(seconds=in_track)
    return {"index": new_idx, "started_at": new_started.isoformat()}

async def active_listeners() -> int:
    cutoff = (datetime.now(timezone.utc) - timedelta(seconds=75)).isoformat()
    return await db.radio_listeners.count_documents({"last_seen": {"$gte": cutoff}})

@api_router.get("/radio/now")
async def radio_now():
    tracks = await radio_queue()
    listeners = await active_listeners()
    if not tracks:
        return {"live": False, "track": None, "next": None, "position": 0, "duration": 0,
                "queue": [], "listeners": listeners,
                "server_time": datetime.now(timezone.utc).isoformat()}
    now = datetime.now(timezone.utc)
    state = await db.radio.find_one({"id": "state"}, {"_id": 0})
    if not state:
        state = {"id": "state", "index": 0, "started_at": now.isoformat()}
        await db.radio.insert_one({k: v for k, v in state.items()})
    resolved = await radio_resolve(state, tracks, now)
    if resolved["index"] != state.get("index") or resolved["started_at"] != state.get("started_at"):
        await db.radio.update_one({"id": "state"}, {"$set": resolved})
    idx = resolved["index"] % len(tracks)
    t = tracks[idx]
    dur = await track_duration(t)
    started = datetime.fromisoformat(resolved["started_at"])
    position = min(max(0.0, (now - started).total_seconds()), dur)
    nxt = tracks[(idx + 1) % len(tracks)]
    slim = lambda x: {"id": x["id"], "title": x["title"], "artist": x.get("artist", "BIOXIC"),
                      "cover_url": x.get("cover_url", ""), "duration": x.get("duration")}
    return {"live": True, "track": slim(t) | {"audio_url": t.get("audio_url", "")},
            "next": slim(nxt) if nxt["id"] != t["id"] else slim(t),
            "position": round(position, 2), "duration": dur,
            "queue": [slim(x) for x in tracks], "listeners": listeners,
            "server_time": now.isoformat()}

@api_router.post("/radio/heartbeat")
async def radio_heartbeat(request: Request):
    body = await request.json()
    sid = str(body.get("sid", ""))[:64]
    if not sid:
        raise HTTPException(400, "sid lipsă")
    await db.radio_listeners.update_one(
        {"sid": sid},
        {"$set": {"last_seen": datetime.now(timezone.utc).isoformat()}},
        upsert=True)
    return {"listeners": await active_listeners()}

@api_router.post("/admin/radio/skip")
async def radio_skip(admin=Depends(get_current_admin)):
    tracks = await radio_queue()
    if not tracks:
        raise HTTPException(400, "Nu există piese în radio")
    state = await db.radio.find_one({"id": "state"}, {"_id": 0}) or {"index": 0}
    new = {"index": (state.get("index", 0) + 1) % len(tracks),
           "started_at": datetime.now(timezone.utc).isoformat()}
    await db.radio.update_one({"id": "state"}, {"$set": new}, upsert=True)
    return {"ok": True, "track": tracks[new["index"]]["title"]}

# ---------- CANAL (abonați) ----------

@api_router.get("/channel/stats")
async def channel_stats():
    subs = await db.channel_subs.count_documents({})
    return {"subscribers": subs}

@api_router.post("/channel/subscribe")
async def channel_subscribe(request: Request):
    body = await request.json()
    sid = str(body.get("sid", ""))[:64]
    if not sid:
        raise HTTPException(400, "sid lipsă")
    email = str(body.get("email", "")).strip().lower()[:120]
    # dacă e logat, legăm abonarea de cont (user_id + email) — ține minte pe orice dispozitiv
    fan = await get_optional_fan(request)
    uid = fan.get("user_id") if fan else None
    if fan and fan.get("email"):
        email = fan["email"]
    if body.get("subscribed"):
        doc = {"sid": sid, "subscribed_at": datetime.now(timezone.utc).isoformat()}
        if uid:
            doc["user_id"] = uid
        if email:
            doc["email"] = email
        await db.channel_subs.update_one({"sid": sid}, {"$set": doc}, upsert=True)
        if uid:
            await db.channel_subs.update_many({"user_id": uid}, {"$set": {"user_id": uid}})
        if email:
            await db.newsletter.update_one({"email": email}, {"$set": {"email": email}}, upsert=True)
    else:
        q = {"$or": [{"sid": sid}]}
        if uid:
            q["$or"].append({"user_id": uid})
        await db.channel_subs.delete_many(q)
        if email:
            await db.newsletter.delete_one({"email": email})
    return {"subscribers": await db.channel_subs.count_documents({})}

@api_router.get("/channel/status")
async def channel_status(request: Request, sid: str = ""):
    """Ține minte cine e abonat: după sid (dispozitiv) sau după cont/email."""
    q = {"$or": []}
    if sid:
        q["$or"].append({"sid": sid[:64]})
    fan = await get_optional_fan(request)
    if fan:
        if fan.get("user_id"):
            q["$or"].append({"user_id": fan["user_id"]})
        if fan.get("email"):
            q["$or"].append({"email": fan["email"].lower()})
    subscribed = bool(q["$or"]) and bool(await db.channel_subs.find_one(q))
    return {"subscribed": subscribed, "subscribers": await db.channel_subs.count_documents({})}

# ---------- COMMENTS ----------

class CommentInput(BaseModel):
    name: str
    text: str

@api_router.get("/tracks/{track_id}/comments")
async def get_comments(track_id: str):
    return await db.comments.find({"track_id": track_id}, {"_id": 0}).sort("created_at", -1).to_list(100)

@api_router.post("/tracks/{track_id}/comments")
async def add_comment(track_id: str, c: CommentInput, request: Request):
    fan = await get_optional_fan(request)
    name = (fan.get("name") if fan else c.name.strip()[:40]) or "Fan"
    if await db.banned_names.find_one({"name": name.lower()}):
        raise HTTPException(403, "Acest nume este blocat")
    doc = {"id": str(uuid.uuid4()), "track_id": track_id, "name": name,
           "picture": fan.get("picture", "") if fan else "",
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
     "published": "2024-01-01T00:00:00+00:00", "channel": "BIOXIC",
     "thumbnail": "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"},
]

@api_router.get("/youtube/videos")
async def youtube_videos():
    now = time.time()
    if _yt_cache["videos"] and now - _yt_cache["ts"] < 600:
        return _yt_cache["videos"]
    ns = {"a": "http://www.w3.org/2005/Atom", "yt": "http://www.youtube.com/xml/schemas/2015",
          "m": "http://search.yahoo.com/mrss/"}
    videos = []
    try:
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as http:
            for ch in YT_CHANNELS:
                try:
                    r = await http.get(f"https://www.youtube.com/feeds/videos.xml?channel_id={ch['id']}")
                    r.raise_for_status()
                    root = ET.fromstring(r.text)
                    for e in root.findall("a:entry", ns):
                        vid = e.find("yt:videoId", ns).text
                        thumb = e.find("m:group/m:thumbnail", ns)
                        videos.append({
                            "id": vid,
                            "title": e.find("a:title", ns).text,
                            "published": e.find("a:published", ns).text,
                            "thumbnail": thumb.get("url") if thumb is not None else f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg",
                            "channel": ch["name"],
                        })
                except Exception as ex:
                    logger.warning(f"RSS canal {ch['name']} eșuat: {ex}")
        if not videos:
            raise ValueError("niciun feed disponibil")
        videos.sort(key=lambda v: v["published"], reverse=True)
        videos = videos[:48]
        _yt_cache.update({"videos": videos, "ts": now})
        # detectare videoclip NOU → notificare abonați (în fundal)
        newest = videos[0]
        meta = await db.meta.find_one({"key": "last_video"})
        if meta and meta.get("video_id") != newest["id"]:
            asyncio.create_task(push_notification("video", "Videoclip nou: " + newest["title"][:80], "Proaspăt pe YouTube.", "/videoclipuri"))
            asyncio.create_task(notify_subscribers(
                titlu="Videoclip nou pe canal!",
                mesaj=f"Tocmai a apărut „{newest['title']}” pe YouTube. Fii printre primii care îl văd.",
                cta_text="Vezi videoclipul", cta_url=f"{SITE_URL}/videoclipuri",
                subject=f"Lansare nouă BIOXIC: {newest['title'][:60]}"))
        if not meta or meta.get("video_id") != newest["id"]:
            await db.meta.update_one({"key": "last_video"},
                                     {"$set": {"key": "last_video", "video_id": newest["id"], "title": newest["title"]}},
                                     upsert=True)
        return videos
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
        doc = {"key": "status", "is_live": False, "youtube_video_id": "", "title": "BIOXIC LIVE", "likes": 0}
    return doc

@api_router.get("/live/status")
async def live_status():
    doc = await get_live_doc()
    doc.pop("_id", None)
    doc["viewers"] = ws_manager.count
    doc["viewers_list"] = ws_manager.user_list()
    return doc

class LiveUpdate(BaseModel):
    is_live: bool
    youtube_video_id: Optional[str] = ""
    title: Optional[str] = "BIOXIC LIVE"

@api_router.post("/admin/live")
async def set_live(update: LiveUpdate, admin=Depends(get_current_admin)):
    await db.live.update_one({"key": "status"},
                             {"$set": {"key": "status", "is_live": update.is_live,
                                       "youtube_video_id": update.youtube_video_id, "title": update.title},
                              "$setOnInsert": {"likes": 0}}, upsert=True)
    if update.is_live:
        await db.live.update_one({"key": "status"}, {"$set": {"likes": 0}})
        asyncio.create_task(push_notification("live", "BIOXIC e LIVE acum!", "Stream-ul a pornit. Intră pe chat și cere o piesă.", "/live"))
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

async def resolve_fan_cookies(cookies) -> Optional[dict]:
    st = cookies.get("session_token")
    if st:
        sess = await db.user_sessions.find_one({"session_token": st})
        if sess:
            exp = sess["expires_at"]
            if isinstance(exp, str):
                exp = datetime.fromisoformat(exp)
            if exp.tzinfo is None:
                exp = exp.replace(tzinfo=timezone.utc)
            if exp > datetime.now(timezone.utc):
                return await db.users.find_one({"user_id": sess["user_id"]})
    ft = cookies.get("fan_token")
    if ft:
        try:
            payload = jwt.decode(ft, os.environ["JWT_SECRET"], algorithms=[JWT_ALGORITHM])
            return await db.users.find_one({"$or": [{"user_id": payload["sub"]}, {"_id": payload["sub"]}]})
        except Exception:
            return None
    return None

class WSManager:
    def __init__(self):
        self.clients: dict = {}  # ws -> info {name, picture, user_id}

    @property
    def count(self):
        return len(self.clients)

    def user_list(self):
        seen, out = set(), []
        for info in self.clients.values():
            uid = info.get("user_id")
            if uid and uid not in seen:
                seen.add(uid)
                out.append({"user_id": uid, "name": info["name"], "picture": info.get("picture", "")})
        return out[:40]

    async def connect(self, ws: WebSocket, info: dict):
        await ws.accept()
        self.clients[ws] = info
        await self.broadcast({"type": "viewers", "count": self.count, "users": self.user_list()})
        if info.get("user_id"):
            await self.broadcast({"type": "join", "id": str(uuid.uuid4()), "name": info["name"], "picture": info.get("picture", "")})

    def disconnect(self, ws: WebSocket):
        info = self.clients.pop(ws, None)
        asyncio.create_task(self.broadcast({"type": "viewers", "count": self.count, "users": self.user_list()}))
        if info and info.get("user_id"):
            asyncio.create_task(self.broadcast({"type": "leave", "id": str(uuid.uuid4()), "name": info["name"]}))

    async def broadcast(self, msg: dict):
        dead = []
        for ws in self.clients:
            try:
                await ws.send_text(json.dumps(msg))
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.clients.pop(ws, None)

ws_manager = WSManager()
REACTIONS = {"fire", "heart", "crown"}

# filtru de cuvinte pentru chat (extinde lista după nevoie)
CHAT_BAD_WORDS = {"muie", "pula", "pizda", "coaie", "fut", "futu-ti", "cacat", "curva", "sugei"}

@app.websocket("/api/ws/chat")
async def chat_ws(ws: WebSocket):
    fan = await resolve_fan_cookies(ws.cookies)
    info = {"name": (fan.get("name") if fan else "Vizitator"),
            "picture": (fan.get("picture", "") if fan else ""),
            "user_id": (fan.get("user_id") if fan else None)}
    await ws_manager.connect(ws, info)
    try:
        history = await db.chat.find({}, {"_id": 0}).sort("ts", -1).limit(50).to_list(50)
        await ws.send_text(json.dumps({"type": "history", "messages": list(reversed(history))}))
        live_doc = await get_live_doc()
        await ws.send_text(json.dumps({"type": "like_count", "total": live_doc.get("likes", 0)}))
        while True:
            raw = await ws.receive_text()
            if len(raw) > 2048:  # limită de payload — anti abuz
                continue
            try:
                data = json.loads(raw)
            except Exception:
                continue
            if not isinstance(data, dict):
                continue
            now_ts = time.time()
            if data.get("type") == "message":
                # rate limit: 1 mesaj / 2s, max 20 / minut per conexiune
                if now_ts - info.get("last_msg", 0) < 2:
                    await ws.send_text(json.dumps({"type": "error", "detail": "Prea repede — max 1 mesaj la 2 secunde"}))
                    continue
                info["msg_times"] = [t for t in info.get("msg_times", []) if now_ts - t < 60]
                if len(info["msg_times"]) >= 20:
                    await ws.send_text(json.dumps({"type": "error", "detail": "Limită atinsă — max 20 mesaje/minut"}))
                    continue
                name = info["name"] if info.get("user_id") else str(data.get("name", "Fan"))[:24].strip() or "Fan"
                banned = await db.banned_names.find_one({"name": name.lower()})
                if banned:
                    await ws.send_text(json.dumps({"type": "error", "detail": "Ești blocat pe chat"}))
                    continue
                text = str(data.get("text", ""))[:200].strip()
                # fără HTML/scripturi — păstrăm doar text curat
                text = re.sub(r"<[^>]*>", "", text)
                for bad in CHAT_BAD_WORDS:
                    text = re.sub(rf"(?i)\b{re.escape(bad)}\b", "***", text)
                if not text:
                    continue
                info["last_msg"] = now_ts
                info.setdefault("msg_times", []).append(now_ts)
                msg = {"type": "message", "id": str(uuid.uuid4()), "name": name, "picture": info.get("picture", ""),
                       "user_id": info.get("user_id"), "text": text,
                       "ts": datetime.now(timezone.utc).isoformat()}
                await db.chat.insert_one({k: v for k, v in msg.items() if k != "type"})
                await ws_manager.broadcast(msg)
            elif data.get("type") == "reaction" and data.get("emoji") in REACTIONS:
                # max 5 reacții / secundă per conexiune
                info["react_times"] = [t for t in info.get("react_times", []) if now_ts - t < 1]
                if len(info["react_times"]) >= 5:
                    continue
                info.setdefault("react_times", []).append(now_ts)
                await ws_manager.broadcast({"type": "reaction", "id": str(uuid.uuid4()), "emoji": data["emoji"]})
            elif data.get("type") == "tap":
                info["react_times"] = [t for t in info.get("react_times", []) if now_ts - t < 1]
                if len(info["react_times"]) >= 5:
                    continue
                info.setdefault("react_times", []).append(now_ts)
                r = await db.live.find_one_and_update({"key": "status"}, {"$inc": {"likes": 1}}, return_document=True)
                total = (r or {}).get("likes", 1)
                await ws_manager.broadcast({"type": "reaction", "id": str(uuid.uuid4()), "emoji": "heart"})
                await ws_manager.broadcast({"type": "like_count", "total": total})
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
    await db.chat.delete_many({"name": {"$regex": f"^{re.escape(b.name.strip())}$", "$options": "i"}})
    return {"ok": True}

# ---------- PĂRERI (review-uri de la fani) ----------

class ReviewInput(BaseModel):
    name: str
    rating: int
    text: str

@api_router.get("/reviews")
async def list_reviews():
    return await db.reviews.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)

@api_router.post("/reviews")
async def create_review(r: ReviewInput):
    text = r.text.strip()[:500]
    if not text:
        raise HTTPException(400, "Scrie ceva — părerea ta contează!")
    doc = {"id": str(uuid.uuid4()), "name": (r.name.strip()[:40] or "Fan"),
           "rating": min(5, max(1, int(r.rating))), "text": text,
           "created_at": datetime.now(timezone.utc).isoformat()}
    await db.reviews.insert_one(doc)
    return {"ok": True, "id": doc["id"]}

@api_router.delete("/admin/reviews/{review_id}")
async def delete_review(review_id: str, admin=Depends(get_current_admin)):
    res = await db.reviews.delete_one({"id": review_id})
    if res.deleted_count == 0:
        raise HTTPException(404, "Părerea nu există")
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
    "remix": "https://images.pexels.com/photos/10063275/pexels-photo-10063275.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
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
        ("Demo Remix Club [DEMO]", "remix", 110, ["manele", "remix"]),
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
    logger.info("BIOXIC backend pornit")

app.include_router(api_router)

# ---------- SECURITATE: headere HTTP + rate limit global API ----------

_RATE: dict = {}  # ip -> [timestamps]
RATE_LIMIT = 120  # cereri / minut / IP
RATE_WINDOW = 60

@app.middleware("http")
async def security_headers_and_rate_limit(request: Request, call_next):
    # rate limit global (fără /files — streamingul audio face multe cereri Range)
    if request.url.path.startswith("/api/") and not request.url.path.startswith("/api/files/"):
        ip = request.headers.get("x-forwarded-for", "").split(",")[0].strip() or (request.client.host if request.client else "?")
        now_ts = time.time()
        hits = [t for t in _RATE.get(ip, []) if now_ts - t < RATE_WINDOW]
        if len(hits) >= RATE_LIMIT:
            return JSONResponse({"detail": "Prea multe cereri. Reîncearcă într-un minut."}, status_code=429)
        hits.append(now_ts)
        _RATE[ip] = hits
        if len(_RATE) > 5000:
            _RATE.clear()
    resp = await call_next(request)
    resp.headers["X-Frame-Options"] = "DENY"
    resp.headers["X-Content-Type-Options"] = "nosniff"
    resp.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    resp.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    resp.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    resp.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self'; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "img-src 'self' data: blob: https:; "
        "media-src 'self' blob:; "
        "connect-src 'self' ws: wss:; "
        "object-src 'none'; frame-ancestors 'none'; base-uri 'self'"
    )
    return resp

# CORS strict: doar domeniul site-ului (nu *)
_cors = os.environ.get('CORS_ORIGINS', '')
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[o.strip() for o in _cors.split(',') if o.strip()] or ["http://localhost:3000"],
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
