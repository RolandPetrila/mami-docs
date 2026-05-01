import { TABS, DEFAULT_TAB_ID, isTabId, type TabId } from "../data/tabs";

const STORAGE_KEY = "mami-active-tab";
const SWIPE_PX = 50;
const HEADER_INLINE_MAX = 3;

const tmpl = document.createElement("template");
tmpl.innerHTML = `
<style>
  :host {
    display: flex;
    flex-direction: column;
    height: 100dvh;
    overflow: hidden;
    font-size: var(--font-base, 18px);
    color: var(--color-text, #1a1a2e);
    background: var(--color-bg, #eef4fa);
  }
  .app-header {
    position: sticky;
    top: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0 0.75rem;
    min-height: 56px;
    background: var(--color-primary, #2e5c8a);
    color: #fff;
    flex-shrink: 0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12);
  }
  .menu-btn, .settings-btn {
    background: transparent;
    color: #fff;
    border: none;
    cursor: pointer;
    min-height: 44px;
    min-width: 44px;
    padding: 0;
    font-size: 1.4rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
  }
  .menu-btn:hover, .settings-btn:hover { background: rgba(255, 255, 255, 0.18); }
  .menu-btn:focus-visible, .settings-btn:focus-visible {
    outline: 2px solid #fff;
    outline-offset: 2px;
  }
  .app-title {
    flex: 1;
    font-weight: 600;
    font-size: 1.05rem;
    text-align: left;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .header-tabs {
    display: none;
    gap: 0.25rem;
  }
  @media (min-width: 640px) {
    .header-tabs { display: flex; }
  }
  .header-tab {
    background: transparent;
    color: rgba(255, 255, 255, 0.85);
    border: none;
    padding: 0.5rem 0.85rem;
    font-size: 0.9rem;
    cursor: pointer;
    border-radius: 6px;
    min-height: 44px;
  }
  .header-tab[aria-selected="true"] {
    background: rgba(255, 255, 255, 0.25);
    color: #fff;
    font-weight: 600;
  }
  .header-tab:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }

  .drawer-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    z-index: 200;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease-out;
  }
  .drawer-backdrop.open {
    opacity: 1;
    pointer-events: auto;
  }
  .drawer {
    position: fixed;
    top: 0;
    left: 0;
    width: min(300px, 82vw);
    height: 100dvh;
    background: #fff;
    color: var(--color-text, #1a1a2e);
    z-index: 201;
    transform: translateX(-100%);
    transition: transform 0.25s ease-out;
    display: flex;
    flex-direction: column;
    box-shadow: 2px 0 12px rgba(0, 0, 0, 0.18);
  }
  .drawer.open { transform: translateX(0); }
  .drawer-header {
    padding: 1rem 1.25rem;
    background: var(--color-primary, #2e5c8a);
    color: #fff;
    font-weight: 600;
    font-size: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
  }
  .drawer-close {
    background: transparent;
    color: #fff;
    border: none;
    font-size: 1.4rem;
    cursor: pointer;
    min-height: 44px;
    min-width: 44px;
    border-radius: 6px;
  }
  .drawer-close:hover { background: rgba(255, 255, 255, 0.18); }
  .drawer-list {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem 0;
  }
  .drawer-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    background: transparent;
    border: none;
    text-align: left;
    padding: 0.85rem 1.25rem;
    font-size: 1rem;
    cursor: pointer;
    min-height: 48px;
    color: inherit;
    border-left: 4px solid transparent;
  }
  .drawer-item[aria-selected="true"] {
    background: var(--color-bg, #eef4fa);
    border-left-color: var(--color-primary, #2e5c8a);
    font-weight: 600;
  }
  .drawer-item:hover { background: #f4f6f8; }
  .drawer-item:focus-visible {
    outline: 2px solid var(--color-primary, #2e5c8a);
    outline-offset: -2px;
  }
  .drawer-icon { font-size: 1.2rem; }
  .drawer-empty {
    padding: 2rem 1.25rem;
    color: var(--color-text-muted, #555577);
    text-align: center;
    font-size: 0.9rem;
    line-height: 1.5;
  }

  .tab-content { flex: 1; overflow-y: auto; overflow-x: hidden; display: flex; flex-direction: column; }
  .panel { display: flex; flex-direction: column; flex: 1; padding: 0; min-height: 0; }
  .panel > * { flex: 1; }
</style>

<header class="app-header">
  <button class="menu-btn" type="button" id="menu-btn" aria-label="Deschide meniul" aria-expanded="false">☰</button>
  <span class="app-title" id="app-title">Mami Docs</span>
  <nav class="header-tabs" id="header-tabs" role="tablist" aria-label="Tab-uri preferate"></nav>
  <button class="settings-btn" type="button" id="settings-btn" aria-label="Setări">⚙️</button>
</header>

<div class="drawer-backdrop" id="drawer-backdrop"></div>
<aside class="drawer" id="drawer" aria-hidden="true" aria-label="Meniu tab-uri">
  <div class="drawer-header">
    <span>Tab-uri</span>
    <button class="drawer-close" type="button" id="drawer-close" aria-label="Închide meniul">✕</button>
  </div>
  <div class="drawer-list" id="drawer-list" role="menu"></div>
</aside>

<div class="tab-content" id="tab-content"></div>
`;

