import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface HeroChip {
  label: string;
  value: string;
  side: "left" | "right";
  top: string;
}

interface StudioHeroProps {
  eyebrow?: string;
  title: [string, string];
  subtitle: string;
  ctaLabel: string;
  onCta: () => void;
  ctaDisabled?: boolean;
  chips: HeroChip[];
}

export function StudioHero({
  eyebrow,
  title,
  subtitle,
  ctaLabel,
  onCta,
  ctaDisabled = false,
  chips,
}: StudioHeroProps) {
  return (
    <section className="relative isolate pb-4 pt-10 sm:pt-14">
      <div className="ember-rings" aria-hidden="true" />

      {chips.map((chip) => (
        <div
          key={chip.label}
          style={{ top: chip.top }}
          className={cn(
            "glass-card absolute hidden items-center gap-2 px-3 py-2 lg:flex",
            chip.side === "left" ? "left-0 xl:left-8" : "right-0 xl:right-8",
          )}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 font-mono text-[10px] font-bold text-primary-bright">
            {chip.label.slice(0, 1)}
          </span>
          <span className="text-[11px] leading-tight">
            <span className="block font-medium">{chip.label}</span>
            <span className="block font-mono text-[10px] text-muted-foreground">{chip.value}</span>
          </span>
        </div>
      ))}

      <div className="relative mx-auto max-w-2xl text-center">
        {eyebrow && <p className="mono-label mb-3">{eyebrow}</p>}
        <h1 className="text-balance text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl">
          {title[0]}
          <br />
          {title[1]}
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-sm text-muted-foreground">{subtitle}</p>
        <button
          type="button"
          onClick={onCta}
          disabled={ctaDisabled}
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary py-1.5 pl-6 pr-1.5 text-sm font-semibold text-primary-foreground shadow-[0_16px_40px_-16px_var(--primary)] transition-colors hover:bg-primary-bright disabled:cursor-not-allowed disabled:opacity-40"
        >
          {ctaLabel}
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/20">
            <ArrowRight className="h-4 w-4" />
          </span>
        </button>
      </div>
    </section>
  );
}
