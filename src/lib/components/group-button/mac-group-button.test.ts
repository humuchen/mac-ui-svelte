import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/svelte'
import MacGroupButton from './mac-group-button.svelte'

afterEach(cleanup)

const items = [
  { value: 'a', label: '苹果' },
  { value: 'b', label: '香蕉' },
  { value: 'c', label: '樱桃' },
]

function getRoot(container: HTMLElement) {
  return container.querySelector<HTMLElement>('.mac-group-button')!
}

describe('MacGroupButton（Svelte 版）', () => {
  it('默认属性渲染：未提供 value 时自动选中第一个可用项', async () => {
    const { container } = render(MacGroupButton, { props: { items } })
    await new Promise((r) => setTimeout(r, 0))
    const selected = container.querySelector('.button--selected') as HTMLElement
    expect(selected?.textContent).toContain('苹果')
  })

  it('value 属性控制选中项', () => {
    const { container } = render(MacGroupButton, { props: { items, value: 'b' } })
    const buttons = container.querySelectorAll('.button')
    expect(buttons[1].className).toContain('button--selected')
    expect(buttons[1].getAttribute('aria-checked')).toBe('true')
  })

  it('点击切换选中并派发 mac-change', async () => {
    const { container } = render(MacGroupButton, { props: { items, value: 'a' } })
    const handler = vi.fn()
    document.addEventListener('mac-change', handler)
    const buttons = container.querySelectorAll<HTMLButtonElement>('.button')
    await fireEvent.click(buttons[2])
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail
    expect(detail.value).toBe('c')
    expect(detail.index).toBe(2)
    expect(detail.item.value).toBe('c')
    document.removeEventListener('mac-change', handler)
  })

  it('点击相同项不派发事件', async () => {
    const { container } = render(MacGroupButton, { props: { items, value: 'a' } })
    const handler = vi.fn()
    document.addEventListener('mac-change', handler)
    const buttons = container.querySelectorAll<HTMLButtonElement>('.button')
    await fireEvent.click(buttons[0])
    expect(handler).not.toHaveBeenCalled()
    document.removeEventListener('mac-change', handler)
  })

  it('disabled 项不可点击', async () => {
    const { container } = render(MacGroupButton, {
      props: { items: [...items.slice(0, 2), { value: 'c', label: '樱桃', disabled: true }], value: 'a' },
    })
    const handler = vi.fn()
    document.addEventListener('mac-change', handler)
    const buttons = container.querySelectorAll<HTMLButtonElement>('.button')
    expect(buttons[2].disabled).toBe(true)
    await fireEvent.click(buttons[2])
    expect(handler).not.toHaveBeenCalled()
    document.removeEventListener('mac-change', handler)
  })

  it('键盘左右键切换', async () => {
    const { container } = render(MacGroupButton, { props: { items, value: 'a' } })
    const handler = vi.fn()
    document.addEventListener('mac-change', handler)
    const buttons = container.querySelectorAll<HTMLButtonElement>('.button')
    await fireEvent.keyDown(buttons[0], { key: 'ArrowRight' })
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail
    expect(detail.value).toBe('b')
    document.removeEventListener('mac-change', handler)
  })

  it('渲染滑块指示器', () => {
    const { container } = render(MacGroupButton, { props: { items, value: 'a' } })
    expect(container.querySelector('.slider')).toBeTruthy()
    expect(getRoot(container).getAttribute('role') ?? container.querySelector('[role="radiogroup"]')).toBeTruthy()
  })
})
