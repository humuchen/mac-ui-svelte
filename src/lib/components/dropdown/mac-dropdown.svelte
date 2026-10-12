<script lang="ts">
  import type { Snippet } from 'svelte'
  import {
    useMacConfig,
    resolveTheme,
    type MacTheme,
  } from '../../internal/config.svelte'

  /**
   * @tag mac-dropdown
   * @summary 一个 macOS 风格的下拉菜单组件。
   *
   * @slot trigger - 触发下拉菜单打开的元素。
   *
   * @event mac-dropdown-open - 下拉菜单打开时触发。
   * @event mac-dropdown-close - 下拉菜单关闭时触发。
   * @event mac-dropdown-select - 选中菜单项时触发。`detail: { value, item }`
   */

  import type { DropdownItem } from './dropdown-types'

  interface Props {
    /** 菜单项。 */
    items?: DropdownItem[]
    /** 下拉菜单的位置。 */
    placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'
    /** 当前激活/选中的值。 */
    value?: string
    /** 禁用下拉菜单。 */
    disabled?: boolean
    /** 悬停时打开下拉菜单。 */
    openOnHover?: boolean
    /** 悬停延迟（毫秒）。 */
    hoverDelay?: number
    /** 触发模式：click、contextmenu 或 both。 */
    trigger?: 'click' | 'contextmenu' | 'both'
    /** 组件级主题覆盖。 */
    theme?: MacTheme
    /** 触发元素（对应 Lit 版 slot name="trigger"）。 */
    triggerSnippet?: Snippet
    /** 其余属性透传。 */
    [key: string]: unknown
  }

  let {
    items = [],
    placement = 'bottom-start',
    value = $bindable(''),
    disabled = false,
    openOnHover = false,
    hoverDelay = 150,
    trigger = 'click',
    theme = undefined,
    triggerSnippet,
    ...rest
  }: Props = $props()

  const config = useMacConfig()
  const resolvedTheme = $derived(resolveTheme(theme, config))

  let root: HTMLDivElement | undefined = $state()
  let triggerEl: HTMLDivElement | undefined = $state()
  let menuEl: HTMLDivElement | undefined = $state()

  function emit(name: string, detail?: unknown) {
    root?.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }))
  }

  let open = $state(false)
  let menuStyle = $state('')
  let menuPlacement = $state(placement)
  let hoverTimeout: ReturnType<typeof setTimeout> | null = null
  // 右键菜单的显式坐标
  let explicitPos: { x: number; y: number } | null = null

  function findItem(list: DropdownItem[], v: string): DropdownItem | null {
    for (const item of list) {
      if (item.value === v) return item
      if (item.children) {
        const found = findItem(item.children, v)
        if (found) return found
      }
    }
    return null
  }

  /** 计算菜单位置（与 Lit 版 _calcPosition 一致）。 */
  function calcPosition(anchorRect?: DOMRect) {
    const vw = window.innerWidth
    const vh = window.innerHeight
    const isMobile = vw <= 768
    const menuWidth = isMobile ? vw - 32 : 220
    const menuHeight = items.length * 32 + 8

    if (explicitPos) {
      let left = isMobile ? 16 : explicitPos.x
      let top = explicitPos.y

      if (left + menuWidth > vw - 8) left = vw - menuWidth - 8
      if (top + menuHeight > vh - 8) top = vh - menuHeight - 8
      if (left < 8) left = 8
      if (top < 8) top = 8

      return { left, top, placement: 'context' }
    }

    if (!anchorRect) return { left: 0, top: 0, placement }

    let left = 0
    let top: number
    let p = placement

    const gap = 4

    if (isMobile) {
      left = Math.max(8, (vw - menuWidth) / 2)
    }

    switch (p) {
      case 'bottom-start':
        if (!isMobile) left = anchorRect.left
        top = anchorRect.bottom + gap
        break
      case 'bottom-end':
        if (!isMobile) left = anchorRect.right - menuWidth
        top = anchorRect.bottom + gap
        break
      case 'top-start':
        if (!isMobile) left = anchorRect.left
        top = anchorRect.top - menuHeight - gap
        break
      case 'top-end':
        if (!isMobile) left = anchorRect.right - menuWidth
        top = anchorRect.top - menuHeight - gap
        break
      default:
        if (!isMobile) left = anchorRect.left
        top = anchorRect.bottom + gap
    }

    // 自动翻转
    if ((p === 'bottom-start' || p === 'bottom-end') && top + menuHeight > vh - 8) {
      top = anchorRect.top - menuHeight - gap
      p = p.replace('bottom', 'top') as typeof p
    }
    if ((p === 'top-start' || p === 'top-end') && top < 8) {
      top = anchorRect.bottom + gap
      p = p.replace('top', 'bottom') as typeof p
    }
    if (left + menuWidth > vw - 8) {
      left = vw - menuWidth - 8
    }
    if (left < 8) {
      left = 8
    }

    return { left, top, placement: p }
  }

  function positionMenu(): void {
    if (!menuEl) return
    const anchorRect = triggerEl?.getBoundingClientRect()
    const { left, top, placement: p } = calcPosition(anchorRect)
    menuPlacement = p as typeof placement

    const menuRect = menuEl.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    let newLeft = left
    let newTop = top
    if (newLeft + menuRect.width > vw - 8) newLeft = vw - menuRect.width - 8
    if (newTop + menuRect.height > vh - 8) newTop = Math.max(8, newTop - menuRect.height - 8)
    if (newLeft < 8) newLeft = 8
    if (newTop < 8) newTop = 8

    menuStyle = `left: ${newLeft}px; top: ${newTop}px;`
  }

  function openMenu(pos?: { x: number; y: number }) {
    if (disabled) return
    explicitPos = pos ?? null
    open = true
    emit('mac-dropdown-open')
    requestAnimationFrame(() => {
      positionMenu()
    })
  }

  function close() {
    if (!open) return
    open = false
    explicitPos = null
    emit('mac-dropdown-close')
  }

  function toggle() {
    open ? close() : openMenu()
  }

  // ─── 事件处理 ───

  function handleTriggerClick(e: Event) {
    if (trigger === 'contextmenu') return
    e.preventDefault()
    toggle()
  }

  function handleContextMenu(e: MouseEvent) {
    if (trigger === 'click') return
    e.preventDefault()
    e.stopPropagation()
    openMenu({ x: e.clientX, y: e.clientY })
  }

  function handleMouseEnter() {
    if (!openOnHover) return
    if (hoverTimeout) clearTimeout(hoverTimeout)
    hoverTimeout = setTimeout(() => openMenu(), hoverDelay)
  }

  function handleMouseLeave() {
    if (!openOnHover) return
    if (hoverTimeout) clearTimeout(hoverTimeout)
    hoverTimeout = setTimeout(close, 200)
  }

  function handleMenuMouseEnter() {
    if (openOnHover && hoverTimeout) {
      clearTimeout(hoverTimeout)
      hoverTimeout = null
    }
  }

  function handleMenuMouseLeave() {
    if (openOnHover) {
      if (hoverTimeout) clearTimeout(hoverTimeout)
      hoverTimeout = setTimeout(close, 200)
    }
  }

  function selectItem(item: DropdownItem) {
    if (item.disabled) return
    if (item.children) return

    value = item.value
    close()
    emit('mac-dropdown-select', { value: item.value, item })
  }

  function handleDocumentClick(e: Event) {
    if (!open) return
    const target = e.target as Node
    if (root?.contains(target)) return
    close()
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape' && open) {
      e.preventDefault()
      close()
    }
  }

  // open 时挂载 document 级监听
  $effect(() => {
    if (!open) return
    document.addEventListener('mousedown', handleDocumentClick)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  })

  // items / placement 变化后重新定位
  $effect(() => {
    void items
    void placement
    if (open) {
      const raf = requestAnimationFrame(() => positionMenu())
      return () => cancelAnimationFrame(raf)
    }
  })

  // 卸载清理
  $effect(() => {
    return () => {
      if (hoverTimeout) clearTimeout(hoverTimeout)
    }
  })
