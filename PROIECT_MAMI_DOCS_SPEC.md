# PROIECT MAMI-DOCS — Specificație Funcțională Completă

> **Document destinatar:** Claude Code (rulat de Roland în VS Code, pe laptop, în folderul proiectului)
> **Statut:** Plan funcțional. Nu conține decizii despre dependențe, framework-uri, sau configurări tehnice — acestea sunt în sarcina Claude Code.
> **Ultima actualizare:** 30 aprilie 2026

---

## 0. INSTRUCȚIUNI MANDATORII PENTRU CLAUDE CODE

### 0.1. Procedura de pornire (la prima execuție în acest proiect)

1. **CITEȘTE COMPLET** acest document înainte de orice acțiune. Nu sări la cod.
2. Acest document descrie **doar OBIECTIVE FUNCȚIONALE și REGULI**. Toate deciziile tehnice (stack, framework-uri, biblioteci, structură fișiere, format) sunt în sarcina ta.
3. După citire, **GÂNDEȘTE TOATĂ logica de implementare** end-to-end:
   - Ce dependențe sunt necesare
   - Ce funcții/module trebuie create
   - Ce conexiuni între componente
   - Ce API-uri și endpoint-uri
   - Ce fișiere de configurare
   - Strategia de testing și deployment
   - Strategia de monitoring
4. **PROPUNE** structura folderului principal pentru parcurgere eficientă (admin trebuie să găsească orice informație fără a citi tot contextul de fiecare dată — minimizează apariția confuziilor și economisește din limita de caractere/sesiune).
5. **CERE-MI confirmare** pe propunerea ta de structură + stack înainte de a executa orice.
6. După confirmare, **CREEAZĂ fișierele de regulament și memorie** în structura aleasă, astfel încât acest document și regulile derivate să fie încărcate automat de tine la fiecare sesiune viitoare.

### 0.2. Reguli care trebuie să ruleze automat în fiecare sesiune

Aceste reguli devin parte din memoria proiectului (CLAUDE.md sau echivalent) și se aplică automat:

- **Regula 1 — Workflow Q&A iterativ:**
  La orice cerere de adăugare/modificare/ștergere de conținut sau fișiere, deschide `ask_user_question` cu întrebări specifice. Fiecare întrebare are opțiuni de selecție + un câmp text liber pentru completări. După răspunsuri, generează un text scurt punctual cu ce ai înțeles și cum intenționezi să execuți, apoi cere confirmare. Dacă admin scrie modificări/completări, repetă procesul. Execuți **doar după confirmare explicită**.

- **Regula 2 — Confirmation gate:**
  Înainte de orice execuție majoră (creare/ștergere fișiere, deploy, modificări structurale, instalare dependențe), prezintă plan scurt → cere confirmare.

- **Regula 3 — Service limits awareness:**
  ÎNTOTDEAUNA când folosești sau recomanzi un serviciu extern (GitHub, Cloudflare, Supabase, AI providers, etc.), specifică:
  - Limitele planului gratuit (cereri/zi, storage, bandwidth, timp răspuns)
  - Cât din limită s-a consumat în sesiunea/ziua curentă
  - Avertismente când se ajunge la 80% din prag
  - Alternative dacă limita este atinsă

- **Regula 4 — Tool/skill/MCP usage:**
  Folosește toate tool-urile, skill-urile și MCP-urile disponibile (file system, bash, web search, web fetch, etc.). Nu te limita la presupunerea că nu ai acces la ceva — verifică întâi.

- **Regula 5 — Pre-flight verification (înainte de orice deploy/release):**
  - Validitatea tuturor cheilor API stocate în memoria globală
  - Disponibilitatea modelelor AI pe planurile gratuite ale fiecărui provider
  - Recomandarea modelelor optime per capabilitate (raport calitate / limite gratuit)
  - Compatibilitatea browser pentru API-urile PWA folosite (Speech API în română, Web Share, Vibration, Notifications, etc.)
  - Health check pe toate serviciile externe conectate

- **Regula 6 — Auto-update sistem map:**
  După orice modificare structurală sau adăugare/ștergere de conținut, regenerează automat fișierul cu harta sistemului (numele exact îl decizi tu) astfel încât să rămână sursa de adevăr pentru navigare rapidă.

- **Regula 7 — Audit trail:**
  Orice modificare în repo, în Supabase, sau în Workers se loghează (cine — admin/mama, când, ce, unde). Logul e accesibil prin `/onboard` și prin dashboard-ul admin.

- **Regula 8 — Ask-don't-assume:**
  Pentru orice neclaritate de implementare sau decizie tehnică care impactează experiența mamei, deschide `ask_user_question`. Nu presupune.

### 0.3. Slash command `/onboard`

Când admin rulează `/onboard` ca primul mesaj într-o sesiune nouă în acest folder de proiect:

1. **Pull latest** din origin (git pull)
2. **Diff local vs remote** — sumar vizual al modificărilor
3. **Health check API keys** — testează validitatea fiecărei chei stocate în memoria globală + raport quota rămasă per provider
4. **Verifică integritatea structurii** folderelor și fișierelor critice
5. **Compară harta sistemului local** cu harta din repo (auto-actualizată) → semnalează diferențe
6. **Raport scurt vizual** cu:
   - Modificări venite din partea mamei (conținut nou adăugat de ea)
   - Modificări venite din alte sesiuni admin
   - Avertismente quota/limite servicii
   - Acțiuni recomandate (dacă există)
7. **Întreabă admin** dacă vrea să sincronizeze documentația locală cu schimbările existente.

---

## 1. CONTEXT ȘI OBIECTIVE

### 1.1. Cui îi este destinat

- **Utilizator final:** Mama lui Roland (~60 ani, telefon Android Chrome)
- **Admin:** Roland (eu), modific exclusiv din VS Code + Claude Code pe laptop

### 1.2. Ce este

PWA (Progressive Web App) cu URL public, instalabilă pe telefonul mamei ca aplicație nativă pe ecranul principal. Conține:

- O bibliotecă de documente diversificate (rețete, planuri concedii, livadă, sănătate, casnice, etc.)
- Un agent AI care o asistă conversațional, vocal sau text
- Funcții PWA native (offline, notificări, instalare home screen)

### 1.3. De ce

- Documentele trimise pe WhatsApp se pierd în istoricul de mesaje în timp
- Mama trebuie să aibă acces permanent, sortat, actualizat fără retrimitere
- Conținutul se actualizează când admin modifică repo-ul, automat (mama vede ultima versiune la următoarea deschidere)

---

## 2. STRATEGIE PRIVACY ȘI ARHITECTURĂ DE STOCARE

**Decizia:** Hybrid public + privat.

### 2.1. Conținut public (în repo GitHub `mami-docs`, public)

- Cod sursă PWA (HTML/CSS/JS sau ce alegi tu)
- Documente furnizate de admin (rețete, ghiduri, etc.) — destinate vizualizării
- Asset-uri statice (iconițe, fundal, audio pian, mesaje rotative)
- Configurări PWA (manifest, service worker)

### 2.2. Conținut privat (în Supabase, plan gratuit)

- TOT conținutul adăugat de mama: poze, documente upload-ate, notițe, memo-uri vocale, dictări, bookmarks, highlights
- Audit trail / change log
- Setări personale (volum, dark mode, etc.)
- Memoria conversațiilor cu agentul AI
- Preferințele mamei (alergii, gusturi, restricții)

