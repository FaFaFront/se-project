import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";
import { defineConfig } from "eslint/config";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });
const nextConfigs = compat.extends("next/core-web-vitals", "next/typescript");

export default defineConfig([
  // Global ignores
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/generated/**",
      "**/.next/**",
      "**/out/**",
      "**/build/**",
      "**/storybook-static/**",
      "**/next-env.d.ts",
    ],
  },

  // API: TypeScript + Prettier
  { files: ["apps/api/**/*.{ts,tsx,js,jsx}"], ...js.configs.recommended },
  ...tseslint.configs.recommended.map((c) => ({
    ...c,
    files: ["apps/api/**/*.{ts,tsx,js,jsx}"],
  })),
  { files: ["apps/api/**/*.{ts,tsx,js,jsx}"], ...prettier },
  {
    files: ["apps/api/**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        module: "readonly",
        require: "readonly",
        exports: "writable",
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "prefer-const": "error",
      eqeqeq: "error",
    },
  },

  // Web: Next.js
  ...nextConfigs.map((c) => ({ ...c, files: ["apps/web/**/*.{ts,tsx,js,jsx}"] })),
  {
    files: ["apps/web/**/*.{ts,tsx,js,jsx}"],
    rules: {
      "@next/next/no-html-link-for-pages": ["error", "apps/web/src/app/"],
    },
  },
]);
