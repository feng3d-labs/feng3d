import { logic as getLogic } from 'feng3d';
import type { Object3D } from 'feng3d';
import { getActiveEditorView } from '../../feng3d/editorViewRegistry';
import { resolveObjectId, getObjectId, requireSceneRoot } from './readCore';

/**
 * 解析并裁到画布内的区域参数。
 *
 * `view.screenshot` 与 `view.probe` 共用同一套坐标与校验：同一件事（只看一块）在两个方法里
 * 不该有两套行为。整块落在画布外时直接报错，而不是给一张空图。
 */
export function readRegion(
    value: unknown,
    width: number,
    height: number,
): { x: number, y: number, width: number, height: number } | undefined
{
    if (value === undefined) return undefined;
    const raw = (value ?? {}) as { x?: unknown, y?: unknown, width?: unknown, height?: unknown };
    const x = Math.max(0, Math.floor(Number(raw.x ?? 0) || 0));
    const y = Math.max(0, Math.floor(Number(raw.y ?? 0) || 0));
    const right = Math.min(width, x + Math.floor(Number(raw.width ?? width) || width));
    const bottom = Math.min(height, y + Math.floor(Number(raw.height ?? height) || height));
    if (right <= x || bottom <= y)
    {
        throw new Error(`region 超出画布或为空：${JSON.stringify(value)}（画布 ${width}x${height}）`);
    }

    return { x, y, width: right - x, height: bottom - y };
}

/** 从画面里裁出一块（按行拷贝，每像素 4 字节；通道顺序无关，原样搬运） */
export function cropPixels(
    pixels: Uint8Array,
    width: number,
    region: { x: number, y: number, width: number, height: number },
): Uint8Array
{
    const cropped = new Uint8Array(region.width * region.height * 4);
    for (let row = 0; row < region.height; row++)
    {
        const from = ((region.y + row) * width + region.x) * 4;
        cropped.set(pixels.subarray(from, from + (region.width * 4)), row * region.width * 4);
    }

    return cropped;
}

/**
 * 编辑器相机的投影器（世界坐标 → NDC）。
 *
 * `view.probe` 的 `project`、`scene.find` 的 `includeScreen`、`scene.validate` 的视野外检查
 * 用的是同一套换算（NDC 的 y 向上、屏幕的 y 向下）——三处各写一遍迟早会走偏。
 *
 * @returns 投影函数；相机尚未就绪时返回 `null`，由调用方决定"不知道"怎么表达
 */
export function getProjector(): ((point: { x: number, y: number, z: number }) => { x: number, y: number, z: number }) | null
{
    const view = getActiveEditorView();
    const cameraLogic = view ? getLogic(view.camera as never) as {
        project?: (point: { x: number, y: number, z: number }) => { x: number, y: number, z: number },
    } | null : null;

    return cameraLogic?.project ? (point) => cameraLogic.project!(point) : null;
}

/** NDC 是否落在视锥内：x/y ∈ [-1,1]，深度 ∈ [0,1]（WebGPU 约定） */
export function isInsideNdc(ndc: { x: number, y: number, z: number }): boolean
{
    return ndc.x >= -1 && ndc.x <= 1 && ndc.y >= -1 && ndc.y <= 1 && ndc.z >= 0 && ndc.z <= 1;
}

/** 对象在场景中的代表点：世界包围盒中心（没有包围盒时退回 position，再退回原点） */
export function objectCenter(object: Object3D): { x: number, y: number, z: number }
{
    return getLogic(object)?.boundingBox?.worldBounds?.getCenter()
        ?? (object.position as { x: number, y: number, z: number })
        ?? { x: 0, y: 0, z: 0 };
}

/** 编辑器画布的像素尺寸（视图未就绪或尺寸为 0 时返回 null） */
export function getCanvasSize(): { width: number, height: number } | null
{
    const view = getActiveEditorView();
    if (!view) return null;
    const canvas = typeof view.canvas === 'string'
        ? document.getElementById(view.canvas) as HTMLCanvasElement | null
        : view.canvas as HTMLCanvasElement | null;
    const width = canvas?.clientWidth ?? 0;
    const height = canvas?.clientHeight ?? 0;

    return width > 0 && height > 0 ? { width, height } : null;
}

