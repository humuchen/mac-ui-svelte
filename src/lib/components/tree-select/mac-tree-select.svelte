<script lang="ts">
  import {
    useMacConfig,
    resolveSize,
    resolveTheme,
    type MacSize,
    type MacTheme,
  } from '../../internal/config.svelte'

  /**
   * @tag mac-tree-select
   * @summary macOS 风格的树形下拉选择组件。
   *
   * @event mac-change - 选中值变化时触发。`detail: { value }`
   */

  import type { TreeOption } from './tree-select-types'

  type CheckState = 'unchecked' | 'half-checked' | 'checked'

  interface Props {
    /** 树形选项数据。 */
    options?: TreeOption[]
    /** 选择器的值（单选：string，多选：string[]）。 */
    value?: string | string[]
    /** 默认值（非受控模式）。 */
    defaultValue?: string | string[]
    /** 占位符。 */
    placeholder?: string
    /** 选择器的尺寸。 */
    size?: MacSize
    /** 禁用选择器。 */
    disabled?: boolean
    /** 错误状态。 */
    error?: boolean
    /** 成功状态。 */
    success?: boolean
    /** 显示清除按钮。 */
    clearable?: boolean
    /** 启用多选。 */
    multiple?: boolean
    /** 启用搜索。 */
    searchable?: boolean
    /** 面板模式（无触发器，常显）。 */
    panel?: boolean
    /** 多选时启用复选框级联勾选。 */
    checkable?: boolean
    /** 默认展开所有节点。 */
    defaultExpandAll?: boolean
    /** 搜索框占位符。 */
    searchPlaceholder?: string
    /** 无数据时的空文本。 */
    emptyText?: string
    /** 组件级主题覆盖。 */
    theme?: MacTheme
    /** 其余属性透传。 */
    [key: string]: unknown
  }

  let {
    options = [],
    value = $bindable(undefined),
    defaultValue = '',
    placeholder = 'Select',
    size = undefined,
    disabled = false,
    error = false,
    success = false,
    clearable = false,
    multiple = false,
    searchable = false,
    panel = false,
    checkable = false,
    defaultExpandAll = false,
    searchPlaceholder = 'Search...',
    emptyText = 'No data',
    theme = undefined,
    ...rest
  }: Props = $props()

  const config = useMacConfig()
  const resolvedSize = $derived(resolveSize(size, config))
  const resolvedTheme = $derived(resolveTheme(theme, config))

  let root: HTMLDivElement | undefined = $state()

  function emit(name: string, detail?: unknown) {
    root?.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }))
  }

  let open = $state(false)
  let expandedKeys = $state<Set<string>>(new Set())
  let searchQuery = $state('')
  // 非受控内部值（value 未绑定时使用）
  let internalValue = $state<string | string[]>('')
  let initialized = false

  // 非受控初始化与 defaultExpandAll
  $effect(() => {
    if (!initialized) {
      initialized = true
      if (value === undefined && defaultValue !== '') {
        internalValue = defaultValue
      }
      if (defaultExpandAll) {
        const keys = new Set<string>()
        const walk = (opts: TreeOption[]) => {
          for (const opt of opts) {
            if (opt.children && opt.children.length > 0) {
              keys.add(opt.value)
              walk(opt.children)
            }
          }
        }
        walk(options)
        expandedKeys = keys
      }
    }
  })

  const resVal = $derived(value !== undefined ? value : internalValue)

  function toggle() {
    if (disabled || panel) return
    open ? close() : (open = true)
  }

  function close() {
    if (panel) return
    open = false
    searchQuery = ''
  }

  /* ── Value helpers ── */
  function getSelectedSet(): Set<string> {
    const v = resVal
    if (multiple) {
      return new Set(Array.isArray(v) ? v : v ? [v] : [])
    }
    return v ? new Set([v as string]) : new Set()
  }

  function getLabel(v: string): string {
    const find = (opts: TreeOption[]): string | undefined => {
      for (const opt of opts) {
        if (opt.value === v) return opt.label
        if (opt.children) {
          const found = find(opt.children)
          if (found) return found
        }
      }
      return undefined
    }
    return find(options) || v
  }

  function isSelected(v: string): boolean {
    return getSelectedSet().has(v)
  }

  function getCheckState(opt: TreeOption): CheckState {
    const selected = getSelectedSet()
    if (!opt.children || opt.children.length === 0) {
      return selected.has(opt.value) ? 'checked' : 'unchecked'
    }
    const childrenStates = opt.children.map((c) => getCheckState(c))
    if (childrenStates.every((s) => s === 'checked')) return 'checked'
    if (childrenStates.some((s) => s === 'checked' || s === 'half-checked')) return 'half-checked'
    return 'unchecked'
  }

  /* ── Selection ── */
  function select(v: string, _label: string) {
    if (multiple) {
      const set = getSelectedSet()
      if (set.has(v)) {
        set.delete(v)
      } else {
        set.add(v)
      }
      const arr = Array.from(set)
      value = arr
      emit('mac-change', { value: arr })
    } else {
      value = v
      emit('mac-change', { value: v })
      close()
    }
  }

  function toggleCheck(opt: TreeOption) {
    const state = getCheckState(opt)
    const shouldCheck = state !== 'checked'
    const set = getSelectedSet()

    const toggleNode = (o: TreeOption) => {
      if (o.disabled) return
      if (shouldCheck) {
        set.add(o.value)
      } else {
        set.delete(o.value)
      }
      if (o.children) {
        o.children.forEach(toggleNode)
      }
    }

    toggleNode(opt)

    const arr = Array.from(set)
    value = arr
    emit('mac-change', { value: arr })
  }

  function removeTag(v: string, e: Event) {
    e.stopPropagation()
    if (multiple) {
      const set = getSelectedSet()
      set.delete(v)
      const arr = Array.from(set)
      value = arr
      emit('mac-change', { value: arr })
    }
  }

  function clear(e: Event) {
    e.stopPropagation()
    const v = multiple ? [] : ''
    value = v
    emit('mac-change', { value: v })
  }

  /* ── Expand / Collapse ── */
  function toggleExpand(v: string, e: Event) {
    e.stopPropagation()
    const next = new Set(expandedKeys)
    if (next.has(v)) {
      next.delete(v)
    } else {
      next.add(v)
    }
    expandedKeys = next
  }

  /* ── Search ── */
  function filterOptions(opts: TreeOption[], query: string, autoExpand?: Set<string>): TreeOption[] {
    const q = query.toLowerCase()
    const result: TreeOption[] = []

    for (const opt of opts) {
      const matchLabel = opt.label.toLowerCase().includes(q)
      const matchValue = opt.value.toLowerCase().includes(q)
      const selfMatch = matchLabel || matchValue

      if (!opt.children || opt.children.length === 0) {
        if (selfMatch) result.push(opt)
        continue
      }

      const childMatches = filterOptions(opt.children, query, autoExpand)
      if (selfMatch || childMatches.length > 0) {
        result.push({ ...opt, children: childMatches })
        // 筛选时自动展开（收集到调用方提供的集合）
        autoExpand?.add(opt.value)
      }
    }

    return result
  }

  function handleSearchInput() {
    if (searchQuery) {
      const autoExpand = new Set(expandedKeys)
      filterOptions([...options], searchQuery, autoExpand)
      expandedKeys = autoExpand
    }
  }

  /* ── Keyboard ── */
  function onKey(e: KeyboardEvent) {
    if (disabled || panel) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggle()
    }
    if (e.key === 'Escape') close()
  }

  // 打开时挂载 document 点击监听
  $effect(() => {
    if (!open || panel) return
    const handler = (e: Event) => {
      if (!root?.contains(e.target as Node)) close()
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  })

  const hasValue = $derived(
    multiple ? Array.isArray(resVal) && resVal.length > 0 : resVal !== '',
  )

  const filteredOptions = $derived(
    searchQuery ? filterOptions([...options], searchQuery) : options,
  )

</script>

{#snippet renderNode(opt: TreeOption, depth: number)}
  {@const hasChildren = opt.children && opt.children.length > 0}
  {@const expanded = expandedKeys.has(opt.value)}
  {@const selected = isSelected(opt.value)}
  {@const checkState = multiple && checkable ? getCheckState(opt) : undefined}
  {@const showCheck = multiple && checkable}
  <div>
    <div
      class="tree-node {selected ? 'tree-node--selected' : ''} {opt.disabled
        ? 'tree-node--disabled'
        : ''}"
      style="padding-left: {depth * 16}px"
      onclick={() => {
        if (opt.disabled) return
        if (showCheck) {
          toggleCheck(opt)
        } else {
          select(opt.value, opt.label)
        }
      }}
    >
      <button
        class="tree-toggle {hasChildren ? '' : 'tree-toggle--placeholder'} {expanded
          ? 'tree-toggle--expanded'
          : ''}"
        onclick={hasChildren ? (e: Event) => toggleExpand(opt.value, e) : undefined}
        tabindex="-1"
        type="button"
      >
        {#if hasChildren}
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" fill="none" />
          </svg>
        {/if}
      </button>

      {#if showCheck}
        <span
          class="tree-checkbox {checkState === 'checked'
            ? 'tree-checkbox--checked'
            : checkState === 'half-checked'
              ? 'tree-checkbox--half'
              : ''}"
          onclick={(e: Event) => {
            e.stopPropagation()
            if (!opt.disabled) toggleCheck(opt)
          }}
        ></span>
      {/if}

      <span class="tree-label">{opt.label}</span>
    </div>

    {#if hasChildren && expanded}
      <div class="tree-children">
        {#each opt.children! as child (child.value)}
          {@render renderNode(child, depth + 1)}
        {/each}
      </div>
    {/if}
  </div>
{/snippet}

<div
  bind:this={root}
  {...rest}
  class="mac-scope mac-tree-select tree-select"
  data-theme={resolvedTheme}
  data-size={resolvedSize}
>
  {#if !panel}
    <div
      class="tree-trigger tree-trigger--{resolvedSize} {open ? 'open' : ''} {error
        ? 'tree-trigger--error'
        : ''} {success ? 'tree-trigger--success' : ''} {disabled
        ? 'tree-trigger--disabled'
        : ''}"
      onclick={toggle}
      onkeydown={onKey}
      tabindex={disabled ? -1 : 0}
      role="combobox"
      aria-expanded={open}
    >
      <div class="tree-value">
        {#if multiple && Array.isArray(resVal) && resVal.length > 0}
          <div class="tree-tags">
            {#each resVal as v (v)}
              <span class="tree-tag">
                {getLabel(v)}
                <button class="tree-tag-remove" onclick={(e) => removeTag(v, e)} tabindex="-1" type="button">
                  ✕
                </button>
              </span>
            {/each}
          </div>
        {:else if hasValue}
          <span class="tree-value-text">{getLabel(resVal as string)}</span>
        {:else}
          <span class="tree-placeholder">{placeholder}</span>
        {/if}
      </div>
      <div class="tree-actions">
        {#if clearable && hasValue && !disabled}
          <button class="tree-clear" onclick={clear} tabindex="-1" type="button">✕</button>
        {/if}
        <span class="tree-arrow">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" fill="none" />
          </svg>
        </span>
      </div>
    </div>
  {/if}

  <div
    class="tree-dropdown {open || panel ? 'open' : ''} {panel ? 'tree-dropdown--inline' : ''}"
  >
    {#if searchable}
      <div class="tree-search">
        <input
          class="tree-search-input"
          type="text"
          placeholder={searchPlaceholder}
          bind:value={searchQuery}
          oninput={handleSearchInput}
          onkeydown={(e) => e.stopPropagation()}
        />
      </div>
    {/if}
    {#if filteredOptions.length === 0}
      <div class="tree-empty">{emptyText}</div>
    {:else}
      {#each filteredOptions as opt (opt.value)}
        {@render renderNode(opt, 0)}
      {/each}
    {/if}
  </div>
</div>

<style>
  .mac-tree-select {
    display: block;
  }

  .tree-select {
    position: relative;
  }

  /* 触发器 */
  .tree-trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--md-spacing-sm);
    padding: var(--md-select-trigger-padding-vertical)
      var(--md-select-trigger-padding-horizontal);
    border-radius: var(--md-radius-lg);
    background: var(--md-color-bg);
    cursor: pointer;
    transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
    user-select: none;
    min-height: var(--md-select-trigger-min-height);
    border: 1px solid var(--md-color-border);
  }
  .tree-trigger:hover:not(.tree-trigger--disabled) {
    border-color: var(--md-color-primary);
  }
  .tree-trigger.open,
  .tree-trigger:focus-within {
    border-color: var(--md-color-primary);
    box-shadow:
      0 0 0 3px rgba(0, 122, 255, 0.1),
      0 2px 8px rgba(0, 122, 255, 0.08);
  }
  .tree-trigger--disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
    background: var(--md-color-bg-secondary);
  }
  .tree-trigger--error {
    border-color: var(--md-color-danger);
  }
  .tree-trigger--error.open,
  .tree-trigger--error:focus-within {
    box-shadow:
      0 0 0 3px rgba(255, 59, 48, 0.1),
      0 2px 8px rgba(255, 59, 48, 0.08);
  }
  .tree-trigger--success {
    border-color: var(--md-color-success);
  }

  .tree-value {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .tree-placeholder {
    color: #9ca3af;
  }

  .tree-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    flex: 1;
  }
  .tree-tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    background: var(--md-select-tag-bg);
    border-radius: 12px;
    font-size: 12px;
    color: var(--md-select-tag-text);
  }
  .tree-tag-remove {
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
    transition: background 200ms;
  }
  .tree-tag-remove:hover {
    background: rgba(0, 0, 0, 0.15);
  }

  .tree-actions {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .tree-clear {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border: none;
    background: rgba(0, 0, 0, 0.06);
    border-radius: 50%;
    cursor: pointer;
    color: var(--md-color-text-secondary);
    font-size: 10px;
    transition: all 200ms;
    padding: 0;
    flex-shrink: 0;
  }
  .tree-clear:hover {
    background: rgba(0, 0, 0, 0.1);
    color: var(--md-color-text);
  }
  .tree-arrow {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    color: #9ca3af;
    transition: transform 200ms;
    flex-shrink: 0;
  }
  .tree-trigger.open .tree-arrow {
    transform: rotate(180deg);
  }

  /* 下拉面板 */
  .tree-dropdown {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    width: 320px;
    max-height: 400px;
    overflow-y: auto;
    background: var(--md-color-bg);
    border: 1px solid var(--md-color-border);
    border-radius: 12px;
    box-shadow:
      0 12px 40px rgba(0, 0, 0, 0.12),
      0 4px 12px rgba(0, 0, 0, 0.08);
    z-index: 99999;
    opacity: 0;
    transform: translateY(-8px) scale(0.96);
    pointer-events: none;
    transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
    padding: 12px;
  }
  .tree-dropdown.open {
    opacity: 1;
    transform: translateY(0) scale(1);
    pointer-events: auto;
  }
  .tree-dropdown--inline {
    position: static;
    opacity: 1;
    transform: none;
    pointer-events: auto;
    box-shadow: none;
  }

  /* 搜索 */
  .tree-search {
    padding-bottom: 8px;
    margin-bottom: 8px;
    border-bottom: 1px solid var(--md-color-border);
  }
  .tree-search-input {
    width: 100%;
    padding: 6px 10px;
    border: 1px solid var(--md-color-border);
    border-radius: var(--md-radius-md);
    font-size: var(--md-font-size-sm);
    outline: none;
    transition: border-color 200ms;
    background: var(--md-color-bg);
    color: var(--md-color-text);
    box-sizing: border-box;
  }
  .tree-search-input:focus {
    border-color: var(--md-color-primary);
  }

  /* 树节点 */
  .tree-node {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 10px;
    border-radius: var(--md-radius-md);
    cursor: pointer;
    transition: background 150ms;
    user-select: none;
    margin: 1px 0;
  }
  .tree-node:hover:not(.tree-node--disabled) {
    background: rgba(0, 122, 255, 0.06);
  }
  .tree-node--selected {
    background: rgba(0, 122, 255, 0.1);
    color: var(--md-color-primary);
  }
  .tree-node--disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .tree-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border: none;
    background: transparent;
    cursor: pointer;
    color: var(--md-color-text-secondary);
    padding: 0;
    flex-shrink: 0;
    transition: transform 150ms;
    border-radius: var(--md-radius-sm);
  }
  .tree-toggle:hover {
    background: rgba(0, 0, 0, 0.04);
    color: var(--md-color-text);
  }
  .tree-toggle--expanded {
    transform: rotate(90deg);
  }
  .tree-toggle--placeholder {
    visibility: hidden;
    pointer-events: none;
  }

  .tree-checkbox {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border: 2px solid var(--md-color-border);
    border-radius: 5px;
    cursor: pointer;
    flex-shrink: 0;
    transition: all 150ms;
    position: relative;
  }
  .tree-checkbox:hover {
    border-color: var(--md-color-primary);
  }
  .tree-checkbox--checked {
    background: var(--md-color-primary);
    border-color: var(--md-color-primary);
  }
  .tree-checkbox--half {
    background: var(--md-color-primary);
    border-color: var(--md-color-primary);
  }
  .tree-checkbox--half::after {
    content: '';
    display: block;
    width: 9px;
    height: 2.5px;
    background: #fff;
    border-radius: 1.5px;
  }
  .tree-checkbox--checked::after {
    content: '';
    display: block;
    width: 5px;
    height: 9px;
    border: solid #fff;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
    margin-bottom: 2px;
  }

  .tree-label {
    flex: 1;
    font-size: var(--md-font-size-sm);
    color: var(--md-color-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .tree-node--selected .tree-label {
    color: var(--md-color-primary);
    font-weight: 600;
  }

  .tree-children {
    padding-left: 0;
  }

  /* 空状态 */
  .tree-empty {
    padding: 24px;
    text-align: center;
    color: var(--md-color-text-secondary);
    font-size: var(--md-font-size-sm);
  }

  /* 尺寸 */
  .tree-trigger--sm {
    padding: var(--sm-select-trigger-padding-vertical)
      var(--sm-select-trigger-padding-horizontal);
    font-size: var(--sm-select-trigger-font-size);
    min-height: var(--sm-select-trigger-min-height);
  }
  .tree-trigger--lg {
    padding: var(--lg-select-trigger-padding-vertical)
      var(--lg-select-trigger-padding-horizontal);
    font-size: var(--lg-select-trigger-font-size);
    min-height: var(--lg-select-trigger-min-height);
  }

  .mac-tree-select[data-theme='dark'] .tree-clear {
    background: rgba(255, 255, 255, 0.1);
  }
  .mac-tree-select[data-theme='dark'] .tree-clear:hover {
    background: rgba(255, 255, 255, 0.15);
  }
  .mac-tree-select[data-theme='dark'] .tree-tag {
    background: var(--md-select-tag-dark-bg);
  }
  .mac-tree-select[data-theme='dark'] .tree-toggle:hover {
    color: var(--md-color-text);
  }
  .mac-tree-select[data-theme='dark'] .tree-search-input {
    background: var(--md-color-bg);
    border-color: var(--md-color-border);
    color: var(--md-color-text);
  }
</style>
