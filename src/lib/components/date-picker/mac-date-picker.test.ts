import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/svelte'
import MacDatePicker from './mac-date-picker.svelte'
import { fmtDate, prsDate, weekStart, weekNumber, calDays } from './date-picker-utils'
import { snippet } from '$lib/test/utils'

afterEach(cleanup)

const flush = () => new Promise((r) => setTimeout(r, 0))

describe('date-picker-utils（Svelte 版）', () => {
  it('fmtDate 格式化日期', () => {
    const d = new Date(2026, 0, 5, 9, 8, 7)
    expect(fmtDate(d, 'YYYY-MM-DD')).toBe('2026-01-05')
    expect(fmtDate(d, 'YYYY-MM-DD HH:mm:ss')).toBe('2026-01-05 09:08:07')
  })

  it('prsDate 解析日期字符串', () => {
    const d = prsDate('2026-01-05', 'YYYY-MM-DD')
    expect(d?.getFullYear()).toBe(2026)
    expect(d?.getMonth()).toBe(0)
    expect(d?.getDate()).toBe(5)
    expect(prsDate('', 'YYYY-MM-DD')).toBeNull()
  })

  it('weekStart / weekNumber / calDays', () => {
    const d = new Date(2026, 0, 7) // 周三
    const ws = weekStart(d)
    expect(ws.getDay()).toBe(0)
    expect(weekNumber(d)).toBeGreaterThan(0)
    const days = calDays(2026, 0)
    expect(days.length).toBe(42)
  })
})