### 2.3. Auth și mutații

- Mama nu are credențiale GitHub. Toate scrierile mamei trec prin **Cloudflare Workers** (proxy invizibil).
- Workers conțin un GitHub Personal Access Token al admin (ascuns) și credențialele Supabase (ascunse).
- Workers expun endpoint-uri sigure pentru: upload, delete, fetch, list, update preferences, log change.
- Rate limiting în Workers pentru protejarea de abuz (de ex. max X cereri/min/IP).

### 2.4. Permisiuni

- **Mama:** poate citi toate documentele publice + propriul ei conținut din Supabase. Poate adăuga conținut nou. Poate șterge **doar** conținutul pe care îl marchează metadata `author: "mama"` sau echivalent.
- **Admin (eu):** acces total prin Claude Code de pe laptop. Pot șterge orice. Modificările publice merg în repo via git push. Modificările Supabase via API admin (cu token separat).
- **Mod admin pe pagină:** activabil cu un PIN într-o pagină de Setări → permite admin să modifice conținut și de pe telefon dacă e nevoie urgentă.

---

## 3. ASPECTE TEHNICE LĂSATE LA DECIZIA CLAUDE CODE

Următoarele NU sunt specificate în acest plan și trebuie decise de tine:

- Framework frontend (vanilla JS sau React/Vue/Svelte/Solid/etc.)
- Bibliotecă routing (dacă necesar)
- Bibliotecă de stilizare (CSS pur, Tailwind, etc.)
- Bibliotecă PWA helper (Workbox, etc.)
- Bibliotecă pentru randare DOCX/PDF/HTML inline (mammoth.js, PDF.js, etc.)
- Provider AI și model concret pentru fiecare nivel din fallback chain (vezi secțiunea 7.2)
- Strategia de bundling/build (Vite, esbuild, none, etc.)
- Test framework
- Tool de linting/formatting
- Format fișierelor de documentație din folderul principal (md, json, yaml, mix — alegere strategică pentru parcurgere rapidă fără citirea tot contextului)
- Convenția de denumire a fișierelor și folderelor (trebuie să fie **consistentă** pentru toate fișierele actuale și viitoare)
- Mecanismul exact de internacionalizare dacă apare nevoie

---

## 4. STRUCTURA FOLDER PRINCIPAL (cerințe — exact aspecte funcționale)

Folderul principal al proiectului trebuie să conțină **funcțional**:

1. **Fișiere de regulament, plan și memorie** pentru Claude Code, plus tot ce consideri relevant pentru execuții. Acestea trebuie încărcate automat la fiecare sesiune.
2. **Un sub-folder care conține foldere generate dinamic, câte unul per tab.** În fiecare sub-folder: fișierele și documentația specifice acelui tab.
3. **Un fișier cu harta completă a sistemului** (formatul îl alegi tu — JSON, MD, YAML), actualizat automat la orice modificare relevantă, pentru navigare rapidă.
4. **Convenție de denumire consistentă** pentru toate fișierele și folderele (actuale și viitoare).
5. **Format optimizat pentru parcurgere rapidă** — Claude Code nu trebuie să citească tot contextul pentru a găsi o informație. Minimizează confuzia, economisește limita de caractere/sesiune.

---

## 5. IDENTITATE VIZUALĂ ȘI PWA

### 5.1. PWA manifest

- **Nume aplicație (full):** Documente Mami
- **Nume scurt (sub iconiță, max 12 caractere):** Mami
- **Iconiță:** SVG grafic contextual (carte deschisă, folder cu suflet, sau elementele potrivite — alege tu un design profesional ce reflectă "biblioteca personală caldă"). Generează la rezoluții multiple (192px, 512px, maskable).
- **Splash screen:** generat automat din iconiță + culoare principală.
- **Display mode:** standalone (fără bara browser).
- **Orientation:** portrait predominant, dar landscape acceptat.
- **Start URL:** rădăcina PWA-ului.
- **Theme color și background color:** culoarea principală.

### 5.2. Culoare principală

**Albastru calm `#2E5C8A`** — folosit pentru header, accente, butoane primare, highlight-uri.

### 5.3. Fundal vizual

**Imagine ambientală statică, subtilă și calmă** — generată sau aleasă astfel încât să nu distragă. Sugestie: textură naturală blândă (hârtie veche, cer pastel, lemn deschis cu opacitate redusă). Decizia finală — alegere artistică, dar trebuie să fie subtilă.

### 5.4. Animații

**Stil prietenos expresiv:** bounce uşor pe butoane, slide pe deschidere tab, fade-in pe încărcare conținut, floating elements pe icoane. Nu agresiv, dar perceptibil. Trebuie să se simtă "viu" și "cald".

### 5.5. Dark mode

Activabil din Setări. Adaptează culoarea principală pentru contrast bun. Persistă alegerea în Supabase per utilizator.

---

## 6. UX — REGULI DE INTERACȚIUNE

### 6.1. Font și text

- Font normal default. Mama folosește zoom-ul telefonului dacă vrea text mai mare.
- Lizibilitate maximă: contrast bun, line-height generos, spacing aerisit.

### 6.2. Navigare

- **Meniu hamburger** combinat: tab-urile preferate vizibile sus + restul în dropdown.
- Meniul **rămâne sticky în header** la scroll (vizibil întotdeauna).
- Bara de căutare globală (vezi 6.3) accesibilă din header.

### 6.3. Căutare

**Bară de căutare AI globală** care caută inteligent în toate documentele (nu doar match de cuvinte). Folosește fallback chain AI.

### 6.4. Indicatori de modificări

- Pe fiecare tab cu modificări noi: **badge verde** (puncte mici).
- Badge-ul **dispare automat** după ce mama deschide tab-ul respectiv.

### 6.5. Welcome page (la deschidere)

Mama vede:

- Lista tab-urilor (cu badge-urile de actualizare)
- Un mesaj scurt de salut **personalizat și rotativ** (vezi 6.6)
- Eventual: ultimele documente accesate (decizia ta dacă e util)

### 6.6. Mesaje rotative de salut

- **6 teme:** familie, iubire, motivație, respect, luciditate, claritate mintală și vizuală.
- **20 mesaje per temă = 120 total.** Vezi Anexa A pentru lista completă.
- La fiecare nouă deschidere a aplicației, alege un mesaj **random din toate cele 120** (sau cu rotație inteligentă să nu repete prea curând).
- Mesajele sunt stocate într-un fișier separat (JSON sau ce alegi tu) pentru a fi ușor de extins/modificat.

### 6.7. Sunet

- **Muzică ambientală pian continuă în fundal** la deschidere (loop subtil, blândă, calmă, despre iubire/speranță/familie/motivație).
- **Buton mute** rapid accesibil în header (sau colț).
- Volum reglabil din pagina de Setări.
- Folosește un fișier audio cu drepturi libere sau Creative Commons. Verifică licența. Sugerez căutare pe Pixabay Music, Free Music Archive, sau Bensound (license-free piano).

---

## 7. AGENT AI

### 7.1. Provider AI

**Decizie:** o iei tu (Claude Code) împreună cu admin, după ce verifici cheile API existente în memoria globală a admin (mențiune în memoria globală: ~20 chei API gratuite stocate). Verifică pentru fiecare:

- Validitatea cheii
- Modelele disponibile pe planul gratuit
- Limitele (cereri/zi, tokens/min, latență)
- Capabilitățile concrete (text, voce, OCR, traducere, etc.)

