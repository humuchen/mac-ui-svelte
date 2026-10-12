import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/svelte'
import MacSelect from './mac-select.svelte'

afterEach(cleanup)

const options = [
  { value: 'apple', label: '苹果' },
  { value: 'banana', label: '香蕉' },
  { value: 'cherry', label: '樱桃', disabled: true },
]

const flush = () => new Promise((r) => setTimeout(r, 0))

function getRoot(container: HTMLElement) {
  return container.querySelector<HTMLElement>('.mac-select')!
}

describe('MacSelect（Svelte 版）', () => {
  it('默认属性渲染：占位符显示 / 触发器 combobox 角色', () => {
    const { container } = render(MacSelect, { props: { options } })
    const trigger = container.querySelector<HTMLElement>('.select-trigger')!
    expect(trigger.getAttribute('role')).toBe('combobox')
    expect(trigger.querySelector('.select-placeholder')?.textContent).toBe('Select an option')
  })

  it('value 属性显示选中项 label', () => {
    const { container } = render(MacSelect, { props: { options, value: 'banana' } })
    expect(container.querySelector('.select-value-text')?.textContent).toBe('香蕉')
  })

  it('点击触发器打开下拉菜单并渲染选项', async () => {
    const { container } = render(MacSelect, { props: { options } })
    await fireEvent.click(container.querySelector('.select-trigger')!)
    await flush()
    const dropdown = container.querySelector<HTMLElement>('.select-dropdown')!
    expect(dropdown.getAttribute('role')).toBe('listbox')
    expect(dropdown.querySelectorAll('.select-option').length).toBe(3)
  })

  it('点击选项更新 value 并派发 mac-change 且关闭菜单', async () => {
    const { container } = render(MacSelect, { props: { options } })
    const handler = vi.fn()
    document.addEventListener('mac-change', handler)
    await fireEvent.click(container.querySelector('.select-trigger')!)
    await flush()
    const option = container.querySelector<HTMLElement>('[data-value="apple"]')!
    await fireEvent.click(option)
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail
    expect(detail.value).toBe('apple')
    expect(container.querySelector('.select-dropdown')).toBeNull()
    document.removeEventListener('mac-change', handler)
  })

  it('disabled 选项点击无效', async () => {
    const { container } = render(MacSelect, { props: { options } })
    await fireEvent.click(container.querySelector('.select-trigger')!)
    await flush()
    const handler = vi.fn()
    document.addEventListener('mac-change', handler)
    await fireEvent.click(container.querySelector('[data-value="cherry"]')!)
    expect(handler).not.toHaveBeenCalled()
    document.removeEventListener('mac-change', handler)
  })

  it('disabled 属性阻止打开', async () => {
    const { container } = render(MacSelect, { props: { options, disabled: true } })
    await fireEvent.click(container.querySelector('.select-trigger')!)
    await flush()
    expect(container.querySelector('.select-dropdown')).toBeNull()
  })

  it('多选模式：点击选项切换选中并派发数组值', async () => {
    const { container } = render(MacSelect, { props: { options, multiple: true } })
    const handler = vi.fn()
    document.addEventListener('mac-change', handler)
    await fireEvent.click(container.querySelector('.select-trigger')!)
    await flush()
    await fireEvent.click(container.querySelector('[data-value="apple"]')!)
    let detail = (handler.mock.calls[0][0] as CustomEvent).detail
    expect(detail.value).toEqual(['apple'])
    await fireEvent.click(container.querySelector('[data-value="banana"]')!)
    detail = (handler.mock.calls[1][0] as CustomEvent).detail
    expect(detail.value).toEqual(['apple', 'banana'])
    // 与 Lit 一致：多选显示标签列表
    expect(container.querySelectorAll('.select-tag').length).toBe(2)
    document.removeEventListener('mac-change', handler)
  })

  it('多选标签移除', async () => {
    const { container } = render(MacSelect, {
      props: { options, multiple: true, value: ['apple', 'banana'] },
    })
    const handler = vi.fn()
    document.addEventListener('mac-change', handler)
    const removeBtn = container.querySelector<HTMLButtonElement>('.select-tag-remove')!
    await fireEvent.click(removeBtn)
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail
    expect(detail.value).toEqual(['banana'])
    document.removeEventListener('mac-change', handler)
  })

  it('clearable 清除按钮', async () => {
    const { container } = render(MacSelect, {
      props: { options, value: 'apple', clearable: true },
    })
    const handler = vi.fn()
    document.addEventListener('mac-change', handler)
    await fireEvent.click(container.querySelector('.select-clear')!)
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail
    expect(detail.value).toBe('')
    document.removeEventListener('mac-change', handler)
  })

  it('searchable 搜索过滤选项', async () => {
    const { container } = render(MacSelect, {
      props: { options, searchable: true },
    })
    await fireEvent.click(container.querySelector('.select-trigger')!)
    await flush()
    const input = container.querySelector<HTMLInputElement>('.select-search-input')!
    await fireEvent.input(input, { target: { value: '苹' } })
    await flush()
    const opts = container.querySelectorAll('.select-option')
    expect(opts.length).toBe(1)
    expect(opts[0].getAttribute('data-value')).toBe('apple')
  })

  it('groups 分组渲染', async () => {
    const { container } = render(MacSelect, {
      props: {
        groups: [
          { label: '水果', options: [{ value: 'apple', label: '苹果' }] },
          { label: '蔬菜', options: [{ value: 'carrot', label: '胡萝卜' }] },
        ],
      },
    })
    await fireEvent.click(container.querySelector('.select-trigger')!)
    await flush()
    expect(container.querySelectorAll('.select-group-label').length).toBe(2)
    expect(container.querySelectorAll('.select-option').length).toBe(2)
  })

  it('键盘导航：ArrowDown 聚焦选项，Enter 选中', async () => {
    const { container } = render(MacSelect, { props: { options } })
    const trigger = container.querySelector<HTMLElement>('.select-trigger')!
    const handler = vi.fn()
    document.addEventListener('mac-change', handler)
    await fireEvent.click(trigger)
    await flush()
    await fireEvent.keyDown(trigger, { key: 'ArrowDown' })
    await flush()
    expect(container.querySelector('.select-option.focused')).toBeTruthy()
    await fireEvent.keyDown(trigger, { key: 'Enter' })
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail
    expect(detail.value).toBe('apple')
    document.removeEventListener('mac-change', handler)
  })

  it('Escape 关闭菜单', async () => {
    const { container } = render(MacSelect, { props: { options } })
    await fireEvent.click(container.querySelector('.select-trigger')!)
    await flush()
    await fireEvent.keyDown(container.querySelector('.select-trigger')!, { key: 'Escape' })
    expect(container.querySelector('.select-dropdown')).toBeNull()
  })

  it('点击外部关闭菜单', async () => {
    const { container } = render(MacSelect, { props: { options } })
    await fireEvent.click(container.querySelector('.select-trigger')!)
    await flush()
    await fireEvent.click(document.body)
    expect(container.querySelector('.select-dropdown')).toBeNull()
  })

  it('loading 状态显示加载指示器', async () => {
    const { container } = render(MacSelect, { props: { options, loading: true } })
    await fireEvent.click(container.querySelector('.select-trigger')!)
    await flush()
    expect(container.querySelector('.loading-spinner')).toBeTruthy()
  })

  it('空数据显示空文本', async () => {
    const { container } = render(MacSelect, {
      props: { options: [], emptyText: '暂无选项' },
    })
    await fireEvent.click(container.querySelector('.select-trigger')!)
    await flush()
    expect(container.querySelector('.select-empty')?.textContent).toBe('暂无选项')
  })

  it('label / helperText / error 状态渲染', () => {
    const { container } = render(MacSelect, {
      props: { options, label: '选择', required: true, helperText: '必填', error: true },
    })
    expect(container.querySelector('.select-label--required')).toBeTruthy()
    expect(container.querySelector('.select-helper-text--error')?.textContent).toBe('必填')
    expect(getRoot(container).querySelector('.select-trigger--error')).toBeTruthy()
  })

  it('size / theme 映射 data 属性', () => {
    const { container } = render(MacSelect, {
      props: { options, size: 'sm', theme: 'dark' },
    })
    const root = getRoot(container)
    expect(root.dataset.size).toBe('sm')
    expect(root.dataset.theme).toBe('dark')
  })
})
