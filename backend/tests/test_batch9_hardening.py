"""Iteration 9 — new batch tests:
- /api/auth/me and /api/fans/me return 200 {user:null} for logged-out visitors
- fan login lockout 5 fails -> 429
- strict auth rate limit via middleware (10 POST/min/IP) — spaced so we don't trip 429 before DB counter
- no-store + noindex headers on /api/auth/*
- admin login still works with real super admin creds
- /api/tv/schedule CRUD with day_of_week; cleanup leaves no leftover rows
"""
import os, time, uuid, pytest, requests
from pymongo import MongoClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://bioxic-ai.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
SUPER_ADMIN_EMAIL = "cristimf2007@gmail.com"
SUPER_ADMIN_PASS = "mfcristi2007!"

MONGO = MongoClient(os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
DB = MONGO[os.environ.get("DB_NAME", "test_database")]


@pytest.fixture(autouse=True)
def _clean_rate():
    DB.login_attempts.delete_many({})
    yield
    DB.login_attempts.delete_many({})


# ---------- /api/auth/me and /api/fans/me unauth ----------

def test_auth_me_unauth_returns_200_null():
    r = requests.get(f"{API}/auth/me", timeout=15)
    assert r.status_code == 200, f"Expected 200 for unauth /auth/me, got {r.status_code}: {r.text}"
    assert r.json() == {"user": None}


def test_fans_me_unauth_returns_200_null():
    r = requests.get(f"{API}/fans/me", timeout=15)
    assert r.status_code == 200, f"Expected 200 for unauth /fans/me, got {r.status_code}: {r.text}"
    assert r.json() == {"user": None}


# ---------- Security headers ----------

def test_no_store_on_auth():
    r = requests.get(f"{API}/auth/me", timeout=15)
    assert "no-store" in r.headers.get("Cache-Control", "").lower()
    assert "noindex" in (r.headers.get("X-Robots-Tag") or "").lower()


# ---------- Admin login works ----------

@pytest.fixture
def admin_session():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": SUPER_ADMIN_EMAIL, "password": SUPER_ADMIN_PASS}, timeout=15)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    me = s.get(f"{API}/auth/me", timeout=15)
    assert me.status_code == 200
    body = me.json()
    # with cookie, auth_me returns {email, role} directly (not wrapped)
    assert body.get("email") == SUPER_ADMIN_EMAIL or (body.get("user") and body["user"].get("email") == SUPER_ADMIN_EMAIL)
    return s


def test_admin_login_and_me(admin_session):
    assert "access_token" in admin_session.cookies


# ---------- TV schedule CRUD (day_of_week) ----------

def test_tv_schedule_add_list_delete_cleanup(admin_session):
    # starting state (preserve)
    before = requests.get(f"{API}/tv/schedule", timeout=15).json()
    unique_title = f"TEST_batch9_{uuid.uuid4().hex[:6]}"
    r = admin_session.post(f"{API}/admin/tv/schedule",
                           json={"time": "20:30", "title": unique_title, "note": "regression", "day": 5},
                           timeout=15)
    assert r.status_code == 200, r.text
    entry = r.json()
    assert entry["day"] == 5
    assert entry["title"] == unique_title
    entry_id = entry["id"]

    # list contains it
    lst = requests.get(f"{API}/tv/schedule", timeout=15).json()
    assert any(x["id"] == entry_id for x in lst)

    # delete
    d = admin_session.delete(f"{API}/admin/tv/schedule/{entry_id}", timeout=15)
    assert d.status_code == 200
    lst2 = requests.get(f"{API}/tv/schedule", timeout=15).json()
    assert not any(x["id"] == entry_id for x in lst2)

    # cleanup: ensure no TEST_ leftovers overall
    leftovers = [x for x in lst2 if str(x.get("title", "")).startswith("TEST_")]
    if leftovers:
        for x in leftovers:
            admin_session.delete(f"{API}/admin/tv/schedule/{x['id']}", timeout=15)


# ---------- Admin schedule needs auth ----------

def test_admin_tv_schedule_requires_auth():
    r = requests.post(f"{API}/admin/tv/schedule",
                      json={"time": "20:30", "title": "x", "day": 0}, timeout=15)
    assert r.status_code == 401


# ---------- Fan register validation (bad data) ----------

def test_fan_register_rejects_bad_email():
    r = requests.post(f"{API}/fans/register",
                      json={"name": "X", "email": "notanemail", "password": "abcdef"}, timeout=15)
    assert r.status_code in (400, 422)


# ---------- Fan login lockout 5 fails -> 429 ----------

def test_fan_login_lockout_after_5_fails():
    """Hit middleware strict auth limit (10 POST/min/IP) is 10; our DB-level fan lockout is 5.
    So 5 bad attempts should trigger DB lockout 429 on the 6th call."""
    DB.login_attempts.delete_many({})
    email = f"nobody_{uuid.uuid4().hex[:6]}@test.ro"
    codes = []
    for i in range(6):
        r = requests.post(f"{API}/fans/login",
                          json={"email": email, "password": "wrong"}, timeout=15)
        codes.append(r.status_code)
        time.sleep(0.3)
    # The 6th attempt should be 429 (DB lockout). But middleware strict auth limit is 10/min —
    # 6 attempts won't trip it. Also note: non-existent user still increments.
    assert codes[-1] == 429, f"Expected 429 lockout on 6th attempt, got {codes}"


# ---------- auth strict middleware rate limit (10 POST/min/IP) ----------

def test_auth_middleware_strict_rate_limit():
    """11 fast POST attempts to /auth/login (even with clean DB) should include a 429 from middleware."""
    DB.login_attempts.delete_many({})
    codes = []
    for i in range(12):
        r = requests.post(f"{API}/auth/login",
                          json={"email": f"zzz_{i}@none.ro", "password": "x"}, timeout=15)
        codes.append(r.status_code)
    DB.login_attempts.delete_many({})
    assert 429 in codes, f"Expected 429 somewhere in 12 fast posts, got {codes}"
