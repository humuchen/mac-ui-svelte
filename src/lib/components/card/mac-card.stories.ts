import type { Meta, StoryObj } from '@storybook/web-components'
import MacCard from './mac-card.svelte'
import { mountSvelte, text, html } from '../../../../.storybook/mount-svelte'

const meta = {
  title: '组件/Card 卡片',
  tags: ['autodocs'],
  args: {
    variant: 'default',
    hoverable: false,
    clickable: false,
    loading: false,
    children: '卡片的主体内容，用于承载文本、列表或其他任意元素。',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'elevated', 'glass', 'outlined', 'gradient'],
      description: '卡片的视觉变体',
    },
    hoverable: { control: 'boolean', description: '卡片是否有悬停效果' },
    clickable: { control: 'boolean', description: '卡片是否可点击（显示按压反馈）' },
    loading: { control: 'boolean', description: '显示加载骨架屏' },
    accent: {
      control: 'inline-radio',
      options: ['top', 'left'],
      description: '强调边框位置',
    },
    mediaRatio: {
      control: 'inline-radio',
      options: ['16-9', '4-3', '1-1'],
      description: '媒体区域宽高比',
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
  args: { variant: 'default', children: '卡片的主体内容，用于承载文本、列表或其他任意元素。' },
  render: (args) => mountSvelte(MacCard, { ...args, children: text(String(args.children ?? '')) }),
}

export const Variants: Story = {
  render: () => {
    const host = document.createElement('div')
    host.style.display = 'flex'
    host.style.gap = '16px'
    host.style.flexWrap = 'wrap'
    host.style.alignItems = 'stretch'
    for (const variant of ['default', 'elevated', 'glass', 'outlined', 'gradient'] as const) {
      const cell = document.createElement('div')
      cell.style.width = '220px'
      cell.appendChild(
        mountSvelte(MacCard, {
          variant,
          children: text(`${variant} 变体卡片`),
        }),
      )
      host.appendChild(cell)
    }
    return host
  },
}

export const WithHeaderFooter: Story = {
  render: () => {
    const host = document.createElement('div')
    host.style.maxWidth = '360px'
    host.appendChild(
      mountSvelte(MacCard, {
        variant: 'elevated',
        hoverable: true,
        header: html(
          '<div style="display:flex;justify-content:space-between;align-items:center;"><strong>项目概览</strong><span style="font-size:12px;color:#8e8e93;">今天</span></div>',
        ),
        children: text('本季度新增用户 1,284 人，活跃度较上季度提升 12%。'),
        footer: html(
          '<div style="display:flex;gap:8px;justify-content:flex-end;"><button type="button" style="border:1px solid rgba(0,0,0,0.12);background:#fff;border-radius:6px;padding:3px 12px;font-size:12px;cursor:pointer;">取消</button><button type="button" style="border:none;background:#007aff;color:#fff;border-radius:6px;padding:3px 12px;font-size:12px;cursor:pointer;">确定</button></div>',
        ),
      }),
    )
    return host
  },
}

export const WithMedia: Story = {
  render: () => {
    const host = document.createElement('div')
    host.style.maxWidth = '320px'
    host.appendChild(
      mountSvelte(MacCard, {
        variant: 'default',
        hoverable: true,
        mediaRatio: '16-9',
        media: html(
          '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#0a84ff 0%,#5e5ce6 50%,#bf5af2 100%);color:#fff;font-size:14px;letter-spacing:2px;">媒体区域</div>',
        ),
        children: text('带有顶部媒体区域的卡片，悬停时图片会有轻微放大效果。'),
      }),
    )
    return host
  },
}

export const Loading: Story = {
  render: () => {
    const host = document.createElement('div')
    host.style.maxWidth = '360px'
    host.appendChild(
      mountSvelte(MacCard, {
        variant: 'default',
        loading: true,
        accent: 'top',
        header: text('加载中的标题'),
        children: text('加载中的主体内容。'),
        footer: text('加载中的底部内容。'),
      }),
    )
    return host
  },
}
