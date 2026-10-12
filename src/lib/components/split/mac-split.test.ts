import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/svelte'
import MacSplit from './mac-split.svelte'
import { snippet } from '$lib/test/utils'

afterEach(cleanup)

function getRoot(container: HTMLElement) {
  return container.querySelector<HTMLElement>('.mac-split')!
}

describe('MacSplit（Svelte 版）', () => {
  it('默认属性渲染：horizontal / split=0.5 / 渲染调整条', () => {
    const { container } = render(MacSplit, {
      props: { first: snippet('左'), second: snippet('右') },
    })
    const root = getRoot(container)
    expect(root.querySelector('.split--horizontal')).toBeTruthy()
    expect(root.querySelector('.resizer')).toBeTruthy()
    // style 上的 --_first-size 变量
    expect(root.style.getPropertyValue('--_first-size')).toBe('50%')
  })

  it('pixel 单位映射像素值', () => {
    const { container } = render(MacSplit, { props: { unit: 'pixel', split: 200 } })
    expect(getRoot(container).style.getPropertyValue('--_first-size')).toBe('200px')
  })

  it('split 属性变化同步尺寸', async () => {
    const { container, rerender } = render(MacSplit, { props: { split: 0.3 } })
    rerender({ split: 0.7 })
    await new Promise((r) => setTimeout(r, 0))
    expect(getRoot(container).style.getPropertyValue('--_first-size')).toBe('70%')
  })

  it('direction=vertical 渲染纵向分割', () => {
    const { container } = render(MacSplit, { props: { direction: 'vertical' } })
    expect(container.querySelector('.split--vertical')).toBeTruthy()
  })

  it('disabled 时不触发拖拽', async () => {
    const { container } = render(MacSplit, { props: { disabled: true } })
    const handler = vi.fn()
    document.addEventListener('mac-split-drag-start', handler)
    await fireEvent.mouseDown(container.querySelector('.resizer')!)
    expect(handler).not.toHaveBeenCalled()
    document.removeEventListener('mac-split-drag-start', handler)
  })

  it('拖拽流程派发 drag-start / change / drag-end', async () => {
    const { container } = render(MacSplit, { props: { unit: 'pixel', min: 0, max: 0 } })
    const startHandler = vi.fn()
    const changeHandler = vi.fn()
    const endHandler = vi.fn()
    document.addEventListener('mac-split-drag-start', startHandler)
    document.addEventListener('mac-split-change', changeHandler)
    document.addEventListener('mac-split-drag-end', endHandler)

    await fireEvent.mouseDown(container.querySelector('.resizer')!)
    expect(startHandler).toHaveBeenCalledOnce()
    expect(container.querySelector('.resizer--dragging')).toBeTruthy()

    await fireEvent.mouseMove(document, { clientX: 100, clientY: 0 })
    expect(changeHandler).toHaveBeenCalledOnce()

    await fireEvent.mouseUp(document)
    expect(endHandler).toHaveBeenCalledOnce()
    expect(container.querySelector('.resizer--dragging')).toBeNull()

    document.removeEventListener('mac-split-drag-start', startHandler)
    document.removeEventListener('mac-split-change', changeHandler)
    document.removeEventListener('mac-split-drag-end', endHandler)
  })

  it('渲染 first / second snippet', () => {
    const { container } = render(MacSplit, {
      props: { first: snippet('F'), second: snippet('S') },
    })
    expect(container.textContent).toContain('F')
    expect(container.textContent).toContain('S')
  })
})
