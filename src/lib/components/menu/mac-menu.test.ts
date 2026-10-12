import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/svelte'
import MacMenu, { type MenuItem } from './mac-menu.svelte'

afterEach(cleanup)

const items: MenuItem[] = [
  { value: 'copy', label: '复制', shortcut: '⌘C' },
  { divider: true },
  { value: 'paste', label: '粘贴', disabled: true },
  { value: 'delete', label: '删除', danger: true },
]

function getPortal(container: HTMLElement) {
  return container.querySelector<HTMLElement>('.mac-menu-portal')!
}

describe('MacMenu（Svelte 版）', () => {
  it('默认不可见', () => {
    const { container } = render(MacMenu, { props: {} })
    expect(getPortal(container)).toBeNull()
  })

  it('show 方法显示菜单并派发 mac-menu-open', async () => {
    const { container, component } = render(MacMenu, { props: { items } })
    const handler = vi.fn()
    document.addEventListener('mac-menu-open', handler)
    ;(component as unknown as { show: (x: number, y: number) => void }).show(100, 100)
    await new Promise((r) => setTimeout(r, 0))
    expect(getPortal(container)).toBeTruthy()
    expect(handler).toHaveBeenCalledOnce()
    document.removeEventListener('mac-menu-open', handler)
  })

  it('渲染菜单项：label / shortcut / disabled / danger / divider', async () => {
    const { container, component } = render(MacMenu, { props: { items } })
    ;(component as unknown as { show: (x: number, y: number) => void }).show(0, 0)
    await new Promise((r) => setTimeout(r, 0))
    const portal = getPortal(container)!
    const menuItems = portal.querySelectorAll('.menu-item')
    expect(menuItems.length).toBe(3)
    expect(portal.querySelector('.menu-divider')).toBeTruthy()
    expect(menuItems[0].querySelector('.menu-item-shortcut')?.textContent).toBe('⌘C')
    expect(menuItems[1].className).toContain('disabled')
    expect(menuItems[2].className).toContain('danger')
  })

  it('active 高亮当前值', async () => {
    const { container, component } = render(MacMenu, { props: { items, value: 'copy' } })
    ;(component as unknown as { show: (x: number, y: number) => void }).show(0, 0)
    await new Promise((r) => setTimeout(r, 0))
    expect(getPortal(container)!.querySelector('.menu-item.active')?.getAttribute('data-value')).toBe(
      'copy',
    )
  })

  it('点击菜单项派发 mac-menu-select 并关闭', async () => {
    const { container, component } = render(MacMenu, { props: { items } })
    ;(component as unknown as { show: (x: number, y: number) => void }).show(0, 0)
    await new Promise((r) => setTimeout(r, 0))
    const handler = vi.fn()
    document.addEventListener('mac-menu-select', handler)
    const item = getPortal(container)!.querySelector<HTMLElement>('[data-value="copy"]')!
    await fireEvent.click(item)
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail
    expect(detail.value).toBe('copy')
    expect(detail.item.label).toBe('复制')
    document.removeEventListener('mac-menu-select', handler)
  })

  it('disabled 菜单项点击无效', async () => {
    const { container, component } = render(MacMenu, { props: { items } })
    ;(component as unknown as { show: (x: number, y: number) => void }).show(0, 0)
    await new Promise((r) => setTimeout(r, 0))
    const handler = vi.fn()
    document.addEventListener('mac-menu-select', handler)
    await fireEvent.click(getPortal(container)!.querySelector('[data-value="paste"]')!)
    expect(handler).not.toHaveBeenCalled()
    document.removeEventListener('mac-menu-select', handler)
  })

  it('hide 方法关闭菜单并派发 mac-menu-close', async () => {
    const { container, component } = render(MacMenu, { props: { items } })
    const comp = component as unknown as { show: (x: number, y: number) => void; hide: () => void }
    comp.show(0, 0)
    await new Promise((r) => setTimeout(r, 0))
    const handler = vi.fn()
    document.addEventListener('mac-menu-close', handler)
    comp.hide()
    await new Promise((r) => setTimeout(r, 0))
    expect(getPortal(container)).toBeNull()
    expect(handler).toHaveBeenCalledOnce()
    document.removeEventListener('mac-menu-close', handler)
  })

  it('toggle 方法切换可见性', async () => {
    const { container, component } = render(MacMenu, { props: { items } })
    const comp = component as unknown as {
      toggle: (x: number, y: number) => void
      hide: () => void
    }
    comp.toggle(10, 10)
    await new Promise((r) => setTimeout(r, 0))
    expect(getPortal(container)).toBeTruthy()
    comp.hide()
  })

  it('Escape 键关闭菜单', async () => {
    const { container, component } = render(MacMenu, { props: { items } })
    ;(component as unknown as { show: (x: number, y: number) => void }).show(0, 0)
    await new Promise((r) => setTimeout(r, 0))
    await fireEvent.keyDown(document, { key: 'Escape' })
    await new Promise((r) => setTimeout(r, 0))
    expect(getPortal(container)).toBeNull()
  })

  it('点击外部区域关闭菜单', async () => {
    const { container, component } = render(MacMenu, { props: { items } })
    ;(component as unknown as { show: (x: number, y: number) => void }).show(0, 0)
    await new Promise((r) => setTimeout(r, 0))
    await fireEvent.mouseDown(document.body)
    await new Promise((r) => setTimeout(r, 0))
    expect(getPortal(container)).toBeNull()
  })
})
