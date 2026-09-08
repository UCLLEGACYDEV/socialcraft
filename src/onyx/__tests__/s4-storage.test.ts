import { describe, it, expect } from "vitest";
import { slugifyTitle, makeProjectFolderName } from "../s4-storage";

describe("s4-storage path and slug utilities", () => {
  it("transliterates German umlauts properly", () => {
    expect(slugifyTitle("Überraschung für Großkunden")).toBe("Ueberraschung_fuer_Grosskunden");
    expect(slugifyTitle("Schöne Grüße aus Köln")).toBe("Schoene_Gruesse_aus_Koeln");
  });

  it("strips invalid special characters and multiple underscores", () => {
    expect(slugifyTitle("Projekt #1: Der Durchbruch!!!")).toBe("Projekt_1_Der_Durchbruch");
  });

  it("generates consistent project folder names with date", () => {
    const topic = "Instagram Strategie";
    const folder = makeProjectFolderName(topic, "abc12345");
    const todayStr = new Date().toISOString().slice(0, 10);
    expect(folder).toContain(todayStr);
    expect(folder).toContain("Instagram_Strategie");
    expect(folder).toContain("abc123");
  });
});
