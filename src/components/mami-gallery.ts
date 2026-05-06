import {
  addPhotoMeta,
  listPhotos,
  purgeDeletedPhotosMeta,
  softDeletePhotoMeta,
  updatePhotoCaption,
  type PhotoEntry,
} from "../data/local-store";
import {
  deleteBlob,
  getBlob,
  putBlob,
  resizeImage,
} from "../data/photo-blob-store";

const tmpl = document.createElement("template");
tmpl.innerHTML = `
<style>
  :host {
    display: flex;
    flex-direction: column;
    padding: 1rem;
    font-family: inherit;
    background: var(--color-bg, #eef4fa);
    color: var(--color-text, #1a1a2e);
    overflow-y: auto;
    height: 100%;
    contain: layout paint;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  h2 { margin: 0; font-size: 1.2rem; color: var(--color-primary, #2e5c8a); }
  .btn {
    min-height: var(--tap-min, 44px);
    padding: 0.5rem 1rem;
    background: var(--color-primary, #2e5c8a);
    color: #fff;
    border: none;
    border-radius: var(--radius, 8px);
    font-size: 1rem;
    cursor: pointer;
  }
  .btn.danger { background: #c0392b; }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 0.75rem;
  }
  .photo-card {
    background: var(--color-surface, #fff);
    border-radius: var(--radius, 8px);
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    aspect-ratio: 1;
    position: relative;
    cursor: pointer;
  }
  .photo-card img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .photo-card .caption {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    background: rgba(0,0,0,0.55);
    color: #fff;
    font-size: 0.75rem;
    padding: 0.25rem 0.4rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .empty {
    text-align: center;
    color: var(--color-text-muted, #888);
    padding: 2rem 1rem;
    font-size: 0.95rem;
  }
  input[type="file"] { display: none; }

  /* Lightbox */
  .lightbox {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.92);
    display: none;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
  .lightbox.open { display: flex; }
  .lightbox img {
    max-width: 100%;
    max-height: 75vh;
    object-fit: contain;
    border-radius: var(--radius, 8px);
  }
  .lightbox .actions { display: flex; gap: 0.5rem; }
  .lightbox button { min-height: 44px; padding: 0.5rem 1rem; border: none; border-radius: var(--radius, 8px); cursor: pointer; }
</style>

<div class="header">
  <h2>🖼️ Galerie Foto</h2>
  <button class="btn" id="btn-upload" type="button">📷 Adaugă Poză</button>
</div>
<input type="file" id="file-input" accept="image/*" capture="environment">
<div class="grid" id="photo-grid"></div>
<p class="empty" id="empty-state">Nicio poză încă. Apasă „Adaugă Poză“ pentru prima ta amintire.</p>

<div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="Vizualizare poză">
  <img id="lightbox-img" alt="">
  <div class="actions">
    <button class="btn" id="btn-close" type="button">Închide</button>
    <button class="btn danger" id="btn-delete" type="button">Șterge poza</button>
  </div>
</div>
`;

export class MamiGallery extends HTMLElement {
  private readonly _sr: ShadowRoot;
  private _activePhotoId: string | null = null;
  private _activeUrl: string | null = null;

  constructor() {
    super();
    this._sr = this.attachShadow({ mode: "open" });
    this._sr.appendChild(tmpl.content.cloneNode(true));
  }

  connectedCallback(): void {
    const input = this._sr.querySelector(
      "#file-input",
    ) as HTMLInputElement | null;

    this._sr
      .querySelector("#btn-upload")
      ?.addEventListener("click", () => input?.click());
    input?.addEventListener("change", () => void this._handleUpload(input));

    this._sr
      .querySelector("#btn-close")
      ?.addEventListener("click", () => this._closeLightbox());
    this._sr
      .querySelector("#btn-delete")
      ?.addEventListener("click", () => void this._deleteActive());
    this._sr.querySelector("#lightbox")?.addEventListener("click", (ev) => {
      if (ev.target === ev.currentTarget) this._closeLightbox();
    });
    document.addEventListener("keydown", this._onKeyDown);

    // Purge blobs pentru fotografii șterse cu mai mult de 30 de zile în urmă
    const expiredIds = purgeDeletedPhotosMeta(30);
    if (expiredIds.length > 0) {
      Promise.all(expiredIds.map((id) => deleteBlob(id))).catch(() => {});
    }

    void this._renderGrid();
  }

