"use client";

import { Box, Progress, Text, Group, Stack, rem } from "@mantine/core";
import { Check, Loader2 } from "lucide-react";
import { memo } from "react";

export type ExportStage = "preparing" | "processing" | "finalizing" | "complete";

interface ExportWorkflowProps {
  stage: ExportStage;
  progress: number;
  eta?: string;
}

const STAGES: { key: ExportStage; label: string }[] = [
  { key: "preparing", label: "Preparing" },
  { key: "processing", label: "Processing" },
  { key: "finalizing", label: "Finalizing" },
  { key: "complete", label: "Complete" },
];

const EXPORT_ACCENT = 'var(--accent)';

export const ExportWorkflow = memo(({ stage, progress, eta }: ExportWorkflowProps) => {
  const currentStageIndex = STAGES.findIndex((s) => s.key === stage);

  return (
    <Stack gap="md" w="100%">
      {/* Workflow Steps */}
      <Box style={{ width: '100%' }}>
        <Group 
          justify="space-between" 
          gap={0} 
          wrap="nowrap" 
          style={{ 
            position: 'relative',
            width: '100%',
            padding: `0 ${rem(10)}`
          }}
        >
          {/* Connector Line */}
          <Box
            style={{
              position: 'absolute',
              top: rem(10),
              left: rem(20),
              right: rem(20),
              height: rem(1),
              backgroundColor: 'var(--border)',
              zIndex: 0,
            }}
          />

          {STAGES.map((s, index) => {
            const isCompleted = index < currentStageIndex || stage === "complete";
            const isActive = index === currentStageIndex && stage !== "complete";
            const isPending = index > currentStageIndex && stage !== "complete";

            return (
              <Stack key={s.key} gap={8} align="center" style={{ zIndex: 1, flex: 1 }}>
                <Box
                  style={{
                    width: rem(20),
                    height: rem(20),
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isCompleted 
                      ? EXPORT_ACCENT 
                      : isActive 
                        ? 'var(--surface)' 
                        : 'var(--bg)',
                    border: `1px solid ${isCompleted || isActive ? EXPORT_ACCENT : 'var(--border)'}`,
                    color: isCompleted ? 'var(--bg)' : isActive ? EXPORT_ACCENT : 'var(--muted)',
                    transition: 'all 0.3s ease',
                    boxShadow: isActive ? `0 0 6px rgba(242, 73, 81, 0.2)` : 'none',
                    opacity: isPending ? 0.5 : 1,
                  }}
                >
                  {isCompleted ? (
                    <Check size={10} strokeWidth={4} />
                  ) : isActive ? (
                    <Loader2 size={10} className="animate-spin" />
                  ) : (
                    <Text size="xs" fw={800} style={{ fontSize: rem(9), color: 'inherit' }}>{index + 1}</Text>
                  )}
                </Box>
                <Text
                  size="xs"
                  fw={isActive ? 800 : 700}
                  tt="uppercase"
                  lts="0.05em"
                  className="hidden sm:block"
                  style={{
                    color: isActive ? 'var(--text)' : 'var(--muted)',
                    opacity: isPending ? 0.4 : 1,
                    transition: 'all 0.3s ease',
                    fontSize: rem(9),
                    whiteSpace: 'nowrap',
                  }}
                >
                  {s.label}
                </Text>
              </Stack>
            );
          })}
        </Group>
      </Box>

      {/* Progress Section */}
      <Stack gap={4} mt={2}>
        {/* Row 1: Progress Bar + Percentage */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="flex-1">
            <Progress
              value={progress}
              size="lg"
              radius="xl"
              aria-label={stage === "preparing" ? "Engine download progress" : "Export progress"}
              animated={isActiveProcessing(stage)}
              styles={{
                root: {
                  backgroundColor: 'var(--border)',
                  opacity: 0.2,
                  overflow: 'hidden',
                  height: rem(8),
                },
                section: {
                  transition: 'width 500ms ease-out',
                  backgroundColor: EXPORT_ACCENT,
                  boxShadow: `0 0 4px rgba(242, 73, 81, 0.12)`,
                  position: 'relative',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 2s infinite linear',
                  }
                }
              }}
            />
          </div>
          <Text 
            size="sm" 
            fw={700} 
            ff="var(--font-syne)" 
            style={{ 
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '0.01em',
              color: 'var(--text)',
            }}
            className="sm:min-w-[45px] text-left sm:text-right"
          >
            {Math.round(progress)}%
          </Text>
        </div>

        {/* Row 2: ETA / Status */}
        <Text 
          size="xs" 
          fw={600} 
          tt="uppercase" 
          lts="0.05em" 
          style={{ 
            fontSize: rem(10),
            color: 'var(--muted)',
          }}
          className="text-left"
        >
          {eta ? `About ${eta} remaining` : stage === 'processing' ? 'Processing frames...' : 'Initializing...'}
        </Text>
      </Stack>
    </Stack>
  );
});

function isActiveProcessing(stage: ExportStage) {
  return stage === "processing" || stage === "preparing";
}

ExportWorkflow.displayName = "ExportWorkflow";
