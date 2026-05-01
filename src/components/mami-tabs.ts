type TabId = "retete" | "livada" | "sanatate" | "concedii" | "chat";

const TABS: ReadonlyArray<{ readonly id: TabId; readonly label: string }> = [
  { id: "retete", label: "Rețete" },
  { id: "livada", label: "Livadă" },
  { id: "sanatate", label: "Sănătate" },
  { id: "concedii", label: "Concedii" },
  { id: "chat", label: "Chat AI" },
];

const STORAGE_KEY = "mami-active-tab";
const DEFAULT_TAB: TabId = "retete";
const SWIPE_PX = 50;

function isTabId(s: string): s is TabId {
  return TABS.some((t) => t.id === s);
}

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
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1rem;
    min-height: var(--tap-min, 44px);
    background: var(--color-primary, #2e5c8a);
    color: #fff;
    flex-shrink: 0;
  }
  .app-title { font-weight: 600; font-size: 1.05rem; }
  .home-btn {
    background: rgba(255,255,255,0.18);
    color: #fff;
    border: 1px solid rgba(255,255,255,0.5);
    border-radius: 6px;
    padding: 0.3rem 0.9rem;
    min-height: var(--tap-min, 44px);
    min-width: var(--tap-min, 44px);
    cursor: pointer;
    font-size: 0.9rem;
  }
  .home-btn:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }
  .tab-content { flex: 1; overflow-y: auto; overflow-x: hidden; }
  .panel { padding: 1.25rem 1rem; }
  .tab-bar {
    display: flex;
    border-top: 2px solid var(--color-primary, #2e5c8a);
    background: var(--color-surface, #fff);
    flex-shrink: 0;
  }
  .tab-btn {
    flex: 1;
    padding: 0.4rem 0.2rem;
    min-height: var(--tap-min, 44px);
    border: none;
    border-top: 3px solid transparent;
    background: transparent;
    color: var(--color-text-muted, #555577);
    font-size: 0.78rem;
    line-height: 1.25;
    cursor: pointer;
  }
  .tab-btn[aria-selected="true"] {
    color: var(--color-primary, #2e5c8a);
    border-top-color: var(--color-primary, #2e5c8a);
    font-weight: 600;
    background: var(--color-bg, #eef4fa);
  }
  .tab-btn:focus-visible { outline: 3px solid var(--color-primary, #2e5c8a); outline-offset: -3px; }
</style>
<header class="app-header">
  <span class="app-title">Mami Docs</span>
  <button class="home-btn" type="button" aria-label="Mergi la Rețete (Acasă)">Acasă</button>
</header>
<div class="tab-content"></div>
<nav class="tab-bar" role="tablist" aria-label="Secțiuni principale"></nav>
`;

export class MamiTabs extends HTMLElement {
  private _active: TabId = DEFAULT_TAB;
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
    this._buildPanels();
    this._buildTabBar();
    this._refresh();
    this._wire();
  }

  private _buildPanels(): void {
    const content = this._sr.querySelector(".tab-content");
    if (!content) return;
    for (const { id, label } of TABS) {
      const div = document.createElement("div");
      div.className = "panel";
      div.id = `panel-${id}`;
      div.setAttribute("role", "tabpanel");
      div.setAttribute("aria-labelledby", `tab-${id}`);
      div.textContent = `${label} — în pregătire…`;
      content.appendChild(div);
    }
  }

  private _buildTabBar(): void {
    const bar = this._sr.querySelector(".tab-bar");
    if (!bar) return;
    for (const { id, label } of TABS) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tab-btn";
      btn.id = `tab-${id}`;
      btn.textContent = label;
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-controls", `panel-${id}`);
      bar.appendChild(btn);
    }
  }

  private _refresh(): void {
    this._sr.querySelectorAll(".panel").forEach((el) => {
      const isActive = el.id === `panel-${this._active}`;
      (el as HTMLElement).hidden = !isActive;
      el.setAttribute("aria-hidden", String(!isActive));
    });
    this._sr.querySelectorAll(".tab-btn").forEach((el) => {
      const btn = el as HTMLButtonElement;
      btn.setAttribute(
        "aria-selected",
        String(btn.id === `tab-${this._active}`),
      );
    });
  }

  private _go(id: TabId): void {
    if (id === this._active) return;
    this._active = id;
    localStorage.setItem(STORAGE_KEY, id);
    this._refresh();
  }

  private _wire(): void {
    this._sr.querySelector(".home-btn")?.addEventListener("click", () => {
      this._go(DEFAULT_TAB);
    });

    this._sr.querySelector(".tab-bar")?.addEventListener("click", (e) => {
      const btn = (e.target as Element).closest(
        ".tab-btn",
      ) as HTMLButtonElement | null;
      const rawId = btn?.id.replace("tab-", "") ?? "";
      if (isTabId(rawId)) this._go(rawId);
    });

    const content = this._sr.querySelector(
      ".tab-content",
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
        if (!t) return;
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
