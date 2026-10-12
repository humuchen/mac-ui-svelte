<script lang="ts">
  import type { Snippet } from 'svelte'
  import {
    useMacConfig,
    resolveSize,
    resolveTheme,
    type MacSize,
    type MacTheme,
  } from '../../internal/config.svelte'
  import { provideTabsContext, type TabsPaneInfo } from './tabs-context.svelte'

  /**
   * @tag mac-tabs
   * @summary macOS 风格的标签页组件，带动画指示器。
   *
   * @slot children - 用于放置 MacTabPane 的默认内容。
   * @slot prefix - 标签导航前的内容。
   * @slot suffix - 标签导航后的内容。
   *
   * @event mac-tabs-change - 激活标签变化时触发。`detail: { key: string }`
   * @event mac-tabs-close - 标签关闭时触发。`detail: { key: string }`
   * @event mac-tabs-add - 点击添加按钮时触发。
   */

  import type { TabItem } from './tabs-types'

  interface Props {
    /** 标签类型：line（下划线指示器）、card（卡片标签）、segment（分段控制器） */
    type?: 'line' | 'card' | 'segment'
    /** 组件尺寸 */
    size?: MacSize
    /** 激活标签的键（受控模式） */
    value?: string
    /** 默认激活标签的键（非受控模式） */
    defaultValue?: string
    /** 标签是否可关闭 */
    closable?: boolean
    /** 是否显示添加按钮 */
    addable?: boolean
    /** 是否启用标签切换动画 */
    animated?: boolean
    /** 触发模式：click 或 hover */
    trigger?: 'click' | 'hover'
    /** 标签项数据（替代插槽方式） */
    items?: TabItem[]
    /** 组件级主题覆盖。 */
    theme?: MacTheme
    /** 面板内容（对应 Lit 版默认 slot）。 */
    children?: Snippet
    /** 标签导航前内容。 */
    prefix?: Snippet
    /** 标签导航后内容。 */
    suffix?: Snippet
    /** 其余属性透传。 */
    [key: string]: unknown
  }

  let {
    type = 'line',
    size = undefined,
    value = '',
    defaultValue = '',
    closable = false,
    addable = false,
    animated = true,
    trigger = 'click',
    items = [],
    theme = undefined,
    children,
    prefix,
    suffix,
    ...rest
  }: Props = $props()

  const config = useMacConfig()
  const resolvedSize = $derived(resolveSize(size, config))
  const resolvedTheme = $derived(resolveTheme(theme, config))

  let root: HTMLDivElement | undefined = $state()
  let navContentEl: HTMLDivElement | undefined = $state()
  let internalActiveKey = $state('')
  let registeredPanes = $state<TabsPaneInfo[]>([])
  let paneIdSeq = 0

  function emit(name: string, detail?: unknown) {
    root?.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }))
  }

  provideTabsContext({
    get panes() {
      return registeredPanes
    },
    registerPane(pane) {
      const id = ++paneIdSeq
      registeredPanes = [...registeredPanes, { ...pane, id }]
      return id
    },
    unregisterPane(id) {
      registeredPanes = registeredPanes.filter((p) => p.id !== id)
    },
    get activeKey() {
      return activeKey
    },
    selectTab,
  })

  /** 全部标签项：items 属性优先，否则使用注册的面板。 */
  const allItems = $derived(items.length > 0 ? items : registeredPanes)

  const activeKey = $derived(value || internalActiveKey)

  // 初始化激活键：value > defaultValue > 第一项
  $effect(() => {
    if (value) {
      internalActiveKey = value
      return
    }
    if (internalActiveKey) return
    if (defaultValue) {
      internalActiveKey = defaultValue
    } else if (allItems.length > 0) {
      internalActiveKey = allItems[0].key
    }
  })

  function selectTab(key: string): void {
    const item = allItems.find((i) => i.key === key)
    if (!item || item.disabled) return

    if (!value) {
      internalActiveKey = key
    }
    emit('mac-tabs-change', { key })
  }

  function closeTab(key: string, e: Event): void {
    e.stopPropagation()
    emit('mac-tabs-close', { key })
  }

  function handleAdd(): void {
    emit('mac-tabs-add')
  }

  function handleTabHover(key: string): void {
    if (trigger !== 'hover') return
    selectTab(key)
  }

  // 激活键/标签变化后更新指示器位置（仅 line 类型 + animated）
  $effect(() => {
    void activeKey
    void allItems
    if (type === 'card' || type === 'segment') return
    if (!animated) return
    const raf = requestAnimationFrame(() => updateIndicator())
    return () => cancelAnimationFrame(raf)
  })

  function updateIndicator(): void {
    if (!navContentEl) return
    const activeEl = navContentEl.querySelector<HTMLElement>(`.tab-item[data-key="${activeKey}"]`)
    const indicator = navContentEl.querySelector<HTMLElement>('.indicator')
    if (!indicator || !activeEl) return

    const navRect = navContentEl.getBoundingClientRect()
    const activeRect = activeEl.getBoundingClientRect()

    indicator.style.left = `${activeRect.left - navRect.left + navContentEl.scrollLeft}px`
    indicator.style.width = `${activeRect.width}px`
  }
