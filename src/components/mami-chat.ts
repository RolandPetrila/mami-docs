import { sendChat, AiGatewayError, type ChatMessage } from "../ai/client";
import { getSystemPrompt } from "../ai/system-prompts";
import {
  isSttSupported,
  startStt,
  speak,
  stopSpeaking,
  loadVoices,
} from "../ai/speech";

interface Message {
  id: string;
  role: "user" | "ai";
  text: string;
  time: string;
}

function msgId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("ro-RO", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

const tmpl = document.createElement("template");
tmpl.innerHTML = `
<style>
  :host {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    font-size: var(--font-base, 18px);
    color: var(--color-text, #1a1a2e);
    background: var(--color-bg, #eef4fa);
  }
  .messages {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    -webkit-overflow-scrolling: touch;
  }
  .bubble-wrap {
    display: flex;
    flex-direction: column;
  }
  .bubble-wrap.user { align-items: flex-end; }
  .bubble-wrap.ai   { align-items: flex-start; }

  .bubble {
    max-width: 80%;
    padding: 0.6rem 0.9rem;
    border-radius: 18px;
    line-height: 1.5;
    word-break: break-word;
    white-space: pre-wrap;
  }
  .bubble.user {
    background: var(--color-primary, #2e5c8a);
    color: #fff;
    border-bottom-right-radius: 4px;
  }
  .bubble.ai {
    background: var(--color-surface, #fff);
    border: 1px solid #e0e7ef;
    border-bottom-left-radius: 4px;
  }
  .bubble.error {
    background: #fdecea;
    border: 1px solid #f5c6cb;
    color: #7b2226;
  }
  .bubble-time {
    font-size: 0.7rem;
    color: var(--color-text-muted, #888);
    margin-top: 2px;
    padding: 0 0.3rem;
  }

  /* Thinking indicator */
  .thinking {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 0.6rem 0.9rem;
    background: var(--color-surface, #fff);
    border: 1px solid #e0e7ef;
    border-radius: 18px;
    border-bottom-left-radius: 4px;
    width: fit-content;
  }
  .thinking span {
    display: block;
    width: 8px;
    height: 8px;
    background: var(--color-primary, #2e5c8a);
    border-radius: 50%;
    animation: bounce 1.2s ease-in-out infinite;
    opacity: 0.7;
  }
  .thinking span:nth-child(2) { animation-delay: 0.2s; }
  .thinking span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes bounce {
    0%, 80%, 100% { transform: translateY(0); }
    40%           { transform: translateY(-7px); }
  }
  .thinking.hidden { display: none; }

  /* Input row — sticky la baza ecranului pe mobile */
  .input-row {
    display: flex;
    gap: 0.5rem;
    padding: 0.75rem;
    background: var(--color-surface, #fff);
    border-top: 1px solid #e0e7ef;
    align-items: flex-end;
    flex-shrink: 0;
    position: sticky;
    bottom: 0;
    z-index: 10;
  }
  .text-input {
    flex: 1;
    min-height: var(--tap-min, 44px);
    padding: 0.5rem 0.75rem;
    border: 1.5px solid var(--color-primary, #2e5c8a);
    border-radius: var(--radius, 8px);
    font-size: 1rem;
    resize: none;
    background: var(--color-bg, #eef4fa);
    color: var(--color-text, #1a1a2e);
    font-family: inherit;
    line-height: 1.4;
  }
  .text-input:focus { outline: 3px solid var(--color-primary, #2e5c8a); outline-offset: 2px; }
  .text-input:disabled { opacity: 0.5; }

  .icon-btn {
    min-width: var(--tap-min, 44px);
    min-height: var(--tap-min, 44px);
    border: none;
    border-radius: 50%;
    background: var(--color-primary, #2e5c8a);
    color: #fff;
    font-size: 1.2rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: opacity 0.15s;
  }
  .icon-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .icon-btn:focus-visible { outline: 3px solid var(--color-primary, #2e5c8a); outline-offset: 3px; }
  .icon-btn.mic {
    background: var(--color-accent, #a05c2a);
    min-width: 64px;
    min-height: 64px;
    font-size: 1.4rem;
  }
  .icon-btn.mic.listening {
    background: #c0392b;
    animation: mic-pulse 1s ease-in-out infinite;
  }
  @keyframes mic-pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.6; }
  }

  .listen-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.8rem;
    color: var(--color-primary, #2e5c8a);
    padding: 2px 6px;
    border-radius: 4px;
    margin-top: 2px;
    min-height: 28px;
  }
  .listen-btn:focus-visible { outline: 2px solid var(--color-primary, #2e5c8a); }
  .listen-btn:hover { text-decoration: underline; }

  .stt-toast {
    font-size: 0.8rem;
    color: #7b2226;
    background: #fdecea;
    border: 1px solid #f5c6cb;
    border-radius: var(--radius, 8px);
    padding: 0.4rem 0.75rem;
    margin: 0 1rem 0.5rem;
    display: none;
  }
  .stt-toast.visible { display: block; }

  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    color: var(--color-text-muted, #888);
    font-size: 1rem;
    text-align: center;
    padding: 2rem 1.5rem;
    cursor: pointer;
  }
  .empty-state .hint-icon { font-size: 2.5rem; }
  .empty-state .hint-text { line-height: 1.5; }
  .empty-state.hidden { display: none; }
</style>

<div class="messages" id="messages" role="log" aria-live="polite" aria-label="Conversație cu AI" aria-relevant="additions">
  <div class="empty-state" id="empty-state" role="button" tabindex="0" aria-label="Apasă pentru a scrie un mesaj">
    <span class="hint-icon">💬</span>
    <span class="hint-text">Apasă aici sau pe<br>🎤 microfon ca să vorbești<br>cu Mami AI</span>
  </div>
  <div class="bubble-wrap ai hidden" id="thinking-wrap">
    <div class="thinking" id="thinking" aria-label="AI gândește…" role="status">
      <span></span><span></span><span></span>
    </div>
  </div>
</div>

<div class="stt-toast" id="stt-toast" role="alert" aria-live="assertive"></div>
<div class="input-row">
  <button class="icon-btn mic" id="mic-btn" type="button"
    aria-label="Vorbește (microfon)" aria-pressed="false">🎤</button>
  <textarea class="text-input" id="text-input" placeholder="Scrie mesajul tău…" rows="1"
    aria-label="Mesaj pentru AI" autocomplete="off" enterkeyhint="send"></textarea>
  <button class="icon-btn" id="send-btn" type="button" aria-label="Trimite mesaj">↑</button>
</div>
`;

export class MamiChat extends HTMLElement {
  private readonly _sr: ShadowRoot;
  private _ready = false;
  private _messages: Message[] = [];
  private _busy = false;
  private _abortCtrl: AbortController | null = null;
  private _stopStt: (() => void) | null = null;
  private _sttActive = false;

  static get observedAttributes(): string[] {
    return ["tab", "system-prompt"];
  }

  constructor() {
    super();
    this._sr = this.attachShadow({ mode: "open" });
    this._sr.appendChild(tmpl.content.cloneNode(true));
  }

  connectedCallback(): void {
    if (this._ready) return;
    this._ready = true;
    this._bindEvents();
  }

  attributeChangedCallback(): void {
    // nothing to re-render on attribute change for now
  }

  private get _tab(): string {
    return this.getAttribute("tab") ?? "chat";
  }

  private get _systemPrompt(): string {
    return this.getAttribute("system-prompt") ?? getSystemPrompt(this._tab);
  }

  private _bindEvents(): void {
    const input = this._sr.querySelector(
      "#text-input",
    ) as HTMLTextAreaElement | null;
    const sendBtn = this._sr.querySelector(
      "#send-btn",
    ) as HTMLButtonElement | null;
    const micBtn = this._sr.querySelector(
      "#mic-btn",
    ) as HTMLButtonElement | null;

    sendBtn?.addEventListener("click", () => {
      void this._sendFromInput();
    });

    input?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        void this._sendFromInput();
      }
    });

    // Auto-grow textarea
    input?.addEventListener("input", () => {
      if (!input) return;
      input.style.height = "auto";
      input.style.height = `${Math.min(input.scrollHeight, 120)}px`;
    });

    // Mic button — T17 STT integration
    micBtn?.addEventListener("click", () => {
      // Notify external listeners (e.g., analytics, screen reader tools)
      this.dispatchEvent(
        new CustomEvent("mami-chat-mic", { bubbles: true, composed: true }),
      );
      this._toggleStt();
    });

    // Tap pe empty-state → focus textarea
    const emptyState = this._sr.querySelector("#empty-state");
    emptyState?.addEventListener("click", () => input?.focus());
    emptyState?.addEventListener("keydown", (e) => {
      if (
        (e as KeyboardEvent).key === "Enter" ||
        (e as KeyboardEvent).key === " "
      )
        input?.focus();
    });

    // Pre-load TTS voices for faster first speak()
    void loadVoices();
  }

  private async _sendFromInput(): Promise<void> {
    const input = this._sr.querySelector(
      "#text-input",
    ) as HTMLTextAreaElement | null;
    const text = input?.value.trim() ?? "";
    if (!text || this._busy) return;
    if (input) {
      input.value = "";
      input.style.height = "auto";
    }
    await this._send(text);
  }

  // Public — called by T17 STT integration
  async sendText(text: string): Promise<void> {
    if (!text.trim() || this._busy) return;
    await this._send(text.trim());
  }

  private async _send(text: string): Promise<void> {
    this._addMessage({ role: "user", text });
    this._setBusy(true);

    const history: ChatMessage[] = this._messages
      .filter((m) => m.role !== "ai" || m.text !== "")
      .map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.text,
      }));
    // Remove the sentinel we just added to history for the actual fetch
    const msgs: ChatMessage[] = history.slice(0, -1);
    // The last user message
    msgs.push({ role: "user", content: text });

    this._abortCtrl = new AbortController();
    try {
      const reply = await sendChat(
        msgs,
        this._systemPrompt,
        this._abortCtrl.signal,
      );
      this._addMessage({ role: "ai", text: reply });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      const errText =
        err instanceof AiGatewayError
          ? `Eroare AI: ${err.message}`
          : "Serviciul AI este temporar indisponibil. Încearcă din nou.";
      this._addMessage({ role: "ai", text: errText, isError: true });
    } finally {
      this._setBusy(false);
      this._abortCtrl = null;
    }
  }

  private _addMessage(opts: {
    role: "user" | "ai";
    text: string;
    isError?: boolean;
  }): void {
    const msg: Message = {
      id: msgId(),
      role: opts.role,
      text: opts.text,
      time: new Date().toISOString(),
    };
    this._messages.push(msg);
    this._renderMessage(msg, opts.isError);
    this._scrollToBottom();
    this._updateEmptyState();
  }

  private _renderMessage(msg: Message, isError = false): void {
    const list = this._sr.querySelector("#messages") as HTMLElement | null;
    const thinkingWrap = this._sr.querySelector(
      "#thinking-wrap",
    ) as HTMLElement | null;
    if (!list) return;

    const wrap = document.createElement("div");
    wrap.className = `bubble-wrap ${msg.role}`;

    const bubble = document.createElement("div");
    bubble.className = `bubble ${msg.role}${isError ? " error" : ""}`;
    bubble.textContent = msg.text;
    bubble.setAttribute("aria-label", msg.role === "user" ? "Tu:" : "Mami AI:");

    const time = document.createElement("div");
    time.className = "bubble-time";
    time.textContent = formatTime(msg.time);
    time.setAttribute("aria-hidden", "true");

    wrap.appendChild(bubble);
    wrap.appendChild(time);

    // TTS listen button for AI messages
    if (msg.role === "ai" && !isError) {
      const listenBtn = document.createElement("button");
      listenBtn.className = "listen-btn";
      listenBtn.textContent = "🔊 Ascultă";
      listenBtn.setAttribute("aria-label", "Ascultă răspunsul cu voce");
      listenBtn.addEventListener("click", () => {
        stopSpeaking();
        const roFound = speak(msg.text);
        if (!roFound) {
          this._showSttToast(
            "Instalează pachetul vocal Română din setări pentru voce naturală.",
          );
        }
      });
      wrap.appendChild(listenBtn);
    }

    // Insert before thinking indicator
    if (thinkingWrap) {
      list.insertBefore(wrap, thinkingWrap);
    } else {
      list.appendChild(wrap);
    }
  }

  private _setBusy(busy: boolean): void {
    this._busy = busy;

    const thinkingWrap = this._sr.querySelector(
      "#thinking-wrap",
    ) as HTMLElement | null;
    const input = this._sr.querySelector(
      "#text-input",
    ) as HTMLTextAreaElement | null;
    const sendBtn = this._sr.querySelector(
      "#send-btn",
    ) as HTMLButtonElement | null;

    if (thinkingWrap) {
      thinkingWrap.classList.toggle("hidden", !busy);
    }
    if (input) input.disabled = busy;
    if (sendBtn) sendBtn.disabled = busy;

    if (busy) this._scrollToBottom();
  }

  private _scrollToBottom(): void {
    const list = this._sr.querySelector("#messages") as HTMLElement | null;
    if (list) {
      list.scrollTop = list.scrollHeight;
    }
  }

  private _updateEmptyState(): void {
    const empty = this._sr.querySelector("#empty-state") as HTMLElement | null;
    empty?.classList.toggle("hidden", this._messages.length > 0);
  }

  // T17 — STT toggle (start/stop recording)
  private _toggleStt(): void {
    if (this._sttActive) {
      this._stopStt?.();
      this._stopStt = null;
      this._sttActive = false;
      this._setMicState(false);
      return;
    }
    if (!isSttSupported()) {
      this._showSttToast(
        "Recunoașterea vocală și microfonul nu sunt suportate.",
      );
      const input = this._sr.querySelector(
        "#text-input",
      ) as HTMLTextAreaElement | null;
      input?.focus();
      return;
    }
    stopSpeaking(); // oprește TTS activ înainte de a înregistra
    this._sttActive = true;
    this._setMicState(true);
    this._stopStt = startStt(
      (result) => {
        this._sttActive = false;
        this._setMicState(false);
        this._stopStt = null;
        void this.sendText(result.transcript);
      },
      (errMsg) => {
        this._sttActive = false;
        this._setMicState(false);
        this._stopStt = null;
        if (errMsg) this._showSttToast(errMsg);
      },
      () => {
        this._sttActive = false;
        this._setMicState(false);
        this._stopStt = null;
      },
    );
  }

  private _setMicState(listening: boolean): void {
    const micBtn = this._sr.querySelector(
      "#mic-btn",
    ) as HTMLButtonElement | null;
    micBtn?.classList.toggle("listening", listening);
    micBtn?.setAttribute("aria-pressed", String(listening));
    micBtn?.setAttribute(
      "aria-label",
      listening ? "Oprește microfonul" : "Vorbește (microfon)",
    );
  }

  private _showSttToast(msg: string): void {
    const toast = this._sr.querySelector("#stt-toast") as HTMLElement | null;
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("visible");
    setTimeout(() => toast.classList.remove("visible"), 4_000);
  }

  // Public — clear conversation
  clear(): void {
    this._messages = [];
    this._abortCtrl?.abort();
    this._abortCtrl = null;
    this._busy = false;
    this._stopStt?.();
    this._stopStt = null;
    this._sttActive = false;
    this._setMicState(false);
    stopSpeaking();

    const list = this._sr.querySelector("#messages") as HTMLElement | null;
    const thinkingWrap = this._sr.querySelector(
      "#thinking-wrap",
    ) as HTMLElement | null;
    const empty = this._sr.querySelector("#empty-state") as HTMLElement | null;
    if (list) list.innerHTML = "";
    if (thinkingWrap) {
      thinkingWrap.classList.add("hidden");
      list?.appendChild(thinkingWrap); // re-attach since innerHTML cleared it
    }
    if (empty) {
      empty.classList.remove("hidden");
      list?.insertBefore(empty, list.firstChild); // re-attach
    }

    const input = this._sr.querySelector(
      "#text-input",
    ) as HTMLTextAreaElement | null;
    const sendBtn = this._sr.querySelector(
      "#send-btn",
    ) as HTMLButtonElement | null;
    if (input) {
      input.disabled = false;
      input.style.height = "auto";
    }
    if (sendBtn) sendBtn.disabled = false;
  }
}

customElements.define("mami-chat", MamiChat);
