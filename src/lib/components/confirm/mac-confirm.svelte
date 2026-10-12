<script lang="ts">
  import type { Snippet } from 'svelte'
  import {
    useMacConfig,
    resolveTheme,
    type MacTheme,
  } from '../../internal/config.svelte'

  /**
   * @tag mac-confirm
   * @summary 带遮罩和居中内容的 macOS 风格确认对话框。
   *
   * @slot children - 对话框主体内容（替换 content 属性）。
   * @slot footer - 自定义底部内容（替换默认按钮）。
   *
   * @event mac-confirm-open - 对话框打开时触发。
   * @event mac-confirm-close - 对话框关闭时触发。
   * @event mac-confirm-ok - 点击确定按钮时触发。
   * @event mac-confirm-cancel - 点击取消按钮时触发。
   */

  interface Props {
    /** 对话框标题文本。 */
    title?: string
    /** 对话框标题对齐方式。 */
    titleAlign?: 'left' | 'center' | 'right'
    /** 对话框主体内容文本。 */
    content?: string
    /** 确认按钮文本。 */
    confirmText?: string
    /** 取消按钮文本。 */
    cancelText?: string
    /** 确认按钮是否使用危险样式。 */
    danger?: boolean
    /** 是否显示图标。 */
    showIcon?: boolean
    /** 对话框宽度，例如 '420px' 或 420。 */
    width?: string | number
    /** 对话框是否可见。 */
    visible?: boolean
    /** 点击遮罩是否关闭对话框。 */
    maskClosable?: boolean
    /** 是否在标题/主体和主体/底部之间显示分隔线。 */
    showDivider?: boolean
    /** 组件级主题覆盖。 */
    theme?: MacTheme
    /** 对话框主体内容（对应 Lit 版默认 slot）。 */
    children?: Snippet
    /** 自定义底部内容。 */
    footer?: Snippet
    /** 事件透传（供命令式 API 使用）。 */
    onok?: () => void
    oncancel?: () => void
    /** 其余属性透传。 */
    [key: string]: unknown
  }

  let {
    title = '',
    titleAlign = 'left',
    content = '',
    confirmText = '确认',
    cancelText = '取消',
    danger = false,
    showIcon = true,
    width = '420px',
    visible = $bindable(false),
    maskClosable = true,
    showDivider = true,
    theme = undefined,
    children,
    footer,
    onok,
    oncancel,
    ...rest
  }: Props = $props()

  const config = useMacConfig()
  const resolvedTheme = $derived(resolveTheme(theme, config))

  let root: HTMLDivElement | undefined = $state()

  function emit(name: string, detail?: unknown) {
    root?.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }))
  }

  function handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape' && visible) {
      e.preventDefault()
      cancel()
    }
  }

  // visible 时挂载 ESC 监听
  $effect(() => {
    if (!visible) return
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  })

  function onMaskClick(): void {
    if (maskClosable) {
      cancel()
    }
  }

  function ok(): void {
    emit('mac-confirm-ok')
    onok?.()
    visible = false
    emit('mac-confirm-close')
  }

  function cancel(): void {
    emit('mac-confirm-cancel')
    oncancel?.()
    visible = false
    emit('mac-confirm-close')
  }

  /** 打开对话框（公开方法）。 */
  export function open(): void {
    if (visible) return
    visible = true
    emit('mac-confirm-open')
  }

  /** 关闭对话框（公开方法，不派发 ok/cancel）。 */
  export function close(): void {
    if (!visible) return
    visible = false
    emit('mac-confirm-close')
  }

  const resolvedWidth = $derived(typeof width === 'number' ? `${width}px` : width)
</script>

