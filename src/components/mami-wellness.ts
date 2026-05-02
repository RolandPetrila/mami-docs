import jsPDF from "jspdf";
import {
  addEmotion,
  addHydration,
  addSleep,
  addVitals,
  getHydrationToday,
  listEmotion,
  listHydration,
  listSleep,
  listVitals,
  type EmotionEntry,
  type HydrationEntry,
  type SleepEntry,
  type VitalsEntry,
} from "../data/local-store";

const SLEEP_START_KEY = "mami:sleep-start";

const tmpl = document.createElement("template");
tmpl.innerHTML = `
<style>
  :host {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    font-family: inherit;
    background: var(--color-bg, #eef4fa);
    color: var(--color-text, #1a1a2e);
    overflow-y: auto;
  }
  .card {
    background: var(--color-surface, #fff);
    border-radius: var(--radius, 8px);
    padding: 1rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  }
  h2 { margin: 0 0 0.75rem; font-size: 1.2rem; color: var(--color-primary, #2e5c8a); }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 0.5rem;
  }
  .btn {
    min-height: var(--tap-min, 44px);
    padding: 0.5rem 1rem;
    background: var(--color-primary, #2e5c8a);
    color: #fff;
    border: none;
    border-radius: var(--radius, 8px);
    font-size: 1rem;
    cursor: pointer;
    text-align: center;
  }
  .btn:hover { opacity: 0.9; }
  .btn.outline { background: transparent; color: var(--color-primary); border: 2px solid var(--color-primary); }
  .btn.danger { background: #c0392b; }

  input[type="number"], input[type="text"] {
    width: 100%;
    min-height: var(--tap-min, 44px);
    padding: 0.5rem;
    font-size: 1rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-sizing: border-box;
    margin-bottom: 0.5rem;
  }
  .input-group { margin-bottom: 1rem; }
  .input-group label { display: block; margin-bottom: 0.25rem; font-size: 0.9rem; color: var(--color-text-muted, #555); }
  .emoji-row { display: flex; justify-content: space-around; font-size: 2rem; margin-top: 0.5rem; }
  .emoji-row span { cursor: pointer; transition: transform 0.2s; user-select: none; }
  .emoji-row span:hover { transform: scale(1.2); }
  .emoji-row span.selected { transform: scale(1.3); filter: drop-shadow(0 0 4px var(--color-accent, #a05c2a)); }
  .status { margin: 0.75rem 0 0; text-align: center; font-weight: 600; }
  .history {
    margin-top: 0.5rem;
    font-size: 0.85rem;
    color: var(--color-text-muted, #666);
  }
  .history ul { margin: 0.25rem 0 0; padding-left: 1.25rem; }
  .history li { margin-bottom: 0.15rem; }
  .toast {
    position: fixed;
    left: 50%; bottom: 1rem;
    transform: translateX(-50%);
    background: var(--color-primary, #2e5c8a);
    color: #fff;
    padding: 0.6rem 1rem;
    border-radius: 999px;
    font-size: 0.9rem;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s;
  }
  .toast.show { opacity: 1; }
</style>

<!-- Hydration -->
<div class="card">
  <h2>💧 Hidratare</h2>
  <p style="margin-top: 0; font-size: 0.9rem; color: var(--color-text-muted, #555);">Ai băut apă azi?</p>
  <div class="grid">
    <button class="btn" id="btn-water-1" type="button">+ 1 Pahar (250ml)</button>
    <button class="btn outline" id="btn-water-2" type="button">+ 1 Sticlă (500ml)</button>
  </div>
  <p class="status" id="water-status">Total azi: 0 ml</p>
</div>

<!-- Vitals -->
<div class="card">
  <h2>❤️ Semne Vitale</h2>
  <div class="input-group">
    <label>Tensiune (sistolică / diastolică)</label>
    <div style="display: flex; gap: 0.5rem; align-items: center;">
      <input type="number" id="input-sys" placeholder="120" min="60" max="250" inputmode="numeric">
      <span style="font-size: 1.5rem;">/</span>
      <input type="number" id="input-dia" placeholder="80" min="40" max="150" inputmode="numeric">
    </div>
  </div>
  <div class="input-group">
    <label>Puls (BPM, opțional)</label>
    <input type="number" id="input-pulse" placeholder="70" min="30" max="200" inputmode="numeric">
  </div>
  <button class="btn" style="width: 100%;" id="btn-save-vitals" type="button">Salvează măsurătoarea</button>
  <div class="history" id="vitals-history"></div>
</div>

<!-- Emotional Check-in -->
<div class="card">
  <h2>😊 Cum te simți azi?</h2>
  <div class="emoji-row" id="emoji-picker">
    <span data-val="1" role="button" tabindex="0" aria-label="Foarte rău">😴</span>
    <span data-val="2" role="button" tabindex="0" aria-label="Rău">😔</span>
    <span data-val="3" role="button" tabindex="0" aria-label="Așa și așa">😐</span>
    <span data-val="4" role="button" tabindex="0" aria-label="Bine">🙂</span>
    <span data-val="5" role="button" tabindex="0" aria-label="Foarte bine">😄</span>
  </div>
  <input type="text" id="input-emotion-note" placeholder="Vrei să adaugi o notiță scurtă? (opțional)" style="margin-top: 1rem;">
  <button class="btn" style="width: 100%;" id="btn-save-emotion" type="button">Trimite Jurnal</button>
</div>

<!-- Sleep -->
<div class="card">
  <h2>🌙 Somn</h2>
  <div class="grid">
    <button class="btn" id="btn-sleep-start" type="button">Mă culc acum</button>
    <button class="btn outline" id="btn-sleep-end" type="button">M-am trezit</button>
  </div>
  <p class="status" id="sleep-status">Apasă la culcare și la trezire.</p>
</div>

<!-- Medical Report -->
<div class="card">
  <h2>📄 Raport Medical</h2>
  <p style="margin-top: 0; font-size: 0.9rem; color: var(--color-text-muted, #555);">Generează un PDF cu măsurătorile recente pentru doctor.</p>
  <button class="btn" style="width: 100%;" id="btn-generate-pdf" type="button">Descarcă raport PDF</button>
</div>

<!-- Pattern Analysis -->
<div class="card" id="pattern-card" style="display:none">
  <h2>🔍 Analiză Pattern (7 zile)</h2>
  <div id="pattern-alerts"></div>
  <p style="margin: 0.5rem 0 0; font-size: 0.82rem; color: var(--color-text-muted, #666);">
    Bazat pe datele ultimelor 7 zile. Consultați medicul pentru orice îngrijorare.
  </p>
</div>

<div class="toast" id="toast" role="status" aria-live="polite"></div>
`;

