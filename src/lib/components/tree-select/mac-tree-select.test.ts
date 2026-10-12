import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/svelte'
import MacTreeSelect from './mac-tree-select.svelte'

afterEach(cleanup)

const options = [
  {
    value: 'fruit',
    label: '水果',
    children: [
      { value: 'apple', label: '苹果' },
      { value: 'banana', label: '香蕉' },
    ],
  },
  { value: 'carrot', label: '胡萝卜' },
]

const flush = () => new Promise((r) => setTimeout(r, 0))

function getRoot(container: HTMLElement) {
  return container.querySelector<HTMLElement>('.mac-tree-select')!
}

describe('MacTreeSelect（Svelte 版）', () => {
  it('默认属性渲染：占位符显示 / combobox 角色', () => {
    const { container } = render(MacTreeSelect, { props: { options } })
    const trigger = container.querySelector<HTMLElement>('.tree-trigger')!
    expect(trigger.getAttribute('role')).toBe('combobox')
    expect(trigger.querySelector('.tree-placeholder')?.textContent).toBe('Select')
  })

  it('value 属性显示选中项 label', () => {
    const { container } = render(MacTreeSelect, { props: { options, value: 'apple' } })
    expect(container.querySelector('.tree-value-text')?.textContent).toBe('苹果')
  })

  it('点击触发器打开下拉面板', async () => {
    const { container } = render(MacTreeSelect, { props: { options } })
    await fireEvent.click(container.querySelector('.tree-trigger')!)
    await flush()
    expect(container.querySelector('.tree-dropdown.open')).toBeTruthy()
    expect(container.querySelectorAll('.tree-node').length).toBe(2)
  })

  it('展开节点显示子节点', async () => {
    const { container } = render(MacTreeSelect, { props: { options } })
    await fireEvent.click(container.querySelector('.tree-trigger')!)
    await flush()
    await fireEvent.click(container.querySelector('.tree-toggle')!)
    await flush()
    expect(container.querySelectorAll('.tree-node').length).toBe(4)
  })

  it('点击叶子节点选中并派发 mac-change 且关闭面板', async () => {
    const { container } = render(MacTreeSelect, { props: { options } })
    await fireEvent.click(container.querySelector('.tree-trigger')!)
    await flush()
    await fireEvent.click(container.querySelector('.tree-toggle')!)
    await flush()
    const handler = vi.fn()
    document.addEventListener('mac-change', handler)
    const node = container.querySelectorAll('.tree-node')[1]! // apple
    await fireEvent.click(node)
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail
    expect(detail.value).toBe('apple')
    expect(container.querySelector('.tree-dropdown.open')).toBeNull()
    document.removeEventListener('mac-change', handler)
  })

  it('disabled 属性阻止打开', async () => {
    const { container } = render(MacTreeSelect, { props: { options, disabled: true } })
    await fireEvent.click(container.querySelector('.tree-trigger')!)
    await flush()
    expect(container.querySelector('.tree-dropdown.open')).toBeNull()
  })

  it('多选模式：点击节点切换选中（数组值）', async () => {
    const { container } = render(MacTreeSelect, {
      props: { options, multiple: true, defaultExpandAll: true },
    })
    await fireEvent.click(container.querySelector('.tree-trigger')!)
    await flush()
    const handler = vi.fn()
    document.addEventListener('mac-change', handler)
    const nodes = container.querySelectorAll<HTMLElement>('.tree-node')
    await fireEvent.click(nodes[1]) // apple
    let detail = (handler.mock.calls[0][0] as CustomEvent).detail
    expect(detail.value).toEqual(['apple'])
    await fireEvent.click(nodes[3]) // carrot
    detail = (handler.mock.calls[1][0] as CustomEvent).detail
    expect(detail.value).toEqual(['apple', 'carrot'])
    // 显示标签
    expect(container.querySelectorAll('.tree-tag').length).toBe(2)
    document.removeEventListener('mac-change', handler)
  })

  it('checkable 级联勾选', async () => {
    const { container } = render(MacTreeSelect, {
      props: { options, multiple: true, checkable: true, defaultExpandAll: true },
    })
    await fireEvent.click(container.querySelector('.tree-trigger')!)
    await flush()
    const handler = vi.fn()
    document.addEventListener('mac-change', handler)
    // 勾选父节点「水果」→ 级联选中所有子节点
    const checkbox = container.querySelector<HTMLElement>('.tree-checkbox')!
    await fireEvent.click(checkbox)
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail
    expect(detail.value).toEqual(['fruit', 'apple', 'banana'])
    document.removeEventListener('mac-change', handler)
  })

  it('搜索过滤选项并自动展开', async () => {
    const { container } = render(MacTreeSelect, { props: { options, searchable: true } })
    await fireEvent.click(container.querySelector('.tree-trigger')!)
    await flush()
    const input = container.querySelector<HTMLInputElement>('.tree-search-input')!
    await fireEvent.input(input, { target: { value: '苹果' } })
    await flush()
    const nodes = container.querySelectorAll('.tree-node')
    // 「水果」+「苹果」
    expect(nodes.length).toBe(2)
    expect(nodes[1].textContent).toContain('苹果')
  })

  it('clearable 清除按钮', async () => {
    const { container } = render(MacTreeSelect, {
      props: { options, value: 'apple', clearable: true },
    })
    const handler = vi.fn()
    document.addEventListener('mac-change', handler)
    await fireEvent.click(container.querySelector('.tree-clear')!)
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail
    expect(detail.value).toBe('')
    document.removeEventListener('mac-change', handler)
  })

  it('panel 面板模式：无触发器，面板常显', () => {
    const { container } = render(MacTreeSelect, {
      props: { options, panel: true, defaultExpandAll: true },
    })
    expect(container.querySelector('.tree-trigger')).toBeNull()
    expect(container.querySelector('.tree-dropdown--inline')).toBeTruthy()
    expect(container.querySelectorAll('.tree-node').length).toBe(4)
  })

  it('Escape 关闭面板', async () => {
    const { container } = render(MacTreeSelect, { props: { options } })
    await fireEvent.click(container.querySelector('.tree-trigger')!)
    await flush()
    await fireEvent.keyDown(container.querySelector('.tree-trigger')!, { key: 'Escape' })
    expect(container.querySelector('.tree-dropdown.open')).toBeNull()
  })

  it('size / theme 映射 data 属性', () => {
    const { container } = render(MacTreeSelect, {
      props: { options, size: 'lg', theme: 'dark' },
    })
    const root = getRoot(container)
    expect(root.dataset.size).toBe('lg')
    expect(root.dataset.theme).toBe('dark')
  })
})
