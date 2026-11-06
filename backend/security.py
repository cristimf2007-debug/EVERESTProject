"""
BIOXIC Security Core — WAF-lite, anti-DDoS/anti-flood, anti-bot, monitorizare.

Protecțiile sunt EXTERNE sistemului de conturi: filtrăm cereri, IP-uri și pattern-uri
malițioase FĂRĂ să modificăm login/register/logout/sesiuni/baza de date a utilizatorilor.

Straturi:
1. Ban-uri IP persistente (Mongo `security_bans`) + cache local 30s
2. Filtru WAF: path probing (.env, wp-admin…), semnături SQLi/XSS/RCE/traversal în path+query, UA-uri de scanere
3. Limită de dimensiune a cererilor (1MB, cu excepții pentru uploaduri admin/avatar)
4. Limită de concurență per IP
5. Rate limiting: global 120/min + strict 10/min pe auth + limite per endpoint sensibil
6. Detectare scanere după rafale de 404
7. „Attack mode": la trafic anormal de mare, limitele se strâng temporar
8. IP-urile forwarded sunt acceptate doar de la TRUSTED_PROXIES explicit configurate
9. Jurnal `security_events` — fără parole, token-uri, cookie-uri sau corpuri de cereri
"""

import asyncio
import ipaddress
import logging
import os
import time
import uuid
from datetime import datetime, timezone, timedelta
from urllib.parse import unquote

from fastapi import Request
from fastapi.responses import JSONResponse

logger = logging.getLogger("bioxic.security")

_db = None  # injectat din server.py prin init_security()
_TRUSTED_PROXIES = []
for _proxy in os.environ.get("TRUSTED_PROXIES", "").split(","):
    try:
        if _proxy.strip():
            _TRUSTED_PROXIES.append(ipaddress.ip_network(_proxy.strip(), strict=False))
    except ValueError:
        logger.error("Ignoring invalid TRUSTED_PROXIES entry")

def init_security(db):
    global _db
    _db = db

# ---------------- configurare ----------------
GLOBAL_RATE_LIMIT = 120          # cereri / minut / IP (neschimbat)
RATE_WINDOW = 60
AUTH_RATE_LIMIT = 10             # POST / minut / IP pe rutele de autentificare (neschimbat)
AUTH_STRICT_PATHS = {
    "/api/auth/login", "/api/fans/login", "/api/fans/register",
    "/api/auth/forgot-password", "/api/auth/reset-password",
}
# limite anti-spam pe endpoint-uri publice sensibile (cereri / minut / IP)
ENDPOINT_LIMITS = {
    "/api/contact": 5,
    "/api/subscribe": 5,
    "/api/reviews": 5,
    "/api/waitlist": 5,
}
COMMENT_RATE_LIMIT = 10          # comentarii (video + piese) / minut / IP
MAX_BODY_BYTES = 1 * 1024 * 1024   # 1MB pentru API-uri obișnuite
UPLOAD_PREFIXES = ("/api/admin/tracks", "/api/admin/videos", "/api/fans/me/")  # au propria limită (100MB, în save_upload)
MAX_CONCURRENT_PER_IP = 40
CONCURRENCY_EXEMPT = ("/api/files/", "/api/ws/")
STRIKES_TO_BAN = 6
BAN_MINUTES = 30
SCAN_404_LIMIT = 20              # 404-uri în 120s → comportament de scaner
ATTACK_RPM = 900                 # peste atât, global, intrăm în attack mode
ATTACK_MODE_MINUTES = 5
ATTACK_RATE_LIMIT = 40           # limita globală strânsă în attack mode

# path-uri care NU există pe acest site — cine le cere e un scaner/bot
_PROBE_PATHS = (
    "/.env", "/.git", "/.aws", "/.svn", "/.hg", "/.ds_store",
    "/wp-admin", "/wp-login", "/wordpress", "/wp-content", "/wp-includes",
    "/phpmyadmin", "/xmlrpc.php", "/server-status", "/server-info",
    "/actuator", "/cgi-bin", "/vendor/phpunit", "/solr", "/console",
    "/etc/passwd", "/proc/", "/config.php", "/.well-known/security.txt.bak",
)

