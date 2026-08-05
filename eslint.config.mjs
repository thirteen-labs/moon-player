import reactHooks from "eslint-plugin-react-hooks";
import tsEslint from "typescript-eslint";

export default tsEslint.config(
  { ignores: ["dist/**", "node_modules/**", "expo-env.d.ts"] },
  {
    extends: [...tsEslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
);
