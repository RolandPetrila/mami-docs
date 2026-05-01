// 120 mesaje rotative ro-RO: dimineață (30) / zi (30) / seară (30) / motivare (30)
// Rotire zilnică: seed = an*10000 + lună*100 + zi → index % 30 (același mesaj toată ziua)

const DIMINEATA: readonly string[] = [
  "Bună dimineața, mamă dragă! O zi frumoasă te așteaptă. ☀️",
  "Dimineața bună! Cafeaua e mai gustoasă când ziua promite a fi bună.",
  "Bună dimineața! Respiră adânc — o zi nouă, o șansă nouă.",
  "O dimineață minunată! Ridică-te cu zâmbetul și ziua va fi pe măsură.",
  "Bună dimineața! Soarele e afară, tu ești la fel de strălucitoare.",
  "Dimineața bună! Astăzi e o zi minunată să fii recunoscătoare.",
  "Bună dimineața! Fiecare dimineață e un nou început — valorifică-l.",
  "O dimineață frumoasă! Gânduri bune și energie pozitivă pentru ziua ta.",
  "Bună dimineața! Începe ziua cu un zâmbet și totul pare mai ușor.",
  "Dimineața bună! Bucurie și sănătate pentru astăzi și mereu.",
  "Bună dimineața! Ceaiul de dimineață e mai dulce cu gânduri bune.",
  "O nouă dimineață, noi posibilități! Bună ziua, mamă dragă.",
  "Bună dimineața! Azi poți face lucruri mici cu iubire mare.",
  "Dimineața bună! Soarele răsare, florile se trezesc și tu ești în formă.",
  "Bună dimineața! Un gând bun în zori face ziua mai luminoasă.",
  "Dimineața e darul zilei — bucură-te de ea! Bună dimineața.",
  "Bună dimineața, mamă! Azi e o zi bună să fii fericită.",
  "O dimineață plăcută! Corpul s-a odihnit, sufletul e pregătit.",
  "Bună dimineața! Florile din livadă te salută și ele.",
  "Dimineața bună! Azi e o zi mai bună decât ieri.",
  "Bună dimineața! Planuri mici, realizări mari — poți face asta.",
  "O dimineață calmă pentru o zi armonioasă. Bună dimineața!",
  "Bună dimineața! Pas cu pas, zi cu zi — înainte.",
  "Dimineața bună! Ochii deschiși, inima deschisă — perfect.",
  "Bună dimineața, mamă dragă! Dragostea noastră e cu tine în fiecare dimineață.",
  "O dimineață nouă, energie proaspătă! Bună dimineața.",
  "Bună dimineața! Recunoștința de dimineață face ziua mai bună.",
  "Dimineața bună! Lumina soarelui e pentru tine — o meriți.",
  "Bună dimineața! Azi poate fi ziua preferată a anului tău.",
  "O dimineață splendidă! Ia ziua în brațe cu bucurie.",
];

const ZI: readonly string[] = [
  "Bună ziua! Sper că dimineața a fost frumoasă și ziua continuă la fel.",
  "Bună ziua, mamă! La mijlocul zilei, un gând cald de la mine.",
  "Bună ziua! Fă o pauză, respiră — ești pe drumul cel bun.",
  "Ziua bună! Mergi înainte cu pas sigur — reușești tot ce îți propui.",
  "Bună ziua! Un prânz bun și o minte limpede — ce mai vrei?",
  "Ziua bună, mamă dragă! Jumătate din zi e deja minunată.",
  "Bună ziua! Nu uita să bei apă și să zâmbești la cineva azi.",
  "Ziua bună! Soarele e sus, tu ești mai sus.",
  "Bună ziua! Mici bucurii, mari amintiri — construiești ceva frumos.",
  "Ziua bună! Fiecare task bifat azi e o victorie mică.",
  "Bună ziua, mamă! Dacă ești obosită, poți face o pauză scurtă.",
  "Ziua bună! Progresul e mai important decât perfecțiunea.",
  "Bună ziua! Cum merge? Știu că ești în formă astăzi.",
  "Ziua bună! Grădina sau livada te cheamă pentru puțin aer curat.",
  "Bună ziua! Un gând pozitiv pe zi ține tristețea departe.",
  "Ziua bună, mamă! Ești mai puternică decât crezi.",
  "Bună ziua! La mijlocul zilei, totul pare realizabil.",
  "Ziua bună! Azi e o zi bună pentru o ceașcă de ceai cald.",
  "Bună ziua! Fii blândă cu tine astăzi.",
  "Ziua bună! Lucrurile mici contează — un prânz bun e un lucru mare.",
  "Bună ziua, mamă dragă! Continuă — ești pe drumul cel bun.",
  "Ziua bună! Azi îți reușesc toate cel mai bine.",
  "Bună ziua! Ai parcurs deja jumătate din zi — felicitări.",
  "Ziua bună! Un moment de liniște la amiază face minuni.",
  "Bună ziua! Orice problemă are soluție — găsești tu.",
  "Ziua bună, mamă! Dragostea familiei e cu tine tot timpul.",
  "Bună ziua! Ai grijă de tine astăzi — ești prețioasă.",
  "Ziua bună! Bucurie la prânz și relaxare după.",
  "Bună ziua! Azi poți face un lucru frumos pentru tine.",
  "Ziua bună! Jumătate din zi trecută — a doua jumătate e și mai bună.",
];

