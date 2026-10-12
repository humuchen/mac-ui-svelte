import { describe, expect, it, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/svelte'
import MacProgress from './mac-progress.svelte'

afterEach(cleanup)

describe('MacProgress（Svelte 版）', () => {
  it('默认属性渲染：line 类型 / md 尺寸 / 显示百分比文本', () => {
    const { container } = render(MacProgress, { props: { percentage: 40 } })
    const root = container.querySelector<HTMLElement>('.mac-progress')!
    const fill = root.querySelector<HTMLElement>('.progress-line__fill')!
    expect(root.className).toContain('mac-progress')
    expect(root.querySelector('.progress-line--md')).toBeTruthy()
    expect(fill.style.width).toBe('40%')
    expect(root.querySelector('.progress-line__text')?.textContent).toBe('40%')
  })

  it('百分比钳制在 0-100 范围', () => {
    const { container, rerender } = render(MacProgress, { props: { percentage: 150 } })
    let fill = container.querySelector<HTMLElement>('.progress-line__fill')!
    expect(fill.style.width).toBe('100%')
    rerender({ percentage: -20 })
    fill = container.querySelector<HTMLElement>('.progress-line__fill')!
    expect(fill.style.width).toBe('0%')
  })

  it('属性绑定响应：type=circle / status / strokeWidth / width', () => {
    const { container } = render(MacProgress, {
      props: { type: 'circle', status: 'success', strokeWidth: 8, width: 100, percentage: 50 },
    })
    const root = container.querySelector<HTMLElement>('.mac-progress')!
    expect(root.querySelector('.progress-circle')).toBeTruthy()
    expect(root.querySelector('.progress-circle__fill--success')).toBeTruthy()
    const svg = root.querySelector('svg')!
    expect(svg.getAttribute('width')).toBe('100')
    const fillCircle = root.querySelectorAll('circle')[1] as SVGCircleElement
    expect(fillCircle.getAttribute('stroke-width')).toBe('8')
  })

  it('processing 状态隐藏文本并显示处理动画类', () => {
    const { container } = render(MacProgress, { props: { processing: true } })
    const root = container.querySelector<HTMLElement>('.mac-progress')!
    expect(root.querySelector('.progress-line__text')).toBeNull()
    expect(root.querySelector('.progress-line__fill--processing')).toBeTruthy()
  })

  it('自定义 color 覆盖填充颜色', () => {
    const { container } = render(MacProgress, { props: { color: '#ff0000' } })
    const fill = container.querySelector<HTMLElement>('.progress-line__fill')!
    expect(fill.style.backgroundColor).toContain('255, 0, 0')
  })

  it('多环 circles 渲染多组圆环', () => {
    const { container } = render(MacProgress, {
      props: {
        type: 'circle',
        circles: [
          { percentage: 80, color: '#007aff' },
          { percentage: 40, color: '#34c759' },
        ],
      },
    })
    const root = container.querySelector<HTMLElement>('.mac-progress')!
    expect(root.querySelectorAll('circle').length).toBe(4)
  })
})