# semnături malițioase în path + query (după un URL-decode)
_MALICIOUS = __import__("re").compile(
    r"(\.\./|\.\.\\|%00|"
    r"union[\s+]+select|select[\s+]+.+[\s+]+from[\s+]+information_schema|or[\s+]+1[\s=]|"
    r"sleep\s*\(|benchmark\s*\(|xp_cmdshell|into[\s+]+outfile|"
    r"<\s*script|javascript:|on(error|load|click)\s*=|"
    r"/etc/passwd|boot\.ini|win\.ini|"
    r"php://|data://|file://|gopher://|"
    r"\$\{[^}]*\}|\{\{[^}]*\}\})",
    __import__("re").I,
)

# UA-uri cunoscute de scanere/boți ofensivi
_BAD_UA = __import__("re").compile(
    r"(sqlmap|nikto|acunetix|netsparker|nmap|masscan|nuclei|hydra|metasploit|"
    r"wpscan|dirbuster|gobuster|feroxbuster|nessus|openvas|zgrab|zmap|havij)",
    __import__("re").I,
)

# ---------------- stare în memorie (rapidă, fără DB pe fiecare cerere) ----------------
_rate: dict = {}            # ip -> [timestamps] global
_auth_rate: dict = {}       # ip -> [timestamps] auth strict
_ep_rate: dict = {}         # f"{path}:{ip}" -> [timestamps]
_strikes: dict = {}         # ip -> [timestamps]
_not_found: dict = {}       # ip -> [timestamps] 404
_concurrent: dict = {}      # ip -> int
_ban_cache = {"ts": 0.0, "ips": set()}
_attack_mode_until = 0.0
_rpm_window: list = []      # timestamps globale pentru RPM
_stats = {"blocked_today": 0, "day": "", "waf_hits": 0, "bans_total": 0}

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def client_ip_from_headers(headers, peer_host: str) -> str:
    try:
        peer = ipaddress.ip_address(peer_host.split("%", 1)[0])
    except (AttributeError, ValueError):
        return "?"

    peer_is_trusted = any(peer in network for network in _TRUSTED_PROXIES)
    if not peer_is_trusted:
        return peer.compressed

    forwarded = headers.get("x-forwarded-for", "")
    for candidate in reversed(forwarded.split(",")):
        try:
            address = ipaddress.ip_address(candidate.strip().strip('"').split("%", 1)[0])
        except ValueError:
            continue
        if any(address in network for network in _TRUSTED_PROXIES):
            continue
        return address.compressed
    return peer.compressed

def client_ip(request: Request) -> str:
    peer_host = request.client.host if request.client else ""
    return client_ip_from_headers(request.headers, peer_host)

def _hit(bucket: dict, key: str, window: int) -> int:
    now = time.time()
    hits = [t for t in bucket.get(key, []) if now - t < window]
    hits.append(now)
    bucket[key] = hits
    if len(bucket) > 8000:
        bucket.clear()
    return len(hits)

def _bump_blocked():
    today = _now_iso()[:10]
    if _stats["day"] != today:
        _stats["day"] = today
        _stats["blocked_today"] = 0
    _stats["blocked_today"] += 1

def log_event(kind: str, ip: str, path: str, detail: str, action: str):
    """Jurnal de securitate — NICIODATĂ parole, token-uri, cookie-uri sau body."""
    if _db is None:
        return
    doc = {"id": f"se_{int(time.time() * 1000)}_{uuid.uuid4().hex[:8]}", "ts": _now_iso(),
           "ip": ip, "kind": kind, "path": path[:200], "detail": detail[:300], "action": action}
    async def _w():
        try:
            await _db.security_events.insert_one(doc)
            # curățenie leneșă: păstrăm doar ultimele 7 zile de evenimente
            if int(time.time()) % 200 == 0:
                cutoff = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
                await _db.security_events.delete_many({"ts": {"$lt": cutoff}})
        except Exception as ex:
            logger.warning(f"security log failed: {ex}")
    try:
        asyncio.get_running_loop().create_task(_w())
    except RuntimeError:
        pass

async def _refresh_ban_cache(force: bool = False):
    now = time.time()
    if not force and now - _ban_cache["ts"] < 30:
        return
    _ban_cache["ts"] = now
    if _db is None:
        _ban_cache["ips"] = set()
        return
    try:
        rows = await _db.security_bans.find(
            {"until": {"$gt": _now_iso()}}, {"_id": 0, "ip": 1}).to_list(500)
        _ban_cache["ips"] = {r["ip"] for r in rows}
    except Exception:
        pass  # la eroare DB păstrăm ultima listă — nu blocăm din greșeală

