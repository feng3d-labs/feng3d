/**
 * 当前编辑器视图的全局登记点。
 *
 * `EditorView` 实例原本只存在于 `SceneView.vue` 的组件 `ref` 里，非 Vue 模块（如 AI 桥接）
 * 完全拿不到它 —— 而**主视图截帧**必须先拿到视图的 WebGPU 实例与渲染链。
 *
 * 因此这里提供一个模块级登记点：`EditorView` 构造时登记自己。
 * 只保留**最新**一个实例：编辑器同一时刻只有一个场景视图。
 */
import type { EditorView } from './EditorView';

/** 当前编辑器视图（未创建时为 null） */
let activeEditorView: EditorView | null = null;

/**
 * 登记当前编辑器视图（由 `EditorView` 构造函数调用）。
 *
 * @param view 视图实例；传 null 表示注销
 */
export function setActiveEditorView(view: EditorView | null): void
{
    activeEditorView = view;
}

/**
 * 注销当前编辑器视图（**只注销自己**）。
 *
 * 为什么不是无条件的 `setActiveEditorView(null)`：面板重建时"新实例注册"与"旧实例卸载"的先后
 * 顺序由框架决定（过渡、keep-alive 等场景下可能先挂新的）——无条件清空会把**新实例**的注册
 * 一起清掉，注册表反而变空，桥接的 `camera.*` / `view.*` 会报"找不到编辑器视图"（issue #198）。
 *
 * @param view 要注销的实例
 * @returns 是否真的清空了（注册表里当时就是它）
 */
export function clearActiveEditorView(view: EditorView): boolean
{
    if (activeEditorView !== view) return false;
    activeEditorView = null;

    return true;
}

/**
 * 取当前编辑器视图。
 *
 * @returns 视图实例；尚未创建时为 null
 */
export function getActiveEditorView(): EditorView | null
{
    return activeEditorView;
}
