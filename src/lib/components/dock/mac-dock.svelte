<script lang="ts">
  import type { Snippet } from 'svelte'
  import {
    useMacConfig,
    resolveTheme,
    type MacTheme,
  } from '../../internal/config.svelte'
  import MacDockItem from './mac-dock-item.svelte'

  /**
   * @tag mac-dock
   * @summary 带有液态玻璃背景、放大效果、右键菜单和拖拽移除功能的 macOS 风格 Dock。
   *
   * @slot children - 用于放置 MacDockItem 的默认内容。
   * @slot separator - 区域之间的自定义分隔符内容。
   *
   * @event mac-dock-item-click - 从 dock 项目转发。Detail: { itemId }
   * @event mac-dock-item-remove - 项目被移除时触发。Detail: { itemId }
   * @event mac-dock-item-reorder - 项目重新排序时触发。Detail: { itemId, targetItemId }
   */

  export interface DockItemData {
    id: string
    label: string
    color?: string
    iconSrc?: string
    running?: boolean
  }

  interface Props {
    /** 放大比例因子（1.0 = 不放大）。 */
    magnification?: number
    /** 基础图标大小，单位为像素。 */
    iconSize?: number
    /** 放大范围，单位为像素。 */
    magnifyRange?: number
    /** Dock 的位置。 */
    position?: 'bottom' | 'left' | 'right'
    /** 项目数据（Svelte 版推荐用法，替代 Lit 版的插槽方式）。 */
    items?: DockItemData[]
    /** 组件级主题覆盖。 */
    theme?: MacTheme
    /** 项目内容（对应 Lit 版默认 slot）。 */
    children?: Snippet
    /** 分隔符内容。 */
    separator?: Snippet
    /** 其余属性透传。 */
    [key: string]: unknown
  }

  let {
    magnification = 1.6,
    iconSize = 48,
    magnifyRange = 120,
    position = 'bottom',
    items = [],
    theme = undefined,
    children,
    separator,
    ...rest
  }: Props = $props()

  const config = useMacConfig()
  const resolvedTheme = $derived(resolveTheme(theme, config))

  let root: HTMLDivElement | undefined = $state()
  let dockItemsEl: HTMLDivElement | undefined = $state()

  function emit(name: string, detail?: unknown) {
    root?.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }))
  }

  // ─── 放大算法（高斯分布） ───

  function getItemEls(): HTMLElement[] {
    if (!dockItemsEl) return []
    return Array.from(dockItemsEl.querySelectorAll<HTMLElement>('.mac-dock-item'))
  }

  function applyMagnification(clientX: number, clientY: number): void {
    const els = getItemEls()
    if (els.length === 0) return

    const isHorizontal = position === 'bottom'
    const cursorPos = isHorizontal ? clientX : clientY

    els.forEach((item) => {
      const itemRect = item.getBoundingClientRect()
      const itemCenter = isHorizontal
        ? itemRect.left + itemRect.width / 2
        : itemRect.top + itemRect.height / 2

      const distance = Math.abs(cursorPos - itemCenter)
      const maxDist = magnifyRange

      let scale = 1
      if (distance < maxDist) {
        const ratio = distance / maxDist
        scale = 1 + (magnification - 1) * (0.5 + 0.5 * Math.cos(ratio * Math.PI))
      }

      item.style.transform = `scale(${scale})`
      item.style.transformOrigin = isHorizontal ? 'bottom center' : 'center left'

      // 放大时增加水平 margin，撑开图标间距
      const extraMargin = (scale - 1) * iconSize * 0.3
      if (isHorizontal) {
        item.style.marginLeft = `${extraMargin}px`
        item.style.marginRight = `${extraMargin}px`
      } else {
        item.style.marginTop = `${extraMargin}px`
        item.style.marginBottom = `${extraMargin}px`
      }
    })
  }

  function resetMagnification(): void {
    getItemEls().forEach((item) => {
      item.style.transform = 'scale(1)'
      item.style.marginLeft = ''
      item.style.marginRight = ''
      item.style.marginTop = ''
      item.style.marginBottom = ''
    })
  }

  let isHovering = false

  function onMouseMove(e: MouseEvent): void {
    if (!isHovering || dragState.isDragging) return
    applyMagnification(e.clientX, e.clientY)
  }

  function onMouseEnter(): void {
    isHovering = true
  }

  function onMouseLeave(): void {
    isHovering = false
    resetMagnification()
  }

  // ─── 右键菜单 ───

  let contextMenuVisible = $state(false)
  let contextMenuStyle = $state('')
  let contextMenuItemId: string | null = null

  function onDockContextMenu(e: MouseEvent): void {
    e.stopPropagation()
    e.preventDefault()
    const path = e.composedPath()
    const itemEl = path.find(
      (t) => t instanceof HTMLElement && t.classList?.contains('mac-dock-item'),
    ) as HTMLElement | undefined
    if (!itemEl) return

    const els = getItemEls()
    const index = els.indexOf(itemEl)
    contextMenuItemId = items[index]?.id ?? null
    let x = e.clientX
    let y = e.clientY

    contextMenuVisible = true

    // 边界检测（估算尺寸）
    const menuW = 200
    const menuH = 100

    if (x + menuW > window.innerWidth) {
      x = window.innerWidth - menuW - 4
    }
    if (x < 4) {
      x = 4
    }
    if (y + menuH > window.innerHeight) {
      y = y - menuH
    }
    if (y < 4) {
      y = 4
    }

    contextMenuStyle = `left: ${x}px; top: ${y}px;`
  }

  function hideContextMenu(): void {
    contextMenuVisible = false
    contextMenuItemId = null
  }

  function onContextMenuOpen(): void {
    // macOS "选项" 占位符
  }

  function onContextRemoveFromDock(): void {
    if (contextMenuItemId) {
      emit('mac-dock-item-remove', { itemId: contextMenuItemId })
    }
    hideContextMenu()
  }

  // 点击外部关闭菜单
  $effect(() => {
    if (!contextMenuVisible) return
    const handler = (e: MouseEvent): void => {
      if (!root?.contains(e.target as Node)) {
        hideContextMenu()
      }
    }
    document.addEventListener('click', handler, { once: true })
    return () => document.removeEventListener('click', handler)
  })

  // ─── 拖拽移除 / 排序 ───

  let dragState = $state<{ isDragging: boolean; dragId: string | null }>({
    isDragging: false,
    dragId: null,
  })
  let dragGhost: HTMLElement | null = null
  let dragStartX = 0
  let dragStartY = 0
  let dragOffsetX = 0
  let dragOffsetY = 0
  let hasDragMoved = false
  let lastMoveEvent: MouseEvent | null = null
  let dragItemIndex = -1

  function onDockMouseDown(e: MouseEvent): void {
    hideContextMenu()
    if (e.button !== 0) return

    const path = e.composedPath()
    const itemEl = path.find(
      (t) => t instanceof HTMLElement && t.classList?.contains('mac-dock-item'),
    ) as HTMLElement | undefined
    if (!itemEl) return

    // 阻止事件冒泡到 desktop 组件触发框选
    e.stopPropagation()

    const els = getItemEls()
    dragItemIndex = els.indexOf(itemEl)
    const dragId = items[dragItemIndex]?.id
    if (dragId === undefined) return

    dragStartX = e.clientX
    dragStartY = e.clientY
    hasDragMoved = false
    dragState = { isDragging: false, dragId }

    // 记录鼠标在图标内的偏移比例（0~1）
    const itemRect = itemEl.getBoundingClientRect()
    dragOffsetX = (e.clientX - itemRect.left) / itemRect.width
    dragOffsetY = (e.clientY - itemRect.top) / itemRect.height

    const onMove = (ev: MouseEvent) => {
      lastMoveEvent = ev
      const dx = ev.clientX - dragStartX
      const dy = ev.clientY - dragStartY

      if (!hasDragMoved && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        hasDragMoved = true
        dragState = { isDragging: true, dragId }
        resetMagnification()
        createDragGhost()
        itemEl.style.opacity = '0.3'
      }

      if (hasDragMoved && dragGhost) {
        const ghostSize = 48
        dragGhost.style.left = `${ev.clientX - ghostSize * dragOffsetX}px`
        dragGhost.style.top = `${ev.clientY - ghostSize * dragOffsetY}px`
      }
    }

    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)

      if (hasDragMoved && root) {
        const dockRect = root.getBoundingClientRect()
        const isOutsideDock = lastMoveEvent
          ? lastMoveEvent.clientX < dockRect.left ||
            lastMoveEvent.clientX > dockRect.right ||
            lastMoveEvent.clientY < dockRect.top - 20 ||
            lastMoveEvent.clientY > dockRect.bottom + 20
          : false

        if (isOutsideDock) {
          emit('mac-dock-item-remove', { itemId: dragId })
        } else {
          // 在 dock 内放下：还原透明度
          itemEl.style.opacity = '1'
        }
      }

      removeDragGhost()
      dragState = { isDragging: false, dragId: null }
      hasDragMoved = false
      lastMoveEvent = null
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  function createDragGhost(): void {
    removeDragGhost()
    const ghost = document.createElement('div')
    ghost.style.cssText = `
      position: fixed;
      z-index: 10000;
      pointer-events: none;
      width: 48px;
      height: 48px;
      border-radius: 12px;
      filter: drop-shadow(0 8px 24px rgba(0, 0, 0, 0.35));
      transition: none;
    `
    const item = items[dragItemIndex]
    if (item) {
      if (item.iconSrc) {
        const img = document.createElement('img')
        img.src = item.iconSrc
        img.style.cssText = 'width:48px;height:48px;object-fit:cover;border-radius:12px;'
        ghost.appendChild(img)
      } else {
        const clone = document.createElement('div')
        clone.style.cssText = `
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          color: #fff;
          font-weight: 600;
          background: ${item.color ?? '#007AFF'};
        `
        clone.textContent = item.label ? item.label.charAt(0).toUpperCase() : '?'
        ghost.appendChild(clone)
      }
    }
    document.body.appendChild(ghost)
    dragGhost = ghost
  }

  function removeDragGhost(): void {
    dragGhost?.remove()
    dragGhost = null
  }

  // 卸载时清理幽灵元素
  $effect(() => {
    return () => removeDragGhost()
  })
