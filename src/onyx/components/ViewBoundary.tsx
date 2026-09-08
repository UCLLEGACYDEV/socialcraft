import React, { Component, type ReactNode } from "react";
import { AlertTriangle, RotateCcw, Copy, Check, Terminal, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

interface ViewBoundaryProps {
  name: string;
  children: ReactNode;
  onReset?: () => void;
  storageKeyToClearOnEmergency?: string;
}

interface ViewBoundaryState {
  hasError: boolean;
  error: Error | null;
  copied: boolean;
}

export class ViewBoundary extends Component<ViewBoundaryProps, ViewBoundaryState> {
  constructor(props: ViewBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      copied: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ViewBoundaryState> {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[ViewBoundary:${this.props.name}] Uncaught error:`, error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleEmergencyClear = () => {
    if (this.props.storageKeyToClearOnEmergency && typeof window !== "undefined") {
      try {
        localStorage.removeItem(this.props.storageKeyToClearOnEmergency);
        toast.info(`Cache für „${this.props.name}“ geleert.`);
      } catch {
        // ignore
      }
    }
    this.handleReset();
  };

  handleCopyError = () => {
    if (!this.state.error) return;
    const text = `[ONYX Studio - Fehler in ${this.props.name}]\n${this.state.error.name}: ${this.state.error.message}\n\nStack:\n${this.state.error.stack || "Kein Stack vorhanden"}`;
    void navigator.clipboard.writeText(text);
    this.setState({ copied: true });
    toast.success("Fehlermeldung in die Zwischenablage kopiert.");
    setTimeout(() => this.setState({ copied: false }), 2000);
  };

  override render() {
    if (this.state.hasError) {
      const { name, storageKeyToClearOnEmergency } = this.props;
      const { error, copied } = this.state;

      return (
        <div className="mx-auto my-8 max-w-2xl rounded-2xl border border-amber-500/25 bg-gradient-to-b from-amber-950/20 via-zinc-950/80 to-zinc-950 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
              <ShieldAlert className="h-6 w-6" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-300">
                  Fehlerschutz aktiv
                </span>
                <span className="text-xs text-zinc-500 font-mono">Modul: {name}</span>
              </div>

              <h2 className="mt-2 text-lg font-semibold text-zinc-100">
                Dieser Bereich hat einen unerwarteten Fehler abgefangen
              </h2>

              <p className="mt-1 text-sm leading-relaxed text-zinc-400">
                Keine Sorge: Der Rest von ONYX Studio läuft ohne Unterbrechung weiter. Deine anderen Entwürfe und Einstellungen im Browser-Speicher sind sicher.
              </p>

              {error && (
                <div className="mt-4 rounded-lg border border-white/[0.06] bg-black/50 p-3.5 font-mono text-xs text-zinc-400 overflow-hidden">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.05] text-[11px] text-zinc-500">
                    <span className="flex items-center gap-1.5 font-semibold text-amber-400/90">
                      <Terminal className="h-3.5 w-3.5" />
                      {error.name || "Error"}
                    </span>
                    <button
                      type="button"
                      onClick={this.handleCopyError}
                      className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      <span>{copied ? "Kopiert" : "Kopieren"}</span>
                    </button>
                  </div>
                  <p className="font-medium text-red-300/90 break-words whitespace-pre-wrap">
                    {error.message || "Unbekannter Ausführungsfehler"}
                  </p>
                </div>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-sm font-medium text-black shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Bereich neu laden</span>
                </button>

                {storageKeyToClearOnEmergency && (
                  <button
                    type="button"
                    onClick={this.handleEmergencyClear}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-zinc-300 hover:bg-white/[0.08] hover:text-white transition-all cursor-pointer"
                  >
                    <span>Cache zurücksetzen</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
