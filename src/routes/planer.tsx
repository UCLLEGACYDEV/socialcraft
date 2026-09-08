import { createFileRoute } from "@tanstack/react-router";
import { OnyxStudio } from "./index";

export const Route = createFileRoute("/planer")({
  head: () => ({
    meta: [
      { title: "Social Media Planer & Kalender — ONYX Studio" },
      {
        name: "description",
        content:
          "Multi-Kanal Social Media Scheduler für Instagram, TikTok, Facebook, LinkedIn, YouTube, X, Threads und Pinterest mit Drag & Drop und Zeitplanung.",
      },
      { property: "og:title", content: "Social Media Planer — ONYX Studio" },
      {
        property: "og:description",
        content: "Automatisiere und plane deine Social Media Posts auf allen wichtigen Plattformen.",
      },
    ],
  }),
  component: PlanerPage,
});

function PlanerPage() {
  return <OnyxStudio routeTab="scheduler" />;
}
