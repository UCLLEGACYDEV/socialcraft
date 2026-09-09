import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  getStore,
  getBrandProfiles,
  getSocialChannels,
  getScheduledPosts,
  getPostingSlotConfig,
  addScheduledPost,
  batchAddScheduledPosts,
  addCarouselDraft,
  batchAddSeriesJobs,
  getSeriesQueue,
  updateScheduledPost,
  deleteScheduledPost,
  resolveChannelForPlatform,
} from "./store";
import type { PostingSlotConfig } from "../onyx/scheduling";
import type { ScheduledPost, SocialPlatform, ScheduledPostStatus, SlideRole, SeriesJob } from "../onyx/types";

/**
 * Filter to strictly remove any Gedankenstriche (–, —, -) and replace with clean typography or emojis
 */
export function sanitizeNoGedankenstriche(text: string): string {
  if (!text) return "";
  const cleaned = text
    .replace(/^[\s]*[–—\-]\s+/gm, "• ")
    .replace(/\s+[–—]\s+/g, ": ")
    .replace(/\s+-\s+/g, ": ")
    .replace(/[–—]/g, "");
  return cleaned.trim();
}

/**
 * Pure calculation of next free posting slots avoiding collisions with already scheduled posts
 */
export function calculateNextSlots(
  config: PostingSlotConfig,
  count: number,
  takenTimestamps: number[],
  options: { startFrom?: Date; minGapMinutes?: number } = {}
): Date[] {
  const days = config.days.length ? config.days : [1, 2, 3, 4, 5];
  const times: number[][] = (config.times.length ? config.times : ["09:00", "13:00", "18:00"])
    .map((t: string) => t.split(":").map(Number))
    .filter(([h, m]: number[]) => Number.isFinite(h) && Number.isFinite(m))
    .sort((a: number[], b: number[]) => a[0] * 60 + a[1] - (b[0] * 60 + b[1]));

  const out: Date[] = [];
  const soonest = Date.now() + 15 * 60 * 1000;
  const min = Math.max(soonest, options.startFrom ? options.startFrom.getTime() : 0);
  const gapMs = Math.max(0, options.minGapMinutes ?? 0) * 60 * 1000;
  const cursor = new Date(min);
  cursor.setHours(0, 0, 0, 0);

  for (let dayOffset = 0; dayOffset < 400 && out.length < count; dayOffset++) {
    const day = new Date(cursor);
    day.setDate(day.getDate() + dayOffset);
    if (!days.includes(day.getDay())) continue;
    for (const [h, m] of times) {
      if (out.length >= count) break;
      const slot = new Date(day);
      slot.setHours(h, m, 0, 0);
      const ts = slot.getTime();
      if (ts < min) continue;
      const last = out[out.length - 1];
      if (last && ts - last.getTime() < gapMs) continue;
      const clash =
        takenTimestamps.some((t) => Math.abs(t - ts) < 5 * 60 * 1000) ||
        out.some((d) => Math.abs(d.getTime() - ts) < 5 * 60 * 1000);
      if (clash) continue;
      out.push(slot);
    }
  }
  return out;
}

