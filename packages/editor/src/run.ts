/**
 * 运行形态入口（#271 P0）：把项目的场景**渲染出来**。
 *
 * ## 旧形态为什么不通（三条断链路之一）
 *
 * | 旧写法 | 问题 |
 * |---|---|
 * | 读 `project.js` 后 `eval()` | `project.js` 由编辑器内浏览器 TypeScript services 编译，而那条链路**实际不可用**（编译器本体从未加载，见 `docs/ARCHITECTURE.md` §1.3）；D12 已把"编辑器内编译"整体**取消** |
 * | `initProject()` 里 `new feng3d.View()` | `View` 纯数据化后运行时无值，`new` 直接抛 `TypeError`；于是整段被注释掉，运行形态**永远初始化不出场景** |
 *
 * ## 新形态（D12 / 纯数据声明式）
 *
 * 场景**本来就是纯数据**（`{ __type__: 'Object3D', … }`，见 `resource/template/default.scene.json`），
 * 所以不需要"反序列化出类实例"这一步：读出 JSON → 直接当视图的 `root` → 交给 `logic(view)` →
 * 用 WebGPU 的 `submit` 循环渲染。视图本身也用**纯数据字面量**声明。
 *
 * ## 查询参数
 *
 * | 参数 | 含义 |
 * |---|---|
 * | `fstype` | 文件系统类型（`indexedDB` 时用项目空间；缺省走 http/默认 FS） |
 * | `project` | 项目名（`fstype=indexedDB` 时用） |
 * | `scene` | 场景文件路径，缺省 `default.scene.json`（显式给 URL 便于开发与 e2e） |
 */
import { WebGPU } from '@feng3d/webgpu';
import * as feng3d from 'feng3d';
import type { Object3D, View } from 'feng3d';

/** 运行形态的就绪状态（e2e 与调试用；引擎起没起来、场景有没有装进来，一眼可查） */
interface RunPreviewState
{
    /** 是否已进入渲染循环 */
    started: boolean;

    /** 场景里的对象数（含根；用于断言"场景真的装进来了"） */
    objects: number;

    /** 失败原因（成功时为 `null`） */
    error: string | null;

    /**
     * 已提交的帧数。
     *
     * 这是"渲染循环真的在跑"的**确定性**判据：画面里有没有物体取决于场景数据
     * （相机位置/朝向、几何、光照），而"每帧都在提交"只取决于这条循环。
     */
    frames: number;
}

const canvas = document.getElementById('webgpu') as HTMLCanvasElement | null;

/**
 * 更新就绪状态（挂到 window 上供 e2e 断言）。
 *
 * @param state 当前状态
 */
function setRunState(state: RunPreviewState): void
{
    (window as { __RUN_PREVIEW__?: RunPreviewState }).__RUN_PREVIEW__ = state;
}

/**
 * 数一棵对象树（含自身）。
 *
 * @param object 根对象
 * @returns 对象总数
 */
function countObjects(object: Object3D | undefined): number
{
    if (!object) return 0;

    const children = (object as { readonly children?: readonly Object3D[] }).children ?? [];

    return 1 + children.reduce((sum, child) => sum + countObjects(child), 0);
}

/**
 * 启动运行形态。
 */
async function main(): Promise<void>
{
    const params = new URLSearchParams(window.location.search);
    const fstype = params.get('fstype');
    // `HttpFS.getAbsolutePath` 是 `rootPath + path` 的**纯字符串拼接**（`rootPath` 是**页面目录**），
    // 所以这里的路径必须是**相对页面**的。顺手去掉前导 `/`：否则会拼出 `//resource/...`，
    // dev server 会把它当另一个路径、回落成 index.html，于是"读场景"拿到一坨 HTML 再 JSON.parse 崩掉
    // （排查时正是这么踩的）。
    const scenePath = (params.get('scene') ?? 'default.scene.json').replace(/^\/+/, '');

    if (!canvas)
    {
        throw new Error('运行形态需要一个 <canvas id="webgpu">（见 run.html）');
    }

    if (fstype === 'indexedDB')
    {
        feng3d.indexedDBFS.projectname = decodeURI(params.get('project') ?? '');
        feng3d.FS.fs = feng3d.indexedDBFS as never;
        feng3d.ReadRS.rs = new feng3d.ReadRS(feng3d.indexedDBFS as never);
    }

    // 资源系统初始化。**运行形态是只读的静态产物**，这里必须容错：
    // `ReadRS.init()` 在读不到资源清单时会去**创建根目录**（`createAsset`）——那是编辑器
    // 初始化项目空间的活，在 http 这类只读 FS 上必然抛 `writeObject is not a function`。
    // 场景本身是纯数据、资源按需读取，所以初始化失败不该拦住运行形态。
    try
    {
        await feng3d.ReadRS.rs.init();
    }
    catch (error)
    {
        console.warn('[run] 资源系统未初始化（只读 FS 且没有资源清单时属正常）：', error);
    }

    // 场景是**纯数据**：读出来直接用，不再 eval、也不再反序列化成类实例
    const scene = JSON.parse(await feng3d.FS.fs.readString(scenePath) as string) as Object3D;

    // **先记场景，再碰 GPU**：没有 GPU 的机器上 `WebGPU.init()` 会失败，但"场景读没读到"
    // 仍然可判——e2e 就靠这条把"环境限制（无 adapter）"与"真回归"分开。
    setRunState({ started: false, objects: countObjects(scene), error: null, frames: 0 });

    const webgpu = await new WebGPU({ canvasId: 'webgpu' }).init();

    const view: View = {
        __type__: 'View',
        canvas,
        root: scene,
    };
    const viewLogic = feng3d.logic(view);

    if (!viewLogic)
    {
        throw new Error('视图类型未注册：`logic(view)` 返回 null（View 的 Logic 是否已注册？）');
    }

    const objects = countObjects(scene);
    let frames = 0;

    feng3d.ticker.onframe(() =>
    {
        webgpu.submit(viewLogic.submit);
        frames++;

        // 不必每帧都写 window 状态：每 10 帧报一次，够 e2e 判"循环在跑"，也不给渲染添负担
        if (frames % 10 === 0) setRunState({ started: true, objects, error: null, frames });
    });

    setRunState({ started: true, objects, error: null, frames: 0 });

    console.log(`[run] 运行形态已启动：场景 ${scenePath}（${countObjects(scene)} 个对象）`);
}

main().catch((error: unknown) =>
{
    const message = error instanceof Error ? error.message : String(error);

    // 失败要**如实**暴露：既要进控制台（错误面板与桥接的 `log.tail` 读的就是它），
    // 也要挂到状态上供 e2e 断言——旧形态的教训正是"失败了还弹成功"。
    // 注意保留已经算出来的 `objects`：那是"场景数据链路通不通"的证据。
    console.error('[run] 运行形态启动失败：', error);

    const previous = (window as { __RUN_PREVIEW__?: RunPreviewState }).__RUN_PREVIEW__;

    setRunState({
        started: false,
        objects: previous?.objects ?? 0,
        error: message,
        frames: previous?.frames ?? 0,
    });
});
