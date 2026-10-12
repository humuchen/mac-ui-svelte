<script lang="ts">
  import type { Snippet } from 'svelte'
  import { provideMacConfig, type MacTheme, type MacSize } from '../../internal/config.svelte'

  /**
   * @tag mac-config-provider
   * @summary 全局配置提供者，向后代组件传递主题（theme）与尺寸（size）。
   * @slot - 需要接收配置的组件内容。
   */

  interface Props {
    /** 主题模式。 */
    theme?: MacTheme
    /** 全局尺寸。 */
    size?: MacSize
    /** 配置作用范围内的内容。 */
    children?: Snippet
  }

  let { theme = undefined, size = undefined, children }: Props = $props()

  // $state 代理对象：后代组件读取其属性具有响应性
  const config = $state<{ theme?: MacTheme; size?: MacSize }>({})
  provideMacConfig(config)

  $effect(() => {
    config.theme = theme
    config.size = size
  })
</script>

<div class="mac-scope mac-config-provider" data-theme={theme} data-size={size}>
  {@render children?.()}
</div>

<style>
  .mac-config-provider {
    display: contents;
  }
</style>
