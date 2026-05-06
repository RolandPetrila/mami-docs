// T7.C.2 — Tab "Tratament" — Lista medicamente personale + Remindere
// Cel mai cerut feature pentru aplicații vârstnici. Persistă localStorage.
// Reminderele folosesc setTimeout calculat la HH:MM zilnic; re-schedule
// la connectedCallback ca să supraviețuiască reload (mitigation R6).

import { notify } from "../services/notifications";

const STORAGE_KEY = "mami:medications";
const STORAGE_TAKEN_KEY = "mami:medication-taken"; // doze marcate luate

interface MedicationEntry {
  id: string;
  name: string;
  dosage: string; // ex: "5mg" sau "1 pastilă"
  times: string[]; // ex: ["07:00", "19:00"]
  days: number[]; // 0=duminică, 1=luni... 6=sâmbătă; gol = zilnic
  stock: number; // pastile rămase
  refillAt: number; // alertă când stock <= refillAt
  notes: string;
  color: string; // hex pentru identificare vizuală
  active: boolean;
  voice: boolean; // apel voce la reminder
}

interface TakenEntry {
  medId: string;
  ts: string; // ISO
  time: string; // "07:00"
}

const PRESET_COLORS = [
  "#2e5c8a",
  "#27ae60",
  "#a05c2a",
  "#8e44ad",
  "#c0392b",
  "#e67e22",
  "#16a085",
  "#34495e",
];

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function readMeds(): MedicationEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as MedicationEntry[];
  } catch {
    return [];
  }
}

function writeMeds(meds: MedicationEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(meds));
  } catch (err) {
    console.warn("[medication] write failed:", err);
  }
}

function readTaken(): TakenEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_TAKEN_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as TakenEntry[];
  } catch {
    return [];
  }
}

function writeTaken(items: TakenEntry[]): void {
  try {
    // Cap: ultimele 200 (acoperă ~7 zile la 4 medicamente × 7 doze)
    const capped = items.slice(-500);
    localStorage.setItem(STORAGE_TAKEN_KEY, JSON.stringify(capped));
  } catch (err) {
    console.warn("[medication-taken] write failed:", err);
  }
}

function isTakenToday(medId: string, time: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return readTaken().some(
    (t) => t.medId === medId && t.time === time && t.ts.startsWith(today),
  );
}

function markTaken(medId: string, time: string): void {
  const all = readTaken();
  all.push({ medId, ts: new Date().toISOString(), time });
  writeTaken(all);
}

function unmarkTaken(medId: string, time: string): void {
  const today = new Date().toISOString().slice(0, 10);
  writeTaken(
    readTaken().filter(
      (t) => !(t.medId === medId && t.time === time && t.ts.startsWith(today)),
    ),
  );
}

