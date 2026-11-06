import ipaddress

from backend import security


def test_forwarded_ip_is_ignored_for_untrusted_peer(monkeypatch):
    monkeypatch.setattr(security, "_TRUSTED_PROXIES", [])

    assert security.client_ip_from_headers(
        {"x-forwarded-for": "198.51.100.24"},
        "203.0.113.9",
    ) == "203.0.113.9"


def test_trusted_proxy_can_forward_client_ip(monkeypatch):
    monkeypatch.setattr(
        security,
        "_TRUSTED_PROXIES",
        [ipaddress.ip_network("203.0.113.0/24")],
    )

    assert security.client_ip_from_headers(
        {"x-forwarded-for": "198.51.100.24"},
        "203.0.113.9",
    ) == "198.51.100.24"


def test_forwarded_chain_skips_trusted_proxies_from_the_right(monkeypatch):
    monkeypatch.setattr(
        security,
        "_TRUSTED_PROXIES",
        [
            ipaddress.ip_network("203.0.113.0/24"),
            ipaddress.ip_network("198.51.100.0/24"),
        ],
    )

    assert security.client_ip_from_headers(
        {"x-forwarded-for": "192.0.2.7, 198.51.100.4"},
        "203.0.113.9",
    ) == "192.0.2.7"
