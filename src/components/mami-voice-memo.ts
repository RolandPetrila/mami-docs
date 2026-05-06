// T7.D.3 — Voice Memo: înregistrare vocală + transcripție automată.
// MediaRecorder webm/opus, max 2 min, salvat IndexedDB.
// Folosește același store ca galeria foto (photo-blob-store) cu prefix "memo_".

import { transcribeAudio } from "../ai/client";
import { putBlob, getBlob, deleteBlob } from "../data/photo-blob-store";

const STORAGE_KEY = "mami:voice-memos";
const MAX_DURATION_MS = 2 * 60 * 1000;
const MAX_MEMOS = 50;

interface VoiceMemoMeta {
  id: string;
  ts: string; // ISO
  durationMs: number;
  transcript: string;
}

function uid(): string {
  return (
    "memo_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  );
}

function readMemos(): VoiceMemoMeta[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as VoiceMemoMeta[];
  } catch {
    return [];
  }
}

function writeMemos(items: VoiceMemoMeta[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(-MAX_MEMOS)));
  } catch (err) {
    console.warn("[voice-memo] write failed:", err);
  }
}

const tmpl = document.createElement("template");
tmpl.innerHTML = `
<style>
  :host {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
    font-family: inherit;
  }
  .recorder-card {
    background: var(--color-surface, #fff);
    border-radius: 10px;
    padding: 1rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    text-align: center;
  }
  .rec-btn {
    background: #c0392b;
    color: #fff;
    border: none;
    border-radius: 50%;
    width: 80px;
    height: 80px;
    font-size: 2rem;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(192,57,43,0.4);
  }
  .rec-btn.recording { animation: pulse 1.2s ease-in-out infinite; }
  .rec-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  @keyframes pulse {
    0%,100% { transform: scale(1); }
    50%      { transform: scale(1.08); }
  }
  .timer {
    margin-top: 0.5rem;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--color-primary, #2e5c8a);
  }
  .memo-card {
    background: var(--color-surface, #fff);
    border-radius: 10px;
    padding: 0.75rem 1rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .memo-head {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .memo-meta {
    flex: 1;
    font-size: 0.82rem;
    color: var(--color-text-muted, #666);
  }
  .icon-btn {
    background: transparent;
    border: 1px solid #e0e7ef;
    border-radius: 6px;
    cursor: pointer;
    min-width: 44px;
    min-height: 44px;
    font-size: 1.05rem;
  }
  .icon-btn:hover { background: var(--color-bg, #eef4fa); }
  .transcript {
    background: var(--color-bg, #eef4fa);
    border-radius: 6px;
    padding: 0.5rem 0.7rem;
    font-size: 0.92rem;
    white-space: pre-wrap;
    color: var(--color-text, #1a1a2e);
  }
  audio { width: 100%; }
  .empty {
    text-align: center;
    color: var(--color-text-muted, #666);
    padding: 1.5rem;
  }
</style>

<div class="recorder-card">
  <button class="rec-btn" type="button" id="rec-btn" aria-label="Pornește înregistrare">🎤</button>
  <div class="timer" id="timer">Apasă pentru a vorbi (max 2 min)</div>
</div>
<div id="memos-list"></div>
`;

export class MamiVoiceMemo extends HTMLElement {
  private readonly _sr: ShadowRoot;
  private _recorder: MediaRecorder | null = null;
  private _stream: MediaStream | null = null;
  private _chunks: Blob[] = [];
  private _startTs = 0;
  private _timerId: ReturnType<typeof setInterval> | null = null;
  private _maxTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private _activeUrl: string | null = null;

  constructor() {
    super();
    this._sr = this.attachShadow({ mode: "open" });
    this._sr.appendChild(tmpl.content.cloneNode(true));
  }

  connectedCallback(): void {
    const btn = this._sr.querySelector("#rec-btn") as HTMLButtonElement | null;
    btn?.addEventListener("click", () => {
      if (this._recorder && this._recorder.state === "recording") {
        this._stopRecording();
      } else {
        void this._startRecording();
      }
    });
    void this._renderList();
  }

  disconnectedCallback(): void {
    this._stopRecording();
    if (this._activeUrl) {
      URL.revokeObjectURL(this._activeUrl);
      this._activeUrl = null;
    }
  }

