const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  {
    ignores: ['node_modules/**'],
  },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // Express detects an error handler by its 4 arguments, so `next` has to
      // stay in the signature even when it is never called
      'no-unused-vars': [
        'error',
        { args: 'after-used', argsIgnorePattern: '^_|^next$' },
      ],
    },
  },
];
