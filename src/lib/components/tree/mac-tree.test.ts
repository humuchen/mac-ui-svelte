import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/svelte'
import MacTree from './mac-tree.svelte'

afterEach(cleanup)

const data = [
  {
    key: '1',
    label: '一级 1',
    children: [
      { key: '1-1', label: '二级 1-1' },
      { key: '1-2', label: '二级 1-2' },
    ],
  },
  { key: '2', label: '一级 2' },
]

function getRoot(container: HTMLElement) {
  return container.querySelector<HTMLElement>('.mac-tree')!
}

describe('MacTree（Svelte 版）', () => {
  it('默认属性渲染：渲染根节点，子节点默认收起', () => {
    const { container } = render(MacTree, { props: { data } })
    const root = getRoot(container)
    expect(root.querySelectorAll('.tree-node').length).toBe(2)
    expect(root.querySelector('.tree-children')).toBeNull()
  })

  it('defaultExpandedKeys 展开子节点', () => {
    const { container } = render(MacTree, {
      props: { data, defaultExpandedKeys: ['1'] },
    })
    const root = getRoot(container)
    expect(root.querySelectorAll('.tree-node').length).toBe(4)
    expect(root.querySelector('.tree-children')).toBeTruthy()
  })

  it('defaultExpandAll 展开全部', () => {
    const { container } = render(MacTree, { props: { data, defaultExpandAll: true } })
    expect(getRoot(container).querySelectorAll('.tree-node').length).toBe(4)
  })

  it('空数据显示空文本', () => {
    const { container } = render(MacTree, { props: { data: [], emptyText: '暂无数据' } })
    expect(container.querySelector('.tree-empty')?.textContent).toBe('暂无数据')
  })

  it('点击展开/收起并派发 mac-expand', async () => {
    const { container } = render(MacTree, { props: { data } })
    const handler = vi.fn()
    document.addEventListener('mac-expand', handler)
    const toggle = container.querySelector<HTMLButtonElement>('.tree-toggle')!
    await fireEvent.click(toggle)
    expect(getRoot(container).querySelectorAll('.tree-node').length).toBe(4)
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail
    expect(detail.key).toBe('1')
    expect(detail.expanded).toBe(true)
    expect(detail.expandedKeys).toEqual(['1'])
    document.removeEventListener('mac-expand', handler)
  })

  it('点击选中节点并派发 mac-select', async () => {
    const { container } = render(MacTree, { props: { data } })
    const handler = vi.fn()
    document.addEventListener('mac-select', handler)
    const node = container.querySelector<HTMLElement>('.tree-node')!
    await fireEvent.click(node)
    expect(node.className).toContain('tree-node--selected')
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail
    expect(detail.selectedKeys).toEqual(['1'])
    document.removeEventListener('mac-select', handler)
  })

  it('disabled 节点不可选中', async () => {
    const { container } = render(MacTree, {
      props: { data: [{ key: 'x', label: '禁用', disabled: true }] },
    })
    const handler = vi.fn()
    document.addEventListener('mac-select', handler)
    await fireEvent.click(container.querySelector('.tree-node')!)
    expect(handler).not.toHaveBeenCalled()
    expect(container.querySelector('.tree-node--disabled')).toBeTruthy()
    document.removeEventListener('mac-select', handler)
  })

  it('checkable 模式：勾选联动子节点与父节点', async () => {
    const { container } = render(MacTree, {
      props: { data, checkable: true, defaultExpandedKeys: ['1'] },
    })
    const handler = vi.fn()
    document.addEventListener('mac-check', handler)
    // 勾选子节点 1-1
    const checkboxes = container.querySelectorAll<HTMLElement>('.tree-checkbox')
    await fireEvent.click(checkboxes[1])
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail
    // 与 Lit 一致：部分勾选时父节点不进 checkedKeys（半选表达）
    expect(detail.checkedKeys).toEqual(['1-1'])
    // 父节点应为半选
    expect(checkboxes[0].className).toContain('tree-checkbox--half')
    document.removeEventListener('mac-check', handler)
  })

  it('checkable + blockNode：整行点击切换勾选', async () => {
    const { container } = render(MacTree, {
      props: { data: [{ key: 'a', label: 'A' }], checkable: true },
    })
    const handler = vi.fn()
    document.addEventListener('mac-check', handler)
    await fireEvent.click(container.querySelector('.tree-node')!)
    expect(handler).toHaveBeenCalledOnce()
    document.removeEventListener('mac-check', handler)
  })

  it('showLine 渲染连接线样式类', () => {
    const { container } = render(MacTree, { props: { data, showLine: true } })
    expect(container.querySelector('.tree-line')).toBeTruthy()
  })

  it('multiple 多选模式', async () => {
    const { container } = render(MacTree, { props: { data, multiple: true } })
    const handler = vi.fn()
    document.addEventListener('mac-select', handler)
    const nodes = container.querySelectorAll<HTMLElement>('.tree-node')
    await fireEvent.click(nodes[0])
    await fireEvent.click(nodes[1])
    const detail = (handler.mock.calls[1][0] as CustomEvent).detail
    expect(detail.selectedKeys).toEqual(['1', '2'])
    document.removeEventListener('mac-select', handler)
  })
})
