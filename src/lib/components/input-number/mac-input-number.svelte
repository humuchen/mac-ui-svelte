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
   * @tag mac-input-number
   * @summary macOS 风格的数字输入组件。
   *
   * @slot prefix - 输入框前的内容。
   * @slot suffix - 输入框后的内容。
   *
   * @event mac-input-number - 值变化时触发（输入/步进/清除）。`detail: { value }`
   * @event mac-change - 提交变化时触发（失焦/步进/清除）。`detail: { value }`
   * @event mac-focus - 聚焦时触发。
   * @event mac-blur - 失焦时触发。
   */

  export type InputNumberVariant = 'default' | 'filled' | 'glass' | 'underline'

  interface Props {
    /** 输入框的值。 */
    value?: number
    /** 非受控模式的默认值。 */
    defaultValue?: number
    /** 最小值。 */
    min?: number
    /** 最大值。 */
    max?: number
    /** 步进值。 */
    step?: number
    /** 精度（小数位数）。 */
    precision?: number
    /** 输入框的占位符。 */
    placeholder?: string
    /** 输入框的尺寸。 */
    size?: MacSize
    /** 视觉变体。 */
    variant?: InputNumberVariant
    /** 输入框的状态。 */
    status?: 'error' | 'warning' | 'success'
    /** 禁用输入框。 */
    disabled?: boolean
    /** 使输入框只读。 */
    readonly?: boolean
    /** 显示步进按钮。 */
    showButton?: boolean
    /** 按钮位置。 */
    buttonPlacement?: 'inside' | 'outside'
    /** 显示清除按钮。 */
    clearable?: boolean
    /** 输入框的名称（用于表单）。 */
    name?: string
    /** 启用键盘控制（方向键、Page Up/Down）。 */
    keyboard?: boolean
    /** 组件级主题覆盖。 */
    theme?: MacTheme
    /** 输入框前内容。 */
    prefix?: Snippet
    /** 输入框后内容。 */
    suffix?: Snippet
    /** 其余属性透传。 */
    [key: string]: unknown
  }

  let {
    value = $bindable(undefined),
    defaultValue = undefined,
    min = undefined,
    max = undefined,
    step = 1,
    precision = undefined,
    placeholder = '',
    size = undefined,
    variant = 'default',
    status = undefined,
    disabled = false,
    readonly = false,
    showButton = true,
    buttonPlacement = 'inside',
    clearable = false,
    name = '',
    keyboard = true,
    theme = undefined,
    prefix,
    suffix,
    ...rest
  }: Props = $props()

  const config = useMacConfig()
  const resolvedSize = $derived(resolveSize(size, config))
  const resolvedTheme = $derived(resolveTheme(theme, config))

  let root: HTMLDivElement | undefined = $state()
  let inputEl: HTMLInputElement | undefined = $state()
  let displayValue = $state('')
  let hasFocus = $state(false)

  /** 非受控初始化：value 未提供时使用 defaultValue。 */
  $effect(() => {
    if (value === undefined && defaultValue !== undefined) {
      value = defaultValue
    }
  })

  // 值变化时同步显示文本（跳过 typing 中间态，由 same-value 判断保证）
  $effect(() => {
    void value
    displayValue = value !== undefined && value !== null ? formatValue(value) : ''
  })

  function emit(name: string, detail?: unknown) {
    root?.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }))
  }

  function formatValue(val: number): string {
    if (precision !== undefined && precision >= 0) {
      return val.toFixed(precision)
    }
    return String(val)
  }

  function parseValue(str: string): number | undefined {
    const trimmed = str.trim()
    if (trimmed === '' || trimmed === '-') return undefined
    const num = Number(trimmed)
    return Number.isNaN(num) ? undefined : num
  }

  function clampAndRound(val: number): number {
    let result = val
    if (min !== undefined) result = Math.max(min, result)
    if (max !== undefined) result = Math.min(max, result)
    if (precision !== undefined && precision >= 0) {
      const factor = Math.pow(10, precision)
      result = Math.round(result * factor) / factor
    }
    return result
  }

  function stepValue(direction: number) {
    if (disabled || readonly) return
    const current = value ?? 0
    const newVal = clampAndRound(current + direction * step)
    setValue(newVal)
    emit('mac-change', { value: newVal })
  }

  function setValue(val: number | undefined) {
    value = val
    emit('mac-input-number', { value: val })
  }

  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement
    const raw = target.value

    // 输入时允许空值、减号和小数点
    if (raw === '' || raw === '-' || raw === '-.') {
      displayValue = raw
      setValue(undefined)
      return
    }

    const num = parseValue(raw)
    if (num !== undefined) {
      const clamped = clampAndRound(num)
      setValue(clamped)
    }
  }

  function handleChange() {
    const num = parseValue(displayValue)
    if (num !== undefined) {
      const clamped = clampAndRound(num)
      if (clamped !== num) {
        setValue(clamped)
      }
    }
    emit('mac-change', { value })
  }

  function handleFocus() {
    hasFocus = true
    emit('mac-focus')
  }

  function handleBlur() {
    hasFocus = false
    handleChange()
    emit('mac-blur')
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!keyboard || disabled || readonly) return

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault()
        stepValue(1)
        break
      case 'ArrowDown':
        e.preventDefault()
        stepValue(-1)
        break
      case 'PageUp':
        e.preventDefault()
        stepValue(10)
        break
      case 'PageDown':
        e.preventDefault()
        stepValue(-10)
        break
      case 'Home':
        if (min !== undefined) {
          e.preventDefault()
          setValue(min)
          emit('mac-change', { value: min })
        }
        break
      case 'End':
        if (max !== undefined) {
          e.preventDefault()
          setValue(max)
          emit('mac-change', { value: max })
        }
        break
    }
  }

  function clearInput() {
    setValue(undefined)
    displayValue = ''
    if (inputEl) {
      inputEl.value = ''
      inputEl.focus()
    }
    emit('mac-change', { value: undefined })
  }

  /** 设置输入框焦点。 */
  export function focus() {
    inputEl?.focus()
  }

  /** 移除输入框焦点。 */
  export function blur() {
    inputEl?.blur()
  }

  const isPlusDisabled = $derived(disabled || (max !== undefined && (value ?? 0) >= max))
  const isMinusDisabled = $derived(disabled || (min !== undefined && (value ?? 0) <= min))
  const showClearButton = $derived(clearable && value !== undefined && !disabled)
