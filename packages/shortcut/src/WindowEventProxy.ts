import { EventProxy } from './EventProxy';

/**
 * 键盘鼠标输入
 *
 * 目标（浏览器里即 `self`）改为**惰性取得**：模块 import 期不再读取宿主全局，
 * 首次 `on()` / `off()` / 读取 `target` 时才解析。这样 Node / SSR 下 `import`
 * 不再抛 `ReferenceError: self is not defined`（issue #620 / #624）。
 *
 * **公开 API 未变**：仍是同一个 `EventProxy<WindowEventMap>` 实例、同样的导出名；
 * 唯一的行为差异是「首次使用前 `windowEventProxy.target` 为 `undefined`」——
 * 仓库内没有任何地方在 `on()` 之前读它（浏览器下首次 `on()` 时同样取到 `self`）。
 */
export const windowEventProxy = new EventProxy<WindowEventMap>(
    // 惰性目标解析函数：把 `self` 的读取推迟到首次使用时
    () => (typeof self === 'undefined' ? undefined : self),
);
