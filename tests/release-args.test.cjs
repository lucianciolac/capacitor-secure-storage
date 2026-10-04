const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const { createRequire } = require("node:module");
const os = require("node:os");
const path = require("node:path");
const { describe, test } = require("node:test");
const { runInNewContext } = require("node:vm");

const rootDir = path.resolve(__dirname, "..");
const nodeCommand = process.execPath;
const requireFromRoot = createRequire(path.join(rootDir, "package.json"));
const workflow = fs.readFileSync(path.join(rootDir, ".github", "workflows", "release-and-publish.yml"), "utf8");
const PRERELEASE_IDS = ["none", "alpha", "beta", "rc"];
const RELEASE_INCREMENTS = ["patch", "minor", "major"];

const getWorkflowStep = (name) => {
  const step = workflow.split(/^ {6}- name: /m).find((candidate) => candidate.split(/\r?\n/, 1)[0] === name);
  assert.ok(step, `Workflow step '${name}' must exist`);
  return step;
};

const getReleaseScript = () => {
  const step = getWorkflowStep("Determine release-it arguments");
  assert.match(step, /shell: node \{0\}/);
  const script = step.split(/^ {8}run: \|\r?\n/m)[1];
  assert.ok(script, "Release argument step must contain a run script");
  return script.replace(/^ {10}/gm, "");
};

const releaseScript = getReleaseScript();

const run = (command, args, options = {}) =>
  execFileSync(command, args, {
    cwd: rootDir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  });

const getReleaseArguments = ({ increment = "auto", prereleaseId = "none", version = "1.2.3" } = {}) => {
  let output = "";
  runInNewContext(releaseScript, {
    require(name) {
      if (name === "node:module") {
        return { createRequire: () => requireFromRoot };
      }
      if (name === "node:path") {
        return path;
      }
      assert.equal(name, "node:fs");
      return {
        readFileSync(filename, encoding) {
          assert.equal(filename, "package.json");
          assert.equal(encoding, "utf8");
          return JSON.stringify({ version });
        },
        appendFileSync(filename, content) {
          assert.equal(filename, "test-output");
          output += content;
        },
      };
    },
    process: {
      env: {
        INPUT_VERSION: increment,
        PRERELEASE_ID: prereleaseId,
        GITHUB_OUTPUT: "test-output",
      },
    },
    console: { log() {} },
  });
  assert.match(output, /^args=[^\r\n]*\n$/, "Step must write exactly one arguments output");
  const args = output.slice("args=".length).trim();
  return args === "" ? [] : args.split(" ");
};

const createReleasePlugin = () => ({
  options: {},
  getContext: () => ({}),
  getTagPrefix: () => "",
  config: { getContext: () => ({}) },
  debug() {},
  log: { warn() {} },
});

