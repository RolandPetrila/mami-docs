# Roadmap Mami_Docs — Livrabile UI/UX

**Data:** 2026-05-01 | **Versiune:** 1.0  
**Scop:** Features bifabile per fază cu focus pe experiența utilizatoarei (mama).

> Sincronizat cu `plans/PLAN_initiere_proiect_2026-05-01.md` — acolo e statusul execuției, aici e viziunea UX.

---

## Faza 0 — Foundation ✅ (în execuție)

> Zero cod, zero UI. Structură + documentație + decizii.

- [x] Structură directoare proiect
- [x] Documentație completă (ADR, stack, AI fallback, notificări, limite servicii, disclaimere)
- [x] Plan de proiect cu 5 faze
- [x] Chei API verificate (54/54 SET)
- [ ] SITEMAP.json generat
- [ ] README.md public repo
- [ ] .gitignore

---

## Faza 1 — MVP PWA (1-2 săptămâni)

> Prima versiune funcțională pe care mama o poate instala și folosi.

### Instalare & Offline

- [ ] Instalare pe home screen Android (Web App Manifest)
- [ ] Funcționare offline pentru documente deja vizualizate (Workbox cache)
- [ ] Indicator "ești offline" vizibil și discret
- [ ] Update automat app (Service Worker) cu notificare "Versiune nouă disponibilă"

### Navigare & Interfață

- [x] **Hamburger sticky în header** (per spec §6.2 + RUNDA 3 admin) cu drawer slide-out + buton ⚙️ Setări
- [x] **Tab-uri DINAMICE** din `src/data/tabs.ts` (NU hardcode "Rețete/Livadă/etc."). Inițial doar `Chat AI`; admin adaugă tab-uri pe măsură ce inserează documente via Claude Code laptop
- [x] Tab-uri preferate inline în header pe ecrane ≥640px (max 3); restul în drawer hamburger
- [ ] Design simplu, text mare, contrast ridicat (WCAG AA)
- [ ] Tap targets ≥44×44px pe toate butoanele
- [ ] Navigare cu gesturi swipe între tab-uri
- [ ] Buton "Acasă" întotdeauna vizibil

### Documente

- [ ] Randare DOCX (rețete, documente Word)
- [ ] Randare PDF (acte, rețete medicale scanate)
- [ ] Randare Markdown (notițe, sfaturi)
- [ ] Randare XLSX (tabele vitamine, program)
- [ ] Vizualizare poze (JPG/PNG cu zoom)
- [ ] Player audio/video simplu
- [ ] Căutare în documente (text simplu)
- [ ] Adobe PDF Services pentru extract text/randare PDF avansată (500 tranz/lună)

### Chat AI

- [ ] Buton microfon mare și vizibil (comandă vocală)
- [ ] Buton "Ascultă răspunsul" (TTS ro-RO)
- [ ] 120 mesaje rotative de salut/motivare la deschidere app
- [ ] Context per tab (Rețete → AI știe că e despre gătit)
- [ ] Indicator "AI gândește..." cu animație

### Audio Ambient

- [ ] Muzică de fundal `tenderness.mp3` (Bensound) — on/off din setări
- [ ] Volum reglabil separat pentru muzică vs voce

### Deploy

- [ ] URL public funcțional pe Cloudflare Pages
- [ ] Supabase keepalive activ (cron la 4 zile)
- [ ] `version.json` actualizat la fiecare release

---

## Faza 1.5 — AI Core + Agenți (1 săptămână)

> AI devine mai deștept și mai fiabil.

### AI Avansat

- [ ] Fallback complet implementat (toate cele 8 categorii)
- [x] OCR pe poze: "Fotografiează rețeta" → text extrass automat
- [x] Transcriere memo vocal: "Dictează o notă" → text salvat
- [x] Sumarizare document: "Explică-mi pe scurt" → 3-5 rânduri
- [x] Traducere rapidă: "Traduce asta în română"
- [ ] Căutare web: "Ce vreme e mâine?"
- [ ] GitHub Models GPT-5/GPT-4.1 ca fallback excepțional (50-150 RPD, via GITHUB_TOKEN)

### Context & Personalizare

- [x] System prompt per tab (default fallback la generic; admin configurează când creează tab nou via Claude Code)
- [ ] AI știe că răspunde mamei (ton cald, explicații simple, fără jargon medical)
- [ ] Istoricul conversației în sesiune (uitat la închiderea tab-ului, privacy first)

---

## Faza 2 — Wellness + Reminders (2 săptămâni)

> App devine asistentul zilnic al mamei.

### Notificări & Alarme

- [ ] Reminder medicamente (dimineață/prânz/seară) cu sunet puternic
- [ ] Reminder hidratare la fiecare 2-3 ore
- [ ] Apel telefonic dacă nu răspunde la reminder (CallMeBot, ultimul resort)
- [ ] Mama poate dezactiva individual fiecare tip de reminder din UI

