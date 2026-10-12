<script lang="ts">
  import type { Snippet } from 'svelte'
  import {
    useMacConfig,
    resolveTheme,
    type MacTheme,
  } from '../../internal/config.svelte'

  /**
   * @tag mac-modal
   * @summary macOS 风格的模态框/窗口，支持标题栏、拖拽和调整大小。
   *
   * @slot children - 模态框内容区。
   * @slot footer - 自定义底部内容。
   *
   * @event mac-modal-close - 点击关闭按钮时触发。
   * @event mac-modal-minimize - 点击最小化按钮时触发。
   * @event mac-modal-maximize - 点击最大化/全屏按钮时触发。
   * @event mac-modal-move - 模态框移动时触发。Detail: { x, y }
   * @event mac-modal-resize - 模态框调整大小时触发。Detail: { width, height }
   * @event mac-modal-focus - 标题栏按下（聚焦）时触发。
   * @event mac-modal-ok - 点击默认确认按钮时触发。
   * @event mac-modal-cancel - 点击默认取消按钮时触发。
   */

  interface Props {
    /** 模态框标题。 */
    title?: string
    /** 模态框标题文本对齐方式。 */
    titleAlign?: 'left' | 'center' | 'right'
    /** 模态框左侧位置。 */
    x?: number
    /** 模态框顶部位置。 */
    y?: number
    /** 模态框宽度。 */
    width?: number
    /** 模态框高度。 */
    height?: number
    /** 模态框是否激活（聚焦）。 */
    active?: boolean
    /** 模态框是否可拖拽。 */
    draggable?: boolean
    /** 模态框是否可调整大小。 */
    resizable?: boolean
    /** 是否显示红绿灯按钮。 */
    showButtons?: boolean
    /** 是否显示底部区域。 */
    showFooter?: boolean
    /** 调整大小时的最小宽度。 */
    minWidth?: number
    /** 调整大小时的最小高度。 */
    minHeight?: number
    /** 模态框是否最小化。 */
    minimized?: boolean
    /** 模态框是否最大化。 */
    maximized?: boolean
    /** 组件级主题覆盖。 */
    theme?: MacTheme
    /** 模态框内容区（对应 Lit 版默认 slot）。 */
    children?: Snippet
    /** 自定义底部内容。 */
    footer?: Snippet
    /** 其余属性透传。 */
    [key: string]: unknown
  }

  let {
    title = '',
    titleAlign = 'center',
    x = $bindable(100),
    y = $bindable(100),
    width = $bindable(480),
    height = $bindable(360),
    active = true,
    draggable = true,
    resizable = true,
    showButtons = true,
    showFooter = true,
    minWidth = 280,
    minHeight = 160,
    minimized = $bindable(false),
    maximized = $bindable(false),
    theme = undefined,
    children,
    footer,
    ...rest
  }: Props = $props()

  const config = useMacConfig()
  const resolvedTheme = $derived(resolveTheme(theme, config))

  let root: HTMLDivElement | undefined = $state()

  function emit(name: string, detail?: unknown) {
    root?.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }))
  }

  // 最小化/最大化恢复时保存的状态
  let prevX = 100
  let prevY = 100
  let prevWidth = 480
  let prevHeight = 360

  // 最大化时跟随窗口尺寸
  $effect(() => {
    const onWindowResize = () => {
      if (maximized) {
        width = window.innerWidth
        height = window.innerHeight
      }
    }
    window.addEventListener('resize', onWindowResize)
    return () => window.removeEventListener('resize', onWindowResize)
  })

  // ─── 拖拽 ───

  let isDragging = false
  let dragStartX = 0
  let dragStartY = 0
  let dragOffsetX = 0
  let dragOffsetY = 0

  function onTitleBarMouseDown(e: MouseEvent): void {
    if (!draggable || e.button !== 0 || maximized) return
    // 忽略红绿灯按钮上的点击
    if ((e.target as HTMLElement).closest('.traffic-light')) return

    e.preventDefault()
    isDragging = true
    dragStartX = e.clientX
    dragStartY = e.clientY
    dragOffsetX = x
    dragOffsetY = y

    emit('mac-modal-focus')

    const onMove = (ev: MouseEvent) => {
      if (!isDragging) return
      const dx = ev.clientX - dragStartX
      const dy = ev.clientY - dragStartY
      x = dragOffsetX + dx
      y = dragOffsetY + dy
      emit('mac-modal-move', { x, y })
    }

    const onUp = () => {
      isDragging = false
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  // ─── 调整大小 ───

  let isResizing = false
  let resizeDir = ''
  let resizeStartX = 0
  let resizeStartY = 0
  let resizeStartW = 0
  let resizeStartH = 0
  let resizeStartLeft = 0
  let resizeStartTop = 0

  function onResizeMouseDown(dir: string, e: MouseEvent): void {
    if (!resizable || e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()

    isResizing = true
    resizeDir = dir
    resizeStartX = e.clientX
    resizeStartY = e.clientY
    resizeStartW = width
    resizeStartH = height
    resizeStartLeft = x
    resizeStartTop = y

    const onMove = (ev: MouseEvent) => {
      if (!isResizing) return
      const dx = ev.clientX - resizeStartX
      const dy = ev.clientY - resizeStartY
      const d = resizeDir

      let newW = resizeStartW
      let newH = resizeStartH
      let newX = resizeStartLeft
      let newY = resizeStartTop

      // 水平方向
      if (d.includes('e')) {
        newW = Math.max(minWidth, resizeStartW + dx)
      }
      if (d.includes('w')) {
        const proposedW = resizeStartW - dx
        if (proposedW >= minWidth) {
          newW = proposedW
          newX = resizeStartLeft + dx
        } else {
          newW = minWidth
          newX = resizeStartLeft + (resizeStartW - minWidth)
        }
      }

      // 垂直方向
      if (d.includes('s')) {
        newH = Math.max(minHeight, resizeStartH + dy)
      }
      if (d.includes('n')) {
        const proposedH = resizeStartH - dy
        if (proposedH >= minHeight) {
          newH = proposedH
          newY = resizeStartTop + dy
        } else {
          newH = minHeight
          newY = resizeStartTop + (resizeStartH - minHeight)
        }
      }

      width = newW
      height = newH
      x = newX
      y = newY
      emit('mac-modal-resize', { width, height })
    }

    const onUp = () => {
      isResizing = false
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  // ─── 红绿灯按钮 ───

  function onClose(): void {
    emit('mac-modal-close')
  }

  function onMinimize(): void {
    if (minimized) {
      minimized = false
      width = prevWidth
      height = prevHeight
      x = prevX
      y = prevY
    } else {
      if (!maximized) {
        prevWidth = width
        prevHeight = height
        prevX = x
        prevY = y
      }
      maximized = false
      minimized = true
      height = 38
    }
    emit('mac-modal-minimize')
  }

  function onMaximize(): void {
    if (maximized) {
      maximized = false
      width = prevWidth
      height = prevHeight
      x = prevX
      y = prevY
    } else {
      if (!minimized) {
        prevWidth = width
        prevHeight = height
        prevX = x
        prevY = y
      }
      minimized = false
      maximized = true
      x = 0
      y = 0
      width = window.innerWidth
      height = window.innerHeight
    }
    emit('mac-modal-maximize')
  }

  function onCancel(): void {
    emit('mac-modal-cancel')
  }

  function onOk(): void {
    emit('mac-modal-ok')
  }
</script>

<div
  bind:this={root}
  {...rest}
  class="mac-scope mac-modal"
  class:active
  class:minimized
  class:maximized
  style="position: fixed; left: {x}px; top: {y}px; width: {width}px; height: {height}px; --md-modal-title-align: {titleAlign};"
  data-theme={resolvedTheme}
>
  <div class="modal">
    <div class="titlebar" onmousedown={onTitleBarMouseDown}>
      {#if showButtons}
        <div class="traffic-lights">
          <div class="traffic-light traffic-light--close" onclick={onClose} title="关闭">
            <svg viewBox="0 0 12 12">
              <line
                x1="3"
                y1="3"
                x2="9"
                y2="9"
                stroke="var(--md-modal-traffic-close-stroke)"
                stroke-width="1.2"
              />
              <line
                x1="9"
                y1="3"
                x2="3"
                y2="9"
                stroke="var(--md-modal-traffic-close-stroke)"
                stroke-width="1.2"
              />
            </svg>
          </div>
          <div
            class="traffic-light traffic-light--minimize"
            onclick={onMinimize}
            title={minimized ? '恢复' : '最小化'}
          >
            <svg viewBox="0 0 12 12">
              <line
                x1="3"
                y1="6"
                x2="9"
                y2="6"
                stroke="var(--md-modal-traffic-minimize-stroke)"
                stroke-width="1.2"
              />
            </svg>
          </div>
          <div
            class="traffic-light traffic-light--maximize"
            onclick={onMaximize}
            title={maximized ? '恢复' : '全屏'}
          >
            {#if maximized}
              <svg viewBox="0 0 12 12">
                <polyline
                  points="7.5,2 10,2 10,4.5"
                  fill="none"
                  stroke="var(--md-modal-traffic-maximize-stroke)"
                  stroke-width="1.2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <polyline
                  points="4.5,10 2,10 2,7.5"
                  fill="none"
                  stroke="var(--md-modal-traffic-maximize-stroke)"
                  stroke-width="1.2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            {:else}
              <svg viewBox="0 0 12 12">
                <polyline
                  points="4.5,2 2,2 2,4.5"
                  fill="none"
                  stroke="var(--md-modal-traffic-maximize-stroke)"
                  stroke-width="1.2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <polyline
                  points="7.5,10 10,10 10,7.5"
                  fill="none"
                  stroke="var(--md-modal-traffic-maximize-stroke)"
                  stroke-width="1.2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            {/if}
          </div>
        </div>
      {/if}
      <div class="title">{title}</div>
      {#if showButtons}<div class="titlebar-spacer"></div>{/if}
    </div>

    <div class="body">
      {#if children}{@render children()}{/if}
    </div>

    {#if showFooter}
      <div class="footer">
        {#if footer}
          {@render footer()}
        {:else}
          <div class="footer-actions">
            <button class="footer-btn footer-btn--cancel" onclick={onCancel}>取消</button>
            <button class="footer-btn footer-btn--ok" onclick={onOk}>确认</button>
          </div>
        {/if}
      </div>
    {/if}

    {#if resizable && !maximized}
      <div class="resize-n" onmousedown={(e) => onResizeMouseDown('n', e)}></div>
      <div class="resize-s" onmousedown={(e) => onResizeMouseDown('s', e)}></div>
      <div class="resize-e" onmousedown={(e) => onResizeMouseDown('e', e)}></div>
      <div class="resize-w" onmousedown={(e) => onResizeMouseDown('w', e)}></div>
      <div class="resize-ne" onmousedown={(e) => onResizeMouseDown('ne', e)}></div>
      <div class="resize-nw" onmousedown={(e) => onResizeMouseDown('nw', e)}></div>
      <div class="resize-se" onmousedown={(e) => onResizeMouseDown('se', e)}></div>
      <div class="resize-sw" onmousedown={(e) => onResizeMouseDown('sw', e)}></div>
      <div class="resize-handle" onmousedown={(e) => onResizeMouseDown('se', e)}></div>
    {/if}
  </div>
</div>

<style>
  .mac-modal {
    min-width: var(--md-modal-min-width);
    min-height: var(--md-modal-min-height);
    border-radius: var(--md-modal-container-radius);
    overflow: hidden;
    box-shadow: var(--md-modal-container-shadow);
    font-family: var(--md-font-family);
  }

  .modal {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background: var(--md-modal-container-bg);
    backdrop-filter: blur(var(--md-glass-blur)) saturate(var(--md-glass-saturate));
    -webkit-backdrop-filter: blur(var(--md-glass-blur)) saturate(var(--md-glass-saturate));
    border-radius: var(--md-modal-container-radius);
    overflow: hidden;
  }

  /* ─── 标题栏 ─── */

  .titlebar {
    display: flex;
    align-items: center;
    height: var(--md-modal-header-height);
    padding: var(--md-modal-header-padding);
    background: var(--md-modal-header-bg);
    border-bottom: 0.5px solid var(--md-modal-header-border);
    cursor: default;
    user-select: none;
    -webkit-user-select: none;
    flex-shrink: 0;
  }

  .traffic-lights {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-right: var(--md-spacing-md);
  }

  .traffic-light {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: filter var(--md-transition-fast);
    border: 0.5px solid var(--md-modal-traffic-border);
  }

  .traffic-light:hover {
    filter: brightness(0.85);
  }

  .traffic-light :global(svg),
  .traffic-light svg {
    width: 8px;
    height: 8px;
    opacity: 0;
    transition: opacity var(--md-transition-fast);
  }

  .titlebar:hover .traffic-light svg {
    opacity: 1;
  }

  .traffic-light--close {
    background: var(--md-modal-traffic-close-bg);
  }

  .traffic-light--minimize {
    background: var(--md-modal-traffic-minimize-bg);
  }

  .traffic-light--maximize {
    background: var(--md-modal-traffic-maximize-bg);
  }

  .title {
    flex: 1;
    text-align: var(--md-modal-title-align);
    font-size: var(--md-modal-title-font-size);
    font-weight: 500;
    color: var(--md-modal-title-color);
    letter-spacing: -0.01em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .titlebar-spacer {
    width: 54px;
    flex-shrink: 0;
  }

  /* ─── 内容区 ─── */

  .body {
    flex: 1;
    overflow: auto;
    padding: var(--md-modal-body-padding);
    color: var(--md-modal-title-color);
    font-size: var(--md-modal-body-font-size);
    line-height: 1.5;
  }

  /* ─── 底部 ─── */

  .footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: var(--md-modal-footer-padding);
    background: var(--md-modal-footer-bg);
    border-top: 0.5px solid var(--md-modal-footer-border);
    font-size: var(--md-modal-footer-font-size);
    color: var(--md-modal-footer-color);
    flex-shrink: 0;
    gap: var(--md-modal-footer-btn-gap);
  }

  .footer-actions {
    display: flex;
    align-items: center;
    gap: var(--md-modal-footer-btn-gap);
  }

  .footer-btn {
    padding: var(--md-modal-footer-btn-padding);
    border-radius: var(--md-modal-footer-btn-radius);
    font-size: var(--md-modal-footer-btn-font-size);
    font-family: inherit;
    cursor: pointer;
    transition: background var(--md-transition-fast);
    border: none;
    outline: none;
  }

  .footer-btn--cancel {
    background: var(--md-modal-footer-cancel-bg);
    border: 0.5px solid var(--md-modal-footer-cancel-border);
    color: var(--md-modal-footer-cancel-color);
  }

  .footer-btn--cancel:hover {
    background: var(--md-modal-footer-cancel-hover-bg);
  }

  .footer-btn--ok {
    background: var(--md-modal-footer-ok-bg);
    color: var(--md-modal-footer-ok-color);
  }

  .footer-btn--ok:hover {
    background: var(--md-modal-footer-ok-hover-bg);
  }

  /* ─── 调整大小手柄 ─── */

  .resize-handle {
    position: absolute;
    right: 0;
    bottom: 0;
    width: 16px;
    height: 16px;
    cursor: nwse-resize;
    z-index: 10;
  }

  .resize-handle::after {
    content: '';
    position: absolute;
    right: 4px;
    bottom: 4px;
    width: 8px;
    height: 8px;
    border-right: 2px solid var(--md-modal-resize-border);
    border-bottom: 2px solid var(--md-modal-resize-border);
  }

  .resize-n {
    position: absolute;
    top: 0;
    left: 8px;
    right: 8px;
    height: 4px;
    cursor: ns-resize;
  }

  .resize-s {
    position: absolute;
    bottom: 0;
    left: 8px;
    right: 8px;
    height: 4px;
    cursor: ns-resize;
  }

  .resize-e {
    position: absolute;
    top: 8px;
    right: 0;
    bottom: 8px;
    width: 4px;
    cursor: ew-resize;
  }

  .resize-w {
    position: absolute;
    top: 8px;
    left: 0;
    bottom: 8px;
    width: 4px;
    cursor: ew-resize;
  }

  .resize-ne {
    position: absolute;
    top: 0;
    right: 0;
    width: 8px;
    height: 8px;
    cursor: nesw-resize;
  }

  .resize-nw {
    position: absolute;
    top: 0;
    left: 0;
    width: 8px;
    height: 8px;
    cursor: nwse-resize;
  }

  .resize-se {
    position: absolute;
    right: 0;
    bottom: 0;
    width: 16px;
    height: 16px;
    cursor: nwse-resize;
  }

  .resize-sw {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 8px;
    height: 8px;
    cursor: nesw-resize;
  }

  /* ─── 最小化 ─── */

  .mac-modal.minimized .body,
  .mac-modal.minimized .footer {
    display: none;
  }

  /* ─── 最大化 ─── */

  .mac-modal.maximized {
    border-radius: 0;
  }

  .mac-modal.maximized .modal {
    border-radius: 0;
  }

  /* ─── 非激活状态 ─── */

  .mac-modal:not(.active) .titlebar {
    background: rgba(255, 255, 255, 0.03);
  }

  .mac-modal:not(.active) .traffic-light {
    background: var(--md-modal-traffic-inactive-bg) !important;
  }

  .mac-modal:not(.active) .traffic-light svg {
    opacity: 0 !important;
  }

  .mac-modal:not(.active) .title {
    color: var(--md-modal-title-inactive-color);
  }

  /* ─── 深色模式 ─── */

  .mac-modal[data-theme='dark'] {
    box-shadow: var(--md-modal-container-dark-shadow);
  }

  .mac-modal[data-theme='dark'] .modal {
    background: var(--md-modal-container-dark-bg);
  }

  .mac-modal[data-theme='dark'] .titlebar {
    background: var(--md-modal-header-dark-bg);
    border-bottom-color: var(--md-modal-header-dark-border);
  }

  .mac-modal[data-theme='dark'] .title {
    color: var(--md-modal-title-dark-color);
  }

  .mac-modal[data-theme='dark'] .body {
    color: var(--md-modal-body-dark-color);
  }

  .mac-modal[data-theme='dark'] .footer {
    background: var(--md-modal-footer-dark-bg);
    border-top-color: var(--md-modal-footer-dark-border);
    color: var(--md-modal-footer-dark-color);
  }

  .mac-modal[data-theme='dark'] .footer-btn--cancel {
    background: var(--md-modal-footer-cancel-dark-bg);
    border-color: var(--md-modal-footer-cancel-dark-border);
    color: var(--md-modal-footer-cancel-dark-color);
  }

  .mac-modal[data-theme='dark'] .footer-btn--cancel:hover {
    background: var(--md-modal-footer-cancel-dark-hover-bg);
  }

  .mac-modal[data-theme='dark'] .footer-btn--ok:hover {
    background: var(--md-modal-footer-ok-dark-hover-bg);
  }

  .mac-modal[data-theme='dark']:not(.active) .titlebar {
    background: rgba(255, 255, 255, 0.02);
  }

  .mac-modal[data-theme='dark']:not(.active) .title {
    color: var(--md-modal-title-dark-inactive-color);
  }

  .mac-modal[data-theme='dark'] .resize-handle::after {
    border-right-color: var(--md-modal-resize-dark-border);
    border-bottom-color: var(--md-modal-resize-dark-border);
  }

  /* ─── 浅色模式 ─── */

  .mac-modal[data-theme='light'] .titlebar {
    background: var(--md-modal-header-bg);
    border-bottom-color: var(--md-modal-header-border);
  }

  .mac-modal[data-theme='light'] .title {
    color: var(--md-modal-title-color);
  }

  .mac-modal[data-theme='light'] .body {
    color: var(--md-modal-title-color);
  }

  .mac-modal[data-theme='light']:not(.active) .titlebar {
    background: rgba(255, 255, 255, 0.03);
  }

  .mac-modal[data-theme='light']:not(.active) .title {
    color: var(--md-modal-title-inactive-color);
  }

  .mac-modal[data-theme='light'] .resize-handle::after {
    border-right-color: var(--md-modal-resize-border);
    border-bottom-color: var(--md-modal-resize-border);
  }

  /* ─── 响应式：移动端全屏化 ─── */
  @media (max-width: 768px) {
    .mac-modal {
      top: var(--md-safe-area-top, 0px);
      left: var(--md-safe-area-left, 0px);
      right: var(--md-safe-area-right, 0px);
      bottom: var(--md-safe-area-bottom, 0px);
      width: auto;
      max-width: 100%;
      max-height: 100%;
      border-radius: 0;
    }

    .mac-modal .modal {
      border-radius: 0;
    }

    .resize-handle,
    .resize-n,
    .resize-s,
    .resize-e,
    .resize-w,
    .resize-ne,
    .resize-nw,
    .resize-se,
    .resize-sw {
      display: none;
    }

    .traffic-lights {
      gap: 10px;
    }

    .traffic-light {
      width: 14px;
      height: 14px;
    }

    .traffic-light svg {
      width: 9px;
      height: 9px;
    }

    .titlebar-spacer {
      width: 64px;
    }

    .footer {
      padding-top: var(--md-spacing-sm);
      padding-bottom: var(--md-spacing-sm);
    }

    .footer-btn {
      min-height: 40px;
    }
  }
</style>
