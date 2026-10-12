<script lang="ts">
  import type { Snippet } from 'svelte'
  import {
    useMacConfig,
    resolveSize,
    resolveTheme,
    type MacSize,
    type MacTheme,
  } from '../../internal/config.svelte'

  /**
   * @tag mac-alert
   * @summary 用于显示警告消息的提示组件。
   *
   * @slot children - 提示的描述内容。
   * @slot icon - 自定义图标内容。
   * @slot action - 显示在右侧的操作内容。
   *
   * @event mac-close - 点击关闭按钮时触发。
   */

  export type AlertType = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'

  interface Props {
    /** 提示的类型样式。 */
    type?: AlertType
    /** 提示的标题。 */
    title?: string
    /** 提示是否有边框。 */
    bordered?: boolean
    /** 是否显示图标。 */
    showIcon?: boolean
    /** 提示是否可以关闭。 */
    closable?: boolean
    /** 组件级主题覆盖。 */
    theme?: MacTheme
    /** 组件尺寸（对齐 BaseElement）。 */
    size?: MacSize
    /** 提示的描述内容（对应 Lit 版默认 slot）。 */
    children?: Snippet
    /** 自定义图标内容。 */
    icon?: Snippet
    /** 显示在右侧的操作内容。 */
    action?: Snippet
    /** 其余属性透传。 */
    [key: string]: unknown
  }

  let {
    type = 'default',
    title = '',
    bordered = true,
    showIcon = true,
    closable = false,
    theme = undefined,
    size = undefined,
    children,
    icon,
    action,
    ...rest
  }: Props = $props()

  const config = useMacConfig()
  const resolvedSize = $derived(resolveSize(size, config))
  const resolvedTheme = $derived(resolveTheme(theme, config))

  let root: HTMLDivElement | undefined = $state()

  function emit(name: string, detail?: unknown) {
    root?.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }))
  }

  function handleClose(e: Event) {
    e.stopPropagation()
    emit('mac-close')
  }

  /** 各类型默认图标（与 Lit 版 _defaultIcon 一致）。 */
  const defaultIconPath = $derived.by(() => {
    switch (type) {
      case 'success':
        return {
          paths: ['M22 11.08V12a10 10 0 1 1-5.93-9.14'],
          polylines: ['22 4 12 14.01 9 11.01'],
          circles: [] as { cx: number; cy: number; r: number }[],
          lines: [] as { x1: number; y1: number; x2: number; y2: number }[],
        }
      case 'warning':
        return {
          paths: ['M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'],
          polylines: [],
          circles: [],
          lines: [
            { x1: 12, y1: 9, x2: 12, y2: 13 },
            { x1: 12, y1: 17, x2: 12.01, y2: 17 },
          ],
        }
      case 'error':
        return {
          paths: [],
          polylines: [],
          circles: [{ cx: 12, cy: 12, r: 10 }],
          lines: [
            { x1: 15, y1: 9, x2: 9, y2: 15 },
            { x1: 9, y1: 9, x2: 15, y2: 15 },
          ],
        }
      case 'info':
      case 'primary':
      default:
        return {
          paths: [],
          polylines: [],
          circles: [{ cx: 12, cy: 12, r: 10 }],
          lines: [
            { x1: 12, y1: 16, x2: 12, y2: 12 },
            { x1: 12, y1: 8, x2: 12.01, y2: 8 },
          ],
        }
    }
  })
</script>

<div
  bind:this={root}
  {...rest}
  role="alert"
  class="mac-scope mac-alert alert alert--{type} {bordered ? 'alert--bordered' : 'alert--borderless'}"
  data-theme={resolvedTheme}
  data-size={resolvedSize}
