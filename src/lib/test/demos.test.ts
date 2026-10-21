/**
 * Storybook Demo 包装组件透传验证。
 *
 * 背景：Form / Carousel 的 stories 曾通过 Demo 包装组件渲染但未透传 args，
 * 导致 Controls 面板全部控件失效。修复后 Demo 需将 props 透传给内部组件，
 * 本测试锁定该透传行为，防止回归。
 */
import { describe, expect, it, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/svelte'
import FormDemo from '$demos/form-demo.svelte'
import CarouselDemo from '$demos/carousel-demo.svelte'

afterEach(cleanup)

describe('form-demo.svelte（Form stories 包装组件）', () => {
  it('透传 labelWidth / labelAlign 到 MacForm CSS 变量', () => {
    const { container } = render(FormDemo, {
      props: { labelWidth: '120px', labelAlign: 'left' },
    })
    const form = container.querySelector<HTMLElement>('.mac-form')!
    expect(form).toBeTruthy()
    expect(form.style.getPropertyValue('--md-form-label-width')).toBe('120px')
    expect(form.style.getPropertyValue('--md-form-label-align')).toBe('left')
  })

  it('透传 disabled 到全部表单项', () => {
    const { container } = render(FormDemo, { props: { disabled: true } })
    const inputs = container.querySelectorAll('input')
    expect(inputs.length).toBeGreaterThan(0)
    for (const input of inputs) {
      expect((input as HTMLInputElement).disabled).toBe(true)
    }
  })

  it('showLabel=false 时隐藏标签', () => {
    const { container } = render(FormDemo, { props: { showLabel: false } })
    expect(container.querySelector('.form-label')).toBeNull()
  })
})

describe('carousel-demo.svelte（Carousel stories 包装组件）', () => {
  it('默认渲染水平方向（与原硬编码演示一致）', () => {
    const { container } = render(CarouselDemo, { props: {} })
    const root = container.querySelector<HTMLElement>('.mac-carousel')!
    expect(root).toBeTruthy()
    expect(root.getAttribute('data-direction')).toBe('horizontal')
    // 渲染 3 张演示幻灯片
    expect(container.querySelectorAll('.mac-carousel-item').length).toBe(3)
  })

  it('透传 direction / effect 等属性到 MacCarousel', () => {
    const { container } = render(CarouselDemo, { props: { direction: 'vertical' } })
    const root = container.querySelector<HTMLElement>('.mac-carousel')!
    expect(root.getAttribute('data-direction')).toBe('vertical')
  })
})
