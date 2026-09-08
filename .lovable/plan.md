# Quick-Planen: ein Fenster statt Blind-Automatik

Heute plant "Auto planen" alle offenen Beiträge sofort in feste Zeitfenster — ohne Vorschau, ohne Wahl der Konten und ohne Kontrolle über die Uhrzeit. Das wird durch ein zentrales Quick-Fenster ersetzt.

## So soll es sich anfühlen

Ein Klick auf "Auto planen" öffnet ein Fenster mit allen wartenden Beiträgen. Oben stellt man einmal ein, was für alle gelten soll; unten kann jede Zeile abweichen. Ganz unten steht immer im Klartext, was passiert ("6 Beiträge, Mi 10:00 bis Fr 18:00"), erst danach wird geplant.

## Aufbau des Fensters

Kopfbereich (gilt für alle):
- Konten-Auswahl: Chips mit Profilbild, Name und Plattform; Mehrfachauswahl, "Alle" / "Keine".
- Startzeitpunkt: heute/morgen/eigenes Datum.
- Zeitfenster: die vorhandenen Posting-Zeiten als abwählbare Chips, plus Wochentage; direkt hier erweiterbar, ohne separaten Editor.
- Abstand: mindestens X Stunden zwischen zwei Beiträgen.
- Reihenfolge: wie in der Liste, neueste zuerst, oder zufällig.

Liste (eine Zeile je Beitrag):
- kleines Vorschaubild, Titel, Anzahl Bilder
- Konten der Zeile (übernimmt oben, einzeln änderbar)
- Datum + Uhrzeit direkt editierbar, plus "+1 Std" / "-1 Std"
- Zeile abwählbar (Häkchen) und per Pfeil verschiebbar
- Warnhinweis, wenn Zeit in der Vergangenheit, doppelt belegt oder kein Konto gewählt ist

Fußleiste:
- Zusammenfassung im Klartext + "Neu verteilen" (rechnet Zeiten aus den Kopf-Einstellungen neu)
- Primärknopf "X Beiträge planen"; blockiert, solange eine Zeile eine Warnung hat
- Fortschritt beim Planen je Zeile (geplant / Fehler mit Grund), Fenster bleibt bei Fehlern offen

## Warum diese Lösung

Global einstellen + einzeln überschreiben deckt beide Fälle ab: schnelles Verteilen in Sekunden, und volle Kontrolle wenn ein Beitrag woanders oder später hin soll. Die Vorschau bleibt, weil Veröffentlichen unumkehrbar ist — aber sie kostet keinen Extraklick: Einstellen und Bestätigen passieren im selben Fenster.

## Technische Umsetzung

- Neue Komponente `src/onyx/components/scheduler/QuickPlanModal.tsx`; `PostSchedulerView.handleAutoScheduleAll` öffnet nur noch das Modal und führt beim Bestätigen den vorhandenen Upload-/Scheduling-Code mit den bestätigten Zeiten und Konten aus.
- Zeitberechnung weiter über `computeNextSlots` aus `src/onyx/scheduling.ts`, erweitert um Startzeitpunkt, Mindestabstand und Konfliktprüfung gegen bereits geplante Posts.
- Konten kommen aus den bestehenden `channels`; Plattform-Icons aus `scheduler-utils.ts`.
- Zeiten weiterhin über `toLocalDatetimeValue` / `parseLocalDatetimeValue`, damit keine Zeitzonen-Verschiebung entsteht.
- Kopf-Einstellungen werden wie bisher in `LS.postingSlots` gespeichert, der separate Slot-Editor entfällt.
- Fehler pro Beitrag werden im Modal angezeigt statt nur als Toast.
