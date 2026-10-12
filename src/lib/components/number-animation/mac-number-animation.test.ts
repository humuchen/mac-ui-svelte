import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/svelte'
import MacNumberAnimation from './mac-number-animation.svelte'
import { snippet } from '$lib/test/utils'

afterEach(cleanup)

const flush = () => new Promise((r) => setTimeout(r, 80))

function getRoot(container: HTMLElement) {
  return container.querySelector<HTMLElement>('.mac-number-animation')!
}

describe('MacNumberAnimation（Svelte 版）', () => {
  it('默认属性渲染：autoplay=false 时直接显示 to（千分位 + 精度格式化）', async () => {
    const { container } = render(MacNumberAnimation, {
      props: { autoplay: false, to: 1234567.891, precision: 2, separator: ',' },
    })
    await flush()
    const value = container.querySelector<HTMLElement>('.value')!
    expect(value.textContent).toBe('1,234,567.89')
  })

  it('属性绑定响应：prefix / suffix 字符串属性渲染', async () => {
    const { container } = render(MacNumberAnimation, {
      props: { autoplay: false, to: 42, prefix: '¥', suffix: '元' },
    })
    await flush()
    expect(container.querySelector<HTMLElement>('.prefix')?.textContent).toBe('¥')
    expect(container.querySelector<HTMLElement>('.value')?.textContent).toBe('42')
    expect(container.querySelector<HTMLElement>('.suffix')?.textContent).toBe('元')
  })

  it('autoplay 动画完成后显示目标值并派发 start / finish 事件', async () => {
    let startDetail: unknown
    let finishDetail: unknown
    const offStart = (() => {
      const l = (e: Event) => (startDetail = (e as CustomEvent).detail)
      document.addEventListener('mac-number-animation-start', l)
      return () => document.removeEventListener('mac-number-animation-start', l)
    })()
    const offFinish = (() => {
      const l = (e: Event) => (finishDetail = (e as CustomEvent).detail)
      document.addEventListener('mac-number-animation-finish', l)
      return () => document.removeEventListener('mac-number-animation-finish', l)
    })()

    const { container } = render(MacNumberAnimation, {
      props: { from: 0, to: 100, duration: 0 },
    })
    await flush()

    expect(startDetail).toEqual({ from: 0, to: 100 })
    expect(finishDetail).toEqual({ value: 100 })
    expect((container.querySelector<HTMLElement>('.value') as HTMLElement).textContent).toBe('100')

    offStart()
    offFinish()
  })

  it('动画完成时调用 onFinish 回调', async () => {
    const onFinish = vi.fn()
    render(MacNumberAnimation, { props: { from: 10, to: 20, duration: 0, onFinish } })
    await flush()
    expect(onFinish).toHaveBeenCalledWith(20)
  })

  it('prefixSnippet / suffixSnippet 优先于字符串属性', async () => {
    const { container } = render(MacNumberAnimation, {
      props: {
        autoplay: false,
        to: 5,
        prefix: 'P',
        suffix: 'S',
        prefixSnippet: snippet('PSlot'),
        suffixSnippet: snippet('SSlot'),
      },
    })
    await flush()
    expect(container.querySelector<HTMLElement>('.prefix')?.textContent).toContain('PSlot')
    expect(container.querySelector<HTMLElement>('.suffix')?.textContent).toContain('SSlot')
    expect(getRoot(container)).toBeTruthy()
  })
})