export class MamiWellness extends HTMLElement {
  private readonly _sr: ShadowRoot;
  private _emotionVal = 0;

  constructor() {
    super();
    this._sr = this.attachShadow({ mode: "open" });
    this._sr.appendChild(tmpl.content.cloneNode(true));
  }

  connectedCallback(): void {
    // Hydration
    this._sr
      .querySelector("#btn-water-1")
      ?.addEventListener("click", () => void this._addWater(250));
    this._sr
      .querySelector("#btn-water-2")
      ?.addEventListener("click", () => void this._addWater(500));

    // Vitals
    this._sr
      .querySelector("#btn-save-vitals")
      ?.addEventListener("click", () => void this._saveVitals());

    // Emotion
    const emojis = this._sr.querySelectorAll("#emoji-picker span");
    emojis.forEach((e) => {
      const handler = (ev: Event) => {
        emojis.forEach((el) => el.classList.remove("selected"));
        const target = ev.currentTarget as HTMLElement;
        target.classList.add("selected");
        this._emotionVal = parseInt(target.dataset["val"] ?? "0", 10);
      };
      e.addEventListener("click", handler);
      e.addEventListener("keydown", (ev) => {
        const ke = ev as KeyboardEvent;
        if (ke.key === "Enter" || ke.key === " ") {
          ev.preventDefault();
          handler(ev);
        }
      });
    });
    this._sr
      .querySelector("#btn-save-emotion")
      ?.addEventListener("click", () => void this._saveEmotion());

    // Sleep
    this._sr
      .querySelector("#btn-sleep-start")
      ?.addEventListener("click", () => this._sleepStart());
    this._sr
      .querySelector("#btn-sleep-end")
      ?.addEventListener("click", () => void this._sleepEnd());

    // PDF
    this._sr
      .querySelector("#btn-generate-pdf")
      ?.addEventListener("click", () => this._generatePdf());

    this._refreshHydration();
    this._refreshVitalsHistory();
    this._refreshSleepStatus();
    this._refreshPatterns();
  }

