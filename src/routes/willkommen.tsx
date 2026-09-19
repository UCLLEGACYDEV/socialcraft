import { createFileRoute } from "@tanstack/react-router";
import { OnyxStudio } from "./index";

export const Route = createFileRoute("/willkommen")({
  head: () => ({
    meta: [
      { title: "Willkommen bei ONYX Studio — KI-Content für Social Media" },
      {
        name: "description",
        content:
          "ONYX Studio erstellt Karussells, Einzelbilder und komplette 30-Tage-Serien für Instagram, TikTok & Co. — und plant sie direkt ein.",
      },
      { property: "og:title", content: "Willkommen bei ONYX Studio" },
      {
        property: "og:description",
        content:
          "Thema eingeben, Bilder erhalten, Beiträge einplanen. Alles in einer Oberfläche, komplett auf Deutsch.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WillkommenPage,
});

function WillkommenPage() {
  return <OnyxStudio initialView="landing" />;
}
