import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Loader2, Play, Sparkles, X } from "lucide-react";
import { parseBlock } from "../parse-prompt-block";
import { mockNameTopic } from "../mock-api";
import type { ParsedCarousel, SeriesJob, JobStatus } from "../types";
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
      <div className="glass-card-hero space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">Serie</h1>
            <p className="text-xs text-muted-foreground">
              Prompt-Blöcke einfügen, Titel prüfen, Warteschlange abarbeiten.
            </p>
          </div>
          {isRunning ? (
            <button
              type="button"
              onClick={onStopQueue}
              className="flex items-center gap-1.5 rounded-lg border border-destructive/50 bg-destructive/15 px-3 py-2 text-xs font-medium text-destructive"
            >
              <X className="h-3.5 w-3.5" /> Queue stoppen
            </button>
          ) : (
            <button
              type="button"
              onClick={onRunQueue}
              disabled={!queue.some((j) => j.status === "queued")}
              className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-40"
            >
              <Play className="h-3.5 w-3.5" /> Queue starten
            </button>
          )}
        </div>

        <textarea
          rows={9}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"Thema: Disziplin\n\nSlide 1 – Hook\nPrompt text…\n\nSlide 2 – Konzept\nPrompt text…\n\n===\n\nThema: Fokus\nSlide 1 – Hook\n…"}
          className="field-input font-mono text-[11px] leading-relaxed"
        />

        {carouselsWithTitles.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="mono-label">{carouselsWithTitles.length} Karussells erkannt</span>
              <button
                type="button"
                onClick={nameAll}
                disabled={naming}
                className="flex items-center gap-1.5 text-xs text-primary-bright hover:underline"
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
              <div key={i} className="flex items-center gap-2 rounded-lg border border-border p-2">
                <input
                  className="field-input flex-1"
                  value={c.title}
                  onChange={(e) => setTitles((p) => ({ ...p, [i]: e.target.value }))}
                />
                <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                  {c.slides.length} Slides
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    const name = await mockNameTopic(c.title);
                    setTitles((p) => ({ ...p, [i]: name }));
                  }}
                  className="shrink-0 text-primary-bright"
                  aria-label="KI-Titel"
                >
                  <Sparkles className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addAll}
              className="w-full rounded-lg border border-border bg-foreground/[0.06] px-3 py-2 text-xs font-medium hover:bg-foreground/10"
            >
              {carouselsWithTitles.length} in die Warteschlange legen
            </button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {queue.length === 0 && (
          <p className="glass-card p-6 text-center text-xs text-muted-foreground">
            Noch keine Jobs in der Warteschlange.
          </p>
        )}
        {queue.map((job) => {
          const open = expanded[job.id] ?? false;
          return (
            <div key={job.id} className="glass-card overflow-hidden">
              <div className="flex items-center gap-3 p-3">
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
                <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                  {job.slidesDone}/{job.slidesTotal}
                </span>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px]",
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
