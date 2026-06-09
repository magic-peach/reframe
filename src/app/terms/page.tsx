import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms & Conditions — Reframe",
  description:
    "Terms and Conditions for Reframe — a local-first video processing application.",
};

export default function TermsPage() {
  return (
    <>
      <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] pt-24 pb-20">
        {/* Back link */}
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
            {/* Eye Logo */}
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
                  d="M12 4.5C7 4.5 3 12 3 12C3 12 7 19.5 12 19.5C17 19.5 21 12 21 12C21 12 17 4.5 12 4.5Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <circle cx="12" cy="12" r="2.5" fill="currentColor" />
              </svg>
            </div>

            <h1 className="text-5xl font-bold tracking-tight mb-4">
              Terms & Conditions
            </h1>

            <p className="text-sm text-[var(--muted)]">
              Last Updated: June 9, 2026
            </p>
          </div>

          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-10 md:p-14">
            <div className="prose prose-invert prose-lg max-w-none">
              <p className="text-[var(--muted)] leading-relaxed">
                Welcome to Reframe. These Terms & Conditions govern your access
                to and use of Reframe. By using the application, you agree to be
                bound by these terms. If you do not agree, please discontinue
                use of the service.
              </p>

              <h2 className="text-2xl font-semibold mt-12 mb-6 text-[var(--text)]">
                1. Description of Service
              </h2>
              <p className="text-[var(--muted)]">
                Reframe is a browser-based video processing application that
                allows users to edit, transform, and export media directly
                within their browser.
              </p>
              <p className="text-[var(--muted)] mt-4">
                Reframe follows a local-first architecture. Video and media
                processing occur entirely on your device, and user media is not
                uploaded to Reframe servers as part of normal operation.
              </p>

              <h2 className="text-2xl font-semibold mt-12 mb-6 text-[var(--text)]">
                2. Eligibility
              </h2>
              <p className="text-[var(--muted)]">
                You may use Reframe only in compliance with applicable laws and
                regulations. By using the service, you represent that you have
                the legal capacity to enter into these Terms.
              </p>

              <h2 className="text-2xl font-semibold mt-12 mb-6 text-[var(--text)]">
                3. User Content
              </h2>
              <p className="text-[var(--muted)]">
                You retain full ownership of any files, videos, audio, images,
                or other content processed through Reframe.
              </p>
              <p className="text-[var(--muted)] mt-4">
                Reframe does not claim ownership of, access to, or control over
                your content. You are solely responsible for ensuring that your
                use of the application complies with applicable laws and
                third-party rights.
              </p>

              <h2 className="text-2xl font-semibold mt-12 mb-6 text-[var(--text)]">
                4. Acceptable Use
              </h2>
              <p className="text-[var(--muted)]">You agree not to:</p>
              <ul className="text-[var(--muted)]">
                <li>Use Reframe for unlawful purposes.</li>
                <li>
                  Infringe upon intellectual property, privacy, or other legal
                  rights.
                </li>
                <li>
                  Attempt to disrupt, interfere with, or compromise the
                  application or its infrastructure.
                </li>
                <li>
                  Use automated methods to abuse, overload, or impair the
                  service.
                </li>
              </ul>

              <h2 className="text-2xl font-semibold mt-12 mb-6 text-[var(--text)]">
                5. No Data Storage
              </h2>
              <p className="text-[var(--muted)]">
                Reframe does not store, archive, or back up user-generated
                media. Users are responsible for maintaining their own copies
                and backups of exported content.
              </p>
              <p className="text-[var(--muted)] mt-4">
                We are not responsible for loss of files, exports, processing
                results, or user data.
              </p>

              <h2 className="text-2xl font-semibold mt-12 mb-6 text-[var(--text)]">
                6. Third-Party Software
              </h2>
              <p className="text-[var(--muted)]">
                Reframe utilizes third-party open-source software, including
                FFmpeg.wasm, to provide local media processing functionality.
              </p>
              <p className="text-[var(--muted)] mt-4">
                Such software may be governed by separate licenses. Nothing in
                these Terms overrides those licenses.
              </p>

              <h2 className="text-2xl font-semibold mt-12 mb-6 text-[var(--text)]">
                7. Service Availability
              </h2>
              <p className="text-[var(--muted)]">
                Reframe is provided on an "as is" and "as available" basis. We
                do not guarantee uninterrupted availability, error-free
                operation, or specific processing outcomes.
              </p>
              <p className="text-[var(--muted)] mt-4">
                Features may be modified, suspended, or discontinued at any time
                without notice.
              </p>

              <h2 className="text-2xl font-semibold mt-12 mb-6 text-[var(--text)]">
                8. Disclaimer of Warranties
              </h2>
              <p className="text-[var(--muted)]">
                To the fullest extent permitted by law, Reframe disclaims all
                warranties, express or implied, including warranties of
                merchantability, fitness for a particular purpose,
                non-infringement, and reliability.
              </p>
              <p className="text-[var(--muted)] mt-4">
                Your use of the application is entirely at your own risk.
              </p>

              <h2 className="text-2xl font-semibold mt-12 mb-6 text-[var(--text)]">
                9. Limitation of Liability
              </h2>
              <p className="text-[var(--muted)]">
                To the maximum extent permitted by law, Reframe and its
                developers shall not be liable for any indirect, incidental,
                special, consequential, or punitive damages arising from the use
                or inability to use the application.
              </p>
              <p className="text-[var(--muted)] mt-4">
                This includes, without limitation, loss of data, loss of files,
                business interruption, or processing errors.
              </p>

              <h2 className="text-2xl font-semibold mt-12 mb-6 text-[var(--text)]">
                10. Intellectual Property
              </h2>
              <p className="text-[var(--muted)]">
                The Reframe application, branding, website content, and related
                materials are protected by applicable intellectual property
                laws.
              </p>
              <p className="text-[var(--muted)] mt-4">
                Open-source components remain subject to their respective
                licenses.
              </p>

              <h2 className="text-2xl font-semibold mt-12 mb-6 text-[var(--text)]">
                11. Open Source Transparency
              </h2>
              <p className="text-[var(--muted)]">
                Reframe is open source and may make its source code publicly
                available for inspection and verification.
              </p>
              <p className="text-[var(--muted)] mt-4">
                Access to source code does not grant rights to use Reframe
                trademarks, branding, or logos without authorization.
              </p>

              <h2 className="text-2xl font-semibold mt-12 mb-6 text-[var(--text)]">
                12. Indemnification
              </h2>
              <p className="text-[var(--muted)]">
                You agree to indemnify and hold harmless Reframe, its
                contributors, and affiliates from claims, damages, liabilities,
                costs, and expenses arising from your use of the service or your
                violation of these Terms.
              </p>

              <h2 className="text-2xl font-semibold mt-12 mb-6 text-[var(--text)]">
                13. Changes to These Terms
              </h2>
              <p className="text-[var(--muted)]">
                We may update these Terms periodically. Continued use of Reframe
                following updates constitutes acceptance of the revised Terms.
              </p>

              <h2 className="text-2xl font-semibold mt-12 mb-6 text-[var(--text)]">
                14. Termination
              </h2>
              <p className="text-[var(--muted)]">
                We reserve the right to suspend or terminate access to the
                service if these Terms are violated.
              </p>

              <h2 className="text-2xl font-semibold mt-12 mb-6 text-[var(--text)]">
                15. Governing Law
              </h2>
              <p className="text-[var(--muted)]">
                These Terms shall be governed by the laws applicable in the
                jurisdiction where the service operator is established, without
                regard to conflict-of-law principles.
              </p>

              <h2 className="text-2xl font-semibold mt-12 mb-6 text-[var(--text)]">
                16. Contact
              </h2>
              <p className="text-[var(--muted)]">
                If you have questions regarding these Terms & Conditions, please{" "}
                <Link
                  href="/contact"
                  className="text-[var(--accent)] hover:underline"
                >
                  contact us
                </Link>
                .
              </p>

              <div className="mt-16 pt-8 border-t border-[var(--border)] text-center">
                <p className="text-[var(--muted)]">
                  By using Reframe, you acknowledge that you have read,
                  understood, and agreed to these Terms & Conditions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
