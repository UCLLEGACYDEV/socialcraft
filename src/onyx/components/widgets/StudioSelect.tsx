import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StudioSelectOption {
  value: string;
  label: string;
  hint?: string;
}

interface StudioSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: StudioSelectOption[];
  ariaLabel: string;
  className?: string;
}

export function StudioSelect({ value, onChange, options, ariaLabel, className }: StudioSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-full border px-3.5 py-2.5 text-xs sm:text-sm font-medium transition-all duration-200",
          open
            ? "border-primary/50 bg-primary/10 text-foreground shadow-[0_0_24px_-8px_var(--primary)]"
            : "border-border bg-foreground/[0.04] text-foreground/90 hover:border-primary/40 hover:text-foreground",
        )}
      >
        <span className="truncate font-medium">{selected?.label ?? value}</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
            open ? "rotate-180 text-primary-bright" : "text-muted-foreground",
          )}
        />
      </button>

      <div
        role="listbox"
        aria-label={ariaLabel}
        className={cn(
          "absolute right-0 z-50 mt-2 w-full min-w-44 origin-top overflow-hidden rounded-xl border border-border bg-card/95 shadow-[0_24px_60px_-16px_rgba(0,0,0,0.8),0_0_0_1px_color-mix(in_oklab,var(--primary)_10%,transparent)] backdrop-blur-xl transition-all duration-150",
          open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-1 scale-[0.98] opacity-0",
        )}
      >
        <div className="p-1">
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs sm:text-sm transition-colors",
                  active
                    ? "bg-primary/15 font-semibold text-primary-bright"
                    : "text-foreground/80 hover:bg-foreground/[0.06] hover:text-foreground",
                )}
              >
                <span className="truncate font-medium">{opt.label}</span>
                <span className="flex items-center gap-1.5">
                  {opt.hint && (
                    <span className="text-[11px] font-medium tracking-wide text-muted-foreground">
                      {opt.hint}
                    </span>
                  )}
                  {active && <Check className="h-3.5 w-3.5 text-primary-bright" />}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
