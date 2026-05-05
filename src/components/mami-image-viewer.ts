import { speak, stopSpeaking } from "../ai/speech";

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_MS = 300;
const ZOOM_IN_SCALE = 2.5;

const tmpl = document.createElement("template");
tmpl.innerHTML = `
<style>
  :host {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    background: #111;
    touch-action: none;
  }
  .toolbar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 1rem;
    background: rgba(0,0,0,0.7);
    flex-shrink: 0;
    min-height: var(--tap-min, 44px);
  }
  .file-name {
    flex: 1;
    font-size: 0.85rem;
    color: #ccc;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .tool-btn {
    min-height: var(--tap-min, 44px);
    min-width: var(--tap-min, 44px);
    padding: 0.3rem 0.8rem;
    background: rgba(255,255,255,0.15);
    border: 1px solid rgba(255,255,255,0.4);
    border-radius: var(--radius, 8px);
    color: #fff;
    font-size: 0.9rem;
    cursor: pointer;
    flex-shrink: 0;
  }
  .tool-btn:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }
  .canvas-area {
    flex: 1;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: grab;
  }
  .canvas-area.dragging { cursor: grabbing; }
  img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    will-change: transform;
    transform-origin: center center;
    user-select: none;
    -webkit-user-drag: none;
  }
  .drop-zone {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 2rem;
    text-align: center;
  }
  .drop-zone.hidden { display: none; }
  .drop-label { font-size: 1rem; color: #aaa; }
  .upload-label {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: var(--tap-min, 44px);
    padding: 0.5rem 1.5rem;
    background: var(--color-primary, #2e5c8a);
    color: #fff;
    border-radius: var(--radius, 8px);
    font-size: 1rem;
    cursor: pointer;
  }
  .upload-label:focus-within { outline: 3px solid var(--color-primary, #2e5c8a); outline-offset: 2px; }
  .file-input { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
  .hidden { display: none !important; }
</style>
<div class="toolbar hidden" id="toolbar">
  <span class="file-name" id="file-name"></span>
  <button class="tool-btn" type="button" id="reset-btn" aria-label="Resetează zoom (1:1)">1:1</button>
  <button class="tool-btn" type="button" id="close-btn" aria-label="Închide imaginea">✕</button>
</div>
<div class="canvas-area" id="canvas-area">
  <div class="drop-zone" id="drop-zone">
    <span class="drop-label">Apasă pentru a deschide o imagine</span>
    <label class="upload-label">
      Alege imagine
      <input class="file-input" type="file" id="file-input" accept=".jpg,.jpeg,.png,.gif,.webp,.svg" />
    </label>
  </div>
  <img id="img" alt="" />
</div>
`;

export class MamiImageViewer extends HTMLElement {
  private readonly _sr: ShadowRoot;
  private _ready = false;
  private _scale = MIN_SCALE;
  private _tx = 0;
  private _ty = 0;
  private _active = new Map<number, { x: number; y: number }>();
  private _startDist = 0;
  private _startScale = MIN_SCALE;
  private _startTx = 0;
  private _startTy = 0;
  private _panStartX = 0;
  private _panStartY = 0;
  private _lastTap = 0;

  constructor() {
    super();
    this._sr = this.attachShadow({ mode: "open" });
    this._sr.appendChild(tmpl.content.cloneNode(true));
  }

  static get observedAttributes(): string[] {
    return ["src"];
  }

  attributeChangedCallback(
    name: string,
    _old: string | null,
    val: string | null,
  ): void {
    if (name === "src" && val) this._loadSrc(val);
  }

  connectedCallback(): void {
    if (this._ready) return;
    this._ready = true;

    const input = this._sr.querySelector(
      ".file-input",
    ) as HTMLInputElement | null;
    input?.addEventListener("change", () => {
      const file = input.files?.[0];
      if (file) this._loadFile(file);
    });

    this._sr.querySelector("#close-btn")?.addEventListener("click", () => {
      this._reset();
    });
    this._sr.querySelector("#reset-btn")?.addEventListener("click", () => {
      this._resetTransform();
    });

    this._sr.querySelector("#ocr-btn")?.addEventListener("click", () => {
      void this._runOcr();
    });

    const dialog = this._sr.querySelector("#ai-dialog") as HTMLDialogElement;
    this._sr
      .querySelector("#ai-dialog-close")
      ?.addEventListener("click", () => {
        dialog.close();
        stopSpeaking();
      });
    this._sr
      .querySelector("#ai-dialog-speak")
      ?.addEventListener("click", () => {
        const text =
          this._sr.querySelector("#ai-dialog-body")?.textContent || "";
        if (text) speak(text);
      });

    const area = this._sr.querySelector("#canvas-area") as HTMLElement | null;
    area?.addEventListener("pointerdown", (e) => {
      this._onDown(e);
    });
    area?.addEventListener("pointermove", (e) => {
      this._onMove(e);
    });
    area?.addEventListener("pointerup", (e) => {
      this._onUp(e);
    });
    area?.addEventListener("pointercancel", (e) => {
      this._onUp(e);
    });

    const srcAttr = this.getAttribute("src");
    if (srcAttr) this._loadSrc(srcAttr);
  }

