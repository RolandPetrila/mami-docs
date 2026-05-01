# Disclaimere Medicale — Mami_Docs

**Data:** 2026-05-01 | **Versiune:** 1.0  
**Scop:** Texte oficiale de afișat în UI înainte de activarea funcționalităților medicale.

> **REGULĂ CRITICĂ:** Fiecare text de mai jos se afișează OBLIGATORIU în UI înainte ca utilizatorul să acceseze feature-ul respectiv. Nu se poate ocoli. Se acceptă cu tap/click explicit ("Am înțeles").

---

## 1. Disclaimer General — Sănătate & AI

**Afișat la:** Prima deschidere a tab-ului Sănătate + la fiecare 30 zile.

**Text UI (română):**

> **Informație importantă**
>
> Această aplicație oferă informații generale despre sănătate cu scop informativ și educativ.
> Informațiile nu constituie consultație medicală și nu înlocuiesc sfatul medicului, al farmacistului sau al altui cadru medical calificat.
>
> Înainte de a lua orice decizie privind sănătatea ta, consultă întotdeauna medicul tău de familie sau un specialist.
>
> [Am înțeles]

---

## 2. Disclaimer Tracking Simptome

**Afișat la:** Prima utilizare a funcției "Notează simptome" + la fiecare 7 zile de utilizare.

**Text UI (română):**

> **Despre jurnalul de simptome**
>
> Jurnalul de simptome te ajută să ții evidența stării tale de sănătate pentru discuțiile cu medicul.
>
> **Acesta NU este un instrument de diagnostic.** Aplicația nu poate diagnostica boli, nu poate evalua gravitatea simptomelor și nu poate înlocui consultul medical.
>
> Dacă simptomele sunt severe, se înrăutățesc rapid sau sunt însoțite de durere puternică, dificultăți de respirație sau pierderea cunoștinței — **sună la 112 sau mergi urgent la medic**.
>
> Jurnalul tău rămâne privat și poate fi partajat cu medicul la cererea ta.
>
> [Am înțeles]

---

## 3. Disclaimer Interacțiuni Medicamente

**Afișat la:** Fiecare utilizare a funcției "Verifică interacțiuni medicamente". Fără excepție.

**Text UI (română):**

> **Verificare interacțiuni medicamente — Limitele acestui instrument**
>
> Această funcție folosește baza de date RxNorm/openFDA pentru a oferi informații generale despre potențiale interacțiuni între medicamente.
>
> **Limitele importante:**
> • Traducerea automată a denumirilor din română în engleză are o acuratețe de aproximativ 70% — denumirile pot fi incorecte
> • Baza de date nu include toate medicamentele disponibile în România
> • Nu sunt incluse suplimentele alimentare, plantele medicinale sau preparatele magistrale
> • Informațiile se pot schimba; baza de date poate să nu fie actualizată
>
> **Consultă întotdeauna farmacistul sau medicul** înainte de a combina medicamente sau de a modifica dozele.
>
> Această aplicație nu este responsabilă pentru deciziile medicale luate pe baza informațiilor afișate.
>
> [Am înțeles și voi consulta farmacistul/medicul]

---

## 4. Disclaimer Sumar pentru Medic (jsPDF)

**Afișat la:** Generare PDF "Sumar pentru medic", înainte de previzualizare.

**Text UI (română):**

> **Despre sumarul generat pentru medic**
>
> Documentul generat conține informațiile pe care tu le-ai introdus în aplicație — simptome, tensiune, greutate, medicamente — și este destinat să faciliteze discuția cu medicul tău.
>
> **Acest document:**
> • Nu este un document medical oficial
> • Nu a fost verificat de un cadru medical
> • Poate conține erori de transcriere sau interpretare AI
> • Nu înlocuiește investigațiile medicale sau diagnosticul profesionist
>
> Prezintă-l medicului ca punct de plecare pentru discuție, nu ca diagnostic sau concluzie.
>
> [Generează documentul]

---

## 5. Disclaimer Jurnal Wellness AI

**Afișat la:** Prima utilizare a funcției "Check-in emoțional" sau "Jurnal wellness".

**Text UI (română):**

> **Despre jurnalul tău de wellness**
>
> Jurnalul de wellness și check-in-ul emoțional sunt instrumente de auto-reflecție și monitorizare personală.
>
> Asistentul AI poate oferi sugestii generale de îngrijire personală, dar **nu poate evalua starea ta de sănătate mintală și nu poate înlocui suportul unui psiholog sau psihiatru**.
>
> Dacă te simți copleșit/ă, trist/ă pentru o perioadă lungă sau ai gânduri de a-ți face rău, te rugăm să contactezi:
> • Medicul tău de familie
> • Serviciul de urgențe: **112**
> • Linia de criză: **0800 800 678** (Telefonul Vârstnicului, gratuit)
>
> Datele tale din jurnal sunt private și stocate securizat.
>
> [Am înțeles]

---

## Implementare UI

### Componentă Web (Faza 1+)

```javascript
// <mami-medical-disclaimer> Web Component
class MamiMedicalDisclaimer extends HTMLElement {
  static get observedAttributes() {
    return ["type", "cooldown-days"];
  }

  connectedCallback() {
    const type = this.getAttribute("type"); // 'symptoms' | 'drugs' | 'ai-general' | 'pdf-export' | 'wellness'
    const cooldownDays = parseInt(this.getAttribute("cooldown-days") ?? "0");
    const lastSeen = localStorage.getItem(`disclaimer_${type}_last_seen`);
    const daysSince = lastSeen
      ? (Date.now() - parseInt(lastSeen)) / (1000 * 60 * 60 * 24)
      : Infinity;

    if (cooldownDays === 0 || daysSince >= cooldownDays) {
      this.showDisclaimer(type);
    } else {
      this.dispatchEvent(new Event("accepted"));
    }
  }

  showDisclaimer(type) {
    // Render disclaimer text din acest fișier
    // La tap "Am înțeles": localStorage.setItem + dispatchEvent('accepted')
  }
}

customElements.define("mami-medical-disclaimer", MamiMedicalDisclaimer);
```

### Cooldown per tip

| Tip disclaimer           | Cooldown   | Obligatoriu la fiecare |
| ------------------------ | ---------- | ---------------------- |
| General sănătate         | 30 zile    | 30 zile                |
| Tracking simptome        | 7 zile     | Săptămânal             |
| Interacțiuni medicamente | 0 zile     | **De fiecare dată**    |
| Sumar PDF medic          | 0 zile     | **De fiecare dată**    |
| Jurnal wellness          | Prima dată | O singură dată         |

---

## Note Legale

- Textele de mai sus sunt redactate pentru uz personal (aplicație privată de familie)
- Nu constituie consultanță juridică sau medicală pentru publicul larg
- La orice funcționalitate medicală nouă → adaugă un disclaimer corespunzător în acest fișier înainte de implementare
