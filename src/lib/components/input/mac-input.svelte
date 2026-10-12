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
   * @tag mac-input
   * @summary macOS 风格的文本输入组件。
   *
   * @slot prefix - 输入框前的内容。
   * @slot suffix - 输入框后的内容。
   *
   * @event mac-input - 输入时触发。`detail: { value }`
   * @event mac-focus - 聚焦时触发。
   * @event mac-blur - 失焦时触发。
   */

  import type { InputVariant } from './input-types'

  interface Props {
    /** 输入框的值。 */
    value?: string
    /** 输入框的占位符。 */
    placeholder?: string
    /** 输入框的类型。 */
    type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url'
    /** 输入框的尺寸。 */
    size?: MacSize
    /** 视觉变体。 */
    variant?: InputVariant
    /** 输入框的标签。 */
    label?: string
    /** 显示必填指示器。 */
    required?: boolean
    /** 禁用输入框。 */
    disabled?: boolean
    /** 使输入框只读。 */
    readonly?: boolean
    /** 输入框的错误状态。 */
    error?: boolean
    /** 输入框的成功状态。 */
    success?: boolean
    /** 输入框的辅助文本。 */
    helperText?: string
    /** 输入框的名称（用于表单）。 */
    name?: string
    /** 显示清除按钮。 */
    clearable?: boolean
    /** 显示密码切换按钮。 */
    showPasswordToggle?: boolean
    /** 显示字符计数器。 */
    showCharCounter?: boolean
    /** 最大字符长度。 */
    maxLength?: number
    /** 显示加载状态。 */
    loading?: boolean
    /** 启用浮动标签。 */
    floating?: boolean
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
    value = $bindable(''),
    placeholder = '',
    type = 'text',
    size = undefined,
    variant = 'default',
    label = '',
    required = false,
    disabled = false,
    readonly = false,
    error = false,
    success = false,
    helperText = '',
    name = '',
    clearable = false,
    showPasswordToggle = false,
    showCharCounter = false,
    maxLength = undefined,
    loading = false,
    floating = false,
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
  let hasFocus = $state(false)
  let showPassword = $state(false)

  function emit(name: string, detail?: unknown) {
    root?.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }))
  }

  const showClearButton = $derived(
    clearable && !!value && !disabled && !readonly,
  )
  const showToggle = $derived(showPasswordToggle && type === 'password' && !disabled)
  const showCounter = $derived(showCharCounter && !!maxLength)
  const charCount = $derived((value ?? '').length)
  const isNearLimit = $derived(!!maxLength && charCount > maxLength * 0.8)
  const isOverLimit = $derived(!!maxLength && charCount > maxLength)
  const inputType = $derived(type === 'password' && showPassword ? 'text' : type)

  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement
    value = target.value
    emit('mac-input', { value })
  }

  function handleFocus() {
    hasFocus = true
    emit('mac-focus')
  }

  function handleBlur() {
    hasFocus = false
    emit('mac-blur')
  }

  function clearInput() {
    value = ''
    if (inputEl) inputEl.value = ''
    emit('mac-input', { value: '' })
    inputEl?.focus()
  }

  function togglePassword() {
    showPassword = !showPassword
  }

  /** 设置输入框焦点。 */
  export function focus() {
    inputEl?.focus()
  }

  /** 移除输入框焦点。 */
  export function blur() {
    inputEl?.blur()
  }
</script>

<div
  bind:this={root}
  {...rest}
  class="mac-scope mac-input input-wrapper {floating ? 'input-wrapper--floating' : ''}"
  data-theme={resolvedTheme}
  data-size={resolvedSize}
  class:input-wrapper--focused={hasFocus}
