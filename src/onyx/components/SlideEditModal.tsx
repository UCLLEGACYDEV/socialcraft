import { useEffect, useState } from "react";
import { RefreshCw, Save, X } from "lucide-react";
import type { SlideContent } from "../types";

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
      <div className="grid gap-4 md:grid-cols-[220px_1fr]">
        <div className="overflow-hidden rounded-xl border border-border bg-foreground/[0.03]">
          {slide.imageUrl ? (
            <img src={slide.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex aspect-4/5 items-center justify-center text-xs text-muted-foreground">
              kein Bild
            </div>
          )}
        </div>
        <div className="space-y-3">
          <label className="block space-y-1.5">
            <span className="mono-label">Headline</span>
            <input className="field-input" value={headline} onChange={(e) => setHeadline(e.target.value)} />
          </label>
          <label className="block space-y-1.5">
            <span className="mono-label">Subtext</span>
            <input className="field-input" value={subtext} onChange={(e) => setSubtext(e.target.value)} />
          </label>
          <label className="block space-y-1.5">
            <span className="mono-label">Visual Prompt</span>
            <textarea
              rows={7}
              className="field-input font-mono text-[11px]"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </label>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={() => onSave(patch)}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs hover:bg-foreground/[0.06]"
        >
          <Save className="h-3.5 w-3.5" /> Nur Text speichern
        </button>
        <button
          type="button"
          onClick={() => onRegenerate(patch)}
          className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary-bright"
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
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxHeight?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <div
        className="glass-card-hero flex w-full max-w-3xl flex-col overflow-hidden bg-card"
        style={{ maxHeight }}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="font-mono text-sm font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Schließen"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <div className="border-t border-border px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}
