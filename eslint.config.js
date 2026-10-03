import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  { ignores: ["dist", "coverage", "docs", "public"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.property.name=/^(getFullYear|getMonth|getDate|getDay|getHours|getMinutes|getSeconds|getMilliseconds|setFullYear|setMonth|setDate|setHours|setMinutes|setSeconds|setMilliseconds)$/]",
          message:
            "All times are UTC (EVE time). Use the getUTC*/setUTC* variant or a lib/formatting/time.ts helper, not the local-timezone Date method.",
        },
        {
          selector:
            "CallExpression[callee.property.name=/^(toLocaleDateString|toLocaleTimeString)$/]",
          message:
            "Format dates/times via lib/formatting/time.ts (UTC), not toLocaleDateString/toLocaleTimeString (local). number.toLocaleString() for counts is fine.",
        },
        {
          selector: "NewExpression[callee.name='Date'][arguments.length>=2]",
          message:
            "new Date(y, m, d, …) uses the local timezone. Use Date.UTC(…) for UTC calendar construction.",
        },
      ],
    },
  },
  {
    files: ["*.{js,mjs,ts}", "vite.config.ts"],
    languageOptions: { globals: { ...globals.node } },
  },
  prettier,
);
