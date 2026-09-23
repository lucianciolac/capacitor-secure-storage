/**
 * iOS Keychain accessibility level. Controls when a Keychain item can be
 * accessed relative to the device lock state. Ignored on Android and Web.
 *
 * @see https://developer.apple.com/documentation/security/ksecattraccessible
 */
export type Accessibility =
  | "whenUnlocked"
  | "whenUnlockedThisDeviceOnly"
  | "whenPasscodeSetThisDeviceOnly"
  | "afterFirstUnlock"
  | "afterFirstUnlockThisDeviceOnly";

/** iOS Keychain options. Ignored on Android and Web. */
export interface KeychainOptions {
  /** Defaults to `afterFirstUnlockThisDeviceOnly`. */
  accessibility?: Accessibility;
  /** Keychain access group. Requires matching Keychain Sharing entitlements. */
  group?: string;
  /** Selects iCloud Keychain items. Defaults to `false`. */
  isSynchronizable?: boolean;
}

export interface KeyOptions extends KeychainOptions {
  key: string;
}

export interface SetOptions extends KeyOptions {
  value: string;
}

export interface ValueResult<T> {
  value: T;
}

export interface SecureStoragePlugin {
  get(options: KeyOptions): Promise<ValueResult<string>>;
  set(options: SetOptions): Promise<void>;
  remove(options: KeyOptions): Promise<void>;
  clear(options?: KeychainOptions): Promise<void>;
  keys(options?: KeychainOptions): Promise<ValueResult<string[]>>;
}
