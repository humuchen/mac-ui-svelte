<script lang="ts">
  import MacForm from './mac-form.svelte'
  import MacFormItem from './mac-form-item.svelte'
  import MacInput from '../input/mac-input.svelte'

  let { rules = {} } = $props()

  let model = $state<{ name?: string }>({ name: '' })
</script>

<MacForm bind:model {rules}>
  <MacFormItem label="用户名" path="name" required>
    <MacInput bind:value={model.name} />
  </MacFormItem>
</MacForm>