const tmpl = document.createElement("template");
tmpl.innerHTML = `
<style>
  :host {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    background: var(--color-bg, #eef4fa);
    color: var(--color-text, #1a1a2e);
    font-family: inherit;
  }
  .header {
    background: var(--color-primary, #2e5c8a);
    color: #fff;
    padding: 0.75rem 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
  }
  .header h2 { margin: 0; font-size: 1.1rem; flex: 1; }
  .add-btn {
    background: rgba(255,255,255,0.2);
    color: #fff;
    border: 1px solid rgba(255,255,255,0.5);
    border-radius: 6px;
    padding: 0.3rem 0.7rem;
    cursor: pointer;
    min-height: 44px;
    font-size: 0.95rem;
  }
  .content {
    flex: 1;
    overflow-y: auto;
    padding: 0.75rem 1rem;
  }
  .empty {
    text-align: center;
    color: var(--color-text-muted, #666);
    padding: 2rem 1rem;
    font-size: 0.95rem;
    line-height: 1.6;
  }
  .med-card {
    background: var(--color-surface, #fff);
    border-radius: 10px;
    padding: 0.85rem 1rem;
    margin-bottom: 0.7rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.07);
    border-left: 6px solid #ccc;
  }
  .med-head {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .med-name {
    font-weight: 600;
    font-size: 1.05rem;
    flex: 1;
  }
  .med-dose {
    font-size: 0.85rem;
    color: var(--color-text-muted, #666);
    margin-top: 0.1rem;
  }
  .med-actions { display: flex; gap: 0.3rem; }
  .icon-btn {
    background: transparent;
    border: 1px solid #e0e7ef;
    border-radius: 6px;
    cursor: pointer;
    min-width: 44px;
    min-height: 44px;
    font-size: 1rem;
  }
  .icon-btn:hover { background: var(--color-bg, #eef4fa); }
  .doses-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.6rem;
  }
  .dose-btn {
    min-width: 60px;
    min-height: 60px;
    border-radius: 10px;
    border: 2px solid var(--color-primary, #2e5c8a);
    background: #fff;
    color: var(--color-primary, #2e5c8a);
    font-weight: 600;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
  }
  .dose-btn .label { font-size: 0.95rem; }
  .dose-btn .check { font-size: 0.75rem; }
  .dose-btn.taken {
    background: #27ae60;
    color: #fff;
    border-color: #27ae60;
  }
  .stock-info {
    font-size: 0.82rem;
    color: var(--color-text-muted, #666);
    margin-top: 0.5rem;
  }
  .stock-warn { color: #c0392b; font-weight: 600; }
  .export-bar {
    background: var(--color-surface, #fff);
    border-top: 1px solid #e0e7ef;
    padding: 0.5rem 1rem;
    display: flex;
    gap: 0.5rem;
    flex-shrink: 0;
  }
  .btn-secondary {
    background: var(--color-accent-light, #f5e6d8);
    color: var(--color-text, #1a1a2e);
    border: 1px solid var(--color-accent, #a05c2a);
    border-radius: 6px;
    padding: 0.4rem 0.9rem;
    cursor: pointer;
    min-height: 44px;
    font-size: 0.9rem;
  }
  .btn-primary {
    background: var(--color-primary, #2e5c8a);
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 0.5rem 1rem;
    cursor: pointer;
    min-height: 44px;
    font-size: 0.95rem;
  }
  .btn-cancel {
    background: transparent;
    color: var(--color-text-muted, #666);
    border: 1px solid #ccc;
    border-radius: 6px;
    padding: 0.5rem 1rem;
    cursor: pointer;
    min-height: 44px;
  }
  /* Modal editor */
  .modal-bg {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.55);
    z-index: 200;
    display: none;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }
  .modal-bg.open { display: flex; }
  .modal {
    background: var(--color-surface, #fff);
    color: var(--color-text, #1a1a2e);
    border-radius: 12px;
    width: min(440px, 100%);
    max-height: 90vh;
    overflow-y: auto;
    padding: 1rem 1.25rem;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  }
  .modal h3 { margin: 0 0 1rem; font-size: 1.1rem; color: var(--color-primary, #2e5c8a); }
  .field { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 0.75rem; }
  .field label { font-size: 0.88rem; color: var(--color-text-muted, #666); }
  .field input, .field select, .field textarea {
    border: 1.5px solid var(--color-primary, #2e5c8a);
    border-radius: 6px;
    padding: 0.5rem 0.7rem;
    font-size: 1rem;
    font-family: inherit;
    min-height: 44px;
  }
  .field textarea { resize: vertical; min-height: 60px; }
  .colors-row {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
  }
  .color-swatch {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    cursor: pointer;
    border: 2px solid transparent;
  }
  .color-swatch[aria-pressed="true"] { border-color: var(--color-text, #1a1a2e); }
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 1rem;
  }
  .checkbox-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .checkbox-row input[type="checkbox"] {
    min-width: 22px;
    min-height: 22px;
  }
</style>

<div class="header">
  <h2>💊 Tratament</h2>
  <button class="add-btn" type="button" id="add-btn" aria-label="Adaugă medicament">+ Adaugă</button>
</div>

<div class="content" id="content"></div>

<div class="export-bar">
  <button class="btn-secondary" type="button" id="export-btn" aria-label="Exportă lista pentru medic">📋 Exportă pentru medic</button>
</div>

<div class="modal-bg" id="modal-bg">
  <div class="modal" role="dialog" aria-labelledby="modal-title" aria-modal="true">
    <h3 id="modal-title">Medicament nou</h3>
    <div class="field">
      <label for="m-name">Nume medicament</label>
      <input type="text" id="m-name" placeholder="ex: Concor" maxlength="60">
    </div>
    <div class="field">
      <label for="m-dose">Dozaj</label>
      <input type="text" id="m-dose" placeholder="ex: 5mg sau 1 pastilă" maxlength="40">
    </div>
    <div class="field">
      <label for="m-times">Ore administrare (separate cu virgulă)</label>
      <input type="text" id="m-times" placeholder="07:00, 19:00">
    </div>
    <div class="field">
      <label for="m-stock">Pastile rămase</label>
      <input type="number" id="m-stock" min="0" max="9999" inputmode="numeric">
    </div>
    <div class="field">
      <label for="m-refill">Alertă reumplere când stoc &le;</label>
      <input type="number" id="m-refill" min="0" max="999" value="5" inputmode="numeric">
    </div>
    <div class="field">
      <label for="m-notes">Note (opțional)</label>
      <textarea id="m-notes" placeholder="ex: cu mâncare, după dejun..." maxlength="200"></textarea>
    </div>
    <div class="field">
      <label>Culoare</label>
      <div class="colors-row" id="colors-row" role="radiogroup" aria-label="Culoare medicament"></div>
    </div>
    <div class="field checkbox-row">
      <input type="checkbox" id="m-voice">
      <label for="m-voice">Apel voce la reminder (CallMeBot)</label>
    </div>
    <div class="modal-actions">
      <button type="button" class="btn-cancel" id="m-cancel">Anulează</button>
      <button type="button" class="btn-primary" id="m-save">Salvează</button>
    </div>
  </div>
</div>
`;

