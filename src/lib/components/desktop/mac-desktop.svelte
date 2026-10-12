<script lang="ts">
  import type { Snippet } from 'svelte'
  import {
    useMacConfig,
    resolveTheme,
    type MacTheme,
  } from '../../internal/config.svelte'
  import MacDesktopIcon from '../desktop-icon/mac-desktop-icon.svelte'

  /**
   * @tag mac-desktop
   * @summary 带有图标布局、拖拽管理和右键菜单的 macOS 风格桌面容器。
   *
   * @slot children - 用于放置 MacDesktopIcon 的默认内容。
   * @slot wallpaper - 自定义壁纸内容。
   * @slot dock - Dock 栏内容。
   *
   * @event mac-layout-change - 布局模式变化时触发。`detail: { layout }`
   * @event mac-icons-reorder - 图标重新排序时触发。`detail: { layout }`
   */

  export interface DesktopIconData {
    id: string
    label: string
    color?: string
    x?: number
    y?: number
    iconSrc?: string
  }

  interface Props {
    /** 布局模式。 */
    layout?: 'vertical' | 'horizontal'
    /** 网格单元大小，单位为像素。 */
    cellSize?: number
    /** 网格间距，单位为像素。 */
    spacing?: number
    /** 桌面边缘内边距。 */
    padding?: number
    /** 壁纸图片 URL。 */
    wallpaper?: string
    /** 是否显示 Dock 区域。 */
    showDock?: boolean
    /** 图标数据（Svelte 版推荐用法，替代 Lit 版的插槽方式）。 */
    icons?: DesktopIconData[]
    /** 组件级主题覆盖。 */
    theme?: MacTheme
    /** 图标内容（对应 Lit 版默认 slot）。 */
    children?: Snippet
    /** 自定义壁纸内容。 */
    wallpaperSnippet?: Snippet
    /** Dock 栏内容。 */
    dock?: Snippet
    /** 其余属性透传。 */
    [key: string]: unknown
  }

  let {
    layout = $bindable('vertical'),
    cellSize = 90,
    spacing = 8,
    padding = 16,
    wallpaper = '',
    showDock = true,
    icons = [],
    theme = undefined,
    children,
    wallpaperSnippet,
    dock,
    ...rest
  }: Props = $props()

  const config = useMacConfig()
  const resolvedTheme = $derived(resolveTheme(theme, config))

  let root: HTMLDivElement | undefined = $state()
  let iconsEl: HTMLDivElement | undefined = $state()
  let selectionRect: HTMLDivElement | undefined = $state()

  // 图标状态（位置 / 选中 / 拖拽），由桌面组件统一管理
  let iconStates = $state<{ id: string; x: number; y: number; selected: boolean; dragging: boolean }[]>([])
  let selectedIds = $state<Set<string>>(new Set())

  function emit(name: string, detail?: unknown) {
    root?.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }))
  }

  // icons 数据变化时初始化状态
  let initializedFor = ''
  $effect(() => {
    const key = icons.map((i) => i.id).join(',')
    if (key !== initializedFor) {
      initializedFor = key
      iconStates = icons.map((i) => ({
        id: i.id,
        x: i.x ?? 0,
        y: i.y ?? 0,
        selected: false,
        dragging: false,
      }))
      selectedIds = new Set()
    }
  })

  /** 根据当前布局模式排列图标。 */
  export function arrangeIcons(): void {
    if (iconStates.length === 0) return
    if (!iconsEl) return

    const desktopRect = iconsEl.getBoundingClientRect()
    if (!desktopRect || desktopRect.width === 0) return

    const { width, height } = desktopRect

    if (layout === 'vertical') {
      const maxPerCol = Math.max(1, Math.floor((height - padding * 2 + spacing) / (cellSize + spacing)))
      iconStates = iconStates.map((s, i) => {
        const col = Math.floor(i / maxPerCol)
        const row = i % maxPerCol
        return { ...s, x: padding + col * (cellSize + spacing), y: padding + row * (cellSize + spacing) }
      })
    } else {
      const maxPerRow = Math.max(1, Math.floor((width - padding * 2 + spacing) / (cellSize + spacing)))
      iconStates = iconStates.map((s, i) => {
        const row = Math.floor(i / maxPerRow)
        const col = i % maxPerRow
        return { ...s, x: padding + col * (cellSize + spacing), y: padding + row * (cellSize + spacing) }
      })
    }

    emit('mac-icons-reorder', { layout })
  }

  // 挂载与布局变化时排列
  $effect(() => {
    void layout
    const raf = requestAnimationFrame(() => arrangeIcons())
    return () => cancelAnimationFrame(raf)
  })

  // ─── 选择 ───

  function selectIcon(iconId: string, additive: boolean): void {
    if (!additive) {
      selectedIds = new Set([iconId])
    } else {
      selectedIds = new Set([...selectedIds, iconId])
    }
    applySelection()
  }

  function deselectAll(): void {
    selectedIds = new Set()
    applySelection()
  }

  function applySelection(): void {
    iconStates = iconStates.map((s) => ({ ...s, selected: selectedIds.has(s.id) }))
  }

  // ─── 选择框 ───

  let isSelecting = false
  let selStartX = 0
  let selStartY = 0

  function startSelection(clientX: number, clientY: number): void {
    if (!iconsEl || !selectionRect) return
    const rect = iconsEl.getBoundingClientRect()
    isSelecting = true
    selStartX = clientX - rect.left
    selStartY = clientY - rect.top
    selectionRect.classList.add('active')
    updateSelectionRect(selStartX, selStartY, 0, 0)
  }

  function updateSelectionRect(x: number, y: number, w: number, h: number): void {
    if (!selectionRect) return
    selectionRect.style.left = `${x}px`
    selectionRect.style.top = `${y}px`
    selectionRect.style.width = `${w}px`
    selectionRect.style.height = `${h}px`
  }

  function endSelection(): void {
    isSelecting = false
    selectionRect?.classList.remove('active')
  }

  function checkSelectionOverlap(sx: number, sy: number, sw: number, sh: number): void {
    if (!iconsEl) return
    const desktopRect = iconsEl.getBoundingClientRect()
    const next = new Set(selectedIds)
    iconStates.forEach((s, i) => {
      const iconEl = iconsEl?.querySelectorAll('.mac-desktop-icon')[i]
      if (!iconEl) return
      const iconRect = iconEl.getBoundingClientRect()
      const ix = iconRect.left - desktopRect.left
      const iy = iconRect.top - desktopRect.top
      const iw = iconRect.width
      const ih = iconRect.height

      const overlaps = ix < sx + sw && ix + iw > sx && iy < sy + sh && iy + ih > sy
      if (overlaps) {
        next.add(s.id)
      } else {
        next.delete(s.id)
      }
    })
    selectedIds = next
    applySelection()
  }

  // ─── 图标拖拽 ───

  let dragStartPos = new Map<string, { startX: number; startY: number }>()
  let dragPointerStartX = 0
  let dragPointerStartY = 0
  let hasDragMoved = false

  function startIconDrag(iconId: string, clientX: number, clientY: number): void {
    if (!selectedIds.has(iconId)) {
      selectIcon(iconId, false)
    }

    dragStartPos.clear()
    hasDragMoved = false
    dragPointerStartX = clientX
    dragPointerStartY = clientY

    iconStates.forEach((s) => {
      if (selectedIds.has(s.id)) {
        dragStartPos.set(s.id, { startX: s.x, startY: s.y })
      }
    })

    const onMove = (ev: MouseEvent | TouchEvent) => {
      ev.preventDefault()
      const cx = 'touches' in ev ? ev.touches[0]!.clientX : ev.clientX
      const cy = 'touches' in ev ? ev.touches[0]!.clientY : ev.clientY
      const dx = cx - dragPointerStartX
      const dy = cy - dragPointerStartY

      if (!hasDragMoved && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
        hasDragMoved = true
        iconStates = iconStates.map((s) =>
          dragStartPos.has(s.id) ? { ...s, dragging: true } : s,
        )
      }

      if (hasDragMoved) {
        iconStates = iconStates.map((s) => {
          const startPos = dragStartPos.get(s.id)
          if (!startPos) return s
          return { ...s, x: Math.max(0, startPos.startX + dx), y: Math.max(0, startPos.startY + dy) }
        })
      }
    }

    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', onUp)

      iconStates = iconStates.map((s) =>
        dragStartPos.has(s.id) ? { ...s, dragging: false } : s,
      )
      dragStartPos.clear()
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    document.addEventListener('touchmove', onMove, { passive: false })
    document.addEventListener('touchend', onUp)
  }

  // ─── 右键菜单 ───

  let contextMenuVisible = $state(false)
  let contextMenuStyle = $state('')

  function showContextMenu(x: number, y: number): void {
    if (!iconsEl) return
    const containerRect = iconsEl.getBoundingClientRect()
    contextMenuVisible = true

    // 边界检测（使用估算尺寸，与 Lit 版逻辑一致）
    const menuW = 220
    const menuH = 160
    const containerW = containerRect.width
    const containerH = containerRect.height

    if (x + menuW > containerW) {
      x = containerW - menuW - 4
    }
    if (x < 4) {
      x = 4
    }
    if (y + menuH > containerH) {
      y = y - menuH
    }
    if (y < 4) {
      y = 4
    }

    contextMenuStyle = `left: ${x}px; top: ${y}px;`
  }

  function hideContextMenu(): void {
    contextMenuVisible = false
  }

  // ─── 事件处理 ───

  function onDesktopMouseDown(e: MouseEvent): void {
    if (e.button !== 0) return

    // 通过事件路径查找图标元素
    const path = e.composedPath()
    const iconWrapper = path.find(
      (t) => t instanceof HTMLElement && t.classList?.contains('icon-wrapper'),
    ) as HTMLElement | undefined

    if (iconWrapper) {
      hideContextMenu()

      // 从 icon-wrapper 向上找 icon 索引
      const wrapperEls = iconsEl?.querySelectorAll('.icon-wrapper') ?? []
      const index = Array.from(wrapperEls).indexOf(iconWrapper)
      const state = iconStates[index]
      if (!state) return

      if (e.shiftKey) {
        const next = new Set(selectedIds)
        if (next.has(state.id)) {
          next.delete(state.id)
        } else {
          next.add(state.id)
        }
        selectedIds = next
        applySelection()
      } else if (!selectedIds.has(state.id)) {
        selectIcon(state.id, false)
      }

      startIconDrag(state.id, e.clientX, e.clientY)
    } else {
      hideContextMenu()
      deselectAll()
      startSelection(e.clientX, e.clientY)

      const onMove = (ev: MouseEvent) => {
        if (!isSelecting || !iconsEl) return
        const rect = iconsEl.getBoundingClientRect()
        const cx = ev.clientX - rect.left
        const cy = ev.clientY - rect.top

        const x = Math.min(selStartX, cx)
        const y = Math.min(selStartY, cy)
        const w = Math.abs(cx - selStartX)
        const h = Math.abs(cy - selStartY)

        updateSelectionRect(x, y, w, h)
        checkSelectionOverlap(x, y, w, h)
      }

      const onUp = () => {
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
        endSelection()
      }

      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    }
  }

  function onContextMenu(e: MouseEvent): void {
    e.preventDefault()
    if (!iconsEl) return
    const rect = iconsEl.getBoundingClientRect()
    showContextMenu(e.clientX - rect.left, e.clientY - rect.top)
  }

  // 右键菜单操作
  function onArrangeVertical(): void {
    layout = 'vertical'
    arrangeIcons()
    hideContextMenu()
    emit('mac-layout-change', { layout: 'vertical' })
  }

  function onArrangeHorizontal(): void {
    layout = 'horizontal'
    arrangeIcons()
    hideContextMenu()
    emit('mac-layout-change', { layout: 'horizontal' })
  }

  function onCleanUp(): void {
    arrangeIcons()
    hideContextMenu()
  }

  function onSelectAll(): void {
    selectedIds = new Set(iconStates.map((s) => s.id))
    applySelection()
    hideContextMenu()
  }

  // 点击外部关闭右键菜单
  $effect(() => {
    const handler = (e: MouseEvent): void => {
      if (!root?.contains(e.target as Node)) {
        hideContextMenu()
      }
    }
    document.addEventListener('click', handler)
    return () => {
      document.removeEventListener('click', handler)
    }
  })
