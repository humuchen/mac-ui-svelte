<script lang="ts">
  import {
    useMacConfig,
    resolveSize,
    resolveTheme,
    type MacSize,
    type MacTheme,
  } from '../../internal/config.svelte'

  /**
   * @tag mac-data-table
   * @summary macOS 风格的数据表格组件，支持排序、分页、行选择。
   *
   * @slot title - 表格标题区域。
   * @slot footer - 表格底部区域。
   *
   * @event mac-data-table-sort - 排序变化时触发。`detail: { sorter }`
   * @event mac-data-table-change - 分页/排序变化时触发。`detail: { page, pageSize, sorter }`
   * @event mac-data-table-select - 行选择变化时触发。`detail: { selectedRowKeys, selectedRows, type, changedRow, changedRowKey }`
   * @event mac-data-table-row-click - 行点击时触发。`detail: { row, index }`
   */

  export type DataTableSortOrder = 'asc' | 'desc'

  export interface DataTableColumn<T = any> {
    /** 列唯一标识 */
    key: string
    /** 列标题 */
    title: string
    /** 数据字段名（缺省时取 key） */
    dataIndex?: string
    /** 列宽 */
    width?: string | number
    /** 对齐方式 */
    align?: 'left' | 'center' | 'right'
    /** 是否可排序 */
    sortable?: boolean
    /** 支持的排序方向 */
    sortDirections?: DataTableSortOrder[]
    /** 默认排序方向 */
    defaultSortOrder?: DataTableSortOrder
    /** 本地排序比较函数 */
    sorter?: (a: T, b: T) => number
    /** 自定义单元格渲染（返回 HTML 字符串或文本） */
    render?: (row: T, index: number, column: DataTableColumn<T>) => unknown
    /** 单元格内容超出省略 */
    ellipsis?: boolean
  }

  export interface DataTablePagination {
    current?: number
    pageSize?: number
    defaultCurrent?: number
    defaultPageSize?: number
    total?: number
    pageSizeOptions?: number[]
    showSizeChanger?: boolean
    showQuickJumper?: boolean
    showTotal?: boolean
    simple?: boolean
    disabled?: boolean
    prefix?: string
  }

  export interface DataTableRowSelection<T = any> {
    type?: 'checkbox' | 'radio'
    selectedRowKeys?: Array<string | number>
    getCheckboxProps?: (row: T, index: number) => { disabled?: boolean }
    disabled?: boolean
  }

  export interface DataTableSortInfo {
    columnKey: string
    order: DataTableSortOrder
  }

  interface Props {
    /** 列定义。 */
    columns?: DataTableColumn[]
    /** 数据源。 */
    data?: any[]
    /** 行 key 字段或取值函数。 */
    rowKey?: string | ((record: any) => string | number)
    /** 行类名生成函数。 */
    rowClassName?: (row: any, index: number) => string
    /** 分页配置（false 关闭）。 */
    pagination?: boolean | DataTablePagination
    /** 行选择配置。 */
    rowSelection?: DataTableRowSelection
    /** 远程数据模式（排序/分页由外部处理）。 */
    remote?: boolean
    /** 显示边框。 */
    bordered?: boolean
    /** 斑马纹。 */
    striped?: boolean
    /** 表头吸顶。 */
    sticky?: boolean
    /** 加载状态。 */
    loading?: boolean
    /** 空数据文本。 */
    emptyText?: string
    /** 组件尺寸。 */
    size?: MacSize
    /** 组件级主题覆盖。 */
    theme?: MacTheme
    /** 表格标题区域。 */
    title?: import('svelte').Snippet
    /** 表格底部区域。 */
    footer?: import('svelte').Snippet
    /** 其余属性透传。 */
    [key: string]: unknown
  }

  let {
    columns = [],
    data = [],
    rowKey = undefined,
    rowClassName = undefined,
    pagination = true,
    rowSelection = undefined,
    remote = false,
    bordered = false,
    striped = false,
    sticky = false,
    loading = false,
    emptyText = '暂无数据',
    size = undefined,
    theme = undefined,
    title,
    footer,
    ...rest
  }: Props = $props()

  const config = useMacConfig()
  const resolvedSize = $derived(resolveSize(size, config))
  const resolvedTheme = $derived(resolveTheme(theme, config))

  let root: HTMLDivElement | undefined = $state()

  function emit(name: string, detail?: unknown) {
    root?.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }))
  }

  let internalPage = $state(1)
  let internalPageSize = $state(10)
  let internalSelectedKeys = $state<Array<string | number>>([])
  let sortColumn = $state<string | null>(null)
  let sortOrder = $state<DataTableSortOrder | null>(null)
  let sortInitialized = false

  const paginationConfig = $derived(
    pagination === false || pagination == null ? null : pagination === true ? {} : pagination,
  )
  const isPageControlled = $derived(
    !!paginationConfig && typeof paginationConfig.current === 'number',
  )
  const isPageSizeControlled = $derived(
    !!paginationConfig && typeof paginationConfig.pageSize === 'number',
  )
  const effectivePage = $derived(
    paginationConfig && typeof paginationConfig.current === 'number'
      ? paginationConfig.current
      : internalPage,
  )
  const effectivePageSize = $derived(
    paginationConfig && typeof paginationConfig.pageSize === 'number'
      ? paginationConfig.pageSize
      : internalPageSize,
  )
  const effectiveTotal = $derived(
    paginationConfig && typeof paginationConfig.total === 'number'
      ? paginationConfig.total
      : data.length,
  )
  const pageCount = $derived(Math.max(1, Math.ceil(effectiveTotal / effectivePageSize)))

  // 默认排序初始化
  $effect(() => {
    if (!sortInitialized && columns.length) {
      const col = columns.find((c) => c.defaultSortOrder)
      if (col) {
        sortColumn = col.key
        sortOrder = col.defaultSortOrder!
      }
      sortInitialized = true
    }
  })

  const processedData = $derived.by(() => {
    if (remote || !sortColumn || !sortOrder) return data ?? []
    const col = columns.find((c) => c.key === sortColumn)
    if (!col?.sorter) return data ?? []
    const sorted = [...(data ?? [])]
    sorted.sort((a, b) => {
      const r = col.sorter!(a, b)
      return sortOrder === 'desc' ? -r : r
    })
    return sorted
  })

  // 页码钳制
  $effect(() => {
    if (!paginationConfig) return
    if (internalPage > pageCount) internalPage = pageCount
    if (internalPage < 1) internalPage = 1
  })

  const displayEntries = $derived.by(() => {
    const source = remote ? data : processedData
    const arr = source ?? []
    if (!paginationConfig || remote) {
      return arr.map((row, index) => ({ row, index }))
    }
    const start = (effectivePage - 1) * effectivePageSize
    const end = start + effectivePageSize
    const entries: { row: any; index: number }[] = []
    for (let i = start; i < Math.min(end, arr.length); i++) {
      entries.push({ row: arr[i], index: i })
    }
    return entries
  })

  const currentSortInfo = $derived(
    sortColumn && sortOrder ? { columnKey: sortColumn, order: sortOrder } : null,
  )

  function getRowKey(row: any, index: number): string | number {
    if (typeof rowKey === 'function') return rowKey(row)
    if (typeof rowKey === 'string') return row?.[rowKey]
    return index
  }

  const isSelectionControlled = $derived(
    !!rowSelection && Array.isArray(rowSelection.selectedRowKeys),
  )

  function getSelectedKeys(): Array<string | number> {
    if (isSelectionControlled) return rowSelection!.selectedRowKeys!
    return internalSelectedKeys
  }

  function isRowDisabled(row: any, index: number): boolean {
    return !!rowSelection?.getCheckboxProps?.(row, index)?.disabled
  }

  function emitSelect(
    selectedRowKeys: Array<string | number>,
    type: 'single' | 'multiple' | 'all',
    changedRow?: any,
    changedRowKey?: string | number,
  ) {
    const keySet = new Set(selectedRowKeys)
    const source = remote ? data : processedData
    const selectedRows = (source ?? []).filter((r, i) => keySet.has(getRowKey(r, i)))
    if (!isSelectionControlled) {
      internalSelectedKeys = selectedRowKeys
    }
    emit('mac-data-table-select', {
      selectedRowKeys,
      selectedRows,
      type,
      changedRow,
      changedRowKey,
    })
  }

  function handleRowSelect(row: any, index: number, checked: boolean) {
    const key = getRowKey(row, index)
    const selType = rowSelection?.type ?? 'checkbox'
    if (selType === 'radio') {
      emitSelect([key], 'single', row, key)
      return
    }
    const cur = new Set(getSelectedKeys())
    if (checked) cur.add(key)
    else cur.delete(key)
    emitSelect([...cur], 'multiple', row, key)
  }

  function handleSelectAll(checked: boolean) {
    const source = remote ? data : processedData
    let newKeys: Array<string | number> = []
    if (checked) {
      ;(source ?? []).forEach((r, i) => {
        if (!isRowDisabled(r, i)) newKeys.push(getRowKey(r, i))
      })
    }
    emitSelect(newKeys, 'all')
  }

  function handleSortClick(col: DataTableColumn) {
    if (!col.sortable) return
    const directions = col.sortDirections ?? ['asc', 'desc']
    let nextOrder: DataTableSortOrder | null
    if (sortColumn === col.key && sortOrder) {
      const idx = directions.indexOf(sortOrder)
      nextOrder = idx >= 0 && idx < directions.length - 1 ? directions[idx + 1] : null
    } else {
      nextOrder = directions[0] ?? null
    }
    sortColumn = nextOrder ? col.key : null
    sortOrder = nextOrder
    if (!isPageControlled) internalPage = 1
    emit('mac-data-table-sort', { sorter: currentSortInfo })
    emit('mac-data-table-change', { page: 1, pageSize: effectivePageSize, sorter: currentSortInfo })
  }

  function gotoPage(page: number, newPageSize?: number) {
    const cfg = paginationConfig
    if (!cfg || cfg.disabled) return
    const newSize = newPageSize ?? effectivePageSize
    const sizeChanged = newSize !== effectivePageSize
    const pc = Math.max(1, Math.ceil(effectiveTotal / newSize))
    let target = sizeChanged ? 1 : page
    target = Math.min(Math.max(1, target), pc)
    if (!isPageControlled) internalPage = target
    if (!isPageSizeControlled) internalPageSize = newSize
    emit('mac-data-table-change', { page: target, pageSize: newSize, sorter: currentSortInfo })
  }

  function handleQuickJumper(e: KeyboardEvent) {
    if (e.key !== 'Enter') return
    const input = e.target as HTMLInputElement
    const val = parseInt(input.value, 10)
    if (!Number.isNaN(val)) {
      gotoPage(val)
    }
    input.value = ''
  }

  function handleSizeChange(e: Event) {
    const select = e.target as HTMLSelectElement
    const val = parseInt(select.value, 10)
    if (!Number.isNaN(val)) gotoPage(effectivePage, val)
  }

  function getPageList(): Array<number | 'ellipsis'> {
    if (pageCount <= 7) {
      return Array.from({ length: pageCount }, (_, i) => i + 1)
    }
    const pages: Array<number | 'ellipsis'> = [1]
    const left = Math.max(2, effectivePage - 1)
    const right = Math.min(pageCount - 1, effectivePage + 1)
    if (left > 2) pages.push('ellipsis')
    for (let i = left; i <= right; i++) pages.push(i)
    if (right < pageCount - 1) pages.push('ellipsis')
    pages.push(pageCount)
    return pages
  }

  function renderCellContent(row: any, index: number, col: DataTableColumn): unknown {
    if (col.render) {
      return col.render(row, index, col)
    }
    const field = col.dataIndex ?? col.key
    const val = row?.[field]
    return val == null ? '' : String(val)
  }

  function widthStyle(width?: string | number): string {
    if (width == null) return ''
    return `width: ${typeof width === 'number' ? `${width}px` : width}`
  }

  const hasSelection = $derived(!!rowSelection)

  // 全选状态
  const selectableItems = $derived(
    (remote ? data : processedData ?? [])
      .map((r, i) => ({ key: getRowKey(r, i), disabled: isRowDisabled(r, i) }))
      .filter((x) => !x.disabled),
  )
  const allChecked = $derived.by(() => {
    const keySet = new Set(getSelectedKeys())
    const checkedCount = selectableItems.filter((s) => keySet.has(s.key)).length
    return selectableItems.length > 0 && checkedCount === selectableItems.length
  })
  const indeterminate = $derived.by(() => {
    const keySet = new Set(getSelectedKeys())
    const checkedCount = selectableItems.filter((s) => keySet.has(s.key)).length
    return checkedCount > 0 && checkedCount < selectableItems.length
  })

  // 让 selectedKeys 变化触发重渲染
  $effect(() => {
    void internalSelectedKeys
    void rowSelection?.selectedRowKeys
  })

  const colspan = $derived(columns.length + (hasSelection ? 1 : 0))

  let allCheckedBinding = $state(false)
  $effect(() => {
    allCheckedBinding = allChecked
  })
