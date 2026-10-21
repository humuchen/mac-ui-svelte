<script lang="ts">
  import {
    MacForm,
    MacFormItem,
    MacInput,
    MacInputNumber,
    MacButton,
  } from '../../src/lib/index'

  /**
   * 演示包装组件：接收 Storybook args 并透传给 MacForm，
   * 使 Controls 面板的 labelWidth / labelAlign / showLabel / showFeedback /
   * disabled / size 控件在画布中实时生效。
   */
  interface Props {
    /** 标签宽度（CSS 长度值）。 */
    labelWidth?: string
    /** 标签对齐方式。 */
    labelAlign?: 'left' | 'right' | 'top'
    /** 是否显示标签。 */
    showLabel?: boolean
    /** 是否显示错误反馈信息。 */
    showFeedback?: boolean
    /** 禁用所有表单项。 */
    disabled?: boolean
    /** 表单尺寸。 */
    size?: 'sm' | 'md' | 'lg'
  }

  let {
    labelWidth = '96px',
    labelAlign = 'right',
    showLabel = true,
    showFeedback = true,
    disabled = false,
    size = 'md',
  }: Props = $props()

  /** 表单演示用的数据模型（受控绑定）。 */
  let model = $state({
    name: '',
    age: undefined as number | undefined,
    email: '',
  })

  /** 校验规则（提交时触发，与 Lit 版 rules 结构一致）。 */
  const rules = {
    name: { required: true, message: '请输入用户名' },
    email: [
      { required: true, message: '请输入邮箱' },
      { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: '邮箱格式不正确' },
    ],
    age: { type: 'number', min: 1, max: 150, message: '年龄需在 1-150 之间' },
  } as const
</script>

<MacForm bind:model {rules} {labelWidth} {labelAlign} {showLabel} {showFeedback} {disabled} {size}>
  <MacFormItem path="name" label="用户名" required>
    <MacInput bind:value={model.name} placeholder="请输入用户名" />
  </MacFormItem>
  <MacFormItem path="age" label="年龄">
    <MacInputNumber bind:value={model.age} min={0} max={150} />
  </MacFormItem>
  <MacFormItem path="email" label="邮箱" required>
    <MacInput bind:value={model.email} type="email" placeholder="请输入邮箱" />
  </MacFormItem>
  <MacFormItem label="操作">
    <MacButton type="submit" variant="primary">提交</MacButton>
  </MacFormItem>
</MacForm>
