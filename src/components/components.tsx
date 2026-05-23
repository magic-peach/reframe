import { type ReactNode } from "react";

interface CardProps {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

/**
 * Reusable Card component.
 */
export function Card({ title, description, children, className = "" }: CardProps) {
  return (
    <div
      className={`
        rounded-xl border p-6
        bg-[var(--surface)]
        border-[var(--border)]
        shadow-sm
        ${className}
      `}
    >
      <h2 className="text-xl font-semibold text-[var(--text)]">
        {title}
      </h2>
      {description && (
        <p className="mt-1 text-sm text-[var(--muted)]">
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
      bg-[var(--accent)]
      text-white
      hover:opacity-90
      focus:ring-blue-500
    `,
    secondary: `
      bg-[var(--surface)]
      text-[var(--text)]
      border border-[var(--border)]
      hover:opacity-90
      focus:ring-gray-400
    `,
    ghost: `
      bg-transparent
      text-[var(--text)]
      hover:bg-[var(--surface)]
      focus:ring-gray-400
    `,
  };

  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2
        rounded-lg px-4 py-2 text-sm font-medium
        focus:outline-none focus:ring-2 focus:ring-offset-2
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
        bg-[var(--bg)]
        text-[var(--text)]
        border border-[var(--border)]
        placeholder-[var(--muted)]
        focus:outline-none focus:ring-2 focus:ring-blue-500
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
    default:  "bg-[var(--surface)] text-[var(--text)] border border-[var(--border)]",
    success:  "bg-[var(--surface)] text-[var(--text)] border border-[var(--border)]",
    warning:  "bg-[var(--surface)] text-[var(--text)] border border-[var(--border)]",
    error:    "bg-[var(--surface)] text-[var(--text)] border border-[var(--border)]",
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]}`}>
      {label}
    </span>
  );
}
