// Tab definitions — LISTĂ DINAMICĂ.
// Initial doar "chat" (capabilitate intrinsecă).
// Admin adaugă tab-uri noi via Claude Code pe laptop pe măsură ce mama
// adaugă documente. NU hardcode "Rețete/Livadă/Sănătate/Concedii".

export type TabId = string;

export interface TabDef {
  readonly id: TabId;
  readonly label: string;
  readonly icon?: string;
}

export const TABS: ReadonlyArray<TabDef> = [
  { id: "chat", label: "Chat AI", icon: "💬" },
  { id: "wellness", label: "Sănătate", icon: "❤️" },
  { id: "tratament", label: "Tratament", icon: "💊" },
  { id: "notite", label: "Notițe", icon: "📝" },
  { id: "gallery", label: "Galerie", icon: "🖼️" },
  { id: "menu", label: "Meniu", icon: "🍽️" },
  { id: "medicamente", label: "Interacțiuni", icon: "⚕️" },
];

export const DEFAULT_TAB_ID: TabId = TABS[0]?.id ?? "chat";

export function isTabId(s: string): boolean {
  return TABS.some((t) => t.id === s);
}

export function getTab(id: string): TabDef | undefined {
  return TABS.find((t) => t.id === id);
}
