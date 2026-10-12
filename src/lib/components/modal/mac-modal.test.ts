import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/svelte'
import MacModal from './mac-modal.svelte'
import { snippet } from '$lib/test/utils'

afterEach(cleanup)

function getRoot(container: HTMLElement) {
  return container.querySelector<HTMLElement>('.mac-modal')!
}

describe('MacModal（Svelte 版）', () => {
  it('默认属性渲染：标题 / 红绿灯 / 底部按钮 / 位置尺寸', () => {
    const { container } = render(MacModal, {
      props: { title: '窗口', children: snippet('内容') },
    })
    const root = getRoot(container)
    expect(root.querySelector('.title')?.textContent).toBe('窗口')
    expect(root.querySelectorAll('.traffic-light').length).toBe(3)
    expect(root.textContent).toContain('内容')
    expect(root.style.left).toBe('100px')
    expect(root.style.top).toBe('100px')
    expect(root.style.width).toBe('480px')
    expect(root.style.height).toBe('360px')
  })

  it('点击关闭按钮派发 mac-modal-close', async () => {
    const { container } = render(MacModal, { props: {} })
    const handler = vi.fn()
    document.addEventListener('mac-modal-close', handler)
    await fireEvent.click(container.querySelector('.traffic-light--close')!)
    expect(handler).toHaveBeenCalledOnce()
    document.removeEventListener('mac-modal-close', handler)
  })

  it('点击确认/取消按钮派发 mac-modal-ok / mac-modal-cancel', async () => {
    const { container } = render(MacModal, { props: {} })
    const okHandler = vi.fn()
    const cancelHandler = vi.fn()
    document.addEventListener('mac-modal-ok', okHandler)
    document.addEventListener('mac-modal-cancel', cancelHandler)
    await fireEvent.click(container.querySelector('.footer-btn--ok')!)
    await fireEvent.click(container.querySelector('.footer-btn--cancel')!)
    expect(okHandler).toHaveBeenCalledOnce()
    expect(cancelHandler).toHaveBeenCalledOnce()
    document.removeEventListener('mac-modal-ok', okHandler)
    document.removeEventListener('mac-modal-cancel', cancelHandler)
  })

  it('最小化：隐藏内容与底部并派发事件', async () => {
    const { container } = render(MacModal, { props: { children: snippet('内容') } })
    const handler = vi.fn()
    document.addEventListener('mac-modal-minimize', handler)
    await fireEvent.click(container.querySelector('.traffic-light--minimize')!)
    const root = getRoot(container)
    expect(root.className).toContain('minimized')
    expect(root.querySelector('.body')).toBeTruthy()
    // minimized 时 body/footer display:none 由 CSS 处理，检查类存在即可
    expect(handler).toHaveBeenCalledOnce()
    document.removeEventListener('mac-modal-minimize', handler)
  })

  it('最大化：位置归零且尺寸铺满视口', async () => {
    const { container } = render(MacModal, { props: {} })
    const handler = vi.fn()
    document.addEventListener('mac-modal-maximize', handler)
    await fireEvent.click(container.querySelector('.traffic-light--maximize')!)
    const root = getRoot(container)
    expect(root.className).toContain('maximized')
    expect(root.style.left).toBe('0px')
    expect(root.style.top).toBe('0px')
    expect(root.style.width).toBe(`${window.innerWidth}px`)
    expect(handler).toHaveBeenCalledOnce()
    document.removeEventListener('mac-modal-maximize', handler)
  })

  it('再次点击最大化恢复原始尺寸', async () => {
    const { container } = render(MacModal, { props: { x: 50, y: 60, width: 400, height: 300 } })
    const maximize = container.querySelector('.traffic-light--maximize')!
    await fireEvent.click(maximize)
    await fireEvent.click(maximize)
    const root = getRoot(container)
    expect(root.className).not.toContain('maximized')
    expect(root.style.left).toBe('50px')
    expect(root.style.width).toBe('400px')
  })

  it('拖拽标题栏移动窗口并派发 mac-modal-move', async () => {
    const { container } = render(MacModal, { props: { x: 100, y: 100, draggable: true } })
    const handler = vi.fn()
    document.addEventListener('mac-modal-move', handler)
    await fireEvent.mouseDown(container.querySelector('.titlebar')!, { clientX: 150, clientY: 150 })
    await fireEvent.mouseMove(document, { clientX: 200, clientY: 180 })
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail
    expect(detail.x).toBe(150)
    expect(detail.y).toBe(130)
    await fireEvent.mouseUp(document)
    expect(getRoot(container).style.left).toBe('150px')
    document.removeEventListener('mac-modal-move', handler)
  })

  it('resizable=false 时隐藏调整手柄', () => {
    const { container } = render(MacModal, { props: { resizable: false } })
    expect(container.querySelector('.resize-handle')).toBeNull()
  })

  it('se 手柄拖拽调整大小并派发 mac-modal-resize', async () => {
    const { container } = render(MacModal, {
      props: { width: 400, height: 300, resizable: true },
    })
    const handler = vi.fn()
    document.addEventListener('mac-modal-resize', handler)
    await fireEvent.mouseDown(container.querySelector('.resize-se')!, { clientX: 400, clientY: 300 })
    await fireEvent.mouseMove(document, { clientX: 500, clientY: 400 })
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail
    expect(detail.width).toBe(500)
    expect(detail.height).toBe(400)
    await fireEvent.mouseUp(document)
    expect(getRoot(container).style.width).toBe('500px')
    document.removeEventListener('mac-modal-resize', handler)
  })

  it('自定义 footer snippet 渲染', () => {
    const { container } = render(MacModal, {
      props: { footer: snippet('<button class="custom-btn">自定义</button>') },
    })
    expect(container.querySelector('.custom-btn')).toBeTruthy()
    expect(container.querySelector('.footer-actions')).toBeNull()
  })

  it('showButtons=false 隐藏红绿灯', () => {
    const { container } = render(MacModal, { props: { showButtons: false } })
    expect(container.querySelector('.traffic-lights')).toBeNull()
  })
})
