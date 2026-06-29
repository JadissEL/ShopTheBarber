import globals from "globals";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginReactRefresh from "eslint-plugin-react-refresh";
import pluginUnusedImports from "eslint-plugin-unused-imports";

const sharedStrictRules = {
  eqeqeq: ["error", "always", { null: "ignore" }],
  "no-var": "error",
  "prefer-const": "error",
  "no-console": ["warn", { allow: ["warn", "error"] }],
  "no-throw-literal": "error",
  "prefer-promise-reject-errors": "error",
  curly: ["error", "multi-line"],
  "no-duplicate-imports": "error",
  "object-shorthand": ["error", "always"],
  "prefer-template": "warn",
};

const unusedImportRules = {
  "no-unused-vars": "off",
  "@typescript-eslint/no-unused-vars": "off",
  "unused-imports/no-unused-imports": "error",
  "unused-imports/no-unused-vars": [
    "error",
    {
      vars: "all",
      varsIgnorePattern: "^_",
      args: "after-used",
      argsIgnorePattern: "^_",
    },
  ],
};

/** Type-checked rules without the noisy `no-unsafe-*` family on legacy code. */
const serverTypeCheckedRules = {
  "@typescript-eslint/no-floating-promises": "error",
  "@typescript-eslint/no-misused-promises": "error",
  "@typescript-eslint/await-thenable": "error",
  "@typescript-eslint/no-unsafe-assignment": "off",
  "@typescript-eslint/no-unsafe-member-access": "off",
  "@typescript-eslint/no-unsafe-call": "off",
  "@typescript-eslint/no-unsafe-argument": "off",
  "@typescript-eslint/no-unsafe-return": "off",
  "@typescript-eslint/no-unsafe-enum-comparison": "off",
  "@typescript-eslint/restrict-template-expressions": "off",
  "@typescript-eslint/no-base-to-string": "off",
  "@typescript-eslint/no-unnecessary-type-assertion": "warn",
  "@typescript-eslint/require-await": "warn",
  "@typescript-eslint/no-explicit-any": "warn",
  "@typescript-eslint/consistent-type-imports": [
    "error",
    { prefer: "type-imports", fixStyle: "inline-type-imports" },
  ],
};

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      "**/node_modules/**",
      "server/node_modules/**",
      "server/prisma/migrations/**",
      "server/scripts/**",
      "scripts/**",
      "public/**",
      ".cursor/**",
      "*.config.js",
      "*.config.mjs",
      "server/*.config.js",
      "vite.config.js",
      "postcss.config.js",
      "tailwind.config.js",
      "lint-out.txt",
      "lint-report.json",
    ],
  },

  eslint.configs.recommended,

  // Frontend — React app (JS/JSX)
  {
    files: ["src/**/*.{js,jsx}"],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: "detect" },
    },
    plugins: {
      react: pluginReact,
      "react-hooks": pluginReactHooks,
      "react-refresh": pluginReactRefresh,
      "unused-imports": pluginUnusedImports,
    },
    rules: {
      ...pluginReact.configs.flat.recommended.rules,
      ...sharedStrictRules,
      ...unusedImportRules,
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
      "react/no-unescaped-entities": "off",
      "react/no-unknown-property": [
        "error",
        { ignore: ["cmdk-input-wrapper", "toast-close"] },
      ],
      "react/jsx-uses-vars": "error",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },

  // Frontend tests
  {
    files: ["src/**/__tests__/**/*.{js,jsx}", "src/**/*.test.{js,jsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.vitest,
        global: "readonly",
      },
    },
    rules: {
      "no-console": "off",
    },
  },

  // E2E tests (Playwright + TypeScript)
  {
    files: ["e2e/**/*.ts"],
    extends: [...tseslint.configs.recommended],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },

  // Backend — TypeScript (promise safety + imports, without unsafe-* noise)
  {
    files: ["server/src/**/*.ts"],
    extends: [...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "unused-imports": pluginUnusedImports,
    },
    rules: {
      ...sharedStrictRules,
      ...unusedImportRules,
      ...serverTypeCheckedRules,
    },
  },

  // Backend tests — integration tests parse JSON loosely
  {
    files: ["server/src/**/__tests__/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/no-misused-promises": "off",
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/consistent-type-imports": "off",
    },
  },

  // Seed script — verbose logging and one-off vars are expected
  {
    files: ["server/src/db/seed.ts"],
    rules: {
      "no-console": "off",
      "unused-imports/no-unused-vars": "warn",
    },
  }
);
