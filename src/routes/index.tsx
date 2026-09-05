import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

import { Sidebar } from "@/onyx/components/Sidebar";
import { ContextBar } from "@/onyx/components/ContextBar";
import { CarouselBriefForm } from "@/onyx/components/CarouselBriefForm";
import { CarouselViewer } from "@/onyx/components/CarouselViewer";
import { SeriesQueue } from "@/onyx/components/SeriesQueue";
import { SettingsModal } from "@/onyx/components/SettingsModal";
import { BrandKitModal } from "@/onyx/components/BrandKitModal";
import { SlideEditModal, ModalShell } from "@/onyx/components/SlideEditModal";
import { StudioHero } from "@/onyx/components/StudioHero";
import {
  AiCloneView,
  DirectPromptView,
  HistoryView,
  McpModalContent,
  PromptGallery,
} from "@/onyx/components/SimpleViews";

import { DEFAULT_API_SETTINGS, DEFAULT_BRAND_KIT, DEFAULT_BRIEF } from "@/onyx/defaults";
import { LS, usePersistentState } from "@/onyx/storage";
import { makeId, mockGenerateCarousel, mockGenerateImage, mockGetCredits } from "@/onyx/mock-api";
import { downloadSlide, exportCarouselAsZip } from "@/onyx/export-zip";
import type {
  ApiSettings,
  BrandKit,
  BriefValues,
  CreditStatus,
  HistoryEntry,
  ParsedCarousel,
  SeriesJob,
  SlideContent,
  TabKey,
} from "@/onyx/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ONYX Studio — Instagram Karussell Generator" },
      {
        name: "description",
        content:
          "ONYX Studio erzeugt komplette Instagram-Karussells aus Thema und Zielgruppe — Slides, Prompts, Visuals und ZIP-Export, alles lokal im Browser.",
      },
      { property: "og:title", content: "ONYX Studio — Instagram Karussell Generator" },
      {
        property: "og:description",
        content:
          "Von Thema zu fertiger Slide-Serie: Prompts, Visuals, Serienproduktion und ZIP-Export in einem dunklen Studio-Interface.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  component: OnyxStudio,
});

