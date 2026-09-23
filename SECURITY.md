# Security Policy

## Reporting a vulnerability

**Do not report security vulnerabilities through public channels** such as GitHub issues, discussions, or pull requests.

### How to report

If you believe you have found a security issue, please report it **privately** through [GitHub Security Advisories](https://github.com/lucianciolac/capacitor-secure-storage/security/advisories/new):

1. Visit: https://github.com/lucianciolac/capacitor-secure-storage/security/advisories/new
2. Or: Open the repository, click the **Security** tab, then **Report a vulnerability**

### What to include in your report

Provide as much detail as possible:

- **Clear description** - what is the security issue?
- **Affected version(s)** - which plugin versions are vulnerable?
- **Affected platform(s)** - iOS, Android, Web, or all?
- **Steps to reproduce** - detailed reproduction steps if available
- **Impact** - what could an attacker do? What is the severity?
- **Attack scenarios** - realistic attack examples
- **Suggested remediation** - any proposed fixes (optional)

### What not to include

**Avoid including** secrets, credentials, personal data, or production-only information in the report.

## Scope

This project provides a **native secure-storage abstraction** for Capacitor applications.

### Security-sensitive areas

The following components require particular attention to security:

- **iOS Keychain** - native credential storage integration
- **Android Keystore** - native key management system
- **Android `EncryptedSharedPreferences`** - encrypted Android storage backend
- **Encryption configuration** - key generation and management
- **Storage and migration** - data migration between storage implementations
- **Output exposure** - accidental exposure of values via logs, errors, or debugging output

### Web implementation

The **Web implementation is intentionally not considered secure storage**. Browser `localStorage` does not provide the security guarantees of native secure-storage mechanisms. Do not rely on this plugin for sensitive data protection on Web platforms.

## Supported versions

We prioritize security fixes for:

1. **Latest stable release** - receives all security fixes
2. **Current development branch** - receives all security fixes

### Older versions

Older versions may receive critical fixes only when:

- They remain in active support
- The vulnerability is still relevant to those versions
- The fix is applicable without major changes

**Recommendation:** Users should upgrade to the newest supported version whenever possible to receive all security patches.

### Version support

Check the [releases](https://github.com/lucianciolac/capacitor-secure-storage/releases) page for version information and end-of-life dates.

## Response expectations

We take security reports seriously and will:

1. **Acknowledge** new reports promptly
2. **Assess** the issue as quickly as possible
3. **Develop a fix** based on severity and complexity
4. **Coordinate disclosure** with you before public announcement

The timeline for fix and disclosure depends on:

- **Severity** of the vulnerability
- **Quality** of reproduction steps
- **Complexity** of the fix required
- **Platform impact** - single platform vs. cross-platform

We aim to follow responsible disclosure practices.

## Disclosure

### Process

1. **Investigation** - the reported vulnerability is investigated privately
2. **Fix development** - a patch is created and tested
3. **Coordination** - the fix is shared with you before public disclosure
4. **Advisory** - a security advisory is published

### Security advisories

After an issue has been investigated and fixed, we may publish a security advisory with:

- Clear description of the vulnerability
- Affected versions
- Recommended actions (upgrade, mitigation, etc.)
- Severity rating (CVSS or similar)

Advisories are published in the [Security Advisories](https://github.com/lucianciolac/capacitor-secure-storage/security/advisories) section.