</script>

<div
  bind:this={root}
  {...rest}
  class="mac-scope mac-dock"
  data-theme={resolvedTheme}
  data-position={position}
  onmousedown={onDockMouseDown}
  oncontextmenu={onDockContextMenu}
>
  <div
    class="dock"
    onmousemove={onMouseMove}
    onmouseenter={onMouseEnter}
    onmouseleave={onMouseLeave}
  >
    <div class="dock-glass"></div>
    <div bind:this={dockItemsEl} class="dock-items">
      {#if items.length > 0}
        {#each items as item, i (item.id)}
          <MacDockItem
            itemId={item.id}
            label={item.label}
            color={item.color}
            running={item.running}
          />
          {#if separator && i < items.length - 1 && i === Math.floor(items.length / 2) - 1}
            {@render separator()}
          {/if}
        {/each}
      {:else if children}
        {@render children()}
      {/if}
    </div>

    <!-- 右键菜单 -->
    {#if contextMenuVisible}
      <div class="dock-context-menu visible" style={contextMenuStyle}>
        <div class="dock-context-menu-item" onclick={onContextMenuOpen}>选项</div>
        <div class="dock-context-menu-separator"></div>
        <div class="dock-context-menu-item danger" onclick={onContextRemoveFromDock}>
          从 Dock 中移除
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .mac-dock {
    display: flex;
    justify-content: center;
    position: relative;
    z-index: 100;
  }

  .dock {
    position: relative;
    display: flex;
    align-items: flex-end;
    padding: var(--md-dock-padding);
    border-radius: var(--md-radius-dock);
  }

  /* ─── 液态玻璃背景 ─── */

  .dock-glass {
    position: absolute;
    inset: 0;
    border-radius: var(--md-radius-dock);
    background: var(--md-glass-bg);
    backdrop-filter: blur(var(--md-glass-blur)) saturate(var(--md-glass-saturate));
    -webkit-backdrop-filter: blur(var(--md-glass-blur)) saturate(var(--md-glass-saturate));
    border: 0.5px solid var(--md-glass-border);
    box-shadow:
      var(--md-shadow-dock),
      inset 0 1px 0 var(--md-glass-highlight-top),
      inset 0 -0.5px 0 var(--md-glass-highlight-bottom);
    pointer-events: none;
    z-index: -1;
  }

  /* ─── 项目容器 ─── */

  .dock-items {
    display: flex;
    align-items: flex-end;
    gap: var(--md-dock-gap);
  }

  /* ─── 分隔符 ─── */

  .dock-items :global(.dock-separator) {
    width: var(--md-separator-width);
    height: var(--md-separator-height);
    background: var(--md-separator-color);
    margin: var(--md-separator-margin);
    align-self: center;
    border-radius: 1px;
    flex-shrink: 0;
  }

  /* ─── 右键菜单（液态玻璃） ─── */

  .dock-context-menu {
    position: fixed;
    z-index: 200;
    min-width: 200px;
    background: var(--md-glass-menu-bg);
    backdrop-filter: blur(var(--md-glass-blur)) saturate(var(--md-glass-saturate));
    -webkit-backdrop-filter: blur(var(--md-glass-blur)) saturate(var(--md-glass-saturate));
    border-radius: var(--md-dock-container-radius);
    padding: var(--md-dock-container-padding);
    box-shadow:
      var(--md-shadow-menu),
      inset 0 0 0 0.5px var(--md-glass-menu-border),
      inset 0 1px 0 var(--md-glass-menu-highlight);
    font-family: var(--md-font-family);
    font-size: var(--md-font-size-menu);
    color: var(--md-mac-text-primary);
    letter-spacing: -0.01em;
  }

  .dock-context-menu-item {
    padding: var(--md-spacing-xs) 14px;
    cursor: default;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--md-dock-container-gap);
    border-radius: var(--md-dock-container-radius);
    margin: 0 var(--md-spacing-xs);
    transition:
      background-color var(--md-transition-menu),
      color var(--md-transition-menu);
  }

  .dock-context-menu-item:hover {
    background: var(--md-dock-item-hover-bg);
    color: var(--md-dock-item-hover-color);
    box-shadow: var(--md-dock-item-hover-shadow);
  }

  .dock-context-menu-item.danger:hover {
    background: var(--md-dock-item-danger-bg);
    box-shadow: var(--md-dock-item-danger-shadow);
  }

  .dock-context-menu-separator {
    height: var(--md-dock-separator-width);
    background: var(--md-dock-separator-color);
    margin: var(--md-dock-separator-margin);
  }
</style>
