import type { Meta, StoryObj } from '@storybook/web-components'
import MacModal from './mac-modal.svelte'
import { mountSvelte, text, html } from '../../../../.storybook/mount-svelte'

/**
 * MacModal 对话框故事。
 *
 * 说明：Modal 为常驻渲染的桌面式窗口（没有 open/visible 开关），
 * 通过 x/y/width/height 控制位置与尺寸；标题栏可拖拽移动窗口，
 * 边缘可调整大小，红绿灯按钮分别对应 关闭/最小化/最大化。
 * 底部默认渲染"取消/确认"按钮，也可通过 footer 插槽自定义。
 */

const meta = {
  title: '组件/Modal 对话框',
  tags: ['autodocs'],
  args: {
    title: '模态框',
    children: '这是模态框的内容区。',
    x: 100,
    y: 100,
    width: 480,
    height: 360,
  },
  argTypes: {
    title: { control: 'text', description: '模态框标题' },
    titleAlign: {
      control: 'inline-radio',
      options: ['left', 'center', 'right'],
      description: '标题文本对齐方式',
    },
    x: { control: 'number', description: '左侧位置（px）' },
    y: { control: 'number', description: '顶部位置（px）' },
    width: { control: 'number', description: '宽度（px）' },
    height: { control: 'number', description: '高度（px）' },
    active: { control: 'boolean', description: '是否激活（聚焦）' },
    draggable: { control: 'boolean', description: '是否可拖拽' },
    resizable: { control: 'boolean', description: '是否可调整大小' },
    showButtons: { control: 'boolean', description: '是否显示红绿灯按钮' },
    showFooter: { control: 'boolean', description: '是否显示底部区域' },
    minimized: { control: 'boolean', description: '是否最小化' },
    maximized: { control: 'boolean', description: '是否最大化' },
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
  args: { title: '欢迎使用', children: '这是一个 macOS 风格的模态框，可以拖动标题栏移动窗口。' },
  render: (args) => mountSvelte(MacModal, { ...args, children: text(String(args.children ?? '')) }),
}

export const CustomFooter: Story = {
  args: { title: '自定义底部' },
  render: (args) =>
    mountSvelte(MacModal, {
      ...args,
      children: text(String(args.children ?? '')),
      footer: html(
        '<button style="padding:4px 14px;border:none;border-radius:6px;background:rgba(0,122,255,0.88);color:#fff;font-size:13px;cursor:pointer;">完成</button>',
      ),
    }),
}

export const NoButtons: Story = {
  args: {
    title: '简洁窗口',
    showButtons: false,
    showFooter: false,
    width: 360,
    height: 200,
    children: '隐藏红绿灯按钮与底部区域后的简洁窗口。',
  },
  render: (args) => mountSvelte(MacModal, { ...args, children: text(String(args.children ?? '')) }),
}

export const Minimized: Story = {
  args: { title: '已最小化', minimized: true, height: 38 },
  render: (args) => mountSvelte(MacModal, { ...args, children: text(String(args.children ?? '')) }),
}

export const Maximized: Story = {
  args: { title: '已最大化', maximized: true, x: 0, y: 0 },
  render: (args) =>
    mountSvelte(MacModal, {
      ...args,
      width: window.innerWidth,
      height: window.innerHeight,
      children: text(String(args.children ?? '')),
    }),
}
