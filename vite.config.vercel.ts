// Vercel production build.
//
// The root vite.config.ts leaves nitro on its default (cloudflare) preset and
// emits dist/, which Vercel cannot serve. This config builds the SAME app —
// the live route tree in src/ — with the vercel preset so the output lands in
// .vercel/output as vercel.json expects.
//
// Kept separate from vite.config.ts so local `npm run build` behaviour is
// unchanged. Referenced by the `build:vercel` script and vercel.json.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  nitro: { preset: "vercel" },
});
