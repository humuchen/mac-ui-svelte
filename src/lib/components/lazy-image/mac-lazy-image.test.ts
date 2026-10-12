import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/svelte'
import MacLazyImage from './mac-lazy-image.svelte'
import { snippet } from '$lib/test/utils'

afterEach(cleanup)

function getRoot(container: HTMLElement) {
  return container.querySelector<HTMLElement>('.mac-lazy-image')!
}

describe('MacLazyImage（Svelte 版）', () => {
  it('默认属性渲染：显示 shimmer 占位', () => {
    const { container } = render(MacLazyImage, { props: { src: 'a.png', width: '100px', height: '80px' } })
    const root = getRoot(container)
    expect(root.querySelector('.placeholder.shimmer')).toBeTruthy()
    expect(root.querySelector('.placeholder-icon')).toBeTruthy()
    const c = root.querySelector<HTMLElement>('.container')!
    expect(c.style.width).toBe('100px')
    expect(c.style.height).toBe('80px')
  })

  it('设置 IntersectionObserver 观察懒加载（jsdom mock 环境）', () => {
    const { container } = render(MacLazyImage, { props: { src: 'a.png' } })
    // jsdom setup.ts 提供 IntersectionObserver mock
    expect(typeof IntersectionObserver).toBeDefined()
    expect(container.querySelector('.image')).toBeNull()
  })

  it('preview 启用后渲染预览遮罩（默认隐藏）与 cursor 样式', () => {
    const { container } = render(MacLazyImage, { props: { src: 'a.png', preview: true } })
    const root = getRoot(container)
    expect(root.querySelector('.preview-overlay')).toBeTruthy()
    expect(root.className).toContain('preview-enabled')
  })

  it('未加载完成时点击不打开预览', async () => {
    const { container } = render(MacLazyImage, {
      props: { src: 'a.png', preview: true },
    })
    const handler = vi.fn()
    document.addEventListener('mac-preview-open', handler)
    await fireEvent.click(container.querySelector('.container')!)
    expect(handler).not.toHaveBeenCalled()
    document.removeEventListener('mac-preview-open', handler)
  })

  it('渲染 placeholderSnippet / errorSnippet', () => {
    const { container } = render(MacLazyImage, {
      props: { src: 'a.png', placeholderSnippet: snippet('<b>P</b>') },
    })
    expect(container.querySelector('.placeholder')?.innerHTML).toContain('P')
  })

  it('theme 属性映射 data-theme', () => {
    const { container } = render(MacLazyImage, { props: { theme: 'dark' } })
    expect(getRoot(container).dataset.theme).toBe('dark')
  })

  it('无 src 时仍渲染占位', () => {
    const { container } = render(MacLazyImage, { props: {} })
    expect(container.querySelector('.placeholder')).toBeTruthy()
  })
})
