<script lang="ts">
  import {
    useMacConfig,
    resolveSize,
    resolveTheme,
    type MacSize,
    type MacTheme,
  } from '../../internal/config.svelte'
  import {
    pad,
    fmtDate,
    prsDate,
    sameDay,
    weekStart,
    weekNumber,
    calDays,
    WDS,
    MNS,
    QNS,
  } from './date-picker-utils'

  /**
   * @tag mac-date-picker
   * @summary macOS 风格的日期选择器，支持日期/日期时间/年/季度/周类型。
   *
   * @slot icon - 自定义日历图标。
   *
   * @event mac-change - 选中值变化时触发。`detail: { value: string, date: Date | null }`
   */

  import type { PanelView, PickerType } from './date-picker-types'

  interface Props {
    /** 选中的日期字符串（受控）。 */
    value?: string
    /** 默认日期字符串（非受控）。 */
    defaultValue?: string
    /** 日期格式。 */
    format?: string
    /** 占位符。 */
    placeholder?: string
    /** 禁用选择器。 */
    disabled?: boolean
    /** 选择器的尺寸。 */
    size?: MacSize
    /** 显示清空按钮。 */
    clearable?: boolean
    /** 错误状态。 */
    error?: boolean
    /** 成功状态。 */
    success?: boolean
    /** 禁用日期判断函数。 */
    disabledDate?: (date: Date) => boolean
    /** 选择器类型。 */
    type?: PickerType
    /** 面板模式（无触发器，常显）。 */
    panel?: boolean
    /** 是否显示面板底部（今天/清空按钮）。 */
    showFooter?: boolean
    /** 组件级主题覆盖。 */
    theme?: MacTheme
    /** 自定义日历图标。 */
    icon?: import('svelte').Snippet
    /** 其余属性透传。 */
    [key: string]: unknown
  }

  let {
    value = $bindable(undefined),
    defaultValue = '',
    format = 'YYYY-MM-DD',
    placeholder = '选择日期',
    disabled = false,
    size = undefined,
    clearable = false,
    error = false,
    success = false,
    disabledDate = undefined,
    type = 'date',
    panel = false,
    showFooter = true,
    theme = undefined,
    icon,
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
  let view = $state(new Date())
  let panelView = $state<PanelView>('day')
  let hh = $state(0)
  let mm = $state(0)
  let ss = $state(0)
  let internalValue = $state('')
  let initialized = false

  // 非受控初始化
  $effect(() => {
    if (!initialized) {
      initialized = true
      if (value === undefined && defaultValue) {
        internalValue = defaultValue
      }
    }
  })

  const resVal = $derived(value !== undefined ? value : internalValue)

  const selDate = $derived(prsDate(resVal, format))

  function syncTime(d: Date) {
    hh = d.getHours()
    mm = d.getMinutes()
    ss = d.getSeconds()
  }

  function toggle() {
    if (disabled || panel) return
    open ? close() : openPanel()
  }

  function openPanel() {
    open = true
    const d = selDate
    if (d) {
      view = new Date(d.getFullYear(), d.getMonth(), 1)
      syncTime(d)
    }
    panelView = type === 'year' || type === 'quarter' ? 'year' : 'day'
  }

  function close() {
    if (panel) return
    open = false
    panelView = 'day'
  }

  function emitValue(str: string, date: Date | null) {
    if (value !== undefined) {
      value = str
    } else {
      internalValue = str
    }
    emit('mac-change', { value: str, date })
  }

  function pick(date: Date, doClose = true) {
    if (disabledDate && disabledDate(date)) return
    let str = fmtDate(date, format)
    if (type === 'week') {
      const ws = weekStart(date)
      str = fmtDate(ws, format)
      date = ws
    }
    emitValue(str, date)
    if (doClose && !panel) close()
  }

  function pickQuarter(y: number, q: number) {
    const date = new Date(y, q * 3, 1)
    const str = `${y}-Q${q + 1}`
    emitValue(str, date)
    close()
  }

  function pickYear(y: number) {
    if (type === 'year') {
      const date = new Date(y, 0, 1)
      const str = String(y)
      emitValue(str, date)
      close()
    } else {
      view = new Date(y, view.getMonth(), 1)
      panelView = type === 'quarter' ? 'year' : 'month'
    }
  }

  function pickMonth(m: number) {
    view = new Date(view.getFullYear(), m, 1)
    panelView = 'day'
  }

  function prev() {
    if (panelView === 'year') view = new Date(view.getFullYear() - 12, 0, 1)
    else if (panelView === 'month') view = new Date(view.getFullYear() - 1, 0, 1)
    else view = new Date(view.getFullYear(), view.getMonth() - 1, 1)
  }

  function next() {
    if (panelView === 'year') view = new Date(view.getFullYear() + 12, 0, 1)
    else if (panelView === 'month') view = new Date(view.getFullYear() + 1, 0, 1)
    else view = new Date(view.getFullYear(), view.getMonth() + 1, 1)
  }

  function today() {
    pick(new Date())
  }

  function clear(e: Event) {
    e.stopPropagation()
    emitValue('', null)
  }

  function timeChange(which: 'h' | 'm' | 's', v: string) {
    const n = parseInt(v, 10)
    if (isNaN(n)) return
    if (which === 'h') hh = Math.max(0, Math.min(23, n))
    if (which === 'm') mm = Math.max(0, Math.min(59, n))
    if (which === 's') ss = Math.max(0, Math.min(59, n))
    const d = selDate
    if (d) {
      const nd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hh, mm, ss)
      const str = fmtDate(nd, format)
      emitValue(str, nd)
    }
  }

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

  const daysRows = $derived.by(() => {
    const vy = view.getFullYear()
    const vm = view.getMonth()
    const days = calDays(vy, vm)
    const rows: { wn: number; days: typeof days }[] = []
    for (let i = 0; i < days.length; i += 7) {
      rows.push({ wn: weekNumber(days[i].date), days: days.slice(i, i + 7) })
    }
    return rows
  })

  const headerTitle = $derived(
    panelView === 'year'
      ? '选择年份'
      : panelView === 'month'
        ? `${view.getFullYear()}年`
        : `${view.getFullYear()}年${view.getMonth() + 1}月`,
  )

  const yearStart = $derived(view.getFullYear() - 6)
