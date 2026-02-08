import tseslint from "typescript-eslint";
import nextPlugin from "@next/eslint-plugin-next";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import jsxA11yPlugin from "eslint-plugin-jsx-a11y";

export default tseslint.config(
  // Global ignores
  {
    ignores: [".next/", "node_modules/", "public/", "scripts/"],
  },

  // TypeScript parser for all TS/TSX files
  {
    name: "typescript/base",
    files: ["**/*.{ts,tsx,mjs}"],
    extends: [...tseslint.configs.recommended],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      // Match the previous next/typescript behaviour: warn, not error
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
    },
  },

  // Disable type-checked rules on plain JS files
  {
    name: "typescript/js-override",
    files: ["**/*.{js,mjs,cjs}"],
    ...tseslint.configs.disableTypeChecked,
  },

  // Next.js core-web-vitals rules
  {
    name: "next/core-web-vitals",
    files: ["**/*.{js,mjs,cjs,jsx,ts,tsx}"],
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },

  // React rules
  {
    name: "react/recommended",
    files: ["**/*.{jsx,tsx}"],
    plugins: {
      react: reactPlugin,
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs["jsx-runtime"].rules,
    },
    settings: {
      react: { version: "detect" },
    },
  },

  // React Hooks rules
  {
    name: "react-hooks/recommended",
    files: ["**/*.{jsx,tsx}"],
    plugins: {
      "react-hooks": reactHooksPlugin,
    },
    rules: {
      ...reactHooksPlugin.configs["recommended-latest"].rules,
      // Downgrade new React 19 rules to warn (pre-existing patterns)
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/globals": "warn",
    },
  },

  // Accessibility rules (warn to match previous next/core-web-vitals)
  {
    name: "jsx-a11y/recommended",
    files: ["**/*.{jsx,tsx}"],
    plugins: {
      "jsx-a11y": jsxA11yPlugin,
    },
    rules: {
      ...jsxA11yPlugin.configs.recommended.rules,
      // Downgrade to warn to match previous config behaviour
      "jsx-a11y/label-has-associated-control": "warn",
      "jsx-a11y/no-noninteractive-element-to-interactive-role": "warn",
      "jsx-a11y/no-noninteractive-element-interactions": "warn",
      "jsx-a11y/no-noninteractive-tabindex": "warn",
    },
  },
);
