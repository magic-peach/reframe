"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, Github, Mail, MapPin, Send, Sparkles } from "lucide-react";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1 text-xs text-red-400">
      {message}
    </p>
  );
}

export default function ContactClient() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    github: "",
    socials: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const stats = useMemo(
    () => [
      { label: "Response window", value: "24-48h" },
      { label: "Best for", value: "bugs, UX, docs" },
      { label: "Project focus", value: "browser video editing" },
    ],
    [],
  );

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.name.trim()) nextErrors.name = "Name is required.";
    if (!formData.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (!formData.message.trim()) {
      nextErrors.message = "Message is required.";
    } else if (formData.message.trim().length < 10) {
      nextErrors.message = "Message should be at least 10 characters.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess("");

    if (!validate()) return;

    try {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 900));
      setSuccess("Your message is queued. Thanks for reaching out.");
      setFormData({
        name: "",
        email: "",
        github: "",
        socials: "",
        message: "",
      });
    } catch {
      setErrors({ submit: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--muted)] transition-shadow focus:outline-none focus:ring-2 focus:ring-film-400";

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[var(--muted)] transition-colors hover:text-[var(--text)]"
          >
            <ArrowLeft size={14} />
            Back to Reframe
          </Link>
        </div>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                <Sparkles size={12} className="text-film-600" />
                Contact
              </div>

              <div className="space-y-3">
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                  Contact Us
                </h1>
                <p className="max-w-xl text-sm leading-6 text-[var(--muted)] sm:text-base">
                  Send bugs, ideas, or contributor notes. This is the fastest
                  route if you want to talk about Reframe, GSSoC work, or a
                  fix you’re trying to land.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-sm font-medium text-[var(--text)]">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Reach out
              </h2>
              <div className="mt-4 space-y-4 text-sm">
                <a
                  href="mailto:hello@reframe.video"
                  className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-3 transition-colors hover:border-film-400"
                >
                  <span className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-2">
                    <Mail size={14} />
                  </span>
                  <span>
                    <span className="block font-medium">Email</span>
                    <span className="text-xs text-[var(--muted)]">
                      hello@reframe.video
                    </span>
                  </span>
                </a>

                <a
                  href="https://github.com/magic-peach/reframe"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-3 transition-colors hover:border-film-400"
                >
                  <span className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-2">
                    <Github size={14} />
                  </span>
                  <span>
                    <span className="block font-medium">GitHub</span>
                    <span className="text-xs text-[var(--muted)]">
                      Issues, PRs, and repo feedback
                    </span>
                  </span>
                </a>

                <div className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-3">
                  <span className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-2">
                    <MapPin size={14} />
                  </span>
                  <span>
                    <span className="block font-medium">Location</span>
                    <span className="text-xs text-[var(--muted)]">
                      Browser-based, so location is wherever you are
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
                    Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    autoComplete="name"
                    className={inputClass}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? "name-error" : undefined}
                  />
                  <FieldError id="name-error" message={errors.name} />
                </div>

                <div>
                  <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className={inputClass}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "email-error" : undefined}
                  />
                  <FieldError id="email-error" message={errors.email} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="github" className="mb-1.5 block text-sm font-medium">
                    GitHub
                  </label>
                  <input
                    id="github"
                    name="github"
                    value={formData.github}
                    onChange={handleChange}
                    placeholder="@username"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="socials" className="mb-1.5 block text-sm font-medium">
                    Social link
                  </label>
                  <input
                    id="socials"
                    name="socials"
                    value={formData.socials}
                    onChange={handleChange}
                    placeholder="https://..."
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="message" className="mb-1.5 block text-sm font-medium">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell us what you need help with or what you want to improve."
                  rows={7}
                  className={`${inputClass} resize-y`}
                  aria-invalid={Boolean(errors.message)}
                  aria-describedby={errors.message ? "message-error" : undefined}
                />
                <div className="mt-1 flex items-center justify-between text-xs text-[var(--muted)]">
                  <span>{formData.message.length}/500 characters</span>
                  <span>Minimum 10 characters</span>
                </div>
                <FieldError id="message-error" message={errors.message} />
              </div>

              <div className="space-y-2">
                <FieldError id="submit-error" message={errors.submit} />
                {success && (
                  <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                    {success}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Send size={14} />
                {loading ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