</script>

<div
  bind:this={root}
  {...rest}
  class="mac-scope mac-dropdown"
  data-theme={resolvedTheme}
  data-disabled={disabled}
>
  <div class="dropdown" onmouseenter={handleMouseEnter} onmouseleave={handleMouseLeave}>
    <div
      bind:this={triggerEl}
      class="dropdown-trigger"
      onclick={handleTriggerClick}
      oncontextmenu={handleContextMenu}
      onmouseenter={handleMouseEnter}
      onmouseleave={handleMouseLeave}
    >
      {#if triggerSnippet}{@render triggerSnippet()}{/if}
    </div>
  </div>

  {#if open}
    <div
      bind:this={menuEl}
      class="mac-dropdown-portal open {menuPlacement.startsWith('top') ? 'animating-up' : ''}"
      role="menu"
      style={menuStyle}
      data-theme={resolvedTheme}
      onmouseenter={handleMenuMouseEnter}
      onmouseleave={handleMenuMouseLeave}
    >
      {#each items as item, i (i)}
        {#if item.divider}
          <div class="dropdown-divider"></div>
        {:else}
          <div
            class="dropdown-item {value === item.value ? 'active' : ''} {item.disabled
              ? 'disabled'
              : ''} {item.danger ? 'danger' : ''} {item.children && item.children.length > 0
              ? 'dropdown-submenu'
              : ''}"
            data-value={item.value}
            role="menuitem"
            aria-disabled={!!item.disabled}
            onclick={() => selectItem(item)}
          >
            {#if item.icon}
              <!-- eslint-disable-next-line svelte/no-at-html-tags -->
              <span class="dropdown-item-icon">{@html item.icon}</span>
            {/if}
            <span class="dropdown-item-label">
              <!-- eslint-disable-next-line svelte/no-at-html-tags -->
              {@html item.label}
            </span>
            {#if item.shortcut && !(item.children && item.children.length > 0)}
              <span class="dropdown-item-shortcut">{item.shortcut}</span>
            {/if}
            {#if item.children && item.children.length > 0}
              <span class="dropdown-item-arrow">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path
                    d="M4.5 2.5l3.5 3.5-3.5 3.5"
                    stroke="currentColor"
                    stroke-width="1.5"
                    fill="none"
                  />
                </svg>
              </span>
            {/if}
          </div>
        {/if}
      {/each}
    </div>
  {/if}
</div>

<style>
  .mac-dropdown {
    display: inline-block;
  }

  .dropdown {
    position: relative;
    display: inline-block;
  }

  .dropdown-trigger {
    display: inline-flex;
    cursor: pointer;
  }

  /* 主题变量（对应 Lit 版 portal 注入的 :root 变量） */
  .mac-dropdown {
    --md-dropdown-container-bg: rgba(255, 255, 255, 0.78);
    --md-dropdown-container-border: rgba(0, 0, 0, 0.04);
    --md-dropdown-container-shadow:
      0 0 0 1px rgba(0, 0, 0, 0.05),
      0 2px 4px rgba(0, 0, 0, 0.04),
      0 8px 16px rgba(0, 0, 0, 0.08),
      0 24px 48px rgba(0, 0, 0, 0.12);
    --md-dropdown-container-padding: 5px;

    --md-dropdown-item-padding: 6px 12px;
    --md-dropdown-item-gap: 10px;
    --md-dropdown-item-hover-bg: rgba(0, 122, 255, 0.12);
    --md-dropdown-item-active-bg: rgba(0, 122, 255, 0.9);
    --md-dropdown-item-active-hover-bg: rgba(0, 100, 200, 0.95);
    --md-dropdown-item-active-color: #ffffff;
    --md-dropdown-item-color: #1d1d1f;
    --md-dropdown-item-danger-color: #ff3b30;
    --md-dropdown-item-danger-hover-bg: rgba(255, 59, 48, 0.1);
    --md-dropdown-item-disabled-opacity: 0.35;

    --md-dropdown-shortcut-color: #86868b;
    --md-dropdown-arrow-color: #86868b;
    --md-dropdown-divider-color: rgba(0, 0, 0, 0.06);
    --md-dropdown-divider-margin: 5px 10px;

    --md-dropdown-container-dark-bg: rgba(30, 30, 30, 0.92);
    --md-dropdown-container-dark-border: rgba(255, 255, 255, 0.08);
    --md-dropdown-item-dark-hover-bg: rgba(255, 255, 255, 0.1);
    --md-dropdown-item-dark-active-bg: rgba(10, 132, 255, 0.95);
    --md-dropdown-item-dark-color: #f5f5f7;
    --md-dropdown-shortcut-dark-color: #98989d;
    --md-dropdown-divider-dark-color: rgba(255, 255, 255, 0.06);

    --md-mac-text-white-soft: rgba(255, 255, 255, 0.95);
  }

  .mac-dropdown-portal {
    position: fixed;
    min-width: 180px;
    max-width: 280px;
    padding: var(--md-dropdown-container-padding);
    background: var(--md-dropdown-container-bg);
    backdrop-filter: blur(var(--md-glass-blur)) saturate(var(--md-glass-saturate))
      brightness(var(--md-glass-brightness));
    -webkit-backdrop-filter: blur(var(--md-glass-blur)) saturate(var(--md-glass-saturate))
      brightness(var(--md-glass-brightness));
    border: 0.5px solid var(--md-dropdown-container-border);
    border-radius: var(--md-radius-menu);
    box-shadow: var(--md-dropdown-container-shadow);
    z-index: 99999;
    opacity: 0;
    transform: scale(0.95) translateY(-8px);
    pointer-events: none;
    transition:
      opacity var(--md-transition-menu),
      transform var(--md-transition-menu);
    animation: dropdown-show var(--md-transition-menu) forwards;
    font-family: var(--md-font-family);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  @keyframes dropdown-show {
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
      pointer-events: auto;
    }
  }

  .mac-dropdown-portal.animating-up {
    transform-origin: bottom left;
  }

  .mac-dropdown-portal :global(.dropdown-item) {
    display: flex;
    align-items: center;
    gap: var(--md-dropdown-item-gap);
    padding: var(--md-dropdown-item-padding);
    border-radius: var(--md-radius-sm);
    cursor: pointer;
    transition: background var(--md-transition-fast);
    user-select: none;
    white-space: nowrap;
    position: relative;
    font-size: var(--md-font-size-menu);
    font-weight: var(--md-font-weight-regular);
    line-height: 1.5;
    color: var(--md-dropdown-item-color);
    outline: none;
  }

  .mac-dropdown-portal :global(.dropdown-item:hover:not(.disabled)) {
    background: var(--md-dropdown-item-hover-bg);
  }

  .mac-dropdown-portal :global(.dropdown-item.active) {
    background: var(--md-dropdown-item-active-bg);
    color: var(--md-dropdown-item-active-color);
    font-weight: var(--md-font-weight-medium);
  }

  .mac-dropdown-portal :global(.dropdown-item.active:hover) {
    background: var(--md-dropdown-item-active-hover-bg);
  }

  .mac-dropdown-portal :global(.dropdown-item.disabled) {
    opacity: var(--md-dropdown-item-disabled-opacity);
    cursor: not-allowed;
    color: var(--md-dropdown-item-color);
  }

  .mac-dropdown-portal :global(.dropdown-item.danger) {
    color: var(--md-dropdown-item-danger-color);
  }

  .mac-dropdown-portal :global(.dropdown-item.danger:hover:not(.disabled)) {
    background: var(--md-dropdown-item-danger-hover-bg);
    color: var(--md-dropdown-item-danger-color);
  }

  .mac-dropdown-portal :global(.dropdown-item-icon) {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    font-size: 14px;
    flex-shrink: 0;
    opacity: 0.9;
  }

  .mac-dropdown-portal :global(.dropdown-item.active .dropdown-item-icon) {
    opacity: 1;
  }

  .mac-dropdown-portal :global(.dropdown-item-label) {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .mac-dropdown-portal :global(.dropdown-item-shortcut) {
    font-size: var(--md-font-size-xs);
    color: var(--md-dropdown-shortcut-color);
    margin-left: auto;
    padding-left: var(--md-spacing-lg);
    opacity: 0.7;
    font-weight: var(--md-font-weight-medium);
  }

  .mac-dropdown-portal :global(.dropdown-item.active .dropdown-item-shortcut) {
    color: var(--md-mac-text-white-soft);
    opacity: 0.9;
  }

  .mac-dropdown-portal :global(.dropdown-item-arrow) {
    display: flex;
    align-items: center;
    margin-left: auto;
    padding-left: var(--md-spacing-sm);
    color: var(--md-dropdown-arrow-color);
    opacity: 0.6;
    font-size: 12px;
  }

  .mac-dropdown-portal :global(.dropdown-divider) {
    height: 1px;
    background: var(--md-dropdown-divider-color);
    margin: var(--md-dropdown-divider-margin);
  }

  .mac-dropdown-portal[data-theme='dark'] {
    background: var(--md-dropdown-container-dark-bg);
    border-color: var(--md-dropdown-container-dark-border);
    box-shadow:
      0 0 0 1px rgba(255, 255, 255, 0.05),
      0 2px 4px rgba(0, 0, 0, 0.3),
      0 8px 16px rgba(0, 0, 0, 0.4),
      0 24px 48px rgba(0, 0, 0, 0.5);
  }

  .mac-dropdown-portal[data-theme='dark'] :global(.dropdown-item:hover:not(.disabled)) {
    background: var(--md-dropdown-item-dark-hover-bg);
  }

  .mac-dropdown-portal[data-theme='dark'] :global(.dropdown-item.active) {
    background: var(--md-dropdown-item-dark-active-bg);
    color: var(--md-dropdown-item-active-color);
  }

  .mac-dropdown-portal[data-theme='dark'] :global(.dropdown-item) {
    color: var(--md-dropdown-item-dark-color);
  }

  .mac-dropdown-portal[data-theme='dark'] :global(.dropdown-item-shortcut) {
    color: var(--md-dropdown-shortcut-dark-color);
  }

  .mac-dropdown-portal[data-theme='dark'] :global(.dropdown-divider) {
    background: var(--md-dropdown-divider-dark-color);
  }

  @media (max-width: 768px) {
    .mac-dropdown-portal {
      min-width: calc(100vw - 32px) !important;
      max-width: calc(100vw - 32px) !important;
      border-radius: 12px;
    }

    .mac-dropdown-portal :global(.dropdown-item) {
      padding: 12px 16px !important;
      font-size: var(--md-font-size-lg) !important;
      gap: var(--md-spacing-md);
    }

    .mac-dropdown-portal :global(.dropdown-item-icon) {
      width: 20px;
      height: 20px;
      font-size: 16px;
    }
  }
</style>
