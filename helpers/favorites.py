import json
import os
import time
import threading

_PLUGIN_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_DATA_DIR = os.path.join(_PLUGIN_DIR, "data")
_FAVORITES_FILE = os.path.join(_DATA_DIR, "favorites.json")
_lock = threading.Lock()


def _ensure_data_dir():
    os.makedirs(_DATA_DIR, exist_ok=True)


def _read_raw() -> dict[str, float]:
    """Read favorites from disk. Caller must hold _lock."""
    if not os.path.exists(_FAVORITES_FILE):
        return {}
    try:
        with open(_FAVORITES_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, dict) else {}
    except (json.JSONDecodeError, IOError):
        return {}


def _save(favorites: dict[str, float]):
    """Atomically write favorites to disk. Caller must hold _lock."""
    _ensure_data_dir()
    tmp_path = _FAVORITES_FILE + ".tmp"
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(favorites, f, ensure_ascii=False, indent=2)
    os.replace(tmp_path, _FAVORITES_FILE)


def get_favorites() -> dict[str, float]:
    """Return dict of {chat_id: favorited_timestamp}."""
    with _lock:
        return _read_raw()


def toggle_favorite(chat_id: str) -> tuple[bool, float]:
    """Toggle favorite status. Returns (is_now_favorited, timestamp)."""
    with _lock:
        favs = _read_raw()
        if chat_id in favs:
            del favs[chat_id]
            _save(favs)
            return False, 0.0
        else:
            ts = time.time()
            favs[chat_id] = ts
            _save(favs)
            return True, ts


def remove_favorite(chat_id: str):
    """Remove a favorite (e.g. when chat is deleted)."""
    with _lock:
        favs = _read_raw()
        if chat_id in favs:
            del favs[chat_id]
            _save(favs)


def is_favorite(chat_id: str) -> bool:
    """Check if a chat is favorited."""
    return chat_id in get_favorites()
