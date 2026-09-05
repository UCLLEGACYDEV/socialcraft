import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Cpu, Loader2, Play, Sparkles, X } from "lucide-react";
import { parseBlock } from "../parse-prompt-block";
import { mockNameTopic } from "../mock-api";
import type { ApiSettings, ParsedCarousel, SeriesJob, JobStatus } from "../types";
import { SlideCard } from "./SlideCard";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<JobStatus, string> = {
  queued: "wartet",
  prompts: "liest ein",
  rendering: "rendert",
  done: "fertig",
  error: "Fehler",
  cancelled: "gestoppt",
};

const STATUS_CLASS: Record<JobStatus, string> = {
  queued: "bg-foreground/10 text-muted-foreground",
  prompts: "bg-chart-5/20 text-chart-5",
  rendering: "bg-primary/20 text-primary-bright animate-pulse",
  done: "bg-success/20 text-success",
  error: "bg-destructive/20 text-destructive",
  cancelled: "bg-foreground/10 text-muted-foreground",
};

interface SeriesQueueProps {
  queue: SeriesJob[];
  isRunning: boolean;
  onAddJobs: (carousels: ParsedCarousel[]) => void;
  onRunQueue: () => void;
  onStopQueue: () => void;
  onDeleteJob: (id: string) => void;
  onRenameJob: (id: string, topic: string) => void;
  onEditSlide: (jobId: string, slideId: string) => void;
  onRerollSlide: (jobId: string, slideId: string) => void;
  onDownloadSlide: (jobId: string, slideId: string) => void;
  settings: ApiSettings;
  onChangeSettings: (patch: Partial<ApiSettings>) => void;
}

