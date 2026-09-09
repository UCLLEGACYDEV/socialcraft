import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getBrandProfiles, getSocialChannels, getScheduledPosts } from "./store";

export function registerPromptsAndResources(server: McpServer) {
  // 1. Resource: Brand Profiles
  server.resource(
    "socialcraft-brand-profiles",
    "socialcraft://brand-profiles",
    async (uri) => {
      const profiles = getBrandProfiles();
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(profiles, null, 2),
            mimeType: "application/json",
          },
        ],
      };
    }
  );

  // 2. Resource: Channels
  server.resource(
    "socialcraft-channels",
    "socialcraft://channels",
    async (uri) => {
      const channels = getSocialChannels();
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(channels, null, 2),
            mimeType: "application/json",
          },
        ],
      };
    }
  );

  // 3. Resource: Schedule
  server.resource(
    "socialcraft-schedule",
    "socialcraft://schedule",
    async (uri) => {
      const posts = getScheduledPosts();
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(posts, null, 2),
            mimeType: "application/json",
          },
        ],
      };
    }
  );

  // 4. Prompt: plan_content_campaign
  server.prompt(
    "plan_content_campaign",
    "Führt eine strukturierte Content-Planung durch und plant Posts direkt in SocialCraft vor.",
    async () => {
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Du bist der SocialCraft Content-Stratege und Social Media Director.
Deine Aufgabe ist es:
1. Rufe zuerst die verfügbaren Brand-Profile mit 'get_brand_profiles' und die angebundenen Kanäle mit 'get_social_channels' ab.
2. Ermittle mit 'get_posting_slots' die nächsten optimalen Veröffentlichungstermine.
3. Entwickle eine Serie von wirkungsvollen Social-Media-Posts mit:
   - Einem unwiderstehlichen Hook in der ersten Zeile
   - Mehrwert / Storytelling mit sauberen Absätzen
   - WICHTIG: Verwende KEINE Gedankenstriche (– oder —) im Text! Nutze stattdessen Doppelpunkte, Emojis oder einfache Zeilenumbrüche.
   - Einem glasklaren Call-to-Action (CTA)
   - 3 bis 5 thematisch passenden SEO-Hashtags
   - Einem präzisen Visual-Prompt für KI-Bilder (Kie.ai / Nano Banana Pro / Midjourney)
4. Übertrage die erstellten Posts anschließend mit dem Tool 'batch_preplan_posts' oder 'create_scheduled_post' direkt in das SocialCraft-System, damit sie sofort im Kalender sichtbar sind.

Frage den Nutzer kurz nach dem Thema, der Zielgruppe und dem Zeitraum (z. B. 7, 14 oder 30 Tage) oder starte direkt mit einem Vorschlag.`,
            },
          },
        ],
      };
    }
  );

  // 5. Prompt: craft_carousel_prompts
  server.prompt(
    "craft_carousel_prompts",
    "Erstellt ein wirkungsvolles Multi-Slide Bogen-Karussell inklusive Visual-Prompts und plant es ein.",
    async () => {
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Du bist der SocialCraft Karussell-Designer.
Erstelle ein 5- bis 8-teiliges Swipe-Karussell nach dem SocialCraft Bogen-Framework:
- Slide 1: HOOK (Kontraintuitiv, visuell stark)
- Slide 2: PAIN POINT (Das eigentliche Problem)
- Slide 3: CONCEPT (Die Lösung / das mentale Modell)
- Slide 4: EXPANSION / DEEP DIVE (Schritt-für-Schritt)
- Slide 5: PROOF / RESULTAT (Das Ergebnis)
- Slide 6: CLOSING / CTA (Speichern & Folgen)

Für jede Folie:
- Klare, kurze Headline (max. 6-8 Wörter)
- Subtext (1-2 kurze Sätze)
- Detaillierter Bild-Prompt für den visuellen Hintergrund

Nutze anschließend das Tool 'create_carousel_draft', um das Karussell in SocialCraft abzuspeichern.`,
            },
          },
        ],
      };
    }
  );

  // 6. Prompt: plan_days_carousels (Mehr-Tage-Karussell-Planung & Vorplanung)
  server.prompt(
    "plan_days_carousels",
    "Erstellt für X Tage (z. B. 3 Tage) vollständige Karussells zu gewünschten Themen und plant sie vollautomatisch für die genannten Plattformen in SocialCraft vor.",
    async () => {
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Du bist der SocialCraft Content Director für Multi-Day Karussell-Kampagnen.
Wenn der Nutzer dir z. B. sagt: "Erstelle mir für 3 Tage Content: Themen A, B, C für Instagram und LinkedIn und plane sie vor":

Gehe so vor:
1. Analysiere die angegebenen Themen und Plattformen.
2. Erstelle für JEDEN TAG ein vollständiges, hochwirksames Karussell nach dem SocialCraft Bogen-Framework:
   - Slide 1: Hook (Visuell stark, kontraintuitiv)
   - Slide 2: Pain Point (Versteckter Fehler / Problem)
   - Slide 3: Concept (Neues mentales Modell / Lösung)
   - Slide 4: Deep Dive (Schritt-für-Schritt Anleitung)
   - Slide 5: Proof / Resultat (Ergebnis)
   - Slide 6: Closing / CTA (Speichern & Folgen)
3. Formuliere für jede Folie:
   - Headline (groß & packend)
   - Subtext
   - Visual Prompt für KI-Bildgenerierung (z. B. 'cinematic photorealism, moody lighting, clean composition for typography')
4. Schreibe für jeden Tag eine packende Caption:
   - Starker Hook in Zeile 1
   - Absätze für Lesbarkeit
   - WICHTIG: KEINE Gedankenstriche (–, —) verwenden! Nur Doppelpunkte oder Aufzählungen mit Punkten.
   - 3-5 passende SEO-Hashtags
5. Rufe DIREKT das MCP-Tool 'plan_and_schedule_carousels' auf!
   Übergib alle Tage, Folien, Visual Prompts, Captions und Zielplattformen. Dadurch werden die Karussells automatisch in SocialCraft abgespeichert und für die nächsten freien Posting-Slots vorab eingeplant!
6. Zeige dem Nutzer eine übersichtliche Zusammenfassung der geplanten Tage, Termine und Folieninhalte.`,
            },
          },
        ],
      };
    }
  );
}
