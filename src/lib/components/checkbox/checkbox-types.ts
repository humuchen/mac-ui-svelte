// mac-checkbox-group 公共类型（独立成 .ts，保证 build:types 可生成声明）

export interface CheckboxOption {
  value: string
  label: string
  disabled?: boolean
}
