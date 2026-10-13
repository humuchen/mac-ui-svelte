import type { Meta, StoryObj } from '@storybook/web-components'
import MacRadio from './mac-radio.svelte'
import { mountSvelte, text } from '../../../../.storybook/mount-svelte'

const meta = {
  title: '组件/Radio 单选框',
  tags: ['autodocs'],
  args: {
    children: '单选选项',
  },
  argTypes: {
    value: { control: 'text', description: '单选按钮的值' },
    checked: { control: 'boolean', description: '单选按钮是否选中（受控）' },
    defaultChecked: { control: 'boolean', description: '单选按钮默认是否选中（非受控）' },
    disabled: { control: 'boolean', description: '禁用单选按钮' },
    size: {
      control: 'inline-radio',
      options: ['sm', 'md', 'lg'],
      description: '单选按钮的尺寸（默认继承 ConfigProvider，否则 md）',
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
  args: { children: '未选中' },
  render: (args) =>
    mountSvelte(MacRadio, { ...args, children: text(String(args.children ?? '')) }),
}

export const Checked: Story = {
  args: { checked: true, children: '已选中' },
  render: (args) =>
    mountSvelte(MacRadio, { ...args, children: text(String(args.children ?? '')) }),
}

export const Disabled: Story = {
  args: { disabled: true, children: '已禁用' },
  render: (args) =>
    mountSvelte(MacRadio, { ...args, children: text(String(args.children ?? '')) }),
}

export const Sizes: Story = {
  render: () => {
    const host = document.createElement('div')
    host.style.display = 'flex'
    host.style.gap = '24px'
    host.style.alignItems = 'center'
    for (const size of ['sm', 'md', 'lg'] as const) {
      const cell = document.createElement('div')
      cell.appendChild(
        mountSvelte(MacRadio, { size, checked: true, children: text(`${size} 尺寸`) }),
      )
      host.appendChild(cell)
    }
    return host
  },
}
