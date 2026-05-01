import DOMPurify from "dompurify";
import { convertToHtml } from "mammoth";
import { parse as markdownParse } from "marked";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import * as XLSX from "xlsx";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

type DocType = "docx" | "pdf" | "md" | "xlsx";

function isDocType(s: string): s is DocType {
  return ["docx", "pdf", "md", "xlsx"].includes(s);
}

const tmpl = document.createElement("template");
tmpl.innerHTML = `
<style>
  :host {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    font-size: var(--font-base, 18px);
    color: var(--color-text, #1a1a2e);
    background: var(--color-bg, #eef4fa);
  }
  .hidden { display: none !important; }
  .drop-zone {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 2rem;
    text-align: center;
    border: 2px dashed var(--color-primary, #2e5c8a);
    border-radius: var(--radius, 8px);
    margin: 1rem;
  }
  .drop-label {
    font-size: 1rem;
    color: var(--color-text-muted, #555577);
  }
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
  .toolbar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 1rem;
    background: var(--color-surface, #fff);
    border-bottom: 1px solid #dde3ed;
    flex-shrink: 0;
    min-height: var(--tap-min, 44px);
  }
  .file-name {
    flex: 1;
    font-size: 0.85rem;
    color: var(--color-text-muted, #555577);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .close-btn {
    min-height: var(--tap-min, 44px);
    min-width: var(--tap-min, 44px);
    padding: 0.3rem 0.8rem;
    background: transparent;
    border: 1px solid var(--color-primary, #2e5c8a);
    border-radius: var(--radius, 8px);
    color: var(--color-primary, #2e5c8a);
    font-size: 0.9rem;
    cursor: pointer;
    flex-shrink: 0;
  }
  .close-btn:focus-visible { outline: 3px solid var(--color-primary, #2e5c8a); outline-offset: 2px; }
  .viewer {
    flex: 1;
    overflow-y: auto;
    padding: 1.25rem 1rem;
  }
  .doc-content {
    max-width: 72ch;
    margin: 0 auto;
    line-height: 1.7;
  }
  .doc-content h1 { font-size: 1.4rem; font-weight: 700; margin: 1.2rem 0 0.5rem; }
  .doc-content h2 { font-size: 1.2rem; font-weight: 600; margin: 1rem 0 0.4rem; }
  .doc-content h3 { font-size: 1.05rem; font-weight: 600; margin: 0.8rem 0 0.3rem; }
  .doc-content p { margin: 0 0 0.8rem; }
  .doc-content ul, .doc-content ol { padding-left: 1.5rem; margin: 0 0 0.8rem; }
  .doc-content li { margin-bottom: 0.3rem; }
  .doc-content strong { font-weight: 600; }
  .doc-content table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; font-size: 0.9rem; overflow-x: auto; display: block; }
  .doc-content th, .doc-content td { border: 1px solid #ccc; padding: 0.4rem 0.6rem; text-align: left; }
  .doc-content th { background: var(--color-primary, #2e5c8a); color: #fff; }
  .doc-content a { color: var(--color-primary, #2e5c8a); }
  .xlsx-table { overflow-x: auto; -webkit-overflow-scrolling: touch; margin-bottom: 1rem; }
  .xlsx-table table { min-width: 400px; font-size: 0.85rem; }
  .spinner { text-align: center; padding: 2rem; color: var(--color-text-muted, #555577); }
  .error-msg { color: #c0392b; padding: 1rem; font-size: 0.95rem; }
</style>
<div class="drop-zone" id="drop-zone">
  <span class="drop-label">Trage un document sau apasă butonul</span>
  <label class="upload-label">
    Alege fișier
    <input class="file-input" type="file" id="file-input" />
  </label>
</div>
<div class="toolbar hidden" id="toolbar">
  <span class="file-name" id="file-name"></span>
  <button class="close-btn" type="button" id="close-btn" aria-label="Închide document">✕ Închide</button>
</div>
<div class="viewer hidden" id="viewer">
  <div class="doc-content" id="doc-content"></div>
</div>
`;

