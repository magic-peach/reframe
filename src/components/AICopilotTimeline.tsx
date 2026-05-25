"use client";

import { useState, useEffect, useRef } from "react";
import {
  Sparkles, History, Diff, BarChart4, Play, Pause,
  SkipBack, SkipForward, Bookmark, Check, Plus, AlertCircle, HelpCircle, RefreshCw
} from "lucide-react";
import { EditRecipe } from "@/lib/types";
import { SessionState, compileAIPrompt, diffRecipes, RecipeDiff } from "@/lib/sessionHistory";
import { cn } from "@/lib/utils";

interface AICopilotTimelineProps {
  recipe: EditRecipe;
  onUpdateRecipe: (
    newRecipe: EditRecipe,
    description: string,
    actionType: SessionState["actionType"],
    category: SessionState["category"],
    promptText?: string
  ) => void;
  history: SessionState[];
  currentStateIndex: number;
  onNavigateHistory: (index: number) => void;
  onToggleMilestone: (stateId: string, name?: string) => void;
}

export default function AICopilotTimeline({
  recipe,
  onUpdateRecipe,
  history,
  currentStateIndex,
  onNavigateHistory,
  onToggleMilestone,
}: AICopilotTimelineProps) {
  const [activeTab, setActiveTab] = useState<"copilot" | "timeline" | "diff" | "analytics">("copilot");
  
  // AI Copilot state
  const [prompt, setPrompt] = useState("");
  const [isCompiling, setIsCompiling] = useState(false);
  const [aiLogs, setAiLogs] = useState<string[]>([]);
  const [lastExecutedPrompt, setLastExecutedPrompt] = useState("");

  // Replay playback states
  const [isPlayingReplay, setIsPlayingReplay] = useState(false);
  const replayIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Diff comparison states
  const [diffBaseIndex, setDiffBaseIndex] = useState(0);
  const [diffTargetIndex, setDiffTargetIndex] = useState(history.length - 1);

  // Milestone input state
  const [bookmarkingStateId, setBookmarkingStateId] = useState<string | null>(null);
  const [milestoneNameInput, setMilestoneNameInput] = useState("");

  // Sync diff comparison target on history changes
  useEffect(() => {
    if (history.length > 0) {
      setDiffTargetIndex(history.length - 1);
    }
  }, [history.length]);

  // Clean up replay interval
  useEffect(() => {
    return () => {
      if (replayIntervalRef.current) clearInterval(replayIntervalRef.current);
    };
  }, []);

  // Handle step-by-step replay playback
  useEffect(() => {
    if (isPlayingReplay) {
      replayIntervalRef.current = setInterval(() => {
        if (currentStateIndex < history.length - 1) {
          onNavigateHistory(currentStateIndex + 1);
        } else {
          setIsPlayingReplay(false);
        }
      }, 1500); // 1.5s per step
    } else {
      if (replayIntervalRef.current) {
        clearInterval(replayIntervalRef.current);
        replayIntervalRef.current = null;
      }
    }

    return () => {
      if (replayIntervalRef.current) clearInterval(replayIntervalRef.current);
    };
  }, [isPlayingReplay, currentStateIndex, history.length, onNavigateHistory]);

  const handleSendPrompt = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isCompiling) return;

    setIsCompiling(true);
    setAiLogs(["AI thinking... analyzing prompt"]);

    // Simulate AI thinking and styling generations
    setTimeout(() => {
      try {
        const result = compileAIPrompt(prompt, recipe);
        onUpdateRecipe(
          result.recipe,
          result.description,
          "ai_prompt",
          result.category,
          prompt.trim()
        );
        setAiLogs(result.logs);
        setLastExecutedPrompt(prompt.trim());
        setPrompt("");
      } catch (err) {
        setAiLogs(["Error executing prompt. Please try again."]);
      } finally {
        setIsCompiling(false);
      }
    }, 900);
  };

  const applyQuickPrompt = (text: string) => {
    setPrompt(text);
    // Auto-submit quick prompt
    setIsCompiling(true);
    setAiLogs(["AI applying macro preset..."]);
    setTimeout(() => {
      try {
        const result = compileAIPrompt(text, recipe);
        onUpdateRecipe(
          result.recipe,
          result.description,
          "ai_prompt",
          result.category,
          text
        );
        setAiLogs(result.logs);
        setLastExecutedPrompt(text);
        setPrompt("");
      } catch (err) {
        setAiLogs(["Error executing prompt."]);
      } finally {
        setIsCompiling(false);
      }
    }, 700);
  };

  const handleToggleMilestoneClick = (state: SessionState) => {
    if (state.isMilestone) {
      // Remove milestone
      onToggleMilestone(state.id);
    } else {
      // Open milestone name prompt
      setBookmarkingStateId(state.id);
      setMilestoneNameInput(state.milestoneName || `Version ${history.indexOf(state) + 1}`);
    }
  };

  const submitMilestone = () => {
    if (bookmarkingStateId) {
      onToggleMilestone(bookmarkingStateId, milestoneNameInput.trim() || undefined);
      setBookmarkingStateId(null);
      setMilestoneNameInput("");
    }
  };

  const prevState = history[currentStateIndex - 1];
  const currState = history[currentStateIndex];
  const currentDiffs = history.length > 1 && currentStateIndex > 0 && prevState && currState
    ? diffRecipes(prevState.recipe, currState.recipe)
    : [];

  const baseCompareState = history[diffBaseIndex];
  const targetCompareState = history[diffTargetIndex];
  const baseCompareDiffs = history.length > 0 && diffBaseIndex < history.length && diffTargetIndex < history.length && baseCompareState && targetCompareState
    ? diffRecipes(baseCompareState.recipe, targetCompareState.recipe)
    : [];

  // Compute analytics metrics
  const categoryCounts = history.reduce(
    (acc, cur) => {
      acc[cur.category] = (acc[cur.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const totalEdits = history.length;
  const aiEditsCount = history.filter((h) => h.actionType === "ai_prompt").length;
  const manualEditsCount = history.filter((h) => h.actionType === "manual").length;
  const milestoneCount = history.filter((h) => h.isMilestone).length;

  const quickPrompts = [
    { text: "🎬 optimize for TikTok Reel (9:16)", label: "Reel Mode" },
    { text: "✨ cinematic look and high contrast", label: "Cinematic Grade" },
    { text: "🏎️ double speed timelapse", label: "Timelapse" },
    { text: "🔇 mute audio", label: "Mute" },
    { text: "📝 add text overlay 'Awesome Day!'", label: "Add Text" },
    { text: "🎨 vlog preset and high saturation", label: "Warm Vlog" },
  ];

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-md overflow-hidden animate-fade-in">
      {/* Header & Tabs */}
      <div className="border-b border-[var(--border)] bg-opacity-40 bg-[var(--surface)] p-3 flex flex-wrap gap-2 justify-between items-center">
        <div className="flex items-center gap-1.5 text-film-500">
          <Sparkles size={16} className="animate-pulse text-[var(--accent)]" />
          <span className="font-heading font-extrabold text-xs uppercase tracking-widest text-[var(--text)]">
            AI Design Copilot & Replay
          </span>
        </div>

        <div className="flex bg-[var(--bg)] p-0.5 rounded-lg border border-[var(--border)]" role="tablist">
          <button
            id="tab-copilot"
            type="button"
            role="tab"
            aria-selected={activeTab === "copilot"}
            onClick={() => setActiveTab("copilot")}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1",
              activeTab === "copilot"
                ? "bg-[var(--accent)] text-white shadow-sm"
                : "text-[var(--muted)] hover:text-[var(--text)]"
            )}
          >
            <Sparkles size={12} />
            Copilot
          </button>
          <button
            id="tab-timeline"
            type="button"
            role="tab"
            aria-selected={activeTab === "timeline"}
            onClick={() => setActiveTab("timeline")}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1",
              activeTab === "timeline"
                ? "bg-[var(--accent)] text-white shadow-sm"
                : "text-[var(--muted)] hover:text-[var(--text)]"
            )}
          >
            <History size={12} />
            Timeline
          </button>
          <button
            id="tab-diff"
            type="button"
            role="tab"
            aria-selected={activeTab === "diff"}
            onClick={() => setActiveTab("diff")}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1",
              activeTab === "diff"
                ? "bg-[var(--accent)] text-white shadow-sm"
                : "text-[var(--muted)] hover:text-[var(--text)]"
            )}
          >
            <Diff size={12} />
            Diff
          </button>
          <button
            id="tab-analytics"
            type="button"
            role="tab"
            aria-selected={activeTab === "analytics"}
            onClick={() => setActiveTab("analytics")}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1",
              activeTab === "analytics"
                ? "bg-[var(--accent)] text-white shadow-sm"
                : "text-[var(--muted)] hover:text-[var(--text)]"
            )}
          >
            <BarChart4 size={12} />
            Stats
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      <div className="p-5 min-h-[300px]">
        {/* Tab 1: AI Prompt Copilot */}
        {activeTab === "copilot" && (
          <div className="space-y-4">
            <form onSubmit={handleSendPrompt} className="space-y-2">
              <label htmlFor="ai-copilot-input" className="text-xs font-heading font-bold text-[var(--muted)] uppercase tracking-wider block">
                Instruct the AI to transform your layout:
              </label>
              <div className="relative flex rounded-xl border border-[var(--border)] bg-[var(--bg)] overflow-hidden shadow-inner focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent-muted)]">
                <input
                  id="ai-copilot-input"
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={isCompiling}
                  placeholder="e.g. 'crop to 9:16 and boost saturation and add title Vlog'"
                  className="w-full px-4 py-3 bg-transparent border-none text-sm text-[var(--text)] focus:ring-0 focus:outline-none placeholder-[var(--muted)] placeholder-opacity-70"
                />
                <button
                  id="ai-copilot-submit"
                  type="submit"
                  disabled={!prompt.trim() || isCompiling}
                  className={cn(
                    "px-4 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white flex items-center gap-1.5 transition-colors border-l border-[var(--border)]",
                    (!prompt.trim() || isCompiling) && "opacity-50 cursor-not-allowed bg-[var(--border)]"
                  )}
                  aria-label="Execute prompt"
                >
                  {isCompiling ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <Sparkles size={14} />
                  )}
                  <span className="text-xs font-bold uppercase tracking-wider">Apply</span>
                </button>
              </div>
            </form>

            {/* Quick Prompts Chips */}
            <div className="space-y-2">
              <span className="text-[10px] font-heading font-bold text-[var(--muted)] uppercase tracking-wider block">
                Quick Actions
              </span>
              <div className="flex flex-wrap gap-2">
                {quickPrompts.map((qp, idx) => (
                  <button
                    id={`quick-prompt-${idx}`}
                    key={idx}
                    type="button"
                    onClick={() => applyQuickPrompt(qp.text)}
                    disabled={isCompiling}
                    className="px-2.5 py-1 text-xs rounded-full border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--accent)] hover:bg-[var(--accent-muted)] transition-all cursor-pointer font-medium text-[var(--text)]"
                  >
                    {qp.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated AI Log Panel */}
            {(aiLogs.length > 0 || lastExecutedPrompt) && (
              <div className="mt-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-xs font-mono space-y-2 shadow-inner">
                {lastExecutedPrompt && (
                  <div className="flex items-center gap-1 border-b border-[var(--border)] pb-1.5 text-[var(--muted)]">
                    <span className="font-bold text-[var(--accent)]">Prompt:</span>
                    <span className="italic">&quot;{lastExecutedPrompt}&quot;</span>
                  </div>
                )}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[var(--muted)] block tracking-wider">AI Operations Log:</span>
                  {aiLogs.map((log, index) => (
                    <div key={index} className="flex items-start gap-1.5 text-[var(--text)]">
                      <span className="text-[var(--accent)] font-bold">›</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Instructions Help Alert */}
            <div className="flex items-start gap-2 p-3 bg-[var(--accent-muted)] border border-[var(--border)] rounded-xl text-xs text-[var(--text)]">
              <AlertCircle size={14} className="text-[var(--accent)] shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Reframe&apos;s Client-Side Copilot accepts combinations of layout preset changes (TikTok/Landscape/Square), adjustments (contrast, brightness, saturation), rotations (90/180/270 degrees), audio tracks (mute/normalize), speeds, and overlays. Use <strong>&quot;and&quot;</strong> to chain edits.
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Evolution Timeline & Scrubbing */}
        {activeTab === "timeline" && (
          <div className="space-y-5">
            {/* Replay Controller Bar */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] shadow-sm">
              <span className="text-xs font-semibold text-[var(--muted)]">
                State: {currentStateIndex + 1} / {history.length}
              </span>

              {/* Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  id="replay-prev"
                  type="button"
                  onClick={() => onNavigateHistory(Math.max(0, currentStateIndex - 1))}
                  disabled={currentStateIndex === 0}
                  className="p-1.5 rounded-lg hover:bg-[var(--border)] text-[var(--muted)] disabled:opacity-30 disabled:hover:bg-transparent"
                  title="Previous State"
                >
                  <SkipBack size={14} />
                </button>
                <button
                  id="replay-play"
                  type="button"
                  onClick={() => setIsPlayingReplay(!isPlayingReplay)}
                  className="p-2 rounded-full bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-all shadow"
                  title={isPlayingReplay ? "Pause Autoplay" : "Autoplay Evolution"}
                >
                  {isPlayingReplay ? <Pause size={14} /> : <Play size={14} />}
                </button>
                <button
                  id="replay-next"
                  type="button"
                  onClick={() => onNavigateHistory(Math.min(history.length - 1, currentStateIndex + 1))}
                  disabled={currentStateIndex === history.length - 1}
                  className="p-1.5 rounded-lg hover:bg-[var(--border)] text-[var(--muted)] disabled:opacity-30 disabled:hover:bg-transparent"
                  title="Next State"
                >
                  <SkipForward size={14} />
                </button>
              </div>

              <span className="text-xs font-mono text-[var(--muted)]">
                {isPlayingReplay ? "Playing..." : "Scrub mode"}
              </span>
            </div>

            {/* Scrubbing Slider */}
            {history.length > 1 && (
              <div className="space-y-1">
                <label htmlFor="timeline-scrubber" className="sr-only">Scrub Timeline States</label>
                <input
                  id="timeline-scrubber"
                  type="range"
                  min="0"
                  max={history.length - 1}
                  value={currentStateIndex}
                  onChange={(e) => onNavigateHistory(Number(e.target.value))}
                  className="w-full accent-film-600 cursor-pointer h-1.5 rounded-lg bg-[var(--border)]"
                  aria-label="Timeline scrubbing control"
                />
              </div>
            )}

            {/* Milestone Booking Input Modal-Overlay */}
            {bookmarkingStateId !== null && (
              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg)] shadow-md space-y-3">
                <div className="text-xs font-bold text-[var(--text)]">Bookmark State Milestone</div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={milestoneNameInput}
                    onChange={(e) => setMilestoneNameInput(e.target.value)}
                    placeholder="Milestone name, e.g. Cinematic Version"
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-transparent"
                  />
                  <button
                    type="button"
                    onClick={submitMilestone}
                    className="px-3 py-1.5 bg-[var(--accent)] text-white text-xs rounded-lg font-semibold"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookmarkingStateId(null)}
                    className="px-3 py-1.5 border border-[var(--border)] text-[var(--muted)] text-xs rounded-lg hover:bg-[var(--border)]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Timeline Vertical Stack */}
            <div className="relative pl-6 space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
              {/* Vertical line indicator */}
              <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-[var(--border)]" />

              {history.map((state, idx) => {
                const isActive = idx === currentStateIndex;
                const dateStr = new Date(state.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                });

                return (
                  <div
                    key={state.id}
                    className={cn(
                      "relative group rounded-xl border p-3 bg-[var(--bg)] transition-all flex justify-between items-start gap-4 hover:border-[var(--accent)]",
                      isActive
                        ? "border-[var(--accent)] ring-2 ring-[var(--accent-muted)] bg-[var(--bg)]"
                        : "border-[var(--border)]"
                    )}
                  >
                    {/* Bullet marker */}
                    <div
                      className={cn(
                        "absolute -left-6 top-4 w-3.5 h-3.5 rounded-full border-2 bg-[var(--bg)] flex items-center justify-center transition-all",
                        isActive
                          ? "border-[var(--accent)] bg-[var(--accent)] scale-110 shadow"
                          : "border-[var(--border)]"
                      )}
                    >
                      {state.isMilestone && (
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--warning)]" />
                      )}
                    </div>

                    {/* Timeline Node Info */}
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-[var(--text)]">{state.description}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--border)] text-[var(--muted)] uppercase tracking-wider scale-90">
                          {state.category}
                        </span>
                        {state.isMilestone && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--warning)] bg-opacity-25 text-[var(--warning)] flex items-center gap-0.5">
                            <Bookmark size={8} fill="currentColor" />
                            {state.milestoneName}
                          </span>
                        )}
                      </div>
                      {state.promptText && (
                        <p className="text-xs italic text-[var(--muted)]">Prompt: &quot;{state.promptText}&quot;</p>
                      )}
                      <span className="text-[10px] text-[var(--muted)] font-mono">{dateStr} • Iteration {idx + 1}</span>
                    </div>

                    {/* Node Actions */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        id={`timeline-milestone-btn-${idx}`}
                        type="button"
                        onClick={() => handleToggleMilestoneClick(state)}
                        className={cn(
                          "p-1.5 rounded-lg hover:bg-[var(--border)] transition-colors",
                          state.isMilestone ? "text-[var(--warning)]" : "text-[var(--muted)] hover:text-[var(--text)]"
                        )}
                        title={state.isMilestone ? "Remove Milestone Bookmark" : "Bookmark as Milestone"}
                      >
                        <Bookmark size={12} fill={state.isMilestone ? "currentColor" : "none"} />
                      </button>
                      
                      {idx !== currentStateIndex && (
                        <button
                          id={`timeline-restore-btn-${idx}`}
                          type="button"
                          onClick={() => onNavigateHistory(idx)}
                          className="px-2 py-1 bg-[var(--border)] hover:bg-[var(--accent)] hover:text-white rounded-lg text-[10px] font-bold transition-all"
                          title="Restore design to this iteration"
                        >
                          Restore
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Visual Diff & Parameter Comparisons */}
        {activeTab === "diff" && (
          <div className="space-y-4">
            {/* Compare Selectors */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg)]">
              <div className="space-y-1">
                <label htmlFor="diff-base-select" className="text-[10px] font-heading font-bold text-[var(--muted)] uppercase tracking-wider block">
                  Base Iteration (A):
                </label>
                <select
                  id="diff-base-select"
                  value={diffBaseIndex}
                  onChange={(e) => setDiffBaseIndex(Number(e.target.value))}
                  className="w-full p-2 text-xs rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] focus:ring-1 focus:ring-[var(--accent)] focus:outline-none"
                >
                  {history.map((h, idx) => (
                    <option key={h.id} value={idx}>
                      Iter {idx + 1}: {h.description.substring(0, 30)}...
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="diff-target-select" className="text-[10px] font-heading font-bold text-[var(--muted)] uppercase tracking-wider block">
                  Compare Iteration (B):
                </label>
                <select
                  id="diff-target-select"
                  value={diffTargetIndex}
                  onChange={(e) => setDiffTargetIndex(Number(e.target.value))}
                  className="w-full p-2 text-xs rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] focus:ring-1 focus:ring-[var(--accent)] focus:outline-none"
                >
                  {history.map((h, idx) => (
                    <option key={h.id} value={idx}>
                      Iter {idx + 1}: {h.description.substring(0, 30)}...
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Differences Table */}
            <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--bg)]">
              <div className="grid grid-cols-[1fr_1fr_1fr] bg-[var(--surface)] p-2 text-xs font-bold text-[var(--muted)] uppercase tracking-wider border-b border-[var(--border)] text-center">
                <div>Setting</div>
                <div>Base (A)</div>
                <div>Compare (B)</div>
              </div>

              <div className="max-h-[220px] overflow-y-auto divide-y divide-[var(--border)]">
                {baseCompareDiffs.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[var(--muted)] italic">
                    No parameter differences detected. Both configurations are identical.
                  </div>
                ) : (
                  baseCompareDiffs.map((d, index) => (
                    <div key={index} className="grid grid-cols-[1fr_1fr_1fr] p-2.5 text-xs items-center text-center">
                      <div className="font-semibold text-left pl-2 text-[var(--text)]">{d.label}</div>
                      <div className="text-[var(--muted)] font-mono line-through opacity-75">{d.fromVal}</div>
                      <div>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full font-mono font-semibold text-[10px]",
                            d.type === "added" && "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300",
                            d.type === "removed" && "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300",
                            d.type === "modified" && "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                          )}
                        >
                          {d.toVal}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Workflow Analytics & Success Trends */}
        {activeTab === "analytics" && (
          <div className="space-y-4">
            {/* Overview statistics cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-center shadow-sm">
                <span className="text-[10px] uppercase font-bold text-[var(--muted)] block">Total Edits</span>
                <span className="text-xl font-heading font-extrabold text-[var(--text)]">{totalEdits}</span>
              </div>
              <div className="p-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-center shadow-sm">
                <span className="text-[10px] uppercase font-bold text-[var(--muted)] block">AI Prompts</span>
                <span className="text-xl font-heading font-extrabold text-[var(--accent)]">{aiEditsCount}</span>
              </div>
              <div className="p-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-center shadow-sm">
                <span className="text-[10px] uppercase font-bold text-[var(--muted)] block">Milestones</span>
                <span className="text-xl font-heading font-extrabold text-[var(--warning)]">{milestoneCount}</span>
              </div>
            </div>

            {/* Category distribution bars */}
            <div className="space-y-2.5 p-4 rounded-xl border border-[var(--border)] bg-[var(--bg)]">
              <span className="text-[10px] font-heading font-bold text-[var(--muted)] uppercase tracking-wider block">
                Edit Distribution by Feature Category
              </span>

              <div className="space-y-2">
                {(["Layout", "Color", "Text", "Audio", "Speed", "Macro", "Manual"] as const).map((cat) => {
                  const count = categoryCounts[cat] || 0;
                  const pct = totalEdits > 0 ? (count / totalEdits) * 100 : 0;
                  if (count === 0) return null;

                  return (
                    <div key={cat} className="space-y-0.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-[var(--text)]">{cat}</span>
                        <span className="text-[var(--muted)]">{count} ({pct.toFixed(0)}%)</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-[var(--border)] overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            cat === "Layout" && "bg-blue-500",
                            cat === "Color" && "bg-purple-500",
                            cat === "Text" && "bg-yellow-500",
                            cat === "Audio" && "bg-green-500",
                            cat === "Speed" && "bg-red-500",
                            cat === "Macro" && "bg-pink-500",
                            cat === "Manual" && "bg-slate-400"
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Prompt Effectiveness Meter */}
            <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg)] flex items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-heading font-bold text-[var(--muted)] uppercase tracking-wider block">
                  AI Copilot Effectiveness Rating
                </span>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  Based on AI prompt usage, timeline bookmark milestones, and layout retention.
                </p>
              </div>

              <div className="shrink-0 flex flex-col items-center justify-center border-4 border-[var(--accent)] border-t-[var(--border)] rounded-full w-14 h-14 font-heading font-extrabold text-sm text-[var(--text)] shadow">
                {totalEdits > 0 ? Math.round(((aiEditsCount + milestoneCount) / totalEdits) * 100) : 0}%
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
