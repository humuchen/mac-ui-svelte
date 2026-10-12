import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/svelte'
import MacDrawer from './mac-drawer.svelte'
import { snippet } from '$lib/test/utils'

afterEach(cleanup)

const flush = (ms = 350) => new Promise((r) => setTimeout(r, ms))

describe('MacDrawer（Svelte 版）', () => {
  it('默认不渲染面板', () => {
    const { container } = render(MacDrawer, { props: {} })
    expect(container.querySelector('.panel')).toBeNull()
  })

  it('open=true 渲染面板并派发 open / after-open', async () => {
    const { container } = render(MacDrawer, {
      props: { open: true, children: snippet('抽屉内容') },
    })
    await new Promise((r) => setTimeout(r, 0))
    expect(container.querySelector('.panel.right')).toBeTruthy()
    expect(container.textContent).toContain('抽屉内容')
    // open/visible 类在下一帧添加
    await flush()
    expect(container.querySelector('.panel.open')).toBeTruthy()
    expect(container.querySelector('.mask.visible')).toBeTruthy()
  })

  it('close 事件与 after-close 时序', async () => {
    const closeHandler = vi.fn()
    const afterCloseHandler = vi.fn()
    document.addEventListener('mac-drawer-close', closeHandler)
    document.addEventListener('mac-drawer-after-close', afterCloseHandler)
    const { container, rerender } = render(MacDrawer, { props: { open: true } })
    await flush()
    rerender({ open: false })
    expect(closeHandler).toHaveBeenCalledOnce()
    // after-close 在 300ms 动画后触发
    expect(afterCloseHandler).not.toHaveBeenCalled()
    await flush()
    expect(afterCloseHandler).toHaveBeenCalledOnce()
    expect(container.querySelector('.panel')).toBeNull()
    document.removeEventListener('mac-drawer-close', closeHandler)
    document.removeEventListener('mac-drawer-after-close', afterCloseHandler)
  })

  it('title 与关闭按钮渲染，点击关闭', async () => {
    const { container } = render(MacDrawer, { props: { open: true, title: '设置' } })
    await new Promise((r) => setTimeout(r, 0))
    expect(container.querySelector('.title')?.textContent).toBe('设置')
    await fireEvent.click(container.querySelector('.close-btn')!)
    await new Promise((r) => setTimeout(r, 0))
    expect(container.querySelector('.panel.open')).toBeNull()
  })

  it('maskClosable 点击遮罩关闭', async () => {
    const { container } = render(MacDrawer, {
      props: { open: true, maskClosable: true },
    })
    await flush()
    await fireEvent.click(container.querySelector('.mask')!)
    await new Promise((r) => setTimeout(r, 0))
    expect(container.querySelector('.panel.open')).toBeNull()
  })

  it('maskClosable=false 点击遮罩不关闭', async () => {
    const { container } = render(MacDrawer, {
      props: { open: true, maskClosable: false },
    })
    await flush()
    await fireEvent.click(container.querySelector('.mask')!)
    await new Promise((r) => setTimeout(r, 0))
    expect(container.querySelector('.panel.open')).toBeTruthy()
  })

  it('closeOnEsc 按 ESC 关闭', async () => {
    const { container } = render(MacDrawer, { props: { open: true, closeOnEsc: true } })
    await flush()
    await fireEvent.keyDown(document, { key: 'Escape' })
    await new Promise((r) => setTimeout(r, 0))
    expect(container.querySelector('.panel.open')).toBeNull()
  })

  it('placement=top 渲染顶部面板', async () => {
    const { container } = render(MacDrawer, { props: { open: true, placement: 'top' } })
    await new Promise((r) => setTimeout(r, 0))
    expect(container.querySelector('.panel.top')).toBeTruthy()
  })

  it('showMask=false 不渲染遮罩', async () => {
    const { container } = render(MacDrawer, { props: { open: true, showMask: false } })
    await new Promise((r) => setTimeout(r, 0))
    expect(container.querySelector('.mask')).toBeNull()
  })

  it('showMask=transparent 渲染透明遮罩', async () => {
    const { container } = render(MacDrawer, { props: { open: true, showMask: 'transparent' } })
    await new Promise((r) => setTimeout(r, 0))
    expect(container.querySelector('.mask.transparent')).toBeTruthy()
  })

  it('渲染 footer snippet', async () => {
    const { container } = render(MacDrawer, {
      props: { open: true, footer: snippet('<button>保存</button>') },
    })
    await new Promise((r) => setTimeout(r, 0))
    expect(container.querySelector('.footer')?.querySelector('button')).toBeTruthy()
  })

  it('closable=false 不渲染关闭按钮', async () => {
    const { container } = render(MacDrawer, { props: { open: true, closable: false } })
    await new Promise((r) => setTimeout(r, 0))
    expect(container.querySelector('.close-btn')).toBeNull()
  })
})
