// Verificare interacțiuni medicamente — Faza 4.
// Surse publice (fără cheie API):
//   RxNorm API — https://rxnav.nlm.nih.gov/REST/
//   openFDA — https://api.fda.gov/drug/
// Funcționează offline parțial (cache localStorage).

const RXNORM_BASE = "https://rxnav.nlm.nih.gov/REST";
const SAVED_DRUGS_KEY = "mami:my-drugs";

// T7.A.4 — Brand-uri RO comune → INN (denumire internațională recunoscută de RxNorm).
// RxNorm cunoaște INN/brand-uri US dar nu pe cele RO; fără normalizare, căutarea
// returnează 0 rezultate pentru cele mai uzuale medicamente folosite de pacienții RO.
const RO_BRANDS: Record<string, string> = {
  nurofen: "Ibuprofen",
  paracetamol: "Acetaminophen",
  panadol: "Acetaminophen",
  algocalmin: "Metamizole",
  algozone: "Metamizole",
  aspenter: "Aspirin",
  aspirina: "Aspirin",
  cardioaspirina: "Aspirin",
  thrombo: "Aspirin",
  concor: "Bisoprolol",
  bisoprolol: "Bisoprolol",
  atoris: "Atorvastatin",
  sortis: "Atorvastatin",
  liprimar: "Atorvastatin",
  prestarium: "Perindopril",
  enap: "Enalapril",
  noliprel: "Perindopril",
  amlodipina: "Amlodipine",
  norvasc: "Amlodipine",
  metformin: "Metformin",
  siofor: "Metformin",
  glucophage: "Metformin",
  euthyrox: "Levothyroxine",
  letrox: "Levothyroxine",
  thyrozol: "Thiamazole",
  controloc: "Pantoprazole",
  nexium: "Esomeprazole",
  omez: "Omeprazole",
  helicid: "Omeprazole",
  ospamox: "Amoxicillin",
  augmentin: "Amoxicillin Clavulanate",
  amoksiklav: "Amoxicillin Clavulanate",
  klacid: "Clarithromycin",
  zinnat: "Cefuroxime",
  ciprinol: "Ciprofloxacin",
  azitromicina: "Azithromycin",
  sumamed: "Azithromycin",
  ibalgin: "Ibuprofen",
  diclofenac: "Diclofenac",
  voltaren: "Diclofenac",
  ketonal: "Ketoprofen",
  arcoxia: "Etoricoxib",
  no_spa: "Drotaverine",
  "no-spa": "Drotaverine",
  nospa: "Drotaverine",
  espumisan: "Simethicone",
  smecta: "Diosmectite",
  furosemid: "Furosemide",
  furosemide: "Furosemide",
  spironolactona: "Spironolactone",
  digoxin: "Digoxin",
  warfarin: "Warfarin",
  trombostop: "Acenocoumarol",
  sintrom: "Acenocoumarol",
  xarelto: "Rivaroxaban",
  eliquis: "Apixaban",
  pradaxa: "Dabigatran",
  clexane: "Enoxaparin",
};

function normalizeForRxNorm(input: string): {
  query: string;
  matched: boolean;
} {
  const key = input
    .toLowerCase()
    .trim()
    .replace(/\s+\d+\s*(mg|g|ml|mcg|µg)\b.*$/i, "")
    .replace(/\s+/g, "_");
  const inn = RO_BRANDS[key] ?? RO_BRANDS[key.replace(/_/g, "")];
  return inn ? { query: inn, matched: true } : { query: input, matched: false };
}

interface RxConcept {
  rxcui: string;
  name: string;
}

