import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronRight, CloudUpload, Cpu, FileSpreadsheet, FileText, Loader2, Play, Sparkles, Upload, X } from "lucide-react";
import { parseBlock } from "../parse-prompt-block";
import { parseUniversalPromptFile } from "../csv-prompt-parser";
import { mockNameTopic } from "../mock-api";
import { toast } from "sonner";
import type { ApiSettings, ParsedCarousel, SeriesJob, JobStatus } from "../types";
import { SlideCard } from "./SlideCard";
import { SlideInspectModal } from "./SlideInspectModal";
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
  onStartSlide?: ((jobId: string, slideId: string) => void) | undefined;
  onCancelSlide?: ((jobId: string, slideId: string) => void) | undefined;
  onRunSelectedSlides?: ((jobId: string, slideIds: string[]) => void) | undefined;
  onCancelJobSlides?: ((jobId: string) => void) | undefined;
  onSaveJobToCloud?: ((jobId: string) => void) | undefined;
  onOpen30DayBatch?: (() => void) | undefined;
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
  onStartSlide,
  onCancelSlide,
  onRunSelectedSlides,
  onCancelJobSlides,
  onSaveJobToCloud,
  onOpen30DayBatch,
  settings,
  onChangeSettings,
}: SeriesQueueProps) {
  const [text, setText] = useState("");
  const [titles, setTitles] = useState<Record<number, string>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [selectedSlideIds, setSelectedSlideIds] = useState<Record<string, string[]>>({});
  const [naming, setNaming] = useState(false);
  const [inspecting, setInspecting] = useState<{ jobId: string; slideId: string } | null>(null);

  // Neue Jobs: alle Slides standardmäßig auswählen (manuell geänderte Auswahl bleibt erhalten)
  useEffect(() => {
    setSelectedSlideIds((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const job of queue) {
        if (next[job.id] === undefined && job.slides && job.slides.length > 0) {
          next[job.id] = job.slides.map((s: { id: string }) => s.id);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [queue]);

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

  const toggleSlideSelect = (jobId: string, slideId: string) => {
    setSelectedSlideIds((prev) => {
      const current = prev[jobId] ?? [];
      const next = current.includes(slideId)
        ? current.filter((id) => id !== slideId)
        : [...current, slideId];
      return { ...prev, [jobId]: next };
    });
  };

  const selectAllInJob = (job: SeriesJob) => {
    if (!job.slides) return;
    setSelectedSlideIds((prev) => ({
      ...prev,
      [job.id]: job.slides!.map((s) => s.id),
    }));
  };

  const deselectAllInJob = (jobId: string) => {
    setSelectedSlideIds((prev) => ({ ...prev, [jobId]: [] }));
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = String(e.target?.result || "");
      const parsedCarousels = parseUniversalPromptFile(content, file.name);
      if (parsedCarousels.length > 0) {
        onAddJobs(parsedCarousels);
        const totalSlides = parsedCarousels.reduce((sum, c) => sum + c.slides.length, 0);
        toast.success(`🎉 ${parsedCarousels.length} Karussells (${totalSlides} Slides) aus ${file.name} importiert!`, {
          description: "Prompts von Claude / Gemini / ChatGPT wurden automatisch erkannt und strukturiert.",
        });
        setText("");
      } else {
        setText(content);
        toast.info("Dateiinhalt ins Textfeld eingefügt.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-5">
      <div className="cryptox-card relative overflow-hidden space-y-5 p-6 sm:p-7 border border-white/[0.08]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-[#FF6A1F]" />
              <span>Serien-Generator & CSV-Import</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Füge Prompts ein oder lade CSV-, TXT- oder Markdown-Exporte von Claude, ChatGPT & Gemini hoch.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.tsv,.txt,.json,.md"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
                e.target.value = "";
              }}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-full border border-purple-500/40 bg-purple-500/15 hover:bg-purple-500/25 px-3.5 py-2 text-xs font-semibold text-purple-300 hover:text-white transition-all cursor-pointer shadow-sm"
              title="CSV, TSV, JSON oder Claude/ChatGPT Prompts hochladen"
            >
              <Upload className="h-3.5 w-3.5 text-purple-400" />
              <span>CSV / Datei importieren</span>
            </button>

            {onOpen30DayBatch && (
              <button
                type="button"
                onClick={onOpen30DayBatch}
                className="flex items-center gap-1.5 rounded-full border border-orange-500/40 bg-gradient-to-r from-orange-500/20 to-red-500/20 px-3.5 py-2 text-xs font-bold text-orange-300 hover:from-orange-500/30 hover:to-red-500/30 hover:text-white shadow-[0_0_15px_rgba(255,77,23,0.3)] transition-all cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-orange-400 animate-pulse" />
                <span>30-Tage Monats-Batch</span>
              </button>
            )}
            {isRunning ? (
              <button
                type="button"
                onClick={onStopQueue}
                className="flex items-center gap-1.5 rounded-full border border-destructive/60 bg-destructive/20 px-4 py-2 text-xs font-bold text-destructive hover:bg-destructive/30 hover:text-white transition-all shadow-[0_0_15px_rgba(239,68,68,0.25)] cursor-pointer"
              >
                <X className="h-3.5 w-3.5" /> Queue & Slides abbrechen
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
        </div>

        {/* Drag & Drop Area / Text Area */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleFileUpload(file);
          }}
          className={cn(
            "relative rounded-2xl transition-all border",
            isDragging
              ? "border-[#FF4D17] bg-[#FF4D17]/10 ring-2 ring-[#FF4D17]/50"
              : "border-white/10"
          )}
        >
          {isDragging && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 rounded-2xl backdrop-blur-sm pointer-events-none text-orange-400">
              <Upload className="h-8 w-8 mb-2 animate-bounce" />
              <p className="text-sm font-bold text-white">CSV oder Prompt-Datei hier loslassen</p>
              <p className="text-xs text-zinc-400">Automatische Trennung & Karussell-Erkennung</p>
            </div>
          )}

          <textarea
            rows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"Tippe oder ziehe eine CSV- / Prompt-Datei hierher (von Claude, ChatGPT oder Gemini):\n\nThema: Disziplin\nSlide 1: Hook\nVisual Prompt: Minimalist obsidian statue...\n\nSlide 2: Konzept\nVisual Prompt: ...\n\n===\n\nThema: Kaltakquise\nSlide 1: ..."}
            className="field-input text-xs sm:text-sm leading-relaxed font-mono w-full"
          />
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
                    "rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
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
                      "flex-1 rounded-xl border py-1.5 text-xs font-bold transition-all cursor-pointer",
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
                ? `ONYX Neural Pipeline aktiv · HQ · ${settings.kieResolution || "1K"}`
                : "ONYX Engine bereit"}
            </span>
          </div>
        </div>

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
                className="flex items-center gap-1.5 text-xs text-orange-400 hover:underline cursor-pointer"
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
                    className="shrink-0 rounded-lg p-1.5 text-zinc-400 transition-colors hover:text-orange-400 hover:bg-white/[0.05] cursor-pointer"
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
                {/* Caption-Vorschlag – shown but never treated as a slide */}
                {c.caption && (
                  <div className="rounded-xl border border-violet-500/25 bg-violet-500/[0.07] p-3 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400">Caption-Vorschlag</span>
                      <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[9px] font-semibold text-violet-300">kein Slide</span>
                    </div>
                    <p className="whitespace-pre-wrap text-[11px] leading-relaxed text-zinc-400 font-mono">{c.caption}</p>
                  </div>
                )}
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
        {queue.length === 0 && (
          <p className="cryptox-card p-6 text-center text-xs text-zinc-400 col-span-full">
            Noch keine Jobs in der Warteschlange.
          </p>
        )}
        {queue.map((job) => {
          const open = expanded[job.id] ?? true; // Standardmäßig geöffnet für Übersicht
          const selectedIds = selectedSlideIds[job.id] ?? [];
          const selectedCount = selectedIds.length;
          const isJobRendering = Boolean(job.slides?.some((s) => s.isGeneratingImage)) || job.status === "rendering";

          return (
            <div key={job.id} className="cryptox-card overflow-hidden p-0 border border-white/[0.08] shadow-lg">
              <div className="flex items-center gap-3 p-4 bg-white/[0.02]">
                <button
                  type="button"
                  onClick={() => setExpanded((p) => ({ ...p, [job.id]: !open }))}
                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                  aria-label="Details"
                >
                  {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                <input
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none font-bold text-white truncate"
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
                  className="shrink-0 text-muted-foreground hover:text-destructive cursor-pointer"
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
                <div>
                  {/* ── Slide Selection & Job Action Toolbar ───────────── */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.08] bg-white/[0.02] px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-zinc-300">
                        <span className="font-bold text-orange-400">{selectedCount}</span> von {job.slides.length} Slides gewählt
                      </span>
                      <div className="flex gap-1 text-[11px]">
                        <button
                          type="button"
                          onClick={() => selectAllInJob(job)}
                          className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-zinc-300 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
                        >
                          Alle
                        </button>
                        <button
                          type="button"
                          onClick={() => deselectAllInJob(job.id)}
                          className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
                        >
                          Keine
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {onRunSelectedSlides && (
                        <button
                          type="button"
                          onClick={() => onRunSelectedSlides(job.id, selectedIds)}
                          disabled={selectedCount === 0 || isJobRendering}
                          className="flex items-center gap-1.5 rounded-lg border border-orange-500/40 bg-orange-500/15 px-3 py-1.5 text-xs font-semibold text-orange-400 transition-all hover:bg-orange-500/25 hover:text-white disabled:opacity-40 disabled:pointer-events-none shadow-[0_0_12px_rgba(255,77,23,0.15)] cursor-pointer"
                        >
                          <Play className="h-3 w-3 fill-current" />
                          Auswahl starten ({selectedCount})
                        </button>
                      )}

                      {onSaveJobToCloud && (job.slides ?? []).some((s) => Boolean(s.imageUrl)) && (
                        <button
                          type="button"
                          onClick={() => onSaveJobToCloud(job.id)}
                          className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-200 transition-all hover:bg-white/10 hover:text-white cursor-pointer"
                        >
                          <CloudUpload className="h-3.5 w-3.5" />
                          In Cloud speichern
                        </button>
                      )}

                      {isJobRendering && onCancelJobSlides && (
                        <button
                          type="button"
                          onClick={() => onCancelJobSlides(job.id)}
                          className="flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/15 px-3 py-1.5 text-xs font-semibold text-rose-300 transition-all hover:bg-rose-500/25 hover:text-white shadow-[0_0_12px_rgba(244,63,94,0.15)] cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                          Job abbrechen
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ── Slide Grid (Guaranteed card widths min 150px) ─────── */}
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3.5 border-t border-white/[0.08] p-4">
                    {job.slides.map((slide) => (
                      <SlideCard
                        key={slide.id}
                        slide={slide}
                        selectable={true}
                        isSelected={selectedIds.includes(slide.id)}
                        onToggleSelect={() => toggleSlideSelect(job.id, slide.id)}
                        onStartSingle={onStartSlide ? () => onStartSlide(job.id, slide.id) : undefined}
                        onCancel={slide.isGeneratingImage && onCancelSlide ? () => onCancelSlide(job.id, slide.id) : undefined}
                        modelName={settings.kieApiKey?.trim() ? settings.kieModel : "Demo"}
                        onPreview={() => setInspecting({ jobId: job.id, slideId: slide.id })}
                        onReroll={() => onRerollSlide(job.id, slide.id)}
                        onEdit={() => setInspecting({ jobId: job.id, slideId: slide.id })}
                        onDownload={() => onDownloadSlide(job.id, slide.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Full Slide Inspection Lightbox Modal ────────────────────── */}
      {inspecting && currentInspectingJob?.slides && (
        <SlideInspectModal
          slides={currentInspectingJob.slides}
          activeSlideId={inspecting.slideId}
          topicTitle={currentInspectingJob.topic}
          onClose={() => setInspecting(null)}
          onSelectSlideId={(newSlideId) => setInspecting((prev) => prev ? { ...prev, slideId: newSlideId } : null)}
          onReroll={(slideId) => onRerollSlide(inspecting.jobId, slideId)}
          onSaveText={(slideId, patch) => onEditSlide(inspecting.jobId, slideId)}
          onDownload={(slideId) => onDownloadSlide(inspecting.jobId, slideId)}
          selectedSlideIds={selectedSlideIds[inspecting.jobId]}
          onToggleSelect={(slideId) => toggleSlideSelect(inspecting.jobId, slideId)}
          modelName={settings.kieApiKey?.trim() ? settings.kieModel : "ONYX Ultra"}
        />
      )}
    </div>
  );
}

