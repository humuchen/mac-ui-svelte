<script lang="ts">
  import type { Snippet } from 'svelte'
  import { useTabsContext } from './tabs-context.svelte'

  /**
   * @tag mac-tab-pane
   * @summary MacTabs 的子面板（用于插槽模式）。
   */

  interface Props {
    /** 唯一键。 */
    tabKey?: string
    /** 标签文本。 */
    label?: string
    /** 标签是否禁用。 */
    disabled?: boolean
    /** 标签是否可关闭。 */
    closable?: boolean
    /** 面板内容（对应 Lit 版默认 slot）。 */
    children?: Snippet
    /** 其余属性透传。 */
    [key: string]: unknown
  }

  let { tabKey = '', label = '', disabled = false, closable = false, children, ...rest }: Props =
    $props()

  const tabs = useTabsContext()
  const active = $derived(tabs ? tabs.activeKey === tabKey : false)

  // 注册/注销面板
  $effect(() => {
    if (!tabs) return
    const id = tabs.registerPane({ key: tabKey, label, disabled, closable })
    return () => tabs.unregisterPane(id)
  })
</script>

<div {...rest} class="mac-tab-pane" class:active style:display={active ? 'block' : 'none'}>
  {#if children}{@render children()}{/if}
</div>

<style>
  .mac-tab-pane {
    display: none;
  }

  .mac-tab-pane.active {
    display: block;
  }
</style>
