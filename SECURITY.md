# Security Policy

## Supported Versions

| Version | Supported | Security Updates |
|---------|-----------|-----------------|
| latest  | ✅        | Via GitHub Private Vulnerability Reporting |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Reframe uses GitHub's **Private Vulnerability Reporting** feature for responsible disclosure.

### How to Report

1. Go to the [Security tab](https://github.com/magic-peach/reframe/security) of this repository
2. Click **"Report a vulnerability"**
3. Fill in the details:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)
4. Submit — the report goes only to the maintainers

### What to Include

A good security report contains:

- **Clear description** of the vulnerability
- **Exact steps** to reproduce (code snippets, commands, browser actions)
- **Impact analysis** (what can an attacker do? data exposure, XSS, RCE, etc.)
- **Affected components** (specific files, functions, or modules)
- **Version information** (browser, Node.js version if relevant)
- **Optional**: Proposed patch or mitigation

### Response Timeline

- **Initial response**: Within 48 hours acknowledging receipt
- **Status update**: Within 5 business days (triaging, investigation)
- **Resolution**: Depends on severity and complexity — typically 7–30 days

### Scope

Security reports are accepted for:

- The core Reframe application (Next.js + TypeScript frontend)
- FFmpeg.wasm integration and media processing pipeline
- Build configuration, CI/CD, and deployment scripts
- Dependencies — only if vulnerability affects Reframe's attack surface

Out of scope:

- General web security best practices already documented
- Vulnerabilities in third-party services (Netlify, Vercel, GitHub)
- Social engineering or phishing targeting Reframe users
- Denial-of-service attacks on infrastructure you don't control

### Public Disclosure

Security fixes are publicly disclosed via:

- GitHub Security Advisories (CVE-enabled when applicable)
- Release notes/changelog entries
- CHANGELOG.md updates

Please **do not disclose** the vulnerability publicly until a fix is deployed and users have had reasonable time to update.

### Bug Bounty / Rewards

Reframe currently does not offer monetary rewards for security reports. However, reporters are:

- Credited in release notes (unless anonymity requested)
- Recognised in contributors list
- Offered priority access to beta features

Thank you for helping keep Reframe and its users safe! 🙏

---

*This SECURITY.md follows GitHub's recommended template and industry best practices.*

*Last updated: 2026-05-14*
