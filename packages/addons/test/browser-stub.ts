/**
 * Vitest setup：addons 测试加载 feng3d barrel 所需的浏览器全局 stub。
 *
 * feng3d barrel 会拉起 @feng3d/webgpu（运行期需 GPU* 全局）与 @feng3d/shortcut
 * （`windowEventProxy` 的目标在浏览器里是 `self`；#624 批次已改为惰性解析，
 * import 期不再读它，但要让它真的绑事件，测试里仍需 `self` + addEventListener）。
 * Node 环境下先注入占位，再复用 feng3d 自带的 webgpu stub。
 */
import '../../feng3d/src/test/webgpu-stub';

const g = globalThis as Record<string, unknown>;

// 注意：不要定义 window——AudioListener 模块级构造 AudioContext 的守卫是
// `typeof window === 'undefined'`，定义 window 会让 node 下走到 new AudioContext() 崩溃
if (typeof g.self === 'undefined')
{
    g.self = globalThis;
}
// shortcut 的 windowEventProxy 惰性解析出 self 后，会在首次 on() 时对 self 调 addEventListener
// （#624 批次前是模块加载时就调，故这里一直是必需的 stub）。
if (typeof (g.self as Record<string, unknown>).addEventListener !== 'function')
{
    (g.self as Record<string, unknown>).addEventListener = () => { /* no-op */ };
    (g.self as Record<string, unknown>).removeEventListener = () => { /* no-op */ };
}
// ImageUtil 构造时 new ImageData（terrain 的默认高度图曾因此让 import 崩，#624 批次
// 已把它改成惰性生成；这里保留是因为运行期的纹理构造仍要用 ImageData）
if (typeof g.ImageData === 'undefined')
{
    g.ImageData = class ImageData
    {
        width: number;
        height: number;
        data: Uint8ClampedArray;

        constructor(width: number, height: number)
        {
            this.width = width;
            this.height = height;
            this.data = new Uint8ClampedArray(width * height * 4);
        }
    };
}
