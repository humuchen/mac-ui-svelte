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
   * @tag mac-tag
   * @summary 用于标签和分类的标记组件。
   *
   * @slot children - 标签的文本内容。
   * @slot prefix - 标签前的内容。
   * @slot suffix - 标签后的内容。
   *
   * @event mac-close - 点击关闭按钮时触发。
   */

  export type TagType = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'

  interface Props {
    /** 标签的类型样式。 */
    type?: TagType
    /** 标签的尺寸。 */
    size?: MacSize
    /** 标签是否可关闭。 */
    closable?: boolean
    /** 标签是否为圆角。 */
    round?: boolean
    /** 标签是否有边框。 */
    bordered?: boolean
    /** 禁用标签。 */
    disabled?: boolean
    /** 组件级主题覆盖。 */
    theme?: MacTheme
    /** 标签的文本内容（对应 Lit 版默认 slot）。 */
    children?: Snippet
    /** 标签前内容。 */
    prefix?: Snippet
    /** 标签后内容。 */
    suffix?: Snippet
    /** 其余属性透传。 */
    [key: string]: unknown
  }

  let {
    type = 'default',
    size = undefined,
    closable = false,
    round = false,
    bordered = true,
    disabled = false,
    theme = undefined,
    children,
    prefix,
    suffix,
    ...rest
  }: Props = $props()

  const config = useMacConfig()
  const resolvedSize = $derived(resolveSize(size, config))
  const resolvedTheme = $derived(resolveTheme(theme, config))

  let root: HTMLSpanElement | undefined = $state()

  function emit(name: string, detail?: unknown) {
    root?.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }))
  }

  function handleClose(e: Event) {
    e.stopPropagation()
    emit('mac-close')
  }
</script>

<span
  bind:this={root}
  {...rest}
  class="mac-scope mac-tag tag tag--{type} tag--{resolvedSize} {round ? 'tag--round' : ''} {closable
    ? 'tag--closable'
    : ''} {disabled ? 'tag--disabled' : ''} {bordered ? '' : 'tag--borderless'}"
  data-theme={resolvedTheme}
  data-size={resolvedSize}
>
  {#if prefix}{@render prefix()}{/if}
  {#if children}{@render children()}{/if}
  {#if suffix}{@render suffix()}{/if}
  {#if closable}
    <button class="close" type="button" aria-label="Close" onclick={handleClose}>
      <svg
        width="1em"
        height="1em"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M4 4L12 12M12 4L4 12"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
        />
      </svg>
    </button>
  {/if}
</span>

<style>
  .mac-tag {
    display: inline-block;
  }

  .tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--md-tag-gap);
    padding: var(--md-tag-padding-vertical) var(--md-tag-padding-horizontal);
    font-size: var(--md-tag-font-size);
    font-family: inherit;
    line-height: 1.5;
    border-radius: var(--md-tag-radius);
    border: 1px solid transparent;
    transition: all var(--md-transition-fast);
    user-select: none;
    white-space: nowrap;
    cursor: default;
  }

  .tag--round {
    border-radius: var(--md-tag-round-radius);
  }

  .tag--closable {
    padding-right: var(--md-tag-closable-padding-right);
  }

  /* 类型 */
  .tag--default {
    background-color: var(--md-tag-default-bg);
    color: var(--md-tag-default-text);
    border-color: var(--md-tag-default-border);
  }

  .tag--default .close:hover {
    background-color: var(--md-tag-default-close-hover-bg);
    color: var(--md-tag-default-close-hover-color);
  }

  .tag--primary {
    background-color: var(--md-tag-primary-bg);
    color: var(--md-tag-primary-text);
    border-color: var(--md-tag-primary-border);
  }

  .tag--primary .close:hover {
    background-color: var(--md-tag-primary-close-hover-bg);
    color: var(--md-tag-primary-close-hover-color);
  }

  .tag--success {
    background-color: var(--md-tag-success-bg);
    color: var(--md-tag-success-text);
    border-color: var(--md-tag-success-border);
  }

  .tag--success .close:hover {
    background-color: var(--md-tag-success-close-hover-bg);
    color: var(--md-tag-success-close-hover-color);
  }

  .tag--warning {
    background-color: var(--md-tag-warning-bg);
    color: var(--md-tag-warning-text);
    border-color: var(--md-tag-warning-border);
  }

  .tag--warning .close:hover {
    background-color: var(--md-tag-warning-close-hover-bg);
    color: var(--md-tag-warning-close-hover-color);
  }

  .tag--danger {
    background-color: var(--md-tag-danger-bg);
    color: var(--md-tag-danger-text);
    border-color: var(--md-tag-danger-border);
  }

  .tag--danger .close:hover {
    background-color: var(--md-tag-danger-close-hover-bg);
    color: var(--md-tag-danger-close-hover-color);
  }

  .tag--info {
    background-color: var(--md-tag-info-bg);
    color: var(--md-tag-info-text);
    border-color: var(--md-tag-info-border);
  }

  .tag--info .close:hover {
    background-color: var(--md-tag-info-close-hover-bg);
    color: var(--md-tag-info-close-hover-color);
  }

  /* 无边框 */
  .tag--borderless {
    border-color: transparent;
  }

  /* 尺寸 */
  .tag--sm {
    padding: var(--sm-tag-padding-vertical) var(--sm-tag-padding-horizontal);
    font-size: var(--sm-tag-font-size);
    gap: var(--sm-tag-gap);
    border-radius: var(--sm-tag-radius);
  }

  .tag--sm.tag--round {
    border-radius: var(--sm-tag-round-radius);
  }

  .tag--sm.tag--closable {
    padding-right: var(--sm-tag-closable-padding-right);
  }

  .tag--lg {
    padding: var(--lg-tag-padding-vertical) var(--lg-tag-padding-horizontal);
    font-size: var(--lg-tag-font-size);
    gap: var(--lg-tag-gap);
    border-radius: var(--lg-tag-radius);
  }

  .tag--lg.tag--round {
    border-radius: var(--lg-tag-round-radius);
  }

  .tag--lg.tag--closable {
    padding-right: var(--lg-tag-closable-padding-right);
  }

  /* 禁用状态 */
  .tag--disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }

  /* 关闭按钮 */
  .close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--md-tag-close-size);
    height: var(--md-tag-close-size);
    margin-left: 2px;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: transparent;
    cursor: pointer;
    font-size: inherit;
    line-height: 1;
    color: inherit;
    opacity: 0.7;
    transition: all var(--md-transition-fast);
  }

  .close:hover {
    opacity: 1;
  }

  .close:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 1px;
  }

  .tag--sm .close {
    width: var(--sm-tag-close-size);
    height: var(--sm-tag-close-size);
  }

  .tag--lg .close {
    width: var(--lg-tag-close-size);
    height: var(--lg-tag-close-size);
  }
</style>
