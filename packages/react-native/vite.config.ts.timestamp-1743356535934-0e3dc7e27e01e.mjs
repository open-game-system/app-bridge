// vite.config.ts
import { defineConfig } from "file:///Users/jonathanmumm/src/app-bridge/node_modules/.pnpm/vite@4.3.5_@types+node@22.13.14/node_modules/vite/dist/node/index.js";
import { resolve } from "path";
import dts from "file:///Users/jonathanmumm/src/app-bridge/node_modules/.pnpm/vite-plugin-dts@2.3.0_vite@4.3.5/node_modules/vite-plugin-dts/dist/index.mjs";
import { execSync } from "child_process";
var __vite_injected_original_dirname = "/Users/jonathanmumm/src/app-bridge/packages/react-native";
var vite_config_default = defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__vite_injected_original_dirname, "src/index.ts"),
        "expo/index": resolve(__vite_injected_original_dirname, "src/expo/index.ts")
      },
      formats: ["es", "cjs"],
      fileName: (format, entryName) => `${entryName}.${format === "es" ? "mjs" : "js"}`
    },
    rollupOptions: {
      external: [
        "react",
        "react-native",
        "expo",
        "@open-game-system/app-bridge",
        "@open-game-system/app-bridge-client",
        "@open-game-system/app-bridge-react",
        /^@open-game-system\/app-bridge/
      ]
    },
    sourcemap: true,
    minify: false
  },
  plugins: [
    dts(),
    {
      name: "react-native-build",
      closeBundle() {
        console.log("Building React Native specific bundle...");
        execSync("vite build --config vite.rn.config.ts", { stdio: "inherit" });
      }
    }
  ]
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvam9uYXRoYW5tdW1tL3NyYy9hcHAtYnJpZGdlL3BhY2thZ2VzL3JlYWN0LW5hdGl2ZVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL2pvbmF0aGFubXVtbS9zcmMvYXBwLWJyaWRnZS9wYWNrYWdlcy9yZWFjdC1uYXRpdmUvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL2pvbmF0aGFubXVtbS9zcmMvYXBwLWJyaWRnZS9wYWNrYWdlcy9yZWFjdC1uYXRpdmUvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tICdwYXRoJztcbmltcG9ydCBkdHMgZnJvbSAndml0ZS1wbHVnaW4tZHRzJztcbmltcG9ydCB7IGV4ZWNTeW5jIH0gZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIGJ1aWxkOiB7XG4gICAgbGliOiB7XG4gICAgICBlbnRyeToge1xuICAgICAgICBpbmRleDogcmVzb2x2ZShfX2Rpcm5hbWUsICdzcmMvaW5kZXgudHMnKSxcbiAgICAgICAgJ2V4cG8vaW5kZXgnOiByZXNvbHZlKF9fZGlybmFtZSwgJ3NyYy9leHBvL2luZGV4LnRzJyksXG4gICAgICB9LFxuICAgICAgZm9ybWF0czogWydlcycsICdjanMnXSxcbiAgICAgIGZpbGVOYW1lOiAoZm9ybWF0LCBlbnRyeU5hbWUpID0+IGAke2VudHJ5TmFtZX0uJHtmb3JtYXQgPT09ICdlcycgPyAnbWpzJyA6ICdqcyd9YCxcbiAgICB9LFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIGV4dGVybmFsOiBbXG4gICAgICAgICdyZWFjdCcsXG4gICAgICAgICdyZWFjdC1uYXRpdmUnLFxuICAgICAgICAnZXhwbycsXG4gICAgICAgICdAb3Blbi1nYW1lLXN5c3RlbS9hcHAtYnJpZGdlJyxcbiAgICAgICAgJ0BvcGVuLWdhbWUtc3lzdGVtL2FwcC1icmlkZ2UtY2xpZW50JyxcbiAgICAgICAgJ0BvcGVuLWdhbWUtc3lzdGVtL2FwcC1icmlkZ2UtcmVhY3QnLFxuICAgICAgICAvXkBvcGVuLWdhbWUtc3lzdGVtXFwvYXBwLWJyaWRnZS8sXG4gICAgICBdLFxuICAgIH0sXG4gICAgc291cmNlbWFwOiB0cnVlLFxuICAgIG1pbmlmeTogZmFsc2UsXG4gIH0sXG4gIHBsdWdpbnM6IFtcbiAgICBkdHMoKSxcbiAgICB7XG4gICAgICBuYW1lOiAncmVhY3QtbmF0aXZlLWJ1aWxkJyxcbiAgICAgIGNsb3NlQnVuZGxlKCkge1xuICAgICAgICBjb25zb2xlLmxvZygnQnVpbGRpbmcgUmVhY3QgTmF0aXZlIHNwZWNpZmljIGJ1bmRsZS4uLicpO1xuICAgICAgICBleGVjU3luYygndml0ZSBidWlsZCAtLWNvbmZpZyB2aXRlLnJuLmNvbmZpZy50cycsIHsgc3RkaW86ICdpbmhlcml0JyB9KTtcbiAgICAgIH0sXG4gICAgfSxcbiAgXSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUEwVixTQUFTLG9CQUFvQjtBQUN2WCxTQUFTLGVBQWU7QUFDeEIsT0FBTyxTQUFTO0FBQ2hCLFNBQVMsZ0JBQWdCO0FBSHpCLElBQU0sbUNBQW1DO0FBS3pDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLE9BQU87QUFBQSxJQUNMLEtBQUs7QUFBQSxNQUNILE9BQU87QUFBQSxRQUNMLE9BQU8sUUFBUSxrQ0FBVyxjQUFjO0FBQUEsUUFDeEMsY0FBYyxRQUFRLGtDQUFXLG1CQUFtQjtBQUFBLE1BQ3REO0FBQUEsTUFDQSxTQUFTLENBQUMsTUFBTSxLQUFLO0FBQUEsTUFDckIsVUFBVSxDQUFDLFFBQVEsY0FBYyxHQUFHLGFBQWEsV0FBVyxPQUFPLFFBQVE7QUFBQSxJQUM3RTtBQUFBLElBQ0EsZUFBZTtBQUFBLE1BQ2IsVUFBVTtBQUFBLFFBQ1I7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLElBQ0EsV0FBVztBQUFBLElBQ1gsUUFBUTtBQUFBLEVBQ1Y7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLElBQUk7QUFBQSxJQUNKO0FBQUEsTUFDRSxNQUFNO0FBQUEsTUFDTixjQUFjO0FBQ1osZ0JBQVEsSUFBSSwwQ0FBMEM7QUFDdEQsaUJBQVMseUNBQXlDLEVBQUUsT0FBTyxVQUFVLENBQUM7QUFBQSxNQUN4RTtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
