"""Tests for the Super Admin secret panel (/api/admin/panel/*) and moderation flow."""
import os
import time
import uuid

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://bioxic-ai.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "cristimf2007@gmail.com"
ADMIN_PASSWORD = "mfcristi2007!"

FAN_EMAIL = "testmoderare@example.com"
FAN_NAME = "TestModerare"
FAN_PASSWORD = "test1234"


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200, f"admin login failed {r.status_code} {r.text}"
    data = r.json()
    assert "token" in data
    assert data["user"]["role"] == "admin"
    return data["token"]


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="module")
def fan_user():
    """Register (idempotently) a test fan. Clean any existing ban/mute first via admin."""
    # Try to register
    r = requests.post(f"{BASE_URL}/api/fans/register",
                      json={"name": FAN_NAME, "email": FAN_EMAIL, "password": FAN_PASSWORD}, timeout=15)
    # If already exists, login
    if r.status_code not in (200, 201):
        lr = requests.post(f"{BASE_URL}/api/fans/login", json={"email": FAN_EMAIL, "password": FAN_PASSWORD}, timeout=15)
        if lr.status_code == 403:
            # Account suspended from prior run → unban first via admin
            ar = requests.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}).json()
            h = {"Authorization": f"Bearer {ar['token']}"}
            requests.post(f"{BASE_URL}/api/admin/panel/moderate", headers=h,
                          json={"action": "unban", "email": FAN_EMAIL, "name": FAN_NAME})
            requests.post(f"{BASE_URL}/api/admin/panel/moderate", headers=h,
                          json={"action": "unmute", "name": FAN_NAME})
            lr = requests.post(f"{BASE_URL}/api/fans/login", json={"email": FAN_EMAIL, "password": FAN_PASSWORD})
        assert lr.status_code == 200, f"fan login failed {lr.status_code} {lr.text}"
        user = lr.json().get("user") or {}
    else:
        user = r.json().get("user") or {}
    # Normalize
    assert user.get("email", "").lower() == FAN_EMAIL
    return user


# ----- SECURITY: unauthenticated access -----

class TestPanelSecurity:
    def test_overview_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/admin/panel/overview", timeout=15)
        assert r.status_code in (401, 403), f"expected 401/403, got {r.status_code}"

    def test_users_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/admin/panel/users", timeout=15)
        assert r.status_code in (401, 403)

    def test_activity_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/admin/panel/activity", timeout=15)
        assert r.status_code in (401, 403)

    def test_moderate_requires_auth(self):
        r = requests.post(f"{BASE_URL}/api/admin/panel/moderate",
                          json={"action": "ban", "email": "x@x.com"}, timeout=15)
        assert r.status_code in (401, 403)

    def test_wrong_password_fails(self):
        r = requests.post(f"{BASE_URL}/api/auth/login",
                          json={"email": ADMIN_EMAIL, "password": "WRONG_PASS_xyz"}, timeout=15)
        assert r.status_code in (400, 401, 403)


# ----- PANEL DATA -----

