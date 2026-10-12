import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/svelte'
import MacDesktop from './mac-desktop.svelte'
import { snippet } from '$lib/test/utils'

afterEach(cleanup)

const icons = [
  { id: 'a', label: 'Finder' },
  { id: 'b', label: 'Safari' },
]

const flush = () => new Promise((r) => setTimeout(r, 0))

describe('MacDesktop（Svelte 版）', () => {
  it('默认属性渲染：icons 数据渲染图标列表与 Dock 区域', async () => {
    const { container } = render(MacDesktop, { props: { icons } })
    await flush()
    expect(container.querySelectorAll('.mac-desktop-icon').length).toBe(2)
    expect(container.querySelector('.desktop-dock')).toBeTruthy()
  })

  it('showDock=false 隐藏 Dock 区域', () => {
    const { container } = render(MacDesktop, { props: { icons, showDock: false } })
    expect(container.querySelector('.desktop-dock')).toBeNull()
  })

  it('wallpaper 属性渲染壁纸图片', () => {
    const { container } = render(MacDesktop, {
      props: { icons, wallpaper: 'bg.png' },
    })
    expect(container.querySelector('.desktop-wallpaper img')?.getAttribute('src')).toBe('bg.png')
  })

  it('wallpaperSnippet 渲染自定义壁纸', () => {
    const { container } = render(MacDesktop, {
      props: { icons, wallpaperSnippet: snippet('<video></video>') },
    })
    expect(container.querySelector('.desktop-wallpaper')?.querySelector('video')).toBeTruthy()
  })

  it('layout=horizontal 映射到排列方向', async () => {
    const { container } = render(MacDesktop, { props: { icons, layout: 'horizontal' } })
    await flush()
    // jsdom 中尺寸为 0，仅验证组件渲染与事件绑定
    expect(container.querySelector('.desktop-icons')).toBeTruthy()
  })

  it('右键显示上下文菜单，菜单项点击派发 mac-layout-change', async () => {
    const { container } = render(MacDesktop, { props: { icons } })
    await flush()
    const handler = vi.fn()
    document.addEventListener('mac-layout-change', handler)
    const desktop = container.querySelector('.desktop')!
    await fireEvent.contextMenu(desktop, { clientX: 100, clientY: 100 })
    expect(container.querySelector('.context-menu.visible')).toBeTruthy()
    await fireEvent.click(container.querySelector('.context-menu-item:nth-child(2)')!)
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail
    expect(detail.layout).toBe('horizontal')
    expect(container.querySelector('.context-menu.visible')).toBeNull()
    document.removeEventListener('mac-layout-change', handler)
  })

  it('点击空白区域取消选择并显示选择框', async () => {
    const { container } = render(MacDesktop, { props: { icons } })
    await flush()
    const iconsArea = container.querySelector('.desktop-icons')!
    await fireEvent.mouseDown(iconsArea, { button: 0, clientX: 200, clientY: 200 })
    expect(container.querySelector('.selection-rect.active')).toBeTruthy()
    await fireEvent.mouseUp(document)
    expect(container.querySelector('.selection-rect.active')).toBeNull()
  })

  it('点击图标选中', async () => {
    const { container } = render(MacDesktop, { props: { icons } })
    await flush()
    const iconEl = container.querySelectorAll('.mac-desktop-icon')[0]!
    const wrapper = iconEl.querySelector('.icon-wrapper')!
    await fireEvent.mouseDown(wrapper, { button: 0, clientX: 10, clientY: 10 })
    expect(iconEl.className).toContain('selected')
    await fireEvent.mouseUp(document)
  })

  it('渲染 dock snippet', () => {
    const { container } = render(MacDesktop, {
      props: { icons, dock: snippet('<div class="my-dock">dock</div>') },
    })
    expect(container.querySelector('.desktop-dock')?.querySelector('.my-dock')).toBeTruthy()
  })

  it('渲染 children snippet', () => {
    const { container } = render(MacDesktop, {
      props: { children: snippet('<div class="custom-icon">x</div>') },
    })
    expect(container.querySelector('.custom-icon')).toBeTruthy()
  })
})
