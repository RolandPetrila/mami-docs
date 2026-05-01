// <mami-ambient-player> — T20 audio ambient
// Audio: /audio/tenderness.mp3 (CC0, admin adaugă fișierul manual în public/audio/)
// Toggle on/off: localStorage "mami-ambient-on"
// Volum: localStorage "mami-ambient-volume" (0-1, default 0.3)
// Autoplay blocat — start la primul gesture utilizator

const STORAGE_ON = "mami-ambient-on";
const STORAGE_VOL = "mami-ambient-volume";
const AUDIO_SRC = "/audio/tenderness.mp3";

const tmpl = document.createElement("template");
tmpl.innerHTML = `
<style>
  :host {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .toggle-btn {
    min-width: 44px;
    min-height: 44px;
    border: none;
    border-radius: 50%;
    background: var(--color-primary, #2e5c8a);
    color: #fff;
    font-size: 1.1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s;
  }
  .toggle-btn.off {
    background: var(--color-text-muted, #888);
  }
  .toggle-btn:focus-visible { outline: 3px solid var(--color-primary, #2e5c8a); outline-offset: 3px; }
  .volume {
    width: 72px;
    min-height: 44px;
    accent-color: var(--color-primary, #2e5c8a);
  }
  .volume.hidden { display: none; }
</style>
<button class="toggle-btn off" id="toggle-btn" type="button"
  aria-label="Pornește muzica ambientală" aria-pressed="false">🔇</button>
<input type="range" class="volume hidden" id="volume"
  min="0" max="1" step="0.05" aria-label="Volum muzică ambientală">
`;

export class MamiAmbientPlayer extends HTMLElement {
  private readonly _sr: ShadowRoot;
  private _audio: HTMLAudioElement | null = null;
  private _enabled = false;
  private _volume = 0.3;
  private _gestureReady = false;
  private _gestureHandler: EventListener | null = null;

  constructor() {
    super();
    this._sr = this.attachShadow({ mode: "open" });
    this._sr.appendChild(tmpl.content.cloneNode(true));
  }

  connectedCallback(): void {
    this._enabled = localStorage.getItem(STORAGE_ON) === "true";
    const stored = parseFloat(localStorage.getItem(STORAGE_VOL) ?? "0.3");
    this._volume = isNaN(stored) ? 0.3 : stored;

    this._bindEvents();
    this._updateUI();

    if (this._enabled) this._awaitGesture();
  }

  disconnectedCallback(): void {
    this._removeGestureListeners();
    this._audio?.pause();
  }

  private _bindEvents(): void {
    const btn = this._sr.querySelector(
      "#toggle-btn",
    ) as HTMLButtonElement | null;
    const vol = this._sr.querySelector("#volume") as HTMLInputElement | null;

    btn?.addEventListener("click", () => {
      this._enabled = !this._enabled;
      localStorage.setItem(STORAGE_ON, String(this._enabled));
      this._updateUI();
      if (this._enabled) {
        this._gestureReady ? this._play() : this._awaitGesture();
      } else {
        this._pause();
      }
    });

    vol?.addEventListener("input", () => {
      if (!vol) return;
      this._volume = parseFloat(vol.value);
      localStorage.setItem(STORAGE_VOL, String(this._volume));
      if (this._audio) this._audio.volume = this._volume;
    });
  }

  private _initAudio(): void {
    if (this._audio) return;
    const audio = new Audio(AUDIO_SRC);
    audio.loop = true;
    audio.volume = this._volume;
    audio.preload = "none";
    audio.onerror = () => {
      // Fișier lipsă — dezactivare silențioasă
      this._enabled = false;
      this._updateUI();
    };
    this._audio = audio;
  }

  private _play(): void {
    this._initAudio();
    if (!this._audio) return;
    this._audio.volume = this._volume;
    void this._audio.play().catch(() => {
      // Autoplay blocat de browser — re-înregistrăm gesture listener
      this._gestureReady = false;
      this._awaitGesture();
    });
  }

  private _pause(): void {
    this._audio?.pause();
  }

  private _awaitGesture(): void {
    if (this._gestureReady || this._gestureHandler) return;
    const handler: EventListener = () => {
      this._gestureReady = true;
      this._removeGestureListeners();
      if (this._enabled) this._play();
    };
    this._gestureHandler = handler;
    document.addEventListener("click", handler, { passive: true });
    document.addEventListener("touchstart", handler, { passive: true });
    document.addEventListener("keydown", handler);
  }

  private _removeGestureListeners(): void {
    if (!this._gestureHandler) return;
    const h = this._gestureHandler;
    document.removeEventListener("click", h);
    document.removeEventListener("touchstart", h);
    document.removeEventListener("keydown", h);
    this._gestureHandler = null;
  }

  private _updateUI(): void {
    const btn = this._sr.querySelector(
      "#toggle-btn",
    ) as HTMLButtonElement | null;
    const vol = this._sr.querySelector("#volume") as HTMLInputElement | null;
    if (btn) {
      btn.textContent = this._enabled ? "🎵" : "🔇";
      btn.classList.toggle("off", !this._enabled);
      btn.setAttribute("aria-pressed", String(this._enabled));
      btn.setAttribute(
        "aria-label",
        this._enabled
          ? "Oprește muzica ambientală"
          : "Pornește muzica ambientală",
      );
    }
    if (vol) {
      vol.value = String(this._volume);
      vol.classList.toggle("hidden", !this._enabled);
    }
  }
}

customElements.define("mami-ambient-player", MamiAmbientPlayer);