describe("Release workflow arguments", () => {
  test("uses automatic versioning by default", () => {
    const input = workflow.match(/ {6}input_version:\r?\n([\s\S]*?)(?=\r?\n {6}prerelease_id:)/)?.[1];
    assert.ok(input, "Release increment input must exist");
    assert.match(input, /default: auto/);
  });

  test("skips attestation when no release archive was generated", () => {
    assert.match(getWorkflowStep("Attest release archive"), /if: \$\{\{ hashFiles\('\*\.tgz'\) != '' \}\}/);
  });

  for (const increment of ["auto", ...RELEASE_INCREMENTS]) {
    test(`${increment} preserves the recommendation or explicit override`, () => {
      for (const version of ["1.2.3", "1.3.0-rc.1"]) {
        for (const prereleaseId of PRERELEASE_IDS) {
          const expected = increment === "auto" ? [] : [increment];
          if (prereleaseId !== "none") {
            expected.push(`--preRelease=${prereleaseId}`);
          }
          assert.deepEqual(
            getReleaseArguments({ increment, prereleaseId, version }),
            expected,
            `${version} / ${prereleaseId}`,
          );
        }
      }
    });
  }

  test("increments or switches pre-release identifiers without changing the base version", () => {
    for (const [version, prereleaseId, expectedVersion] of [
      ["1.2.0-rc.0", "rc", "1.2.0-rc.1"],
      ["1.2.0-rc.9", "rc", "1.2.0-rc.10"],
      ["1.2.0-alpha.2", "beta", "1.2.0-beta.0"],
      ["1.2.0-beta.2", "rc", "1.2.0-rc.0"],
      ["1.2.0-rc.1", "alpha", "1.2.0-alpha.0"],
    ]) {
      assert.deepEqual(
        getReleaseArguments({ increment: "none", prereleaseId, version }),
        [expectedVersion, `--preRelease=${prereleaseId}`],
        `${version} / ${prereleaseId}`,
      );
    }
  });

  test("graduates pre-releases to their matching stable version", () => {
    for (const version of ["1.2.0-rc.1", "1.2.0-beta.2+build.7"]) {
      assert.deepEqual(getReleaseArguments({ increment: "none", version }), ["1.2.0"], version);
    }
  });

  test("rejects incrementing or graduating a stable version with none", () => {
    for (const prereleaseId of PRERELEASE_IDS) {
      assert.throws(
        () => getReleaseArguments({ increment: "none", prereleaseId }),
        /already a stable release/,
        prereleaseId,
      );
    }
  });

  test("rejects invalid inputs and package versions explicitly", () => {
    assert.throws(() => getReleaseArguments({ increment: "unexpected" }), /Unsupported release increment/);
    assert.throws(() => getReleaseArguments({ prereleaseId: "unexpected" }), /Unsupported pre-release identifier/);
    assert.throws(
      () => getReleaseArguments({ increment: "none", prereleaseId: "rc", version: "invalid" }),
      /Invalid current package version/,
    );
  });

  test("resolves dependencies when GitHub runs the script outside the repository", (t) => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "secure-storage-release-args-"));
    t.after(() => fs.rmSync(tempDir, { recursive: true, force: true }));

    const scriptPath = path.join(tempDir, "step.js");
    const outputPath = path.join(tempDir, "output");
    fs.writeFileSync(scriptPath, releaseScript);
    run(nodeCommand, [scriptPath], {
      env: {
        ...process.env,
        INPUT_VERSION: "auto",
        PRERELEASE_ID: "none",
        GITHUB_OUTPUT: outputPath,
      },
    });

    assert.equal(fs.readFileSync(outputPath, "utf8"), "args=\n");
  });
});

describe("Release-it version selection", () => {
  test("uses automatic recommendations and skips releases without a recommendation", async (t) => {
    const { default: ConventionalChangelog } = await import("@release-it/conventional-changelog");
    const { Bumper } = await import("conventional-recommended-bump");
    const bump = t.mock.method(Bumper.prototype, "bump");
    const plugin = createReleasePlugin();

    for (const [recommendation, expectedVersion] of [
      ["patch", "1.2.4"],
      ["minor", "1.3.0"],
      ["major", "2.0.0"],
      [null, null],
    ]) {
      bump.mock.mockImplementation(async () => ({ releaseType: recommendation }));
      const version = await ConventionalChangelog.prototype.getRecommendedVersion.call(plugin, {
        latestVersion: "1.2.3",
        isPreRelease: false,
      });
      assert.equal(version, expectedVersion, `Recommendation: ${recommendation}`);
    }
  });

  test("honors manual and exact-version overrides even when a major bump is recommended", async (t) => {
    const { default: ConventionalChangelog } = await import("@release-it/conventional-changelog");
    const { Bumper } = await import("conventional-recommended-bump");
    t.mock.method(Bumper.prototype, "bump", async () => ({ releaseType: "major" }));
    const plugin = createReleasePlugin();

    for (const [increment, prereleaseId, latestVersion, expectedVersion] of [
      ["patch", "none", "1.2.3", "1.2.4"],
      ["none", "rc", "1.3.0-rc.0", "1.3.0-rc.1"],
      ["none", "none", "1.3.0-rc.0", "1.3.0"],
    ]) {
      const [versionOverride] = getReleaseArguments({ increment, prereleaseId, version: latestVersion });
      const version = await ConventionalChangelog.prototype.getRecommendedVersion.call(plugin, {
        increment: versionOverride,
        latestVersion,
        isPreRelease: prereleaseId !== "none",
        preReleaseId: prereleaseId === "none" ? undefined : prereleaseId,
      });
      assert.equal(version, expectedVersion, `${increment} / ${prereleaseId}`);
    }
  });
});