/**
 * 对象在相机视野里的位置（NDC + 是否可见，可选屏幕像素）。
 *
 * @param object 目标对象
 * @param projector 由 {@link getProjector} 取到的投影函数；为 `null`（相机未就绪）时返回 `null`，
 *   而不是编造坐标——"不知道"和"看不见"是两回事
 * @param size 画布尺寸；给了才附上屏幕像素。由调用方取一次传进来，避免逐个对象查 DOM
 */
export function projectObjectView(
    object: Object3D,
    projector: ((point: { x: number, y: number, z: number }) => { x: number, y: number, z: number }) | null,
    size?: { width: number, height: number } | null,
): { x: number, y: number, z: number, inFrustum: boolean, active: boolean, visible: boolean, screen?: { x: number, y: number } } | null
{
    if (!projector) return null;
    const ndc = projector(objectCenter(object));
    const round = (value: number) => Number(value.toFixed(3));
    const inFrustum = isInsideNdc(ndc);
    // 关掉的对象即使进了视锥也渲染不出来——只报 inFrustum 会让人以为"看得见"
    const active = getLogic(object)?.activeSelf ?? true;

    return {
        x: round(ndc.x),
        y: round(ndc.y),
        z: round(ndc.z),
        inFrustum,
        active,
        visible: inFrustum && active,
        // 与 view.probe 的 project 用同一套换算：同一件事在两处该长得一样
        ...(size ? { screen: ndcToScreen(ndc, size.width, size.height) } : {}),
    };
}

/** 世界点 → 画布像素坐标（NDC 的 y 向上、屏幕的 y 向下） */
function ndcToScreen(ndc: { x: number, y: number }, width: number, height: number): { x: number, y: number }
{
    return {
        x: Math.round(((ndc.x + 1) / 2) * width),
        y: Math.round(((1 - ndc.y) / 2) * height),
    };
}

/**
 * 把对象投影到画面像素坐标。
 *
 * 为什么需要它：AI 只看得到世界坐标，没法回答"我加的东西到底在画面哪儿、看得见吗"。
 * 有了 NDC 与屏幕坐标，才能把"画面有变化"与"变化的是不是我加的对象"对上——
 * 比如聚焦之后对象应当在画面中心，投影点偏得很远就说明焦距/包围盒出了问题。
 *
 * 与 `SceneView.vue` 的区域选择用同一套换算。
 *
 * @param width 画面像素宽
 * @param height 画面像素高
 * @param objectIds 目标对象路径式 id 数组
 */
export function projectObjects(width: number, height: number, objectIds: unknown): Record<string, unknown>[]
{
    if (!Array.isArray(objectIds)) throw new Error('project 需要 objectId 数组');
    if (objectIds.length > 20) throw new Error(`project 一次最多 20 个对象（收到 ${objectIds.length}）——要一次看全部用 projectAll，或分多次传`);

    const project = getProjector();
    if (!project) throw new Error('编辑器相机尚未就绪（无法投影）');

    const round = (value: number) => Number(value.toFixed(3));

    return objectIds.map((rawId) =>
    {
        const object = resolveObjectId(String(rawId));
        // 用世界包围盒中心而不是 position：对象挂在有位移的父级下时，两者并不相等
        const ndc = project(objectCenter(object));
        const inFrustum = isInsideNdc(ndc);
        // 与 scene.find 的 includeScreen 同样把"在视锥内"与"真的可见"分开：
        // 被 activeSelf 关掉的对象即使进了视锥也渲染不出来
        const active = getLogic(object)?.activeSelf ?? true;

        return {
            id: getObjectId(object),
            name: object.name,
            ndc: { x: round(ndc.x), y: round(ndc.y), z: round(ndc.z) },
            screen: ndcToScreen(ndc, width, height),
            inFrustum,
            active,
            visible: inFrustum && active,
        };
    });
}

/** `view.probe` 一次投影全部对象时的上限（再多就不是"看清分布"而是倾倒坐标） */
export const MAX_PROJECT_ALL = 50;

/**
 * 场景里所有可渲染对象的 id（深度优先，场景根在前）。
 *
 * 用于 `view.probe` 的 `projectAll`：一次看清"东西都在画面哪儿"，不必先 find 一轮。
 */
export function collectRendererIds(): string[]
{
    const ids: string[] = [];
    const walk = (object: Object3D) =>
    {
        if ((object.components ?? []).some((component) => component.__type__ === 'MeshRenderer'))
        {
            ids.push(getObjectId(object));
        }
        for (const child of object.children ?? []) walk(child);
    };
    walk(requireSceneRoot());

    return ids;
}
