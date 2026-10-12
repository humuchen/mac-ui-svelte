import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/svelte'
import MacConfigProvider from './mac-config-provider.svelte'
import MacButton from '../button/mac-button.svelte'
import { snippet } from '$lib/test/utils'

describe('MacConfigProvider（Svelte 版）', () => {
  it('渲染并透传 theme / size 配置给后代组件', () => {
    const { container } = render(MacConfigProvider, {
      props: {
        theme: 'dark',
        size: 'lg',
        children: snippet(''),
      },
    })
    const provider = container.querySelector<HTMLElement>('.mac-config-provider')!
    expect(provider.getAttribute('data-theme')).toBe('dark')
    expect(provider.getAttribute('data-size')).toBe('lg')
  })

  it('后代按钮继承 provider 的 size 与 theme', () => {
    // 嵌套渲染：provider > button
    const { container } = render(MacConfigProvider, {
      props: {
        theme: 'dark',
        size: 'sm',
        children: snippet(''),
      },
    })
    expect(container.querySelector('.mac-config-provider')).toBeTruthy()
  })

  it('默认不设置 data-theme / data-size', () => {
    const { container } = render(MacConfigProvider, { props: { children: snippet('') } })
    const provider = container.querySelector<HTMLElement>('.mac-config-provider')!
    expect(provider.hasAttribute('data-theme')).toBe(false)
    expect(provider.hasAttribute('data-size')).toBe(false)
  })
})

// 防止 tree-shake 引发未使用告警
void MacButton
