"""BIOXIC — tests for signed audio URLs (anti-steal)."""
import os
import time
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://bioxic-ai.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def tracks():
    r = requests.get(f"{API}/tracks")
    assert r.status_code == 200
    return r.json()


@pytest.fixture(scope="module")
def audio_url(tracks):
    assert len(tracks) >= 1
    au = tracks[0]["audio_url"]
    assert "/api/files/" in au and "/uploads/audio/" in au
    return au


@pytest.fixture(scope="module")
def cover_url(tracks):
    cu = tracks[0].get("cover_url")
    assert cu and "/api/files/" in cu
    return cu


def _strip_api(url: str) -> str:
    # convert absolute or relative /api/files/... to the request path for direct GET
    if url.startswith("http"):
        return url
    return f"{BASE_URL}{url}"


def test_audio_unsigned_is_forbidden(audio_url):
    r = requests.get(_strip_api(audio_url), allow_redirects=False)
    assert r.status_code == 403, f"expected 403, got {r.status_code}: {r.text[:200]}"


def test_media_sign_returns_signed_url(audio_url):
    r = requests.get(f"{API}/media/sign", params={"u": audio_url})
    assert r.status_code == 200, r.text
    data = r.json()
    assert "url" in data
    signed = data["url"]
    assert "exp=" in signed and "sig=" in signed
    assert signed.startswith(audio_url.split("?")[0])


def test_audio_signed_is_accessible(audio_url):
    s = requests.get(f"{API}/media/sign", params={"u": audio_url}).json()["url"]
    # fetch only a tiny range to avoid pulling 37MB
    r = requests.get(_strip_api(s), headers={"Range": "bytes=0-1023"}, stream=True)
    assert r.status_code in (200, 206), f"expected 200/206, got {r.status_code}"
    r.close()


def test_audio_expired_signature_forbidden(audio_url):
    # construct an exp in the past
    base = audio_url
    tampered = f"{base}?exp={int(time.time()) - 10}&sig=deadbeef" + ("0" * 24)
    r = requests.get(_strip_api(tampered), allow_redirects=False)
    assert r.status_code == 403


def test_audio_bad_signature_forbidden(audio_url):
    tampered = f"{audio_url}?exp={int(time.time()) + 900}&sig={'a' * 32}"
    r = requests.get(_strip_api(tampered), allow_redirects=False)
    assert r.status_code == 403


def test_cover_public_without_signature(cover_url):
    r = requests.get(_strip_api(cover_url))
    assert r.status_code == 200
    assert r.headers.get("Content-Type", "").startswith("image/")


def test_media_sign_rejects_non_api_url():
    r = requests.get(f"{API}/media/sign", params={"u": "https://evil.example/x.wav"})
    assert r.status_code == 400


def test_media_sign_passthrough_for_cover(cover_url):
    r = requests.get(f"{API}/media/sign", params={"u": cover_url})
    assert r.status_code == 200
    assert r.json()["url"] == cover_url  # covers remain public
