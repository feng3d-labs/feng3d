/**
 * 示例定格工具（e2e 共用）。
 *
 * 本文件从 `e2e/examples.spec.ts` 提取：feng3d 的 examples 与 packages/webgpu/examples
 * 都是"逐帧渲染（旋转/变色）"的页面，逐帧像素不可复现；这里通过`page.addInitScript`
 * 在页面脚本执行**之前**注入 {@link FREEZE_SCRIPT}，把画面定格在第 N 帧。
 *
 * 提取出来是为了让两套示例共用同一份冻结实现（issue #712：examples 的画面判据）。
 */
import type { Page } from 'playwright/test';

/**
 * 注入页面的冻结脚本。
 *
 * 工作原理（两阶段）：
 *
 * 阶段 A —— 预热：让示例按真实 rAF 自由渲染 `warmupFrames` 帧，使异步资源
 *   （纹理上传、管线编译、shadow map 初始化）完成，画面进入稳定状态。
 *   此阶段不关心每帧像素，只等 GPU 上传完成。
 *
 * 阶段 B —— 定格：随后再渲染 `freezeFrames` 帧（让旋转/颜色进入第 N 帧的确定值），
 *   然后永久停止 rAF 调度与所有 setInterval → 画面定格在确定帧，可复现。
 *
 * 定格完成后置 `window.__freezeDone = true`，测试据此等待后截图。
 *
 * 该脚本读取 `window.__freeze = { warmupFrames, freezeFrames }`（由前置 initScript 设置）。
 */
export const FREEZE_SCRIPT = `
(window) => {
    // ---- 种子化 Math.random（确定性场景）----
    // 大量示例在初始化时用 Math.random 生成粒子位置/颜色等（每次加载不同，
    // 截图不可复现）。替换为固定种子的 PRNG（mulberry32），随机构造完全确定。
    // 引擎内部如也使用 Math.random，同样受益于确定性。
    let _seed = 0x2F6E2B1;
    Math.random = function () {
        _seed |= 0; _seed = (_seed + 0x6D2B79F5) | 0;
        let t = Math.imul(_seed ^ (_seed >>> 15), 1 | _seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    // ---- 虚拟时钟（确定性时间驱动动画）----
    // Date.now / performance.now 冻结为 rAF 帧数驱动的虚拟时间（每帧 1/60s）：
    // 用真实时间驱动的动画（Date.now() 角度、elapsed 计算）在定格帧数相同
    // 时状态完全一致，消除墙钟抖动。仅影响页面 JS 可见的时间读数。
    const FRAME_MS = 1000 / 60;
    const EPOCH = 1700000000000;
    let _frame = 0;
    Date.now = () => EPOCH + _frame * FRAME_MS;
    performance.now = () => _frame * FRAME_MS;

    const cfg = window.__freeze || { warmupFrames: 60, freezeFrames: 30 };
    const WARMUP = cfg.warmupFrames;
    const FREEZE = cfg.freezeFrames;
    const TOTAL = WARMUP + FREEZE;
    let rafCount = 0;
    const realRAF = window.requestAnimationFrame.bind(window);
    const realCancelRAF = window.cancelAnimationFrame.bind(window);
    const realSetInterval = window.setInterval.bind(window);
    const realClearInterval = window.clearInterval.bind(window);

    let frozen = false;

    // 劫持 requestAnimationFrame：仅驱动 TOTAL 帧，之后停止调度
    window.requestAnimationFrame = function (cb) {
        if (frozen) {
            // 定格后忽略新的 rAF 请求（保持画面静止）
            return 0;
        }
        return realRAF((t) => {
            rafCount++;
            _frame = rafCount;   // 虚拟时钟随帧推进（时间驱动动画确定性）
            try {
                cb(_frame * FRAME_MS);   // rAF 时间戳同样虚拟化：引擎 ticker 按帧间隔
                                        // 计算 interval，真实时间戳在掉帧时产生漂移
            } catch (e) {
                console.error('[freeze rAF callback error]', e);
            }
            if (rafCount >= TOTAL) {
                frozen = true;
                // 停止所有由 setInterval 注册的随机动画，避免帧外变色
                for (const id of intervalIds) {
                    realClearInterval(id);
                }
                intervalIds.clear();
                window.__freezeDone = true;
            }
        });
    };
    window.cancelAnimationFrame = function (id) { realCancelRAF(id); };

    // 劫持 setInterval：记录 id，定格时清空
    const intervalIds = new Set();
    window.setInterval = function (fn, delay, ...args) {
        const id = realSetInterval(fn, delay, ...args);
        intervalIds.add(id);
        return id;
    };
    window.clearInterval = function (id) {
        intervalIds.delete(id);
        realClearInterval(id);
    };

    // 兜底：若示例未触发到 TOTAL 帧（如初始化失败），20s 后也标记完成便于排查
    realSetInterval(() => {
        if (!window.__freezeDone) {
            window.__freezeDone = 'timeout';
            console.warn('[freeze] 达到超时仍未完成 ' + rafCount + '/' + TOTAL + ' 帧');
        }
    }, 20000);
}
`;

/**
 * 冻结配置：预热帧数（让异步资源就绪）与定格帧数（进入确定的一帧）。
 */
export interface FreezeOptions
{
    /** 预热帧数：按真实 rAF 自由渲染，等纹理/管线等异步资源就绪 */
    warmupFrames: number;
    /** 定格帧数：再渲染这么多帧后永久停止 rAF，画面定格 */
    freezeFrames: number;
}

/**
 * 打开页面并定格，返回时画面已停在第 `warmupFrames + freezeFrames` 帧。
 *
 * @param page playwright 页面
 * @param url 目标地址
 * @param options 冻结配置
 */
export async function gotoFrozen(page: Page, url: string, options: FreezeOptions): Promise<void>
{
    await page.addInitScript({
        content: `window.__freeze = { warmupFrames: ${options.warmupFrames}, freezeFrames: ${options.freezeFrames} };`,
    });
    await page.addInitScript({ content: `(${FREEZE_SCRIPT})(window);` });
    await page.goto(url, { waitUntil: 'load' });
    // 等待定格完成（FREEZE_SCRIPT 渲染完指定帧数后置 __freezeDone）
    await page.waitForFunction(() => (window as unknown as { __freezeDone?: boolean }).__freezeDone === true, undefined, { timeout: 30000 });
}
