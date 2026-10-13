import type { Meta, StoryObj } from '@storybook/web-components'
import MacDock from './mac-dock.svelte'
import type { DockItemData } from './dock-types'
import { mountSvelte } from '../../../../.storybook/mount-svelte'

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

/** 默认项目数据：彩色占位符（无 iconSrc 时显示首字母色块）。 */
const defaultItems: DockItemData[] = [
  { id: 'finder', label: 'Finder', color: '#0a84ff', running: true },
  { id: 'safari', label: 'Safari', color: '#ff9f0a', running: true },
  { id: 'mail', label: '邮件', color: '#ff375f' },
  { id: 'music', label: '音乐', color: '#bf5af2' },
  { id: 'notes', label: '备忘录', color: '#ffd60a' },
  { id: 'terminal', label: '终端', color: '#30d158', running: true },
  { id: 'settings', label: '系统设置', color: '#8e8e93' },
]

/** 图片图标项目：通过 iconSrc 使用自定义图标。 */
const imageItems: DockItemData[] = [
  { id: 'launchpad', label: '启动台', iconSrc: iconSvg('L', '#ff9f0a', '#ff453a'), running: true },
  { id: 'photos', label: '照片', iconSrc: iconSvg('P', '#0a84ff', '#5e5ce6') },
  { id: 'calendar', label: '日历', iconSrc: iconSvg('C', '#ff375f', '#bf5af2') },
  { id: 'maps', label: '地图', iconSrc: iconSvg('M', '#30d158', '#0a84ff') },
]

/** Dock 需要背景衬托玻璃效果，统一加上内边距。 */
function mountDock(props: Record<string, unknown>): HTMLElement {
  const host = document.createElement('div')
  host.style.padding = '48px 24px'
  host.style.background =
    'linear-gradient(135deg, rgba(10,132,255,0.12), rgba(94,92,230,0.12))'
  host.style.borderRadius = '12px'
  host.appendChild(mountSvelte(MacDock, props))
  return host
}

const meta = {
  title: '组件/Dock 程序坞',
  tags: ['autodocs'],
  args: {
    items: defaultItems,
    magnification: 1.6,
    iconSize: 48,
    magnifyRange: 120,
    position: 'bottom',
  },
  argTypes: {
    items: {
      control: 'object',
      description: '项目数据（id / label / color / iconSrc / running）',
    },
    magnification: { control: 'number', description: '放大比例因子（1.0 = 不放大）' },
    iconSize: { control: 'number', description: '基础图标大小（px）' },
    magnifyRange: { control: 'number', description: '放大范围（px）' },
    position: {
      control: 'inline-radio',
      options: ['bottom', 'left', 'right'],
      description: 'Dock 的位置',
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
  parameters: {
    docs: {
      description: {
        story:
          '默认底部 Dock。悬停时图标按高斯分布放大，点击触发弹跳动画，右键菜单可移除项目，拖拽到 Dock 外也会移除。',
      },
    },
  },
  render: (args) => mountDock({ ...args }),
}

export const StrongMagnification: Story = {
  args: { magnification: 2.2, iconSize: 56, magnifyRange: 160 },
  parameters: {
    docs: { description: { story: '更强的放大效果（magnification 2.2，图标 56px）。' } },
  },
  render: (args) => mountDock({ ...args }),
}

export const NoMagnification: Story = {
  args: { magnification: 1 },
  parameters: {
    docs: { description: { story: '关闭放大效果（magnification: 1）。' } },
  },
  render: (args) => mountDock({ ...args }),
}

export const ImageIcons: Story = {
  args: { items: imageItems },
  parameters: {
    docs: {
      description: {
        story: '使用 iconSrc 数据驱动自定义图片图标（替代默认首字母色块）。',
      },
    },
  },
  render: (args) => mountDock({ ...args }),
}

export const RunningIndicators: Story = {
  args: {
    items: defaultItems.map((item) => ({ ...item, running: true })),
  },
  parameters: {
    docs: { description: { story: '全部项目显示“正在运行”指示点（running: true）。' } },
  },
  render: (args) => mountDock({ ...args }),
}
