# Warum nichts in der Cloud landet — und wie wir es beheben

## Was ich geprüft habe

- Die Verbindung zum Cloud-Speicher (Bucket „socialgrow“) funktioniert: ein Testaufruf war erfolgreich.
- Die Zugangsdaten sind fest im Code hinterlegt und werden bei Bedarf als Rückfall verwendet.
- Der Speicher-Code für Slides, Ordner und Projektdatei ist vorhanden und richtig verdrahtet.

## Die eigentlichen Ursachen

1. **Der Schalter „automatisch in Cloud sichern“ ist bei dir aus.** In deinem Browser liegt noch ein älterer Einstellungssatz, in dem dieses Feld schlicht fehlt. Beim Laden werden die gespeicherten Einstellungen 1:1 übernommen, ohne fehlende neue Felder mit den Standardwerten aufzufüllen. Ergebnis: die App hält den Auto-Speichern-Schalter für „aus“ und überspringt jeden Upload — deshalb siehst du auch keine Fehlermeldung.

2. **Ohne Anmeldung wird kein Ordner angelegt.** Der Ordner wird nur erzeugt, wenn ein angemeldeter Nutzer da ist. Du bist gerade nicht angemeldet, also passiert gar nichts — nicht einmal ein Gäste-Ordner.

3. **Die Projektdatei zum Karussell wird mit veralteten Daten geschrieben.** Nach dem Rendern greift die Sammel-Speicherung noch auf den Stand *vor* dem Rendern zu, also ohne Bilder. Die Übersichtsdatei im Ordner ist dadurch leer und die gemeldete Bildanzahl ist 0.

## Was ich ändern werde

- Gespeicherte Einstellungen beim Laden mit den Standardwerten zusammenführen, damit neue Felder (u. a. Auto-Speichern, Cloud-Zugang) nie fehlen. Auto-Speichern ist damit wieder standardmäßig an.
- Ordneranlage auch ohne Anmeldung ausführen (Gäste-Ordner), sodass die Struktur in der Cloud immer existiert.
- Die Karussell-Sammelspeicherung auf den aktuellen Slide-Stand umstellen, damit Bilder und Übersichtsdatei zusammenpassen.
- Fehlgeschlagene Uploads sichtbar machen: statt stiller Warnung eine kurze Meldung mit Grund, damit so etwas nicht wieder unbemerkt bleibt.
- In den Einstellungen einen klaren Status zeigen: verbunden ja/nein, Zielordner, Auto-Speichern an/aus.

## Technische Details

- `readLS` bzw. die Nutzung in `src/routes/index.tsx` für `LS.apiSettings`: flaches Zusammenführen mit `DEFAULT_API_SETTINGS` (gilt analog für Brand Kit).
- `ensureUserS4Folder` im Effekt in `src/routes/index.tsx` auch ohne `currentUser` aufrufen (Pfad `USERCONTENT/users/guest`).
- In `generateAllImages` die Slides über eine Ref bzw. den Rückgabewert der State-Aktualisierung sammeln und an `saveCarouselToS4` übergeben.
- In `saveImageToS4` den Fehlertext des Servers an den Aufrufer zurückgeben statt nur `null`, Aufrufstellen zeigen `toast.error`.