</script>

{#snippet renderHeader(title: string, clickable = false)}
  <div class="panel-header">
    <span
      class="panel-header-title"
      class:clickable
      onclick={clickable ? () => (panelView = 'month') : undefined}
    >
      {title}
    </span>
    <div class="panel-nav">
      <button class="panel-nav-btn" onclick={prev} tabindex="-1" type="button">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <path d="M10 4l-4 4 4 4" stroke="currentColor" stroke-width="1.5" fill="none" />
        </svg>
      </button>
      <button class="panel-nav-btn" onclick={next} tabindex="-1" type="button">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" fill="none" />
        </svg>
      </button>
    </div>
  </div>
{/snippet}

{#snippet renderFooter()}
  {#if showFooter}
    <div class="panel-footer">
      <button class="panel-footer-btn" onclick={today} type="button">今天</button>
      {#if clearable}
        <button class="panel-footer-btn" onclick={clear} type="button">清空</button>
      {/if}
    </div>
  {/if}
{/snippet}

{#snippet renderDays()}
  {@const sel = selDate}
  {@const todayDate = new Date()}
  {@const isWeek = type === 'week'}
  {@const selWeek = sel && isWeek ? weekStart(sel) : null}
  <div class="panel-weekdays {isWeek ? '' : 'panel-weekdays--no-week'}">
    {#if isWeek}<div class="weekday"></div>{/if}
    {#each WDS as w (w)}
      <div class="weekday">{w}</div>
    {/each}
  </div>
  {#each daysRows as r (r.wn)}
    <div class="panel-days {isWeek ? '' : 'panel-days--no-week'}">
      {#if isWeek}
        <button class="week-num" onclick={() => pick(r.days[0].date)} type="button">
          W{r.wn}
        </button>
      {/if}
      {#each r.days as d, di (di)}
        {@const isSel = sel && (isWeek ? sameDay(d.date, selWeek!) : sameDay(d.date, sel))}
        {@const isTod = sameDay(d.date, todayDate)}
        {@const dis = disabledDate ? disabledDate(d.date) : false}
        <button
          class="day {d.cur ? '' : 'day--other'} {isTod ? 'day--today' : ''} {isSel
            ? 'day--selected'
            : ''} {dis ? 'day--disabled' : ''}"
          onclick={() => !dis && pick(d.date)}
          type="button"
          tabindex="-1"
        >
          {d.date.getDate()}
        </button>
      {/each}
    </div>
  {/each}
{/snippet}

{#snippet renderMonths()}
  {@const y = view.getFullYear()}
  {@const sel = selDate}
  {@render renderHeader(`${y}年`)}
  <div class="panel-grid">
    {#each MNS as m, i (i)}
      {@const isSel = sel && sel.getFullYear() === y && sel.getMonth() === i}
      <button
        class="grid-cell {isSel ? 'grid-cell--selected' : ''}"
        onclick={() => pickMonth(i)}
        type="button"
      >
        {m}
      </button>
    {/each}
  </div>
{/snippet}

{#snippet renderYears()}
  {@const sel = selDate}
  {@const selY = sel ? sel.getFullYear() : null}
  {@render renderHeader(`${yearStart} - ${yearStart + 11}`)}
  <div class="panel-year-grid">
    {#each Array.from({ length: 12 }, (_, i) => i) as i (i)}
      {@const y = yearStart + i}
      {@const isSel = selY === y}
      <button
        class="grid-cell year-cell {isSel ? 'grid-cell--selected' : ''}"
        onclick={() => pickYear(y)}
        type="button"
      >
        {y}
      </button>
    {/each}
  </div>
{/snippet}

{#snippet renderQuarters()}
  {@const y = view.getFullYear()}
  {@render renderHeader(`${y}年`)}
  <div class="panel-grid">
    {#each QNS as q, i (i)}
      {@const isSel = resVal === `${y}-Q${i + 1}`}
      <button
        class="grid-cell {isSel ? 'grid-cell--selected' : ''}"
        onclick={() => pickQuarter(y, i)}
        type="button"
      >
        {q}
      </button>
    {/each}
  </div>
{/snippet}

{#snippet renderTime()}
  {#if type === 'datetime'}
    <div class="time-row">
      <input
        class="time-input"
        type="number"
        min="0"
        max="23"
        value={pad(hh)}
        onchange={(e) => timeChange('h', (e.target as HTMLInputElement).value)}
      />
      <span class="time-sep">:</span>
      <input
        class="time-input"
        type="number"
        min="0"
        max="59"
        value={pad(mm)}
        onchange={(e) => timeChange('m', (e.target as HTMLInputElement).value)}
      />
      <span class="time-sep">:</span>
      <input
        class="time-input"
        type="number"
        min="0"
        max="59"
        value={pad(ss)}
        onchange={(e) => timeChange('s', (e.target as HTMLInputElement).value)}
      />
    </div>
  {/if}
{/snippet}

{#snippet panelContent()}
  {#if type === 'quarter'}
    {@render renderQuarters()}
    {@render renderFooter()}
  {:else if panelView === 'year'}
    {@render renderYears()}
    {@render renderFooter()}
  {:else if panelView === 'month'}
    {@render renderMonths()}
    {@render renderFooter()}
  {:else}
    {@render renderHeader(headerTitle, true)}
    {@render renderDays()}
    {@render renderTime()}
    {@render renderFooter()}
  {/if}
{/snippet}

<div
  bind:this={root}
  {...rest}
  class="mac-scope mac-date-picker picker"
  data-theme={resolvedTheme}
  data-size={resolvedSize}
>
  {#if panel}
    <div class="picker-panel picker-panel--inline">
      {@render panelContent()}
    </div>
  {:else}
    <div
      class="picker-trigger picker-trigger--{resolvedSize} {open ? 'open' : ''} {error
        ? 'picker-trigger--error'
        : ''} {success ? 'picker-trigger--success' : ''} {disabled
        ? 'picker-trigger--disabled'
        : ''}"
      onclick={toggle}
      onkeydown={onKey}
      tabindex={disabled ? -1 : 0}
      role="combobox"
      aria-expanded={open}
    >
      <span class="picker-value {resVal ? '' : 'picker-placeholder'}">
        {resVal ? resVal : placeholder}
      </span>
      <div style="display:flex;align-items:center;gap:6px;">
        {#if clearable && resVal && !disabled}
          <button class="picker-clear" onclick={clear} tabindex="-1" type="button">✕</button>
        {/if}
        <span class="picker-icon">
          {#if icon}
            {@render icon()}
          {:else}
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <rect x="2" y="3" width="12" height="11" rx="1.5" />
              <path d="M2 7h12" />
              <path d="M5 1.5v3M11 1.5v3" />
            </svg>
          {/if}
        </span>
      </div>
    </div>

    {#if open}
      <div class="picker-dropdown open" role="dialog" aria-label="日期选择器">
        {@render panelContent()}
      </div>
    {/if}
  {/if}
</div>

<style>
  .mac-date-picker {
    display: block;
  }

  .picker {
    position: relative;
  }

  .picker-trigger {
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
  .picker-trigger:hover:not(.picker-trigger--disabled) {
    border-color: var(--md-color-primary);
  }
  .picker-trigger.open,
  .picker-trigger:focus-within {
    border-color: var(--md-color-primary);
    box-shadow:
      0 0 0 3px rgba(0, 122, 255, 0.1),
      0 2px 8px rgba(0, 122, 255, 0.08);
  }
  .picker-trigger--disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
    background: var(--md-color-bg-secondary);
  }
  .picker-trigger--error {
    border-color: var(--md-color-danger);
  }
  .picker-trigger--error.open,
  .picker-trigger--error:focus-within {
    box-shadow:
      0 0 0 3px rgba(255, 59, 48, 0.1),
      0 2px 8px rgba(255, 59, 48, 0.08);
  }
  .picker-trigger--success {
    border-color: var(--md-color-success);
  }
  .picker-value {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .picker-placeholder {
    color: #9ca3af;
  }
  .picker-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    color: #9ca3af;
    flex-shrink: 0;
  }
  .picker-clear {
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
  .picker-clear:hover {
    background: rgba(0, 0, 0, 0.1);
    color: var(--md-color-text);
  }

  /* 下拉面板 */
  .picker-dropdown {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    width: var(--md-date-picker-panel-width, 288px);
    background: var(--md-color-bg);
    border: 1px solid var(--md-color-border);
    border-radius: var(--md-date-picker-panel-border-radius, 12px);
    padding: var(--md-date-picker-panel-padding, 16px);
    box-shadow:
      0 12px 40px rgba(0, 0, 0, 0.12),
      0 4px 12px rgba(0, 0, 0, 0.08);
    z-index: 99999;
  }

  /* 内联面板模式 */
  .picker-panel--inline {
    position: static;
    width: var(--md-date-picker-panel-width, 288px);
    background: var(--md-color-bg);
    border: 1px solid var(--md-color-border);
    border-radius: var(--md-date-picker-panel-border-radius, 12px);
    padding: var(--md-date-picker-panel-padding, 16px);
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--md-date-picker-header-margin-bottom, 12px);
  }
  .panel-header-title {
    font-size: var(--md-date-picker-header-font-size, 15px);
    font-weight: 600;
    color: var(--md-color-text);
    padding: 2px 8px;
    border-radius: var(--md-radius-md);
    transition: background 150ms;
  }
  .panel-header-title.clickable {
    cursor: pointer;
  }
  .panel-header-title.clickable:hover {
    background: rgba(0, 0, 0, 0.04);
  }
  .panel-nav {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .panel-nav-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--md-date-picker-nav-btn-size, 28px);
    height: var(--md-date-picker-nav-btn-size, 28px);
    border: none;
    background: transparent;
    border-radius: 50%;
    cursor: pointer;
    color: var(--md-color-text-secondary);
    transition: all 150ms;
    padding: 0;
  }
  .panel-nav-btn:hover {
    background: rgba(0, 0, 0, 0.06);
    color: var(--md-color-text);
  }

  .panel-weekdays {
    display: grid;
    grid-template-columns: var(--md-date-picker-week-num-width, 32px) repeat(7, 1fr);
    gap: var(--md-date-picker-day-gap, 2px);
    margin-bottom: 4px;
  }
  .panel-weekdays--no-week {
    grid-template-columns: repeat(7, 1fr);
  }
  .weekday {
    text-align: center;
    font-size: var(--md-date-picker-weekday-font-size, 11px);
    font-weight: 500;
    color: #9ca3af;
    padding: 4px 0;
  }

  .panel-days {
    display: grid;
    grid-template-columns: var(--md-date-picker-week-num-width, 32px) repeat(7, 1fr);
    gap: var(--md-date-picker-day-gap, 2px);
  }
  .panel-days--no-week {
    grid-template-columns: repeat(7, 1fr);
  }
  .week-num {
    display: flex;
    align-items: center;
    justify-content: center;
    height: var(--md-date-picker-week-num-height, 32px);
    font-size: 10px;
    color: var(--md-color-text-secondary);
    opacity: 0.5;
    cursor: pointer;
    border: none;
    background: transparent;
    padding: 0;
    border-radius: var(--md-radius-sm);
  }
  .week-num:hover {
    color: var(--md-color-primary);
    opacity: 1;
    background: rgba(0, 122, 255, 0.06);
  }
  .day {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--md-date-picker-day-width, 100%);
    height: var(--md-date-picker-day-height, 32px);
    border: none;
    background: transparent;
    border-radius: var(--md-radius-sm);
    cursor: pointer;
    font-size: var(--md-font-size-sm);
    color: var(--md-color-text);
    transition: all 150ms;
    padding: 0;
  }
  .day:hover:not(.day--disabled):not(.day--today) {
    background: rgba(0, 122, 255, 0.1);
    border-radius: 50%;
  }
  .day--other {
    color: var(--md-color-text-secondary);
    opacity: 0.35;
  }
  .day--today {
    background: var(--md-color-primary);
    color: #fff;
    border-radius: 50%;
  }
  .day--today:hover {
    background: var(--md-color-primary-hover);
  }
  .day--selected {
    color: var(--md-color-primary);
    font-weight: 600;
    border: 1px solid var(--md-color-primary);
    border-radius: 50%;
  }
  .day--disabled {
    opacity: 0.3;
    cursor: not-allowed;
    text-decoration: line-through;
  }

  .panel-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--md-date-picker-grid-gap, 8px);
  }
  .grid-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    height: var(--md-date-picker-grid-cell-height, 48px);
    border: none;
    background: transparent;
    border-radius: var(--md-radius-lg);
    cursor: pointer;
    font-size: var(--md-font-size-sm);
    color: var(--md-color-text);
    transition: all 150ms;
    padding: 0;
  }
  .grid-cell:hover:not(.grid-cell--selected) {
    background: rgba(0, 122, 255, 0.1);
  }
  .grid-cell--selected {
    background: var(--md-color-primary);
    color: #fff;
  }
  .grid-cell--selected:hover {
    background: var(--md-color-primary-hover);
  }

  .panel-year-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--md-date-picker-grid-gap, 8px);
  }
  .year-cell {
    height: var(--md-date-picker-year-cell-height, 40px);
    font-size: var(--md-font-size-sm);
  }

  .time-row {
    display: flex;
    align-items: center;
    gap: var(--md-spacing-xs);
    margin-top: var(--md-date-picker-footer-margin-top, 12px);
    padding-top: var(--md-date-picker-footer-margin-top, 12px);
    border-top: 1px solid var(--md-color-border);
    justify-content: center;
  }
  .time-input {
    width: var(--md-date-picker-time-input-width, 48px);
    padding: 6px 4px;
    border: 1px solid var(--md-color-border);
    border-radius: var(--md-radius-md);
    font-size: var(--md-font-size-sm);
    text-align: center;
    color: var(--md-color-text);
    background: var(--md-color-bg);
    outline: none;
    transition: border-color 200ms;
  }
  .time-input:focus {
    border-color: var(--md-color-primary);
  }
  .time-sep {
    color: var(--md-color-text-secondary);
    font-size: var(--md-font-size-sm);
  }

  .panel-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: var(--md-date-picker-footer-margin-top, 12px);
    padding-top: var(--md-date-picker-footer-margin-top, 12px);
    border-top: 1px solid var(--md-color-border);
  }
  .panel-footer-btn {
    font-size: var(--md-font-size-sm);
    color: var(--md-color-primary);
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 4px 12px;
    border-radius: var(--md-radius-md);
    transition: background 150ms;
  }
  .panel-footer-btn:hover {
    background: rgba(0, 122, 255, 0.08);
  }

  .picker-trigger--sm {
    padding: var(--sm-select-trigger-padding-vertical)
      var(--sm-select-trigger-padding-horizontal);
    font-size: var(--sm-select-trigger-font-size);
    min-height: var(--sm-select-trigger-min-height);
  }
  .picker-trigger--lg {
    padding: var(--lg-select-trigger-padding-vertical)
      var(--lg-select-trigger-padding-horizontal);
    font-size: var(--lg-select-trigger-font-size);
    min-height: var(--lg-select-trigger-min-height);
  }

  .mac-date-picker[data-size='sm'] {
    --md-date-picker-panel-width: var(--sm-date-picker-panel-width);
    --md-date-picker-panel-padding: var(--sm-date-picker-panel-padding);
    --md-date-picker-panel-border-radius: var(--sm-date-picker-panel-border-radius);
    --md-date-picker-day-width: var(--sm-date-picker-day-width);
    --md-date-picker-day-height: var(--sm-date-picker-day-height);
    --md-date-picker-nav-btn-size: var(--sm-date-picker-nav-btn-size);
    --md-date-picker-header-font-size: var(--sm-date-picker-header-font-size);
    --md-date-picker-header-margin-bottom: var(--sm-date-picker-header-margin-bottom);
    --md-date-picker-week-num-width: var(--sm-date-picker-week-num-width);
    --md-date-picker-week-num-height: var(--sm-date-picker-week-num-height);
    --md-date-picker-weekday-font-size: var(--sm-date-picker-weekday-font-size);
    --md-date-picker-grid-gap: var(--sm-date-picker-grid-gap);
    --md-date-picker-grid-cell-height: var(--sm-date-picker-grid-cell-height);
    --md-date-picker-year-cell-height: var(--sm-date-picker-year-cell-height);
    --md-date-picker-time-input-width: var(--sm-date-picker-time-input-width);
    --md-date-picker-footer-margin-top: var(--sm-date-picker-footer-margin-top);
    --md-date-picker-day-gap: var(--sm-date-picker-day-gap);
  }
  .mac-date-picker[data-size='lg'] {
    --md-date-picker-panel-width: var(--lg-date-picker-panel-width);
    --md-date-picker-panel-padding: var(--lg-date-picker-panel-padding);
    --md-date-picker-panel-border-radius: var(--lg-date-picker-panel-border-radius);
    --md-date-picker-day-height: var(--lg-date-picker-day-height);
    --md-date-picker-nav-btn-size: var(--lg-date-picker-nav-btn-size);
    --md-date-picker-header-font-size: var(--lg-date-picker-header-font-size);
    --md-date-picker-header-margin-bottom: var(--lg-date-picker-header-margin-bottom);
    --md-date-picker-week-num-width: var(--lg-date-picker-week-num-width);
    --md-date-picker-week-num-height: var(--lg-date-picker-week-num-height);
    --md-date-picker-weekday-font-size: var(--lg-date-picker-weekday-font-size);
    --md-date-picker-grid-gap: var(--lg-date-picker-grid-gap);
    --md-date-picker-grid-cell-height: var(--lg-date-picker-grid-cell-height);
    --md-date-picker-year-cell-height: var(--lg-date-picker-year-cell-height);
    --md-date-picker-time-input-width: var(--lg-date-picker-time-input-width);
    --md-date-picker-footer-margin-top: var(--lg-date-picker-footer-margin-top);
    --md-date-picker-day-gap: var(--lg-date-picker-day-gap);
  }

  .mac-date-picker[data-theme='dark'] .picker-clear {
    background: rgba(255, 255, 255, 0.1);
  }
  .mac-date-picker[data-theme='dark'] .picker-clear:hover {
    background: rgba(255, 255, 255, 0.15);
  }
  .mac-date-picker[data-theme='dark'] .panel-nav-btn:hover {
    background: rgba(255, 255, 255, 0.08);
  }
  .mac-date-picker[data-theme='dark'] .panel-header-title.clickable:hover {
    background: rgba(255, 255, 255, 0.08);
  }
  .mac-date-picker[data-theme='dark'] .day--today {
    background: var(--md-color-primary);
  }
  .mac-date-picker[data-theme='dark'] .grid-cell--selected {
    background: var(--md-color-primary);
  }
  .mac-date-picker[data-theme='dark'] .panel-footer-btn:hover {
    background: rgba(0, 122, 255, 0.15);
  }
  .mac-date-picker[data-theme='dark'] .time-input {
    background: var(--md-color-bg);
    border-color: var(--md-color-border);
    color: var(--md-color-text);
  }
</style>
