<script lang="ts">
  import type { Snippet } from 'svelte'
  import {
    useMacConfig,
    resolveTheme,
    type MacSize,
    type MacTheme,
  } from '../../internal/config.svelte'
  import { useCheckboxGroup } from './checkbox-context.svelte'

  /**
   * @tag mac-checkbox
   * @summary macOS 风格的复选框组件。
   *
   * @slot children - 复选框的标签。
   *
   * @event mac-change - 选中状态变化时触发（非组内时）。`detail: { value, checked }`
   */

  interface Props {
    /** 复选框的值。 */
    value?: string
    /** 复选框是否被选中。 */
    checked?: boolean
    /** 复选框默认是否被选中（非受控模式）。 */
    defaultChecked?: boolean
    /** 复选框是否处于半选状态。 */
    indeterminate?: boolean
    /** 禁用复选框。 */
    disabled?: boolean
    /** 复选框的标签文本。 */
    label?: string
    /** 复选框的尺寸。 */
    size?: MacSize
    /** 组件级主题覆盖。 */
    theme?: MacTheme
    /** 复选框的标签内容（对应 Lit 版默认 slot）。 */
    children?: Snippet
    /** 其余属性透传。 */
    [key: string]: unknown
  }

  let {
    value = '',
    checked = $bindable(false),
    defaultChecked = false,
    indeterminate = $bindable(false),
    disabled = false,
    label = '',
    size = undefined,
    theme = undefined,
    children,
    ...rest
  }: Props = $props()

  const config = useMacConfig()
  const group = useCheckboxGroup()
  const resolvedTheme = $derived(resolveTheme(theme, config))
  const resolvedSize = $derived(size ?? group?.size ?? config?.size ?? 'md')

  let root: HTMLDivElement | undefined = $state()

  function emit(name: string, detail?: unknown) {
    root?.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }))
  }

  // 非受控默认值：挂载时应用 defaultChecked
  $effect(() => {
    if (!group && defaultChecked) {
      checked = true
    }
  })

  const isChecked = $derived(group ? group.value.includes(value) : checked)
  const isIndeterminate = $derived(indeterminate && !isChecked)
  const effectiveDisabled = $derived(disabled || (group?.disabled ?? false))

  function handleClick() {
    if (effectiveDisabled) return
    const newChecked = !isChecked

    if (group) {
      group.toggleValue(value, newChecked)
    } else {
      checked = newChecked
      indeterminate = false
      emit('mac-change', { value, checked: newChecked })
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
  class="mac-scope mac-checkbox checkbox {isChecked ? 'checkbox--checked' : ''} {isIndeterminate
    ? 'checkbox--indeterminate'
    : ''} {effectiveDisabled ? 'checkbox--disabled' : ''}"
  tabindex={effectiveDisabled ? -1 : 0}
  role="checkbox"
  aria-checked={isIndeterminate ? 'mixed' : isChecked}
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
  .mac-checkbox {
    display: inline-flex;
  }

  .checkbox {
    display: inline-flex;
    align-items: center;
    gap: var(--md-checkbox-gap);
    cursor: pointer;
    user-select: none;
    transition: opacity var(--md-transition-fast);
    --md-checkbox-size: 18px;
    --md-checkbox-gap: 8px;
    --md-checkbox-font-size: var(--md-font-size-base);
    --md-checkbox-radius: 4px;
  }

  .mac-checkbox[data-size='sm'] .checkbox {
    --md-checkbox-size: 14px;
    --md-checkbox-gap: 6px;
    --md-checkbox-font-size: var(--md-font-size-sm);
    --md-checkbox-radius: 3px;
  }

  .mac-checkbox[data-size='lg'] .checkbox {
    --md-checkbox-size: 22px;
    --md-checkbox-gap: 10px;
    --md-checkbox-font-size: var(--md-font-size-lg);
    --md-checkbox-radius: 5px;
  }

  .checkbox--disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  /* 控制框 */
  .control {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: var(--md-checkbox-size);
    height: var(--md-checkbox-size);
    border-radius: var(--md-checkbox-radius);
    border: 2px solid var(--md-checkbox-border-color);
    background: var(--md-checkbox-bg);
    transition:
      border-color var(--md-transition-fast),
      background var(--md-transition-fast);
  }

  .checkbox:hover:not(.checkbox--disabled) .control {
    border-color: var(--md-checkbox-border-hover-color);
  }

  .checkbox--checked .control,
  .checkbox--indeterminate .control {
    border-color: var(--md-checkbox-border-active-color);
    background: var(--md-checkbox-bg-active);
  }

  .checkbox--checked:hover:not(.checkbox--disabled) .control,
  .checkbox--indeterminate:hover:not(.checkbox--disabled) .control {
    border-color: var(--md-checkbox-border-active-hover-color);
  }

  /* 对勾标记 */
  .control::after {
    content: '';
    position: absolute;
    width: 55%;
    height: 30%;
    border-left: 2px solid var(--md-checkbox-check-color);
    border-bottom: 2px solid var(--md-checkbox-check-color);
    transform: rotate(-45deg) scale(0);
    margin-top: -1px;
    transition: transform var(--md-transition-fast);
  }

  .checkbox--checked .control::after {
    transform: rotate(-45deg) scale(1);
  }

  /* 半选横线 */
  .control::before {
    content: '';
    position: absolute;
    width: 60%;
    height: 2px;
    background: var(--md-checkbox-check-color);
    transform: scaleX(0);
    transition: transform var(--md-transition-fast);
  }

  .checkbox--indeterminate .control::before {
    transform: scaleX(1);
  }

  .checkbox--indeterminate .control::after {
    transform: rotate(-45deg) scale(0);
  }

  /* 聚焦 */
  .checkbox:focus-visible .control {
    outline: 2px solid var(--md-color-primary);
    outline-offset: 2px;
  }

  /* 标签 */
  .label {
    font-size: var(--md-checkbox-font-size);
    color: var(--md-checkbox-label-color);
    transition: color var(--md-transition-fast);
  }

  .checkbox:hover:not(.checkbox--disabled) .label {
    color: var(--md-checkbox-label-hover-color);
  }
</style>
