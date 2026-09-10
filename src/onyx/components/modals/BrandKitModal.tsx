import { Check } from "lucide-react";
import { ModalShell } from "./SlideEditModal";
import { CTA_OPTIONS, STYLE_ARCHETYPES } from "@/onyx/defaults";
import type { BrandKit } from "@/onyx/types";
import { cn } from "@/lib/utils";

interface BrandKitModalProps {
  brandKit: BrandKit;
  onChange: (patch: Partial<BrandKit>) => void;
  onClose: () => void;
}

export function BrandKitModal({ brandKit, onChange, onClose }: BrandKitModalProps) {
  return (
    <ModalShell
      title="Brand Kit & Design System"
      onClose={onClose}
      maxHeight="82vh"
      footer={
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="cryptox-orange-btn !py-2 !px-5 text-xs font-semibold"
          >
            Fertig & Schließen
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        <section className="space-y-2.5">
          <h3 className="mono-label text-zinc-400">Social Handle / Branding</h3>
          <input
            className="field-input"
            value={brandKit.handle}
            onChange={(e) => onChange({ handle: e.target.value })}
            placeholder="@deinhandle"
          />
          <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={brandKit.showHandle}
              onChange={(e) => onChange({ showHandle: e.target.checked })}
              className="h-4 w-4 rounded accent-orange-500"
            />
            <span>Auf allen Slides als dezenten Brand-Footer anzeigen</span>
          </label>
        </section>

        <section className="space-y-2.5">
          <h3 className="mono-label text-zinc-400">Stil-Archetyp & Farbharmonie</h3>
          <div className="grid grid-cols-2 gap-2.5">
            {STYLE_ARCHETYPES.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => onChange({ accentStyle: a.id, accentColorHex: a.hex })}
                className={cn(
                  "flex items-center gap-2.5 rounded-2xl border px-3.5 py-3 text-left text-xs font-medium transition-all",
                  brandKit.accentStyle === a.id
                    ? "border-orange-500/80 bg-orange-500/15 text-white shadow-[0_0_25px_-5px_rgba(255,77,23,0.4)]"
                    : "border-white/[0.08] bg-white/[0.02] text-zinc-400 hover:border-white/[0.18] hover:bg-white/[0.05] hover:text-zinc-200",
                )}
              >
                <span
                  className="h-4 w-4 rounded-full ring-2 ring-white/10 shrink-0"
                  style={{ backgroundColor: a.hex }}
                />
                <span className="truncate">{a.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-2.5">
          <h3 className="mono-label text-zinc-400">Canvas-Seitenverhältnis</h3>
          <div className="flex gap-2.5">
            {(["4:5", "1:1"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onChange({ aspectRatio: r })}
                className={cn(
                  "flex-1 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-all",
                  brandKit.aspectRatio === r
                    ? "border-orange-500/80 bg-orange-500/15 text-orange-400 shadow-[0_0_20px_-5px_rgba(255,77,23,0.4)]"
                    : "border-white/[0.08] bg-white/[0.02] text-zinc-400 hover:border-white/[0.16] hover:text-zinc-200",
                )}
              >
                {r === "4:5" ? "4:5 Portrait (Instagram Feed Standard)" : "1:1 Quadratisch"}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-2.5">
          <h3 className="mono-label text-zinc-400">Call-to-Action Text (Closing Slide)</h3>
          <div className="space-y-2">
            {CTA_OPTIONS.map((cta) => (
              <button
                key={cta}
                type="button"
                onClick={() => onChange({ ctaText: cta })}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-xs transition-all",
                  brandKit.ctaText === cta
                    ? "border-orange-500/70 bg-orange-500/10 text-white font-semibold shadow-[0_0_20px_-8px_rgba(255,77,23,0.3)]"
                    : "border-white/[0.08] bg-white/[0.02] text-zinc-400 hover:border-white/[0.16] hover:text-zinc-200",
                )}
              >
                {brandKit.ctaText === cta ? (
                  <Check className="h-4 w-4 text-orange-400 shrink-0" />
                ) : (
                  <span className="h-4 w-4 rounded-full border border-white/20 shrink-0" />
                )}
                <span>{cta}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </ModalShell>
  );
}
