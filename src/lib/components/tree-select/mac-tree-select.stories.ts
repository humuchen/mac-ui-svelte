import type { Meta, StoryObj } from '@storybook/web-components'
import MacTreeSelect from './mac-tree-select.svelte'
import type { TreeOption } from './tree-select-types'
import { mountSvelte } from '../../../../.storybook/mount-svelte'

/** 树形选项示例数据（含一个禁用节点）。 */
const options: TreeOption[] = [
  {
    value: 'fruit',
    label: '水果',
    children: [
      { value: 'apple', label: '苹果' },
      { value: 'banana', label: '香蕉' },
      { value: 'cherry', label: '樱桃', disabled: true },
    ],
  },
  {
    value: 'vegetable',
    label: '蔬菜',
    children: [
      { value: 'carrot', label: '胡萝卜' },
      { value: 'tomato', label: '西红柿' },
    ],
  },
  { value: 'nut', label: '坚果' },
]

/** 创建带说明文字的单元格容器。 */
function labeledCell(label: string, width = '320px'): HTMLDivElement {
  const cell = document.createElement('div')
  cell.style.width = width
  const caption = document.createElement('div')
  caption.textContent = label
  caption.style.marginBottom = '6px'
  caption.style.fontSize = '12px'
  caption.style.color = 'var(--md-color-text-secondary, #86868b)'
  cell.appendChild(caption)
  return cell
}

/**
 * 挂载后自动展开下拉面板。
 * 树节点、搜索框、空数据等仅在下拉展开时可见，
 * 因此对触发器执行一次程序化点击（与用户点击行为一致）。
 */
function mountOpened(props: Record<string, unknown>): HTMLElement {
  const host = mountSvelte(MacTreeSelect, props)
  host.querySelector<HTMLElement>('.tree-trigger')?.click()
  return host
}

const meta = {
  title: '组件/TreeSelect 树选择',
  tags: ['autodocs'],
  args: {
    options,
    defaultValue: '',
    placeholder: '请选择',
    disabled: false,
    error: false,
    success: false,
    clearable: false,
    multiple: false,
    searchable: false,
    panel: false,
    checkable: false,
    defaultExpandAll: false,
    searchPlaceholder: 'Search...',
    emptyText: 'No data',
  },
  argTypes: {
    options: { control: 'object', description: '树形选项数据，结构为 TreeOption[]' },
    value: { control: 'text', description: '选择器的值（单选：string，多选：string[]）' },
    defaultValue: { control: 'text', description: '默认值（非受控模式）' },
    placeholder: { control: 'text', description: '占位符' },
    size: {
      control: 'inline-radio',
      options: ['sm', 'md', 'lg'],
      description: '选择器的尺寸',
    },
    disabled: { control: 'boolean', description: '禁用选择器' },
    error: { control: 'boolean', description: '错误状态' },
    success: { control: 'boolean', description: '成功状态' },
    clearable: { control: 'boolean', description: '显示清除按钮' },
    multiple: { control: 'boolean', description: '启用多选' },
    searchable: { control: 'boolean', description: '启用搜索' },
    panel: { control: 'boolean', description: '面板模式（无触发器，常显）' },
    checkable: { control: 'boolean', description: '多选时启用复选框级联勾选' },
    defaultExpandAll: { control: 'boolean', description: '默认展开所有节点' },
    searchPlaceholder: { control: 'text', description: '搜索框占位符' },
    emptyText: { control: 'text', description: '无数据时的空文本' },
    theme: {
      control: 'inline-radio',
      options: ['light', 'dark'],
      description: '组件级主题覆盖',
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { options, value: 'apple', defaultExpandAll: true },
  render: (args) => {
    const host = document.createElement('div')
    host.style.maxWidth = '320px'
    // 树节点仅在下拉展开时可见，挂载后自动展开
    host.appendChild(mountOpened({ ...args }))
    return host
  },
}

export const Sizes: Story = {
  parameters: {
    // 画廊类 story：render 内硬编码展示属性，不消费 args，隐藏无效控件
    controls: { disable: true },
  },
  render: () => {
    const host = document.createElement('div')
    host.style.display = 'flex'
    host.style.flexDirection = 'column'
    host.style.gap = '16px'
    for (const size of ['sm', 'md', 'lg'] as const) {
      const cell = labeledCell(`${size} 尺寸`)
      cell.appendChild(mountSvelte(MacTreeSelect, { size, options, placeholder: '请选择' }))
      host.appendChild(cell)
    }
    return host
  },
}

export const Multiple: Story = {
  args: {
    options,
    multiple: true,
    clearable: true,
    defaultExpandAll: true,
    value: ['apple', 'carrot'],
  },
  render: (args) => {
    const host = document.createElement('div')
    host.style.maxWidth = '320px'
    host.appendChild(mountOpened({ ...args }))
    return host
  },
}

export const Checkable: Story = {
  args: {
    options,
    multiple: true,
    checkable: true,
    defaultExpandAll: true,
    value: ['apple', 'banana'],
  },
  render: (args) => {
    const host = document.createElement('div')
    host.style.maxWidth = '320px'
    // 复选框与级联勾选仅在下拉展开时可见，挂载后自动展开
    host.appendChild(mountOpened({ ...args }))
    return host
  },
}

export const States: Story = {
  parameters: {
    // 画廊类 story：render 内硬编码展示属性，不消费 args，隐藏无效控件
    controls: { disable: true },
  },
  render: () => {
    const host = document.createElement('div')
    host.style.display = 'flex'
    host.style.flexDirection = 'column'
    host.style.gap = '16px'

    const disabledCell = labeledCell('禁用')
    disabledCell.appendChild(
      mountSvelte(MacTreeSelect, { options, value: 'apple', disabled: true }),
    )
    host.appendChild(disabledCell)

    const errorCell = labeledCell('错误状态')
    errorCell.appendChild(mountSvelte(MacTreeSelect, { options, error: true }))
    host.appendChild(errorCell)

    // 面板模式：无触发器，树常显；附带搜索框与全部展开
    const panelCell = labeledCell('面板模式（常显 + 可搜索）')
    panelCell.appendChild(
      mountSvelte(MacTreeSelect, {
        options,
        panel: true,
        searchable: true,
        defaultExpandAll: true,
      }),
    )
    host.appendChild(panelCell)

    // 空数据仅在下拉展开时可见，放在最后避免遮挡其他示例
    const emptyCell = labeledCell('空数据')
    emptyCell.appendChild(mountOpened({ options: [], emptyText: '暂无数据' }))
    host.appendChild(emptyCell)

    return host
  },
}
