"use client";

export default function FAQ() {
  const faqs = [
    {
      question: "Is my video uploaded anywhere?",
      answer:
        "No. All processing happens directly in your browser using FFmpeg.wasm. Your video never leaves your device — there are no server uploads.",
    },
    {
      question: "What video formats are supported?",
      answer:
        "Reframe supports MP4, WebM, MOV, and AVI files. MP4 with H.264 encoding works best for reliable processing.",
    },
    {
      question: "Why is processing slow for large files?",
      answer:
        "FFmpeg.wasm runs in the browser, not on a server. Large files require more CPU and memory on your device. Processing a 1080p video typically takes 1–3x real-time duration.",
    },
    {
      question: "Can I use this offline?",
      answer:
        "Yes. Once the page is loaded, all processing happens locally. You can disconnect from the internet and continue editing and exporting videos.",
    },
  ];

  return (
    <section className="w-full max-w-2xl mx-auto px-4 py-12">
      <h2 className="font-display text-2xl text-center text-[var(--text)] mb-6">
        How It Works
      </h2>
      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <details
            key={index}
            className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden"
          >
            <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer font-heading text-sm font-semibold text-[var(--text)] select-none list-none [&::-webkit-details-marker]:hidden">
              {faq.question}
              <span className="text-[var(--muted)] transition-transform duration-200 group-open:rotate-45 text-lg flex-shrink-0">
                +
              </span>
            </summary>
            <div className="px-5 pb-4 text-sm text-[var(--muted)] leading-relaxed">
              {faq.answer}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
