import { createFileRoute } from "@tanstack/react-router";
import { OnyxStudio } from "./index";

export const Route = createFileRoute("/studio")({
  head: () => ({
    meta: [
      { title: "Karussell Studio — ONYX Studio" },
      {
        name: "description",
        content:
          "Erstelle komplette Instagram-Karussells aus Thema und Zielgruppe mit KI-gestützter Slide-Generierung und ZIP-Export.",
      },
      { property: "og:title", content: "Karussell Studio — ONYX Studio" },
      {
        property: "og:description",
        content: "Erstelle virale Karussell-Beiträge mit konsistentem Branding und Bildgenerierung.",
      },
    ],
  }),
  component: StudioPage,
});

function StudioPage() {
  return <OnyxStudio routeTab="carousel" />;
}
