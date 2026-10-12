<script lang="ts">
  import type { Snippet } from 'svelte'
  import {
    useMacConfig,
    resolveTheme,
    type MacTheme,
  } from '../../internal/config.svelte'

  /**
   * @tag mac-popconfirm
   * @summary macOS 风格的气泡确认组件。
   *
   * @slot children - 触发元素。
   * @slot action - 自定义操作按钮（替换默认确认/取消按钮）。
   *
   * @event mac-popconfirm-confirm - 点击确认按钮时触发。
   * @event mac-popconfirm-cancel - 点击取消按钮时触发。
   * @event mac-popconfirm-open - 气泡打开时触发。
   * @event mac-popconfirm-close - 气泡关闭时触发。
   */

  export type PopconfirmPlacement =
    | 'top'
    | 'top-start'
    | 'top-end'
    | 'bottom'
    | 'bottom-start'
    | 'bottom-end'
    | 'left'
    | 'left-start'
    | 'left-end'
    | 'right'
    | 'right-start'
    | 'right-end'

  interface Props {
    /** 确认标题文本。 */
    title?: string
    /** 确认描述文本。 */
    description?: string
    /** 确认按钮文本。 */
    confirmText?: string
    /** 取消按钮文本。 */
    cancelText?: string
    /** 确认按钮是否为危险样式。 */
    danger?: boolean
    /** 是否显示图标。 */
    showIcon?: boolean
    /** 气泡位置。 */
    placement?: PopconfirmPlacement
    /** 触发模式。 */
    trigger?: 'click' | 'hover'
    /** 是否禁用气泡确认。 */
    disabled?: boolean
    /** 气泡宽度。 */
    width?: string
    /** 组件级主题覆盖。 */
    theme?: MacTheme
    /** 触发元素（对应 Lit 版默认 slot）。 */
    children?: Snippet
    /** 自定义操作按钮。 */
    action?: Snippet
    /** 其余属性透传。 */
    [key: string]: unknown
  }

  let {
    title = '',
    description = '',
    confirmText = '确认',
    cancelText = '取消',
    danger = false,
    showIcon = true,
    placement = 'top',
    trigger = 'click',
    disabled = false,
    width = '240px',
    theme = undefined,
    children,
    action,
    ...rest
  }: Props = $props()

  const config = useMacConfig()
  const resolvedTheme = $derived(resolveTheme(theme, config))

  let root: HTMLDivElement | undefined = $state()
  let triggerEl: HTMLDivElement | undefined = $state()

  function emit(name: string, detail?: unknown) {
    root?.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }))
  }

  let visible = $state(false)
  let popoverStyle = $state('')
  let adjustedPlacement = $state<PopconfirmPlacement>(placement)
  let arrowStyle = $state('')
  let hoverTimeout: ReturnType<typeof setTimeout> | null = null

  function show(): void {
    if (visible) return
    visible = true
    emit('mac-popconfirm-open')
    // 定位在下一帧（渲染后测量）
    requestAnimationFrame(() => {
      positionPopover()
    })
  }

  function hide(): void {
    if (!visible) return
    visible = false
    emit('mac-popconfirm-close')
  }

  function confirm(): void {
    emit('mac-popconfirm-confirm')
    hide()
  }

  function cancel(): void {
    emit('mac-popconfirm-cancel')
    hide()
  }

  // ─── 定位（与 Lit 版 _calcPosition 一致） ───

  function calcPosition(
    anchorRect: DOMRect,
    pw: number,
    ph: number,
  ): { left: number; top: number; adjusted: PopconfirmPlacement } {
    const gap = 10
    const vw = window.innerWidth
    const vh = window.innerHeight

    let left = 0
    let top = 0
    let adjusted: PopconfirmPlacement = placement

    const place = (p: PopconfirmPlacement) => {
      switch (p) {
        case 'top':
          left = anchorRect.left + anchorRect.width / 2 - pw / 2
          top = anchorRect.top - ph - gap
          break
        case 'top-start':
          left = anchorRect.left
          top = anchorRect.top - ph - gap
          break
        case 'top-end':
          left = anchorRect.right - pw
          top = anchorRect.top - ph - gap
          break
        case 'bottom':
          left = anchorRect.left + anchorRect.width / 2 - pw / 2
          top = anchorRect.bottom + gap
          break
        case 'bottom-start':
          left = anchorRect.left
          top = anchorRect.bottom + gap
          break
        case 'bottom-end':
          left = anchorRect.right - pw
          top = anchorRect.bottom + gap
          break
        case 'left':
          left = anchorRect.left - pw - gap
          top = anchorRect.top + anchorRect.height / 2 - ph / 2
          break
        case 'left-start':
          left = anchorRect.left - pw - gap
          top = anchorRect.top
          break
        case 'left-end':
          left = anchorRect.left - pw - gap
          top = anchorRect.bottom - ph
          break
        case 'right':
          left = anchorRect.right + gap
          top = anchorRect.top + anchorRect.height / 2 - ph / 2
          break
        case 'right-start':
          left = anchorRect.right + gap
          top = anchorRect.top
          break
        case 'right-end':
          left = anchorRect.right + gap
          top = anchorRect.bottom - ph
          break
      }
    }

    place(placement)

    // 自动翻转：如果溢出视口，尝试相反位置
    const isTop = placement.startsWith('top')
    const isBottom = placement.startsWith('bottom')
    const isLeft = placement.startsWith('left')
    const isRight = placement.startsWith('right')

    if (isTop && top < 8) {
      const flipped = placement.replace('top', 'bottom') as PopconfirmPlacement
      const prevTop = top
      place(flipped)
      if (top + ph <= vh - 8) {
        adjusted = flipped
      } else {
        top = prevTop
      }
    } else if (isBottom && top + ph > vh - 8) {
      const flipped = placement.replace('bottom', 'top') as PopconfirmPlacement
      const prevTop = top
      place(flipped)
      if (top >= 8) {
        adjusted = flipped
      } else {
        top = prevTop
      }
    } else if (isLeft && left < 8) {
      const flipped = placement.replace('left', 'right') as PopconfirmPlacement
      const prevLeft = left
      place(flipped)
      if (left + pw <= vw - 8) {
        adjusted = flipped
      } else {
        left = prevLeft
      }
    } else if (isRight && left + pw > vw - 8) {
      const flipped = placement.replace('right', 'left') as PopconfirmPlacement
      const prevLeft = left
      place(flipped)
      if (left >= 8) {
        adjusted = flipped
      } else {
        left = prevLeft
      }
    }

    // 限制在视口内
    if (left + pw > vw - 8) left = vw - pw - 8
    if (left < 8) left = 8
    if (top + ph > vh - 8) top = vh - ph - 8
    if (top < 8) top = 8

    return { left, top, adjusted }
  }

  function positionPopover(): void {
    if (!triggerEl || !root) return
    const popover = root.querySelector<HTMLElement>('.mac-popconfirm-portal')
    if (!popover) return

    const anchorRect = triggerEl.getBoundingClientRect()
    const popoverRect = popover.getBoundingClientRect()
    const { left, top, adjusted } = calcPosition(anchorRect, popoverRect.width, popoverRect.height)

    adjustedPlacement = adjusted
    popoverStyle = `left: ${left}px; top: ${top}px;`

    // 箭头定位
    const arrowSize = 10
    const halfArrow = arrowSize / 2
    const padding = 14
    let style = ''

    if (adjusted.startsWith('top') || adjusted.startsWith('bottom')) {
      const anchorCenter = anchorRect.left + anchorRect.width / 2
      let arrowLeft = anchorCenter - left - halfArrow
      arrowLeft = Math.max(padding, Math.min(popoverRect.width - padding - arrowSize, arrowLeft))
      style = `left: ${arrowLeft}px;`
    } else {
      const anchorCenter = anchorRect.top + anchorRect.height / 2
      let arrowTop = anchorCenter - top - halfArrow
      arrowTop = Math.max(padding, Math.min(popoverRect.height - padding - arrowSize, arrowTop))
      style = `top: ${arrowTop}px;`
    }
    arrowStyle = style
  }

  // ─── 事件处理器 ───

  function handleDocumentClick(e: Event): void {
    if (!visible) return
    const target = e.target as Node
    if (root?.contains(target)) return
    hide()
  }

  function handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape' && visible) {
      e.preventDefault()
      cancel()
    }
  }

  // visible 时挂载 document 级监听
  $effect(() => {
    if (!visible) return
    document.addEventListener('mousedown', handleDocumentClick)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  })

  function handleTriggerClick(e: Event): void {
    if (disabled) return
    if (trigger !== 'click') return
    e.preventDefault()
    visible ? hide() : show()
  }

  function handleTriggerMouseEnter(): void {
    if (disabled || trigger !== 'hover') return
    if (hoverTimeout) clearTimeout(hoverTimeout)
    hoverTimeout = setTimeout(show, 150)
  }

  function handleTriggerMouseLeave(): void {
    if (trigger !== 'hover') return
    if (hoverTimeout) clearTimeout(hoverTimeout)
    hoverTimeout = setTimeout(hide, 200)
  }

  function handlePopoverMouseEnter(): void {
    if (trigger === 'hover' && hoverTimeout) {
      clearTimeout(hoverTimeout)
      hoverTimeout = null
    }
  }

  function handlePopoverMouseLeave(): void {
    if (trigger === 'hover') {
      if (hoverTimeout) clearTimeout(hoverTimeout)
      hoverTimeout = setTimeout(hide, 200)
    }
  }

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
  class="mac-scope mac-popconfirm"
  data-theme={resolvedTheme}