Recomandă admin formula optimă bazată pe:

- Capabilitățile cerute pentru fiecare task (vezi 7.4)
- Limitele de utilizare pe planul gratuit
- Cost zero ca prioritate

### 7.2. Fallback Chain — 4 nivele

```
Nivel 1 (Primary) → Nivel 2 (Secondary) → Nivel 3 (Tertiary) → Nivel 4 (Fallback)
   capabilitate         viteză               open source        cached/polite
   maximă               mare                 (HuggingFace)      message
```

- Fiecare nivel are propria cheie API stocată separat.
- Trecerea la următorul nivel se face automat când nivelul anterior:
  - Returnează eroare (5xx, rate limit 429)
  - Depășește timeout configurat
  - Atinge quota zilnică
- Nivel 4: răspuns cached din întrebări similare anterioare + mesaj politicos "încearcă peste 1-2 minute".
- Logging clar al nivelului folosit pentru fiecare cerere (pentru debugging și optimizare).

### 7.3. API key management

- Toate cheile sunt stocate în Cloudflare Workers (variabile de mediu encriptate).
- Niciodată expuse în browser.
- Niciodată comise în repo.
- Rotație ușoară (admin actualizează secret în Workers, fără re-deploy frontend).

### 7.4. Capabilități AI complete

**Moduri de interacțiune (toate active):**

- Mama scrie text → agent răspunde text
- Mama vorbește (microfon) → agent răspunde text
- Mama scrie text → agent răspunde cu voce
- Mama vorbește → agent răspunde cu voce (conversație vocală)
- **Document Voice Reader** — citire cu voce a documentelor și a răspunsurilor agentului

**Personalitate:**
Adaptivă în funcție de contextul documentului (rețete, sănătate, livadă, concedii — ton diferit pentru fiecare). În toate cazurile, **ton cald, răbdător, fără jargon tehnic**, ca un nepot răbdător sau o asistentă blândă. Niciodată rece sau robotic.

**Capabilități pe documente:**

- "Explică mai simplu" — rescrie pasaje complicate în limbaj simplu
- "Rezumat 3 puncte" — sumarizează documente lungi
- "Definire cuvânt" — tap pe cuvânt necunoscut → explicație în popup mic
- "Citește document cu voce" — TTS

**Capabilități între documente:**

- Căutare AI globală (mai inteligentă decât match de cuvinte)
- "Compară X și Y" — găsește legături/diferențe între documente
- "Documente legate de subiect" — sugerează documente conexe
- "Ce să citesc azi" — recomandare contextuală zilnică

**Capabilități practice / acțiuni:**

- Generator listă cumpărături din rețete/documente
- Convertor unități automatic (linguri ↔ grame, etc.)
- "Înlocuitori" — ce pot folosi în loc de X
- Pas-cu-pas cu timer integrat (pentru rețete sau proceduri)

**Memorie și personalizare:**

- Reține preferințele mamei (alergii, gusturi, restricții) — stocate în Supabase
- Reține conversațiile anterioare (continuă discuția de unde s-a oprit)
- Jurnal cu agent ("ce am vorbit săptămâna asta")
- Buton "reset/uită totul" — confidențialitate (șterge memoria conversațională, păstrează preferințele)

**Companion / wellness:**

- Salut personalizat la fiecare deschidere (în completarea mesajului rotativ — agentul observă context: oră, ultimele interacțiuni)
- Memento blând ("ai citit rețeta X acum 3 zile, vrei să îți reamintesc?")
- Mesaje de încurajare contextuale (după documente medicale dificile)
- Detectare stres / oboseală în mesaje (sugerează "ia o pauză, sună fiul")

**Capabilități extinse:**

- **OCR foto** — buton dedicat camera + buton dedicat upload poze (limită 10 fișiere/sesiune). Mama face poză unui document fizic → agent îl citește, extrage text, salvează ca document nou.
- **Analiză PDF/imagine "oaspete"** — buton dedicat pentru documente upload-ate (limită 10 fișiere/sesiune). Mama încarcă temporar pentru clarificare/întrebări. Nu se stochează permanent decât dacă mama cere.
- **Calculator integrat** în chat ("câte calorii are 2 porții din rețeta 3?")
- **Memo vocal salvat** — mama dictează, agentul transcrie ca notă persistentă

**Organizare personală:**

- **Galerie media** — toate imaginile/video-urile din toate documentele într-un loc
- **Bookmarks / favorite** — tab dedicat cu cele mai accesate
- **Notițe rapide per document** — atinge și scrie/dictează ad-hoc
- **Highlight pasaje importante** — mama evidențiază cu degetul

**Adaptare și transformare conținut:**

- "Explică pentru un copil de 10 ani" — ultra-simplu
- Traducere automată (română ↔ maghiară, germană, engleză, alte limbi la cerere)
- Generator meniu săptămânal din rețetele existente
- Detectare schimbări "Ce s-a modificat în acest document de ultima dată?"

### 7.5. Comenzi vocale — listă completă

**Activare:** prin buton (mama atinge microfonul, vorbește). NU activare hands-free de tipul "Hey Mami" (consum baterie + privacy).

**Comenzi de planificare și memento:**

- "Reamintește-mi peste [interval] să [acțiune]" → Web Notification programată
- "Adaugă întâlnire [data] la [oră]" → generează `.ics`, deschide automat în Google Calendar
- "Zilnic la [oră] reamintește-mi să [acțiune]" → notificare recurentă
- "Notează: [text]" → salvare în notițe PWA
- "Memento medical recurent" — la ore exacte pentru medicament
- "Memento hidratare" — la interval programat
- "Memento masă/gustare programată"
- "Adaugă în lista de cumpărături [item]"
- "Memento programare medicală" — data + repetare opțională
- "Confirmare prin repetare" — agentul repetă ce a setat: "Am setat memento la [oră], corect?"
- "Snooze acest memento [interval]"
- "Arată-mi lista de memento-uri active"
- "Memento exerciții fizice ușoare"

**Comenzi informaționale și de navigare:**

- "Cum e afară?" — vremea curentă
- "Caută [termen] pe Google" — deschide tab nouă
- "Citește-mi [document/secțiune]"
- "Deschide tab-ul [nume]"
- "Pagina următoare/anterioară" în document
- "Mai tare / mai încet / oprește citirea"
- "Mărește/micșorează textul"
- "Activează/dezactivează modul întunecat"
- "Caută [cuvânt] în acest document"
- "Tradu paragraful curent în [limba]"
- "Repetă ultimul răspuns"
- "Citește mai rar / mai repede"
- "Răspuns mai scurt / mai detaliat"
- "Cât e ceasul?" / "Ce dată e azi?"

**Comenzi de comunicare cu alții:**

- **Niciuna activă.** Decizie explicită: nu folosim apel/SMS/email vocal. Mama folosește app-urile native pentru comunicare.

---

## 8. CONȚINUT ȘI WORKFLOW

### 8.1. Tipuri suportate

**Orice format care poate fi randat în HTML:** DOCX, PDF, MD, HTML, TXT, JSON, imagini (JPG/PNG/WebP/SVG), video (MP4/WebM), audio (MP3/OGG), spreadsheet-uri (XLSX → randare HTML).

### 8.2. Reguli adăugare/modificare conținut (workflow Q&A iterativ)

Vezi Regula 1 de la secțiunea 0.2.

