<script lang="ts">
  import {
    useMacConfig,
    resolveTheme,
    type MacTheme,
  } from '../../internal/config.svelte'

  /**
   * @tag mac-menu
   * @summary 一个独立的菜单组件，可以在任何位置显示。
   *
   * @event mac-menu-open - 菜单打开时触发。
   * @event mac-menu-close - 菜单关闭时触发。
   * @event mac-menu-select - 选中菜单项时触发。`detail: { value, item }`
   */

  /** 菜单项（与 Lit 版 DropdownItem 结构一致）。 */
  export interface MenuItem {
    /** 唯一值。 */
    value?: string
    /** 标签文本（支持 HTML）。 */
    label?: string
    /** 图标（支持 HTML）。 */
    icon?: string
    /** 快捷键文本。 */
    shortcut?: string
    /** 是否禁用。 */
    disabled?: boolean
    /** 是否为危险操作。 */
    danger?: boolean
    /** 是否为分隔线。 */
    divider?: boolean
    /** 子菜单项。 */
    children?: MenuItem[]
  }

  interface Props {
    /** 菜单项。 */
    items?: MenuItem[]
    /** 当前激活/选中的值。 */
    value?: string
    /** 菜单是否可见。 */
    visible?: boolean
    /** 菜单位置（x 坐标）。 */
    x?: number
    /** 菜单位置（y 坐标）。 */
    y?: number
    /** 组件级主题覆盖。 */
    theme?: MacTheme
    /** 其余属性透传。 */
    [key: string]: unknown
  }

  let {
    items = [],
    value = $bindable(''),
    visible = $bindable(false),
    x = 0,
    y = 0,
    theme = undefined,
    ...rest
  }: Props = $props()

  const config = useMacConfig()
  const resolvedTheme = $derived(
    resolveTheme(theme, config) ??
      ((document.documentElement.getAttribute('data-theme') ||
        document.body.getAttribute('data-theme') ||
        undefined) as MacTheme | undefined),
  )

  let root: HTMLDivElement | undefined = $state()

  function emit(name: string, detail?: unknown) {
    root?.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }))
  }

  /** 在指定位置显示菜单，使用给定的项。 */
  export function show(newX: number, newY: number, newItems?: MenuItem[]) {
    if (newItems) items = newItems
    x = newX
    y = newY
    visible = true
    emit('mac-menu-open')
  }

  /** 隐藏菜单。 */
  export function hide() {
    visible = false
    emit('mac-menu-close')
  }

  /** 切换菜单可见性。 */
  export function toggle(newX: number, newY: number, newItems?: MenuItem[]) {
    if (visible) {
      hide()
    } else {
      show(newX, newY, newItems)
    }
  }

  /** 计算视口内的位置。 */
  const position = $derived.by(() => {
    const vw = window.innerWidth
    const vh = window.innerHeight
    const isMobile = vw <= 768
    const menuWidth = isMobile ? vw - 32 : 220
    const menuHeight = items.length * 32 + 8

    let left = isMobile ? 16 : x
    let top = y

    // 调整到视口内
    if (left + menuWidth > vw - 8) left = vw - menuWidth - 8
    if (top + menuHeight > vh - 8) top = vh - menuHeight - 8
    if (left < 8) left = 8
    if (top < 8) top = 8

    return { left, top }
  })

  function handleItemClick(item: MenuItem) {
    if (item.disabled || item.children) return
    value = item.value ?? ''
    visible = false
    emit('mac-menu-select', { value: item.value ?? '', item })
  }

  function handleDocumentClick(e: Event) {
    if (!visible) return
    const target = e.target as Node
    if (root?.contains(target)) return
    hide()
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape' && visible) {
      e.preventDefault()
      hide()
    }
  }

  function handleScroll(e: Event) {
    if (visible && root && !root.contains(e.target as Node)) {
      hide()
    }
  }

  function handleResize() {
    if (visible) {
      hide()
    }
  }

  // visible 时挂载 document/window 级监听
  $effect(() => {
    if (!visible) return
    document.addEventListener('mousedown', handleDocumentClick)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('scroll', handleScroll, true)
    window.addEventListener('resize', handleResize)
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', handleResize)
    }
  })
</script>

