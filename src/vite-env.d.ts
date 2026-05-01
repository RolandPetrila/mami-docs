/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// mammoth@1.8.0 ships no .d.ts and @types/mammoth does not exist
declare module "mammoth" {
  interface ConvertResult {
    value: string;
    messages: { type: string; message: string }[];
  }
  export function convertToHtml(
    input: { arrayBuffer: ArrayBuffer },
    options?: Record<string, unknown>,
  ): Promise<ConvertResult>;
}
