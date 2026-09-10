# SOCIALCRAFT AI (ONYX Studio)

> **High-Performance Instagram Karussell Generator, Multi-Platform Publisher & KI-Persona Studio.**  
> Entwickelt für Creator, Gründer und Personal Brands — **Local-First Architektur**, bidirektionaler **Model Context Protocol (MCP)** Sync, **Mega S4 Cloud-Speicher** und Zero-Tracking Security.

![Socialcraft AI Instagram Carousel Studio](./public/images/socialcraft-readme-hero.jpg)

---

## ⚡ Highlights & Kernfunktionen

### 1. 🎠 Carousel Studio Engine (Idee zu fertig gestalteten Slides)
* **KI-Prompt- & Chat-Input**: Moderner Multi-Line Chat-Input mit <kbd>Strg</kbd> + <kbd>Enter</kbd> Schnellstart, Zielgruppen-Fokussierung und dynamischen Themenvorschlägen.
* **Interaktiver Slide-Slider**: Flüssiger Radix Range-Slider für 2 bis 10 Slides inklusive Empfehlungstipps (*Snack-Content* vs. *Instagram-Standard* vs. *Deep Dive*) und Schnellauswahl-Chips (`4`, `6`, `7`, `10`).
* **Design Library**: Kuration abgestimmter Farb-, Typografie- und Lichtwelten (*Ember Ignite*, *Editorial Statue*, *Swiss Clean Mono*, *Warm Studio & Clay*, *Emerald Malachite*).
* **Slide-Editor & Live-Vorschau**: Jede Slide individuell anpassen (Hook, Überschrift, Subtext, Metapher, Bildprompt, Reroll).
* **ZIP- & Bildexport**: Einzelne Folien oder komplette Karussells als `.zip` mit einem Klick exportieren — optional mit automatischem Brand-Overlay.

---

### 2. 📅 Multi-Platform Post Scheduler & Kalender
* **Direktes Social-Media-Publishing**: Nahtlose Integration mit der **Post For Me API** zum Planen und automatischen Veröffentlichen auf:
  * **TikTok** (voll zertifizierter Content Posting API Flow inkl. Creator-Info-Query, Privacy-Level & Audio-Library)
  * **Instagram** (Feed-Posts, Karussells)
  * **Facebook** (Seiten & Profile)
  * **LinkedIn** (Beiträge mit Media-Upload)
  * **X / Twitter**, **Threads**, **Pinterest** und **Bluesky**
* **Interaktive Monats- & Wochen-Kalenderansicht**: Drag-and-Drop Planung, flexible Zeitzonen-Steuerung und Status-Badges (*Geplant*, *Veröffentlicht*, *Fehlgeschlagen*).
* **30-Tage Batch-Planer**: Erzeugt mit einem Klick 30 Tage vorstrukturierte Beitrags-Kampagnen.

---

### 3. 👤 KI Clone & Persona Studio
* **Multi-Profil-Management**: Beliebig viele konsistente Identitäten oder Avatare anlegen (*Founder Dark Ember*, *Editorial Minimalist*, *Cyberpunk Visionary*).
* **Strukturierter Persona-Builder**:
  * **Basisdaten**: Geschlecht, Alter, Herkunftstyp.
  * **Gesicht & Haare**: Frisur, Bart, Gesichtskonturen, Mimik.
  * **Signatur-Garderobe**: Kleidung, Material (z. B. schwarzer Rollkragen, Oversize-Blazer).
  * **Licht & Look**: Rembrandt-Licht, Rimlight-Farben, Studio-Atmosphäre.
  * **Kamera**: Brennweite (z. B. 85mm), Porträtwinkel, Bokeh.
  * **Negativer Prompt**: Gezielter Ausschluss unerwünschter Artefakte.
* **Referenzbilder-Upload**: Upload eigener Porträtfotos als visueller Anker.
* **Slide-Platzierungsregeln**:
  * *Hook & Closing (Empfohlen)*: Clone erscheint auf Slide 1 & Abschlussfolie (CTA).
  * *Auf allen Slides*: Vollständige Leitmotiv-Präsenz.
  * *Jede zweite Slide*: Rhythmischer Wechsel.

---

