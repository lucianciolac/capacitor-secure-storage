/* eslint-disable no-undef */
import { execFileSync } from "node:child_process";

const SUPPORTED_API_LEVELS = [30, 36];
const ANDROID_PROJECT_DIRECTORY = "android";
const GRADLE_TASKS = ["clean", "build", "test"];

function exitWithError(message) {
  console.error(message);
  process.exit(1);
}

function getRequestedApiLevel() {
  const [requestedApiLevel] = process.argv.slice(2);

  if (requestedApiLevel !== undefined && !SUPPORTED_API_LEVELS.includes(Number(requestedApiLevel))) {
    exitWithError(
      `Unsupported API level "${requestedApiLevel}". Supported levels: ${SUPPORTED_API_LEVELS.join(", ")}.`,
    );
  }

  return requestedApiLevel;
}

function getInstrumentationTasks(requestedApiLevel) {
  const apiLevels = requestedApiLevel === undefined ? SUPPORTED_API_LEVELS : [Number(requestedApiLevel)];

  return apiLevels.map((apiLevel) => `atdApi${apiLevel}DebugAndroidTest`);
}

function getGradleCommand(gradleTasks) {
  if (process.platform === "win32") {
    return {
      command: process.env.ComSpec ?? "cmd.exe",
      args: ["/d", "/s", "/c", `.\\gradlew.bat ${gradleTasks.join(" ")}`],
    };
  }

  return {
    command: "./gradlew",
    args: gradleTasks,
  };
}

function runTests() {
  const requestedApiLevel = getRequestedApiLevel();
  const gradleTasks = [...GRADLE_TASKS, ...getInstrumentationTasks(requestedApiLevel)];
  const { command, args } = getGradleCommand(gradleTasks);

  execFileSync(command, args, {
    cwd: ANDROID_PROJECT_DIRECTORY,
    stdio: "inherit",
  });
}

runTests();
