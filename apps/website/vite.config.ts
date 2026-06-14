import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { resolve } from "node:path";

export default defineConfig({
  tanstackStart: { server: { entry: "server" } },
  nitro: { preset: "vercel" },
  vite: {
    resolve: { alias: { "@": resolve(__dirname, "../../src") } },
  },
});
