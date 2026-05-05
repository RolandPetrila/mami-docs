# AGENT PROTOCOL — Mami_Docs

> **Scop:** reguli stricte de execuție pentru orice instanță Claude Code (Sonnet/Opus/Haiku) care lucrează la proiectul Mami_Docs.
> **Autoload:** acest fișier e referențiat din `CLAUDE.md` proiect și TREBUIE citit la prima interacțiune din orice sesiune.
> **Versiune:** 1.0 | **Dată:** 2026-05-01 | **Confirmat:** admin Roland Petrila

---

## 1. SELF-VERIFICATION CHECKLIST (obligatoriu înainte de orice raport `[AUDIT-X-DONE]` sau `[AUDIT-FINAL-FAZA-N]`)

Pentru **fiecare fix** sau **fiecare task** raportat ca "completat", rulează acești 3 pași în ordine:

### Pas 1 — Re-citește fișierul

După `Edit` sau `Write`, rulează `Read` pe fișierul modificat. **NU presupune că modificarea s-a aplicat doar pentru că tool-ul nu a returnat eroare.**

### Pas 2 — Caută stringul promis

Folosește `Grep` cu un pattern specific din modificarea promisă:

- Pentru "secțiune nouă": grep titlul secțiunii (ex: `## Servicii Suplimentare`)
- Pentru "rând nou în tabel": grep cuvântul cheie (ex: `Adobe PDF Services`)
- Pentru "ordine schimbată": grep ordinea exactă (ex: `1\..*ntfy`)

Dacă grep returnează 0 match-uri → fix-ul **NU e aplicat**, repetă editarea.

### Pas 3 — Citează în raport

Raportul `[AUDIT-X-DONE]` trebuie să includă pentru fiecare fix:

```
FIX N — file.md:LINE_NUMBER — citat exact din fișier
```

Exemplu corect:

```
FIX 2 — docs/decisions/0001-anexa-c-decisions.md:97 — "EXCLUS pentru date personale/medicale | DeepSeek (servere China, GDPR risk) · Anthropic/OpenAI runtime · xAI Grok cu data sharing"
```

Exemplu greșit (raport optimist):

```
FIX 2 — D4 EXCLUS extins cu Anthropic/OpenAI/xAI ✅
```

(fără linie, fără citat — interzis)

---

## 2. CITATION REQUIREMENT — formatul standard al raportului

```markdown
[AUDIT-FIX-DONE] / [AUDIT-FINAL-FAZA-N]

═══ FIX 1 / TASK 1 ═══
File: <path relativ la rădăcina proiectului>
Linii afectate: <range, ex: 84-97>
Verificare grep: `<pattern căutat>` → <N> match-uri
Citat (1-3 linii din fișier):

> <conținut exact>

═══ FIX 2 / TASK 2 ═══
... (la fel)

═══ Verificări auto-rulate ═══

- [ ] Read pe toate fișierele modificate ✓
- [ ] Grep pentru fiecare modificare ✓
- [ ] SITEMAP.json regenerat (versiune nouă) ✓
- [ ] MEMORY.md sincronizat cu fișierele referențiate ✓

═══ Întrebări admin / observații ═══
<dacă există>
```

**Regulă de aur:** dacă nu poți cita linia exactă, **fix-ul nu e complet** — nu raporta, repetă.

---

## 3. SCOPE DISCIPLINE — ce NU faci niciodată fără confirmare

### Permise FĂRĂ confirmare per acțiune (autonomie 2026-05-05):

- `git add` / `git commit` / `git push` pentru modificări legitime
- `npx wrangler deploy` pentru workers (`ai-gateway`, `keepalive`)
- `npm install` local (devDependencies / dependencies legitime)
- Modificare state remote Supabase/Cloudflare via API/SDK pentru fix bug-uri (valori din env vars, fără afișare în chat)
- Setare env vars Cloudflare Pages via API REST (`PATCH /pages/projects/{name}`)
- Auto-fix bug-uri identificate, urmate de commit + push + redeploy
- Rulare audit autonom (Lighthouse, tsc, build, endpoint health)

### Interzise absolut (R-RISK HIGH — ireversibil, necesită confirmare explicită admin):

- `git push --force` pe main / orice branch protected
- `git reset --hard` / `git commit --amend` pe commit deja împins
- `git remote add` / `remove` / `set-url` (modificare topology Git)
- `npm install -g`, instalare globală orice
- Modificare orice fișier din `~/.claude/` (regulament global, hooks, settings)
- Modificări la `~/.api-keys/` (catalog, scripts, master-location.txt)
- `DROP TABLE` / `DROP DATABASE` Supabase, `delete bucket` R2
- Ștergere fișiere/foldere multiple fără listare prealabilă + confirmare

### Interzise implicit (focus discipline):

- Adăugare features peste cele cerute în task ("am adăugat și X pentru consistență")
- Refactorizare cod existent dacă task-ul cere doar adăugare
- Schimbare convenții stabilite (kebab-case, ALL_CAPS protocol files) fără discuție
- Introducere dependențe noi în `package.json` peste cele agreate în `docs/stack.md`
- Crearea de fișiere noi peste cele cerute explicit ("ar fi util și un...")

**Regulă:** **task-ul cerut, nimic peste.** Dacă vezi ceva care merită îmbunătățit colateral, adaugă în secțiunea "Observații pentru admin/Opus" la sfârșit, nu implementa.

---

## 4. STOP-AND-ASK TRIGGERS — când oprești execuția și întrebi

Oprește-te imediat și formulează întrebare 1-frază + variante A/B la admin (NU la Opus auditor) când:

