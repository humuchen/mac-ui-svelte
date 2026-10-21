import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  plugins: [svelte({ hot: false })],
  resolve: {
    alias: {
      $lib: fileURLToPath(new URL('./src/lib', import.meta.url)),
      // Storybook 演示包装组件（位于 .storybook/demos，供 demos.test.ts 透传验证使用）
      $demos: fileURLToPath(new URL('./.storybook/demos', import.meta.url)),
    },
    // vitest 默认按 SSR 条件解析 svelte，导致 mount 不可用；强制 browser 条件
    conditions: ['browser'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/test/setup.ts'],
    include: ['src/**/*.test.ts'],
  },
})
