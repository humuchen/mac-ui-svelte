<script lang="ts">
  import {
    useMacConfig,
    resolveSize,
    resolveTheme,
    type MacSize,
    type MacTheme,
  } from '../../internal/config.svelte'
  import { pad, fmtDate, prsDate, sameDay, calDays, WDS } from './date-picker-utils'

  /**
   * @tag mac-date-range-picker
   * @summary macOS 风格的日期范围选择器，双月面板。
   *
   * @event mac-change - 范围变化时触发。`detail: { value: [string, string], start, end }`
   */

  function inRange(d: Date, s: Date, e: Date): boolean {
    const t = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
    const st = new Date(s.getFullYear(), s.getMonth(), s.getDate()).getTime()
    const et = new Date(e.getFullYear(), e.getMonth(), e.getDate()).getTime()
    return t >= st && t <= et
  }

  interface Props {
    /** 选中的范围 [start, end]（受控）。 */
    value?: [string, string]
    /** 默认范围（非受控）。 */
    defaultValue?: [string, string]
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
    /** 组件级主题覆盖。 */
    theme?: MacTheme
    /** 其余属性透传。 */
    [key: string]: unknown
  }

  let {
    value = $bindable(undefined),
    defaultValue = ['', ''],
    format = 'YYYY-MM-DD',
    placeholder = 'Select range',
    disabled = false,
    size = undefined,
    clearable = false,
    error = false,
    success = false,
    disabledDate = undefined,
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
  let lView = $state(new Date())
  let rView = $state(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1))
  let hoverDate = $state<Date | undefined>(undefined)
  let internalValue = $state<[string, string]>(['', ''])
  let initialized = false

  $effect(() => {
    if (!initialized) {
      initialized = true
      if (value === undefined && (defaultValue[0] || defaultValue[1])) {
        internalValue = [...defaultValue]
      }
    }
  })

  const res: [string, string] = $derived(value !== undefined ? value : internalValue)

  const s = $derived(res[0] ? prsDate(res[0], format) : null)
  const e = $derived(res[1] ? prsDate(res[1], format) : null)
  const hasStart = $derived(!!s)
  const hasEnd = $derived(!!e)

  function emitValue(nv: [string, string]) {
    if (value !== undefined) {
      value = nv
    } else {
      internalValue = [...nv]
    }
    emit('mac-change', { value: nv, start: nv[0], end: nv[1] })
  }

  function toggle() {
    if (disabled) return
    if (open) {
      close()
      return
    }
    open = true
    // 打开时根据选中值同步左右面板视图
    if (s) {
      lView = new Date(s.getFullYear(), s.getMonth(), 1)
      rView = new Date(s.getFullYear(), s.getMonth() + 1, 1)
    } else {
      const now = new Date()
      lView = new Date(now.getFullYear(), now.getMonth(), 1)
      rView = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    }
  }

  function close() {
    open = false
    hoverDate = undefined
  }

  function pick(date: Date) {
    if (disabledDate && disabledDate(date)) return
    const str = fmtDate(date, format)
    let nv: [string, string]
    if (!hasStart || (hasStart && hasEnd)) {
      nv = [str, '']
    } else {
      const st = s!
      if (date.getTime() < st.getTime()) nv = [str, res[0]]
      else nv = [res[0], str]
      close()
    }
    emitValue(nv)
  }

  function prevL() {
    lView = new Date(lView.getFullYear(), lView.getMonth() - 1, 1)
  }
  function nextL() {
    lView = new Date(lView.getFullYear(), lView.getMonth() + 1, 1)
  }
  function prevR() {
    rView = new Date(rView.getFullYear(), rView.getMonth() - 1, 1)
  }
  function nextR() {
    rView = new Date(rView.getFullYear(), rView.getMonth() + 1, 1)
  }

  function clear(e: Event) {
    e.stopPropagation()
    emitValue(['', ''])
  }

  function onKey(e: KeyboardEvent) {
    if (disabled) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggle()
    }
    if (e.key === 'Escape') close()
  }

  // 打开时挂载 document 点击监听
  $effect(() => {
    if (!open) return
    const handler = (ev: Event) => {
      if (!root?.contains(ev.target as Node)) close()
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  })

  const hasValue = $derived(!!(res[0] || res[1]))
  const displayText = $derived(
    res[0] && res[1] ? `${res[0]} ~ ${res[1]}` : (res[0] || res[1] || ''),
  )

  const lRows = $derived.by(() => {
    const days = calDays(lView.getFullYear(), lView.getMonth())
    const rows: { wn: number; days: typeof days }[] = []
    for (let i = 0; i < days.length; i += 7) {
      rows.push({ wn: i / 7, days: days.slice(i, i + 7) })
    }
    return rows
  })

  const rRows = $derived.by(() => {
    const days = calDays(rView.getFullYear(), rView.getMonth())
    const rows: { wn: number; days: typeof days }[] = []
    for (let i = 0; i < days.length; i += 7) {
      rows.push({ wn: i / 7, days: days.slice(i, i + 7) })
    }
    return rows
  })
</script>

{#snippet renderCal(view: Date, onPrev: () => void, onNext: () => void)}
  {@const vy = view.getFullYear()}
  {@const vm = view.getMonth()}
  {@const days = calDays(vy, vm)}
  {@const today = new Date()}
  {@const hasBoth = hasStart && hasEnd}
  {@const selecting = hasStart && !hasEnd}
  <div class="panel-col">
    <div class="panel-header">
      <span class="panel-header-title">{vy}年{vm + 1}月</span>
      <div class="panel-nav">
        <button class="panel-nav-btn" onclick={onPrev} tabindex="-1" type="button">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M10 4l-4 4 4 4" stroke="currentColor" stroke-width="1.5" fill="none" />
          </svg>
        </button>
        <button class="panel-nav-btn" onclick={onNext} tabindex="-1" type="button">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" fill="none" />
          </svg>
        </button>
      </div>
    </div>
    <div class="panel-weekdays">
      {#each WDS as w (w)}
        <div class="weekday">{w}</div>
      {/each}
    </div>
    <div class="panel-days">
      {#each days as d, di (di)}
        {@const isS = s && sameDay(d.date, s)}
        {@const isE = e && sameDay(d.date, e)}
        {@const isT = sameDay(d.date, today)}
        {@const dis = disabledDate ? disabledDate(d.date) : false}
        {@const inR = hasBoth && s && e && inRange(d.date, s, e)}
        {@const preview = selecting && hoverDate && s && inRange(d.date, s, hoverDate)}
        {@const range = inR || preview}
        {@const start =
          isS || (preview && hoverDate && s && hoverDate.getTime() < s.getTime() && sameDay(d.date, hoverDate))}
        {@const end =
          isE || (preview && hoverDate && s && hoverDate.getTime() >= s.getTime() && sameDay(d.date, hoverDate))}
        <button
          class="day {d.cur ? '' : 'day--other'} {isT ? 'day--today' : ''} {start
            ? 'day--range-start'
            : ''} {end ? 'day--range-end' : ''} {range && !start && !end ? 'day--in-range' : ''} {dis
            ? 'day--disabled'
            : ''}"
          onclick={() => !dis && pick(d.date)}
          onmouseenter={() => (hoverDate = d.date)}
          type="button"
          tabindex="-1"
        >
          {d.date.getDate()}
        </button>
      {/each}
    </div>
  </div>
{/snippet}

<div
  bind:this={root}
  {...rest}
  class="mac-scope mac-date-range-picker picker"
  data-theme={resolvedTheme}
  data-size={resolvedSize}
>
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
    <span class="picker-value {displayText ? '' : 'picker-placeholder'}">
      {displayText || placeholder}
    </span>
    <div style="display:flex;align-items:center;gap:6px;">
      {#if clearable && hasValue && !disabled}
        <button class="picker-clear" onclick={clear} tabindex="-1" type="button">✕</button>
      {/if}
      <span class="picker-icon">
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
      </span>
    </div>
  </div>

  {#if open}
    <div class="picker-dropdown open" role="dialog" aria-label="日期范围选择器">
      <div class="range-cols">
        {@render renderCal(lView, prevL, nextL)}
        {@render renderCal(rView, prevR, nextR)}
      </div>
    </div>
  {/if}
</div>

<style>
  .mac-date-range-picker {
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

  .picker-dropdown {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    background: var(--md-color-bg);
    border: 1px solid var(--md-color-border);
    border-radius: 12px;
    padding: 16px;
    box-shadow:
      0 12px 40px rgba(0, 0, 0, 0.12),
      0 4px 12px rgba(0, 0, 0, 0.08);
    z-index: 99999;
  }

  .range-cols {
    display: flex;
    gap: 24px;
  }

  .panel-col {
    width: 248px;
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }
  .panel-header-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--md-color-text);
    padding: 2px 8px;
    border-radius: var(--md-radius-md);
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
    width: 28px;
    height: 28px;
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
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
    margin-bottom: 4px;
  }
  .weekday {
    text-align: center;
    font-size: 11px;
    font-weight: 500;
    color: #9ca3af;
    padding: 4px 0;
  }

  .panel-days {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
  }
  .day {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 32px;
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
  .day--in-range {
    background: rgba(0, 122, 255, 0.08);
    border-radius: 0;
  }
  .day--range-start {
    background: var(--md-color-primary);
    color: #fff;
    border-radius: 50% 0 0 50%;
  }
  .day--range-end {
    background: var(--md-color-primary);
    color: #fff;
    border-radius: 0 50% 50% 0;
  }
  .day--disabled {
    opacity: 0.3;
    cursor: not-allowed;
    text-decoration: line-through;
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

  .mac-date-range-picker[data-theme='dark'] .picker-clear {
    background: rgba(255, 255, 255, 0.1);
  }
  .mac-date-range-picker[data-theme='dark'] .panel-nav-btn:hover {
    background: rgba(255, 255, 255, 0.08);
  }
</style>
