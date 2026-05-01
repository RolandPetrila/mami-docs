// Web Speech API — STT (SpeechRecognition) + TTS (SpeechSynthesis) pentru ro-RO
// STT: Chrome Android necesită pachetul vocal Google Romanian instalat.
// Dacă lipsește → `isSttSupported()` returnează true DAR `ro-RO` fallback la EN → se afișează tooltip.

// Web Speech API — tipuri lipsă din lib.dom.d.ts în TypeScript 5.x
declare global {
  interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
  }
  interface SpeechRecognitionResult {
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative | undefined;
    readonly isFinal: boolean;
  }
  interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult | undefined;
  }
  interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
  }
  interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string;
    readonly message: string;
  }
  interface SpeechRecognition extends EventTarget {
    lang: string;
    interimResults: boolean;
    maxAlternatives: number;
    continuous: boolean;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
    start(): void;
    stop(): void;
    abort(): void;
  }
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

export function isSttSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    (!!window.SpeechRecognition || !!window.webkitSpeechRecognition)
  );
}

export function isTtsSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export interface SttResult {
  transcript: string;
  confidence: number;
}

/**
 * Pornește STT ro-RO. Returnează funcție de oprire.
 * La eroare: apelează `onError` cu mesaj în română.
 */
export function startStt(
  onResult: (r: SttResult) => void,
  onError: (msg: string) => void,
  onEnd?: () => void,
): () => void {
  const Rec = window.SpeechRecognition ?? window.webkitSpeechRecognition;
  if (!Rec) {
    onError("Recunoașterea vocală nu este suportată în acest browser.");
    return () => {};
  }

  const rec = new Rec();
  rec.lang = "ro-RO";
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  rec.continuous = false;

  rec.onresult = (event: SpeechRecognitionEvent) => {
    const r = event.results[0]?.[0];
    if (r) onResult({ transcript: r.transcript, confidence: r.confidence });
  };

  rec.onerror = (event: SpeechRecognitionErrorEvent) => {
    const MAP: Record<string, string> = {
      "no-speech": "Nicio voce detectată. Vorbește mai aproape de microfon.",
      "not-allowed":
        "Permisiunea microfonului a fost refuzată. Activează-o din browser.",
      "audio-capture": "Microfonul nu poate fi accesat.",
      network: "Eroare de rețea la recunoașterea vocală.",
      aborted: "", // user-cancelled, don't show error
    };
    const msg = MAP[event.error] ?? `Eroare STT: ${event.error}`;
    if (msg) onError(msg);
  };

  if (onEnd) rec.onend = onEnd;

  try {
    rec.start();
  } catch {
    onError("Nu s-a putut porni microfonul.");
    return () => {};
  }

  return () => {
    try {
      rec.abort();
    } catch {
      // ignore
    }
  };
}

/**
 * Vorbește textul cu vocea ro-RO.
 * Returnează `true` dacă s-a găsit o voce română pe dispozitiv.
 * Returnează `false` dacă se folosește TTS generic (fără pachet RO).
 */
export function speak(text: string, onEnd?: () => void): boolean {
  if (!isTtsSupported() || !text.trim()) return false;

  const synth = window.speechSynthesis;
  synth.cancel(); // oprește orice TTS activ

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "ro-RO";
  utter.rate = 0.9; // ușor mai lent pentru confort mama
  utter.pitch = 1.0;
  utter.volume = 1.0;

  const voices = synth.getVoices();
  const roVoice = voices.find((v) => v.lang.startsWith("ro"));
  if (roVoice) utter.voice = roVoice;

  if (onEnd) utter.onend = onEnd;
  synth.speak(utter);

  return !!roVoice;
}

export function stopSpeaking(): void {
  if (isTtsSupported()) window.speechSynthesis.cancel();
}

/** Preîncarcă vocile TTS async (voiceschanged e asincron la prima run). */
export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!isTtsSupported()) return Promise.resolve([]);
  const v = window.speechSynthesis.getVoices();
  if (v.length > 0) return Promise.resolve(v);
  return new Promise((resolve) => {
    const timeout = setTimeout(
      () => resolve(window.speechSynthesis.getVoices()),
      2_000,
    );
    window.speechSynthesis.onvoiceschanged = () => {
      clearTimeout(timeout);
      resolve(window.speechSynthesis.getVoices());
    };
  });
}