1. **Ambiguitate cu impact > LOCAL** — task-ul poate fi interpretat în 2 feluri și alegerea afectează arhitectura
2. **Conflict între surse** — SPEC zice X, ADR zice Y, MEMORY zice Z. Nu alege singur — întreabă care e autoritar
3. **Cheie API lipsă** — feature cere o cheie care nu e în `~/.api-keys/catalog.md` și nu e listată în `docs/api-keys-map.md` ca "de adăugat"
4. **State remote incert** — verificare prin MCP nu returnează rezultat clar (ex: `has_pages` absent în răspuns GitHub) → notează în observații, nu presupune
5. **Risc de pierdere date** — orice operație care poate suprascrie/șterge conținut existent
6. **Task care depășește 5 sub-operații** — cere R-PLAN: scrie `PLAN_<nume>_<data>.md` cu checklist înainte de execuție

Stop-and-ask nu înseamnă pauză lungă — formulezi întrebarea, o trimiți, continui cu task-uri independente în timp ce aștepți.

---

## 5. ANTI-OPTIMISTIC REPORTING — raportare onestă

**Interzis:** raport "completat 100%" când de fapt 1-2 sub-fix-uri lipsesc.
**Permis și încurajat:** raport parțial cu listă explicită ce s-a făcut și ce a rămas.

Format raport parțial:

```
[AUDIT-FIX-PARTIAL] Faza X — N/M fix-uri aplicate

Aplicate:
- FIX 1: ✓ (citat + linie)
- FIX 2: ✓ (citat + linie)

NEAPLICATE / cu probleme:
- FIX 3: ✗ — motivul (ex: ambiguitate la pasul B, întreb admin)
- FIX 4: parțial — secțiunea adăugată, dar tabelul intern lipsește
```

Beneficiu: Opus auditor verifică doar ce e raportat ca aplicat, dă feedback rapid pe restul. Iterațiile se reduc.

---

## 6. WORKFLOW STANDARD — execuția unei faze

```
1. Citește PROTOCOL (acest fișier) — verifică versiunea > cea pe care o ai în cap
2. Citește PLAN_initiere_proiect_*.md — vezi ce e bifat, ce urmează
3. Pentru fiecare task din fază:
   a. TaskCreate (tracking)
   b. Execută (Edit/Write/Bash)
   c. Self-verify (Read + Grep)
   d. TaskUpdate completed
4. La 5 task-uri completate sau la finalul unei sub-secțiuni:
   a. Regenerează SITEMAP.json (versiune incrementată)
   b. Bifează în PLAN
   c. Trimite [AUDIT-REQUEST] cu raport în format §2
5. Așteaptă [AUDIT-OK] sau [AUDIT-REMARK]
6. La REMARK: aplică fix-uri, repetă self-verify, trimite [AUDIT-FIX-DONE]
7. La OK: continuă cu următoarele 5 task-uri
8. La final fază: [AUDIT-FINAL-FAZA-N] cu sumar complet
```

---

## 7. TAB-URI MAMI_DOCS (referință)

Tab-urile principale ale aplicației sunt definite în `PROIECT_MAMI_DOCS_SPEC.md` și `docs/roadmap.md`. **Tab "Livadă"** rămâne pentru documente text/foto despre îngrijire pomi/grădină — **NU** include identificare automată plante (acel feature e în proiect separat "Livada"). La crearea structurii `src/tabs/livada/` respectă această distincție.

---

## 8. ESCALATION — când să escaladzi la Opus auditor în loc de admin

Mesaj la **Opus auditor** (via admin messenger):

- Întrebări tehnice cu impact > LOCAL pe arhitectură
- Verificări de consistență între spec / ADR / cod
- Decizii pe care vrei "second opinion" înainte de a merge mai departe

Mesaj la **admin direct** (NU prin Opus):

- Cereri de confirmare pentru R-RISK MEDIUM/HIGH (push, deploy, ștergeri)
- Cereri de chei API noi sau credențiale
- Aprobări la modificări de scope sau roadmap
- Stop-and-ask din §4 (excepție: punctul 4 — verificare state remote — poate merge la Opus dacă admin e offline)

---

## 9. AUTO-AUDIT LA STARTUP

La fiecare sesiune nouă în acest proiect, după citirea SURSELOR DE ADEVĂR și PROTOCOLULUI, rulează self-audit rapid (max 1 min):

1. `verify.ps1` — chei API status
2. `Glob` pentru `**/*.md` în `docs/decisions/` — verifică câte ADR-uri există
3. Verifică data ultimei modificări în `SITEMAP.json` vs `PLAN_*.md` jurnal — ar trebui să fie consecvente
4. `Bash: git status` (dacă repo init-iat) — diff vs ce e bifat în plan

La inconsistențe → raportează la începutul răspunsului către admin, înainte de orice acțiune.

---

## 10. ACTIVATION RECEIPT (la prima invocare)

La prima sesiune după adăugarea acestui protocol, răspunde cu:

```
[PROTOCOL ACTIVATED] v1.0 — Mami_Docs Agent Protocol citit. Self-verification, citation requirement, scope discipline, stop-and-ask, anti-optimistic reporting active.
```

Confirmare unică, nu se repetă în sesiunile următoare (e implicit activ).

---

## Modificări Acest Protocol

Doar admin poate modifica acest fișier. Versiune nouă → bump în header + entry în jurnal mai jos.

| Versiune | Data       | Modificare        | Confirmat |
| -------- | ---------- | ----------------- | --------- |
| 1.0      | 2026-05-01 | Versiune inițială | Roland P. |
