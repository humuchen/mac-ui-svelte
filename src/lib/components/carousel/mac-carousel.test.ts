import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/svelte'
import CarouselFixture from './carousel.fixture.svelte'

afterEach(cleanup)

const flush = () => new Promise((r) => setTimeout(r, 0))

describe('MacCarousel（Svelte 版）', () => {
  it('默认属性渲染：track + slide 效果 + 圆点 + 箭头', async () => {
    const { container } = render(CarouselFixture)
    await flush()
    expect(container.querySelector('.track--slide')).toBeTruthy()
    expect(container.querySelectorAll('.dot').length).toBe(3)
    expect(container.querySelectorAll('.arrow').length).toBe(2)
  })

  it('单张幻灯片不渲染箭头和圆点', async () => {
    const { container } = render(CarouselFixture, { props: { slidesCount: 1 } })
    await flush()
    expect(container.querySelector('.arrow')).toBeNull()
    expect(container.querySelector('.dots')).toBeNull()
  })

  it('点击下一张箭头切换并派发 mac-carousel-change', async () => {
    const { container } = render(CarouselFixture)
    await flush()
    const handler = vi.fn()
    document.addEventListener('mac-carousel-change', handler)
    await fireEvent.click(container.querySelector('.arrow--next')!)
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail
    expect(detail.index).toBe(1)
    expect(detail.fromIndex).toBe(0)
    const dots = container.querySelectorAll('.dot')
    expect(dots[1].className).toContain('dot--active')
    document.removeEventListener('mac-carousel-change', handler)
  })

  it('loop 循环：第一张向前切换到最后一张', async () => {
    const { container } = render(CarouselFixture, { props: { loop: true } })
    await flush()
    await fireEvent.click(container.querySelector('.arrow--prev')!)
    const dots = container.querySelectorAll('.dot')
    expect(dots[2].className).toContain('dot--active')
  })

  it('非 loop：第一张向前不切换', async () => {
    const { container } = render(CarouselFixture, { props: { loop: false } })
    await flush()
    const handler = vi.fn()
    document.addEventListener('mac-carousel-change', handler)
    await fireEvent.click(container.querySelector('.arrow--prev')!)
    expect(handler).not.toHaveBeenCalled()
    document.removeEventListener('mac-carousel-change', handler)
  })

  it('点击圆点跳转', async () => {
    const { container } = render(CarouselFixture)
    await flush()
    const dots = container.querySelectorAll<HTMLButtonElement>('.dot')
    await fireEvent.click(dots[2])
    expect(dots[2].className).toContain('dot--active')
  })

  it('showArrow=false 隐藏箭头', async () => {
    const { container } = render(CarouselFixture, { props: { showArrow: false } })
    await flush()
    expect(container.querySelector('.arrow')).toBeNull()
  })

  it('dotType=line 渲染线条指示器', async () => {
    const { container } = render(CarouselFixture, { props: { dotType: 'line' } })
    await flush()
    expect(container.querySelector('.dot--line')).toBeTruthy()
  })

  it('autoplay 自动切换', async () => {
    vi.useFakeTimers()
    const { container } = render(CarouselFixture, {
      props: { autoplay: true, interval: 1000 },
    })
    await vi.advanceTimersByTimeAsync(0)
    expect(container.querySelector('.dot--active')).toBeTruthy()
    await vi.advanceTimersByTimeAsync(1100)
    const dots = container.querySelectorAll('.dot')
    expect(dots[1].className).toContain('dot--active')
    vi.useRealTimers()
  })

  it('slide 效果应用 translateX 变换', async () => {
    const { container } = render(CarouselFixture)
    await flush()
    await fireEvent.click(container.querySelector('.arrow--next')!)
    const track = container.querySelector<HTMLElement>('.track')!
    expect(track.style.transform).toContain('translateX(-100%)')
  })
})
