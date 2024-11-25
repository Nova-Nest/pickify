import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default [
  {
    input: 'sidepanel/capture.js',
    output: {
      file: 'dist/capture.bundle.js',
      format: 'iife',
    },
    plugins: [resolve(), commonjs()],
  },
  {
    input: 'sidepanel/buttons.js',
    output: {
      file: 'dist/buttons.bundle.js',
      format: 'iife',
    },
    plugins: [resolve(), commonjs()],
  },
];
