import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/svelte'
import MacAnimation from './mac-animation.svelte'
import {
  registerAnimation,
  getAnimation,
  hasAnimation,
  getAnimationNames,
  getAllAnimations,
  buildAnimationShorthand,
  getAnimationStyleObject,
  builtInKeyframes,
  animationStyleSheet,
} from './animations'
import { snippet } from '$lib/test/utils'

afterEach(cleanup)

function getRoot(container: HTMLElement) {
  return container.querySelector<HTMLElement>('.mac-animation')!
}

describe('MacAnimation（Svelte 版）', () => {
  it('默认属性渲染：fadeIn 动画样式应用到包裹元素', () => {
    const { container } = render(MacAnimation, { props: { children: snippet('内容') } })
    const wrapper = getRoot(container)
    expect(wrapper.style.animation).toContain('mac-fadeIn')
    expect(wrapper.style.animation).toContain('1s')
    expect(wrapper.textContent).toContain('内容')
  })

  it('属性绑定响应：duration / paused / block', () => {
    const { container } = render(MacAnimation, {
      props: { type: 'bounce', duration: '2s', paused: true, block: true },
    })
    const wrapper = getRoot(container)
    expect(wrapper.style.animation).toContain('mac-bounce')
    expect(wrapper.style.animation).toContain('2s')
    expect(wrapper.style.animation).toContain('paused')
    expect(wrapper.className).toContain('block')
  })

  it('未知动画类型时清空动画样式', () => {
    const { container } = render(MacAnimation, { props: { type: 'notExist' } })
    expect(getRoot(container).style.animation).toBe('')
  })

  it('animationend 派发 mac-animation-end', async () => {
    const { container } = render(MacAnimation, { props: {} })
    const handler = vi.fn()
    document.addEventListener('mac-animation-end', handler)
    await fireEvent.animationEnd(getRoot(container))
    expect(handler).toHaveBeenCalledOnce()
    document.removeEventListener('mac-animation-end', handler)
  })

  it('autoClear 在动画结束后移除动画样式', async () => {
    const { container } = render(MacAnimation, { props: { autoClear: true } })
    await fireEvent.animationEnd(getRoot(container))
    expect(getRoot(container).style.animation).toBe('none')
  })

  it('pause / resume / stop / restart 公共方法', () => {
    const { container, component } = render(MacAnimation, { props: {} })
    const comp = component as unknown as {
      pause: () => void
      resume: () => void
      stop: () => void
      restart: () => void
    }
    const wrapper = getRoot(container)
    comp.pause()
    expect(wrapper.style.animation).toContain('paused')
    comp.resume()
    expect(wrapper.style.animation).toContain('running')
    comp.stop()
    expect(wrapper.style.animation).toBe('none')
    comp.restart()
    expect(wrapper.style.animation).toContain('mac-fadeIn')
  })

  it('registerAnimation 注册自定义动画并可使用', () => {
    registerAnimation({
      name: 'testCustomFade',
      description: '测试自定义淡入',
      category: 'fade',
      keyframes: '@keyframes mac-testCustomFade { from { opacity: 0; } to { opacity: 1; } }',
    })
    expect(hasAnimation('testCustomFade')).toBe(true)
    expect(getAnimation('testCustomFade')?.name).toBe('testCustomFade')
    const { container } = render(MacAnimation, { props: { type: 'testCustomFade' } })
    expect(getRoot(container).style.animation).toContain('mac-testCustomFade')
    // 自定义动画的 keyframes 注入 document.head
    expect(document.head.innerHTML).toContain('mac-testCustomFade')
  })
})

describe('animations 工具函数（Svelte 版）', () => {
  it('内置动画注册表完整（27 种）', () => {
    expect(getAnimationNames().length).toBeGreaterThanOrEqual(27)
    expect(getAllAnimations().length).toBeGreaterThanOrEqual(27)
    expect(hasAnimation('fadeIn')).toBe(true)
  })

  it('buildAnimationShorthand 生成简写字符串', () => {
    const shorthand = buildAnimationShorthand('fadeIn', { duration: '0.5s' })
    expect(shorthand).toBe('mac-fadeIn 0.5s ease 0s 1 normal both running')
    expect(buildAnimationShorthand('notExist')).toBe('')
  })

  it('getAnimationStyleObject 生成对象样式', () => {
    const styleObj = getAnimationStyleObject('bounce', { duration: '0.8s' })
    expect(styleObj.animationName).toBe('mac-bounce')
    expect(styleObj.animationDuration).toBe('0.8s')
    expect(getAnimationStyleObject('notExist')).toEqual({})
  })

  it('样式表导出包含 keyframes 与动画类', () => {
    expect(builtInKeyframes).toContain('@keyframes mac-fadeIn')
    expect(animationStyleSheet).toContain('.mac-anim-fadeIn')
  })
})
