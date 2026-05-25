import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  size?: number;
}

export default function BrandLogo({ className, size = 32 }: BrandLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn("shrink-0 text-film-600", className)}
    >
      <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" />
      <path d="M10 8L16 12L10 16V8Z" fill="currentColor" />
      <circle cx="3" cy="7" r="1.5" fill="var(--surface)" />
      <circle cx="3" cy="12" r="1.5" fill="var(--surface)" />
      <circle cx="3" cy="17" r="1.5" fill="var(--surface)" />
      <circle cx="21" cy="7" r="1.5" fill="var(--surface)" />
      <circle cx="21" cy="12" r="1.5" fill="var(--surface)" />
      <circle cx="21" cy="17" r="1.5" fill="var(--surface)" />
    </svg>
  );
}