Aplicabil pentru:

- Adăugare document nou (fișier sau folder tab nou)
- Modificare document existent
- Ștergere document
- Modificare structurală a tab-urilor

### 8.3. Per-document features

- **Buton download** — descarcă fișierul original (DOCX, PDF, etc.) pe telefon
- **Buton print** — generează print A4 curat:
  - Fără header/footer auto-adăugat de Chrome
  - Fără URL, dată, sau alte adnotări
  - Conținutul încadrat exact pe pagina A4
- **Buton share via WhatsApp** — folosește Web Share API → meniul nativ Android de share

### 8.4. Conținutul mamei (cu permisiuni de ștergere)

Mama poate adăuga prin:

- **Buton cameră** — face poză direct (limită 10 fișiere/operație)
- **Buton upload imagini** — selectează din galerie (limită 10 fișiere/operație)
- **Buton upload documente** — selectează fișiere din telefon (limită 10 fișiere/operație)
- **Notițe text** — scriere directă sau dictare vocală
- **Memo vocal** — înregistrare audio + transcriere automată
- **Highlights** pe documente existente
- **Bookmarks**

Tot conținutul adăugat de mama:

- Marcat metadata `author: "mama"` + timestamp
- Stocat în Supabase (privat)
- **Categorizat automat de AI** cu sugestie de tab + buton "schimbă tab" pentru override manual
- **Vizibil în tab-ul corespunzător** plus într-un tab dedicat "Adăugările mele"

Ștergere:

- Mama poate șterge **doar** conținutul cu `author: "mama"`
- Confirmare la ștergere ("Ești sigură că vrei să ștergi [item]?")
- Soft delete (păstrat 30 zile în "coș de gunoi") apoi hard delete
- Admin poate restaura din coșul de gunoi

---

## 9. WORKFLOW ADMIN PE LAPTOP (CLAUDE CODE)

### 9.1. Slash command `/onboard`

Vezi secțiunea 0.3.

### 9.2. Adăugare conținut din partea admin

- Admin scrie în chat ce vrea să adauge/modifice
- Claude Code aplică Regula 1 (workflow Q&A iterativ)
- După confirmare:
  - Pentru content public: commit + push în repo → GitHub Pages redeploy automat
  - Pentru config Supabase/Workers: aplicare via API admin
- Auto-update sistem map
- Auto-log audit trail

### 9.3. Mod administrator pe pagină (de pe telefon)

- Activabil în pagina Setări cu PIN (admin)
- Permite admin să modifice conținut și de pe telefon (urgențe)

### 9.4. Dashboard utilizare / monitorizare

**Pagină accesibilă cu PIN admin** care arată:

- Quota consumat per serviciu (Cloudflare Workers, Supabase, fiecare AI provider) — zilnic, lunar
- Avertismente vizuale când se depășește 80% din prag
- Logs ultime 24h pentru debugging
- Status health per serviciu (online/offline/degraded)
- Cost rulant (zero idealmente; alertă dacă apare ceva)

---

## 10. SETĂRI

### 10.1. Pagina de Setări (accesibilă mamei)

- Volum muzică ambientală + sunet on/off
- Dark mode toggle
- Viteză voce TTS (lent / normal / rapid)
- Buton **"Nu mă învăța lucruri noi"** / **blocare modificări** — mama setează asta când nu vrea să fie deranjată de notificări de actualizări sau sugestii noi de funcții pentru o perioadă (durată configurabilă: 1 zi / 1 săptămână / permanent)
- Buton "Reset memorie conversație" — confidențialitate

### 10.2. Pagina admin (cu PIN)

- Toate setările mamei
- Dashboard utilizare (vezi 9.4)
- Override permisiuni
- Acces audit trail complet
- Buton "Forțează refresh cache" pentru toate dispozitivele
- Configurare AI fallback chain (selectare provider per nivel)

### 10.3. Buton ajutor contextual `?`

- Pe **fiecare pagină** există un buton `?` mic
- Tap → tooltip scurt sau panou lateral cu explicație contextuală a funcțiilor de pe acea pagină
- Limbaj simplu, exemple concrete

---

## 11. OFFLINE BEHAVIOR

### 11.1. Cache complet

După prima vizită, **toate documentele publice** sunt cache-uite local prin Service Worker. Mama poate naviga complet offline.

### 11.2. Conținutul mamei (Supabase)

- Citire offline: ultimele date sincronizate disponibile
- Scriere offline: stocată în IndexedDB local + sincronizată automat la următoarea conexiune
- Conflicte: vezi sync conflict resolution (12.3)

### 11.3. Agent AI offline

- Indicator clar "AI offline" când nu e net
- Funcționalități offline disponibile: TTS local, citire documente cached, navigare, memento-uri programate, notițe locale
- Funcționalități indisponibile: chat AI, traducere AI, OCR, căutare semantică, analiză imagini

---

## 12. SINCRONIZARE ȘI BACKUP

### 12.1. Backup automat zilnic

Cloudflare Workers cu cron trigger zilnic:

- Snapshot complet al conținutului mamei din Supabase
- Stocat într-un al doilea storage (alegere: bucket separat în Supabase, R2 Cloudflare, sau alt provider gratuit)
- Reținere 30 zile (rolling)
- Notificare admin la backup eșuat

### 12.2. Restore

- Admin poate restaura din backup prin Claude Code
- Comanda explicită cu confirmation gate

### 12.3. Sync conflict resolution

Scenariu: mama adaugă conținut în timp ce admin modifică din Claude Code.

Strategie:

- Fiecare modificare are timestamp + author
- **Last-write-wins** pentru cazuri simple (același câmp modificat)
- **Merge dialog** pentru cazuri complexe (modificări structurale concurente)
- Admin vede conflictele la `/onboard` cu opțiuni de rezolvare

---

## 13. LIMITELE SERVICIILOR EXTERNE — verificare obligatorie

Documentează în acest plan TOATE limitele serviciilor folosite, înainte de a recomanda stack-ul final. La fiecare folosire, semnalează limita rămasă admin.

### 13.1. GitHub Pages (hosting public)

- Bandwidth: 100 GB/lună (soft limit)
- Repo size: 1 GB (soft), max 100 MB/fișier (hard)
- Build time: 10 min/build (hard)
- Builds: 10/oră (soft)
- **Suficient pentru proiect:** ✅ Da

### 13.2. GitHub Actions (CI/CD pentru deploy)

- 2.000 minute/lună free pentru repo private
- **Nelimitat pentru repo public** ✅
- **Suficient:** ✅ Da

### 13.3. Cloudflare Workers (proxy + AI gateway + cron)

- 100.000 cereri/zi (free)
- 10 ms CPU/cerere (free)
- 30 sec timeout/cerere (free)
- Limit storage Workers KV: 1 GB free
- **Suficient pentru proiect:** ✅ Da, generos

### 13.4. Supabase (storage privat mama)

- 500 MB database
- 1 GB file storage
- 2 GB bandwidth/lună
- 50 MB max/fișier
- 50.000 cereri auth/lună
- **Atenție:** ⚠️ Dacă mama urcă multe poze, atinge limita stocării. Documentează strategie de purge sau upgrade.

### 13.5. AI providers

**Verificare obligatorie de Claude Code înainte de implementare.** Pentru fiecare cheie API existentă în memoria globală admin (~20 chei stocate):