const SEARA: readonly string[] = [
  "Bună seara! O zi terminată, o victorie trăită. Odihnește-te bine.",
  "Bună seara, mamă! Sper că ziua a fost frumoasă.",
  "Bună seara! Liniștea serii e meritată după o zi activă.",
  "Seara bună! Acum e timpul tău — relaxare și bucurie.",
  "Bună seara! Seara e cea mai liniștită parte a zilei — savurez-o.",
  "Seara bună, mamă dragă! Un ceai cald și gânduri liniștite.",
  "Bună seara! Ziua s-a terminat, dar amintirile frumoase rămân.",
  "Seara bună! Orice ai realizat azi — a fost de ajuns.",
  "Bună seara! Stele afară, pace în casă — noapte frumoasă vine.",
  "Seara bună, mamă! Azi ai fost minunată.",
  "Bună seara! Seara aduce liniște și recunoștință.",
  "Seara bună! Un moment de reflecție — ai trăit o zi bună.",
  "Bună seara! Acum te odihnești — ai muncit destul azi.",
  "Seara bună! Familia te iubește, somnul te așteaptă.",
  "Bună seara, mamă! Azi a fost o zi cu sens.",
  "Seara bună! Pune telefonul jos la un moment dat și bucură-te de liniște.",
  "Bună seara! Fiecare seară e un pas spre mâine, mai bun.",
  "Seara bună! Recunoștința de seară: ce a mers bine azi?",
  "Bună seara, mamă dragă! Noaptea bună vine, dar mai întâi — relaxare.",
  "Seara bună! O baie caldă sau o carte bună — ce alegi azi?",
  "Bună seara! Seara e momentul să lauzi ziua trecută.",
  "Seara bună, mamă! Ești obosită? Normal — ai muncit mult.",
  "Bună seara! Stele, lună, liniște — parfumul serii.",
  "Seara bună! Un moment cu tine însuți e cel mai bun dar seara.",
  "Bună seara! Visuri frumoase vin după zile frumoase.",
  "Seara bună, mamă! Ziua s-a terminat bine — continuă mâine.",
  "Bună seara! Liniște și pace — le meriți din plin.",
  "Seara bună! Gânduri bune seara, somn bun noaptea.",
  "Bună seara, mamă dragă! Azi ai zâmbit? Dacă nu, acum e momentul.",
  "Seara bună! Ziua ta a contat — lasă-o să se odihnească acum.",
];

const MOTIVARE: readonly string[] = [
  "Ești mai puternică decât crezi și mai iubită decât știi.",
  "Fiecare zi e o oportunitate nouă să fii versiunea ta cea mai bună.",
  "Bucuriile mici fac viața mare.",
  "Nu trebuie să fii perfectă — trebuie să fii tu.",
  "Ai trecut prin lucruri grele. Asta te face puternică, nu slabă.",
  "Fericirea e în lucruri mici: ceai cald, soare, cei dragi.",
  "Sănătatea e cea mai mare comoară — ai grijă de ea.",
  "Pas mic azi, diferență mare mâine.",
  "Iubirea familiei e cu tine în fiecare moment.",
  "Ești un exemplu de curaj și dăruire.",
  "Nu uita: lucrurile bune vin la cei care perseverează.",
  "Fiecare zi cu bine e o binecuvântare.",
  "Grădina ta reflectă sufletul tău — ambele sunt frumoase.",
  "Oamenii buni aduc lucruri bune — ești un om bun.",
  "Mâinile tale au construit ceva frumos. Fii mândră.",
  "Există momente dificile, dar există și tu — care le depășești.",
  "Dragostea de mamă e forța cea mai puternică din lume.",
  "Nu ce ai, ci ce dai face diferența.",
  "Un zâmbet al tău luminează ziua altora.",
  "Sănătos la minte, sănătos la trup — ai grijă de ambele.",
  "Ești exact unde trebuie să fii în această etapă a vieții.",
  "Fă câte un lucru bun în fiecare zi — pentru tine sau pentru alții.",
  "Viața e frumoasă când o privești cu inima deschisă.",
  "Nu e târziu niciodată să îți urmezi bucuriile.",
  "Ești prețioasă pentru familia ta — nu uita asta.",
  "Fiecare obstacol depășit te-a adus mai aproape de cine ești.",
  "Bucurie, sănătate și liniște — le meriți pe toate.",
  "Ieri ai dat tot ce ai putut. Azi poți da și mai mult.",
  "Ești o mamă extraordinară și o femeie minunată.",
  "Viața ta are valoare imensă — trăiește-o cu bucurie.",
];

function dayIndex(date: Date): number {
  const seed =
    date.getFullYear() * 10_000 + (date.getMonth() + 1) * 100 + date.getDate();
  return seed % 30;
}

function categoryByHour(hour: number): readonly string[] {
  if (hour >= 5 && hour < 12) return DIMINEATA;
  if (hour >= 12 && hour < 18) return ZI;
  if (hour >= 18) return SEARA;
  return MOTIVARE; // 0–4: noapte târzie → mesaj motivațional
}

/** Returnează mesajul de salut al zilei (categorie după oră, rotire zilnică prin seed dată). */
export function getGreeting(now?: Date): string {
  const date = now ?? new Date();
  const msgs = categoryByHour(date.getHours());
  const idx = dayIndex(date);
  return msgs[idx] ?? msgs[0] ?? "";
}
