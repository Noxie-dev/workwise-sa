import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";
import pluginPrettier from "eslint-plugin-prettier";
import airbnb from "eslint-config-airbnb";
import airbnbReact from "eslint-config-airbnb/hooks";
import path from "path";
import { fileURLToPath } from "url";

// mimic __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default tseslint.config(
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    extends: [
      pluginJs.configs.recommended,
      ...tseslint.configs.recommended,
      airbnb,
      airbnbReact,
      pluginReact.configs.recommended,
      prettierConfig,
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        jest: true,
      },
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: 12,
        sourceType: "module",
        project: ["./tsconfig.json", "./client/tsconfig.json", "./server/tsconfig.json"],
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      react: pluginReact,
      "react-hooks": pluginReactHooks,
      "@typescript-eslint": tseslint.plugin,
      prettier: pluginPrettier,
    },
    rules: {
      "react/jsx-filename-extension": [1, { extensions: [".tsx", ".jsx"] }],
      "import/extensions": [
        "error",
        "ignorePackages",
        {
          ts: "never",
          tsx: "never",
          js: "never",
          jsx: "never",
        },
      ],
      "no-use-before-define": "off",
      "@typescript-eslint/no-use-before-define": ["error"],
      "react/react-in-jsx-scope": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "import/prefer-default-export": "off",
      "react/prop-types": "off",
      "react/require-default-props": "off",
      "prettier/prettier": "error",
      // Disable rules that conflict with Prettier or are not needed with TypeScript
      "indent": "off",
      "@typescript-eslint/indent": "off",
      "linebreak-style": "off",
      "quotes": "off",
      "semi": "off",
      "no-trailing-spaces": "off",
      "comma-dangle": "off",
      "object-curly-spacing": "off",
      "arrow-parens": "off",
      "no-console": "warn", // Allow console.warn for development
      "no-debugger": "warn", // Allow debugger for development
      "max-len": ["error", { "code": 120, "ignoreUrls": true }], // Adjust max line length
      "no-shadow": "off", // Disable no-shadow as it conflicts with TS enums/types
      "@typescript-eslint/no-shadow": ["error"],
      "import/no-extraneous-dependencies": ["error", {"devDependencies": true}], // Allow dev dependencies in certain files
      "react/function-component-definition": ["error", { "namedComponents": "arrow-function" }], // Enforce arrow functions for named components
      "react/jsx-props-no-spreading": "off", // Allow prop spreading
      "react/destructuring-assignment": "off", // Allow direct prop access
      "no-param-reassign": ["error", { "props": false }], // Allow reassigning properties of parameters
      "no-underscore-dangle": "off", // Allow dangling underscores
      "class-methods-use-this": "off", // Allow class methods that don't use 'this'
      "no-restricted-syntax": [ // Adjust restricted syntax
        "error",
        {
          "selector": "ForInStatement",
          "message": "for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.",
        },
        {
          "selector": "LabeledStatement",
          "message": "Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.",
        },
        {
          "selector": "WithStatement",
          "message": "`with` statements are disallowed in strict mode because they make code impossible to optimise.",
        },
      ],
    },
    settings: {
      react: {
        version: "detect",
      },
      "import/resolver": {
        node: {
          extensions: [".js", ".jsx", ".ts", ".tsx"],
        },
      },
    },
  },
  {
    // Configuration for files in the 'server' directory
    files: ["server/**/*.{js,ts}"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parserOptions: {
        project: ["./server/tsconfig.json"],
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      "import/no-extraneous-dependencies": ["error", {"devDependencies": true, "packageDir": ["./", "./server"]}],
      "no-console": "off", // Allow console logs in server
    },
  },
  {
    // Configuration for files in the 'client' directory
    files: ["client/**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        project: ["./client/tsconfig.json"],
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      "import/no-extraneous-dependencies": ["error", {"devDependencies": true, "packageDir": ["./", "./client"]}],
    },
  },
  {
    // Configuration for test files
    files: ["**/*.test.{js,jsx,ts,tsx}", "**/*.spec.{js,jsx,ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    rules: {
      "import/no-extraneous-dependencies": ["off"], // Allow dev dependencies in test files
    },
  }
];
