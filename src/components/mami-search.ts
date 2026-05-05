import {
  type DocEntry,
  searchDocs,
  removeDoc,
  clearIndex,
} from "../data/doc-index";

const TYPE_LABELS: Record<string, string> = {
  docx: "Word",
  pdf: "PDF",
  md: "Markdown",
  xlsx: "Excel",
  image: "Imagine",
  audio: "Audio",
};

const tmpl = document.createElement("template");
tmpl.innerHTML = `
<style>
  :host {
    display: block;
    font-size: var(--font-base, 18px);
    color: var(--color-text, #1a1a2e);
    background: var(--color-bg, #eef4fa);
    padding: 1rem;
  }
  .search-row {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  .search-input {
    flex: 1;
    padding: 0.5rem 0.75rem;
    min-height: var(--tap-min, 44px);
    border: 1.5px solid var(--color-primary, #2e5c8a);
    border-radius: var(--radius, 8px);
    font-size: 1rem;
    background: var(--color-surface, #fff);
    color: var(--color-text, #1a1a2e);
  }
  .search-input:focus { outline: 3px solid var(--color-primary, #2e5c8a); outline-offset: 2px; }
  .clear-btn {
    min-height: var(--tap-min, 44px);
    min-width: var(--tap-min, 44px);
    padding: 0.3rem 0.8rem;
    background: transparent;
    border: 1px solid #aaa;
    border-radius: var(--radius, 8px);
    color: var(--color-text-muted, #555577);
    font-size: 0.85rem;
    cursor: pointer;
    flex-shrink: 0;
  }
  .clear-btn:focus-visible { outline: 3px solid var(--color-primary, #2e5c8a); outline-offset: 2px; }
  .empty-msg {
    text-align: center;
    padding: 2rem 1rem;
    color: var(--color-text-muted, #555577);
    font-size: 0.95rem;
  }
  .results-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem; }
  .result-item {
    background: var(--color-surface, #fff);
    border-radius: var(--radius, 8px);
    padding: 0.75rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    border: 1px solid #e0e7ef;
    cursor: pointer;
    min-height: var(--tap-min, 44px);
  }
  .result-item:focus { outline: 3px solid var(--color-primary, #2e5c8a); outline-offset: 2px; }
  .result-item:hover { border-color: var(--color-primary, #2e5c8a); }
  .result-header { display: flex; align-items: center; gap: 0.5rem; }
  .result-name { font-weight: 600; font-size: 1rem; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .result-type {
    font-size: 0.75rem;
    background: var(--color-primary, #2e5c8a);
    color: #fff;
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
    flex-shrink: 0;
  }
  .result-preview {
    font-size: 0.85rem;
    color: var(--color-text-muted, #555577);
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .result-preview mark {
    background: #fff3a0;
    color: inherit;
    font-weight: 600;
    border-radius: 2px;
  }
  .result-meta { font-size: 0.75rem; color: #666; }
  .delete-btn {
    min-height: 44px;
    min-width: 44px;
    padding: 0.2rem 0.5rem;
    background: transparent;
    border: none;
    color: #777;
    font-size: 0.9rem;
    cursor: pointer;
    border-radius: 4px;
    flex-shrink: 0;
  }
  .delete-btn:hover { color: #c0392b; }
  .delete-btn:focus-visible { outline: 3px solid #c0392b; outline-offset: 2px; }
  .footer { margin-top: 1rem; display: flex; justify-content: flex-end; }
  .clear-index-btn {
    font-size: 0.85rem;
    color: var(--color-text-muted, #555577);
    background: transparent;
    border: 1px solid #ccc;
    border-radius: var(--radius, 8px);
    padding: 0.3rem 0.8rem;
    min-height: var(--tap-min, 44px);
    cursor: pointer;
  }
  .clear-index-btn:focus-visible { outline: 3px solid var(--color-primary, #2e5c8a); outline-offset: 2px; }
  .hidden { display: none !important; }
</style>
<div class="search-row">
  <input class="search-input" type="search" id="search-input" placeholder="Caută în documente…" aria-label="Caută în documente indexate" autocomplete="off" />
  <button class="clear-btn" type="button" id="clear-query-btn" aria-label="Șterge text căutare">✕</button>
</div>
<p class="empty-msg hidden" id="empty-msg">Niciun document indexat încă.</p>
<ul class="results-list" id="results-list" role="list" aria-label="Rezultate căutare"></ul>
<div class="footer">
  <button class="clear-index-btn hidden" type="button" id="clear-index-btn">🗑 Golește tot indexul</button>
</div>
`;

