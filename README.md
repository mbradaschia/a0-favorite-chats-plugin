# ⭐ Favorite Chats

An [Agent Zero](https://github.com/agent0ai/agent-zero) plugin that lets you star/favorite chats to pin them at the top of the sidebar.

## Features

- **Star any chat** — click the star icon on any chat in the sidebar to favorite it
- **Pinned favorites** — favorited chats are sorted to the top of the chat list
- **Visual divider** — a subtle separator line appears between favorites and regular chats
- **Persistent storage** — favorites are saved server-side and survive browser refreshes
- **Clean UI** — the star button matches the existing sidebar button style (edit, delete) and only appears on hover

## How It Works

The plugin injects a star button into each chat entry in the sidebar. Clicking it toggles the chat as a favorite via a backend API. An Alpine.js store patches the chat sorting logic so favorites always appear first, separated by a thin divider.

## Installation

1. Install via the **Agent Zero Plugin Hub**, or clone this repo into your `usr/plugins/` directory:
   ```bash
   cd /path/to/agent-zero/usr/plugins/
   git clone https://github.com/nicolasleao/a0-favorite-chats-plugin.git favorite_chats
   ```
2. Enable the plugin in **Settings → Plugins**
3. Hard-refresh the page (`Ctrl+Shift+R`)

## Plugin Structure

```
favorite_chats/
├── plugin.yaml                          # Plugin manifest
├── __init__.py
├── api/
│   ├── get_favorites.py                 # GET favorites list endpoint
│   └── toggle_favorite.py               # Toggle favorite status endpoint
├── helpers/
│   └── favorites.py                     # Server-side favorites storage
├── extensions/
│   └── webui/
│       └── sidebar-chats-list-start/
│           └── favorite-chats-init.html # CSS + initialization hook
└── webui/
    └── favorites-store.js               # Alpine.js store (sorting, UI)
```

## License

MIT
