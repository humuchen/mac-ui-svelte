import type { Meta, StoryObj } from '@storybook/web-components'
import MacCarousel from './mac-carousel.svelte'
import CarouselDemo from '../../../../.storybook/demos/carousel-demo.svelte'
import { mountSvelte } from '../../../../.storybook/mount-svelte'

const meta = {
  title: '组件/Carousel 轮播',
  tags: ['autodocs'],
  args: {
    defaultIndex: 0,
    autoplay: false,
    interval: 5000,
    loop: true,
    direction: 'horizontal',
    effect: 'slide',
    slidesPerView: 1,
    showArrow: true,
    showDots: true,
    dotType: 'dot',
    dotPosition: 'bottom',
    draggable: false,
    keyboard: false,
    wheel: false,
    transitionDuration: 300,
  },
  argTypes: {
    defaultIndex: { control: 'number', description: '默认激活的幻灯片索引（非受控模式）' },
    autoplay: { control: 'boolean', description: '是否自动播放' },
    interval: { control: 'number', description: '自动播放间隔（毫秒）' },
    loop: { control: 'boolean', description: '是否循环播放' },
    direction: {
      control: 'inline-radio',
      options: ['horizontal', 'vertical'],
      description: '滑动方向',
    },
    effect: {
      control: 'select',
      options: ['slide', 'fade', 'custom'],
      description: '过渡效果',
    },
    slidesPerView: { control: 'number', description: '每次显示的幻灯片数量' },
    showArrow: { control: 'boolean', description: '是否显示导航箭头' },
    showDots: { control: 'boolean', description: '是否显示指示器圆点' },
    dotType: {
      control: 'inline-radio',
      options: ['dot', 'line'],
      description: '指示器圆点样式',
    },
    dotPosition: {
      control: 'select',
      options: ['top', 'bottom', 'left', 'right'],
      description: '指示器圆点的位置',
    },
    draggable: { control: 'boolean', description: '轮播是否可拖拽' },
    keyboard: { control: 'boolean', description: '是否支持键盘导航（方向键）' },
    wheel: { control: 'boolean', description: '是否支持鼠标滚轮导航' },
    transitionDuration: { control: 'number', description: '幻灯片过渡时长（毫秒）' },
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

/** 所有 story 均通过演示包装组件 CarouselDemo 渲染（3 张渐变幻灯片）。 */
export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '基础轮播：slide 过渡、左右箭头与底部圆点指示器。可通过箭头 / 圆点切换幻灯片，当前索引变化时派发 mac-carousel-change 事件。',
      },
    },
  },
  render: (args) => mountSvelte(CarouselDemo, args),
}

export const Compact: Story = {
  parameters: {
    docs: { description: { story: '窄容器中的轮播布局（max-width 560px，居中）。' } },
  },
  render: (args) => {
    const wrapper = document.createElement('div')
    wrapper.style.maxWidth = '560px'
    wrapper.style.margin = '0 auto'
    wrapper.appendChild(mountSvelte(CarouselDemo, args))
    return wrapper
  },
}
