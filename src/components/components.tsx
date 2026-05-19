import { type ReactNode } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge tailwind classes without conflicts.
 * It uses clsx to handle conditional classes and twMerge to handle Tailwind conflicts.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- COMPONENTS ---

interface CardProps {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

/**
 * Reusable Card component demonstrating dark: variant usage.
 * All interactive and structural colors are dual-themed.
 */
export function Card({ title, description, children, className }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border p-6 shadow-sm",
        "bg-white dark:bg-gray-800",
        "border-gray-200 dark:border-gray-700",
        "dark:shadow-gray-900/40",
        className
      )}
    >
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
        {title}
      </h2>
      {description && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

/**
 * Primary Button — demonstrates interactive dark mode states.
 */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
}

export function Button({ variant = "primary", className, children, ...props }: ButtonProps) {
  const variants = {
    primary:
      "bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 focus:ring-blue-500",
    secondary:
      "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 focus:ring-gray-400",
    ghost:
      "bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-400",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * Input — demonstrates form field dark mode variants.
 */
export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-lg px-3 py-2 text-sm transition-colors duration-200",
        "bg-white dark:bg-gray-900",
        "text-gray-900 dark:text-gray-100",
        "border border-gray-300 dark:border-gray-600",
        "placeholder-gray-400 dark:placeholder-gray-500",
        "focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400",
        className
      )}
      {...props}
    />
  );
}

/**
 * Badge — subtle label with dark support.
 */
interface BadgeProps {
  label: string;
  variant?: "default" | "success" | "warning" | "error";
  className?: string;
}

export function Badge({ label, variant = "default", className }: BadgeProps) {
  const variants = {
    default: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
    success: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
    warning: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400",
    error: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {label}
    </span>
  );
}

/**
 * Toggle (Switch) — Interactive boolean input with dark mode support.
 */
interface ToggleProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export function Toggle({ label, className, ...props }: ToggleProps) {
  return (
    <label className={cn("relative flex items-center gap-3 cursor-pointer", className)}>
      <div className="relative inline-flex items-center">
        <input type="checkbox" className="sr-only peer" {...props} />
        <div className={cn(
          "w-9 h-5 rounded-full transition-colors duration-200 ease-in-out",
          "bg-gray-200 dark:bg-gray-700",
          "peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 dark:peer-focus:ring-blue-400 peer-focus:ring-offset-2 dark:peer-focus:ring-offset-gray-900",
          "peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500",
          "after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4",
          "after:bg-white after:border-gray-300 after:border after:rounded-full after:transition-all after:duration-200",
          "peer-checked:after:translate-x-full peer-checked:after:border-white"
        )}></div>
      </div>
      {label && (
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 select-none">
          {label}
        </span>
      )}
    </label>
  );
}