### Tracking Sănătate

- [ ] Semne vitale: tensiune arterială (sistolică/diastolică), puls
- [ ] Greutate zilnică cu grafic săptămânal simplu
- [ ] Temperatură corporală
- [ ] Nivel energie (😴😐😊😄) — tap simplu

### Somn

- [ ] "La culcare" / "M-am trezit" — înregistrare automată ore somn
- [ ] Grafic somn săptămânal
- [ ] Notă opțională "Cum te-ai simțit la trezire"

### Check-in Emoțional

- [ ] Întrebare zilnică la ora 10:00: "Cum te simți azi?" — 5 emoji
- [ ] Notă scurtă opțională
- [ ] Sumar nocturn generat de AI (22:30): ce a fost bine, ce urmează mâine

### Backup

- [ ] Backup zilnic automat Supabase → R2 (02:00 UTC)
- [ ] Alert Telegram admin la backup eșuat
- [ ] Alert admin la 80% storage Supabase

---

## Faza 3 — Memorie Lungă + RAG (2 săptămâni)

> App ține minte și ajută mama cu informații din propriile ei documente.

### Căutare Semantică (RAG)

- [ ] "Caută rețete cu pui" → găsește în toate documentele, nu doar titluri
- [ ] "Ce tensiune am avut săptămâna trecută?" → răspuns din jurnal
- [ ] "Am mai luat Nurofen?" → verifică jurnalul medicamentelor

### AI Proactiv

- [ ] "Mâine e ziua lui [X]" — memento aniversări dacă sunt notate
- [ ] "Ai tensiune mai mare ca de obicei azi" — pattern detection (discret, nu alarmist)
- [ ] Sugestii contextuale: "Ai rețeta de fasole în tab Rețete"

### Jurnal Wellness

- [ ] Calendar vizual wellness (emoji per zi)
- [ ] Generare PDF medical pentru consultație (jsPDF client-side + Adobe PDF Services pentru îmbogățire)
- [ ] Grafice evoluție pe 30/90 zile

### Familie & Sharing

- [ ] Admin (Roland) poate vedea jurnalul wellness al mamei (cu acordul ei)
- [ ] Admin poate adăuga documente noi de pe laptop
- [ ] Notificări relevante pentru admin (nu remindere personale mama)

### Galerie & Memorii

- [ ] Galerie foto cu upload direct de pe telefon
- [ ] Auto-resize la upload (max 1920px, 80% JPEG)
- [ ] Arhivare automată la 60 zile nereaccesare → R2 (cu thumbnail vizibil)
- [ ] Bookmarks în documente ("Marchează această rețetă")
- [ ] Highlights text în documente

---

## Faza 4 — Avansate + Go-Live (1-2 săptămâni)

> Funcții avansate + testing pe telefon real mama.

### Medicamente

- [ ] "Verifică interacțiunile între X și Y" → RxNorm + openFDA
- [ ] Disclaimer medical afișat obligatoriu înainte de rezultat
- [ ] PDF "Sumar medicamente" printabil pentru medic

### Meniu & Nutriție

- [ ] Generator meniu săptămânal (AI bazat pe preferințele mamei)
- [ ] Lista de cumpărături generată din meniu
- [ ] Printare meniu (jsPDF)

### Traducere & Internațional

- [ ] Traducere document integral (DOCX/PDF/MD) la cerere
- [ ] UI disponibil în română (default) + maghiară (opțional, dacă familia are nevoie)

### Admin & Securitate

- [ ] Admin PIN mode: acces la setări avansate (fără să schimbe UI-ul mamei)
- [ ] Dashboard Roland: status backup, storage, erori, statistici utilizare
- [ ] Backup secundar săptămânal (Storj sau Backblaze B2)

### Inspirație zilnică

- [ ] Quote/gând zilnic la deschidere (din baza curatoriată sau AI generat)
- [ ] Vreme actualizată în header (Open-Meteo)

### Go-Live

- [ ] Test complet pe telefon real mama (Android Chrome)
- [ ] Lighthouse score ≥90 (PWA, Performance, Accessibility, Best Practices)
- [ ] Tutorial video scurt pentru mama (screen recording)
- [ ] Documentație utilizator simplificată (max 1 pagină A4 printată)

---

## Backlog (faza nedefinită)

- ~~Identificare plante din livadă~~ → **EXCLUS din Mami_Docs** — feature implementat în proiect separat "Livada"
- [ ] Rețete cu ingredient disponibil: "Am roșii, ce fac?"
- [ ] Integrare calendar (aniversări, programări medic)
- [ ] Mod întunecat (dark mode)
- [ ] Dimensiune font ajustabilă din UI (mama folosește zoom browser)
