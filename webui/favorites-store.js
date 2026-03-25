import { createStore } from "/js/AlpineStore.js";
import { callJsonApi } from "/js/api.js";

const model = {
  /** @type {Object<string, number>} chat_id -> favorited_timestamp */
  favorites: {},
  _observer: null,
  _patched: false,
  _initialized: false,
  _injecting: false,
  _debounceTimer: null,

  async init() {
    if (this._initialized) return;
    this._initialized = true;
    await this.fetchFavorites();
    this._patchApplyContexts();
    this._startObserver();
  },

  // ── Data fetching ──────────────────────────────────────────────

  async fetchFavorites() {
    try {
      const res = await callJsonApi(
        "/plugins/favorite_chats/get_favorites",
        {}
      );
      if (res?.ok) {
        this.favorites = res.favorites || {};
      }
    } catch (e) {
      console.error("[favorite_chats] Failed to fetch favorites:", e);
    }
  },

  async toggleFavorite(chatId) {
    try {
      const res = await callJsonApi(
        "/plugins/favorite_chats/toggle_favorite",
        { chat_id: chatId }
      );
      if (res?.ok) {
        const updated = { ...this.favorites };
        if (res.favorited) {
          updated[chatId] = res.timestamp;
        } else {
          delete updated[chatId];
        }
        this.favorites = updated;
        this._resortContexts();
        this._scheduleInject();
      }
    } catch (e) {
      console.error("[favorite_chats] Failed to toggle favorite:", e);
    }
  },

  isFavorite(chatId) {
    return Object.prototype.hasOwnProperty.call(this.favorites, chatId);
  },

  // ── Sort override ──────────────────────────────────────────────

  _patchApplyContexts() {
    if (this._patched) return;
    const chatsStore = Alpine.store("chats");
    if (!chatsStore) return;

    const original = chatsStore.applyContexts.bind(chatsStore);
    const self = this;

    chatsStore.applyContexts = function (contextsList) {
      original(contextsList);
      self._resortContexts();
      self._scheduleInject();
    };

    this._patched = true;
  },

  _resortContexts() {
    const chatsStore = Alpine.store("chats");
    if (!chatsStore) return;

    const favs = this.favorites;
    chatsStore.contexts = [...chatsStore.contexts].sort((a, b) => {
      const aFav = favs[a.id];
      const bFav = favs[b.id];

      if (aFav && bFav) return aFav - bFav;
      if (aFav) return -1;
      if (bFav) return 1;
      return (b.created_at || 0) - (a.created_at || 0);
    });
  },

  // ── DOM injection ──────────────────────────────────────────────

  _startObserver() {
    const list = document.querySelector(".chats-config-list");
    if (!list) {
      setTimeout(() => this._startObserver(), 500);
      return;
    }

    this._observer = new MutationObserver(() => this._scheduleInject());
    this._observer.observe(list, { childList: true, subtree: true });

    // Initial injection
    this._scheduleInject();
  },

  _scheduleInject() {
    if (this._debounceTimer) clearTimeout(this._debounceTimer);
    this._debounceTimer = setTimeout(() => {
      requestAnimationFrame(() => this._injectButtons());
    }, 50);
  },

  _injectButtons() {
    if (this._injecting) return;
    this._injecting = true;

    try {
      const containers = document.querySelectorAll(
        ".chats-config-list .chat-container"
      );

      containers.forEach((container) => {
        // Get chat ID from the closest <li>
        const li = container.closest("li");
        if (!li) return;

        // Extract chat ID from Alpine x-for context
        const chatId = li.__x_for_context?.id
          || li._x_dataStack?.[0]?.context?.id
          || container.dataset.chatId;
        if (!chatId) return;

        // Skip if star already injected
        if (container.querySelector(".fav-star-btn")) return;

        // Find the last action button to insert after it (star should be rightmost)
        const lastBtn = container.querySelector(
          'button[title="Close chat"], .close-btn, button:last-of-type'
        );

        // Create star button — use same classes as close button for consistent styling
        const starBtn = document.createElement("button");
        starBtn.className = "btn-icon-action chat-list-action-btn fav-star-btn";
        starBtn.title = "Toggle favorite";
        starBtn.dataset.chatId = chatId;

        const isFav = this.isFavorite(chatId);
        if (isFav) starBtn.classList.add("active");

        const icon = document.createElement("span");
        icon.className = "material-symbols-outlined";
        icon.textContent = isFav ? "star" : "star_outline";
        starBtn.appendChild(icon);

        starBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          e.preventDefault();
          this.toggleFavorite(chatId);
        });

        // Insert after the last button (rightmost position)
        if (lastBtn) {
          lastBtn.after(starBtn);
        } else {
          container.appendChild(starBtn);
        }
      });

      // Update existing star buttons (in case favorites changed)
      document.querySelectorAll(".fav-star-btn").forEach((btn) => {
        const chatId = btn.dataset.chatId;
        if (!chatId) return;
        const isFav = this.isFavorite(chatId);
        const icon = btn.querySelector(".material-symbols-outlined");
        if (icon) {
          icon.textContent = isFav ? "star" : "star_outline";
        }
        btn.classList.toggle("active", isFav);
      });

      // Inject divider between favorites and non-favorites
      this._injectDivider();
    } finally {
      this._injecting = false;
    }
  },

  _injectDivider() {
    const list = document.querySelector(".chats-config-list");
    if (!list) return;

    // Remove existing dividers
    list.querySelectorAll(".fav-divider").forEach((el) => el.remove());

    const lis = Array.from(list.querySelectorAll(":scope > li"));
    if (lis.length === 0) return;

    // Find the boundary between favorites and non-favorites
    let lastFavIndex = -1;
    lis.forEach((li, i) => {
      const btn = li.querySelector(".fav-star-btn.active");
      if (btn) lastFavIndex = i;
    });

    // Only show divider if there are both favorites and non-favorites
    if (lastFavIndex >= 0 && lastFavIndex < lis.length - 1) {
      const divider = document.createElement("li");
      divider.className = "fav-divider";
      lis[lastFavIndex].after(divider);
    }
  },
};

export const store = createStore("favChats", model);
