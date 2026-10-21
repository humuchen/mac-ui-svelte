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
   * @tag mac-descriptions
   * @summary macOS 风格的键值对描述列表组件。
   *
   * @slot children - MacDescriptionItem 元素。
   * @slot title - 自定义标题内容。
   * @slot extra - 头部额外内容（例如操作按钮）。
   */

  import type { DescriptionItem } from './descriptions-types'

  interface Props {
    /** 标签位置：'left' 在值旁边，'top' 在值上方。 */
    labelPlacement?: 'left' | 'top'
    /** 标签文本对齐方式。 */
    labelAlign?: 'left' | 'center' | 'right'
    /** 每行列数。 */
    column?: number
    /** 组件尺寸。 */
    size?: MacSize
    /** 是否显示边框样式。 */
    bordered?: boolean
    /** 标题文本。 */
    title?: string
    /** 标签与值之间的分隔符（仅 label-placement='left' 且非 bordered）。 */
    separator?: string
    /** 数据项（替代插槽方式）。 */
    items?: DescriptionItem[]
    /** 组件级主题覆盖。 */
    theme?: MacTheme
    /** 子项内容（对应 Lit 版默认 slot）。 */
    children?: Snippet
    /** 自定义标题内容。 */
    titleSnippet?: Snippet
    /** 头部额外内容。 */
    extra?: Snippet
    /** 其余属性透传。 */
    [key: string]: unknown
  }

  let {
    labelPlacement = 'left',
    labelAlign = 'left',
    column = 3,
    size = undefined,
    bordered = false,
    title = '',
    separator = ':',
    items = [],
    theme = undefined,
    children,
    titleSnippet,
    extra,
    ...rest
  }: Props = $props()

  const config = useMacConfig()
  const resolvedSize = $derived(resolveSize(size, config))
  const resolvedTheme = $derived(resolveTheme(theme, config))

  /** 按列数与 span 构建行。 */
  const rows = $derived.by(() => {
    const colCount = column
    const result: { item: DescriptionItem; effectiveSpan: number }[][] = []
    let currentRow: { item: DescriptionItem; effectiveSpan: number }[] = []
    let currentSpan = 0

    for (const item of items) {
      const span = Math.min(item.span || 1, colCount)
      if (currentSpan + span > colCount) {
        result.push(currentRow)
        currentRow = [{ item, effectiveSpan: span }]
        currentSpan = span
      } else {
        currentRow.push({ item, effectiveSpan: span })
        currentSpan += span
      }
    }
    if (currentRow.length > 0) {
      result.push(currentRow)
    }
    return result
  })

  const hasHeader = $derived(!!title || !!titleSnippet || !!extra)
</script>

<div
  {...rest}
  class="mac-scope mac-descriptions"
  data-theme={resolvedTheme}
  data-size={resolvedSize}
  data-bordered={bordered}
  data-label-align={labelAlign}
