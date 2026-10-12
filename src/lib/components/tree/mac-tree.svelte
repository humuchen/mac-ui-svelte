<script lang="ts">
  import {
    useMacConfig,
    resolveSize,
    resolveTheme,
    type MacSize,
    type MacTheme,
  } from '../../internal/config.svelte'

  /**
   * @tag mac-tree
   * @summary 用于展示层级数据的树形组件。
   *
   * @event mac-expand - 节点展开/收起时触发。`detail: { key, expanded, expandedKeys, node }`
   * @event mac-select - 节点选中状态变化时触发。`detail: { key, selected, selectedKeys, node }`
   * @event mac-check - 节点勾选状态变化时触发。`detail: { key, checked, checkedKeys, halfCheckedKeys, node }`
   */

  import type { TreeNodeData } from './tree-types'

  type CheckState = 'unchecked' | 'half-checked' | 'checked'

  interface Props {
    /** 树形数据数组。 */
    data?: TreeNodeData[]
    /** 当前展开的节点键（受控）。 */
    expandedKeys?: string[]
    /** 当前选中的节点键（受控）。 */
    selectedKeys?: string[]
    /** 当前勾选的节点键（受控，用于可勾选模式）。 */
    checkedKeys?: string[]
    /** 默认展开的节点键（非受控）。 */
    defaultExpandedKeys?: string[]
    /** 默认选中的节点键（非受控）。 */
    defaultSelectedKeys?: string[]
    /** 默认勾选的节点键（非受控）。 */
    defaultCheckedKeys?: string[]
    /** 是否默认展开所有节点。 */
    defaultExpandAll?: boolean
    /** 是否显示复选框。 */
    checkable?: boolean
    /** 是否允许多选。 */
    multiple?: boolean
    /** 节点是否可选中。 */
    selectable?: boolean
    /** 是否显示连接线。 */
    showLine?: boolean
    /** 整行节点是否可点击以进行选择。 */
    blockNode?: boolean
    /** 无数据时的空文本。 */
    emptyText?: string
    /** 组件级主题覆盖。 */
    theme?: MacTheme
    /** 组件尺寸（对齐 BaseElement）。 */
    size?: MacSize
    /** 其余属性透传。 */
    [key: string]: unknown
  }

  let {
    data = [],
    expandedKeys = $bindable(undefined),
    selectedKeys = $bindable(undefined),
    checkedKeys = $bindable(undefined),
    defaultExpandedKeys = [],
    defaultSelectedKeys = [],
    defaultCheckedKeys = [],
    defaultExpandAll = false,
    checkable = false,
    multiple = false,
    selectable = true,
    showLine = false,
    blockNode = true,
    emptyText = 'No data',
    theme = undefined,
    size = undefined,
    ...rest
  }: Props = $props()

  const config = useMacConfig()
  const resolvedSize = $derived(resolveSize(size, config))
  const resolvedTheme = $derived(resolveTheme(theme, config))

  let root: HTMLDivElement | undefined = $state()
  let innerExpanded = $state<Set<string>>(new Set())
  let innerSelected = $state<Set<string>>(new Set())
  let innerChecked = $state<Set<string>>(new Set())
  let halfCheckedKeys = $state<Set<string>>(new Set())

  function emit(name: string, detail?: unknown) {
    root?.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }))
  }

  // 从默认值初始化（仅一次）
  let initialized = false
  $effect(() => {
    if (initialized) return
    initialized = true
    if (defaultExpandAll) {
      const all = new Set<string>()
      const walk = (nodes: TreeNodeData[]) => {
        for (const node of nodes) {
          if (node.children && node.children.length > 0) {
            all.add(node.key)
            walk(node.children)
          }
        }
      }
      walk(data)
      innerExpanded = all
    } else if (defaultExpandedKeys.length > 0) {
      innerExpanded = new Set(defaultExpandedKeys)
    }
    if (defaultSelectedKeys.length > 0) {
      innerSelected = new Set(defaultSelectedKeys)
    }
    if (defaultCheckedKeys.length > 0) {
      innerChecked = new Set(defaultCheckedKeys)
      updateHalfCheckedKeys()
    }
  })

  // 受控值同步
  $effect(() => {
    if (expandedKeys !== undefined) innerExpanded = new Set(expandedKeys)
  })
  $effect(() => {
    if (selectedKeys !== undefined) innerSelected = new Set(selectedKeys)
  })
  $effect(() => {
    if (checkedKeys !== undefined) {
      innerChecked = new Set(checkedKeys)
      updateHalfCheckedKeys()
    }
  })

  /* ── 树辅助方法 ── */
  function findNode(key: string, nodes: TreeNodeData[]): TreeNodeData | undefined {
    for (const node of nodes) {
      if (node.key === key) return node
      if (node.children) {
        const found = findNode(key, node.children)
        if (found) return found
      }
    }
    return undefined
  }

  function getParentKey(key: string, nodes: TreeNodeData[], parentKey?: string): string | undefined {
    for (const node of nodes) {
      if (node.key === key) return parentKey
      if (node.children) {
        const found = getParentKey(key, node.children, node.key)
        if (found !== undefined) return found
      }
    }
    return undefined
  }

  /* ── 勾选状态 ── */
  function getCheckState(node: TreeNodeData): CheckState {
    if (!node.children || node.children.length === 0) {
      return innerChecked.has(node.key) ? 'checked' : 'unchecked'
    }
    const childStates = node.children.map((c) => getCheckState(c))
    if (childStates.every((s) => s === 'checked')) return 'checked'
    if (childStates.some((s) => s === 'checked' || s === 'half-checked')) return 'half-checked'
    return 'unchecked'
  }

  function updateHalfCheckedKeys() {
    const half = new Set<string>()
    const walk = (nodes: TreeNodeData[]) => {
      for (const node of nodes) {
        if (node.children && node.children.length > 0) {
          const state = getCheckState(node)
          if (state === 'half-checked') {
            half.add(node.key)
          }
          walk(node.children)
        }
      }
    }
    walk(data)
    halfCheckedKeys = half
  }

  /* ── 操作 ── */
  function toggleExpand(key: string) {
    const node = findNode(key, data)
    if (!node) return

    const isExpanding = !innerExpanded.has(key)

    if (expandedKeys === undefined) {
      const next = new Set(innerExpanded)
      if (isExpanding) {
        next.add(key)
      } else {
        next.delete(key)
      }
      innerExpanded = next
    }

    const newExpanded = isExpanding
      ? new Set([...innerExpanded, key])
      : new Set([...innerExpanded].filter((k) => k !== key))

    emit('mac-expand', {
      key,
      expanded: isExpanding,
      expandedKeys: Array.from(newExpanded),
      node,
    })
  }

  function toggleSelect(key: string) {
    const node = findNode(key, data)
    if (!node || node.disabled) return

    const isSelected = innerSelected.has(key)

    if (selectedKeys === undefined) {
      if (multiple) {
        const next = new Set(innerSelected)
        if (isSelected) {
          next.delete(key)
        } else {
          next.add(key)
        }
        innerSelected = next
      } else {
        innerSelected = isSelected ? new Set() : new Set([key])
      }
    }

    const newSelected = multiple
      ? isSelected
        ? new Set([...innerSelected].filter((k) => k !== key))
        : new Set([...innerSelected, key])
      : isSelected
        ? new Set<string>()
        : new Set([key])

    emit('mac-select', {
      key,
      selected: !isSelected,
      selectedKeys: Array.from(newSelected),
      node,
    })
  }

  function toggleCheck(key: string) {
    const node = findNode(key, data)
    if (!node || node.disabled) return

    const shouldCheck = !innerChecked.has(key)

    if (checkedKeys === undefined) {
      const newChecked = new Set(innerChecked)
      const toggleNode = (n: TreeNodeData) => {
        if (n.disabled) return
        if (shouldCheck) {
          newChecked.add(n.key)
        } else {
          newChecked.delete(n.key)
        }
        if (n.children) {
          n.children.forEach(toggleNode)
        }
      }
      toggleNode(node)

      // 更新祖先节点
      const updateAncestor = (childKey: string) => {
        const parentKey = getParentKey(childKey, data)
        if (!parentKey) return
        const parent = findNode(parentKey, data)
        if (!parent || !parent.children) return

        const allChecked = parent.children.every((c) => c.disabled || newChecked.has(c.key))

        if (allChecked) {
          newChecked.add(parentKey)
        } else {
          newChecked.delete(parentKey)
        }

        updateAncestor(parentKey)
      }

      updateAncestor(key)

      innerChecked = newChecked
      updateHalfCheckedKeys()
    }

    emit('mac-check', {
      key,
      checked: shouldCheck,
      checkedKeys: Array.from(innerChecked),
      halfCheckedKeys: Array.from(halfCheckedKeys),
      node,
    })
  }

  function onNodeClick(node: TreeNodeData) {
    if (node.disabled) return
    if (checkable && blockNode) {
      toggleCheck(node.key)
    } else if (selectable) {
      toggleSelect(node.key)
    }
  }
