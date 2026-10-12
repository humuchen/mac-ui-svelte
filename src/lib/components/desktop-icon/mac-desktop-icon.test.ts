import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/svelte'
import MacDesktopIcon from './mac-desktop-icon.svelte'
import { snippet } from '$lib/test/utils'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

function getRoot(container: HTMLElement) {
  return container.querySelector<HTMLElement>('.mac-desktop-icon')!
}

describe('MacDesktopIcon（Svelte 版）', () => {
  it('默认属性渲染：label 与默认占位图标', () => {
    const { container } = render(MacDesktopIcon, { props: { label: 'Finder' } })
    const root = getRoot(container)
    expect(root.querySelector('.icon-label')?.textContent).toBe('Finder')
    expect(root.querySelector('.default-icon')?.textContent).toBe('F')
  })

  it('未指定 iconId 时自动生成唯一标识', async () => {
    const { container } = render(MacDesktopIcon, { props: { label: 'A' } })
    await vi.advanceTimersByTimeAsync(0)
    const handler = vi.fn()
    document.addEventListener('mac-icon-dblclick', handler)
    const wrapper = container.querySelector('.icon-wrapper')!
    await fireEvent.mouseDown(wrapper, { button: 0 })
    await fireEvent.mouseDown(wrapper, { button: 0 })
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail
    expect(String(detail.iconId)).toMatch(/^__auto_/)
    document.removeEventListener('mac-icon-dblclick', handler)
  })

  it('位置属性应用到行内样式', () => {
    const { container } = render(MacDesktopIcon, { props: { x: 30, y: 50 } })
    const root = getRoot(container)
    expect(root.style.left).toBe('30px')
    expect(root.style.top).toBe('50px')
  })

  it('selected / dragging 状态类', () => {
    const { container } = render(MacDesktopIcon, {
      props: { selected: true, dragging: true },
    })
    const root = getRoot(container)
    expect(root.className).toContain('selected')
    expect(root.className).toContain('dragging')
  })

  it('双击派发 mac-icon-dblclick 事件（含 iconId）', async () => {
    const { container, component } = render(MacDesktopIcon, {
      props: { label: 'A', iconId: 'my-icon' },
    })
    await vi.advanceTimersByTimeAsync(0)
    const handler = vi.fn()
    document.addEventListener('mac-icon-dblclick', handler)
    const wrapper = container.querySelector('.icon-wrapper')!
    await fireEvent.mouseDown(wrapper, { button: 0 })
    await fireEvent.mouseDown(wrapper, { button: 0 })
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail
    expect(detail.iconId).toBe('my-icon')
    document.removeEventListener('mac-icon-dblclick', handler)
    void component
  })

  it('单击不派发双击事件', async () => {
    const { container } = render(MacDesktopIcon, { props: { label: 'A' } })
    const handler = vi.fn()
    document.addEventListener('mac-icon-dblclick', handler)
    await fireEvent.mouseDown(container.querySelector('.icon-wrapper')!, { button: 0 })
    expect(handler).not.toHaveBeenCalled()
    document.removeEventListener('mac-icon-dblclick', handler)
  })

  it('渲染自定义图标内容 snippet', () => {
    const { container } = render(MacDesktopIcon, {
      props: { label: 'X', children: snippet('<img src="a.png" alt="i" />') },
    })
    expect(container.querySelector('.icon-image')?.querySelector('img')).toBeTruthy()
    expect(container.querySelector('.default-icon')).toBeNull()
  })
})
