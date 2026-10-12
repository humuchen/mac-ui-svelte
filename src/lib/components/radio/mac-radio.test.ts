import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/svelte'
import MacRadio from './mac-radio.svelte'
import MacRadioGroup from './mac-radio-group.svelte'
import { snippet } from '$lib/test/utils'

afterEach(cleanup)

describe('MacRadio（Svelte 版）', () => {
  it('默认属性渲染：未选中 / role=radio', () => {
    const { getByRole } = render(MacRadio, { props: { label: '选项' } })
    const radio = getByRole('radio')
    expect(radio.getAttribute('aria-checked')).toBe('false')
    expect(radio.querySelector('.label')?.textContent).toBe('选项')
  })

  it('checked=true 渲染选中状态', () => {
    const { getByRole } = render(MacRadio, { props: { checked: true, label: 'A' } })
    const radio = getByRole('radio')
    expect(radio.className).toContain('radio--checked')
    expect(radio.getAttribute('aria-checked')).toBe('true')
  })

  it('点击选中并派发 mac-change', async () => {
    const { getByRole } = render(MacRadio, { props: { value: 'a', label: 'A' } })
    const handler = vi.fn()
    document.addEventListener('mac-change', handler)
    await fireEvent.click(getByRole('radio'))
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail
    expect(detail).toEqual({ value: 'a', checked: true })
    document.removeEventListener('mac-change', handler)
  })

  it('已选中时点击不再派发事件', async () => {
    const { getByRole } = render(MacRadio, { props: { checked: true, label: 'A' } })
    const handler = vi.fn()
    document.addEventListener('mac-change', handler)
    await fireEvent.click(getByRole('radio'))
    expect(handler).not.toHaveBeenCalled()
    document.removeEventListener('mac-change', handler)
  })

  it('disabled 状态点击无效', async () => {
    const { getByRole } = render(MacRadio, { props: { disabled: true, label: 'A' } })
    const handler = vi.fn()
    document.addEventListener('mac-change', handler)
    await fireEvent.click(getByRole('radio'))
    expect(handler).not.toHaveBeenCalled()
    expect(getByRole('radio').className).toContain('radio--disabled')
    document.removeEventListener('mac-change', handler)
  })

  it('defaultChecked 非受控初始选中', () => {
    const { getByRole } = render(MacRadio, { props: { defaultChecked: true, label: 'A' } })
    expect(getByRole('radio').className).toContain('radio--checked')
  })
})

describe('MacRadioGroup（Svelte 版）', () => {
  it('options 简化用法渲染单选列表', () => {
    const { container } = render(MacRadioGroup, {
      props: {
        options: [
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B' },
        ],
      },
    })
    expect(
      container.querySelector<HTMLElement>('.mac-radio-group')!.querySelectorAll('.mac-radio')
        .length,
    ).toBe(2)
  })

  it('defaultValue：点击切换选中并派发 mac-change', async () => {
    const { container } = render(MacRadioGroup, {
      props: {
        defaultValue: 'a',
        options: [
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B' },
        ],
      },
    })
    const handler = vi.fn()
    document.addEventListener('mac-change', handler)
    const radios = container.querySelectorAll<HTMLElement>('.mac-radio')
    await fireEvent.click(radios[1])
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail
    expect(detail.value).toBe('b')
    // 单选互斥：A 取消选中，B 选中
    expect(radios[0].className).not.toContain('radio--checked')
    expect(radios[1].className).toContain('radio--checked')
    document.removeEventListener('mac-change', handler)
  })

  it('group disabled 联动子单选', async () => {
    const { container } = render(MacRadioGroup, {
      props: { disabled: true, options: [{ value: 'a', label: 'A' }] },
    })
    const handler = vi.fn()
    document.addEventListener('mac-change', handler)
    await fireEvent.click(container.querySelector('.mac-radio')!)
    expect(handler).not.toHaveBeenCalled()
    document.removeEventListener('mac-change', handler)
  })

  it('direction=vertical 布局类', () => {
    const { container } = render(MacRadioGroup, {
      props: { direction: 'vertical', children: snippet('') },
    })
    expect(container.querySelector('.group--vertical')).toBeTruthy()
  })

  it('渲染 children snippet', () => {
    const { container } = render(MacRadioGroup, {
      props: { children: snippet('自定义') },
    })
    expect(container.textContent).toContain('自定义')
  })
})