<div bind:this={root} {...rest} class="mac-scope mac-menu" data-theme={resolvedTheme}>
  {#if visible}
    <div
      class="mac-menu-portal open"
      style="left: {position.left}px; top: {position.top}px;"
      data-theme={resolvedTheme}
    >
      {#each items as item, i (i)}
        {#if item.divider}
          <div class="menu-divider"></div>
        {:else}
          <div
            class="menu-item {item.disabled ? 'disabled' : ''} {item.danger ? 'danger' : ''} {item.value ===
            value
              ? 'active'
              : ''}"
            data-value={item.value}
            onclick={() => handleItemClick(item)}
          >
            {#if item.icon}
              <!-- eslint-disable-next-line svelte/no-at-html-tags -->
              <span class="menu-item-icon">{@html item.icon}</span>
            {/if}
            <span class="menu-item-label">
              <!-- eslint-disable-next-line svelte/no-at-html-tags -->
              {@html item.label ?? ''}
            </span>
            {#if item.shortcut}
              <span class="menu-item-shortcut">{item.shortcut}</span>
            {/if}
          </div>
        {/if}
      {/each}
    </div>
  {/if}
</div>

<style>
  .mac-menu {
    display: none;
  }

  /* 菜单专属变量（仅定义 theme.css 中不存在的变量） */
  .mac-menu {
    --md-spacing-container: 5px;
    --md-glass-brightness: 1.05;

    --md-menu-container-bg: rgba(255, 255, 255, 0.78);
    --md-menu-container-border: rgba(0, 0, 0, 0.04);
    --md-menu-container-shadow:
      0 0 0 1px rgba(0, 0, 0, 0.05),
      0 2px 4px rgba(0, 0, 0, 0.04),
      0 8px 16px rgba(0, 0, 0, 0.08),
      0 24px 48px rgba(0, 0, 0, 0.12);

    --md-menu-item-padding: 6px 12px;
    --md-menu-item-gap: 10px;
    --md-menu-item-hover-bg: rgba(0, 122, 255, 0.12);
    --md-menu-item-active-bg: rgba(0, 122, 255, 0.9);
    --md-menu-item-active-color: #ffffff;
    --md-menu-item-color: #1d1d1f;
    --md-menu-item-danger-color: #ff3b30;
    --md-menu-item-danger-hover-bg: rgba(255, 59, 48, 0.1);
    --md-menu-item-disabled-opacity: 0.35;

    --md-menu-shortcut-color: #86868b;
    --md-menu-arrow-color: #86868b;
    --md-menu-divider-color: rgba(0, 0, 0, 0.06);
    --md-menu-divider-margin: 5px 10px;

    /* 深色模式 */
    --md-menu-container-dark-bg: rgba(30, 30, 30, 0.92);
    --md-menu-container-dark-border: rgba(255, 255, 255, 0.08);
    --md-menu-item-dark-hover-bg: rgba(255, 255, 255, 0.1);
    --md-menu-item-dark-active-bg: rgba(10, 132, 255, 0.95);
    --md-menu-item-dark-color: #f5f5f7;
    --md-menu-shortcut-dark-color: #98989d;
    --md-menu-divider-dark-color: rgba(255, 255, 255, 0.06);

    --md-mac-text-white-soft: rgba(255, 255, 255, 0.95);
  }

  .mac-menu-portal {
    position: fixed;
    min-width: 180px;
    max-width: 280px;
    padding: var(--md-spacing-container);
    background: var(--md-menu-container-bg);
    backdrop-filter: blur(var(--md-glass-blur)) saturate(var(--md-glass-saturate))
      brightness(var(--md-glass-brightness));
    -webkit-backdrop-filter: blur(var(--md-glass-blur)) saturate(var(--md-glass-saturate))
      brightness(var(--md-glass-brightness));
    border: 0.5px solid var(--md-menu-container-border);
    border-radius: var(--md-radius-menu);
    box-shadow: var(--md-menu-container-shadow);
    z-index: 99999;
    opacity: 0;
    transform: scale(0.95) translateY(-8px);
    pointer-events: none;
    transition:
      opacity var(--md-transition-menu),
      transform var(--md-transition-menu);
    font-family: var(--md-font-family);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .mac-menu-portal.open {
    opacity: 1;
    transform: scale(1) translateY(0);
    pointer-events: auto;
    box-shadow:
      0 0 0 1px rgba(0, 0, 0, 0.06),
      0 4px 8px rgba(0, 0, 0, 0.06),
      0 12px 24px rgba(0, 0, 0, 0.1),
      0 32px 64px rgba(0, 0, 0, 0.15);
  }

  .mac-menu-portal :global(.menu-item) {
    display: flex;
    align-items: center;
    gap: var(--md-menu-item-gap);
    padding: var(--md-menu-item-padding);
    border-radius: var(--md-radius-sm);
    cursor: pointer;
    transition: background var(--md-transition-fast);
    user-select: none;
    white-space: nowrap;
    position: relative;
    font-size: var(--md-font-size-menu);
    font-weight: var(--md-font-weight-regular);
    line-height: 1.5;
    color: var(--md-menu-item-color);
    outline: none;
  }

  .mac-menu-portal :global(.menu-item:hover:not(.disabled)) {
    background: var(--md-menu-item-hover-bg);
  }

  .mac-menu-portal :global(.menu-item.active) {
    background: var(--md-menu-item-active-bg);
    color: var(--md-menu-item-active-color);
    font-weight: var(--md-font-weight-medium);
  }

  .mac-menu-portal :global(.menu-item.active:hover) {
    background: rgba(0, 100, 200, 0.95);
  }

  .mac-menu-portal :global(.menu-item.disabled) {
    opacity: var(--md-menu-item-disabled-opacity);
    cursor: not-allowed;
  }

  .mac-menu-portal :global(.menu-item.danger) {
    color: var(--md-menu-item-danger-color);
  }

  .mac-menu-portal :global(.menu-item.danger:hover:not(.disabled)) {
    background: var(--md-menu-item-danger-hover-bg);
  }

  .mac-menu-portal :global(.menu-item-icon) {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    font-size: 14px;
    flex-shrink: 0;
    opacity: 0.9;
  }

  .mac-menu-portal :global(.menu-item.active .menu-item-icon) {
    opacity: 1;
  }

  .mac-menu-portal :global(.menu-item-label) {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .mac-menu-portal :global(.menu-item-shortcut) {
    font-size: var(--md-font-size-xs);
    color: var(--md-menu-shortcut-color);
    margin-left: auto;
    padding-left: var(--md-spacing-lg);
    opacity: 0.7;
    font-weight: var(--md-font-weight-medium);
  }

  .mac-menu-portal :global(.menu-item.active .menu-item-shortcut) {
    color: var(--md-mac-text-white-soft);
    opacity: 0.9;
  }

  .mac-menu-portal :global(.menu-divider) {
    height: 1px;
    background: var(--md-menu-divider-color);
    margin: var(--md-menu-divider-margin);
  }

  /* 深色模式 */
  .mac-menu-portal[data-theme='dark'] {
    background: var(--md-menu-container-dark-bg);
    border-color: var(--md-menu-container-dark-border);
    box-shadow:
      0 0 0 1px rgba(255, 255, 255, 0.05),
      0 2px 4px rgba(0, 0, 0, 0.3),
      0 8px 16px rgba(0, 0, 0, 0.4),
      0 24px 48px rgba(0, 0, 0, 0.5);
  }

  .mac-menu-portal[data-theme='dark'].open {
    box-shadow:
      0 0 0 1px rgba(255, 255, 255, 0.08),
      0 4px 8px rgba(0, 0, 0, 0.4),
      0 12px 24px rgba(0, 0, 0, 0.5),
      0 32px 64px rgba(0, 0, 0, 0.6);
  }

  .mac-menu-portal[data-theme='dark'] :global(.menu-item:hover:not(.disabled)) {
    background: var(--md-menu-item-dark-hover-bg);
  }

  .mac-menu-portal[data-theme='dark'] :global(.menu-item.active) {
    background: var(--md-menu-item-dark-active-bg);
    color: var(--md-menu-item-active-color);
  }

  .mac-menu-portal[data-theme='dark'] :global(.menu-item.active:hover) {
    background: var(--md-menu-item-dark-active-bg);
  }

  .mac-menu-portal[data-theme='dark'] :global(.menu-item.danger:hover:not(.disabled)) {
    background: rgba(255, 59, 48, 0.15);
  }

  .mac-menu-portal[data-theme='dark'] :global(.menu-divider) {
    background: var(--md-menu-divider-dark-color);
  }

  .mac-menu-portal[data-theme='dark'] :global(.menu-item) {
    color: var(--md-menu-item-dark-color);
  }

  .mac-menu-portal[data-theme='dark'] :global(.menu-item-shortcut) {
    color: var(--md-menu-shortcut-dark-color);
  }

  /* 移动端适配 */
  @media (max-width: 768px) {
    .mac-menu-portal {
      min-width: calc(100vw - 32px) !important;
      max-width: calc(100vw - 32px) !important;
      border-radius: 12px;
    }

    .mac-menu-portal :global(.menu-item) {
      padding: 12px 16px !important;
      font-size: var(--md-font-size-lg) !important;
      gap: var(--md-spacing-md);
    }

    .mac-menu-portal :global(.menu-item-icon) {
      width: 20px;
      height: 20px;
      font-size: 16px;
    }
  }
</style>
