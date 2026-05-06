import type jsPDF from "jspdf";
import { sendChat } from "../ai/client";
import {
  addEmotion,
  addHydration,
  addSleep,
  addVitals,
  deleteEmotion,
  deleteHydration,
  deleteSleep,
  deleteVitals,
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
const HYDRATION_TARGET_KEY = "mami:hydration-target";
const HYDRATION_TARGET_DEFAULT = 2000; // ml

function getHydrationTarget(): number {
  const raw = localStorage.getItem(HYDRATION_TARGET_KEY);
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n >= 500 && n <= 5000
    ? n
    : HYDRATION_TARGET_DEFAULT;
}

// T7.B.3 — Sparkline SVG inline (fără librărie). Returnează HTML string.
function renderSparkline(
  values: number[],
  target: number,
  width = 140,
  height = 40,
): string {
  if (values.length === 0) {
    return `<svg width="${width}" height="${height}" aria-hidden="true"></svg>`;
  }
  const max = Math.max(target, ...values, 1);
  const stepX = values.length > 1 ? width / (values.length - 1) : 0;
  const points = values
    .map((v, i) => {
      const x = i * stepX;
      const y = height - (v / max) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const targetY = height - (target / max) * (height - 4) - 2;
  const circles = values
    .map((v, i) => {
      const x = i * stepX;
      const y = height - (v / max) * (height - 4) - 2;
      const color = v >= target ? "#27ae60" : "#c0392b";
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="${color}" />`;
    })
    .join("");
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" aria-label="Trend hidratare 7 zile">
    <line x1="0" y1="${targetY.toFixed(1)}" x2="${width}" y2="${targetY.toFixed(1)}" stroke="#bcd9f2" stroke-dasharray="3,3" stroke-width="1" />
    <polyline points="${points}" fill="none" stroke="#2e5c8a" stroke-width="1.5" />
    ${circles}
  </svg>`;
}

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

  /* T7.B.2 — Progress bar hidratare */
  .progress {
    width: 100%;
    height: 12px;
    background: #e0e7ef;
    border-radius: 999px;
    overflow: hidden;
    margin: 0.4rem 0 0.25rem;
  }
  .progress-bar {
    height: 100%;
    width: 0%;
    border-radius: 999px;
    transition: width 0.3s ease, background 0.3s;
    background: #c0392b; /* low default */
  }
  .progress-bar.medium { background: #e67e22; }
  .progress-bar.good   { background: #27ae60; }
  .progress-target {
    font-size: 0.82rem;
    color: var(--color-text-muted, #666);
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .btn-link {
    background: none;
    border: none;
    color: var(--color-primary, #2e5c8a);
    font-size: 0.82rem;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    min-height: 36px;
    border-radius: 4px;
  }
  .btn-link:hover { background: var(--color-bg, #eef4fa); }
  .btn-link:focus-visible {
    outline: 2px solid var(--color-primary, #2e5c8a);
    outline-offset: 2px;
  }

  /* T7.B.3 — Sparkline */
  .sparkline-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  /* T7.B.1 — Istoric hidratare azi cu delete */
  .hyd-history { margin-top: 0.6rem; font-size: 0.85rem; }
  .hyd-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.3rem 0;
    border-bottom: 1px dashed #e0e7ef;
    color: var(--color-text-muted, #666);
  }
  .hyd-row:last-child { border-bottom: none; }
  .btn-delete {
    background: transparent;
    border: 1px solid #e0e7ef;
    color: #c0392b;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1rem;
    min-width: 44px;
    min-height: 44px;
    line-height: 1;
  }
  .btn-delete:hover { background: #fdecea; }
  .btn-delete:focus-visible {
    outline: 2px solid #c0392b;
    outline-offset: 2px;
  }

  /* T7.B.1 — vitals/sleep/emotion list cu delete */
  .entry-list { margin-top: 0.5rem; font-size: 0.85rem; }
  .entry-list li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    list-style: none;
    padding: 0.4rem 0;
    border-bottom: 1px dashed #e0e7ef;
  }
  .entry-list ul { padding: 0; margin: 0.25rem 0 0; }
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
  <!-- T7.B.2 — progress bar -->
  <div class="progress" aria-hidden="true">
    <div class="progress-bar" id="water-progress"></div>
  </div>
  <p class="progress-target">
    Țintă: <span id="water-target">2000</span> ml
    <button type="button" class="btn-link" id="btn-edit-target" aria-label="Modifică țintă hidratare">✏️ Modifică</button>
  </p>
  <!-- T7.B.3 — sparkline 7 zile -->
  <div class="sparkline-row">
    <span style="font-size:0.82rem;color:var(--color-text-muted,#666)">Ultimele 7 zile:</span>
    <span id="water-sparkline"></span>
  </div>
  <!-- T7.B.1 — istoric hidratare azi cu butoane ștergere -->
  <div class="hyd-history" id="hyd-history-today"></div>
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
  <div class="entry-list" id="vitals-history"></div>
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
  <div class="entry-list" id="emotion-history"></div>
</div>

<!-- Sleep -->
<div class="card">
  <h2>🌙 Somn</h2>
  <div class="grid">
    <button class="btn" id="btn-sleep-start" type="button">Mă culc acum</button>
    <button class="btn outline" id="btn-sleep-end" type="button">M-am trezit</button>
  </div>
  <p class="status" id="sleep-status">Apasă la culcare și la trezire.</p>
  <div class="entry-list" id="sleep-history"></div>
</div>

<!-- Medical Report -->
<div class="card">
  <h2>📄 Raport Medical</h2>
  <p style="margin-top: 0; font-size: 0.9rem; color: var(--color-text-muted, #555);">Generează un PDF cu măsurătorile recente pentru doctor.</p>
  <div class="grid">
    <button class="btn" id="btn-generate-pdf" type="button">📄 Raport simplu</button>
    <button class="btn outline" id="btn-generate-weekly-pdf" type="button">📊 Raport săptămânal</button>
  </div>
</div>

<!-- Pattern Analysis -->
<div class="card" id="pattern-card" style="display:none">
  <h2>🔍 Analiză Pattern (7 zile)</h2>
  <div id="pattern-alerts"></div>
  <p style="margin: 0.5rem 0 0; font-size: 0.82rem; color: var(--color-text-muted, #666);">
    Bazat pe datele ultimelor 7 zile. Consultați medicul pentru orice îngrijorare.
  </p>
</div>

<!-- Jurnal complet (cronologic 30 zile) -->
<div class="card">
  <h2>📔 Jurnal complet (30 zile)</h2>
  <p style="margin-top: 0; font-size: 0.9rem; color: var(--color-text-muted, #555);">
    Tot ce ai notat, organizat pe zile.
  </p>
  <button class="btn outline" id="btn-toggle-journal" type="button" style="width:100%">Arată jurnalul</button>
  <div id="journal-content" style="display:none; margin-top: 1rem;"></div>
</div>

<!-- AI Proactiv Sugestii -->
<div class="card" id="ai-suggestions-card" style="display:none">
  <h2>🤖 Sfaturi Personalizate AI</h2>
  <div id="ai-suggestions-text" style="font-size:0.9rem;line-height:1.6;margin-bottom:0.75rem;white-space:pre-wrap;"></div>
  <button class="btn outline" id="btn-ai-suggestions" type="button" style="width:100%">💡 Cere sfaturi de la AI</button>
</div>

<div class="toast" id="toast" role="status" aria-live="polite"></div>
`;

export class MamiWellness extends HTMLElement {
  private readonly _sr: ShadowRoot;
  private _emotionVal = 0;
  private _toastTimerId: number | null = null;
  private _aiController: AbortController | null = null;

  constructor() {
    super();
    this._sr = this.attachShadow({ mode: "open" });
    this._sr.appendChild(tmpl.content.cloneNode(true));
  }

  disconnectedCallback(): void {
    if (this._toastTimerId !== null) {
      clearTimeout(this._toastTimerId);
      this._toastTimerId = null;
    }
    this._aiController?.abort();
    this._aiController = null;
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
    this._sr
      .querySelector("#btn-generate-weekly-pdf")
      ?.addEventListener("click", () => this._generateWeeklyPdf());

    // T7.B.2 — Edit hydration target
    this._sr
      .querySelector("#btn-edit-target")
      ?.addEventListener("click", () => this._editHydrationTarget());

    // AI Sugestii
    this._sr
      .querySelector("#btn-ai-suggestions")
      ?.addEventListener("click", () => void this._getAiSuggestions());

    // Jurnal complet
    this._sr
      .querySelector("#btn-toggle-journal")
      ?.addEventListener("click", () => this._toggleJournal());

    this._refreshHydration();
    this._refreshVitalsHistory();
    this._refreshSleepStatus();
    this._refreshSleepHistory();
    this._refreshEmotionHistory();
    this._refreshPatterns();
  }

  private _refreshSleepHistory(): void {
    const box = this._sr.querySelector("#sleep-history") as HTMLElement | null;
    if (!box) return;
    const last = listSleep(7).reverse();
    box.replaceChildren();
    if (last.length === 0) return;
    const title = document.createElement("strong");
    title.textContent = "Ultimele 7 nopți:";
    box.appendChild(title);
    const ul = document.createElement("ul");
    for (const s of last) {
      const li = document.createElement("li");
      const d = new Date(s.start_ts).toLocaleDateString("ro-RO");
      const text = document.createElement("span");
      text.textContent = `${d}: ${s.hours}h`;
      li.appendChild(text);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn-delete";
      btn.setAttribute("aria-label", `Șterge somnul din ${d}`);
      btn.textContent = "✕";
      btn.addEventListener("click", () => {
        if (confirm("Ștergi această noapte?")) {
          deleteSleep(s.id);
          this._refreshSleepHistory();
          this._refreshSleepStatus();
          this._refreshPatterns();
          this._toast("Șters ✓");
        }
      });
      li.appendChild(btn);
      ul.appendChild(li);
    }
    box.appendChild(ul);
  }

  private _refreshEmotionHistory(): void {
    const box = this._sr.querySelector(
      "#emotion-history",
    ) as HTMLElement | null;
    if (!box) return;
    const last = listEmotion(7).reverse();
    box.replaceChildren();
    if (last.length === 0) return;
    const title = document.createElement("strong");
    title.textContent = "Ultimele 7 intrări:";
    box.appendChild(title);
    const ul = document.createElement("ul");
    const labels = ["", "foarte rău", "rău", "neutru", "bine", "foarte bine"];
    const emojis = ["", "😴", "😔", "😐", "🙂", "😄"];
    for (const e of last) {
      const li = document.createElement("li");
      const d = new Date(e.ts).toLocaleString("ro-RO", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
      const note = e.note ? ` — „${e.note}"` : "";
      const text = document.createElement("span");
      text.textContent = `${emojis[e.level] ?? ""} ${d}: ${labels[e.level] ?? "?"}${note}`;
      li.appendChild(text);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn-delete";
      btn.setAttribute("aria-label", `Șterge intrarea de la ${d}`);
      btn.textContent = "✕";
      btn.addEventListener("click", () => {
        if (confirm("Ștergi această intrare?")) {
          deleteEmotion(e.id);
          this._refreshEmotionHistory();
          this._refreshPatterns();
          this._toast("Șters ✓");
        }
      });
      li.appendChild(btn);
      ul.appendChild(li);
    }
    box.appendChild(ul);
  }

  private _toggleJournal(): void {
    const btn = this._sr.querySelector(
      "#btn-toggle-journal",
    ) as HTMLButtonElement | null;
    const content = this._sr.querySelector(
      "#journal-content",
    ) as HTMLElement | null;
    if (!btn || !content) return;
    const visible = content.style.display !== "none";
    if (visible) {
      content.style.display = "none";
      btn.textContent = "Arată jurnalul";
      return;
    }
    content.innerHTML = this._buildJournalHtml();
    content.style.display = "block";
    btn.textContent = "Ascunde jurnalul";
  }

  private _buildJournalHtml(): string {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const since = cutoff.toISOString();

    interface JournalItem {
      ts: string;
      icon: string;
      text: string;
    }
    const items: JournalItem[] = [];

    for (const h of listHydration().filter((e) => e.ts >= since)) {
      items.push({ ts: h.ts, icon: "💧", text: `${h.amount_ml} ml apă` });
    }
    for (const v of listVitals(365).filter((e) => e.ts >= since)) {
      const pulse = v.pulse ? `, puls ${v.pulse}` : "";
      items.push({
        ts: v.ts,
        icon: "❤️",
        text: `tensiune ${v.systolic}/${v.diastolic}${pulse}`,
      });
    }
    for (const e of listEmotion(365).filter((em) => em.ts >= since)) {
      const labels = ["", "foarte rău", "rău", "neutru", "bine", "foarte bine"];
      const note = e.note ? ` — „${e.note}"` : "";
      items.push({
        ts: e.ts,
        icon: "😊",
        text: `stare: ${labels[e.level]}${note}`,
      });
    }
    for (const s of listSleep(365).filter((sl) => sl.start_ts >= since)) {
      items.push({
        ts: s.start_ts,
        icon: "🌙",
        text: `somn ${s.hours}h`,
      });
    }

    if (items.length === 0) {
      return `<p style="text-align:center;color:var(--color-text-muted,#666);font-size:0.9rem;padding:1rem;">Nu sunt date încă. Adaugă măsurători mai sus.</p>`;
    }

    items.sort((a, b) => b.ts.localeCompare(a.ts));

    const byDay = new Map<string, JournalItem[]>();
    for (const it of items) {
      const day = it.ts.slice(0, 10);
      if (!byDay.has(day)) byDay.set(day, []);
      byDay.get(day)?.push(it);
    }

    const sections: string[] = [];
    for (const [day, dayItems] of byDay) {
      const date = new Date(day);
      const dayLabel = date.toLocaleDateString("ro-RO", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
      const liItems = dayItems
        .map((it) => {
          const time = new Date(it.ts).toLocaleTimeString("ro-RO", {
            hour: "2-digit",
            minute: "2-digit",
          });
          return `<li style="padding:0.3rem 0;border-bottom:1px dashed #e0e7ef;font-size:0.9rem;"><span style="display:inline-block;width:1.6rem;">${it.icon}</span> <span style="color:var(--color-text-muted,#777);font-variant-numeric:tabular-nums;">${time}</span> — ${it.text}</li>`;
        })
        .join("");
      sections.push(`
        <div style="margin-bottom:1rem;">
          <div style="font-weight:600;color:var(--color-primary,#2e5c8a);margin-bottom:0.3rem;text-transform:capitalize;">${dayLabel}</div>
          <ul style="list-style:none;padding:0;margin:0;">${liItems}</ul>
        </div>
      `);
    }

    return sections.join("");
  }

  private _refreshPatterns(): void {
    const card = this._sr.querySelector("#pattern-card") as HTMLElement | null;
    const aiCard = this._sr.querySelector(
      "#ai-suggestions-card",
    ) as HTMLElement | null;
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
      if (aiCard) aiCard.style.display = "none";
      return;
    }

    card.style.display = "block";
    if (aiCard) aiCard.style.display = "block";

    alertsEl.replaceChildren();
    for (const a of alerts) {
      const div = document.createElement("div");
      div.style.padding = "0.6rem 0.75rem";
      div.style.borderRadius = "8px";
      div.style.marginBottom = "0.5rem";
      div.style.fontSize = "0.9rem";
      const isWarn = a.type === "warning";
      div.style.background = isWarn ? "#fff3e0" : "#e8f5e9";
      div.style.borderLeft = `4px solid ${isWarn ? "#e67e22" : "#27ae60"}`;
      div.textContent = a.message;
      alertsEl.appendChild(div);
    }
  }

  private async _getAiSuggestions(): Promise<void> {
    const btn = this._sr.querySelector(
      "#btn-ai-suggestions",
    ) as HTMLButtonElement | null;
    const textEl = this._sr.querySelector(
      "#ai-suggestions-text",
    ) as HTMLElement | null;
    if (!btn || !textEl) return;

    btn.disabled = true;
    btn.textContent = "⏳ Se generează…";
    textEl.textContent = "";

    const alerts = detectPatterns(
      listHydration(),
      listVitals(30),
      listEmotion(30),
      listSleep(14),
    );

    const patternLines = alerts.map((a) => `- ${a.message}`).join("\n");
    const prompt = `Bazat pe aceste observații privind starea de sănătate din ultimele 7 zile:\n${patternLines}\n\nOferă 3-4 sfaturi practice, concrete, în română. Concis și clar. NU da diagnostic, doar sugestii de stil de viață. Dacă datele sunt insuficiente pentru o concluzie, spune-o explicit.`;

    this._aiController?.abort();
    this._aiController = new AbortController();
    try {
      const reply = await sendChat(
        [{ role: "user", content: prompt }],
        `Ești asistent AI pentru wellness, în limba română. Ton respectuos și sincer. La incertitudine declară explicit „nu sunt sigur". Nu prescrii, nu pui diagnostic.`,
        this._aiController.signal,
      );
      textEl.textContent = reply;
      btn.textContent = "🔄 Actualizează sfaturile";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      textEl.textContent =
        "Nu am putut genera sfaturi. Verifică conexiunea la internet.";
      btn.textContent = "💡 Încearcă din nou";
    } finally {
      btn.disabled = false;
    }
  }

  private _toast(msg: string): void {
    const el = this._sr.querySelector("#toast") as HTMLElement | null;
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    if (this._toastTimerId !== null) clearTimeout(this._toastTimerId);
    this._toastTimerId = window.setTimeout(() => {
      el.classList.remove("show");
      this._toastTimerId = null;
    }, 2_500);
  }

  private async _addWater(amount: number): Promise<void> {
    await addHydration(amount);
    this._refreshHydration();
    this._toast(`+${amount} ml ✅`);
  }

  private _refreshHydration(): void {
    const total = getHydrationToday();
    const target = getHydrationTarget();
    const pct = Math.min(100, Math.round((total / target) * 100));

    const st = this._sr.querySelector("#water-status");
    if (st)
      st.textContent = `Total azi: ${total} ml (${pct}% din ${target} ml)`;

    const bar = this._sr.querySelector("#water-progress") as HTMLElement | null;
    if (bar) {
      bar.style.width = `${pct}%`;
      bar.classList.remove("medium", "good");
      if (pct >= 100) bar.classList.add("good");
      else if (pct >= 50) bar.classList.add("medium");
    }

    const targetEl = this._sr.querySelector("#water-target");
    if (targetEl) targetEl.textContent = String(target);

    // T7.B.3 — sparkline 7 zile
    const sparkEl = this._sr.querySelector(
      "#water-sparkline",
    ) as HTMLElement | null;
    if (sparkEl) {
      const totals = this._lastNDaysHydration(7);
      sparkEl.innerHTML = renderSparkline(totals, target);
    }

    // T7.B.1 — istoric hidratare azi cu butoane ștergere
    this._refreshHydrationHistory();
  }

  private _lastNDaysHydration(days: number): number[] {
    const totals: number[] = [];
    const now = new Date();
    const byDay = new Map<string, number>();
    for (const h of listHydration()) {
      const day = h.ts.slice(0, 10);
      byDay.set(day, (byDay.get(day) ?? 0) + h.amount_ml);
    }
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      totals.push(byDay.get(key) ?? 0);
    }
    return totals;
  }

  private _refreshHydrationHistory(): void {
    const box = this._sr.querySelector(
      "#hyd-history-today",
    ) as HTMLElement | null;
    if (!box) return;
    const today = new Date().toISOString().slice(0, 10);
    const items = listHydration()
      .filter((h) => h.ts.startsWith(today))
      .reverse();
    box.replaceChildren();
    if (items.length === 0) return;
    const title = document.createElement("strong");
    title.textContent = "Pași azi:";
    box.appendChild(title);
    for (const h of items) {
      const row = document.createElement("div");
      row.className = "hyd-row";
      const time = new Date(h.ts).toLocaleTimeString("ro-RO", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const text = document.createElement("span");
      text.textContent = `${time} — ${h.amount_ml} ml`;
      row.appendChild(text);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn-delete";
      btn.setAttribute("aria-label", `Șterge intrarea de la ${time}`);
      btn.textContent = "✕";
      btn.addEventListener("click", () => {
        if (confirm("Ștergi această măsurătoare?")) {
          deleteHydration(h.id);
          this._refreshHydration();
          this._refreshPatterns();
          this._toast("Șters ✓");
        }
      });
      row.appendChild(btn);
      box.appendChild(row);
    }
  }

  private _editHydrationTarget(): void {
    const current = getHydrationTarget();
    const input = prompt(
      "Țintă hidratare (ml/zi). Recomandat: 1500-2500.",
      String(current),
    );
    if (input === null) return;
    const n = Number(input);
    if (!Number.isFinite(n) || n < 500 || n > 5000) {
      this._toast("Valoare invalidă (500-5000 ml).");
      return;
    }
    localStorage.setItem(HYDRATION_TARGET_KEY, String(Math.round(n)));
    this._refreshHydration();
    this._toast("Țintă actualizată ✓");
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
    this._refreshPatterns();
    this._toast("Salvat ❤️");
  }

  private _refreshVitalsHistory(): void {
    const box = this._sr.querySelector("#vitals-history") as HTMLElement | null;
    if (!box) return;
    const last = listVitals(5).reverse();
    box.replaceChildren();
    if (last.length === 0) return;
    const title = document.createElement("strong");
    title.textContent = "Ultimele 5 măsurători:";
    box.appendChild(title);
    const ul = document.createElement("ul");
    for (const v of last) {
      const li = document.createElement("li");
      const d = new Date(v.ts).toLocaleString("ro-RO", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
      const pulse = v.pulse ? `, puls ${v.pulse}` : "";
      const text = document.createElement("span");
      text.textContent = `${d}: ${v.systolic}/${v.diastolic}${pulse}`;
      li.appendChild(text);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn-delete";
      btn.setAttribute("aria-label", `Șterge măsurătoarea de la ${d}`);
      btn.textContent = "✕";
      btn.addEventListener("click", () => {
        if (confirm("Ștergi această măsurătoare?")) {
          deleteVitals(v.id);
          this._refreshVitalsHistory();
          this._refreshPatterns();
          this._toast("Șters ✓");
        }
      });
      li.appendChild(btn);
      ul.appendChild(li);
    }
    box.appendChild(ul);
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
    this._refreshEmotionHistory();
    this._refreshPatterns();
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
    this._refreshSleepHistory();
    this._refreshPatterns();
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

  private async _generatePdf(): Promise<void> {
    try {
      const { default: jsPDF } = await import("jspdf");
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
    } catch (err) {
      console.warn(
        "[mami-wellness] Eroare generare PDF:",
        err instanceof Error ? err.message : String(err),
      );
      this._toast("Nu am putut genera PDF-ul. Încearcă din nou.");
    }
  }

  // T7.B.4 — Raport săptămânal formatat profesional pentru doctor
  private async _generateWeeklyPdf(): Promise<void> {
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF();

      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - 6);
      const periodStr = `${weekStart.toLocaleDateString("ro-RO")} – ${now.toLocaleDateString("ro-RO")}`;
      const since = weekStart.toISOString().slice(0, 10);

      // Header
      doc.setFillColor(46, 92, 138);
      doc.rect(0, 0, 210, 28, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.text("MONITORIZARE SĂNĂTATE", 14, 14);
      doc.setFontSize(11);
      doc.text(`Perioada: ${periodStr}`, 14, 22);
      doc.setTextColor(0, 0, 0);

      let y = 38;

      // Tensiune
      const vitals = listVitals(50)
        .filter((v) => v.ts >= since)
        .slice(-14);
      if (vitals.length > 0) {
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.text("❤️ Tensiune arterială", 14, y);
        y += 6;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const avgSys = Math.round(
          vitals.reduce((s, v) => s + v.systolic, 0) / vitals.length,
        );
        const avgDia = Math.round(
          vitals.reduce((s, v) => s + v.diastolic, 0) / vitals.length,
        );
        doc.text(
          `Medie ${vitals.length} măsurători: ${avgSys}/${avgDia} mmHg`,
          14,
          y,
        );
        y += 5;
        for (const v of vitals.slice(-14)) {
          if (y > 275) {
            doc.addPage();
            y = 20;
          }
          const d = new Date(v.ts).toLocaleString("ro-RO", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          });
          const pulse = v.pulse ? `  puls: ${v.pulse}` : "";
          const flag = v.systolic > 140 || v.diastolic > 90 ? " ⚠" : "";
          doc.text(
            `  ${d}    ${v.systolic}/${v.diastolic} mmHg${pulse}${flag}`,
            14,
            y,
          );
          y += 5;
        }
        y += 4;
      }

      // Hidratare
      const hydByDay = this._lastNDaysHydration(7);
      const hydAvg = Math.round(
        hydByDay.reduce((s, v) => s + v, 0) / hydByDay.length,
      );
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("💧 Hidratare zilnică", 14, y);
      y += 6;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Medie 7 zile: ${hydAvg} ml/zi`, 14, y);
      y += 5;
      const target = getHydrationTarget();
      hydByDay.forEach((total, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const day = d.toLocaleDateString("ro-RO", {
          weekday: "short",
          day: "2-digit",
          month: "2-digit",
        });
        const flag = total < target * 0.75 ? " ⚠" : total >= target ? " ✓" : "";
        doc.text(`  ${day}: ${total} ml${flag}`, 14, y);
        y += 5;
      });
      y += 4;

      // Somn
      const sleeps = listSleep(14).filter((s) => s.start_ts >= since);
      if (sleeps.length > 0) {
        if (y > 250) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.text("🌙 Somn", 14, y);
        y += 6;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const avgHours =
          Math.round(
            (sleeps.reduce((s, x) => s + x.hours, 0) / sleeps.length) * 10,
          ) / 10;
        doc.text(`Medie: ${avgHours} ore/noapte`, 14, y);
        y += 5;
        for (const s of sleeps) {
          const d = new Date(s.start_ts).toLocaleDateString("ro-RO");
          const flag = s.hours < 6 ? " ⚠" : "";
          doc.text(`  ${d}: ${s.hours}h${flag}`, 14, y);
          y += 5;
        }
        y += 4;
      }

      // Stare emoțională
      const emotions = listEmotion(50).filter((e) => e.ts >= since);
      if (emotions.length > 0) {
        if (y > 250) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.text("😊 Stare emoțională", 14, y);
        y += 6;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const labels = [
          "",
          "foarte rău",
          "rău",
          "neutru",
          "bine",
          "foarte bine",
        ];
        const avgLevel =
          Math.round(
            (emotions.reduce((s, e) => s + e.level, 0) / emotions.length) * 10,
          ) / 10;
        doc.text(
          `Nivel mediu: ${avgLevel}/5 (${emotions.length} intrări)`,
          14,
          y,
        );
        y += 5;
        for (const e of emotions.slice(-14)) {
          const d = new Date(e.ts).toLocaleDateString("ro-RO");
          const note = e.note ? ` — ${e.note}` : "";
          doc.text(
            `  ${d}: ${labels[e.level] ?? "?"}${note}`.slice(0, 90),
            14,
            y,
          );
          y += 5;
        }
        y += 4;
      }

      // Footer
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.setDrawColor(200, 200, 200);
      doc.line(14, y, 196, y);
      y += 6;
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(
        "Generat de Mami Docs PWA — document informativ, nu înlocuiește consultul medical.",
        14,
        y,
      );
      y += 4;
      doc.text(`Generat: ${now.toLocaleString("ro-RO")}`, 14, y);

      const todayStr = now.toLocaleDateString("ro-RO").replace(/\./g, "-");
      doc.save(`Raport_Saptamanal_${todayStr}.pdf`);
      this._toast("Raport săptămânal descărcat ✅");
    } catch (err) {
      console.warn(
        "[mami-wellness] Eroare raport săptămânal:",
        err instanceof Error ? err.message : String(err),
      );
      this._toast("Nu am putut genera raportul.");
    }
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
