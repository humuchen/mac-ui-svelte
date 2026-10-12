import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/svelte'
import MacTag from './mac-tag.svelte'
import { snippet } from '$lib/test/utils'

afterEach(cleanup)

describe('MacTag（Svelte 版）', () => {
  it('默认属性渲染：default 类型 / md 尺寸 / 有边框', () => {
    const { container } = render(MacTag, { props: { children: snippet('标签') } })
    const tag = container.querySelector<HTMLElement>('.mac-tag')!
    expect(tag.className).toContain('tag--default')
    expect(tag.className).toContain('tag--md')
    expect(tag.className).not.toContain('tag--borderless')
    expect(tag.textContent).toContain('标签')
  })

  it('属性绑定响应：type / size / round / closable / disabled', () => {
    const { container } = render(MacTag, {
      props: {
        type: 'danger',
        size: 'sm',
        round: true,
        closable: true,
        disabled: true,
        bordered: false,
      },
    })
    const tag = container.querySelector<HTMLElement>('.mac-tag')!
    expect(tag.className).toContain('tag--danger')
    expect(tag.className).toContain('tag--sm')
    expect(tag.className).toContain('tag--round')
    expect(tag.className).toContain('tag--closable')
    expect(tag.className).toContain('tag--disabled')
    expect(tag.className).toContain('tag--borderless')
  })

  it('点击关闭按钮派发 mac-close 事件', async () => {
    const { container } = render(MacTag, { props: { closable: true } })
    const handler = vi.fn()
    document.addEventListener('mac-close', handler)
    await fireEvent.click(container.querySelector('.close')!)
    expect(handler).toHaveBeenCalledOnce()
    document.removeEventListener('mac-close', handler)
  })

  it('closable=false 时不渲染关闭按钮', () => {
    const { container } = render(MacTag, { props: {} })
    expect(container.querySelector('.close')).toBeNull()
  })

  it('渲染 prefix / suffix snippet', () => {
    const { container } = render(MacTag, {
      props: { children: snippet('Mid'), prefix: snippet('P'), suffix: snippet('S') },
    })
    const tag = container.querySelector<HTMLElement>('.mac-tag')!
    expect(tag.textContent).toContain('P')
    expect(tag.textContent).toContain('Mid')
    expect(tag.textContent).toContain('S')
  })
})
