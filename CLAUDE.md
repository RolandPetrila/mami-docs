# CLAUDE.md — Proiect Mami_Docs

> Reguli specifice proiect. Se citesc DUPĂ regulamentul global `~/.claude/CLAUDE.md`.
> La conflict: regulile locale câștigă.

**Versiune:** 1.0.0 | **Data:** 2026-05-01

---

## Identitate Proiect

**Mami_Docs** = PWA (Progressive Web App) personală pentru mama lui Roland (~60 ani, Android Chrome).  
Bibliotecă documente + agent AI conversațional voce/text + funcții native PWA (offline, notificări, instalare home screen).

---

## Surse de Adevăr (citește în ordine)

1. **`docs/AGENT_PROTOCOL.md`** — **CITEȘTE PRIMUL.** Reguli stricte de execuție: self-verification, citation requirement, scope discipline, anti-optimistic reporting. Fără citirea acestuia ÎNAINTE de orice acțiune, raportele tale vor fi respinse.
2. `PROIECT_MAMI_DOCS_SPEC.md` — specificație funcțională (corp + ADENDA §17 are PRIORITATE la conflict)
3. `PROIECT_MAMI_DOCS_RESEARCH.md` — raport cercetare cu corecții/extinderi
4. `docs/decisions/0001-anexa-c-decisions.md` — 17 decizii tehnice finale (Anexa C v2)
5. `plans/PLAN_initiere_proiect_2026-05-01.md` — plan faze cu checklist bifabil + jurnal execuție
6. `docs/stack.md` — stack final consolidat
7. `~/.claude/projects/C--Proiecte-Mami-Docs/memory/MEMORY.md` — memorie persistentă inter-sesiuni

---

## Reguli Override Locale

### Comunicare

- **Răspunsuri terse, concrete.** Detalii doar la cerere explicită.
- La orice decizie: recomandă varianta ideală (1 singură), nu liste.
- Limba română în tot ce nu e cod/comenzi.

### Autonomie Totală — Principiu Suprem (2026-05-06, autorizat admin)

**REGULA CHEIE:** rulezi TOTUL automat. Admin face manual DOAR ceea ce e fizic imposibil pentru un agent AI să facă (ex: lipit cu mâna pe telefonul mamei, plătit cu cardul, sunat la un serviciu de suport telefonic, semnat un act fizic).

**În practică, asta înseamnă:**

- Detectezi ceea ce trebuie făcut → DECIZI singur abordarea ideală → EXECUȚI fără să întrebi
- Dacă tool-urile tale pot rezolva problema (cod, API, deploy, descărcare resurse, configurare), o faci
- NU întrebi confirmare pentru pași intermediari când scopul final e clar
- NU explici de ce ai ales o abordare ÎNAINTE de execuție — execuți + raportezi pe scurt rezultatul
- La eșec, încerci alternativă fără să întrebi (max 2 alternative, apoi raportezi blocaj real)
- Doar la blocaj fizic real (e.g. "trebuie să fii lângă telefonul fizic al mamei pentru a apăsa Allow") raportezi că rămâne pe admin

**Exemple de "imposibil" pentru tine (lasă admin):**

- Setup pe telefonul fizic al mamei (instalare app, click pe ecran)
- Plată / introducere card de credit pe servicii noi
- Verificare 2FA care necesită SMS pe telefonul admin
- Acțiuni care necesită prezență fizică (semnătură, fotografiere ID, etc.)

**Tot restul = autonomie totală fără întrebări.**

### Git & Remote — Autonomie Extinsă (2026-05-05, autorizat admin)

**Permis FĂRĂ confirmare per acțiune:**

- `git add` / `git commit` / `git push` pentru modificări legitime (cu raportare scurtă)
- `npx wrangler deploy` pentru workers (`ai-gateway`, `keepalive`)
- `npm install` local (`devDependencies` / `dependencies` legitime)
- Modificare state remote Supabase/Cloudflare via API/SDK pentru fix bug-uri (cu valori din `~/.api-keys` sau Windows env vars, **fără afișare valori** în chat)
- Setare env vars Cloudflare Pages via API REST
- Auto-fix bug-uri identificate de teste/audit, urmate de commit + push + redeploy
- Trigger rebuilds Cloudflare Pages (push commit gol)
- Rulare Lighthouse, tsc, build, endpoint health checks autonom

**Rămâne cu confirmare admin (R-RISK HIGH ireversibil):**

- `git push --force` (NICIODATĂ pe main/master, chiar și cu autonomie)
- `git reset --hard` / `git commit --amend` pe commit deja împins
- `git remote add` / `remove` / `set-url` (modificare topology Git)
- `npm install -g` (instalare globală)
- Modificări la `~/.claude/` (regulament global, hooks, settings)
- Modificări la `~/.api-keys/` (catalog, scripts, master-location.txt)
- `DROP TABLE` / `DROP DATABASE` Supabase, `delete bucket` R2
- Ștergere fișiere/foldere multiple fără listare prealabilă

**Format raportare obligatoriu (per acțiune autonomă):**

- 1-2 fraze cu ce s-a făcut (commit message, deploy URL/version ID, fix code citate)
- La detectare bug înainte de fix: raport scurt cu cauza + soluția propusă
- La fix: file:line + citat exact din diff (per `AGENT_PROTOCOL.md` §1)

