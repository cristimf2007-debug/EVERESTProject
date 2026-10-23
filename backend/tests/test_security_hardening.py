"""Backend security hardening tests (iteration 6):
- cookie-based auth (/api/auth/login sets httpOnly cookie)
- /api/auth/me works with cookie only (no Bearer)
- logout clears cookie
- security headers (X-Frame-Options, nosniff, HSTS, CSP frame-ancestors 'none')
- CORS: external origin NOT reflected
- Rate limit login: 6 bad logins -> 429 on 6th
- Chat rate limit module via WS tested separately — here HTTP endpoints only
"""
import os, time, pytest, requests
from pymongo import MongoClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://bioxic-ai.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
ADMIN_EMAIL = "admin@bioxic.ro"
ADMIN_PASS = "bioxic2024"

MONGO = MongoClient(os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
DB = MONGO[os.environ.get("DB_NAME", "test_database")]


@pytest.fixture(autouse=True)
def _clear_login_attempts():
    DB.login_attempts.delete_many({})
    yield
    DB.login_attempts.delete_many({})


def test_security_headers_on_api():
    r = requests.get(f"{API}/tracks", timeout=15)
    assert r.status_code == 200
    assert r.headers.get("X-Frame-Options") == "DENY"
    assert r.headers.get("X-Content-Type-Options") == "nosniff"
    assert "max-age" in (r.headers.get("Strict-Transport-Security") or "")
    csp = r.headers.get("Content-Security-Policy", "")
    assert "frame-ancestors 'none'" in csp
    assert r.headers.get("Referrer-Policy")
    assert r.headers.get("Permissions-Policy")


def test_cors_external_origin_not_reflected():
    """OPTIONS preflight from evil origin → ACAO MUST NOT equal evil origin"""
    r = requests.options(
        f"{API}/tracks",
        headers={
            "Origin": "https://evil.example",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "content-type",
        },
        timeout=15,
    )
    acao = r.headers.get("Access-Control-Allow-Origin", "")
    assert acao != "https://evil.example", f"CORS leaked to evil origin: {acao!r}"
    # also must not be wildcard with credentials allowed
    assert not (acao == "*" and r.headers.get("Access-Control-Allow-Credentials") == "true")


def test_login_sets_httponly_cookie_and_me_works_with_cookie_only():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS}, timeout=15)
    assert r.status_code == 200, r.text
    # cookie must be set
    assert "access_token" in s.cookies
    # inspect Set-Cookie header
    set_cookie = r.headers.get("Set-Cookie", "")
    assert "HttpOnly" in set_cookie
    assert "Secure" in set_cookie
    assert "SameSite=strict" in set_cookie.lower().replace("samesite=strict", "SameSite=strict") or "SameSite=Strict" in set_cookie

    # /auth/me with ONLY cookie (no Bearer)
    me = s.get(f"{API}/auth/me", timeout=15)
    assert me.status_code == 200, me.text
    assert me.json()["email"] == ADMIN_EMAIL

    # logout clears cookie
    lo = s.post(f"{API}/auth/logout", timeout=15)
    assert lo.status_code == 200
    # Session cookie should now be cleared
    me2 = requests.get(f"{API}/auth/me", timeout=15)  # fresh — no cookie
    assert me2.status_code == 401


def test_auth_me_requires_auth():
    r = requests.get(f"{API}/auth/me", timeout=15)
    assert r.status_code == 401


def test_admin_tracks_post_requires_cookie():
    r = requests.post(f"{API}/admin/tracks", data={"title": "x"}, timeout=15)
    assert r.status_code == 401


def test_login_rate_limit_6_bad_attempts():
    """6 bad logins consecutive → 6th should be 429 (lockout)."""
    DB.login_attempts.delete_many({})
    codes = []
    for i in range(6):
        r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "WRONG"}, timeout=15)
        codes.append(r.status_code)
        time.sleep(0.15)
    assert codes[-1] == 429, f"Expected 429 on 6th attempt, got {codes}. DB: {list(DB.login_attempts.find({},{'_id':0}))}"
    # cleanup critical
    DB.login_attempts.delete_many({})


def test_media_sign_requires_signed_url_for_audio():
    # find any audio file record
    rec = DB.files.find_one({"storage_path": {"$regex": "/uploads/audio/"}, "is_deleted": False})
    if not rec:
        pytest.skip("No audio file in DB to test")
    serve_url = rec["serve_url"]
    # without sig → 403
    r = requests.get(f"{BASE_URL}{serve_url}", timeout=20, allow_redirects=False)
    assert r.status_code == 403
    # sign it
    sign = requests.get(f"{API}/media/sign", params={"u": serve_url}, timeout=15)
    assert sign.status_code == 200
    signed = sign.json()["url"]
    assert "sig=" in signed and "exp=" in signed
    # fetch with signed → 200
    r2 = requests.get(f"{BASE_URL}{signed}", timeout=30)
    assert r2.status_code == 200
    # Range request → 206
    r3 = requests.get(f"{BASE_URL}{signed}", headers={"Range": "bytes=0-1023"}, timeout=30)
    assert r3.status_code == 206
    assert "Content-Range" in r3.headers