- Validitate cheie
- Modele disponibile pe planul gratuit
- Limite: cereri/zi, tokens/zi, RPM, latency
- Capabilități: text, voce, viziune, OCR, traducere
- Cost dacă se depășește planul gratuit

**Output cerut:** raport tabular către admin cu recomandare top 4 providers per nivel din fallback chain (Primary capabilitate maximă, Secondary viteză, Tertiary open-source, Fallback ultim).

### 13.6. Limite pe care admin trebuie să le cunoască

- **GitHub Pages:** propagare deploy 1-2 minute după push
- **Cloudflare Workers:** propagare deploy ~30 sec
- **Supabase:** sincronizare instantă
- **PWA cache:** mama vede update doar la următorul refresh sau auto-detect via service worker (configurat să verifice version.json la fiecare deschidere)

---

## 14. TESTING CHECKLIST FINAL

Înainte de a anunța admin că e gata pentru livrare, Claude Code rulează:

### 14.1. PWA functional tests

- [ ] Manifest valid (validator W3C)
- [ ] Service worker funcțional
- [ ] Instalare pe Chrome Android (simulator + device real dacă disponibil)
- [ ] Iconiță vizibilă pe ecranul principal
- [ ] Splash screen funcțional
- [ ] Standalone mode (fără bara browser)

### 14.2. API tests

- [ ] Toate endpoint-urile Cloudflare Workers răspund corect
- [ ] Auth proxy funcțional
- [ ] Rate limiting funcțional
- [ ] Toate cheile AI testate cu cereri reale

### 14.3. Web Speech API

- [ ] Speech Recognition în limba română (`ro-RO`) funcționează
- [ ] Speech Synthesis (TTS) cu voce română disponibilă
- [ ] Fallback graceful dacă API-ul nu e suportat

### 14.4. Offline mode

- [ ] Toate documentele publice accesibile offline după prima vizită
- [ ] Notițe locale salvate în IndexedDB
- [ ] Sincronizare automată la reconectare

### 14.5. Cross-browser

- [ ] Chrome Android (target principal)
- [ ] Chrome desktop
- [ ] Safari iOS (best effort, secundar)

### 14.6. AI fallback chain

- [ ] Cădere automată la nivelul următor când Primary e indisponibil
- [ ] Logging clar al nivelului folosit per cerere
- [ ] Cached response funcțional ca ultim resort

### 14.7. Accessibility (mama, ~60 ani)

- [ ] Contrast WCAG AA minim
- [ ] Tap targets minim 44x44 px
- [ ] Mesaje de eroare clare în română
- [ ] Confirmation dialogs pentru acțiuni distructive

### 14.8. Real device test

- [ ] Test pe telefonul real al mamei înainte de "go live"

---

## 15. ANEXE

### Anexa A — Mesaje rotative welcome page (120 mesaje, 6 teme × 20)

#### Tema 1: FAMILIE

1. Bună, mami. Ești inima familiei noastre.
2. Mami, fără tine zilele ar fi mai puține și mai pustii.
3. Familia noastră e tot mai frumoasă pentru că tu ești în mijlocul ei.
4. Ești punctul de plecare pentru toți cei dragi. Niciodată nu uităm asta.
5. Mami, masa noastră e plină când tu stai la capul ei.
6. Toți copiii și nepoții se întorc acasă pentru că acolo ești tu.
7. Familia ține pentru că tu ai ținut-o cu mâinile tale.
8. Casa noastră miroase a tine, oricât de departe am fi.
9. Ai născut o familie cu mâinile, sufletul și răbdarea ta. Suntem aici.
10. Bună dimineața, mami. Familia te îmbrățișează din toate colțurile lumii.
11. În rugăciunile noastre tu ești prima și ultima.
12. Niciun fotoliu nu se aseamănă cu locul tău din sufragerie.
13. Mami, vocea ta e cântec pentru toți cei care te iubesc.
14. Familia e un copac pe care tu l-ai sădit cu lacrimi și grijă. Acum dă rod.
15. Bună, mami. Toți câți te iubesc se gândesc la tine acum.
16. Tu ești motivul pentru care zicem "acasă" cu căldură.
17. Familia noastră are povești frumoase pentru că tu le-ai trăit prima.
18. Niciodată să nu te simți singură. Familia e cu tine, în fiecare clipă.
19. Mami, copiii tăi te poartă în inimă, oriunde ar fi.
20. Familia se ține din iubirea ta. Nu uita asta niciodată.

#### Tema 2: IUBIRE

1. Mami, ești iubită mai mult decât poți să crezi.
2. Iubirea ta a făcut posibile lucruri pe care alții nici nu le visează.
3. Bună dimineața, suflet bun. Ești iubită profund.
4. Iubirea pe care o dai se întoarce de mii de ori, doar că nu vezi tu toate.
5. Mami, ești iubită simplu, sincer, fără condiții.
6. Inima ta e plină pentru că ai iubit fără să țină cont de oboseală.
7. Cei care te iubesc se trezesc azi gândindu-se la tine.
8. Iubirea pe care ai dăruit-o copiilor tăi crește în fiecare zi.
9. Bună, mami. Azi cineva îți mulțumește în gând pentru că exiști.
10. Iubirea nu se termină. Ce ai dat tu, va dura generații.
11. Ești iubită de Dumnezeu, de copii, de nepoți, de toți care te-au cunoscut bine.
12. Iubirea ta e medicament când nu ne mai înțelegem cu nimeni altcineva.
13. Mami, ești îmbrățișată în spirit chiar și atunci când ești singură în cameră.
14. Iubirea pe care o porți te face frumoasă, indiferent de oglindă.
15. Bună dimineața. Cineva spune azi mulțumesc pentru tine.
16. Iubirea ta nu trebuie demonstrată — se vede și se simte.
17. Mami, ești ascultată cu inima de cei care te știu cu adevărat.
18. Iubirea ta a vindecat răni pe care nu ai văzut tu.
19. Tu ai iubit fără să ceri. Asta e cea mai mare formă de iubire.
20. Bună, mami. Azi iubirea ta strălucește și luminează zile grele.

#### Tema 3: MOTIVAȚIE

1. Mami, fiecare pas pe care îl faci azi contează. Indiferent cât de mic.
2. Bună dimineața. Azi e o zi nouă, plină de posibilitate.
3. Forța ta e mai mare decât crezi. Ai dovedit-o de mii de ori.
4. Mami, nu trebuie să faci totul azi. Doar un singur lucru bun.
5. Fiecare zi în care te ridici e o victorie. Nu uita asta.
6. Ai trecut prin lucruri grele. Ai puterea pentru orice urmează.
7. Bună, mami. Azi un pas mic înainte e mult.
8. Tu ai învățat copiii să nu renunțe pentru că tu n-ai renunțat.
9. Mami, începe ziua cu o respirație adâncă. Restul vine.
10. Energia ta nu trebuie să fie maximă. Trebuie doar să fii prezentă.
11. Bună dimineața. Azi te poți bucura de un singur lucru. Caută-l.
12. Ai trecut peste ieri. Vei trece și peste azi.
13. Mami, valoarea ta nu se măsoară în cât faci. Se măsoară în cine ești.
14. Fiecare zi e o pagină nouă. Scrie-ți doar un rând bun azi.
15. Bună, mami. Tu ești motiv suficient pentru azi.
16. Curajul nu e absența fricii. E să mergi mai departe cu ea.
17. Mami, oboseala e semnal că ai iubit mult. Odihnește-te fără vină.
18. Mâinile tale au făcut atâtea. Dă-le pauză când au nevoie.
19. Bună dimineața. Pasul de azi nu trebuie să fie mare. Doar adevărat.
20. Mami, ești suficientă exact așa cum ești acum.

