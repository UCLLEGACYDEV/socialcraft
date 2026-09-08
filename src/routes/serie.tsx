import { createFileRoute } from "@tanstack/react-router";
import { OnyxStudio } from "./index";

export const Route = createFileRoute("/serie")({
  head: () => ({
    meta: [
      { title: "Serienproduktion & Warteschlange — ONYX Studio" },
      {
        name: "description",
        content:
          "Serienproduktion von Beiträgen im Batch mit automatischer Warteschlange, parallelem Rendering und Cloud-Speicherung.",
      },
      { property: "og:title", content: "Serienproduktion — ONYX Studio" },
      {
        property: "og:description",
        content: "Erstelle Serien von Beiträgen auf Knopfdruck für deine gesamte Content-Pipeline.",
      },
    ],
  }),
  component: SeriePage,
});

function SeriePage() {
  return <OnyxStudio routeTab="bulk" />;
}
