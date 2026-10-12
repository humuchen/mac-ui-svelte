import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/svelte'
import MacTextEllipsis from './mac-text-ellipsis.svelte'
import { snippet } from '$lib/test/utils'

afterEach(cleanup)

function getRoot(container: HTMLElement) {
  return container.querySelector<HTMLElement>('.mac-text-ellipsis')!
}

describe('MacTextEllipsis（Svelte 版）', () => {
  it('默认属性渲染：lineClamp=3 / expandTrigger=none', () => {
    const { container } = render(MacTextEllipsis, {
      props: { children: snippet('一段可能很长的文本内容') },
    })
    const root = getRoot(container)
    const content = root.querySelector<HTMLElement>('.ellipsis-content')!
    expect(content.style.getPropertyValue('--_line-clamp')).toBe('3')
    expect(content.className).not.toContain('clickable')
    expect(content.textContent).toContain('一段可能很长的文本内容')
  })

  it('属性绑定响应：lineClamp / expandTrigger=click', () => {
    const { container } = render(MacTextEllipsis, {
      props: { lineClamp: 5, expandTrigger: 'click' },
    })
    const content = getRoot(container).querySelector<HTMLElement>('.ellipsis-content')!
    expect(content.style.getPropertyValue('--_line-clamp')).toBe('5')
    // expandTrigger=click 且截断时才有 clickable（jsdom 中不截断，无 clickable）
    expect(content.className).not.toContain('clickable')
  })

  it('expandTrigger=none 时点击不触发展开事件', async () => {
    const { container } = render(MacTextEllipsis, {
      props: { expandTrigger: 'none', children: snippet('text') },
    })
    const handler = vi.fn()
    document.addEventListener('mac-ellipsis-expand', handler)
    await fireEvent.click(getRoot(container).querySelector('.ellipsis-content')!)
    expect(handler).not.toHaveBeenCalled()
    document.removeEventListener('mac-ellipsis-expand', handler)
  })

  it('theme 属性映射 data-theme', () => {
    const { container } = render(MacTextEllipsis, { props: { theme: 'dark' } })
    expect(getRoot(container).dataset.theme).toBe('dark')
  })

  it('tooltipSnippet 属性传入时渲染隐藏提示框容器', () => {
    const { container } = render(MacTextEllipsis, {
      props: { tooltip: true, tooltipSnippet: snippet('提示内容'), children: snippet('text') },
    })
    const popup = container.querySelector<HTMLElement>('.tooltip-popup')!
    expect(popup).toBeTruthy()
    // 默认不可见
    expect(popup.className).not.toContain('visible')
  })
})