>
  <div
    bind:this={triggerEl}
    class="trigger"
    onclick={handleTriggerClick}
    onmouseenter={handleTriggerMouseEnter}
    onmouseleave={handleTriggerMouseLeave}
  >
    {#if children}{@render children()}{/if}
  </div>

  {#if visible}
    <div
      class="mac-popconfirm-portal"
      data-placement={adjustedPlacement}
      style="width: {width}; {popoverStyle}"
      onmouseenter={handlePopoverMouseEnter}
      onmouseleave={handlePopoverMouseLeave}
    >
      <div class="popconfirm-arrow" style={arrowStyle}></div>
      <div class="popconfirm-body">
        {#if showIcon}
          <div class="popconfirm-icon">
            <svg viewBox="0 0 18 18" fill="currentColor">
              <path
                d="M9 2.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM9 1a8 8 0 110 16A8 8 0 019 1zm-.25 4.5a.75.75 0 011.5 0v4a.75.75 0 01-1.5 0v-4zM9 12a1 1 0 100 2 1 1 0 000-2z"
              />
            </svg>
          </div>
        {/if}
        <div class="popconfirm-content">
          {#if title}
            <div class="popconfirm-title">{title}</div>
          {/if}
          {#if description}
            <div class="popconfirm-desc">{description}</div>
          {/if}
        </div>
      </div>
      <div class="popconfirm-actions">
        {#if action}
          {@render action()}
        {:else}
          <button class="popconfirm-btn popconfirm-btn-cancel" onclick={cancel}>
            {cancelText}
          </button>
          <button
            class="popconfirm-btn popconfirm-btn-confirm {danger ? 'popconfirm-btn-danger' : ''}"
            onclick={confirm}
          >
            {confirmText}
          </button>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .mac-popconfirm {
    display: inline-block;
    --md-popconfirm-bg: rgba(246, 246, 246, 0.88);
    --md-popconfirm-border: rgba(0, 0, 0, 0.06);
    --md-popconfirm-shadow: 0 8px 40px rgba(0, 0, 0, 0.12), 0 2px 12px rgba(0, 0, 0, 0.06);
    --md-popconfirm-radius: var(--md-radius-lg);
    --md-popconfirm-padding: var(--md-spacing-lg);
    --md-popconfirm-icon-color: #f5a623;
    --md-popconfirm-title-color: var(--md-color-text);
    --md-popconfirm-title-font-size: var(--md-font-size-base);
    --md-popconfirm-desc-color: var(--md-color-text-secondary);
    --md-popconfirm-desc-font-size: var(--md-font-size-sm);
    --md-popconfirm-btn-gap: var(--md-spacing-sm);
  }

  .trigger {
    display: inline-flex;
    cursor: pointer;
  }

  .mac-popconfirm-portal {
    position: fixed;
    z-index: 99999;
    min-width: 200px;
    background: var(--md-popconfirm-bg);
    backdrop-filter: blur(40px) saturate(200%);
    -webkit-backdrop-filter: blur(40px) saturate(200%);
    border: 0.5px solid var(--md-popconfirm-border);
    border-radius: var(--md-popconfirm-radius);
    box-shadow: var(--md-popconfirm-shadow);
    padding: var(--md-popconfirm-padding);
    opacity: 0;
    transform: scale(0.96);
    pointer-events: none;
    transition:
      opacity 180ms cubic-bezier(0.4, 0, 0.2, 1),
      transform 180ms cubic-bezier(0.4, 0, 0.2, 1);
    animation: popconfirm-show 180ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif;
  }

  @keyframes popconfirm-show {
    to {
      opacity: 1;
      transform: scale(1);
      pointer-events: auto;
    }
  }

  /* 箭头 */
  .popconfirm-arrow {
    position: absolute;
    width: 10px;
    height: 10px;
    background: var(--md-popconfirm-bg);
    border: 0.5px solid var(--md-popconfirm-border);
    transform: rotate(45deg);
  }

  .mac-popconfirm-portal[data-placement^='top'] .popconfirm-arrow {
    bottom: -5.5px;
    border-top: none;
    border-left: none;
  }

  .mac-popconfirm-portal[data-placement^='bottom'] .popconfirm-arrow {
    top: -5.5px;
    border-bottom: none;
    border-right: none;
  }

  .mac-popconfirm-portal[data-placement^='left'] .popconfirm-arrow {
    right: -5.5px;
    border-bottom: none;
    border-left: none;
  }

  .mac-popconfirm-portal[data-placement^='right'] .popconfirm-arrow {
    left: -5.5px;
    border-top: none;
    border-right: none;
  }

  /* 内容 */
  .popconfirm-body {
    display: flex;
    gap: 10px;
  }

  .popconfirm-icon {
    flex-shrink: 0;
    display: flex;
    align-items: flex-start;
    padding-top: 1px;
    color: var(--md-popconfirm-icon-color);
  }

  .popconfirm-icon :global(svg),
  .popconfirm-icon svg {
    width: 18px;
    height: 18px;
  }

  .popconfirm-content {
    flex: 1;
    min-width: 0;
  }

  .popconfirm-title {
    font-size: var(--md-popconfirm-title-font-size);
    font-weight: 500;
    color: var(--md-popconfirm-title-color);
    line-height: 1.5;
  }

  .popconfirm-desc {
    font-size: var(--md-popconfirm-desc-font-size);
    color: var(--md-popconfirm-desc-color);
    line-height: 1.5;
    margin-top: 4px;
  }

  .popconfirm-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--md-popconfirm-btn-gap);
    margin-top: 12px;
  }

  .popconfirm-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 28px;
    padding: 0 14px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 400;
    cursor: pointer;
    transition:
      background 150ms,
      color 150ms,
      border-color 150ms;
    border: 0.5px solid rgba(0, 0, 0, 0.12);
    background: rgba(255, 255, 255, 0.8);
    color: rgba(0, 0, 0, 0.88);
    white-space: nowrap;
    user-select: none;
  }

  .popconfirm-btn:hover {
    background: rgba(255, 255, 255, 1);
  }

  .popconfirm-btn:active {
    background: rgba(240, 240, 240, 0.9);
  }

  .popconfirm-btn-confirm {
    background: rgba(0, 122, 255, 0.88);
    color: #fff;
    border-color: transparent;
  }

  .popconfirm-btn-confirm:hover {
    background: rgba(0, 100, 220, 0.92);
  }

  .popconfirm-btn-confirm:active {
    background: rgba(0, 80, 190, 0.95);
  }

  .popconfirm-btn-danger {
    background: rgba(220, 53, 46, 0.88);
    color: #fff;
    border-color: transparent;
  }

  .popconfirm-btn-danger:hover {
    background: rgba(200, 40, 35, 0.92);
  }

  .popconfirm-btn-danger:active {
    background: rgba(180, 30, 25, 0.95);
  }

  .mac-popconfirm-portal[data-theme='dark'] {
    --md-popconfirm-bg: rgba(40, 40, 40, 0.92);
    --md-popconfirm-border: rgba(255, 255, 255, 0.08);
    --md-popconfirm-shadow: 0 8px 40px rgba(0, 0, 0, 0.3), 0 2px 12px rgba(0, 0, 0, 0.2);
    --md-popconfirm-title-color: rgba(255, 255, 255, 0.92);
    --md-popconfirm-desc-color: rgba(255, 255, 255, 0.45);
    --md-popconfirm-icon-color: #f5a623;
  }

  .mac-popconfirm-portal[data-theme='dark'] .popconfirm-arrow {
    background: rgba(40, 40, 40, 0.92);
    border-color: rgba(255, 255, 255, 0.08);
  }

  .mac-popconfirm-portal[data-theme='dark'] .popconfirm-btn {
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.88);
    border-color: rgba(255, 255, 255, 0.12);
  }

  .mac-popconfirm-portal[data-theme='dark'] .popconfirm-btn:hover {
    background: rgba(255, 255, 255, 0.12);
  }
</style>