export function registerTools(server: McpServer) {
  // 1. Tool: get_brand_profiles
  server.tool(
    "get_brand_profiles",
    "Gibt alle konfigurierten Markenprofile (z. B. Socialcraft Hauptbrand, Zitate Tiger etc.) mit Beschreibungen, Farben und Stilrichtungen zurück.",
    {},
    async () => {
      const profiles = getBrandProfiles();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                count: profiles.length,
                profiles: profiles.map((p) => ({
                  id: p.id,
                  name: p.name,
                  slug: p.slug,
                  description: p.description,
                  color: p.color,
                  isDefault: p.isDefault,
                })),
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // 2. Tool: get_social_channels
  server.tool(
    "get_social_channels",
    "Listet verbundene Social-Media-Kanäle auf (Instagram, TikTok, LinkedIn, Facebook, YouTube etc.), optional gefiltert nach Brand-Profil.",
    {
      profileId: z
        .string()
        .optional()
        .describe("Optional: ID des Markenprofils (z. B. 'profile-default', 'profile-zitate-tiger')"),
    },
    async ({ profileId }) => {
      const channels = getSocialChannels(profileId);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                count: channels.length,
                channels: channels.map((c) => ({
                  id: c.id,
                  name: c.name,
                  platform: c.platform,
                  handle: c.handle,
                  channelId: c.channelId,
                  profileId: c.profileId,
                  isDefault: c.isDefault,
                })),
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // 3. Tool: get_posting_slots
  server.tool(
    "get_posting_slots",
    "Berechnet die nächsten freien, kollisionsfreien Posting-Slots basierend auf dem SocialCraft-Zeitplan.",
    {
      count: z
        .number()
        .min(1)
        .max(50)
        .default(5)
        .describe("Anzahl der gewünschten freien Veröffentlichungsslots (Standard: 5)"),
      startFrom: z
        .string()
        .optional()
        .describe("Optional: Startdatum im ISO-Format (z. B. '2026-03-10T09:00:00Z'). Standard: ab sofort (+15min)"),
      minGapMinutes: z
        .number()
        .optional()
        .default(180)
        .describe("Mindestabstand in Minuten zwischen zwei aufeinanderfolgenden Posts (Standard: 180 Min = 3 Std)"),
    },
    async ({ count, startFrom, minGapMinutes }) => {
      const config = getPostingSlotConfig();
      const existing = getScheduledPosts();
      const taken = existing.map((p) => new Date(p.scheduledFor).getTime());
      const startDate = startFrom ? new Date(startFrom) : undefined;
      const slots = calculateNextSlots(config, count, taken, {
        startFrom: startDate,
        minGapMinutes,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                count: slots.length,
                config: {
                  postingDays: config.days.map((d) => ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"][d]),
                  postingTimes: config.times,
                },
                availableSlots: slots.map((s) => ({
                  iso: s.toISOString(),
                  localString: s.toLocaleString("de-DE", { timeZone: "Europe/Berlin" }),
                  dayOfWeek: ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"][
                    s.getDay()
                  ],
                })),
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // 4. Tool: get_scheduled_posts
  server.tool(
    "get_scheduled_posts",
    "Gibt die aktuell geplanten Beiträge zurück, optional gefiltert nach Status, Plattform oder Profil.",
    {
      status: z
        .enum(["scheduled", "queued", "published", "draft", "failed", "cancelled"])
        .optional()
        .describe("Filter nach Beitragsstatus"),
      profileId: z.string().optional().describe("Filter nach Markenprofil-ID"),
      platform: z
        .enum([
          "facebook",
          "instagram",
          "tiktok",
          "youtube",
          "linkedin",
          "bluesky",
          "discord",
          "twitter",
          "pinterest",
          "threads",
          "whatsapp",
          "telegram",
        ])
        .optional()
        .describe("Filter nach Social-Media-Plattform"),
      fromDate: z.string().optional().describe("Nur Posts ab diesem Datum (ISO)"),
      toDate: z.string().optional().describe("Nur Posts bis zu diesem Datum (ISO)"),
    },
    async (filters) => {
      const posts = getScheduledPosts(filters as any);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                count: posts.length,
                posts: posts.map((p) => ({
                  id: p.id,
                  title: p.title,
                  scheduledFor: p.scheduledFor,
                  platform: p.platform,
                  channelId: p.channelId,
                  status: p.status,
                  mediaType: p.mediaType,
                  hashtagsCount: p.hashtags?.length || 0,
                  captionSnippet: p.caption ? p.caption.slice(0, 100) + (p.caption.length > 100 ? "..." : "") : "",
                })),
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // 5. Tool: create_scheduled_post
  server.tool(
    "create_scheduled_post",
    "Erstellt und plant einen einzelnen Social-Media-Post in SocialCraft. Die Caption wird automatisch bereinigt (keine Gedankenstriche). Wenn kein Datum angegeben ist, wird automatisch der nächste freie Zeitslot gewählt.",
    {
      title: z.string().describe("Titel oder Kernaussage des Beitrags"),
      caption: z
        .string()
        .describe("Die vollständige Beitrags-Caption mit Hook, Mehrwert und Call-to-Action (ohne Gedankenstriche)"),
      hashtags: z.array(z.string()).describe("Liste relevanter Hashtags (z. B. ['#mindset', '#erfolg'])"),
      platform: z
        .enum([
          "facebook",
          "instagram",
          "tiktok",
          "youtube",
          "linkedin",
          "bluesky",
          "discord",
          "twitter",
          "pinterest",
          "threads",
          "whatsapp",
          "telegram",
        ])
        .default("instagram")
        .describe("Social-Media-Plattform"),
      channelId: z
        .string()
        .optional()
        .describe("Optional: Kanal-ID (z. B. 'ig-main-account'). Wird sonst aus Standardkanal gewählt."),
      mediaType: z.enum(["image", "carousel", "video"]).default("image").describe("Art der Medien"),
      mediaUrls: z.array(z.string()).optional().default([]).describe("Optionale Bild- oder Video-URLs"),
      visualPrompt: z
        .string()
        .optional()
        .describe("Prompt für die KI-Bildgenerierung (z. B. für Kie.ai / Nano Banana Pro)"),
      scheduledFor: z
        .string()
        .optional()
        .describe("Geplantes Veröffentlichungsdatum im ISO-Format. Falls leer, wird automatisch der nächste freie Slot ermittelt."),
      profileId: z.string().optional().describe("Markenprofil-ID (z. B. 'profile-default')"),
      status: z.enum(["scheduled", "draft", "queued"]).default("scheduled").describe("Status des Beitrags"),
    },
    async (params) => {
      let finalSlot = params.scheduledFor;
      if (!finalSlot) {
        const config = getPostingSlotConfig();
        const existing = getScheduledPosts();
        const taken = existing.map((p) => new Date(p.scheduledFor).getTime());
        const [nextSlot] = calculateNextSlots(config, 1, taken);
        finalSlot = nextSlot ? nextSlot.toISOString() : new Date(Date.now() + 3600000).toISOString();
      }

      let channelId = params.channelId;
      const targetChannel = channelId
        ? getSocialChannels(params.profileId).find((c) => c.id === channelId)
        : resolveChannelForPlatform(params.profileId, params.platform);
      channelId = targetChannel?.id || resolveChannelForPlatform(params.profileId, params.platform).id;
      const effectiveProfileId = targetChannel?.profileId || params.profileId || "profile-default";

      const cleanCaption = sanitizeNoGedankenstriche(params.caption);

      const created = addScheduledPost({
        title: params.title,
        caption: cleanCaption,
        hashtags: params.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)),
        mediaType: params.mediaType,
        mediaUrls: params.mediaUrls || [],
        channelId,
        platform: params.platform as SocialPlatform,
        scheduledFor: finalSlot,
        status: params.status as ScheduledPostStatus,
        profileId: effectiveProfileId,
        musicTitle: params.visualPrompt ? `Prompt: ${params.visualPrompt.slice(0, 50)}...` : undefined,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                message: "Post erfolgreich in SocialCraft eingeplant!",
                post: {
                  id: created.id,
                  title: created.title,
                  scheduledFor: created.scheduledFor,
                  platform: created.platform,
                  channelId: created.channelId,
                  status: created.status,
                  hashtags: created.hashtags,
                  visualPrompt: params.visualPrompt,
                },
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // 6. Tool: batch_preplan_posts
  server.tool(
    "batch_preplan_posts",
    "Plant eine Serie von Beiträgen (z. B. für 7, 14 oder 30 Tage) vollautomatisch über die nächsten optimalen Zeitslots ein.",
    {
      posts: z
        .array(
          z.object({
            title: z.string().describe("Titel/Thema des Beitrags"),
            caption: z.string().describe("Beitragstext (wird automatisch von Gedankenstrichen bereinigt)"),
            hashtags: z.array(z.string()).describe("Relevante Hashtags"),
            platform: z
              .enum([
                "facebook",
                "instagram",
                "tiktok",
                "youtube",
                "linkedin",
                "bluesky",
                "discord",
                "twitter",
                "pinterest",
                "threads",
                "whatsapp",
                "telegram",
              ])
              .default("instagram"),
            channelId: z.string().optional(),
            mediaType: z.enum(["image", "carousel", "video"]).default("image"),
            mediaUrls: z.array(z.string()).optional(),
            visualPrompt: z.string().optional().describe("Prompt für die Bildgenerierung"),
            scheduledFor: z.string().optional().describe("Konkretes Datum oder leer lassen für Auto-Slot-Verteilung"),
            profileId: z.string().optional(),
          })
        )
        .min(1)
        .max(50)
        .describe("Liste der vorzuplanenden Posts"),
      startFrom: z.string().optional().describe("Optionales Startdatum (ISO) für die Slot-Verteilung"),
      profileId: z.string().optional().describe("Standard-Markenprofil-ID für alle Posts"),
    },
    async ({ posts, startFrom, profileId }) => {
      const config = getPostingSlotConfig();
      const existing = getScheduledPosts();
      const taken = existing.map((p) => new Date(p.scheduledFor).getTime());
      const startDate = startFrom ? new Date(startFrom) : undefined;
      const allocatedSlots = calculateNextSlots(config, posts.length, taken, {
        startFrom: startDate,
        minGapMinutes: 240, // 4 hours gap for batch
      });

      const toCreate: Array<Omit<ScheduledPost, "id" | "createdAt">> = posts.map((p, idx) => {
        const slot = p.scheduledFor || (allocatedSlots[idx] ? allocatedSlots[idx].toISOString() : new Date(Date.now() + (idx + 1) * 86400000).toISOString());
        const cleanCaption = sanitizeNoGedankenstriche(p.caption);

        let chId = p.channelId;
        const targetProfile = p.profileId || profileId;
        if (!chId) {
          chId = resolveChannelForPlatform(targetProfile, p.platform).id;
        }

        return {
          title: p.title,
          caption: cleanCaption,
          hashtags: p.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)),
          mediaType: p.mediaType,
          mediaUrls: p.mediaUrls || [],
          channelId: chId,
          platform: p.platform as SocialPlatform,
          scheduledFor: slot,
          status: "scheduled",
          profileId: targetProfile || "profile-default",
          musicTitle: p.visualPrompt ? `Prompt: ${p.visualPrompt.slice(0, 50)}` : undefined,
        };
      });

      const created = batchAddScheduledPosts(toCreate);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                message: `${created.length} Beiträge erfolgreich in SocialCraft vorgeplant!`,
                createdPosts: created.map((cp) => ({
                  id: cp.id,
                  title: cp.title,
                  scheduledFor: cp.scheduledFor,
                  platform: cp.platform,
                  hashtags: cp.hashtags,
                })),
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // 7. Tool: create_carousel_draft
  server.tool(
    "create_carousel_draft",
    "Erstellt einen vollständigen Karussell-Entwurf mit Folien, Hooks, Visual-Prompts und kann ihn direkt als Entwurf oder geplanten Post anlegen.",
    {
      topic: z.string().describe("Hauptthema des Karussells"),
      targetAudience: z.string().optional().describe("Zielgruppe (z. B. 'Unternehmer, Gründer, Content Creator')"),
      slides: z
        .array(
          z.object({
            slideNumber: z.number().describe("Foliennummer (1 = Hook, letztes = Call to Action)"),
            role: z.enum([
              "hook",
              "concept",
              "pain_point",
              "authority",
              "expansion",
              "usp",
              "proof",
              "urgency",
              "closing",
            ]),
            headline: z.string().describe("Prägnante Headline der Folie (groß, aufmerksamkeitsstark)"),
            subtext: z.string().describe("Erklärender Subtext oder Aufzählung"),
            visualPrompt: z.string().describe("Visueller Bildprompt für den Hintergrund / KI-Grafik"),
          })
        )
        .min(2)
        .max(15)
        .describe("Liste der Folien"),
      caption: z.string().describe("Begleitende Caption für den Karussell-Post"),
      hashtags: z.array(z.string()).describe("Hashtags"),
      platform: z.enum(["instagram", "linkedin", "tiktok"]).default("instagram"),
      scheduledFor: z.string().optional().describe("Optionales Datum zum direkten Einplanen"),
      channelId: z.string().optional().describe("Optional: Spezifische Kanal-ID (z. B. 'ig-loyaltytiger', 'ig-main-account')"),
      profileId: z.string().optional(),
    },
    async (params) => {
      const cleanCaption = sanitizeNoGedankenstriche(params.caption);
      let scheduledFor = params.scheduledFor;
      if (!scheduledFor) {
        const config = getPostingSlotConfig();
        const existing = getScheduledPosts();
        const taken = existing.map((p) => new Date(p.scheduledFor).getTime());
        const [nextSlot] = calculateNextSlots(config, 1, taken);
        scheduledFor = nextSlot ? nextSlot.toISOString() : new Date(Date.now() + 86400000).toISOString();
      }

      let channelId = params.channelId;
      if (!channelId) {
        channelId = resolveChannelForPlatform(params.profileId, params.platform).id;
      }

      const post = addScheduledPost({
        title: `Karussell: ${params.topic}`,
        caption: cleanCaption,
        hashtags: params.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)),
        mediaType: "carousel",
        mediaUrls: [],
        channelId,
        platform: params.platform as SocialPlatform,
        scheduledFor,
        status: "scheduled",
        profileId: params.profileId || "profile-default",
        musicTitle: `Karussell (${params.slides.length} Slides)`,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                message: `Karussell-Konzept mit ${params.slides.length} Folien erfolgreich angelegt!`,
                postId: post.id,
                scheduledFor: post.scheduledFor,
                slidesOverview: params.slides.map((s) => ({
                  slideNumber: s.slideNumber,
                  role: s.role,
                  headline: s.headline,
                  visualPromptSnippet: s.visualPrompt.slice(0, 60) + "...",
                })),
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // 8. Tool: plan_and_schedule_carousels
  server.tool(
    "plan_and_schedule_carousels",
    "Erstellt für mehrere Tage (z. B. 3 Tage) vollständige Karussell-Konzepte mit allen Folien, Visual Prompts, Headlines, Subtexten, Captions (ohne Gedankenstriche) und Hashtags und plant sie vollautomatisch in SocialCraft für die angegebenen Plattformen (Instagram, LinkedIn etc.) an den nächsten freien Terminen ein.",
    {
      carousels: z
        .array(
          z.object({
            day: z.number().optional().describe("Tag-Nummer (z. B. 1, 2, 3)"),
            topic: z.string().describe("Hauptthema des Karussells"),
            targetAudience: z.string().optional().describe("Zielgruppe"),
            platforms: z
              .array(
                z.enum([
                  "instagram",
                  "linkedin",
                  "facebook",
                  "tiktok",
                  "youtube",
                  "pinterest",
                  "twitter",
                  "threads",
                  "bluesky",
                ])
              )
              .min(1)
              .default(["instagram"])
              .describe("Plattformen für dieses Karussell"),
            slides: z
              .array(
                z.object({
                  slideNumber: z.number().describe("Foliennummer (1..N)"),
                  role: z.enum([
                    "hook",
                    "concept",
                    "pain_point",
                    "authority",
                    "expansion",
                    "usp",
                    "proof",
                    "urgency",
                    "closing",
                  ]),
                  headline: z.string().describe("Große, prägnante Headline"),
                  subtext: z.string().describe("Erklärender Subtext oder Aufzählung"),
                  visualPrompt: z.string().describe("Detaillierter Prompt für KI-Bildgenerierung (z. B. Kie.ai / Nano Banana Pro)"),
                })
              )
              .min(2)
              .describe("Folien des Karussells"),
            caption: z.string().describe("Vollständige Caption für den Post (ohne Gedankenstriche)"),
            hashtags: z.array(z.string()).describe("Relevante Hashtags"),
            scheduledFor: z.string().optional().describe("Optional: Spezifisches Datum (ISO). Wenn weggelassen, wird automatisch ein freier Slot an Tag 1, Tag 2 etc. ermittelt."),
            profileId: z.string().optional(),
          })
        )
        .min(1)
        .describe("Liste der zu erstellenden Karussells"),
      startFrom: z.string().optional().describe("Startdatum (ISO) für die automatische Zeitplanung"),
      profileId: z.string().optional().describe("Standard-Markenprofil-ID (z. B. 'profile-default')"),
    },
    async ({ carousels, startFrom, profileId }) => {
      const config = getPostingSlotConfig();
      const existing = getScheduledPosts();
      const taken = existing.map((p) => new Date(p.scheduledFor).getTime());
      const startDate = startFrom ? new Date(startFrom) : undefined;
      const allocatedSlots = calculateNextSlots(config, carousels.length, taken, {
        startFrom: startDate,
        minGapMinutes: 720, // At least 12 hours gap between carousel days
      });

      const results: Array<{
        day: number;
        topic: string;
        draftId: string;
        slidesCount: number;
        scheduledPosts: Array<{ id: string; platform: string; scheduledFor: string }>;
      }> = [];

      carousels.forEach((c, idx) => {
        const dayNumber = c.day || idx + 1;
        const assignedSlot =
          c.scheduledFor ||
          (allocatedSlots[idx] ? allocatedSlots[idx].toISOString() : new Date(Date.now() + (idx + 1) * 86400000).toISOString());

        // 1. Save Carousel Draft
        const draft = addCarouselDraft({
          title: `Karussell Tag ${dayNumber}: ${c.topic}`,
          topic: c.topic,
          audience: c.targetAudience,
          slides: c.slides.map((s) => ({
            slideNumber: s.slideNumber,
            role: s.role,
            headline: s.headline,
            subtext: s.subtext,
            visualPrompt: s.visualPrompt,
          })),
          profileId: c.profileId || profileId || "profile-default",
        });

        // 2. Schedule for each chosen platform
        const scheduledList: Array<{ id: string; platform: string; scheduledFor: string }> = [];
        const cleanCaption = sanitizeNoGedankenstriche(c.caption);
        const channels = getSocialChannels(c.profileId || profileId);

        c.platforms.forEach((plat) => {
          const targetProfile = c.profileId || profileId;
          const assignedChannel = resolveChannelForPlatform(targetProfile, plat);
          const post = addScheduledPost({
            title: `Karussell (Tag ${dayNumber}): ${c.topic}`,
            caption: cleanCaption,
            hashtags: c.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)),
            mediaType: "carousel",
            mediaUrls: [],
            channelId: assignedChannel.id,
            platform: plat as SocialPlatform,
            scheduledFor: assignedSlot,
            status: "scheduled",
            profileId: assignedChannel.profileId || targetProfile || "profile-default",
            musicTitle: `Karussell [${draft.id}] (${c.slides.length} Slides)`,
          });

          scheduledList.push({
            id: post.id,
            platform: post.platform,
            scheduledFor: post.scheduledFor,
          });
        });

        results.push({
          day: dayNumber,
          topic: c.topic,
          draftId: draft.id,
          slidesCount: c.slides.length,
          scheduledPosts: scheduledList,
        });
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                message: `${results.length} Tage Content mit Karussells erfolgreich erstellt und in SocialCraft vorgeplant!`,
                summary: results.map((r) => ({
                  day: `Tag ${r.day}`,
                  topic: r.topic,
                  slides: r.slidesCount,
                  draftId: r.draftId,
                  posts: r.scheduledPosts.map((sp) => `${sp.platform} am ${new Date(sp.scheduledFor).toLocaleString("de-DE")}`),
                })),
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // 9. Tool: create_content_series
  server.tool(
    "create_content_series",
    "Erstellt einen Mass-Content-Batch (Batch Studio) mit mehreren Karussell-Teilen oder Posts und fügt die Folien direkt in das SocialCraft Batch Studio (Tab 'Batch Studio' / 'bulk') und/oder verbindlich in den Kalender-Planer ein.",
    {
      seriesTitle: z.string().describe("Übergeordneter Name des Batch-Pakets (z. B. '30-Tage Mindset Batch' oder 'Masterclass Batch')"),
      targetAudience: z.string().optional().describe("Zielgruppe der Serie"),
      platforms: z
        .array(
          z.enum([
            "instagram",
            "linkedin",
            "facebook",
            "tiktok",
            "youtube",
            "pinterest",
            "twitter",
            "threads",
            "bluesky",
          ])
        )
        .min(1)
        .default(["instagram"])
        .describe("Plattformen für die Serie"),
      parts: z
        .array(
          z.object({
            partNumber: z.number().describe("Nummer des Teils (1, 2, 3...)"),
            partTitle: z.string().describe("Titel dieses Teils (z. B. 'Teil 1: Der Einstieg')"),
            topic: z.string().describe("Thema dieses Teils"),
            slides: z
              .array(
                z.object({
                  slideNumber: z.number(),
                  role: z.enum([
                    "hook",
                    "concept",
                    "pain_point",
                    "authority",
                    "expansion",
                    "usp",
                    "proof",
                    "urgency",
                    "closing",
                  ]),
                  headline: z.string(),
                  subtext: z.string(),
                  visualPrompt: z.string(),
                })
              )
              .min(2),
            caption: z.string().describe("Caption für diesen Teil (ohne Gedankenstriche, mit Teaser auf den nächsten Teil)"),
            hashtags: z.array(z.string()),
            scheduledFor: z.string().optional(),
          })
        )
        .min(2)
        .describe("Die einzelnen Teile der Serie"),
      addToSeriesQueue: z.boolean().default(true).describe("Direkt in das SocialCraft Batch Studio (Tab 'Batch Studio' / 'bulk') einfügen"),
      scheduleInCalendar: z.boolean().default(true).describe("Gleichzeitig verbindlich in den Kalender vorplanen"),
      startFrom: z.string().optional(),
      channelId: z.string().optional().describe("Optional: Feste Kanal-ID (z. B. 'ig-loyaltytiger')"),
      profileId: z.string().optional(),
    },
    async ({ seriesTitle, targetAudience, platforms, parts, addToSeriesQueue, scheduleInCalendar, startFrom, channelId, profileId }) => {
      const config = getPostingSlotConfig();
      const existing = getScheduledPosts();
      const taken = existing.map((p) => new Date(p.scheduledFor).getTime());
      const startDate = startFrom ? new Date(startFrom) : undefined;
      const allocatedSlots = calculateNextSlots(config, parts.length, taken, {
        startFrom: startDate,
        minGapMinutes: 720,
      });

      const createdSeriesJobs: SeriesJob[] = [];
      if (addToSeriesQueue) {
        const jobs: SeriesJob[] = parts.map((p) => ({
          id: `series-job-${Date.now()}-${p.partNumber}-${Math.random().toString(36).slice(2, 6)}`,
          topic: `[${seriesTitle} · Teil ${p.partNumber}/${parts.length}] ${p.partTitle}`,
          audience: targetAudience || "Creator & Unternehmer",
          status: "queued" as const,
          slidesTotal: p.slides.length,
          slidesDone: 0,
          slides: p.slides.map((s, sIdx) => ({
            id: `slide-${Date.now()}-${sIdx}-${Math.random().toString(36).slice(2, 5)}`,
            slideNumber: s.slideNumber,
            role: s.role as SlideRole,
            roleLabel: s.role.toUpperCase(),
            headline: s.headline,
            subtext: s.subtext,
            coreMetaphor: p.topic,
            primaryProps: [],
            visualPrompt: s.visualPrompt,
          })),
          createdAt: new Date().toISOString(),
        }));
        batchAddSeriesJobs(jobs);
        createdSeriesJobs.push(...jobs);
      }

      const calendarBookings: Array<{ part: number; title: string; scheduledFor: string; platforms: string[] }> = [];
      if (scheduleInCalendar) {
        const channels = getSocialChannels(profileId);

        parts.forEach((p, idx) => {
          const assignedSlot =
            p.scheduledFor ||
            (allocatedSlots[idx] ? allocatedSlots[idx].toISOString() : new Date(Date.now() + (idx + 1) * 86400000).toISOString());

          const cleanCaption = sanitizeNoGedankenstriche(p.caption);

          const draft = addCarouselDraft({
            title: `${seriesTitle} (Teil ${p.partNumber}/${parts.length}): ${p.partTitle}`,
            topic: p.topic,
            audience: targetAudience,
            slides: p.slides.map((s) => ({
              slideNumber: s.slideNumber,
              role: s.role,
              headline: s.headline,
              subtext: s.subtext,
              visualPrompt: s.visualPrompt,
            })),
            profileId: profileId || "profile-default",
          });

          platforms.forEach((plat) => {
            const assignedChannel = channelId
              ? channels.find((ch) => ch.id === channelId) || resolveChannelForPlatform(profileId, plat)
              : resolveChannelForPlatform(profileId, plat);
            addScheduledPost({
              title: `[Serie] ${seriesTitle} · Teil ${p.partNumber}/${parts.length}`,
              caption: cleanCaption,
              hashtags: p.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)),
              mediaType: "carousel",
              mediaUrls: [],
              channelId: assignedChannel.id,
              platform: plat as SocialPlatform,
              scheduledFor: assignedSlot,
              status: "scheduled",
              profileId: assignedChannel.profileId || profileId || "profile-default",
              musicTitle: `Serie [${draft.id}] (${p.slides.length} Slides)`,
            });
          });

          calendarBookings.push({
            part: p.partNumber,
            title: p.partTitle,
            scheduledFor: assignedSlot,
            platforms,
          });
        });
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                message: `Serie '${seriesTitle}' mit ${parts.length} Teilen erfolgreich in SocialCraft angelegt!`,
                seriesTitle,
                totalParts: parts.length,
                addedToSeriesQueue: createdSeriesJobs.length,
                scheduledInCalendar: calendarBookings.length,
                partsOverview: calendarBookings.map((b) => ({
                  part: `Teil ${b.part}/${parts.length}`,
                  title: b.title,
                  scheduledFor: new Date(b.scheduledFor).toLocaleString("de-DE"),
                  platforms: b.platforms,
                })),
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // 10. Tool: get_series_queue
  server.tool(
    "get_series_queue",
    "Gibt alle aktuellen Jobs aus dem SocialCraft Batch Studio (Tab 'Batch Studio' / 'bulk') zurück.",
    {},
    async () => {
      const queue = getSeriesQueue();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                count: queue.length,
                jobs: queue.map((j) => ({
                  id: j.id,
                  topic: j.topic,
                  audience: j.audience,
                  status: j.status,
                  slidesTotal: j.slidesTotal,
                  slidesDone: j.slidesDone,
                  createdAt: j.createdAt,
                })),
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // 11. Tool: update_scheduled_post
  server.tool(
    "update_scheduled_post",
    "Aktualisiert einen bereits geplanten Post (z. B. Datum verschieben, Caption anpassen, Status ändern).",
    {
      id: z.string().describe("Eindeutige ID des Beitrags"),
      title: z.string().optional(),
      caption: z.string().optional(),
      hashtags: z.array(z.string()).optional(),
      scheduledFor: z.string().optional().describe("Neues Veröffentlichungsdatum (ISO)"),
      status: z.enum(["scheduled", "queued", "published", "draft", "failed", "cancelled"]).optional(),
      channelId: z.string().optional(),
    },
    async ({ id, caption, hashtags, ...rest }) => {
      const updates: Partial<ScheduledPost> = { ...rest };
      if (caption !== undefined) {
        updates.caption = sanitizeNoGedankenstriche(caption);
      }
      if (hashtags !== undefined) {
        updates.hashtags = hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`));
      }

      const updated = updateScheduledPost(id, updates);
      if (!updated) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ success: false, error: `Post mit ID '${id}' nicht gefunden.` }),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ success: true, message: "Post erfolgreich aktualisiert.", post: updated }, null, 2),
          },
        ],
      };
    }
  );

  // 9. Tool: delete_scheduled_post
  server.tool(
    "delete_scheduled_post",
    "Löscht oder storniert einen geplanten Beitrag aus SocialCraft.",
    {
      id: z.string().describe("ID des zu löschenden Beitrags"),
    },
    async ({ id }) => {
      const ok = deleteScheduledPost(id);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              ok
                ? { success: true, message: `Post mit ID '${id}' gelöscht.` }
                : { success: false, error: `Post mit ID '${id}' nicht gefunden.` },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // 10. Tool: get_prompt_frameworks
  server.tool(
    "get_prompt_frameworks",
    "Liefert bewährte SocialCraft-Prompt-Vorlagen für virale Hooks, Karussell-Bögen und KI-Bildprompts (Banana / Kie.ai / Midjourney).",
    {
      category: z
        .enum(["all", "carousels", "captions", "image_prompts"])
        .default("all")
        .describe("Kategorie der Templates"),
    },
    async ({ category }) => {
      const frameworks = {
        captions: [
          {
            name: "Hook-Story-Offer (HSO)",
            structure: [
              "1. Scroll-stopping Einzeiler (z. B. provokante These oder überraschende Zahl)",
              "2. Kurze, emotionale Storyline mit Absätzen (ohne Gedankenstriche!)",
              "3. Aha-Moment / Konkretes Learning",
              "4. Klarer Call-to-Action (z. B. 'Speichere diesen Beitrag' oder 'Schreib deine Meinung')",
              "5. 3 bis 5 themenspezifische Hashtags",
            ],
            rules: "Keine Gedankenstriche (–, —) verwenden. Nutze stattdessen Doppelpunkte oder Aufzählungspunkte.",
          },
          {
            name: "Zitate Tiger / Mindset Statement",
            structure: [
              "1. Starkes Zitat in Anführungszeichen als Hook",
              "2. 2-3 Sätze Interpretation für den Alltag",
              "3. Motivierender Abschluss-Satz",
              "4. Frage zur Interaktion",
            ],
          },
        ],
        carousels: [
          {
            name: "SocialCraft 6-Slide Bogen-Karussell",
            slides: [
              "Slide 1 (Hook): Kontraintuitive Aussage, die zum Weiterwischen zwingt.",
              "Slide 2 (Pain Point): Warum die meisten scheitern / der versteckte Fehler.",
              "Slide 3 (Concept): Das neue mentale Modell oder Prinzip visualisiert.",
              "Slide 4 (Deep Dive): Konkrete 3-Schritte-Anleitung.",
              "Slide 5 (Proof/Resultat): Was passiert, wenn man es umsetzt.",
              "Slide 6 (Closing/CTA): Profil-Handle + Handlungsaufforderung zum Speichern/Folgen.",
            ],
          },
        ],
        image_prompts: [
          {
            name: "Kie.ai & Nano Banana Pro Cinematic Style",
            template:
              "cinematic wide shot, hyper-realistic, dramatic rim lighting, dark moody studio background with subtle neon amber accents, sharp focus, 8k resolution, photorealistic editorial photography --ar 4:5 --style raw",
            tips: "Gegenstand oder Hauptfigur im Zentrum platzieren, Raum für Typografie-Overlay oben oder unten lassen.",
          },
          {
            name: "Bold Minimalist Graphic",
            template:
              "ultra-clean minimalist 3D isometric composition, matte finish, rich warm studio lighting, subtle orange and charcoal contrast, sleek modern aesthetics, rendered in Octane, 8k",
          },
        ],
      };

      const selected =
        category === "all"
          ? frameworks
          : category === "captions"
          ? { captions: frameworks.captions }
          : category === "carousels"
          ? { carousels: frameworks.carousels }
          : { image_prompts: frameworks.image_prompts };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ success: true, category, frameworks: selected }, null, 2),
          },
        ],
      };
    }
  );
}
