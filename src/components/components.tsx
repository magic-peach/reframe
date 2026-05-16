import { type ReactNode } from "react";

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
export function Card({ title, description, children, className = "" }: CardProps) {
  return (
    <div
      className={`
        rounded-xl border p-6
        bg-white dark:bg-gray-800
        border-gray-200 dark:border-gray-700
        shadow-sm dark:shadow-gray-900/40
        ${className}
      `}
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

export function Button({ variant = "primary", className = "", children, ...props }: ButtonProps) {
  const variants = {
    primary: `
      bg-blue-600 dark:bg-blue-500
      text-white
      hover:bg-blue-700 dark:hover:bg-blue-600
      focus:ring-blue-500
    `,
    secondary: `
      bg-gray-100 dark:bg-gray-700
      text-gray-800 dark:text-gray-100
      hover:bg-gray-200 dark:hover:bg-gray-600
      focus:ring-gray-400
    `,
    ghost: `
      bg-transparent
      text-gray-700 dark:text-gray-300
      hover:bg-gray-100 dark:hover:bg-gray-800
      focus:ring-gray-400
    `,
  };

  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2
        rounded-lg px-4 py-2 text-sm font-medium
        focus:outline-none focus:ring-2 focus:ring-offset-2
        dark:focus:ring-offset-gray-900
        transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * Input — demonstrates form field dark mode variants.
 */
export function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`
        w-full rounded-lg px-3 py-2 text-sm
        bg-white dark:bg-gray-900
        text-gray-900 dark:text-gray-100
        border border-gray-300 dark:border-gray-600
        placeholder-gray-400 dark:placeholder-gray-500
        focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
        focus:border-transparent
        transition-colors duration-200
        ${className}
      `}
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
}

export function Badge({ label, variant = "default" }: BadgeProps) {
  const variants = {
    default:  "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
    success:  "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400",
    warning:  "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400",
    error:    "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400",
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]}`}>
      {label}
    </span>
  );
}
