import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  client: 'legacy/fetch',
  input: '../../docs/openapi.yaml',
  output: {
    format: 'prettier',
    lint: 'eslint',
    path: './src',
  },
  plugins: [
    {
      name: '@hey-api/client-fetch',
    },
    {
      name: '@hey-api/schemas',
      asClass: true,
    },
    {
      name: '@hey-api/types',
      asConst: true,
    },
  ],
});
