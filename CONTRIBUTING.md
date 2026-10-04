# Contributing

Thank you for contributing to Capacitor Secure Storage! We appreciate your help in making this project better.

## Before opening an issue

Please search for [existing issues](https://github.com/lucianciolac/capacitor-secure-storage/issues) first to confirm that your report is not a duplicate.

### Bug Reports

When reporting a bug, please include:

- **Plugin version** - the version you're using
- **Capacitor version** - your Capacitor framework version
- **Platform and OS version** - e.g., iOS 17, Android 14
- **Android API level** - when applicable
- **Steps to reproduce** - clear, concise reproduction steps
- **Expected behavior** - what should happen
- **Actual behavior** - what actually happens
- **Relevant logs or error messages** - include console output or crash logs

**Do not include** secrets, credentials, tokens, or other sensitive information in your report.

## Development setup

### Initial setup

Clone and install the repository:

```bash
git clone https://github.com/lucianciolac/capacitor-secure-storage.git
cd capacitor-secure-storage
npm install
```

### Running tests

Use the project scripts defined in [package.json](/package.json).

**Run the complete validation suite:**

```bash
npm test
```

**Before opening a pull request**, run the full local verification:

```bash
npm run verify
```

**Platform-specific testing:**

```bash
npm run test:web
npm run test:ios
npm run test:android
```

#### Android testing

`npm run test:android` uses Gradle-managed Android Test Devices (ATDs). Gradle
creates and starts the required test device for the supported API levels
automatically.

To run the tests for one supported API level, pass `30` or `36`:

```bash
npm run test:android -- 36
```

#### iOS testing

`npm run test:ios` requires **macOS** with Xcode and [XcodeGen](https://github.com/yonaskolb/XcodeGen):

```bash
brew install xcodegen
```

Tests run inside a minimal host app defined in [ios/project.yml](/ios/project.yml).

A simulator is selected automatically. To override it, set `IOS_DESTINATION`:

```bash
IOS_DESTINATION='platform=iOS Simulator,name=iPhone 17' npm run test:ios
```

### Code formatting and linting

Check code quality and formatting:

```bash
npm run lint
```

Apply configured formatters:

```bash
npm run format
```

**Swift code** requires macOS with [SwiftLint](https://github.com/realm/SwiftLint):

```bash
brew install swiftlint
```

### Testing with the example app

For native code changes, validate using the example/test app where possible.

Run test-app tasks from the repository root. Build the plugin and install the test app first:

```bash
npm run build
npm run test-app:install
npm run test-app:build:web
npm run test-app:build:android
npm run test-app:build:ios
```

## Pull requests

Please keep pull requests **focused on a single change**. Mixing multiple changes makes review and maintenance harder.

### What makes a good pull request

- **Explain what changed** - clearly describe the changes
- **Explain why it changed** - provide context and motivation
- **Address compatibility concerns** - document any breaking changes or migration paths needed
- **Include tests** - add or update tests to verify the change
- **Preserve backwards compatibility** - avoid breaking existing functionality when practical
- **For security changes** - describe security implications and include validation

### Commit messages and release notes

Use [Conventional Commits](https://www.conventionalcommits.org/) with a type that
describes the consumer impact of the change:

- `feat`: new capabilities or public API additions; recommends a minor release.
- `fix`: behavior corrections, including security fixes; recommends a patch release.
- `perf`: performance improvements; recommends a patch release.
- `revert`: reverted changes; visible in release notes and eligible for a version bump.
- `docs`: documentation changes; visible in release notes without affecting the recommended version bump.
- `style`, `refactor`, `test`, `build`, `ci`, and `chore`: internal maintenance; hidden from release notes and excluded from the recommended version bump unless breaking.

Use scopes such as `ios`, `android`, `web`, `api`, `types`, `deps`, or `security`
to identify the affected surface. Use `fix(security)` rather than a custom `sec`
type for security fixes, following the private reporting process in [SECURITY.md](SECURITY.md).

```text
feat(ios): add a keychain accessibility option
fix(android): handle invalidated keystore keys
fix(security): prevent sensitive values from appearing in logs
docs(api): clarify missing-key errors
```

Declare breaking changes with `!` after the type/scope or a `BREAKING CHANGE:`
footer. Breaking changes recommend a major release regardless of the commit type.
Include migration guidance for incompatible API or storage changes, dropped
Capacitor compatibility, or increased minimum OS versions.

```text
feat!: require Capacitor 9

BREAKING CHANGE: applications must upgrade to Capacitor 9 before installing this version.
```

### Releasing

The [Release and Publish workflow](.github/workflows/release-and-publish.yml)
defaults to `input_version: auto`, which uses the Conventional Commits recommendation.

- `auto`: omit the version override and use the recommended bump.
- `patch`, `minor`, or `major`: explicitly override the recommendation.
- `none`: require an existing pre-release. With `prerelease_id: none`, graduate to the matching stable version; with `alpha`, `beta`, or `rc`, increment the pre-release or switch its identifier without changing the base version.

Set `prerelease_id: none` for stable releases, or select `alpha`, `beta`, or `rc`
for pre-releases. Automatic pre-release versioning follows release-it's recommendation
and pre-release handling; it is not an unconditional pre-release counter increment.
For example, `none` with `rc` changes `1.2.0-rc.0` to `1.2.0-rc.1`, while
`none` with `prerelease_id: none` graduates it to `1.2.0`.

### Security-sensitive changes

For changes affecting security behavior, please:

- Describe the security implications clearly
- Include relevant validation or test cases
- Consider cross-platform impacts

## API and compatibility

Changes to the public API require careful consideration.

### What not to break

Avoid breaking changes to:

- **Existing storage keys** - don't rename or remove keys
- **Existing stored values** - maintain compatibility with previously stored data
- **Native storage formats** - changing formats breaks upgrades from older versions
- **Platform-specific behavior** - maintain expected per-platform differences
- **Existing Capacitor integrations** - preserve compatibility with the Capacitor ecosystem

### Storage-format changes

Any changes to storage formats must consider:

- Upgrade paths from older versions
- Data migration requirements
- Backwards compatibility strategies

## Security issues

**Do not open a public GitHub issue** for suspected security vulnerabilities.

See [SECURITY.md](/SECURITY.md) for the **private reporting process** and instructions for responsibly disclosing security issues.

## Code style and review expectations

### Style guidelines

- Follow existing project conventions
- Keep changes consistent with surrounding code
- Avoid mixing formatting or refactoring changes into feature/bug-fix PRs
- Smaller, well-scoped changes are easier to review and maintain

### Review process

Code review helps maintain quality and catches potential issues early. Be responsive to feedback and respectful in discussions.
