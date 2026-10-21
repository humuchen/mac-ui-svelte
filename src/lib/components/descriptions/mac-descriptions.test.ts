import { describe, expect, it, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/svelte'
import MacDescriptions from './mac-descriptions.svelte'
import { snippet } from '$lib/test/utils'

afterEach(cleanup)

const items = [
  { label: '名称', value: 'MacBook Pro' },
  { label: '价格', value: '¥19999' },
  { label: '颜色', value: '深空灰' },
]

function getRoot(container: HTMLElement) {
  return container.querySelector<HTMLElement>('.mac-descriptions')!
}

describe('MacDescriptions（Svelte 版）', () => {
  it('默认属性渲染：left 布局 / 无边框 / 内联 label: value', () => {
    const { container } = render(MacDescriptions, { props: { items } })
    const root = getRoot(container)
    expect(root.querySelector('.left-list')).toBeTruthy()
    const firstLabel = root.querySelector<HTMLElement>('.left-label')!
    expect(firstLabel.textContent).toBe('名称')
    expect(root.querySelector('.left-separator')?.textContent).toBe(':')
    expect(root.querySelector<HTMLElement>('.left-value')!.textContent).toBe('MacBook Pro')
  })

  it('left 无边框布局按 column 分列渲染', () => {
    const { container } = render(MacDescriptions, {
      props: { items, column: 2 },
    })
    const root = getRoot(container)
    // 3 个条目按 2 列分块 → 2 行
    const rows = root.querySelectorAll('.left-row')
    expect(rows.length).toBe(2)
    // 第一行 2 个条目，第二行 1 个
    expect(rows[0].querySelectorAll('.left-item').length).toBe(2)
    expect(rows[1].querySelectorAll('.left-item').length).toBe(1)
    // 行容器携带列数网格
    expect(rows[0].getAttribute('style')).toContain('repeat(2')
  })

  it('left 布局 span 跨列生效', () => {
    const { container } = render(MacDescriptions, {
      props: { items: [{ label: 'A', value: '1', span: 2 }, { label: 'B', value: '2' }], column: 2 },
    })
    // A 占 2 列独占一行，B 在第二行
    const rows = container.querySelectorAll('.left-row')
    expect(rows.length).toBe(2)
    expect(rows[0].querySelector('.left-item')?.getAttribute('style')).toContain('span 2')
  })

  it('属性绑定响应：labelPlacement=top 非边框网格布局', () => {
    const { container } = render(MacDescriptions, {
      props: { items, labelPlacement: 'top', column: 2 },
    })
    const root = getRoot(container)
    expect(root.querySelector('.top-grid')).toBeTruthy()
    expect(root.querySelectorAll('.top-item').length).toBe(3)
  })

  it('bordered + left 渲染表格布局', () => {
    const { container } = render(MacDescriptions, { props: { items, bordered: true } })
    const root = getRoot(container)
    expect(root.querySelector('.table')).toBeTruthy()
    expect(root.querySelectorAll('.label-cell').length).toBe(3)
    expect(root.querySelectorAll('.value-cell').length).toBe(3)
  })

  it('bordered + top 渲染上下两行表格', () => {
    const { container } = render(MacDescriptions, {
      props: { items, labelPlacement: 'top', bordered: true },
    })
    const root = getRoot(container)
    expect(root.querySelector('.top-table')).toBeTruthy()
    expect(root.querySelectorAll('.top-table-label').length).toBe(3)
    expect(root.querySelectorAll('.top-table-value').length).toBe(3)
  })

  it('span 跨列生效', () => {
    const { container } = render(MacDescriptions, {
      props: { items: [{ label: 'A', value: '1', span: 2 }, { label: 'B', value: '2' }], bordered: true },
    })
    const valueCell = container.querySelector<HTMLElement>('.value-cell')!
    expect(valueCell.getAttribute('colspan')).toBe('3')
  })

  it('title 与 extra 渲染头部', () => {
    const { container } = render(MacDescriptions, {
      props: { items, title: '设备信息', extra: snippet('<button>操作</button>') },
    })
    expect(container.querySelector('.header')).toBeTruthy()
    expect(container.querySelector<HTMLElement>('.title')!.textContent).toBe('设备信息')
    expect(container.querySelector('.extra')?.querySelector('button')).toBeTruthy()
  })

  it('无 title/extra 时不渲染头部', () => {
    const { container } = render(MacDescriptions, { props: { items } })
    expect(container.querySelector('.header')).toBeNull()
  })

  it('自定义分隔符', () => {
    const { container } = render(MacDescriptions, {
      props: { items, separator: ' - ' },
    })
    expect(container.querySelector<HTMLElement>('.left-separator')!.textContent).toBe(' - ')
  })

  it('labelAlign / size 映射到 data 属性', () => {
    const { container } = render(MacDescriptions, {
      props: { items, labelAlign: 'center', size: 'sm' },
    })
    const root = getRoot(container)
    expect(root.dataset.labelAlign).toBe('center')
    expect(root.dataset.size).toBe('sm')
  })
})
