<script lang="ts">
  import {
    useMacConfig,
    resolveSize,
    resolveTheme,
    type MacSize,
    type MacTheme,
  } from '../../internal/config.svelte'

  /**
   * @tag mac-select
   * @summary macOS 风格的下拉选择组件。
   *
   * @event mac-change - 选中值变化时触发。`detail: { value }`
   */

  import type { OptionGroup, SelectOption } from './select-types'

  type RenderItem = SelectOption | { type: 'group'; label: string }

  interface Props {
    /** 选择器的值（单选：string，多选：string[]）。 */
    value?: string | string[]
    /** 选择器的占位符。 */
    placeholder?: string
    /** 选择器的选项。 */
    options?: SelectOption[]
    /** 选项分组。 */
    groups?: OptionGroup[]
    /** 选择器的尺寸。 */
    size?: MacSize
    /** 视觉变体。 */
    variant?: 'default' | 'filled' | 'glass'
    /** 选择器的标签。 */
    label?: string
    /** 显示必填指示器。 */
    required?: boolean
    /** 禁用选择器。 */
    disabled?: boolean
    /** 选择器的错误状态。 */
    error?: boolean
    /** 选择器的成功状态。 */
    success?: boolean
    /** 选择器的辅助文本。 */
    helperText?: string
    /** 启用多选。 */
    multiple?: boolean
    /** 显示清除按钮。 */
    clearable?: boolean
    /** 启用搜索功能。 */
    searchable?: boolean
    /** 显示加载状态。 */
    loading?: boolean
    /** 搜索输入框的占位符。 */
    searchPlaceholder?: string
    /** 无选项时的空文本。 */
    emptyText?: string
    /** 组件级主题覆盖。 */
    theme?: MacTheme
    /** 其余属性透传。 */
    [key: string]: unknown
  }

  let {
    value = $bindable(''),
    placeholder = 'Select an option',
    options = [],
    groups = [],
    size = undefined,
    variant = 'default',
    label = '',
    required = false,
    disabled = false,
    error = false,
    success = false,
    helperText = '',
    multiple = false,
    clearable = false,
    searchable = false,
    loading = false,
    searchPlaceholder = 'Search...',
    emptyText = 'No options available',
    theme = undefined,
    ...rest
  }: Props = $props()

  const config = useMacConfig()
  const resolvedSize = $derived(resolveSize(size, config))
  const resolvedTheme = $derived(resolveTheme(theme, config))

  let root: HTMLDivElement | undefined = $state()
  let triggerEl: HTMLDivElement | undefined = $state()

  function emit(name: string, detail?: unknown) {
    root?.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }))
  }

  let open = $state(false)
  let searchQuery = $state('')
  let focusedIndex = $state(-1)

  function getAllOptions(): SelectOption[] {
    if (groups.length > 0) {
      return groups.flatMap((g) => g.options)
    }
    return options
  }

  function getFilteredOptions(): RenderItem[] {
    const allOptions = getAllOptions()
    const filtered = searchQuery
      ? allOptions.filter(
          (opt) =>
            opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            opt.value.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      : allOptions

    if (groups.length > 0 && !searchQuery) {
      const result: RenderItem[] = []
      groups.forEach((group) => {
        result.push({ type: 'group', label: group.label })
        result.push(...group.options)
      })
      return result
    }

    return filtered
  }

  function isSelected(v: string): boolean {
    if (multiple) {
      return Array.isArray(value) && value.includes(v)
    }
    return value === v
  }

  function selectOption(option: SelectOption) {
    if (option.disabled) return

    if (multiple) {
      const currentValue = Array.isArray(value) ? [...value] : []
      const index = currentValue.indexOf(option.value)

      if (index > -1) {
        currentValue.splice(index, 1)
      } else {
        currentValue.push(option.value)
      }

      value = currentValue
      emit('mac-change', { value: currentValue })
    } else {
      value = option.value
      close()
      emit('mac-change', { value: option.value })
    }
  }

  function removeTag(v: string, e: Event) {
    e.stopPropagation()
    if (Array.isArray(value)) {
      const newValue = value.filter((x) => x !== v)
      value = newValue
      emit('mac-change', { value: newValue })
    }
  }

  function clear(e: Event) {
    e.stopPropagation()
    value = multiple ? [] : ''
    emit('mac-change', { value })
  }

  function toggle() {
    if (disabled) return
    open ? close() : openDropdown()
  }

  function openDropdown() {
    open = true
    focusedIndex = -1
  }

  function close() {
    open = false
    searchQuery = ''
    focusedIndex = -1
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (disabled) return

    const filteredOptions = getFilteredOptions().filter(
      (item): item is SelectOption => 'value' in item,
    )

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (open && focusedIndex > -1) {
          const option = filteredOptions[focusedIndex]
          if (option) selectOption(option)
        } else {
          toggle()
        }
        break

      case 'Escape':
        close()
        break

      case 'ArrowDown':
        e.preventDefault()
        if (!open) {
          openDropdown()
        } else {
          focusedIndex = Math.min(focusedIndex + 1, filteredOptions.length - 1)
          scrollToOption()
        }
        break

      case 'ArrowUp':
        e.preventDefault()
        if (open) {
          focusedIndex = Math.max(focusedIndex - 1, 0)
          scrollToOption()
        }
        break

      case 'Tab':
        close()
        break
    }
  }

  function scrollToOption() {
    const option = root?.querySelector('.select-option.focused') as HTMLElement | null
    option?.scrollIntoView({ block: 'nearest' })
  }

  // 打开时聚焦搜索框
  $effect(() => {
    if (open && searchable) {
      const input = root?.querySelector<HTMLInputElement>('.select-search-input')
      input?.focus()
    }
  })

  // 打开时挂载 document 点击监听（点击外部关闭）
  $effect(() => {
    if (!open) return
    const handler = (e: Event) => {
      if (!root?.contains(e.target as Node)) {
        close()
      }
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  })

  const displayValue = $derived.by(() => {
    if (multiple && Array.isArray(value)) {
      if (value.length === 0) return ''
      return `${value.length} selected`
    }
    const option = getAllOptions().find((opt) => opt.value === value)
    return option?.label || ''
  })

  const hasValue = $derived(
    multiple ? Array.isArray(value) && value.length > 0 : value !== '',
  )
</script>

<div
  bind:this={root}
  {...rest}
  class="mac-scope mac-select select-wrapper"
  data-theme={resolvedTheme}
  data-size={resolvedSize}
>
  {#if label}
    <label class="select-label {required ? 'select-label--required' : ''}">{label}</label>
  {/if}

  <div
    bind:this={triggerEl}
    class="select-trigger
      select-trigger--{variant}
      select-trigger--{resolvedSize}
      {open ? 'open' : ''}
      {error ? 'select-trigger--error' : ''}
      {success ? 'select-trigger--success' : ''}
      {disabled ? 'select-trigger--disabled' : ''}"
    onclick={toggle}
    onkeydown={handleKeyDown}
    tabindex={disabled ? -1 : 0}
    role="combobox"
    aria-expanded={open}
    aria-haspopup="listbox"
  >
    <div class="select-value">
      {#if multiple && Array.isArray(value) && value.length > 0}
        <div class="select-tags">
          {#each value as v (v)}
            {@const opt = getAllOptions().find((o) => o.value === v)}
            <span class="select-tag">
              {#if opt?.icon}<span>{@html opt.icon}</span>{/if}
              {opt?.label || v}
              <button class="select-tag-remove" onclick={(e) => removeTag(v, e)}>✕</button>
            </span>
          {/each}
        </div>
      {:else if hasValue}
        {@const opt = getAllOptions().find((o) => o.value === value)}
        {#if opt?.icon}
          <span class="select-option-icon">{@html opt.icon}</span>
        {/if}
        <span class="select-value-text">{displayValue}</span>
      {:else}
        <span class="select-placeholder">{placeholder}</span>
      {/if}
    </div>

    <div style="display: flex; align-items: center; gap: 8px;">
      {#if clearable && hasValue && !disabled}
        <button class="select-clear" onclick={clear} tabindex="-1">✕</button>
      {/if}
      <span class="select-arrow">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" fill="none" />
        </svg>
      </span>
    </div>
  </div>

  {#if helperText}
    <div class="select-helper-text {error ? 'select-helper-text--error' : ''} {success ? 'select-helper-text--success' : ''}">
      {helperText}
    </div>
  {/if}

  <!-- 下拉面板（绝对定位在触发器下方） -->
  {#if open}
    <div
      class="select-dropdown open"
      role="listbox"
      aria-multiselectable={multiple}
    >
      {#if searchable}
        <div class="select-search">
          <input
            class="select-search-input"
            type="text"
            placeholder={searchPlaceholder}
            bind:value={searchQuery}
            onkeydown={(e) => {
              e.stopPropagation()
              handleKeyDown(e)
            }}
          />
        </div>
      {/if}

      {#if loading}
        <div class="select-loading">
          <span class="loading-spinner"></span>
        </div>
      {:else}
        {@const filteredOptions = getFilteredOptions()}
        {#if filteredOptions.length === 0}
          <div class="select-empty">{emptyText}</div>
        {:else}
          <div class="select-options">
            {#each filteredOptions as item, index}
              {#if 'type' in item && item.type === 'group'}
                <div class="select-group-label">{item.label}</div>
              {:else}
                {@const option = item as SelectOption}
                {@const selected = isSelected(option.value)}
                <div
                  class="select-option {selected ? 'selected' : ''} {option.disabled
                    ? 'disabled'
                    : ''} {index === focusedIndex ? 'focused' : ''}"
                  data-value={option.value}
                  role="option"
                  aria-selected={selected}
                  aria-disabled={!!option.disabled}
                  onclick={() => selectOption(option)}
                >
                  {#if option.icon}
                    <span class="select-option-icon">{@html option.icon}</span>
                  {/if}
                  <span class="select-option-content">
                    <span class="select-option-label">{option.label}</span>
                    {#if option.description}
                      <span class="select-option-description">{option.description}</span>
                    {/if}
                  </span>
                  {#if selected}
                    <span class="select-option-check">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                        <path
                          d="M6.5 11.5L3 8l1-1 2.5 2.5L11 5l1 1z"
                          stroke="currentColor"
                          stroke-width="1.2"
                          fill="none"
                        />
                      </svg>
                    </span>
                  {/if}
                </div>
              {/if}
            {/each}
          </div>
        {/if}
      {/if}
    </div>
  {/if}
</div>

<style>
  .mac-select {
    display: block;
  }

  .select-wrapper {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--md-spacing-xs);
  }

  /* 触发按钮 */
  .select-trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--md-spacing-sm);
    padding: var(--md-select-trigger-padding-vertical)
      var(--md-select-trigger-padding-horizontal);
    border-radius: var(--md-select-trigger-radius);
    background-color: var(--md-color-bg);
    cursor: pointer;
    transition:
      border-color var(--md-transition-normal),
      background var(--md-transition-normal),
      box-shadow var(--md-transition-normal);
    user-select: none;
    min-height: var(--md-select-trigger-min-height);
  }

  .select-trigger--default {
    border: 1px solid var(--md-color-border);
  }

  .select-trigger--filled {
    border: none;
    background: rgba(0, 0, 0, 0.03);
  }

  .select-trigger--glass {
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(10px) saturate(180%);
    -webkit-backdrop-filter: blur(10px) saturate(180%);
  }

  /* 聚焦状态 */
  .select-trigger--default:focus-within,
  .select-trigger--default.open {
    border-color: var(--md-color-primary);
    box-shadow: var(--md-select-container-focus-shadow);
  }

  .select-trigger--filled:focus-within,
  .select-trigger--filled.open {
    background: rgba(0, 0, 0, 0.05);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .select-trigger--glass:focus-within,
  .select-trigger--glass.open {
    border-color: var(--md-select-container-focus-border);
    background: rgba(255, 255, 255, 0.12);
    box-shadow: var(--md-select-container-focus-glass-shadow);
  }

  /* 错误和成功状态 */
  .select-trigger--error.select-trigger--default {
    border-color: var(--md-color-danger);
  }

  .select-trigger--success.select-trigger--default {
    border-color: var(--md-color-success);
  }

  /* 禁用状态 */
  .select-trigger--disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }

  /* 选中值显示 */
  .select-value {
    flex: 1;
    display: flex;
    align-items: center;
    gap: var(--md-spacing-sm);
    overflow: hidden;
  }

  .select-placeholder {
    color: var(--md-color-text-secondary);
  }

  .select-value-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* 多选标签 */
  .select-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    flex: 1;
  }

  .select-tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    background: var(--md-select-tag-bg);
    border-radius: 12px;
    font-size: 12px;
    color: var(--md-select-tag-text);
  }

  .select-tag-remove {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    border: none;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    cursor: pointer;
    font-size: 10px;
    color: inherit;
    padding: 0;
    transition: background var(--md-transition-fast);
  }

  .select-tag-remove:hover {
    background: rgba(0, 0, 0, 0.15);
  }

  /* 箭头图标 */
  .select-arrow {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    transition: transform var(--md-transition-normal);
    color: var(--md-color-text-secondary);
  }

  .select-trigger.open .select-arrow {
    transform: rotate(180deg);
  }

  /* 清除按钮 */
  .select-clear {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border: none;
    background: rgba(0, 0, 0, 0.06);
    border-radius: 50%;
    cursor: pointer;
    color: var(--md-color-text-secondary);
    font-size: 12px;
    transition:
      background var(--md-transition-fast),
      color var(--md-transition-fast);
    padding: 0;
  }

  .select-clear:hover {
    background: rgba(0, 0, 0, 0.1);
    color: var(--md-color-text);
  }

  /* 下拉菜单 */
  .select-dropdown {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    min-width: 100%;
    max-height: 300px;
    overflow-y: auto;
    background: var(--md-color-bg);
    border: 1px solid var(--md-color-border);
    border-radius: var(--md-radius-md);
    box-shadow:
      0 4px 16px rgba(0, 0, 0, 0.12),
      0 2px 8px rgba(0, 0, 0, 0.08);
    z-index: 99999;
  }

  /* 搜索输入框 */
  .select-search {
    padding: var(--md-spacing-sm);
    border-bottom: 1px solid var(--md-color-border);
    position: sticky;
    top: 0;
    background: var(--md-color-bg);
    z-index: 1;
  }

  .select-search-input {
    width: 100%;
    padding: var(--md-spacing-xs) var(--md-spacing-sm);
    border: 1px solid var(--md-color-border);
    border-radius: var(--md-radius-sm);
    font-size: 14px;
    outline: none;
    transition: border-color var(--md-transition-normal);
    background: var(--md-color-bg);
    color: var(--md-color-text);
  }

  .select-search-input:focus {
    border-color: var(--md-color-primary);
  }

  /* 选项分组 */
  .select-group-label {
    padding: var(--md-spacing-xs) var(--md-spacing-md);
    font-size: 12px;
    font-weight: 600;
    color: var(--md-color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    background: rgba(0, 0, 0, 0.02);
    position: sticky;
    top: 0;
  }

  /* 选项 */
  .select-option {
    display: flex;
    align-items: center;
    gap: var(--md-spacing-sm);
    padding: var(--md-spacing-sm) var(--md-spacing-md);
    cursor: pointer;
    transition: background var(--md-transition-fast);
    position: relative;
  }

  .select-option:hover {
    background: var(--md-select-item-hover-bg);
  }

  .select-option.selected {
    background: var(--md-select-item-selected-bg);
  }

  .select-option.focused {
    background: var(--md-select-item-focused-bg);
  }

  .select-option.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }

  .select-option-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    font-size: 16px;
  }

  .select-option-content {
    flex: 1;
    min-width: 0;
  }

  .select-option-label {
    font-size: 14px;
    color: var(--md-color-text);
  }

  .select-option-description {
    display: block;
    font-size: 12px;
    color: var(--md-color-text-secondary);
    margin-top: 2px;
  }

  .select-option-check {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    color: var(--md-color-primary);
    font-size: 14px;
  }

  /* 空状态 */
  .select-empty {
    padding: var(--md-spacing-lg);
    text-align: center;
    color: var(--md-color-text-secondary);
  }

  /* 加载状态 */
  .select-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--md-spacing-lg);
  }

  .loading-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(0, 0, 0, 0.1);
    border-top-color: var(--md-color-primary);
    border-radius: 50%;
    animation: select-spin 0.8s linear infinite;
  }

  @keyframes select-spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* 标签 */
  .select-label {
    font-size: var(--md-font-size-base);
    color: var(--md-color-text);
    font-weight: 500;
  }

  .select-label--required::after {
    content: ' *';
    color: var(--md-color-danger);
  }

  /* 辅助文本 */
  .select-helper-text {
    font-size: var(--md-font-size-sm);
    color: var(--md-color-text-secondary);
  }

  .select-helper-text--error {
    color: var(--md-color-danger);
  }

  .select-helper-text--success {
    color: var(--md-color-success);
  }

  /* 尺寸 */
  .select-trigger--sm {
    padding: var(--sm-select-trigger-padding-vertical)
      var(--sm-select-trigger-padding-horizontal);
    font-size: var(--sm-select-trigger-font-size);
    min-height: var(--sm-select-trigger-min-height);
  }

  .select-trigger--lg {
    padding: var(--lg-select-trigger-padding-vertical)
      var(--lg-select-trigger-padding-horizontal);
    font-size: var(--lg-select-trigger-font-size);
    min-height: var(--lg-select-trigger-min-height);
  }

  .mac-select[data-theme='dark'] .select-trigger--filled {
    background: var(--md-select-container-dark-filled-bg);
  }

  .mac-select[data-theme='dark'] .select-trigger--glass {
    background: var(--md-select-container-dark-glass-bg);
  }

  .mac-select[data-theme='dark'] .select-dropdown {
    background: var(--md-select-container-dark-bg);
    border-color: var(--md-select-container-dark-border);
  }

  .mac-select[data-theme='dark'] .select-option:hover {
    background: var(--md-select-item-dark-hover-bg);
  }

  .mac-select[data-theme='dark'] .select-option.selected {
    background: var(--md-select-item-dark-selected-bg);
  }

  .mac-select[data-theme='dark'] .select-option.focused {
    background: var(--md-select-item-dark-focused-bg);
  }

  .mac-select[data-theme='dark'] .select-tag {
    background: var(--md-select-tag-dark-bg);
  }

  .mac-select[data-theme='dark'] .select-clear {
    background: var(--md-select-clear-dark-bg);
  }

  .mac-select[data-theme='dark'] .select-clear:hover {
    background: var(--md-select-clear-dark-hover-bg);
  }

  /* ─── 响应式：移动端适配 ─── */
  @media (max-width: 768px) {
    .select-dropdown {
      max-height: 50vh;
    }
    .select-search-input {
      font-size: 16px;
      padding: 10px 12px;
    }
    .select-option {
      padding: 12px var(--md-spacing-md);
      font-size: 16px;
    }
    .select-option-label {
      font-size: 16px;
    }
    .select-option-description {
      font-size: 13px;
    }
    .select-option-icon {
      width: 24px;
      height: 24px;
      font-size: 20px;
    }
    .select-option-check {
      width: 22px;
      height: 22px;
      font-size: 18px;
    }
    .select-group-label {
      font-size: 13px;
      padding: 10px var(--md-spacing-md);
    }
  }
</style>
