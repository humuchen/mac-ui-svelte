<script lang="ts">
  import type { Snippet } from 'svelte'
  import {
    useMacConfig,
    resolveSize,
    resolveTheme,
    type MacSize,
    type MacTheme,
  } from '../../internal/config.svelte'
  import MacTag from '../tag/mac-tag.svelte'

  /**
   * @tag mac-dynamic-tags
   * @summary 一个动态标签组件，用于添加和删除标签。
   *
   * @event mac-update - 值变化时触发。Detail: { value: string[] }
   * @event mac-add - 添加标签时触发。Detail: { value: string, index: number }
   * @event mac-remove - 删除标签时触发。Detail: { value: string, index: number }
   */

  interface Props {
    /** 标签的值（受控）。 */
    value?: string[]
    /** 标签的默认值（非受控）。 */
    defaultValue?: string[]
    /** 禁用组件。 */
    disabled?: boolean
    /** 标签的最大数量。 */
    max?: number
    /** 标签的尺寸。 */
    size?: MacSize
    /** 标签的类型。 */
    type?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
    /** 标签是否圆角。 */
    round?: boolean
    /** 标签是否有边框。 */
    bordered?: boolean
    /** 标签是否可关闭。 */
    closable?: boolean
    /** 输入框的占位符。 */
    inputPlaceholder?: string
    /** 输入框的最大长度。 */
    inputMaxLength?: number
    /** 组件级主题覆盖。 */
    theme?: MacTheme
    /** 自定义标签渲染，参数为 (标签文本, 索引)。 */
    tag?: Snippet<[string, number]>
    /** 其余属性透传。 */
    [key: string]: unknown
  }

  let {
    value = $bindable(undefined),
    defaultValue = [],
    disabled = false,
    max = undefined,
    size = undefined,
    type = 'default',
    round = false,
    bordered = true,
    closable = true,
    inputPlaceholder = '',
    inputMaxLength = undefined,
    theme = undefined,
    tag,
    ...rest
  }: Props = $props()

  const config = useMacConfig()
  const resolvedSize = $derived(resolveSize(size, config))
  const resolvedTheme = $derived(resolveTheme(theme, config))

  let root: HTMLDivElement | undefined = $state()
  let inputRef: HTMLInputElement | undefined = $state()
  let inputVisible = $state(false)
  let inputValue = $state('')
  let internalValue = $state<string[]>([])
  let initialized = false

  function emit(name: string, detail?: unknown) {
    root?.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }))
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

  const tags = $derived(value ?? internalValue)
  const showAddButton = $derived(!inputVisible && (!max || tags.length < max))

  // 输入框显示时自动聚焦
  $effect(() => {
    if (inputVisible && inputRef) {
      inputRef.focus()
    }
  })

  function showInput() {
    if (disabled) return
    inputVisible = true
    inputValue = ''
  }

  function hideInput() {
    inputVisible = false
    inputValue = ''
  }

  function handleInputChange(e: Event) {
    const target = e.target as HTMLInputElement
    inputValue = target.value
  }

  function handleInputKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    } else if (e.key === 'Escape') {
      hideInput()
    }
  }

  function handleInputBlur() {
    // 延迟以允许其他元素上的点击事件处理
    setTimeout(() => {
      if (inputValue.trim()) {
        addTag()
      } else {
        hideInput()
      }
    }, 150)
  }

  function addTag() {
    const raw = inputValue.trim()
    if (!raw) {
      hideInput()
      return
    }
    // 防止重复
    if (tags.includes(raw)) {
      hideInput()
      return
    }
    if (max && tags.length >= max) {
      hideInput()
      return
    }

    const newValue = [...tags, raw]
    const index = newValue.length - 1

    if (value !== undefined) {
      value = newValue
    } else {
      internalValue = newValue
    }

    emit('mac-add', { value: raw, index })
    emit('mac-update', { value: newValue })
    hideInput()
  }

  function handleRemove(tagText: string, index: number) {
    if (disabled) return
    const newValue = tags.filter((_, i) => i !== index)

    if (value !== undefined) {
      value = newValue
    } else {
      internalValue = newValue
    }

    emit('mac-remove', { value: tagText, index })
    emit('mac-update', { value: newValue })
  }
</script>

