import type { Meta, StoryObj } from '@storybook/web-components'
import MacRadioGroup from './mac-radio-group.svelte'
import type { RadioOption } from './radio-types'
import { mountSvelte } from '../../../../.storybook/mount-svelte'

/** 单选组示例数据（含一个禁用选项）。 */
const options: RadioOption[] = [
  { value: 'apple', label: '苹果' },
  { value: 'banana', label: '香蕉' },
  { value: 'cherry', label: '樱桃（暂不可选）', disabled: true },
]

const meta = {
  title: '组件/RadioGroup 单选框组',
  tags: ['autodocs'],
  args: {
    options,
    defaultValue: 'apple',
    name: '',
    disabled: false,
  },
  argTypes: {
    value: { control: 'text', description: '组的值（受控）' },
    defaultValue: { control: 'text', description: '默认值（非受控）' },
    name: {
      control: 'text',
      description: '单选按钮 name 属性（Svelte 版为自定义 DOM，无原生 input 承载，仅保留 API 兼容）',
    },
    size: {
      control: 'inline-radio',
      options: ['sm', 'md', 'lg'],
      description: '组的尺寸（默认继承 ConfigProvider，否则 md）',
    },
    direction: {
      control: 'inline-radio',
      options: ['horizontal', 'vertical'],
      description: '布局方向',
    },
    disabled: { control: 'boolean', description: '禁用组内所有单选按钮' },
    options: {
      control: 'object',
      description: '简化使用的选项数组，结构为 { value, label, disabled? }',
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

export const Default: Story = {
  args: { options, defaultValue: 'apple' },
  render: (args) => mountSvelte(MacRadioGroup, { ...args }),
}

export const Vertical: Story = {
  args: { options, defaultValue: 'apple', direction: 'vertical' },
  render: (args) => mountSvelte(MacRadioGroup, { ...args }),
}

export const Disabled: Story = {
  args: { options, defaultValue: 'apple', disabled: true },
  render: (args) => mountSvelte(MacRadioGroup, { ...args }),
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
      const cell = document.createElement('div')
      const caption = document.createElement('div')
      caption.textContent = `${size} 尺寸`
      caption.style.marginBottom = '6px'
      caption.style.fontSize = '12px'
      caption.style.color = 'var(--md-color-text-secondary, #86868b)'
      cell.appendChild(caption)
      cell.appendChild(mountSvelte(MacRadioGroup, { size, options, defaultValue: 'apple' }))
      host.appendChild(cell)
    }
    return host
  },
}
