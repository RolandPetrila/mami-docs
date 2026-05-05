# TEST CHECKLIST — Mami Docs (Roland)

> Listă de testare pe telefon + laptop **înainte** de a-l da mamei.
> Versiune: 2026-05-05 | Mediu testare: Android Chrome (telefon Roland) + Chrome desktop

---

## Cum se folosește acest checklist

1. Bifezi fiecare item după ce-l testezi efectiv
2. La oricare ❌, notezi ce NU merge în coloana „Note"
3. Mama primește app-ul DOAR când totul e ✅

---

## URL-uri de testat

- **PWA:** https://mami-docs.pages.dev
- **AI Gateway:** https://mami-docs-ai.petrilarolly.workers.dev/health (trebuie să răspundă 200 OK)
- **Keepalive:** logs în Cloudflare Dashboard → Workers → mami-docs-keepalive → Logs

---

## 0. Smoke test rapid (2 min)

- [ ] Pagina se încarcă în <3 sec pe telefon (4G)
- [ ] PWA poate fi instalată (Chrome → meniu → „Adaugă pe ecranul principal")
- [ ] Iconița apare pe ecran cu numele „Mami Docs"
- [ ] La a doua deschidere, încarcă chiar și fără internet (offline)

---

## 1. Modul Document Viewer (📄)

- [ ] Apasă ☰ → vezi lista de tab-uri
- [ ] Selectează un tab cu documente (de ex. Rețete)
- [ ] Lista cu documente apare corect (titluri, iconițe după extensie)
- [ ] Apasă pe un DOCX → conținut afișat cu formatare păstrată
- [ ] Apasă pe un PDF → primele pagini afișate, scroll merge
- [ ] Apasă pe un MD → rendering Markdown cu titluri și liste
- [ ] Apasă pe un XLSX → tabel afișat cu coloane
- [ ] Buton 🔊 citire voce funcționează (oprire la al doilea tap)
- [ ] Buton ⭐ favorite funcționează (rămâne marcat la a doua deschidere)
- [ ] Highlight text (selecție lungă) → salvat și restaurat la redeschidere
- [ ] Buton bookmark → scrol restaurat la procentul corect

| Item                 | Status | Note |
| -------------------- | ------ | ---- |
| DOCX                 | ⬜     |      |
| PDF                  | ⬜     |      |
| MD                   | ⬜     |      |
| XLSX                 | ⬜     |      |
| TTS 🔊               | ⬜     |      |
| Favorite             | ⬜     |      |
| Highlight persistent | ⬜     |      |

---

## 2. Modul Wellness (❤️)

### 2.1 Hidratare 💧

- [ ] „+ 1 Pahar (250ml)" → toast „+250 ml ✅" + total se actualizează
- [ ] „+ 1 Sticlă (500ml)" → toast +500 ml + total = 750 ml
- [ ] Refresh pagină → totalul rămâne (persistent)

### 2.2 Tensiune ❤️

- [ ] Introdus 120/80 + puls 70 → buton „Salvează" → toast „Salvat ❤️"
- [ ] Inputs golite după salvare
- [ ] Lista „Ultimele 5 măsurători" arată entry-ul nou cu data/oră RO

### 2.3 Somn 🌙

- [ ] „Mă culc acum" → status „În somn de la HH:MM…"
- [ ] „M-am trezit" → toast „Bună dimineața! Xh ☀️"
- [ ] Status arată „Ultima noapte: Xh."

### 2.4 Emoții 😊

- [ ] Selectează emoji → ramâne mărit (selectat)
- [ ] Adaugă notă → buton „Trimite Jurnal" → toast „Mulțumesc 🤗"
- [ ] Selecția resetată după salvare

### 2.5 Pattern detection 🔍

- [ ] După 7 zile cu hidratare <1500ml → apare card galben cu warning
- [ ] După 3 măsurători tensiune >140/90 → warning
- [ ] Card „Sfaturi AI" apare DOAR când există pattern-uri

### 2.6 AI Sugestii 🤖

- [ ] Buton „💡 Cere sfaturi de la AI" → spinner → text afișat
- [ ] Reply de la AI e în română, scurt, încurajator
- [ ] La eroare network → mesaj „Nu am putut genera"

### 2.7 PDF Medical 📄

- [ ] Buton „Descarcă raport PDF" → fișier `Raport_Medical_DD-MM-YYYY.pdf` descărcat
- [ ] PDF deschis are: titlu, data, secțiuni Vitale/Hidratare/Somn/Emoții
- [ ] Datele afișate sunt cele reale din ultimele 14 entries

### 2.8 Jurnal complet 📔

- [ ] Card „📔 Jurnal complet" expandabil
- [ ] Apasă „Arată jurnalul" → listă cronologică ultimele 30 zile
- [ ] Entries grupate pe zi (data ca header)
- [ ] Fiecare entry are emoji + valoare (ex. „💧 250ml la 14:30")
- [ ] Listă reverse-chronological (cele mai noi sus)

| Item           | Status | Note |
| -------------- | ------ | ---- |
| Hidratare      | ⬜     |      |
| Vitals         | ⬜     |      |
| Sleep          | ⬜     |      |
| Emoții         | ⬜     |      |
| Patterns       | ⬜     |      |
| AI Sugestii    | ⬜     |      |
| PDF            | ⬜     |      |
| Jurnal complet | ⬜     |      |

---

## 3. Modul Chat AI (💬)

- [ ] Buton 🎤 microfon → permission prompt → recordare
- [ ] Spune „Cum se face cozonac?" → text apare în input
- [ ] Răspuns AI în <5 sec
- [ ] Răspuns citit cu voce (TTS) automat
- [ ] Conversație istorică păstrată în sesiune
- [ ] Eroare API (mod airplane) → fallback grațios cu mesaj

---

## 4. Modul Galerie Foto (📷)

- [ ] Buton „Adaugă poză" → file picker
- [ ] Selectare poză 5MP → resize automat la 1920px lățime
- [ ] Preview salvat → apare în lista de poze
- [ ] Tap pe poză → lightbox full-screen
- [ ] Swipe în lightbox → poza următoare
- [ ] Buton 🗑️ ștergere → confirmare → soft-delete
- [ ] După 30 zile auto-purge la startup

---

## 5. Modul Drug Checker (💊)

- [ ] Type „aspir" → sugestii RxNorm apar (typeahead 400ms debounce)
- [ ] Selectare „aspirin" → adăugat în lista activă
- [ ] Adaugă al doilea med (ex. „warfarin") → check interacțiune
- [ ] Severitate (high/moderate/low) afișată cu culoare
- [ ] Disclaimer medical vizibil (text WCAG AA)

---

## 6. Modul Meniu Săptămânal (🍽️)

- [ ] Buton „Generează meniu nou" → spinner → 7 zile × 4 mese
- [ ] Format card per zi (Luni-Duminică) cu emoji
- [ ] Buton „Printează" → window.print() cu CSS clean
- [ ] Navigare săptămâni (anterior / următor) funcționează
- [ ] Istoric ultimele 4 săptămâni accesibil

---

## 7. Notificări (4 straturi)

### 7.1 ntfy.sh

- [ ] Telefon Roland: app **ntfy** instalată + subscris la `mami-docs-2026-roland`
- [ ] Test manual: `curl -d "Test" https://ntfy.sh/mami-docs-2026-roland` → notificare push
- [ ] La 03:30 EET: rezumat zilnic primit pe telefon

### 7.2 Telegram

- [ ] Bot răspunde la `/start` în chat
- [ ] La backup zilnic eșuat → mesaj alert primit
- [ ] La storage Supabase >80% → alert primit

### 7.3 CallMeBot WhatsApp

- [ ] Telefon Roland: WhatsApp activ + numărul în catalogul `.api-keys`
- [ ] Test: trigger reminder hidratare → primește mesaj WA

### 7.4 Notification API local

- [ ] Activează „Reminder apă" în setări → permission browser
- [ ] La 2h cu app deschis → notificare „💧 Bea apă!"

| Item               | Status | Note |
| ------------------ | ------ | ---- |
| ntfy push          | ⬜     |      |
| Telegram alert     | ⬜     |      |
| CallMeBot WhatsApp | ⬜     |      |
| Local Notification | ⬜     |      |

---

## 8. Setări (⚙️)

- [ ] Volum slider → muzica ambientă reacționează
- [ ] Mute toggle → tot sunetul oprit
- [ ] Dark mode toggle → tema schimbată instant fără flash
- [ ] Voice rate (Lent / Normal / Rapid) → TTS folosește rate-ul nou
- [ ] Reminder apă toggle → notification API activat
- [ ] PIN admin (4-8 cifre) → setare + verificare
- [ ] Mod admin → device_role salvat în Supabase
- [ ] **NEW:** Family invite — buton „Generează cod" → cod 8 caractere
- [ ] **NEW:** Family connect — input cod → upload date la grup

---

## 9. Family Sharing (NEW 2026-05-05)

> Necesită ca admin să fi rulat `docs/sql/family_sharing.sql` în Supabase Editor.

- [ ] Cont 1 (Roland): generează cod → cod afișat + copiabil
- [ ] Cont 2 (testflight, alt browser/device): conectează cu cod → toast „Conectat la grup"
- [ ] În Supabase: verifică `family_groups` are 1 row + `family_members` are 2 rows
- [ ] RLS test: utilizator NEautentificat nu poate citi tabelele (RLS blocked 401)
- [ ] În jurnal wellness pe device 2: apar și entries de la device 1?
  - Dacă DA → sharing funcționează
  - Dacă NU → debug RLS policy

---

## 10. R2 Backup + Arhivă (NEW 2026-05-05)

- [ ] Cron 02:00 UTC: în Cloudflare Dashboard → Logs vezi `[backup] ✅ Salvat`
- [ ] R2 bucket `mami-docs-backup` are folder `backups/YYYY-MM-DD/`
- [ ] Cron Duminica 03:00 UTC: în Logs vezi `[archive] ✅`
- [ ] Photos cu `last_accessed < acum-60d` → mutate în `archive/photos/`
- [ ] Thumbnail generat în Supabase storage rămâne accesibil
- [ ] La accesare poză arhivată: descărcată din R2 + restored

---

## 11. Performance & PWA Score

- [ ] Lighthouse pe Chrome desktop: Performance ≥90 ✅ (era 94 la 2026-05-05)
- [ ] Lighthouse Accessibility ≥95
- [ ] PWA installable check ✅
- [ ] Funcționează 100% offline după prima vizită
- [ ] Service Worker actualizare automată: comit nou → reîmprospătare automată

---

## 12. Edge cases

- [ ] Mod airplane → AI funcționează cu fallback graceful
- [ ] localStorage plin (5MB+) → degradare elegant fără crash
- [ ] Browser fără IndexedDB (private mode) → galerie info ratează blând
- [ ] Audio context blocked → fallback fără audio
- [ ] Bateria sub 15% → throttle pe heavy ops (RAG, embeddings)

---

## 13. Validare finală — pre go-live mama

- [ ] **Toate** itemii de mai sus cu status ✅
- [ ] Mama are telefon Android cu ≥4GB RAM, Chrome ultima versiune
- [ ] Wi-fi acasă funcțional + date mobile activate
- [ ] PWA instalat pe telefonul mamei + iconită vizibilă pe ecran
- [ ] App **ntfy** instalat pe telefonul mamei + subscris la topic propriu (alt topic decât Roland)
- [ ] CallMeBot configurat pe numărul mamei
- [ ] Roland a făcut test live 1 oră în prezența mamei (a folosit ea cu el lângă)
- [ ] Hand-over: ghid `USER_GUIDE_MAMA.md` printat sau pe ecran
- [ ] Setat un nr. de telefon de urgență (Roland) pentru SOS

**DOAR DUPĂ:** sterge testflight de pe device-uri secundare, lasă mama cu app-ul.

---

## Note finale

- Re-rulează acest checklist după FIECARE deploy nou
- La orice ❌ critic: NU dezactiva sharing/backup, doar amână go-live
- Documentează bug-uri în `ISSUES.md` cu reproducere pas-cu-pas
- Memo în memory: orice problemă SEV1 → salvare în `memory/bug_*.md`
