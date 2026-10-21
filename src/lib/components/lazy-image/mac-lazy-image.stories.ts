import type { Meta, StoryObj } from '@storybook/web-components'
import MacLazyImage from './mac-lazy-image.svelte'
import { html, mountSvelte } from '../../../../.storybook/mount-svelte'

/** 缩小的模糊占位图（data URI SVG，模拟渐进式加载的低清图）。 */
const blurPlaceholder =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="32">` +
      `<rect width="48" height="32" fill="#c7d2e0"/>` +
      `<circle cx="34" cy="9" r="4" fill="#e8eef5"/>` +
      `<path d="M0 32 L16 14 L28 26 L38 18 L48 32 Z" fill="#aebccd"/>` +
      `</svg>`,
  )

/** 一张可加载的示例图片（占位图服务）。 */
const sampleSrc = 'https://picsum.photos/seed/mac-ui/480/320'

const meta = {
  title: '组件/LazyImage 图片懒加载',
  tags: ['autodocs'],
  args: {
    src: sampleSrc,
    alt: '示例图片',
    width: '480px',
    height: '320px',
    objectFit: 'cover',
    rootMargin: '0px',
    threshold: 0,
    preview: false,
    previewSrc: '',
  },
  argTypes: {
    src: { control: 'text', description: '图片源地址' },
    alt: { control: 'text', description: '图片替代文本' },
    width: { control: 'text', description: '图片宽度' },
    height: { control: 'text', description: '图片高度' },
    objectFit: {
      control: 'select',
      options: ['cover', 'contain', 'fill', 'none', 'scale-down'],
      description: 'CSS object-fit 值',
    },
    placeholder: { control: 'text', description: '加载时显示的占位图片地址' },
    rootMargin: { control: 'text', description: 'IntersectionObserver 的 rootMargin' },
    threshold: { control: 'number', description: 'IntersectionObserver 的 threshold' },
    preview: { control: 'boolean', description: '是否启用点击预览' },
    previewSrc: { control: 'text', description: '预览模式的图片地址（默认回退到 src）' },
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
          '基础懒加载：图片进入视口后才开始加载，加载完成前显示 shimmer 占位（本 story 在视口内会立即触发加载）。',
      },
    },
  },
  render: (args) => mountSvelte(MacLazyImage, { ...args }),
}

export const WithPlaceholder: Story = {
  args: { placeholder: blurPlaceholder },
  parameters: {
    docs: {
      description: { story: '加载期间显示低清占位图（placeholder 属性，渐进式加载效果）。' },
    },
  },
  render: (args) => mountSvelte(MacLazyImage, { ...args }),
}

export const CustomPlaceholder: Story = {
  parameters: {
    // 画廊类 story：render 内硬编码展示属性，不消费 args，隐藏无效控件
    controls: { disable: true },
    docs: {
      description: { story: '通过 placeholderSnippet 自定义加载占位内容。' },
    },
  },
  render: () =>
    mountSvelte(MacLazyImage, {
      src: sampleSrc,
      alt: '自定义占位',
      width: '480px',
      height: '320px',
      placeholderSnippet: html(
        `<div style="display:flex;height:100%;align-items:center;justify-content:center;` +
          `font-size:14px;color:#8a94a6;background:#eef1f6;">正在加载图片…</div>`,
      ),
    }),
}

export const ErrorState: Story = {
  parameters: {
    // 画廊类 story：render 内硬编码展示属性，不消费 args，隐藏无效控件
    controls: { disable: true },
    docs: {
      description: {
        story: '加载失败时显示错误占位（此处 src 故意指向不存在的图片），并通过 errorSnippet 自定义错误内容。',
      },
    },
  },
  render: () =>
    mountSvelte(MacLazyImage, {
      src: './does-not-exist.png',
      alt: '加载失败',
      width: '480px',
      height: '320px',
      errorSnippet: html(
        `<div style="display:flex;height:100%;flex-direction:column;align-items:center;` +
          `justify-content:center;gap:8px;font-size:14px;color:#8a94a6;background:#eef1f6;">` +
          `<span style="font-size:24px;">⚠</span><span>图片加载失败</span></div>`,
      ),
    }),
}

export const Preview: Story = {
  args: { preview: true },
  parameters: {
    docs: {
      description: {
        story: '点击预览：图片加载完成后点击打开全屏预览遮罩，按 Esc 或点击背景关闭。',
      },
    },
  },
  render: (args) => mountSvelte(MacLazyImage, { ...args }),
}