export class MamiDocViewer extends HTMLElement {
  private readonly _sr: ShadowRoot;
  private _type: DocType = "docx";
  private _ready = false;

  constructor() {
    super();
    this._sr = this.attachShadow({ mode: "open" });
    this._sr.appendChild(tmpl.content.cloneNode(true));
  }

  static get observedAttributes(): string[] {
    return ["type", "src"];
  }

  attributeChangedCallback(
    name: string,
    _old: string | null,
    val: string | null,
  ): void {
    if (name === "type" && val && isDocType(val)) {
      this._type = val;
      const input = this._sr.querySelector(
        ".file-input",
      ) as HTMLInputElement | null;
      if (input) input.accept = this._accept();
    }
    if (name === "src" && val) {
      void this._loadUrl(val);
    }
  }

  connectedCallback(): void {
    if (this._ready) return;
    this._ready = true;

    const typeAttr = this.getAttribute("type");
    if (typeAttr && isDocType(typeAttr)) this._type = typeAttr;

    const input = this._sr.querySelector(
      ".file-input",
    ) as HTMLInputElement | null;
    if (input) {
      input.accept = this._accept();
      input.addEventListener("change", () => {
        const file = input.files?.[0];
        if (file) void this._loadFile(file);
      });
    }

    const dropZone = this._sr.querySelector("#drop-zone") as HTMLElement | null;
    dropZone?.addEventListener("dragover", (e) => {
      e.preventDefault();
    });
    dropZone?.addEventListener("drop", (e) => {
      e.preventDefault();
      const file = (e as DragEvent).dataTransfer?.files[0];
      if (file) void this._loadFile(file);
    });

    this._sr.querySelector("#close-btn")?.addEventListener("click", () => {
      this._reset();
    });

    const srcAttr = this.getAttribute("src");
    if (srcAttr) void this._loadUrl(srcAttr);
  }

  private _accept(): string {
    const map: Record<DocType, string> = {
      docx: ".docx",
      pdf: ".pdf",
      md: ".md,.markdown",
      xlsx: ".xlsx,.xls",
    };
    return map[this._type];
  }

