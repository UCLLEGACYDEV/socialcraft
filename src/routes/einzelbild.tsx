import { createFileRoute } from "@tanstack/react-router";
import { OnyxStudio } from "./index";

export const Route = createFileRoute("/einzelbild")({
  head: () => ({
    meta: [
      { title: "Einzelbild Generator — ONYX Studio" },
      {
        name: "description",
        content:
          "Direkt-Prompt Einzelbild-Generator mit KI-Klon-Fusion, Seitenverhältnissen (4:5, 1:1, 16:9, 9:16) und S4-Cloud-Archiv.",
      },
      { property: "og:title", content: "Einzelbild Generator — ONYX Studio" },
      {
        property: "og:description",
        content: "Generiere gezielt individuelle Einzelbilder mit deiner KI-Persona und Stil-Vorgaben.",
      },
    ],
  }),
  component: EinzelbildPage,
});

function EinzelbildPage() {
  return <OnyxStudio routeTab="direct-prompt" />;
}
