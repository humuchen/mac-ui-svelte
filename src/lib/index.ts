// mac-ui-svelte 统一导出（与 Lit 版 mac-ui.ts 对应）
// 37 个组件 + 类型 + 工具函数
// 注意：组件的公共类型统一收敛在各组件目录的 *-types.ts 中，
// 纯 tsc（build:types）无法读取 .svelte 内部类型，禁止从 .svelte re-export 类型。

// 基础组件
export { default as MacButton } from './components/button/mac-button.svelte'
export { default as MacTag } from './components/tag/mac-tag.svelte'
export { default as MacCard } from './components/card/mac-card.svelte'
export { default as MacAlert } from './components/alert/mac-alert.svelte'
export { default as MacProgress } from './components/progress/mac-progress.svelte'
export type { CircleConfig, GradientStop, GradientConfig } from './components/progress/progress-types'
export { default as MacRating } from './components/rating/mac-rating.svelte'
export type { RatingIcon } from './components/rating/rating-types'

// 表单组件
export { default as MacInput } from './components/input/mac-input.svelte'
export type { InputVariant } from './components/input/input-types'
export { default as MacInputNumber } from './components/input-number/mac-input-number.svelte'
export type { InputNumberVariant } from './components/input-number/input-number-types'
export { default as MacCheckbox } from './components/checkbox/mac-checkbox.svelte'
export { default as MacCheckboxGroup } from './components/checkbox/mac-checkbox-group.svelte'
export type { CheckboxOption } from './components/checkbox/checkbox-types'
export { default as MacRadio } from './components/radio/mac-radio.svelte'
export { default as MacRadioGroup } from './components/radio/mac-radio-group.svelte'
export type { RadioOption } from './components/radio/radio-types'
export { default as MacSelect } from './components/select/mac-select.svelte'
export type { SelectOption, OptionGroup } from './components/select/select-types'
export { default as MacTreeSelect } from './components/tree-select/mac-tree-select.svelte'
export type { TreeOption } from './components/tree-select/tree-select-types'
export { default as MacDatePicker } from './components/date-picker/mac-date-picker.svelte'
export type { PickerType, PanelView } from './components/date-picker/date-picker-types'
export { default as MacDateRangePicker } from './components/date-picker/mac-date-range-picker.svelte'
export { default as MacDynamicTags } from './components/dynamic-tags/mac-dynamic-tags.svelte'
export { default as MacForm } from './components/form/mac-form.svelte'
export type { FormRule } from './components/form/form-types'
export { default as MacFormItem } from './components/form/mac-form-item.svelte'

// 数据展示
export { default as MacDataTable } from './components/data-table/mac-data-table.svelte'
export type {
  DataTableColumn,
  DataTablePagination,
  DataTableRowSelection,
  DataTableSortInfo,
  DataTableSortOrder,
} from './components/data-table/data-table-types'
export { default as MacDescriptions } from './components/descriptions/mac-descriptions.svelte'
export type { DescriptionItem } from './components/descriptions/descriptions-types'
export { default as MacDescriptionItem } from './components/descriptions/mac-description-item.svelte'
export { default as MacTree } from './components/tree/mac-tree.svelte'
export type { TreeNodeData } from './components/tree/tree-types'
export { default as MacTextEllipsis } from './components/text-ellipsis/mac-text-ellipsis.svelte'
export { default as MacNumberAnimation } from './components/number-animation/mac-number-animation.svelte'
export { default as MacCarousel } from './components/carousel/mac-carousel.svelte'
export { default as MacCarouselItem } from './components/carousel/mac-carousel-item.svelte'
export { default as MacLazyImage } from './components/lazy-image/mac-lazy-image.svelte'

// 反馈/浮层
export { default as MacModal } from './components/modal/mac-modal.svelte'
export { default as MacDrawer } from './components/drawer/mac-drawer.svelte'
export { default as MacConfirm } from './components/confirm/mac-confirm.svelte'
export { confirmDialog, closeConfirmDialog } from './components/confirm/confirm-dialog'
export type { ConfirmOptions } from './components/confirm/confirm-dialog'
export { default as MacPopconfirm } from './components/popconfirm/mac-popconfirm.svelte'
export type { PopconfirmPlacement } from './components/popconfirm/popconfirm-types'
export { default as MacDropdown } from './components/dropdown/mac-dropdown.svelte'
export type { DropdownItem } from './components/dropdown/dropdown-types'
export { default as MacMenu } from './components/menu/mac-menu.svelte'
export type { MenuItem } from './components/menu/menu-types'
export { default as MacConfigProvider } from './components/config-provider/mac-config-provider.svelte'

// 布局/其他
export { default as MacTabs } from './components/tabs/mac-tabs.svelte'
export type { TabItem } from './components/tabs/tabs-types'
export { default as MacTabPane } from './components/tabs/mac-tab-pane.svelte'
export { default as MacSplit } from './components/split/mac-split.svelte'
export { default as MacGroupButton } from './components/group-button/mac-group-button.svelte'
export type { GroupButtonItem } from './components/group-button/group-button-types'
export { default as MacInfiniteScroll } from './components/infinite-scroll/mac-infinite-scroll.svelte'
export { default as MacAnimation } from './components/animation/mac-animation.svelte'
export {
  registerAnimation,
  getAnimation,
  hasAnimation,
  getAnimationNames,
  getAllAnimations,
  buildAnimationShorthand,
  getAnimationStyleObject,
  BUILT_IN,
  BUILT_IN_ANIMATION_NAMES,
  builtInKeyframes,
  animationStyleSheet,
} from './components/animation/animations'
export type { AnimationDefinition, AnimationCategory, AnimationOptions } from './components/animation/animations'
export { default as MacDesktop } from './components/desktop/mac-desktop.svelte'
export type { DesktopIconData } from './components/desktop/desktop-types'
export { default as MacDesktopIcon } from './components/desktop-icon/mac-desktop-icon.svelte'
export { default as MacDock } from './components/dock/mac-dock.svelte'
export type { DockItemData } from './components/dock/dock-types'
export { default as MacDockItem } from './components/dock/mac-dock-item.svelte'

// 基建
export {
  provideMacConfig,
  useMacConfig,
  resolveSize,
  resolveTheme,
  type MacConfig,
  type MacSize,
  type MacTheme,
} from './internal/config.svelte'
