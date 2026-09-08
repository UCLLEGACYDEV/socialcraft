import { createFileRoute } from "@tanstack/react-router";
import { OnyxStudio } from "./index";

export const Route = createFileRoute("/prompts")({
  head: () => ({
    meta: [
      { title: "Prompt Hub & Vorlagen — ONYX Studio" },
      {
        name: "description",
        content:
          "Kuratierte Prompt-Bibliothek für virale Hooks, Storytelling-Strukturen und Bildprompts mit 1-Klick-Übernahme.",
      },
      { property: "og:title", content: "Prompt Hub — ONYX Studio" },
      {
        property: "og:description",
        content: "Entdecke hunderte erprobte Hooks und Vorlagen für dein nächstes virales Karussell.",
      },
    ],
  }),
  component: PromptsPage,
});

function PromptsPage() {
  return <OnyxStudio routeTab="prompt-gallery" />;
}
