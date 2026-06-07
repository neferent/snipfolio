import { defineConfig } from 'vitest/config'
import AutoImport from 'unplugin-auto-import/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    AutoImport({
      imports: ['vue', 'pinia'],
      dts: false,
    }),
  ],
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, './app'),
    },
  },
})
