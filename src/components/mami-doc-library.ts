// T7.E.2 — Bibliotecă persistentă documente.
// Listă SavedDocument (localStorage) + blob-uri în IndexedDB (doc-blob-store).
// Click pe item → dispatch event "mami-open-saved-doc" → mami-doc-viewer preia.

import {
  saveDocBlob,
  getDocBlob,
  deleteDocBlob,
  listDocIds,
} from "../data/doc-blob-store";

const STORAGE_KEY = "mami:saved-docs";

export type DocCategory = "medical" | "retete" | "acte" | "altele";

export interface SavedDocument {
  id: string;
  name: string;
  type: string; // mime
  savedAt: string; // ISO
  category: DocCategory;
  blobSize: number;
}

const CATEGORY_LABEL: Record<DocCategory, string> = {
  medical: "🏥 Medical",
  retete: "🍲 Rețete",
  acte: "📑 Acte",
  altele: "📁 Altele",
};

function uid(): string {
  return (
    "doc_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  );
}

export function listSavedDocs(): SavedDocument[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedDocument[];
  } catch {
    return [];
  }
}

function writeSavedDocs(docs: SavedDocument[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
  } catch (err) {
    console.warn("[doc-library] write failed:", err);
  }
}

export async function addSavedDoc(
  file: File,
  category: DocCategory,
): Promise<SavedDocument> {
  const id = uid();
  await saveDocBlob(id, file);
  const doc: SavedDocument = {
    id,
    name: file.name,
    type: file.type || "application/octet-stream",
    savedAt: new Date().toISOString(),
    category,
    blobSize: file.size,
  };
  const all = listSavedDocs();
  all.push(doc);
  writeSavedDocs(all);
  return doc;
}

export async function removeSavedDoc(id: string): Promise<void> {
  await deleteDocBlob(id);
  writeSavedDocs(listSavedDocs().filter((d) => d.id !== id));
}