<div
  bind:this={root}
  {...rest}
  class="mac-scope mac-dynamic-tags container {disabled ? 'container--disabled' : ''}"
  data-theme={resolvedTheme}
  data-size={resolvedSize}
>
  {#each tags as t, index (index)}
    <div class="tag-wrapper" data-value={t} data-index={index}>
      {#if tag}
        {@render tag(t, index)}
      {:else}
        <MacTag
          size={resolvedSize}
          {type}
          {round}
          {bordered}
          {closable}
          {disabled}
          onmac-close={() => handleRemove(t, index)}
        >
          {t}
        </MacTag>
      {/if}
    </div>
  {/each}
  {#if inputVisible}
    <input
      bind:this={inputRef}
      class="input"
      type="text"
      value={inputValue}
      placeholder={inputPlaceholder || '请输入'}
      {disabled}
      maxlength={inputMaxLength}
      oninput={handleInputChange}
      onkeydown={handleInputKeydown}
      onblur={handleInputBlur}
    />
  {/if}
  {#if showAddButton}
    <button class="add-button" type="button" {disabled} onclick={showInput}>
      <svg
        width="1em"
        height="1em"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M8 2v12M2 8h12"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
        />
      </svg>
      添加
    </button>
  {/if}
</div>

<style>
  .mac-dynamic-tags {
    display: block;
  }

  .container {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--md-dynamic-tags-gap, var(--md-spacing-sm));
  }

  .tag-wrapper {
    display: inline-flex;
    align-items: center;
  }

  /* 用于添加标签的内联输入框 */
  .input {
    display: inline-block;
    border: 1px solid var(--md-color-border);
    border-radius: var(--md-radius-md);
    background-color: var(--md-color-bg);
    padding: var(--md-dynamic-tags-input-padding-vertical, 2px)
      var(--md-dynamic-tags-input-padding-horizontal, 8px);
    font-size: var(--md-dynamic-tags-input-font-size, var(--md-font-size-sm));
    font-family: inherit;
    color: var(--md-color-text);
    outline: none;
    min-width: 60px;
    width: auto;
    transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .input:focus {
    border-color: var(--md-color-primary);
    box-shadow:
      0 0 0 3px rgba(0, 122, 255, 0.1),
      0 2px 8px rgba(0, 122, 255, 0.08);
  }

  .input::placeholder {
    color: var(--md-color-text-secondary);
  }

  .input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background-color: var(--md-color-bg-secondary);
  }

  /* 添加按钮 */
  .add-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--md-tag-gap);
    padding: var(--md-tag-padding-vertical) var(--md-tag-padding-horizontal);
    font-size: var(--md-tag-font-size);
    font-family: inherit;
    line-height: 1.5;
    border-radius: var(--md-tag-radius);
    border: 1px dashed var(--md-color-border);
    background-color: transparent;
    color: var(--md-color-text-secondary);
    cursor: pointer;
    transition: all var(--md-transition-fast);
    white-space: nowrap;
    user-select: none;
  }

  .add-button:hover {
    border-color: var(--md-color-primary);
    color: var(--md-color-primary);
  }

  .add-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* 输入框和添加按钮的尺寸覆盖 */
  .mac-dynamic-tags[data-size='sm'] .input {
    --md-dynamic-tags-input-padding-vertical: 1px;
    --md-dynamic-tags-input-padding-horizontal: 6px;
    --md-dynamic-tags-input-font-size: var(--md-font-size-xs);
  }

  .mac-dynamic-tags[data-size='sm'] .add-button {
    padding: 1px 6px;
    font-size: var(--md-font-size-xs);
    gap: 2px;
    border-radius: var(--md-radius-sm);
  }

  .mac-dynamic-tags[data-size='lg'] .input {
    --md-dynamic-tags-input-padding-vertical: 4px;
    --md-dynamic-tags-input-padding-horizontal: 12px;
    --md-dynamic-tags-input-font-size: var(--md-font-size-base);
  }

  .mac-dynamic-tags[data-size='lg'] .add-button {
    padding: 4px 12px;
    font-size: var(--md-font-size-base);
    gap: 6px;
    border-radius: var(--md-radius-md);
  }

  /* 禁用状态 */
  .container--disabled {
    opacity: 0.6;
    pointer-events: none;
  }
</style>
