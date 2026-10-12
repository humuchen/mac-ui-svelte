import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/svelte'
import MacCheckbox from './mac-checkbox.svelte'
import MacCheckboxGroup from './mac-checkbox-group.svelte'
import { snippet } from '$lib/test/utils'

afterEach(cleanup)

describe('MacCheckbox（Svelte 版）', () => {
  it('默认属性渲染：未选中 / role=checkbox', () => {
    const { getByRole } = render(MacCheckbox, { props: { label: '选项' } })
    const cb = getByRole('checkbox')
    expect(cb.getAttribute('aria-checked')).toBe('false')
    expect(cb.querySelector('.label')?.textContent).toBe('选项')
    expect(cb.querySelector('.checkbox--checked')).toBeNull()
  })

  it('checked=true 渲染选中状态', () => {
    const { getByRole } = render(MacCheckbox, { props: { checked: true, label: 'A' } })
    expect(getByRole('checkbox').className).toContain('checkbox--checked')
    expect(getByRole('checkbox').getAttribute('aria-checked')).toBe('true')
  })

  it('indeterminate 半选状态（aria-checked=mixed）', () => {
    const { getByRole } = render(MacCheckbox, {
      props: { indeterminate: true, label: 'A' },
    })
    const cb = getByRole('checkbox')
    expect(cb.className).toContain('checkbox--indeterminate')
    expect(cb.getAttribute('aria-checked')).toBe('mixed')
  })

  it('点击切换 checked 并派发 mac-change', async () => {
    const { getByRole } = render(MacCheckbox, { props: { value: 'a', label: 'A' } })
    const handler = vi.fn()
    document.addEventListener('mac-change', handler)
    const cb = getByRole('checkbox')
    await fireEvent.click(cb)
    expect(cb.className).toContain('checkbox--checked')
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail
    expect(detail).toEqual({ value: 'a', checked: true })
    document.removeEventListener('mac-change', handler)
  })

  it('disabled 状态点击无效', async () => {
    const { getByRole } = render(MacCheckbox, { props: { disabled: true, label: 'A' } })
    const handler = vi.fn()
    document.addEventListener('mac-change', handler)
    await fireEvent.click(getByRole('checkbox'))
    expect(handler).not.toHaveBeenCalled()
    expect(getByRole('checkbox').className).toContain('checkbox--disabled')
    document.removeEventListener('mac-change', handler)
  })

  it('defaultChecked 非受控初始选中', () => {
    const { getByRole } = render(MacCheckbox, {
      props: { defaultChecked: true, label: 'A' },
    })
    expect(getByRole('checkbox').className).toContain('checkbox--checked')
  })

  it('键盘空格键触发切换', async () => {
    const { getByRole } = render(MacCheckbox, { props: { value: 'a', label: 'A' } })
    const handler = vi.fn()
    document.addEventListener('mac-change', handler)
    await fireEvent.keyDown(getByRole('checkbox'), { key: ' ' })
    expect(handler).toHaveBeenCalledOnce()
    document.removeEventListener('mac-change', handler)
  })
})

describe('MacCheckboxGroup（Svelte 版）', () => {
  it('options 简化用法渲染复选框列表', () => {
    const { container } = render(MacCheckboxGroup, {
      props: {
        options: [
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B' },
        ],
      },
    })
    const group = container.querySelector<HTMLElement>('.mac-checkbox-group')!
    expect(group.querySelectorAll('.mac-checkbox').length).toBe(2)
  })

  it('defaultValue 非受控模式：点击切换并派发 mac-change', async () => {
    const { container, getByRole } = render(MacCheckboxGroup, {
      props: {
        defaultValue: ['a'],
        options: [
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B' },
        ],
      },
    })
    const handler = vi.fn()
    document.addEventListener('mac-change', handler)
    // B 未选中 → 点击选中
    const checkboxes = container.querySelectorAll<HTMLElement>('.mac-checkbox')
    await fireEvent.click(checkboxes[1])
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail
    expect(detail.value).toEqual(['a', 'b'])
    expect(getByRole('group')).toBeTruthy()
    document.removeEventListener('mac-change', handler)
  })

  it('max 限制最大可选数量', async () => {
    const { container } = render(MacCheckboxGroup, {
      props: {
        defaultValue: ['a'],
        max: 1,
        options: [
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B' },
        ],
      },
    })
    const handler = vi.fn()
    document.addEventListener('mac-change', handler)
    const checkboxes = container.querySelectorAll<HTMLElement>('.mac-checkbox')
    await fireEvent.click(checkboxes[1])
    // 已达 max，不再派发
    expect(handler).not.toHaveBeenCalled()
    document.removeEventListener('mac-change', handler)
  })

  it('group disabled 联动子复选框', async () => {
    const { container } = render(MacCheckboxGroup, {
      props: {
        disabled: true,
        options: [{ value: 'a', label: 'A' }],
      },
    })
    const handler = vi.fn()
    document.addEventListener('mac-change', handler)
    await fireEvent.click(container.querySelector('.mac-checkbox')!)
    expect(handler).not.toHaveBeenCalled()
    document.removeEventListener('mac-change', handler)
  })

  it('direction=vertical 布局类', () => {
    const { container } = render(MacCheckboxGroup, {
      props: { direction: 'vertical', children: snippet('') },
    })
    expect(container.querySelector('.group--vertical')).toBeTruthy()
  })
})
