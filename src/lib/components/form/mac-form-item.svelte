<script lang="ts">
  import type { Snippet } from 'svelte'
  import {
    useMacConfig,
    resolveSize,
    resolveTheme,
    type MacSize,
    type MacTheme,
  } from '../../internal/config.svelte'
  import { useFormContext } from './form-context.svelte'
  import type { FormRule } from './mac-form.svelte'

  /**
   * @tag mac-form-item
   * @summary MacForm 的表单项，提供标签、验证与错误反馈。
   *
   * @slot children - 表单控件。
   *
   * @event mac-change - 值变化时触发（由控件事件转发）。
   */

  interface Props {
    /** 字段路径（对应 form model 的键）。 */
    path?: string
    /** 标签文本。 */
    label?: string
    /** 是否必填（显示必填标记并隐式添加 required 规则）。 */
    required?: boolean
    /** 字段级验证规则。 */
    rule?: FormRule | FormRule[]
    /** 覆盖 form 级 showLabel。 */
    showLabel?: boolean
    /** 覆盖 form 级 showFeedback。 */
    showFeedback?: boolean
    /** 表单项尺寸。 */
    size?: MacSize
    /** 禁用表单项。 */
    disabled?: boolean
    /** 组件级主题覆盖。 */
    theme?: MacTheme
    /** 表单控件（对应 Lit 版默认 slot）。 */
    children?: Snippet
    /** 其余属性透传。 */
    [key: string]: unknown
  }

  let {
    path = '',
    label = '',
    required = false,
    rule = undefined,
    showLabel = undefined,
    showFeedback = undefined,
    size = undefined,
    disabled = false,
    theme = undefined,
    children,
    ...rest
  }: Props = $props()

  const config = useMacConfig()
  const form = useFormContext()
  const resolvedSize = $derived(size ?? form?.size ?? config?.size ?? 'md')
  const resolvedTheme = $derived(resolveTheme(theme, config))

  let root: HTMLDivElement | undefined = $state()
  let contentEl: HTMLDivElement | undefined = $state()
  let errorMessage = $state('')

  function emit(name: string, detail?: unknown) {
    root?.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }))
  }

  const resolvedRules = $derived.by(() => {
    const rules: FormRule[] = []
    if (required) {
      rules.push({ required: true, message: `${label || path} 是必填项` })
    }
    if (rule) {
      rules.push(...(Array.isArray(rule) ? rule : [rule]))
    }
    if (form && path) {
      rules.push(...form.getRules(path))
    }
    return rules
  })

  const effShowLabel = $derived(showLabel ?? form?.showLabel ?? true)
  const effShowFeedback = $derived(showFeedback ?? form?.showFeedback ?? true)
  const labelAlign = $derived(form?.labelAlign ?? 'right')
  const isTop = $derived(labelAlign === 'top')

  function getValue(): unknown {
    if (form && path) {
      return form.getValue(path)
    }
    return undefined
  }

  function updateValue(value: unknown) {
    if (form && path) {
      form.setValue(path, value)
      emit('mac-change', { path, value })
    }
  }

  // 监听控件事件（mac-input / mac-change / mac-blur 冒泡到内容容器）
  $effect(() => {
    if (!contentEl) return
    const handleChange = (e: Event) => {
      const value = (e as CustomEvent).detail?.value
      updateValue(value)
      validate('change')
    }
    const handleInput = (e: Event) => {
      const value = (e as CustomEvent).detail?.value
      updateValue(value)
      validate('input')
    }
    const handleBlur = () => {
      validate('blur')
    }
    contentEl.addEventListener('mac-change', handleChange)
    contentEl.addEventListener('mac-input', handleInput)
    contentEl.addEventListener('mac-blur', handleBlur)
    return () => {
      contentEl?.removeEventListener('mac-change', handleChange)
      contentEl?.removeEventListener('mac-input', handleInput)
      contentEl?.removeEventListener('mac-blur', handleBlur)
    }
  })

  function checkType(value: unknown, type: string): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string'
      case 'number':
        return typeof value === 'number'
      case 'boolean':
        return typeof value === 'boolean'
      case 'array':
        return Array.isArray(value)
      case 'email':
        return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      case 'url':
        return typeof value === 'string' && /^https?:\/\/.+/.test(value)
      case 'date':
        return value instanceof Date || !isNaN(Date.parse(String(value)))
      default:
        return true
    }
  }

  /** 验证表单项（对应 Lit 版 validate）。 */
  export async function validate(trigger?: 'blur' | 'change' | 'input'): Promise<boolean> {
    const rules = resolvedRules
    if (!rules || rules.length === 0) {
      errorMessage = ''
      return true
    }

    const value = getValue()

    for (const r of rules) {
      const triggers = Array.isArray(r.trigger) ? r.trigger : [r.trigger || 'change']
      if (trigger && !triggers.includes(trigger)) continue

      // required
      if (r.required) {
        const isEmpty =
          value === undefined ||
          value === null ||
          value === '' ||
          (Array.isArray(value) && value.length === 0)
        if (isEmpty) {
          errorMessage = r.message || `${label || path} 是必填项`
          return false
        }
      }

      // 空值且非必填时跳过其余检查
      if (
        value === undefined ||
        value === null ||
        value === '' ||
        (Array.isArray(value) && value.length === 0)
      ) {
        continue
      }

      // type
      if (r.type) {
        const valid = checkType(value, r.type)
        if (!valid) {
          errorMessage = r.message || `${label || path} 格式不正确`
          return false
        }
      }

      // min / max
      if (r.min !== undefined || r.max !== undefined) {
        const len =
          typeof value === 'string'
            ? value.length
            : Array.isArray(value)
              ? value.length
              : Number(value)
        if (r.min !== undefined && len < r.min) {
          errorMessage = r.message || `${label || path} 不能小于 ${r.min}`
          return false
        }
        if (r.max !== undefined && len > r.max) {
          errorMessage = r.message || `${label || path} 不能大于 ${r.max}`
          return false
        }
      }

      // len
      if (r.len !== undefined) {
        const len =
          typeof value === 'string'
            ? value.length
            : Array.isArray(value)
              ? value.length
              : Number(value)
        if (len !== r.len) {
          errorMessage = r.message || `${label || path} 长度必须为 ${r.len}`
          return false
        }
      }

      // pattern
      if (r.pattern && typeof value === 'string') {
        if (!r.pattern.test(value)) {
          errorMessage = r.message || `${label || path} 格式不正确`
          return false
        }
      }

      // validator
      if (r.validator) {
        try {
          const result = await r.validator(value)
          if (result !== true) {
            errorMessage =
              typeof result === 'string' ? result : r.message || `${label || path} 验证失败`
            return false
          }
        } catch {
          errorMessage = r.message || `${label || path} 验证失败`
          return false
        }
      }
    }

    errorMessage = ''
    return true
  }

  /** 重置验证状态。 */
  export function reset(): void {
    errorMessage = ''
  }

  // 向 form 注册验证器与重置处理器
  $effect(() => {
    if (!form) return
    const unregV = form.registerValidator(() => validate())
    const unregR = form.registerReset(reset)
    return () => {
      unregV()
      unregR()
    }
  })

  const hasRequired = $derived(required || resolvedRules.some((r) => r.required))