function highlightText(
  container: HTMLElement,
  text: string,
  query: string,
): void {
  container.innerHTML = "";
  if (!query.trim()) {
    container.textContent = text;
    return;
  }
  const q = query.trim().toLowerCase();
  const lower = text.toLowerCase();
  let pos = 0;
  while (pos < text.length) {
    const idx = lower.indexOf(q, pos);
    if (idx === -1) {
      container.appendChild(document.createTextNode(text.slice(pos)));
      break;
    }
    if (idx > pos) {
      container.appendChild(document.createTextNode(text.slice(pos, idx)));
    }
    const mark = document.createElement("mark");
    mark.textContent = text.slice(idx, idx + q.length);
    container.appendChild(mark);
    pos = idx + q.length;
  }
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("ro-RO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export class MamiSearch extends HTMLElement {
  private readonly _sr: ShadowRoot;
  private _ready = false;
  private _debounce: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    super();
    this._sr = this.attachShadow({ mode: "open" });
    this._sr.appendChild(tmpl.content.cloneNode(true));
  }

  connectedCallback(): void {
    if (this._ready) return;
    this._ready = true;

    const searchInput = this._sr.querySelector(
      "#search-input",
    ) as HTMLInputElement | null;
    searchInput?.addEventListener("input", () => {
      if (this._debounce) clearTimeout(this._debounce);
      this._debounce = setTimeout(() => {
        this._render(searchInput.value);
      }, 280);
    });

    this._sr
      .querySelector("#clear-query-btn")
      ?.addEventListener("click", () => {
        if (searchInput) searchInput.value = "";
        this._render("");
        searchInput?.focus();
      });

    this._sr
      .querySelector("#clear-index-btn")
      ?.addEventListener("click", () => {
        if (!confirm("Ștergi tot indexul de documente?")) return;
        clearIndex();
        if (searchInput) searchInput.value = "";
        this._render("");
      });

    this._render("");
  }

  refresh(): void {
    const searchInput = this._sr.querySelector(
      "#search-input",
    ) as HTMLInputElement | null;
    this._render(searchInput?.value ?? "");
  }

  private _render(query: string): void {
    const results = searchDocs(query);
    const list = this._sr.querySelector("#results-list") as HTMLElement | null;
    const emptyMsg = this._sr.querySelector("#empty-msg") as HTMLElement | null;
    const clearIndexBtn = this._sr.querySelector(
      "#clear-index-btn",
    ) as HTMLElement | null;

    if (!list) return;
    list.innerHTML = "";

    if (results.length === 0) {
      emptyMsg?.classList.remove("hidden");
      clearIndexBtn?.classList.add("hidden");
      return;
    }

    emptyMsg?.classList.add("hidden");
    clearIndexBtn?.classList.remove("hidden");

    for (const entry of results) {
      const li = document.createElement("li");
      li.className = "result-item";
      li.setAttribute("tabindex", "0");
      li.setAttribute("role", "listitem");
      li.setAttribute("data-id", entry.id);

      const header = document.createElement("div");
      header.className = "result-header";

      const name = document.createElement("span");
      name.className = "result-name";
      highlightText(name, entry.name, query);

      const typeBadge = document.createElement("span");
      typeBadge.className = "result-type";
      typeBadge.textContent = TYPE_LABELS[entry.type] ?? entry.type;

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "delete-btn";
      delBtn.setAttribute("aria-label", `Elimină ${entry.name} din index`);
      delBtn.textContent = "✕";
      delBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        removeDoc(entry.id);
        this._render(query);
      });

      header.appendChild(name);
      header.appendChild(typeBadge);
      header.appendChild(delBtn);

      const preview = document.createElement("div");
      preview.className = "result-preview";
      highlightText(preview, entry.preview, query);

      const meta = document.createElement("div");
      meta.className = "result-meta";
      meta.textContent = formatDate(entry.added);

      li.appendChild(header);
      li.appendChild(preview);
      li.appendChild(meta);

      li.addEventListener("click", () => {
        this._select(entry);
      });
      li.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this._select(entry);
        }
      });

      list.appendChild(li);
    }
  }

  private _select(entry: DocEntry): void {
    this.dispatchEvent(
      new CustomEvent("mami-search-select", {
        detail: entry,
        bubbles: true,
        composed: true,
      }),
    );
  }
}

customElements.define("mami-search", MamiSearch);
