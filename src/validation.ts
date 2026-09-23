import { SecureStorageError, SecureStorageErrorCode, SecureStorageErrorMessage } from "./errors";

/**
 * Shared validation rules for plugin options.
 *
 * These rules mirror the validation enforced natively on iOS and Android, so
 * that invalid input is rejected consistently regardless of platform:
 * - a key must be a non-empty (after trimming) string;
 * - a value (for `set`) must be a string, but may be empty.
 */

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function assertValidKey(key: unknown): asserts key is string {
  if (!isNonEmptyString(key)) {
    throw new SecureStorageError(SecureStorageErrorMessage.InvalidKey, SecureStorageErrorCode.InvalidKey);
  }
}

export function assertValidValue(value: unknown): asserts value is string {
  if (typeof value !== "string") {
    throw new SecureStorageError(SecureStorageErrorMessage.InvalidValue, SecureStorageErrorCode.InvalidValue);
  }
}
