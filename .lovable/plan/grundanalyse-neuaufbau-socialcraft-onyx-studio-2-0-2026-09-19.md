# Grundanalyse & Neuaufbau: Socialcraft ONYX Studio 2.0

Ehrlich, ohne Beschönigung. Danach ein kompletter Aufbauplan, so als würden wir bei null starten — nur mit dem Vorteil, dass die wertvollen Teile schon existieren und übernommen werden.

## Teil 1 — Was heute wirklich los ist

**Zahlen (gemessen, nicht geschätzt)**
- Der Planer ist eine einzige Datei mit 5.058 Zeilen. Einzelbild 2.057. Galerie 1.424. Die Startseite 1.546.
- Acht gleichrangige Bereiche, dazu 14 Fenster-Dialoge. Kein Bereich ist als Einstieg markiert.
- Zwei konkurrierende Startseiten (neue Übersicht und alte Landingpage). Daher flackert der Start und es gibt beim Laden einen Anzeigefehler.
- Anmeldung läuft heute über den Browserspeicher: Nutzer, Rollen, sogar Admin-Rechte liegen lokal. Wer sich auskennt, macht sich in Sekunden zum Admin. Das ist der ernsteste Punkt.
- Zugangsschlüssel (Bildgenerierung, Veröffentlichung) werden teilweise im Browser gehalten statt sicher auf dem Server.

**Was den Nutzer konkret abschreckt**
1. Kein klarer Startpunkt: sieben bis acht Menüpunkte wirken gleich wichtig.
2. Insider-Sprache: Batch Studio, Prompt Hub, AI Clone, Brand Kit, MCP, Engine, Slides.
3. Einrichtung vor dem ersten Erfolg: Schlüssel, Modelle, Speicher, Profile — bevor ein einziges Bild entsteht.
4. Fünf KI-Engines zur Pflichtauswahl, ohne Entscheidungsgrundlage.
5. Warten ohne Information: keine Restzeit, keine Kostenangabe, kein Abbrechen.
6. Fenster über Fenster, man verliert die Orientierung.
7. Auf dem Handy in mehreren Bereichen unbrauchbar.
8. Technische Fehlermeldungen statt verständlicher Hinweise.

**Was gut ist und definitiv bleibt**
- Bildgenerierung und Serien-Logik: stark und funktionieren.
- Privater Cloud-Ordner je Nutzer, Projektordner mit lesbaren Titeln.
- Mehrkanal-Veröffentlichung inklusive Zeitplanung.
- Dunkle Optik mit Orange — wirkt hochwertig, bleibt.
- Durchgehend Deutsch.

**Antwort auf deine Kernfrage:** Kein Wegwerfen. Ein Wegwerfen kostet Monate und du verlierst genau die Teile, die funktionieren. Richtig ist: **neue Hülle, neues Fundament bei Konten und Sicherheit, bewährte Motoren übernehmen.** Das Ergebnis fühlt sich für den Nutzer wie eine komplett neue Plattform an.

## Teil 2 — Die Plattform, als würden wir heute anfangen

**Leitsatz:** Ein Nutzer kommt rein, tippt sein Thema, bekommt Bilder, plant sie ein. Alles andere ist optional und versteckt.

**Vier Bereiche statt acht**
```text
Erstellen   -> Karussell | Einzelbild | 30-Tage-Serie (ein Bereich, drei Startknöpfe)
Planen      -> Kalender | Neuer Beitrag | Kanäle
Meine Inhalte -> alles Erstellte als Raster, nach Projekt
Mein Stil   -> Look, Gesicht, Vorlagen, Zielgruppe
```
Alles Technische (Schlüssel, Speicher, Modelle, MCP) wandert in Einstellungen.

**Neue Sprache**
Batch Studio -> Content-Serie · Prompt Hub -> Ideen & Vorlagen · AI Clone -> Mein Gesicht · Brand Kit -> Mein Look · Engine -> Qualität (Schnell / Ausgewogen / Beste) · Slides -> Bilder.

