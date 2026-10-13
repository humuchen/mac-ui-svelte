import type { Meta, StoryObj } from '@storybook/web-components'
import MacDesktop from './mac-desktop.svelte'
import type { DesktopIconData } from './desktop-types'
import { mountSvelte } from '../../../../.storybook/mount-svelte'

/** 生成 data URI SVG 占位图标（带字母的圆角方块）。 */
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

/** 渐变壁纸（data URI SVG，避免外链图片依赖）。 */
const wallpaperSvg =
  `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900">` +
  `<defs><linearGradient id="w" x1="0" y1="0" x2="1" y2="1">` +
  `<stop offset="0" stop-color="#0a84ff"/><stop offset="0.55" stop-color="#5e5ce6"/>` +
  `<stop offset="1" stop-color="#bf5af2"/></linearGradient></defs>` +
  `<rect width="1600" height="900" fill="url(#w)"/></svg>`
const wallpaper = `data:image/svg+xml,${encodeURIComponent(wallpaperSvg)}`

/** 默认图标数据：彩色占位符（无 iconSrc 时显示首字母色块）。 */
const defaultIcons: DesktopIconData[] = [
  { id: 'finder', label: 'Finder', color: '#0a84ff' },
  { id: 'safari', label: 'Safari', color: '#ff9f0a' },
  { id: 'mail', label: '邮件', color: '#ff375f' },
  { id: 'music', label: '音乐', color: '#bf5af2' },
  { id: 'notes', label: '备忘录', color: '#ffd60a' },
  { id: 'terminal', label: '终端', color: '#30d158' },
  { id: 'settings', label: '系统设置', color: '#8e8e93' },
  { id: 'trash', label: '废纸篓', color: '#636366' },
]

/** 图片图标数据：通过 iconSrc 使用自定义图标。 */
const imageIcons: DesktopIconData[] = [
  { id: 'launchpad', label: '启动台', iconSrc: iconSvg('L', '#ff9f0a', '#ff453a') },
  { id: 'photos', label: '照片', iconSrc: iconSvg('P', '#0a84ff', '#5e5ce6') },
  { id: 'calendar', label: '日历', iconSrc: iconSvg('C', '#ff375f', '#bf5af2') },
  { id: 'maps', label: '地图', iconSrc: iconSvg('M', '#30d158', '#0a84ff') },
]

/** 桌面需要确定高度，统一包装 480px 高的宿主容器。 */
function mountDesktop(props: Record<string, unknown>): HTMLElement {
  const host = mountSvelte(MacDesktop, props)
  host.style.height = '480px'
  host.style.borderRadius = '12px'
  host.style.overflow = 'hidden'
  return host
}

const meta = {
  title: '组件/Desktop 桌面',
  tags: ['autodocs'],
  args: {
    icons: defaultIcons,
    layout: 'vertical',
    cellSize: 90,
    spacing: 8,
    padding: 16,
    wallpaper: '',
    showDock: true,
  },
  argTypes: {
    layout: {
      control: 'inline-radio',
      options: ['vertical', 'horizontal'],
      description: '图标排列方向（也可通过右键菜单切换）',
    },
    cellSize: { control: 'number', description: '网格单元大小（px）' },
    spacing: { control: 'number', description: '网格间距（px）' },
    padding: { control: 'number', description: '桌面边缘内边距（px）' },
    wallpaper: { control: 'text', description: '壁纸图片 URL' },
    showDock: { control: 'boolean', description: '是否显示 Dock 区域' },
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
          '默认垂直排列的桌面图标。单击选中、拖拽移动、右键弹出上下文菜单（排列方式 / 整理 / 全选），底部为 Dock 区域。',
      },
    },
  },
  render: (args) => mountDesktop({ ...args }),
}

export const HorizontalLayout: Story = {
  args: { layout: 'horizontal' },
  parameters: {
    docs: { description: { story: '水平排列的图标布局（按行填充）。' } },
  },
  render: (args) => mountDesktop({ ...args }),
}

export const WithWallpaper: Story = {
  args: { wallpaper },
  parameters: {
    docs: { description: { story: '带渐变壁纸的桌面（data URI SVG）。' } },
  },
  render: (args) => mountDesktop({ ...args }),
}

export const NoDock: Story = {
  args: { showDock: false },
  parameters: {
    docs: { description: { story: '隐藏底部 Dock 区域的桌面。' } },
  },
  render: (args) => mountDesktop({ ...args }),
}

export const ImageIcons: Story = {
  args: { icons: imageIcons },
  parameters: {
    docs: {
      description: {
        story: '使用 iconSrc 数据驱动自定义图片图标（替代默认首字母色块）。',
      },
    },
  },
  render: (args) => mountDesktop({ ...args }),
}
