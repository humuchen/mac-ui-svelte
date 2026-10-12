<script lang="ts">
  import {
    MacButton,
    MacConfigProvider,
    MacInput,
    MacCheckbox,
    MacSelect,
    MacAlert,
    MacProgress,
  } from '$lib/index'

  let theme = $state<'light' | 'dark'>('light')
  let inputVal = $state('')
</script>

<MacConfigProvider {theme}>
  <main
    style="padding: 32px; display: flex; flex-direction: column; gap: 16px; max-width: 720px; margin: 0 auto;"
  >
    <h1 style="font-size: 24px; margin: 0;">Mac UI · Svelte 版演示</h1>
    <p style="margin: 0; color: var(--md-color-text-secondary);">
      37 个组件全部迁移完成（完整示例见各组件测试与 Storybook 源码）。
    </p>
    <div style="display: flex; gap: 12px;">
      <MacButton onclick={() => (theme = theme === 'light' ? 'dark' : 'light')}>
        切换主题
      </MacButton>
      <MacButton variant="secondary" size="sm">次要按钮</MacButton>
      <MacButton variant="text" size="lg">文本按钮</MacButton>
      <MacButton loading>加载中</MacButton>
    </div>
    <MacInput bind:value={inputVal} placeholder="请输入内容" label="用户名" />
    <MacCheckbox label="同意协议" />
    <MacSelect
      options={[
        { value: 'a', label: '选项 A' },
        { value: 'b', label: '选项 B' },
      ]}
      placeholder="请选择"
    />
    <MacAlert title="提示" closable>这是一个 macOS 风格的警告提示。</MacAlert>
    <MacProgress percentage={68} />
  </main>
</MacConfigProvider>
