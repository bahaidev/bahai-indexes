'use strict';

module.exports = {
  extends: [
    'ash-nazg/sauron-node-overrides'
  ],
  parser: '@babel/eslint-parser',
  parserOptions: {
    requireConfigFile: false,
    ecmaVersion: 2021
  },
  overrides: [
    {
      files: ['parsers/**', 'src/**'],
      env: {
        browser: false,
        'shared-node-browser': false
      },
      globals: {
        document: 'off'
      },
      rules: {
        'no-console': 'off'
      }
    }
  ],
  settings: {
    polyfills: [
      'Array.isArray',
      'Blob',
      'console',
      'Date.now',
      'document.body',
      'document.evaluate',
      'document.head',
      'document.importNode',
      'document.querySelector', 'document.querySelectorAll',
      'DOMParser',
      'Error',
      'fetch',
      'FileReader',
      'history.pushState',
      'history.replaceState',
      'JSON',
      'location.href',
      'location.origin',
      'MutationObserver',
      'Number.parseInt',
      'Object.assign', 'Object.defineProperty', 'Object.defineProperties',
      'Object.getOwnPropertyDescriptor',
      'Object.entries', 'Object.keys', 'Object.values',
      'Promise',
      'Set',
      'Uint8Array',
      'URL',
      'URLSearchParams',
      'window.getComputedStyle',
      'window.postMessage',
      'window.scrollX', 'window.scrollY',
      'XMLHttpRequest',
      'XMLSerializer'
    ]
  },
  rules: {
  }
};
