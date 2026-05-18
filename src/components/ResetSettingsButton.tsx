import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResetSettingsButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onReset: () => void;
}

export default function ResetSettingsButton({ onReset, className, ...props }: ResetSettingsButtonProps) {
  return (
    <button
      type="button"
      onClick={onReset}
      className={cn(
        "group relative flex items-center justify-center gap-2",
        "px-4 py-2 rounded-xl text-xs font-semibold tracking-wide",
        "bg-black/5 dark:bg-white/5 border border-[var(--border)]",
        "backdrop-blur-sm",
        "text-[var(--muted)] transition-all duration-200 ease-out",
        "hover:text-red-500 hover:border-red-500/30 hover:bg-red-500/10 hover:shadow-[0_0_15px_rgba(239,68,68,0.1)]",
        "active:scale-[0.97] active:bg-red-500/20",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]",
        className
      )}
      {...props}
    >
      <RotateCcw
        size={14}
        className="transition-transform duration-300 ease-out group-hover:-rotate-180"
        aria-hidden="true"
      />
      <span>Reset all settings</span>
    </button>
  );
}
