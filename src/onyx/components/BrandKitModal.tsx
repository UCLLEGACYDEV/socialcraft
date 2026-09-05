import { Check } from "lucide-react";
import { ModalShell } from "./SlideEditModal";
import { CTA_OPTIONS, STYLE_ARCHETYPES } from "../defaults";
import type { BrandKit } from "../types";
import { cn } from "@/lib/utils";

interface BrandKitModalProps {
  brandKit: BrandKit;
  onChange: (patch: Partial<BrandKit>) => void;
  onClose: () => void;
}

export function BrandKitModal({ brandKit, onChange, onClose }: BrandKitModalProps) {
  return (
    <ModalShell
      title="Brand Kit"
      onClose={onClose}
      maxHeight="80vh"
      footer={
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary-bright"
          >
            Fertig
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        <section className="space-y-2">
          <h3 className="mono-label">Handle</h3>
          <input
            className="field-input"
            value={brandKit.handle}
            onChange={(e) => onChange({ handle: e.target.value })}
          />
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={brandKit.showHandle}
              onChange={(e) => onChange({ showHandle: e.target.checked })}
              className="h-3.5 w-3.5 accent-[var(--primary)]"
            />
            Auf Slides anzeigen
          </label>
        </section>

        <section className="space-y-2">
          <h3 className="mono-label">Stil-Archetyp</h3>
          <div className="grid grid-cols-2 gap-2">
            {STYLE_ARCHETYPES.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => onChange({ accentStyle: a.id, accentColorHex: a.hex })}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs transition-colors",
                  brandKit.accentStyle === a.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:bg-foreground/[0.04]",
                )}
              >
                <span
                  className="h-4 w-4 rounded-full ring-1 ring-border"
                  style={{ backgroundColor: a.hex }}
                />
                {a.label}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="mono-label">Format</h3>
          <div className="flex gap-2">
            {(["4:5", "1:1"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onChange({ aspectRatio: r })}
                className={cn(
                  "rounded-lg border px-4 py-2 text-xs",
                  brandKit.aspectRatio === r
                    ? "border-primary bg-primary/15 text-primary-bright"
                    : "border-border text-muted-foreground",
                )}
              >
                {r === "4:5" ? "4:5 Portrait" : "1:1 Quadrat"}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="mono-label">CTA-Text</h3>
          <div className="space-y-1.5">
            {CTA_OPTIONS.map((cta) => (
              <button
                key={cta}
                type="button"
                onClick={() => onChange({ ctaText: cta })}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs",
                  brandKit.ctaText === cta
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {brandKit.ctaText === cta && <Check className="h-3.5 w-3.5 text-primary-bright" />}
                {cta}
              </button>
            ))}
          </div>
        </section>
      </div>
    </ModalShell>
  );
}
