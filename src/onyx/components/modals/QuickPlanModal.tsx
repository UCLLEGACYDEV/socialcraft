import { useEffect, useMemo, useState } from "react";
import {
  X,
  Zap,
  Clock,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  Images,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScheduledPost, SocialChannel } from "@/onyx/types";
import { computeNextSlots, type PostingSlotConfig } from "@/onyx/scheduling";
import { PLATFORM_ICONS, toLocalDatetimeValue, parseLocalDatetimeValue } from "@/onyx/components/widgets/scheduler-utils";

export interface QuickPlanEntry {
  postId: string;
  scheduledForISO: string;
  channelIds: string[];
}

interface QuickPlanModalProps {
  open: boolean;
  onClose: () => void;
  posts: ScheduledPost[];
  channels: SocialChannel[];
  /** Times of already scheduled posts that should not be reused (ms). */
  takenTimes: number[];
  slots: PostingSlotConfig;
  onChangeSlots: (next: PostingSlotConfig) => void;
  /** Schedules one entry. Throw to report a failure for that row. */
  onSchedule: (entry: QuickPlanEntry, post: ScheduledPost) => Promise<void>;
  onDone: (firstDate: Date | null, okCount: number, total: number) => void;
}

type RowState = {
  postId: string;
  enabled: boolean;
  when: string; // datetime-local
  channelIds: string[];
  status: "idle" | "running" | "ok" | "error";
  error?: string;
};

const DAY_LABELS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

