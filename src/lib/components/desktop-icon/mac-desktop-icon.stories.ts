import type { Meta, StoryObj } from '@storybook/web-components'
import MacDesktopIcon from './mac-desktop-icon.svelte'
import { html, mountSvelte } from '../../../../.storybook/mount-svelte'

/** 生成 data URI SVG 占位图标（渐变圆角方块 + 字母）。 */
function iconSvg(letter: string, from: string, to: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>` +
    `</linearGradient></defs>` +
    `<rect width="128" height="128" rx="28" fill="url(#g)"/>` +
    `<text x="64" y="88" font-family="-apple-system, 'PingFang SC', sans-serif" ` +
    `font-size="60" font-weight="600" fill="#ffffff" text-anchor="middle">${letter}</text>` +
    `</svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

const imageIcon = iconSvg('P', '#0a84ff', '#5e5ce6')

/** 图标为绝对定位，统一包装 relative 宿主容器。 */
function mountIcon(props: Record<string, unknown>, height = 120): HTMLElement {
  const host = mountSvelte(MacDesktopIcon, props)
  host.style.position = 'relative'
  host.style.height = `${height}px`
  host.style.width = '100%'
  return host
}

/** 在 relative 宿主中按间距水平排列多个图标。 */
function mountIconRow(
  list: { label: string; color: string; selected?: boolean; dragging?: boolean; children?: unknown }[],
  gap = 110,
): HTMLElement {
  const host = document.createElement('div')
  host.style.position = 'relative'
  host.style.height = '120px'
  host.style.width = '100%'
  list.forEach((item, i) => {
    host.appendChild(
      mountSvelte(MacDesktopIcon, {
        label: item.label,
        color: item.color,
        x: i * gap,
        y: 0,
        selected: item.selected ?? false,
        dragging: item.dragging ?? false,
        ...(item.children ? { children: item.children } : {}),
      }),
    )
  })
  return host
}

const meta = {
  title: '组件/DesktopIcon 桌面图标',
  tags: ['autodocs'],
  args: {
    label: 'Finder',
    iconId: 'finder',
    selected: false,
    dragging: false,
    x: 0,
    y: 0,
    color: '#007AFF',
  },
  argTypes: {
    label: { control: 'text', description: '图标标签文本' },
    iconId: { control: 'text', description: '图标标识符（未指定时自动生成）' },
    selected: { control: 'boolean', description: '图标是否被选中' },
    dragging: { control: 'boolean', description: '图标是否正在被拖拽' },
    x: { control: 'number', description: '图标 X 坐标（px）' },
    y: { control: 'number', description: '图标 Y 坐标（px）' },
    color: { control: 'color', description: '默认占位图标的颜色' },
    theme: {
      control: 'inline-radio',
      options: ['light', 'dark'],
      description: '组件级主题覆盖',
    },
    size: {
      control: 'inline-radio',
      options: ['sm', 'md', 'lg'],
      description: '组件尺寸（默认继承 ConfigProvider，否则 md）',
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: '默认占位图标：显示 color 色块与标签首字母。双击会派发 mac-icon-dblclick 事件。',
      },
    },
  },
  render: (args) => mountIcon({ ...args }),
}

export const Colors: Story = {
  parameters: {
    docs: { description: { story: '不同颜色的占位图标。' } },
  },
  render: () =>
    mountIconRow([
      { label: 'Safari', color: '#0a84ff' },
      { label: '邮件', color: '#ff375f' },
      { label: '音乐', color: '#bf5af2' },
      { label: '终端', color: '#30d158' },
      { label: '日历', color: '#ff9f0a' },
    ]),
}

export const WithImage: Story = {
  parameters: {
    docs: {
      description: { story: '通过默认 slot 传入自定义图片内容（data URI SVG）。' },
    },
  },
  render: () => mountIconRow([{ label: '照片', color: '#0a84ff', children: html(`<img src="${imageIcon}" alt="照片" />`) }]),
}

export const Selected: Story = {
  parameters: {
    docs: { description: { story: '选中状态对比（左：选中；右：未选中）。' } },
  },
  render: () =>
    mountIconRow([
      { label: 'Finder', color: '#0a84ff', selected: true },
      { label: 'Safari', color: '#ff9f0a' },
    ]),
}

export const Dragging: Story = {
  parameters: {
    docs: { description: { story: '拖拽状态对比（左：拖拽中；右：未选中）。' } },
  },
  render: () =>
    mountIconRow([
      { label: 'Finder', color: '#0a84ff', dragging: true },
      { label: 'Safari', color: '#ff9f0a' },
    ]),
}
