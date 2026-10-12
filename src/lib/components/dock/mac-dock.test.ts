import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/svelte'
import MacDock from './mac-dock.svelte'
import MacDockItem from './mac-dock-item.svelte'
import { snippet } from '$lib/test/utils'

afterEach(cleanup)

const items = [
  { id: 'finder', label: 'Finder', color: '#007AFF' },
  { id: 'safari', label: 'Safari', color: '#34C759', running: true },
  { id: 'mail', label: 'Mail', color: '#FF3B30' },
]

const flush = () => new Promise((r) => setTimeout(r, 0))

describe('MacDockItem（Svelte 版）', () => {
  it('默认属性渲染：label / 默认占位图标', () => {
    const { container } = render(MacDockItem, { props: { label: 'Finder' } })
    const item = container.querySelector<HTMLElement>('.mac-dock-item')!
    expect(item.querySelector('.dock-item-label')?.textContent).toBe('Finder')
    expect(item.querySelector('.default-icon')?.textContent).toBe('F')
  })

  it('running 状态显示运行指示器', () => {
    const { container } = render(MacDockItem, { props: { label: 'X', running: true } })
    const item = container.querySelector<HTMLElement>('.mac-dock-item')!
    expect(item.className).toContain('running')
  })

  it('点击派发 mac-dock-item-click 并触发弹跳', async () => {
    const { container } = render(MacDockItem, { props: { itemId: 'a', label: 'A' } })
    const handler = vi.fn()
    document.addEventListener('mac-dock-item-click', handler)
    await fireEvent.click(container.querySelector('.mac-dock-item')!)
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail
    expect(detail.itemId).toBe('a')
    expect(container.querySelector('.mac-dock-item')!.className).toContain('bouncing')
    document.removeEventListener('mac-dock-item-click', handler)
  })

  it('渲染自定义图标内容 snippet', () => {
    const { container } = render(MacDockItem, {
      props: { label: 'X', children: snippet('<img src="i.png" alt="i" />') },
    })
    expect(container.querySelector('.dock-item-icon')?.querySelector('img')).toBeTruthy()
    expect(container.querySelector('.default-icon')).toBeNull()
  })
})

describe('MacDock（Svelte 版）', () => {
  it('默认属性渲染：items 渲染项目与玻璃背景', async () => {
    const { container } = render(MacDock, { props: { items } })
    await flush()
    expect(container.querySelectorAll('.mac-dock-item').length).toBe(3)
    expect(container.querySelector('.dock-glass')).toBeTruthy()
  })

  it('position 属性映射 data-position', () => {
    const { container } = render(MacDock, { props: { items, position: 'left' } })
    expect(container.querySelector<HTMLElement>('.mac-dock')!.dataset.position).toBe('left')
  })

  it('点击项目事件转发为 mac-dock-item-click', async () => {
    const { container } = render(MacDock, { props: { items } })
    await flush()
    const handler = vi.fn()
    document.addEventListener('mac-dock-item-click', handler)
    const item = container.querySelectorAll('.mac-dock-item')[1]!
    await fireEvent.click(item)
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail
    expect(detail.itemId).toBe('safari')
    document.removeEventListener('mac-dock-item-click', handler)
  })

  it('右键项目显示上下文菜单，点击移除派发 mac-dock-item-remove', async () => {
    const { container } = render(MacDock, { props: { items } })
    await flush()
    const handler = vi.fn()
    document.addEventListener('mac-dock-item-remove', handler)
    const item = container.querySelectorAll('.mac-dock-item')[0]!
    await fireEvent.contextMenu(item, { clientX: 100, clientY: 400 })
    expect(container.querySelector('.dock-context-menu.visible')).toBeTruthy()
    await fireEvent.click(container.querySelector('.dock-context-menu-item.danger')!)
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail
    expect(detail.itemId).toBe('finder')
    expect(container.querySelector('.dock-context-menu.visible')).toBeNull()
    document.removeEventListener('mac-dock-item-remove', handler)
  })

  it('右键空白处不显示菜单', async () => {
    const { container } = render(MacDock, { props: { items } })
    await flush()
    await fireEvent.contextMenu(container.querySelector('.dock')!, { clientX: 10, clientY: 10 })
    expect(container.querySelector('.dock-context-menu.visible')).toBeNull()
  })

  it('放大悬停：鼠标移动应用缩放样式，离开还原', async () => {
    const { container } = render(MacDock, {
      props: { items, magnification: 1.6, magnifyRange: 120 },
    })
    await flush()
    const dock = container.querySelector<HTMLElement>('.dock')!
    const item = container.querySelector<HTMLElement>('.mac-dock-item')!
    // jsdom 中 getBoundingClientRect 全为 0，scale 计算结果为 1（全距内）
    await fireEvent.mouseEnter(dock)
    await fireEvent.mouseMove(dock, { clientX: 0, clientY: 0 })
    expect(item.style.transform).toContain('scale(')
    await fireEvent.mouseLeave(dock)
    expect(item.style.transform).toBe('scale(1)')
  })

  it('渲染 children snippet', () => {
    const { container } = render(MacDock, {
      props: { children: snippet('<div class="my-item">i</div>') },
    })
    expect(container.querySelector('.my-item')).toBeTruthy()
  })
})
