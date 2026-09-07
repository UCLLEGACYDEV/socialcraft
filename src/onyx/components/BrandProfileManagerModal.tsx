import React, { useState } from "react";
import {
  Shield,
  Layers,
  Plus,
  Check,
  Trash2,
  Edit2,
  X,
  Sparkles,
  Share2,
  Radio,
  ExternalLink,
  Tag,
  Palette,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import type { BrandProfile, SocialChannel } from "../types";
import { cn } from "@/lib/utils";

interface BrandProfileManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: BrandProfile[];
  activeProfileId: string;
  onSelectProfile: (id: string) => void;
  onUpdateProfiles: (profiles: BrandProfile[]) => void;
  channels: SocialChannel[];
  isAdmin: boolean;
}

const PRESET_COLORS = [
  { label: "Gold", hex: "#EAB308", class: "bg-yellow-500" },
  { label: "Orange", hex: "#F04A20", class: "bg-[#F04A20]" },
  { label: "Smaragd", hex: "#10B981", class: "bg-emerald-500" },
  { label: "Cyan", hex: "#06B6D4", class: "bg-cyan-500" },
  { label: "Indigo", hex: "#6366F1", class: "bg-indigo-500" },
  { label: "Violett", hex: "#8B5CF6", class: "bg-purple-500" },
  { label: "Rose", hex: "#F43F5E", class: "bg-rose-500" },
  { label: "Titan", hex: "#71717A", class: "bg-zinc-500" },
];

