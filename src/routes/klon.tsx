import { createFileRoute } from "@tanstack/react-router";
import { OnyxStudio } from "./index";

export const Route = createFileRoute("/klon")({
  head: () => ({
    meta: [
      { title: "KI Clone Studio — ONYX Studio" },
      {
        name: "description",
        content:
          "Erstelle und verwalte deine visuelle KI-Persona. Trainiere Gesichter, Mimik und Stile für fotorealistische Brand-Bilder.",
      },
      { property: "og:title", content: "KI Clone Studio — ONYX Studio" },
      {
        property: "og:description",
        content: "Fotorealistische KI-Persona für deine Personal Brand ohne aufwendige Fotoshootings.",
      },
    ],
  }),
  component: KlonPage,
});

function KlonPage() {
  return <OnyxStudio routeTab="ai-clone" />;
}
