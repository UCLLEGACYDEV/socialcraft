# SocialCraft MCP – Verbindung einrichten

Der SocialCraft MCP-Server gibt Claude direkten Zugriff auf den Content-Planer:
Markenprofile lesen, freie Posting-Slots berechnen, einzelne Posts, Karussells
und mehrtägige Serien vollautomatisch in die Warteschlange vorplanen.

Die App zeigt denselben Assistenten unter **„Claude MCP Verbindung"** (MCP-Modal)
inkl. Live-Status und Copy-Buttons.

---

## Weg A · Claude Code im geklonten Repo (empfohlen)

Das Repo enthält eine eingecheckte [`.mcp.json`](.mcp.json). Damit ist für jeden
neuen Nutzer nichts weiter zu tun:

```bash
git clone https://github.com/UCLLEGACYDEV/socialcraft
cd socialcraft
npm install
npm run mcp:build
claude
```

Beim ersten Start fragt Claude Code einmalig, ob die Projekt-MCP-Server freigegeben
werden sollen → **Ja**. Danach ist der Server `socialcraft` verbunden.

Manuell / zum Prüfen:

```bash
claude mcp add socialcraft -- node dist/mcp/index.js         # falls .mcp.json fehlt
claude mcp list                                             # Status prüfen
node dist/mcp/index.js --test                               # Server-Selbsttest (blitzschnell)
```

---

## Weg B · Remote-Server (kein Repo nötig)

Für Nutzer ohne lokales Repo stellt der Betreiber den Server per Tunnel bereit:

```bash
npm run mcp:tunnel
```

Das startet den HTTP/SSE-Server (Port 3005) und einen Cloudflare-Tunnel. Die
öffentliche URL wird nach `src/server/data/mcp-remote-url.json` geschrieben und
von der App unter `GET /api/mcp/remote-url` ausgeliefert – das MCP-Modal zeigt
dann automatisch den fertigen Befehl.

Andere verbinden sich damit so:

```bash
claude mcp add --transport sse socialcraft https://<subdomain>.trycloudflare.com/sse
```

Claude Desktop (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "socialcraft": { "type": "sse", "url": "https://<subdomain>.trycloudflare.com/sse" }
  }
}
```

> Der Quick-Tunnel vergibt bei jedem Neustart eine neue URL. Für eine dauerhafte
> Adresse einen benannten Cloudflare-Tunnel bzw. eine feste Domain hinterlegen.

---

## Weg C · Claude Desktop lokal

`%APPDATA%\Claude\claude_desktop_config.json` (Windows) bzw.
`~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "socialcraft": {
      "command": "node",
      "args": ["ABSOLUTER/PFAD/ZU/socialcraft/dist/mcp/index.js"],
      "cwd": "ABSOLUTER/PFAD/ZU/socialcraft"
    }
  }
}
```

Vorlage: [`claude_desktop_config.example.json`](claude_desktop_config.example.json).

---

## Verfügbare MCP-Tools

| Tool | Zweck |
| --- | --- |
| `get_brand_profiles` | Markenidentitäten, Farben, Stile |
| `get_social_channels` | Verbundene Kanäle (optional nach Profil) |
| `get_posting_slots` | Nächste freie, kollisionsfreie Zeitslots |
| `get_scheduled_posts` | Geplante Beiträge (Filter nach Status/Plattform/Datum) |
| `create_scheduled_post` | Einzelnen Post einplanen (Auto-Slot wenn kein Datum) |
| `batch_preplan_posts` | Post-Serie über die nächsten Slots verteilen |
| `create_carousel_draft` | Karussell-Entwurf mit Folien & Visual-Prompts |
| `plan_and_schedule_carousels` | Mehrere Tage Karussell-Content vorplanen |
| `create_content_series` | Zusammenhängende Serie (Teil 1..N) inkl. Serien-Queue |
| `get_series_queue` | Jobs der Serien-Warteschlange |
| `update_scheduled_post` / `delete_scheduled_post` | Posts ändern / entfernen |
| `get_prompt_frameworks` | Hook-, Karussell- und Bild-Prompt-Vorlagen |

Alle Captions werden serverseitig von Gedankenstrichen bereinigt.

---

## Datenfluss

```
Claude  ──stdio/SSE──►  MCP-Server  ──►  src/server/data/socialcraft-store.json
                                            ▲
Browser-Planer  ──POST /api/mcp/sync──────────┘   (bidirektionaler Sync)
```

Der Browser-Planer und der MCP-Store synchronisieren sich gegenseitig über
`/api/mcp/sync`; von Claude eingeplante Posts erscheinen also live im Kalender
und umgekehrt.