**Der eine Hauptweg**
```text
Thema eingeben -> Vorschau der Idee -> "8 Bilder, ca. 2 Min., X Credits"
   -> Fortschritt mit Abbrechen -> Ergebnis-Raster -> Speichern | Herunterladen | Einplanen
```
Keine Pflichteinstellung vorher. Voreinstellungen greifen, Feinschliff ist aufklappbar.

## Teil 3 — Konten & Daten neu

Echte Anmeldung statt Browserspeicher:
- Registrierung/Anmeldung per E-Mail, Sitzung serverseitig geprüft.
- Rollen (Nutzer/Admin) in einer eigenen Rollentabelle, nie im Profil, nie im Browser. Admin-Bereich prüft die Rolle auf dem Server.
- Credits und Nutzung serverseitig geführt, nicht mehr manipulierbar.
- Private Cloud-Ordner bleiben, aber der Zugriff wird gegen die geprüfte Sitzung gehalten, nicht gegen eine vom Browser gelieferte Kennung.
- Alle Fremd-Schlüssel (Bildgenerierung, Veröffentlichung, Speicher) ausschließlich auf dem Server.

## Teil 4 — Umsetzung in Etappen

**Etappe 0 — Stabilität (Basis)**
Doppelte Startseite auflösen, Anzeigefehler beim Laden beheben, Fehlergrenzen pro Bereich, damit ein Fehler nie die ganze Seite schwarz macht.

**Etappe 1 — Neues Gerüst und Sprache**
Vier Bereiche, neue Startseite mit drei großen Karten, alle Bezeichnungen in Klartext, Handy-Navigation als untere Leiste.

**Etappe 2 — Erstellen ohne Hürden**
Qualität statt Modellnamen, Voreinstellungen greifen sofort, Kosten- und Zeitansage vor dem Start, einheitliche Fortschrittsanzeige mit Abbrechen, verständliche Fehlermeldungen.

**Etappe 3 — Konten & Sicherheit**
Echte Anmeldung, Rollentabelle, serverseitige Credits, geschützte Cloud-Zugriffe, Schlüssel vom Browser auf den Server.

**Etappe 4 — Planer entzerren**
Die 5.058-Zeilen-Ansicht wird in Kalender, Beitrags-Editor und Kanalverwaltung geteilt. Kanäle bekommen Statusanzeige (verbunden / abgelaufen / Problem) mit Reparatur-Knopf. Logik bleibt unverändert.

**Etappe 5 — Inhalte & Feinschliff**
Galerie als Projektraster mit Cover, Suche und Stapelaktionen. Handy-Optimierung überall, Tastatur- und Kontrastprüfung, große Dateien in kleinere Teile zerlegt.

## Teil 5 — Technische Hinweise

- Routen bleiben TanStack-Dateirouten; je Bereich eine eigene Route mit eigenen Seiten-Metadaten.
- `CryptoxLandingPage.tsx` vs. `routes/index.tsx`: eine Quelle für „/", die andere entfällt. Das behebt den Hydration-Mismatch.
- `PostSchedulerView.tsx` (5.058) -> `SchedulerCalendar`, `PostComposer`, `ChannelManager`; `DirectPromptView.tsx` (2.057) und `CloudGalleryView.tsx` (1.424) analog zerlegen.
- Auth: `src/onyx/auth.ts` (localStorage-Rollen) wird durch serverseitige Sitzung ersetzt; Admin-Prüfung ausschließlich serverseitig, Rollen in separater Tabelle mit RLS.
- Cloud-Zugriff in `cloud-api-router.ts` an die geprüfte Sitzung binden statt an Client-Kennung.
- Gemeinsame Bausteine: `GenerationProgress`, `CostEstimate`, `EmptyState`, `ErrorNotice`.
- Optik: dunkel + Orange bleibt, aber als Token-Set in `src/styles.css` konsolidiert; weniger Ränder, mehr Weißraum, eine Kartenform statt fünf.
- Keine Änderung an der Generierungs-, Upload- und Planungslogik in Etappe 0–2.

## Reihenfolge

0 -> 1 -> 2 sind schnell und haben die größte Wirkung. 3 ist der wichtigste Sicherheitsschritt. 4 und 5 sind eigene größere Blöcke.
