const tmpl = document.createElement("template");
tmpl.innerHTML = `
<style>
  :host {
    display: block;
    font-size: var(--font-base, 18px);
    color: var(--color-text, #1a1a2e);
    background: var(--color-bg, #eef4fa);
  }
  .hidden { display: none !important; }
  .drop-zone {
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
  .player {
    padding: 1rem;
    background: var(--color-surface, #fff);
    border-radius: var(--radius, 8px);
    margin: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .track-name {
    font-weight: 600;
    font-size: 1rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .play-btn {
    min-height: var(--tap-min, 44px);
    min-width: var(--tap-min, 44px);
    background: var(--color-primary, #2e5c8a);
    color: #fff;
    border: none;
    border-radius: 50%;
    font-size: 1.2rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .play-btn:focus-visible { outline: 3px solid var(--color-primary, #2e5c8a); outline-offset: 2px; }
  .time-display {
    font-size: 0.85rem;
    color: var(--color-text-muted, #555577);
    white-space: nowrap;
    flex-shrink: 0;
    min-width: 5ch;
    text-align: center;
  }
  .progress-wrap { flex: 1; display: flex; flex-direction: column; gap: 4px; }
  input[type="range"] {
    width: 100%;
    height: 6px;
    accent-color: var(--color-primary, #2e5c8a);
    cursor: pointer;
  }
  input[type="range"]:focus-visible { outline: 3px solid var(--color-primary, #2e5c8a); outline-offset: 4px; }
  .vol-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: var(--color-text-muted, #555577);
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
    align-self: flex-end;
  }
  .close-btn:focus-visible { outline: 3px solid var(--color-primary, #2e5c8a); outline-offset: 2px; }
</style>
<div class="drop-zone" id="drop-zone">
  <span class="drop-label">Apasă pentru a deschide un fișier audio</span>
  <label class="upload-label">
    Alege audio
    <input class="file-input" type="file" id="file-input" accept=".mp3,.ogg,.wav,.flac,.aac,.m4a" />
  </label>
</div>
<div class="player hidden" id="player">
  <audio id="audio" preload="metadata"></audio>
  <div class="track-name" id="track-name"></div>
  <div class="controls">
    <button class="play-btn" type="button" id="play-btn" aria-label="Redă">▶</button>
    <span class="time-display" id="current-time">0:00</span>
    <div class="progress-wrap">
      <input type="range" id="progress" min="0" step="0.01" value="0" aria-label="Poziție redare" />
    </div>
    <span class="time-display" id="duration">0:00</span>
  </div>
  <div class="vol-row">
    🔊
    <input type="range" id="volume" min="0" max="1" step="0.05" value="1" aria-label="Volum" />
  </div>
  <button class="close-btn" type="button" id="close-btn" aria-label="Închide player">✕ Închide</button>
</div>
`;

function formatTime(s: number): string {
  if (!isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export class MamiAudioPlayer extends HTMLElement {
  private readonly _sr: ShadowRoot;
  private _ready = false;

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

    const audio = this._sr.querySelector("#audio") as HTMLAudioElement | null;
    const progress = this._sr.querySelector(
      "#progress",
    ) as HTMLInputElement | null;
    const volume = this._sr.querySelector("#volume") as HTMLInputElement | null;
    const playBtn = this._sr.querySelector(
      "#play-btn",
    ) as HTMLButtonElement | null;
    const currentTimeEl = this._sr.querySelector(
      "#current-time",
    ) as HTMLElement | null;
    const durationEl = this._sr.querySelector(
      "#duration",
    ) as HTMLElement | null;

    if (audio) {
      audio.addEventListener("timeupdate", () => {
        if (!progress) return;
        progress.max = String(audio.duration || 0);
        progress.value = String(audio.currentTime);
        if (currentTimeEl)
          currentTimeEl.textContent = formatTime(audio.currentTime);
      });
      audio.addEventListener("loadedmetadata", () => {
        if (durationEl) durationEl.textContent = formatTime(audio.duration);
        if (progress) progress.max = String(audio.duration);
      });
      audio.addEventListener("ended", () => {
        if (playBtn) playBtn.textContent = "▶";
        if (playBtn) playBtn.setAttribute("aria-label", "Redă");
      });
      audio.addEventListener("play", () => {
        if (playBtn) {
          playBtn.textContent = "⏸";
          playBtn.setAttribute("aria-label", "Pauză");
        }
      });
      audio.addEventListener("pause", () => {
        if (playBtn) {
          playBtn.textContent = "▶";
          playBtn.setAttribute("aria-label", "Redă");
        }
      });
    }

    playBtn?.addEventListener("click", () => {
      if (!audio) return;
      if (audio.paused) {
        void audio.play();
      } else {
        audio.pause();
      }
    });

    progress?.addEventListener("input", () => {
      if (audio) audio.currentTime = parseFloat(progress.value);
    });

    volume?.addEventListener("input", () => {
      if (audio) audio.volume = parseFloat(volume.value);
    });

    const input = this._sr.querySelector(
      ".file-input",
    ) as HTMLInputElement | null;
    input?.addEventListener("change", () => {
      const file = input.files?.[0];
      if (file) this._loadFile(file);
    });

    this._sr.querySelector("#close-btn")?.addEventListener("click", () => {
      this._close(audio);
    });

    const srcAttr = this.getAttribute("src");
    if (srcAttr) this._loadSrc(srcAttr);
  }

  private _loadFile(file: File): void {
    const audio = this._sr.querySelector("#audio") as HTMLAudioElement | null;
    if (!audio) return;
    const url = URL.createObjectURL(file);
    audio.addEventListener(
      "ended",
      () => {
        URL.revokeObjectURL(url);
      },
      { once: true },
    );
    audio.src = url;
    this._showPlayer(file.name);
  }

  private _loadSrc(url: string): void {
    const audio = this._sr.querySelector("#audio") as HTMLAudioElement | null;
    if (!audio) return;
    audio.src = url;
    this._showPlayer(url.split("/").pop() ?? url);
  }

  private _showPlayer(name: string): void {
    this._sr.querySelector("#drop-zone")?.classList.add("hidden");
    this._sr.querySelector("#player")?.classList.remove("hidden");
    const trackName = this._sr.querySelector(
      "#track-name",
    ) as HTMLElement | null;
    if (trackName) trackName.textContent = name;
    const progress = this._sr.querySelector(
      "#progress",
    ) as HTMLInputElement | null;
    if (progress) progress.value = "0";
    const currentTimeEl = this._sr.querySelector(
      "#current-time",
    ) as HTMLElement | null;
    if (currentTimeEl) currentTimeEl.textContent = "0:00";
  }

  private _close(audio: HTMLAudioElement | null): void {
    if (audio) {
      audio.pause();
      audio.src = "";
    }
    this._sr.querySelector("#drop-zone")?.classList.remove("hidden");
    this._sr.querySelector("#player")?.classList.add("hidden");
    const input = this._sr.querySelector(
      ".file-input",
    ) as HTMLInputElement | null;
    if (input) input.value = "";
  }
}

customElements.define("mami-audio-player", MamiAudioPlayer);
