# Capacitor Secure Storage

[![npm version](https://img.shields.io/npm/v/@lcorg/capacitor-secure-storage)](https://www.npmjs.com/package/@lcorg/capacitor-secure-storage)
[![npm downloads](https://img.shields.io/npm/dt/@lcorg/capacitor-secure-storage)](https://www.npmjs.com/package/@lcorg/capacitor-secure-storage)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Securely store string values in [Capacitor](https://capacitorjs.com/) applications using native iOS and Android storage mechanisms.

## Supported platforms

The plugin requires Capacitor 8.

| Platform | Storage backend                                                        | Minimum version |
| -------- | ---------------------------------------------------------------------- | --------------- |
| iOS      | Keychain via [SimpleKeychain](https://github.com/auth0/SimpleKeychain) | iOS 16+         |
| Android  | Android Keystore and `EncryptedSharedPreferences`                      | Android API 30+ |
| Web      | `localStorage` (not secure storage)                                    | -               |

## Install

```bash
npm install @lcorg/capacitor-secure-storage
npx cap sync
```

## Quick start

```ts
import { SecureStorage } from "@lcorg/capacitor-secure-storage";

await SecureStorage.set({
  key: "token",
  value: "abc123",
});

const { value } = await SecureStorage.get({ key: "token" });
console.log(value);
```

## Security considerations

The Web implementation uses base64-encoded `localStorage`. It is intended for development and testing purposes only. It is **not** secure storage.

Do not use the Web implementation to store passwords, API tokens, private keys, or other secrets in production.

## API reference

- `SecureStorage` is the registered plugin instance used at runtime.
- `SecureStoragePlugin` is the TypeScript interface.

| Method              | Description                                |
| ------------------- | ------------------------------------------ |
| [`get`](#get)       | Reads a stored value by key.               |
| [`set`](#set)       | Stores or overwrites a string value.       |
| [`remove`](#remove) | Deletes a stored value by key.             |
| [`clear`](#clear)   | Deletes all entries managed by the plugin. |
| [`keys`](#keys)     | Lists all stored keys.                     |

### Shared iOS Keychain options

`get`, `set`, `remove`, `clear`, and `keys` accept the following options. They apply only to iOS; Android and Web ignore them.

| Option             | Type            | Description                                                                                                    |
| ------------------ | --------------- | -------------------------------------------------------------------------------------------------------------- |
| `accessibility`    | `Accessibility` | When the Keychain item can be accessed. Defaults to `afterFirstUnlockThisDeviceOnly`.                          |
| `group`            | `string`        | Keychain access group for sharing between apps or extensions. Requires matching Keychain Sharing entitlements. |
| `isSynchronizable` | `boolean`       | Whether to use iCloud Keychain synchronization. Defaults to `false`.                                           |

`Accessibility` supports:

```ts
type Accessibility =
  | "whenUnlocked"
  | "whenUnlockedThisDeviceOnly"
  | "whenPasscodeSetThisDeviceOnly"
  | "afterFirstUnlock"
  | "afterFirstUnlockThisDeviceOnly";
```

### `get`

Reads a value by key. Rejects with `ITEM_NOT_FOUND` when the key does not exist.

```ts
get(options: {
  key: string;
  accessibility?: Accessibility;
  group?: string;
  isSynchronizable?: boolean;
}) => Promise<{ value: string }>;
```

```ts
const { value } = await SecureStorage.get({ key: "username" });
console.log(value);
```

### `set`

Stores a string value under a key, creating or overwriting the entry.

```ts
set(options: {
  key: string;
  value: string;
  accessibility?: Accessibility;
  group?: string;
  isSynchronizable?: boolean;
}) => Promise<void>;
```

```ts
await SecureStorage.set({ key: "username", value: "alice" });
```

### `remove`

Deletes a value by key. Rejects with `ITEM_NOT_FOUND` when the key does not exist.

```ts
remove(options: {
  key: string;
  accessibility?: Accessibility;
  group?: string;
  isSynchronizable?: boolean;
}) => Promise<void>;
```

```ts
await SecureStorage.remove({ key: "username" });
```

### `clear`

Deletes all plugin-managed entries in the selected iOS access group and synchronization scope.

```ts
clear(options?: {
  accessibility?: Accessibility;
  group?: string;
  isSynchronizable?: boolean;
}) => Promise<void>;
```

```ts
await SecureStorage.clear();
```

### `keys`

Lists all plugin-managed keys in the selected iOS access group and synchronization scope.

```ts
keys(options?: {
  accessibility?: Accessibility;
  group?: string;
  isSynchronizable?: boolean;
}) => Promise<{ value: string[] }>;
```

```ts
const { value: keys } = await SecureStorage.keys();
console.log(keys);
```

## Platform notes

### iOS

The plugin stores values in Keychain through [SimpleKeychain](https://github.com/auth0/SimpleKeychain). Use the [shared iOS Keychain options](#shared-ios-keychain-options) to select an accessibility level, access group, or iCloud synchronization scope.

### Android

The plugin uses Android Keystore and `EncryptedSharedPreferences`.

### Web

The plugin uses UTF-8 and base64-encoded `localStorage`. See [Security considerations](#security-considerations).

## Error handling

Behavior is consistent across iOS, Android, and Web:

- Keys must be non-empty strings after trimming whitespace.
- `set` values must be strings; empty strings are allowed.
- `set`, `remove`, and `clear` resolve with no value after success.
- `get` resolves with `{ value: string }`, and `keys` resolves with `{ value: string[] }`.
- `clear` and `keys` operate only on entries managed by this plugin.

Rejected operations expose one of these stable error codes:

| Code             | When it occurs                                                                                             |
| ---------------- | ---------------------------------------------------------------------------------------------------------- |
| `INVALID_KEY`    | The `key` option is absent, not a string, or empty after trimming whitespace.                              |
| `INVALID_VALUE`  | The `value` option is absent or not a string, or an iOS-only Keychain option has an invalid type or value. |
| `ITEM_NOT_FOUND` | `get` or `remove` was called for a key that does not exist.                                                |
| `STORAGE_ERROR`  | The underlying storage provider could not complete the operation.                                          |

On iOS, invalid Keychain option types and unsupported `accessibility` values are rejected. Android and Web ignore iOS-only Keychain options.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## License

See [LICENSE](LICENSE).