export const BrandProfileManagerModal: React.FC<BrandProfileManagerModalProps> = ({
  isOpen,
  onClose,
  profiles,
  activeProfileId,
  onSelectProfile,
  onUpdateProfiles,
  channels,
  isAdmin,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formAvatarUrl, setFormAvatarUrl] = useState("");
  const [formColor, setFormColor] = useState(PRESET_COLORS[0].hex);

  if (!isOpen) return null;

  const resetForm = () => {
    setFormName("");
    setFormSlug("");
    setFormDescription("");
    setFormAvatarUrl("");
    setFormColor(PRESET_COLORS[0].hex);
    setIsCreating(false);
    setEditingId(null);
  };

  const handleStartCreate = () => {
    resetForm();
    setIsCreating(true);
  };

  const handleStartEdit = (profile: BrandProfile) => {
    setFormName(profile.name);
    setFormSlug(profile.slug);
    setFormDescription(profile.description || "");
    setFormAvatarUrl(profile.avatarUrl || "");
    setFormColor(profile.color || PRESET_COLORS[0].hex);
    setEditingId(profile.id);
    setIsCreating(true);
  };

  const handleNameChange = (val: string) => {
    setFormName(val);
    if (!editingId) {
      // Auto-generate slug
      const generated = val
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "_")
        .replace(/^-+|-+$/g, "");
      setFormSlug(generated);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) {
      toast.error("Bitte einen Profilnamen eingeben (z. B. 'Zitate Tiger').");
      return;
    }

    const cleanSlug = formSlug.trim()
      ? formSlug.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_")
      : formName.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");

    // Check slug collision
    const slugExists = profiles.some(
      (p) => p.slug === cleanSlug && p.id !== editingId
    );
    if (slugExists) {
      toast.error(`Der Bezeichner '${cleanSlug}' wird bereits von einem anderen Profil verwendet.`);
      return;
    }

    if (editingId) {
      // Edit existing
      const updated = profiles.map((p) => {
        if (p.id === editingId) {
          return {
            ...p,
            name: formName.trim(),
            slug: cleanSlug,
            description: formDescription.trim(),
            avatarUrl: formAvatarUrl.trim() || undefined,
            color: formColor,
          };
        }
        return p;
      });
      onUpdateProfiles(updated);
      toast.success(`Profil „${formName}“ aktualisiert.`);
    } else {
      // Create new
      const newId = `profile-${cleanSlug}-${Date.now().toString(36)}`;
      const newProfile: BrandProfile = {
        id: newId,
        slug: cleanSlug,
        name: formName.trim(),
        description: formDescription.trim(),
        avatarUrl: formAvatarUrl.trim() || undefined,
        color: formColor,
        createdAt: new Date().toISOString(),
        isDefault: false,
      };
      onUpdateProfiles([...profiles, newProfile]);
      onSelectProfile(newId);
      toast.success(`Brand-Profil „${formName}“ erfolgreich erstellt & aktiviert! 🎉`);
    }

    resetForm();
  };

  const handleDeleteProfile = (profile: BrandProfile) => {
    if (profile.isDefault || profile.id === "profile-default") {
      toast.error("Das Standard-Hauptprofil kann nicht gelöscht werden.");
      return;
    }

    if (
      !window.confirm(
        `Möchtest du das Profil „${profile.name}“ wirklich löschen? Kanäle, die diesem Profil zugewiesen sind, werden nicht automatisch gelöscht, sondern können dem Hauptprofil neu zugeordnet werden.`
      )
    ) {
      return;
    }

    const remaining = profiles.filter((p) => p.id !== profile.id);
    onUpdateProfiles(remaining);

    if (activeProfileId === profile.id) {
      onSelectProfile(remaining[0]?.id || "profile-default");
    }

    toast.success(`Profil „${profile.name}“ gelöscht.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#0F0D15] border border-white/15 rounded-3xl shadow-[0_0_60px_rgba(240,74,32,0.15)] flex flex-col text-white overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-[0_0_20px_rgba(240,74,32,0.25)]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Brand- & Projekt-Profile</h3>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Admin Only
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Isoliere Kanäle & geplante Posts strikt nach Brand (z. B. 🐯 <strong>zitate_tiger</strong>)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-white p-2 rounded-xl hover:bg-white/10 cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Create / Edit Form Card */}
          {isCreating ? (
            <form onSubmit={handleSaveProfile} className="p-5 rounded-2xl bg-white/[0.04] border border-orange-500/30 space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orange-400" />
                  <h4 className="text-sm font-bold text-white">
                    {editingId ? "Brand-Profil bearbeiten" : "Neues Brand-Profil anlegen"}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-zinc-400 hover:text-white"
                >
                  Abbrechen
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Name des Profils *</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="z. B. Zitate Tiger"
                    className="w-full bg-black/50 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                    required
                    autoFocus
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Slug / Kennung (System) *</label>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="z. B. zitate_tiger"
                    className="w-full bg-black/50 border border-white/15 rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Nische / Beschreibung (optional)</label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="z. B. Daily Motivational Quotes & Mindset Reels"
                  className="w-full bg-black/50 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Avatar URL (optional)</span>
                  </label>
                  <input
                    type="url"
                    value={formAvatarUrl}
                    onChange={(e) => setFormAvatarUrl(e.target.value)}
                    placeholder="https://... Bild-URL"
                    className="w-full bg-black/50 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Akzentfarbe</span>
                  </label>
                  <div className="flex items-center gap-2 pt-1">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setFormColor(c.hex)}
                        className={cn(
                          "w-6 h-6 rounded-full transition-transform cursor-pointer border flex items-center justify-center",
                          c.class,
                          formColor === c.hex ? "scale-125 border-white ring-2 ring-white/40" : "border-transparent opacity-70 hover:opacity-100"
                        )}
                        title={c.label}
                      >
                        {formColor === c.hex && <Check className="w-3.5 h-3.5 text-black stroke-[3]" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3.5 py-1.5 text-xs text-zinc-400 hover:text-white"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="cryptox-orange-btn !py-2 !px-5 text-xs font-bold"
                >
                  {editingId ? "Änderungen speichern" : "Brand-Profil erstellen"}
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400">
                Verfügbare Profile ({profiles.length})
              </span>
              {isAdmin && (
                <button
                  type="button"
                  onClick={handleStartCreate}
                  className="cryptox-orange-btn !py-1.5 !px-3.5 text-xs font-bold flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Neues Profil anlegen</span>
                </button>
              )}
            </div>
          )}

          {/* List of Profiles */}
          <div className="space-y-3">
            {profiles.map((profile) => {
              const isActive = profile.id === activeProfileId;
              const profileChannelCount = channels.filter(
                (c) => (c.profileId || "profile-default") === profile.id
              ).length;

              return (
                <div
                  key={profile.id}
                  className={cn(
                    "p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4",
                    isActive
                      ? "bg-white/[0.08] border-orange-500/40 shadow-[0_0_20px_rgba(240,74,32,0.1)]"
                      : "bg-white/[0.02] border-white/10 hover:border-white/20"
                  )}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-white/20 shadow-inner overflow-hidden text-lg font-bold"
                      style={{
                        backgroundColor: profile.color ? `${profile.color}25` : "rgba(240,74,32,0.15)",
                        borderColor: profile.color || "#F04A20",
                        color: profile.color || "#F04A20",
                      }}
                    >
                      {profile.avatarUrl ? (
                        <img
                          src={profile.avatarUrl}
                          alt={profile.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{profile.name.slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{profile.name}</h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/10 text-zinc-300 border border-white/15">
                          @{profile.slug}
                        </span>
                        {profile.isDefault && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            Standard
                          </span>
                        )}
                        {isActive && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Aktiv
                          </span>
                        )}
                      </div>

                      {profile.description && (
                        <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">
                          {profile.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-1 text-[11px] text-zinc-500">
                        <span className="flex items-center gap-1 text-zinc-400">
                          <Share2 className="w-3 h-3 text-orange-400" />
                          <span>
                            {profileChannelCount === 0
                              ? "Keine Kanäle"
                              : `${profileChannelCount} Kanal${profileChannelCount > 1 ? "e" : ""}`}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {!isActive ? (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectProfile(profile.id);
                          toast.success(`Profil gewechselt zu: „${profile.name}“`);
                        }}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition cursor-pointer"
                      >
                        Aktivieren
                      </button>
                    ) : (
                      <div className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Aktuell aktiv</span>
                      </div>
                    )}

                    {isAdmin && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(profile)}
                          className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                          title="Profil bearbeiten"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {!profile.isDefault && (
                          <button
                            type="button"
                            onClick={() => handleDeleteProfile(profile)}
                            className="p-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition cursor-pointer"
                            title="Profil löschen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between shrink-0 bg-white/[0.01] text-xs text-zinc-500">
          <span>Profile isolieren Kanäle, Queue & Kalender vollständig voneinander.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-white/10 hover:bg-white/15 transition cursor-pointer"
          >
            Fertig
          </button>
        </div>
      </div>
    </div>
  );
};
