import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://wileyworx.com",
  output: "static",
  trailingSlash: "always",
  compressHTML: true,
});