  private async _startRecording(): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) {
      alert("Înregistrarea audio nu e suportată pe acest dispozitiv.");
      return;
    }
    try {
      this._stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      alert(
        "Nu am acces la microfon. Permite accesul în setările browserului.",
      );
      return;
    }
    const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm";
    this._recorder = new MediaRecorder(this._stream, { mimeType: mime });
    this._chunks = [];
    this._recorder.addEventListener("dataavailable", (e) => {
      if (e.data.size > 0) this._chunks.push(e.data);
    });
    this._recorder.addEventListener("stop", () => {
      void this._handleStop();
    });
    this._recorder.start();
    this._startTs = Date.now();
    this._setBtnRecording(true);
    this._tickTimer();
    this._timerId = setInterval(() => this._tickTimer(), 250);
    this._maxTimeoutId = setTimeout(
      () => this._stopRecording(),
      MAX_DURATION_MS,
    );
  }

  private _stopRecording(): void {
    if (this._timerId) {
      clearInterval(this._timerId);
      this._timerId = null;
    }
    if (this._maxTimeoutId) {
      clearTimeout(this._maxTimeoutId);
      this._maxTimeoutId = null;
    }
    if (this._recorder && this._recorder.state === "recording") {
      this._recorder.stop();
    }
    this._stream?.getTracks().forEach((t) => t.stop());
    this._stream = null;
    this._setBtnRecording(false);
  }

  private _tickTimer(): void {
    const ms = Date.now() - this._startTs;
    const sec = Math.floor(ms / 1000);
    const mm = String(Math.floor(sec / 60)).padStart(2, "0");
    const ss = String(sec % 60).padStart(2, "0");
    const t = this._sr.querySelector("#timer");
    if (t) t.textContent = `${mm}:${ss} / 02:00`;
  }

  private _setBtnRecording(active: boolean): void {
    const btn = this._sr.querySelector("#rec-btn") as HTMLButtonElement | null;
    if (!btn) return;
    btn.classList.toggle("recording", active);
    btn.textContent = active ? "⏹" : "🎤";
    btn.setAttribute(
      "aria-label",
      active ? "Oprește înregistrarea" : "Pornește înregistrare",
    );
  }

  private async _handleStop(): Promise<void> {
    if (this._chunks.length === 0) return;
    const blob = new Blob(this._chunks, { type: "audio/webm" });
    const id = uid();
    const durationMs = Date.now() - this._startTs;
    const t = this._sr.querySelector("#timer");
    if (t) t.textContent = "Procesez audio...";

    try {
      await putBlob(id, blob);
    } catch (err) {
      console.warn("[voice-memo] putBlob failed:", err);
      if (t) t.textContent = "Nu am putut salva audio.";
      return;
    }

    let transcript = "";
    try {
      transcript = await transcribeAudio(blob);
    } catch (err) {
      console.warn("[voice-memo] transcribe failed:", err);
      transcript = "(transcripție indisponibilă)";
    }

    const memo: VoiceMemoMeta = {
      id,
      ts: new Date().toISOString(),
      durationMs,
      transcript,
    };
    const all = readMemos();
    all.push(memo);
    writeMemos(all);
    if (t) t.textContent = "Apasă pentru a vorbi (max 2 min)";
    void this._renderList();
  }

  private async _renderList(): Promise<void> {
    const box = this._sr.querySelector("#memos-list") as HTMLElement | null;
    if (!box) return;
    box.replaceChildren();
    const memos = readMemos().slice().reverse();
    if (memos.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent =
        "Niciun memo vocal încă. Apasă microfonul pentru a începe.";
      box.appendChild(empty);
      return;
    }
    for (const m of memos) {
      box.appendChild(await this._renderCard(m));
    }
  }

  private async _renderCard(m: VoiceMemoMeta): Promise<HTMLElement> {
    const card = document.createElement("div");
    card.className = "memo-card";

    const head = document.createElement("div");
    head.className = "memo-head";
    const meta = document.createElement("div");
    meta.className = "memo-meta";
    const sec = Math.round(m.durationMs / 1000);
    meta.textContent = `${new Date(m.ts).toLocaleString("ro-RO", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })} • ${sec}s`;
    head.appendChild(meta);

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "icon-btn";
    delBtn.setAttribute("aria-label", "Șterge memo-ul");
    delBtn.textContent = "🗑️";
    delBtn.addEventListener("click", () => {
      if (confirm("Ștergi acest memo vocal?")) {
        void deleteBlob(m.id);
        writeMemos(readMemos().filter((x) => x.id !== m.id));
        void this._renderList();
      }
    });
    head.appendChild(delBtn);
    card.appendChild(head);

    const blob = await getBlob(m.id);
    if (blob) {
      const audio = document.createElement("audio");
      audio.controls = true;
      audio.src = URL.createObjectURL(blob);
      card.appendChild(audio);
    }

    if (m.transcript) {
      const t = document.createElement("div");
      t.className = "transcript";
      t.textContent = m.transcript;
      card.appendChild(t);
    }

    return card;
  }
}

customElements.define("mami-voice-memo", MamiVoiceMemo);
