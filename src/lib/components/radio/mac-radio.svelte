<script lang="ts">
  import type { Snippet } from 'svelte'
  import {
    useMacConfig,
    resolveTheme,
    type MacSize,
    type MacTheme,
  } from '../../internal/config.svelte'
  import { useRadioGroup } from './radio-context.svelte'

  /**
   * @tag mac-radio
   * @summary macOS 风格的单选按钮组件。
   *
   * @slot children - 单选按钮的标签。
   *
   * @event mac-change - 选中状态变化时触发（非组内时）。`detail: { value, checked }`
   */

  interface Props {
    /** 单选按钮的值。 */
    value?: string
    /** 单选按钮是否选中。 */
    checked?: boolean
    /** 单选按钮默认是否选中（非受控）。 */
    defaultChecked?: boolean
    /** 禁用单选按钮。 */
    disabled?: boolean
    /** 单选按钮的标签文本。 */
    label?: string
    /** 单选按钮的尺寸。 */
    size?: MacSize
    /** 组件级主题覆盖。 */
    theme?: MacTheme
    /** 单选按钮的标签内容（对应 Lit 版默认 slot）。 */
    children?: Snippet
    /** 其余属性透传。 */
    [key: string]: unknown
  }

  let {
    value = '',
    checked = $bindable(false),
    defaultChecked = false,
    disabled = false,
    label = '',
    size = undefined,
    theme = undefined,
    children,
    ...rest
  }: Props = $props()

  const config = useMacConfig()
  const group = useRadioGroup()
  const resolvedTheme = $derived(resolveTheme(theme, config))
  const resolvedSize = $derived(size ?? group?.size ?? config?.size ?? 'md')

  let root: HTMLDivElement | undefined = $state()

  function emit(name: string, detail?: unknown) {
    root?.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }))
  }

  // 非受控默认值
  $effect(() => {
    if (!group && defaultChecked) {
      checked = true
    }
  })

  const isChecked = $derived(group ? group.value === value : checked)
  const effectiveDisabled = $derived(disabled || (group?.disabled ?? false))

  function handleClick() {
    if (effectiveDisabled) return
    if (isChecked) return // 单选按钮无法通过点击取消选中

    if (group) {
      group.selectValue(value)
    } else {
      checked = true
      emit('mac-change', { value, checked: true })
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      handleClick()
    }
  }
</script>

<div
  bind:this={root}
  {...rest}
  class="mac-scope mac-radio radio {isChecked ? 'radio--checked' : ''} {effectiveDisabled
    ? 'radio--disabled'
    : ''}"
  tabindex={effectiveDisabled ? -1 : 0}
  role="radio"
  aria-checked={isChecked}
  data-theme={resolvedTheme}
  data-size={resolvedSize}
  onclick={handleClick}
  onkeydown={handleKeydown}
>
  <span class="control"></span>
  {#if label}
    <span class="label">{label}</span>
  {:else}
    <span class="label">{#if children}{@render children()}{/if}</span>
  {/if}
</div>

<style>
  .mac-radio {
    display: inline-flex;
  }

  .radio {
    display: inline-flex;
    align-items: center;
    gap: var(--md-radio-gap);
    cursor: pointer;
    user-select: none;
    transition: opacity var(--md-transition-fast);
    --md-radio-size: 18px;
    --md-radio-dot-size: 8px;
    --md-radio-gap: 8px;
    --md-radio-font-size: var(--md-font-size-base);
  }

  .mac-radio[data-size='sm'] .radio {
    --md-radio-size: 14px;
    --md-radio-dot-size: 6px;
    --md-radio-gap: 6px;
    --md-radio-font-size: var(--md-font-size-sm);
  }

  .mac-radio[data-size='lg'] .radio {
    --md-radio-size: 22px;
    --md-radio-dot-size: 10px;
    --md-radio-gap: 10px;
    --md-radio-font-size: var(--md-font-size-lg);
  }

  .radio--disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  /* 控制 */
  .control {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: var(--md-radio-size);
    height: var(--md-radio-size);
    border-radius: 50%;
    border: 2px solid var(--md-radio-border-color);
    background: var(--md-radio-bg);
    transition:
      border-color var(--md-transition-fast),
      background var(--md-transition-fast);
  }

  .radio:hover:not(.radio--disabled) .control {
    border-color: var(--md-radio-border-hover-color);
  }

  .radio--checked .control {
    border-color: var(--md-radio-border-active-color);
    background: var(--md-radio-bg-active);
  }

  .radio--checked:hover:not(.radio--disabled) .control {
    border-color: var(--md-radio-border-active-hover-color);
  }

  /* 内部圆点 */
  .control::after {
    content: '';
    width: var(--md-radio-dot-size);
    height: var(--md-radio-dot-size);
    border-radius: 50%;
    background: var(--md-radio-dot-color);
    transform: scale(0);
    transition: transform var(--md-transition-fast);
  }

  .radio--checked .control::after {
    transform: scale(1);
  }

  /* 聚焦 */
  .radio:focus-visible .control {
    outline: 2px solid var(--md-color-primary);
    outline-offset: 2px;
  }

  /* 标签 */
  .label {
    font-size: var(--md-radio-font-size);
    color: var(--md-radio-label-color);
    transition: color var(--md-transition-fast);
  }

  .radio:hover:not(.radio--disabled) .label {
    color: var(--md-radio-label-hover-color);
  }
</style>
