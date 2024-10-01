import ashNazg from 'eslint-config-ash-nazg';

export default [
  {
    ignores: [
      '.idea',
      'indexes/json-flattened'
    ]
  },
  ...ashNazg(['sauron', 'node']),
  ...ashNazg(['sauron', 'node']).map((cfg) => {
    return {
      ...cfg,
      files: ['parsers/**', 'src/**']
    };
  }),
  ...ashNazg(['sauron', 'browser']).map((cfg) => {
    return {
      ...cfg,
      files: ['indexes/json/**']
    };
  }),
  {
    files: ['parsers/**', 'src/**'],
    languageOptions: {
      globals: {
        document: 'off'
      }
    },
    rules: {
      'no-console': 'off'
    }
  }
];