</script>

<div
  bind:this={root}
  {...rest}
  class="mac-scope mac-desktop"
  data-theme={resolvedTheme}
  oncontextmenu={onContextMenu}
>
  <div class="desktop">
    <div class="desktop-wallpaper">
      {#if wallpaper}
        <img src={wallpaper} alt="" style="width:100%;height:100%;object-fit:cover;" />
      {:else if wallpaperSnippet}
        {@render wallpaperSnippet()}
      {/if}
    </div>

    <div bind:this={iconsEl} class="desktop-icons" onmousedown={onDesktopMouseDown}>
      {#if icons.length > 0}
        {#each iconStates as s (s.id)}
          {@const data = icons.find((i) => i.id === s.id)}
          <MacDesktopIcon
            label={data?.label ?? ''}
            iconId={s.id}
            color={data?.color}
            x={s.x}
            y={s.y}
            selected={s.selected}
            dragging={s.dragging}
          >
            {#if data?.iconSrc}
              <img src={data.iconSrc} alt={data.label} />
            {/if}
          </MacDesktopIcon>
        {/each}
      {:else if children}
        {@render children()}
      {/if}
    </div>

    {#if showDock}
      <div class="desktop-dock">
        {#if dock}{@render dock()}{/if}
      </div>
    {/if}

    <div bind:this={selectionRect} class="selection-rect"></div>

    {#if contextMenuVisible}
      <div class="context-menu visible" style={contextMenuStyle}>
        <div class="context-menu-item" onclick={onArrangeVertical}>按垂直方向排列</div>
        <div class="context-menu-item" onclick={onArrangeHorizontal}>按水平方向排列</div>
        <div class="context-menu-separator"></div>
        <div class="context-menu-item" onclick={onCleanUp}>整理图标</div>
        <div class="context-menu-separator"></div>
        <div class="context-menu-item" onclick={onSelectAll}>
          全选
          <span class="shortcut">⌘A</span>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .mac-desktop {
    display: block;
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .desktop {
    position: relative;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
    border-radius: var(--md-radius-lg);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .desktop-wallpaper {
    position: absolute;
    inset: 0;
    z-index: 0;
  }

  .desktop-wallpaper :global(*) {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .desktop-icons {
    position: relative;
    z-index: 1;
    flex: 1;
    width: 100%;
  }

  /* ─── Dock 区域 ─── */

  .desktop-dock {
    position: relative;
    z-index: 100;
    display: flex;
    justify-content: center;
    padding-bottom: var(--md-dock-dock-bottom);
    flex-shrink: 0;
  }

  /* ─── 选择框（液态玻璃） ─── */

  .selection-rect {
    position: absolute;
    border: 0.5px solid var(--md-mac-selection-rect-border);
    background: var(--md-mac-selection-rect-bg);
    backdrop-filter: blur(2px) saturate(120%);
    -webkit-backdrop-filter: blur(2px) saturate(120%);
    border-radius: var(--md-radius-sm);
    z-index: 50;
    pointer-events: none;
    display: none;
    box-shadow: inset 0 0 0 0.5px var(--md-mac-selection-rect-inner);
  }

  .selection-rect.active {
    display: block;
  }

  /* ─── 右键菜单（液态玻璃） ─── */

  .context-menu {
    position: absolute;
    z-index: 200;
    min-width: 220px;
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
    display: none;
    letter-spacing: -0.01em;
  }

  .context-menu.visible {
    display: block;
  }

  .context-menu-item {
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

  .context-menu-item:hover {
    background: var(--md-dock-item-hover-bg);
    color: var(--md-dock-item-hover-color);
    box-shadow: var(--md-dock-item-hover-shadow);
  }

  .context-menu-item :global(.shortcut),
  .context-menu-item .shortcut {
    font-size: var(--md-font-size-sm);
    opacity: var(--md-opacity-shortcut);
    font-family: var(--md-font-family);
  }

  .context-menu-item:hover .shortcut {
    opacity: var(--md-opacity-shortcut-hover);
    color: rgba(255, 255, 255, 0.85);
  }

  .context-menu-separator {
    height: var(--md-dock-separator-width);
    background: var(--md-dock-separator-color);
    margin: var(--md-dock-separator-margin);
  }
</style>
