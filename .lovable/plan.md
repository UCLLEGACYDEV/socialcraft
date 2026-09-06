# Private Ordner pro Nutzer + Projektordner mit Titel

## Wo die Inhalte aktuell landen

Jedes Bild wird in deinem Cloud-Speicher abgelegt unter:

```text
USERCONTENT/users/<deine-id>/...        (normale Nutzer)
USERCONTENT/admins/<deine-id>/...       (Admins)
    carousels/<Datum>_<Thema>/slide_01.jpg ... + projekt-datei
    series/<Datum>_<Thema>_<kurz-id>/slide_01.jpg ...
    clones/<Klonname>/styles/...
    gallery/...  (Einzelbilder, Uploads)
```

Karussell- und Serien-Bilder bekommen also bereits einen eigenen Projektordner mit
Datum und Thema. In der Galerie werden aktuell 0 Bilder angezeigt — ob dort nichts
gespeichert wurde oder nur die Anzeige/Auflistung nicht passt, ist noch nicht
bestätigt und wird als erster Schritt geprüft.

## Was geändert wird

### 1. Prüfen, warum die Galerie leer ist
Ein Testlauf: Karussell erzeugen, danach den Ordnerinhalt direkt im Speicher
auflisten. Ergebnis entscheidet, ob das Speichern oder nur die Anzeige klemmt —
der gefundene Fehler wird dann behoben.

### 2. Fremde Inhalte unsichtbar machen (Kern der Anfrage)
Heute bestimmt die Oberfläche selbst, welcher Ordner aufgelistet wird, und die
Server-Schnittstellen (Auflisten, Löschen, Hochladen, Ordner anlegen) nehmen jeden
beliebigen Pfad entgegen. Damit könnte man an fremde Inhalte kommen.

- Der Server ermittelt den erlaubten Ordner selbst aus dem angemeldeten Nutzer und
  weist alles außerhalb dieses Ordners ab — beim Auflisten, Hochladen, Löschen,
  Herunterladen und Ordner-Anlegen.
- Für normale Nutzer verschwinden die Umschalter „Alle Benutzer“ und „Gesamte
  Mediathek“ vollständig (nicht nur ausgeblendet, sondern serverseitig gesperrt).
- Admins behalten den Blick auf alle Ordner, aber nur, wenn die Admin-Rolle
  serverseitig bestätigt wird.
- Gäste (nicht angemeldet) bekommen einen eigenen, getrennten Ordner und sehen
  keine fremden Inhalte.

### 3. Projektordner mit sprechendem Titel
- Ordnername wird aus dem Thema gebildet, gekürzt auf einen kurzen, lesbaren Titel;
  Umlaute werden sauber übertragen (ä→ae usw.) statt entfernt.
- Ist kein Thema vorhanden, wird ein Kurztitel aus der ersten Überschrift gebildet.
- Alle Slides eines Themas — Karussell wie Serie — landen garantiert im selben
  Ordner, zusammen mit einer Projektdatei (Titel, Slidetexte, Datum).
- In der Galerie wird der Projektordner mit dem Titel angezeigt und kann als ZIP
  geladen werden.

## Technische Punkte
- Betroffen: `src/server/cloud-api-router.ts` (Pfad-Prüfung gegen Nutzer-Identität),
  `src/onyx/s4-storage.ts` (Ordner-/Titelbildung, Listen-Aufrufe),
  `src/routes/index.tsx` (einheitlicher Projektordner für Karussell + Serie),
  `src/onyx/components/CloudGalleryView.tsx` (Admin-Umschalter nur für Admins).
- Nutzeridentität wird nicht mehr aus dem Anfrage-Body übernommen, sondern
  serverseitig aus der Sitzung geprüft.
- Verifikation: einmal als normaler Nutzer und einmal als Admin ein Karussell
  erzeugen, Ordnerstruktur auflisten und einen Zugriff auf einen fremden Pfad
  testen (muss abgewiesen werden).