  private _refreshPatterns(): void {
    const card = this._sr.querySelector("#pattern-card") as HTMLElement | null;
    const alertsEl = this._sr.querySelector("#pattern-alerts");
    if (!card || !alertsEl) return;

    const alerts = detectPatterns(
      listHydration(),
      listVitals(30),
      listEmotion(30),
      listSleep(14),
    );

    if (alerts.length === 0) {
      card.style.display = "none";
      return;
    }

    card.style.display = "block";
    alertsEl.innerHTML = alerts
      .map(
        (a) => `<div style="
        padding: 0.6rem 0.75rem;
        border-radius: 8px;
        margin-bottom: 0.5rem;
        background: ${a.type === "warning" ? "#fff3e0" : "#e8f5e9"};
        border-left: 4px solid ${a.type === "warning" ? "#e67e22" : "#27ae60"};
        font-size: 0.9rem;
      ">${a.message}</div>`,
      )
      .join("");
  }

  private _toast(msg: string): void {
    const el = this._sr.querySelector("#toast") as HTMLElement | null;
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    setTimeout(() => el.classList.remove("show"), 2_500);
  }

  private async _addWater(amount: number): Promise<void> {
    await addHydration(amount);
    this._refreshHydration();
    this._toast(`+${amount} ml ✅`);
  }

  private _refreshHydration(): void {
    const total = getHydrationToday();
    const st = this._sr.querySelector("#water-status");
    if (st) st.textContent = `Total azi: ${total} ml`;
  }

  private async _saveVitals(): Promise<void> {
    const sysEl = this._sr.querySelector(
      "#input-sys",
    ) as HTMLInputElement | null;
    const diaEl = this._sr.querySelector(
      "#input-dia",
    ) as HTMLInputElement | null;
    const pulseEl = this._sr.querySelector(
      "#input-pulse",
    ) as HTMLInputElement | null;
    const sys = parseInt(sysEl?.value ?? "", 10);
    const dia = parseInt(diaEl?.value ?? "", 10);
    const pulse = pulseEl?.value ? parseInt(pulseEl.value, 10) : null;

    if (!Number.isFinite(sys) || !Number.isFinite(dia)) {
      this._toast("Te rog completează tensiunea.");
      return;
    }

    await addVitals(sys, dia, pulse);
    if (sysEl) sysEl.value = "";
    if (diaEl) diaEl.value = "";
    if (pulseEl) pulseEl.value = "";
    this._refreshVitalsHistory();
    this._toast("Salvat ❤️");
  }

