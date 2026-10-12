/**
 * Vitest 全局环境补充：mock 浏览器 API。
 * 与 Lit 版 src/test/setup.ts 对应，并补充 jsdom 缺失的 observer。
 */
import '@testing-library/jest-dom/vitest'

if (!window.matchMedia) {
  window.matchMedia = ((query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList) as unknown as typeof window.matchMedia
}

class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | null = null
  readonly rootMargin: string = ''
  readonly thresholds: ReadonlyArray<number> = []
  disconnect(): void {}
  observe(): void {}
  unobserve(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}

class MockResizeObserver implements ResizeObserver {
  disconnect(): void {}
  observe(): void {}
  unobserve(): void {}
}

if (!('IntersectionObserver' in window)) {
  ;(window as unknown as Record<string, unknown>).IntersectionObserver = MockIntersectionObserver
}
if (!('ResizeObserver' in window)) {
  ;(window as unknown as Record<string, unknown>).ResizeObserver = MockResizeObserver
}

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}
