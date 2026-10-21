import type { Meta, StoryObj } from '@storybook/web-components'
import MacButton from './mac-button.svelte'
import { mountSvelte, text } from '../../../../.storybook/mount-svelte'

const meta = {
  title: '组件/Button 按钮',
  tags: ['autodocs'],
  args: {
    variant: 'primary',
    disabled: false,
    loading: false,
    children: '按钮',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'text'],
      description: '按钮的变体样式',
    },
    size: {
      control: 'inline-radio',
      options: ['sm', 'md', 'lg'],
      description: '按钮的尺寸（默认继承 ConfigProvider，否则 md）',
    },
    theme: {
      control: 'inline-radio',
      options: ['light', 'dark'],
      description: '组件级主题覆盖',
    },
    disabled: { control: 'boolean', description: '禁用按钮' },
    loading: { control: 'boolean', description: '显示加载动画' },
    type: {
      control: 'select',
      options: ['button', 'submit', 'reset'],
      description: '按钮的类型（表单行为）',
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: { variant: 'primary', children: '主要按钮' },
  render: (args) => mountSvelte(MacButton, { ...args, children: text(args.children as string) }),
}

export const Secondary: Story = {
  args: { variant: 'secondary', children: '次要按钮' },
  render: (args) => mountSvelte(MacButton, { ...args, children: text(args.children as string) }),
}

export const Text: Story = {
  args: { variant: 'text', children: '文本按钮' },
  render: (args) => mountSvelte(MacButton, { ...args, children: text(args.children as string) }),
}

export const Sizes: Story = {
  parameters: {
    // 画廊类 story：render 内硬编码展示属性，不消费 args，隐藏无效控件
    controls: { disable: true },
  },
  render: () => {
    const host = document.createElement('div')
    host.style.display = 'flex'
    host.style.gap = '12px'
    host.style.alignItems = 'center'
    for (const size of ['sm', 'md', 'lg'] as const) {
      const cell = document.createElement('div')
      cell.appendChild(
        mountSvelte(MacButton, { size, children: text(`${size} 尺寸`) }),
      )
      host.appendChild(cell)
    }
    return host
  },
}

export const Loading: Story = {
  args: { loading: true, children: '加载中' },
  render: (args) => mountSvelte(MacButton, { ...args, children: text(args.children as string) }),
}

export const Disabled: Story = {
  args: { disabled: true, children: '已禁用' },
  render: (args) => mountSvelte(MacButton, { ...args, children: text(args.children as string) }),
}
