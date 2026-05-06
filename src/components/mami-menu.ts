// Generator meniu săptămânal — Faza 4.
// Folosește AI Gateway pentru generare meniu bazat pe rețetele din tab-uri.
// Persistă meniurile în localStorage via local-store.ts.

import { sendChat } from "../ai/client";
import { getDailyQuote } from "../data/quotes";
import {
  getMenu,
  listMenus,
  saveMenu,
  type MenuEntry,
} from "../data/local-store";

// T7.C.4 — Preferințe culinare (persistate localStorage)
interface MenuPrefs {
  vegetarian: boolean;
  noPork: boolean;
  noGluten: boolean;
  noLactose: boolean;
  diabetic: boolean;
  lowSodium: boolean;
  avoid: string;
  style: "mixt" | "mediteranean" | "simplu";
}

const PREFS_KEY = "mami:menu-prefs";

function readMenuPrefs(): MenuPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw)
      return {
        vegetarian: false,
        noPork: false,
        noGluten: false,
        noLactose: false,
        diabetic: false,
        lowSodium: false,
        avoid: "",
        style: "mixt",
      };
    return JSON.parse(raw) as MenuPrefs;
  } catch {
    return {
      vegetarian: false,
      noPork: false,
      noGluten: false,
      noLactose: false,
      diabetic: false,
      lowSodium: false,
      avoid: "",
      style: "mixt",
    };
  }
}

function writeMenuPrefs(prefs: MenuPrefs): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

const DAYS = [
  "Luni",
  "Marți",
  "Miercuri",
  "Joi",
  "Vineri",
  "Sâmbătă",
  "Duminică",
] as const;

interface DayMenu {
  breakfast: string;
  lunch: string;
  dinner: string;
  snack?: string;
}

