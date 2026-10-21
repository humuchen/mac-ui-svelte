import type { Meta, StoryObj } from '@storybook/web-components'
import MacDrawer from './mac-drawer.svelte'
import { mountSvelte, text, html } from '../../../../.storybook/mount-svelte'

/**
 * MacDrawer 抽屉故事。
 *
 * 说明：Drawer 为浮层组件，默认关闭（open=false），
 * 通过受控属性 open 打开；本文件中各 story 默认以 open=true 展示内容。
 * WithTrigger 演示"关闭态 + 触发按钮"的常见用法。
 */

/** 抽屉底部操作按钮（footer 插槽内容）。 */
const footerActions = html(
  '<button style="padding:5px 14px;border:0.5px solid rgba(0,0,0,0.12);border-radius:6px;background:rgba(255,255,255,0.8);font-size:13px;cursor:pointer;">取消</button>' +
    '<button style="padding:5px 14px;border:none;border-radius:6px;background:rgba(0,122,255,0.88);color:#fff;font-size:13px;cursor:pointer;">保存</button>',
)

const meta = {
  title: '组件/Drawer 抽屉',
  tags: ['autodocs'],
  args: {
    open: false,
    title: '抽屉标题',
    width: '360px',
    height: '360px',
    closable: true,
    maskClosable: true,
    closeOnEsc: true,
    resizable: false,
    children: '这是抽屉的内容。',
  },
  argTypes: {
    open: { control: 'boolean', description: '抽屉是否打开（受控属性）' },
    placement: {
      control: 'select',
      options: ['right', 'left', 'top', 'bottom'],
      description: '抽屉放置方向',
    },
    title: { control: 'text', description: '抽屉标题' },
    width: { control: 'text', description: '宽度（左/右放置时生效，如 360px）' },
    height: { control: 'text', description: '高度（上/下放置时生效，如 360px）' },
    closable: { control: 'boolean', description: '是否显示关闭按钮' },
    maskClosable: { control: 'boolean', description: '点击遮罩是否关闭抽屉' },
    showMask: {
      control: 'inline-radio',
      options: [true, false, 'transparent'],
      description: '遮罩层：显示 / 不显示 / 透明',
    },
    closeOnEsc: { control: 'boolean', description: '按 ESC 键是否关闭抽屉' },
    resizable: { control: 'boolean', description: '抽屉是否可调整大小' },
    theme: {
      control: 'inline-radio',
      options: ['light', 'dark'],
      description: '组件级主题覆盖',
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Right: Story = {
  args: { open: true, title: '通知中心' },
  render: (args) =>
    mountSvelte(MacDrawer, {
      ...args,
      children: text(String(args.children ?? '')),
      footer: footerActions,
    }),
}

export const Left: Story = {
  args: { open: true, placement: 'left', title: '导航抽屉', width: '300px' },
  render: (args) => mountSvelte(MacDrawer, { ...args, children: text(String(args.children ?? '')) }),
}

export const Top: Story = {
  args: { open: true, placement: 'top', title: '顶部抽屉', height: '240px' },
  render: (args) => mountSvelte(MacDrawer, { ...args, children: text(String(args.children ?? '')) }),
}

export const Resizable: Story = {
  args: { open: true, resizable: true, title: '可调整大小', width: '420px' },
  render: (args) => mountSvelte(MacDrawer, { ...args, children: text(String(args.children ?? '')) }),
}

export const WithTrigger: Story = {
  render: () => {
    const host = document.createElement('div')
    const button = document.createElement('button')
    button.textContent = '打开抽屉'
    button.style.cssText =
      'padding:6px 16px;border:0.5px solid rgba(0,0,0,0.12);border-radius:6px;background:rgba(255,255,255,0.8);font-size:13px;cursor:pointer;'
    let opened = false
    button.onclick = () => {
      if (opened) return
      opened = true
      host.appendChild(
        mountSvelte(MacDrawer, {
          open: true,
          title: '详情',
          children: text('这是通过触发按钮打开的抽屉，可通过遮罩 / 关闭按钮 / ESC 关闭。'),
          footer: footerActions,
        }),
      )
    }
    host.appendChild(button)
    return host
  },
}
