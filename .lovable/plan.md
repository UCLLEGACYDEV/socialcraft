# Ehrliche Analyse: Was die Plattform zu kompliziert macht — und wie wir sie aufräumen

Keine Schönfärberei. Das Produkt kann viel, aber es erklärt sich nicht. Ein neuer Nutzer weiß nach 30 Sekunden nicht, was er zuerst tun soll.

## Was wirklich schlecht ist

1. **Sieben gleichwertige Bereiche in der Seitenleiste** (Karussell, Batch Studio, Einzelbild, AI Clone, Prompt Hub, Galerie, Planer). Alle wirken gleich wichtig. Es gibt keinen Startpunkt, kein "Hier beginnen".
2. **Fachbegriffe, die niemand außerhalb des Teams versteht**: "Batch Studio", "Prompt Hub", "AI Clone", "Claude MCP", "Brand Kit", "Studio Engine", "Slides", "Serie", "Klon". Das ist Entwickler-Sprache in der Nutzeroberfläche.
3. **Einstellungen als Hürde vor dem ersten Erfolg**: Der Nutzer muss Schlüssel, Modelle, Speicher-Einstellungen und Profile verstehen, bevor überhaupt ein Bild entsteht. Das ist die größte Absprungstelle.
4. **Fünf KI-Engines zur Auswahl mit Beschreibungen wie "Ultra 8K" und "Editorial"** — der Nutzer hat keine Grundlage, sich zu entscheiden, und trifft trotzdem eine Pflichtentscheidung.
5. **Der Planer ist ein Monster** (über 5.000 Zeilen in einer Ansicht). Kanäle, Profile, Zeitplanung, Texte, Musik, Vorschau, Warteschlange — alles in einem Bildschirm.
6. **Zu viele Fenster über Fenster**: Einstellungen, Markenprofile, Brand Kit, Planung, Schnellplanung, 30-Tage-Batch, Musik, Konto. Man verliert die Orientierung, wo man gerade ist.
7. **Kein Fortschrittsgefühl**: Generierung dauert lange, aber es ist unklar, wie lange, was es kostet und ob man weggehen darf.
8. **Mobil unbrauchbar** in mehreren Bereichen: feste Seitenleiste, breite Tabellen und Planer-Spalten.
9. **Landingpage und Studio widersprechen sich** — der erste Bildschirm flackert beim Laden, weil zwei verschiedene Startseiten-Varianten existieren.

## Was gut ist (und bleibt)

- Die Bildgenerierung selbst und die Serien-Logik funktionieren und sind stark.
- Privater Cloud-Ordner pro Nutzer, nichts wird zwischen Nutzern vermischt.
- Konsistente dunkle Optik mit Orange-Akzent, wirkt hochwertig.
- Alles auf Deutsch, Planung inklusive Mehrkanal-Veröffentlichung.

## Der Umbau

### Phase 1 — Erster Eindruck und Sprache
- Neue Startseite im Studio: drei große Karten "Karussell erstellen", "Einzelnes Bild", "30 Tage Content" statt sieben gleichwertiger Menüpunkte.
- Seitenleiste auf vier Hauptpunkte reduzieren: **Erstellen, Planen, Meine Inhalte, Mein Stil**. Alles andere wandert darunter oder in die Einstellungen.
- Umbenennen in Klartext: Batch Studio → "Content-Serie", Prompt Hub → "Ideen & Vorlagen", AI Clone → "Mein Gesicht", Brand Kit → "Mein Look", Claude MCP → in Einstellungen verschieben.
- Landingpage-Doppelung entfernen, damit der Start nicht mehr flackert.

### Phase 2 — Sofort loslegen können
- Erste Generierung ohne jede Einrichtung: sinnvolle Voreinstellungen, Schlüssel-Abfrage erst wenn nötig, mit klarer Erklärung warum.
- Engine-Auswahl standardmäßig ausblenden. Voreinstellung "Empfohlen", darunter ein kleiner Link "Andere Qualität wählen" mit einfacher Sprache (Schnell / Ausgewogen / Beste Qualität).
- Kurzer Einstieg beim ersten Besuch: drei Schritte, überspringbar.

### Phase 3 — Warten verständlich machen
- Einheitliche Fortschrittsanzeige: welcher Schritt läuft, wie viele Bilder fertig sind, grobe Restzeit, Abbrechen-Knopf.
- Vor dem Start ein Satz: "Erstellt 8 Bilder, dauert ca. 2 Minuten."
- Fehler in normaler Sprache mit konkretem nächsten Schritt statt technischer Meldungen.

### Phase 4 — Planer entzerren
- Planer in drei klar getrennte Bereiche: **Kalender**, **Neuer Beitrag**, **Kanäle**. Nicht mehr alles gleichzeitig.
- Kanalverbindung als eigener, ruhiger Bereich mit Status pro Konto (verbunden / abgelaufen / Problem) und einem Knopf zum Reparieren.

### Phase 5 — Mobil und Details
- Seitenleiste wird auf kleinen Bildschirmen zur unteren Leiste, Planer-Spalten stapeln sich.
- Tastatur- und Kontrastprüfung über alle Hauptbildschirme.
- Große Dateien (Planer, Galerie, Einzelbild) in kleinere Teile zerlegen, damit Fehler nicht ganze Seiten lahmlegen.

## Technische Hinweise

- `src/onyx/components/layout/Sidebar.tsx`: Navigation von 7 auf 4 Einträge, Rest in Untergruppen; Labels neu.
- `src/routes/index.tsx` (1.485 Zeilen): Tab-Schalter bleibt, neue `overview`-Ansicht als Standard; Doppelrendering mit `CryptoxLandingPage.tsx` auflösen (Ursache des Hydration-Mismatch).
- `PostSchedulerView.tsx` (5.026 Zeilen) in `SchedulerCalendar`, `PostComposer`, `ChannelManager` aufteilen; Logik unverändert übernehmen.
- `EngineSelector.tsx`: Standard eingeklappt, Qualitätsstufen statt Modellnamen, Modellnamen nur als Kleintext.
- Gemeinsame `GenerationProgress`-Komponente für Karussell, Serie und Einzelbild.
- `SettingsModal.tsx` in Abschnitte gliedern: Zugang, Qualität, Speicher, Erweitert.
- Keine Änderung an Generierungs-, Upload- oder Planungslogik in Phase 1–3; das sind reine Oberflächen- und Struktur-Arbeiten.

## Reihenfolge

Phase 1 zuerst (größte Wirkung, geringstes Risiko), danach Phase 2 und 3. Phase 4 und 5 sind eigene, größere Schritte.
