import type { Meta, StoryObj } from '@storybook/web-components'
import MacAlert from './mac-alert.svelte'
import { mountSvelte, text, html } from '../../../../.storybook/mount-svelte'

const meta = {
  title: '组件/Alert 提示',
  tags: ['autodocs'],
  args: {
    type: 'primary',
    title: '系统提示',
    bordered: true,
    showIcon: true,
    closable: false,
    children: '这是一条提示信息，用于向用户传达重要内容。',
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['default', 'primary', 'success', 'warning', 'error', 'info'],
      description: '提示的类型样式',
    },
    title: { control: 'text', description: '提示的标题' },
    bordered: { control: 'boolean', description: '提示是否有边框' },
    showIcon: { control: 'boolean', description: '是否显示类型图标' },
    closable: { control: 'boolean', description: '提示是否可以关闭（点击触发 mac-close 事件）' },
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
    type: 'primary',
    title: '系统提示',
    children: '这是一条提示信息，用于向用户传达重要内容。',
  },
  render: (args) => mountSvelte(MacAlert, { ...args, children: text(String(args.children ?? '')) }),
}

export const Types: Story = {
  render: () => {
    const host = document.createElement('div')
    host.style.display = 'flex'
    host.style.flexDirection = 'column'
    host.style.gap = '12px'
    host.style.maxWidth = '480px'
    for (const type of ['default', 'primary', 'success', 'warning', 'error', 'info'] as const) {
      host.appendChild(
        mountSvelte(MacAlert, {
          type,
          title: `${type} 类型`,
          children: text('这是该类型对应的提示内容。'),
        }),
      )
    }
    return host
  },
}

export const Closable: Story = {
  args: {
    type: 'warning',
    title: '存储空间即将用尽',
    children: '剩余空间不足 10%，请及时清理不必要的文件。',
    closable: true,
  },
  render: (args) => mountSvelte(MacAlert, { ...args, children: text(String(args.children ?? '')) }),
}

export const WithAction: Story = {
  render: () => {
    const host = document.createElement('div')
    host.style.maxWidth = '480px'
    host.appendChild(
      mountSvelte(MacAlert, {
        type: 'success',
        title: '发布成功',
        children: text('新版本 v2.4.0 已发布到生产环境。'),
        closable: true,
        action: html(
          '<button type="button" style="border:1px solid rgba(0,0,0,0.12);background:#fff;border-radius:6px;padding:3px 12px;font-size:12px;cursor:pointer;">查看详情</button>',
        ),
      }),
    )
    return host
  },
}

export const WithoutIcon: Story = {
  args: {
    type: 'info',
    title: '无图标与边框',
    children: '通过 showIcon 与 bordered 可以关闭图标和边框。',
    showIcon: false,
    bordered: false,
  },
  render: (args) => mountSvelte(MacAlert, { ...args, children: text(String(args.children ?? '')) }),
}
