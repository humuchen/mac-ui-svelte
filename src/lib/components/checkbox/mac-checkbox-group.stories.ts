import type { Meta, StoryObj } from '@storybook/web-components'
import MacCheckboxGroup from './mac-checkbox-group.svelte'
import type { CheckboxOption } from './checkbox-types'
import { mountSvelte } from '../../../../.storybook/mount-svelte'

/** 选项数据（含一个禁用选项）。 */
const options: CheckboxOption[] = [
  { value: 'apple', label: '苹果' },
  { value: 'banana', label: '香蕉' },
  { value: 'cherry', label: '樱桃' },
  { value: 'durian', label: '榴莲（暂不可选）', disabled: true },
]

/** 最大可选数量示例用的选项数据。 */
const manyOptions: CheckboxOption[] = [
  { value: 'reading', label: '阅读' },
  { value: 'music', label: '音乐' },
  { value: 'sports', label: '运动' },
  { value: 'travel', label: '旅行' },
]

const meta = {
  title: '组件/CheckboxGroup 复选框组',
  tags: ['autodocs'],
  args: {
    options,
    defaultValue: ['apple'],
    direction: 'horizontal',
  },
  argTypes: {
    value: { control: 'object', description: '组的值（受控模式）' },
    defaultValue: { control: 'object', description: '默认值（非受控模式）' },
    name: { control: 'text', description: '复选框的 name 属性' },
    size: {
      control: 'inline-radio',
      options: ['sm', 'md', 'lg'],
      description: '组的尺寸（默认继承 ConfigProvider，否则 md）',
    },
    disabled: { control: 'boolean', description: '禁用组内所有复选框' },
    direction: {
      control: 'inline-radio',
      options: ['horizontal', 'vertical'],
      description: '布局方向',
    },
    options: {
      control: 'object',
      description: '简化用法时的选项数组，结构为 { value, label, disabled? }',
    },
    max: { control: 'number', description: '最大可选数量' },
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
  args: { options, defaultValue: ['apple'] },
  render: (args) => mountSvelte(MacCheckboxGroup, { ...args }),
}

export const Vertical: Story = {
  args: { options, defaultValue: ['apple', 'banana'], direction: 'vertical' },
  render: (args) => mountSvelte(MacCheckboxGroup, { ...args }),
}

export const Disabled: Story = {
  args: { options, defaultValue: ['apple'], disabled: true },
  render: (args) => mountSvelte(MacCheckboxGroup, { ...args }),
}

export const MaxSelection: Story = {
  args: { options: manyOptions, defaultValue: ['reading'], max: 2 },
  render: (args) => mountSvelte(MacCheckboxGroup, { ...args }),
}

export const Sizes: Story = {
  render: () => {
    const host = document.createElement('div')
    host.style.display = 'flex'
    host.style.flexDirection = 'column'
    host.style.gap = '16px'
    for (const size of ['sm', 'md', 'lg'] as const) {
      const cell = document.createElement('div')
      const caption = document.createElement('div')
      caption.textContent = `${size} 尺寸`
      caption.style.marginBottom = '6px'
      caption.style.fontSize = '12px'
      caption.style.color = 'var(--md-color-text-secondary, #86868b)'
      cell.appendChild(caption)
      cell.appendChild(
        mountSvelte(MacCheckboxGroup, { size, options, defaultValue: ['apple'] }),
      )
      host.appendChild(cell)
    }
    return host
  },
}