#### Tema 4: RESPECT

1. Mami, ești respectată pentru tot ce ai făcut, văzut sau nevăzut.
2. Bună dimineața. Mulțumesc pentru tot ce ai dat fără să ceri.
3. Respectul pentru tine e câștigat, nu cerut. Ai câștigat mult.
4. Mami, înțelepciunea ta e prețuită de cei care ascultă cu inima.
5. Vorbele tale au greutate pentru că vin din experiență trăită.
6. Bună, mami. Cuvântul tău încă schimbă vieți.
7. Respectul pentru mame e moștenirea cea mai sfântă a familiei.
8. Mami, fiecare lecție pe care ai dat-o e încă vie în noi.
9. Te respectăm nu doar ca mamă. Te respectăm ca persoană puternică.
10. Bună dimineața. Înțelepciunea ta valorează mai mult decât orice avere.
11. Mami, te respectăm pentru deciziile pe care le-ai luat când n-aveai resurse.
12. Respectul pentru tine se vede în cât de mult ne dorim să fim ca tine.
13. Tu ne-ai învățat ce înseamnă să fii demn. Mulțumesc.
14. Bună, mami. Fiecare alegere a ta a contat pentru cineva.
15. Mami, ești un model fără să fi încercat să fii unul.
16. Respectul nostru pentru tine nu se diminuează cu trecerea anilor.
17. Înțelepciunea ta e moștenirea pe care n-o poate fura nimeni.
18. Bună dimineața. Tot ce știm bun, am învățat de la tine sau prin tine.
19. Mami, ești auzită. Cuvintele tale rămân.
20. Respectul cel mai adânc e pentru cei care iubesc fără să ceară. Tu ești asta.

#### Tema 5: LUCIDITATE

1. Mami, mintea ta e clară azi. Ai timp să gândești fiecare pas.
2. Bună dimineața. Concentrează-te doar pe ce e în fața ta acum.
3. Luciditate nu înseamnă să știi totul. Înseamnă să fii prezentă.
4. Mami, nu te grăbi. Lucrurile bune se întâmplă în ritmul lor.
5. O minte calmă vede mai limpede decât o minte agitată. Respiră.
6. Bună, mami. Azi privește lumea cu ochii proaspeți.
7. Luciditatea vine din pauze. Permite-ți o pauză când simți nevoia.
8. Mami, fii blândă cu tine. Mintea ta nu trebuie să fie perfectă, doar prezentă.
9. Limpezimea de gând se construiește pas cu pas, nu dintr-o dată.
10. Bună dimineața. Azi un singur lucru clar e suficient.
11. Mami, întrebările tale sunt bine venite. Răspunsurile vor veni la timp.
12. Liniștea de minte se găsește în lucruri mici: o ceașcă de ceai, lumina dimineții.
13. Bună, mami. Nu trebuie să rezolvi totul azi.
14. Luciditatea e prietena răbdării. Respiră adânc.
15. Mami, mintea ta funcționează frumos. Dă-i credit.
16. Limpezimea apare când nu o forțezi. Las-o să vină.
17. Bună dimineața. Azi privește cerul. E o lecție de limpezime.
18. Mami, gândurile încurcate se descurcă când le aerisești.
19. Luciditatea nu e absența emoțiilor. E să le observi cu blândețe.
20. Bună, mami. Mintea ta e mai puternică decât simți acum.

#### Tema 6: CLARITATE MINTALĂ ȘI VIZUALĂ

1. Mami, ochii tăi văd mai mult decât crezi. Au văzut viața.
2. Bună dimineața. Azi privește lumea cu blândețe, nu cu critică.
3. Claritatea vine cu odihnă. Nu te grăbi să vezi totul.
4. Mami, lumina dimineții îți face bine. Stai un moment în ea.
5. Privește la ce e aproape. De aproape vine cea mai mare frumusețe.
6. Bună, mami. Astăzi un singur lucru frumos e suficient să-ți facă ziua.
7. Claritatea vizuală vine cu pauze de la ecran. Privește departe.
8. Mami, ochii obosesc. Închide-i 10 minute. Mintea se limpezește.
9. Limpezimea de minte și de privire vin împreună. Hidratează-te.
10. Bună dimineața. Azi observă o singură frumusețe în jurul tău.
11. Mami, contrastul e prieten. Lumina bună schimbă tot.
12. Claritate vizuală: privește verde 5 minute pe zi. Ochii odihnesc.
13. Bună, mami. Astăzi cere ceea ce nu ai înțeles. Nu e rușine.
14. Mintea limpede face ochi limpezi. Scrie un singur lucru azi.
15. Mami, citește cu pauze. Ce înțelegi rămâne, ce uiți reapare.
16. Bună dimineața. O cană de apă acum face minuni pentru concentrare.
17. Claritatea de gândire vine cu somn bun. Permite-ți să te odihnești.
18. Mami, dacă ceva e neclar, întreabă-mă. Sunt aici.
19. Privirea ta e prețioasă. Ai grijă de ea cu pauze regulate.
20. Bună, mami. Azi ochii și mintea ta sunt în armonie. Te ajut eu cu restul.

---

### Anexa B — Workflow exemplu pentru "mama adaugă o poză"

1. Mama deschide aplicația.
2. Apăsă butonul "Adaugă poză" (camera) sau "Încarcă poze" (galerie).
3. Selectează 1-10 poze.
4. Aplicația le upload-ează prin Cloudflare Worker → Supabase.
5. AI-ul analizează contextul (vede ce arată poza) → propune tab-ul potrivit + titlu.
6. Mama confirmă sau schimbă tab-ul.
7. Pozele apar instantaneu în tab-ul ales + în "Galeria mea" + în "Adăugările mele".
8. Audit log: `[timestamp] mama adăugat 3 poze în tab "Livadă" cu titlul "Pomi înflorit"`.
9. Admin la următorul `/onboard` vede notificarea modificărilor.

---

### Anexa C — Decizii de luat de Claude Code (rezumate)

În prima propunere către admin, Claude Code trebuie să răspundă la:

1. **Stack frontend:** ce framework (sau vanilla)?
2. **Bibliotecă PWA:** Workbox sau scriere directă a service worker-ului?
3. **Bibliotecă randare DOCX/PDF:** mammoth.js, PDF.js, alte alternative?
4. **Provider AI per nivel din fallback chain** (după verificarea cheilor):
   - Nivel 1 Primary: ?
   - Nivel 2 Secondary: ?
   - Nivel 3 Tertiary: ?
   - Nivel 4 Fallback: cached + mesaj polițios
5. **Format fișiere documentație din folderul principal:** mix MD/JSON/YAML? Doar MD? Justifică.
6. **Convenție denumire:** kebab-case, snake_case, camelCase? Justifică.
7. **Strategie versioning:** SemVer pentru release-uri? Tag-uri Git?
8. **Cron schedule pentru backup zilnic:** la ce oră (UTC)?
9. **Strategie purge poze vechi din Supabase:** după cât timp? sau la ce limită storage?
10. **Audio pian pentru fundal:** sugerează o sursă concretă cu licență liberă verificată.

---

## 16. CHECKLIST FINAL ÎNAINTE DE LIVRARE

