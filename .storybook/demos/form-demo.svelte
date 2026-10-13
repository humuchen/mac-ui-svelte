<script lang="ts">
  import {
    MacForm,
    MacFormItem,
    MacInput,
    MacInputNumber,
    MacButton,
  } from '../../src/lib/index'

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

<MacForm bind:model {rules} labelWidth="96px">
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