>
  {#if label && !floating}
    <label class="label {required ? 'label--required' : ''}" for="input">{label}</label>
  {/if}
  <div
    class="input-container
      input-container--{variant}
      input-container--{resolvedSize}
      {error ? 'input-container--error' : ''}
      {success ? 'input-container--success' : ''}
      {disabled ? 'input-container--disabled' : ''}
      {loading ? 'input-container--loading' : ''}"
  >
    {#if prefix}<span class="slot-side">{@render prefix()}</span>{/if}
    <input
      bind:this={inputEl}
      id="input"
      class="input"
      type={inputType}
      placeholder={floating ? ' ' : placeholder}
      bind:value
      {disabled}
      {readonly}
      {required}
      maxlength={maxLength}
      {name}
      oninput={handleInput}
      onfocus={handleFocus}
      onblur={handleBlur}
    />
    {#if floating && label}
      <label class="floating-label {required ? 'label--required' : ''}">{label}</label>
    {/if}
    {#if loading}
      <span class="loading-spinner"></span>
    {/if}
    {#if showToggle}
      <button class="password-toggle" type="button" onclick={togglePassword} tabindex="-1">
        {showPassword ? '🙈' : '👁️'}
      </button>
    {/if}
    {#if showClearButton}
      <button class="clear-button" type="button" onclick={clearInput} tabindex="-1">✕</button>
    {/if}
    {#if suffix}<span class="slot-side">{@render suffix()}</span>{/if}
  </div>
  <div style="display: flex; align-items: center; gap: 8px;">
    {#if helperText}
      <div class="helper-text {error ? 'helper-text--error' : ''} {success ? 'helper-text--success' : ''}">
        {helperText}
      </div>
    {/if}
    {#if showCounter}
      <div
        class="char-counter {isOverLimit ? 'char-counter--error' : ''} {isNearLimit && !isOverLimit
          ? 'char-counter--warning'
          : ''}"
      >
        {charCount}/{maxLength}
      </div>
    {/if}
  </div>
</div>

<style>
  .mac-input {
    display: block;
  }

  .input-wrapper {
    display: flex;
    flex-direction: column;
    gap: var(--md-spacing-xs);
  }

  /* 变体 */
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

  /* 标签 */
  .label {
    font-size: var(--md-font-size-base);
    color: var(--md-color-text);
    font-weight: 500;
    transition: color 200ms;
  }

  .label--required::after {
    content: ' *';
    color: var(--md-color-danger);
  }

  /* 浮动标签 */
  .input-wrapper--floating {
    position: relative;
  }

  .input-wrapper--floating .input-container {
    padding-top: 20px;
  }

  .input-wrapper--floating .input {
    padding-top: 8px;
  }

  .floating-label {
    position: absolute;
    left: var(--md-spacing-md);
    top: 50%;
    transform: translateY(-50%);
    font-size: var(--md-font-size-base);
    color: var(--md-color-text-secondary);
    pointer-events: none;
    transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
    background: transparent;
    padding: 0 4px;
  }

  .input-wrapper--floating .input:focus ~ .floating-label,
  .input-wrapper--floating .input:not(:placeholder-shown) ~ .floating-label {
    top: 12px;
    transform: translateY(0);
    font-size: 12px;
    color: var(--md-color-primary);
  }

  .input-wrapper--floating .input-container--error .input:focus ~ .floating-label,
  .input-wrapper--floating
    .input-container--error
    .input:not(:placeholder-shown)
    ~ .floating-label {
    color: var(--md-color-danger);
  }

  /* 辅助文本 */
  .helper-text {
    font-size: var(--md-font-size-sm);
    color: var(--md-color-text-secondary);
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .helper-text--error {
    color: var(--md-color-danger);
  }

  .helper-text--success {
    color: var(--md-color-success);
  }

  /* 字符计数器 */
  .char-counter {
    font-size: 12px;
    color: var(--md-color-text-secondary);
    margin-left: auto;
    opacity: 0.7;
  }

  .char-counter--warning {
    color: var(--md-color-warning);
  }

  .char-counter--error {
    color: var(--md-color-danger);
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

  /* 密码切换 */
  .password-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    margin-right: var(--md-spacing-sm);
    border: none;
    background: transparent;
    cursor: pointer;
    color: var(--md-color-text-secondary);
    font-size: 16px;
    transition: color 200ms;
    padding: 0;
  }

  .password-toggle:hover {
    color: var(--md-color-text);
  }

  /* 加载状态 */
  .input-container--loading {
    pointer-events: none;
  }

  .loading-spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    margin-right: var(--md-spacing-sm);
    border: 2px solid rgba(0, 0, 0, 0.1);
    border-top-color: var(--md-color-primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
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

  .mac-input[data-theme='dark'] .input-container--filled {
    background: rgba(255, 255, 255, 0.05);
  }

  .mac-input[data-theme='dark'] .input-container--filled:focus-within {
    background: rgba(255, 255, 255, 0.08);
  }

  .mac-input[data-theme='dark'] .input-container--glass {
    background: rgba(255, 255, 255, 0.05);
  }

  .mac-input[data-theme='dark'] .input-container--glass:focus-within {
    background: rgba(255, 255, 255, 0.08);
  }

  .mac-input[data-theme='dark'] .clear-button {
    background: rgba(255, 255, 255, 0.1);
  }

  .mac-input[data-theme='dark'] .clear-button:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  .mac-input[data-theme='dark'] .loading-spinner {
    border-color: rgba(255, 255, 255, 0.2);
    border-top-color: var(--md-color-primary);
  }
</style>