export class MamiMedication extends HTMLElement {
  private readonly _sr: ShadowRoot;
  private _editingId: string | null = null;
  private _selectedColor = PRESET_COLORS[0]!;
  private _timers: Array<ReturnType<typeof setTimeout>> = [];

  constructor() {
    super();
    this._sr = this.attachShadow({ mode: "open" });
    this._sr.appendChild(tmpl.content.cloneNode(true));
  }

  connectedCallback(): void {
    this._wire();
    this._renderColors();
    this._render();
    this._scheduleAllReminders();
  }

  disconnectedCallback(): void {
    this._clearAllTimers();
  }

  private _clearAllTimers(): void {
    for (const t of this._timers) clearTimeout(t);
    this._timers = [];
  }

  private _wire(): void {
    this._sr
      .querySelector("#add-btn")
      ?.addEventListener("click", () => this._openModal(null));
    this._sr
      .querySelector("#m-cancel")
      ?.addEventListener("click", () => this._closeModal());
    this._sr
      .querySelector("#m-save")
      ?.addEventListener("click", () => this._saveModal());
    this._sr
      .querySelector("#export-btn")
      ?.addEventListener("click", () => this._exportText());
    this._sr.querySelector("#modal-bg")?.addEventListener("click", (e) => {
      if ((e.target as HTMLElement).id === "modal-bg") this._closeModal();
    });
  }

  private _renderColors(): void {
    const row = this._sr.querySelector("#colors-row") as HTMLElement | null;
    if (!row) return;
    row.replaceChildren();
    for (const color of PRESET_COLORS) {
      const swatch = document.createElement("button");
      swatch.type = "button";
      swatch.className = "color-swatch";
      swatch.style.background = color;
      swatch.setAttribute("role", "radio");
      swatch.setAttribute(
        "aria-pressed",
        String(color === this._selectedColor),
      );
      swatch.setAttribute("aria-label", `Culoare ${color}`);
      swatch.addEventListener("click", () => {
        this._selectedColor = color;
        this._renderColors();
      });
      row.appendChild(swatch);
    }
  }

  private _openModal(med: MedicationEntry | null): void {
    this._editingId = med?.id ?? null;
    this._selectedColor = med?.color ?? PRESET_COLORS[0]!;

    const $ = (id: string) =>
      this._sr.querySelector(id) as HTMLInputElement | null;
    const set = (sel: string, val: string): void => {
      const el = $(sel);
      if (el) el.value = val;
    };
    set("#m-name", med?.name ?? "");
    set("#m-dose", med?.dosage ?? "");
    set("#m-times", med?.times.join(", ") ?? "");
    set("#m-stock", String(med?.stock ?? 30));
    set("#m-refill", String(med?.refillAt ?? 5));
    const notesEl = this._sr.querySelector(
      "#m-notes",
    ) as HTMLTextAreaElement | null;
    if (notesEl) notesEl.value = med?.notes ?? "";
    const voiceEl = this._sr.querySelector(
      "#m-voice",
    ) as HTMLInputElement | null;
    if (voiceEl) voiceEl.checked = med?.voice ?? false;

    const titleEl = this._sr.querySelector("#modal-title");
    if (titleEl)
      titleEl.textContent = med ? "Modifică medicament" : "Medicament nou";

    this._renderColors();
    this._sr.querySelector("#modal-bg")?.classList.add("open");
  }

