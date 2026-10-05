/**
 * 项目自己的运行入口（模板）。
 *
 * ## 它取代了什么（旧形态为什么不通）
 *
 * | 旧写法 | 问题 |
 * |---|---|
 * | 全局 `feng3d`（靠 `libs/feng3d.js` 快照） | 与 `package.json` 的 npm 依赖**两套并存**，版本会漂 |
 * | `new feng3d.View()` | `View` 纯数据化后运行时**无值**，`new` 直接抛 `TypeError` |
 * | 读 `project.js` 后 `eval()` | 那条链路 D12 已整体取消（且编辑器侧有"不再请求 project.js"的反向断言） |
 *
 * ## 新形态（与运行形态 `src/run.ts` 同构）
 *
 * 场景**本来就是纯数据**（`{ __type__: 'Object3D', … }`），所以不需要"反序列化出类实例"：
 * 读出 JSON → 直接当视图的 `root` → `logic(view)` → 用 WebGPU 的 `submit` 循环渲染。
 *
 * 用法：
 *
 * ```bash
 * npm install      # 模板声明的依赖（feng3d / @feng3d/webgpu / vite）
 * npm run dev      # 开发者模式
 * npm run build    # 产物到 dist/
 * ```
 */
import { WebGPU } from '@feng3d/webgpu';
import * as feng3d from 'feng3d';

/** 场景文件路径，可用 `?scene=xxx.json` 覆盖 */
const scenePath = (new URLSearchParams(location.search).get('scene') ?? 'scenes/default.scene.json').replace(/^\/+/, '');

/** 画布（见 index.html） */
const canvas = document.getElementById('webgpu');

/**
 * 数一棵对象树（含自身）。
 *
 * @param {object} object 根对象
 * @returns {number} 对象总数
 */
function countObjects(object)
{
    if (!object) return 0;

    const children = object.children ?? [];

    return 1 + children.reduce((sum, child) => sum + countObjects(child), 0);
}

/** 启动 */
async function main()
{
    if (!canvas) throw new Error('需要一个 <canvas id="webgpu">（见 index.html）');

    // 资源系统初始化。**运行形态是只读的静态产物**，这里必须容错：
    // `ReadRS.init()` 在读不到资源清单时会去创建根目录，那在只读 FS 上必然抛。
    // 场景是纯数据、资源按需读取，所以初始化失败不该拦住运行。
    try
    {
        await feng3d.ReadRS.rs.init();
    }
    catch (error)
    {
        console.warn('[run] 资源系统未初始化（只读 FS 且没有资源清单时属正常）：', error);
    }

    const scene = JSON.parse(await feng3d.FS.fs.readString(scenePath));

    const webgpu = await new WebGPU({ canvasId: 'webgpu' }).init();

    const view = { __type__: 'View', canvas, root: scene };
    const viewLogic = feng3d.logic(view);

    if (!viewLogic) throw new Error('视图类型未注册：`logic(view)` 返回 null');

    feng3d.ticker.onframe(() => webgpu.submit(viewLogic.submit));

    console.log(`[run] 已启动：${scenePath}（${countObjects(scene)} 个对象）`);
}

main().catch((error) =>
{
    // 失败**如实**暴露：旧形态的教训正是"失败了还弹成功"
    console.error('[run] 启动失败：', error);
});
