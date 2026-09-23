const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { test } = require("node:test");

const rootDir = path.resolve(__dirname, "..");
const nodeCommand = process.execPath;
const npmCommand = process.env.npm_execpath ?? (process.platform === "win32" ? "npm.cmd" : "npm");
const expectedExports = ["SecureStorage", "SecureStorageError", "SecureStorageErrorCode", "SecureStorageErrorMessage"];
const expectedPackedFiles = [
  "package.json",
  "dist/plugin.cjs.js",
  "dist/plugin.mjs",
  "dist/plugin.js",
  "dist/esm/index.d.ts",
  "android/build.gradle",
  "android/proguard-rules.pro",
  "android/variables.gradle",
  "android/src/main/java/com/lcorg/capacitor_secure_storage/SecureStoragePlugin.java",
  "ios/Sources/SecureStoragePlugin/SecureStoragePlugin.swift",
  "Package.swift",
  "LcorgCapacitorSecureStorage.podspec",
  "LICENSE",
];
const tscPath = path.join(rootDir, "node_modules", "typescript", "bin", "tsc");

const run = (command, args, options = {}) =>
  execFileSync(command, args, {
    cwd: rootDir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  });

const runNpm = (args, options = {}) =>
  process.env.npm_execpath
    ? run(nodeCommand, [process.env.npm_execpath, ...args], options)
    : run(npmCommand, args, options);

const writeFixture = (directory, filename, content) => {
  fs.writeFileSync(path.join(directory, filename), content);
};

const assertPackedFiles = (packedFiles) => {
  for (const expectedFile of expectedPackedFiles) {
    assert.ok(packedFiles.has(expectedFile), `Expected ${expectedFile} to be packed`);
  }

  for (const packedFile of packedFiles) {
    assert.equal(packedFile.startsWith("node_modules/"), false, "Package must not include node_modules");
    assert.equal(packedFile.startsWith(".github/"), false, "Package must not include GitHub workflow files");
    assert.equal(packedFile.startsWith("tests/"), false, "Package must not include test files");
    assert.equal(packedFile.startsWith("src/"), false, "Package must not include TypeScript source files");
  }
};

const requireFixture = `
const assert = require("node:assert/strict");
const plugin = require("@lcorg/capacitor-secure-storage");
assert.deepEqual(Object.keys(plugin).sort(), ${JSON.stringify(expectedExports)});
`;

const importFixture = `
import assert from "node:assert/strict";
import * as plugin from "@lcorg/capacitor-secure-storage";
assert.deepEqual(Object.keys(plugin).sort(), ${JSON.stringify(expectedExports)});
`;

const typecheckFixture = `
import {
  SecureStorageError,
  SecureStorageErrorCode,
  SecureStorage,
} from "@lcorg/capacitor-secure-storage";
import type {
  KeyOptions,
  SecureStoragePlugin as SecureStoragePluginType,
  SetOptions,
  ValueResult,
} from "@lcorg/capacitor-secure-storage";

const plugin: SecureStoragePluginType = SecureStorage;
const keyOptions: KeyOptions = { key: "token" };
const setOptions: SetOptions = { ...keyOptions, value: "value" };
const result: ValueResult<string> = { value: "value" };
const error = new SecureStorageError("Unable to read from secure storage", SecureStorageErrorCode.StorageError);

async function replaceValue(): Promise<void> {
  await plugin.set(setOptions);
  await plugin.remove(keyOptions);
  await plugin.clear();
}

void error;
void result;
void replaceValue;
`;

test("packed package installs and exposes CJS, ESM, and TypeScript entrypoints", (t) => {
  const packOutput = runNpm(["pack", "--json", "--ignore-scripts"]);
  const [packedPackage] = JSON.parse(packOutput);
  assert.ok(packedPackage, "npm pack should return package metadata");

  const tarballPath = path.join(rootDir, packedPackage.filename);
  t.after(() => fs.rmSync(tarballPath, { force: true }));

  assertPackedFiles(new Set(packedPackage.files.map((file) => file.path)));

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "secure-storage-package-smoke-"));
  t.after(() => fs.rmSync(tempDir, { force: true, recursive: true }));

  writeFixture(tempDir, "package.json", JSON.stringify({ private: true, type: "module" }, null, 2));

  runNpm(
    [
      "install",
      "--ignore-scripts",
      "--package-lock=false",
      "--no-audit",
      "--fund=false",
      tarballPath,
      path.join(rootDir, "node_modules", "@capacitor", "core"),
    ],
    { cwd: tempDir },
  );

  writeFixture(tempDir, "require.cjs", requireFixture);
  run(nodeCommand, ["require.cjs"], { cwd: tempDir });

  writeFixture(tempDir, "import.mjs", importFixture);
  run(nodeCommand, ["import.mjs"], { cwd: tempDir });

  writeFixture(tempDir, "typecheck.ts", typecheckFixture);
  run(
    nodeCommand,
    [
      tscPath,
      "--noEmit",
      "--strict",
      "--target",
      "ES2022",
      "--module",
      "NodeNext",
      "--moduleResolution",
      "NodeNext",
      "typecheck.ts",
    ],
    { cwd: tempDir },
  );
});
