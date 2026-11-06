import pytest

import local_storage


def test_local_storage_round_trip(tmp_path, monkeypatch):
    monkeypatch.setattr(local_storage, "STORAGE_ROOT", tmp_path)

    result = local_storage.put_object("bioxic/uploads/audio/track.mp3", b"audio", "audio/mpeg")

    assert result["path"] == "bioxic/uploads/audio/track.mp3"
    assert result["size"] == 5
    assert local_storage.get_object(result["path"]) == (b"audio", "audio/mpeg")


@pytest.mark.parametrize(
    "storage_path",
    ["../outside.txt", "bioxic/../outside.txt", "/outside.txt", r"bioxic\\outside.txt"],
)
def test_local_storage_rejects_paths_outside_root(tmp_path, monkeypatch, storage_path):
    monkeypatch.setattr(local_storage, "STORAGE_ROOT", tmp_path)

    with pytest.raises(ValueError, match="Invalid storage path"):
        local_storage.put_object(storage_path, b"data", "text/plain")

    assert list(tmp_path.iterdir()) == []
