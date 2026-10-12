<script lang="ts">
  import type { Snippet } from 'svelte'
  import {
    useMacConfig,
    resolveTheme,
    type MacTheme,
  } from '../../internal/config.svelte'

  /**
   * @tag mac-infinite-scroll
   * @summary 无限滚动组件，滚动到底部时触发加载更多数据。
   *
   * @slot children - 列表内容。
   * @slot loading - 自定义加载指示器内容。
   * @slot finished - 没有更多数据时显示的自定义内容。
   * @slot error - 加载失败时显示的自定义内容。添加点击监听器以触发重试。
   *
   * @event mac-load-more - 应该加载更多数据时触发。
   * @event mac-retry - 点击重试按钮时触发。
   */

  interface Props {
    /** 是否还有更多数据可加载。 */
    hasMore?: boolean
    /** 当前是否正在加载数据。 */
    loading?: boolean
    /** 上次加载尝试是否失败。 */
    error?: boolean
    /** 距离底部触发加载的像素距离。 */
    threshold?: number
    /** 挂载后是否立即检查，当内容未填满容器时。 */
    immediateCheck?: boolean
    /** 是否禁用自动加载。 */
    disabled?: boolean
    /** 组件级主题覆盖。 */
    theme?: MacTheme
    /** 列表内容（对应 Lit 版默认 slot）。 */
    children?: Snippet
    /** 自定义加载指示器内容。 */
    loadingSnippet?: Snippet
    /** 没有更多数据时显示的自定义内容。 */
    finishedSnippet?: Snippet
    /** 加载失败时显示的自定义内容。 */
    errorSnippet?: Snippet
    /** 其余属性透传。 */
    [key: string]: unknown
  }

  let {
    hasMore = true,
    loading = false,
    error = false,
    threshold = 100,
    immediateCheck = true,
    disabled = false,
    theme = undefined,
    children,
    loadingSnippet,
    finishedSnippet,
    errorSnippet,
    ...rest
  }: Props = $props()

  const config = useMacConfig()
  const resolvedTheme = $derived(resolveTheme(theme, config))

  let root: HTMLDivElement | undefined = $state()
  let sentinelEl: HTMLDivElement | undefined = $state()
  let internalLoading = $state(false)

  function emit(name: string, detail?: unknown) {
    root?.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }))
  }

  function tryLoadMore() {
    if (!hasMore || loading || error || disabled || internalLoading) return
    internalLoading = true
    emit('mac-load-more')
    // 短暂延迟后重置内部加载状态，以防止快速重新触发
    // 如果使用者未及时设置 loading=true
    setTimeout(() => {
      internalLoading = false
    }, 100)
  }

  function checkIfNeedLoad() {
    if (!root) return
    if (!hasMore || loading || error || disabled || internalLoading) return
    // 如果内容未填满容器，触发加载
    if (root.scrollHeight <= root.clientHeight) {
      tryLoadMore()
    }
  }

  // 建立 IntersectionObserver
  $effect(() => {
    if (!sentinelEl) return
    let observer: IntersectionObserver | undefined
    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0]
          if (entry.isIntersecting) {
            tryLoadMore()
          }
        },
        {
          root: root,
          rootMargin: `0px 0px ${threshold}px 0px`,
          threshold: 0,
        },
      )
      observer.observe(sentinelEl)
    }
    return () => {
      observer?.disconnect()
    }
  })

  // 状态变化后检查是否需要加载
  $effect(() => {
    void disabled
    void hasMore
    void loading
    void error
    if (!disabled && hasMore && !loading && !error) {
      const raf = requestAnimationFrame(() => checkIfNeedLoad())
      return () => cancelAnimationFrame(raf)
    }
  })

  // 挂载后立即检查
  $effect(() => {
    if (immediateCheck) {
      const raf = requestAnimationFrame(() => checkIfNeedLoad())
      return () => cancelAnimationFrame(raf)
    }
  })

  function handleRetry() {
    emit('mac-retry')
  }
</script>

<div
  bind:this={root}
  {...rest}
  class="mac-scope mac-infinite-scroll"
  data-theme={resolvedTheme}
>
  <div class="scroll-container">
    {#if children}{@render children()}{/if}
    <div bind:this={sentinelEl} class="sentinel"></div>
    {#if loading}
      <div class="status">
        {#if loadingSnippet}
          {@render loadingSnippet()}
        {:else}
          <span class="loading-spinner"></span><span>加载中...</span>
        {/if}
      </div>
    {:else if error}
      <div class="status">
        {#if errorSnippet}
          {@render errorSnippet()}
        {:else}
          <span>加载失败</span><span class="retry-btn" onclick={handleRetry}>重试</span>
        {/if}
      </div>
    {:else if !hasMore}
      <div class="status">
        {#if finishedSnippet}
          {@render finishedSnippet()}
        {:else}
          <span>没有更多数据</span>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .mac-infinite-scroll {
    display: block;
    height: 100%;
    overflow: auto;
  }

  .scroll-container {
    min-height: 100%;
  }

  .sentinel {
    height: 1px;
  }

  .status {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--md-infinite-scroll-padding, var(--md-spacing-md));
    color: var(--md-infinite-scroll-color, var(--md-color-text-secondary));
    font-size: var(--md-infinite-scroll-font-size, var(--md-font-size-sm));
    gap: var(--md-infinite-scroll-gap, var(--md-spacing-sm));
  }

  .loading-spinner {
    width: var(--md-infinite-scroll-spinner-size, 16px);
    height: var(--md-infinite-scroll-spinner-size, 16px);
    border: 2px solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  .retry-btn {
    cursor: pointer;
    color: var(--md-color-primary);
    text-decoration: underline;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
