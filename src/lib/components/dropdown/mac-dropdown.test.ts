import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/svelte'
import MacDropdown from './mac-dropdown.svelte'
import { snippet } from '$lib/test/utils'

afterEach(cleanup)

const items = [
  { value: 'copy', label: '复制', shortcut: '⌘C' },
  { divider: true },
  { value: 'paste', label: '粘贴', disabled: true },
  { value: 'remove', label: '移除', danger: true },
]

const flush = () => new Promise((r) => setTimeout(r, 0))

describe('MacDropdown（Svelte 版）', () => {
  it('默认不显示菜单', () => {
    const { container } = render(MacDropdown, {
      props: { items, triggerSnippet: snippet('<button>操作</button>') },
    })
    expect(container.querySelector('.mac-dropdown-portal')).toBeNull()
  })

  it('点击触发元素打开菜单并派发 mac-dropdown-open', async () => {
    const { container } = render(MacDropdown, {
      props: { items, triggerSnippet: snippet('<button>操作</button>') },
    })
    const handler = vi.fn()
    document.addEventListener('mac-dropdown-open', handler)
    await fireEvent.click(container.querySelector('.dropdown-trigger')!)
    await flush()
    const menu = container.querySelector<HTMLElement>('.mac-dropdown-portal')!
    expect(menu).toBeTruthy()
    expect(menu.getAttribute('role')).toBe('menu')
    expect(handler).toHaveBeenCalledOnce()
    document.removeEventListener('mac-dropdown-open', handler)
  })

  it('渲染菜单项：shortcut / disabled / danger / divider', async () => {
    const { container } = render(MacDropdown, {
      props: { items, triggerSnippet: snippet('<button>操作</button>') },
    })
    await fireEvent.click(container.querySelector('.dropdown-trigger')!)
    await flush()
    const menu = container.querySelector('.mac-dropdown-portal')!
    expect(menu.querySelectorAll('.dropdown-item').length).toBe(3)
    expect(menu.querySelector('.dropdown-divider')).toBeTruthy()
    expect(menu.querySelector('.dropdown-item-shortcut')?.textContent).toBe('⌘C')
    expect(menu.querySelector('[data-value="paste"]')?.className).toContain('disabled')
    expect(menu.querySelector('[data-value="remove"]')?.className).toContain('danger')
  })

  it('再次点击触发元素关闭菜单', async () => {
    const { container } = render(MacDropdown, {
      props: { items, triggerSnippet: snippet('<button>操作</button>') },
    })
    const t = container.querySelector('.dropdown-trigger')!
    await fireEvent.click(t)
    await flush()
    await fireEvent.click(t)
    expect(container.querySelector('.mac-dropdown-portal')).toBeNull()
  })

  it('点击菜单项派发 mac-dropdown-select 并关闭', async () => {
    const { container } = render(MacDropdown, {
      props: { items, triggerSnippet: snippet('<button>操作</button>') },
    })
    await fireEvent.click(container.querySelector('.dropdown-trigger')!)
    await flush()
    const handler = vi.fn()
    document.addEventListener('mac-dropdown-select', handler)
    await fireEvent.click(container.querySelector('[data-value="copy"]')!)
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail
    expect(detail.value).toBe('copy')
    expect(detail.item.label).toBe('复制')
    expect(container.querySelector('.mac-dropdown-portal')).toBeNull()
    document.removeEventListener('mac-dropdown-select', handler)
  })

  it('disabled 菜单项点击无效', async () => {
    const { container } = render(MacDropdown, {
      props: { items, triggerSnippet: snippet('<button>操作</button>') },
    })
    await fireEvent.click(container.querySelector('.dropdown-trigger')!)
    await flush()
    const handler = vi.fn()
    document.addEventListener('mac-dropdown-select', handler)
    await fireEvent.click(container.querySelector('[data-value="paste"]')!)
    expect(handler).not.toHaveBeenCalled()
    document.removeEventListener('mac-dropdown-select', handler)
  })

  it('value 高亮当前项', async () => {
    const { container } = render(MacDropdown, {
      props: { items, value: 'copy', triggerSnippet: snippet('<button>操作</button>') },
    })
    await fireEvent.click(container.querySelector('.dropdown-trigger')!)
    await flush()
    expect(container.querySelector('[data-value="copy"]')?.className).toContain('active')
  })

  it('disabled 属性阻止打开菜单', async () => {
    const { container } = render(MacDropdown, {
      props: { items, disabled: true, triggerSnippet: snippet('<button>操作</button>') },
    })
    await fireEvent.click(container.querySelector('.dropdown-trigger')!)
    await flush()
    expect(container.querySelector('.mac-dropdown-portal')).toBeNull()
  })

  it('trigger=contextmenu 右键打开菜单（点击坐标定位）', async () => {
    const { container } = render(MacDropdown, {
      props: { items, trigger: 'contextmenu', triggerSnippet: snippet('<button>操作</button>') },
    })
    await fireEvent.contextMenu(container.querySelector('.dropdown-trigger')!, {
      clientX: 200,
      clientY: 200,
    })
    await flush()
    expect(container.querySelector('.mac-dropdown-portal')).toBeTruthy()
    // click 模式被禁用
    await fireEvent.click(container.querySelector('.dropdown-trigger')!)
    expect(container.querySelectorAll('.mac-dropdown-portal').length).toBe(1)
  })

  it('ESC 键关闭菜单', async () => {
    const { container } = render(MacDropdown, {
      props: { items, triggerSnippet: snippet('<button>操作</button>') },
    })
    await fireEvent.click(container.querySelector('.dropdown-trigger')!)
    await flush()
    const handler = vi.fn()
    document.addEventListener('mac-dropdown-close', handler)
    await fireEvent.keyDown(document, { key: 'Escape' })
    expect(handler).toHaveBeenCalledOnce()
    expect(container.querySelector('.mac-dropdown-portal')).toBeNull()
    document.removeEventListener('mac-dropdown-close', handler)
  })

  it('点击外部区域关闭菜单', async () => {
    const { container } = render(MacDropdown, {
      props: { items, triggerSnippet: snippet('<button>操作</button>') },
    })
    await fireEvent.click(container.querySelector('.dropdown-trigger')!)
    await flush()
    await fireEvent.mouseDown(document.body)
    expect(container.querySelector('.mac-dropdown-portal')).toBeNull()
  })

  it('openOnHover 悬停打开', async () => {
    vi.useFakeTimers()
    const { container } = render(MacDropdown, {
      props: {
        items,
        openOnHover: true,
        hoverDelay: 100,
        triggerSnippet: snippet('<button>操作</button>'),
      },
    })
    await fireEvent.mouseEnter(container.querySelector('.dropdown')!)
    await vi.advanceTimersByTimeAsync(150)
    expect(container.querySelector('.mac-dropdown-portal')).toBeTruthy()
    vi.useRealTimers()
  })
})
