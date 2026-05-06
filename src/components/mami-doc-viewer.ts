import DOMPurify from "dompurify";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { sendChat } from "../ai/client";
import { speak, stopSpeaking } from "../ai/speech";
import {
  addBookmark,
  addHighlight,
  listBookmarks,
  listHighlights,
} from "../data/local-store";

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
    position: relative;
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
  .drop-label { font-size: 1rem; color: var(--color-text-muted, #555577); }
  .upload-label {
    display: inline-flex; align-items: center; justify-content: center;
    min-height: var(--tap-min, 44px); padding: 0.5rem 1.5rem;
    background: var(--color-primary, #2e5c8a); color: #fff;
    border-radius: var(--radius, 8px); font-size: 1rem; cursor: pointer;
  }
  .upload-label:focus-within { outline: 3px solid var(--color-primary, #2e5c8a); outline-offset: 2px; }
  .file-input { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
  
  .toolbar {
    display: flex; align-items: center; gap: 0.5rem;
    padding: 0.4rem 1rem; background: var(--color-surface, #fff);
    border-bottom: 1px solid #dde3ed; flex-shrink: 0;
    min-height: var(--tap-min, 44px); flex-wrap: wrap;
  }
  .file-name {
    flex: 1; font-size: 0.85rem; color: var(--color-text-muted, #555577);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    min-width: 100px;
  }
  .action-btn {
    min-height: var(--tap-min, 44px); padding: 0.3rem 0.8rem;
    background: transparent; border: 1px solid var(--color-primary, #2e5c8a);
    border-radius: var(--radius, 8px); color: var(--color-primary, #2e5c8a);
    font-size: 0.9rem; cursor: pointer; flex-shrink: 0; font-weight: 500;
  }
  .action-btn.primary { background: var(--color-accent, #a05c2a); color: #fff; border: none; }
  .action-btn.bookmark-active { background: #ffe066; color: #333; border-color: #e6c200; }
  .action-btn:focus-visible { outline: 3px solid var(--color-primary, #2e5c8a); outline-offset: 2px; }
  .highlight { background: #ffe066; border-radius: 2px; cursor: pointer; }
  .highlight:hover { background: #ffd000; }
  
  .viewer { flex: 1; overflow-y: auto; padding: 1.25rem 1rem; position: relative; }
  .doc-content { max-width: 72ch; margin: 0 auto; line-height: 1.7; position: relative; }
  
  /* Document formatting */
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

  /* AI Popover */
  #ai-popover {
    position: fixed; background: #222; color: #fff; border-radius: 8px;
    padding: 0.25rem; display: flex; gap: 0.25rem; z-index: 1000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3); transform: translateX(-50%);
    pointer-events: auto;
  }
  #ai-popover button {
    background: transparent; color: #fff; border: none; padding: 0.5rem 0.75rem;
    border-radius: 4px; cursor: pointer; font-size: 0.9rem; min-height: 44px;
  }
  #ai-popover button:hover { background: rgba(255,255,255,0.2); }

  /* AI Dialog */
  #ai-dialog {
    border: none; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.25);
    padding: 0; width: min(90vw, 600px); max-height: 85vh;
    display: flex; flex-direction: column; background: var(--color-surface, #fff);
    color: var(--color-text, #1a1a2e);
  }
  #ai-dialog::backdrop { background: rgba(0,0,0,0.55); }
  .dialog-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 1rem 1.25rem; background: var(--color-primary, #2e5c8a); color: #fff;
  }
  .dialog-header h3 { margin: 0; font-size: 1.15rem; font-weight: 600; }
  .dialog-header button {
    background: transparent; color: #fff; border: none; font-size: 1.4rem;
    cursor: pointer; min-height: 44px; min-width: 44px; border-radius: 6px;
  }
  .dialog-body { padding: 1.25rem; overflow-y: auto; line-height: 1.6; flex: 1; }
  .dialog-footer {
    padding: 1rem 1.25rem; border-top: 1px solid #dde3ed; display: flex; justify-content: flex-end; gap: 0.5rem;
  }
</style>
<div class="drop-zone" id="drop-zone">
  <span class="drop-label">Trage un document sau apasă butonul</span>
  <label class="upload-label">
    Alege fișier
    <input class="file-input" type="file" id="file-input" />
  </label>
</div>
<div class="toolbar hidden" id="toolbar">
  <button class="action-btn primary" type="button" id="summary-btn" aria-label="Rezumat inteligent">✨ Rezumat</button>
  <button class="action-btn" type="button" id="read-doc-btn" aria-label="Citește tot documentul">🔊 Citește</button>
  <button class="action-btn" type="button" id="bookmark-btn" aria-label="Salvează bookmark">🔖 Bookmark</button>
  <span class="file-name" id="file-name"></span>
  <button class="action-btn" type="button" id="close-btn" aria-label="Închide document">✕ Închide</button>
</div>
<div class="viewer hidden" id="viewer">
  <div class="doc-content" id="doc-content"></div>
</div>

<!-- Text Selection Floating AI Popover -->
<div id="ai-popover" class="hidden">
  <button type="button" data-action="explica">🔍 Explică</button>
  <button type="button" data-action="traduce">🌍 Traduce</button>
  <button type="button" data-action="defineste">📖 Definește</button>
  <button type="button" data-action="citeste">🔊 Citește</button>
  <button type="button" data-action="highlight">🖊️ Highlight</button>
</div>

<!-- AI Results Dialog -->
<dialog id="ai-dialog">
  <div class="dialog-header">
    <h3 id="ai-dialog-title">Mami AI</h3>
    <button type="button" id="ai-dialog-close" aria-label="Închide răspunsul">✕</button>
  </div>
  <div class="dialog-body" id="ai-dialog-body"></div>
  <div class="dialog-footer">
    <button class="action-btn primary" type="button" id="ai-dialog-speak">🔊 Ascultă</button>
  </div>
</dialog>
`;

export class MamiDocViewer extends HTMLElement {
  private readonly _sr: ShadowRoot;
  private _type: DocType = "docx";
  private _ready = false;
  private _selectedText = "";
  private _reading = false;
  private _docId = "";
  private _docFileName = "";

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
    dropZone?.addEventListener("dragover", (e) => e.preventDefault());
    dropZone?.addEventListener("drop", (e) => {
      e.preventDefault();
      const file = (e as DragEvent).dataTransfer?.files[0];
      if (file) void this._loadFile(file);
    });

    this._sr
      .querySelector("#close-btn")
      ?.addEventListener("click", () => this._reset());

    // Main toolbar AI buttons
    this._sr.querySelector("#summary-btn")?.addEventListener("click", () => {
      const text = this._getDocText();
      if (!text) return;
      void this._sendToAI("rezumat", text);
    });

    this._sr.querySelector("#read-doc-btn")?.addEventListener("click", () => {
      const text = this._getDocText();
      if (!text) return;
      if (this._reading) {
        stopSpeaking();
        this._reading = false;
        const btn = this._sr.querySelector("#read-doc-btn");
        if (btn) btn.textContent = "🔊 Citește";
      } else {
        this._reading = true;
        const btn = this._sr.querySelector("#read-doc-btn");
        if (btn) btn.textContent = "⏹ Oprește";
        speak(text, () => {
          this._reading = false;
          if (btn) btn.textContent = "🔊 Citește";
        });
      }
    });

    this._sr
      .querySelector("#bookmark-btn")
      ?.addEventListener("click", () => void this._saveBookmark());

    // AI selection popover setup
    const viewer = this._sr.querySelector("#viewer");
    const popover = this._sr.querySelector("#ai-popover") as HTMLElement;

    const hidePopover = () => {
      popover.classList.add("hidden");
      this._selectedText = "";
    };

    viewer?.addEventListener("pointerup", () => {
      setTimeout(() => {
        const sel = (this._sr as any).getSelection?.() || window.getSelection();
        const text = sel?.toString().trim() || "";
        this._selectedText = text;

        if (text && sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          // Position relative to viewport since popover is fixed
          popover.style.left = `${rect.left + rect.width / 2}px`;
          popover.style.top = `${Math.max(10, rect.top - 50)}px`;
          popover.classList.remove("hidden");
        } else {
          hidePopover();
        }
      }, 10);
    });

    // Hide popover on scroll or click elsewhere
    viewer?.addEventListener("scroll", hidePopover, { passive: true });
    this._sr.addEventListener("pointerdown", (e) => {
      if (!(e.target as HTMLElement).closest("#ai-popover")) {
        hidePopover();
      }
    });

    // Popover AI actions
    popover.addEventListener("click", (e) => {
      const btn = (e.target as HTMLElement).closest("button");
      if (!btn) return;
      const action = btn.dataset["action"];
      if (!action || !this._selectedText) return;

      if (action === "citeste") {
        stopSpeaking();
        speak(this._selectedText);
      } else if (action === "highlight") {
        void this._highlightSelection(this._selectedText);
      } else {
        void this._sendToAI(action, this._selectedText);
      }
      hidePopover();
    });

    // AI Dialog setup
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

    const srcAttr = this.getAttribute("src");
    if (srcAttr) void this._loadUrl(srcAttr);
  }

  private _getDocText(): string {
    const content = this._sr.querySelector("#doc-content") as HTMLElement;
    return content?.innerText || "";
  }

  private async _sendToAI(action: string, text: string): Promise<void> {
    const dialog = this._sr.querySelector("#ai-dialog") as HTMLDialogElement;
    const titleEl = this._sr.querySelector("#ai-dialog-title");
    const bodyEl = this._sr.querySelector("#ai-dialog-body");

    if (!dialog || !titleEl || !bodyEl) return;

    let prompt = "";
    if (action === "rezumat") {
      titleEl.textContent = "✨ Rezumat 3 Puncte";
      prompt = `Sumarizează următorul document în exact 3 puncte esențiale, clare și ușor de înțeles:\n\n${text.substring(0, 5000)}`;
    } else if (action === "explica") {
      titleEl.textContent = "🔍 Explică mai simplu";
      prompt = `Explică următorul text într-un limbaj simplu, clar, fără termeni tehnici sau cuvinte rare. Dacă o parte din text e ambiguă sau pe care nu o poți explica sigur, spune-o explicit.\n\n${text.substring(0, 1500)}`;
    } else if (action === "traduce") {
      titleEl.textContent = "🌍 Traducere în Română";
      prompt = `Traduce următorul text în limba română (păstrează sensul și fii exact):\n\n${text.substring(0, 1500)}`;
    } else if (action === "defineste") {
      titleEl.textContent = "📖 Definire Termen";
      prompt = `Explică pe scurt (în 1-2 propoziții) ce înseamnă următorul cuvânt sau expresie, într-un mod foarte simplu de înțeles:\n\n"${text.substring(0, 200)}"`;
    }

    // System prompt default, as we don't have tab context here specifically,
    // but the AI is friendly to "mami".
    const systemPrompt = `Ești asistentul personal inteligent al mamei (~60 ani din România).
Răspunzi EXCLUSIV în română, concis, blând și pe înțelesul ei.
Nu folosi termeni complicați. Fii de ajutor și la obiect.
Dacă te întreabă ceva legat de sănătate sau tratament medical, include obligatoriu la final: "⚠️ Aceasta este o informație generală, nu o consultație medicală. Consultă medicul tău pentru diagnostic și tratament."`;

    bodyEl.innerHTML = `<p class="spinner">Se gândește...</p>`;
    dialog.showModal();

    try {
      const response = await sendChat(
        [{ role: "user", content: prompt }],
        systemPrompt,
      );
      const { parse: mdParse } = await import("marked");
      bodyEl.innerHTML = DOMPurify.sanitize(mdParse(response) as string);
    } catch (err) {
      const errP = document.createElement("p");
      errP.className = "error-msg";
      errP.textContent = `A apărut o eroare: ${err instanceof Error ? err.message : String(err)}`;
      bodyEl.replaceChildren(errP);
    }
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
    this._docId = `file:${file.name}`;
    this._docFileName = file.name;
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
    this._docId = `url:${url}`;
    this._docFileName = filename;
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
      const { convertToHtml } = await import("mammoth");
      const result = await convertToHtml({ arrayBuffer: buf });
      return DOMPurify.sanitize(result.value);
    }
    if (this._type === "md") {
      const text = new TextDecoder("utf-8").decode(new Uint8Array(buf));
      const { parse: markdownParse } = await import("marked");
      const parsed = markdownParse(text);
      const html = typeof parsed === "string" ? parsed : await parsed;
      return DOMPurify.sanitize(html);
    }
    if (this._type === "xlsx") {
      const XLSX = await import("@e965/xlsx");
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

    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buf) })
      .promise;
    const numPages = pdf.numPages;

    const firstPage = await pdf.getPage(1);
    const baseViewport = firstPage.getViewport({ scale: 1 });
    const aspectRatio = baseViewport.height / baseViewport.width;

    content.innerHTML = "";

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
      // pdfjs 5: RenderParameters cere acum și `canvas` pe lângă `canvasContext`.
      if (ctx)
        await page.render({ canvas, canvasContext: ctx, viewport }).promise;
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
    this._applyHighlights();
    this._updateBookmarkBtn();
  }

  private _showError(msg: string): void {
    const content = this._sr.querySelector(
      "#doc-content",
    ) as HTMLElement | null;
    if (content)
      content.innerHTML = `<p class="error-msg">${DOMPurify.sanitize(msg)}</p>`;
  }

  private async _saveBookmark(): Promise<void> {
    if (!this._docId) return;
    const viewer = this._sr.querySelector("#viewer") as HTMLElement | null;
    const scrollPct = viewer
      ? viewer.scrollTop /
        Math.max(1, viewer.scrollHeight - viewer.clientHeight)
      : 0;
    await addBookmark(this._docId, this._docFileName, scrollPct);
    const btn = this._sr.querySelector("#bookmark-btn");
    if (btn) {
      btn.classList.add("bookmark-active");
      const orig = btn.textContent;
      btn.textContent = "🔖 Salvat!";
      setTimeout(() => {
        if (btn) btn.textContent = orig;
      }, 1500);
    }
  }

  private async _highlightSelection(text: string): Promise<void> {
    if (!this._docId || !text) return;
    await addHighlight(this._docId, this._docFileName, text);
    this._applyHighlights();
  }

  private _applyHighlights(): void {
    if (!this._docId) return;
    const highlights = listHighlights(this._docId);
    if (!highlights.length) return;
    const content = this._sr.querySelector(
      "#doc-content",
    ) as HTMLElement | null;
    if (!content) return;
    for (const h of highlights) {
      this._wrapText(content, h.text, h.color);
    }
  }

  private _wrapText(
    root: HTMLElement,
    searchText: string,
    color: string,
  ): void {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    let node: Node | null;
    while ((node = walker.nextNode())) {
      if ((node as Text).textContent?.includes(searchText)) {
        nodes.push(node as Text);
      }
    }
    for (const textNode of nodes) {
      const idx = textNode.textContent?.indexOf(searchText) ?? -1;
      if (idx === -1) continue;
      const parent = textNode.parentNode;
      if (!parent || (parent as HTMLElement).closest?.("mark")) continue;
      const before = document.createTextNode(
        textNode.textContent?.slice(0, idx) ?? "",
      );
      const mark = document.createElement("mark");
      mark.className = "highlight";
      mark.style.background = color;
      mark.textContent = searchText;
      const after = document.createTextNode(
        textNode.textContent?.slice(idx + searchText.length) ?? "",
      );
      parent.replaceChild(after, textNode);
      parent.insertBefore(mark, after);
      parent.insertBefore(before, mark);
      break;
    }
  }

  private _updateBookmarkBtn(): void {
    if (!this._docId) return;
    const bookmarks = listBookmarks();
    const has = bookmarks.some((b) => b.docId === this._docId);
    const btn = this._sr.querySelector("#bookmark-btn");
    if (btn) btn.classList.toggle("bookmark-active", has);
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
    this._selectedText = "";
    this._docId = "";
    this._docFileName = "";
    if (this._reading) {
      stopSpeaking();
      this._reading = false;
      const btn = this._sr.querySelector("#read-doc-btn");
      if (btn) btn.textContent = "🔊 Citește";
    }
  }
}

customElements.define("mami-doc-viewer", MamiDocViewer);