  private _closeModal(): void {
    this._editingId = null;
    this._sr.querySelector("#modal-bg")?.classList.remove("open");
  }

  private _saveModal(): void {
    const get = (sel: string): string =>
      (this._sr.querySelector(sel) as HTMLInputElement | null)?.value.trim() ??
      "";
    const name = get("#m-name");
    const dosage = get("#m-dose");
    const timesRaw = get("#m-times");
    const stock = parseInt(get("#m-stock"), 10) || 0;
    const refillAt = parseInt(get("#m-refill"), 10) || 0;
    const notes =
      (this._sr.querySelector("#m-notes") as HTMLTextAreaElement | null)
        ?.value ?? "";
    const voice = !!(
      this._sr.querySelector("#m-voice") as HTMLInputElement | null
    )?.checked;

    if (!name) {
      alert("Numele medicamentului e obligatoriu.");
      return;
    }
    const times = timesRaw
      .split(",")
      .map((t) => t.trim())
      .filter((t) => /^\d{1,2}:\d{2}$/.test(t))
      .map((t) => {
        const [h, m] = t.split(":");
        return `${(h ?? "0").padStart(2, "0")}:${(m ?? "00").padStart(2, "0")}`;
      });

    const meds = readMeds();
    if (this._editingId) {
      const idx = meds.findIndex((m) => m.id === this._editingId);
      if (idx >= 0) {
        const ex = meds[idx];
        if (ex) {
          meds[idx] = {
            ...ex,
            name,
            dosage,
            times,
            stock,
            refillAt,
            notes,
            color: this._selectedColor,
            voice,
          };
        }
      }
    } else {
      meds.push({
        id: uid(),
        name,
        dosage,
        times,
        days: [],
        stock,
        refillAt,
        notes,
        color: this._selectedColor,
        active: true,
        voice,
      });
    }
    writeMeds(meds);
    this._closeModal();
    this._render();
    this._scheduleAllReminders();
  }

  private _delete(id: string): void {
    if (!confirm("Ștergi acest medicament?")) return;
    writeMeds(readMeds().filter((m) => m.id !== id));
    this._render();
    this._scheduleAllReminders();
  }

  private _toggleDose(med: MedicationEntry, time: string): void {
    if (isTakenToday(med.id, time)) {
      unmarkTaken(med.id, time);
    } else {
      markTaken(med.id, time);
      // decrement stock
      const meds = readMeds().map((m) =>
        m.id === med.id ? { ...m, stock: Math.max(0, m.stock - 1) } : m,
      );
      writeMeds(meds);
      const updated = meds.find((m) => m.id === med.id);
      if (updated && updated.stock <= updated.refillAt && updated.stock > 0) {
        void notify({
          title: "💊 Stoc redus",
          message: `${updated.name} — au mai rămas ${updated.stock} pastile. Cumpără reumplere.`,
          level: "warning",
          tags: "pill",
        });
      }
    }
    this._render();
  }

  private _render(): void {
    const content = this._sr.querySelector("#content") as HTMLElement | null;
    if (!content) return;
    content.replaceChildren();
    const meds = readMeds();
    if (meds.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent =
        'Nu ai medicamente adăugate. Apasă "+ Adaugă" pentru a începe.';
      content.appendChild(empty);
      return;
    }
    for (const m of meds) content.appendChild(this._renderCard(m));
  }

