# ONYX Studio — Nachbau (nur lokal, keine Cloud)

Ziel: die App aus deiner Spec 1:1 nachbauen, komplett im Browser. Alles wird lokal im Browser gespeichert (localStorage), keine Datenbank, keine Anmeldung, keine Cloud. Bild- und Text-Erzeugung laufen erstmal über eingebaute Platzhalter ("Mock"), damit du die komplette Oberfläche und alle Abläufe schon benutzen kannst.

## Was du am Ende siehst

Ein dunkles Studio-Interface (Schwarz #060509, Violett-Akzent #9333EA, Plus Jakarta Sans + JetBrains Mono) mit fester linker Navigation und sechs Bereichen:

- Karussell — Formular (Thema, Zielgruppe, Design, Slide-Anzahl 1–10, CTA, Handle, Text-Engine, AI-Clone-Schalter) → danach die Slide-Ansicht mit Kacheln im 4:5-Format
- Serie — Text einfügen, automatisch in Karussells/Slides zerlegen, Warteschlange abarbeiten mit Fortschritt und Status
- Einzelbild, AI Clone, Prompt Hub, Galerie — erstmal als schlanke Ansichten mit gleicher Optik

Dazu: obere Kontextleiste (Serien-Fortschritt, Modellauswahl, Wiederholungsschutz-Anzeige), Einstellungen-Fenster und Brand-Kit-Fenster.

## Umsetzung in Phasen

Phase 1 — Fundament
- Farb- und Schrift-Tokens aus der Spec übernehmen, Dunkelmodus fest, Radial-Gradient + Rauschen im Hintergrund
- Alle Typen (SlideContent, BrandKit, ApiSettings, SeriesJob, BriefValues, HistoryEntry, Credits) übernehmen
- Speicher-Schicht für alle localStorage-Schlüssel aus der Spec (bogen_*, onyx_*)

Phase 2 — Rahmen
- Sidebar (ein-/ausklappbar, 68px/224px, Zustand gespeichert, Credits-Pille, Brand-Kit- und Einstellungen-Buttons)
- Kontextleiste mit den beschriebenen Steuerelementen

Phase 3 — Karussell
- Formular mit Design-Auswahl-Reihe und allen Feldern
- Absenden → Platzhalter-Generator erzeugt Slides
- Slide-Kachel mit vier Zuständen (leer, lädt, fertig, Hover-Aktionen)
- Slide-Ansicht mit Raster, "Alle Visuals laden", Abbrechen, Neu-machen, Bearbeiten, Einzel-Download und ZIP-Export

Phase 4 — Serie
- Einfügefeld mit Zerlegung der Prompt-Blöcke, Vorschau mit editierbaren Titeln
- Warteschlange mit Status-Badges, Fortschrittsbalken, Aufklappen, Slide-Bearbeitung, Abbrechen/Löschen; überlebt einen Neuladen der Seite

Phase 5 — Fenster & Rest
- Einstellungen (Anbieter, Schlüssel-Felder, Modell/Auflösung, Wiederholungs-Cache löschen)
- Brand Kit (Handle, Stil-Archetyp, Format 4:5 / 1:1, CTA-Auswahl)
- Die vier übrigen Ansichten inkl. Galerie aus dem lokalen Verlauf

## Bewusst weggelassen

Desktop-/Electron-Teile: Ordner öffnen, Speicherpfad, automatischer Export auf die Festplatte, grüner Punkt für gespeicherte Datei. Verschlüsselung der Schlüssel entfällt vorerst; sie liegen im Browser-Speicher.

## Technische Hinweise

- Bestehender Stack (React 19 + TanStack Start + Tailwind v4). Statt Next.js-Routen ein Modul `src/lib/mock-api.ts` mit `mockGenerateCarousel`, `mockGenerateImage`, `mockGetCredits`, `mockNameTopic`.
- Alle Ansichten unter `/` als Tab-Umschaltung (kein Routing-Umbau), Tab-Zustand in `bogen_active_tab`.
- Farbwerte als semantische Tokens in `src/styles.css`, keine harten Farbklassen in Komponenten.
- `jszip` + `file-saver` für den ZIP-Export, `lucide-react` für Icons.
- Ein Parser `parse-prompt-block.ts` (parseBlock / parseSlides / extractTitle) wie in der Spec.
- Später: Mocks gegen echte Anbieter tauschen, sobald Schlüssel da sind — die Aufrufstellen bleiben gleich.