  private async _loadFile(file: File): Promise<void> {
    this._showLoading(file.name);
    try {
      const buf = await file.arrayBuffer();
      if (this._type === "pdf") {
        await this._renderPdf(buf, file.name);
      } else {
        const html = await this._convert(buf);
        this._showDoc(html, file.name);
      }
    } catch (err) {
      this._showError(
        `Eroare la deschiderea documentului: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  private async _loadUrl(url: string): Promise<void> {
    const filename = url.split("/").pop() || url;
    this._showLoading(filename);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = await res.arrayBuffer();
      if (this._type === "pdf") {
        await this._renderPdf(buf, filename);
      } else {
        const html = await this._convert(buf);
        this._showDoc(html, filename);
      }
    } catch (err) {
      this._showError(
        `Nu s-a putut încărca documentul: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  private async _convert(buf: ArrayBuffer): Promise<string> {
    if (this._type === "docx") {
      const result = await convertToHtml({ arrayBuffer: buf });
      return DOMPurify.sanitize(result.value);
    }
    if (this._type === "md") {
      const text = new TextDecoder("utf-8").decode(new Uint8Array(buf));
      const parsed = markdownParse(text);
      const html = typeof parsed === "string" ? parsed : await parsed;
      return DOMPurify.sanitize(html);
    }
    if (this._type === "xlsx") {
      const wb = XLSX.read(new Uint8Array(buf), { type: "array" });
      const sections: string[] = [];
      for (const sheetName of wb.SheetNames) {
        const sheet = wb.Sheets[sheetName];
        if (!sheet) continue;
        const fullHtml = XLSX.utils.sheet_to_html(sheet);
        const doc = new DOMParser().parseFromString(fullHtml, "text/html");
        const table = doc.querySelector("table");
        const tableHtml = table
          ? DOMPurify.sanitize(table.outerHTML)
          : "<p><em>Foaie goală</em></p>";
        sections.push(
          `<h3>${DOMPurify.sanitize(sheetName)}</h3><div class="xlsx-table">${tableHtml}</div>`,
        );
      }
      return sections.join("\n");
    }
    return "";
  }

  private async _renderPdf(buf: ArrayBuffer, filename: string): Promise<void> {
    const content = this._sr.querySelector(
      "#doc-content",
    ) as HTMLElement | null;
    if (!content) return;

    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buf) })
      .promise;
    const numPages = pdf.numPages;

    // First page: determines aspect ratio for placeholders
    const firstPage = await pdf.getPage(1);
    const baseViewport = firstPage.getViewport({ scale: 1 });
    const aspectRatio = baseViewport.height / baseViewport.width;

    content.innerHTML = "";

    // Render pages 1 on load; rest lazy via IntersectionObserver
    const renderPage = async (wrapper: HTMLElement): Promise<void> => {
      const pageNum = parseInt(wrapper.dataset["page"] ?? "0", 10);
      if (!pageNum || wrapper.dataset["rendered"] === "1") return;
      wrapper.dataset["rendered"] = "1";

      const page = await pdf.getPage(pageNum);
      const containerWidth = content.clientWidth || 600;
      const scale = containerWidth / baseViewport.width;
      const viewport = page.getViewport({ scale });
      const canvas = wrapper.querySelector(
        "canvas",
      ) as HTMLCanvasElement | null;
      if (!canvas) return;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");
      if (ctx) await page.render({ canvasContext: ctx, viewport }).promise;
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);
          void renderPage(entry.target as HTMLElement);
        }
      },
      { rootMargin: "300px" },
    );

    for (let i = 1; i <= numPages; i++) {
      const wrapper = document.createElement("div");
      wrapper.style.cssText = `width:100%;margin-bottom:8px;background:#f8f8f8;aspect-ratio:${1 / aspectRatio}`;
      wrapper.dataset["page"] = String(i);
      const canvas = document.createElement("canvas");
      canvas.style.cssText = "width:100%;display:block;height:auto;";
      wrapper.appendChild(canvas);
      content.appendChild(wrapper);
      observer.observe(wrapper);
    }

    const fname = this._sr.querySelector("#file-name") as HTMLElement | null;
    if (fname) fname.textContent = `${filename} (${numPages} pag.)`;
  }

  private _showLoading(name: string): void {
    this._sr.querySelector("#drop-zone")?.classList.add("hidden");
    this._sr.querySelector("#toolbar")?.classList.remove("hidden");
    this._sr.querySelector("#viewer")?.classList.remove("hidden");
    const fname = this._sr.querySelector("#file-name") as HTMLElement | null;
    if (fname) fname.textContent = name;
    const content = this._sr.querySelector(
      "#doc-content",
    ) as HTMLElement | null;
    if (content)
      content.innerHTML = `<p class="spinner">Se încarcă <strong>${DOMPurify.sanitize(name)}</strong>…</p>`;
  }

  private _showDoc(html: string, name: string): void {
    const content = this._sr.querySelector(
      "#doc-content",
    ) as HTMLElement | null;
    if (content) content.innerHTML = html;
    const fname = this._sr.querySelector("#file-name") as HTMLElement | null;
    if (fname) fname.textContent = name;
  }

  private _showError(msg: string): void {
    const content = this._sr.querySelector(
      "#doc-content",
    ) as HTMLElement | null;
    if (content)
      content.innerHTML = `<p class="error-msg">${DOMPurify.sanitize(msg)}</p>`;
  }

  private _reset(): void {
    this._sr.querySelector("#drop-zone")?.classList.remove("hidden");
    this._sr.querySelector("#toolbar")?.classList.add("hidden");
    this._sr.querySelector("#viewer")?.classList.add("hidden");
    const content = this._sr.querySelector(
      "#doc-content",
    ) as HTMLElement | null;
    if (content) content.innerHTML = "";
    const input = this._sr.querySelector(
      ".file-input",
    ) as HTMLInputElement | null;
    if (input) input.value = "";
  }
}

customElements.define("mami-doc-viewer", MamiDocViewer);
