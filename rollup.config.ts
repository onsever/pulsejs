import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import replace from '@rollup/plugin-replace';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

const replacePlugin = replace({
  preventAssignment: true,
  values: { __VERSION__: pkg.version },
});

export default [
  // UMD (unminified)
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/pulse.js',
      format: 'umd',
      name: 'Pulse',
      sourcemap: true,
      exports: 'named',
    },
    plugins: [replacePlugin, typescript()],
  },
  // UMD (minified)
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/pulse.min.js',
      format: 'umd',
      name: 'Pulse',
      sourcemap: true,
      exports: 'named',
    },
    plugins: [replacePlugin, typescript(), terser({ compress: { passes: 2 } })],
  },
  // ESM
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/pulse.esm.js',
      format: 'es',
      sourcemap: true,
    },
    plugins: [replacePlugin, typescript()],
  },
];
