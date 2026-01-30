const esbuild = require('esbuild');

const watch = process.argv.includes('--watch');

/** @type {import('esbuild').BuildOptions} */
const options = {
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'out/extension.js',
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  target: 'es2020',
  sourcemap: true,
};

if (watch) {
  esbuild.context(options).then(ctx => ctx.watch());
  console.log('Watching...');
} else {
  esbuild.build(options).then(() => console.log('Build complete'));
}
