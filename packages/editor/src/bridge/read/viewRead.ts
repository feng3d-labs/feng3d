import { getActiveEditorView } from '../../feng3d/editorViewRegistry';
import { analyzePixels } from '../../feng3d/pixelStats';
import { pixelsToDataURL } from '../../feng3d/screenShotCanvas';
import { collectRendererIds, MAX_PROJECT_ALL, projectObjects, cropPixels, readRegion } from './viewProject';

/**
 * 场景视图截图（主视图所见即所得）。
 *
 * 早期实现走 `canvas.toDataURL()`：WebGPU 画布未保留绘制缓冲，只能取到空白，因此当时选择
 * **明确报错**而不是静默返回空白图。现在改为经 `EditorView.captureFrame()` —— 提交一帧后
 * `readPixels` 读回画布纹理（与资源预览截图同一机制），拿到的是编辑器**正在显示**的画面。
 *
 * 默认缩放到 800px 宽：原尺寸 PNG 的 base64 常达数百 KB，会挤爆上下文。
 *
 * @param params.width 目标宽度（像素），默认 800
 * @param params.region 只截画布上的一块区域 `{ x, y, width, height }`（像素坐标，会被裁到画布内）——
 *   与 `view.probe` 的 `region` 同一套坐标；整块在画布外则报错
 */
export async function viewScreenshot(params: Record<string, unknown>): Promise<unknown>
{
    const view = getActiveEditorView();
    if (!view) throw new Error('找不到编辑器视图（EditorView 尚未创建）');

    const readPixels = await view.captureFrame();
    const sourceWidth = Number(readPixels.copySize[0]);
    const sourceHeight = Number(readPixels.copySize[1]);
    // width <= 0 表示不缩放（保留原尺寸）
    const requestedWidth = params.width === undefined ? 800 : Number(params.width);
    const maxWidth = requestedWidth > 0 ? requestedWidth : undefined;

    // 只看一块区域：与 view.probe 的 region 同一套坐标，省掉"整张图里找那一块"的上下文开销
    const region = readRegion(params.region, sourceWidth, sourceHeight);
    const pixels = region
        ? cropPixels(readPixels.result as Uint8Array, sourceWidth, region)
        : readPixels.result as Uint8Array;
    const pixelsWidth = region?.width ?? sourceWidth;
    const pixelsHeight = region?.height ?? sourceHeight;

    const dataUrl = pixelsToDataURL(
        pixels,
        readPixels.format,
        pixelsWidth,
        pixelsHeight,
        maxWidth,
    );
    const base64 = dataUrl.includes(',') ? dataUrl.slice(dataUrl.indexOf(',') + 1) : '';
    if (!base64) throw new Error('截图为空（readPixels 未返回数据）');

    const scale = maxWidth === undefined ? 1 : Math.min(1, maxWidth / pixelsWidth);

    return {
        mimeType: 'image/png',
        width: Math.round(pixelsWidth * scale),
        height: Math.round(pixelsHeight * scale),
        sourceWidth: pixelsWidth,
        sourceHeight: pixelsHeight,
        ...(region ? { region } : {}),
        base64,
    };
}