</script>

<div
  bind:this={root}
  {...rest}
  class="mac-scope mac-data-table container {bordered ? 'table--bordered' : ''} {striped
    ? 'table--striped'
    : ''} {sticky ? 'table--sticky' : ''}"
  data-theme={resolvedTheme}
  data-size={resolvedSize}
>
  <div class="title-bar">{#if title}{@render title()}{/if}</div>
  <div class="table-wrapper">
    <table>
      {#if columns.length}
        <thead>
          <tr>
            {#if hasSelection}
              <th class="selection-cell">
                {#if (rowSelection?.type ?? 'checkbox') === 'radio'}
                  <!-- radio 无全选 -->
                {:else}
                  <input
                    type="checkbox"
                    class="checkbox"
                    checked={allCheckedBinding}
                    indeterminate={indeterminate}
                    disabled={rowSelection?.disabled || selectableItems.length === 0}
                    onchange={(e) => handleSelectAll((e.target as HTMLInputElement).checked)}
                  />
                {/if}
              </th>
            {/if}
            {#each columns as col (col.key)}
              <th
                class="{col.sortable ? 'sortable' : ''} {col.align === 'center'
                  ? 'col-center'
                  : col.align === 'right'
                    ? 'col-right'
                    : 'col-left'}"
                style={widthStyle(col.width)}
                onclick={() => handleSortClick(col)}
              >
                <span class="th-inner">
                  <span>{col.title}</span>
                  {#if col.sortable}
                    <span class="sort-trigger">
                      <span class="caret {sortColumn === col.key && sortOrder === 'asc' ? 'active' : ''}">
                        <svg viewBox="0 0 24 24" width="10" height="10" aria-hidden="true"><path d="M6 14l6-6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                      </span>
                      <span class="caret {sortColumn === col.key && sortOrder === 'desc' ? 'active' : ''}">
                        <svg viewBox="0 0 24 24" width="10" height="10" aria-hidden="true"><path d="M6 10l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                      </span>
                    </span>
                  {/if}
                </span>
              </th>
            {/each}
          </tr>
        </thead>
      {/if}
      <tbody>
        {#if displayEntries.length === 0}
          <tr class="empty">
            <td colspan={colspan}>
              {#if footer}{:else}{emptyText}{/if}
            </td>
          </tr>
        {:else}
          {#each displayEntries as { row, index } (index)}
            {@const key = getRowKey(row, index)}
            {@const selected = new Set(getSelectedKeys()).has(key)}
            {@const customClass = rowClassName?.(row, index) ?? ''}
            <tr
              class="{selected ? 'row-selected' : ''} {customClass}"
              onclick={() => emit('mac-data-table-row-click', { row, index })}
            >
              {#if hasSelection}
                <td class="selection-cell">
                  <input
                    type={(rowSelection?.type ?? 'checkbox') === 'radio' ? 'radio' : 'checkbox'}
                    class={(rowSelection?.type ?? 'checkbox') === 'radio' ? 'radio' : 'checkbox'}
                    checked={selected}
                    disabled={
                      isRowDisabled(row, index) || !!rowSelection?.disabled
                    }
                    onclick={(e) => e.stopPropagation()}
                    onchange={(e) => {
                      if ((rowSelection?.type ?? 'checkbox') === 'radio') {
                        if (!isRowDisabled(row, index) && !rowSelection?.disabled)
                          handleRowSelect(row, index, true)
                      } else {
                        handleRowSelect(row, index, (e.target as HTMLInputElement).checked)
                      }
                    }}
                  />
                </td>
              {/if}
              {#each columns as col (col.key)}
                {@const content = renderCellContent(row, index, col)}
                <td
                  class="{col.align === 'center'
                    ? 'col-center'
                    : col.align === 'right'
                      ? 'col-right'
                      : 'col-left'}"
                  style={widthStyle(col.width)}
                >
                  <span
                    class="cell {col.ellipsis ? 'cell--ellipsis' : ''}"
                    title={col.ellipsis && typeof content === 'string' ? content : undefined}
                  >
                    {#if typeof content === 'string' && /<[a-z][\s\S]*>/i.test(content)}
                      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                      {@html content}
                    {:else}
                      {content}
                    {/if}
                  </span>
                </td>
              {/each}
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
  <div class="footer-slot">{#if footer}{@render footer()}{/if}</div>

  {#if paginationConfig}
    {#if paginationConfig.simple}
      <div class="pagination pagination--simple {paginationConfig.disabled ? 'pagination--disabled' : ''}">
        <button
          class="pg-btn"
          disabled={paginationConfig.disabled || effectivePage <= 1}
          onclick={() => gotoPage(effectivePage - 1)}
          aria-label="上一页"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <span class="pg-simple-wrap" style="display:inline-flex;align-items:center;gap:6px;">
          <input
            class="pg-simple-input"
            type="number"
            min="1"
            max={pageCount}
            value={String(effectivePage)}
            disabled={paginationConfig.disabled}
            onkeydown={handleQuickJumper}
          />
          <span class="pg-simple-slash">/ {pageCount}</span>
        </span>
        <button
          class="pg-btn"
          disabled={paginationConfig.disabled || effectivePage >= pageCount}
          onclick={() => gotoPage(effectivePage + 1)}
          aria-label="下一页"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
    {:else}
      {@const pageSizeOptions = paginationConfig.pageSizeOptions ?? [10, 20, 50, 100]}
      {@const showSizeChanger = paginationConfig.showSizeChanger ?? pageSizeOptions.length > 1}
      {@const showTotal = paginationConfig.showTotal ?? true}
      {@const prefix = paginationConfig.prefix ?? '共 '}
      {@const start = effectiveTotal === 0 ? 0 : (effectivePage - 1) * effectivePageSize + 1}
      {@const end = Math.min(effectivePage * effectivePageSize, effectiveTotal)}
      <div class="pagination {paginationConfig.disabled ? 'pagination--disabled' : ''}">
        {#if showTotal}
          <span class="pagination-total">
            {prefix}{effectiveTotal} 条{effectiveTotal > 0 ? ` · 第 ${start}-${end} 条` : ''}
          </span>
        {/if}
        <div class="pagination-list">
          <button
            class="pg-btn"
            disabled={paginationConfig.disabled || effectivePage <= 1}
            onclick={() => gotoPage(effectivePage - 1)}
            aria-label="上一页"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          {#each getPageList() as p, i (i)}
            {#if p === 'ellipsis'}
              <span class="pg-ellipsis">…</span>
            {:else}
              <button
                class="pg-btn {p === effectivePage ? 'active' : ''}"
                disabled={paginationConfig.disabled}
                onclick={() => gotoPage(p as number)}
              >
                {p}
              </button>
            {/if}
          {/each}
          <button
            class="pg-btn"
            disabled={paginationConfig.disabled || effectivePage >= pageCount}
            onclick={() => gotoPage(effectivePage + 1)}
            aria-label="下一页"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
        {#if showSizeChanger}
          <span class="pg-size">
            <select
              disabled={paginationConfig.disabled}
              onchange={handleSizeChange}
              value={String(effectivePageSize)}
            >
              {#each pageSizeOptions as opt (opt)}
                <option value={opt} selected={opt === effectivePageSize}>{opt} 条/页</option>
              {/each}
            </select>
          </span>
        {/if}
        {#if paginationConfig.showQuickJumper}
          <span class="pg-jumper">
            跳至<input
              type="number"
              min="1"
              disabled={paginationConfig.disabled}
              onkeydown={handleQuickJumper}
            />页
          </span>
        {/if}
      </div>
    {/if}
  {/if}

  {#if loading}
    <div class="loading-mask"><div class="spinner"></div></div>
  {/if}
</div>

<style>
  .mac-data-table {
    display: block;
    position: relative;
  }

  .container {
    width: 100%;
  }

  .title-bar {
    margin-bottom: var(--md-spacing-sm);
  }

  .table-wrapper {
    overflow-x: auto;
    border: 1px solid var(--md-table-border, var(--md-color-border));
    border-radius: var(--md-table-radius, var(--md-radius-lg));
  }

  .mac-data-table.table--bordered .table-wrapper {
    border: 1px solid var(--md-color-border);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--md-table-font-size, var(--md-font-size-sm));
  }

  thead th {
    text-align: left;
    padding: var(--md-table-header-padding, 10px 12px);
    background: var(--md-table-header-bg, var(--md-color-bg-secondary));
    color: var(--md-table-header-color, var(--md-color-text-secondary));
    font-weight: 500;
    white-space: nowrap;
    border-bottom: 1px solid var(--md-color-border);
  }

  .mac-data-table.table--sticky thead th {
    position: sticky;
    top: 0;
    z-index: 1;
  }

  th.sortable {
    cursor: pointer;
    user-select: none;
  }

  th.sortable:hover {
    color: var(--md-color-primary);
  }

  .th-inner {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .sort-trigger {
    display: inline-flex;
    flex-direction: column;
    gap: 1px;
  }

  .caret {
    color: var(--md-color-text-secondary);
    opacity: 0.4;
    display: inline-flex;
    line-height: 1;
  }

  .caret.active {
    color: var(--md-color-primary);
    opacity: 1;
  }

  tbody td {
    padding: var(--md-table-cell-padding, 10px 12px);
    border-bottom: 1px solid var(--md-table-row-border, rgba(0, 0, 0, 0.06));
    color: var(--md-color-text);
  }

  tbody tr:last-child td {
    border-bottom: none;
  }

  tbody tr {
    transition: background var(--md-transition-fast);
  }

  tbody tr:hover {
    background: var(--md-table-row-hover-bg, rgba(0, 122, 255, 0.04));
  }

  .mac-data-table.table--striped tbody tr:nth-child(even) {
    background: var(--md-table-striped-bg, rgba(0, 0, 0, 0.02));
  }

  tbody tr.row-selected {
    background: var(--md-table-row-selected-bg, rgba(0, 122, 255, 0.08));
  }

  tr.empty td {
    text-align: center;
    padding: var(--md-spacing-xl);
    color: var(--md-color-text-secondary);
  }

  .col-center {
    text-align: center;
  }

  .col-right {
    text-align: right;
  }

  .col-left {
    text-align: left;
  }

  .selection-cell {
    width: 40px;
    text-align: center;
  }

  .checkbox,
  .radio {
    accent-color: var(--md-color-primary);
    cursor: pointer;
  }

  .cell--ellipsis {
    display: inline-block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    vertical-align: bottom;
  }

  /* 分页 */
  .pagination {
    display: flex;
    align-items: center;
    gap: var(--md-spacing-sm);
    margin-top: var(--md-spacing-md);
    flex-wrap: wrap;
  }

  .pagination--disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  .pagination-total {
    font-size: var(--md-font-size-sm);
    color: var(--md-color-text-secondary);
  }

  .pagination-list {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .pg-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 28px;
    height: 28px;
    padding: 0 6px;
    border: 1px solid var(--md-color-border);
    border-radius: var(--md-radius-md);
    background: var(--md-color-bg);
    color: var(--md-color-text);
    font-size: var(--md-font-size-sm);
    cursor: pointer;
    transition: all var(--md-transition-fast);
  }

  .pg-btn:hover:not(:disabled) {
    border-color: var(--md-color-primary);
    color: var(--md-color-primary);
  }

  .pg-btn.active {
    background: var(--md-color-primary);
    border-color: var(--md-color-primary);
    color: #fff;
  }

  .pg-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .pg-ellipsis {
    color: var(--md-color-text-secondary);
    padding: 0 2px;
  }

  .pg-size select {
    padding: 4px 8px;
    border: 1px solid var(--md-color-border);
    border-radius: var(--md-radius-md);
    background: var(--md-color-bg);
    color: var(--md-color-text);
    font-size: var(--md-font-size-sm);
  }

  .pg-jumper {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: var(--md-font-size-sm);
    color: var(--md-color-text-secondary);
  }

  .pg-jumper input {
    width: 48px;
    padding: 4px 6px;
    border: 1px solid var(--md-color-border);
    border-radius: var(--md-radius-md);
    font-size: var(--md-font-size-sm);
  }

  .pg-simple-input {
    width: 44px;
    padding: 4px 6px;
    border: 1px solid var(--md-color-border);
    border-radius: var(--md-radius-md);
    font-size: var(--md-font-size-sm);
    text-align: center;
  }

  .pg-simple-slash {
    font-size: var(--md-font-size-sm);
    color: var(--md-color-text-secondary);
  }

  /* 加载遮罩 */
  .loading-mask {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.6);
    z-index: 10;
  }

  .mac-data-table[data-theme='dark'] .loading-mask {
    background: rgba(0, 0, 0, 0.5);
  }

  .spinner {
    width: 24px;
    height: 24px;
    border: 2px solid rgba(0, 0, 0, 0.1);
    border-top-color: var(--md-color-primary);
    border-radius: 50%;
    animation: table-spin 0.8s linear infinite;
  }

  @keyframes table-spin {
    to {
      transform: rotate(360deg);
    }
  }

  .footer-slot {
    margin-top: var(--md-spacing-sm);
  }
</style>
