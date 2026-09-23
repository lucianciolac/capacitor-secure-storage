import eslint from "@eslint/js";
import globals from "globals";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import prettierPlugin from "eslint-plugin-prettier";
import prettierRecommended from "eslint-plugin-prettier/recommended";

export default [
  {
    ignores: [
      "node_modules/**",
      "test-app/**",
      ".build/**",
      "dist/**",
      "ios/**",
      "android/**",
      "rollup.config.js",
      "package-lock.json",
      "package.json",
      "CHANGELOG.md",
    ],
  },
  eslint.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: globals.browser,
    },
    plugins: {
      "@typescript-eslint": typescriptEslint,
      prettier: prettierPlugin,
    },
    rules: {
      ...typescriptEslint.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "off",
      "no-redeclare": "off",
      ...prettierRecommended.rules,
    },
  },
  {
    files: ["tests/**/*.cjs"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      "no-global-assign": "off",
    },
  },
];
