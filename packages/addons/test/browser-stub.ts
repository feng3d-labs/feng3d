/**
 * Vitest setup：addons 测试加载 feng3d barrel 所需的浏览器全局 stub。
 *
 * feng3d barrel 会拉起 @feng3d/webgpu（需 GPU* 全局）与 @feng3d/shortcut
 * （模块级 `new EventProxy(self)` 需 self）。Node 环境下先注入占位，
 * 再复用 feng3d 自带的 webgpu stub。
 */
import '../../feng3d/src/test/webgpu-stub';

const g = globalThis as Record<string, unknown>;

// 注意：不要定义 window——AudioListener 模块级构造 AudioContext 的守卫是
// `typeof window === 'undefined'`，定义 window 会让 node 下走到 new AudioContext() 崩溃
if (typeof g.self === 'undefined')
{
    g.self = globalThis;
}
// shortcut 的 windowEventProxy 在模块加载时对 self 调 addEventListener
if (typeof (g.self as Record<string, unknown>).addEventListener !== 'function')
{
    (g.self as Record<string, unknown>).addEventListener = () => { /* no-op */ };
    (g.self as Record<string, unknown>).removeEventListener = () => { /* no-op */ };
}
// ImageUtil 在模块加载时构造 ImageData 占位默认纹理
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