</script>

<div
  bind:this={root}
  {...rest}
  class="mac-scope mac-tree"
  data-theme={resolvedTheme}
  data-size={resolvedSize}
>
  {#if !data || data.length === 0}
    <div class="tree-empty">{emptyText}</div>
  {:else}
    <ul class="tree {showLine ? 'tree-line' : ''}">
      {#each data as node (node.key)}
        {@render renderNode(node)}
      {/each}
    </ul>
  {/if}
</div>

{#snippet renderNode(node: TreeNodeData)}
  {@const expanded = innerExpanded.has(node.key)}
  {@const selected = innerSelected.has(node.key)}
  {@const hasChildren = node.children && node.children.length > 0}
  {@const checkState = checkable ? getCheckState(node) : 'unchecked'}
  <li>
    <div
      class="tree-node {selected ? 'tree-node--selected' : ''} {node.disabled
        ? 'tree-node--disabled'
        : ''}"
      onclick={() => onNodeClick(node)}
    >
      <button
        class="tree-toggle {hasChildren ? '' : 'tree-toggle--placeholder'} {expanded
          ? 'tree-toggle--expanded'
          : ''}"
        tabindex="-1"
        type="button"
        onclick={(e: Event) => {
          if (hasChildren) {
            e.stopPropagation()
            toggleExpand(node.key)
          }
        }}
      >
        {#if hasChildren}
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" fill="none" />
          </svg>
        {/if}
      </button>
      {#if checkable}
        <span
          class="tree-checkbox {checkState === 'checked'
            ? 'tree-checkbox--checked'
            : checkState === 'half-checked'
              ? 'tree-checkbox--half'
              : ''}"
          onclick={(e: Event) => {
            e.stopPropagation()
            toggleCheck(node.key)
          }}
        ></span>
      {/if}
      <span class="tree-label">{node.label}</span>
    </div>
    {#if hasChildren && expanded}
      <ul class="tree-children">
        {#each node.children! as child (child.key)}
          {@render renderNode(child)}
        {/each}
      </ul>
    {/if}
  </li>
{/snippet}

<style>
  .mac-tree {
    display: block;
    font-family: var(--md-font-family);
  }

  .tree {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .tree :global(li) {
    list-style: none;
  }

  .tree-node {
    display: flex;
    align-items: center;
    gap: var(--md-spacing-xs);
    padding: var(--md-tree-node-padding);
    border-radius: var(--md-radius-md);
    cursor: pointer;
    transition: background var(--md-transition-fast);
    user-select: none;
    margin: 1px 0;
  }

  .tree-node:hover:not(.tree-node--disabled) {
    background: var(--md-tree-node-hover-bg);
  }

  .tree-node--selected {
    background: var(--md-tree-node-selected-bg);
    color: var(--md-tree-node-selected-color);
  }

  .tree-node--selected:hover:not(.tree-node--disabled) {
    background: var(--md-tree-node-selected-hover-bg);
  }

  .tree-node--disabled {
    opacity: var(--md-tree-disabled-opacity);
    cursor: not-allowed;
  }

  /* 切换按钮 */
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
    transition: transform var(--md-transition-fast);
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

  /* 复选框 */
  .tree-checkbox {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border: 2px solid var(--md-color-border);
    border-radius: 4px;
    cursor: pointer;
    flex-shrink: 0;
    transition: all var(--md-transition-fast);
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
    width: 8px;
    height: 2px;
    background: #fff;
    border-radius: 1px;
  }

  .tree-checkbox--checked::after {
    content: '';
    display: block;
    width: 4px;
    height: 8px;
    border: solid #fff;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
    margin-bottom: 1px;
  }

  /* 标签 */
  .tree-label {
    flex: 1;
    font-size: var(--md-font-size-base);
    color: var(--md-color-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tree-node--selected .tree-label {
    color: var(--md-tree-node-selected-color);
    font-weight: 500;
  }

  /* 子节点 */
  .tree-children {
    list-style: none;
    margin: 0;
    padding: 0;
    padding-left: var(--md-tree-indent);
  }

  /* 连接线 */
  .tree-line .tree-children {
    position: relative;
  }

  .tree-line .tree-children::before {
    content: '';
    position: absolute;
    left: 10px;
    top: 0;
    bottom: 0;
    width: 1px;
    background: var(--md-color-border);
  }

  .tree-line .tree-node {
    position: relative;
  }

  .tree-line .tree-node::before {
    content: '';
    position: absolute;
    left: -12px;
    top: 50%;
    width: 10px;
    height: 1px;
    background: var(--md-color-border);
  }

  /* 空状态 */
  .tree-empty {
    padding: var(--md-spacing-lg);
    text-align: center;
    color: var(--md-color-text-secondary);
    font-size: var(--md-font-size-sm);
  }

  /* 深色模式 */
  .mac-tree[data-theme='dark'] .tree-toggle:hover {
    background: rgba(255, 255, 255, 0.08);
    color: var(--md-color-text);
  }

  .mac-tree[data-theme='dark'] .tree-checkbox {
    border-color: var(--md-color-border);
  }
</style>
