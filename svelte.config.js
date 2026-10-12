import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

export default {
  // 使用 vitePreprocess 以支持 <script lang="ts">
  preprocess: vitePreprocess(),
}