  private _renderCard(m: MedicationEntry): HTMLElement {
    const card = document.createElement("div");
    card.className = "med-card";
    card.style.borderLeftColor = m.color;

    const head = document.createElement("div");
    head.className = "med-head";
    const nameWrap = document.createElement("div");
    nameWrap.style.flex = "1";
    const name = document.createElement("div");
    name.className = "med-name";
    name.textContent = m.name;
    nameWrap.appendChild(name);
    if (m.dosage) {
      const dose = document.createElement("div");
      dose.className = "med-dose";
      dose.textContent = m.dosage;
      nameWrap.appendChild(dose);
    }
    head.appendChild(nameWrap);

    const actions = document.createElement("div");
    actions.className = "med-actions";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "icon-btn";
    editBtn.setAttribute("aria-label", `Modifică ${m.name}`);
    editBtn.textContent = "✏️";
    editBtn.addEventListener("click", () => this._openModal(m));
    actions.appendChild(editBtn);

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "icon-btn";
    delBtn.setAttribute("aria-label", `Șterge ${m.name}`);
    delBtn.textContent = "🗑️";
    delBtn.addEventListener("click", () => this._delete(m.id));
    actions.appendChild(delBtn);

    head.appendChild(actions);
    card.appendChild(head);

    if (m.times.length > 0) {
      const doses = document.createElement("div");
      doses.className = "doses-row";
      for (const time of m.times) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "dose-btn";
        const taken = isTakenToday(m.id, time);
        if (taken) btn.classList.add("taken");
        btn.setAttribute(
          "aria-label",
          taken
            ? `Anulează doza de ${m.name} de la ${time}`
            : `Marchează doza de ${m.name} de la ${time}`,
        );
        const label = document.createElement("span");
        label.className = "label";
        label.textContent = time;
        const check = document.createElement("span");
        check.className = "check";
        check.textContent = taken ? "✓ luat" : "Am luat";
        btn.appendChild(label);
        btn.appendChild(check);
        btn.addEventListener("click", () => this._toggleDose(m, time));
        doses.appendChild(btn);
      }
      card.appendChild(doses);
    }

    if (m.notes) {
      const notes = document.createElement("div");
      notes.className = "med-dose";
      notes.style.marginTop = "0.4rem";
      notes.style.fontStyle = "italic";
      notes.textContent = m.notes;
      card.appendChild(notes);
    }

    const stock = document.createElement("div");
    stock.className = "stock-info";
    if (m.stock <= m.refillAt) stock.classList.add("stock-warn");
    stock.textContent =
      m.stock === 0
        ? "⚠ STOC EPUIZAT — cumpără urgent"
        : m.stock <= m.refillAt
          ? `⚠ Stoc redus: ${m.stock} pastile rămase`
          : `Stoc: ${m.stock} pastile`;
    card.appendChild(stock);

    return card;
  }

  // Programare remindere — re-rulat la connectedCallback (R6 mitigation:
  // setTimeout JS nu supraviețuiește reload, deci recalculăm la fiecare montare)
  private _scheduleAllReminders(): void {
    this._clearAllTimers();
    const meds = readMeds().filter((m) => m.active);
    const now = new Date();
    for (const m of meds) {
      for (const time of m.times) {
        const [hStr, mStr] = time.split(":");
        const h = parseInt(hStr ?? "0", 10);
        const min = parseInt(mStr ?? "0", 10);
        if (!Number.isFinite(h) || !Number.isFinite(min)) continue;
        const target = new Date();
        target.setHours(h, min, 0, 0);
        if (target <= now) target.setDate(target.getDate() + 1);
        const delayMs = target.getTime() - now.getTime();
        // Skip dacă > 24h (defensive)
        if (delayMs > 24 * 60 * 60 * 1000) continue;
        const timer = setTimeout(() => {
          if (isTakenToday(m.id, time)) return;
          void notify({
            title: `💊 ${m.name} — ${time}`,
            message: `Timpul pentru ${m.name}${m.dosage ? ` (${m.dosage})` : ""}.`,
            level: "warning",
            tags: "pill",
            voice: m.voice,
          });
          // Re-schedule pentru ziua următoare
          this._scheduleAllReminders();
        }, delayMs);
        this._timers.push(timer);
      }
    }
  }

  private _exportText(): void {
    const meds = readMeds();
    if (meds.length === 0) {
      alert("Nu ai medicamente de exportat.");
      return;
    }
    const lines = [
      "TRATAMENT CURENT",
      `Generat: ${new Date().toLocaleString("ro-RO")}`,
      "",
    ];
    for (const m of meds) {
      const dose = m.dosage ? ` ${m.dosage}` : "";
      const schedule = m.times.length > 0 ? ` × ${m.times.join(" și ")}` : "";
      const notes = m.notes ? `\n  Note: ${m.notes}` : "";
      lines.push(`• ${m.name}${dose}${schedule}${notes}`);
    }
    const text = lines.join("\n");
    void navigator.clipboard
      .writeText(text)
      .then(() => alert("Lista a fost copiată în clipboard."))
      .catch(() => {
        // fallback: arată într-un prompt
        const w = window.open("", "_blank");
        if (w) {
          w.document.body.innerText = text;
          w.document.title = "Tratament Curent";
        }
      });
  }
}

customElements.define("mami-medication", MamiMedication);
