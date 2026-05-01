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

### Git & Remote — INTERDICȚII ABSOLUTE

- `NO git push` fără confirmare admin
- `NO git remote add` fără confirmare admin
- `NO deploy` Cloudflare/Supabase/GitHub fără confirmare admin
- `NO npm install -g` fără confirmare admin
- `NO modificare state remote` (API Supabase/Cloudflare/GitHub) fără confirmare

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