  private _refreshVitalsHistory(): void {
    const box = this._sr.querySelector("#vitals-history");
    if (!box) return;
    const last = listVitals(5).reverse();
    if (last.length === 0) {
      box.innerHTML = "";
      return;
    }
    const items = last
      .map((v) => {
        const d = new Date(v.ts).toLocaleString("ro-RO", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
        const pulse = v.pulse ? `, puls ${v.pulse}` : "";
        return `<li>${d}: ${v.systolic}/${v.diastolic}${pulse}</li>`;
      })
      .join("");
    box.innerHTML = `<strong>Ultimele 5 măsurători:</strong><ul>${items}</ul>`;
  }

  private async _saveEmotion(): Promise<void> {
    if (this._emotionVal === 0) {
      this._toast("Alege un emoticon.");
      return;
    }
    const noteEl = this._sr.querySelector(
      "#input-emotion-note",
    ) as HTMLInputElement | null;
    const note = noteEl?.value ?? "";
    await addEmotion(this._emotionVal as 1 | 2 | 3 | 4 | 5, note);

    this._sr
      .querySelectorAll("#emoji-picker span")
      .forEach((el) => el.classList.remove("selected"));
    this._emotionVal = 0;
    if (noteEl) noteEl.value = "";
    this._toast("Mulțumesc 🤗");
  }

  private _sleepStart(): void {
    const ts = new Date().toISOString();
    localStorage.setItem(SLEEP_START_KEY, ts);
    this._refreshSleepStatus();
    this._toast("Somn ușor 🌙");
  }

  private async _sleepEnd(): Promise<void> {
    const start = localStorage.getItem(SLEEP_START_KEY);
    if (!start) {
      this._toast("Apasă întâi „Mă culc acum“.");
      return;
    }
    const end = new Date().toISOString();
    const entry = await addSleep(start, end);
    localStorage.removeItem(SLEEP_START_KEY);
    this._refreshSleepStatus();
    this._toast(`Bună dimineața! ${entry.hours}h ☀️`);
  }

  private _refreshSleepStatus(): void {
    const st = this._sr.querySelector("#sleep-status");
    if (!st) return;
    const start = localStorage.getItem(SLEEP_START_KEY);
    if (start) {
      const startTxt = new Date(start).toLocaleTimeString("ro-RO", {
        hour: "2-digit",
        minute: "2-digit",
      });
      st.textContent = `În somn de la ${startTxt}…`;
      return;
    }
    const last = listSleep(1)[0];
    if (last) {
      st.textContent = `Ultima noapte: ${last.hours}h.`;
    } else {
      st.textContent = "Apasă la culcare și la trezire.";
    }
  }

  private _generatePdf(): void {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString("ro-RO");

    doc.setFontSize(18);
    doc.text("Raport Medical - Mami Docs", 14, 18);
    doc.setFontSize(10);
    doc.text(`Generat: ${today}`, 14, 25);

    let y = 35;
    y = this._pdfSection(
      doc,
      y,
      "Semne Vitale (ultimele 14)",
      listVitals(14),
      (v: VitalsEntry) => {
        const d = new Date(v.ts).toLocaleString("ro-RO", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        const pulse = v.pulse ? `, puls ${v.pulse}` : "";
        return `${d}: ${v.systolic}/${v.diastolic} mmHg${pulse}`;
      },
    );

    y = this._pdfSection(
      doc,
      y,
      "Hidratare (ultimele 14 zile)",
      aggregateByDay(listHydration(), 14),
      (e: { day: string; total: number }) => {
        return `${e.day}: ${e.total} ml`;
      },
    );

    y = this._pdfSection(
      doc,
      y,
      "Somn (ultimele 14)",
      listSleep(14),
      (s: SleepEntry) => {
        const d = new Date(s.start_ts).toLocaleDateString("ro-RO");
        return `${d}: ${s.hours}h`;
      },
    );

    y = this._pdfSection(
      doc,
      y,
      "Stare emoțională (ultimele 14)",
      listEmotion(14),
      (e: EmotionEntry) => {
        const d = new Date(e.ts).toLocaleDateString("ro-RO");
        const labels = [
          "",
          "foarte rău",
          "rău",
          "neutru",
          "bine",
          "foarte bine",
        ];
        const note = e.note ? ` — ${e.note}` : "";
        return `${d}: ${labels[e.level]}${note}`;
      },
    );

    if (y === 35) {
      doc.setFontSize(12);
      doc.text("Nu sunt încă măsurători salvate.", 14, y + 10);
    }

    doc.save(`Raport_Medical_${today.replace(/\./g, "-")}.pdf`);
    this._toast("PDF descărcat ✅");
  }

  private _pdfSection<T>(
    doc: jsPDF,
    startY: number,
    title: string,
    items: T[],
    fmt: (item: T) => string,
  ): number {
    if (items.length === 0) return startY;
    let y = startY;
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(13);
    doc.text(title, 14, y);
    y += 6;
    doc.setFontSize(10);
    for (const item of items) {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(`• ${fmt(item)}`, 16, y);
      y += 5;
    }
    return y + 4;
  }
}

function detectPatterns(
  hydration: HydrationEntry[],
  vitals: VitalsEntry[],
  emotions: EmotionEntry[],
  sleep: SleepEntry[],
): Array<{ type: "warning" | "info"; message: string }> {
  const alerts: Array<{ type: "warning" | "info"; message: string }> = [];
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  const since = cutoff.toISOString();

  // Hydration: < 1500ml for 3+ of last 7 days
  const hydByDay = new Map<string, number>();
  for (const h of hydration.filter((h) => h.ts >= since)) {
    const day = h.ts.slice(0, 10);
    hydByDay.set(day, (hydByDay.get(day) ?? 0) + h.amount_ml);
  }
  const lowHydDays = [...hydByDay.values()].filter((v) => v < 1500).length;
  if (lowHydDays >= 3) {
    alerts.push({
      type: "warning",
      message: `💧 Hidratare scăzută în ${lowHydDays} din ultimele 7 zile (sub 1500ml). Încearcă să bei mai multă apă!`,
    });
  }

  // Blood pressure: systolic > 140 or diastolic > 90 in 3+ readings
  const recentVitals = vitals.filter((v) => v.ts >= since);
  const highBPReadings = recentVitals.filter(
    (v) => v.systolic > 140 || v.diastolic > 90,
  ).length;
  if (highBPReadings >= 3) {
    alerts.push({
      type: "warning",
      message: `❤️ Tensiune ridicată în ${highBPReadings} măsurători recente. Consultați medicul.`,
    });
  }

  // Sleep: < 6 hours for 3+ nights
  const recentSleep = sleep.filter((s) => s.start_ts >= since);
  const poorSleepNights = recentSleep.filter((s) => s.hours < 6).length;
  if (poorSleepNights >= 3) {
    alerts.push({
      type: "warning",
      message: `🌙 Somn insuficient (sub 6h) în ${poorSleepNights} nopți recente. Încercați să vă odihniți mai mult.`,
    });
  }

  // Emotion: level <= 2 for 3+ days
  const emotByDay = new Map<string, number>();
  for (const e of emotions.filter((em) => em.ts >= since)) {
    const day = e.ts.slice(0, 10);
    const existing = emotByDay.get(day);
    if (!existing || e.level < existing) emotByDay.set(day, e.level);
  }
  const lowEmotDays = [...emotByDay.values()].filter((v) => v <= 2).length;
  if (lowEmotDays >= 3) {
    alerts.push({
      type: "warning",
      message: `😔 Stare emoțională scăzută în ${lowEmotDays} zile recente. Vorbiți cu cineva drag sau contactați medicul.`,
    });
  }

  // Positive: consistent good hydration
  const goodHydDays = [...hydByDay.values()].filter((v) => v >= 2000).length;
  if (goodHydDays >= 5) {
    alerts.push({
      type: "info",
      message: `💧 Excelent! ${goodHydDays} zile cu hidratare optimă (≥2L) săptămâna aceasta!`,
    });
  }

  return alerts;
}

function aggregateByDay(
  entries: HydrationEntry[],
  days: number,
): Array<{ day: string; total: number }> {
  const byDay = new Map<string, number>();
  for (const e of entries) {
    const day = e.ts.slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + e.amount_ml);
  }
  return Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-days)
    .map(([day, total]) => ({ day, total }));
}

customElements.define("mami-wellness", MamiWellness);
