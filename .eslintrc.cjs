module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  // supabase/functions são Deno (runtime diferente) — não fazem parte do build do app.
  ignorePatterns: ['dist', 'dev-dist', '.eslintrc.cjs', 'supabase/functions'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
  },
}