interface Interaction {
  drug1: string;
  drug2: string;
  description: string;
  severity: "mild" | "moderate" | "severe" | "unknown";
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
  .header-bar {
    background: var(--color-primary, #2e5c8a);
    color: #fff;
    padding: 0.75rem 1rem;
    flex-shrink: 0;
  }
  .header-bar h2 { margin: 0; font-size: 1.1rem; }
  .content { flex: 1; overflow-y: auto; padding: 1rem; }
  .card {
    background: var(--color-surface, #fff);
    border-radius: 10px;
    padding: 1rem;
    margin-bottom: 0.75rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.07);
  }
  .card h3 { margin: 0 0 0.5rem; font-size: 1rem; color: var(--color-primary, #2e5c8a); }
  .search-row { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; }
  .search-input {
    flex: 1;
    padding: 0.5rem 0.75rem;
    font-size: 1rem;
    border: 1.5px solid var(--color-primary, #2e5c8a);
    border-radius: 8px;
    min-height: 44px;
    font-family: inherit;
  }
  .btn {
    min-height: 44px;
    padding: 0.4rem 1rem;
    border-radius: 8px;
    font-size: 0.95rem;
    cursor: pointer;
    border: none;
    font-family: inherit;
  }
  .btn-primary { background: var(--color-primary, #2e5c8a); color: #fff; }
  .btn-primary:hover { filter: brightness(1.1); }
  .btn-danger { background: #c0392b; color: #fff; }
  .drug-tag {
    display: inline-flex; align-items: center; gap: 0.25rem;
    background: #e8f0f8; border-radius: 20px;
    padding: 0.25rem 0.75rem; margin: 0.2rem;
    font-size: 0.9rem; color: var(--color-primary, #2e5c8a);
  }
  .drug-tag button {
    background: none; border: none; cursor: pointer;
    color: #888; font-size: 1rem; padding: 0; line-height: 1;
  }
  .interaction-card {
    border-radius: 8px;
    padding: 0.75rem;
    margin-bottom: 0.5rem;
    border-left: 4px solid #ccc;
  }
  .interaction-card.severe { border-color: #c0392b; background: #fdf0f0; }
  .interaction-card.moderate { border-color: #e67e22; background: #fef9f0; }
  .interaction-card.mild { border-color: #27ae60; background: #f0faf3; }
  .interaction-card.unknown { border-color: #95a5a6; background: #f8f9fa; }
  .severity-badge {
    display: inline-block;
    padding: 0.15rem 0.5rem;
    border-radius: 10px;
    font-size: 0.78rem;
    font-weight: 600;
    margin-bottom: 0.35rem;
  }
  .severe .severity-badge { background: #c0392b; color: #fff; }
  .moderate .severity-badge { background: #e67e22; color: #fff; }
  .mild .severity-badge { background: #27ae60; color: #fff; }
  .unknown .severity-badge { background: #95a5a6; color: #fff; }
  .no-interactions { color: #27ae60; font-weight: 600; padding: 0.75rem 0; }
  .spinner {
    display: inline-block; width: 24px; height: 24px;
    border: 3px solid #dde3ed; border-top-color: var(--color-primary, #2e5c8a);
    border-radius: 50%; animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .disclaimer {
    font-size: 0.78rem;
    color: #888;
    padding: 0.5rem;
    border-radius: 6px;
    background: #fffbe6;
    margin-top: 0.5rem;
    border: 1px solid #f1c40f;
  }
  .suggestions {
    background: #fff;
    border: 1px solid #dde3ed;
    border-radius: 0 0 8px 8px;
    max-height: 150px;
    overflow-y: auto;
  }
  .suggestion-item {
    padding: 0.5rem 0.75rem;
    cursor: pointer;
    font-size: 0.95rem;
  }
  .suggestion-item:hover { background: #e8f0f8; }

  /* T7.A.4 — hint normalizare RO → INN */
  .ro-hint {
    background: #e8f4ff;
    border: 1px solid #bcd9f2;
    border-radius: 6px;
    padding: 0.4rem 0.6rem;
    margin-top: 0.4rem;
    font-size: 0.82rem;
    color: var(--color-primary, #2e5c8a);
  }
  .ro-hint b { font-weight: 600; }

  /* T7.A.5 — listă salvată (butoane + toast) */
  .my-list-row {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-top: 0.6rem;
  }
  .btn-secondary {
    background: var(--color-accent-light, #f5e6d8);
    color: var(--color-text, #1a1a2e);
    border: 1px solid var(--color-accent, #a05c2a);
  }
  .btn-secondary:hover { filter: brightness(1.05); }
  .toast {
    position: fixed;
    bottom: 1.5rem;
    left: 50%;
    transform: translateX(-50%);
    background: #2e5c8a;
    color: #fff;
    padding: 0.6rem 1.1rem;
    border-radius: 8px;
    font-size: 0.95rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    z-index: 1000;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s;
  }
  .toast.visible { opacity: 1; }
</style>

<div class="header-bar">
  <h2>💊 Verificare Medicamente</h2>
</div>
<div class="content">
  <div class="card">
    <h3>Adaugă medicamente pentru verificare</h3>
    <div class="search-row">
      <input class="search-input" type="text" id="drug-input"
        placeholder="Caută medicament (ex: Aspirin, Metformin...)"
        autocomplete="off" autocorrect="off" />
      <button class="btn btn-primary" id="add-btn">Adaugă</button>
    </div>
    <div id="suggestions" class="suggestions" style="display:none"></div>
    <div id="ro-hint" class="ro-hint" style="display:none"></div>
    <div id="drug-list" style="margin-top:0.5rem"></div>
    <div class="my-list-row">
      <button class="btn btn-secondary" id="save-list-btn" type="button" aria-label="Salvează lista mea de medicamente">💾 Salvează ca lista mea</button>
      <button class="btn btn-secondary" id="load-list-btn" type="button" aria-label="Restaurează lista mea de medicamente" style="display:none">📂 Lista mea</button>
    </div>
    <div class="disclaimer">
      ⚠️ Această funcție oferă informații generale din baze de date publice (RxNorm, openFDA).
      Nu înlocuiește sfatul medicului sau farmacistului. Consultați întotdeauna un specialist.
    </div>
  </div>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>

  <div class="card" id="interaction-card" style="display:none">
    <h3>Interacțiuni detectate</h3>
    <div id="interactions-content"></div>
  </div>

  <div class="card">
    <h3>Informații medicament</h3>
    <div id="drug-info">
      <p style="color:var(--color-text-muted);font-size:0.9rem">Selectează un medicament din lista de sus pentru informații detaliate.</p>
    </div>
  </div>
</div>
`;

export class MamiDrugChecker extends HTMLElement {
  private readonly _sr: ShadowRoot;
  private _drugs: RxConcept[] = [];
  private _searchTimeout: ReturnType<typeof setTimeout> | null = null;
  private _toastTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    super();
    this._sr = this.attachShadow({ mode: "open" });
    this._sr.appendChild(tmpl.content.cloneNode(true));
  }

  connectedCallback(): void {
    this._wire();
    this._restoreSavedListIfPresent();
  }

  private _wire(): void {
    const input = this._sr.querySelector(
      "#drug-input",
    ) as HTMLInputElement | null;
    const addBtn = this._sr.querySelector("#add-btn");

    input?.addEventListener("input", () => {
      if (this._searchTimeout) clearTimeout(this._searchTimeout);
      const q = input.value.trim();
      this._showRoHint(q);
      if (q.length < 3) {
        this._hideSuggestions();
        return;
      }
      this._searchTimeout = setTimeout(() => {
        void this._searchDrugs(q);
      }, 400);
    });

    input?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        void this._addCurrentInput();
      }
    });

    addBtn?.addEventListener("click", () => {
      void this._addCurrentInput();
    });

    this._sr.querySelector("#save-list-btn")?.addEventListener("click", () => {
      this._saveCurrentList();
    });
    this._sr.querySelector("#load-list-btn")?.addEventListener("click", () => {
      this._loadSavedList();
    });
  }

  private _showRoHint(input: string): void {
    const hint = this._sr.querySelector("#ro-hint") as HTMLElement | null;
    if (!hint) return;
    if (!input || input.length < 3) {
      hint.style.display = "none";
      return;
    }
    const norm = normalizeForRxNorm(input);
    if (norm.matched) {
      hint.style.display = "block";
      hint.replaceChildren();
      const prefix = document.createTextNode(
        "Căutăm sub denumirea internațională: ",
      );
      const b = document.createElement("b");
      b.textContent = norm.query;
      hint.appendChild(prefix);
      hint.appendChild(b);
    } else {
      hint.style.display = "none";
    }
  }

  private async _addCurrentInput(): Promise<void> {
    const input = this._sr.querySelector(
      "#drug-input",
    ) as HTMLInputElement | null;
    if (!input?.value.trim()) return;
    await this._searchAndAdd(input.value.trim());
    input.value = "";
    this._hideSuggestions();
  }

  private async _searchDrugs(query: string): Promise<void> {
    const effective = normalizeForRxNorm(query).query;
    try {
      const resp = await fetch(
        `${RXNORM_BASE}/drugs.json?name=${encodeURIComponent(effective)}`,
        { signal: AbortSignal.timeout(8000) },
      );
      if (!resp.ok) return;
      const data = (await resp.json()) as {
        drugGroup?: {
          conceptGroup?: Array<{ conceptProperties?: RxConcept[] }>;
        };
      };
      const concepts: RxConcept[] = [];
      for (const group of data.drugGroup?.conceptGroup ?? []) {
        for (const c of group.conceptProperties ?? []) {
          if (c.rxcui && c.name) concepts.push(c);
        }
      }
      this._showSuggestions(concepts.slice(0, 8));
    } catch {
      this._hideSuggestions();
    }
  }

  private _showSuggestions(concepts: RxConcept[]): void {
    const el = this._sr.querySelector("#suggestions") as HTMLElement | null;
    if (!el) return;
    if (concepts.length === 0) {
      el.style.display = "none";
      return;
    }
    el.innerHTML = concepts
      .map(
        (c) =>
          `<div class="suggestion-item" data-rxcui="${c.rxcui}" data-name="${c.name}">${c.name}</div>`,
      )
      .join("");
    el.style.display = "block";
    el.querySelectorAll(".suggestion-item").forEach((item) => {
      item.addEventListener("click", () => {
        const rxcui = (item as HTMLElement).dataset["rxcui"] ?? "";
        const name = (item as HTMLElement).dataset["name"] ?? "";
        this._addDrug({ rxcui, name });
        const input = this._sr.querySelector(
          "#drug-input",
        ) as HTMLInputElement | null;
        if (input) input.value = "";
        this._hideSuggestions();
      });
    });
  }

  private _hideSuggestions(): void {
    const el = this._sr.querySelector("#suggestions") as HTMLElement | null;
    if (el) el.style.display = "none";
  }

  private async _searchAndAdd(query: string): Promise<void> {
    const norm = normalizeForRxNorm(query);
    const display = norm.matched ? `${query} (${norm.query})` : query;
    try {
      const resp = await fetch(
        `${RXNORM_BASE}/rxcui.json?name=${encodeURIComponent(norm.query)}&search=1`,
        { signal: AbortSignal.timeout(8000) },
      );
      if (resp.ok) {
        const data = (await resp.json()) as {
          idGroup?: { rxnormId?: string[] };
        };
        const rxcui = data.idGroup?.rxnormId?.[0];
        if (rxcui) {
          this._addDrug({ rxcui, name: display });
          return;
        }
      }
    } catch {
      /* ignore */
    }
    // Fallback: add without rxcui
    this._addDrug({ rxcui: "", name: display });
  }

  private _addDrug(drug: RxConcept): void {
    if (
      this._drugs.some((d) => d.name.toLowerCase() === drug.name.toLowerCase())
    )
      return;
    if (this._drugs.length >= 10) {
      alert("Maximum 10 medicamente simultan.");
      return;
    }
    this._drugs.push(drug);
    this._renderDrugList();
    if (this._drugs.length >= 2) {
      void this._checkInteractions();
    }
  }

  private _removeDrug(name: string): void {
    this._drugs = this._drugs.filter((d) => d.name !== name);
    this._renderDrugList();
    if (this._drugs.length >= 2) {
      void this._checkInteractions();
    } else {
      const card = this._sr.querySelector(
        "#interaction-card",
      ) as HTMLElement | null;
      if (card) card.style.display = "none";
    }
  }

  private _renderDrugList(): void {
    const el = this._sr.querySelector("#drug-list");
    if (!el) return;
    if (this._drugs.length === 0) {
      el.innerHTML =
        '<span style="color:var(--color-text-muted);font-size:0.9rem">Niciun medicament adăugat</span>';
      return;
    }
    el.innerHTML = this._drugs
      .map(
        (d) =>
          `<span class="drug-tag">
        <span>${d.name}</span>
        <button data-name="${d.name}" aria-label="Elimină ${d.name}">✕</button>
      </span>`,
      )
      .join("");
    el.querySelectorAll("button[data-name]").forEach((btn) => {
      btn.addEventListener("click", () => {
        this._removeDrug((btn as HTMLElement).dataset["name"] ?? "");
      });
    });
  }

  private async _checkInteractions(): Promise<void> {
    const card = this._sr.querySelector(
      "#interaction-card",
    ) as HTMLElement | null;
    const content = this._sr.querySelector("#interactions-content");
    if (!card || !content) return;
    card.style.display = "block";
    content.innerHTML = '<div class="spinner"></div>';

    const interactions: Interaction[] = [];
    const rxcuis = this._drugs.filter((d) => d.rxcui).map((d) => d.rxcui);

    if (rxcuis.length >= 2) {
      try {
        const resp = await fetch(
          `${RXNORM_BASE}/interaction/list.json?rxcuis=${rxcuis.join("+")}`,
          { signal: AbortSignal.timeout(10000) },
        );
        if (resp.ok) {
          const data = (await resp.json()) as {
            fullInteractionTypeGroup?: Array<{
              fullInteractionType?: Array<{
                interactionPair?: Array<{
                  interactionConcept?: Array<{
                    minConceptItem?: { name?: string };
                  }>;
                  description?: string;
                  severity?: string;
                }>;
              }>;
            }>;
          };
          for (const group of data.fullInteractionTypeGroup ?? []) {
            for (const type of group.fullInteractionType ?? []) {
              for (const pair of type.interactionPair ?? []) {
                const names = (pair.interactionConcept ?? []).map(
                  (c) => c.minConceptItem?.name ?? "",
                );
                const sev = (pair.severity ?? "").toLowerCase();
                interactions.push({
                  drug1: names[0] ?? "Medicament 1",
                  drug2: names[1] ?? "Medicament 2",
                  description: pair.description ?? "Interacțiune detectată",
                  severity:
                    sev === "high"
                      ? "severe"
                      : sev === "moderate"
                        ? "moderate"
                        : sev === "low"
                          ? "mild"
                          : "unknown",
                });
              }
            }
          }
        }
      } catch {
        /* show empty result */
      }
    }

    if (interactions.length === 0) {
      content.innerHTML = `<div class="no-interactions">✅ Nu s-au detectat interacțiuni între medicamentele selectate.</div>
        <p style="font-size:0.85rem;color:#888">Notă: Lipsa interacțiunilor detectate nu garantează siguranța combinației. Consultați farmacistul.</p>`;
    } else {
      content.innerHTML = interactions
        .map(
          (i) => `
        <div class="interaction-card ${i.severity}">
          <div class="severity-badge">${i.severity === "severe" ? "❗ Severă" : i.severity === "moderate" ? "⚠️ Moderată" : i.severity === "mild" ? "ℹ️ Ușoară" : "? Necunoscută"}</div>
          <strong>${i.drug1} + ${i.drug2}</strong>
          <p style="margin:0.3rem 0 0;font-size:0.9rem">${i.description}</p>
        </div>
      `,
        )
        .join("");
    }
  }

  // T7.A.5 — Salvare listă permanentă în localStorage
  private _saveCurrentList(): void {
    if (this._drugs.length === 0) {
      this._showToast("Adaugă cel puțin un medicament înainte de salvare.");
      return;
    }
    try {
      localStorage.setItem(SAVED_DRUGS_KEY, JSON.stringify(this._drugs));
      this._showToast(`✓ Lista ta (${this._drugs.length}) a fost salvată.`);
      this._refreshLoadButtonVisibility();
    } catch (err) {
      console.warn(
        "[mami-drug] save failed:",
        err instanceof Error ? err.message : String(err),
      );
      this._showToast("Nu am putut salva lista.");
    }
  }

  private _readSavedList(): RxConcept[] | null {
    try {
      const raw = localStorage.getItem(SAVED_DRUGS_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as RxConcept[];
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
    } catch {
      return null;
    }
  }

  private _loadSavedList(): void {
    const saved = this._readSavedList();
    if (!saved) {
      this._showToast("Nu există listă salvată.");
      return;
    }
    this._drugs = saved.slice(0, 10);
    this._renderDrugList();
    if (this._drugs.length >= 2) void this._checkInteractions();
    this._showToast(`Lista ta (${this._drugs.length}) restaurată.`);
  }

  private _restoreSavedListIfPresent(): void {
    const saved = this._readSavedList();
    this._refreshLoadButtonVisibility();
    if (!saved || this._drugs.length > 0) return;
    this._drugs = saved.slice(0, 10);
    this._renderDrugList();
    this._showToast("Lista ta a fost restaurată.");
    if (this._drugs.length >= 2) void this._checkInteractions();
  }

  private _refreshLoadButtonVisibility(): void {
    const btn = this._sr.querySelector("#load-list-btn") as HTMLElement | null;
    if (btn) btn.style.display = this._readSavedList() ? "inline-flex" : "none";
  }

  private _showToast(message: string): void {
    const toast = this._sr.querySelector("#toast") as HTMLElement | null;
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("visible");
    if (this._toastTimer) clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.classList.remove("visible");
      this._toastTimer = null;
    }, 2400);
  }

  disconnectedCallback(): void {
    if (this._toastTimer) {
      clearTimeout(this._toastTimer);
      this._toastTimer = null;
    }
  }
}

customElements.define("mami-drug-checker", MamiDrugChecker);
