import type { Meta, StoryObj } from '@storybook/web-components'
import MacNumberAnimation from './mac-number-animation.svelte'
import { mountSvelte, html } from '../../../../.storybook/mount-svelte'

const meta = {
  title: '组件/NumberAnimation 数字动画',
  tags: ['autodocs'],
  args: {
    from: 0,
    to: 2026,
    duration: 2000,
    precision: 0,
    separator: '',
    easing: 'easeOut',
    autoplay: true,
    prefix: '',
    suffix: '',
  },
  argTypes: {
    from: { control: 'number', description: '起始值' },
    to: { control: 'number', description: '动画目标值' },
    duration: { control: 'number', description: '动画时长（毫秒）' },
    precision: { control: 'number', description: '小数位数' },
    separator: { control: 'text', description: '千位分隔符字符（留空则不分割）' },
    easing: {
      control: 'select',
      options: ['linear', 'easeIn', 'easeOut', 'easeInOut'],
      description: '缓动函数名称',
    },
    autoplay: { control: 'boolean', description: '挂载时是否自动开始动画' },
    prefix: { control: 'text', description: '前缀文本（被 prefixSnippet 优先替代）' },
    suffix: { control: 'text', description: '后缀文本（被 suffixSnippet 优先替代）' },
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

/** 默认动画：挂载后从 0 平滑滚动到 2026。 */
export const Basic: Story = {
  render: (args) => mountSvelte(MacNumberAnimation, args),
}

/** 精度与千分位：两位小数 + 逗号分隔；右侧 autoplay 为 false 时直接显示目标值。 */
export const Formatted: Story = {
  render: () => {
    const host = document.createElement('div')
    host.style.display = 'flex'
    host.style.gap = '48px'
    host.style.flexWrap = 'wrap'
    host.style.alignItems = 'baseline'

    const makeCell = (label: string) => {
      const cell = document.createElement('div')
      const caption = document.createElement('div')
      caption.textContent = label
      caption.style.marginBottom = '8px'
      caption.style.fontSize = '13px'
      caption.style.color = 'var(--md-color-text-secondary)'
      cell.appendChild(caption)
      return cell
    }

    const animCell = makeCell('precision: 2 · separator: ","')
    animCell.appendChild(
      mountSvelte(MacNumberAnimation, {
        from: 0,
        to: 1234567.891,
        duration: 2500,
        precision: 2,
        separator: ',',
      }),
    )
    host.appendChild(animCell)

    const staticCell = makeCell('autoplay: false（直接显示目标值）')
    staticCell.appendChild(
      mountSvelte(MacNumberAnimation, {
        autoplay: false,
        to: 9876.54,
        precision: 2,
        separator: ',',
      }),
    )
    host.appendChild(staticCell)

    return host
  },
}

/** 前后缀：prefix/suffix 文本属性与 prefixSnippet/suffixSnippet 插槽并排展示。 */
export const PrefixSuffix: Story = {
  render: () => {
    const host = document.createElement('div')
    host.style.display = 'flex'
    host.style.gap = '48px'
    host.style.flexWrap = 'wrap'
    host.style.alignItems = 'baseline'

    const makeCell = (label: string) => {
      const cell = document.createElement('div')
      const caption = document.createElement('div')
      caption.textContent = label
      caption.style.marginBottom = '8px'
      caption.style.fontSize = '13px'
      caption.style.color = 'var(--md-color-text-secondary)'
      cell.appendChild(caption)
      return cell
    }

    const textCell = makeCell('prefix / suffix 文本属性')
    textCell.appendChild(
      mountSvelte(MacNumberAnimation, {
        from: 0,
        to: 8888,
        duration: 2000,
        separator: ',',
        prefix: '¥',
        suffix: '元',
      }),
    )
    host.appendChild(textCell)

    const snippetCell = makeCell('prefixSnippet / suffixSnippet 插槽')
    snippetCell.appendChild(
      mountSvelte(MacNumberAnimation, {
        from: 0,
        to: 99.9,
        duration: 2000,
        precision: 1,
        prefixSnippet: html('<span style="font-weight: 600;">$</span>'),
        suffixSnippet: html('<span style="font-size: 14px;">分</span>'),
      }),
    )
    host.appendChild(snippetCell)

    return host
  },
}

/** 缓动函数：linear / easeIn / easeOut / easeInOut 并排对比。 */
export const Easings: Story = {
  render: () => {
    const host = document.createElement('div')
    host.style.display = 'flex'
    host.style.gap = '32px'
    host.style.flexWrap = 'wrap'
    host.style.alignItems = 'baseline'

    for (const easing of ['linear', 'easeIn', 'easeOut', 'easeInOut'] as const) {
      const cell = document.createElement('div')
      const caption = document.createElement('div')
      caption.textContent = easing
      caption.style.marginBottom = '8px'
      caption.style.fontSize = '13px'
      caption.style.color = 'var(--md-color-text-secondary)'
      cell.appendChild(caption)
      cell.appendChild(
        mountSvelte(MacNumberAnimation, {
          from: 0,
          to: 100,
          duration: 2000,
          easing,
          size: 'sm',
        }),
      )
      host.appendChild(cell)
    }
    return host
  },
}

/** 尺寸：sm / md / lg 并排展示。 */
export const Sizes: Story = {
  render: () => {
    const host = document.createElement('div')
    host.style.display = 'flex'
    host.style.gap = '32px'
    host.style.flexWrap = 'wrap'
    host.style.alignItems = 'baseline'

    for (const size of ['sm', 'md', 'lg'] as const) {
      const cell = document.createElement('div')
      const caption = document.createElement('div')
      caption.textContent = `${size} 尺寸`
      caption.style.marginBottom = '8px'
      caption.style.fontSize = '13px'
      caption.style.color = 'var(--md-color-text-secondary)'
      cell.appendChild(caption)
      cell.appendChild(mountSvelte(MacNumberAnimation, { to: 2026, duration: 2000, size }))
      host.appendChild(cell)
    }
    return host
  },
}
