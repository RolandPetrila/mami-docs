# RECOMANDĂRI ÎMBUNĂTĂȚIRI — Mami_Docs PWA

**Data analiză:** 2026-05-06  
**Model:** Claude Sonnet 4.6  
**Mod:** complet (inventar + existente + noi + tehnic)  
**Baza analiză:** cod sursă citit efectiv (12 componente + 5 module AI + 4 servicii + 2 workers)

---

## INVENTAR FUNCȚIONALITATE ACTUALĂ

Proiectul are **5 tab-uri active** și **12 Web Components** funcționale:

| Tab         | Funcții principale                                                  |
| ----------- | ------------------------------------------------------------------- |
| Chat AI     | Chat text + STT voce + TTS ascultare răspuns + salutări rotative    |
| Sănătate    | Hidratare + Vitale + Emoții + Somn + Patternuri 7z + PDF medical    |
| Galerie     | Upload + resize + IndexedDB + lightbox + soft-delete 30z            |
| Meniu       | Generator AI 7z×4mese + navigare săptămâni + print + istoric 4 săpt |
| Medicamente | Căutare RxNorm + interacțiuni openFDA + severitate                  |

**Infrastructură:** AI Gateway (8 fallback-uri), Keepalive Worker (4 cron-uri), Supabase, R2, ntfy+Telegram+CallMeBot, Lighthouse 94.

---

## PARTE I — ÎMBUNĂTĂȚIRI FUNCȚII EXISTENTE

---

### 1. `mami-chat.ts` — Persistența conversației între sesiuni

**Fișier:** `src/components/mami-chat.ts` — linia ~1 (template + connectedCallback)  
**Problema actuală:** Mesajele dispar complet la reload sau când mama schimbă tab-ul și revine. Conversația activă e în memorie (`this.messages: Message[]`), nicicând salvată. Mama pierde sfaturile primite, link-urile la rețete, etc.

**Îmbunătățire propusă:**

- La fiecare mesaj nou, salvează ultimele 50 mesaje în `localStorage["mami:chat-history"]`
- La `connectedCallback()`, restaurează istoricul și îl redă în DOM
- Buton discret "🗑️ Curăță" pentru ștergere voluntară (cu confirmare `confirm()`)

**Exemplu implementare:**

```typescript
// În interfața Message (deja există):
// interface Message { id, role, text, time }

const CHAT_HISTORY_KEY = "mami:chat-history";
const MAX_HISTORY = 50;

// Salvare după fiecare mesaj nou (în metoda care adaugă mesaj):
private saveHistory(): void {
  const toSave = this.messages.slice(-MAX_HISTORY);
  try {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(toSave));
  } catch { /* ignore quota errors */ }
}

// Restaurare în connectedCallback(), înainte de render:
private loadHistory(): void {
  try {
    const raw = localStorage.getItem(CHAT_HISTORY_KEY);
    if (raw) {
      this.messages = JSON.parse(raw) as Message[];
    }
  } catch {
    this.messages = [];
  }
}

// Buton "Curăță" în toolbar (lângă microfon):
private clearHistory(): void {
  if (!confirm("Ștergi toată conversația?")) return;
  this.messages = [];
  localStorage.removeItem(CHAT_HISTORY_KEY);
  this.renderMessages();
}
```

**Complexitate:** Mică | **Impact:** Mare

---

### 2. `mami-wellness.ts` — Ștergere intrări individuale

**Fișier:** `src/components/mami-wellness.ts` — linia ~130+ (secțiunile de history)  
**Problema actuală:** Utilizatorul poate **adăuga** date wellness dar nu le poate **șterge**. Dacă mama introduce tensiunea greșit (ex: 420/80 în loc de 120/80), intră în patternuri și PDF. Nu există mecanism de corecție.

**Îmbunătățire propusă:**

- Adaugă buton `✕` pe fiecare entry din history (vitale, hidratare, emoții)
- Click → `confirm("Ștergi această intrare?")` → șterge din localStorage
- Nu necesită redesign major — doar un icon mic pe fiecare `<li>`

**Exemplu implementare:**

```typescript
// În renderVitalsHistory(), pentru fiecare item:
private renderVitalsHistory(): void {
  const items = listVitals(5);
  const ul = this.shadow.querySelector<HTMLUListElement>("#vitals-history ul");
  if (!ul) return;
  ul.innerHTML = items.map(v => `
    <li style="display:flex; justify-content:space-between; align-items:center; gap:.5rem;">
      <span>${new Date(v.ts).toLocaleDateString("ro-RO")} — ${v.systolic}/${v.diastolic}${v.pulse ? ` · ${v.pulse} BPM` : ""}</span>
      <button
        class="delete-vitals-btn"
        data-id="${v.id}"
        style="background:none;border:none;cursor:pointer;color:#c0392b;font-size:1rem;min-height:44px;min-width:44px;"
        aria-label="Șterge această înregistrare"
      >✕</button>
    </li>
  `).join("");

  ul.querySelectorAll<HTMLButtonElement>(".delete-vitals-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("Ștergi această măsurătoare?")) return;
      const id = btn.dataset["id"]!;
      deleteVitals(id); // de adăugat în local-store.ts
      this.renderVitalsHistory();
    });
  });
}

// În local-store.ts — funcție nouă:
export function deleteVitals(id: string): void {
  const all = readArr<VitalsEntry>(KEY_VITALS).filter(v => v.id !== id);
  writeArr(KEY_VITALS, all);
}
// Similar: deleteHydration(), deleteEmotion(), deleteSleep()
```

**Complexitate:** Mică | **Impact:** Mare

---

### 3. `mami-wellness.ts` — Target hidratare cu progress bar

**Fișier:** `src/components/mami-wellness.ts` — linia ~103-111 (card hidratare)  
**Problema actuală:** Afișează "Total azi: X ml" ca text static. Nu există un obiectiv vizibil. Mama nu știe dacă e pe drumul cel bun sau nu.

**Îmbunătățire propusă:**

- Target default 2000ml, configurabil din setări wellness
- Progress bar colorată (verde ≥100%, galben 50-99%, roșu <50%)
- Procent afișat: "1250 ml din 2000 ml (63%)"

**Exemplu implementare:**

