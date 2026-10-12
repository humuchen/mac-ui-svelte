<script lang="ts">
  import type { Snippet } from 'svelte'
  import {
    useMacConfig,
    resolveSize,
    resolveTheme,
    type MacSize,
    type MacTheme,
  } from '../../internal/config.svelte'
  import { provideFormContext } from './form-context.svelte'

  /**
   * @tag mac-form
   * @summary 一个表单组件，用于收集和验证用户输入。
   *
   * @slot children - 表单项和控件。
   *
   * @event mac-change - 字段值变化时触发。Detail: { model, path, value }
   * @event mac-submit - 表单提交时触发。Detail: { model }
   */

  import type { FormRule } from './form-types'

  interface Props {
    /** 表单数据模型。 */
    model?: Record<string, unknown>
    /** 验证规则。 */
    rules?: Record<string, FormRule | FormRule[]>
    /** 标签宽度。 */
    labelWidth?: string
    /** 标签对齐方式。 */
    labelAlign?: 'left' | 'right' | 'top'
    /** 是否显示标签。 */
    showLabel?: boolean
    /** 是否显示反馈（错误信息）。 */
    showFeedback?: boolean
    /** 表单尺寸。 */
    size?: MacSize
    /** 禁用所有表单项。 */
    disabled?: boolean
    /** 组件级主题覆盖。 */
    theme?: MacTheme
    /** 表单项内容（对应 Lit 版默认 slot）。 */
    children?: Snippet
    /** 其余属性透传。 */
    [key: string]: unknown
  }

  let {
    model = $bindable({}),
    rules = {},
    labelWidth = '80px',
    labelAlign = 'right',
    showLabel = true,
    showFeedback = true,
    size = undefined,
    disabled = false,
    theme = undefined,
    children,
    ...rest
  }: Props = $props()

  const config = useMacConfig()
  const resolvedSize = $derived(resolveSize(size, config))
  const resolvedTheme = $derived(resolveTheme(theme, config))

  let root: HTMLFormElement | undefined = $state()

  function emit(name: string, detail?: unknown) {
    root?.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }))
  }

  // 由 form-item 注册的验证函数集合
  const validators = new Set<() => Promise<boolean>>()
  const resetHandlers = new Set<() => void>()

  provideFormContext({
    getValue: (path) => model[path],
    setValue: (path, value) => {
      model = { ...model, [path]: value }
      emit('mac-change', { model, path, value })
    },
    getRules: (path) => {
      const r = rules[path]
      if (!r) return []
      return Array.isArray(r) ? r : [r]
    },
    get disabled() {
      return disabled
    },
    get size() {
      return size
    },
    get showLabel() {
      return showLabel
    },
    get showFeedback() {
      return showFeedback
    },
    get labelAlign() {
      return labelAlign
    },
    registerValidator(fn) {
      validators.add(fn)
      return () => validators.delete(fn)
    },
    registerReset(fn) {
      resetHandlers.add(fn)
      return () => resetHandlers.delete(fn)
    },
  })

  /** 注册表单项验证器（由 MacFormItem 调用）。 */
  export function registerValidator(fn: () => Promise<boolean>): () => void {
    validators.add(fn)
    return () => validators.delete(fn)
  }

  /** 验证所有表单项。 */
  export async function validate(): Promise<boolean> {
    const results = await Promise.all(Array.from(validators).map((fn) => fn()))
    return results.every((r) => r)
  }

  /** 重置所有表单项的验证状态。 */
  export function reset(): void {
    resetHandlers.forEach((fn) => fn())
  }

  /** 注册重置处理器（由 MacFormItem 调用）。 */
  export function registerReset(fn: () => void): () => void {
    resetHandlers.add(fn)
    return () => resetHandlers.delete(fn)
  }

  /** 清空表单模型。 */
  export function clear(): void {
    model = {}
    reset()
    emit('mac-change', { model, path: '', value: undefined })
  }

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    emit('mac-submit', { model })
  }
</script>

<form
  bind:this={root}
  {...rest}
  class="mac-scope mac-form form"
  onsubmit={handleSubmit}
  style="--md-form-label-width: {labelWidth}; --md-form-label-align: {labelAlign};"
  data-theme={resolvedTheme}
  data-size={resolvedSize}
>
  {#if children}{@render children()}{/if}
</form>

<style>
  .mac-form {
    display: block;
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: var(--md-form-gap, var(--md-spacing-md));
  }
</style>
