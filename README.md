# ONYX Studio (SOCIALCRAFT)

> **High-End Instagram Karussell Generator, Seriengenerator & KI-Persona-Studio.**  
> Entwickelt für Creator, Gründer und Personal Brands — 100 % Local-First, clientseitig im Browser mit LocalStorage ohne Cloud-Zwang.

![ONYX Studio](https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&q=80)

---

## ⚡ Highlights & Kernfunktionen

### 1. 🎠 Carousel Engine (Vom Gedanken zur fertigen Serie)
* **KI-Prompt- & Chat-Input**: Moderner Multi-Line Chat-Input mit <kbd>Strg</kbd> + <kbd>Enter</kbd> Schnellstart, Zielgruppen-Feld und dynamischen Themenvorschlägen.
* **Interaktiver Slide-Slider**: Flüssiger Radix Range-Slider für 2 bis 10 Slides inklusive Empfehlungstipps (*Snack-Content* vs. *Instagram-Standard* vs. *Deep Dive*) und Schnellauswahl-Chips (`4`, `6`, `7`, `10`).
* **Design Library**: Kuration vordefinierter Farb- und Lichtwelten (*Ember Ignite*, *Editorial Statue*, *Swiss Clean Mono*, *Warm Studio & Clay*, *Emerald Malachite*).
* **Slide-Editor & Live-Vorschau**: Jede Slide individuell anpassen (Hook, Überschrift, Subtext, Metapher, Bildprompt).
* **ZIP- & Bildexport**: Einzelne Folien oder komplette Karussells als `.zip` mit einem Klick exportieren.

---

### 2. 🍌 Prompt Hub (Banana Prompts Integration)
* **220+ Kuratierte Community-Prompts**: Direkt synchronisiert mit der Library von [bananaprompts.xyz/explore](https://www.bananaprompts.xyz/explore).
* **Visuelle Galerie**: Hochauflösende Cover-Vorschauen, Modell-Badges (*ChatGPT*, *Gemini*, *Midjourney*, *bananas*), Creator-Credits und Like-Flame-Counter.
* **Filter & Live-Suche**: Schnelles Filtern nach Stilen (*Cinematic*, *Portrait*, *Realistic*, *3D Render*, *Fashion*, *Dark / Moody*, etc.) und Sortierung nach Beliebtheit.
* **Nahtlose Studio-Übernahme**:
  * **Prompt kopieren**: Ein-Klick-Kopieren mit visuellem Feedback.
  * **In Karussell übernehmen**: Überträgt Prompt und Titel sofort als Karussell-Thema.
  * **In Einzelbild generieren**: Wechselt direkt in den Einzelbild-Generator.
  * **Live-Sync**: Aktualisiert neue Prompts auf Knopfdruck live von der API.

---

### 3. 👤 KI Clone & Persona Studio
* **Multi-Profil-Management**: Mehrere konsistente Personen oder Avatare anlegen und per Klick umschalten (*Founder Dark Ember*, *Editorial Minimalist*, *Cyberpunk Visionary*).
* **Strukturierter Persona-Builder**:
  * **Basisdaten**: Geschlecht, Alter, Herkunftstyp.
  * **Gesicht & Haare**: Frisur, Bart, Gesichtskonturen, Mimik.
  * **Signatur-Garderobe**: Kleidung, Material (z. B. schwarzer Rollkragen, Oversize-Blazer).
  * **Licht & Look**: Rembrandt-Licht, Rimlight-Farben, Studio-Atmosphäre.
  * **Kamera**: Brennweite (z. B. 85mm), Porträtwinkel, Bokeh.
  * **Negativer Prompt**: Gezielter Ausschluss unerwünschter Artefakte.
* **Referenzbilder-Upload**: Lokale Bildergalerie für Porträtfotos und Avatare.
* **Slide-Platzierungsregeln**:
  * *Hook & Closing (Empfohlen)*: Clone erscheint auf Slide 1 & Abschlussfolie (CTA).
  * *Auf allen Slides*: Vollständige Leitmotiv-Präsenz.
  * *Jede zweite Slide*: Rhythmischer Wechsel.
* **Test-Render Sandbox**: Generiert sofort ein Testvisual mit der aktiven Persona zur visuellen Qualitätskontrolle.

---

### 4. 📑 Serie & Smart Prompt Parser
* **Prompt-Dump Erkennung**: Erkennt formatierte Prompts aus ChatGPT oder Claude automatisch (z. B. `**Slide 1 – Hook/Cover**`, Markdown-Codefences ```` ``` ````, Zitate).
* **Automatische Aufteilung**: Trennt komplexe Textblöcke intelligent in Rollen, Headlines, Subtexte und Bildprompts auf.
* **Batch-Queue**: Serienproduktion mehrerer Karussells in einer zentralen Warteschlange.

---

## 🛠 Technologie-Stack

| Bereich | Technologien |
|---|---|
| **Frontend Core** | [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/) |
| **Routing** | [@tanstack/react-router](https://tanstack.com/router) |
| **Design & UI** | [Tailwind CSS v4](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/), [Lucide Icons](https://lucide.dev/) |
| **Typografie** | *Plus Jakarta Sans* (Fließtext/Headlines), *JetBrains Mono* (Code/Werte) |
| **Persistence** | 100 % clientseitig via `localStorage` (kein Cloud-Zwang) |
| **Export & Utils** | [JSZip](https://stuk.github.io/jszip/), [canvas-confetti](https://www.npmjs.com/package/canvas-confetti), [Sonner](https://sonner.emilkowal.ski/) |

---

## 🚀 Lokale Installation & Entwicklung

### Voraussetzungen
* [Node.js](https://nodejs.org/) (Version 18+ oder 20+ empfohlen)
* `npm` oder `pnpm`

### Repository klonen & starten

```bash
# 1. Repository klonen
git clone https://github.com/UCLLEGACYDEV/socialcraft.git
cd socialcraft

# 2. Abhängigkeiten installieren
npm install

# 3. Lokalen Entwicklungsserver starten
npm run dev
```

Die Anwendung öffnet standardmäßig auf **`http://localhost:8080/`**.

### TypeScript Typ-Check

```bash
npx tsc --noEmit
```

### Production Build

```bash
npm run build
```

---

## 🔄 Lovable & GitHub Sync

Dieses Projekt ist mit [Lovable](https://lovable.dev) verbunden:
* Alle Commits auf `main` synchronisieren sich nahtlos mit dem Lovable Editor.
* Es werden keine Commit-Geschichten überschrieben (`no force-push / no rebase`), um Projektverläufe stabil zu halten.

---

## 📄 Lizenz

MIT License © 2026 ONYX Studio / SOCIALCRAFT.
