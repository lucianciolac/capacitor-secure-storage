import { WebPlugin } from "@capacitor/core";

import type { KeyOptions, SecureStoragePlugin, SetOptions, ValueResult } from "./definitions";
import { SecureStorageError, SecureStorageErrorCode, SecureStorageErrorMessage } from "./errors";
import { assertValidKey, assertValidValue } from "./validation";

export class SecureStorageWeb extends WebPlugin implements SecureStoragePlugin {
  PREFIX = "cap_sec_";

  async get(options: KeyOptions): Promise<ValueResult<string>> {
    assertValidKey(options?.key);

    try {
      const value = localStorage.getItem(this.addPrefix(options.key));
      if (value === null) {
        throw new SecureStorageError(SecureStorageErrorMessage.ItemNotFound, SecureStorageErrorCode.ItemNotFound);
      }
      return { value: this.decode(value) };
    } catch (error) {
      throw this.toStorageError(error, SecureStorageErrorMessage.StorageRead);
    }
  }

  async set(options: SetOptions): Promise<void> {
    assertValidKey(options?.key);
    assertValidValue(options?.value);

    try {
      localStorage.setItem(this.addPrefix(options.key), this.encode(options.value));
    } catch (error) {
      throw this.toStorageError(error, SecureStorageErrorMessage.StorageWrite);
    }
  }

  async remove(options: KeyOptions): Promise<void> {
    assertValidKey(options?.key);

    try {
      if (localStorage.getItem(this.addPrefix(options.key)) == null) {
        throw new SecureStorageError(SecureStorageErrorMessage.ItemNotFound, SecureStorageErrorCode.ItemNotFound);
      }
      localStorage.removeItem(this.addPrefix(options.key));
    } catch (error) {
      throw this.toStorageError(error, SecureStorageErrorMessage.StorageRemove);
    }
  }

  async clear(): Promise<void> {
    try {
      for (const key of Object.keys(localStorage)) {
        if (key.indexOf(this.PREFIX) === 0) {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      throw this.toStorageError(error, SecureStorageErrorMessage.StorageClear);
    }
  }

  async keys(): Promise<ValueResult<string[]>> {
    try {
      const keys = Object.keys(localStorage)
        .filter((k) => k.indexOf(this.PREFIX) === 0)
        .map(this.removePrefix);
      return { value: keys };
    } catch (error) {
      throw this.toStorageError(error, SecureStorageErrorMessage.StorageKeys);
    }
  }

  private readonly addPrefix = (key: string): string => this.PREFIX + key;
  private readonly removePrefix = (key: string): string => key.replace(this.PREFIX, "");
  private readonly encode = (value: string): string => {
    const bytes = new TextEncoder().encode(value);
    let binary = "";

    for (let offset = 0; offset < bytes.length; offset += 32768) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + 32768));
    }

    return btoa(binary);
  };

  private readonly decode = (value: string): string => {
    const bytes = Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  };

  private readonly toStorageError = (error: unknown, message: string): SecureStorageError => {
    if (error instanceof SecureStorageError) {
      return error;
    }
    return new SecureStorageError(message, SecureStorageErrorCode.StorageError, { cause: error });
  };
}