describe('MacDatePicker（Svelte 版）', () => {
  it('默认属性渲染：占位符 / combobox 角色', () => {
    const { container } = render(MacDatePicker, { props: {} })
    const trigger = container.querySelector<HTMLElement>('.picker-trigger')!
    expect(trigger.getAttribute('role')).toBe('combobox')
    expect(trigger.querySelector('.picker-placeholder')?.textContent).toBe('选择日期')
  })

  it('value 属性显示选中值', () => {
    const { container } = render(MacDatePicker, { props: { value: '2026-01-05' } })
    expect(container.querySelector('.picker-value')?.textContent?.trim()).toBe('2026-01-05')
  })

  it('点击触发器打开面板并渲染 42 个日期格', async () => {
    const { container } = render(MacDatePicker, { props: {} })
    await fireEvent.click(container.querySelector('.picker-trigger')!)
    await flush()
    expect(container.querySelector('.picker-dropdown')).toBeTruthy()
    expect(container.querySelectorAll('.day').length).toBe(42)
    expect(container.querySelectorAll('.weekday').length).toBe(7)
  })

  it('点击日期派发 mac-change 并关闭面板', async () => {
    const { container } = render(MacDatePicker, { props: { value: '2026-01-01' } })
    await fireEvent.click(container.querySelector('.picker-trigger')!)
    await flush()
    const handler = vi.fn()
    document.addEventListener('mac-change', handler)
    // 点击「15」日
    const day = Array.from(container.querySelectorAll<HTMLButtonElement>('.day')).find(
      (b) => b.textContent?.trim() === '15' && !b.className.includes('day--other'),
    )!
    await fireEvent.click(day)
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail
    expect(detail.value).toBe('2026-01-15')
    expect(detail.date).toBeInstanceOf(Date)
    expect(container.querySelector('.picker-dropdown')).toBeNull()
    document.removeEventListener('mac-change', handler)
  })

  it('disabledDate 禁用的日期不可点击', async () => {
    const { container } = render(MacDatePicker, {
      props: {
        value: '2026-01-01',
        disabledDate: (d: Date) => d.getDate() === 15,
      },
    })
    await fireEvent.click(container.querySelector('.picker-trigger')!)
    await flush()
    const handler = vi.fn()
    document.addEventListener('mac-change', handler)
    const day = Array.from(container.querySelectorAll<HTMLButtonElement>('.day')).find(
      (b) => b.textContent?.trim() === '15' && b.className.includes('day--other') === false,
    )!
    expect(day.className).toContain('day--disabled')
    await fireEvent.click(day)
    expect(handler).not.toHaveBeenCalled()
    document.removeEventListener('mac-change', handler)
  })

  it('上/下月导航', async () => {
    const { container } = render(MacDatePicker, { props: { value: '2026-01-15' } })
    await fireEvent.click(container.querySelector('.picker-trigger')!)
    await flush()
    expect(container.querySelector('.panel-header-title')?.textContent?.trim()).toBe(
      '2026年1月',
    )
    await fireEvent.click(container.querySelectorAll('.panel-nav-btn')[1]!)
    await flush()
    expect(container.querySelector('.panel-header-title')?.textContent?.trim()).toBe(
      '2026年2月',
    )
    await fireEvent.click(container.querySelectorAll('.panel-nav-btn')[0]!)
    await flush()
    expect(container.querySelector('.panel-header-title')?.textContent?.trim()).toBe(
      '2026年1月',
    )
  })

  it('点击标题切换到月份视图并选择月份', async () => {
    const { container } = render(MacDatePicker, { props: { value: '2026-01-15' } })
    await fireEvent.click(container.querySelector('.picker-trigger')!)
    await flush()
    await fireEvent.click(container.querySelector('.panel-header-title')!)
    await flush()
    expect(container.querySelectorAll('.grid-cell').length).toBe(12)
    await fireEvent.click(Array.from(container.querySelectorAll('.grid-cell'))[2]!) // 3月
    await flush()
    expect(container.querySelector('.panel-header-title')?.textContent?.trim()).toBe(
      '2026年3月',
    )
  })

  it('today 按钮选择今天', async () => {
    const { container } = render(MacDatePicker, { props: {} })
    await fireEvent.click(container.querySelector('.picker-trigger')!)
    await flush()
    const handler = vi.fn()
    document.addEventListener('mac-change', handler)
    await fireEvent.click(container.querySelector('.panel-footer-btn')!)
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail
    expect(detail.value).toBe(fmtDate(new Date(), 'YYYY-MM-DD'))
    document.removeEventListener('mac-change', handler)
  })

  it('type=year 直接选择年份', async () => {
    const { container } = render(MacDatePicker, { props: { type: 'year' } })
    await fireEvent.click(container.querySelector('.picker-trigger')!)
    await flush()
    const handler = vi.fn()
    document.addEventListener('mac-change', handler)
    const yearCell = Array.from(container.querySelectorAll('.grid-cell')).find(
      (c) => c.textContent?.trim() === '2026',
    )!
    await fireEvent.click(yearCell)
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail
    expect(detail.value).toBe('2026')
    document.removeEventListener('mac-change', handler)
  })

  it('type=quarter 选择季度', async () => {
    const { container } = render(MacDatePicker, { props: { type: 'quarter' } })
    await fireEvent.click(container.querySelector('.picker-trigger')!)
    await flush()
    expect(container.querySelectorAll('.grid-cell').length).toBe(4)
    const handler = vi.fn()
    document.addEventListener('mac-change', handler)
    await fireEvent.click(container.querySelectorAll('.grid-cell')[1]!) // Q2
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail
    // 当前年份由视图决定，这里仅验证 Q2 格式
    expect(String(detail.value)).toMatch(/-Q2$/)
    document.removeEventListener('mac-change', handler)
  })

  it('type=datetime 显示时间输入', async () => {
    const { container } = render(MacDatePicker, {
      props: { type: 'datetime', value: '2026-01-15 10:30:00', format: 'YYYY-MM-DD HH:mm:ss' },
    })
    await fireEvent.click(container.querySelector('.picker-trigger')!)
    await flush()
    const inputs = container.querySelectorAll<HTMLInputElement>('.time-input')
    expect(inputs.length).toBe(3)
    expect(inputs[0].value).toBe('10')
    await fireEvent.change(inputs[0], { target: { value: '14' } })
    await flush()
    const handler = vi.fn()
    document.removeEventListener('mac-change', handler)
  })

  it('panel 面板模式：无触发器，面板常显', () => {
    const { container } = render(MacDatePicker, { props: { panel: true } })
    expect(container.querySelector('.picker-trigger')).toBeNull()
    expect(container.querySelector('.picker-panel--inline')).toBeTruthy()
  })

  it('clearable 清空按钮', async () => {
    const { container } = render(MacDatePicker, {
      props: { value: '2026-01-15', clearable: true },
    })
    const handler = vi.fn()
    document.addEventListener('mac-change', handler)
    await fireEvent.click(container.querySelector('.picker-clear')!)
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail
    expect(detail.value).toBe('')
    expect(detail.date).toBeNull()
    document.removeEventListener('mac-change', handler)
  })

  it('Escape 关闭面板', async () => {
    const { container } = render(MacDatePicker, { props: {} })
    await fireEvent.click(container.querySelector('.picker-trigger')!)
    await flush()
    await fireEvent.keyDown(container.querySelector('.picker-trigger')!, { key: 'Escape' })
    expect(container.querySelector('.picker-dropdown')).toBeNull()
  })

  it('渲染自定义 icon snippet', () => {
    const { container } = render(MacDatePicker, {
      props: { icon: snippet('<b class="my-icon">i</b>') },
    })
    expect(container.querySelector('.my-icon')).toBeTruthy()
  })
})