export class MamiTabs extends HTMLElement {
  private _active: TabId = DEFAULT_TAB_ID;
  private _drawerOpen = false;
  private _startX = 0;
  private _startY = 0;
  private readonly _sr: ShadowRoot;
  private _ready = false;

  constructor() {
    super();
    this._sr = this.attachShadow({ mode: "open" });
    this._sr.appendChild(tmpl.content.cloneNode(true));
  }

  connectedCallback(): void {
    if (this._ready) return;
    this._ready = true;
    const stored = localStorage.getItem(STORAGE_KEY) ?? "";
    if (isTabId(stored)) this._active = stored;
    this._buildHeaderTabs();
    this._buildDrawerList();
    this._buildPanels();
    this._refresh();
    this._wire();
  }

  private _buildHeaderTabs(): void {
    const nav = this._sr.querySelector("#header-tabs");
    if (!nav) return;
    const inline = TABS.slice(0, HEADER_INLINE_MAX);
    for (const { id, label } of inline) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "header-tab";
      btn.id = `htab-${id}`;
      btn.textContent = label;
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-controls", `panel-${id}`);
      btn.dataset["tab"] = id;
      nav.appendChild(btn);
    }
  }

  private _buildDrawerList(): void {
    const list = this._sr.querySelector("#drawer-list");
    if (!list) return;
    if (TABS.length === 0) {
      const empty = document.createElement("div");
      empty.className = "drawer-empty";
      empty.textContent =
        "Niciun tab încă. Admin adaugă documente noi din Claude Code pe laptop.";
      list.appendChild(empty);
      return;
    }
    for (const { id, label, icon } of TABS) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "drawer-item";
      btn.id = `dtab-${id}`;
      btn.setAttribute("role", "menuitem");
      btn.dataset["tab"] = id;
      if (icon) {
        const span = document.createElement("span");
        span.className = "drawer-icon";
        span.textContent = icon;
        btn.appendChild(span);
      }
      const lbl = document.createElement("span");
      lbl.textContent = label;
      btn.appendChild(lbl);
      list.appendChild(btn);
    }
  }

  private _buildPanels(): void {
    const content = this._sr.querySelector("#tab-content");
    if (!content) return;
    for (const { id, label } of TABS) {
      const div = document.createElement("div");
      div.className = "panel";
      div.id = `panel-${id}`;
      div.setAttribute("role", "tabpanel");
      div.setAttribute("aria-labelledby", `dtab-${id}`);

      if (id === "chat") {
        div.innerHTML = `<mami-chat tab="chat"></mami-chat>`;
      } else if (id === "wellness") {
        div.innerHTML = `<mami-wellness></mami-wellness>`;
      } else if (id === "gallery") {
        div.innerHTML = `<mami-gallery></mami-gallery>`;
      } else {
        div.textContent = `${label} — în pregătire…`;
      }
      content.appendChild(div);
    }
  }

  private _refresh(): void {
    this._sr.querySelectorAll(".panel").forEach((el) => {
      const isActive = el.id === `panel-${this._active}`;
      (el as HTMLElement).hidden = !isActive;
      el.setAttribute("aria-hidden", String(!isActive));
    });
    this._sr.querySelectorAll(".header-tab, .drawer-item").forEach((el) => {
      const tab = (el as HTMLElement).dataset["tab"] ?? "";
      el.setAttribute("aria-selected", String(tab === this._active));
    });
    const title = this._sr.getElementById("app-title");
    const activeTab = TABS.find((t) => t.id === this._active);
    if (title && activeTab)
      title.textContent = `Mami Docs · ${activeTab.label}`;
  }

  private _go(id: TabId): void {
    if (!isTabId(id) || id === this._active) {
      this._closeDrawer();
      return;
    }
    this._active = id;
    localStorage.setItem(STORAGE_KEY, id);
    this._refresh();
    this._closeDrawer();
  }

  private _toggleDrawer(): void {
    this._drawerOpen ? this._closeDrawer() : this._openDrawer();
  }

  private _openDrawer(): void {
    this._drawerOpen = true;
    this._sr.querySelector("#drawer")?.classList.add("open");
    this._sr.querySelector("#drawer-backdrop")?.classList.add("open");
    this._sr.querySelector("#drawer")?.setAttribute("aria-hidden", "false");
    this._sr.querySelector("#menu-btn")?.setAttribute("aria-expanded", "true");
  }

  private _closeDrawer(): void {
    this._drawerOpen = false;
    this._sr.querySelector("#drawer")?.classList.remove("open");
    this._sr.querySelector("#drawer-backdrop")?.classList.remove("open");
    this._sr.querySelector("#drawer")?.setAttribute("aria-hidden", "true");
    this._sr.querySelector("#menu-btn")?.setAttribute("aria-expanded", "false");
  }

  private _wire(): void {
    this._sr.querySelector("#menu-btn")?.addEventListener("click", () => {
      this._toggleDrawer();
    });
    this._sr.querySelector("#drawer-close")?.addEventListener("click", () => {
      this._closeDrawer();
    });
    this._sr
      .querySelector("#drawer-backdrop")
      ?.addEventListener("click", () => {
        this._closeDrawer();
      });
    this._sr.querySelector("#settings-btn")?.addEventListener("click", () => {
      this.dispatchEvent(
        new CustomEvent("mami-open-settings", {
          bubbles: true,
          composed: true,
        }),
      );
    });

    this._sr.querySelector("#header-tabs")?.addEventListener("click", (e) => {
      const btn = (e.target as Element).closest(
        ".header-tab",
      ) as HTMLElement | null;
      const id = btn?.dataset["tab"] ?? "";
      if (id) this._go(id);
    });

    this._sr.querySelector("#drawer-list")?.addEventListener("click", (e) => {
      const btn = (e.target as Element).closest(
        ".drawer-item",
      ) as HTMLElement | null;
      const id = btn?.dataset["tab"] ?? "";
      if (id) this._go(id);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this._drawerOpen) this._closeDrawer();
    });

    const content = this._sr.querySelector(
      "#tab-content",
    ) as HTMLElement | null;
    content?.addEventListener(
      "touchstart",
      (e) => {
        const t = e.touches[0];
        if (t) {
          this._startX = t.clientX;
          this._startY = t.clientY;
        }
      },
      { passive: true },
    );
    content?.addEventListener(
      "touchend",
      (e) => {
        const t = e.changedTouches[0];
        if (!t || TABS.length < 2) return;
        const dx = t.clientX - this._startX;
        const dy = t.clientY - this._startY;
        if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy)) {
          const idx = TABS.findIndex((tab) => tab.id === this._active);
          const next = TABS[dx < 0 ? idx + 1 : idx - 1];
          if (next) this._go(next.id);
        }
      },
      { passive: true },
    );
  }
}

customElements.define("mami-tabs", MamiTabs);
