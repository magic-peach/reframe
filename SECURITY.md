# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| latest  | ✅        |

## Security Overview

Reframe processes all video files **100% client-side** using FFmpeg.wasm. Your files are never uploaded to any server. However, we take security seriously and implement multiple layers of protection:

- **Subresource Integrity (SRI)**: All FFmpeg.wasm files are loaded with SRI verification to prevent supply chain attacks
- **Content-Security-Policy**: Strict CSP headers restrict resource loading
- **COOP/COEP Headers**: Enable SharedArrayBuffer with proper isolation
- **Fail-Safe Design**: Security errors prevent loading unverified code

For detailed implementation information, see [SECURITY_HARDENING.md](docs/SECURITY_HARDENING.md).

## Reporting a Vulnerability

If you discover a security vulnerability in Reframe, please **do not** open a public GitHub issue until the vulnerability has been reviewed and fixed.

Instead, report it using one of the following methods:

- **GitHub Issue (labeled `security`):** Open a [new issue](https://github.com/magic-peach/reframe/issues/new) and apply the `security` label. For sensitive details, use a private channel below.
- **Email:** Contact the maintainer directly at [maintainer email] with the subject line `[SECURITY] Reframe Vulnerability Report`.

### What to Include in Your Report

Please provide as much detail as possible to help us understand and reproduce the issue:

- A clear description of the vulnerability
- Steps to reproduce the issue
- The potential impact (e.g., data exposure, code execution)
- Any suggested mitigations or fixes (if known)
- Affected versions and deployment configurations

### Our Commitment

- We will acknowledge your report within **3 business days**
- We will provide a resolution timeline within **7 business days**
- We will credit you in the fix (unless you prefer to remain anonymous)
- Critical vulnerabilities will be addressed within **14 days** of confirmation

## Security Considerations

### Client-Side Processing
Reframe processes all video files **100% client-side** using FFmpeg.wasm. Your files are never uploaded to any server. However, vulnerabilities in the browser sandbox, WebAssembly execution, or third-party dependencies are still in scope for this policy.

### Supply Chain Security
We implement Subresource Integrity (SRI) for all FFmpeg.wasm files loaded from CDN. This prevents:
- CDN compromise attacks
- Man-in-the-middle injection
- Supply chain tampering

See [SECURITY_HARDENING.md](docs/SECURITY_HARDENING.md) for implementation details.

### WebAssembly Security
FFmpeg.wasm executes WebAssembly code in the browser. We mitigate risks through:
- SRI verification of all WASM modules
- Strict CSP headers
- COOP/COEP isolation for multi-threaded execution
- No arbitrary code execution from user input

## Scope

| In Scope | Out of Scope |
|----------|--------------|
| XSS / script injection vulnerabilities | Vulnerabilities in FFmpeg.wasm itself (report upstream) |
| Dependency vulnerabilities (npm packages) | Issues with user's browser or OS configuration |
| Malicious file handling / path traversal | Third-party CDN reliability (outages, not security) |
| Logic bugs that could expose user data | Social engineering attacks |
| Supply chain attacks on CDN dependencies | Vulnerabilities in browser implementations |
| SRI/CSP misconfigurations | Issues with user's local network |

## Disclosure Policy

We follow **responsible disclosure**. Please give us reasonable time to address the issue before any public disclosure. We aim to resolve critical vulnerabilities within **14 days** of confirmation.

## Security Best Practices for Users

1. **Keep your browser updated** - Latest security patches
2. **Use official deployments** - Verify you're on the legitimate site
3. **Report suspicious behavior** - If something seems wrong, report it
4. **Don't modify the code** - Modified versions may have security issues

## Related Documentation

- [SECURITY_HARDENING.md](docs/SECURITY_HARDENING.md) - Detailed security implementation
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - System architecture and design choices
- [CONTRIBUTING.md](CONTRIBUTING.md) - Security guidelines for contributors
