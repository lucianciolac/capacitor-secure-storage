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

This repository uses **npm workspaces**. The root install automatically installs the example/test app in the [test-app](/test-app) directory, so do not run a separate install there.

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

Run test-app tasks from the repository root:

```bash
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
