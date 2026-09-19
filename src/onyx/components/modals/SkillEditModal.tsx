import React, { useState } from "react";
import { Sparkles, X, Shield, AlertCircle, Save } from "lucide-react";
import { toast } from "sonner";
import type { AiSkill } from "@/onyx/types";

interface SkillEditModalProps {
  skill?: AiSkill | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (skill: AiSkill) => void;
}

export function SkillEditModal({ skill, isOpen, onClose, onSave }: SkillEditModalProps) {
  const [name, setName] = useState(skill?.name || "");
  const [description, setDescription] = useState(skill?.description || "");
  const [tone, setTone] = useState(skill?.tone || "Provokant & Direkt");
  const [targetAudience, setTargetAudience] = useState(skill?.targetAudience || "");
  const [systemPrompt, setSystemPrompt] = useState(
    skill?.systemPrompt ||
      "Schreibe als renommierter Experte. Verwende klare Business-Prinzipien, nenne messbare Resultate, vermeide leere Phrasen. Baue auf das PAS-Framework (Problem, Agitation, Solution)."
  );
  const [forbiddenWordsStr, setForbiddenWordsStr] = useState(
    (skill?.forbiddenWords || []).join(", ")
  );
  const [ctaStyle, setCtaStyle] = useState(
    skill?.ctaStyle || "Speichere dir diesen Post für später ab 📌"
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Bitte gib dem KI-Skill einen Namen.");
      return;
    }
    if (!systemPrompt.trim()) {
      toast.error("Bitte gib eine System-Anweisung für den KI-Skill ein.");
      return;
    }

    const forbiddenWords = forbiddenWordsStr
      .split(",")
      .map((w) => w.trim())
      .filter(Boolean);

    const saved: AiSkill = {
      id: skill?.id || `skill-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      description: description.trim(),
      tone: tone.trim(),
      targetAudience: targetAudience.trim(),
      systemPrompt: systemPrompt.trim(),
      forbiddenWords,
      ctaStyle: ctaStyle.trim(),
      isPreset: false,
      updatedAt: new Date().toISOString(),
      createdAt: skill?.createdAt || new Date().toISOString(),
    };

    onSave(saved);
    toast.success(`KI-Skill „${saved.name}“ erfolgreich gespeichert! ✨`);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in-50"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-3xl border border-white/15 bg-[#0C0912] p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-[#FF4D17]/15 border border-[#FF4D17]/30 flex items-center justify-center text-[#FF4D17]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {skill ? `KI-Skill bearbeiten: ${skill.name}` : "Neuen KI-Skill erstellen"}
              </h2>
              <p className="text-xs text-zinc-400">
                Definiere Tonalität, Copywriting-Frameworks und System-Anweisungen für dein KI-Modell.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block">
                Name des KI-Skills *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z. B. B2B LinkedIn Thought Leader"
                className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-[#FF4D17] outline-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block">
                Tonalität / Stil
              </label>
              <input
                type="text"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                placeholder="z. B. Autoritär, Direkt, Faktenbasiert"
                className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-[#FF4D17] outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block">
              Kurzbeschreibung
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="z. B. Für C-Level Zielgruppen, Fokus auf messbare B2B-Ergebnisse"
              className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-[#FF4D17] outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block">
                System-Anweisung / Copywriting-Prompt *
              </label>
              <span className="text-[10px] text-zinc-500">Direktive an das LLM</span>
            </div>
            <textarea
              rows={4}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Erkläre dem KI-Modell genau, welche Rollenverteilung, Satzlängen und Hebel es nutzen soll..."
              className="w-full rounded-xl border border-white/15 bg-black/40 p-3 text-xs text-white placeholder-zinc-500 focus:border-[#FF4D17] outline-none leading-relaxed"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block">
                Verbotene Wörter (Kommagetrennt)
              </label>
              <input
                type="text"
                value={forbiddenWordsStr}
                onChange={(e) => setForbiddenWordsStr(e.target.value)}
                placeholder="revolutionär, game-changer, blablabla"
                className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-[#FF4D17] outline-none"
              />
              <p className="text-[10px] text-zinc-500">Werden im Prompt strikt untersagt.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block">
                Standard Call-to-Action (CTA)
              </label>
              <input
                type="text"
                value={ctaStyle}
                onChange={(e) => setCtaStyle(e.target.value)}
                placeholder="Speichere dir diesen Post für später ab 📌"
                className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-[#FF4D17] outline-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#FF4D17] hover:bg-[#FF6A1F] text-xs font-bold text-white shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>Skill speichern</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
