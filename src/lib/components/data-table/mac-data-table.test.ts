import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/svelte'
import MacDataTable from './mac-data-table.svelte'
import { snippet } from '$lib/test/utils'

afterEach(cleanup)

const columns = [
  { key: 'name', title: '名称' },
  { key: 'age', title: '年龄', sortable: true, sorter: (a: any, b: any) => a.age - b.age },
]

const data = [
  { name: '张三', age: 30 },
  { name: '李四', age: 25 },
  { name: '王五', age: 35 },
]

const flush = () => new Promise((r) => setTimeout(r, 0))

describe('MacDataTable（Svelte 版）', () => {
  it('默认属性渲染：表头与数据行', () => {
    const { container } = render(MacDataTable, { props: { columns, data } })
    expect(container.querySelectorAll('thead th').length).toBe(2)
    expect(container.querySelectorAll('tbody tr').length).toBe(3)
    expect(container.textContent).toContain('张三')
  })

  it('render 函数自定义单元格（HTML）', () => {
    const cols = [
      {
        key: 'name',
        title: '名称',
        render: (row: any) => `<b>${row.name}</b>`,
      },
    ]
    const { container } = render(MacDataTable, { props: { columns: cols, data } })
    expect(container.querySelector('tbody b')).toBeTruthy()
  })

  it('排序：点击表头切换 asc/desc/取消并派发事件', async () => {
    const { container } = render(MacDataTable, { props: { columns, data } })
    const th = container.querySelector('th.sortable')!
    const sortHandler = vi.fn()
    const changeHandler = vi.fn()
    document.addEventListener('mac-data-table-sort', sortHandler)
    document.addEventListener('mac-data-table-change', changeHandler)

    await fireEvent.click(th)
    let rows = container.querySelectorAll('tbody tr')
    expect(rows[0].textContent).toContain('李四') // 25 最小
    let detail = (sortHandler.mock.calls[0][0] as CustomEvent).detail
    expect(detail.sorter.order).toBe('asc')

    await fireEvent.click(th)
    rows = container.querySelectorAll('tbody tr')
    expect(rows[0].textContent).toContain('王五') // 35 最大
    detail = (sortHandler.mock.calls[1][0] as CustomEvent).detail
    expect(detail.sorter.order).toBe('desc')

    await fireEvent.click(th)
    rows = container.querySelectorAll('tbody tr')
    expect(rows[0].textContent).toContain('张三') // 恢复原始顺序
    detail = (sortHandler.mock.calls[2][0] as CustomEvent).detail
    expect(detail.sorter).toBeNull()
    document.removeEventListener('mac-data-table-sort', sortHandler)
    document.removeEventListener('mac-data-table-change', changeHandler)
  })

  it('defaultSortOrder 初始排序', () => {
    const cols = [
      { key: 'name', title: '名称' },
      { key: 'age', title: '年龄', sortable: true, defaultSortOrder: 'desc' as const, sorter: (a: any, b: any) => a.age - b.age },
    ]
    const { container } = render(MacDataTable, { props: { columns: cols, data } })
    const rows = container.querySelectorAll('tbody tr')
    expect(rows[0].textContent).toContain('王五')
  })

  it('分页：默认每页 10 条，翻页派发 mac-data-table-change', async () => {
    const bigData = Array.from({ length: 25 }, (_, i) => ({ name: `行${i}`, age: i }))
    const { container } = render(MacDataTable, { props: { columns, data: bigData } })
    expect(container.querySelectorAll('tbody tr').length).toBe(10)
    const handler = vi.fn()
    document.addEventListener('mac-data-table-change', handler)
    // 点击第 2 页
    const page2 = Array.from(container.querySelectorAll('.pg-btn')).find(
      (b) => b.textContent?.trim() === '2',
    )!
    await fireEvent.click(page2)
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail
    expect(detail.page).toBe(2)
    expect(detail.pageSize).toBe(10)
    await flush()
    expect(container.querySelectorAll('tbody tr').length).toBe(10)
    document.removeEventListener('mac-data-table-change', handler)
  })

  it('pagination=false 关闭分页', () => {
    const bigData = Array.from({ length: 25 }, (_, i) => ({ name: `行${i}`, age: i }))
    const { container } = render(MacDataTable, {
      props: { columns, data: bigData, pagination: false },
    })
    expect(container.querySelectorAll('tbody tr').length).toBe(25)
    expect(container.querySelector('.pagination')).toBeNull()
  })

  it('行选择：单行勾选派发 mac-data-table-select', async () => {
    const { container } = render(MacDataTable, {
      props: { columns, data, rowSelection: {} },
    })
    const handler = vi.fn()
    document.addEventListener('mac-data-table-select', handler)
    const checkbox = container.querySelector('tbody .checkbox') as HTMLInputElement
    await fireEvent.click(checkbox)
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail
    expect(detail.type).toBe('multiple')
    expect(detail.selectedRowKeys).toEqual([0])
    expect(detail.selectedRows[0].name).toBe('张三')
    document.removeEventListener('mac-data-table-select', handler)
  })

  it('全选勾选', async () => {
    const { container } = render(MacDataTable, {
      props: { columns, data, rowSelection: {} },
    })
    const handler = vi.fn()
    document.addEventListener('mac-data-table-select', handler)
    const headCheckbox = container.querySelector('thead .checkbox') as HTMLInputElement
    await fireEvent.click(headCheckbox)
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail
    expect(detail.type).toBe('all')
    expect(detail.selectedRowKeys.length).toBe(3)
    document.removeEventListener('mac-data-table-select', handler)
  })

  it('radio 选择类型', async () => {
    const { container } = render(MacDataTable, {
      props: { columns, data, rowSelection: { type: 'radio' } },
    })
    const handler = vi.fn()
    document.addEventListener('mac-data-table-select', handler)
    const radio = container.querySelector('tbody .radio') as HTMLInputElement
    await fireEvent.click(radio)
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail
    expect(detail.type).toBe('single')
    expect(detail.selectedRowKeys).toEqual([0])
    document.removeEventListener('mac-data-table-select', handler)
  })

  it('行点击派发 mac-data-table-row-click', async () => {
    const { container } = render(MacDataTable, { props: { columns, data } })
    const handler = vi.fn()
    document.addEventListener('mac-data-table-row-click', handler)
    await fireEvent.click(container.querySelectorAll('tbody tr')[1]!)
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail
    expect(detail.index).toBe(1)
    expect(detail.row.name).toBe('李四')
    document.removeEventListener('mac-data-table-row-click', handler)
  })

  it('空数据与自定义 emptyText', () => {
    const { container } = render(MacDataTable, {
      props: { columns, data: [], emptyText: '无数据' },
    })
    expect(container.querySelector('tr.empty')?.textContent).toContain('无数据')
  })

  it('loading 状态显示遮罩', () => {
    const { container } = render(MacDataTable, { props: { columns, data, loading: true } })
    expect(container.querySelector('.loading-mask')).toBeTruthy()
  })

  it('bordered / striped 样式类', () => {
    const { container } = render(MacDataTable, {
      props: { columns, data, bordered: true, striped: true },
    })
    const root = container.querySelector<HTMLElement>('.mac-data-table')!
    expect(root.className).toContain('table--bordered')
    expect(root.className).toContain('table--striped')
  })

  it('remote 模式不做本地排序', async () => {
    const { container } = render(MacDataTable, {
      props: { columns, data, remote: true },
    })
    const th = container.querySelector('th.sortable')!
    await fireEvent.click(th)
    // 远程模式下数据顺序不变
    const rows = container.querySelectorAll('tbody tr')
    expect(rows[0].textContent).toContain('张三')
  })

  it('title / footer snippet 渲染', () => {
    const { container } = render(MacDataTable, {
      props: { columns, data, title: snippet('<h3>用户列表</h3>'), footer: snippet('<p>底部</p>') },
    })
    expect(container.textContent).toContain('用户列表')
    expect(container.textContent).toContain('底部')
  })
})
