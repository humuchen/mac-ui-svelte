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
   * @tag mac-button
   * @summary 一个多功能的按钮组件。
   *
   * @slot children - 按钮的文本标签。
   * @slot prefix - 标签前的内容。
   * @slot suffix - 标签后的内容。
   *
   * @event mac-click - 点击按钮时触发。
   */

  export type ButtonVariant = 'primary' | 'secondary' | 'text'

  interface Props {
    /** 按钮的变体样式。 */
    variant?: ButtonVariant
    /** 按钮的尺寸。 */
    size?: MacSize
    /** 组件级主题覆盖。 */
    theme?: MacTheme
    /** 禁用按钮。 */
    disabled?: boolean
    /** 显示加载动画。 */
    loading?: boolean
    /** 按钮的类型（表单行为）。 */
    type?: 'button' | 'submit' | 'reset'
    /** 按钮文本内容（对应 Lit 版默认 slot）。 */
    children?: Snippet
    /** 标签前内容。 */
    prefix?: Snippet
    /** 标签后内容。 */
    suffix?: Snippet
    /** 其余原生 button 属性透传。 */
    [key: string]: unknown
  }

  let {
    variant = 'primary',
    size = undefined,
    theme = undefined,
    disabled = false,
    loading = false,
    type = 'button',
    children,
    prefix,
    suffix,
    ...rest
  }: Props = $props()

  // 尺寸/主题解析：自身属性 > ConfigProvider > 默认值（对应 BaseElement）
  const config = useMacConfig()
  const resolvedSize = $derived(resolveSize(size, config))
  const resolvedTheme = $derived(resolveTheme(theme, config))

  let root: HTMLButtonElement | undefined = $state()

  /** 派发 mac-* 自定义事件（与 Lit 版 emit 行为一致：bubbles + composed）。 */
  function emit(name: string, detail?: unknown) {
    root?.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }))
  }
</script>

<button
  bind:this={root}
  {...rest}
  {type}
  disabled={disabled || loading}
  class="mac-scope mac-button button button--{variant} button--{resolvedSize}"
  class:button--loading={loading}
  data-theme={resolvedTheme}
  data-size={resolvedSize}
  onclick={() => {
    if (!disabled && !loading) emit('mac-click')
  }}
>
  {#if loading}
    <span class="spinner"></span>
  {/if}
  {#if prefix}
    {@render prefix()}
  {/if}
  {#if children}
    {@render children()}
  {/if}
  {#if suffix}
    {@render suffix()}
  {/if}
</button>

<style>
  .mac-button {
    display: inline-block;
  }

  .button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--md-button-gap);
    padding: var(--md-button-padding-vertical) var(--md-button-padding-horizontal);
    font-size: var(--md-button-font-size);
    font-family: inherit;
    line-height: 1.5;
    border-radius: var(--md-button-radius);
    border: 1px solid transparent;
    cursor: pointer;
    transition: all var(--md-transition-fast);
    user-select: none;
    white-space: nowrap;
  }

  .button:focus-visible {
    outline: 2px solid var(--md-color-primary);
    outline-offset: 2px;
  }

  /* 变体 */
  .button--primary {
    background-color: var(--md-color-primary);
    color: #fff;
  }

  .button--primary:hover {
    background-color: var(--md-color-primary-hover);
  }

  .button--primary:active {
    background-color: var(--md-color-primary-active);
  }

  .button--secondary {
    background-color: transparent;
    color: var(--md-color-text);
    border-color: var(--md-color-border);
  }

  .button--secondary:hover {
    color: var(--md-color-primary);
    border-color: var(--md-color-primary);
  }

  .button--text {
    background-color: transparent;
    color: var(--md-color-text);
    padding: var(--md-button-padding-vertical) var(--md-button-padding-vertical);
  }

  .button--text:hover {
    color: var(--md-color-primary);
    background-color: var(--md-color-bg-secondary);
  }

  /* 尺寸 */
  .button--sm {
    padding: var(--sm-button-padding-vertical) var(--sm-button-padding-horizontal);
    font-size: var(--sm-button-font-size);
    gap: var(--sm-button-gap);
    border-radius: var(--sm-button-radius);
  }

  .button--lg {
    padding: var(--lg-button-padding-vertical) var(--lg-button-padding-horizontal);
    font-size: var(--lg-button-font-size);
    gap: var(--lg-button-gap);
    border-radius: var(--lg-button-radius);
  }

  /* 禁用 */
  .button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }

  /* 加载中 */
  .button--loading {
    pointer-events: none;
  }

  .spinner {
    width: 14px;
    height: 14px;
    border: 2px solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
