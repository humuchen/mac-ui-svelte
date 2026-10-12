import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/svelte'
import MacDateRangePicker from './mac-date-range-picker.svelte'

afterEach(cleanup)

const flush = () => new Promise((r) => setTimeout(r, 0))

describe('MacDateRangePicker（Svelte 版）', () => {
  it('默认属性渲染：占位符 / combobox 角色', () => {
    const { container } = render(MacDateRangePicker, { props: {} })
    const trigger = container.querySelector<HTMLElement>('.picker-trigger')!
    expect(trigger.getAttribute('role')).toBe('combobox')
    expect(trigger.querySelector('.picker-placeholder')?.textContent).toBe('Select range')
  })

  it('value 属性显示范围文本', () => {
    const { container } = render(MacDateRangePicker, {
      props: { value: ['2026-01-01', '2026-01-15'] },
    })
    expect(container.querySelector('.picker-value')?.textContent?.trim()).toBe(
      '2026-01-01 ~ 2026-01-15',
    )
  })

  it('打开后渲染双月面板', async () => {
    const { container } = render(MacDateRangePicker, { props: {} })
    await fireEvent.click(container.querySelector('.picker-trigger')!)
    await flush()
    expect(container.querySelector('.picker-dropdown')).toBeTruthy()
    expect(container.querySelectorAll('.panel-col').length).toBe(2)
  })

  it('选择范围：第一次点击设置开始，第二次点击设置结束并关闭', async () => {
    const { container } = render(MacDateRangePicker, { props: {} })
    await fireEvent.click(container.querySelector('.picker-trigger')!)
    await flush()
    const handler = vi.fn()
    document.addEventListener('mac-change', handler)

    // 第一次点击（左面板 15 日）
    const leftDays = container.querySelectorAll('.panel-col')[0]!.querySelectorAll('.day')!
    await fireEvent.click(leftDays[17]!) // 任意日期
    let detail = (handler.mock.calls[0][0] as CustomEvent).detail
    expect(detail.end).toBe('')
    // 面板未关闭
    expect(container.querySelector('.picker-dropdown')).toBeTruthy()

    // 第二次点击
    const allDays = container.querySelectorAll('.day')!
    await fireEvent.click(allDays[allDays.length - 5]!)
    detail = (handler.mock.calls[1][0] as CustomEvent).detail
    expect(detail.start).toBeTruthy()
    expect(detail.end).toBeTruthy()
    // 面板关闭
    expect(container.querySelector('.picker-dropdown')).toBeNull()
    document.removeEventListener('mac-change', handler)
  })

  it('早于开始日期的点击成为新的开始', async () => {
    const { container } = render(MacDateRangePicker, {
      props: { value: ['2026-06-10', ''] },
    })
    await fireEvent.click(container.querySelector('.picker-trigger')!)
    await flush()
    const handler = vi.fn()
    document.addEventListener('mac-change', handler)
    // 点击左面板（6月）1 日 —— 早于 6-10，成为新开始
    const leftDays = container.querySelectorAll('.panel-col')[0]!.querySelectorAll('.day')!
    // 2026-06-01 是周一：索引 0 为 5-31，索引 1 为 6-01
    await fireEvent.click(leftDays[1]!)
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail
    expect(detail.start).toBe('2026-06-01')
    expect(detail.end).toBe('2026-06-10')
    document.removeEventListener('mac-change', handler)
  })

  it('左右面板独立导航', async () => {
    const { container } = render(MacDateRangePicker, {
      props: { value: ['2026-01-01', '2026-02-20'] },
    })
    await fireEvent.click(container.querySelector('.picker-trigger')!)
    await flush()
    const cols = container.querySelectorAll('.panel-col')
    expect(cols[0]!.querySelector('.panel-header-title')?.textContent?.trim()).toBe('2026年1月')
    expect(cols[1]!.querySelector('.panel-header-title')?.textContent?.trim()).toBe('2026年2月')
    // 右面板下一月
    await fireEvent.click(cols[1]!.querySelectorAll('.panel-nav-btn')[1]!)
    await flush()
    expect(container.querySelectorAll('.panel-col')[1]!.querySelector('.panel-header-title')?.textContent?.trim()).toBe('2026年3月')
  })

  it('clearable 清空按钮', async () => {
    const { container } = render(MacDateRangePicker, {
      props: { value: ['2026-01-01', '2026-01-15'], clearable: true },
    })
    const handler = vi.fn()
    document.addEventListener('mac-change', handler)
    await fireEvent.click(container.querySelector('.picker-clear')!)
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail
    expect(detail.value).toEqual(['', ''])
    document.removeEventListener('mac-change', handler)
  })

  it('disabledDate 禁用的日期不可点击', async () => {
    const { container } = render(MacDateRangePicker, {
      props: { disabledDate: () => true },
    })
    await fireEvent.click(container.querySelector('.picker-trigger')!)
    await flush()
    const handler = vi.fn()
    document.addEventListener('mac-change', handler)
    const day = container.querySelector<HTMLElement>('.day:not(.day--other)')!
    expect(day.className).toContain('day--disabled')
    await fireEvent.click(day)
    expect(handler).not.toHaveBeenCalled()
    document.removeEventListener('mac-change', handler)
  })

  it('Escape 关闭面板', async () => {
    const { container } = render(MacDateRangePicker, { props: {} })
    await fireEvent.click(container.querySelector('.picker-trigger')!)
    await flush()
    await fireEvent.keyDown(container.querySelector('.picker-trigger')!, { key: 'Escape' })
    expect(container.querySelector('.picker-dropdown')).toBeNull()
  })
})
