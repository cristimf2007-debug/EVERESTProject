"""Chat WS security tests: HTML stripped, bad words censored, rate limit, trimming"""
import asyncio, json, os, pytest
import websockets
from pymongo import MongoClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://bioxic-ai.preview.emergentagent.com")
WS_URL = BASE_URL.replace("https://", "wss://").replace("http://", "ws://") + "/api/ws/chat"
DB = MongoClient(os.environ.get("MONGO_URL", "mongodb://localhost:27017"))[os.environ.get("DB_NAME", "test_database")]


async def _consume_initial(ws):
    # consume history + like_count greetings
    for _ in range(3):
        try:
            raw = await asyncio.wait_for(ws.recv(), timeout=2.0)
        except asyncio.TimeoutError:
            break


async def _recv_until(ws, kind, timeout=5.0):
    end = asyncio.get_event_loop().time() + timeout
    while asyncio.get_event_loop().time() < end:
        try:
            raw = await asyncio.wait_for(ws.recv(), timeout=end - asyncio.get_event_loop().time())
            data = json.loads(raw)
            if data.get("type") == kind:
                return data
        except asyncio.TimeoutError:
            return None
    return None


@pytest.mark.asyncio
async def test_chat_html_stripped_and_badword_censored():
    DB.chat.delete_many({"name": "TEST_SEC"})
    async with websockets.connect(WS_URL) as ws:
        await _consume_initial(ws)
        await ws.send(json.dumps({"type": "message", "name": "TEST_SEC",
                                  "text": "<script>alert(1)</script> salut <b>bold</b>"}))
        msg = await _recv_until(ws, "message")
        assert msg is not None, "No message echoed"
        assert "<script>" not in msg["text"]
        assert "<b>" not in msg["text"]
        assert "alert(1)" in msg["text"] or "salut" in msg["text"]  # text content preserved
        print("HTML stripped:", msg["text"])
    # badword
    async with websockets.connect(WS_URL) as ws2:
        await _consume_initial(ws2)
        await ws2.send(json.dumps({"type": "message", "name": "TEST_SEC", "text": "ce muie e asta"}))
        msg = await _recv_until(ws2, "message")
        assert msg is not None
        assert "***" in msg["text"], f"Bad word not censored: {msg['text']}"
        assert "muie" not in msg["text"].lower()
        print("Bad word censored:", msg["text"])
    DB.chat.delete_many({"name": "TEST_SEC"})


@pytest.mark.asyncio
async def test_chat_rate_limit_2s():
    DB.chat.delete_many({"name": "TEST_RL"})
    async with websockets.connect(WS_URL) as ws:
        await _consume_initial(ws)
        # msg 1 — OK
        await ws.send(json.dumps({"type": "message", "name": "TEST_RL", "text": "msg1"}))
        m1 = await _recv_until(ws, "message", timeout=3)
        assert m1 is not None
        # msg 2 — immediate, should be refused with "error"
        await ws.send(json.dumps({"type": "message", "name": "TEST_RL", "text": "msg2"}))
        err = await _recv_until(ws, "error", timeout=3)
        assert err is not None, "Expected error on 2nd rapid message"
        assert "2 secunde" in err.get("detail", "") or "repede" in err.get("detail", "")
        print("Rate limit error:", err)
    DB.chat.delete_many({"name": "TEST_RL"})


@pytest.mark.asyncio
async def test_chat_text_truncated_to_200():
    DB.chat.delete_many({"name": "TEST_TR"})
    async with websockets.connect(WS_URL) as ws:
        await _consume_initial(ws)
        long_text = "a" * 300
        await ws.send(json.dumps({"type": "message", "name": "TEST_TR", "text": long_text}))
        msg = await _recv_until(ws, "message", timeout=3)
        assert msg is not None
        assert len(msg["text"]) == 200, f"Text len={len(msg['text'])}"
    DB.chat.delete_many({"name": "TEST_TR"})


@pytest.mark.asyncio
async def test_chat_name_truncated_to_24():
    DB.chat.delete_many({})
    long_name = "N" * 50
    async with websockets.connect(WS_URL) as ws:
        await _consume_initial(ws)
        await ws.send(json.dumps({"type": "message", "name": long_name, "text": "hi"}))
        msg = await _recv_until(ws, "message", timeout=3)
        assert msg is not None
        assert len(msg["name"]) <= 24, f"Name len={len(msg['name'])}"
        print("Name truncated to:", msg["name"], len(msg["name"]))
    DB.chat.delete_many({"name": {"$regex": "^N+$"}})
