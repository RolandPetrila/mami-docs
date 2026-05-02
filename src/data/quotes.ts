// Quote-uri zilnice motivaționale — 60 quote-uri în română.
// Selectie deterministă per zi (aceeași quote toată ziua, se schimbă la miezul nopții).

export interface Quote {
  text: string;
  author: string;
  category:
    | "familie"
    | "sanatate"
    | "viata"
    | "bucurie"
    | "intelepciune"
    | "iubire";
}

export const DAILY_QUOTES: Quote[] = [
  {
    text: "Familia este ancora în furtunile vieții și portul liniștit după fiecare furtună.",
    author: "Proverb românesc",
    category: "familie",
  },
  {
    text: "Sănătatea nu este totul, dar fără sănătate totul este nimic.",
    author: "Arthur Schopenhauer",
    category: "sanatate",
  },
  {
    text: "Bucuria nu este în lucruri, ci este în noi înșine.",
    author: "Richard Wagner",
    category: "bucurie",
  },
  {
    text: "Dragostea nu se vede cu ochii, ci se simte cu inima.",
    author: "William Shakespeare",
    category: "iubire",
  },
  {
    text: "Fiecare zi este un dar. Trebuie să știm să îl deschidem cu bucurie.",
    author: "Proverb",
    category: "viata",
  },
  {
    text: "Cel mai mare avuț al omului este sănătatea.",
    author: "Proverb românesc",
    category: "sanatate",
  },
  {
    text: "Nu numărul anilor contează, ci ce pui în ei.",
    author: "Abraham Lincoln",
    category: "viata",
  },
  {
    text: "Pacea vine din interior. Nu o căuta în afara ta.",
    author: "Buddha",
    category: "intelepciune",
  },
  {
    text: "Mama este inima familiei, iar familia este inima vieții.",
    author: "Proverb",
    category: "familie",
  },
  {
    text: "Fericirea nu este o stație la care ajungi, ci un mod de a călători.",
    author: "Margaret Lee Runbeck",
    category: "bucurie",
  },
  {
    text: "Un zâmbet este cel mai mic lucru pe care îl poți da, dar cel mai mare lucru pe care îl poți oferi.",
    author: "Proverb",
    category: "bucurie",
  },
  {
    text: "Sănătatea este cea mai mare fericire pe care o poți câștiga zi de zi.",
    author: "Proverb românesc",
    category: "sanatate",
  },
  {
    text: "Inima mamei este sala de clasă în care copilul își învață lecțiile vieții.",
    author: "Henry Ward Beecher",
    category: "familie",
  },
  {
    text: "Fiecare moment prețios petrecut cu cei dragi devine o amintire de neprețuit.",
    author: "Proverb",
    category: "familie",
  },
  {
    text: "Viața este ca un grădinar: dacă o îngrijești zilnic, înflorește frumos.",
    author: "Proverb",
    category: "viata",
  },
  {
    text: "Liniștea sufletului este mai valoroasă decât orice comoară.",
    author: "Seneca",
    category: "intelepciune",
  },
  {
    text: "Iubind pe ceilalți, ne descoperim pe noi înșine.",
    author: "Fyodor Dostoevsky",
    category: "iubire",
  },
  {
    text: "Dimineața aduce speranță, iar seara aduce recunoștință.",
    author: "Proverb",
    category: "viata",
  },
  {
    text: "Un pas mic în fiecare zi duce departe în timp.",
    author: "Proverb chinezesc",
    category: "intelepciune",
  },
  {
    text: "Bucuriile mici ale vieții sunt cele mai mari comori.",
    author: "Proverb",
    category: "bucurie",
  },
  {
    text: "Sănătatea trupului înseamnă sănătatea sufletului.",
    author: "Proverb românesc",
    category: "sanatate",
  },
  {
    text: "Familia este acolo unde se întâlnesc toate drumurile lumii.",
    author: "Proverb",
    category: "familie",
  },
  {
    text: "Înțelepciunea vine din experiență, iar experiența vine din trăire.",
    author: "Proverb",
    category: "intelepciune",
  },
  {
    text: "Iubirea adevărată nu se pierde niciodată. Dacă se pierde, nu a fost adevărată.",
    author: "Ernest Hemingway",
    category: "iubire",
  },
  {
    text: "Fiecare zi bine trăită înseamnă un somn liniștit.",
    author: "Leonardo da Vinci",
    category: "viata",
  },
  {
    text: "Florile nu strigă că sunt frumoase, dar toți le admiră.",
    author: "Proverb japonez",
    category: "intelepciune",
  },
  {
    text: "O masă gătită cu dragoste hrănește și sufletul.",
    author: "Proverb românesc",
    category: "familie",
  },
  {
    text: "Cel mai bun doctor este natura, cel mai bun medicament este veselia.",
    author: "Proverb",
    category: "sanatate",
  },
  {
    text: "Veselia este lumina care face ca inima să strălucească.",
    author: "Thomas Addison",
    category: "bucurie",
  },
  {
    text: "Copiii cresc, dar dragostea de mamă rămâne veșnică.",
    author: "Proverb",
    category: "familie",
  },
  {
    text: "Nu regreta trecutul, nu te teme de viitor. Trăiește prezentul.",
    author: "Proverb budist",
    category: "intelepciune",
  },
  {
    text: "Câtă dragoste dai, atâta primești înapoi.",
    author: "Proverb românesc",
    category: "iubire",
  },
  {
    text: "Cel mai frumos lucru din lume este să te trezești dimineața cu inima plină de recunoștință.",
    author: "Proverb",
    category: "viata",
  },
  {
    text: "Mâncarea sănătoasă este cea mai bună investiție în viitorul tău.",
    author: "Hippocrate",
    category: "sanatate",
  },
  {
    text: "Grădina casei înflorește când e îngrijită cu dragoste.",
    author: "Proverb românesc",
    category: "viata",
  },
  {
    text: "Înțeleptul nu se grăbește, dar nici nu zăbovește prea mult.",
    author: "Proverb chinezesc",
    category: "intelepciune",
  },
  {
    text: "Familia unită este mai puternică decât orice forță a lumii.",
    author: "Proverb românesc",
    category: "familie",
  },
  {
    text: "Bucuria de a trăi se descoperă în lucrurile simple.",
    author: "Proverb",
    category: "bucurie",
  },
  {
    text: "Omul sănătos are o mie de dorințe, omul bolnav — una singură.",
    author: "Proverb",
    category: "sanatate",
  },
  {
    text: "Fiecare zi este o nouă șansă de a fi mai bun.",
    author: "Proverb",
    category: "viata",
  },
  {
    text: "Dragostea este limbajul universal al sufletului.",
    author: "Proverb",
    category: "iubire",
  },
  {
    text: "Cine plantează pomi la umbra cărora nu va sta, gândește la generațiile viitoare.",
    author: "Proverb grecesc",
    category: "intelepciune",
  },
  {
    text: "Suntem cei mai bogați când avem lângă noi oamenii pe care îi iubim.",
    author: "Proverb",
    category: "familie",
  },
  {
    text: "Râsul este cel mai ieftin medicament și cel mai eficient.",
    author: "Proverb",
    category: "sanatate",
  },
  {
    text: "Fiecare zi în care surâzi este o zi câștigată.",
    author: "Charlie Chaplin",
    category: "bucurie",
  },
  {
    text: "Inima deschisă vede mai departe decât mintea ascuțită.",
    author: "Proverb",
    category: "iubire",
  },
  {
    text: "Mișcarea este viața, iar viața este mișcare.",
    author: "Hippocrate",
    category: "sanatate",
  },
  {
    text: "Recunoștința transformă ce avem în suficient.",
    author: "Proverb",
    category: "intelepciune",
  },
  {
    text: "Amintirile frumoase sunt comoara cea mai de preț a inimii.",
    author: "Proverb românesc",
    category: "familie",
  },
  {
    text: "Fiecare dimineață este o pagină albă. Tu scrii povestea.",
    author: "Proverb",
    category: "viata",
  },
  {
    text: "Apa limpede vindecă, aerul curat întărește, somnul bun reînnoiește.",
    author: "Proverb românesc",
    category: "sanatate",
  },
  {
    text: "Vorbele bune sunt mai valoroase decât aurul.",
    author: "Proverb",
    category: "intelepciune",
  },
  {
    text: "Dragostea de familie este fundamentul pe care se clădesc toate celelalte iubiri.",
    author: "Proverb",
    category: "familie",
  },
  {
    text: "Unde este voie bună, acolo este sănătate.",
    author: "Proverb românesc",
    category: "bucurie",
  },
  {
    text: "Omul care se bucură de lucruri mici are întotdeauna de ce să fie fericit.",
    author: "Proverb",
    category: "bucurie",
  },
  {
    text: "Sufletul tânăr nu se măsoară în ani, ci în bucurii.",
    author: "Proverb",
    category: "viata",
  },
  {
    text: "Ce semeni, aceea culegi — semănați dragoste și veți culege fericire.",
    author: "Proverb românesc",
    category: "iubire",
  },
  {
    text: "Omul sfânt nu are dușmani, omul bun are prieteni pretutindeni.",
    author: "Proverb românesc",
    category: "intelepciune",
  },
  {
    text: "Cel mai mare dar pe care îl poți oferi cuiva este timpul tău.",
    author: "Proverb",
    category: "familie",
  },
  {
    text: "Viața e scurtă — trăiește-o cu bucurie, cu iubire și cu recunoștință.",
    author: "Proverb",
    category: "viata",
  },
  {
    text: "Pacea din casă e mai valoroasă decât toate bogățiile lumii.",
    author: "Proverb românesc",
    category: "familie",
  },
];

export function getDailyQuote(): Quote {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
      86_400_000,
  );
  return DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length] ?? DAILY_QUOTES[0]!;
}

export function getRandomQuote(): Quote {
  return (
    DAILY_QUOTES[Math.floor(Math.random() * DAILY_QUOTES.length)] ??
    DAILY_QUOTES[0]!
  );
}