>
  {#if showIcon}
    <div class="alert__icon">
      {#if icon}
        {@render icon()}
      {:else}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          {#each defaultIconPath.circles as c}
            <circle cx={c.cx} cy={c.cy} r={c.r} />
          {/each}
          {#each defaultIconPath.paths as d}
            <path {d} />
          {/each}
          {#each defaultIconPath.polylines as points}
            <polyline {points} />
          {/each}
          {#each defaultIconPath.lines as l}
            <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />
          {/each}
        </svg>
      {/if}
    </div>
  {/if}
  <div class="alert__content">
    {#if title.length > 0}
      <div class="alert__title">{title}</div>
    {/if}
    <div class="alert__description">
      {#if children}{@render children()}{/if}
    </div>
  </div>
  {#if action}
    <span class="alert__action">{@render action()}</span>
  {/if}
  {#if closable}
    <button class="alert__close" type="button" aria-label="Close" onclick={handleClose}>
      <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M4 4L12 12M12 4L4 12"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
        />
      </svg>
    </button>
  {/if}
</div>

<style>
  .mac-alert {
    display: block;
    font-family: var(--md-font-family);
  }

  .alert {
    display: flex;
    align-items: flex-start;
    gap: var(--md-alert-gap);
    padding: var(--md-alert-padding);
    border-radius: var(--md-alert-radius);
    font-size: var(--md-alert-font-size);
    line-height: 1.5;
    transition: all var(--md-transition-fast);
  }

  .alert--bordered {
    border: 1px solid var(--md-alert-border-color);
  }

  .alert--borderless {
    border-color: transparent;
  }

  /* 类型 */
  .alert--default {
    background-color: var(--md-alert-default-bg);
    --md-alert-border-color: var(--md-alert-default-border);
    --md-alert-icon-color: var(--md-alert-default-icon);
    --md-alert-title-color: var(--md-alert-default-title);
    --md-alert-content-color: var(--md-alert-default-content);
  }

  .alert--primary {
    background-color: var(--md-alert-primary-bg);
    --md-alert-border-color: var(--md-alert-primary-border);
    --md-alert-icon-color: var(--md-alert-primary-icon);
    --md-alert-title-color: var(--md-alert-primary-title);
    --md-alert-content-color: var(--md-alert-primary-content);
  }

  .alert--success {
    background-color: var(--md-alert-success-bg);
    --md-alert-border-color: var(--md-alert-success-border);
    --md-alert-icon-color: var(--md-alert-success-icon);
    --md-alert-title-color: var(--md-alert-success-title);
    --md-alert-content-color: var(--md-alert-success-content);
  }

  .alert--warning {
    background-color: var(--md-alert-warning-bg);
    --md-alert-border-color: var(--md-alert-warning-border);
    --md-alert-icon-color: var(--md-alert-warning-icon);
    --md-alert-title-color: var(--md-alert-warning-title);
    --md-alert-content-color: var(--md-alert-warning-content);
  }

  .alert--error {
    background-color: var(--md-alert-error-bg);
    --md-alert-border-color: var(--md-alert-error-border);
    --md-alert-icon-color: var(--md-alert-error-icon);
    --md-alert-title-color: var(--md-alert-error-title);
    --md-alert-content-color: var(--md-alert-error-content);
  }

  .alert--info {
    background-color: var(--md-alert-info-bg);
    --md-alert-border-color: var(--md-alert-info-border);
    --md-alert-icon-color: var(--md-alert-info-icon);
    --md-alert-title-color: var(--md-alert-info-title);
    --md-alert-content-color: var(--md-alert-info-content);
  }

  /* 图标 */
  .alert__icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--md-alert-icon-size);
    height: var(--md-alert-icon-size);
    margin-top: 1px;
    color: var(--md-alert-icon-color);
  }

  .alert__icon :global(*),
  .alert__icon svg {
    width: var(--md-alert-icon-size);
    height: var(--md-alert-icon-size);
  }

  /* 内容区域 */
  .alert__content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: var(--md-alert-content-gap);
  }

  .alert__title {
    font-weight: 500;
    color: var(--md-alert-title-color);
    font-size: var(--md-alert-title-font-size);
    line-height: 1.4;
  }

  .alert__description {
    color: var(--md-alert-content-color);
    line-height: 1.6;
  }

  /* 操作 */
  .alert__action {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    margin-left: auto;
    padding-left: var(--md-alert-gap);
  }

  /* 关闭按钮 */
  .alert__close {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--md-alert-close-size);
    height: var(--md-alert-close-size);
    margin-top: 1px;
    margin-left: auto;
    padding: 0;
    border: none;
    border-radius: var(--md-alert-close-radius);
    background: transparent;
    cursor: pointer;
    color: var(--md-alert-content-color);
    opacity: 0.6;
    transition: all var(--md-transition-fast);
  }

  .alert__close:hover {
    opacity: 1;
    background-color: var(--md-alert-close-hover-bg);
  }

  .alert__close:focus-visible {
    outline: 2px solid var(--md-color-primary);
    outline-offset: 1px;
  }

  .alert__close svg {
    width: var(--md-alert-close-icon-size);
    height: var(--md-alert-close-icon-size);
  }
</style>
