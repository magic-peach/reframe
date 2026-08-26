import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms and Conditions — Reframe",
  description:
    "Terms and Conditions for using Reframe — the free, browser-based video editor.",
};

export default function TermsPage() {
  return (
    <>
      <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] pt-24 pb-20">
        {/* Back link - top left below header */}
        <div className="px-6 mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-[var(--muted)] transition-colors hover:text-[var(--text)]"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Reframe
          </Link>
        </div>

        <div className="max-w-4xl mx-auto px-6">
          <div className="mb-12 text-center flex flex-col items-center">
            {/* Document Logo */}
            <div className="mb-6">
              <svg
                width="80"
                height="80"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-[var(--accent)]"
              >
                <path
                  d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path
                  d="M14 3v5h5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 13h6M9 17h6M9 9h1"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <h1 className="text-5xl font-bold tracking-tight mb-4">
              Terms and Conditions
            </h1>
          </div>

          {/* Bordered Content Box */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-10 md:p-14">
            <div className="prose prose-invert prose-lg max-w-none">
              <p className="text-[var(--muted)] leading-relaxed">
                Welcome to Reframe. By accessing or using this application,
                you agree to be bound by the following Terms and Conditions.
                Please read them carefully before using Reframe. If you do
                not agree with any part of these terms, you should not use
                the application.
              </p>

              <h2 className="text-2xl font-semibold mt-12 mb-6 text-[var(--text)]">
                1. Acceptance of Terms
              </h2>
              <p className="text-[var(--muted)]">
                By using Reframe, you confirm that you accept these Terms and
                Conditions and agree to comply with them. These terms apply
                to all visitors and users of the application, regardless of
                how it is accessed.
              </p>

              <h2 className="text-2xl font-semibold mt-12 mb-6 text-[var(--text)]">
                2. User Responsibilities
              </h2>
              <p className="text-[var(--muted)]">
                You are solely responsible for the media files you edit and
                export using Reframe. Because all processing happens locally
                on your device, you retain full ownership and control of
                your content at all times, and you are responsible for
                ensuring you have the necessary rights to use and edit any
                material you load into the application.
              </p>
              <p className="text-[var(--muted)] mt-4">
                You agree to use Reframe in compliance with all applicable
                local, national, and international laws.
              </p>

              <h2 className="text-2xl font-semibold mt-12 mb-6 text-[var(--text)]">
                3. Acceptable Use Policy
              </h2>
              <p className="text-[var(--muted)]">
                You agree not to use Reframe to create, edit, or export
                content that is unlawful, infringing, defamatory, obscene,
                or that violates the rights of any third party.
              </p>
              <p className="text-[var(--muted)] mt-4">
                You further agree not to attempt to interfere with,
                disrupt, reverse-engineer for malicious purposes, or gain
                unauthorized access to the application or its underlying
                source code beyond what is permitted by its open-source
                license.
              </p>

              <h2 className="text-2xl font-semibold mt-12 mb-6 text-[var(--text)]">
                4. Account Restrictions
              </h2>
              <p className="text-[var(--muted)]">
                Reframe does not require account creation or authentication
                to use its core features. As there are no user accounts,
                there are no account-specific restrictions; however, access
                to the application may be restricted at the discretion of
                the maintainers in cases of abuse, unlawful use, or attempts
                to disrupt the service for other users.
              </p>

              <h2 className="text-2xl font-semibold mt-12 mb-6 text-[var(--text)]">
                5. Intellectual Property
              </h2>
              <p className="text-[var(--muted)]">
                The Reframe source code is open source and distributed under
                the MIT License. You are free to use, modify, and
                redistribute the code in accordance with the terms of that
                license.
              </p>
              <p className="text-[var(--muted)] mt-4">
                The Reframe name, logo, and branding remain the property of
                the project maintainers and may not be used to imply
                endorsement without permission. Media files you create or
                edit using Reframe remain entirely your own property;
                Reframe claims no ownership or rights over user content.
              </p>

              <h2 className="text-2xl font-semibold mt-12 mb-6 text-[var(--text)]">
                6. Limitation of Liability
              </h2>
              <p className="text-[var(--muted)]">
                Reframe is provided &ldquo;as is&rdquo; and &ldquo;as
                available,&rdquo; without warranties of any kind, either
                express or implied. The maintainers and contributors make no
                guarantees regarding the accuracy, reliability, or
                availability of the application.
              </p>
              <p className="text-[var(--muted)] mt-4">
                To the fullest extent permitted by law, the maintainers and
                contributors shall not be held liable for any direct,
                indirect, incidental, or consequential damages arising from
                your use of, or inability to use, Reframe, including but not
                limited to loss of data or exported media.
              </p>

              <h2 className="text-2xl font-semibold mt-12 mb-6 text-[var(--text)]">
                7. Changes to These Terms
              </h2>
              <p className="text-[var(--muted)]">
                These Terms and Conditions may be updated from time to time
                as Reframe evolves. Any changes will be reflected on this
                page and in the public repository. Continued use of the
                application after changes are published constitutes
                acceptance of the updated terms.
              </p>

              <div className="mt-16 pt-8 border-t border-[var(--border)] text-center">
                <p className="text-[var(--muted)]">
                  If you have any questions about these Terms and
                  Conditions, please{" "}
                  <Link
                    href="/contact"
                    className="text-[var(--accent)] hover:underline"
                  >
                    contact us
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
