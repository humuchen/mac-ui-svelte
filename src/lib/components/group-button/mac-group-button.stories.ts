import type { Meta, StoryObj } from '@storybook/web-components'
import MacGroupButton from './mac-group-button.svelte'
import { mountSvelte } from '../../../../.storybook/mount-svelte'

const meta = {
  title: '组件/GroupButton 按钮组',
  tags: ['autodocs'],
  args: {
    value: 'a',
    items: [
      { value: 'a', label: '苹果' },
      { value: 'b', label: '香蕉' },
      { value: 'c', label: '樱桃' },
    ],
  },
  argTypes: {
    items: {
      control: 'object',
      description: '按钮项数组，结构为 { value, label, disabled }',
    },
    value: { control: 'text', description: '当前选中的值（支持双向绑定）' },
    size: {
      control: 'inline-radio',
      options: ['sm', 'md', 'lg'],
      description: '按钮组的尺寸（默认继承 ConfigProvider，否则 md）',
    },
    disabled: { control: 'boolean', description: '禁用组内所有按钮' },
    theme: {
      control: 'inline-radio',
      options: ['light', 'dark'],
      description: '组件级主题覆盖',
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

// 注：选中值变化时触发 mac-change 事件，detail 为 { value, item, index }；
// 组件支持键盘操作（左右方向键 / Home / End / 空格 / 回车）。

export const Basic: Story = {
  render: (args) => mountSvelte(MacGroupButton, args),
}

export const DisabledItem: Story = {
  args: {
    items: [
      { value: 'a', label: '苹果' },
      { value: 'b', label: '香蕉', disabled: true },
      { value: 'c', label: '樱桃' },
    ],
  },
  render: (args) => mountSvelte(MacGroupButton, args),
}

export const Sizes: Story = {
  render: () => {
    const host = document.createElement('div')
    host.style.display = 'flex'
    host.style.flexDirection = 'column'
    host.style.gap = '12px'
    host.style.alignItems = 'flex-start'
    for (const size of ['sm', 'md', 'lg'] as const) {
      host.appendChild(
        mountSvelte(MacGroupButton, {
          size,
          value: 'b',
          items: [
            { value: 'a', label: '日' },
            { value: 'b', label: '周' },
            { value: 'c', label: '月' },
          ],
        }),
      )
    }
    return host
  },
}

export const AllDisabled: Story = {
  args: { disabled: true },
  render: (args) => mountSvelte(MacGroupButton, args),
}

export const DarkTheme: Story = {
  args: { theme: 'dark' },
  render: (args) => {
    // 深色背景容器，便于观察 dark 主题下的玻璃质感效果
    const host = document.createElement('div')
    host.style.padding = '16px'
    host.style.borderRadius = '8px'
    host.style.background = '#1e1e1e'
    host.style.display = 'inline-block'
    host.appendChild(mountSvelte(MacGroupButton, args))
    return host
  },
}
