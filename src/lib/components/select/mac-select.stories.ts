import type { Meta, StoryObj } from '@storybook/web-components'
import MacSelect from './mac-select.svelte'
import type { OptionGroup, SelectOption } from './select-types'
import { mountSvelte } from '../../../../.storybook/mount-svelte'

/** 扁平选项示例数据（含一个禁用选项）。 */
const options: SelectOption[] = [
  { value: 'apple', label: '苹果', description: '红富士' },
  { value: 'banana', label: '香蕉', description: '进口香蕉' },
  { value: 'cherry', label: '樱桃', description: '暂不可选', disabled: true },
  { value: 'durian', label: '榴莲' },
]

/** 分组选项示例数据（含图标与描述）。 */
const groups: OptionGroup[] = [
  {
    label: '水果',
    options: [
      { value: 'apple', label: '苹果', icon: '<span style="color: #e74c3c">●</span>' },
      { value: 'banana', label: '香蕉', icon: '<span style="color: #f1c40f">●</span>' },
    ],
  },
  {
    label: '蔬菜',
    options: [
      { value: 'carrot', label: '胡萝卜', description: '富含维生素 A' },
      { value: 'tomato', label: '西红柿' },
    ],
  },
]

/** 创建带说明文字的单元格容器。 */
function labeledCell(label: string, width = '220px'): HTMLDivElement {
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
 * 分组标题、搜索框、加载指示器、空数据等仅在下拉展开时渲染，
 * 因此对触发器执行一次程序化点击（与用户点击行为一致）。
 */
function mountOpened(props: Record<string, unknown>): HTMLElement {
  const host = mountSvelte(MacSelect, props)
  host.querySelector<HTMLElement>('.select-trigger')?.click()
  return host
}

const meta = {
  title: '组件/Select 选择器',
  tags: ['autodocs'],
  args: {
    options,
    value: '',
    placeholder: '请选择水果',
    label: '',
    required: false,
    disabled: false,
    error: false,
    success: false,
    helperText: '',
    multiple: false,
    clearable: false,
    searchable: false,
    loading: false,
    searchPlaceholder: 'Search...',
    emptyText: 'No options available',
  },
  argTypes: {
    value: { control: 'text', description: '选择器的值（单选：string，多选：string[]）' },
    placeholder: { control: 'text', description: '选择器的占位符' },
    options: { control: 'object', description: '选择器的选项，结构为 SelectOption[]' },
    groups: {
      control: 'object',
      description: '选项分组，结构为 OptionGroup[]（设置后优先于 options）',
    },
    size: {
      control: 'inline-radio',
      options: ['sm', 'md', 'lg'],
      description: '选择器的尺寸',
    },
    variant: {
      control: 'inline-radio',
      options: ['default', 'filled', 'glass'],
      description: '视觉变体',
    },
    label: { control: 'text', description: '选择器的标签' },
    required: { control: 'boolean', description: '显示必填指示器' },
    disabled: { control: 'boolean', description: '禁用选择器' },
    error: { control: 'boolean', description: '错误状态' },
    success: { control: 'boolean', description: '成功状态' },
    helperText: { control: 'text', description: '辅助文本' },
    multiple: { control: 'boolean', description: '启用多选' },
    clearable: { control: 'boolean', description: '显示清除按钮' },
    searchable: { control: 'boolean', description: '启用搜索功能' },
    loading: { control: 'boolean', description: '显示加载状态' },
    searchPlaceholder: { control: 'text', description: '搜索输入框的占位符' },
    emptyText: { control: 'text', description: '无选项时的空文本' },
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
  args: {
    label: '水果',
    required: true,
    helperText: '请选择你喜欢的水果',
    placeholder: '请选择水果',
    value: 'banana',
    options,
  },
  render: (args) => {
    const host = document.createElement('div')
    host.style.maxWidth = '320px'
    host.appendChild(mountSvelte(MacSelect, { ...args }))
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
    host.style.gap = '16px'
    host.style.alignItems = 'flex-start'
    for (const size of ['sm', 'md', 'lg'] as const) {
      const cell = labeledCell(`${size} 尺寸`)
      cell.appendChild(mountSvelte(MacSelect, { size, options, placeholder: '请选择' }))
      host.appendChild(cell)
    }
    return host
  },
}

export const Variants: Story = {
  parameters: {
    // 画廊类 story：render 内硬编码展示属性，不消费 args，隐藏无效控件
    controls: { disable: true },
  },
  render: () => {
    const host = document.createElement('div')
    host.style.display = 'flex'
    host.style.gap = '16px'
    host.style.alignItems = 'flex-start'

    const addCell = (variant: 'default' | 'filled' | 'glass', dark = false) => {
      const cell = labeledCell(`${variant} 变体`)
      if (dark) {
        // glass 为半透明玻璃质感，需在深色背景下展示
        cell.style.background = '#1d1d1f'
        cell.style.padding = '16px'
        cell.style.borderRadius = '10px'
      }
      cell.appendChild(
        mountSvelte(MacSelect, {
          variant,
          theme: dark ? 'dark' : undefined,
          options,
          placeholder: '请选择',
        }),
      )
      host.appendChild(cell)
    }

    addCell('default')
    addCell('filled')
    addCell('glass', true)
    return host
  },
}

export const Groups: Story = {
  args: { groups, placeholder: '请选择', value: 'apple' },
  render: (args) => {
    const host = document.createElement('div')
    host.style.maxWidth = '320px'
    // 分组标题仅在下拉展开时渲染，挂载后自动展开
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

    // 第一行：闭合状态下即可见的状态（禁用 / 错误 / 多选标签）
    const closedRow = document.createElement('div')
    closedRow.style.display = 'flex'
    closedRow.style.gap = '16px'
    closedRow.style.alignItems = 'flex-start'

    const disabledCell = labeledCell('禁用')
    disabledCell.appendChild(mountSvelte(MacSelect, { options, value: 'apple', disabled: true }))
    closedRow.appendChild(disabledCell)

    const errorCell = labeledCell('错误状态')
    errorCell.appendChild(
      mountSvelte(MacSelect, { options, error: true, helperText: '请选择有效的选项' }),
    )
    closedRow.appendChild(errorCell)

    const multipleCell = labeledCell('多选 + 可清除')
    multipleCell.appendChild(
      mountSvelte(MacSelect, {
        options,
        multiple: true,
        clearable: true,
        value: ['apple', 'banana'],
      }),
    )
    closedRow.appendChild(multipleCell)

    host.appendChild(closedRow)

    // 第二行：仅在下拉展开时可见的状态（可搜索 / 加载中 / 空数据）
    const openRow = document.createElement('div')
    openRow.style.display = 'flex'
    openRow.style.gap = '16px'
    openRow.style.alignItems = 'flex-start'

    const searchCell = labeledCell('可搜索')
    searchCell.appendChild(
      mountOpened({ options, searchable: true, searchPlaceholder: '搜索水果…' }),
    )
    openRow.appendChild(searchCell)

    const loadingCell = labeledCell('加载中')
    loadingCell.appendChild(mountOpened({ options, loading: true }))
    openRow.appendChild(loadingCell)

    const emptyCell = labeledCell('空数据')
    emptyCell.appendChild(mountOpened({ options: [], emptyText: '暂无数据' }))
    openRow.appendChild(emptyCell)

    host.appendChild(openRow)
    return host
  },
}
