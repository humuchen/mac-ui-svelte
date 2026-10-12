import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/svelte'
import MacRating from './mac-rating.svelte'

afterEach(cleanup)

function getRoot(container: HTMLElement) {
  return container.querySelector<HTMLElement>('.mac-rating')!
}

describe('MacRating（Svelte 版）', () => {
  it('默认属性渲染：max=5 星形图标 / 当前值 0', () => {
    const { container } = render(MacRating, { props: {} })
    const root = getRoot(container)
    expect(root.querySelectorAll('.icon-wrapper').length).toBe(5)
    expect(root.querySelectorAll('.icon-layer--full').length).toBe(0)
  })

  it('属性绑定响应：value / max / readonly / showValue', () => {
    const { container } = render(MacRating, {
      props: { value: 3, max: 4, readonly: true, showValue: true },
    })
    const root = getRoot(container)
    expect(root.querySelectorAll('.icon-wrapper').length).toBe(4)
    expect(root.querySelectorAll('.icon-layer--full').length).toBe(3)
    expect(root.className).toContain('rating--readonly')
    expect(root.querySelector('.label')?.textContent).toBe('3')
  })

  it('点击图标更新 value 并派发 mac-rating-change', async () => {
    const { container } = render(MacRating, { props: { value: 0 } })
    const handler = vi.fn()
    document.addEventListener('mac-rating-change', handler)
    const zones = container.querySelectorAll('.click-zone--right')
    await fireEvent.click(zones[2])
    expect(handler).toHaveBeenCalledOnce()
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail
    expect(detail.value).toBe(3)
    expect(getRoot(container).querySelectorAll('.icon-layer--full').length).toBe(3)
    document.removeEventListener('mac-rating-change', handler)
  })

  it('disabled 状态点击不派发事件', async () => {
    const { container } = render(MacRating, { props: { disabled: true } })
    const handler = vi.fn()
    document.addEventListener('mac-rating-change', handler)
    const zones = container.querySelectorAll('.click-zone')
    // disabled 时根本不渲染点击区域（与 Lit 版 isInteractive 一致）
    expect(zones.length).toBe(0)
    expect(getRoot(container).className).toContain('rating--disabled')
    document.removeEventListener('mac-rating-change', handler)
  })

  it('allowHalf 支持半星点击', async () => {
    const { container } = render(MacRating, { props: { allowHalf: true } })
    const handler = vi.fn()
    document.addEventListener('mac-rating-change', handler)
    const leftZones = container.querySelectorAll('.click-zone--left')
    await fireEvent.click(leftZones[1])
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail
    expect(detail.value).toBe(1.5)
    document.removeEventListener('mac-rating-change', handler)
  })

  it('点击相同值时清零', async () => {
    const { container } = render(MacRating, { props: { value: 2 } })
    const handler = vi.fn()
    document.addEventListener('mac-rating-change', handler)
    const zones = container.querySelectorAll('.click-zone--right')
    await fireEvent.click(zones[1])
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail
    expect(detail.value).toBe(0)
    document.removeEventListener('mac-rating-change', handler)
  })
})
