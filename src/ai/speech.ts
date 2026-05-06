import { transcribeAudio } from "./client";

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
    (typeof window !== "undefined" &&
      (!!window.SpeechRecognition || !!window.webkitSpeechRecognition)) ||
    !!navigator.mediaDevices?.getUserMedia
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
    return startWhisperStt(onResult, onError, onEnd);
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

  // T6.6 — fallback Whisper la erori tranzitorii (network, no-speech).
  // Permisiuni refuzate / hardware lipsă rămân terminale (Whisper nu rezolvă).
  let whisperHandle: (() => void) | null = null;
  const TRANSIENT_ERRORS = new Set([
    "network",
    "no-speech",
    "language-not-supported",
  ]);

  rec.onerror = (event: SpeechRecognitionErrorEvent) => {
    const MAP: Record<string, string> = {
      "no-speech": "Nicio voce detectată. Vorbește mai aproape de microfon.",
      "not-allowed":
        "Permisiunea microfonului a fost refuzată. Activează-o din browser.",
      "audio-capture": "Microfonul nu poate fi accesat.",
      network: "Eroare de rețea la recunoașterea vocală.",
      aborted: "",
    };
    if (TRANSIENT_ERRORS.has(event.error)) {
      console.info(
        `[speech] native STT eroare tranzitorie '${event.error}', fallback Whisper`,
      );
      whisperHandle = startWhisperStt(onResult, onError, onEnd);
      return;
    }
    const msg = MAP[event.error] ?? `Eroare STT: ${event.error}`;
    if (msg) onError(msg);
  };

  if (onEnd) rec.onend = onEnd;

  try {
    rec.start();
  } catch (err) {
    console.warn(
      "[speech] STT start eșuat, fallback Whisper:",
      err instanceof Error ? err.message : String(err),
    );
    return startWhisperStt(onResult, onError, onEnd);
  }

  return () => {
    try {
      rec.abort();
    } catch (err) {
      console.warn(
        "[speech] rec.abort eșuat:",
        err instanceof Error ? err.message : String(err),
      );
    }
    whisperHandle?.();
    whisperHandle = null;
  };
}

export function startWhisperStt(
  onResult: (r: SttResult) => void,
  onError: (msg: string) => void,
  onEnd?: () => void,
): () => void {
  if (!navigator.mediaDevices?.getUserMedia) {
    onError("Microfonul nu este suportat în acest browser.");
    return () => {};
  }

  let mediaRecorder: MediaRecorder | null = null;
  let audioChunks: Blob[] = [];

  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((stream) => {
      mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        try {
          const transcript = await transcribeAudio(audioBlob);
          onResult({ transcript, confidence: 1.0 });
        } catch (err) {
          onError(
            `Eroare Whisper: ${err instanceof Error ? err.message : String(err)}`,
          );
        } finally {
          stream.getTracks().forEach((t) => t.stop());
          if (onEnd) onEnd();
        }
      };

      mediaRecorder.start();
    })
    .catch(() => {
      onError("Nu s-a putut accesa microfonul pentru înregistrare.");
    });

  return () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
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