export function SeriesQueue({
  queue,
  isRunning,
  onAddJobs,
  onRunQueue,
  onStopQueue,
  onDeleteJob,
  onRenameJob,
  onEditSlide,
  onRerollSlide,
  onDownloadSlide,
  settings,
  onChangeSettings,
}: SeriesQueueProps) {
  const [text, setText] = useState("");
  const [titles, setTitles] = useState<Record<number, string>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [naming, setNaming] = useState(false);

  const parsed = useMemo(() => parseBlock(text), [text]);

  const carouselsWithTitles = parsed.map((c, i) => ({ ...c, title: titles[i] ?? c.title }));

  const addAll = () => {
    if (!carouselsWithTitles.length) return;
    onAddJobs(carouselsWithTitles);
    setText("");
    setTitles({});
  };

  const nameAll = async () => {
    setNaming(true);
    const next: Record<number, string> = {};
    for (let i = 0; i < parsed.length; i++) {
      next[i] = await mockNameTopic(parsed[i]?.title ?? "");
    }
    setTitles((prev) => ({ ...prev, ...next }));
    setNaming(false);
  };

  return (
    <div className="space-y-5">
      <div className="cryptox-card relative overflow-hidden space-y-5 p-6 sm:p-7 border border-white/[0.08]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Serien-Generator</h1>
            <p className="text-xs text-zinc-400">
              Prompt-Blöcke einfügen, Titel prüfen, Warteschlange abarbeiten.
            </p>
          </div>
          {isRunning ? (
            <button
              type="button"
              onClick={onStopQueue}
              className="flex items-center gap-1.5 rounded-full border border-destructive/50 bg-destructive/15 px-4 py-2 text-xs font-semibold text-destructive"
            >
              <X className="h-3.5 w-3.5" /> Queue stoppen
            </button>
          ) : (
            <button
              type="button"
              onClick={onRunQueue}
              disabled={!queue.some((j) => j.status === "queued")}
              className="cryptox-orange-btn !py-2 !px-4 text-xs font-semibold"
            >
              <Play className="h-3.5 w-3.5" /> Queue starten
            </button>
          )}
        </div>

        {/* ── Model & Resolution Selector ─────────────────────────── */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-white/70 uppercase tracking-wider">
            <Cpu className="h-3.5 w-3.5 text-[#FF6A1F]" />
            <span>Render-Engine für diese Serie</span>
          </div>

          {/* Model Buttons */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-white/40 uppercase font-semibold tracking-wider">Modell</span>
            <div className="flex flex-wrap gap-1.5">
              {([
                { id: "nano-banana-2", label: "Nano-Banana 2" },
                { id: "nano-banana-pro", label: "Nano-Banana Pro" },
                { id: "gpt-image-2-text-to-image", label: "GPT Image 2" },
              ] as const).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onChangeSettings({ kieModel: m.id })}
                  className={cn(
                    "rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all",
                    settings.kieModel === m.id
                      ? "border-[#FF4D17] bg-[#FF4D17]/20 text-[#FF6A1F] shadow-[0_0_12px_-4px_#FF4D17]"
                      : "border-white/10 bg-white/[0.03] text-white/60 hover:text-white hover:border-white/20",
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Resolution — only for Nano-Banana models */}
          {settings.kieModel !== "gpt-image-2-text-to-image" && (
            <div className="space-y-1.5">
              <span className="text-[10px] text-white/40 uppercase font-semibold tracking-wider">Auflösung</span>
              <div className="flex gap-1.5">
                {(["1K", "2K", "4K"] as const).map((res) => (
                  <button
                    key={res}
                    type="button"
                    onClick={() => onChangeSettings({ kieResolution: res })}
                    className={cn(
                      "flex-1 rounded-xl border py-1.5 text-xs font-bold transition-all",
                      settings.kieResolution === res
                        ? "border-[#FF4D17] bg-[#FF4D17]/20 text-[#FF6A1F]"
                        : "border-white/10 bg-white/[0.03] text-white/60 hover:text-white",
                    )}
                  >
                    {res}
                    <span className="ml-1 text-[9px] opacity-60">
                      {res === "1K" ? "(Schnell)" : res === "2K" ? "(HD)" : "(Ultra)"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Status badge */}
          <div className="flex items-center gap-2 pt-1">
            <div className={cn(
              "h-2 w-2 rounded-full",
              settings.kieApiKey?.trim() ? "bg-emerald-400 shadow-[0_0_6px_#34d399]" : "bg-white/20"
            )} />
            <span className="text-[11px] text-white/50">
              {settings.kieApiKey?.trim()
                ? `KIE.AI verbunden · ${settings.kieModel} · ${settings.kieModel !== "gpt-image-2-text-to-image" ? settings.kieResolution : "Auto-Size"}`
                : "Kein KIE.AI Key — Serie läuft im Demo-Modus"}
            </span>
          </div>
        </div>

        <textarea
          rows={9}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"Thema: Disziplin\n\nSlide 1 – Hook\nPrompt text…\n\nSlide 2 – Konzept\nPrompt text…\n\n===\n\nThema: Fokus\nSlide 1 – Hook\n…"}
          className="field-input text-xs sm:text-sm leading-relaxed font-mono"
        />

        {carouselsWithTitles.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="mono-label text-zinc-400">
                {carouselsWithTitles.length === 1
                  ? "1 Karussell erkannt"
                  : `${carouselsWithTitles.length} Karussells erkannt`}
              </span>
              <button
                type="button"
                onClick={nameAll}
                disabled={naming}
                className="flex items-center gap-1.5 text-xs text-orange-400 hover:underline"
              >
                {naming ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                Alle von KI benennen
              </button>
            </div>
            {carouselsWithTitles.map((c, i) => (
              <div key={i} className="space-y-2 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3.5">
                <div className="flex items-center gap-2">
                  <input
                    className="field-input flex-1 !py-1.5"
                    value={c.title}
                    onChange={(e) => setTitles((p) => ({ ...p, [i]: e.target.value }))}
                    placeholder="Titel des Karussells"
                  />
                  <span className="shrink-0 rounded-full border border-orange-500/40 bg-orange-500/15 px-3 py-1 text-xs font-semibold text-orange-400">
                    {c.slides.length} Slides
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      const name = await mockNameTopic(c.title);
                      setTitles((p) => ({ ...p, [i]: name }));
                    }}
                    className="shrink-0 rounded-lg p-1.5 text-zinc-400 transition-colors hover:text-orange-400 hover:bg-white/[0.05]"
                    aria-label="KI-Titel"
                    title="KI-Titel optimieren"
                  >
                    <Sparkles className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {c.slides.map((s) => (
                    <span
                      key={s.slideNumber}
                      title={s.headline ? `${s.title}: ${s.headline}` : s.title}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-black/40 px-2.5 py-1 text-xs text-zinc-400"
                    >
                      <span className="font-semibold text-zinc-200">{s.slideNumber}</span>
                      <span className="truncate max-w-[150px] font-medium">{s.title}</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addAll}
              className="cryptox-orange-btn w-full !py-2.5 text-xs font-semibold"
            >
              {carouselsWithTitles.length === 1
                ? "In die Warteschlange legen"
                : `Alle ${carouselsWithTitles.length} Karussells in die Warteschlange legen`}
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {queue.length === 0 && (
          <p className="cryptox-card p-6 text-center text-xs text-zinc-400">
            Noch keine Jobs in der Warteschlange.
          </p>
        )}
        {queue.map((job) => {
          const open = expanded[job.id] ?? false;
          return (
            <div key={job.id} className="cryptox-card overflow-hidden p-0 border border-white/[0.08]">
              <div className="flex items-center gap-3 p-4">
                <button
                  type="button"
                  onClick={() => setExpanded((p) => ({ ...p, [job.id]: !open }))}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Details"
                >
                  {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                <input
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                  value={job.topic}
                  onChange={(e) => onRenameJob(job.id, e.target.value)}
                />
                <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                  {job.slidesDone}/{job.slidesTotal}
                </span>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    STATUS_CLASS[job.status],
                  )}
                >
                  {STATUS_LABEL[job.status]}
                </span>
                <button
                  type="button"
                  onClick={() => onDeleteJob(job.id)}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label="Job löschen"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {job.status === "rendering" && (
                <div className="h-1 w-full bg-foreground/10">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{
                      width: `${Math.round((job.slidesDone / Math.max(1, job.slidesTotal)) * 100)}%`,
                    }}
                  />
                </div>
              )}

              {open && job.slides && job.slides.length > 0 && (
                <div className="grid grid-cols-2 gap-2 border-t border-border p-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                  {job.slides.map((slide) => (
                    <SlideCard
                      key={slide.id}
                      slide={slide}
                      onReroll={() => onRerollSlide(job.id, slide.id)}
                      onEdit={() => onEditSlide(job.id, slide.id)}
                      onDownload={() => onDownloadSlide(job.id, slide.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