### 4. 🍌 Prompt Hub (Banana Prompts Integration)
* **220+ Kuratierte Community-Prompts**: Direkt synchronisiert mit der Library von [bananaprompts.xyz/explore](https://www.bananaprompts.xyz/explore).
* **Visuelle Galerie**: Hochauflösende Cover-Vorschauen, Modell-Badges (*ChatGPT*, *Gemini*, *Midjourney*, *Nano-Banana*), Creator-Credits und Beliebtheits-Ranking.
* **1-Klick-Übernahme**: Prompt direkt in das Karussell-Studio oder den Einzelbild-Generator übertragen.

---

### 5. ☁️ Mega S4 Cloud Storage & Cloud-Galerie
* **S3-kompatibler Objektspeicher**: Automatische Hintergrund-Sicherung aller generierten Visuals und Karussell-Projekte in privaten Cloud-Ordnern (`carousels/`, `series/`).
* **Cloud-Galerie**: Durchsuchen, Herunterladen, Umplanen oder erneutes Bearbeiten historischer Projekte direkt aus dem Cloud-Archiv.

---

### 6. 🤖 Claude Desktop & MCP Live-Bridge
* **Model Context Protocol (MCP)**: Vollständige Integration mit Cursor und Claude Desktop über standardisierte Tools (`socialcraft_schedule_post`, `socialcraft_list_posts`, `socialcraft_add_series_job`, `socialcraft_list_channels`).
* **Bidirektionaler Live-Sync**: Lokale UI und MCP-Store synchronisieren sich automatisch über SSE (`/api/mcp/sse`) und HTTP-Polling (`/api/mcp/sync`).

---

## 🛠 Technologie-Stack & Architektur

| Bereich | Technologien |
|---|---|
| **Framework & Router** | [TanStack Start](https://tanstack.com/start), [@tanstack/react-router](https://tanstack.com/router) |
| **Frontend Core** | [React 19](https://react.dev/), [TypeScript 5.8](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/) |
| **Styling & Design** | [Tailwind CSS v4](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/), [Lucide Icons](https://lucide.dev/) |
| **Typografie** | *Plus Jakarta Sans* (Fließtext/Headlines), *JetBrains Mono* (Code/Werte) |
| **State & Persistence** | Local-First via `localStorage` mit S4 Object Storage & MCP-Store Cloud-Sync |
| **Server & Proxy** | Nitro Server / Vite Dev-Middleware für CORS-sichere Server-Proxies |
| **Testing & Quality** | [Vitest](https://vitest.dev/), [ESLint 9](https://eslint.org/), [Prettier](https://prettier.io/) |

> Weitere Details zur Codebase-Architektur und Schichtenaufteilung findest du in [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## 🚀 Installation & Lokale Entwicklung

### 1. Voraussetzungen
* [Node.js](https://nodejs.org/) (Version 20+ empfohlen)
* `npm` oder `pnpm`

### 2. Repository klonen & Abhängigkeiten installieren

```bash
# Repository klonen
git clone https://github.com/UCLLEGACYDEV/socialcraft.git
cd socialcraft

# Abhängigkeiten installieren
npm install
```

### 3. Umgebungsvariablen konfigurieren

Kopiere die Vorlage `.env.example` in eine neue `.env`-Datei und trage deine API-Keys ein:

```bash
cp .env.example .env
```

Beispielkonfiguration in `.env`:
```env
# AI Engine (KIE.AI / Nano-Banana 2)
VITE_KIE_API_KEY=dein_kie_api_key

# Social Publishing (Post For Me API)
VITE_POSTFORME_API_KEY=dein_postforme_api_key

# Mega S4 Object Storage
VITE_S4_ACCESS_KEY=dein_s4_access_key
VITE_S4_SECRET_KEY=dein_s4_secret_key
VITE_S4_ENDPOINT=socialgrow.s3.g.megas4.com
VITE_S4_BUCKET=socialgrow
VITE_S4_REGION=eu-central-1
```

### 4. Entwicklungsserver starten

```bash
npm run dev
```

Die Anwendung startet standardmäßig unter **`http://localhost:8080/`**.

---

## 🧪 Qualitätssicherung & Verifikation

Vor jedem Commit und Deployment werden alle Qualitäts-Gates geprüft:

```bash
# 1. Automatisierte Tests ausführen (Vitest)
npm test

# 2. Strikte TypeScript-Typüberprüfung
npx tsc --noEmit

# 3. Linter prüfen (0 Fehler / 0 Warnungen)
npx eslint . --quiet

# 4. Production Build validieren
npm run build
```

---

## 🔄 Lovable & GitHub Sync

Dieses Repository ist an [Lovable](https://lovable.dev) angebunden:
* Commits auf dem Branch `main` synchronisieren sich automatisch mit dem Lovable Web-Editor.
* **Wichtig**: Die Git-Historie wird niemals umgeschrieben (`no force-push / no rebase`), um die Historie auf Lovable-Seite intakt zu halten.

---

## 📄 Lizenz

MIT License © 2026 SOCIALCRAFT AI / ONYX Studio. Alle Rechte vorbehalten.
