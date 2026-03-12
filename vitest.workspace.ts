import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  "packages/app-bridge-web/vitest.config.ts",
  "packages/app-bridge-native/vitest.config.ts",
  "packages/app-bridge-react/vitest.config.ts",
  "packages/app-bridge-testing/vitest.config.ts",
]);
