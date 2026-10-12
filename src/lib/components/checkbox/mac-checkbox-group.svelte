<script lang="ts">
  import type { Snippet } from 'svelte'
  import {
    useMacConfig,
    resolveTheme,
    type MacSize,
    type MacTheme,
  } from '../../internal/config.svelte'
  import MacCheckbox from './mac-checkbox.svelte'
  import { provideCheckboxGroup } from './checkbox-context.svelte'

  /**
   * @tag mac-checkbox-group
   * @summary macOS 风格的复选框组组件。
   *
   * @slot children - 用于放置 MacCheckbox 的默认内容。
   *
   * @event mac-change - 选中值变化时触发。`detail: { value: string[] }`
   */

  export interface CheckboxOption {
    value: string
    label: string
    disabled?: boolean
  }

  interface Props {
    /** 组的值（受控模式）。 */
    value?: string[]
    /** 默认值（非受控模式）。 */
    defaultValue?: string[]
    /** 复选框的 name 属性。 */
    name?: string
    /** 组的尺寸。 */
    size?: MacSize
    /** 禁用组内所有复选框。 */
    disabled?: boolean
    /** 布局方向。 */
    direction?: 'horizontal' | 'vertical'
    /** 简化用法时的选项数组。 */
    options?: CheckboxOption[]
    /** 最大可选数量。 */
    max?: number
    /** 组件级主题覆盖。 */
    theme?: MacTheme
    /** 组内容（对应 Lit 版默认 slot）。 */
    children?: Snippet
    /** 其余属性透传。 */
    [key: string]: unknown
  }

  let {
    value = $bindable(undefined),
    defaultValue = [],
    name = '',
    size = undefined,
    disabled = false,
    direction = 'horizontal',
    options = undefined,
    max = undefined,
    theme = undefined,
    children,
    ...rest
  }: Props = $props()

  const config = useMacConfig()
  const resolvedTheme = $derived(resolveTheme(theme, config))
  const resolvedSize = $derived(size ?? config?.size ?? 'md')

  let root: HTMLDivElement | undefined = $state()
  let internalValue = $state<string[]>([])
  let initialized = false

  function emit(name_: string, detail?: unknown) {
    root?.dispatchEvent(new CustomEvent(name_, { bubbles: true, composed: true, detail }))
  }

  // 非受控模式：defaultValue 作为初始值（仅初始化一次）
  $effect(() => {
    if (!initialized) {
      initialized = true
      if (value === undefined && defaultValue.length > 0) {
        internalValue = [...defaultValue]
      }
    }
  })

  /** 当前生效值：受控 value > 非受控 internalValue。 */
  const resolvedValue = $derived(value ?? internalValue)

  provideCheckboxGroup({
    get value() {
      return resolvedValue
    },
    get size() {
      return size
    },
    get disabled() {
      return disabled
    },
    toggleValue,
  })

  function toggleValue(val: string, checked: boolean) {
    let newValue: string[]
    if (checked) {
      if (max && resolvedValue.length >= max) {
        return
      }
      newValue = [...resolvedValue, val]
    } else {
      newValue = resolvedValue.filter((v) => v !== val)
    }

    if (value !== undefined) {
      value = newValue
    } else {
      internalValue = newValue
    }
    emit('mac-change', { value: newValue })
  }
</script>

<div
  bind:this={root}
  {...rest}
  class="mac-scope mac-checkbox-group group group--{direction}"
  role="group"
  aria-disabled={disabled}
  data-theme={resolvedTheme}
  data-size={resolvedSize}
>
  {#if options}
    {#each options as option (option.value)}
      <MacCheckbox
        value={option.value}
        label={option.label}
        disabled={option.disabled || disabled}
        {size}
      />
    {/each}
  {:else if children}
    {@render children()}
  {/if}
</div>

<style>
  .mac-checkbox-group {
    display: block;
  }

  .group {
    display: flex;
    flex-wrap: wrap;
    gap: var(--md-checkbox-group-gap);
  }

  .group--vertical {
    flex-direction: column;
  }

  .group--horizontal {
    flex-direction: row;
    align-items: center;
  }
</style>
