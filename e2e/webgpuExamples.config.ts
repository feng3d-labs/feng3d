/**
 * packages/webgpu/examples 的视觉回归清单（issue #712）。
 *
 * 背景：`packages/webgpu/examples` 下的示例原先**没有任何画面判据**——
 * 根 `e2e/examples.config.ts` 的 171 条里没有 webgpu 分类，所以 issue #712
 * （把 examples 的 71 个 `.wgsl` 改用 TSL）此前只能靠离线断言保证"代码对应"，
 * 不能保证"渲染不变"。本清单就是补上这一课。
 *
 * 每条给出：示例在 dev server 上的路径、预热与定格帧数。
 * 画面通过 `e2e/freeze.ts` 的 FREEZE_SCRIPT 定格（与 feng3d 的 examples 同一套机制）。
 */
export interface WebgpuExampleSpec
{
    /** 示例名（同时作为快照名与测试名） */
    name: string;
    /** dev server 上的相对路径 */
    url: string;
    /** 预热帧数（等异步资源就绪） */
    warmupFrames: number;
    /** 定格帧数 */
    freezeFrames: number;
    /**
     * 像素容差（比例）。
     *
     * **为什么需要它**：实测这几个示例即使在同一份代码（master）上连跑三次，
     * 差异也在 49~723 像素（ratio 0.01）之间跳动——画面本身就不是逐位可复现的
     * （冻结脚本能定格 rAF，但这些示例仍有非 rAF 驱动的异步更新）。
     * 所以判据只能取"差异 < 2%"：它足以拦住"着色器写错导致画面大变"，
     * 但**不等于**逐像素等价。这是 issue #712 的已知局限。
     */
    maxDiffPixelRatio: number;
}

/**
 * 纳入画面判据的示例。
 *
 * 目前只收**已把着色器改成 TSL 生成**的示例（#744 那批），
 * 这样清单的用途就是"证明 TSL 化没有改变渲染"。
 * 后续迁移更多示例时同步往里加。
 */
export const WEBGPU_EXAMPLES: WebgpuExampleSpec[] = [
    { name: 'rotatingCube', url: '/src/webgpu/rotatingCube/index.html', warmupFrames: 60, freezeFrames: 30, maxDiffPixelRatio: 0.02 },
    { name: 'twoCubes', url: '/src/webgpu/twoCubes/index.html', warmupFrames: 60, freezeFrames: 30, maxDiffPixelRatio: 0.02 },
    { name: 'instancedCube', url: '/src/webgpu/instancedCube/index.html', warmupFrames: 60, freezeFrames: 30, maxDiffPixelRatio: 0.02 },
    { name: 'timestampQuery', url: '/src/webgpu/timestampQuery/index.html', warmupFrames: 60, freezeFrames: 30, maxDiffPixelRatio: 0.02 },
    { name: 'transparentCanvas', url: '/src/webgpu/transparentCanvas/index.html', warmupFrames: 60, freezeFrames: 30, maxDiffPixelRatio: 0.02 },
    { name: 'texturedCube', url: '/src/webgpu/texturedCube/index.html', warmupFrames: 60, freezeFrames: 30, maxDiffPixelRatio: 0.02 },
    { name: 'imageBlur', url: '/src/webgpu/imageBlur/index.html', warmupFrames: 60, freezeFrames: 30, maxDiffPixelRatio: 0.02 },
];