</script>

<div
  bind:this={root}
  {...rest}
  class="mac-scope mac-tabs"
  data-theme={resolvedTheme}
  data-size={resolvedSize}
>
  <div class="nav nav--{type}">
    {#if prefix}{@render prefix()}{/if}
    <div bind:this={navContentEl} class="nav-content">
      {#each allItems as item (item.key)}
        <div
          class="tab-item {item.key === activeKey ? 'active' : ''} {item.disabled ? 'disabled' : ''}"
          data-key={item.key}
          onclick={() => selectTab(item.key)}
          onmouseenter={() => handleTabHover(item.key)}
        >
          <span class="tab-label">{item.label}</span>
          {#if closable || item.closable}
            <span class="close-btn" onclick={(e: Event) => closeTab(item.key, e)}>
              <svg
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              >
                <path d="M3 3l6 6M9 3l-6 6" />
              </svg>
            </span>
          {/if}
        </div>
      {/each}
      {#if type === 'line' && animated}
        <div class="indicator"></div>
      {/if}
    </div>
    {#if addable}
      <span class="add-btn" onclick={handleAdd}>
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
        >
          <path d="M8 3v10M3 8h10" />
        </svg>
      </span>
    {/if}
    {#if suffix}{@render suffix()}{/if}
  </div>
  <div class="pane-container">
    {#if children}{@render children()}{/if}
  </div>
</div>

<style>
  .mac-tabs {
    display: flex;
    flex-direction: column;
    --md-tabs-nav-bg: transparent;
    --md-tabs-nav-border: var(--md-glass-separator);
    --md-tabs-nav-padding: 0 var(--md-spacing-lg);
    --md-tabs-item-color: var(--md-color-text-secondary);
    --md-tabs-item-hover-color: var(--md-color-text);
    --md-tabs-item-active-color: var(--md-mac-accent);
    --md-tabs-item-disabled-color: var(--md-color-text-secondary);
    --md-tabs-item-padding: var(--md-spacing-sm) var(--md-spacing-md);
    --md-tabs-item-font-size: var(--md-font-size-base);
    --md-tabs-item-gap: var(--md-spacing-xs);
    --md-tabs-indicator-color: var(--md-mac-accent);
    --md-tabs-indicator-height: 2px;
    --md-tabs-indicator-radius: 1px;
    --md-tabs-pane-padding: var(--md-spacing-lg) 0;
    --md-tabs-close-color: var(--md-color-text-secondary);
    --md-tabs-close-hover-color: var(--md-color-text);
    --md-tabs-close-hover-bg: rgba(0, 0, 0, 0.06);
    --md-tabs-add-color: var(--md-color-text-secondary);
    --md-tabs-add-hover-color: var(--md-color-text);
    --md-tabs-add-hover-bg: rgba(0, 0, 0, 0.06);
    --md-tabs-segment-bg: rgba(0, 0, 0, 0.04);
    --md-tabs-segment-item-color: var(--md-color-text-secondary);
    --md-tabs-segment-item-active-bg: var(--md-color-bg);
    --md-tabs-segment-item-active-color: var(--md-color-text);
    --md-tabs-segment-item-hover-bg: rgba(0, 0, 0, 0.04);
    --md-tabs-segment-radius: var(--md-radius-md);
  }

  /* ─── 导航栏 ─── */

  .nav {
    display: flex;
    align-items: center;
    background: var(--md-tabs-nav-bg);
    padding: var(--md-tabs-nav-padding);
    position: relative;
  }

  .nav-content {
    display: flex;
    align-items: center;
    gap: var(--md-tabs-item-gap);
    position: relative;
    flex: 1;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .nav-content::-webkit-scrollbar {
    display: none;
  }

  /* ─── 标签项 ─── */

  .tab-item {
    display: flex;
    align-items: center;
    gap: var(--md-spacing-xs);
    padding: var(--md-tabs-item-padding);
    font-size: var(--md-tabs-item-font-size);
    color: var(--md-tabs-item-color);
    cursor: pointer;
    white-space: nowrap;
    user-select: none;
    border-radius: var(--md-radius-sm);
    transition:
      color var(--md-transition-fast),
      background var(--md-transition-fast);
    position: relative;
    flex-shrink: 0;
  }

  .tab-item:hover {
    color: var(--md-tabs-item-hover-color);
  }

  .tab-item.active {
    color: var(--md-tabs-item-active-color);
  }

  .tab-item.disabled {
    color: var(--md-tabs-item-disabled-color);
    opacity: 0.4;
    cursor: not-allowed;
  }

  .tab-item.disabled:hover {
    color: var(--md-tabs-item-disabled-color);
  }

  /* ─── 关闭按钮 ─── */

  .close-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    color: var(--md-tabs-close-color);
    transition:
      color var(--md-transition-fast),
      background var(--md-transition-fast);
    margin-left: 2px;
    flex-shrink: 0;
  }

  .close-btn:hover {
    color: var(--md-tabs-close-hover-color);
    background: var(--md-tabs-close-hover-bg);
  }

  .close-btn :global(svg),
  .close-btn svg {
    width: 10px;
    height: 10px;
  }

  /* ─── 添加按钮 ─── */

  .add-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: var(--md-radius-sm);
    color: var(--md-tabs-add-color);
    cursor: pointer;
    transition:
      color var(--md-transition-fast),
      background var(--md-transition-fast);
    flex-shrink: 0;
  }

  .add-btn:hover {
    color: var(--md-tabs-add-hover-color);
    background: var(--md-tabs-add-hover-bg);
  }

  .add-btn :global(svg),
  .add-btn svg {
    width: 14px;
    height: 14px;
  }

  /* ─── 线条指示器 ─── */

  .indicator {
    position: absolute;
    bottom: 0;
    height: var(--md-tabs-indicator-height);
    background: var(--md-tabs-indicator-color);
    border-radius: var(--md-tabs-indicator-radius);
    transition:
      left var(--md-transition-normal),
      width var(--md-transition-normal);
    pointer-events: none;
  }

  /* ─── 线条类型：导航栏底部边框 ─── */

  .mac-tabs .nav--line {
    border-bottom: 0.5px solid var(--md-tabs-nav-border);
  }

  /* ─── 卡片类型 ─── */

  .mac-tabs .nav--card .tab-item {
    background: rgba(0, 0, 0, 0.03);
    border: 0.5px solid var(--md-tabs-nav-border);
    border-bottom: none;
    border-radius: var(--md-radius-md) var(--md-radius-md) 0 0;
    margin-bottom: -0.5px;
  }

  .mac-tabs .nav--card .tab-item.active {
    background: var(--md-color-bg);
    border-bottom: 0.5px solid var(--md-color-bg);
  }

  .mac-tabs .nav--card {
    border-bottom: 0.5px solid var(--md-tabs-nav-border);
  }

  .mac-tabs .nav--card .indicator {
    display: none;
  }

  /* ─── 分段类型 ─── */

  .mac-tabs .nav--segment {
    padding: var(--md-spacing-xs);
    background: var(--md-tabs-segment-bg);
    border-radius: var(--md-tabs-segment-radius);
    border-bottom: none;
  }

  .mac-tabs .nav--segment .nav-content {
    gap: 0;
  }

  .mac-tabs .nav--segment .tab-item {
    padding: var(--md-spacing-xs) var(--md-spacing-lg);
    color: var(--md-tabs-segment-item-color);
    border-radius: var(--md-radius-sm);
    font-size: var(--md-font-size-sm);
  }

  .mac-tabs .nav--segment .tab-item:hover {
    background: var(--md-tabs-segment-item-hover-bg);
    color: var(--md-tabs-segment-item-color);
  }

  .mac-tabs .nav--segment .tab-item.active {
    background: var(--md-tabs-segment-item-active-bg);
    color: var(--md-tabs-segment-item-active-color);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  }

  .mac-tabs .nav--segment .indicator {
    display: none;
  }

  /* ─── 标签面板 ─── */

  .pane-container {
    padding: var(--md-tabs-pane-padding);
  }

  /* ─── 尺寸：小 ─── */

  .mac-tabs[data-size='sm'] {
    --md-tabs-item-padding: var(--md-spacing-xs) var(--md-spacing-sm);
    --md-tabs-item-font-size: var(--md-font-size-sm);
    --md-tabs-item-gap: 2px;
    --md-tabs-pane-padding: var(--md-spacing-md) 0;
  }

  /* ─── 尺寸：大 ─── */

  .mac-tabs[data-size='lg'] {
    --md-tabs-item-padding: var(--md-spacing-md) var(--md-spacing-lg);
    --md-tabs-item-font-size: var(--md-font-size-lg);
    --md-tabs-item-gap: var(--md-spacing-sm);
    --md-tabs-pane-padding: var(--md-spacing-xl) 0;
  }

  .mac-tabs[data-theme='dark'] {
    --md-tabs-nav-border: rgba(255, 255, 255, 0.08);
    --md-tabs-item-color: rgba(255, 255, 255, 0.55);
    --md-tabs-item-hover-color: rgba(255, 255, 255, 0.88);
    --md-tabs-item-active-color: rgba(0, 122, 255, 0.9);
    --md-tabs-item-disabled-color: rgba(255, 255, 255, 0.3);
    --md-tabs-indicator-color: rgba(0, 122, 255, 0.9);
    --md-tabs-close-color: rgba(255, 255, 255, 0.4);
    --md-tabs-close-hover-color: rgba(255, 255, 255, 0.8);
    --md-tabs-close-hover-bg: rgba(255, 255, 255, 0.08);
    --md-tabs-add-color: rgba(255, 255, 255, 0.4);
    --md-tabs-add-hover-color: rgba(255, 255, 255, 0.8);
    --md-tabs-add-hover-bg: rgba(255, 255, 255, 0.08);
    --md-tabs-segment-bg: rgba(255, 255, 255, 0.06);
    --md-tabs-segment-item-color: rgba(255, 255, 255, 0.55);
    --md-tabs-segment-item-active-bg: rgba(255, 255, 255, 0.12);
    --md-tabs-segment-item-active-color: rgba(255, 255, 255, 0.92);
    --md-tabs-segment-item-hover-bg: rgba(255, 255, 255, 0.08);
  }

  .mac-tabs[data-theme='dark'] .nav--card .tab-item {
    background: rgba(255, 255, 255, 0.05);
  }

  .mac-tabs[data-theme='light'] {
    --md-tabs-nav-border: var(--md-glass-separator);
    --md-tabs-item-color: var(--md-color-text-secondary);
    --md-tabs-item-hover-color: var(--md-color-text);
    --md-tabs-item-active-color: var(--md-mac-accent);
    --md-tabs-item-disabled-color: var(--md-color-text-secondary);
    --md-tabs-indicator-color: var(--md-mac-accent);
    --md-tabs-close-color: var(--md-color-text-secondary);
    --md-tabs-close-hover-color: var(--md-color-text);
    --md-tabs-close-hover-bg: rgba(0, 0, 0, 0.06);
    --md-tabs-add-color: var(--md-color-text-secondary);
    --md-tabs-add-hover-color: var(--md-color-text);
    --md-tabs-add-hover-bg: rgba(0, 0, 0, 0.06);
    --md-tabs-segment-bg: rgba(0, 0, 0, 0.04);
    --md-tabs-segment-item-color: var(--md-color-text-secondary);
    --md-tabs-segment-item-active-bg: var(--md-color-bg);
    --md-tabs-segment-item-active-color: var(--md-color-text);
    --md-tabs-segment-item-hover-bg: rgba(0, 0, 0, 0.04);
  }

  /* ─── 响应式：移动端适配 ─── */
  @media (max-width: 768px) {
    .nav-content {
      /* 触屏惯性滚动 */
      -webkit-overflow-scrolling: touch;
      /* 允许触控横向滚动但禁用纵向 */
      touch-action: pan-x;
      scroll-snap-type: x proximity;
    }
    .tab-item {
      /* 接近 44px 触控目标，由 theme.ts 的 padding 变量已放大 */
      scroll-snap-align: start;
    }
    /* segment 类型：移动端允许换行，避免长文本被截断 */
    .mac-tabs .nav--segment .nav-content {
      flex-wrap: wrap;
      overflow-x: visible;
    }
  }
</style>
