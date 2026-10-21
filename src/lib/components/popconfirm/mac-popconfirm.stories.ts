import type { Meta, StoryObj } from '@storybook/web-components'
import MacPopconfirm from './mac-popconfirm.svelte'
import { mountSvelte, html } from '../../../../.storybook/mount-svelte'

/**
 * MacPopconfirm 气泡确认故事。
 *
 * 说明：Popconfirm 默认不显示气泡，点击触发元素（children 插槽）后
 * 在指定位置弹出确认气泡；支持 click / hover 两种触发模式。
 */

/** 构造触发元素的 HTML（children 插槽内容）。 */
const triggerBtn = (label: string) =>
  `<button style="padding:5px 14px;border:0.5px solid rgba(0,0,0,0.12);border-radius:6px;background:rgba(255,255,255,0.8);font-size:13px;cursor:pointer;">${label}</button>`

const meta = {
  title: '组件/Popconfirm 气泡确认',
  tags: ['autodocs'],
  args: {
    title: '确认删除',
    description: '删除后无法恢复，确定继续吗？',
    children: triggerBtn('删除'),
    trigger: 'click',
    confirmText: '确认',
    cancelText: '取消',
    danger: false,
    showIcon: true,
    disabled: false,
    width: '240px',
  },
  argTypes: {
    title: { control: 'text', description: '确认标题文本' },
    description: { control: 'text', description: '确认描述文本' },
    confirmText: { control: 'text', description: '确认按钮文本' },
    cancelText: { control: 'text', description: '取消按钮文本' },
    danger: { control: 'boolean', description: '确认按钮是否为危险样式' },
    showIcon: { control: 'boolean', description: '是否显示图标' },
    placement: {
      control: 'select',
      options: [
        'top',
        'top-start',
        'top-end',
        'bottom',
        'bottom-start',
        'bottom-end',
        'left',
        'left-start',
        'left-end',
        'right',
        'right-start',
        'right-end',
      ],
      description: '气泡位置（空间不足时自动翻转）',
    },
    trigger: {
      control: 'inline-radio',
      options: ['click', 'hover'],
      description: '触发模式',
    },
    disabled: { control: 'boolean', description: '是否禁用气泡确认' },
    width: { control: 'text', description: '气泡宽度' },
    theme: {
      control: 'inline-radio',
      options: ['light', 'dark'],
      description: '组件级主题覆盖',
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Click: Story = {
  render: (args) =>
    mountSvelte(MacPopconfirm, { ...args, children: html(String(args.children ?? '')) }),
}

export const Hover: Story = {
  args: {
    title: '悬停查看',
    description: '鼠标悬停时显示气泡。',
    children: triggerBtn('悬停我'),
    trigger: 'hover',
  },
  render: (args) =>
    mountSvelte(MacPopconfirm, { ...args, children: html(String(args.children ?? '')) }),
}

export const Danger: Story = {
  args: {
    title: '删除文件',
    description: '文件删除后将无法恢复。',
    confirmText: '删除',
    danger: true,
    children: triggerBtn('删除文件'),
  },
  render: (args) =>
    mountSvelte(MacPopconfirm, { ...args, children: html(String(args.children ?? '')) }),
}

export const Placements: Story = {
  parameters: {
    // 画廊类 story：render 内硬编码展示属性，不消费 args，隐藏无效控件
    controls: { disable: true },
  },
  render: () => {
    const host = document.createElement('div')
    host.style.cssText = 'display:flex;gap:24px;flex-wrap:wrap;align-items:center;padding:56px 0;'
    // 每个方向一个独立实例，点击对应触发元素查看气泡位置
    const placements = ['top', 'bottom', 'left', 'right'] as const
    for (const placement of placements) {
      host.appendChild(
        mountSvelte(MacPopconfirm, {
          placement,
          title: '确认操作',
          description: `当前 placement：${placement}`,
          children: html(triggerBtn(placement)),
        }),
      )
    }
    return host
  },
}

export const Disabled: Story = {
  args: {
    title: '禁用状态',
    description: '禁用后点击触发元素不会弹出气泡。',
    disabled: true,
    children: triggerBtn('已禁用'),
  },
  render: (args) =>
    mountSvelte(MacPopconfirm, { ...args, children: html(String(args.children ?? '')) }),
}
