<script lang="ts">
  import type { Snippet } from 'svelte'
  import {
    useMacConfig,
    resolveTheme,
    type MacTheme,
  } from '../../internal/config.svelte'

  /**
   * @tag mac-drawer
   * @summary 一个 macOS 风格的抽屉组件，从视口边缘滑入。
   *
   * @slot children - 抽屉内容。
   * @slot footer - 底部内容（例如操作按钮）。
   *
   * @event mac-drawer-open - 抽屉打开后触发。
   * @event mac-drawer-close - 抽屉关闭后触发。
   * @event mac-drawer-after-open - 打开动画完成后触发。
   * @event mac-drawer-after-close - 关闭动画完成后触发。
   */

  interface Props {
    /** 抽屉是否打开。 */
    open?: boolean
    /** 抽屉放置方向。 */
    placement?: 'top' | 'right' | 'bottom' | 'left'
    /** 抽屉标题。 */
    title?: string
    /** 抽屉宽度（用于左/右放置）。 */
    width?: string
    /** 抽屉高度（用于上/下放置）。 */
    height?: string
    /** 是否显示关闭按钮。 */
    closable?: boolean
    /** 点击遮罩是否关闭抽屉。 */
    maskClosable?: boolean
    /** 是否显示遮罩层。 */
    showMask?: boolean | 'transparent'
    /** 按 ESC 键是否关闭抽屉。 */
    closeOnEsc?: boolean
    /** 抽屉是否可调整大小。 */
    resizable?: boolean
    /** 调整大小时的最小宽度（左/右）。 */
    minWidth?: string
    /** 调整大小时的最大宽度（左/右）。 */
    maxWidth?: string
    /** 调整大小时的最小高度（上/下）。 */
    minHeight?: string
    /** 调整大小时的最大高度（上/下）。 */
    maxHeight?: string
    /** 组件级主题覆盖。 */
    theme?: MacTheme
    /** 抽屉内容（对应 Lit 版默认 slot）。 */
    children?: Snippet
    /** 底部内容。 */
    footer?: Snippet
    /** 其余属性透传。 */
    [key: string]: unknown
  }

  let {
    open = $bindable(false),
    placement = 'right',
    title = '',
    width = '360px',
    height = '360px',
    closable = true,
    maskClosable = true,
    showMask = true,
    closeOnEsc = true,
    resizable = false,
    minWidth = '200px',
    maxWidth = '80vw',
    minHeight = '200px',
    maxHeight = '80vh',
    theme = undefined,
    children,
    footer,
    ...rest
  }: Props = $props()

  const config = useMacConfig()
  const resolvedTheme = $derived(resolveTheme(theme, config))

  let root: HTMLDivElement | undefined = $state()
  let panelEl: HTMLDivElement | undefined = $state()

  function emit(name: string, detail?: unknown) {
    root?.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }))
  }

  let currentSize = $state(width)

  function close(): void {
    open = false
  }

  function handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape' && closeOnEsc && open) {
      e.preventDefault()
      close()
    }
  }

  // 打开/关闭状态机（与 Lit 版 _show/_hide 时序一致）
  // isRendered：面板是否挂载；isVisible：是否加入 open/visible 过渡类
  let isRendered = $state(false)
  let isVisible = $state(false)
  // 非响应式标记，避免 effect 因自身写入而重跑
  let opened = false
  let pendingTimers: ReturnType<typeof setTimeout>[] = []

  $effect(() => {
    const o = open
    if (o && !opened) {
      opened = true
      isRendered = true
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
      emit('mac-drawer-open')
      // 下一帧加入 open/visible 类以触发过渡动画
      requestAnimationFrame(() => {
        isVisible = true
      })
      pendingTimers.push(setTimeout(() => emit('mac-drawer-after-open'), 300))
    } else if (!o && opened) {
      opened = false
      isVisible = false
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
      emit('mac-drawer-close')
      pendingTimers.push(
        setTimeout(() => {
          isRendered = false
          emit('mac-drawer-after-close')
        }, 300),
      )
    }
  })

  // 组件卸载时恢复 body overflow 与清理定时器
  $effect(() => {
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
      pendingTimers.forEach(clearTimeout)
    }
  })

  // 组件卸载时恢复 body overflow
  $effect(() => {
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
    }
  })

  // ─── 调整大小 ───

  function onResizeStart(e: MouseEvent): void {
    if (e.button !== 0) return
    e.preventDefault()

    const startX = e.clientX
    const startY = e.clientY
    const panel = panelEl
    if (!panel) return

    const startSize =
      placement === 'left' || placement === 'right' ? panel.offsetWidth : panel.offsetHeight

    const minPx = parseInt(minWidth) || parseInt(minHeight) || 200
    const maxPx =
      parseInt(
        placement === 'left' || placement === 'right' ? maxWidth : maxHeight.replace('vh', 'vh'),
      ) || 9999

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY

      if (placement === 'right') {
        const newWidth = Math.max(minPx, Math.min(maxPx, startSize - dx))
        currentSize = `${newWidth}px`
        panel.style.width = `${newWidth}px`
      } else if (placement === 'left') {
        const newWidth = Math.max(minPx, Math.min(maxPx, startSize + dx))
        currentSize = `${newWidth}px`
        panel.style.width = `${newWidth}px`
      } else if (placement === 'bottom') {
        const newHeight = Math.max(minPx, Math.min(maxPx, startSize - dy))
        currentSize = `${newHeight}px`
        panel.style.height = `${newHeight}px`
      } else if (placement === 'top') {
        const newHeight = Math.max(minPx, Math.min(maxPx, startSize + dy))
        currentSize = `${newHeight}px`
        panel.style.height = `${newHeight}px`
      }
    }

    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }
</script>

<div bind:this={root} {...rest} class="mac-scope mac-drawer" data-theme={resolvedTheme}>
  {#if isRendered}
    {#if showMask !== false}
      <div
        class="mask {isVisible ? 'visible' : ''} {showMask === 'transparent' ? 'transparent' : ''}"
        onclick={() => {
          if (maskClosable) close()
        }}
      ></div>
    {/if}
    <div
      bind:this={panelEl}
      class="panel {placement} {isVisible ? 'open' : ''}"
      style:width={placement === 'left' || placement === 'right' ? currentSize : undefined}
      style:height={placement === 'top' || placement === 'bottom' ? currentSize : undefined}
    >
      <div class="header">
        <div class="title">{title}</div>
        {#if closable}
          <button class="close-btn" onclick={close} aria-label="Close">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        {/if}
      </div>
      <div class="body">
        {#if children}{@render children()}{/if}
      </div>
      {#if footer}
        <div class="footer">{@render footer()}</div>
      {/if}
      {#if resizable}
        <div class="resize-handle {placement}" onmousedown={onResizeStart}></div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .mac-drawer {
    display: block;
    --md-drawer-bg: rgba(246, 246, 246, 0.88);
    --md-drawer-border: rgba(0, 0, 0, 0.06);
    --md-drawer-shadow: -8px 0 40px rgba(0, 0, 0, 0.1), -2px 0 12px rgba(0, 0, 0, 0.06);
    --md-drawer-header-padding: var(--md-spacing-md) var(--md-spacing-lg);
    --md-drawer-header-border: rgba(0, 0, 0, 0.06);
    --md-drawer-title-font-size: var(--md-font-size-lg);
    --md-drawer-title-color: var(--md-color-text);
    --md-drawer-body-padding: var(--md-spacing-lg);
    --md-drawer-footer-padding: var(--md-spacing-md) var(--md-spacing-lg);
    --md-drawer-footer-border: rgba(0, 0, 0, 0.06);
    --md-drawer-close-color: var(--md-color-text-secondary);
    --md-drawer-close-hover-bg: rgba(0, 0, 0, 0.06);
    --md-drawer-mask-bg: rgba(0, 0, 0, 0.3);
    --md-drawer-radius: var(--md-radius-lg);
  }

  /* ─── 遮罩层 ─── */

  .mask {
    position: fixed;
    inset: 0;
    z-index: 99998;
    background: var(--md-drawer-mask-bg);
    opacity: 0;
    transition: opacity 250ms cubic-bezier(0.4, 0, 0.2, 1);
    pointer-events: none;
  }

  .mask.visible {
    opacity: 1;
    pointer-events: auto;
  }

  .mask.transparent {
    background: transparent;
    pointer-events: auto;
  }

  /* ─── 抽屉面板 ─── */

  .panel {
    position: fixed;
    z-index: 99999;
    background: var(--md-drawer-bg);
    backdrop-filter: blur(var(--md-glass-blur)) saturate(var(--md-glass-saturate));
    -webkit-backdrop-filter: blur(var(--md-glass-blur)) saturate(var(--md-glass-saturate));
    border: 0.5px solid var(--md-drawer-border);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: transform 250ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* ─── 位置方向 ─── */

  .panel.right {
    top: 0;
    right: 0;
    bottom: 0;
    height: 100%;
    border-radius: var(--md-drawer-radius) 0 0 var(--md-drawer-radius);
    box-shadow: var(--md-drawer-shadow);
    transform: translateX(100%);
  }

  .panel.right.open {
    transform: translateX(0);
  }

  .panel.left {
    top: 0;
    left: 0;
    bottom: 0;
    height: 100%;
    border-radius: 0 var(--md-drawer-radius) var(--md-drawer-radius) 0;
    box-shadow:
      8px 0 40px rgba(0, 0, 0, 0.1),
      2px 0 12px rgba(0, 0, 0, 0.06);
    transform: translateX(-100%);
  }

  .panel.left.open {
    transform: translateX(0);
  }

  .panel.top {
    top: 0;
    left: 0;
    right: 0;
    width: 100%;
    border-radius: 0 0 var(--md-drawer-radius) var(--md-drawer-radius);
    box-shadow:
      0 8px 40px rgba(0, 0, 0, 0.1),
      0 2px 12px rgba(0, 0, 0, 0.06);
    transform: translateY(-100%);
  }

  .panel.top.open {
    transform: translateY(0);
  }

  .panel.bottom {
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    border-radius: var(--md-drawer-radius) var(--md-drawer-radius) 0 0;
    box-shadow:
      0 -8px 40px rgba(0, 0, 0, 0.1),
      0 -2px 12px rgba(0, 0, 0, 0.06);
    transform: translateY(100%);
  }

  .panel.bottom.open {
    transform: translateY(0);
  }

  /* ─── 头部 ─── */

  .header {
    display: flex;
    align-items: center;
    padding: var(--md-drawer-header-padding);
    border-bottom: 0.5px solid var(--md-drawer-header-border);
    flex-shrink: 0;
  }

  .title {
    flex: 1;
    font-size: var(--md-drawer-title-font-size);
    font-weight: 600;
    color: var(--md-drawer-title-color);
    letter-spacing: -0.01em;
  }

  .close-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: var(--md-radius-sm);
    color: var(--md-drawer-close-color);
    cursor: pointer;
    transition:
      background var(--md-transition-fast),
      color var(--md-transition-fast);
    flex-shrink: 0;
    margin-left: var(--md-spacing-sm);
    background: none;
    border: none;
    padding: 0;
  }

  .close-btn:hover {
    background: var(--md-drawer-close-hover-bg);
    color: var(--md-drawer-title-color);
  }

  .close-btn :global(svg),
  .close-btn svg {
    width: 16px;
    height: 16px;
  }

  /* ─── 内容区 ─── */

  .body {
    flex: 1;
    overflow-y: auto;
    padding: var(--md-drawer-body-padding);
  }

  /* ─── 底部 ─── */

  .footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--md-spacing-sm);
    padding: var(--md-drawer-footer-padding);
    border-top: 0.5px solid var(--md-drawer-footer-border);
    flex-shrink: 0;
  }

  /* ─── 调整大小手柄 ─── */

  .resize-handle {
    position: absolute;
    z-index: 10;
  }

  .resize-handle.right {
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    cursor: ew-resize;
  }

  .resize-handle.left {
    right: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    cursor: ew-resize;
  }

  .resize-handle.top {
    bottom: 0;
    left: 0;
    right: 0;
    height: 4px;
    cursor: ns-resize;
  }

  .resize-handle.bottom {
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    cursor: ns-resize;
  }

  .mac-drawer[data-theme='dark'] {
    --md-drawer-bg: rgba(40, 40, 40, 0.92);
    --md-drawer-border: rgba(255, 255, 255, 0.08);
    --md-drawer-shadow: -8px 0 40px rgba(0, 0, 0, 0.3), -2px 0 12px rgba(0, 0, 0, 0.2);
    --md-drawer-header-border: rgba(255, 255, 255, 0.06);
    --md-drawer-title-color: rgba(255, 255, 255, 0.92);
    --md-drawer-footer-border: rgba(255, 255, 255, 0.06);
    --md-drawer-close-color: rgba(255, 255, 255, 0.55);
    --md-drawer-close-hover-bg: rgba(255, 255, 255, 0.08);
    --md-drawer-mask-bg: rgba(0, 0, 0, 0.5);
  }

  .mac-drawer[data-theme='light'] {
    --md-drawer-bg: rgba(246, 246, 246, 0.88);
    --md-drawer-border: rgba(0, 0, 0, 0.06);
    --md-drawer-shadow: -8px 0 40px rgba(0, 0, 0, 0.1), -2px 0 12px rgba(0, 0, 0, 0.06);
    --md-drawer-header-border: rgba(0, 0, 0, 0.06);
    --md-drawer-title-color: var(--md-color-text);
    --md-drawer-footer-border: rgba(0, 0, 0, 0.06);
    --md-drawer-close-color: var(--md-color-text-secondary);
    --md-drawer-close-hover-bg: rgba(0, 0, 0, 0.06);
    --md-drawer-mask-bg: rgba(0, 0, 0, 0.3);
  }

  /* ─── 响应式：移动端窄屏全宽 + 安全区适配 ─── */
  @media (max-width: 768px) {
    .panel.right,
    .panel.left {
      width: 100% !important;
      max-width: 100% !important;
      border-radius: 0;
    }
    .panel.right {
      padding-left: max(env(safe-area-inset-left, 0px), 0px);
    }
    .panel.left {
      padding-right: max(env(safe-area-inset-right, 0px), 0px);
    }
    .panel.top {
      padding-bottom: env(safe-area-inset-top, 0px);
    }
    .panel.bottom {
      padding-bottom: env(safe-area-inset-bottom, 0px);
    }
    .header {
      padding: 14px 16px;
    }
    .title {
      font-size: 17px;
    }
    .close-btn {
      width: 36px;
      height: 36px;
    }
    .body {
      padding: 16px;
    }
    .footer {
      padding: 14px 16px;
    }
    .resize-handle {
      display: none;
    }
  }
</style>