  disconnectedCallback(): void {
    document.removeEventListener("keydown", this._onKeyDown);
    this._releaseActiveUrl();
  }

  private _onKeyDown = (ev: KeyboardEvent) => {
    if (ev.key === "Escape" && this._activePhotoId) this._closeLightbox();
  };

  private async _handleUpload(input: HTMLInputElement): Promise<void> {
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Te rog alege o imagine.");
      input.value = "";
      return;
    }
    try {
      const blob = await resizeImage(file);
      const id = `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      await putBlob(id, blob);
      await addPhotoMeta(id, file.name, blob.size);
      input.value = "";
      await this._renderGrid();
    } catch (err) {
      console.error("[gallery] upload failed:", err);
      alert("Nu am putut salva poza. Încearcă din nou.");
    }
  }

  private async _renderGrid(): Promise<void> {
    const grid = this._sr.querySelector("#photo-grid") as HTMLElement | null;
    const empty = this._sr.querySelector("#empty-state") as HTMLElement | null;
    if (!grid || !empty) return;

    const photos = listPhotos().slice().reverse();
    grid.innerHTML = "";
    empty.style.display = photos.length === 0 ? "" : "none";

    for (const p of photos) {
      const card = await this._buildCard(p);
      grid.appendChild(card);
    }
  }

  private async _buildCard(p: PhotoEntry): Promise<HTMLElement> {
    const card = document.createElement("div");
    card.className = "photo-card";

    const blob = await getBlob(p.id);
    if (blob) {
      const url = URL.createObjectURL(blob);
      const img = document.createElement("img");
      img.src = url;
      img.alt = p.caption;
      img.loading = "lazy";
      card.appendChild(img);
      card.addEventListener("click", () => this._openLightbox(p.id, blob));
      // T7.C.3 — Editare caption: dblclick + long-press
      card.addEventListener("dblclick", (e) => {
        e.stopPropagation();
        void this._editCaption(p);
      });
      let pressTimer: ReturnType<typeof setTimeout> | null = null;
      card.addEventListener("touchstart", () => {
        pressTimer = setTimeout(() => {
          void this._editCaption(p);
          pressTimer = null;
        }, 600);
      });
      card.addEventListener("touchend", () => {
        if (pressTimer) {
          clearTimeout(pressTimer);
          pressTimer = null;
        }
      });
      card.addEventListener("touchmove", () => {
        if (pressTimer) {
          clearTimeout(pressTimer);
          pressTimer = null;
        }
      });
      // URL revoke după rendering — păstrăm cât trăiește cardul
      card.addEventListener("DOMNodeRemoved", () => URL.revokeObjectURL(url));
    } else {
      card.textContent = "(lipsă)";
      card.style.color = "#999";
      card.style.display = "flex";
      card.style.alignItems = "center";
      card.style.justifyContent = "center";
    }

    if (p.caption) {
      const cap = document.createElement("div");
      cap.className = "caption";
      cap.textContent = p.caption;
      card.appendChild(cap);
    }
    return card;
  }

  private _openLightbox(id: string, blob: Blob): void {
    this._releaseActiveUrl();
    this._activePhotoId = id;
    this._activeUrl = URL.createObjectURL(blob);
    const img = this._sr.querySelector(
      "#lightbox-img",
    ) as HTMLImageElement | null;
    if (img) img.src = this._activeUrl;
    (this._sr.querySelector("#lightbox") as HTMLElement | null)?.classList.add(
      "open",
    );
  }

  private _closeLightbox(): void {
    (
      this._sr.querySelector("#lightbox") as HTMLElement | null
    )?.classList.remove("open");
    this._activePhotoId = null;
    this._releaseActiveUrl();
  }

  private _releaseActiveUrl(): void {
    if (this._activeUrl) {
      URL.revokeObjectURL(this._activeUrl);
      this._activeUrl = null;
    }
  }

  private async _deleteActive(): Promise<void> {
    if (!this._activePhotoId) return;
    if (!confirm("Sigur ștergi poza? (Va fi păstrată 30 de zile în coș)"))
      return;
    const id = this._activePhotoId;
    softDeletePhotoMeta(id);
    this._closeLightbox();
    await this._renderGrid();
  }

  private async _editCaption(p: PhotoEntry): Promise<void> {
    const next = prompt("Modifică descrierea fotografiei:", p.caption);
    if (next === null) return;
    updatePhotoCaption(p.id, next.trim());
    await this._renderGrid();
  }
}

customElements.define("mami-gallery", MamiGallery);
