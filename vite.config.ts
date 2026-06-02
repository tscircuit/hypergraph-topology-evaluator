import { defineConfig } from "vite"

export default defineConfig({
  resolve: {
    alias: {
      lib: new URL("./lib", import.meta.url).pathname,
      tests: new URL("./tests", import.meta.url).pathname,
    },
    dedupe: ["react", "react-dom"],
  },
})
