module.exports = {
  root: true,
  env: { browser: true, es2020: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: [
    'dist', 
    '.eslintrc.cjs', 
    'node_modules', 
    '*.d.ts',
    'api/**/*',
    'supabase/**/*',
    '*.sql',
    '*.md',
    'public/sw.js',
    '*-security-*.js',
    'test-*.js',
    'vite-*.js',
    'postcss.config.js'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    'no-unused-vars': 'warn',
    'no-console': 'off', // Allow console statements for debugging
  },
}