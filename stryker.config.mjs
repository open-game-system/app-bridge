// @ts-check
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  testRunner: "vitest",
  checkers: ["typescript"],
  tpiConfig: {
    coreModules: {
      "@stryker-mutator/vitest-runner": true,
      "@stryker-mutator/typescript-checker": true,
    },
  },
  vitest: {
    configFile: "vitest.workspace.ts",
  },
  mutate: [
    "packages/app-bridge-web/src/**/*.ts",
    "packages/app-bridge-native/src/**/*.ts",
    "packages/app-bridge-react/src/**/*.ts",
    "packages/app-bridge-react/src/**/*.tsx",
    "packages/app-bridge-testing/src/**/*.ts",
    "!packages/**/src/**/*.test.{ts,tsx}",
    "!packages/**/src/**/test/**",
    "!packages/**/dist/**",
  ],
  reporters: ["clear-text", "html", "json"],
  htmlReporter: {
    fileName: "reports/mutation/mutation.html",
  },
  jsonReporter: {
    fileName: "reports/mutation/mutation.json",
  },
  incremental: true,
  incrementalFile: ".stryker-incremental.json",
  tempDirName: ".stryker-tmp",
  concurrency: 4,
  timeoutMS: 30000,
  thresholds: {
    high: 95,
    low: 80,
    break: 60,
  },
};
