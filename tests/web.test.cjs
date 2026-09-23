const assert = require("node:assert/strict");
const { beforeEach, describe, test } = require("node:test");

const { SecureStorageError, SecureStorageErrorCode, SecureStorage } = require("../dist/plugin.cjs.js");

const INVALID_KEYS = [undefined, "", " \n\t"];
const INVALID_VALUES = [undefined, null];

class MemoryStorage {
  getItem(key) {
    return Object.prototype.hasOwnProperty.call(this, key) ? this[key] : null;
  }

  setItem(key, value) {
    this[key] = String(value);
  }

  removeItem(key) {
    delete this[key];
  }
}

const expectErrorCode = async (action, expectedCode) => {
  await assert.rejects(action, (error) => {
    assert.ok(error instanceof SecureStorageError);
    assert.equal(error.code, expectedCode);
    return true;
  });
};

const expectInvalidKey = async (options) => {
  await expectErrorCode(() => SecureStorage.get(options), SecureStorageErrorCode.InvalidKey);
  await expectErrorCode(() => SecureStorage.remove(options), SecureStorageErrorCode.InvalidKey);
  await expectErrorCode(() => SecureStorage.set({ ...options, value: "value" }), SecureStorageErrorCode.InvalidKey);
};

describe("SecureStorageWeb", () => {
  beforeEach(() => {
    globalThis.localStorage = new MemoryStorage();
  });

  test("round-trips empty, Unicode, and large values", async () => {
    const values = ["", "pässwörd 🔐 你好", "x".repeat(128 * 1024)];

    for (const [index, value] of values.entries()) {
      const key = `value-${index}`;
      assert.equal(await SecureStorage.set({ key, value }), undefined);
      assert.deepEqual(await SecureStorage.get({ key }), { value });
    }
  });

  test("overwrites an existing value", async () => {
    await SecureStorage.set({ key: "token", value: "first" });
    await SecureStorage.set({ key: "token", value: "second" });

    assert.deepEqual(await SecureStorage.get({ key: "token" }), {
      value: "second",
    });
    assert.deepEqual(await SecureStorage.keys(), { value: ["token"] });
  });

  test("lists only plugin keys and clear preserves unrelated storage", async () => {
    localStorage.setItem("unrelated", "keep");
    await SecureStorage.set({ key: "one", value: "1" });
    await SecureStorage.set({ key: "two", value: "2" });

    assert.deepEqual((await SecureStorage.keys()).value.sort(), ["one", "two"]);
    assert.equal(await SecureStorage.clear(), undefined);
    assert.deepEqual(await SecureStorage.keys(), { value: [] });
    assert.equal(localStorage.getItem("unrelated"), "keep");
  });

  test("remove deletes an existing item and rejects when it is absent", async () => {
    await SecureStorage.set({ key: "token", value: "value" });
    assert.equal(await SecureStorage.remove({ key: "token" }), undefined);
    await expectErrorCode(() => SecureStorage.get({ key: "token" }), SecureStorageErrorCode.ItemNotFound);
    await expectErrorCode(() => SecureStorage.remove({ key: "token" }), SecureStorageErrorCode.ItemNotFound);
  });

  test("rejects invalid keys and values with stable codes", async () => {
    for (const key of INVALID_KEYS) {
      const options = key === undefined ? {} : { key };
      await expectInvalidKey(options);
    }

    for (const value of INVALID_VALUES) {
      await expectErrorCode(() => SecureStorage.set({ key: "token", value }), SecureStorageErrorCode.InvalidValue);
    }
  });

  test("maps corrupt stored data to STORAGE_ERROR", async () => {
    localStorage.setItem("cap_sec_corrupt", "%%%");
    await expectErrorCode(() => SecureStorage.get({ key: "corrupt" }), SecureStorageErrorCode.StorageError);
  });

  test("maps read failures to STORAGE_ERROR", async () => {
    localStorage.getItem = () => {
      throw new DOMException("denied", "SecurityError");
    };
    await expectErrorCode(() => SecureStorage.get({ key: "token" }), SecureStorageErrorCode.StorageError);
  });

  test("maps write failures to STORAGE_ERROR", async () => {
    globalThis.localStorage = new MemoryStorage();
    globalThis.localStorage.setItem = () => {
      throw new DOMException("quota exceeded", "QuotaExceededError");
    };
    await expectErrorCode(
      () => SecureStorage.set({ key: "token", value: "value" }),
      SecureStorageErrorCode.StorageError,
    );
  });

  test("maps remove failures to STORAGE_ERROR", async () => {
    globalThis.localStorage = new MemoryStorage();
    globalThis.localStorage.setItem("cap_sec_token", "dmFsdWU=");
    globalThis.localStorage.removeItem = () => {
      throw new DOMException("denied", "SecurityError");
    };

    await expectErrorCode(() => SecureStorage.remove({ key: "token" }), SecureStorageErrorCode.StorageError);
  });

  test("maps key enumeration failures to STORAGE_ERROR", async () => {
    globalThis.localStorage = new Proxy(new MemoryStorage(), {
      ownKeys() {
        throw new DOMException("denied", "SecurityError");
      },
    });

    await expectErrorCode(() => SecureStorage.keys(), SecureStorageErrorCode.StorageError);
  });

  test("maps clear enumeration failures to STORAGE_ERROR", async () => {
    globalThis.localStorage = new Proxy(new MemoryStorage(), {
      ownKeys() {
        throw new DOMException("denied", "SecurityError");
      },
    });

    await expectErrorCode(() => SecureStorage.clear(), SecureStorageErrorCode.StorageError);
  });
});
