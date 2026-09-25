// TabPanel 组件的类型定义
export interface Tab {
  id: string;
  label: string;
  icon?: string; // 图标名称（Iconify 格式，如 'mdi:file'）
  component?: any; // Vue 组件
}

