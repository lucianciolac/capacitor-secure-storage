/* eslint-disable no-undef */
import { execFileSync } from "node:child_process";

const IOS_SPEC_PATH = "ios/project.yml";
const IOS_PROJECT_DIRECTORY = "ios";
const IOS_PROJECT_PATH = "ios/SecureStoragePlugin.xcodeproj";
const IOS_TEST_SCHEME = "SecureStoragePluginHostTests";

function exitWithError(message) {
  console.error(message);
  process.exit(1);
}

function runCommand(command, args) {
  execFileSync(command, args, { stdio: "inherit" });
}

function captureCommand(command, args) {
  return execFileSync(command, args, { encoding: "utf8" });
}

function isCommandAvailable(command) {
  try {
    execFileSync("/usr/bin/which", [command], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function getRuntimeVersion(runtime) {
  const match = /iOS-(?<version>[\d-]+)$/.exec(runtime);
  return (match?.groups.version ?? "").split("-").map(Number);
}

function compareRuntimeVersions(firstRuntime, secondRuntime) {
  const firstVersion = getRuntimeVersion(firstRuntime);
  const secondVersion = getRuntimeVersion(secondRuntime);

  for (let index = 0; index < Math.max(firstVersion.length, secondVersion.length); index += 1) {
    const difference = (secondVersion[index] ?? 0) - (firstVersion[index] ?? 0);
    if (difference !== 0) {
      return difference;
    }
  }

  return 0;
}

function resolveTestDestination() {
  if (process.env.IOS_DESTINATION) {
    return process.env.IOS_DESTINATION;
  }

  const { devices } = JSON.parse(captureCommand("xcrun", ["simctl", "list", "devices", "available", "--json"]));
  const runtimes = Object.keys(devices)
    .filter((runtime) => runtime.includes("SimRuntime.iOS"))
    .sort(compareRuntimeVersions);

  for (const runtime of runtimes) {
    const device = devices[runtime].find((candidate) => candidate.name.startsWith("iPhone"));

    if (device) {
      return `platform=iOS Simulator,id=${device.udid}`;
    }
  }

  return exitWithError("No available iPhone simulator was found. Create one in Xcode, or set IOS_DESTINATION.");
}

function validateEnvironment() {
  if (process.platform !== "darwin") {
    exitWithError("iOS tests require macOS with Xcode installed.");
  }

  if (!isCommandAvailable("xcodebuild")) {
    exitWithError("xcodebuild was not found. Install Xcode and its command line tools.");
  }

  if (!isCommandAvailable("xcodegen")) {
    exitWithError("xcodegen was not found. Install it with: brew install xcodegen");
  }
}

function main() {
  validateEnvironment();

  runCommand("xcodegen", ["generate", "--spec", IOS_SPEC_PATH, "--project", IOS_PROJECT_DIRECTORY]);
  runCommand("xcodebuild", [
    "-project",
    IOS_PROJECT_PATH,
    "-scheme",
    IOS_TEST_SCHEME,
    "-destination",
    resolveTestDestination(),
    "test",
  ]);
}

main();
