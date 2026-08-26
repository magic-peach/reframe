"use client";

import { usePathname } from "next/navigation";
import BrandLogo from "@/components/BrandLogo";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Header() {
  const pathname = usePathname();

  // Hide the default editor header on the landing page
  if (pathname === "/") {
    return null;
  }

  return (
    <header
      role="banner"
      className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 border-b border-[var(--border)] bg-[var(--bg)]"
    >
      <div className="flex items-center gap-2">
        <BrandLogo size={24} />
        <span className="text-lg font-semibold">Reframe</span>
      </div>
      <ThemeToggle />
    </header>
  );
}
