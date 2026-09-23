import { registerPlugin } from "@capacitor/core";

import type { SecureStoragePlugin as SecureStoragePluginType } from "./definitions";

export type SecureStoragePlugin = SecureStoragePluginType;

export const SecureStorage = registerPlugin<SecureStoragePluginType>("SecureStoragePlugin", {
  web: async () => await import("./web").then((m) => new m.SecureStorageWeb()),
});

export * from "./definitions";
export * from "./errors";
