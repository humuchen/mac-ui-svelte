<script lang="ts">
  import type { Snippet } from 'svelte'
  import {
    useMacConfig,
    resolveTheme,
    type MacSize,
    type MacTheme,
  } from '../../internal/config.svelte'
  import MacRadio from './mac-radio.svelte'
  import { provideRadioGroup } from './radio-context.svelte'

  /**
   * @tag mac-radio-group
   * @summary macOS 风格的单选按钮组组件。
   *
   * @slot children - 用于放置 MacRadio 的默认内容。
   *
   * @event mac-change - 选中值变化时触发。`detail: { value: string }`
   */

  import type { RadioOption } from './radio-types'

  interface Props {
    /** 组的值（受控）。 */
    value?: string
    /** 默认值（非受控）。 */
    defaultValue?: string
    /** 单选按钮 name 属性。 */
    name?: string
    /** 组的尺寸。 */
    size?: MacSize
    /** 禁用组内所有单选按钮。 */
    disabled?: boolean
    /** 布局方向。 */
    direction?: 'horizontal' | 'vertical'
    /** 简化使用的选项数组。 */
    options?: RadioOption[]
    /** 组件级主题覆盖。 */
    theme?: MacTheme
    /** 组内容（对应 Lit 版默认 slot）。 */
    children?: Snippet
    /** 其余属性透传。 */
    [key: string]: unknown
  }

  let {
    value = $bindable(undefined),
    defaultValue = undefined,
    name = '',
    size = undefined,
    disabled = false,
    direction = 'horizontal',
    options = undefined,
    theme = undefined,
    children,
    ...rest
  }: Props = $props()

  const config = useMacConfig()
  const resolvedTheme = $derived(resolveTheme(theme, config))
  const resolvedSize = $derived(size ?? config?.size ?? 'md')

  let root: HTMLDivElement | undefined = $state()
  let internalValue = $state<string | undefined>(undefined)
  let initialized = false

  function emit(name_: string, detail?: unknown) {
    root?.dispatchEvent(new CustomEvent(name_, { bubbles: true, composed: true, detail }))
  }

  // 非受控模式：defaultValue 作为初始值（仅初始化一次）
  $effect(() => {
    if (!initialized) {
      initialized = true
      if (value === undefined && defaultValue !== undefined) {
        internalValue = defaultValue
      }
    }
  })

  const resolvedValue = $derived(value ?? internalValue)

  provideRadioGroup({
    get value() {
      return resolvedValue
    },
    get size() {
      return size
    },
    get disabled() {
      return disabled
    },
    selectValue,
  })

  function selectValue(val: string) {
    if (value !== undefined) {
      value = val
    } else {
      internalValue = val
    }
    emit('mac-change', { value: val })
  }
</script>

<div
  bind:this={root}
  {...rest}
  class="mac-scope mac-radio-group group group--{direction}"
  role="radiogroup"
  aria-disabled={disabled}
  data-theme={resolvedTheme}
  data-size={resolvedSize}
>
  {#if options}
    {#each options as option (option.value)}
      <MacRadio
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
  .mac-radio-group {
    display: block;
  }

  .group {
    display: flex;
    flex-wrap: wrap;
    gap: var(--md-radio-group-gap);
  }

  .group--vertical {
    flex-direction: column;
  }

  .group--horizontal {
    flex-direction: row;
    align-items: center;
  }
</style>
