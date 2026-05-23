"use client";

import FocusTrap from "focus-trap-react";
import { useEffect, useRef, useCallback, memo, useState, useMemo } from "react";
import { ExportStatus } from "@/lib/types";
import TipCarousel from "./TipCarousel";
import { ExportWorkflow, ExportStage } from "./ExportWorkflow";
import { Stack, Text, Box, rem } from "@mantine/core";

interface Props {
  status: ExportStatus;
  progress: number;
  onCancel?: () => void;
}

const ProcessingOrbit = memo(() => (
  <div className="mx-auto w-16 h-16 relative flex items-center justify-center">
    {/* Subtle outer track */}
    <div className="absolute inset-0 rounded-full border-[2px] border-white/5 opacity-30" />
    
    {/* Orbiting particles */}
    <div className="absolute inset-0 animate-[spin_3s_linear_infinite]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#f24951] rounded-full shadow-[0_0_8px_#f24951]" />
    </div>
    <div className="absolute inset-0 animate-[spin_2s_linear_infinite_reverse]">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#f24951]/60 rounded-full shadow-[0_0_6px_#f24951]" />
    </div>

    {/* Spinning segmented ring with more weight and glow */}
    <svg className="animate-[spin_1.5s_linear_infinite] w-12 h-12 absolute text-[#f24951] drop-shadow-[0_0_12px_rgba(242,73,81,0.4)]" viewBox="0 0 24 24" fill="none">
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
    
    {/* Center pulse */}
    <div className="w-3 h-3 bg-[#f24951] rounded-full animate-pulse shadow-[0_0_10px_rgba(242,73,81,0.3)]" />
  </div>
));
ProcessingOrbit.displayName = "ProcessingOrbit";

export default function ExportOverlay({ status, progress, onCancel }: Props) {
  const visible = status === "loading-engine" || status === "exporting";
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const focusAnchorRef = useRef<HTMLDivElement | null>(null);
  
  // ETA Calculation
  const startTimeRef = useRef<number | null>(null);
  const [eta, setEta] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (status === "exporting" && progress > 5 && startTimeRef.current === null) {
      startTimeRef.current = Date.now();
    }
    
    if (status === "exporting" && progress > 5 && startTimeRef.current !== null) {
      const elapsed = Date.now() - startTimeRef.current;
      const estimatedTotal = (elapsed / progress) * 100;
      const remaining = estimatedTotal - elapsed;
      
      if (remaining > 0) {
        const seconds = Math.ceil(remaining / 1000);
        if (seconds > 60) {
          setEta(`${Math.floor(seconds / 60)}m ${seconds % 60}s`);
        } else {
          setEta(`${seconds}s`);
        }
      }
    }

    if (!visible) {
      startTimeRef.current = null;
      setEta(undefined);
    }
  }, [status, progress, visible]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      onCancel?.();
    }
  }, [onCancel]);

  useEffect(() => {
    if (visible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    window.addEventListener("keydown", handleKeyDown);
    previousFocusRef.current = document.activeElement as HTMLElement;
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [visible, handleKeyDown]);

  useEffect(() => {
    if (!visible && previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  }, [visible]);

  const isLoading = status === "loading-engine";

  const exportStage: ExportStage = useMemo(() => {
    if (isLoading) return "preparing";
    if (progress === 0) return "preparing";
    if (progress >= 99) return "finalizing";
    return "processing";
  }, [isLoading, progress]);

  const getProgressMessage = () => {
    if (isLoading) {
      return {
        title: "Initializing Export",
        description: "Setting up the video engine for processing.",
      };
    }
    if (progress === 0) {
      return {
        title: "Preparing Media",
        description: "Optimizing assets for the export pipeline.",
      };
    }
    if (progress >= 99) {
      return {
        title: "Finalizing Output",
        description: "Encoding metadata and saving your file.",
      };
    }
    return {
      title: "Exporting",
      description: "Processing your video with hardware acceleration.",
    };
  };

  const { title, description } = getProgressMessage();

  if (!visible) return null;

  return (
    <FocusTrap
      active={visible}
      focusTrapOptions={{
        escapeDeactivates: true,
        clickOutsideDeactivates: false,
        initialFocus: () => focusAnchorRef.current!,
        fallbackFocus: () => focusAnchorRef.current!,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[var(--bg)]/95 backdrop-blur-xl"
      >
        <div
          className="text-center space-y-8 w-full max-w-[90%] sm:max-w-md px-6 animate-fade-in"
          aria-live="polite"
        >
          <div
            ref={focusAnchorRef}
            tabIndex={-1}
            className="sr-only"
            aria-hidden="true"
          />
          
          <Box mt="md">
            <ProcessingOrbit />
          </Box>

          <Stack gap={2} className="transition-all duration-500">
            <h2 
              key={title}
              className="font-heading font-bold text-3xl tracking-tight text-[var(--text)] animate-fade-in"
            >
              {title}
            </h2>
            <Text 
              key={description}
              size="xs"
              c="dimmed"
              className="animate-fade-in max-w-[320px] mx-auto leading-relaxed"
            >
              {description}
            </Text>
          </Stack>

          <span className="sr-only">
            {title}: {Math.round(progress)}%
          </span>

          <Box w="100%">
            <ExportWorkflow stage={exportStage} progress={progress} eta={eta} />
          </Box>

          <Box w="100%">
            <TipCarousel />
          </Box>

          {!isLoading && (
            <Stack gap="xs" align="center">
              <button
                type="button"
                onClick={() => onCancel?.()}
                className="group relative inline-flex items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-8 py-3 text-sm font-bold text-[var(--text)]/80 transition-all hover:bg-[var(--bg)] hover:text-[var(--text)] active:scale-[0.98] shadow-lg overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                Cancel Export
              </button>
              <Text size="xs" fw={700} tt="uppercase" lts="0.1em" c="dimmed" style={{ fontSize: rem(9) }}>
                Press <span className="text-[var(--text)]">Esc</span> to cancel
              </Text>
            </Stack>
          )}
        </div>
      </div>
    </FocusTrap>
  );
}