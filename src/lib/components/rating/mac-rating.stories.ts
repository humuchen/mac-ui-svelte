import type { Meta, StoryObj } from '@storybook/web-components'
import MacRating from './mac-rating.svelte'
import { mountSvelte } from '../../../../.storybook/mount-svelte'

const meta = {
  title: '组件/Rating 评分',
  tags: ['autodocs'],
  args: {
    value: 3,
    max: 5,
    allowHalf: false,
    readonly: false,
    disabled: false,
    showValue: true,
    icon: 'star',
  },
  argTypes: {
    value: {
      control: 'number',
      min: 0,
      max: 10,
      step: 0.5,
      description: '当前评分值（支持半星，如 3.5）',
    },
    max: { control: 'number', min: 1, max: 10, step: 1, description: '最大评分数量' },
    allowHalf: { control: 'boolean', description: '是否允许半星选择' },
    readonly: { control: 'boolean', description: '评分是否为只读' },
    disabled: { control: 'boolean', description: '评分是否禁用' },
    showValue: { control: 'boolean', description: '是否显示数值标签' },
    icon: {
      control: 'select',
      options: ['star', 'heart', 'circle', 'flame', 'thumb'],
      description: '图标形状',
    },
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

export const Default: Story = {
  args: { value: 3, showValue: true },
  render: (args) => mountSvelte(MacRating, { ...args }),
}

export const Icons: Story = {
  render: () => {
    const host = document.createElement('div')
    host.style.display = 'flex'
    host.style.gap = '24px'
    host.style.flexWrap = 'wrap'
    host.style.alignItems = 'center'
    for (const icon of ['star', 'heart', 'circle', 'flame', 'thumb'] as const) {
      const cell = document.createElement('div')
      cell.appendChild(mountSvelte(MacRating, { icon, value: 3, showValue: true }))
      host.appendChild(cell)
    }
    return host
  },
}

export const AllowHalf: Story = {
  args: { value: 3.5, allowHalf: true, showValue: true },
  render: (args) => mountSvelte(MacRating, { ...args }),
}

export const ReadonlyAndDisabled: Story = {
  render: () => {
    const host = document.createElement('div')
    host.style.display = 'flex'
    host.style.gap = '24px'
    host.style.flexWrap = 'wrap'
    host.style.alignItems = 'center'
    // 只读：展示评分但不可交互
    host.appendChild(mountSvelte(MacRating, { value: 4, readonly: true, showValue: true }))
    // 禁用：不可交互且置灰
    host.appendChild(mountSvelte(MacRating, { value: 2, disabled: true, showValue: true }))
    return host
  },
}

export const CustomMax: Story = {
  args: { max: 10, value: 7, showValue: true },
  render: (args) => mountSvelte(MacRating, { ...args }),
}