function OnyxStudio() {
  const [activeTab, setActiveTab] = usePersistentState<TabKey>(LS.activeTab, "carousel");
  const [collapsed, setCollapsed] = usePersistentState<boolean>(LS.sidebarCollapsed, false);
  const [brandKit, setBrandKit] = usePersistentState<BrandKit>(LS.brandKit, DEFAULT_BRAND_KIT);
  const [settings, setSettings] = usePersistentState<ApiSettings>(
    LS.apiSettings,
    DEFAULT_API_SETTINGS,
  );
  const [slides, setSlides] = usePersistentState<SlideContent[]>(LS.activeSlides, []);
  const [topic, setTopic] = usePersistentState<string>(LS.currentTopic, "");
  const [queue, setQueue] = usePersistentState<SeriesJob[]>(LS.seriesQueue, []);
  const [motifs, setMotifs] = usePersistentState<string[]>(LS.motifHistory, []);
  const [history, setHistory] = usePersistentState<HistoryEntry[]>(LS.history, []);
  const [brief, setBrief] = usePersistentState<BriefValues>(LS.brief, DEFAULT_BRIEF);
  const [directPrompt, setDirectPrompt] = usePersistentState<string>("onyx.directPrompt", "");

  const [isGeneratingCarousel, setIsGeneratingCarousel] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [isRunningQueue, setIsRunningQueue] = useState(false);
  const [creditStatus, setCreditStatus] = useState<CreditStatus | undefined>(undefined);
  const [showSettings, setShowSettings] = useState(false);
  const [showBrandKit, setShowBrandKit] = useState(false);
  const [showMcp, setShowMcp] = useState(false);
  const [editing, setEditing] = useState<{ jobId?: string; slideId: string } | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const queueAbortRef = useRef(false);

  const refreshCredits = useCallback(async () => {
    setCreditStatus((prev) =>
      prev ? { ...prev, loading: true } : { loading: true, kie: empty(), ai33: empty() },
    );
    setCreditStatus(await mockGetCredits());
  }, []);

  useEffect(() => {
    void refreshCredits();
  }, [refreshCredits]);

  const patchBrief = (patch: Partial<BriefValues>) => setBrief((b) => ({ ...b, ...patch }));
  const patchSettings = (patch: Partial<ApiSettings>) => setSettings((s) => ({ ...s, ...patch }));
  const patchBrandKit = (patch: Partial<BrandKit>) => setBrandKit((b) => ({ ...b, ...patch }));

  const rememberMotifs = useCallback(
    (list: SlideContent[]) => {
      setMotifs((prev) => Array.from(new Set([...prev, ...list.map((s) => s.coreMetaphor)])));
    },
    [setMotifs],
  );

  // ── Carousel ───────────────────────────────────────────────────────────
  const generateCarousel = async () => {
    setIsGeneratingCarousel(true);
    try {
      const next = await mockGenerateCarousel(brief.slideCount, brief.topic, brief.audience);
      setSlides(next);
      setTopic(brief.topic);
      rememberMotifs(next);
      toast.success(`${next.length} Prompts erzeugt`);
    } finally {
      setIsGeneratingCarousel(false);
    }
  };

  const setSlideFlag = (id: string, patch: Partial<SlideContent>) =>
    setSlides((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const generateAllImages = async () => {
    const controller = new AbortController();
    abortRef.current = controller;
    setIsGeneratingImages(true);
    try {
      for (const slide of slides) {
        if (controller.signal.aborted) break;
        setSlideFlag(slide.id, { isGeneratingImage: true });
        try {
          const res = await mockGenerateImage(slide.slideNumber, controller.signal);
          setSlideFlag(slide.id, { imageUrl: res.imageUrl, isGeneratingImage: false });
        } catch {
          setSlideFlag(slide.id, { isGeneratingImage: false });
          break;
        }
      }
      if (!controller.signal.aborted) toast.success("Alle Visuals geladen");
    } finally {
      setIsGeneratingImages(false);
      abortRef.current = null;
    }
  };

  const rerollImage = async (slideId: string) => {
    setSlideFlag(slideId, { isGeneratingImage: true });
    const slide = slides.find((s) => s.id === slideId);
    const res = await mockGenerateImage(slide?.slideNumber ?? 1);
    setSlideFlag(slideId, { imageUrl: `${res.imageUrl}&v=${Date.now()}`, isGeneratingImage: false });
  };

  const resetCarousel = () => {
    if (slides.length > 0) {
      const entry: HistoryEntry = {
        id: makeId(),
        topic: topic || "Ohne Titel",
        slides,
        createdAt: new Date().toISOString(),
      };
      setHistory((prev) => [entry, ...prev].slice(0, 40));
    }
    setSlides([]);
    setTopic("");
  };

  const exportZip = async () => {
    const count = await exportCarouselAsZip(slides, topic);
    if (count) toast.success(`${count} Bilder als ZIP exportiert`);
  };

  // ── Series queue ───────────────────────────────────────────────────────
  const addJobs = (carousels: ParsedCarousel[]) => {
    const jobs: SeriesJob[] = carousels.map((c) => ({
      id: makeId(),
      topic: c.title,
      audience: brief.audience,
      status: "queued",
      slidesTotal: c.slides.length,
      slidesDone: 0,
      slides: c.slides.map((s) => ({
        id: makeId(),
        slideNumber: s.slideNumber,
        role: s.slideNumber === 1 ? "hook" : s.slideNumber === c.slides.length ? "closing" : "concept",
        roleLabel: s.title,
        headline: s.headline || s.title,
        subtext: s.subtext || "",
        coreMetaphor: c.title,
        primaryProps: [],
        visualPrompt: s.prompt,
      })),
      createdAt: new Date().toISOString(),
    }));
    setQueue((prev) => [...prev, ...jobs]);
    toast.success(`${jobs.length} Jobs hinzugefügt`);
  };

  const updateJob = (id: string, patch: Partial<SeriesJob>) =>
    setQueue((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)));

  const updateJobSlide = (jobId: string, slideId: string, patch: Partial<SlideContent>) =>
    setQueue((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? {
              ...j,
              slides: (j.slides ?? []).map((s) => (s.id === slideId ? { ...s, ...patch } : s)),
            }
          : j,
      ),
    );

  const runQueue = async () => {
    queueAbortRef.current = false;
    setIsRunningQueue(true);
    try {
      // Snapshot of ids to process, so state updates don't restart the loop.
      const ids = queue.filter((j) => j.status === "queued").map((j) => j.id);
      for (const id of ids) {
        if (queueAbortRef.current) break;
        const job = queue.find((j) => j.id === id);
        if (!job?.slides) continue;
        updateJob(id, { status: "rendering", slidesDone: 0 });
        let done = 0;
        for (const slide of job.slides) {
          if (queueAbortRef.current) break;
          updateJobSlide(id, slide.id, { isGeneratingImage: true });
          const res = await mockGenerateImage(slide.slideNumber);
          done += 1;
          updateJobSlide(id, slide.id, { imageUrl: res.imageUrl, isGeneratingImage: false });
          updateJob(id, { slidesDone: done });
        }
        updateJob(id, {
          status: queueAbortRef.current ? "cancelled" : "done",
          slidesDone: done,
        });
      }
    } finally {
      setIsRunningQueue(false);
    }
  };

  const heroChips = useMemo(
    () => [
      { label: "Slides", value: String(brief.slideCount), side: "left" as const, top: "6rem" },
      { label: "Modell", value: settings.kieModel, side: "right" as const, top: "6rem" },
      { label: "Motive", value: `${motifs.length} gemerkt`, side: "left" as const, top: "11rem" },
      {
        label: "Format",
        value: brandKit.aspectRatio,
        side: "right" as const,
        top: "11rem",
      },
    ],
    [brief.slideCount, settings.kieModel, motifs.length, brandKit.aspectRatio],
  );

  const seriesProgress = useMemo(() => {
    if (!isRunningQueue) return null;
    const total = queue.length;
    const done = queue.filter((j) => j.status === "done").length;
    return { done, total };
  }, [isRunningQueue, queue]);

  // ── Editing ────────────────────────────────────────────────────────────
  const editingSlide = useMemo(() => {
    if (!editing) return null;
    if (editing.jobId) {
      const job = queue.find((j) => j.id === editing.jobId);
      return job?.slides?.find((s) => s.id === editing.slideId) ?? null;
    }
    return slides.find((s) => s.id === editing.slideId) ?? null;
  }, [editing, queue, slides]);

  const applyEdit = (
    patch: { headline: string; subtext: string; visualPrompt: string },
    regenerate: boolean,
  ) => {
    if (!editing) return;
    const { jobId, slideId } = editing;
    if (jobId) updateJobSlide(jobId, slideId, patch);
    else setSlideFlag(slideId, patch);
    setEditing(null);

    if (regenerate) {
      void (async () => {
        const number = editingSlide?.slideNumber ?? 1;
        if (jobId) updateJobSlide(jobId, slideId, { isGeneratingImage: true });
        else setSlideFlag(slideId, { isGeneratingImage: true });
        const res = await mockGenerateImage(number);
        const done = { imageUrl: `${res.imageUrl}&v=${Date.now()}`, isGeneratingImage: false };
        if (jobId) updateJobSlide(jobId, slideId, done);
        else setSlideFlag(slideId, done);
      })();
    }
  };

  const downloadFromJob = async (jobId: string, slideId: string) => {
    const slide = queue.find((j) => j.id === jobId)?.slides?.find((s) => s.id === slideId);
    if (slide) await downloadSlide(slide);
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar
        active={activeTab}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((c) => !c)}
        onNavigate={setActiveTab}
        brandKit={brandKit}
        {...(creditStatus ? { creditStatus } : {})}
        onRefreshCredits={() => void refreshCredits()}
        onOpenBrandKit={() => setShowBrandKit(true)}
        onOpenSettings={() => setShowSettings(true)}
        onOpenMcp={() => setShowMcp(true)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <ContextBar
          view={activeTab}
          onNavigate={setActiveTab}
          settings={settings}
          onUpdateSettings={patchSettings}
          historyCount={motifs.length}
          seriesProgress={seriesProgress}
          onGotoSeries={() => setActiveTab("bulk")}
        />

        <main className="mx-auto w-full max-w-[1600px] flex-1 p-4 sm:p-6">
          {activeTab === "carousel" &&
            (slides.length === 0 ? (
              <div className="relative">
                <StudioHero
                  eyebrow="Carousel Engine"
                  title={["Vom Gedanken zur", "fertigen Slide-Serie"]}
                  subtitle="Thema rein, Zielgruppe dazu — ONYX schreibt Hook, Aufbau und Bildprompts für dein komplettes Karussell."
                  ctaLabel={isGeneratingCarousel ? "Läuft…" : `${brief.slideCount} Prompts erzeugen`}
                  onCta={() => void generateCarousel()}
                  ctaDisabled={isGeneratingCarousel || !brief.topic.trim()}
                  chips={heroChips}
                />
                <CarouselBriefForm
                  values={brief}
                  onChange={patchBrief}
                  onSubmit={() => void generateCarousel()}
                  onCancel={() => setIsGeneratingCarousel(false)}
                  isGenerating={isGeneratingCarousel}
                  keySaved={Boolean(brief.apiKey)}
                />
              </div>
            ) : (
              <CarouselViewer
                slides={slides}
                topic={topic}
                isGeneratingImages={isGeneratingImages}
                onGenerateImages={() => void generateAllImages()}
                onCancelGeneration={() => abortRef.current?.abort()}
                onRerollImage={(id) => void rerollImage(id)}
                onEditSlide={(id) => setEditing({ slideId: id })}
                onDownloadSingle={(id) => {
                  const slide = slides.find((s) => s.id === id);
                  if (slide) void downloadSlide(slide);
                }}
                onExportZip={() => void exportZip()}
                onReset={resetCarousel}
                settings={settings}
                brandKit={brandKit}
              />
            ))}

          {activeTab === "bulk" && (
            <SeriesQueue
              queue={queue}
              isRunning={isRunningQueue}
              onAddJobs={addJobs}
              onRunQueue={() => void runQueue()}
              onStopQueue={() => {
                queueAbortRef.current = true;
              }}
              onDeleteJob={(id) => setQueue((prev) => prev.filter((j) => j.id !== id))}
              onRenameJob={(id, value) => updateJob(id, { topic: value })}
              onEditSlide={(jobId, slideId) => setEditing({ jobId, slideId })}
              onRerollSlide={(jobId, slideId) => {
                void (async () => {
                  updateJobSlide(jobId, slideId, { isGeneratingImage: true });
                  const res = await mockGenerateImage(1);
                  updateJobSlide(jobId, slideId, {
                    imageUrl: `${res.imageUrl}&v=${Date.now()}`,
                    isGeneratingImage: false,
                  });
                })();
              }}
              onDownloadSlide={(jobId, slideId) => void downloadFromJob(jobId, slideId)}
            />
          )}

          {activeTab === "direct-prompt" && <DirectPromptView initialPrompt={directPrompt} />}
          {activeTab === "ai-clone" && <AiCloneView />}
          {activeTab === "prompt-gallery" && (
            <PromptGallery
              onUseInCarousel={(promptText, title) => {
                patchBrief({ topic: `${title}: ${promptText}` });
                setActiveTab("carousel");
                toast.success("Prompt ins Karussell übertragen!");
              }}
              onUseInDirectPrompt={(promptText) => {
                setDirectPrompt(promptText);
                setActiveTab("direct-prompt");
                toast.success("Prompt ins Einzelbild übertragen!");
              }}
            />
          )}
          {activeTab === "history" && (
            <HistoryView
              entries={history}
              onOpen={(entry) => {
                setSlides(entry.slides);
                setTopic(entry.topic);
                setActiveTab("carousel");
              }}
              onDelete={(id) => setHistory((prev) => prev.filter((e) => e.id !== id))}
            />
          )}
        </main>
      </div>

      {showSettings && (
        <SettingsModal
          settings={settings}
          onChange={patchSettings}
          onClose={() => setShowSettings(false)}
          motifCount={motifs.length}
          onClearMotifs={() => {
            setMotifs([]);
            toast.success("Motiv-Cache geleert");
          }}
        />
      )}
      {showBrandKit && (
        <BrandKitModal
          brandKit={brandKit}
          onChange={patchBrandKit}
          onClose={() => setShowBrandKit(false)}
        />
      )}
      {showMcp && (
        <ModalShell title="Claude Desktop MCP" onClose={() => setShowMcp(false)} maxHeight="70vh">
          <McpModalContent />
        </ModalShell>
      )}
      {editingSlide && (
        <SlideEditModal
          slide={editingSlide}
          onClose={() => setEditing(null)}
          onSave={(patch) => applyEdit(patch, false)}
          onRegenerate={(patch) => applyEdit(patch, true)}
        />
      )}

      <Toaster />
    </div>
  );
}

function empty() {
  return { credits: 0, formatted: "n/a", success: false };
}
