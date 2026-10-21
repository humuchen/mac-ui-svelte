import type { Meta, StoryObj } from '@storybook/web-components'
import MacDataTable from './mac-data-table.svelte'
import { mountSvelte, html } from '../../../../.storybook/mount-svelte'
import type { DataTableColumn, DataTableRowSelection } from './data-table-types'

/** 基础表格的列定义（含 render 自定义单元格示例）。 */
const basicColumns: DataTableColumn[] = [
  { key: 'name', title: '名称', width: 120 },
  { key: 'age', title: '年龄', align: 'center' },
  { key: 'email', title: '邮箱', ellipsis: true },
  {
    key: 'status',
    title: '状态',
    render: (row: any) =>
      row.status
        ? '<span style="color: var(--md-color-primary); font-weight: 500;">● 在职</span>'
        : '<span style="color: var(--md-color-text-secondary);">● 离职</span>',
  },
]

const basicData = [
  { name: '张三', age: 30, email: 'zhangsan@example.com', status: true },
  { name: '李四', age: 25, email: 'lisi@example.com', status: false },
  { name: '王五', age: 35, email: 'wangwu@example.com', status: true },
]

/** 排序表格的列定义（本地 sorter + 默认排序）。 */
const sortColumns: DataTableColumn[] = [
  { key: 'name', title: '名称', width: 120 },
  {
    key: 'age',
    title: '年龄',
    align: 'center',
    sortable: true,
    sorter: (a: any, b: any) => a.age - b.age,
  },
  {
    key: 'score',
    title: '积分',
    align: 'right',
    sortable: true,
    defaultSortOrder: 'desc',
    sorter: (a: any, b: any) => a.score - b.score,
  },
]

const sortData = [
  { name: '张三', age: 30, score: 1200 },
  { name: '李四', age: 25, score: 980 },
  { name: '王五', age: 35, score: 2400 },
  { name: '赵六', age: 28, score: 1660 },
]

/** 行选择表格的列定义。 */
const selectionColumns: DataTableColumn[] = [
  { key: 'name', title: '名称', width: 120 },
  { key: 'age', title: '年龄', align: 'center' },
]

const selectionData = [
  { name: '张三', age: 30 },
  { name: '李四', age: 25 },
  { name: '王五', age: 35 },
]

/** 分页示例数据（25 条）。 */
const pagingData = Array.from({ length: 25 }, (_, i) => ({
  name: `用户 ${String(i + 1).padStart(2, '0')}`,
  age: 20 + (i % 30),
  email: `user${i + 1}@example.com`,
}))

