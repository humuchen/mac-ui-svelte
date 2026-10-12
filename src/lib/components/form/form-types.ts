// mac-form 公共类型（独立成 .ts，保证 build:types 可生成声明）

export interface FormRule {
  required?: boolean
  message?: string
  trigger?: 'blur' | 'change' | 'input' | ('blur' | 'change' | 'input')[]
  validator?: (value: unknown) => boolean | string | Promise<boolean | string>
  min?: number
  max?: number
  len?: number
  pattern?: RegExp
  type?: 'string' | 'number' | 'boolean' | 'array' | 'email' | 'url' | 'date'
}
