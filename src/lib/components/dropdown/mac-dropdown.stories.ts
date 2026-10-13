import type { Meta, StoryObj } from '@storybook/web-components'
import MacDropdown from './mac-dropdown.svelte'
import type { DropdownItem } from './dropdown-types'
import { mountSvelte, html } from '../../../../.storybook/mount-svelte'

/**
 * MacDropdown 下拉菜单故事。
 *
 * 说明：Dropdown 默认不显示菜单，点击触发元素（trigger 插槽）后
 * 在指定位置弹出菜单；支持 click / contextmenu / both 触发模式与悬停打开。
 * items 结构见 dropdown-types.ts 的 DropdownItem。
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
const iconPlus =
  '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>'
const iconFolder =
  '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>'

/** 构造触发元素的 HTML（trigger 插槽内容）。 */
const triggerBtn = (label: string) =>
  `<button style="padding:5px 14px;border:0.5px solid rgba(0,0,0,0.12);border-radius:6px;background:rgba(255,255,255,0.8);font-size:13px;cursor:pointer;">${label}</button>`

/** 基础菜单项：图标 / 快捷键 / 分隔线 / 禁用 / 危险项。 */
const items: DropdownItem[] = [
  { value: 'copy', label: '复制', icon: iconCopy, shortcut: '⌘C' },
  { value: 'paste', label: '粘贴', icon: iconClipboard, shortcut: '⌘V' },
  { value: '', label: '', divider: true },
  { value: 'rename', label: '重命名', icon: iconEdit },
  { value: 'duplicate', label: '创建副本', disabled: true },
  { value: 'delete', label: '删除', icon: iconTrash, danger: true, shortcut: '⌫' },
]

/** 含子菜单的菜单项。 */
const submenuItems: DropdownItem[] = [
  { value: 'new', label: '新建', icon: iconPlus },
  {
    value: 'new-from',
    label: '从模板新建',
    children: [
      { value: 'tpl-blank', label: '空白文档' },
      { value: 'tpl-report', label: '报告模板' },
      { value: 'tpl-todo', label: '待办模板' },
    ],
  },
  { value: '', label: '', divider: true },
  { value: 'open', label: '打开', icon: iconFolder, shortcut: '⌘O' },
  { value: 'delete', label: '删除', icon: iconTrash, danger: true },
]

const meta = {
  title: '组件/Dropdown 下拉菜单',
  tags: ['autodocs'],
  args: {
    items,
    placement: 'bottom-start',
    trigger: 'click',
  },
  argTypes: {
    items: { control: 'object', description: '菜单项（DropdownItem 数组，支持 icon/divider/children 等）' },
    placement: {
      control: 'select',
      options: ['bottom-start', 'bottom-end', 'top-start', 'top-end'],
      description: '下拉菜单位置',
    },
    value: { control: 'text', description: '当前选中值（高亮对应菜单项）' },
    disabled: { control: 'boolean', description: '禁用下拉菜单' },
    openOnHover: { control: 'boolean', description: '悬停时打开下拉菜单' },
    hoverDelay: { control: 'number', description: '悬停延迟（毫秒）' },
    trigger: {
      control: 'inline-radio',
      options: ['click', 'contextmenu', 'both'],
      description: '触发模式',
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
  render: (args) =>
    mountSvelte(MacDropdown, { ...args, triggerSnippet: html(triggerBtn('操作')) }),
}

export const WithSubmenu: Story = {
  args: { items: submenuItems },
  render: (args) =>
    mountSvelte(MacDropdown, { ...args, triggerSnippet: html(triggerBtn('文件')) }),
}

export const ContextMenu: Story = {
  args: { items, trigger: 'contextmenu' },
  render: (args) =>
    mountSvelte(MacDropdown, {
      ...args,
      triggerSnippet: html(
        '<div style="width:100%;max-width:420px;height:180px;border:1px dashed rgba(0,0,0,0.25);border-radius:10px;display:flex;align-items:center;justify-content:center;color:#86868b;font-size:13px;">在此区域右键打开菜单</div>',
      ),
    }),
}

export const Hover: Story = {
  args: { items, openOnHover: true, hoverDelay: 150 },
  render: (args) =>
    mountSvelte(MacDropdown, { ...args, triggerSnippet: html(triggerBtn('悬停打开')) }),
}

export const Disabled: Story = {
  args: { items, disabled: true },
  render: (args) =>
    mountSvelte(MacDropdown, { ...args, triggerSnippet: html(triggerBtn('已禁用')) }),
}
