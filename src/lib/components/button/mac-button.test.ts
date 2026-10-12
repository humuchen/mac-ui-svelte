import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/svelte'
import MacButton from './mac-button.svelte'
import { snippet, listenEvent } from '$lib/test/utils'

afterEach(cleanup)

describe('MacButton（Svelte 版）', () => {
  it('默认属性渲染：primary 变体 / md 尺寸 / 未禁用', () => {
    const { getByRole } = render(MacButton, { props: { children: snippet('Click') } })
    const btn = getByRole('button')
    expect(btn.className).toContain('button--primary')
    expect(btn.className).toContain('button--md')
    expect((btn as HTMLButtonElement).disabled).toBe(false)
    expect(btn.textContent).toContain('Click')
  })

  it('属性绑定响应：variant / disabled / loading', () => {
    const { getByRole } = render(MacButton, {
      props: { variant: 'text', disabled: true, loading: true, children: snippet('Ok') },
    })
    const btn = getByRole('button') as HTMLButtonElement
    expect(btn.className).toContain('button--text')
    expect(btn.className).toContain('button--loading')
    expect(btn.disabled).toBe(true)
    expect(btn.querySelector('.spinner')).toBeTruthy()
  })

  it('size 属性映射到类名', () => {
    const { getByRole } = render(MacButton, {
      props: { size: 'sm', children: snippet('S') },
    })
    expect(getByRole('button').className).toContain('button--sm')
  })

  it('点击派发 mac-click 自定义事件（bubbles + composed）', async () => {
    const { getByRole } = render(MacButton, { props: { children: snippet('Click') } })
    const off = listenEvent('mac-click', () => {})
    const handler = vi.fn()
    document.addEventListener('mac-click', handler)
    await fireEvent.click(getByRole('button'))
    expect(handler).toHaveBeenCalledOnce()
    document.removeEventListener('mac-click', handler)
    off()
  })

  it('disabled 状态下点击不派发事件', async () => {
    const { getByRole } = render(MacButton, {
      props: { disabled: true, children: snippet('X') },
    })
    const handler = vi.fn()
    document.addEventListener('mac-click', handler)
    await fireEvent.click(getByRole('button'))
    expect(handler).not.toHaveBeenCalled()
    document.removeEventListener('mac-click', handler)
  })

  it('渲染 prefix / suffix snippet', () => {
    const { getByRole } = render(MacButton, {
      props: {
        children: snippet('Mid'),
        prefix: snippet('P'),
        suffix: snippet('S'),
      },
    })
    const btn = getByRole('button')
    expect(btn.textContent).toContain('P')
    expect(btn.textContent).toContain('Mid')
    expect(btn.textContent).toContain('S')
  })
})