- [ ] Toate cele 14 secțiuni implementate
- [ ] 120 mesaje rotative integrate
- [ ] Fallback chain AI testat funcțional pe toate cele 4 nivele
- [ ] Privacy: zero conținut personal mama vizibil în repo public
- [ ] Auth: zero chei API expuse în browser
- [ ] PWA instalabil pe Android Chrome cu iconiță și splash
- [ ] Toate comenzile vocale funcționale în limba română
- [ ] Backup automat zilnic verificat
- [ ] Audit trail funcțional
- [ ] Dashboard admin cu PIN funcțional
- [ ] `/onboard` slash command implementat
- [ ] Documentație internă structurată pentru parcurgere rapidă (Regula 0.1.4)
- [ ] Test pe telefonul real al mamei

---

## 17. ADENDĂ POST-CERCETARE — 2026-05-01

> **Statut:** corpul documentului (secțiunile 0-16) este NEATINS. Această adendă reflectă deciziile finale luate după integrarea raportului `PROIECT_MAMI_DOCS_RESEARCH.md` (cercetare aprilie 2026, surse verificate) și a feedback-ului admin (Roland) din 2026-05-01.
>
> **REGULĂ CRITICĂ:** la conflict între corpul documentului și această adendă, **ADENDA ARE PRIORITATE**. Implementatorul (Sonnet 4.6 / sesiuni Claude Code viitoare) folosește această adendă ca sursă autoritativă.

### 17.1. Anexa C v2 — Decizii tehnice finale (ÎNLOCUIEȘTE Anexa C originală)

