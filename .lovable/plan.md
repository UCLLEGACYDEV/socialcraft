# Ehrliche Analyse von ONYX Studio + Optimierungsplan

Basis: Durchsicht der gesamten Oberfläche und Abläufe (ca. 29.000 Zeilen, 40+ Ansichten/Fenster).

## Was wirklich gut ist

- **Funktionsumfang**: Karussell, Serie, Direkt-Prompt, KI-Klon, Prompt-Hub, Galerie, Planer, Admin — das ist mehr, als die meisten Tools in dem Bereich bieten.
- **Private Cloud-Ablage**: Trennung pro Nutzer inkl. serverseitiger Prüfung ist sauber gelöst und ein echtes Verkaufsargument.
- **Alles überlebt einen Neuladen**: Warteschlange, Entwürfe, Einstellungen bleiben erhalten.
- **Optik**: Der dunkle Glut-Look ist eigenständig und wirkt hochwertig — kein Standard-KI-Aussehen.
- **Deutsche Sprache durchgehend**, gute Fehlermeldungen an vielen Stellen.

## Was ehrlich schlecht ist

1. **Alles hängt an einer einzigen Seite.** Es gibt praktisch nur "/". Folge: kein Zurück-Button, keine teilbaren Links ("schick mir das Karussell"), kein Lesezeichen auf den Planer, kein Wiederfinden nach Absturz. Für Endkunden ist das der größte Frust-Punkt.
2. **Riesige Einzeldateien.** Der Planer allein hat 5.229 Zeilen, Direkt-Prompt 2.000, Galerie 1.470. Das ist der Grund für die Fehlerserie der letzten Tage ("X is not defined" nach jeder Änderung). Jede neue Funktion erhöht das Risiko, dass die Seite weiß wird.
3. **Weißer Bildschirm statt Fehlermeldung.** Ein einziger Fehler in einer Ansicht killt die ganze App. Es gibt keine Auffang-Ebene, die sagt: "Dieser Bereich ist gerade kaputt, der Rest läuft weiter."
4. **API-Schlüssel liegen im Browser-Speicher.** Jedes fremde Skript und jede Browser-Erweiterung kann sie auslesen — und der Nutzer bezahlt die fremden Bildgenerierungen. Für ein Produkt mit echten Kunden ist das ein K.-o.-Kriterium.
5. **Kein Onboarding.** Neue Nutzer landen vor einem Formular mit Thema, Zielgruppe, Design, Slide-Anzahl, CTA, Handle, Text-Engine, Klon-Schalter — ohne Beispiel, ohne Vorlage, ohne "so sieht das Ergebnis aus".
6. **Mobil praktisch unbrauchbar.** Der Planer und die Galerie haben kaum mobile Anpassungen, Tabellen laufen aus dem Bild. Instagram-Nutzer sind aber am Handy.
7. **Wartezeiten ohne Erklärung.** Bei der Bildgenerierung sieht man einen Balken, aber nicht: wie lange noch, was kostet das, was passiert bei Abbruch.
8. **Zu viele Begriffe aus der Technik-Welt** in der Oberfläche (Provider, Engine, Resolution, Webhook, Manifest, S4). Der Endkunde will "Qualität: gut / besser / beste".
9. **Bedienhilfen fehlen** (Tastatur, Vorlesefunktion, Fokus-Rahmen) — 26 Beschriftungen im gesamten Projekt ist zu wenig.
10. **Kein einziger automatischer Test.** Jede Änderung wird manuell im Vorschaufenster geprüft, deswegen rutschen Fehler bis zum Nutzer durch.

## Flow-für-Flow

- **Karussell**: Formular ist zu lang für den ersten Kontakt. Es fehlen Vorlagen ("Zitat", "Tipp-Liste", "Vorher/Nachher") und eine Vorschau vor der teuren Bildgenerierung. Text erst prüfen, dann Bilder — das spart Geld.
- **Serie**: stark, aber die Warteschlange erklärt Fehler schlecht ("error" ohne Grund) und es gibt kein "Fehlgeschlagene erneut versuchen".
- **Direkt-Prompt**: mit 2.000 Zeilen die unübersichtlichste Ansicht; zu viele Optionen gleichzeitig sichtbar.
- **KI-Klon**: bester Teil vom Konzept, aber die Analyse zeigt nicht, was sie erkannt hat, bevor man speichert.
- **Galerie**: seit dem Umbau gut (Raster + Fenster). Es fehlen Suche, Filter nach Datum/Projekt und Mehrfachauswahl über Projekte hinweg.
- **Planer**: mächtig, aber überladen. Kein Kalender-Gesamtblick, der auf einen Blick zeigt, was diese Woche rausgeht.
- **Einstellungen**: mischt Nutzer-Einstellungen (Handle, CTA) mit Technik (Endpunkte, Schlüssel). Sollte getrennt sein.

## Vorschlag: Reihenfolge der Optimierung

**Stufe 1 — Stabilität (zuerst, ohne das bringt Neues nichts)**
- Auffang-Ebene pro Bereich: ein Fehler zeigt eine Karte "Bereich neu laden", nie mehr weißer Bildschirm.
- Planer, Direkt-Prompt und Galerie in kleinere Teile zerlegen.
- Erste automatische Tests für die Kernabläufe (Karussell erzeugen, in Cloud speichern, ZIP-Download).

**Stufe 2 — Echte Seiten statt Tabs**
- Eigene Adressen: /studio, /serie, /planer, /galerie, /klon, /prompts. Zurück-Button und teilbare Links funktionieren dann.

**Stufe 3 — Erstkontakt & Verständlichkeit**
- Startbildschirm mit 4–6 Vorlagen zum Antippen statt leerem Formular.
- Formular in zwei Schritte teilen: Thema → Textvorschau → Bilder erzeugen.
- Technikbegriffe durch Klartext ersetzen, Details hinter "Erweitert".
- Klare Kostenanzeige vor jedem Generieren.

**Stufe 4 — Sicherheit**
- API-Schlüssel serverseitig ablegen statt im Browser; der Browser ruft nur noch die eigene Schnittstelle auf.

**Stufe 5 — Mobil & Bedienhilfen**
- Planer und Galerie für Handy neu layouten, Beschriftungen und Tastaturbedienung ergänzen.

## Technische Notizen

- Aufteilung nach TanStack-Routen unter `src/routes/`; jeder Bereich eigene Datei plus `head()` mit eigenem Titel.
- Fehler-Auffang: eine `<ViewBoundary>`-Komponente um jeden Bereich.
- Schlüssel: `createServerFn` als Zwischenschicht für Kie/OpenAI/Anthropic; Schlüssel als Secrets, nicht in `bogen_api_settings`.
- Zerlegung: `PostSchedulerView.tsx` (5.229 Z.) in Kalender, Kanäle, Beitrags-Editor, Analyse; `DirectPromptView.tsx` (1.998 Z.) in Prompt-Eingabe, Ergebnisraster, Einstellungen.
- Tests mit Vitest für `parse-prompt-block`, `csv-prompt-parser`, `scheduling`, `s4-storage`-Pfadlogik.
