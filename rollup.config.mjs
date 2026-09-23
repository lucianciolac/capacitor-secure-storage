const input = "dist/esm/index.js";
const external = ["@capacitor/core"];
const sharedOutputOptions = {
  inlineDynamicImports: true,
  sourcemap: true,
};

export default {
  input,
  external,
  output: [
    {
      ...sharedOutputOptions,
      file: "dist/plugin.js",
      format: "iife",
      name: "capacitorSecureStoragePlugin",
      globals: {
        "@capacitor/core": "capacitorExports",
      },
    },
    {
      ...sharedOutputOptions,
      file: "dist/plugin.cjs.js",
      format: "cjs",
    },
    {
      ...sharedOutputOptions,
      file: "dist/plugin.mjs",
      format: "esm",
    },
  ],
};
