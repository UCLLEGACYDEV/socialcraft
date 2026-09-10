import { useEffect, useState } from "react";
import { RefreshCw, Save, X } from "lucide-react";
import type { SlideContent } from "@/onyx/types";

interface SlideEditModalProps {
  slide: SlideContent;
  onClose: () => void;
  onSave: (patch: { headline: string; subtext: string; visualPrompt: string }) => void;
  onRegenerate: (patch: { headline: string; subtext: string; visualPrompt: string }) => void;
}

export function SlideEditModal({ slide, onClose, onSave, onRegenerate }: SlideEditModalProps) {
  const [headline, setHeadline] = useState(slide.headline);
  const [subtext, setSubtext] = useState(slide.subtext);
  const [prompt, setPrompt] = useState(slide.visualPrompt);

  useEffect(() => {
    setHeadline(slide.headline);
    setSubtext(slide.subtext);
    setPrompt(slide.visualPrompt);
  }, [slide]);

  const patch = { headline, subtext, visualPrompt: prompt };

  return (
    <ModalShell title={`Slide ${slide.slideNumber} · ${slide.roleLabel}`} onClose={onClose}>
      <div className="grid gap-5 md:grid-cols-[240px_1fr]">
        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-black/40 shadow-inner">
          {slide.imageUrl ? (
            <img src={slide.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex aspect-4/5 items-center justify-center text-xs text-zinc-500">
              kein Bild
            </div>
          )}
        </div>
        <div className="space-y-3.5">
          <label className="block space-y-1.5">
            <span className="mono-label text-zinc-400">Headline</span>
            <input className="field-input" value={headline} onChange={(e) => setHeadline(e.target.value)} />
          </label>
          <label className="block space-y-1.5">
            <span className="mono-label text-zinc-400">Subtext</span>
            <input className="field-input" value={subtext} onChange={(e) => setSubtext(e.target.value)} />
          </label>
          <label className="block space-y-1.5">
            <span className="mono-label text-zinc-400">Visual Prompt</span>
            <textarea
              rows={7}
              className="field-input text-xs sm:text-sm leading-relaxed"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </label>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap justify-end gap-2.5 pt-4 border-t border-white/[0.08]">
        <button
          type="button"
          onClick={() => onSave(patch)}
          className="flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-2.5 text-xs font-semibold text-zinc-200 transition-colors hover:bg-white/[0.08] hover:text-white"
        >
          <Save className="h-3.5 w-3.5" /> Nur Text speichern
        </button>
        <button
          type="button"
          onClick={() => onRegenerate(patch)}
          className="cryptox-orange-btn !py-2.5 !px-4 text-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Neu generieren & ersetzen
        </button>
      </div>
    </ModalShell>
  );
}

export function ModalShell({
  title,
  onClose,
  children,
  footer,
  maxHeight = "88vh",
  maxWidth = "max-w-3xl",
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxHeight?: string;
  maxWidth?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xl animate-in fade-in duration-200">
      <div
        className={`cryptox-card-elevated relative flex w-full ${maxWidth} flex-col overflow-hidden rounded-3xl`}
        style={{ maxHeight }}
      >
        <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4 bg-white/[0.02]">
          <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.04] text-zinc-400 transition-colors hover:bg-white/[0.1] hover:text-white hover:border-white/[0.2]"
            aria-label="Schließen"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 text-zinc-200">{children}</div>
        {footer && <div className="border-t border-white/[0.08] px-6 py-4 bg-white/[0.02]">{footer}</div>}
      </div>
    </div>
  );
}
