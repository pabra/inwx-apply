module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'jest', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:node/recommended',
    'plugin:jest/recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  env: {
    'jest/globals': true,
  },
  parserOptions: {
    ecmaVersion: 2018, // Allows for the parsing of modern ECMAScript features
    sourceType: 'module', // Allows for the use of imports
  },
  rules: {
    // Place to specify ESLint rules. Can be used to overwrite rules specified from the extended configs
    // e.g. "@typescript-eslint/explicit-function-return-type": "off",
    '@typescript-eslint/no-explicit-any': 0,
    'node/no-unsupported-features/es-syntax': 0,
    'node/shebang': 0,

    // ts
    '@typescript-eslint/explicit-module-boundary-types': 2,
    '@typescript-eslint/no-non-null-asserted-optional-chain': 2,

    // js
    'no-shadow': 2,
    eqeqeq: 2,
    'node/no-missing-import': [
      2,
      {
        tryExtensions: ['.ts', '.js', '.json', '.node'],
      },
    ],
  },
};
