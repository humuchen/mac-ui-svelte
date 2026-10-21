import type { Meta, StoryObj } from '@storybook/web-components'
import MacMenu from './mac-menu.svelte'
import type { MenuItem } from './menu-types'
import { mountSvelte } from '../../../../.storybook/mount-svelte'

/**
 * MacMenu 菜单故事。
 *
 * 说明：Menu 为独立菜单组件，默认不可见（visible=false），
 * 通过受控属性 visible + x/y 在指定位置展示；本文件中各 story 默认以
 * visible=true 展示内容，ContextMenu 演示"关闭态 + 右键触发区域"的常见用法。
 * items 结构见 menu-types.ts 的 MenuItem。
 */

// ─── 菜单项图标（内联 SVG，通过 item.icon 以 HTML 字符串传入） ───

const iconCopy =
  '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>'
const iconClipboard =
  '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>'
const iconEdit =
  '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>'
const iconTrash =
  '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>'

/** 完整菜单项：图标 / 快捷键 / 分隔线 / 危险项。 */
const items: MenuItem[] = [
  { value: 'copy', label: '复制', icon: iconCopy, shortcut: '⌘C' },
  { value: 'paste', label: '粘贴', icon: iconClipboard, shortcut: '⌘V' },
  { divider: true },
  { value: 'rename', label: '重命名', icon: iconEdit },
  { value: 'delete', label: '删除', icon: iconTrash, danger: true },
]

/** 含禁用项的菜单项。 */
const disabledItems: MenuItem[] = [
  { value: 'copy', label: '复制', shortcut: '⌘C' },
  { value: 'paste', label: '粘贴（不可用）', disabled: true },
  { divider: true },
  { value: 'delete', label: '删除', danger: true },
]

const meta = {
  title: '组件/Menu 菜单',
  tags: ['autodocs'],
  args: {
    items,
    visible: false,
    value: '',
    x: 120,
    y: 120,
  },
  argTypes: {
    items: { control: 'object', description: '菜单项（MenuItem 数组，支持 icon/shortcut/divider 等）' },
    value: { control: 'text', description: '当前选中值（高亮对应菜单项）' },
    visible: { control: 'boolean', description: '菜单是否可见（受控属性）' },
    x: { control: 'number', description: '菜单显示位置 x 坐标' },
    y: { control: 'number', description: '菜单显示位置 y 坐标' },
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
  render: (args) => mountSvelte(MacMenu, { ...args }),
}

export const WithActive: Story = {
  args: { visible: true, value: 'copy' },
  render: (args) => mountSvelte(MacMenu, { ...args }),
}

export const WithDisabledItem: Story = {
  args: { visible: true, items: disabledItems },
  render: (args) => mountSvelte(MacMenu, { ...args }),
}

export const ContextMenu: Story = {
  parameters: {
    // 画廊类 story：render 内硬编码展示属性，不消费 args，隐藏无效控件
    controls: { disable: true },
  },
  render: () => {
    const host = document.createElement('div')
    const area = document.createElement('div')
    area.textContent = '在此区域右键打开菜单'
    area.style.cssText =
      'width:100%;max-width:420px;height:180px;border:1px dashed rgba(0,0,0,0.25);border-radius:10px;display:flex;align-items:center;justify-content:center;color:#86868b;font-size:13px;user-select:none;'
    // 右键时在光标位置挂载一个可见的 Menu（visible + x/y 受控）
    area.addEventListener('contextmenu', (e) => {
      e.preventDefault()
      host.appendChild(
        mountSvelte(MacMenu, { items, visible: true, x: e.clientX, y: e.clientY }),
      )
    })
    host.appendChild(area)
    return host
  },
}