### Securitate

- `NO .env*` committed niciodată
- `NO valori chei API` în cod, chat sau fișiere de proiect
- Chei se citesc exclusiv din `process.env.X` (Node) sau `import.meta.env.X` (Vite client)
- Conținut privat mama (foto, notițe medicale, jurnal) → **exclusiv Supabase**, niciodată în repo GitHub

### Convenții Cod

- Vanilla JS + Web Components (prefix `mami-`)
- TypeScript strict din Faza 1 (`strict: true`, `noUncheckedIndexedAccess: true`)
- kebab-case pentru fișiere/foldere
- ALL*CAPS pentru: CLAUDE.md, MEMORY.md, README.md, SITEMAP.json, PLAN*\*.md
- Tap targets min 44×44px (accesibilitate mama)
- Contrast WCAG AA minim
- Comentarii: doar WHY non-evident, niciodată WHAT

### Auto-update Obligatoriu

- `SITEMAP.json` → update la orice modificare structurală
- `plans/PLAN_initiere_proiect_2026-05-01.md` → bifează task-urile completate
- `docs/` → actualizează fișierele relevante când spec-ul se modifică

---

## Stack Tehnic (scurt)

| Layer           | Tehnologie                                                      |
| --------------- | --------------------------------------------------------------- |
| Frontend        | Vanilla JS + Web Components + Vite                              |
| PWA             | Workbox Service Worker                                          |
| Hosting         | Cloudflare Pages (GitHub repo conectat)                         |
| Backend/Auth    | Cloudflare Workers                                              |
| DB/Storage/Auth | Supabase                                                        |
| Backup          | Cloudflare R2 (zilnic 02:00 UTC)                                |
| Docs render     | mammoth.js + PDF.js + marked + SheetJS + Tesseract.js           |
| AI              | Groq → Cerebras → OpenRouter (text) / Gemini → Mistral (vision) |
| Notificări      | ntfy.sh + Telegram Bot + CallMeBot + FCM                        |

> Detalii complete: `docs/stack.md` | AI fallback: `docs/ai-fallback-chain.md`

---

## Workflow Q&A Iterativ

La ambiguitate sau decizie neacoperită de spec:

1. Formulează 1 întrebare concisă cu variante A/B (max)
2. Așteaptă confirmare admin
3. Implementează + notează în jurnal + actualizează ADR dacă e o decizie arhitecturală

Nu presupune, nu decide singur la ambiguități cu impact >LOCAL.

---

## Service Limits Awareness

La orice implementare care consumă un serviciu extern:

- Verifică `docs/service-limits.md` pentru limite relevante
- Implementează fallback înainte de a merge la producție
- Loghează consumul (cel puțin la nivel de eroare)
- La atingere 80% din limită → alertă admin

Servicii cu limite critice de urmărit:

- Supabase free: 500MB DB, 1GB Storage, 2GB bandwidth/lună, 50k Edge Function invocations
- Cloudflare Workers free: 100k req/zi, 10ms CPU/req
- Groq: 14,400 req/zi Llama 8B, 14,400 req/zi Llama 70B
- Gemini: 1,500 req/zi Flash, 50 req/zi Pro (Flash-Lite 30 req/min)

---

## Audit Trail Format

La fiecare modificare semnificativă (fișier nou, feature adăugat, decizie schimbată):

```
<!-- AUDIT: 2026-05-01 | Sonnet 4.6 | Adăugat: [ce s-a adăugat] | Task: T[N] -->
```

Sau în jurnal din PLAN:

```
| 2026-05-01 | T[N] — Descriere | ✅ Completat | Observații relevante |
```

---

## Reguli Memorie Proiect

Memorie proiect se scrie în: `C:\Users\ALIENWARE\.claude\projects\C--Proiecte-Mami-Docs\memory\`

Format fișier:

```markdown
---
name: [nume scurt]
description: [una linie]
type: user|feedback|project|reference
---

[conținut]

**Why:** [motivație]
**How to apply:** [când și cum]
```

MEMORY.md = index, max 200 linii. Format linie: `- [Titlu](file.md) — descriere ≤150 caractere`

**Salvează după:**

- Bug SEV1/SEV2 rezolvat
- Decizie tehnică confirmată de admin
- Feedback explicit admin
- Preferință de lucru descoperită

---

## La Start Sesiune

1. Citește `CLAUDE.md` (acesta, automat încărcat)
2. **Citește `docs/AGENT_PROTOCOL.md`** — REGULI STRICTE DE EXECUȚIE. La prima sesiune, raportează `[PROTOCOL ACTIVATED] v1.0` (vezi §10 din PROTOCOL).
3. Citește `memory/MEMORY.md` proiect
4. Citește `plans/PLAN_initiere_proiect_2026-05-01.md` → unde am rămas
5. Mini onboard: `verify.ps1` status, diff git local vs remote, ce e nou
6. Pornește următorul task neprintat din PLAN

**Înainte de orice raport `[AUDIT-X-DONE]`:** rulează self-verification checklist din PROTOCOL §1 (Read + Grep + citate cu numere linii). Raportele fără citate exacte vor fi respinse cu `[AUDIT-REMARK]`.
