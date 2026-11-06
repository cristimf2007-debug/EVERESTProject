"""BIOXIC — backend API tests (radio 24/7, channel, auth, tracks)."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8001").rstrip("/")
API = f"{BASE_URL}/api"
ADMIN_EMAIL = "admin@bioxic.ro"
ADMIN_PASSWORD = "bioxic2024"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_token(session):
    r = session.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "token" in data
    assert data["user"]["email"] == ADMIN_EMAIL
    return data["token"]


# ---------- Tracks ----------
def test_tracks_list_has_real_track(session):
    r = session.get(f"{API}/tracks")
    assert r.status_code == 200
    tracks = r.json()
    assert isinstance(tracks, list) and len(tracks) >= 1
    t = tracks[0]
    assert "duration" in t
    assert "title" in t
    assert "audio_url" in t


# ---------- Radio 24/7 ----------
def test_radio_now_live(session):
    r = session.get(f"{API}/radio/now")
    assert r.status_code == 200
    d = r.json()
    assert d["live"] is True
    assert d["track"] is not None
    assert d["duration"] > 0
    assert 0 <= d["position"] <= d["duration"] + 1
    assert isinstance(d["queue"], list) and len(d["queue"]) >= 1
    assert "server_time" in d
    assert "listeners" in d


def test_radio_position_advances(session):
    import time
    r1 = session.get(f"{API}/radio/now").json()
    time.sleep(2.2)
    r2 = session.get(f"{API}/radio/now").json()
    # Position should either have advanced ~2s OR wrapped to a new track
    advanced = (r2["position"] > r1["position"]) or (r2["track"]["id"] != r1["track"]["id"])
    assert advanced, f"position did not advance: {r1['position']} -> {r2['position']}"


def test_radio_heartbeat(session):
    sid = f"test-{uuid.uuid4()}"
    r = session.post(f"{API}/radio/heartbeat", json={"sid": sid})
    assert r.status_code == 200
    data = r.json()
    assert "listeners" in data
    assert isinstance(data["listeners"], int)
    assert data["listeners"] >= 1


def test_radio_heartbeat_requires_sid(session):
    r = session.post(f"{API}/radio/heartbeat", json={})
    assert r.status_code == 400


# ---------- Channel ----------
def test_channel_stats(session):
    r = session.get(f"{API}/channel/stats")
    assert r.status_code == 200
    assert "subscribers" in r.json()


def test_channel_subscribe_toggle(session):
    sid = f"test-sub-{uuid.uuid4()}"
    before = session.get(f"{API}/channel/stats").json()["subscribers"]
    r = session.post(f"{API}/channel/subscribe", json={"sid": sid, "subscribed": True})
    assert r.status_code == 200
    after_sub = r.json()["subscribers"]
    assert after_sub == before + 1
    r2 = session.post(f"{API}/channel/subscribe", json={"sid": sid, "subscribed": False})
    assert r2.status_code == 200
    assert r2.json()["subscribers"] == before


# ---------- Admin radio skip ----------
def test_admin_radio_skip_requires_auth(session):
    r = session.post(f"{API}/admin/radio/skip")
    assert r.status_code in (401, 403)


def test_admin_radio_skip_resets_position(session, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    r = session.post(f"{API}/admin/radio/skip", headers=headers)
    assert r.status_code == 200, r.text
    assert r.json().get("ok") is True
    now = session.get(f"{API}/radio/now").json()
    # Position just after skip should be near 0
    assert now["position"] < 5, f"position after skip too large: {now['position']}"
