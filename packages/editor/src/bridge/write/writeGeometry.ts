import type { Object3D } from 'feng3d';
import { toRaw } from '@feng3d/reactivity';
import { resolveObjectId } from '../EditorBridge';
import { cloneValue } from './writeCore';
import { isFiniteF32 } from './writeGuards';

/**
 * 规范化对象名。
 *
 * 路径式 id 是用名字拼出来的：空名字会产生空段（`/Untitled/Plane/`），而 `/` 是路径分隔符、
 * `#` 是同级序号分隔符——名字里出现它们会让 id 解析错位。实测：给 Plane 加一个空名字的子对象，
 * 再做一次圆周排列，随后的环境设置就会栈溢出、撤销也失效。
 *
 * @param value 调用方给的名字
 * @param fallback 空名字时的默认名
 */
export function normalizeObjectName(value: unknown, fallback: string): string
{
    const name = value === undefined ? fallback : String(value).trim();
    if (name.length === 0) return fallback;

    const sanitized = name.replace(/[/#]/g, '_');

    return sanitized.length > 0 ? sanitized : fallback;
}

/**
 * 拒绝 id 数组里的重复对象。
 *
 * 同一个对象在批量方法里出现两次，写入与撤销都会作用两次：第二次"撤销"把值恢复到第一次
 * 写入之后的状态，于是撤销后**回不到原值**；group / remove 更会让对象被移进移出两次、直接损坏树。
 */
export function assertNoDuplicateObjects(rawIds: unknown[]): void
{
    const seen = new Set<Object3D>();
    for (const id of rawIds)
    {
        const object = toRaw(resolveObjectId(String(id)));
        if (seen.has(object)) throw new Error(`objectIds 里有重复对象：${String(id)}`);
        seen.add(object);
    }
}

/** 简写形状 → 几何数据类型 */
const SHAPE_GEOMETRY: Record<string, string> = {
    cube: 'CubeGeometry',
    sphere: 'SphereGeometry',
    plane: 'PlaneGeometry',
    cylinder: 'CylinderGeometry',
    capsule: 'CapsuleGeometry',
    torus: 'TorusGeometry',
};

/** 几何构造参数里必须为正的参数名（尺寸与分段数；角度类参数允许负值） */
const POSITIVE_GEOMETRY_PARAMS = /^(radius|radiusTop|radiusBottom|size|width|height|depth|length|widthSegments|heightSegments|depthSegments|radialSegments|tubularSegments|segments|capSegments|arcSegments)$/;

/** 校验几何构造参数：必须是有限数字；尺寸/分段类必须为正 */
function validateGeometryParams(geometryParams: Record<string, unknown>): void
{
    for (const [key, value] of Object.entries(geometryParams))
    {
        if (typeof value !== 'number' || !isFiniteF32(value))
        {
            throw new Error(`geometryParams.${key} 需要有限数字（且不超出 f32 范围），收到：${JSON.stringify(value)}`);
        }
        // 实测：负半径的几何会让渲染栈溢出、整个页面卡死，所以在桥接层就拦住
        if (POSITIVE_GEOMETRY_PARAMS.test(key) && value <= 0)
        {
            throw new Error(`geometryParams.${key} 必须为正数，收到：${value}`);
        }
    }
}

/**
 * 由简写参数构造组件数组。
 *
 * 没有 `shape` 时走 `components` 直传（原行为）。有 `shape` 时自动组装
 * `MeshRenderer + 几何 + 可选 StandardMaterial`：手写这套字面量对 AI 既长又容易写错结构
 * （`geometry` 必须嵌在 `MeshRenderer` 里、材质要走 `uniforms.u_diffuse`），
 * 而"加一个红色球"这种需求并不需要那种细节。
 */
export function buildComponents(params: Record<string, unknown>): unknown[] | undefined
{
    if (params.shape === undefined)
    {
        return params.components === undefined ? undefined : cloneValue(params.components) as unknown[];
    }

    const shape = String(params.shape).toLowerCase();
    const geometryType = SHAPE_GEOMETRY[shape];
    if (!geometryType) throw new Error(`未知 shape：${shape}（可用：${Object.keys(SHAPE_GEOMETRY).join(' / ')}）`);
    if (params.components !== undefined) throw new Error('shape 与 components 不能同时传');

    const color = params.color as { r?: number, g?: number, b?: number, a?: number } | undefined;
    const geometryParams = params.geometryParams === undefined
        ? undefined
        : cloneValue(params.geometryParams) as Record<string, unknown>;
    if (geometryParams !== undefined) validateGeometryParams(geometryParams);
    // 即使调用方没给 color 也配一个默认材质：没有材质的 MeshRenderer 渲染时会走 fallback 路径，
    // 实测这种对象再做一次排列（arrange）之后，后续的环境设置与撤销都会栈溢出、页面卡死
    const material = {
        __type__: 'StandardMaterial',
        uniforms: {
            u_diffuse: {
                __type__: 'Color4',
                r: Number(color?.r ?? 1),
                g: Number(color?.g ?? 1),
                b: Number(color?.b ?? 1),
                a: Number(color?.a ?? 1),
            },
        },
    };

    return [{
        __type__: 'MeshRenderer',
        geometry: {
            __type__: geometryType,
            ...(geometryParams ?? {}),
        },
        material,
    }];
}
