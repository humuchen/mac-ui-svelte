import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// 组件库构建配置（将 src/lib 打包为可发布的库，external svelte）
export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      $lib: fileURLToPath(new URL('./src/lib', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist/lib',
    emptyOutDir: true,
    sourcemap: true,
    minify: 'esbuild',
    lib: {
      entry: fileURLToPath(new URL('./src/lib/index.ts', import.meta.url)),
      name: 'MacUISvelte',
      formats: ['es'],
      fileName: () => '@humuchen/mac-ui-svelte.js',
    },
    rollupOptions: {
      external: ['svelte', 'svelte/'],
    },
  },
})
