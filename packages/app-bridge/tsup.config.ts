import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'index': 'src/index.ts',
    'web': 'src/web/index.ts',
    'react': 'src/react/index.tsx',
    'native': 'src/native/index.ts',
    'testing': 'src/testing/index.ts'
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  target: 'es2015',
  minify: false,
  external: ['react'],
  treeshake: true,
  esbuildOptions(options) {
    options.target = 'es2015';
    return options;
  }
}); 