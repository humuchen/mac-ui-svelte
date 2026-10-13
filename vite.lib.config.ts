import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

const stylesDir = fileURLToPath(new URL('./src/lib/styles', import.meta.url))

/**
 * 将 src/lib/styles/*.css 原样输出到 dist/lib/styles/，
 * 保证 package.json 的 "./styles/*" 导出（如 theme.css 主题变量）真实可用。
 * 使用 emitFile 走 Vite 资源管线，避免额外文件拷贝依赖。
 */
function copyStyles(): Plugin {
  let emitted = false
  return {
    name: 'mac-ui-svelte:copy-styles',
    generateBundle() {
      // 多 format 构建时 generateBundle 会被多次调用，避免重复 emit
      if (emitted) return
      // 目录缺失时静默跳过，避免构建崩溃
      if (!statSync(stylesDir, { throwIfNoEntry: false })?.isDirectory()) return
      emitted = true
      for (const entry of readdirSync(stylesDir, { withFileTypes: true })) {
        if (!entry.isFile() || !entry.name.endsWith('.css')) continue
        this.emitFile({
          type: 'asset',
          fileName: `styles/${entry.name}`,
          source: readFileSync(join(stylesDir, entry.name)),
        })
      }
    },
  }
}

// 组件库构建配置（将 src/lib 打包为可发布的库，external svelte）
export default defineConfig({
  plugins: [svelte(), copyStyles()],
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
      formats: ['es', 'cjs', 'umd'],
      fileName: (format: string) => `mac-ui-svelte.${format}.js`,
    },
    rollupOptions: {
      // 组件编译产物会引入 svelte/internal/client、svelte/internal/disclose-version 等子路径，
      // 字符串数组是精确 ID 匹配（尾斜杠前缀匹配非规范行为），此处显式按前缀 external，
      // 确保 svelte 运行时不被打进产物，与使用方共享同一实例。
      external: (id: string) => id === 'svelte' || id.startsWith('svelte/'),
    },
  },
})
