import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/svelte'
import MacInputNumber from './mac-input-number.svelte'
import { snippet } from '$lib/test/utils'

afterEach(cleanup)

function getRoot(container: HTMLElement) {
  return container.querySelector<HTMLElement>('.mac-input-number')!
}

function getInput(container: HTMLElement) {
  return container.querySelector<HTMLInputElement>('.input')!
}

describe('MacInputNumber（Svelte 版）', () => {
  it('默认属性渲染：default 变体 / 显示步进按钮', () => {
    const { container } = render(MacInputNumber, { props: {} })
    expect(container.querySelector('.input-container--default')).toBeTruthy()
    expect(container.querySelector('.buttons')).toBeTruthy()
    expect(getInput(container).value).toBe('')
  })

  it('defaultValue 非受控初始化', async () => {
    const { container } = render(MacInputNumber, { props: { defaultValue: 5 } })
    await new Promise((r) => setTimeout(r, 0))
    expect(getInput(container).value).toBe('5')
  })

  it('属性绑定响应：min/max 钳制步进值', async () => {
    const { container } = render(MacInputNumber, {
      props: { value: 9, min: 0, max: 10 },
    })
    await new Promise((r) => setTimeout(r, 0))
    const handler = vi.fn()
    document.addEventListener('mac-change', handler)
    await fireEvent.click(container.querySelector('.button-step--plus')!)
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail
    expect(detail.value).toBe(10)
    // 达到 max 后加号按钮禁用
    expect(
      (container.querySelector('.button-step--plus') as HTMLButtonElement).disabled,
    ).toBe(true)
    document.removeEventListener('mac-change', handler)
  })

  it('减号步进与 min 禁用', async () => {
    const { container } = render(MacInputNumber, { props: { value: 0, min: 0 } })
    await new Promise((r) => setTimeout(r, 0))
    expect((container.querySelector('.button-step:not(.button-step--plus)') as HTMLButtonElement).disabled).toBe(true)
  })

  it('输入数字派发 mac-input-number 事件', async () => {
    const { container } = render(MacInputNumber, { props: {} })
    const handler = vi.fn()
    document.addEventListener('mac-input-number', handler)
    await fireEvent.input(getInput(container), { target: { value: '42' } })
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail
    expect(detail.value).toBe(42)
    document.removeEventListener('mac-input-number', handler)
  })

  it('precision 精度格式化显示', async () => {
    const { container } = render(MacInputNumber, {
      props: { value: 3.14159, precision: 2 },
    })
    await new Promise((r) => setTimeout(r, 0))
    expect(getInput(container).value).toBe('3.14')
  })

  it('键盘上下键步进', async () => {
    const { container } = render(MacInputNumber, { props: { value: 5, keyboard: true } })
    await new Promise((r) => setTimeout(r, 0))
    const handler = vi.fn()
    document.addEventListener('mac-change', handler)
    await fireEvent.keyDown(getInput(container), { key: 'ArrowUp' })
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail
    expect(detail.value).toBe(6)
    document.removeEventListener('mac-change', handler)
  })

  it('clearable：点击清除并派发 mac-change', async () => {
    const { container } = render(MacInputNumber, { props: { value: 7, clearable: true } })
    await new Promise((r) => setTimeout(r, 0))
    const handler = vi.fn()
    document.addEventListener('mac-change', handler)
    const clearBtn = container.querySelector<HTMLButtonElement>('.clear-button')!
    expect(clearBtn).toBeTruthy()
    await fireEvent.click(clearBtn)
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail
    expect(detail.value).toBeUndefined()
    expect(getInput(container).value).toBe('')
    document.removeEventListener('mac-change', handler)
  })

  it('disabled 状态点击步进无效', async () => {
    const { container } = render(MacInputNumber, { props: { value: 1, disabled: true } })
    await new Promise((r) => setTimeout(r, 0))
    const handler = vi.fn()
    document.addEventListener('mac-change', handler)
    await fireEvent.click(container.querySelector('.button-step--plus')!)
    expect(handler).not.toHaveBeenCalled()
    document.removeEventListener('mac-change', handler)
  })

  it('buttonPlacement=outside 渲染外部按钮', async () => {
    const { container } = render(MacInputNumber, {
      props: { buttonPlacement: 'outside' },
    })
    await new Promise((r) => setTimeout(r, 0))
    expect(container.querySelector('.buttons--outside')).toBeTruthy()
    // 容器内不渲染内部按钮
    expect(container.querySelector('.input-container .buttons')).toBeNull()
  })

  it('showButton=false 隐藏步进按钮', () => {
    const { container } = render(MacInputNumber, { props: { showButton: false } })
    expect(container.querySelector('.buttons')).toBeNull()
  })

  it('渲染 prefix / suffix snippet', () => {
    const { container } = render(MacInputNumber, {
      props: { prefix: snippet('P'), suffix: snippet('S') },
    })
    const sides = container.querySelectorAll('.slot-side')
    expect(sides.length).toBe(2)
  })

  it('focus/blur 公开方法', () => {
    const { component, container } = render(MacInputNumber, { props: {} })
    const comp = component as unknown as { focus: () => void; blur: () => void }
    const input = getInput(container)
    const focusSpy = vi.spyOn(input, 'focus')
    comp.focus()
    expect(focusSpy).toHaveBeenCalled()
  })
})
