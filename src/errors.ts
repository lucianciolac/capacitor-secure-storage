export const SecureStorageErrorCode = {
  InvalidKey: "INVALID_KEY",
  InvalidValue: "INVALID_VALUE",
  ItemNotFound: "ITEM_NOT_FOUND",
  StorageError: "STORAGE_ERROR",
} as const;

export type SecureStorageErrorCode = (typeof SecureStorageErrorCode)[keyof typeof SecureStorageErrorCode];

export const SecureStorageErrorMessage = {
  InvalidKey: "Key must be a non-empty string",
  InvalidValue: "Value must be a string",
  ItemNotFound: "Item with given key does not exist",
  StorageWrite: "Unable to write to secure storage",
  StorageRead: "Unable to read from secure storage",
  StorageKeys: "Unable to list secure storage keys",
  StorageRemove: "Unable to remove item from secure storage",
  StorageClear: "Unable to clear secure storage",
} as const;

export type SecureStorageErrorMessage = (typeof SecureStorageErrorMessage)[keyof typeof SecureStorageErrorMessage];

export class SecureStorageError extends Error {
  readonly code: SecureStorageErrorCode;

  constructor(message: string, code: SecureStorageErrorCode, options?: ErrorOptions) {
    super(message, options);
    this.name = "SecureStorageError";
    this.code = code;
  }
}
