import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  addHydration,
  listHydration,
  getHydrationToday,
  addVitals,
  listVitals,
  addEmotion,
  listEmotion,
  addSleep,
  listSleep,
  addPhotoMeta,
  listPhotos,
  listDeletedPhotos,
  softDeletePhotoMeta,
  purgeDeletedPhotosMeta,
  deletePhotoMeta,
  addBookmark,
  listBookmarks,
  removeBookmark,
  addHighlight,
  listHighlights,
  removeHighlight,
  addDocNote,
  listDocNotes,
  removeDocNote,
  saveMenu,
  getMenu,
  listMenus,
  saveDocChunk,
  getDocChunks,
  clearDocIndex,
} from "../data/local-store";

// Supabase e optional — mock-uim getSupabaseClient să returneze null (offline mode)
vi.mock("../data/supabase", () => ({
  getSupabaseClient: vi.fn().mockResolvedValue(null),
}));

// ---- Hydration ----

describe("Hydration", () => {
  it("adaugă și listează intrări", async () => {
    const entry = await addHydration(250);
    expect(entry.amount_ml).toBe(250);
    expect(entry.id).toBeTruthy();
    expect(entry.ts).toMatch(/^\d{4}-/);

    const list = listHydration();
    expect(list).toHaveLength(1);
    expect(list[0]!.amount_ml).toBe(250);
  });

  it("getHydrationToday sumează numai intrările de azi", async () => {
    await addHydration(200);
    await addHydration(300);
    expect(getHydrationToday()).toBe(500);
  });

  it("getHydrationToday ignoră intrările din alte zile", async () => {
    const yesterday = new Date(Date.now() - 86_400_000).toISOString();
    localStorage.setItem(
      "mami:hydration",
      JSON.stringify([{ id: "x", ts: yesterday, amount_ml: 999 }]),
    );
    expect(getHydrationToday()).toBe(0);
  });

  it("multiple adăugări acumulează corect", async () => {
    await addHydration(100);
    await addHydration(150);
    await addHydration(50);
    expect(listHydration()).toHaveLength(3);
    expect(getHydrationToday()).toBe(300);
  });
});

// ---- Vitals ----

describe("Vitals", () => {
  it("adaugă vitale cu pulse null", async () => {
    const entry = await addVitals(120, 80, null);
    expect(entry.systolic).toBe(120);
    expect(entry.diastolic).toBe(80);
    expect(entry.pulse).toBeNull();
  });

  it("adaugă vitale cu pulse setat", async () => {
    const entry = await addVitals(130, 85, 72);
    expect(entry.pulse).toBe(72);
  });

  it("listVitals respectă limita", async () => {
    for (let i = 0; i < 5; i++) await addVitals(120, 80, 70);
    expect(listVitals(3)).toHaveLength(3);
    expect(listVitals(10)).toHaveLength(5);
  });
});

// ---- Emotion ----

describe("Emotion", () => {
  it("adaugă și listează", async () => {
    const entry = await addEmotion(4, "Am avut o zi bună");
    expect(entry.level).toBe(4);
    expect(entry.note).toBe("Am avut o zi bună");
  });

  it("listEmotion cu limită", async () => {
    for (let i = 0; i < 5; i++) await addEmotion(((i % 5) + 1) as 1, "");
    expect(listEmotion(2)).toHaveLength(2);
  });
});

// ---- Sleep ----

describe("Sleep", () => {
  it("calculează orele corect", async () => {
    const start = "2026-05-05T22:00:00.000Z";
    const end = "2026-05-06T06:30:00.000Z";
    const entry = await addSleep(start, end);
    expect(entry.hours).toBe(8.5);
  });

  it("nu returnează ore negative la end < start", async () => {
    const entry = await addSleep(
      "2026-05-05T10:00:00.000Z",
      "2026-05-05T09:00:00.000Z",
    );
    expect(entry.hours).toBe(0);
  });

  it("rotunjire la 1 zecimală", async () => {
    const start = "2026-05-05T22:00:00.000Z";
    const end = "2026-05-06T05:40:00.000Z";
    const entry = await addSleep(start, end);
    expect(entry.hours).toBe(7.7);
  });
});

