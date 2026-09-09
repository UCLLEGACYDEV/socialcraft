import { createFileRoute } from "@tanstack/react-router";
import { OnyxStudio } from "./index";

export const Route = createFileRoute("/serie")({
  head: () => ({
    meta: [
      { title: "Batch Studio & Content-Warteschlange — ONYX Studio" },
      {
        name: "description",
        content:
          "Batch Studio für Massenproduktion von Beiträgen mit automatischer Warteschlange, parallelem Rendering und Cloud-Speicherung.",
      },
      { property: "og:title", content: "Batch Studio — ONYX Studio" },
      {
        property: "og:description",
        content: "Erstelle Mass-Content und Batches von Beiträgen auf Knopfdruck für deine gesamte Content-Pipeline.",
      },
    ],
  }),
  component: SeriePage,
});

function SeriePage() {
  return <OnyxStudio routeTab="bulk" />;
}
