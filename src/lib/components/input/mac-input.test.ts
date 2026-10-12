import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/svelte'
import MacInput from './mac-input.svelte'
import { snippet } from '$lib/test/utils'

afterEach(cleanup)

function getRoot(container: HTMLElement) {
  return container.querySelector<HTMLElement>('.mac-input')!
}

describe('MacInput（Svelte 版）', () => {
  it('默认属性渲染：default 变体 / text 类型', () => {
    const { container, getByRole } = render(MacInput, { props: {} })
    const input = getByRole('textbox') as HTMLInputElement
    expect(input.type).toBe('text')
    expect(input.value).toBe('')
    expect(container.querySelector('.input-container--default')).toBeTruthy()
  })

  it('属性绑定响应：placeholder / disabled / variant / label', () => {
    const { container, getByRole } = render(MacInput, {
      props: {
        placeholder: '请输入',
        disabled: true,
        variant: 'underline',
        label: '用户名',
        required: true,
      },
    })
    const input = getByRole('textbox') as HTMLInputElement
    expect(input.placeholder).toBe('请输入')
    expect(input.disabled).toBe(true)
    expect(container.querySelector('.input-container--underline')).toBeTruthy()
    expect(container.querySelector('.label')?.textContent).toBe('用户名')
    expect(container.querySelector('.label--required')).toBeTruthy()
  })

  it('输入更新 value 并派发 mac-input 事件', async () => {
    const { getByRole } = render(MacInput, { props: {} })
    const handler = vi.fn()
    document.addEventListener('mac-input', handler)
    const input = getByRole('textbox') as HTMLInputElement
    await fireEvent.input(input, { target: { value: 'hello' } })
    expect(handler).toHaveBeenCalledOnce()
    expect((handler.mock.calls[0][0] as CustomEvent).detail.value).toBe('hello')
    expect(input.value).toBe('hello')
    document.removeEventListener('mac-input', handler)
  })

  it('聚焦/失焦派发 mac-focus / mac-blur', async () => {
    const { getByRole } = render(MacInput, { props: {} })
    const focusHandler = vi.fn()
    const blurHandler = vi.fn()
    document.addEventListener('mac-focus', focusHandler)
    document.addEventListener('mac-blur', blurHandler)
    const input = getByRole('textbox')
    await fireEvent.focus(input)
    await fireEvent.blur(input)
    expect(focusHandler).toHaveBeenCalledOnce()
    expect(blurHandler).toHaveBeenCalledOnce()
    document.removeEventListener('mac-focus', focusHandler)
    document.removeEventListener('mac-blur', blurHandler)
  })

  it('clearable：有值时显示清除按钮，点击清空并派发 mac-input', async () => {
    const { container, getByRole } = render(MacInput, {
      props: { value: 'abc', clearable: true },
    })
    const handler = vi.fn()
    document.addEventListener('mac-input', handler)
    const clearBtn = container.querySelector<HTMLButtonElement>('.clear-button')!
    expect(clearBtn).toBeTruthy()
    await fireEvent.click(clearBtn)
    expect((getByRole('textbox') as HTMLInputElement).value).toBe('')
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail
    expect(detail.value).toBe('')
    document.removeEventListener('mac-input', handler)
  })

  it('value="" 时清除按钮不渲染', () => {
    const { container } = render(MacInput, { props: { clearable: true } })
    expect(container.querySelector('.clear-button')).toBeNull()
  })

  it('密码切换按钮切换输入类型', async () => {
    const { container } = render(MacInput, {
      props: { type: 'password', showPasswordToggle: true, value: 'secret' },
    })
    const input = container.querySelector<HTMLInputElement>('.input')!
    expect(input.type).toBe('password')
    await fireEvent.click(container.querySelector('.password-toggle')!)
    expect(input.type).toBe('text')
  })

  it('字符计数器与错误/警告状态（与 Lit 一致：等于上限为 warning）', () => {
    const { container } = render(MacInput, {
      props: { value: 'abcdefghij', showCharCounter: true, maxLength: 10 },
    })
    const counter = container.querySelector<HTMLElement>('.char-counter')!
    expect(counter.textContent!.trim()).toBe('10/10')
    // Lit 版 isOverLimit 为严格大于，等于上限时是 warning
    expect(counter.className).toContain('char-counter--warning')
  })

  it('超过上限时计数器为 error 状态', () => {
    const { container } = render(MacInput, {
      props: { value: 'abcdefghijkl', showCharCounter: true, maxLength: 10 },
    })
    const counter = container.querySelector<HTMLElement>('.char-counter')!
    expect(counter.className).toContain('char-counter--error')
  })

  it('error / success 状态映射容器类与辅助文本颜色', () => {
    const { container } = render(MacInput, {
      props: { error: true, helperText: '出错了' },
    })
    expect(container.querySelector('.input-container--error')).toBeTruthy()
    expect(container.querySelector('.helper-text--error')?.textContent).toBe('出错了')
  })

  it('渲染 prefix / suffix snippet', () => {
    const { container } = render(MacInput, {
      props: { prefix: snippet('P'), suffix: snippet('S') },
    })
    const sides = container.querySelectorAll('.slot-side')
    expect(sides.length).toBe(2)
    expect(sides[0].textContent).toBe('P')
    expect(sides[1].textContent).toBe('S')
  })

  it('loading 状态显示加载图标', () => {
    const { container } = render(MacInput, { props: { loading: true } })
    expect(container.querySelector('.loading-spinner')).toBeTruthy()
    expect(container.querySelector('.input-container--loading')).toBeTruthy()
  })

  it('focus/blur 公开方法操作原生输入框', () => {
    const { component, getByRole } = render(MacInput, { props: {} })
    const comp = component as unknown as { focus: () => void; blur: () => void }
    const input = getByRole('textbox') as HTMLInputElement
    const focusSpy = vi.spyOn(input, 'focus')
    const blurSpy = vi.spyOn(input, 'blur')
    comp.focus()
    comp.blur()
    expect(focusSpy).toHaveBeenCalled()
    expect(blurSpy).toHaveBeenCalled()
  })

  it('data-size / data-theme 跟随属性', () => {
    const { container } = render(MacInput, { props: { size: 'sm', theme: 'dark' } })
    const root = getRoot(container)
    expect(root.dataset.size).toBe('sm')
    expect(root.dataset.theme).toBe('dark')
  })
})