// T9.7 — Cleanup orfani: șterge blob-uri din IDB care nu mai au metadata
export async function cleanupOrphanedDocBlobs(): Promise<number> {
  const ids = await listDocIds();
  const meta = new Set(listSavedDocs().map((d) => d.id));
  let removed = 0;
  for (const id of ids) {
    if (!meta.has(id)) {
      try {
        await deleteDocBlob(id);
        removed++;
      } catch {
        /* ignore */
      }
    }
  }
  return removed;
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
  .filters {
    display: flex;
    gap: 0.4rem;
    padding: 0.5rem 1rem;
    background: var(--color-surface, #fff);
    border-bottom: 1px solid #e0e7ef;
    flex-wrap: wrap;
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
  .list { flex: 1; overflow-y: auto; padding: 0.75rem 1rem; }
  .doc-card {
    background: var(--color-surface, #fff);
    border-radius: 8px;
    padding: 0.7rem 1rem;
    margin-bottom: 0.5rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
  }
  .doc-card:hover { background: var(--color-bg, #eef4fa); }
  .doc-icon { font-size: 1.6rem; }
  .doc-info { flex: 1; min-width: 0; }
  .doc-name {
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .doc-meta {
    font-size: 0.78rem;
    color: var(--color-text-muted, #666);
    margin-top: 0.15rem;
  }
  .icon-btn {
    background: transparent;
    border: 1px solid #e0e7ef;
    border-radius: 6px;
    cursor: pointer;
    min-width: 44px;
    min-height: 44px;
    font-size: 1rem;
  }
  .icon-btn:hover { background: var(--color-bg, #eef4fa); }
  .empty {
    text-align: center;
    color: var(--color-text-muted, #666);
    padding: 2rem 1rem;
    font-size: 0.95rem;
    line-height: 1.6;
  }
  input[type="file"] { display: none; }
</style>

<div class="header">
  <h2>📚 Biblioteca mea</h2>
  <button class="add-btn" type="button" id="add-btn" aria-label="Adaugă document în bibliotecă">+ Adaugă</button>
  <input type="file" id="file-input" accept=".pdf,.docx,.doc,.xlsx,.md,.txt,image/*">
</div>
<div class="filters">
  <button class="filter-btn" type="button" data-cat="" aria-pressed="true">Toate</button>
  <button class="filter-btn" type="button" data-cat="medical" aria-pressed="false">🏥 Medical</button>
  <button class="filter-btn" type="button" data-cat="retete" aria-pressed="false">🍲 Rețete</button>
  <button class="filter-btn" type="button" data-cat="acte" aria-pressed="false">📑 Acte</button>
  <button class="filter-btn" type="button" data-cat="altele" aria-pressed="false">📁 Altele</button>
</div>
<div class="list" id="list"></div>
`;

function detectIcon(type: string): string {
  if (type.includes("pdf")) return "📕";
  if (type.includes("word") || type.includes("officedocument.wordprocess"))
    return "📘";
  if (type.includes("sheet") || type.includes("excel")) return "📗";
  if (type.startsWith("image/")) return "🖼️";
  if (type.includes("text/markdown") || type.includes("text/plain"))
    return "📄";
  return "📁";
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} kB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export class MamiDocLibrary extends HTMLElement {
  private readonly _sr: ShadowRoot;
  private _filterCat: DocCategory | "" = "";

  constructor() {
    super();
    this._sr = this.attachShadow({ mode: "open" });
    this._sr.appendChild(tmpl.content.cloneNode(true));
  }

  connectedCallback(): void {
    this._wire();
    this._render();
    // Cleanup orfani la mount (T9.7)
    void cleanupOrphanedDocBlobs();
  }

  private _wire(): void {
    const fileInput = this._sr.querySelector(
      "#file-input",
    ) as HTMLInputElement | null;
    this._sr.querySelector("#add-btn")?.addEventListener("click", () => {
      fileInput?.click();
    });
    fileInput?.addEventListener("change", () => {
      const f = fileInput.files?.[0];
      if (f) void this._addFile(f);
      fileInput.value = "";
    });
    this._sr
      .querySelectorAll<HTMLButtonElement>(".filter-btn")
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          const cat = btn.dataset["cat"] ?? "";
          this._filterCat = cat as DocCategory | "";
          this._sr
            .querySelectorAll<HTMLButtonElement>(".filter-btn")
            .forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
          this._render();
        });
      });
  }

  private async _addFile(file: File): Promise<void> {
    const cat = this._askCategory();
    if (!cat) return;
    try {
      await addSavedDoc(file, cat);
      this._render();
    } catch (err) {
      alert(
        "Nu am putut salva documentul: " +
          (err instanceof Error ? err.message : String(err)),
      );
    }
  }

  private _askCategory(): DocCategory | null {
    const choice = prompt(
      "Categorie:\n1. medical\n2. retete\n3. acte\n4. altele\n\nIntrodu numărul (1-4):",
      "1",
    );
    if (!choice) return null;
    const map: Record<string, DocCategory> = {
      "1": "medical",
      "2": "retete",
      "3": "acte",
      "4": "altele",
    };
    return map[choice.trim()] ?? "altele";
  }

  private _render(): void {
    const list = this._sr.querySelector("#list") as HTMLElement | null;
    if (!list) return;
    list.replaceChildren();
    let docs = listSavedDocs();
    if (this._filterCat) {
      docs = docs.filter((d) => d.category === this._filterCat);
    }
    docs.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
    if (docs.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = this._filterCat
        ? "Niciun document în această categorie."
        : "Biblioteca e goală. Adaugă un PDF, DOCX, imagine sau text.";
      list.appendChild(empty);
      return;
    }
    for (const d of docs) list.appendChild(this._renderCard(d));
  }

  private _renderCard(d: SavedDocument): HTMLElement {
    const card = document.createElement("div");
    card.className = "doc-card";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Deschide ${d.name}`);

    const icon = document.createElement("span");
    icon.className = "doc-icon";
    icon.textContent = detectIcon(d.type);
    card.appendChild(icon);

    const info = document.createElement("div");
    info.className = "doc-info";
    const name = document.createElement("div");
    name.className = "doc-name";
    name.textContent = d.name;
    info.appendChild(name);
    const meta = document.createElement("div");
    meta.className = "doc-meta";
    meta.textContent = `${CATEGORY_LABEL[d.category]} • ${formatSize(d.blobSize)} • ${new Date(d.savedAt).toLocaleDateString("ro-RO")}`;
    info.appendChild(meta);
    card.appendChild(info);

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "icon-btn";
    delBtn.setAttribute("aria-label", `Șterge ${d.name}`);
    delBtn.textContent = "✕";
    delBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (confirm(`Ștergi „${d.name}" din bibliotecă?`)) {
        void removeSavedDoc(d.id).then(() => this._render());
      }
    });
    card.appendChild(delBtn);

    const open = (): void => void this._openDoc(d);
    card.addEventListener("click", open);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });

    return card;
  }

  private async _openDoc(d: SavedDocument): Promise<void> {
    const blob = await getDocBlob(d.id);
    if (!blob) {
      alert("Documentul nu a putut fi încărcat. Posibil ștergere parțială.");
      return;
    }
    const file = new File([blob], d.name, { type: d.type });
    document.dispatchEvent(
      new CustomEvent("mami-open-saved-doc", {
        detail: { file, doc: d },
        bubbles: true,
      }),
    );
  }
}

customElements.define("mami-doc-library", MamiDocLibrary);