/**
 * 场景视图的**像素统计**（不返回图片）。
 *
 * 为什么需要它：`view.screenshot` 的 base64 动辄数百 KB，会挤爆上下文；而 AI 多数时候
 * 只想确认"改完画面上到底有没有变化"。这里提交一帧后只统计像素——颜色种类、主色占比、
 * 亮度范围、灰度缩略网格——总共几百字节，却能区分出几种"看起来成功、其实没画出来"的情形：
 *
 * - 纯色画面（`uniqueColors` 为 1、亮度无范围）→ 空白或画面冻结
 * - 全黑（`maxLuminance` 为 0）→ 材质/光照/着色器出错
 * - 只有背景色（主色占比 ≈ 1）→ 物体没进视锥或被剔除
 *
 * 典型用法：写操作前后各调一次，比较 `uniqueColors` 与 `meanLuminance` 即可判断改动是否生效。
 *
 * @param params.grid 灰度缩略网格边长（默认 8，传 0 不返回网格与字符画，上限 32）
 * @param params.gridValues 是否额外返回数值数组 `grid`（默认 false）——`art` 已含同样的信息，
 *   数值数组在 16×16 时比字符画本身还长
 * @param params.colors 返回的主色数量（默认 5）
 * @param params.project 要投影到画面坐标的对象 id 数组（最多 20 个）：返回它们的 NDC、
 *   屏幕像素与是否在视锥内——"画面有变化"与"变的是不是我加的对象"由此对上
 * @param params.projectAll 投影**所有可渲染对象**（最多 50 个）：一次看清"东西都在画面哪儿"，
 *   不必先 find 一轮；`projectedTotal` 给出可渲染对象总数
 * @param params.region 只统计画布上的一块区域 `{ x, y, width, height }`（像素坐标，会被裁到画布内），
 *   配合 `project` 可精确检查"我关心的那一块渲染出来了吗"
 */
export async function viewProbe(params: Record<string, unknown>): Promise<unknown>
{
    const view = getActiveEditorView();
    if (!view) throw new Error('找不到编辑器视图（EditorView 尚未创建）');

    const readPixels = await view.captureFrame();
    const width = Number(readPixels.copySize[0]);
    const height = Number(readPixels.copySize[1]);

    const requestedGrid = params.grid === undefined ? 8 : Number(params.grid);
    const requestedColors = params.colors === undefined ? 5 : Number(params.colors);
    // 只统计一块区域：配合 project 给出的对象坐标，能精确回答"我关心的那一块渲染出来了吗"
    const requestedRegion = params.region as
        { x?: unknown, y?: unknown, width?: unknown, height?: unknown } | undefined;
    const analysis = analyzePixels(
        readPixels.result as Uint8Array,
        readPixels.format,
        width,
        height,
        {
            gridSize: Number.isFinite(requestedGrid) ? Math.min(32, Math.max(0, Math.floor(requestedGrid))) : 8,
            topColors: Number.isFinite(requestedColors) ? Math.min(16, Math.max(1, Math.floor(requestedColors))) : 5,
            ...(requestedRegion === undefined ? {} : {
                region: {
                    x: Number(requestedRegion.x ?? 0),
                    y: Number(requestedRegion.y ?? 0),
                    width: Number(requestedRegion.width ?? width),
                    height: Number(requestedRegion.height ?? height),
                },
            }),
        },
    );

    // projectAll：一次投影所有可渲染对象（上限 50），并如实给出总数
    const projectAll = params.projectAll === true;
    // 两个都给会互相覆盖 projected：与其静默挑一个，不如直接说清楚
    if (projectAll && params.project !== undefined)
    {
        throw new Error('project 与 projectAll 不能同时给——要指定对象用 project，要全部用 projectAll');
    }
    const allIds = projectAll ? collectRendererIds() : [];

    // art 已经含了 grid 的全部信息（只是换成字符），默认不再重复给数值数组——
    // 16×16 时那一份数组是 769 字符，比字符画本身还长
    const { grid, ...analysisRest } = analysis;

    return {
        width,
        height,
        ...analysisRest,
        ...(grid && params.gridValues === true ? { grid } : {}),
        ...(projectAll
            ? {
                projected: projectObjects(width, height, allIds.slice(0, MAX_PROJECT_ALL), MAX_PROJECT_ALL),
                projectedTotal: allIds.length,
                ...(allIds.length > MAX_PROJECT_ALL
                    ? { projectedTruncated: true, hint: `可渲染对象共 ${allIds.length} 个，只投影了前 ${MAX_PROJECT_ALL} 个` }
                    : {}),
            }
            : {}),
        ...(params.project === undefined
            ? {}
            : { projected: projectObjects(width, height, params.project) }),
    };
}