def invalidate_ban_cache():
    _ban_cache["ts"] = 0.0

async def is_ip_banned(ip: str) -> bool:
    await _refresh_ban_cache()
    return ip in _ban_cache["ips"]

# loopback și rețelele interne nu sunt niciodată penalizate (health-checks, apeluri interne)
_NEVER_PENALIZE = ("127.0.0.1", "::1", "localhost")

def _add_strike(ip: str, reason: str, path: str, weight: int = 1):
    if ip in _NEVER_PENALIZE:
        return False
    now = time.time()
    strikes = [t for t in _strikes.get(ip, []) if now - t < 3600]
    strikes.extend([now] * weight)
    _strikes[ip] = strikes
    log_event("strike", ip, path, reason, "strike")
    if len(strikes) >= STRIKES_TO_BAN:
        _strikes[ip] = []
        until = (datetime.now(timezone.utc) + timedelta(minutes=BAN_MINUTES)).isoformat()
        _stats["bans_total"] += 1
        if _db is not None:
            async def _ban():
                try:
                    await _db.security_bans.update_one(
                        {"ip": ip},
                        {"$set": {"ip": ip, "until": until, "reason": reason[:200], "created_at": _now_iso()}},
                        upsert=True)
                    invalidate_ban_cache()
                except Exception as ex:
                    logger.warning(f"ban write failed: {ex}")
            try:
                asyncio.get_running_loop().create_task(_ban())
            except RuntimeError:
                pass
        log_event("ban", ip, path, f"{reason} — ban automat {BAN_MINUTES} min", "banned")
        return True
    return False

def stats() -> dict:
    now = time.time()
    rpm = len([t for t in _rpm_window if now - t < 60])
    return {
        "rpm": rpm,
        "attack_mode": now < _attack_mode_until,
        "blocked_today": _stats["blocked_today"],
        "waf_hits": _stats["waf_hits"],
        "bans_total": _stats["bans_total"],
        "banned_now": len(_ban_cache["ips"]),
        "tracked_ips": len(_rate),
    }

