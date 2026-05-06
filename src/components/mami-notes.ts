// T7.C.1 — Tab "Notițe" — Jurnal simplu
// Note rapide: cumpărături, întrebări pentru doctor, jurnal personal.
// Persistă în localStorage. Categorii cu iconuri. Pinned sus, rest cronologic.

const STORAGE_KEY = "mami:notes";

type NoteCategory = "general" | "doctor" | "shopping" | "journal";

interface NoteEntry {
  id: string;
  ts: string; // ISO
  title: string;
  body: string;
  pinned: boolean;
  category: NoteCategory;
}

const CATEGORY_META: Record<NoteCategory, { label: string; icon: string }> = {
  general: { label: "General", icon: "📝" },
  doctor: { label: "Doctor", icon: "🏥" },
  shopping: { label: "Cumpărături", icon: "🛒" },
  journal: { label: "Jurnal", icon: "📔" },
};

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function readNotes(): NoteEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as NoteEntry[];
  } catch {
    return [];
  }
}

function writeNotes(notes: NoteEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes.slice(-500)));
  } catch (err) {
    console.warn("[notes] write failed:", err);
  }
}

const tmpl = document.createElement("template");
tmpl.innerHTML = `
<style>
  :host {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    background: var(--color-bg, #eef4fa);
    color: var(--color-text, #1a1a2e);
    font-family: inherit;
  }
  .header {
    background: var(--color-primary, #2e5c8a);
    color: #fff;
    padding: 0.75rem 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
  }
  .header h2 { margin: 0; font-size: 1.1rem; flex: 1; }
  .add-btn {
    background: rgba(255,255,255,0.2);
    color: #fff;
    border: 1px solid rgba(255,255,255,0.5);
    border-radius: 6px;
    padding: 0.3rem 0.7rem;
    cursor: pointer;
    min-height: 44px;
    font-size: 0.95rem;
  }
  .add-btn:hover { background: rgba(255,255,255,0.3); }
  .filter-bar {
    display: flex;
    gap: 0.4rem;
    padding: 0.5rem 1rem;
    background: var(--color-surface, #fff);
    border-bottom: 1px solid #e0e7ef;
    flex-wrap: wrap;
    flex-shrink: 0;
  }
  .filter-btn {
    background: transparent;
    border: 1px solid var(--color-primary, #2e5c8a);
    color: var(--color-primary, #2e5c8a);
    padding: 0.5rem 0.9rem;
    border-radius: 999px;
    cursor: pointer;
    font-size: 0.85rem;
    min-height: 44px;
  }
  .filter-btn[aria-pressed="true"] {
    background: var(--color-primary, #2e5c8a);
    color: #fff;
  }
  .search-input {
    flex: 1;
    min-width: 140px;
    padding: 0.5rem 0.8rem;
    border: 1px solid #ccc;
    border-radius: 6px;
    font-size: 0.9rem;
    min-height: 44px;
  }
  .list {
    flex: 1;
    overflow-y: auto;
    padding: 0.75rem 1rem;
  }
  .empty {
    text-align: center;
    color: var(--color-text-muted, #666);
    padding: 2rem;
    font-size: 0.95rem;
  }
  .note-card {
    background: var(--color-surface, #fff);
    border-radius: 8px;
    padding: 0.75rem;
    margin-bottom: 0.6rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    border-left: 4px solid #ccc;
  }
  .note-card.pinned { border-left-color: var(--color-accent, #a05c2a); background: #fffbf5; }
  .note-card.doctor { border-left-color: #c0392b; }
  .note-card.shopping { border-left-color: #27ae60; }
  .note-card.journal { border-left-color: #8e44ad; }
  .note-head {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.3rem;
  }
  .note-icon { font-size: 1.1rem; }
  .note-title {
    flex: 1;
    font-weight: 600;
    font-size: 1rem;
  }
  .note-actions { display: flex; gap: 0.3rem; }
  .icon-btn {
    background: transparent;
    border: 1px solid #e0e7ef;
    border-radius: 6px;
    cursor: pointer;
    min-width: 44px;
    min-height: 44px;
    font-size: 1rem;
    color: var(--color-text-muted, #666);
  }
  .icon-btn:hover { background: var(--color-bg, #eef4fa); }
  .icon-btn:focus-visible {
    outline: 2px solid var(--color-primary, #2e5c8a);
    outline-offset: 2px;
  }
  .icon-btn.pin-active { color: var(--color-accent, #a05c2a); }
  .note-body {
    white-space: pre-wrap;
    font-size: 0.92rem;
    line-height: 1.4;
    color: var(--color-text, #1a1a2e);
  }
  .note-meta {
    font-size: 0.78rem;
    color: var(--color-text-muted, #888);
    margin-top: 0.3rem;
  }
  .editor {
    background: var(--color-surface, #fff);
    border-top: 1px solid #e0e7ef;
    padding: 0.75rem 1rem;
    display: none;
    flex-direction: column;
    gap: 0.5rem;
    flex-shrink: 0;
  }
  .editor.visible { display: flex; }
  .editor input, .editor textarea {
    border: 1.5px solid var(--color-primary, #2e5c8a);
    border-radius: 6px;
    padding: 0.5rem 0.7rem;
    font-size: 1rem;
    font-family: inherit;
    min-height: 44px;
  }
  .editor textarea {
    resize: vertical;
    min-height: 80px;
  }
  .editor-row {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-wrap: wrap;
  }
  .editor-row select {
    padding: 0.4rem 0.6rem;
    min-height: 44px;
    font-size: 0.95rem;
    border: 1.5px solid var(--color-primary, #2e5c8a);
    border-radius: 6px;
  }
  .btn-primary {
    background: var(--color-primary, #2e5c8a);
    color: #fff;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    min-height: 44px;
    font-size: 0.95rem;
  }
  .btn-cancel {
    background: transparent;
    color: var(--color-text-muted, #666);
    border: 1px solid #ccc;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    min-height: 44px;
  }
</style>

<div class="header">
  <h2>📝 Notițe</h2>
  <button class="add-btn" type="button" id="add-btn" aria-label="Adaugă notiță nouă">+ Adaugă</button>
</div>

<div class="filter-bar">
  <button class="filter-btn" type="button" data-cat="" aria-pressed="true">Toate</button>
  <button class="filter-btn" type="button" data-cat="general" aria-pressed="false">📝 General</button>
  <button class="filter-btn" type="button" data-cat="doctor" aria-pressed="false">🏥 Doctor</button>
  <button class="filter-btn" type="button" data-cat="shopping" aria-pressed="false">🛒 Cumpărături</button>
  <button class="filter-btn" type="button" data-cat="journal" aria-pressed="false">📔 Jurnal</button>
  <input class="search-input" type="search" id="search" placeholder="Caută..." aria-label="Caută în notițe">
</div>

<div class="list" id="list"></div>

<div class="editor" id="editor">
  <input type="text" id="ed-title" placeholder="Titlu (opțional)" maxlength="100">
  <textarea id="ed-body" placeholder="Scrie aici..." rows="4"></textarea>
  <div class="editor-row">
    <label for="ed-cat" style="font-size:0.9rem;color:var(--color-text-muted,#666)">Categorie:</label>
    <select id="ed-cat">
      <option value="general">📝 General</option>
      <option value="doctor">🏥 Doctor</option>
      <option value="shopping">🛒 Cumpărături</option>
      <option value="journal">📔 Jurnal</option>
    </select>
    <button type="button" class="btn-cancel" id="ed-cancel">Anulează</button>
    <button type="button" class="btn-primary" id="ed-save">Salvează</button>
  </div>
</div>
`;