class TestPanelData:
    def test_overview_returns_counters(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/admin/panel/overview", headers=admin_headers, timeout=15)
        assert r.status_code == 200
        d = r.json()
        for k in ("fans", "subscribers", "online_chat", "logins_today", "tracks", "videos"):
            assert k in d, f"missing key {k} in overview"
            assert isinstance(d[k], int), f"{k} not int: {d[k]}"

    def test_users_returns_fans_and_subs(self, admin_headers, fan_user):
        r = requests.get(f"{BASE_URL}/api/admin/panel/users", headers=admin_headers, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert "fans" in d and isinstance(d["fans"], list)
        assert "subscribers" in d and isinstance(d["subscribers"], list)
        emails = [f.get("email", "").lower() for f in d["fans"]]
        assert FAN_EMAIL in emails, f"test fan not in list: {emails[:5]}..."

    def test_activity_log_contains_login(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/admin/panel/activity", headers=admin_headers,
                         params={"type": "login", "limit": 50}, timeout=15)
        assert r.status_code == 200
        arr = r.json()
        assert isinstance(arr, list)
        assert len(arr) >= 1
        e = arr[0]
        for k in ("type", "actor", "ts"):
            assert k in e


# ----- MODERATION FLOW -----

class TestModerationFlow:
    def test_mute_then_unmute(self, admin_headers, fan_user):
        uid = fan_user.get("user_id") or fan_user.get("id") or ""
        r = requests.post(f"{BASE_URL}/api/admin/panel/moderate", headers=admin_headers,
                          json={"action": "mute", "user_id": uid, "name": FAN_NAME}, timeout=15)
        assert r.status_code == 200 and r.json().get("ok") is True
        # Verify muted flag
        u = requests.get(f"{BASE_URL}/api/admin/panel/users", headers=admin_headers).json()
        target = next((f for f in u["fans"] if f["email"].lower() == FAN_EMAIL), None)
        assert target and target["muted"] is True
        # Unmute
        r2 = requests.post(f"{BASE_URL}/api/admin/panel/moderate", headers=admin_headers,
                           json={"action": "unmute", "user_id": uid, "name": FAN_NAME}, timeout=15)
        assert r2.status_code == 200
        u2 = requests.get(f"{BASE_URL}/api/admin/panel/users", headers=admin_headers).json()
        target2 = next((f for f in u2["fans"] if f["email"].lower() == FAN_EMAIL), None)
        assert target2 and target2["muted"] is False

    def test_ban_blocks_login_then_unban_restores(self, admin_headers, fan_user):
        uid = fan_user.get("user_id") or ""
        # Ban
        r = requests.post(f"{BASE_URL}/api/admin/panel/moderate", headers=admin_headers,
                          json={"action": "ban", "user_id": uid, "email": FAN_EMAIL, "name": FAN_NAME}, timeout=15)
        assert r.status_code == 200
        # Fan login should now 403
        lr = requests.post(f"{BASE_URL}/api/fans/login",
                           json={"email": FAN_EMAIL, "password": FAN_PASSWORD}, timeout=15)
        assert lr.status_code == 403, f"expected 403 after ban, got {lr.status_code} {lr.text}"
        # Verify flag in panel
        u = requests.get(f"{BASE_URL}/api/admin/panel/users", headers=admin_headers).json()
        target = next((f for f in u["fans"] if f["email"].lower() == FAN_EMAIL), None)
        assert target and target["banned"] is True
        # Unban
        r2 = requests.post(f"{BASE_URL}/api/admin/panel/moderate", headers=admin_headers,
                           json={"action": "unban", "user_id": uid, "email": FAN_EMAIL, "name": FAN_NAME}, timeout=15)
        assert r2.status_code == 200
        # Login works again
        lr2 = requests.post(f"{BASE_URL}/api/fans/login",
                            json={"email": FAN_EMAIL, "password": FAN_PASSWORD}, timeout=15)
        assert lr2.status_code == 200, f"expected 200 after unban, got {lr2.status_code} {lr2.text}"

    def test_moderation_log_recorded(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/admin/panel/activity", headers=admin_headers,
                         params={"type": "moderation", "limit": 20}, timeout=15)
        assert r.status_code == 200
        arr = r.json()
        assert len(arr) >= 1
        kinds = {e["detail"].split(" ")[0] for e in arr}
        assert kinds & {"ban", "unban", "mute", "unmute"}, f"no moderation detail found: {arr[:3]}"

    def test_moderate_bad_action(self, admin_headers):
        r = requests.post(f"{BASE_URL}/api/admin/panel/moderate", headers=admin_headers,
                         json={"action": "nuke", "email": FAN_EMAIL}, timeout=15)
        assert r.status_code == 400


# ----- EXCLUSIVE ADMIN -----

class TestExclusiveAdmin:
    def test_old_admin_demoted(self):
        """Old admin@bioxic.ro should NOT be able to log in as admin anymore (demoted or password changed)."""
        r = requests.post(f"{BASE_URL}/api/auth/login",
                          json={"email": "admin@bioxic.ro", "password": "bioxic2024"}, timeout=15)
        # Could be 401/403 (demoted / wrong pass) or 200 with user.role=fan
        if r.status_code == 200:
            assert r.json()["user"]["role"] != "admin"
        else:
            assert r.status_code in (400, 401, 403)
