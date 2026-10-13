<script lang="ts">
  import { MacConfigProvider, MacButton, MacTag, MacInput } from '../../src/lib/index'

  interface Props {
    /** 主题模式。 */
    theme?: 'light' | 'dark'
    /** 全局尺寸。 */
    size?: 'sm' | 'md' | 'lg'
  }

  let { theme = 'light', size = 'md' }: Props = $props()
</script>

<div style="padding: 16px; border-radius: 12px;">
  <MacConfigProvider {theme} {size}>
    <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
      <MacButton variant="primary">主要按钮</MacButton>
      <MacButton variant="secondary">次要按钮</MacButton>
      <MacTag type="primary">标签</MacTag>
      <MacInput placeholder="请输入内容" style="width: 200px;" />
    </div>
  </MacConfigProvider>
</div>
