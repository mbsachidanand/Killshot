import { Linter } from 'eslint';

const config: Linter.Config = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json'
  },
  plugins: ['@typescript-eslint'],
  rules: {
    'indent': 'off',
    '@typescript-eslint/indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': 'off',
    '@typescript-eslint/quotes': ['error', 'single'],
    'semi': 'off',
    '@typescript-eslint/semi': ['error', 'always'],
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    'no-console': 'off',
    'prefer-const': 'error',
    'no-var': 'error',
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    'comma-dangle': ['error', 'never'],
    'eol-last': ['error', 'always'],
    'no-trailing-spaces': 'error',
    'no-multiple-empty-lines': ['error', { 'max': 1 }],
    'max-len': ['error', { 'code': 100, 'ignoreComments': true }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-inferrable-types': 'off',
    '@typescript-eslint/prefer-const': 'error',
    '@typescript-eslint/no-var-requires': 'off'
  }
};

export default config;