export class MamiNotes extends HTMLElement {
  private readonly _sr: ShadowRoot;
  private _filterCat: NoteCategory | "" = "";
  private _searchQ = "";
  private _editingId: string | null = null;

  constructor() {
    super();
    this._sr = this.attachShadow({ mode: "open" });
    this._sr.appendChild(tmpl.content.cloneNode(true));
  }

  connectedCallback(): void {
    this._wire();
    this._render();
  }

  private _wire(): void {
    this._sr
      .querySelector("#add-btn")
      ?.addEventListener("click", () => this._openEditor(null));

    this._sr
      .querySelectorAll<HTMLButtonElement>(".filter-btn")
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          const cat = btn.dataset["cat"] ?? "";
          this._filterCat = cat as NoteCategory | "";
          this._sr
            .querySelectorAll<HTMLButtonElement>(".filter-btn")
            .forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
          this._render();
        });
      });

    const search = this._sr.querySelector("#search") as HTMLInputElement | null;
    search?.addEventListener("input", () => {
      this._searchQ = search.value.trim().toLowerCase();
      this._render();
    });

    this._sr
      .querySelector("#ed-save")
      ?.addEventListener("click", () => this._saveEditor());
    this._sr
      .querySelector("#ed-cancel")
      ?.addEventListener("click", () => this._closeEditor());
  }

  private _openEditor(note: NoteEntry | null): void {
    const editor = this._sr.querySelector("#editor") as HTMLElement | null;
    const title = this._sr.querySelector(
      "#ed-title",
    ) as HTMLInputElement | null;
    const body = this._sr.querySelector(
      "#ed-body",
    ) as HTMLTextAreaElement | null;
    const cat = this._sr.querySelector("#ed-cat") as HTMLSelectElement | null;
    if (!editor || !title || !body || !cat) return;
    this._editingId = note?.id ?? null;
    title.value = note?.title ?? "";
    body.value = note?.body ?? "";
    cat.value = note?.category ?? "general";
    editor.classList.add("visible");
    body.focus();
  }

  private _closeEditor(): void {
    this._editingId = null;
    const editor = this._sr.querySelector("#editor") as HTMLElement | null;
    editor?.classList.remove("visible");
  }

  private _saveEditor(): void {
    const title =
      (
        this._sr.querySelector("#ed-title") as HTMLInputElement | null
      )?.value.trim() ?? "";
    const bodyEl = this._sr.querySelector(
      "#ed-body",
    ) as HTMLTextAreaElement | null;
    const body = bodyEl?.value.trim() ?? "";
    const cat = ((this._sr.querySelector("#ed-cat") as HTMLSelectElement | null)
      ?.value ?? "general") as NoteCategory;
    if (!body && !title) {
      bodyEl?.focus();
      return;
    }
    const notes = readNotes();
    if (this._editingId) {
      const idx = notes.findIndex((n) => n.id === this._editingId);
      if (idx >= 0) {
        const existing = notes[idx];
        if (existing) {
          notes[idx] = {
            ...existing,
            title,
            body,
            category: cat,
            ts: new Date().toISOString(),
          };
        }
      }
    } else {
      notes.push({
        id: uid(),
        ts: new Date().toISOString(),
        title,
        body,
        category: cat,
        pinned: false,
      });
    }
    writeNotes(notes);
    this._closeEditor();
    this._render();
  }

  private _togglePin(id: string): void {
    const notes = readNotes().map((n) =>
      n.id === id ? { ...n, pinned: !n.pinned } : n,
    );
    writeNotes(notes);
    this._render();
  }

  private _delete(id: string): void {
    if (!confirm("Ștergi această notiță?")) return;
    writeNotes(readNotes().filter((n) => n.id !== id));
    this._render();
  }

  private _render(): void {
    const list = this._sr.querySelector("#list") as HTMLElement | null;
    if (!list) return;
    list.replaceChildren();

    let notes = readNotes();
    if (this._filterCat) {
      notes = notes.filter((n) => n.category === this._filterCat);
    }
    if (this._searchQ) {
      notes = notes.filter(
        (n) =>
          n.title.toLowerCase().includes(this._searchQ) ||
          n.body.toLowerCase().includes(this._searchQ),
      );
    }
    notes.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.ts.localeCompare(a.ts);
    });

    if (notes.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent =
        this._searchQ || this._filterCat
          ? "Nicio notiță găsită."
          : 'Nu ai notițe încă. Apasă "+ Adaugă" sus pentru prima.';
      list.appendChild(empty);
      return;
    }

    for (const n of notes) {
      list.appendChild(this._renderCard(n));
    }
  }

  private _renderCard(n: NoteEntry): HTMLElement {
    const card = document.createElement("div");
    card.className = `note-card ${n.category} ${n.pinned ? "pinned" : ""}`;

    const head = document.createElement("div");
    head.className = "note-head";

    const icon = document.createElement("span");
    icon.className = "note-icon";
    icon.textContent = CATEGORY_META[n.category].icon;
    head.appendChild(icon);

    const title = document.createElement("div");
    title.className = "note-title";
    title.textContent = n.title || CATEGORY_META[n.category].label;
    head.appendChild(title);

    const actions = document.createElement("div");
    actions.className = "note-actions";

    const pinBtn = document.createElement("button");
    pinBtn.type = "button";
    pinBtn.className = `icon-btn ${n.pinned ? "pin-active" : ""}`;
    pinBtn.setAttribute(
      "aria-label",
      n.pinned ? "Anulează fixarea" : "Fixează sus",
    );
    pinBtn.textContent = n.pinned ? "📌" : "📍";
    pinBtn.addEventListener("click", () => this._togglePin(n.id));
    actions.appendChild(pinBtn);

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "icon-btn";
    editBtn.setAttribute("aria-label", "Editează notița");
    editBtn.textContent = "✏️";
    editBtn.addEventListener("click", () => this._openEditor(n));
    actions.appendChild(editBtn);

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "icon-btn";
    delBtn.setAttribute("aria-label", "Șterge notița");
    delBtn.textContent = "🗑️";
    delBtn.addEventListener("click", () => this._delete(n.id));
    actions.appendChild(delBtn);

    head.appendChild(actions);
    card.appendChild(head);

    if (n.body) {
      const body = document.createElement("div");
      body.className = "note-body";
      body.textContent = n.body;
      card.appendChild(body);
    }

    const meta = document.createElement("div");
    meta.className = "note-meta";
    meta.textContent = new Date(n.ts).toLocaleString("ro-RO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    card.appendChild(meta);

    return card;
  }
}

customElements.define("mami-notes", MamiNotes);
