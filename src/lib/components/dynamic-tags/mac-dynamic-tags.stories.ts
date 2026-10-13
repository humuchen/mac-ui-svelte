import type { Meta, StoryObj } from '@storybook/web-components'
import MacDynamicTags from './mac-dynamic-tags.svelte'
import { mountSvelte } from '../../../../.storybook/mount-svelte'

type TagType = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'

const meta = {
  title: '组件/DynamicTags 动态标签',
  tags: ['autodocs'],
  args: {
    defaultValue: ['设计', '开发', '测试'],
    closable: true,
  },
  argTypes: {
    value: { control: false, description: '标签值数组（受控）' },
    defaultValue: { control: false, description: '默认标签数组（非受控）' },
    disabled: { control: 'boolean', description: '禁用组件' },
    max: { control: 'number', description: '标签的最大数量（达到上限后隐藏添加按钮）' },
    size: {
      control: 'inline-radio',
      options: ['sm', 'md', 'lg'],
      description: '标签的尺寸（默认继承 ConfigProvider，否则 md）',
    },
    type: {
      control: 'select',
      options: ['default', 'primary', 'success', 'warning', 'danger', 'info'],
      description: '标签的类型',
    },
    round: { control: 'boolean', description: '标签是否圆角' },
    bordered: { control: 'boolean', description: '标签是否有边框' },
    closable: { control: 'boolean', description: '标签是否可关闭' },
    inputPlaceholder: { control: 'text', description: '输入框的占位符' },
    inputMaxLength: { control: 'number', description: '输入框的最大长度' },
    theme: {
      control: 'inline-radio',
      options: ['light', 'dark'],
      description: '组件级主题覆盖',
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/** 默认动态标签：非受控初始值，可点击「+ 添加」输入新标签，点击标签 ✕ 删除。 */
export const Default: Story = {
  render: (args) => mountSvelte(MacDynamicTags, { ...args }),
}

/** 六种标签类型并排展示。 */
export const Types: Story = {
  render: () => {
    const host = document.createElement('div')
    host.style.display = 'flex'
    host.style.flexWrap = 'wrap'
    host.style.gap = '16px'
    host.style.alignItems = 'flex-start'
    const cases: { type: TagType; label: string }[] = [
      { type: 'default', label: '默认' },
      { type: 'primary', label: '主要' },
      { type: 'success', label: '成功' },
      { type: 'warning', label: '警告' },
      { type: 'danger', label: '危险' },
      { type: 'info', label: '信息' },
    ]
    for (const c of cases) {
      const cell = document.createElement('div')
      cell.style.width = '180px'
      cell.appendChild(mountSvelte(MacDynamicTags, { type: c.type, defaultValue: [c.label] }))
      host.appendChild(cell)
    }
    return host
  },
}

/** 三种尺寸并排展示。 */
export const Sizes: Story = {
  render: () => {
    const host = document.createElement('div')
    host.style.display = 'flex'
    host.style.flexDirection = 'column'
    host.style.gap = '16px'
    for (const size of ['sm', 'md', 'lg'] as const) {
      const cell = document.createElement('div')
      cell.appendChild(mountSvelte(MacDynamicTags, { size, defaultValue: ['标签'] }))
      host.appendChild(cell)
    }
    return host
  },
}

/** 限制最大数量（max=3）并自定义输入框占位符。 */
export const WithMax: Story = {
  args: {
    defaultValue: ['前端', '后端'],
    max: 3,
    inputPlaceholder: '最多添加 3 个标签',
  },
  render: (args) => mountSvelte(MacDynamicTags, { ...args }),
}

/** 禁用状态：不可添加、不可删除。 */
export const Disabled: Story = {
  args: { disabled: true, defaultValue: ['不可编辑'] },
  render: (args) => mountSvelte(MacDynamicTags, { ...args }),
}
