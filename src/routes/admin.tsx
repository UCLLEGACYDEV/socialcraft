import { createFileRoute } from "@tanstack/react-router";
import { OnyxStudio } from "./index";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — ONYX Studio" },
      {
        name: "description",
        content: "Admin Control Center für Nutzerverwaltung, Credit-Guthaben und API-Schlüssel-Konfiguration.",
      },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  return <OnyxStudio initialView="admin" />;
}
