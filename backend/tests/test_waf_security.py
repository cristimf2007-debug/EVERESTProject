"""Teste regresie — WAF-lite BIOXIC (security.py).
Atenție: rulează separat de testele de auth (limita strictă 10 POST/min/IP pe auth).
Loopback (127.0.0.1) nu primește strike-uri/ban — testele de ban nu pot rula local."""
import os
import re
import requests

BASE = os.environ.get("API_BASE", "http://localhost:8001") + "/api"


def test_legit_traffic_ok():
    r = requests.get(f"{BASE}/tracks", timeout=10)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_probe_path_blocked():
    r = requests.get(f"{BASE}/.env", timeout=10)
    assert r.status_code == 403
    r = requests.get(f"{BASE}/wp-admin/setup.php", timeout=10)
    assert r.status_code == 403


def test_scanner_ua_blocked():
    r = requests.get(f"{BASE}/tracks", headers={"User-Agent": "sqlmap/1.7"}, timeout=10)
    assert r.status_code == 403


def test_xss_in_query_blocked():
    r = requests.get(f"{BASE}/tracks", params={"q": "<script>alert(1)</script>"}, timeout=10)
    assert r.status_code == 400


def test_sqli_in_query_blocked():
    r = requests.get(f"{BASE}/tracks", params={"q": "1 union select password from users"}, timeout=10)
    assert r.status_code == 400


def test_traversal_in_query_blocked():
    r = requests.get(f"{BASE}/tracks", params={"q": "../../etc/passwd"}, timeout=10)
    assert r.status_code == 400


def test_oversized_body_rejected():
    r = requests.post(f"{BASE}/contact", data=b"x" * (2 * 1024 * 1024),
                      headers={"Content-Type": "application/json"}, timeout=15)
    assert r.status_code == 413


def test_legit_special_chars_allowed():
    # caractere românești + & + paranteze NU trebuie blocate
    r = requests.get(f"{BASE}/tracks", params={"q": "Gută & Manuel (manele)"}, timeout=10)
    assert r.status_code == 200


def test_security_endpoint_requires_admin():
    r = requests.get(f"{BASE}/admin/panel/security", timeout=10)
    assert r.status_code in (401, 403)


def test_comments_rate_limit():
    # >10 comentarii/min pe același IP → 429 (folosim un video inexistent: 404/422 înainte de limită e ok,
    # ne interesează că la a N-a cerere consecutivă apare 429)
    codes = []
    for i in range(13):
        r = requests.post(f"{BASE}/videos/nonexistent/comments",
                          json={"name": "T", "text": "test"}, timeout=10)
        codes.append(r.status_code)
    assert 429 in codes, f"nicio limitare după 13 comentarii: {codes}"


def test_security_headers_present():
    r = requests.get(f"{BASE}/tracks", timeout=10)
    assert r.headers.get("X-Frame-Options") == "DENY"
    assert r.headers.get("X-Content-Type-Options") == "nosniff"
    assert "max-age=31536000" in r.headers.get("Strict-Transport-Security", "")
    assert r.headers.get("X-Robots-Tag") == "noindex, nofollow"
    assert "default-src 'self'" in r.headers.get("Content-Security-Policy", "")
    # antetul Server nu expune versiuni (uvicorn își adaugă numele la nivel de protocol)
    assert not re.search(r"\d+\.\d+", r.headers.get("Server", ""))
