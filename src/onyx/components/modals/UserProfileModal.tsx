import { useState } from "react";
import {
  Check,
  Cloud,
  Copy,
  ExternalLink,
  HardDrive,
  Key,
  Lock,
  LogOut,
  Mail,
  RefreshCw,
  Shield,
  Sparkles,
  User as UserIcon,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import type { User } from "@/onyx/auth";
import { testCloudConnection, getUserS4Folder } from "@/onyx/s4-storage";
import { DEFAULT_ADMIN_CREDENTIALS, signOutUser } from "@/onyx/supabase-auth";
import { cn } from "@/lib/utils";

interface UserProfileModalProps {
  user: User;
  onClose: () => void;
  onUserUpdated: (user: User) => void;
  onLogout: () => void;
}

export function UserProfileModal({
  user,
  onClose,
  onUserUpdated,
  onLogout,
}: UserProfileModalProps) {
  const [testingCloud, setTestingCloud] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const cloudFolder = getUserS4Folder(user);

  const handleCopy = (text: string, label: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.success(`${label} kopiert!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleTestCloud = async () => {
    setTestingCloud(true);
    setCloudStatus("Teste Verbindung zum Cloud-Speicher…");
    try {
      const res = await testCloudConnection();
      if (res.success) {
        setCloudStatus(`Verbunden! Bucket: socialgrow (${cloudFolder})`);
        toast.success("Cloud-Speicher erreichbar & Ordner verifiziert!");
      } else {
        setCloudStatus(`Verbindungsfehler: ${res.message}`);
        toast.error(`Cloud Fehler: ${res.message}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Fehler";
      setCloudStatus(`Fehler: ${msg}`);
      toast.error(msg);
    } finally {
      setTestingCloud(false);
    }
  };

  const handleLogoutClick = async () => {
    await signOutUser();
    toast.success("Erfolgreich abgemeldet");
    onLogout();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="cryptox-card relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-white/[0.1] bg-[#110F17]/95 p-6 sm:p-7 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.9)] space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="h-12 w-12 rounded-full object-cover border-2 border-orange-500/60 shadow-[0_0_15px_rgba(255,77,23,0.4)]"
              />
              <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-[#110F17]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{user.name}</h3>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border",
                    user.role === "admin"
                      ? "border-orange-500/60 bg-orange-500/15 text-orange-400"
                      : "border-purple-500/60 bg-purple-500/15 text-purple-400"
                  )}
                >
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-zinc-400">{user.email}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:bg-white/[0.08] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Credentials / Login Access Info Card */}
        <div className="rounded-xl border border-orange-500/30 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-orange-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                Admin-Zugangsdaten (Supabase & Lokal)
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono">Bereit zum Login</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/40 p-2.5">
              <div className="space-y-0.5 truncate pr-2">
                <span className="text-[10px] text-zinc-400 block">E-Mail-Adresse</span>
                <span className="font-mono text-zinc-200 truncate">{DEFAULT_ADMIN_CREDENTIALS.email}</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(DEFAULT_ADMIN_CREDENTIALS.email, "E-Mail")}
                className="text-orange-400 hover:text-orange-300 p-1 shrink-0"
                title="Kopieren"
              >
                {copiedField === "E-Mail" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/40 p-2.5">
              <div className="space-y-0.5 truncate pr-2">
                <span className="text-[10px] text-zinc-400 block">Passwort</span>
                <span className="font-mono text-zinc-200 truncate">{DEFAULT_ADMIN_CREDENTIALS.password}</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(DEFAULT_ADMIN_CREDENTIALS.password, "Passwort")}
                className="text-orange-400 hover:text-orange-300 p-1 shrink-0"
                title="Kopieren"
              >
                {copiedField === "Passwort" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Cloud-Speicher Übersicht */}
        <div className="rounded-xl border border-white/[0.08] bg-black/40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cloud className="h-4 w-4 text-orange-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                Cloud-Speicher Sync (Bucket: socialgrow)
              </span>
            </div>
            <button
              type="button"
              onClick={handleTestCloud}
              disabled={testingCloud}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-zinc-300 hover:bg-white/10"
            >
              <RefreshCw className={cn("h-3 w-3", testingCloud && "animate-spin text-orange-400")} />
              <span>Verbindung prüfen</span>
            </button>
          </div>

          <div className="space-y-1.5 text-xs text-zinc-300 font-mono bg-black/50 p-2.5 rounded-lg border border-white/[0.06]">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Zielordner:</span>
              <span className="text-orange-300 font-bold">{cloudFolder}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Endpoint:</span>
              <span className="text-zinc-300">socialgrow.s3.g.megas4.com</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Auto-Save:</span>
              <span className="text-emerald-400 font-semibold">Aktiv (Jeder Slide-Render wird gesichert)</span>
            </div>
          </div>

          {cloudStatus && (
            <p className="text-[11px] text-zinc-400 leading-snug">
              {cloudStatus}
            </p>
          )}
        </div>

        {/* Supabase Schema Information */}
        <div className="rounded-xl border border-white/[0.08] bg-black/40 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                Supabase Tabellen (Isoliert)
              </span>
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold">socialcraft_*</span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Alle Daten für Profile, Karussells und Bilder liegen in separaten Tabellen mit Präfix <code className="text-orange-300">socialcraft_</code>, sodass deine anderen Projekte in Supabase unberührt bleiben.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.08]">
          <button
            type="button"
            onClick={handleLogoutClick}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-destructive py-2 px-3 rounded-lg hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" /> Abmelden
          </button>

          <button
            type="button"
            onClick={onClose}
            className="cryptox-orange-btn !py-2 !px-5 text-xs font-semibold"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}