{#if visible}
  <div bind:this={root} {...rest} class="mac-scope mac-confirm" data-theme={resolvedTheme}>
    <div class="mask" onclick={onMaskClick}></div>
    <div class="container" style="--md-confirm-width: {resolvedWidth}">
      {#if title}
        <div class="titlebar titlebar--{titleAlign} {showDivider ? 'titlebar--divided' : ''}">
          {#if showIcon}
            <div class="titlebar-icon {danger ? 'titlebar-icon--danger' : ''}">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"
                />
              </svg>
            </div>
          {/if}
          <div class="title">{title}</div>
        </div>
      {/if}
      <div class="body">
        {#if children}
          {@render children()}
        {:else if content}
          <div class="content">{content}</div>
        {/if}
      </div>
      <div class="footer {showDivider ? 'footer--divided' : ''}">
        {#if footer}
          {@render footer()}
        {:else}
          <button class="footer-btn footer-btn--cancel" onclick={cancel}>{cancelText}</button>
          <button class="footer-btn footer-btn--ok {danger ? 'footer-btn--danger' : ''}" onclick={ok}>
            {confirmText}
          </button>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .mac-confirm {
    position: fixed;
    inset: 0;
    z-index: 99999;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--md-font-family);
  }

  .mask {
    position: absolute;
    inset: 0;
    background: var(--md-confirm-mask-bg);
  }

  .container {
    position: relative;
    display: flex;
    flex-direction: column;
    width: var(--md-confirm-width);
    max-width: calc(100vw - 32px);
    max-height: calc(100vh - 32px);
    background: var(--md-confirm-bg);
    backdrop-filter: blur(var(--md-glass-blur)) saturate(var(--md-glass-saturate));
    -webkit-backdrop-filter: blur(var(--md-glass-blur)) saturate(var(--md-glass-saturate));
    border-radius: var(--md-confirm-radius);
    box-shadow: var(--md-confirm-shadow);
    border: 0.5px solid var(--md-confirm-border);
    overflow: hidden;
    transform: scale(0.92);
    opacity: 0;
    animation: confirm-in var(--md-transition-normal) forwards;
  }

  @keyframes confirm-in {
    to {
      transform: scale(1);
      opacity: 1;
    }
  }

  /* 标题 */
  .titlebar {
    display: flex;
    align-items: center;
    padding: var(--md-confirm-title-padding);
    border-bottom: 0.5px solid transparent;
    min-height: 44px;
    gap: 8px;
  }

  .titlebar--divided {
    border-bottom-color: var(--md-confirm-title-border);
  }

  .titlebar--left {
    justify-content: flex-start;
  }

  .titlebar--center {
    justify-content: center;
  }

  .titlebar--right {
    justify-content: flex-end;
  }

  .titlebar-icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    color: var(--md-confirm-icon-color);
  }

  .titlebar-icon :global(svg),
  .titlebar-icon svg {
    width: 20px;
    height: 20px;
  }

  .titlebar-icon--danger {
    color: var(--md-color-danger);
  }

  .title {
    font-size: var(--md-confirm-title-font-size);
    font-weight: 500;
    color: var(--md-confirm-title-color);
    line-height: 1.4;
  }

  /* 主体 */
  .body {
    flex: 1;
    overflow: auto;
    padding: var(--md-confirm-body-padding);
    color: var(--md-confirm-body-color);
    font-size: var(--md-confirm-body-font-size);
    line-height: 1.6;
  }

  /* 底部 */
  .footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: var(--md-confirm-footer-padding);
    border-top: 0.5px solid transparent;
    gap: var(--md-confirm-btn-gap);
    flex-shrink: 0;
  }

  .footer--divided {
    border-top-color: var(--md-confirm-footer-border);
  }

  .footer-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--md-confirm-btn-padding);
    border-radius: var(--md-confirm-btn-radius);
    font-size: var(--md-confirm-btn-font-size);
    font-family: inherit;
    cursor: pointer;
    transition:
      background var(--md-transition-fast),
      border-color var(--md-transition-fast);
    border: 0.5px solid transparent;
    outline: none;
    white-space: nowrap;
    line-height: 1.5;
  }

  .footer-btn--cancel {
    background: var(--md-confirm-cancel-bg);
    border-color: var(--md-confirm-cancel-border);
    color: var(--md-confirm-cancel-color);
  }

  .footer-btn--cancel:hover {
    background: var(--md-confirm-cancel-hover-bg);
  }

  .footer-btn--ok {
    background: var(--md-confirm-ok-bg);
    color: var(--md-confirm-ok-color);
    border-color: transparent;
  }

  .footer-btn--ok:hover {
    background: var(--md-confirm-ok-hover-bg);
  }

  .footer-btn--danger {
    background: var(--md-confirm-danger-bg);
    color: var(--md-confirm-danger-color);
  }

  .footer-btn--danger:hover {
    background: var(--md-confirm-danger-hover-bg);
  }

  /* 暗黑模式 */
  .mac-confirm[data-theme='dark'] .container {
    background: var(--md-confirm-dark-bg);
    box-shadow: var(--md-confirm-dark-shadow);
    border-color: var(--md-confirm-dark-border);
  }

  .mac-confirm[data-theme='dark'] .title {
    color: var(--md-confirm-dark-title-color);
  }

  .mac-confirm[data-theme='dark'] .body {
    color: var(--md-confirm-dark-body-color);
  }

  .mac-confirm[data-theme='dark'] .titlebar--divided {
    border-bottom-color: var(--md-confirm-dark-title-border);
  }

  .mac-confirm[data-theme='dark'] .footer--divided {
    border-top-color: var(--md-confirm-dark-footer-border);
  }

  .mac-confirm[data-theme='dark'] .footer-btn--cancel {
    background: var(--md-confirm-dark-cancel-bg);
    border-color: var(--md-confirm-dark-cancel-border);
    color: var(--md-confirm-dark-cancel-color);
  }

  .mac-confirm[data-theme='dark'] .footer-btn--cancel:hover {
    background: var(--md-confirm-dark-cancel-hover-bg);
  }

  .mac-confirm[data-theme='dark'] .footer-btn--ok:hover {
    background: var(--md-confirm-dark-ok-hover-bg);
  }
</style>