function getWeekStart(date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = (day === 0 ? -6 : 1) - day; // Mon=start
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
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
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-shrink: 0;
  }
  .header-bar h2 { margin: 0; font-size: 1.1rem; flex: 1; }
  .btn {
    min-height: 44px;
    padding: 0.4rem 1rem;
    border-radius: 8px;
    font-size: 0.95rem;
    cursor: pointer;
    border: none;
    font-family: inherit;
  }
  .btn-white { background: rgba(255,255,255,0.2); color: #fff; }
  .btn-white:hover { background: rgba(255,255,255,0.35); }
  .btn-primary { background: var(--color-primary, #2e5c8a); color: #fff; }
  .btn-primary:hover { filter: brightness(1.1); }
  .btn-outline {
    background: transparent;
    color: var(--color-primary, #2e5c8a);
    border: 1.5px solid var(--color-primary, #2e5c8a);
  }
  .content { flex: 1; overflow-y: auto; padding: 1rem; }
  .quote-card {
    background: var(--color-surface, #fff);
    border-left: 4px solid var(--color-accent, #a05c2a);
    border-radius: 8px;
    padding: 0.75rem 1rem;
    margin-bottom: 1rem;
    font-style: italic;
    color: var(--color-text-muted, #555577);
    font-size: 0.9rem;
  }
  .week-nav {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  .week-label { flex: 1; text-align: center; font-weight: 600; font-size: 0.95rem; }
  .day-card {
    background: var(--color-surface, #fff);
    border-radius: 10px;
    padding: 0.75rem 1rem;
    margin-bottom: 0.75rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.07);
  }
  .day-title { font-weight: 700; color: var(--color-primary, #2e5c8a); margin-bottom: 0.5rem; }
  .meal-row { display: flex; gap: 0.5rem; margin-bottom: 0.25rem; font-size: 0.92rem; }
  .meal-label { font-weight: 600; min-width: 90px; color: var(--color-text-muted, #555577); }
  .meal-text { flex: 1; }
  .actions { display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap; }
  .generating { text-align: center; padding: 2rem; color: var(--color-text-muted); }
  .spinner {
    display: inline-block; width: 32px; height: 32px;
    border: 3px solid #dde3ed; border-top-color: var(--color-primary, #2e5c8a);
    border-radius: 50%; animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .empty-state { text-align: center; padding: 3rem 1rem; color: var(--color-text-muted); }
  .empty-state p { margin: 0.5rem 0; }
  .history-title { font-weight: 600; font-size: 0.9rem; color: var(--color-text-muted); margin: 1rem 0 0.5rem; }
  .history-item {
    background: var(--color-surface);
    border-radius: 8px;
    padding: 0.5rem 0.75rem;
    margin-bottom: 0.4rem;
    font-size: 0.9rem;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .history-item:hover { background: #e8f0f8; }
  .print-btn { background: #fff; color: var(--color-primary); border: 1.5px solid var(--color-primary); }

  /* T7.C.4 — Preferințe culinare expandabil */
  .prefs-toggle {
    background: var(--color-accent-light, #f5e6d8);
    color: var(--color-text, #1a1a2e);
    border: 1px solid var(--color-accent, #a05c2a);
    border-radius: 8px;
    padding: 0.5rem 0.9rem;
    cursor: pointer;
    min-height: 44px;
    font-size: 0.9rem;
    width: 100%;
    margin-bottom: 0.5rem;
    text-align: left;
  }
  .prefs-panel {
    background: var(--color-surface, #fff);
    border: 1px solid #e0e7ef;
    border-radius: 8px;
    padding: 0.75rem 1rem;
    margin-bottom: 1rem;
    display: none;
  }
  .prefs-panel.open { display: block; }
  .prefs-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.4rem 0.75rem;
    margin-bottom: 0.6rem;
  }
  .prefs-grid label {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.9rem;
    cursor: pointer;
    min-height: 44px;
  }
  .prefs-grid input[type="checkbox"] {
    min-width: 22px;
    min-height: 22px;
  }
  .prefs-row {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    margin-bottom: 0.5rem;
  }
  .prefs-row label { font-size: 0.85rem; color: var(--color-text-muted, #666); }
  .prefs-row input[type="text"], .prefs-row select {
    padding: 0.45rem 0.6rem;
    border: 1.5px solid var(--color-primary, #2e5c8a);
    border-radius: 6px;
    font-size: 0.95rem;
    min-height: 44px;
    font-family: inherit;
  }
</style>

<div class="header-bar">
  <h2>🍽️ Meniu Săptămânal</h2>
  <button class="btn btn-white" id="prev-btn" aria-label="Săptămâna anterioară">◀</button>
  <button class="btn btn-white" id="next-btn" aria-label="Săptămâna următoare">▶</button>
</div>
<div class="content">
  <div class="quote-card" id="quote-area"></div>
  <div class="week-nav">
    <span class="week-label" id="week-label">Săptămâna curentă</span>
  </div>
  <div class="actions">
    <button class="btn btn-primary" id="generate-btn">✨ Generează meniu AI</button>
    <button class="btn btn-outline print-btn" id="print-btn">🖨️ Printează</button>
    <button class="btn btn-outline print-btn" id="shopping-btn">🛒 Listă cumpărături</button>
  </div>
  <button class="prefs-toggle" type="button" id="prefs-toggle" aria-expanded="false">⚙️ Preferințele mele (atinge pentru a deschide)</button>
  <div class="prefs-panel" id="prefs-panel">
    <div class="prefs-grid">
      <label><input type="checkbox" id="pf-vegetarian"> Vegetarian</label>
      <label><input type="checkbox" id="pf-noPork"> Fără porc</label>
      <label><input type="checkbox" id="pf-noGluten"> Fără gluten</label>
      <label><input type="checkbox" id="pf-noLactose"> Fără lactate</label>
      <label><input type="checkbox" id="pf-diabetic"> Diabetic</label>
      <label><input type="checkbox" id="pf-lowSodium"> Hiposodat</label>
    </div>
    <div class="prefs-row">
      <label for="pf-avoid">Ingrediente de evitat</label>
      <input type="text" id="pf-avoid" placeholder="ex: nuci, ardei iute, fructe de mare">
    </div>
    <div class="prefs-row">
      <label for="pf-style">Stil culinar</label>
      <select id="pf-style">
        <option value="mixt">Tradițional românesc + mediteranean</option>
        <option value="mediteranean">Mediteranean</option>
        <option value="simplu">Simplu și rapid</option>
      </select>
    </div>
  </div>
  <div id="menu-content"></div>
  <div class="history-title" id="history-label" style="display:none">Meniuri anterioare</div>
  <div id="history-list"></div>
</div>
`;

export class MamiMenu extends HTMLElement {
  private readonly _sr: ShadowRoot;
  private _currentWeek: string = getWeekStart();
  private _generating = false;

  constructor() {
    super();
    this._sr = this.attachShadow({ mode: "open" });
    this._sr.appendChild(tmpl.content.cloneNode(true));
  }

  connectedCallback(): void {
    this._wire();
    this._showQuote();
    this._renderWeek();
    this._renderHistory();
  }

  private _wire(): void {
    this._sr.querySelector("#generate-btn")?.addEventListener("click", () => {
      void this._generateMenu();
    });
    this._sr.querySelector("#print-btn")?.addEventListener("click", () => {
      this._printMenu();
    });
    this._sr.querySelector("#shopping-btn")?.addEventListener("click", () => {
      void this._generateShoppingList();
    });
    this._sr.querySelector("#prev-btn")?.addEventListener("click", () => {
      const d = new Date(this._currentWeek);
      d.setDate(d.getDate() - 7);
      this._currentWeek = d.toISOString().slice(0, 10);
      this._renderWeek();
    });
    this._sr.querySelector("#next-btn")?.addEventListener("click", () => {
      const d = new Date(this._currentWeek);
      d.setDate(d.getDate() + 7);
      this._currentWeek = d.toISOString().slice(0, 10);
      this._renderWeek();
    });

    // T7.C.4 — Preferințe culinare
    this._loadPrefsUi();
    const toggle = this._sr.querySelector(
      "#prefs-toggle",
    ) as HTMLButtonElement | null;
    const panel = this._sr.querySelector("#prefs-panel") as HTMLElement | null;
    toggle?.addEventListener("click", () => {
      if (!panel) return;
      const open = panel.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    const inputs = [
      "pf-vegetarian",
      "pf-noPork",
      "pf-noGluten",
      "pf-noLactose",
      "pf-diabetic",
      "pf-lowSodium",
      "pf-avoid",
      "pf-style",
    ];
    for (const id of inputs) {
      const el = this._sr.querySelector(`#${id}`) as
        | HTMLInputElement
        | HTMLSelectElement
        | null;
      el?.addEventListener("change", () => this._savePrefsUi());
    }
  }

  private _loadPrefsUi(): void {
    const p = readMenuPrefs();
    const set = (id: string, value: boolean | string): void => {
      const el = this._sr.querySelector(`#${id}`) as
        | HTMLInputElement
        | HTMLSelectElement
        | null;
      if (!el) return;
      if (typeof value === "boolean") (el as HTMLInputElement).checked = value;
      else el.value = value;
    };
    set("pf-vegetarian", p.vegetarian);
    set("pf-noPork", p.noPork);
    set("pf-noGluten", p.noGluten);
    set("pf-noLactose", p.noLactose);
    set("pf-diabetic", p.diabetic);
    set("pf-lowSodium", p.lowSodium);
    set("pf-avoid", p.avoid);
    set("pf-style", p.style);
  }

  private _savePrefsUi(): void {
    const get = (id: string): HTMLInputElement | HTMLSelectElement | null =>
      this._sr.querySelector(`#${id}`) as
        | HTMLInputElement
        | HTMLSelectElement
        | null;
    const styleVal = (get("pf-style") as HTMLSelectElement | null)?.value;
    writeMenuPrefs({
      vegetarian: !!(get("pf-vegetarian") as HTMLInputElement | null)?.checked,
      noPork: !!(get("pf-noPork") as HTMLInputElement | null)?.checked,
      noGluten: !!(get("pf-noGluten") as HTMLInputElement | null)?.checked,
      noLactose: !!(get("pf-noLactose") as HTMLInputElement | null)?.checked,
      diabetic: !!(get("pf-diabetic") as HTMLInputElement | null)?.checked,
      lowSodium: !!(get("pf-lowSodium") as HTMLInputElement | null)?.checked,
      avoid: (get("pf-avoid") as HTMLInputElement | null)?.value ?? "",
      style:
        styleVal === "mediteranean" || styleVal === "simplu"
          ? styleVal
          : "mixt",
    });
  }

  private _showQuote(): void {
    const q = getDailyQuote();
    const el = this._sr.querySelector("#quote-area");
    if (!el) return;
    el.replaceChildren();
    el.appendChild(document.createTextNode(`"${q.text}" `));
    el.appendChild(document.createElement("br"));
    const small = document.createElement("small");
    small.textContent = `— ${q.author}`;
    el.appendChild(small);
  }

  private _renderWeek(): void {
    const weekLabel = this._sr.querySelector("#week-label");
    const d = new Date(this._currentWeek);
    const end = new Date(d);
    end.setDate(end.getDate() + 6);
    const fmt = (dt: Date): string =>
      dt.toLocaleDateString("ro-RO", { day: "numeric", month: "long" });
    if (weekLabel) weekLabel.textContent = `${fmt(d)} – ${fmt(end)}`;

    const saved = getMenu(this._currentWeek);
    const content = this._sr.querySelector("#menu-content");
    if (!content) return;

    if (saved) {
      content.innerHTML = this._renderMenuHtml(saved);
    } else {
      content.innerHTML = `<div class="empty-state">
        <p>Nu există meniu pentru această săptămână.</p>
        <p>Apasă <strong>Generează meniu AI</strong> pentru un meniu personalizat.</p>
      </div>`;
    }
  }

  private _renderMenuHtml(entry: MenuEntry): string {
    return DAYS.map((day) => {
      const m = (entry.menu[day] ?? {
        breakfast: "—",
        lunch: "—",
        dinner: "—",
      }) as DayMenu;
      return `<div class="day-card">
        <div class="day-title">${day}</div>
        <div class="meal-row"><span class="meal-label">☀️ Mic dejun</span><span class="meal-text">${m.breakfast}</span></div>
        <div class="meal-row"><span class="meal-label">🌿 Prânz</span><span class="meal-text">${m.lunch}</span></div>
        <div class="meal-row"><span class="meal-label">🌙 Cină</span><span class="meal-text">${m.dinner}</span></div>
        ${m.snack ? `<div class="meal-row"><span class="meal-label">🍎 Gustare</span><span class="meal-text">${m.snack}</span></div>` : ""}
      </div>`;
    }).join("");
  }

  private _renderHistory(): void {
    const all = listMenus()
      .filter((m) => m.weekStart !== this._currentWeek)
      .sort((a, b) => b.weekStart.localeCompare(a.weekStart))
      .slice(0, 4);

    const histLabel = this._sr.querySelector(
      "#history-label",
    ) as HTMLElement | null;
    const histList = this._sr.querySelector("#history-list");
    if (!histList) return;

    if (all.length === 0) {
      if (histLabel) histLabel.style.display = "none";
      histList.innerHTML = "";
      return;
    }

    if (histLabel) histLabel.style.display = "block";
    histList.innerHTML = all
      .map((m) => {
        const d = new Date(m.weekStart);
        const fmt = (dt: Date): string =>
          dt.toLocaleDateString("ro-RO", { day: "numeric", month: "short" });
        const end = new Date(d);
        end.setDate(end.getDate() + 6);
        return `<div class="history-item" data-week="${m.weekStart}">
        <span>${fmt(d)} – ${fmt(end)}</span>
        <small style="color:var(--color-text-muted)">${m.generatedBy === "ai" ? "✨ AI" : "✏️ Manual"}</small>
      </div>`;
      })
      .join("");

    histList.querySelectorAll(".history-item").forEach((el) => {
      el.addEventListener("click", () => {
        const week = (el as HTMLElement).dataset["week"];
        if (week) {
          this._currentWeek = week;
          this._renderWeek();
          this._renderHistory();
        }
      });
    });
  }

  private async _generateMenu(): Promise<void> {
    if (this._generating) return;
    this._generating = true;

    const content = this._sr.querySelector("#menu-content");
    if (content)
      content.innerHTML = `<div class="generating"><div class="spinner"></div><p>Generez meniu... câteva secunde</p></div>`;

    const prefs = readMenuPrefs();
    const constraints: string[] = [];
    if (prefs.vegetarian) constraints.push("- VEGETARIAN (fără carne)");
    if (prefs.noPork) constraints.push("- FĂRĂ carne de porc");
    if (prefs.noGluten)
      constraints.push("- FĂRĂ gluten (fără pâine, paste de grâu)");
    if (prefs.noLactose) constraints.push("- FĂRĂ lactate");
    if (prefs.diabetic)
      constraints.push(
        "- DIABETIC (fără zahăr adăugat, carbohidrați limitați)",
      );
    if (prefs.lowSodium) constraints.push("- HIPOSODAT (sare minimă)");
    if (prefs.avoid?.trim()) constraints.push(`- EVITĂ: ${prefs.avoid.trim()}`);
    const styleNote =
      prefs.style === "mediteranean"
        ? "Stil mediteranean dominant."
        : prefs.style === "simplu"
          ? "Mese simple și rapide (sub 20 min)."
          : "Mese tradiționale românești și mediteraneene mixte.";

    const systemPrompt = `Ești asistent nutrițional în limba română. Generezi meniuri săptămânale echilibrate.
Constrângeri obligatorii:
${constraints.length > 0 ? constraints.join("\n") : "- (fără restricții speciale)"}
Stil: ${styleNote}
- Echilibrate nutritiv (proteină, legume, carbohidrați complecși)
- Maxim 30 minute de preparare per masă
- Ușor digerabile, nu foarte picante
La rețete sau combinații despre care nu ai date sigure, evită să le incluzi.
Răspunde STRICT în format JSON valid, fără text în afara JSON-ului.`;

    const userMsg = `Generează un meniu săptămânal complet pentru zilele: Luni, Marți, Miercuri, Joi, Vineri, Sâmbătă, Duminică.
Format JSON exact (fără comentarii, fără text extra):
{
  "Luni": { "breakfast": "...", "lunch": "...", "dinner": "...", "snack": "..." },
  "Marți": { ... },
  "Miercuri": { ... },
  "Joi": { ... },
  "Vineri": { ... },
  "Sâmbătă": { ... },
  "Duminică": { ... }
}`;

    try {
      const response = await sendChat(
        [{ role: "user", content: userMsg }],
        systemPrompt,
      );

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("AI nu a returnat JSON valid");

      const menuData = JSON.parse(jsonMatch[0]) as Record<string, DayMenu>;

      const entry = saveMenu(this._currentWeek, menuData, "ai");
      if (content) content.innerHTML = this._renderMenuHtml(entry);
      this._renderHistory();
    } catch (err) {
      if (content)
        content.innerHTML = `<div class="empty-state">
        <p>❌ Nu am putut genera meniul.</p>
        <p style="font-size:0.85rem;color:#888">${err instanceof Error ? err.message : "Eroare necunoscută"}</p>
        <button class="btn btn-primary" id="retry-btn" style="margin-top:1rem">Încearcă din nou</button>
      </div>`;
      content?.querySelector("#retry-btn")?.addEventListener("click", () => {
        void this._generateMenu();
      });
    } finally {
      this._generating = false;
    }
  }

  private _printMenu(): void {
    const saved = getMenu(this._currentWeek);
    if (!saved) {
      alert("Nu există meniu de printat.");
      return;
    }

    const d = new Date(this._currentWeek);
    const end = new Date(d);
    end.setDate(end.getDate() + 6);
    const fmt = (dt: Date): string =>
      dt.toLocaleDateString("ro-RO", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

    const html = `<!DOCTYPE html><html lang="ro"><head>
<meta charset="UTF-8">
<title>Meniu Săptămânal</title>
<style>
  body { font-family: Georgia, serif; max-width: 700px; margin: 2rem auto; color: #1a1a2e; }
  h1 { color: #2e5c8a; text-align: center; }
  h2 { color: #2e5c8a; border-bottom: 2px solid #2e5c8a; padding-bottom: 0.3rem; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
  td { padding: 0.4rem 0.5rem; border: 1px solid #dde3ed; }
  td:first-child { font-weight: bold; width: 25%; }
  @media print { body { margin: 0; } }
</style></head><body>
<h1>Meniu Săptămânal</h1>
<p style="text-align:center;color:#888">${fmt(d)} – ${fmt(end)}</p>
${DAYS.map((day) => {
  const m = (saved.menu[day] ?? {
    breakfast: "—",
    lunch: "—",
    dinner: "—",
  }) as DayMenu;
  return `<h2>${day}</h2>
<table>
  <tr><td>Mic dejun</td><td>${m.breakfast}</td></tr>
  <tr><td>Prânz</td><td>${m.lunch}</td></tr>
  <tr><td>Cină</td><td>${m.dinner}</td></tr>
  ${m.snack ? `<tr><td>Gustare</td><td>${m.snack}</td></tr>` : ""}
</table>`;
}).join("")}
</body></html>`;

    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
      w.print();
    }
  }

  // T7.D.2 — Listă cumpărături generată din meniu
  private async _generateShoppingList(): Promise<void> {
    const entry = getMenu(this._currentWeek);
    if (!entry) {
      alert(
        'Nu există meniu pentru săptămâna asta. Apasă "Generează meniu AI" întâi.',
      );
      return;
    }
    const meals: string[] = [];
    for (const day of DAYS) {
      const m = entry.menu[day];
      if (m) {
        meals.push(m.breakfast, m.lunch, m.dinner);
        if (m.snack) meals.push(m.snack);
      }
    }
    const content = this._sr.querySelector("#menu-content");
    if (content)
      content.innerHTML = `<div class="generating"><div class="spinner"></div><p>Generez lista de cumpărături...</p></div>`;

    const systemPrompt = `Ești asistent culinar român. Extragi ingredientele necesare dintr-un meniu săptămânal.
Răspunde STRICT JSON valid (fără text extra), cu structura:
{
  "legume_fructe": ["..."],
  "carne_peste": ["..."],
  "lactate_oua": ["..."],
  "panificatie_paste": ["..."],
  "conserve_condimente": ["..."],
  "altele": ["..."]
}
Cantitățile aproximative pentru 1 persoană pentru o săptămână (ex: "2kg roșii", "10 ouă"). Limba română.`;

    const userMsg = `Meniu săptămânal:\n${meals.map((m) => `- ${m}`).join("\n")}\n\nGenerează lista grupată pe categorii.`;

    try {
      const response = await sendChat(
        [{ role: "user", content: userMsg }],
        systemPrompt,
      );
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("AI nu a returnat JSON valid");
      const list = JSON.parse(jsonMatch[0]) as Record<string, string[]>;
      this._showShoppingList(list);
    } catch (err) {
      if (content) {
        content.innerHTML = "";
        const p = document.createElement("p");
        p.textContent =
          "Nu am putut genera lista. " +
          (err instanceof Error ? err.message : String(err));
        content.appendChild(p);
      }
    }
  }

  private _showShoppingList(list: Record<string, string[]>): void {
    const content = this._sr.querySelector("#menu-content");
    if (!content) return;
    content.replaceChildren();
    const card = document.createElement("div");
    card.className = "day-card";
    const h = document.createElement("h3");
    h.textContent = "🛒 Lista de cumpărături";
    card.appendChild(h);

    const labels: Record<string, string> = {
      legume_fructe: "🥬 Legume & Fructe",
      carne_peste: "🍖 Carne & Pește",
      lactate_oua: "🥛 Lactate & Ouă",
      panificatie_paste: "🍞 Panificație & Paste",
      conserve_condimente: "🧂 Conserve & Condimente",
      altele: "📦 Altele",
    };
    for (const [cat, items] of Object.entries(list)) {
      if (!Array.isArray(items) || items.length === 0) continue;
      const section = document.createElement("div");
      section.style.marginTop = "0.75rem";
      const title = document.createElement("strong");
      title.textContent = labels[cat] ?? cat;
      title.style.display = "block";
      title.style.marginBottom = "0.3rem";
      section.appendChild(title);
      const ul = document.createElement("ul");
      ul.style.listStyle = "none";
      ul.style.padding = "0";
      ul.style.margin = "0";
      for (const item of items) {
        const li = document.createElement("li");
        li.style.padding = "0.3rem 0";
        li.style.display = "flex";
        li.style.alignItems = "center";
        li.style.gap = "0.5rem";
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.style.minWidth = "24px";
        cb.style.minHeight = "24px";
        cb.addEventListener("change", () => {
          li.style.textDecoration = cb.checked ? "line-through" : "none";
          li.style.opacity = cb.checked ? "0.5" : "1";
        });
        const text = document.createElement("span");
        text.textContent = item;
        li.appendChild(cb);
        li.appendChild(text);
        ul.appendChild(li);
      }
      section.appendChild(ul);
      card.appendChild(section);
    }
    content.appendChild(card);
  }
}

customElements.define("mami-menu", MamiMenu);