```typescript
// În template CSS (adaugă în stiluri existente):
`
.hydration-bar-wrap {
  margin-top: .5rem;
  background: #e0e7ef;
  border-radius: 999px;
  height: 12px;
  overflow: hidden;
}
.hydration-bar-fill {
  height: 100%;
  border-radius: 999px;
  transition: width .4s ease, background .3s;
}
.hydration-bar-fill.low    { background: #c0392b; }
.hydration-bar-fill.medium { background: #e67e22; }
.hydration-bar-fill.good   { background: #27ae60; }
`

// Înlocuiește render-ul de status:
private async renderHydrationStatus(): Promise<void> {
  const target = parseInt(localStorage.getItem("mami:hydration-target") ?? "2000");
  const today = await getHydrationToday();
  const pct = Math.min(100, Math.round((today / target) * 100));
  const cls = pct >= 100 ? "good" : pct >= 50 ? "medium" : "low";

  const status = this.shadow.querySelector<HTMLParagraphElement>("#water-status");
  if (status) {
    status.innerHTML = `
      <span>${today} ml din ${target} ml (${pct}%)</span>
      <div class="hydration-bar-wrap">
        <div class="hydration-bar-fill ${cls}" style="width:${pct}%"></div>
      </div>
    `;
  }
}
```

**Complexitate:** Mică | **Impact:** Mediu

---

### 4. `mami-wellness.ts` — Sparkline trend 7 zile

**Fișier:** `src/components/mami-wellness.ts` — secțiunea pattern detection  
**Problema actuală:** Pattern detection afișează text-alerturi ("hidratare scăzută în 3+ zile"), dar nu arată evoluția. Mama nu vede trendul vizual.

**Îmbunătățire propusă:**

- SVG sparkline inline (fără librărie) pentru hidratare ultimele 7 zile
- Puncte colorate pe curbă: verde=ok, roșu=sub target
- Dimensiune mică (120×40px) — doar indicație vizuală

**Exemplu implementare:**

```typescript
function renderSparkline(
  values: number[],
  target: number,
  width = 120,
  height = 40,
): string {
  if (values.length < 2) return "";
  const max = Math.max(...values, target) * 1.1;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - (v / max) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const circles = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - (v / max) * height;
      const color = v >= target ? "#27ae60" : "#c0392b";
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="${color}"/>`;
    })
    .join("");
  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="overflow:visible">
      <polyline points="${pts}" fill="none" stroke="#2e5c8a" stroke-width="1.5" opacity=".6"/>
      ${circles}
    </svg>
  `;
}

// Folosire în renderul card-ului hidratare, după status:
const last7 = listHydration(7).reduce<Record<string, number>>((acc, e) => {
  const day = e.ts.slice(0, 10);
  acc[day] = (acc[day] ?? 0) + e.amount_ml;
  return acc;
}, {});
const vals = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (6 - i));
  return last7[d.toISOString().slice(0, 10)] ?? 0;
});
sparklineDiv.innerHTML = renderSparkline(vals, 2000);
```

**Complexitate:** Medie | **Impact:** Mediu

---

### 5. `mami-drug-checker.ts` — Denumiri românești medicamente

**Fișier:** `src/components/mami-drug-checker.ts` — linia ~7 (constante) + funcția de căutare  
**Problema actuală:** RxNorm API funcționează cu denumiri INN (internaționale) și brand-uri americane. Mama va căuta "Nurofen", "Aspenter", "Concor", "Atoris", "Prenessa" — zero rezultate. Asta face tab-ul inutilizabil pentru ea.

**Îmbunătățire propusă:**

- Dicționar local `RO_BRANDS` cu top 30 medicamente comune în România → INN
- Normalizare input: dacă inputul match-uiește un brand RO, înlocuiește cu INN înainte de căutare API
- Afișare "Căutăm sub denumirea internaţională: Ibuprofen" pentru transparență

**Exemplu implementare:**

```typescript
// La începutul fișierului, înainte de template:
const RO_BRANDS: Record<string, string> = {
  nurofen: "Ibuprofen",
  ibufen: "Ibuprofen",
  paduden: "Ibuprofen",
  aspenter: "Aspirin",
  cardioaspirin: "Aspirin",
  aspirin: "Aspirin",
  concor: "Bisoprolol",
  bisoprolol: "Bisoprolol",
  atoris: "Atorvastatin",
  sortis: "Atorvastatin",
  lipitor: "Atorvastatin",
  prenessa: "Perindopril",
  coversyl: "Perindopril",
  egilok: "Metoprolol",
  betaloc: "Metoprolol",
  glucophage: "Metformin",
  siofor: "Metformin",
  amlodipina: "Amlodipine",
  norvasc: "Amlodipine",
  tritace: "Ramipril",
  ampril: "Ramipril",
  enap: "Enalapril",
  berlipril: "Enalapril",
  omeprazol: "Omeprazole",
  losec: "Omeprazole",
  nolpaza: "Pantoprazole",
  controloc: "Pantoprazole",
  xanax: "Alprazolam",
  diazepam: "Diazepam",
  seduxen: "Diazepam",
  furosemid: "Furosemide",
  lasix: "Furosemide",
  paracetamol: "Acetaminophen",
  tylenol: "Acetaminophen",
  panadol: "Acetaminophen",
  algocalmin: "Metamizole",
  novalgin: "Metamizole",
  ketonal: "Ketoprofen",
  profenid: "Ketoprofen",
  zinnat: "Cefuroxime",
  augmentin: "Amoxicillin-Clavulanate",
};

function normalizeForRxNorm(input: string): {
  query: string;
  wasNormalized: boolean;
  originalBrand: string;
} {
  const lower = input.toLowerCase().trim();
  const inn = RO_BRANDS[lower];
  if (inn) return { query: inn, wasNormalized: true, originalBrand: input };
  return { query: input, wasNormalized: false, originalBrand: input };
}

// În funcția de căutare, înlocuiești căutarea directă cu normalizarea:
async function searchRxNorm(rawInput: string): Promise<RxConcept[]> {
  const { query, wasNormalized, originalBrand } = normalizeForRxNorm(rawInput);
  if (wasNormalized) {
    // Afișează mesaj de normalizare în UI
    showNormalizationHint(
      `"${originalBrand}" → căutăm sub denumirea internațională: "${query}"`,
    );
  }
  const url = `${RXNORM_BASE}/drugs.json?name=${encodeURIComponent(query)}`;
  // ... rest of existing fetch logic
}
```

**Complexitate:** Mică | **Impact:** Maxim (face tab-ul utilizabil pentru mama)

---

### 6. `mami-drug-checker.ts` — Salvare listă permanentă medicamente personale

**Fișier:** `src/components/mami-drug-checker.ts` — secțiunea de tags  
**Problema actuală:** Lista de medicamente se resetează la fiecare sesiune. Mama are 8 medicamente zilnice și le re-adaugă de fiecare dată. Frustrant și descurajant.

**Îmbunătățire propusă:**

- Buton "💾 Salvează ca lista mea" sub lista de tag-uri
- La deschidere tab: restaurează automat lista salvată + afișează mesaj "Lista ta a fost restaurată"
- Buton "Resetează" pentru ștergere voluntară

**Exemplu implementare:**

```typescript
const MY_DRUGS_KEY = "mami:my-drugs";

interface SavedDrug {
  rxcui: string;
  name: string;
}

function loadMyDrugs(): SavedDrug[] {
  try {
    const raw = localStorage.getItem(MY_DRUGS_KEY);
    return raw ? (JSON.parse(raw) as SavedDrug[]) : [];
  } catch {
    return [];
  }
}

function saveMyDrugs(drugs: SavedDrug[]): void {
  localStorage.setItem(MY_DRUGS_KEY, JSON.stringify(drugs));
}

// În connectedCallback(), după render:
const saved = loadMyDrugs();
if (saved.length > 0) {
  this.selectedDrugs = saved;
  this.renderDrugTags();
  this.showToast(
    `Lista ta cu ${saved.length} medicamente a fost restaurată 💊`,
  );
  void this.checkInteractions();
}

// Buton "Salvează ca lista mea":
saveBtnEl.addEventListener("click", () => {
  saveMyDrugs(
    this.selectedDrugs.map((d) => ({ rxcui: d.rxcui, name: d.name })),
  );
  this.showToast("Lista a fost salvată ✅");
});
```

**Complexitate:** Mică | **Impact:** Mare

---

### 7. `mami-menu.ts` — Preferințe culinare și restricții alimentare

**Fișier:** `src/components/mami-menu.ts` — linia ~1 + funcția de generare prompt  
**Problema actuală:** AI generează meniu generic fără să știe nimic despre mama. Dacă mama are diabet, nu mănâncă porc, preferă gătit simplu, sau are intoleranță la lactoze, meniul AI e complet irelevant.

**Îmbunătățire propusă:**

- Secțiune expandabilă "⚙️ Preferințele mele" în tab meniu
- Checkboxes: vegetarian, fără porc, fără gluten, fără lactate, dietă diabetică, dietă hiposodată
- Input text liber: "Ingrediente de evitat" (ex: "ceapă crudă, ouă")
- Input: "Stil gătit preferat" (dropdown: tradițional românesc / mediteranean / simplu rapid)
- Toate salvate în localStorage, incluse în promptul AI la generare

**Exemplu implementare:**

```typescript
const MENU_PREFS_KEY = "mami:menu-prefs";

interface MenuPrefs {
  vegetarian: boolean;
  noPorc: boolean;
  noGluten: boolean;
  noLactate: boolean;
  diabetic: boolean;
  lowSodium: boolean;
  avoid: string;
  style: "traditional" | "mediterranean" | "simple";
}

function loadMenuPrefs(): MenuPrefs {
  try {
    const raw = localStorage.getItem(MENU_PREFS_KEY);
    return raw
      ? (JSON.parse(raw) as MenuPrefs)
      : {
          vegetarian: false,
          noPorc: false,
          noGluten: false,
          noLactate: false,
          diabetic: false,
          lowSodium: false,
          avoid: "",
          style: "traditional",
        };
  } catch {
    return {
      vegetarian: false,
      noPorc: false,
      noGluten: false,
      noLactate: false,
      diabetic: false,
      lowSodium: false,
      avoid: "",
      style: "traditional",
    };
  }
}

function buildMenuPrompt(prefs: MenuPrefs): string {
  const restrictions: string[] = [];
  if (prefs.vegetarian) restrictions.push("meniu vegetarian (fără carne)");
  if (prefs.noPorc) restrictions.push("fără carne de porc");
  if (prefs.noGluten) restrictions.push("fără gluten");
  if (prefs.noLactate) restrictions.push("fără lactate");
  if (prefs.diabetic)
    restrictions.push(
      "adecvat pentru diabetici (indice glicemic scăzut, fără zahăr adăugat)",
    );
  if (prefs.lowSodium) restrictions.push("hiposodat (puțină sare)");
  if (prefs.avoid) restrictions.push(`evită: ${prefs.avoid}`);

  const styleLabel =
    prefs.style === "traditional"
      ? "bucătărie tradițională românească"
      : prefs.style === "mediterranean"
        ? "bucătărie mediteraneană"
        : "rețete simple, gătit rapid max 30 min";

  return `Generează un meniu săptămânal complet (Luni-Duminică) cu 4 mese/zi (mic dejun, prânz, cină, gustare).
Stil: ${styleLabel}.
${restrictions.length > 0 ? `Restricții obligatorii: ${restrictions.join("; ")}.` : ""}
Preparatele trebuie să fie ușor de gătit de o persoană de ~60 ani, accesibile în România.
Returnează EXCLUSIV JSON valid cu structura: {"Luni":{"breakfast":"","lunch":"","dinner":"","snack":""},...}`;
}
```

**Complexitate:** Medie | **Impact:** Mare

---

### 8. `system-prompts.ts` — Prompts specializate per tab

**Fișier:** `src/ai/system-prompts.ts` — linia 7 (obiectul PROMPTS)  
**Problema actuală:** Obiectul `PROMPTS` conține DOAR prompt-ul pentru `chat`. Toate celelalte tab-uri (wellness, gallery, menu, medicamente) primesc un prompt generic: "Te afli în secțiunea X. Răspunzi în română." Aceasta înseamnă că AI-ul nu știe contextul specific al fiecărui tab și nu poate fi proactiv relevant.

**Îmbunătățire propusă:**

- Adaugă prompts specializate pentru `wellness`, `menu`, `medicamente`, `gallery`
- Fiecare prompt include: rolul AI în acel context, ce date cunoaște, ce poate ajuta, disclaimer-ul obligatoriu

**Exemplu implementare:**

```typescript
export const PROMPTS: Record<TabId, string> = {
  chat: `Ești Mami AI, asistentul personal și prietenul virtual al mamei, o femeie de ~60 ani din România.
Răspunzi EXCLUSIV în română, prietenos, cald și concis.
Ajuți cu orice întrebare de zi cu zi: sfaturi practice, informații generale, conversație plăcută.
Ești răbdătoare, înțelegătoare și pozitivă.
Dacă întrebarea necesită specialist (medic, avocat, inginer), spune-o și îndrumă spre profesioniști.
Tonul e ca al unui prieten apropiat de familie.`,

  wellness: `Ești Mami AI, asistentul de sănătate personal al mamei (~60 ani, România).
Ajuți la interpretarea datelor de sănătate înregistrate: hidratare, tensiune arterială, somn, stare emoțională.
Poți oferi sfaturi generale de wellness: hidratare optimă, importanța somnului, tehnici de relaxare, alimentație sănătoasă.
OBLIGATORIU la orice subiect medical: include "⚠️ Aceasta este o informație generală, nu o consultație medicală. Consultă medicul tău pentru diagnostic și tratament."
Nu pune diagnostice. Nu recomanda medicamente sau doze.
Tonul: cald, încurajator, pozitiv.`,

  menu: `Ești Mami AI, asistentul culinar al mamei (~60 ani, România).
Ajuți cu: generarea de meniuri săptămânale, rețete tradiționale românești, sfaturi de nutriție pentru vârsta a treia.
Când sugerezi meniuri: preparate simple (max 30 min gătit), ingrediente ușor de găsit în România, porții adecvate.
Poți sugera variante mai sănătoase ale preparatelor tradiționale.
Răspunzi EXCLUSIV în română, cu termeni culinari românești.`,

  medicamente: `Ești Mami AI, asistentul de informare despre medicamente al mamei (~60 ani, România).
Ajuți la: înțelegerea denumirilor medicamentelor, informații generale despre ce tratează un medicament, cum se ia un medicament (înainte/după masă, cu apă, etc.).
OBLIGATORIU MEREU: "⚠️ Informații generale — nu înlocuiesc sfatul medicului sau farmacistului. Consultă întotdeauna medicul tău înainte de a modifica tratamentul."
Nu recomanda medicamente noi. Nu sfătui schimbarea dozei.
Cunoști denumirile românești comune (Nurofen=Ibuprofen, Aspenter=Aspirin, Concor=Bisoprolol etc.).`,

  gallery: `Ești Mami AI, asistentul pentru organizarea amintirilor mamei (~60 ani, România).
Ajuți cu: sugestii pentru organizarea fotografiilor, idei de caption-uri, sfaturi pentru fotografii mai reușite pe telefon.
Tonul: cald, nostalgic, apreciativ față de amintirile de familie.
Răspunzi EXCLUSIV în română.`,
};
```

**Complexitate:** Mică | **Impact:** Mare (AI relevant în toate tab-urile, nu generic)

---

### 9. `mami-gallery.ts` — Editare caption după upload

**Fișier:** `src/components/mami-gallery.ts` — linia ~50+ (photo-card template)  
**Problema actuală:** Caption-ul se introduce la upload și nu mai poate fi modificat. Dacă mama uită să scrie, sau vrea să corecteze, nu poate.

**Îmbunătățire propusă:**

- Long-press (500ms) sau dublu-tap pe o poză → modal cu caption editabil
- Modal: input text pre-populated + buton "Salvează" + buton "Anulează"
- Actualizare în `localStorage` metadata

**Exemplu implementare:**

```typescript
// În renderGrid(), pe fiecare photo-card:
card.addEventListener("dblclick", (e) => {
  e.stopPropagation();
  void this.openCaptionEdit(photo.id, photo.caption);
});

// Long-press:
let pressTimer: number;
card.addEventListener("pointerdown", () => {
  pressTimer = window.setTimeout(() => void this.openCaptionEdit(photo.id, photo.caption), 500);
});
card.addEventListener("pointerup", () => clearTimeout(pressTimer));
card.addEventListener("pointermove", () => clearTimeout(pressTimer));

// Modal de editare:
private async openCaptionEdit(photoId: string, currentCaption: string): Promise<void> {
  const newCaption = prompt("Modifică descrierea fotografiei:", currentCaption);
  if (newCaption === null) return; // anulat
  await updatePhotoCaption(photoId, newCaption.trim()); // de adăugat în local-store.ts
  this.showToast("Descriere salvată ✅");
  void this.loadPhotos();
}

// În local-store.ts:
export function updatePhotoCaption(id: string, caption: string): void {
  const all = readArr<PhotoEntry>(KEY_PHOTOS);
  const idx = all.findIndex(p => p.id === id);
  if (idx !== -1 && all[idx]) {
    all[idx] = { ...all[idx]!, caption };
    writeArr(KEY_PHOTOS, all);
  }
}
```

**Complexitate:** Mică | **Impact:** Mediu

---

### 10. `mami-doc-viewer.ts` — Bibliotecă persistentă documente

**Fișier:** `src/components/mami-doc-viewer.ts` — linia ~1-50 (drop-zone + upload)  
**Problema actuală:** mami-doc-viewer funcționează ca viewer one-shot: uploadezi un document, îl vizualizezi, la reload dispare. Nu există o bibliotecă de documente salvate. Mama trebuie să re-uploadeze același document de fiecare dată.

**Îmbunătățire propusă:**

- Salvare document (text extras + metadata) în `IndexedDB` la prima deschidere
- Panoul lateral "📚 Documentele mele" cu lista documentelor salvate
- Click pe un document din listă → îl deschide direct (fără re-upload)
- Buton "✕" pentru ștergere document din bibliotecă
- Categorii opționale: Medical, Rețete, Acte, Altele

**Exemplu implementare:**

```typescript
// Schema IndexedDB pentru documente (completare la doc-index.ts existent):
interface SavedDocument {
  id: string;
  name: string;
  type: "docx" | "pdf" | "md" | "xlsx";
  savedAt: string;
  category: "medical" | "retete" | "acte" | "altele";
  blobSize: number;
  // Blob-ul efectiv se salvează separat în IDB ObjectStore "doc-blobs"
}

// Funcții noi în photo-blob-store.ts sau doc-blob-store.ts nou:
async function saveDocBlob(id: string, file: File): Promise<void> {
  const db = await openDocDB();
  await db.put("doc-blobs", { id, blob: file });
}
async function getDocBlob(id: string): Promise<Blob | null> {
  const db = await openDocDB();
  const row = await db.get("doc-blobs", id);
  return row?.blob ?? null;
}

// În mami-doc-viewer.ts, după render document reușit:
private async saveToLibrary(file: File): Promise<void> {
  const id = `doc_${Date.now().toString(36)}`;
  await saveDocBlob(id, file);
  const saved: SavedDocument = {
    id, name: file.name,
    type: this.detectType(file.name),
    savedAt: new Date().toISOString(),
    category: "altele",
    blobSize: file.size,
  };
  const all = readArr<SavedDocument>("mami:saved-docs");
  all.push(saved);
  writeArr("mami:saved-docs", all);
}

// Panel stânga cu lista documentelor:
private renderDocLibrary(): string {
  const docs = readArr<SavedDocument>("mami:saved-docs");
  if (docs.length === 0) return "";
  return `
    <div class="doc-library">
      <h3>📚 Documentele mele</h3>
      ${docs.map(d => `
        <button class="doc-lib-item" data-id="${d.id}">
          📄 ${d.name}
          <span class="doc-date">${new Date(d.savedAt).toLocaleDateString("ro-RO")}</span>
        </button>
      `).join("")}
    </div>
  `;
}
```

**Complexitate:** Mare | **Impact:** Maxim (transformă doc-viewer dintr-un viewer one-shot în o bibliotecă reală)

---

### 11. `mami-tabs.ts` — Tranziție animată la schimbarea tab-ului

**Fișier:** `src/components/mami-tabs.ts` — linia ~100+ (secțiunea content switching)  
**Problema actuală:** Schimbarea de tab e instantanee și bruscă. Feedback vizual slab — mama poate crede că nu s-a schimbat nimic.

**Îmbunătățire propusă:**

- CSS fade-in (opacity 0→1, 200ms) pe content area la fiecare switch
- Respectă `prefers-reduced-motion` (fără animație dacă sistemul o cere)

**Exemplu implementare:**

```css
/* Adaugă în stilurile din mami-tabs.ts template: */
.tab-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  /* animație fade: */
  animation: tabFadeIn 0.2s ease-out;
}
@keyframes tabFadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@media (prefers-reduced-motion: reduce) {
  .tab-content {
    animation: none;
  }
}
```

```typescript
// În metoda switchTab(id):
private switchTab(id: TabId): void {
  // ... logica existentă ...
  // La final, re-triggerează animația:
  const content = this.shadow.querySelector<HTMLElement>(".tab-content");
  if (content) {
    content.style.animation = "none";
    content.offsetHeight; // reflow trigger
    content.style.animation = "";
  }
}
```

**Complexitate:** Mică | **Impact:** Mediu (UX mai clar pentru utilizator vârstnic)

---

### 12. `index.html` — Loading skeleton vizibil

**Fișier:** `index.html` — linia 17 (div#app)  
**Problema actuală:** La prima încărcare (sau după cache miss), `#app` rămâne gol 1-3 secunde până se hidratează Web Components. Mama vede o pagină albă și poate crede că app-ul nu funcționează.

**Îmbunătățire propusă:**

- Skeleton HTML static direct în `#app` — vizibil imediat, înlocuit de componente când se hidratează
- Skeleton: header fake + 3 placeholder cards

**Exemplu implementare:**

```html
<!-- index.html — înlocuiește <div id="app"></div> cu: -->
<div id="app">
  <!-- Skeleton loader — înlocuit automat când Web Components se hidratează -->
  <div
    id="skeleton"
    style="display:flex;flex-direction:column;height:100dvh;background:#eef4fa;"
  >
    <div
      style="height:56px;background:#2e5c8a;flex-shrink:0;display:flex;align-items:center;padding:0 1rem;gap:.75rem;"
    >
      <div
        style="width:32px;height:32px;background:rgba(255,255,255,.25);border-radius:6px;"
      ></div>
      <div
        style="flex:1;height:18px;background:rgba(255,255,255,.3);border-radius:4px;max-width:140px;"
      ></div>
    </div>
    <div
      style="flex:1;padding:1rem;display:flex;flex-direction:column;gap:1rem;overflow:hidden;"
    >
      <div
        style="height:80px;background:#fff;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,.05);"
      ></div>
      <div
        style="height:120px;background:#fff;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,.05);"
      ></div>
      <div
        style="height:80px;background:#fff;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,.05);"
      ></div>
    </div>
  </div>
</div>
```

```typescript
// În main.ts, după ce componentele se definesc (după primul val ric):
// Ascunde skeleton-ul când mami-tabs e gata:
document.addEventListener("mami-tabs-ready", () => {
  document.getElementById("skeleton")?.remove();
});
// Fallback după 3 secunde:
setTimeout(() => document.getElementById("skeleton")?.remove(), 3000);
```

**Complexitate:** Mică | **Impact:** Mare (first impression critic pentru utilizator vârstnic)

---

### 13. `mami-settings.ts` — Control dimensiune text (font size)

**Fișier:** `src/components/mami-settings.ts` — linia ~100+ (modal settings)  
**Problema actuală:** Nu există control font size. Mama (~60 ani) poate avea nevoie de text mai mare. Accesibilitate majoră. WCAG 1.4.4 cere zoom până la 200% fără pierdere conținut.

**Îmbunătățire propusă:**

- Slider "Dimensiune text" în settings: Normal (100%) / Mare (125%) / Foarte mare (150%)
- Modifică `--font-base` CSS variable pe `<html>`
- Se salvează în localStorage și se aplică imediat la startup (ca dark mode)

**Exemplu implementare:**

```typescript
const STORAGE_FONT_SIZE = "mami-font-size"; // "1" | "1.25" | "1.5"

// În main.ts (lângă dark mode restore, înainte de paint):
const savedFont = localStorage.getItem("mami-font-size");
if (savedFont) {
  document.documentElement.style.setProperty(
    "--font-base",
    `${parseFloat(savedFont) * 18}px`,
  );
}

// În settings template, adaugă după slider volum:
`<div class="setting-row">
  <label>Dimensiune text</label>
  <div class="font-size-btns">
    <button class="font-btn" data-size="1" aria-label="Text normal">A</button>
    <button class="font-btn" data-size="1.25" aria-label="Text mare" style="font-size:1.2em">A</button>
    <button class="font-btn" data-size="1.5" aria-label="Text foarte mare" style="font-size:1.4em">A</button>
  </div>
</div>`;

// Handler:
this.shadow.querySelectorAll<HTMLButtonElement>(".font-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const size = parseFloat(btn.dataset["size"] ?? "1");
    const px = size * 18;
    document.documentElement.style.setProperty("--font-base", `${px}px`);
    localStorage.setItem(STORAGE_FONT_SIZE, String(size));
    this.updateFontSizeBtns(size);
  });
});
```

**Complexitate:** Mică | **Impact:** Maxim (accesibilitate critică pentru utilizator vârstnic)

---

### 14. `notifications.ts` — Remindere medicament configurabile

**Fișier:** `src/services/notifications.ts` — linia ~118 (hydration reminder)  
**Problema actuală:** Există DOAR reminder de hidratare (la 2 ore fix). Nu există reminder de medicament. Acesta este probabil cel mai critic feature pentru mama — persoană de ~60 ani cu tratament cronic. Reminder-ul de hidratare e hard-coded la interval, fără UI de configurare.

**Îmbunătățire propusă:**

- Sistem generic de remindere: `MedReminder { id, name, time (HH:MM), days[], enabled }`
- UI în settings sau tab wellness: adaugă reminder (icon + ora + zile săptămână)
- Funcționare via `setTimeout` calculat la diferența față de ora curentă
- Persistență în localStorage
- Notificare: local Notification API + ntfy opțional

**Exemplu implementare:**

```typescript
// notifications.ts — adaugă:
export interface MedReminder {
  id: string;
  name: string; // ex: "Concor 5mg"
  time: string; // "HH:MM" — ora zilei
  days: number[]; // [0-6] — 0=Duminică, ziua săptămânii
  enabled: boolean;
}

const MED_REMINDERS_KEY = "mami:med-reminders";
const reminderTimers = new Map<string, number>();

export function loadMedReminders(): MedReminder[] {
  try {
    return JSON.parse(
      localStorage.getItem(MED_REMINDERS_KEY) ?? "[]",
    ) as MedReminder[];
  } catch {
    return [];
  }
}

export function saveMedReminder(r: MedReminder): void {
  const all = loadMedReminders().filter((x) => x.id !== r.id);
  all.push(r);
  localStorage.setItem(MED_REMINDERS_KEY, JSON.stringify(all));
}

export function scheduleAllReminders(): void {
  loadMedReminders()
    .filter((r) => r.enabled)
    .forEach(scheduleReminder);
}

function scheduleReminder(r: MedReminder): void {
  clearTimeout(reminderTimers.get(r.id));
  const now = new Date();
  const [h, m] = r.time.split(":").map(Number) as [number, number];
  const next = new Date(now);
  next.setHours(h, m, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);

  const delay = next.getTime() - now.getTime();
  const tid = window.setTimeout(() => {
    if (r.days.length === 0 || r.days.includes(new Date().getDay())) {
      void notify({
        title: `💊 Medicament: ${r.name}`,
        message: `E ora să iei ${r.name}`,
        level: "warning",
        tags: "pill",
      });
    }
    scheduleReminder(r); // re-schedule pentru ziua următoare
  }, delay);

  reminderTimers.set(r.id, tid);
}

// Auto-start la încărcarea modulului:
if (typeof window !== "undefined") {
  scheduleAllReminders();
}
```

**Complexitate:** Medie | **Impact:** Maxim (cel mai cerut feature în aplicații pentru vârstnici)

---

### 15. `mami-chat.ts` — Export conversație

**Fișier:** `src/components/mami-chat.ts` — secțiunea toolbar  
**Problema actuală:** Nu există mod de salvare sau export a conversației. Mama poate primi de la AI sfaturi bune despre alimentație, rețete de preparate, informații despre medicamente — și nu le poate trimite mai departe sau salva.

**Îmbunătățire propusă:**

- Buton "📋 Copiază" în toolbar → copiază conversația în clipboard ca text
- Buton "💾 Descarcă" → descarcă `.txt` cu conversația

**Exemplu implementare:**

```typescript
// Buton copiere:
private async copyConversation(): Promise<void> {
  const text = this.messages.map(m => {
    const who = m.role === "user" ? "Tu" : "Mami AI";
    return `[${m.time}] ${who}: ${m.text}`;
  }).join("\n\n");

  try {
    await navigator.clipboard.writeText(text);
    this.showToast("Conversație copiată în clipboard 📋");
  } catch {
    // fallback pentru browsere vechi
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    this.showToast("Conversație copiată 📋");
  }
}

// Buton descărcare:
private downloadConversation(): void {
  const text = this.messages.map(m => {
    const who = m.role === "user" ? "Tu" : "Mami AI";
    return `[${m.time}] ${who}:\n${m.text}`;
  }).join("\n\n---\n\n");

  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `conversatie-mami-ai-${new Date().toISOString().slice(0,10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
```

**Complexitate:** Mică | **Impact:** Mediu

---

## PARTE II — FUNCȚII NOI

---

### N1. Tab "Medicament" — Lista personală + schedule

**Descriere:** Tab dedicat complet pentru **gestionarea tratamentului cronic** al mamei. Diferit de drug-checker (care verifică interacțiuni), acesta ține evidența medicamentelor zilnice: ce medicamente ia mama, la ce ore, câte tablete, când trebuie reaprovizionată farmacia.

**De ce e util:** Mama de ~60 ani are aproape sigur tratament cronic (HTA, diabet, tiroidă, etc.). Acum nu există nicio funcție de tracking al aderenetei la tratament. Este **cel mai cerut feature** în aplicații pentru vârstnici conform studiilor 2025.

**Complexitate:** Medie | **Impact:** Maxim

**Exemplu implementare:**

```typescript
// src/components/mami-medication.ts (component nou)
interface MedicationEntry {
  id: string;
  name: string; // "Concor 5mg"
  dosage: string; // "1 comprimat"
  times: string[]; // ["07:00", "19:00"]
  days: "daily" | "weekdays" | number[]; // frecvență
  stock: number; // număr pastile rămase
  refillAt: number; // alertă când stock < N
  notes: string; // "după masă", "cu multă apă"
  color: string; // culoare vizuală "#e74c3c" (pentru recunoaștere vizuală)
  active: boolean;
}

// UI:
// - Lista medicamentelor active cu culori
// - Buton "+ Adaugă medicament" (form simplu)
// - Fiecare medicament: icon colorat + nume + ore + stock
// - Buton "✅ Am luat" per doză (marchează administrarea)
// - Counter stock cu alertă la refill
// - Integrare automată cu reminder-ele din notifications.ts
// - Export ca text pentru medic: "Tratament curent al pacientei: Concor 5mg × 2/zi (07:00 și 19:00), Metformin 500mg × 1/zi (prânz)..."

// CSS: card per medicament cu header colorat (culoarea medicamentului)
// Dimensiune butoane "Am luat": minim 60×60px pentru touch ușor
```

```typescript
// Tab entry în src/data/tabs.ts:
{ id: "medicament", label: "Tratament", icon: "💊" }
// Nota: redenumit din "medicamente" (drug checker) în "Interacțiuni"
// și nou tab "Tratament" pentru lista personală
```

---

### N2. Tab "Notițe" — Jurnal simplu

**Descriere:** Tab pentru notițe rapide și jurnal personal. Mama poate nota: lucruri de spus la doctor, idei de rețete, shopping list simplă, gânduri, amintiri. Simplu ca un bloc-notes digital.

**De ce e util:** Aplicația are AI chat și wellness, dar nu există loc pentru **note nestructurate**. Mama poate vrea să noteze "de cumpărat: lapte, pâine, ouă" sau "întrebat doctorul despre durerea de genunchi" — lucruri care nu se potrivesc în alte tab-uri.

**Complexitate:** Mică | **Impact:** Mare

**Exemplu implementare:**

```typescript
// src/components/mami-notes.ts
interface NoteEntry {
  id: string;
  ts: string; // ISO
  title: string; // max 50 char
  body: string; // text liber
  pinned: boolean; // note fixate sus
  category: "general" | "doctor" | "cumparaturi" | "jurnal";
}

// Layout:
// - Buton mare "+ Notița nouă" (tap → modal cu title + textarea)
// - Lista notițe: pinned sus, rest cronologic descrescător
// - Per notița: click → edit inline / long-press → opțiuni (pin, șterge)
// - Căutare simpla (filter pe text)
// - Categorii colorate (4 categorii cu iconuri: 📝 General, 🏥 Doctor, 🛒 Cumpărături, 📔 Jurnal)

// Exemplu card notița:
`<div class="note-card" data-category="doctor">
  <div class="note-header">
    <span class="note-icon">🏥</span>
    <span class="note-title">Întrebări pentru doctor</span>
    <span class="note-date">14 mai</span>
  </div>
  <p class="note-body">- durerea de genunchi de 3 zile\n- când reînnoiesc rețeta pentru Concor</p>
</div>`;

// Persistență: localStorage["mami:notes"] array NoteEntry[]
// Fără Supabase sync în prima versiune (local-only e suficient)
```

---

### N3. PWA Share Target — Primire documente din alte app-uri

**Descriere:** Configurare `manifest.json` cu `share_target` pentru ca aplicația să apară ca destinație când mama dă Share dintr-o altă aplicație (Gmail, WhatsApp, Files). Un document trimis de Roland pe WhatsApp → mama dă Share → Mami Docs → document apare direct în doc-viewer.

**De ce e util:** Mama primește documente de la Roland, de la medic, de la farmacie. Fără share target, trebuie să descarce documentul, să deschidă Mami Docs, să uploadeze. Cu share target: direct din aplicația primită → Mami Docs.

**Complexitate:** Mică | **Impact:** Mare

**Exemplu implementare:**

```json
// manifest.json — adaugă:
{
  "share_target": {
    "action": "/?share-target",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url",
      "files": [
        {
          "name": "file",
          "accept": ["application/pdf", ".docx", "image/*", ".xlsx", ".md"]
        }
      ]
    }
  }
}
```

```typescript
// src/main.ts — handle share target:
const url = new URL(window.location.href);
if (url.searchParams.has("share-target")) {
  // Procesăm fișierele primite prin Share Target API
  // Detalii: https://developer.mozilla.org/en-US/docs/Web/Manifest/share_target
  void handleShareTarget();
}

async function handleShareTarget(): Promise<void> {
  const cache = await caches.open("share-target-temp");
  const requests = await cache.keys();
  for (const req of requests) {
    const resp = await cache.match(req);
    if (!resp) continue;
    const formData = await resp.formData();
    const file = formData.get("file") as File | null;
    if (file) {
      // Deschide doc-viewer cu fișierul primit
      document.dispatchEvent(
        new CustomEvent("mami-open-doc", { detail: file }),
      );
    }
    await cache.delete(req);
  }
}
```

---

### N4. Shopping List din Meniu (generare automată)

**Descriere:** Buton în tab meniu "🛒 Lista de cumpărături" → AI extrage ingredientele din meniul săptămânii curente și generează o listă organizată pe categorii (fructe/legume, lactate, carne, panificație, etc.). Lista se poate bifa pe măsură ce mama cumpără.

**De ce e util:** Mama generează meniu AI → vrea să știe ce să cumpere de la piață. Acum nu există nicio legătură. Lista de cumpărături dintr-un meniu săptămânal e un workflow natural și complet.

**Complexitate:** Medie | **Impact:** Mare

**Exemplu implementare:**

```typescript
// În mami-menu.ts, adaugă buton și handler:
private async generateShoppingList(weekMenu: Record<string, DayMenu>): Promise<void> {
  const menuText = Object.entries(weekMenu).map(([day, meals]) =>
    `${day}: ${meals.breakfast}, ${meals.lunch}, ${meals.dinner}${meals.snack ? `, ${meals.snack}` : ""}`
  ).join("\n");

  const prompt = `Din acest meniu săptămânal, extrage lista de cumpărături necesară:
${menuText}

Returnează JSON cu structura:
{
  "legume_fructe": ["roșii", "castraveți", ...],
  "carne_peste": ["piept pui", ...],
  "lactate_oua": ["lapte", "ouă", ...],
  "panificatie_paste": ["pâine", ...],
  "conserve_condimente": ["ulei", ...],
  "altele": [...]
}

Include cantități estimative pentru o persoană (1 săptămână). Returnează EXCLUSIV JSON valid.`;

  try {
    const response = await sendChat([{ role: "user", content: prompt }], "");
    const list = JSON.parse(response) as Record<string, string[]>;
    this.renderShoppingList(list);
  } catch {
    this.showToast("Nu am putut genera lista. Încearcă din nou.");
  }
}

// UI pentru lista generată (cu checkboxes):
private renderShoppingList(list: Record<string, string[]>): void {
  const categories: Record<string, string> = {
    legume_fructe: "🥦 Legume și fructe",
    carne_peste: "🥩 Carne și pește",
    lactate_oua: "🥛 Lactate și ouă",
    panificatie_paste: "🍞 Pâine și paste",
    conserve_condimente: "🫙 Conserve și condimente",
    altele: "🛒 Altele",
  };

  const html = Object.entries(list)
    .filter(([, items]) => items.length > 0)
    .map(([cat, items]) => `
      <div class="shop-category">
        <h4>${categories[cat] ?? cat}</h4>
        ${items.map(item => `
          <label class="shop-item">
            <input type="checkbox" style="min-width:24px;min-height:24px;margin-right:.5rem;">
            <span>${item}</span>
          </label>
        `).join("")}
      </div>
    `).join("");

  // Afișează în modal sau sub meniu
  this.shadow.querySelector<HTMLElement>("#shopping-list-content")!.innerHTML = html;
  this.shadow.querySelector<HTMLElement>("#shopping-list-modal")!.style.display = "flex";
}
```

---

### N5. Voice Memo — înregistrare audio scurtă

**Descriere:** Buton "🎙️ Memo vocal" în tab Chat sau ca floating action. Mama înregistrează un mesaj audio scurt (max 2 minute) → se salvează ca fișier audio + transcripție automată (Groq Whisper). Poate fi ascultat, redistribuit, sau folosit ca notița vocală.

**De ce e util:** Mama poate prefera să vorbească decât să scrie. Un memo vocal ("De cumpărat mâine: pâine, lapte, jumătate de kg de brânză") e mai natural decât să scrie în notițe. Transcripția automată îl face searchable.

**Complexitate:** Medie | **Impact:** Mare (accesibilitate majoră pentru vârstnici)

**Exemplu implementare:**

```typescript
// src/components/mami-voice-memo.ts (component nou, mic)
// Sau integrat ca buton în mami-notes.ts sau mami-chat.ts

interface VoiceMemo {
  id: string;
  ts: string;
  durationSec: number;
  transcript: string;
  blobKey: string; // IndexedDB key pentru audio blob
}

export class MamiVoiceMemo extends HTMLElement {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private isRecording = false;

  private async startRecording(): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType: "audio/webm;codecs=opus",
    });
    this.chunks = [];
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };
    this.mediaRecorder.onstop = () => void this.processMemo();
    this.mediaRecorder.start();
    this.isRecording = true;
    this.updateRecordBtn();
    // Max 2 minute auto-stop:
    setTimeout(() => {
      if (this.isRecording) this.stopRecording();
    }, 120_000);
  }

  private stopRecording(): void {
    this.mediaRecorder?.stop();
    this.mediaRecorder?.stream.getTracks().forEach((t) => t.stop());
    this.isRecording = false;
    this.updateRecordBtn();
  }

  private async processMemo(): Promise<void> {
    const blob = new Blob(this.chunks, { type: "audio/webm" });
    this.showStatus("Transcriere...");

    let transcript = "";
    try {
      const { transcribeAudio } = await import("../ai/client");
      transcript = await transcribeAudio(blob);
    } catch {
      transcript = "(transcripție indisponibilă)";
    }

    const id = `memo_${Date.now().toString(36)}`;
    await putBlob(id, blob); // refolosim photo-blob-store

    const memo: VoiceMemo = {
      id,
      ts: new Date().toISOString(),
      durationSec: Math.round(this.chunks.length * 0.1),
      transcript,
      blobKey: id,
    };

    // Salvează și afișează
    const all = JSON.parse(
      localStorage.getItem("mami:voice-memos") ?? "[]",
    ) as VoiceMemo[];
    all.unshift(memo);
    localStorage.setItem("mami:voice-memos", JSON.stringify(all.slice(0, 50)));
    this.renderMemos();
  }
}
```

---

### N6. Raport Săptămânal PDF pentru Doctor

**Descriere:** Keepalive worker-ul generează deja sumar nocturn zilnic. Un raport săptămânal complet, formatat profesional ca PDF, cu toate datele wellness ale mamei din ultima săptămână, gata de arătat la medic.

**De ce e util:** Mama merge la medic și vrea să îi arate tensiunile din ultima lună, câtă apă a băut, cum a dormit. Acum poate descărca PDF de la wellness, dar e un dump de date. Un raport profesional formatat pentru medic ar fi incomparabil mai util.

**Complexitate:** Medie | **Impact:** Maxim

**Exemplu implementare:**

```typescript
// În mami-wellness.ts — metodă nouă:
private async generateWeeklyReport(): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const vitals = await listVitals(30);
  const hydration = await listHydration(7);
  const sleep = await listSleep(7);
  const emotions = await listEmotion(7);

  // Header profesional:
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("MONITORIZARE SĂNĂTATE", 105, 20, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  doc.text(`Perioada: ${weekAgo.toLocaleDateString("ro-RO")} — ${new Date().toLocaleDateString("ro-RO")}`, 105, 28, { align: "center" });

  // Tabel tensiuni:
  let y = 45;
  doc.setFont("helvetica", "bold");
  doc.text("Tensiune arterială (ultimele 7 zile):", 15, y);
  y += 7;

  vitals.slice(0, 14).forEach(v => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(
      `${new Date(v.ts).toLocaleDateString("ro-RO")} ${new Date(v.ts).toLocaleTimeString("ro-RO", {hour:"2-digit", minute:"2-digit"})}` +
      `  |  ${v.systolic}/${v.diastolic} mmHg` +
      `${v.pulse ? `  |  Puls: ${v.pulse} BPM` : ""}`,
      20, y
    );
    y += 5;
    if (y > 280) { doc.addPage(); y = 20; }
  });

  // Medii:
  const avgSys = Math.round(vitals.slice(0,7).reduce((s,v) => s + v.systolic, 0) / Math.min(vitals.length, 7));
  const avgDia = Math.round(vitals.slice(0,7).reduce((s,v) => s + v.diastolic, 0) / Math.min(vitals.length, 7));

  y += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`Medii 7 zile: ${avgSys}/${avgDia} mmHg`, 20, y);

  // ... similar pentru hidratare, somn, emoții ...

  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text("Generat de Mami Docs PWA — document informativ, nu înlocuiește consultul medical.", 105, 285, { align: "center" });

  doc.save(`raport-sanatate-${new Date().toISOString().slice(0,10)}.pdf`);
}
```

---

## PARTE III — ÎMBUNĂTĂȚIRI TEHNICE

---

### T1. `@media (prefers-reduced-motion)` în toate componentele

**Problema:** Componentele folosesc animații CSS (bounce în thinking indicator, tranziții drawer, fade-uri). Niciuna nu respectă preferința sistemului pentru reduced motion. Utilizatorii cu vertij sau epilepsie pot fi afectați.  
**Soluție:** Adaugă `@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }` în `src/styles/global.css`.  
**Complexitate:** Mică | **Impact:** Accesibilitate / WCAG 2.3.3

---

### T2. `aria-label` complet pe butoane icon-only

**Problema:** Butoanele ☰ (hamburger), ⚙️ (settings), 🎤 (microfon), ✕ (close) nu au `aria-label` declarate consistent. Screen readers (și unele asistente vocale pe Android) le vor citi drept "button" fără context.  
**Soluție:** Adaugă `aria-label="Deschide meniu"`, `aria-label="Setări"`, `aria-label="Pornește înregistrare vocală"` pe fiecare buton icon-only. Verificare cu axe DevTools.  
**Complexitate:** Mică | **Impact:** Accesibilitate

---

### T3. IndexedDB cleanup periodic pentru blob-uri orfane

**Problema:** `photo-blob-store.ts` salvează blob-uri în IndexedDB. Dacă `local-store.ts` metadata e șters/corupt dar blob-ul există, spațiu irosit indefinit. `purgeDeletedPhotosMeta(30)` șterge metadata, dar nu și blob-urile asociate.  
**Soluție:** La startup (în `mami-gallery.ts` connectedCallback), reconciliază: pentru fiecare blob în IDB, verifică că există metadata corespunzătoare. Dacă nu → șterge blob orfan.  
**Complexitate:** Mică | **Impact:** Mentenanță storage

---

### T4. AbortController în AI calls din wellness

**Problema:** `mami-wellness.ts` face AI call pentru "sfaturi AI" fără AbortController. Dacă utilizatorul navighează la alt tab înainte ca răspunsul să vină, fetch-ul continuă în background, consumând tokens și memoria.  
**Soluție:** Adaugă `this._aiController = new AbortController()` la fiecare AI call. La `disconnectedCallback()` sau la un nou call, `this._aiController.abort()`.  
**Complexitate:** Mică | **Impact:** Performanță / consum API

---

### T5. Streaming AI responses în chat (SSE)

**Problema:** AI Gateway face request complet și returnează răspunsul după 2-8 secunde. Mama vede "thinking..." tot timpul. Streamingul (Server-Sent Events sau ReadableStream) arată răspunsul cuvânt cu cuvânt, mult mai natural și mai rapid din perspectiva utilizatorului.  
**Soluție:** Modifică `ai-gateway/index.ts` să proxieze stream-ul Groq (`stream: true`). Client-side, procesează `ReadableStream` și actualizează DOM pe chunks.  
**Complexitate:** Mare | **Impact:** UX Major (chat mult mai fluid)

---

### T6. CSS containment pentru componente heavy

**Problema:** `mami-doc-viewer.ts` (PDF viewer) și `mami-gallery.ts` (grid imagini) pot cauza layout recalculations costisitoare când se actualizează DOM intern.  
**Soluție:** Adaugă `contain: strict` sau `contain: layout paint` pe `:host` în componentele heavy. Îmbunătățire rendering fără modificări JS.  
**Complexitate:** Mică | **Impact:** Performanță (reflow redus)

---

### T7. Lazy import `jsPDF` în wellness (eliminare warning chunk size)

**Problema:** `mami-wellness.ts` importă `jsPDF` la linia 1 (`import type jsPDF from "jspdf"`). Deși e `import type`, `jspdf` e o dependință mare (500KB+). Vite o poate include în chunk-ul inițial dacă există vreo referință non-type.  
**Soluție:** Verifică că `jsPDF` e importat EXCLUSIV dinamic la click pe "Descarcă PDF": `const { default: jsPDF } = await import("jspdf")`. Aceasta reduce bundle inițial dacă nu e deja lazy.  
**Complexitate:** Mică | **Impact:** Performanță bundle

---

### T8. `lang="ro"` pe notifications locale

**Problema:** `showLocalNotification()` în `notifications.ts` nu setează `lang` în opțiunile `Notification`. Pe Android, Google Assistant poate încerca să citească notificarea în română dar fără hint poate rata accentele.  
**Soluție:** Adaugă `lang: "ro"` în opțiunile constructor `Notification`.  
**Complexitate:** Mică | **Impact:** Accesibilitate TTS

---

## SUMAR PRIORITĂȚI

| Prioritate            | #   | Îmbunătățire                          | Complexitate | Impact         | Categorie           |
| --------------------- | --- | ------------------------------------- | ------------ | -------------- | ------------------- |
| **P0 — URGENT**       | 13  | Loading skeleton vizibil              | Mică         | Mare           | UX First Impression |
| **P0 — URGENT**       | 14  | Remindere medicament configurabile    | Medie        | Maxim          | Feature Vital       |
| **P0 — URGENT**       | 5   | Denumiri românești medicamente        | Mică         | Maxim          | Utilizabilitate     |
| **P0 — URGENT**       | 13  | Font size control (accesibilitate)    | Mică         | Maxim          | Accesibilitate      |
| **P0 — URGENT**       | 10  | Bibliotecă persistentă documente      | Mare         | Maxim          | Core Feature        |
| **P1 — IMPORTANT**    | 1   | Persistența conversației chat         | Mică         | Mare           | Retenție date       |
| **P1 — IMPORTANT**    | 2   | Ștergere intrări wellness individuale | Mică         | Mare           | Corectitudine       |
| **P1 — IMPORTANT**    | 6   | Salvare lista permanentă medicamente  | Mică         | Mare           | Utilizabilitate     |
| **P1 — IMPORTANT**    | 8   | System prompts specializate per tab   | Mică         | Mare           | Relevanță AI        |
| **P1 — IMPORTANT**    | N1  | Tab Tratament (medicamente zilnice)   | Medie        | Maxim          | Feature Core        |
| **P1 — IMPORTANT**    | 3   | Target hidratare + progress bar       | Mică         | Mediu          | Motivație           |
| **P2 — VALOROS**      | 7   | Preferințe culinare meniu             | Medie        | Mare           | Relevanță           |
| **P2 — VALOROS**      | 15  | Export conversație chat               | Mică         | Mediu          | Utilitate           |
| **P2 — VALOROS**      | 9   | Editare caption galerie               | Mică         | Mediu          | Completitudine      |
| **P2 — VALOROS**      | N2  | Tab Notițe (jurnal rapid)             | Mică         | Mare           | Gap evident         |
| **P2 — VALOROS**      | N3  | PWA Share Target                      | Mică         | Mare           | UX nativ            |
| **P2 — VALOROS**      | 11  | Tranziție animată tab (fade)          | Mică         | Mediu          | Polish UX           |
| **P3 — STRATEGIC**    | N4  | Shopping list din meniu               | Medie        | Mare           | Workflow complet    |
| **P3 — STRATEGIC**    | N6  | Raport săptămânal PDF doctor          | Medie        | Maxim          | Valoare medicală    |
| **P3 — STRATEGIC**    | N5  | Voice memo cu transcripție            | Medie        | Mare           | Accesibilitate      |
| **P3 — STRATEGIC**    | T5  | Streaming AI responses (SSE)          | Mare         | Maxim          | UX Chat             |
| **P4 — NICE-TO-HAVE** | 4   | Sparkline trend hidratare 7z          | Medie        | Mediu          | Vizualizare         |
| **P4 — NICE-TO-HAVE** | T1  | prefers-reduced-motion global         | Mică         | Accesibilitate | WCAG                |
| **P4 — NICE-TO-HAVE** | T2  | aria-label complet pe icon buttons    | Mică         | Accesibilitate | WCAG                |
| **P4 — NICE-TO-HAVE** | T3  | IndexedDB cleanup blob-uri orfane     | Mică         | Mentenanță     | Tech debt           |
| **P4 — NICE-TO-HAVE** | T4  | AbortController în wellness AI calls  | Mică         | Performanță    | Tech debt           |
| **P4 — NICE-TO-HAVE** | T6  | CSS containment doc-viewer/gallery    | Mică         | Performanță    | Optimizare          |
| **P4 — NICE-TO-HAVE** | T8  | lang="ro" în notificări locale        | Mică         | Accesibilitate | Minor               |

---

## NOTE IMPLEMENTARE

1. **Constrângere globală:** Zero dependențe noi fără motiv. Toate exemplele de cod de mai sus folosesc API-uri native sau librăriile deja existente în `package.json`. Singura excepție posibilă: streaming SSE (T5) poate necesita modificări în worker.

2. **Pattern stocare consistent:** `localStorage["mami:<cheie>"]` pentru toate datele noi (consistență cu `local-store.ts`). IndexedDB DOAR pentru blob-uri (audio memos, documente).

3. **Dependențe între recomandări:**
   - N1 (Tab Tratament) DEPINDE de Rec.14 (remindere configurabile) — implementați împreună
   - N2 (Tab Notițe) este independent — poate fi prima funcție nouă implementată (complexitate mică)
   - Rec.10 (bibliotecă documente) DEPINDE de doc-blob-store (de creat)
   - N3 (Share Target) DEPINDE de service-worker manifest update

4. **Ce NU se schimbă:** Stack-ul tehnic (Vanilla JS + Web Components), convenții kebab-case, structura workers existentă, Cloudflare Pages deploy flow, formatele de stocare existente în localStorage.

5. **Ordinea recomandată de implementare (sprint 1):**
   - Rec.5 (denumiri RO medicamente) — 1h, impact imediat
   - Rec.13 (font size) — 2h, accesibilitate critică
   - Rec.12 (loading skeleton) — 1h, first impression
   - Rec.1 (persistența chat) — 2h, date nepierdute
   - Rec.8 (system prompts per tab) — 1h, AI mai util
   - Rec.6 (lista permanentă medicamente) — 1h
   - **Total sprint 1: ~8h, 6 îmbunătățiri P0/P1 implementate**

---

_Analiză bazată pe: 12 componente Web citite efectiv, 5 module AI, 2 workers, 4 servicii. Total ~6500 linii TypeScript analizate._  
_Comparație cu: W3C Accessibility Guidelines pentru vârstnici, MDN PWA Best Practices, health app features studies 2025-2026._
