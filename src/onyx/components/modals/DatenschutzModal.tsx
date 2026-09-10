import { useState } from "react";
import {
  ShieldCheck,
  Lock,
  EyeOff,
  Trash2,
  CheckCircle2,
  Server,
  FileText,
  AlertTriangle,
  Key,
  Database,
} from "lucide-react";
import { ModalShell } from "./SlideEditModal";
import { toast } from "sonner";

interface DatenschutzModalProps {
  onClose: () => void;
  onClearAllData?: () => void;
}

export function DatenschutzModal({ onClose, onClearAllData }: DatenschutzModalProps) {
  const [activeTab, setActiveTab] = useState<"security" | "dsgvo" | "storage">("security");
  const [confirmWipe, setConfirmWipe] = useState(false);

  const handleWipeAll = () => {
    if (!confirmWipe) {
      setConfirmWipe(true);
      return;
    }

    try {
      if (typeof window !== "undefined") {
        window.localStorage.clear();
        window.sessionStorage.clear();
        // Clear identity cookies
        document.cookie = "onyx_identity=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      }
      if (onClearAllData) {
        onClearAllData();
      }
      toast.success("Alle lokalen Daten, Personas und Cache-Einträge wurden gelöscht! 🛡️");
      setTimeout(() => {
        if (typeof window !== "undefined") {
          window.location.reload();
        }
      }, 1000);
    } catch {
      toast.error("Fehler beim Löschen der Daten");
    }
  };

  return (
    <ModalShell
      title="Datenschutz & Sicherheits-Center (DSGVO)"
      onClose={onClose}
      maxHeight="85vh"
    >
      <div className="flex flex-col gap-6 text-zinc-300">
        {/* Top Badges / Live Security Status */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 flex flex-col items-center text-center">
            <ShieldCheck className="h-5 w-5 text-emerald-400 mb-1" />
            <span className="text-[11px] font-bold text-white">TLS 256-Bit</span>
            <span className="text-[9px] text-emerald-300/80">Ende-zu-Ende verschlüsselt</span>
          </div>
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 flex flex-col items-center text-center">
            <Lock className="h-5 w-5 text-blue-400 mb-1" />
            <span className="text-[11px] font-bold text-white">User-Isolation</span>
            <span className="text-[9px] text-blue-300/80">Strikte Ordner-Trennung</span>
          </div>
          <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-3 flex flex-col items-center text-center">
            <EyeOff className="h-5 w-5 text-purple-400 mb-1" />
            <span className="text-[11px] font-bold text-white">Zero Tracking</span>
            <span className="text-[9px] text-purple-300/80">Keine Werbe-Tracker</span>
          </div>
          <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-3 flex flex-col items-center text-center">
            <Database className="h-5 w-5 text-orange-400 mb-1" />
            <span className="text-[11px] font-bold text-white">DSGVO Konform</span>
            <span className="text-[9px] text-orange-300/80">Art. 13/14 DSGVO konform</span>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("security")}
            className={`flex-1 py-2 px-3 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === "security"
                ? "bg-[#FF4D17] text-white shadow-[0_0_12px_rgba(255,77,23,0.4)]"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            🛡️ Sicherheits-Architektur
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("dsgvo")}
            className={`flex-1 py-2 px-3 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === "dsgvo"
                ? "bg-[#FF4D17] text-white shadow-[0_0_12px_rgba(255,77,23,0.4)]"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            📋 Datenschutzerklärung
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("storage")}
            className={`flex-1 py-2 px-3 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === "storage"
                ? "bg-[#FF4D17] text-white shadow-[0_0_12px_rgba(255,77,23,0.4)]"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            🗑️ Datenverwaltung & Löschung
          </button>
        </div>

        {/* Tab 1: Security Architecture */}
        {activeTab === "security" && (
          <div className="space-y-4 text-xs leading-relaxed">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Server className="h-4 w-4 text-[#FF6A1F]" />
                Server- & Manipulationsschutz (Anti-Hacking Hardening)
              </h4>
              <p className="text-zinc-300">
                Socialcraft nutzt mehrstufige Sicherheitsmechanismen auf Netzwerk- und Anwendungsebene, um Ihre Daten und Workspaces vor unbefugten Zugriffen, Injection-Angriffen und Datenlecks zu schützen:
              </p>
              <ul className="space-y-2 text-zinc-300 pl-1">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Content Security Policy (CSP) & X-Frame-Options:</strong>
                    {" "}Verhindert Clickjacking, CSS-Injection und das Einbetten der Web-App in bösartige iFrames Dritter.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Strict Path Traversal & Sanitization:</strong>
                    {" "}Alle Speicherzugriffe und Bild-Schlüssel werden rekursiv bereinigt (Schutz vor Directory-Traversal, Null-Byte-Poisoning und unberechtigten Ordnerzugriffen).
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Strikte Benutzerdaten-Isolation:</strong>
                    {" "}Jeder Nutzer verfügt über einen kryptografisch isolierten Namensraum. Fremde Nutzer können weder auf Ihre KI-Klone noch auf Ihre Karussell-Bilder zugreifen.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">HSTS & TLS-256 Transportverschlüsselung:</strong>
                    {" "}Alle Anfragen werden ausschließlich über verschlüsselte HTTPS-Verbindungen mit modernen Verschlüsselungs-Suiten übertragen.
                  </div>
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Key className="h-4 w-4 text-orange-400" />
                Sichere Handhabung von API-Schlüsseln
              </h4>
              <p className="text-zinc-300">
                Ihre KI-API-Schlüssel (Kling, NanoGPT, S4 Storage etc.) werden standardmäßig lokal in Ihrem Browser verwaltet und niemals ungefragt an Drittparteien weitergegeben. Die Kommunikation mit KI-Generatoren erfolgt ausschließlich über autorisierte Endpunkte.
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: DSGVO / GDPR */}
        {activeTab === "dsgvo" && (
          <div className="space-y-4 text-xs leading-relaxed max-h-[50vh] overflow-y-auto pr-1">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#FF6A1F]" />
                Datenschutzerklärung (EU-DSGVO)
              </h4>
              <p className="text-zinc-300">
                Wir nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Nachfolgend informieren wir Sie über Art, Umfang und Zweck der Verarbeitung personenbezogener Daten.
              </p>

              <div className="space-y-2.5 pt-2">
                <div>
                  <strong className="text-white block">1. Verantwortlicher & Datensparsamkeit</strong>
                  <span>
                    Socialcraft Studio ist nach dem Prinzip der Datensparsamkeit (Privacy by Design) aufgebaut. Wir erheben nur die Daten, die zwingend zur Generierung Ihrer Social-Media-Inhalte erforderlich sind.
                  </span>
                </div>

                <div>
                  <strong className="text-white block">2. Verarbeitung von KI-Klon- & Bilddaten</strong>
                  <span>
                    Hochgeladene Porträtfotos für die KI-Klon-Analyse werden ausschließlich zur Extraktion der visuellen Stil- und Gesichtsmerkmale verarbeitet. Die Daten werden niemals zum öffentlichen Training generischer KI-Modelle verwendet.
                  </span>
                </div>

                <div>
                  <strong className="text-white block">3. Ihre Rechte (Art. 15–21 DSGVO)</strong>
                  <ul className="list-disc list-inside space-y-1 text-zinc-300 pt-1">
                    <li><strong className="text-zinc-200">Recht auf Auskunft (Art. 15 DSGVO):</strong> Sie können jederzeit Auskunft über Ihre gespeicherten Daten verlangen.</li>
                    <li><strong className="text-zinc-200">Recht auf Berichtigung (Art. 16 DSGVO):</strong> Unrichtige Daten können sofort angepasst werden.</li>
                    <li><strong className="text-zinc-200">Recht auf Löschung (Art. 17 DSGVO):</strong> Recht auf "Vergessenwerden" – Sie können alle Daten mit einem Klick vollständig löschen.</li>
                    <li><strong className="text-zinc-200">Recht auf Datenübertragbarkeit (Art. 20 DSGVO):</strong> Exportieren Sie Ihre Karussells und Prompts als ZIP oder JSON.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Storage & 1-Click Wipe */}
        {activeTab === "storage" && (
          <div className="space-y-4 text-xs leading-relaxed">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="h-4 w-4 text-[#FF6A1F]" />
                Lokal gespeicherte Workspace-Daten
              </h4>
              <p className="text-zinc-300">
                Ihr Browser speichert temporäre Arbeitsdaten wie Entwürfe, Brand-Kit-Farben, Klon-Profile und API-Konfigurationen im sicheren Browser-LocalStorage.
              </p>
            </div>

            {/* Red Danger Zone: 1-Click Wipe */}
            <div className="rounded-xl border border-red-500/30 bg-red-500/[0.06] p-4 space-y-3">
              <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>Recht auf Vergessenwerden: Daten sofort vernichten</span>
              </div>
              <p className="text-zinc-300">
                Mit dieser Aktion löschen Sie sofort alle lokalen Sitzungen, Browser-Cookies, Klon-Profile, Galerie-Caches und gespeicherten Einstellungen. Diese Aktion kann nicht rückgängig gemacht werden.
              </p>

              <div className="pt-2">
                {!confirmWipe ? (
                  <button
                    type="button"
                    onClick={() => setConfirmWipe(true)}
                    className="flex items-center gap-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 px-4 py-2 text-xs font-bold text-red-300 hover:text-white transition-all cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Alle Daten & Caches unwiderruflich löschen</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleWipeAll}
                      className="flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-red-600/30 transition-all cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>JA, jetzt alles endgültig löschen</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmWipe(false)}
                      className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
                    >
                      Abbrechen
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="flex items-center justify-between border-t border-white/10 pt-4 text-[11px] text-zinc-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            Socialcraft Security Shield v2.4 aktiv
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            Schließen
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
