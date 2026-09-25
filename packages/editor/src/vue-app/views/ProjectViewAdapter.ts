/**
 * ProjectView 适配器
 * 用于支持旧代码调用 editorui.assetview.invalidateAssettree()
 * 
 * ⚠️ 临时适配层：一旦所有调用都替换为直接使用 Vue 组件，立即删除此文件
 */
import { globalEmitter } from 'feng3d';

let projectViewInstance: { invalidateAssettree: () => void } | null = null;

/**
 * 注册 ProjectView 实例
 */
export function registerProjectView(instance: { invalidateAssettree: () => void }) {
  projectViewInstance = instance;
}

/**
 * 注销 ProjectView 实例
 */
export function unregisterProjectView() {
  projectViewInstance = null;
}

/**
 * 使资源树无效（触发更新）
 */
export function invalidateAssettree() {
  if (projectViewInstance) {
    projectViewInstance.invalidateAssettree();
  } else {
    // 如果 Vue 组件未加载，通过全局事件触发
    globalEmitter.emit('projectview.invalidateAssettree' as any);
  }
}

