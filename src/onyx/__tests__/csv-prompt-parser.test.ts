import { describe, it, expect } from "vitest";
import { parseCsvRows } from "../csv-prompt-parser";

describe("csv-prompt-parser", () => {
  it("splits simple comma-separated rows", () => {
    const csv = "Thema,Folien,Stil\nProduktivität,5,Minimalistisch\nMindset,7,Dunkel";
    const rows = parseCsvRows(csv);
    expect(rows).toEqual([
      ["Thema", "Folien", "Stil"],
      ["Produktivität", "5", "Minimalistisch"],
      ["Mindset", "7", "Dunkel"],
    ]);
  });

  it("handles semicolon-separated CSVs", () => {
    const csv = "Thema;Folien;Stil\nFinanzen;8;Editorial\nErfolg;6;Neon";
    const rows = parseCsvRows(csv);
    expect(rows).toEqual([
      ["Thema", "Folien", "Stil"],
      ["Finanzen", "8", "Editorial"],
      ["Erfolg", "6", "Neon"],
    ]);
  });

  it("respects quoted values with commas inside", () => {
    const csv = 'Titel,Beschreibung\n"Hallo, Welt",Dies ist ein Test';
    const rows = parseCsvRows(csv);
    expect(rows).toEqual([
      ["Titel", "Beschreibung"],
      ["Hallo, Welt", "Dies ist ein Test"],
    ]);
  });
});
