import { createFileRoute } from "@tanstack/react-router";
import { OnyxStudio } from "./index";

export const Route = createFileRoute("/galerie")({
  head: () => ({
    meta: [
      { title: "Cloud-Galerie & Medienarchiv — ONYX Studio" },
      {
        name: "description",
        content:
          "Private S4 Cloud-Galerie mit allen generierten Slides, Projekten und Uploads pro Nutzer und Brand-Profil.",
      },
      { property: "og:title", content: "Cloud Galerie — ONYX Studio" },
      {
        property: "og:description",
        content: "Greife jederzeit auf alle deine generierten Slides und Entwürfe im Cloud-Archiv zu.",
      },
    ],
  }),
  component: GaleriePage,
});

function GaleriePage() {
  return <OnyxStudio routeTab="history" />;
}
