import mimetypes
import os
import tempfile
from pathlib import Path, PurePosixPath


STORAGE_ROOT = Path(
    os.environ.get("BIOXIC_STORAGE_DIR", Path(__file__).parent / "uploads")
).resolve()


def _resolve_path(storage_path: str) -> Path:
    if not isinstance(storage_path, str) or not storage_path or "\\" in storage_path:
        raise ValueError("Invalid storage path")

    parts = storage_path.split("/")
    if any(part in ("", ".", "..") for part in parts):
        raise ValueError("Invalid storage path")

    relative = PurePosixPath(storage_path)
    if relative.is_absolute():
        raise ValueError("Invalid storage path")

    target = (STORAGE_ROOT / Path(*relative.parts)).resolve()
    if os.path.commonpath((str(STORAGE_ROOT), str(target))) != str(STORAGE_ROOT):
        raise ValueError("Invalid storage path")
    return target


def put_object(storage_path: str, data: bytes, content_type: str) -> dict:
    target = _resolve_path(storage_path)
    target.parent.mkdir(parents=True, exist_ok=True)
    temp_path = None
    try:
        with tempfile.NamedTemporaryFile(dir=target.parent, delete=False) as temp_file:
            temp_path = Path(temp_file.name)
            temp_file.write(data)
        os.replace(temp_path, target)
    finally:
        if temp_path and temp_path.exists():
            temp_path.unlink()
    return {"path": storage_path, "size": len(data), "content_type": content_type}


def get_object(storage_path: str):
    target = _resolve_path(storage_path)
    content_type = mimetypes.guess_type(target.name)[0] or "application/octet-stream"
    return target.read_bytes(), content_type