| #   | Decizie                            | Versiune finală                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| --- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Stack frontend                     | Vanilla JS + Web Components + Vite (build static)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 2   | PWA helper                         | Workbox                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 3   | Randare docs                       | mammoth.js (DOCX) + PDF.js (PDF) + marked (MD) + SheetJS (XLSX) + native `<img>/<video>/<audio>` + **Tesseract.js** (OCR offline cu `ron` lang pack) + **transformers.js** (embeddings offline browser-side) + **jsPDF** (PDF medical client-side)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 4   | AI fallback (stratificat USE-CASE) | **Conversațional text:** Groq Llama 3.3 70B → Groq Llama 3.1 8B → Cerebras Llama 70B → OpenRouter `:free` rotație + cached. **Vision/OCR:** Tesseract.js client → Gemini 2.5 Flash → Flash-Lite → Mistral OCR. **Embeddings (DECIZIE PERMANENTĂ):** `gemini-embedding-001` (cu coloană `embedding_model_version` în schema pentru migrare) → transformers.js → Cohere Multilingual → Mistral Embed. **STT:** Web Speech API `ro-RO` → Groq Whisper Large v3 → Cloudflare Workers AI Whisper. **TTS:** Web Speech API `ro-RO` → Google Cloud TTS via CallMeBot. **Traducere:** DeepL ×2 chei (1M caract/lună) → Azure Translator ×2 chei (4M caract/lună). **Web search:** Brave (2K/lună) → Tavily (1K/lună) → Jina Reader (1M tokens). **EXCLUSE pentru date personale/medicale:** DeepSeek (servere China, GDPR risk), Anthropic/OpenAI runtime (cost), xAI Grok cu data sharing activat. |
| 5   | Format docs principal              | Mix MD (text uman/AI) + JSON (structuri programabile: SITEMAP.json, welcome-messages.json, manifest, version.json, configs)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 6   | Convenție denumire                 | kebab-case (fișiere/foldere); ALL*CAPS doar pentru protocol files (CLAUDE.md, MEMORY.md, README.md, SITEMAP.json, PLAN*\*.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 7   | Versioning                         | SemVer + Git tags (`vX.Y.Z`) + `version.json` rădăcină pentru SW                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 8   | Cron backup zilnic                 | **02:00 UTC** (~05:00 RO iarnă / 04:00 RO vară)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 9   | Purge poze Supabase                | Auto-resize la upload (max 1920px, 80% JPEG) + soft-delete 30 zile + arhivă **Cloudflare R2 la 60 zile** nereaccesare (cu thumbnail Supabase) + alert admin la 80% storage                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 10  | Audio                              | **Bensound `tenderness.mp3`** (CC-BY, atribuție în Setări/Despre) ambient + `alarm_clock_loop.mp3` separat pentru ntfy priority 5. Verificare licență finală la implementare prin WebFetch.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

### 17.2. Decizii tehnice NOI forțate de cercetare (Anexa C extinsă 11-17)

| #   | Decizie                            | Detaliu                                                                                                                                                                                                                                                                                                                                |
| --- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 11  | **Hosting deploy**                 | **Cloudflare Pages** (bandwidth nelimitat) conectat la repo GitHub public. GitHub Pages rămâne dezactivat sau ca backup secundar. URL: `https://mami-docs.pages.dev` (custom domain ulterior).                                                                                                                                         |
| 12  | **Notification stack stratificat** | **ntfy.sh priority 5** (canal Android dedicat cu ringtone alarm) + **Telegram Bot** (`TELEGRAM_BOT_TOKEN` deja existent, NELIMITAT) + **CallMeBot Voice Call** (gratuit personal, TTS ro) + **FCM topic dedicat** (redundanță). Targetare strictă cu `device_role` ('mom'/'admin') în Supabase — admin NU primește reminder-ele mamei. |
| 13  | **Backup primar**                  | **Cloudflare R2** (egress 0, 10GB free) zilnic. Secundar opțional săptămânal Storj sau Backblaze B2 (regulă 3-2-1).                                                                                                                                                                                                                    |
| 14  | **Supabase keepalive**             | Cron Cloudflare Workers la **fiecare 4 zile** cu `SELECT 1` pe tabelă publică (anti-pauză 7 zile). **OBLIGATORIU de la MVP**, nu lăsat pentru mai târziu.                                                                                                                                                                              |
| 15  | **Cron infrastructură**            | **Cloudflare Workers Cron** (granularitate 1 min, fără 60-zile-deactivate problem). NU GitHub Actions pentru cron-uri active.                                                                                                                                                                                                          |
| 16  | **Weather data**                   | **Open-Meteo API** (gratuit, fără key, User-Agent identificat). Pentru locația mamei (configurabil în Setări).                                                                                                                                                                                                                         |
| 17  | **Drug interactions**              | **RxNorm REST API** + **openFDA Drug API** (ambele gratuite, fără key). Mapare denumiri RO→EN via Gemini Flash (acuratețe ~70%). Disclaim "verifică farmacistul" obligatoriu în UI.                                                                                                                                                    |

### 17.3. Servicii free SUPLIMENTARE confirmate de admin (post-verificare 54 chei API existente)

| Serviciu               | Cheie env var                           | Limită                                                                 | Use în proiect                                                                                                             | Fază      |
| ---------------------- | --------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | --------- |
| **Adobe PDF Services** | `ADOBE_API_KEY` + `ADOBE_CLIENT_SECRET` | **500 tranzacții/lună**                                                | Split/merge/extract text PDF avansat — randare îmbunătățită, generare PDF medical îmbogățit                                | Faza 1+   |
| **GitHub Models**      | `GITHUB_TOKEN`                          | **50-150 RPD** (GPT-5, GPT-4.1, Llama, Phi, Mistral, DeepSeek prin GH) | GPT-5 **GRATUIT** pentru cazuri excepționale unde Gemini/Groq nu sunt suficienți (raționament complex, traducere nuanțată) | Faza 1.5+ |

### 17.4. EXCLUSE definitiv (override la spec original)

| Element                                | Motiv                                                                                                                                                                   |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Plant.ID + PlantNet**                | Implementate în proiect separat (`Livada`) — nu se duplică în Mami_Docs. Tab "Livadă" din Mami_Docs rămâne pentru documente text/foto, nu identificare automată plante. |
| DeepSeek direct via `DEEPSEEK_API_KEY` | Servere China, risc GDPR pentru date medicale (Italia a interzis în 2025). Permis DOAR pentru cereri non-personale (rețete generice) sau exclude complet.               |
| Anthropic / OpenAI runtime             | Cost — rezervate strict pentru dev-time admin (Claude Code).                                                                                                            |
| xAI Grok cu data sharing activat       | Privacy concerns.                                                                                                                                                       |

### 17.5. Roadmap 5 faze (ADAUGĂ la spec original — secțiunea 8 din spec rămâne valabilă pentru workflow conținut)

| Fază                         | Durată est.                | Conținut principal                                                                                                                                                                                        |
| ---------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **0 — Foundation**           | sesiunea curentă, 1-2 zile | Folder, regulament proiect, plan execuție, decizii Anexa C v2, memorie. Fără cod, fără git push.                                                                                                          |
| **1 — MVP PWA**              | 1-2 săpt.                  | Schelet PWA + manifest + Workbox SW + tab structure + randare docs + AI fallback inițial (Groq+Gemini) + Web Speech ro-RO + 120 mesaje rotative + audio ambient + deploy Cloudflare Pages                 |
| **1.5 — AI core + agenți**   | 1 săpt.                    | Fallback chain complet + system prompts per tab + OCR cascadă (Tesseract → Gemini) + memo vocal Whisper + capabilități AI standard ("explică simplu", "rezumat 3p", calculator, conversie unități)        |
| **2 — Wellness + reminders** | 2 săpt.                    | Supabase keepalive + backup R2 + stack notificări (ntfy+Telegram+CallMeBot+FCM) + reminder telefon-sună + hidratare cu Open-Meteo + semne vitale + tracker somn + check-in emoțional + auto-sumar nocturn |
| **3 — Memorie lungă + RAG**  | 2 săpt.                    | pgvector + RAG documente + AI proactiv contextual + jurnal wellness + pattern simptome + family sharing RLS + PDF medical jsPDF + galerie unificată + bookmarks + highlights                              |
| **4 — Avansate**             | 1-2 săpt.                  | RxNorm + openFDA interacțiuni medicamente + meniu săptămânal generat + traducere multi-limbă + admin PIN mode + dashboard quote-uri + backup secundar săptămânal + go-live test pe telefonul real         |

### 17.6. Features wellness/medical adăugate (15 features noi vs spec original — sursă: raport cercetare sec. 4)

| Cod | Feature                                                   | Fază       |
| --- | --------------------------------------------------------- | ---------- |
| A1  | Memorie pe termen lung cu pgvector + Gemini Embedding     | 2          |
| A2  | RAG pe documentele mamei (top-5 similarity injection)     | 3          |
| A3  | Agenți specializați per tab via system prompts            | 1.5        |
| A4  | Auto-sumarizare nocturnă cu Cerebras 70B                  | 2          |
| A5  | AI proactiv contextual (sezon/oră/locație + Brave Search) | 3          |
| B1  | Reminder medicamente cu telefon-sună stratificat          | 2 (CRITIC) |
| B2  | Jurnal wellness AI cu voice 30 sec/zi                     | 3          |
| B3  | Hidratare legată de vreme (Open-Meteo)                    | 2          |
| B4  | Tracking semne vitale + chart.js                          | 2          |
| B5  | Pattern recognition simptome                              | 3          |
| B6  | Interacțiuni medicamente RxNorm/openFDA                   | 4          |
| B7  | Tracker somn (input simplu + grafic)                      | 2          |
| B8  | Check-in emoțional zilnic empatic                         | 2          |
| B9  | Family wellness sharing cu RLS strictă (acord explicit)   | 3          |
| B10 | Generare PDF medical pentru consultație (jsPDF + Adobe)   | 3          |

### 17.7. Disclaimers obligatorii (override pe orice feature wellness/medical)

Pentru orice feature B1-B10 și pentru output AI care atinge subiecte medicale, afișare obligatorie în UI **înainte de prima utilizare** + reminder lunar:

> **⚠️ Aceasta NU este consultație medicală. Verifică întotdeauna cu medicul sau farmacistul. Aplicația oferă informații pentru orientare personală și NU înlocuiește consultul de specialitate.**

Texte oficiale complete (variante per context): `docs/medical-disclaimers.md` (creat în Faza 0 task 11).

### 17.8. Surse de adevăr în repo (cu prioritate)

1. **`PROIECT_MAMI_DOCS_SPEC.md`** — corp + această adendă (referință permanentă, ADENDA peste corp la conflict)
2. **`PROIECT_MAMI_DOCS_RESEARCH.md`** — raport cercetare aprilie 2026 (detalii limite servicii, alternative, caveats critice)
3. **`docs/decisions/0001-anexa-c-decisions.md`** — ADR cu rationale per decizie din Anexa C v2
4. **`docs/ai-fallback-chain.md`** — specificație tehnică completă lanț AI per use-case
5. **`docs/notification-stack.md`** — strategia notificări stratificate ntfy/Telegram/CallMeBot/FCM
6. **`docs/service-limits.md`** — limite consolidate per furnizor cu reset window
7. **`docs/medical-disclaimers.md`** — texte oficiale române disclaimer wellness/medical
8. **`docs/api-keys-map.md`** — map env vars folosite în proiect (FĂRĂ valori)
9. **`docs/roadmap.md`** — plan livrabile per fază
10. **`docs/stack.md`** — stack final cu rationale per librărie
11. **`PLAN_initiere_proiect_2026-05-01.md`** — plan execuție cu checklist bifabil
12. **`SITEMAP.json`** — hartă sistem auto-actualizată

### 17.9. Confirmări admin 2026-05-01 (audit trail)

- ✅ Repo: `https://github.com/RolandPetrila/mami-docs.git` (public, branch `main`)
- ✅ Stil colaborare: răspunsuri terse + recomandare ideală per decizie, fără liste de opțiuni
- ✅ Toate cele 17 decizii Anexa C v2 confirmate
- ✅ Cloudflare Pages ca primary hosting (vs GitHub Pages original din spec)
- ✅ Stack notificări stratificat ntfy + Telegram + CallMeBot + FCM cu device_role targeting
- ✅ Cloudflare R2 ca backup primar (egress 0)
- ✅ Supabase keepalive obligatoriu de la MVP
- ✅ Adobe PDF Services adăugat ca feature potențial Faza 1+
- ✅ GitHub Models GPT-5 free disponibil pentru cazuri excepționale Faza 1.5+
- ❌ Plant.ID + PlantNet EXCLUSE (implementate în proiect separat "Livada")

---

**SFÂRȘIT DOCUMENT.**

**Pași imediați pentru Claude Code:**

1. Citește acest document complet.
2. Pregătește răspunsurile la Anexa C (10 decizii tehnice).
3. Propune structura folder principal.
4. Cere-mi confirmare înainte de orice acțiune.
5. Apoi creează fișierele de regulament și memorie automat.