  private async _runOcr(): Promise<void> {
    const img = this._sr.querySelector("#img") as HTMLImageElement | null;
    if (!img || !img.src) return;

    const dialog = this._sr.querySelector("#ai-dialog") as HTMLDialogElement;
    const bodyEl = this._sr.querySelector("#ai-dialog-body");
    if (!dialog || !bodyEl) return;

    const setStatus = (
      text: string,
      color = "var(--color-text-muted)",
    ): void => {
      const p = document.createElement("p");
      p.style.textAlign = "center";
      p.style.color = color;
      p.textContent = text;
      bodyEl.replaceChildren(p);
    };
    const setOcrResult = (text: string, warning: boolean): void => {
      bodyEl.replaceChildren();
      if (warning) {
        const w = document.createElement("p");
        w.style.color = "#a05c2a";
        w.style.fontWeight = "bold";
        w.textContent =
          "⚠️ Textul citit ar putea fi inexact (calitate scăzută a pozei).";
        bodyEl.appendChild(w);
      }
      const out = document.createElement("p");
      out.style.whiteSpace = "pre-wrap";
      out.textContent = text;
      bodyEl.appendChild(out);
    };

    setStatus("Analizez imaginea... te rog așteaptă.");
    dialog.showModal();

    try {
      const { default: Tesseract } = await import("tesseract.js");
      const result = await Tesseract.recognize(img.src, "ron", {
        logger: (m: any) => {
          if (m.status === "recognizing text") {
            setStatus(`Citesc textul... ${Math.round(m.progress * 100)}%`);
          }
        },
      });

      setOcrResult(result.data.text, result.data.confidence < 60);
    } catch (err) {
      console.warn(
        "[mami-image-viewer] OCR eroare:",
        err instanceof Error ? err.message : String(err),
      );
      const errP = document.createElement("p");
      errP.style.color = "#c0392b";
      errP.textContent = "A apărut o eroare la citirea imaginii.";
      bodyEl.replaceChildren(errP);
    }
  }

  private _loadFile(file: File): void {
    const url = URL.createObjectURL(file);
    const img = this._sr.querySelector("#img") as HTMLImageElement | null;
    if (!img) return;
    img.onload = () => {
      URL.revokeObjectURL(url);
    };
    img.src = url;
    img.alt = file.name;
    this._showImage(file.name);
  }

  private _loadSrc(url: string): void {
    const img = this._sr.querySelector("#img") as HTMLImageElement | null;
    if (!img) return;
    img.src = url;
    img.alt = url.split("/").pop() ?? url;
    this._showImage(img.alt);
  }

  private _showImage(name: string): void {
    this._sr.querySelector("#drop-zone")?.classList.add("hidden");
    this._sr.querySelector("#toolbar")?.classList.remove("hidden");
    const fname = this._sr.querySelector("#file-name") as HTMLElement | null;
    if (fname) fname.textContent = name;
    this._resetTransform();
  }

  private _reset(): void {
    this._sr.querySelector("#drop-zone")?.classList.remove("hidden");
    this._sr.querySelector("#toolbar")?.classList.add("hidden");
    const img = this._sr.querySelector("#img") as HTMLImageElement | null;
    if (img) {
      img.src = "";
      img.alt = "";
    }
    this._resetTransform();
    const input = this._sr.querySelector(
      ".file-input",
    ) as HTMLInputElement | null;
    if (input) input.value = "";
  }

  private _resetTransform(): void {
    this._scale = MIN_SCALE;
    this._tx = 0;
    this._ty = 0;
    this._applyTransform();
  }

  private _applyTransform(): void {
    const img = this._sr.querySelector("#img") as HTMLElement | null;
    if (img)
      img.style.transform = `translate(${this._tx}px, ${this._ty}px) scale(${this._scale})`;
  }

  private _dist(
    a: { x: number; y: number },
    b: { x: number; y: number },
  ): number {
    return Math.hypot(b.x - a.x, b.y - a.y);
  }

  private _onDown(e: PointerEvent): void {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    this._active.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (this._active.size === 2) {
      const [a, b] = [...this._active.values()] as [
        { x: number; y: number },
        { x: number; y: number },
      ];
      this._startDist = this._dist(a, b);
      this._startScale = this._scale;
      this._startTx = this._tx;
      this._startTy = this._ty;
    } else if (this._active.size === 1) {
      this._panStartX = e.clientX;
      this._panStartY = e.clientY;
      this._startTx = this._tx;
      this._startTy = this._ty;

      const now = Date.now();
      if (now - this._lastTap < DOUBLE_TAP_MS) {
        this._scale = this._scale > MIN_SCALE ? MIN_SCALE : ZOOM_IN_SCALE;
        this._tx = 0;
        this._ty = 0;
        this._applyTransform();
      }
      this._lastTap = now;
    }

    const area = this._sr.querySelector("#canvas-area");
    area?.classList.add("dragging");
  }

  private _onMove(e: PointerEvent): void {
    if (!this._active.has(e.pointerId)) return;
    this._active.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (this._active.size === 2) {
      const [a, b] = [...this._active.values()] as [
        { x: number; y: number },
        { x: number; y: number },
      ];
      const dist = this._dist(a, b);
      const rawScale = this._startScale * (dist / this._startDist);
      this._scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, rawScale));
      this._applyTransform();
    } else if (this._active.size === 1 && this._scale > MIN_SCALE) {
      this._tx = this._startTx + (e.clientX - this._panStartX);
      this._ty = this._startTy + (e.clientY - this._panStartY);
      this._applyTransform();
    }
  }

  private _onUp(e: PointerEvent): void {
    this._active.delete(e.pointerId);
    if (this._active.size === 0) {
      const area = this._sr.querySelector("#canvas-area");
      area?.classList.remove("dragging");
      if (this._scale <= MIN_SCALE + 0.05) {
        this._scale = MIN_SCALE;
        this._tx = 0;
        this._ty = 0;
        this._applyTransform();
      }
    }
  }
}

customElements.define("mami-image-viewer", MamiImageViewer);