</script>

<div
  bind:this={root}
  {...rest}
  class="mac-scope mac-input-number input-wrapper"
  data-theme={resolvedTheme}
  data-size={resolvedSize}
>
  <div
    class="input-container
      input-container--{variant}
      input-container--{resolvedSize}
      {status === 'error' ? 'input-container--error' : ''}
      {status === 'success' ? 'input-container--success' : ''}
      {status === 'warning' ? 'input-container--warning' : ''}
      {disabled ? 'input-container--disabled' : ''}"
  >
    {#if prefix}<span class="slot-side">{@render prefix()}</span>{/if}
    <input
      bind:this={inputEl}
      id="input"
      class="input"
      type="text"
      inputmode="decimal"
      {placeholder}
      value={displayValue}
      {disabled}
      {readonly}
      {name}
      oninput={handleInput}
      onchange={handleChange}
      onfocus={handleFocus}
      onblur={handleBlur}
      onkeydown={handleKeydown}
    />
    {#if showClearButton}
      <button class="clear-button" type="button" onclick={clearInput} tabindex="-1">✕</button>
    {/if}
    {#if showButton && buttonPlacement === 'inside'}
      <div class="buttons">
        <button
          class="button-step button-step--plus"
          type="button"
          disabled={isPlusDisabled}
          tabindex="-1"
          onclick={() => stepValue(1)}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
        <button
          class="button-step"
          type="button"
          disabled={isMinusDisabled}
          tabindex="-1"
          onclick={() => stepValue(-1)}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M5 12h14" />
          </svg>
        </button>
      </div>
    {/if}
    {#if suffix}<span class="slot-side">{@render suffix()}</span>{/if}
  </div>
  {#if showButton && buttonPlacement === 'outside'}
    <div style="display:flex;align-items:center;margin-top:var(--md-spacing-xs);">
      <div class="buttons buttons--outside">
        <button
          class="button-step button-step--plus"
          type="button"
          disabled={isPlusDisabled}
          tabindex="-1"
          onclick={() => stepValue(1)}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
        <button
          class="button-step"
          type="button"
          disabled={isMinusDisabled}
          tabindex="-1"
          onclick={() => stepValue(-1)}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M5 12h14" />
          </svg>
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .mac-input-number {
    display: block;
  }

  .input-wrapper {
    display: flex;
    flex-direction: column;
    gap: var(--md-spacing-xs);
  }

  .input-container {
    position: relative;
    display: flex;
    align-items: center;
    border-radius: var(--md-radius-md);
    background-color: var(--md-color-bg);
    transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
  }

  .input-container--default {
    border: 1px solid var(--md-color-border);
  }

  .input-container--filled {
    border: none;
    background: rgba(0, 0, 0, 0.03);
  }

  .input-container--glass {
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(10px) saturate(180%);
    -webkit-backdrop-filter: blur(10px) saturate(180%);
  }

  .input-container--underline {
    border: none;
    border-bottom: 2px solid var(--md-color-border);
    border-radius: 0;
    background: transparent;
  }

  /* 聚焦状态 */
  .input-container--default:focus-within {
    border-color: var(--md-color-primary);
    box-shadow:
      0 0 0 3px rgba(0, 122, 255, 0.1),
      0 2px 8px rgba(0, 122, 255, 0.08);
  }

  .input-container--filled:focus-within {
    background: rgba(0, 0, 0, 0.05);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .input-container--glass:focus-within {
    border-color: rgba(0, 122, 255, 0.5);
    background: rgba(255, 255, 255, 0.12);
    box-shadow:
      0 0 0 3px rgba(0, 122, 255, 0.15),
      0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .input-container--underline:focus-within {
    border-bottom-color: var(--md-color-primary);
    box-shadow: none;
  }

  /* 错误状态 */
  .input-container--error.input-container--default {
    border-color: var(--md-color-danger);
  }

  .input-container--error.input-container--default:focus-within {
    box-shadow:
      0 0 0 3px rgba(255, 59, 48, 0.1),
      0 2px 8px rgba(255, 59, 48, 0.08);
  }

  .input-container--error.input-container--underline {
    border-bottom-color: var(--md-color-danger);
  }

  /* 成功状态 */
  .input-container--success.input-container--default {
    border-color: var(--md-color-success);
  }

  .input-container--success.input-container--default:focus-within {
    box-shadow:
      0 0 0 3px rgba(52, 199, 89, 0.1),
      0 2px 8px rgba(52, 199, 89, 0.08);
  }

  .input-container--success.input-container--underline {
    border-bottom-color: var(--md-color-success);
  }

  /* 警告状态 */
  .input-container--warning.input-container--default {
    border-color: var(--md-color-warning);
  }

  .input-container--warning.input-container--default:focus-within {
    box-shadow:
      0 0 0 3px rgba(245, 158, 11, 0.1),
      0 2px 8px rgba(245, 158, 11, 0.08);
  }

  .input-container--warning.input-container--underline {
    border-bottom-color: var(--md-color-warning);
  }

  /* 禁用状态 */
  .input-container--disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background-color: var(--md-color-bg-secondary);
  }

  /* 输入框 */
  .input {
    flex: 1;
    border: none;
    outline: none;
    padding: var(--md-input-padding-vertical) var(--md-input-padding-horizontal);
    font-size: var(--md-input-font-size);
    font-family: inherit;
    color: var(--md-color-text);
    background: transparent;
    min-width: 0;
    text-align: left;
  }

  .input::placeholder {
    color: var(--md-color-text-secondary);
    transition: opacity 200ms;
  }

  .input:focus::placeholder {
    opacity: 0.6;
  }

  .input:disabled {
    cursor: not-allowed;
  }

  /* 插槽（prefix/suffix snippet 内容） */
  .slot-side {
    display: flex;
    align-items: center;
    padding: 0 var(--md-spacing-sm);
    color: var(--md-color-text-secondary);
  }

  /* 步进按钮 */
  .buttons {
    display: flex;
    flex-direction: column;
    border-left: 1px solid var(--md-color-border);
    height: 100%;
    min-height: 28px;
  }

  .button-step {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    width: 24px;
    border: none;
    background: transparent;
    cursor: pointer;
    color: var(--md-color-text-secondary);
    padding: 0;
    transition: all 150ms;
  }

  .button-step:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.04);
    color: var(--md-color-text);
  }

  .button-step:active:not(:disabled) {
    background: rgba(0, 0, 0, 0.08);
  }

  .button-step:disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }

  .button-step :global(svg),
  .button-step svg {
    width: 10px;
    height: 10px;
  }

  .button-step--plus {
    border-bottom: 1px solid var(--md-color-border);
  }

  /* 外部按钮 */
  .buttons--outside {
    flex-direction: row;
    border-left: none;
    gap: var(--md-spacing-xs);
    padding: 0 var(--md-spacing-xs);
  }

  .buttons--outside .button-step {
    width: 28px;
    height: 28px;
    border-radius: var(--md-radius-sm);
    background: var(--md-color-bg-secondary);
    border: 1px solid var(--md-color-border);
  }

  .buttons--outside .button-step:hover:not(:disabled) {
    background: var(--md-color-bg);
    border-color: var(--md-color-primary);
    color: var(--md-color-primary);
  }

  .buttons--outside .button-step--plus {
    border-bottom: 1px solid var(--md-color-border);
  }

  /* 清除按钮 */
  .clear-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    margin-right: var(--md-spacing-sm);
    border: none;
    background: rgba(0, 0, 0, 0.06);
    border-radius: 50%;
    cursor: pointer;
    color: var(--md-color-text-secondary);
    font-size: 12px;
    transition: all 200ms;
    padding: 0;
  }

  .clear-button:hover {
    background: rgba(0, 0, 0, 0.1);
    color: var(--md-color-text);
  }

  /* 尺寸 */
  .input-container--sm .input {
    padding: var(--sm-input-padding-vertical) var(--sm-input-padding-horizontal);
    font-size: var(--sm-input-font-size);
  }

  .input-container--lg .input {
    padding: var(--lg-input-padding-vertical) var(--lg-input-padding-horizontal);
    font-size: var(--lg-input-font-size);
  }

  .input-container--sm .buttons {
    min-height: 24px;
  }

  .input-container--sm .button-step {
    width: 20px;
  }

  .input-container--lg .buttons {
    min-height: 36px;
  }

  .input-container--lg .button-step {
    width: 28px;
  }

  .mac-input-number[data-theme='dark'] .input-container--filled {
    background: rgba(255, 255, 255, 0.05);
  }

  .mac-input-number[data-theme='dark'] .input-container--filled:focus-within {
    background: rgba(255, 255, 255, 0.08);
  }

  .mac-input-number[data-theme='dark'] .input-container--glass {
    background: rgba(255, 255, 255, 0.05);
  }

  .mac-input-number[data-theme='dark'] .input-container--glass:focus-within {
    background: rgba(255, 255, 255, 0.08);
  }

  .mac-input-number[data-theme='dark'] .button-step:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.08);
  }

  .mac-input-number[data-theme='dark'] .button-step:active:not(:disabled) {
    background: rgba(255, 255, 255, 0.12);
  }

  .mac-input-number[data-theme='dark'] .buttons--outside .button-step {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .mac-input-number[data-theme='dark'] .clear-button {
    background: rgba(255, 255, 255, 0.1);
  }

  .mac-input-number[data-theme='dark'] .clear-button:hover {
    background: rgba(255, 255, 255, 0.15);
  }
</style>
