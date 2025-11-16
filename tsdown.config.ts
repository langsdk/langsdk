import { defineConfig } from "tsdown"

export default [
  defineConfig({
    dts: false,
    entry: {
      index: "bin/index.ts",
    },
    minify: true,
    outDir: "dist/bin",
  }),
]