const meta = {
  title: '组件/DataTable 数据表格',
  tags: ['autodocs'],
  args: {
    columns: basicColumns,
    data: basicData,
    pagination: true,
    remote: false,
    bordered: false,
    striped: false,
    sticky: false,
    loading: false,
    emptyText: '暂无数据',
  },
  argTypes: {
    columns: { control: 'object', description: '列定义数组（key/title/dataIndex/render 等）' },
    data: { control: 'object', description: '数据源数组' },
    rowKey: { control: 'text', description: '行 key 字段名或取值函数' },
    pagination: { control: 'object', description: '分页配置，false 关闭分页' },
    rowSelection: { control: 'object', description: '行选择配置（type/selectedRowKeys 等）' },
    remote: { control: 'boolean', description: '远程数据模式（排序/分页由外部处理）' },
    bordered: { control: 'boolean', description: '显示边框' },
    striped: { control: 'boolean', description: '斑马纹' },
    sticky: { control: 'boolean', description: '表头吸顶' },
    loading: { control: 'boolean', description: '加载状态' },
    emptyText: { control: 'text', description: '空数据文本' },
    size: {
      control: 'inline-radio',
      options: ['sm', 'md', 'lg'],
      description: '组件尺寸（默认继承 ConfigProvider，否则 md）',
    },
    theme: {
      control: 'inline-radio',
      options: ['light', 'dark'],
      description: '组件级主题覆盖',
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/** 基础用法：标题/底部插槽 + render 自定义列渲染。 */
export const Basic: Story = {
  args: {
    columns: basicColumns,
    data: basicData,
    title: html('<h3 style="margin: 0; font-size: 16px;">用户列表</h3>'),
    footer: html(
      '<span style="color: var(--md-color-text-secondary); font-size: 12px;">以上数据仅供演示</span>',
    ),
  },
  render: (args) => mountSvelte(MacDataTable, args),
}

/** 排序：点击表头在 asc / desc / 取消之间循环，积分列默认降序。 */
export const Sortable: Story = {
  args: {
    columns: sortColumns,
    data: sortData,
  },
  render: (args) => mountSvelte(MacDataTable, args),
}

/** 行选择：checkbox 多选与 radio 单选并排展示。 */
export const Selection: Story = {
  render: () => {
    const host = document.createElement('div')
    host.style.display = 'flex'
    host.style.gap = '32px'
    host.style.flexWrap = 'wrap'
    host.style.alignItems = 'flex-start'

    const makeCell = (label: string) => {
      const cell = document.createElement('div')
      cell.style.minWidth = '320px'
      const caption = document.createElement('div')
      caption.textContent = label
      caption.style.marginBottom = '8px'
      caption.style.fontSize = '13px'
      caption.style.color = 'var(--md-color-text-secondary)'
      cell.appendChild(caption)
      return cell
    }

    const checkboxCell = makeCell('多选（checkbox）')
    checkboxCell.appendChild(
      mountSvelte(MacDataTable, {
        columns: selectionColumns,
        data: selectionData,
        rowSelection: { type: 'checkbox' } satisfies DataTableRowSelection,
      }),
    )
    host.appendChild(checkboxCell)

    const radioCell = makeCell('单选（radio）')
    radioCell.appendChild(
      mountSvelte(MacDataTable, {
        columns: selectionColumns,
        data: selectionData,
        rowSelection: { type: 'radio' } satisfies DataTableRowSelection,
      }),
    )
    host.appendChild(radioCell)

    const disabledCell = makeCell('禁用部分行（getCheckboxProps）')
    disabledCell.appendChild(
      mountSvelte(MacDataTable, {
        columns: selectionColumns,
        data: selectionData,
        rowSelection: {
          type: 'checkbox',
          getCheckboxProps: (row: any) => ({ disabled: row.name === '李四' }),
        } satisfies DataTableRowSelection,
      }),
    )
    host.appendChild(disabledCell)

    return host
  },
}

/** 分页：25 条数据，每页 10 条，带每页条数切换与快速跳转。 */
export const Pagination: Story = {
  args: {
    columns: [
      { key: 'name', title: '名称', width: 120 },
      { key: 'age', title: '年龄', align: 'center' },
      { key: 'email', title: '邮箱', ellipsis: true },
    ] satisfies DataTableColumn[],
    data: pagingData,
    pagination: { pageSizeOptions: [5, 10, 20], showQuickJumper: true },
  },
  render: (args) => mountSvelte(MacDataTable, args),
}

/** 状态：加载中 / 空数据 / 斑马纹边框 并排展示。 */
export const States: Story = {
  render: () => {
    const host = document.createElement('div')
    host.style.display = 'flex'
    host.style.gap = '32px'
    host.style.flexWrap = 'wrap'
    host.style.alignItems = 'flex-start'

    const makeCell = (label: string, minWidth = '320px') => {
      const cell = document.createElement('div')
      cell.style.minWidth = minWidth
      const caption = document.createElement('div')
      caption.textContent = label
      caption.style.marginBottom = '8px'
      caption.style.fontSize = '13px'
      caption.style.color = 'var(--md-color-text-secondary)'
      cell.appendChild(caption)
      return cell
    }

    const loadingCell = makeCell('加载中（loading）')
    loadingCell.appendChild(
      mountSvelte(MacDataTable, {
        columns: selectionColumns,
        data: basicData,
        loading: true,
      }),
    )
    host.appendChild(loadingCell)

    const emptyCell = makeCell('空数据（emptyText）')
    emptyCell.appendChild(
      mountSvelte(MacDataTable, {
        columns: selectionColumns,
        data: [],
        emptyText: '暂无数据',
      }),
    )
    host.appendChild(emptyCell)

    const stripedCell = makeCell('斑马纹 + 边框（striped / bordered）')
    stripedCell.appendChild(
      mountSvelte(MacDataTable, {
        columns: selectionColumns,
        data: basicData,
        striped: true,
        bordered: true,
        pagination: false,
      }),
    )
    host.appendChild(stripedCell)

    return host
  },
}