function fmt(d: Date): string {
  return `${d.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "short" })} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function QuickPlanModal({
  open,
  onClose,
  posts,
  channels,
  takenTimes,
  slots,
  onChangeSlots,
  onSchedule,
  onDone,
}: QuickPlanModalProps) {
  const [rows, setRows] = useState<RowState[]>([]);
  const [globalChannelIds, setGlobalChannelIds] = useState<string[]>([]);
  const [startMode, setStartMode] = useState<"today" | "tomorrow" | "custom">("today");
  const [customStart, setCustomStart] = useState<string>(() => toLocalDatetimeValue(new Date()));
  const [minGapHours, setMinGapHours] = useState<number>(2);
  const [order, setOrder] = useState<"list" | "newest" | "random">("list");
  const [running, setRunning] = useState(false);

  const postMap = useMemo(() => new Map(posts.map((p) => [p.id, p])), [posts]);

  const startDate = useMemo(() => {
    if (startMode === "custom") return parseLocalDatetimeValue(customStart) ?? new Date();
    const d = new Date();
    if (startMode === "tomorrow") {
      d.setDate(d.getDate() + 1);
      d.setHours(0, 0, 0, 0);
    }
    return d;
  }, [startMode, customStart]);

  const distribute = (
    base: RowState[],
    cfg: PostingSlotConfig,
    from: Date,
    gapHours: number,
    sortMode: "list" | "newest" | "random",
    channelPool: string[]
  ): RowState[] => {
    let ordered = [...base];
    if (sortMode === "newest") {
      ordered.sort(
        (a, b) =>
          new Date(postMap.get(b.postId)?.createdAt || 0).getTime() -
          new Date(postMap.get(a.postId)?.createdAt || 0).getTime()
      );
    } else if (sortMode === "random") {
      ordered = ordered.map((r) => ({ r, k: Math.random() })).sort((a, b) => a.k - b.k).map((x) => x.r);
    }

    const active = ordered.filter((r) => r.enabled);
    const generated = computeNextSlots(cfg, active.length * 3 + 6, takenTimes, {
      startFrom: from,
      minGapMinutes: Math.max(0, gapHours) * 60,
    });

    let i = 0;
    return ordered.map((row) => {
      if (!row.enabled) return row;
      const slot = generated[i++];
      const post = postMap.get(row.postId);
      const fallbackChannel = post ? [post.channelId] : [];
      const nextChannels =
        channelPool.length > 0 ? channelPool : row.channelIds.length ? row.channelIds : fallbackChannel;
      return {
        ...row,
        when: slot ? toLocalDatetimeValue(slot) : row.when,
        channelIds: nextChannels,
        status: "idle" as const,
        error: undefined,
      };
    });
  };

  // Build fresh state whenever the modal opens.
  useEffect(() => {
    if (!open) return;
    const defaults = channels.filter((c) => c.isDefault).map((c) => c.id);
    const pool = defaults.length ? defaults : channels[0] ? [channels[0].id] : [];
    setGlobalChannelIds(pool);
    setStartMode("today");
    setCustomStart(toLocalDatetimeValue(new Date()));
    setRunning(false);
    const base: RowState[] = posts.map((p) => ({
      postId: p.id,
      enabled: true,
      when: toLocalDatetimeValue(new Date(p.scheduledFor)),
      channelIds: pool,
      status: "idle",
    }));
    setRows(distribute(base, slots, new Date(), 2, "list", pool));
    setMinGapHours(2);
    setOrder("list");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const redistribute = (
    cfg = slots,
    from = startDate,
    gap = minGapHours,
    sortMode = order,
    pool = globalChannelIds
  ) => {
    setRows((prev) => distribute(prev, cfg, from, gap, sortMode, pool));
  };

  const toggleGlobalChannel = (id: string) => {
    const next = globalChannelIds.includes(id)
      ? globalChannelIds.filter((c) => c !== id)
      : [...globalChannelIds, id];
    setGlobalChannelIds(next);
    setRows((prev) => prev.map((r) => ({ ...r, channelIds: next })));
  };

  const toggleRowChannel = (postId: string, id: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r.postId === postId
          ? {
              ...r,
              channelIds: r.channelIds.includes(id)
                ? r.channelIds.filter((c) => c !== id)
                : [...r.channelIds, id],
            }
          : r
      )
    );
  };

  const shiftRow = (postId: string, hours: number) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.postId !== postId) return r;
        const d = parseLocalDatetimeValue(r.when);
        if (!d) return r;
        d.setTime(d.getTime() + hours * 3600 * 1000);
        return { ...r, when: toLocalDatetimeValue(d) };
      })
    );
  };

  const moveRow = (index: number, dir: -1 | 1) => {
    setRows((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      // Swap position and keep the times in place, so order = time order.
      const a = next[index];
      const b = next[target];
      next[index] = { ...b, when: a.when };
      next[target] = { ...a, when: b.when };
      return next;
    });
  };

  const activeRows = rows.filter((r) => r.enabled);

  const rowIssue = (r: RowState): string | null => {
    const d = parseLocalDatetimeValue(r.when);
    if (!d) return "Ungültige Zeit";
    if (d.getTime() < Date.now() + 60 * 1000) return "Zeit liegt in der Vergangenheit";
    if (r.channelIds.length === 0) return "Kein Konto gewählt";
    const clash = activeRows.some(
      (o) => o.postId !== r.postId && Math.abs((parseLocalDatetimeValue(o.when)?.getTime() ?? 0) - d.getTime()) < 60 * 1000
    );
    if (clash) return "Zwei Beiträge zur selben Zeit";
    return null;
  };

  const issues = activeRows.filter((r) => rowIssue(r) !== null).length;
  const times = activeRows
    .map((r) => parseLocalDatetimeValue(r.when))
    .filter((d): d is Date => !!d)
    .sort((a, b) => a.getTime() - b.getTime());

  const summary =
    activeRows.length === 0
      ? "Kein Beitrag ausgewählt"
      : times.length > 1
        ? `${activeRows.length} Beiträge, ${fmt(times[0])} bis ${fmt(times[times.length - 1])}`
        : times.length === 1
          ? `1 Beitrag, ${fmt(times[0])}`
          : `${activeRows.length} Beiträge`;

  const handleConfirm = async () => {
    if (running || activeRows.length === 0 || issues > 0) return;
    setRunning(true);
    let ok = 0;
    const sorted = [...activeRows].sort(
      (a, b) => (parseLocalDatetimeValue(a.when)?.getTime() ?? 0) - (parseLocalDatetimeValue(b.when)?.getTime() ?? 0)
    );

    for (const row of sorted) {
      const post = postMap.get(row.postId);
      const when = parseLocalDatetimeValue(row.when);
      if (!post || !when) continue;
      setRows((prev) => prev.map((r) => (r.postId === row.postId ? { ...r, status: "running", error: undefined } : r)));
      try {
        await onSchedule({ postId: row.postId, scheduledForISO: when.toISOString(), channelIds: row.channelIds }, post);
        ok++;
        setRows((prev) => prev.map((r) => (r.postId === row.postId ? { ...r, status: "ok" } : r)));
      } catch (err: any) {
        setRows((prev) =>
          prev.map((r) =>
            r.postId === row.postId
              ? { ...r, status: "error", error: err?.message || "Einplanen fehlgeschlagen" }
              : r
          )
        );
      }
    }

    setRunning(false);
    onDone(times[0] ?? null, ok, sorted.length);
    if (ok === sorted.length) onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-black/80 p-3 backdrop-blur-sm sm:p-6">
      <div className="cryptox-card my-4 w-full max-w-5xl overflow-hidden border border-orange-500/25 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/15 text-orange-300">
              <Zap className="h-4.5 w-4.5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white">Schnell planen</h2>
              <p className="text-xs text-zinc-400">Konten, Tage und Uhrzeiten prüfen — danach wird eingeplant.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/5 hover:text-white">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Global settings */}
        <div className="space-y-4 border-b border-white/[0.06] bg-white/[0.02] px-5 py-4">
          <div>
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              Konten (gilt für alle)
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {channels.map((c) => {
                const Icon = PLATFORM_ICONS[c.platform] || Images;
                const on = globalChannelIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleGlobalChannel(c.id)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-semibold transition",
                      on
                        ? "border-orange-500/50 bg-orange-500/20 text-orange-100"
                        : "border-white/10 bg-white/5 text-zinc-400 hover:text-white"
                    )}
                  >
                    {c.avatarUrl ? (
                      <img src={c.avatarUrl} alt="" className="h-4 w-4 rounded-full object-cover" />
                    ) : (
                      <Icon className="h-3.5 w-3.5" />
                    )}
                    <span className="max-w-[9rem] truncate">{c.name}</span>
                  </button>
                );
              })}
              {channels.length === 0 && (
                <span className="text-xs text-zinc-500">Noch kein Konto verbunden.</span>
              )}
              {channels.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const all = channels.map((c) => c.id);
                      setGlobalChannelIds(all);
                      setRows((prev) => prev.map((r) => ({ ...r, channelIds: all })));
                    }}
                    className="rounded-full border border-white/10 px-2.5 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white"
                  >
                    Alle
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGlobalChannelIds([]);
                      setRows((prev) => prev.map((r) => ({ ...r, channelIds: [] })));
                    }}
                    className="rounded-full border border-white/10 px-2.5 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white"
                  >
                    Keine
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Start</span>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    ["today", "Ab jetzt"],
                    ["tomorrow", "Ab morgen"],
                    ["custom", "Datum"],
                  ] as const
                ).map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      setStartMode(mode);
                      const from =
                        mode === "custom"
                          ? parseLocalDatetimeValue(customStart) ?? new Date()
                          : (() => {
                              const d = new Date();
                              if (mode === "tomorrow") {
                                d.setDate(d.getDate() + 1);
                                d.setHours(0, 0, 0, 0);
                              }
                              return d;
                            })();
                      redistribute(slots, from);
                    }}
                    className={cn(
                      "rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition",
                      startMode === mode
                        ? "border-orange-500/50 bg-orange-500/20 text-orange-100"
                        : "border-white/10 bg-white/5 text-zinc-400 hover:text-white"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {startMode === "custom" && (
                <input
                  type="datetime-local"
                  value={customStart}
                  onChange={(e) => {
                    setCustomStart(e.target.value);
                    const d = parseLocalDatetimeValue(e.target.value);
                    if (d) redistribute(slots, d);
                  }}
                  className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white focus:outline-none"
                />
              )}
            </div>

            <div>
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                Wochentage
              </span>
              <div className="flex flex-wrap gap-1">
                {DAY_LABELS.map((label, idx) => {
                  const on = slots.days.includes(idx);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        const next = {
                          ...slots,
                          days: on ? slots.days.filter((d) => d !== idx) : [...slots.days, idx].sort((a, b) => a - b),
                        };
                        onChangeSlots(next);
                        redistribute(next);
                      }}
                      className={cn(
                        "rounded-lg border px-2 py-1.5 text-[11px] font-bold transition",
                        on
                          ? "border-orange-500/50 bg-orange-500/20 text-orange-100"
                          : "border-white/10 bg-white/5 text-zinc-500 hover:text-white"
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                Uhrzeiten
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {slots.times.map((t, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 py-1 pl-2 pr-1"
                  >
                    <input
                      type="time"
                      value={t}
                      onChange={(e) => {
                        const times = [...slots.times];
                        times[i] = e.target.value;
                        const next = { ...slots, times };
                        onChangeSlots(next);
                        redistribute(next);
                      }}
                      className="bg-transparent text-xs text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const next = { ...slots, times: slots.times.filter((_, idx) => idx !== i) };
                        onChangeSlots(next);
                        redistribute(next);
                      }}
                      className="p-0.5 text-zinc-500 hover:text-red-400"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const next = { ...slots, times: [...slots.times, "12:00"] };
                    onChangeSlots(next);
                    redistribute(next);
                  }}
                  className="rounded-lg border border-dashed border-white/20 px-2 py-1.5 text-xs font-semibold text-zinc-400 hover:border-orange-500/40 hover:text-white"
                >
                  + Zeit
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  Mindestabstand
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={72}
                    value={minGapHours}
                    onChange={(e) => {
                      const v = Number(e.target.value) || 0;
                      setMinGapHours(v);
                      redistribute(slots, startDate, v);
                    }}
                    className="w-16 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white focus:outline-none"
                  />
                  <span className="text-xs text-zinc-400">Stunden</span>
                </div>
              </div>
              <div>
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  Reihenfolge
                </span>
                <select
                  value={order}
                  onChange={(e) => {
                    const v = e.target.value as "list" | "newest" | "random";
                    setOrder(v);
                    redistribute(slots, startDate, minGapHours, v);
                  }}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="list">Wie in der Liste</option>
                  <option value="newest">Neueste zuerst</option>
                  <option value="random">Zufällig</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Rows */}
        <div className="max-h-[46vh] space-y-2 overflow-y-auto px-5 py-4">
          {rows.map((row, index) => {
            const post = postMap.get(row.postId);
            if (!post) return null;
            const issue = row.enabled ? rowIssue(row) : null;
            return (
              <div
                key={row.postId}
                className={cn(
                  "rounded-xl border p-3 transition",
                  row.status === "ok"
                    ? "border-emerald-500/40 bg-emerald-500/[0.06]"
                    : row.status === "error"
                      ? "border-red-500/40 bg-red-500/[0.06]"
                      : issue
                        ? "border-amber-500/40 bg-amber-500/[0.05]"
                        : row.enabled
                          ? "border-white/10 bg-white/[0.03]"
                          : "border-white/5 bg-white/[0.01] opacity-60"
                )}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="checkbox"
                    checked={row.enabled}
                    onChange={() =>
                      setRows((prev) =>
                        prev.map((r) => (r.postId === row.postId ? { ...r, enabled: !r.enabled } : r))
                      )
                    }
                    className="h-4 w-4 accent-orange-500"
                    aria-label="Beitrag einplanen"
                  />

                  {post.mediaUrls[0] ? (
                    <img src={post.mediaUrls[0]} alt="" className="h-11 w-11 rounded-lg object-cover" />
                  ) : (
                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/5 text-zinc-500">
                      <Images className="h-4 w-4" />
                    </span>
                  )}

                  <div className="min-w-[10rem] flex-1">
                    <p className="truncate text-sm font-semibold text-white">{post.title || "Ohne Titel"}</p>
                    <p className="text-[11px] text-zinc-500">
                      {post.mediaUrls.length} {post.mediaUrls.length === 1 ? "Bild" : "Bilder"}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <input
                      type="datetime-local"
                      value={row.when}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((r) => (r.postId === row.postId ? { ...r, when: e.target.value } : r))
                        )
                      }
                      className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => shiftRow(row.postId, -1)}
                      className="rounded-lg border border-white/10 px-1.5 py-1.5 text-[11px] font-bold text-zinc-300 hover:text-white"
                      title="Eine Stunde früher"
                    >
                      −1 Std
                    </button>
                    <button
                      type="button"
                      onClick={() => shiftRow(row.postId, 1)}
                      className="rounded-lg border border-white/10 px-1.5 py-1.5 text-[11px] font-bold text-zinc-300 hover:text-white"
                      title="Eine Stunde später"
                    >
                      +1 Std
                    </button>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => moveRow(index, -1)}
                      className="rounded p-0.5 text-zinc-500 hover:text-white"
                      aria-label="Nach oben"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveRow(index, 1)}
                      className="rounded p-0.5 text-zinc-500 hover:text-white"
                      aria-label="Nach unten"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="w-7 shrink-0 text-right">
                    {row.status === "running" && <Loader2 className="ml-auto h-4 w-4 animate-spin text-orange-400" />}
                    {row.status === "ok" && <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-400" />}
                    {row.status === "error" && <AlertTriangle className="ml-auto h-4 w-4 text-red-400" />}
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-7">
                  {channels.map((c) => {
                    const Icon = PLATFORM_ICONS[c.platform] || Images;
                    const on = row.channelIds.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleRowChannel(row.postId, c.id)}
                        className={cn(
                          "flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold transition",
                          on
                            ? "border-orange-500/40 bg-orange-500/15 text-orange-100"
                            : "border-white/10 bg-white/[0.03] text-zinc-500 hover:text-white"
                        )}
                      >
                        <Icon className="h-3 w-3" />
                        <span className="max-w-[8rem] truncate">{c.name}</span>
                      </button>
                    );
                  })}
                </div>

                {(issue || row.error) && (
                  <p
                    className={cn(
                      "mt-2 flex items-center gap-1.5 pl-7 text-[11px] font-semibold",
                      row.error ? "text-red-300" : "text-amber-300"
                    )}
                  >
                    <AlertTriangle className="h-3 w-3" />
                    {row.error || issue}
                  </p>
                )}
              </div>
            );
          })}
          {rows.length === 0 && (
            <p className="py-8 text-center text-sm text-zinc-500">Keine offenen Beiträge zum Einplanen.</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] bg-white/[0.02] px-5 py-4">
          <div className="flex items-center gap-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
              <Clock className="h-3.5 w-3.5 text-orange-400" />
              {summary}
            </p>
            <button
              type="button"
              onClick={() => redistribute()}
              disabled={running}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white disabled:opacity-50"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Neu verteilen
            </button>
          </div>

          <div className="flex items-center gap-2">
            {issues > 0 && (
              <span className="text-[11px] font-semibold text-amber-300">
                {issues} {issues === 1 ? "Zeile" : "Zeilen"} prüfen
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-zinc-300 hover:text-white"
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={running || activeRows.length === 0 || issues > 0}
              className="cryptox-orange-btn !px-4 !py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50"
            >
              {running ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  Plane ein…
                </>
              ) : (
                <>
                  <Zap className="mr-1.5 h-4 w-4" />
                  {activeRows.length} {activeRows.length === 1 ? "Beitrag" : "Beiträge"} planen
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
