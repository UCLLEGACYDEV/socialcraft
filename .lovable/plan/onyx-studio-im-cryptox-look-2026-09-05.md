# ONYX Studio im Cryptox-Look

Das ganze Studio wechselt von Violett auf die schwarz/orange-rote Optik aus dem Referenzbild — inklusive der Layout-Merkmale, die diesen Look ausmachen.

## Farben und Stimmung

- Hintergrund: sehr dunkles, leicht warmes Schwarz statt des heutigen kühlen Blau-Schwarz
- Akzent: kräftiges Orange-Rot mit einem helleren Glut-Ton für Verläufe und Leuchtkanten
- Buttons: gefüllte Orange-Pille mit rundem Pfeil-Kreis rechts, so wie "Get Started" im Bild
- Karten: dunkles Glas mit sehr feinem hellem Rand und weichem, warmem Schein nach außen
- Text: warmes Weiß, Nebentext gedämpftes Grau-Beige; Kleinschrift weiter in Monospace

## Layout-Anpassungen

- **Glut-Hintergrund**: konzentrische, weich leuchtende Ringe hinter dem oberen Seitenbereich plus warmer Schein an den Rändern — reines CSS, kein Bild
- **Kopfzeile**: die Ansichts-Umschaltung wandert zusätzlich in eine zentrierte Pill-Navigation oben, aktiver Eintrag als gefüllte Pille (Sidebar bleibt für Kontext und Einstellungen erhalten)
- **Startzustand Karussell**: das Brief-Formular bekommt einen zentrierten Hero — große zweizeilige Überschrift, ein Satz darunter, orange Aktions-Pille — mit schwebenden kleinen Info-Kacheln links und rechts (Credits, Modell, Auflösung, Motive) wie die "Bitora / Conza"-Chips im Bild
- **Slide-Raster**: Karten mit stärkerem Kontrast, warmem Rand-Leuchten beim Überfahren und orangefarbenen Status-Punkten
- **Serie, Einzelbild, Prompt Hub, Galerie**: gleiche Karten- und Buttonsprache, keine strukturellen Änderungen
- **Modals**: dunkler Glas-Look mit orangefarbenen Aktionsknöpfen

## Technisches

- Alle Werte als Tokens in `src/styles.css` (`--background`, `--primary`, `--primary-bright`, Glut-Verläufe, Schatten); keine harten Farbklassen in Komponenten
- Neue Utilities für den Glut-Hintergrund und die Pill-Navigation
- Betroffene Dateien: `src/styles.css`, `Sidebar`, `ContextBar`, `CarouselBriefForm`, `CarouselViewer`, `SlideCard`, `SeriesQueue`, `SettingsModal`, `BrandKitModal`, `SlideEditModal`, `SimpleViews`, `src/routes/index.tsx`
- Funktion, Zustände und Speicherung bleiben unverändert
- Nebenbei: der ZIP-Export lädt seine Speicher-Hilfe aktuell falsch und bricht die Seite kurz ab — wird beim Umbau mitkorrigiert
