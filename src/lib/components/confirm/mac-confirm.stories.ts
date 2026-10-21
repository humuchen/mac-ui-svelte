import type { Meta, StoryObj } from '@storybook/web-components'
import MacConfirm from './mac-confirm.svelte'
import { mountSvelte, html } from '../../../../.storybook/mount-svelte'

/**
 * MacConfirm 确认框故事。
 *
 * 说明：Confirm 为浮层组件，默认不可见（visible=false），
 * 通过受控属性 visible 打开；本文件中各 story 默认以 visible=true 展示内容，
 * WithTrigger 演示"关闭态 + 触发按钮"的常见用法。
 *
 * 除声明式用法外，组件库还提供了命令式 API（见同目录 confirm-dialog.ts）：
 *   import { confirmDialog } from './confirm-dialog'
 *   const ok = await confirmDialog({ title: '提示', content: '确定删除吗？' })
 *   // 点击"确定"解析 true；取消 / 点击遮罩 / ESC 均解析 false
 * 该 API 会临时挂载一个 MacConfirm 到 document.body，适合在业务逻辑中直接调用。
 */

/** 底部操作按钮（footer 插槽内容）。 */
const footerActions = html(
  '<button style="padding:5px 14px;border:0.5px solid rgba(0,0,0,0.12);border-radius:6px;background:rgba(255,255,255,0.8);font-size:13px;cursor:pointer;">取消</button>' +
    '<button style="padding:5px 14px;border:none;border-radius:6px;background:rgba(0,122,255,0.88);color:#fff;font-size:13px;cursor:pointer;">好的</button>',
)

const meta = {
  title: '组件/Confirm 确认框',
  tags: ['autodocs'],
  args: {
    visible: false,
    title: '操作确认',
    content: '确定要执行当前操作吗？',
    confirmText: '确认',
    cancelText: '取消',
    danger: false,
    showIcon: true,
    width: '420px',
    maskClosable: true,
    showDivider: true,
  },
  argTypes: {
    visible: { control: 'boolean', description: '对话框是否可见（受控属性）' },
    title: { control: 'text', description: '标题文本' },
    titleAlign: {
      control: 'inline-radio',
      options: ['left', 'center', 'right'],
      description: '标题对齐方式',
    },
    content: { control: 'text', description: '主体内容文本（children 插槽优先）' },
    confirmText: { control: 'text', description: '确认按钮文本' },
    cancelText: { control: 'text', description: '取消按钮文本' },
    danger: { control: 'boolean', description: '确认按钮是否使用危险样式' },
    showIcon: { control: 'boolean', description: '是否显示图标' },
    width: { control: 'text', description: "对话框宽度，如 '420px' 或数字 420" },
    maskClosable: { control: 'boolean', description: '点击遮罩是否关闭对话框' },
    showDivider: { control: 'boolean', description: '是否显示标题/底部分隔线' },
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
  args: { visible: true },
  render: (args) => mountSvelte(MacConfirm, { ...args }),
}

export const Danger: Story = {
  args: {
    visible: true,
    danger: true,
    title: '删除确认',
    content: '删除后无法恢复，确定要删除吗？',
    confirmText: '删除',
  },
  render: (args) => mountSvelte(MacConfirm, { ...args }),
}

export const CustomContent: Story = {
  args: { visible: true, title: '自定义内容' },
  render: (args) =>
    mountSvelte(MacConfirm, {
      ...args,
      children: html(
        '<p style="margin:0 0 8px;">这是通过 children 插槽传入的自定义内容。</p>' +
          '<label style="display:flex;gap:8px;align-items:center;font-size:13px;color:#666;">' +
          '<input type="checkbox" />不再提示</label>',
      ),
      footer: footerActions,
    }),
}

export const NoDivider: Story = {
  args: {
    visible: true,
    title: '无分隔线',
    content: 'showDivider=false 时不显示标题与底部的分隔线。',
    showDivider: false,
    titleAlign: 'center',
    width: '360px',
  },
  render: (args) => mountSvelte(MacConfirm, { ...args }),
}

export const WithTrigger: Story = {
  parameters: {
    // 画廊类 story：render 内硬编码展示属性，不消费 args，隐藏无效控件
    controls: { disable: true },
  },
  render: () => {
    const host = document.createElement('div')
    const button = document.createElement('button')
    button.textContent = '打开确认框'
    button.style.cssText =
      'padding:6px 16px;border:0.5px solid rgba(0,0,0,0.12);border-radius:6px;background:rgba(255,255,255,0.8);font-size:13px;cursor:pointer;'
    let opened = false
    button.onclick = () => {
      if (opened) return
      opened = true
      host.appendChild(
        mountSvelte(MacConfirm, {
          visible: true,
          title: '提示',
          content: '这是通过触发按钮打开的确认框。',
        }),
      )
    }
    host.appendChild(button)
    return host
  },
}