# ---------------- middleware principal ----------------
async def security_middleware(request: Request, call_next):
    global _attack_mode_until
    path = request.url.path
    ip = client_ip(request)
    now = time.time()

    # 0. fereastra globală RPM + attack mode
    _rpm_window.append(now)
    if len(_rpm_window) > 20000:
        del _rpm_window[:10000]
    rpm = len([t for t in _rpm_window if now - t < 60])
    if rpm > ATTACK_RPM and now >= _attack_mode_until:
        _attack_mode_until = now + ATTACK_MODE_MINUTES * 60
        log_event("attack_mode", ip, path, f"Trafic anormal: {rpm} cereri/min global — limite strânse {ATTACK_MODE_MINUTES} min", "alert")

    # 1. IP banat? → blocat total pe API
    await _refresh_ban_cache()
    if ip in _ban_cache["ips"] and ip not in _NEVER_PENALIZE:
        _bump_blocked()
        return JSONResponse({"detail": "Acces restricționat temporar."}, status_code=403)

    # 2. WAF: probing de path-uri + semnături malițioase + UA de scaner
    low_path = path.lower()
    if any(p in low_path for p in _PROBE_PATHS):
        _bump_blocked()
        _add_strike(ip, f"Probing path interzis: {low_path[:80]}", path, weight=2)
        _stats["waf_hits"] += 1
        return JSONResponse({"detail": "Interzis."}, status_code=403)

    ua = request.headers.get("user-agent", "")
    if _BAD_UA.search(ua):
        _bump_blocked()
        _add_strike(ip, f"User-Agent de scaner: {ua[:80]}", path, weight=2)
        _stats["waf_hits"] += 1
        return JSONResponse({"detail": "Interzis."}, status_code=403)

    raw_qs = request.url.query or ""
    if raw_qs or low_path.startswith("/api/"):
        hay = unquote(f"{path}?{raw_qs}")
        if _MALICIOUS.search(hay):
            _bump_blocked()
            _add_strike(ip, "Semnătură malițioasă în cerere (SQLi/XSS/RCE/traversal)", path, weight=2)
            _stats["waf_hits"] += 1
            return JSONResponse({"detail": "Cerere invalidă."}, status_code=400)

    # 3. limită de dimensiune (body) — uploadurile admin/avatar au limita lor de 100MB
    if request.method in ("POST", "PUT", "PATCH") and not path.startswith(UPLOAD_PREFIXES):
        try:
            cl = int(request.headers.get("content-length", "0") or 0)
        except ValueError:
            cl = 0
        if cl > MAX_BODY_BYTES:
            _bump_blocked()
            _add_strike(ip, f"Cerere prea mare: {cl} bytes", path)
            return JSONResponse({"detail": "Cererea este prea mare."}, status_code=413)

    # 4. concurență per IP (fără streaming fișiere / WS)
    if not path.startswith(CONCURRENCY_EXEMPT):
        cur = _concurrent.get(ip, 0)
        if cur >= MAX_CONCURRENT_PER_IP:
            _bump_blocked()
            return JSONResponse({"detail": "Prea multe conexiuni simultane."}, status_code=429)
        _concurrent[ip] = cur + 1

    try:
        # 5. rate limiting — strict auth → per endpoint → global (cu attack mode)
        if path in AUTH_STRICT_PATHS and request.method == "POST":
            if _hit(_auth_rate, ip, RATE_WINDOW) > AUTH_RATE_LIMIT:
                _bump_blocked()
                log_event("rate_auth", ip, path, "Peste 10 POST/min pe auth", "429")
                return JSONResponse({"detail": "Prea multe încercări de autentificare. Reîncearcă într-un minut."}, status_code=429)

        if request.method == "POST" and (path in ENDPOINT_LIMITS or path.endswith("/comments")):
            limit = ENDPOINT_LIMITS.get(path, COMMENT_RATE_LIMIT)
            if _hit(_ep_rate, f"{path}:{ip}", RATE_WINDOW) > limit:
                _bump_blocked()
                log_event("rate_endpoint", ip, path, f"Peste {limit} POST/min pe endpoint sensibil", "429")
                return JSONResponse({"detail": "Prea multe trimiteri. Reîncearcă într-un minut."}, status_code=429)

        if path.startswith("/api/") and not path.startswith("/api/files/"):
            limit = ATTACK_RATE_LIMIT if now < _attack_mode_until else GLOBAL_RATE_LIMIT
            if _hit(_rate, ip, RATE_WINDOW) > limit:
                _bump_blocked()
                log_event("rate_global", ip, path, f"Peste {limit} cereri/min", "429")
                return JSONResponse({"detail": "Prea multe cereri. Reîncearcă într-un minut."}, status_code=429)

        resp = await call_next(request)

        # 6. comportament de scaner: rafale de 404 → strike-uri
        if resp.status_code == 404 and not path.startswith("/api/files/"):
            n = _hit(_not_found, ip, 120)
            if n == SCAN_404_LIMIT:
                _add_strike(ip, f"Rafală de {SCAN_404_LIMIT}+ erori 404 în 2 minute (scaner)", path, weight=2)

        # 7. headere de securitate (identice cu varianta anterioară + completări)
        resp.headers["X-Frame-Options"] = "DENY"
        resp.headers["X-Content-Type-Options"] = "nosniff"
        resp.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        resp.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        resp.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        resp.headers["Cross-Origin-Opener-Policy"] = "same-origin-allow-popups"
        resp.headers["Cross-Origin-Resource-Policy"] = "same-site"
        resp.headers["X-Permitted-Cross-Domain-Policies"] = "none"
        resp.headers["Server"] = "bioxic"  # nu divulgăm versiuni
        if path.startswith("/api/"):
            resp.headers["X-Robots-Tag"] = "noindex, nofollow"
        if path.startswith(("/api/auth/", "/api/fans/", "/api/admin/")):
            resp.headers["Cache-Control"] = "no-store"
        resp.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self'; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: blob: https:; "
            "media-src 'self' blob: https://stream.tequilamusic.net; "
            "connect-src 'self' ws: wss: https://stream.tequilamusic.net; "
            "frame-src https://www.youtube.com https://www.youtube-nocookie.com; "
            "object-src 'none'; frame-ancestors 'none'; base-uri 'self'"
        )
        return resp
    finally:
        if not path.startswith(CONCURRENCY_EXEMPT):
            _concurrent[ip] = max(0, _concurrent.get(ip, 1) - 1)
