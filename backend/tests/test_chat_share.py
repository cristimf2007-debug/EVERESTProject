"""Chat WebSocket & share endpoint regression tests for BIOXIC."""
import asyncio
import json
import os
import pytest
import requests
import websockets

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") if os.environ.get("REACT_APP_BACKEND_URL") else "https://bioxic-ai.preview.emergentagent.com"
WS_URL = BASE_URL.replace("http", "ws") + "/api/ws/chat"


# ---- Share endpoint ----
def test_share_by_slug_returns_og_html():
    r = requests.get(f"{BASE_URL}/api/share/01", timeout=15)
    assert r.status_code == 200
    assert "og:image" in r.text
    assert "og:title" in r.text


def test_share_by_id_returns_og_html():
    tracks = requests.get(f"{BASE_URL}/api/tracks", timeout=15).json()
    assert tracks, "no tracks"
    tid = tracks[0]["id"]
    r = requests.get(f"{BASE_URL}/api/share/{tid}", timeout=15)
    assert r.status_code == 200
    assert "og:image" in r.text


def test_share_unknown_returns_404():
    r = requests.get(f"{BASE_URL}/api/share/this-does-not-exist", timeout=15)
    assert r.status_code == 404


# ---- Chat WebSocket ----
async def _recv_until(ws, pred, timeout=5):
    end = asyncio.get_event_loop().time() + timeout
    buf = []
    while asyncio.get_event_loop().time() < end:
        try:
            raw = await asyncio.wait_for(ws.recv(), timeout=end - asyncio.get_event_loop().time())
        except asyncio.TimeoutError:
            break
        data = json.loads(raw)
        buf.append(data)
        if pred(data):
            return data, buf
    return None, buf


@pytest.mark.asyncio
async def test_chat_history_and_message_broadcast():
    async with websockets.connect(WS_URL) as a, websockets.connect(WS_URL) as b:
        # Each client receives history
        hist_a, _ = await _recv_until(a, lambda d: d.get("type") == "history")
        hist_b, _ = await _recv_until(b, lambda d: d.get("type") == "history")
        assert hist_a is not None and hist_b is not None
        assert isinstance(hist_a["messages"], list)

        # A sends, B receives
        payload = {"type": "message", "name": "TEST_A", "text": "salut din test"}
        await a.send(json.dumps(payload))
        got, _ = await _recv_until(b, lambda d: d.get("type") == "message" and d.get("text") == "salut din test")
        assert got is not None, "B did not receive message from A"
        assert got["name"] == "TEST_A"
        assert "id" in got


@pytest.mark.asyncio
async def test_chat_heart_tap_broadcasts_reaction_and_like_count():
    async with websockets.connect(WS_URL) as a, websockets.connect(WS_URL) as b:
        await _recv_until(a, lambda d: d.get("type") == "history")
        await _recv_until(b, lambda d: d.get("type") == "history")
        await a.send(json.dumps({"type": "tap"}))
        reaction, _ = await _recv_until(b, lambda d: d.get("type") == "reaction" and d.get("emoji") == "heart")
        assert reaction is not None
        like, _ = await _recv_until(b, lambda d: d.get("type") == "like_count")
        assert like is not None
        assert isinstance(like["total"], int)


@pytest.mark.asyncio
async def test_chat_empty_message_ignored():
    async with websockets.connect(WS_URL) as a:
        await _recv_until(a, lambda d: d.get("type") == "history")
        await a.send(json.dumps({"type": "message", "name": "TEST", "text": "   "}))
        # Expect nothing within 1.5s
        try:
            raw = await asyncio.wait_for(a.recv(), timeout=1.5)
            data = json.loads(raw)
            assert data.get("type") != "message", f"Unexpected echo: {data}"
        except asyncio.TimeoutError:
            pass  # correct