</script>

<div
  bind:this={root}
  {...rest}
  class="mac-scope mac-form-item form-item {isTop ? 'form-item--top' : ''}"
  data-theme={resolvedTheme}
  data-size={resolvedSize}
>
  {#if effShowLabel && label}
    <label class="form-item__label form-item__label--{labelAlign}">
      {#if hasRequired}<span class="required">*</span>{/if}
      {label}
    </label>
  {/if}
  <div class="form-item__content" bind:this={contentEl}>
    {#if children}{@render children()}{/if}
    {#if effShowFeedback && errorMessage}
      <div class="form-item__error">{errorMessage}</div>
    {/if}
  </div>
</div>

<style>
  .mac-form-item {
    display: block;
  }

  .form-item {
    display: flex;
    gap: var(--md-spacing-sm);
    align-items: flex-start;
  }

  .form-item--top {
    flex-direction: column;
    gap: var(--md-spacing-xs);
  }

  .form-item__label {
    font-size: var(--md-font-size-base);
    color: var(--md-color-text);
    line-height: 32px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .form-item__label--right {
    width: var(--md-form-label-width, 80px);
    text-align: var(--md-form-label-align, right);
  }

  .form-item__label--left {
    width: var(--md-form-label-width, 80px);
    text-align: left;
  }

  .form-item__label--top {
    width: auto;
    line-height: 1.5;
  }

  .required {
    color: var(--md-color-danger);
    margin-right: 2px;
  }

  .form-item__content {
    flex: 1;
    min-width: 0;
  }

  .form-item__error {
    margin-top: var(--md-spacing-xs);
    font-size: var(--md-font-size-sm);
    color: var(--md-color-danger);
    line-height: 1.4;
  }
</style>
