# Roadmap /improve — Mami_Docs

**Data:** 2026-05-06

---

## SĂPTĂMÂNA 1 — Security + Quick Wins (ROI > 7, Efort MIC)

| Task                                             | Efort | Impact                                      |
| ------------------------------------------------ | ----- | ------------------------------------------- |
| [S1] `npm install dompurify@3.4.2`               | 30min | 4 CVE XSS eliminate imediat                 |
| [S2] `npm install mammoth@1.12.0`                | 30min | CVE-2025-11849 directory traversal eliminat |
| [A1] System prompts per tab (wellness/med/meniu) | 2h    | Răspunsuri AI relevante pentru mama         |
| [D1] @xenova → @huggingface/transformers v4      | 2h    | Pachet activ + WebGPU native                |
| [A3] CF Workers Observability în wrangler.toml   | 30min | Monitoring producție gratuit                |
| [DX3] Branch staging + workflow                  | 1h    | Protecție experiență mama                   |

**Total: ~6-7h | Beneficiu imediat: 2 CVE critice remediate + AI calitativ mai bun**

---

## SĂPTĂMÂNA 2 — Modernizare dependinte (ROI 5-7)

| Task                              | Efort | Depinde de         |
| --------------------------------- | ----- | ------------------ |
| [M2] TypeScript 5.4 → 6.0         | 1h    | —                  |
| [D3] xlsx → @e965/xlsx            | 2h    | —                  |
| [P1] Cache Vite în GitHub Actions | 30min | —                  |
| [DX1] Husky pre-commit hooks      | 1h    | —                  |
| [DX2] Coverage thresholds vitest  | 30min | —                  |
| [M3] marked 12 → 18               | 3h    | Testare atentă API |

**Total: ~8h | Beneficiu: stack modernizat, DX îmbunătățit**

---

## LUNA URMATOARE — Strategic (Efort MARE sau ROI scăzut)

| Task                                 | Efort | Condiție                                  |
| ------------------------------------ | ----- | ----------------------------------------- |
| [D2] pdfjs-dist 4 → 5                | 4h    | Testare extensivă PDF rendering           |
| [M1] Vite 5 → 8                      | 6h    | Doar dacă Vite 5 = blocker pentru altceva |
| [A2] Circuit breaker persistent (KV) | 4h    | Dacă trafic concurrent >10 req/s          |
| [P2] OPFS pentru RAG index           | 12h   | Dacă mama are >100 documente indexate     |

---

## Acțiune imediată (fă acum)

```bash
npm install dompurify@3.4.2 @types/dompurify@latest mammoth@1.12.0
npm run build
# verifică 0 erori + SW generate corect
git add package.json package-lock.json
git commit -m "fix(security): DOMPurify 3.4.2 + mammoth 1.12.0 (4 CVE XSS + directory traversal)"
git push
```
