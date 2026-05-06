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

    const systemPrompt = `Ești asistent nutrițional în limba română. Generezi meniuri săptămânale echilibrate.
Constrângeri:
- Mese tradiționale românești și mediteraneene
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
}

customElements.define("mami-menu", MamiMenu);