// ---- Photos ----

describe("Photos", () => {
  it("adaugă și listează metadate", async () => {
    await addPhotoMeta("photo-1", "Ziua de naștere", 102400);
    expect(listPhotos()).toHaveLength(1);
    expect(listPhotos()[0]!.caption).toBe("Ziua de naștere");
  });

  it("softDelete ascunde din listPhotos", async () => {
    await addPhotoMeta("photo-1", "Test", 500);
    softDeletePhotoMeta("photo-1");
    expect(listPhotos()).toHaveLength(0);
    expect(listDeletedPhotos()).toHaveLength(1);
  });

  it("purgeDeletedPhotosMeta returnează IDs mai vechi de N zile", async () => {
    await addPhotoMeta("photo-old", "Veche", 100);
    softDeletePhotoMeta("photo-old");

    // Forțăm deleted_at în trecut (31 zile)
    const all = JSON.parse(localStorage.getItem("mami:photos") ?? "[]");
    all[0].deleted_at = new Date(Date.now() - 31 * 86_400_000).toISOString();
    localStorage.setItem("mami:photos", JSON.stringify(all));

    const purged = purgeDeletedPhotosMeta(30);
    expect(purged).toContain("photo-old");
    expect(listDeletedPhotos()).toHaveLength(0);
  });

  it("purgeDeletedPhotosMeta nu șterge foto șterse recent", async () => {
    await addPhotoMeta("photo-new", "Nouă", 100);
    softDeletePhotoMeta("photo-new");
    const purged = purgeDeletedPhotosMeta(30);
    expect(purged).toHaveLength(0);
    expect(listDeletedPhotos()).toHaveLength(1);
  });

  it("deletePhotoMeta elimină complet", async () => {
    await addPhotoMeta("photo-1", "Test", 100);
    deletePhotoMeta("photo-1");
    expect(listPhotos()).toHaveLength(0);
  });
});

// ---- Bookmarks ----

describe("Bookmarks", () => {
  it("adaugă bookmark", async () => {
    const bk = await addBookmark(
      "doc-1",
      "Rețetă tort",
      0.5,
      "pagina preferată",
    );
    expect(bk.docId).toBe("doc-1");
    expect(bk.scrollPct).toBe(0.5);
  });

  it("deduplică pe docId — un singur bookmark per document", async () => {
    await addBookmark("doc-1", "Doc", 0.1);
    await addBookmark("doc-1", "Doc", 0.9, "nou");
    expect(listBookmarks()).toHaveLength(1);
    expect(listBookmarks()[0]!.scrollPct).toBe(0.9);
  });

  it("removeBookmark șterge corect", async () => {
    await addBookmark("doc-1", "Doc", 0.5);
    removeBookmark("doc-1");
    expect(listBookmarks()).toHaveLength(0);
  });
});

// ---- Highlights ----

describe("Highlights", () => {
  it("adaugă highlight cu culoare default", async () => {
    const h = await addHighlight("doc-1", "Doc", "text important");
    expect(h.color).toBe("#ffe066");
  });

  it("listHighlights filtrează pe docId", async () => {
    await addHighlight("doc-1", "Doc1", "text 1");
    await addHighlight("doc-2", "Doc2", "text 2");
    expect(listHighlights("doc-1")).toHaveLength(1);
    expect(listHighlights()).toHaveLength(2);
  });

  it("removeHighlight elimină după id", async () => {
    const h = await addHighlight("doc-1", "Doc", "text");
    removeHighlight(h.id);
    expect(listHighlights("doc-1")).toHaveLength(0);
  });
});

// ---- Doc Notes ----

