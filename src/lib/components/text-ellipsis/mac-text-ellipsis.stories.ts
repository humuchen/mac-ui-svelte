import type { Meta, StoryObj } from '@storybook/web-components'
import MacTextEllipsis from './mac-text-ellipsis.svelte'
import { mountSvelte, text, html } from '../../../../.storybook/mount-svelte'

/** 演示用的长文本（超出容器高度以触发省略）。 */
const longText =
  'macOS 风格的文本省略组件，支持通过 lineClamp 限制显示行数。当文本内容超出限制时，' +
  '组件会自动截断并在末尾显示省略号；悬停时还可以通过 tooltip 查看完整内容，' +
  '也可以将 expandTrigger 设置为 click，让用户点击文本自行展开或收起。' +
  '这段文字故意写得足够长，以便在多行截断时观察省略效果。'

const meta = {
  title: '组件/TextEllipsis 文本省略',
  tags: ['autodocs'],
  args: {
    children: longText,
    lineClamp: 3,
    expandTrigger: 'none',
    tooltip: false,
    style: 'max-width: 480px',
  },
  argTypes: {
    children: { control: 'text', description: '文本内容' },
    lineClamp: { control: 'number', description: '截断前显示的最大行数' },
    expandTrigger: {
      control: 'inline-radio',
      options: ['click', 'none'],
      description: "如何触发展开：'click' 显示展开链接，'none' 禁用展开",
    },
    expanded: { control: 'boolean', description: '文本当前是否已展开' },
    tooltip: { control: 'boolean', description: '文本被截断时悬停是否显示提示框' },
    size: {
      control: 'inline-radio',
      options: ['sm', 'md', 'lg'],
      description: '组件尺寸（默认继承 ConfigProvider，否则 md）',
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

/** 默认 3 行省略：文本超出时截断并显示省略号。 */
export const Basic: Story = {
  render: (args) =>
    mountSvelte(MacTextEllipsis, { ...args, children: text(String(args.children ?? '')) }),
}

/** 行数控制：1 / 2 / 3 / 5 行并排展示。 */
export const LineClamp: Story = {
  render: () => {
    const host = document.createElement('div')
    host.style.display = 'flex'
    host.style.gap = '24px'
    host.style.flexWrap = 'wrap'
    host.style.alignItems = 'flex-start'

    for (const lineClamp of [1, 2, 3, 5]) {
      const cell = document.createElement('div')
      cell.style.width = '220px'
      const caption = document.createElement('div')
      caption.textContent = `${lineClamp} 行`
      caption.style.marginBottom = '8px'
      caption.style.fontSize = '13px'
      caption.style.color = 'var(--md-color-text-secondary)'
      cell.appendChild(caption)
      cell.appendChild(
        mountSvelte(MacTextEllipsis, { lineClamp, children: text(longText) }),
      )
      host.appendChild(cell)
    }
    return host
  },
}

/** 点击展开：expandTrigger 为 click 时，文本被截断后点击可展开/收起。 */
export const ClickToExpand: Story = {
  args: { expandTrigger: 'click', lineClamp: 2 },
  render: (args) =>
    mountSvelte(MacTextEllipsis, { ...args, children: text(String(args.children ?? '')) }),
}

/** 悬停提示：tooltip 为 true 时截断文本悬停显示完整内容；右侧为自定义提示内容。 */
export const Tooltip: Story = {
  render: () => {
    const host = document.createElement('div')
    host.style.display = 'flex'
    host.style.gap = '32px'
    host.style.flexWrap = 'wrap'
    host.style.alignItems = 'flex-start'

    const makeCell = (label: string) => {
      const cell = document.createElement('div')
      cell.style.width = '320px'
      const caption = document.createElement('div')
      caption.textContent = label
      caption.style.marginBottom = '8px'
      caption.style.fontSize = '13px'
      caption.style.color = 'var(--md-color-text-secondary)'
      cell.appendChild(caption)
      return cell
    }

    const plainCell = makeCell('tooltip: true（悬停显示完整文本）')
    plainCell.appendChild(
      mountSvelte(MacTextEllipsis, { tooltip: true, lineClamp: 2, children: text(longText) }),
    )
    host.appendChild(plainCell)

    const customCell = makeCell('tooltipSnippet（自定义提示内容）')
    customCell.appendChild(
      mountSvelte(MacTextEllipsis, {
        tooltip: true,
        lineClamp: 2,
        children: text(longText),
        tooltipSnippet: html(
          '<div style="font-weight: 600;">自定义提示框</div><div style="opacity: 0.8; margin-top: 4px;">可放入任意 HTML 内容</div>',
        ),
      }),
    )
    host.appendChild(customCell)

    return host
  },
}
