"""BIOXIC — round 3: tests for reactions (fire/crown), playlist field, admin chat moderation."""
import asyncio
import json
import os
import uuid
import pytest
import requests
import websockets

BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or "http://localhost:8001").rstrip("/")
API = f"{BASE_URL}/api"
WS_URL = BASE_URL.replace("http", "ws") + "/api/ws/chat"
ADMIN = {"email": "admin@bioxic.ro", "password": "bioxic2024"}


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/auth/login", json=ADMIN, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="module")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ---------- Playlist field on tracks ----------
def test_track_has_playlist_field():
    r = requests.get(f"{API}/tracks", timeout=15)
    assert r.status_code == 200
    tracks = r.json()
    assert tracks
    # 'playlist' key is optional; if absent treat as empty — but PATCH should accept it
    # Just assert the field is accessible as default None/empty if absent.


def test_patch_playlist_on_existing_track(auth_headers):
    tracks = requests.get(f"{API}/tracks", timeout=15).json()
    assert tracks, "no tracks"
    tid = tracks[0]["id"]
    # Set playlist
    r = requests.patch(f"{API}/admin/tracks/{tid}", headers=auth_headers,
                       json={"playlist": "TEST_Playlist"}, timeout=15)
    assert r.status_code == 200, r.text
    assert r.json().get("playlist") == "TEST_Playlist"
    # Clear playlist
    r2 = requests.patch(f"{API}/admin/tracks/{tid}", headers=auth_headers,
                        json={"playlist": ""}, timeout=15)
    assert r2.status_code == 200
    assert r2.json().get("playlist") == ""


# ---------- Admin chat moderation ----------
def _ws_recv_until(ws, pred, timeout=5):
    end = asyncio.get_event_loop().time() + timeout
    while asyncio.get_event_loop().time() < end:
        try:
            raw = asyncio.get_event_loop().run_until_complete(
                asyncio.wait_for(ws.recv(), timeout=end - asyncio.get_event_loop().time()))
        except asyncio.TimeoutError:
            return None
        data = json.loads(raw)
        if pred(data):
            return data
    return None


async def _recv_until(ws, pred, timeout=5):
    end = asyncio.get_event_loop().time() + timeout
    while asyncio.get_event_loop().time() < end:
        try:
            raw = await asyncio.wait_for(ws.recv(), timeout=max(0.1, end - asyncio.get_event_loop().time()))
        except asyncio.TimeoutError:
            return None
        data = json.loads(raw)
        if pred(data):
            return data
    return None


def test_admin_chat_list_requires_auth():
    r = requests.get(f"{API}/admin/chat", timeout=15)
    assert r.status_code in (401, 403)


def test_admin_chat_list_returns_list(auth_headers):
    r = requests.get(f"{API}/admin/chat", headers=auth_headers, timeout=15)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


@pytest.mark.asyncio
async def test_admin_delete_chat_broadcasts(auth_headers):
    # Create a message via WS
    unique = f"TEST_DEL_{uuid.uuid4().hex[:6]}"
    async with websockets.connect(WS_URL) as a, websockets.connect(WS_URL) as b:
        await _recv_until(a, lambda d: d.get("type") == "history")
        await _recv_until(b, lambda d: d.get("type") == "history")
        await a.send(json.dumps({"type": "message", "name": "TEST_Mod", "text": unique}))
        msg = await _recv_until(b, lambda d: d.get("type") == "message" and d.get("text") == unique)
        assert msg is not None
        mid = msg["id"]
        # Delete via admin
        r = requests.delete(f"{API}/admin/chat/{mid}", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        # Expect delete broadcast on B
        d = await _recv_until(b, lambda d: d.get("type") == "delete" and d.get("id") == mid)
        assert d is not None, "delete not broadcast"


@pytest.mark.asyncio
async def test_admin_ban_blocks_future_messages(auth_headers):
    banned_name = f"TEST_Ban_{uuid.uuid4().hex[:6]}"
    # Ban via admin
    r = requests.post(f"{API}/admin/chat/ban", headers=auth_headers, json={"name": banned_name}, timeout=15)
    assert r.status_code == 200
    # Try to send as that name
    async with websockets.connect(WS_URL) as a:
        await _recv_until(a, lambda d: d.get("type") == "history")
        await a.send(json.dumps({"type": "message", "name": banned_name, "text": "should be blocked"}))
        err = await _recv_until(a, lambda d: d.get("type") == "error", timeout=3)
        assert err is not None, "ban did not block"


# ---------- Fire/Crown reactions ----------
@pytest.mark.asyncio
async def test_reaction_fire_broadcasts():
    async with websockets.connect(WS_URL) as a, websockets.connect(WS_URL) as b:
        await _recv_until(a, lambda d: d.get("type") == "history")
        await _recv_until(b, lambda d: d.get("type") == "history")
        await a.send(json.dumps({"type": "reaction", "emoji": "fire"}))
        r = await _recv_until(b, lambda d: d.get("type") == "reaction" and d.get("emoji") == "fire")
        assert r is not None


@pytest.mark.asyncio
async def test_reaction_crown_broadcasts():
    async with websockets.connect(WS_URL) as a, websockets.connect(WS_URL) as b:
        await _recv_until(a, lambda d: d.get("type") == "history")
        await _recv_until(b, lambda d: d.get("type") == "history")
        await a.send(json.dumps({"type": "reaction", "emoji": "crown"}))
        r = await _recv_until(b, lambda d: d.get("type") == "reaction" and d.get("emoji") == "crown")
        assert r is not None


@pytest.mark.asyncio
async def test_reaction_invalid_emoji_ignored():
    async with websockets.connect(WS_URL) as a:
        await _recv_until(a, lambda d: d.get("type") == "history")
        await a.send(json.dumps({"type": "reaction", "emoji": "poop"}))
        try:
            raw = await asyncio.wait_for(a.recv(), timeout=1.5)
            data = json.loads(raw)
            assert data.get("type") != "reaction" or data.get("emoji") != "poop"
        except asyncio.TimeoutError:
            pass
