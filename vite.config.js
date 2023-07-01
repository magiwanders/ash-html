import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/main.js'),
      name: 'ash-js',
      fileName: 'ash-js',
    },
    manifest: false,
    rollupOptions: {
      external: [
        'src/util/dynamic-worker-classes.js',
        'src/util/ash-sim-worker.js',
        'src/ash-sim.js',
      ],
    },
  },
})