describe("DocNotes", () => {
  it("adaugă și listează notițe", async () => {
    await addDocNote("doc-1", "Doc", "Notiță importantă");
    expect(listDocNotes("doc-1")).toHaveLength(1);
  });

  it("listDocNotes fără filtru returnează toate", async () => {
    await addDocNote("doc-1", "D1", "n1");
    await addDocNote("doc-2", "D2", "n2");
    expect(listDocNotes()).toHaveLength(2);
  });

  it("removeDocNote după id", async () => {
    const n = await addDocNote("doc-1", "Doc", "text");
    removeDocNote(n.id);
    expect(listDocNotes("doc-1")).toHaveLength(0);
  });
});

// ---- Weekly Menu ----

describe("Weekly Menu", () => {
  const sampleMenu = {
    luni: { breakfast: "Fulgi de ovăz", lunch: "Ciorbă", dinner: "Omletă" },
  };

  it("salvează și recuperează meniu pe weekStart", () => {
    saveMenu("2026-05-05", sampleMenu);
    const m = getMenu("2026-05-05");
    expect(m).toBeDefined();
    expect(m!.weekStart).toBe("2026-05-05");
    expect(m!.generatedBy).toBe("ai");
  });

  it("deduplică pe weekStart — suprascrie meniu existent", () => {
    saveMenu("2026-05-05", sampleMenu);
    const updated = {
      ...sampleMenu,
      marti: { breakfast: "B", lunch: "L", dinner: "D" },
    };
    saveMenu("2026-05-05", updated, "manual");
    expect(listMenus()).toHaveLength(1);
    expect(getMenu("2026-05-05")!.generatedBy).toBe("manual");
  });
});

// ---- RAG Doc Index ----

describe("DocIndex", () => {
  it("salvează și recuperează chunk-uri", () => {
    saveDocChunk("doc-1", "Doc", 0, "text chunk 0", [0.1, 0.2, 0.3]);
    saveDocChunk("doc-1", "Doc", 1, "text chunk 1", [0.4, 0.5, 0.6]);
    expect(getDocChunks("doc-1")).toHaveLength(2);
  });

  it("suprascrie chunk cu același docId+chunkIndex", () => {
    saveDocChunk("doc-1", "Doc", 0, "vechi", [0, 0]);
    saveDocChunk("doc-1", "Doc", 0, "nou", [1, 1]);
    const chunks = getDocChunks("doc-1");
    expect(chunks).toHaveLength(1);
    expect(chunks[0]!.chunkText).toBe("nou");
  });

  it("clearDocIndex șterge doar doc-ul specificat", () => {
    saveDocChunk("doc-1", "D1", 0, "a", [0.1]);
    saveDocChunk("doc-2", "D2", 0, "b", [0.2]);
    clearDocIndex("doc-1");
    expect(getDocChunks("doc-1")).toHaveLength(0);
    expect(getDocChunks("doc-2")).toHaveLength(1);
  });

  it("getDocChunks fără filtru returnează toate", () => {
    saveDocChunk("doc-1", "D1", 0, "a", [0.1]);
    saveDocChunk("doc-2", "D2", 0, "b", [0.2]);
    expect(getDocChunks()).toHaveLength(2);
  });
});

// ---- Edge cases writeArr / readArr ----

describe("Storage edge cases", () => {
  it("readArr returnează [] la localStorage corupt", () => {
    localStorage.setItem("mami:hydration", "INVALID_JSON{{{");
    expect(listHydration()).toEqual([]);
  });

  it("MAX_ENTRIES (365) — FIFO drop", async () => {
    // Umplem direct localStorage cu 365 intrări
    const entries = Array.from({ length: 365 }, (_, i) => ({
      id: String(i),
      ts: new Date().toISOString(),
      amount_ml: i,
    }));
    localStorage.setItem("mami:hydration", JSON.stringify(entries));

    // Adăugăm a 366-a
    await addHydration(9999);
    const list = listHydration();
    expect(list).toHaveLength(365);
    expect(list[list.length - 1]!.amount_ml).toBe(9999);
    expect(list[0]!.amount_ml).toBe(1); // prima (0) a căzut
  });
});