>
  <div class="container">
    {#if hasHeader}
      <div class="header">
        <div class="title">
          {#if titleSnippet}{@render titleSnippet()}{:else}{title}{/if}
        </div>
        <div class="extra">
          {#if extra}{@render extra()}{/if}
        </div>
      </div>
    {/if}

    {#if labelPlacement === 'left' && bordered}
      <table class="table">
        {#each rows as row}
          <tr>
            {#each row as { item, effectiveSpan }}
              <td class="label-cell" style={item.labelStyle || ''}>{item.label}</td>
              <td class="value-cell" colspan={effectiveSpan * 2 - 1} style={item.contentStyle || ''}>
                {item.value}
              </td>
            {/each}
          </tr>
        {/each}
      </table>
    {:else if labelPlacement === 'left'}
      <div class="left-list">
        {#each rows as row}
          <div class="left-row" style="grid-template-columns: repeat({column}, minmax(0, 1fr))">
            {#each row as { item, effectiveSpan }}
              <div class="left-item" style="grid-column: span {effectiveSpan}">
                <div class="left-label" style={item.labelStyle || ''}>{item.label}</div>
                <span class="left-separator">{separator}</span>
                <div class="left-value" style={item.contentStyle || ''}>{item.value}</div>
              </div>
            {/each}
          </div>
        {/each}
      </div>
    {:else if bordered}
      <table class="top-table">
        {#each rows as row}
          <tr>
            {#each row as { item, effectiveSpan }}
              <td class="top-table-label" colspan={effectiveSpan} style={item.labelStyle || ''}>
                {item.label}
              </td>
            {/each}
            {#if row.length < column}
              <td colspan={column - row.reduce((s, r) => s + r.effectiveSpan, 0)}></td>
            {/if}
          </tr>
          <tr>
            {#each row as { item, effectiveSpan }}
              <td class="top-table-value" colspan={effectiveSpan} style={item.contentStyle || ''}>
                {item.value}
              </td>
            {/each}
            {#if row.length < column}
              <td colspan={column - row.reduce((s, r) => s + r.effectiveSpan, 0)}></td>
            {/if}
          </tr>
        {/each}
      </table>
    {:else}
      <div class="top-grid" style="grid-template-columns: repeat({column}, 1fr)">
        {#each rows as row}
          {#each row as { item, effectiveSpan }}
            <div class="top-item" style="grid-column: span {effectiveSpan}">
              <div class="top-label" style={item.labelStyle || ''}>{item.label}</div>
              <div class="top-value" style={item.contentStyle || ''}>{item.value}</div>
            </div>
          {/each}
        {/each}
      </div>
    {/if}

    <!-- 插槽模式：隐藏容器（Lit 版为 display:none 的 slot） -->
    {#if children}
      <div style="display:none">{@render children()}</div>
    {/if}
  </div>
</div>

<style>
  .mac-descriptions {
    display: block;
    --md-descriptions-container-bg: var(--md-glass-menu-bg);
    --md-descriptions-container-border: var(--md-glass-separator);
    --md-descriptions-container-radius: var(--md-radius-dock);
    --md-descriptions-container-shadow: var(--md-menu-shadow);
    --md-descriptions-header-padding: var(--md-spacing-md) var(--md-spacing-lg);
    --md-descriptions-header-border: var(--md-glass-separator);
    --md-descriptions-title-font-size: var(--md-font-size-menu);
    --md-descriptions-title-color: var(--md-color-text);
    --md-descriptions-label-color: var(--md-color-text-secondary);
    --md-descriptions-label-bg: rgba(0, 0, 0, 0.02);
    --md-descriptions-label-width: 120px;
    --md-descriptions-value-color: var(--md-color-text);
    --md-descriptions-value-bg: transparent;
    --md-descriptions-row-border: var(--md-glass-separator);
    --md-descriptions-cell-padding: var(--md-spacing-sm) var(--md-spacing-lg);
    --md-descriptions-separator-color: var(--md-color-text-secondary);
  }

  .container {
    background: var(--md-descriptions-container-bg);
    backdrop-filter: blur(var(--md-glass-blur)) saturate(var(--md-glass-saturate));
    -webkit-backdrop-filter: blur(var(--md-glass-blur)) saturate(var(--md-glass-saturate));
    border: 0.5px solid var(--md-descriptions-container-border);
    border-radius: var(--md-descriptions-container-radius);
    box-shadow: var(--md-descriptions-container-shadow);
    overflow: hidden;
  }

  /* ─── Header ─── */

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--md-descriptions-header-padding);
    border-bottom: 0.5px solid var(--md-descriptions-header-border);
  }

  .title {
    font-size: var(--md-descriptions-title-font-size);
    font-weight: 600;
    color: var(--md-descriptions-title-color);
    letter-spacing: -0.01em;
  }

  .extra {
    margin-left: auto;
  }

  /* ─── Table Layout (label-placement: left, bordered) ─── */

  .table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }

  .table tr:not(:last-child) td {
    border-bottom: 0.5px solid var(--md-descriptions-row-border);
  }

  .label-cell {
    color: var(--md-descriptions-label-color);
    background: var(--md-descriptions-label-bg);
    padding: var(--md-descriptions-cell-padding);
    font-size: var(--md-font-size-sm);
    white-space: nowrap;
    vertical-align: top;
    width: var(--md-descriptions-label-width);
  }

  .value-cell {
    color: var(--md-descriptions-value-color);
    background: var(--md-descriptions-value-bg);
    padding: var(--md-descriptions-cell-padding);
    font-size: var(--md-font-size-base);
    vertical-align: top;
    word-break: break-word;
  }

  /* ─── Left placement (non-bordered): inline label: value ─── */

  .left-list {
    display: flex;
    flex-direction: column;
  }

  /* 行容器：按 column 分列（与 bordered / top 布局的列语义一致） */
  .left-row {
    display: grid;
    column-gap: var(--md-spacing-lg);
    align-items: start;
  }

  .left-row:not(:last-child) {
    border-bottom: 0.5px solid var(--md-descriptions-row-border);
  }

  .left-item {
    display: flex;
    align-items: baseline;
    padding: var(--md-descriptions-cell-padding);
    min-width: 0;
  }

  .left-label {
    color: var(--md-descriptions-label-color);
    font-size: var(--md-font-size-sm);
    white-space: nowrap;
    min-width: var(--md-descriptions-label-width);
    max-width: var(--md-descriptions-label-width);
    flex-shrink: 0;
  }

  .left-separator {
    color: var(--md-descriptions-separator-color);
    margin: 0 var(--md-spacing-xs);
    flex-shrink: 0;
  }

  .left-value {
    color: var(--md-descriptions-value-color);
    font-size: var(--md-font-size-base);
    flex: 1;
    word-break: break-word;
  }

  /* ─── Top placement: grid layout ─── */

  .top-grid {
    display: grid;
    gap: 0;
  }

  .top-item {
    padding: var(--md-descriptions-cell-padding);
  }

  .top-item:not(:last-child) {
    border-bottom: 0.5px solid var(--md-descriptions-row-border);
  }

  .top-label {
    color: var(--md-descriptions-label-color);
    font-size: var(--md-font-size-sm);
    margin-bottom: var(--md-spacing-xs);
  }

  .top-value {
    color: var(--md-descriptions-value-color);
    font-size: var(--md-font-size-base);
    word-break: break-word;
  }

  /* ─── Top placement bordered: table with labels above ─── */

  .top-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }

  .top-table td {
    padding: var(--md-descriptions-cell-padding);
    vertical-align: top;
    border-right: 0.5px solid var(--md-descriptions-row-border);
    border-bottom: 0.5px solid var(--md-descriptions-row-border);
  }

  .top-table tr:last-child td {
    border-bottom: none;
  }

  .top-table td:last-child {
    border-right: none;
  }

  .top-table .top-table-label {
    color: var(--md-descriptions-label-color);
    font-size: var(--md-font-size-sm);
    background: var(--md-descriptions-label-bg);
    border-bottom: 0.5px solid var(--md-descriptions-row-border);
    padding: calc(var(--md-descriptions-cell-padding) * 0.6) var(--md-descriptions-cell-padding);
  }

  .top-table .top-table-value {
    color: var(--md-descriptions-value-color);
    font-size: var(--md-font-size-base);
    word-break: break-word;
  }

  /* ─── Bordered variant (left placement) ─── */

  .mac-descriptions[data-bordered='true'] .label-cell,
  .mac-descriptions[data-bordered='true'] .value-cell {
    border-right: 0.5px solid var(--md-descriptions-row-border);
  }

  .mac-descriptions[data-bordered='true'] .left-item {
    background: var(--md-descriptions-label-bg);
  }

  .mac-descriptions[data-bordered='true'] .left-value {
    background: var(--md-descriptions-value-bg);
    padding-left: var(--md-spacing-lg);
  }

  /* ─── Label alignment ─── */

  .mac-descriptions[data-label-align='left'] .label-cell,
  .mac-descriptions[data-label-align='left'] .left-label,
  .mac-descriptions[data-label-align='left'] .top-label,
  .mac-descriptions[data-label-align='left'] .top-table-label {
    text-align: left;
  }

  .mac-descriptions[data-label-align='center'] .label-cell,
  .mac-descriptions[data-label-align='center'] .left-label,
  .mac-descriptions[data-label-align='center'] .top-label,
  .mac-descriptions[data-label-align='center'] .top-table-label {
    text-align: center;
  }

  .mac-descriptions[data-label-align='right'] .label-cell,
  .mac-descriptions[data-label-align='right'] .left-label,
  .mac-descriptions[data-label-align='right'] .top-label,
  .mac-descriptions[data-label-align='right'] .top-table-label {
    text-align: right;
  }

  /* ─── Size: sm ─── */

  .mac-descriptions[data-size='sm'] {
    --md-descriptions-cell-padding: var(--md-spacing-xs) var(--md-spacing-md);
    --md-descriptions-label-width: 100px;
  }

  /* ─── Size: lg ─── */

  .mac-descriptions[data-size='lg'] {
    --md-descriptions-cell-padding: var(--md-spacing-md) var(--md-spacing-xl);
    --md-descriptions-label-width: 140px;
  }

  .mac-descriptions[data-theme='dark'] {
    --md-descriptions-container-bg: rgba(40, 40, 40, 0.85);
    --md-descriptions-container-border: rgba(255, 255, 255, 0.08);
    --md-descriptions-header-border: rgba(255, 255, 255, 0.08);
    --md-descriptions-title-color: rgba(255, 255, 255, 0.92);
    --md-descriptions-label-color: rgba(255, 255, 255, 0.55);
    --md-descriptions-label-bg: rgba(255, 255, 255, 0.04);
    --md-descriptions-value-color: rgba(255, 255, 255, 0.88);
    --md-descriptions-row-border: rgba(255, 255, 255, 0.06);
    --md-descriptions-separator-color: rgba(255, 255, 255, 0.55);
  }

  .mac-descriptions[data-theme='light'] {
    --md-descriptions-container-bg: var(--md-glass-menu-bg);
    --md-descriptions-container-border: var(--md-glass-separator);
    --md-descriptions-header-border: var(--md-glass-separator);
    --md-descriptions-title-color: var(--md-color-text);
    --md-descriptions-label-color: var(--md-color-text-secondary);
    --md-descriptions-label-bg: rgba(0, 0, 0, 0.02);
    --md-descriptions-value-color: var(--md-color-text);
    --md-descriptions-row-border: var(--md-glass-separator);
    --md-descriptions-separator-color: var(--md-color-text-secondary);
  }
</style>
