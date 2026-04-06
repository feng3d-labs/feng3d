/**
 * 运行窗口管理器
 * 用于管理编辑器播放时打开的窗口
 * 替代 TopView.runwin 静态属性
 */

let runwin: Window | null = null;

/**
 * 获取当前运行窗口
 */
export function getRunWindow(): Window | null {
  return runwin;
}

/**
 * 设置运行窗口
 */
export function setRunWindow(window: Window | null): void {
  runwin = window;
}

/**
 * 关闭运行窗口
 */
export function closeRunWindow(): void {
  if (runwin) {
    runwin.close();
    runwin = null;
  }
}

