// ESLint does one job here: the Rules of Hooks. Types are checked by `tsc`
// (npm run typecheck), so no type or style rules are enabled — this config
// exists to catch a hook called conditionally, or an effect reading a value
// it does not list, which tsc cannot see.
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  { ignores: ['dist/**', 'node_modules/**', '.kimchi/**'] },
  {
    files: ['src/**/*.{ts,tsx}', 'tests/**/*.{ts,tsx}'],
    languageOptions: { parser: tseslint.parser },
    plugins: { 'react-hooks': reactHooks },
    // Inline-disable comments for rules this config does not load are not errors.
    linterOptions: { reportUnusedDisableDirectives: 'off' },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];
