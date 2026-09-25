import type { Object3D } from 'feng3d';
import { toRaw } from '@feng3d/reactivity';
import { resolveObjectId } from '../EditorBridge';
import { cloneValue } from './writeCore';
import { isFiniteF32, MATERIAL_FIELD_MAP, toColor4 } from './writePure';

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
        if (seen.has(object)) throw new Error(`objectIds 里有重复对象：${String(id)}——每个对象只能出现一次，否则写入与撤销会各作用两次`);
        seen.add(object);
    }
}

/**
 * 简写形状 → 几何类型 + 允许的构造参数名。
 *
 * 参数名与 `packages/feng3d/src/primitives/*Geometry.ts` 的接口字段逐一对齐（`ConeGeometry`
 * 复用 `CylinderGeometry` 的字段）。**不能凭印象写**：引擎会静默忽略多余字段，名字写错
 * （比如照着 three.js 写 `radiusTop`，而引擎用的是 `topRadius`）就会"看起来设置成功了"、
 * 实际什么都没变。
 */
const SHAPE_GEOMETRY: Record<string, { readonly type: string, readonly params: readonly string[] }> = {
    cube: { type: 'CubeGeometry', params: ['width', 'height', 'depth', 'segmentsW', 'segmentsH', 'segmentsD'] },
    sphere: { type: 'SphereGeometry', params: ['radius', 'segmentsW', 'segmentsH'] },
    plane: { type: 'PlaneGeometry', params: ['width', 'height', 'segmentsW', 'segmentsH'] },
    cylinder: { type: 'CylinderGeometry', params: ['topRadius', 'bottomRadius', 'height', 'segmentsW', 'segmentsH'] },
    cone: { type: 'ConeGeometry', params: ['topRadius', 'bottomRadius', 'height', 'segmentsW', 'segmentsH'] },
    capsule: { type: 'CapsuleGeometry', params: ['radius', 'height', 'segmentsW', 'segmentsH'] },
    torus: { type: 'TorusGeometry', params: ['radius', 'tubeRadius', 'segmentsR', 'segmentsT'] },
    quad: { type: 'QuadGeometry', params: [] },
};

/**
 * 校验几何构造参数。
 *
 * 只放行该形状**真正支持**的参数名：引擎会静默忽略多余字段，于是 `{ radiusTop: 1 }`（名字拼错）
 * 或给不该带参数的形状塞参数，都会"看起来设置成功了"，实际什么都没变——这正是最误导人的失败。
 * 值一律要求正数：这些参数不是尺寸就是分段数，负数没有意义（实测负半径会让渲染栈溢出）。
 */
function validateGeometryParams(geometryParams: Record<string, unknown>, shape: string): void
{
    const allowed = SHAPE_GEOMETRY[shape].params;
    for (const [key, value] of Object.entries(geometryParams))
    {
        if (!allowed.includes(key))
        {
            const hint = allowed.length > 0 ? `（可用：${allowed.join(' / ')}）` : '（该形状没有可调参数）';
            throw new Error(`geometryParams.${key} 不是 ${shape} 的参数${hint}`);
        }
        if (typeof value !== 'number' || !isFiniteF32(value))
        {
            throw new Error(`geometryParams.${key} 需要有限数字（且不超出 f32 范围），收到：${JSON.stringify(value)}`);
        }
        // 实测：负半径的几何会让渲染栈溢出、整个页面卡死，所以在桥接层就拦住
        if (value <= 0) throw new Error(`geometryParams.${key} 必须为正数，收到：${value}`);
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
    const shapeInfo = SHAPE_GEOMETRY[shape];
    if (!shapeInfo) throw new Error(`未知 shape：${shape}（可用：${Object.keys(SHAPE_GEOMETRY).join(' / ')}）`);
    if (params.components !== undefined) throw new Error('shape 与 components 不能同时传');

    const color = params.color as { r?: number, g?: number, b?: number, a?: number } | undefined;
    const geometryParams = params.geometryParams === undefined
        ? undefined
        : cloneValue(params.geometryParams) as Record<string, unknown>;
    if (geometryParams !== undefined) validateGeometryParams(geometryParams, shape);
    // 即使调用方没给 color 也配一个默认材质：没有材质的 MeshRenderer 渲染时会走 fallback 路径，
    // 实测这种对象再做一次排列（arrange）之后，后续的环境设置与撤销都会栈溢出、页面卡死
    const uniforms: Record<string, unknown> = {
        u_diffuse: {
            __type__: 'Color4',
            r: Number(color?.r ?? 1),
            g: Number(color?.g ?? 1),
            b: Number(color?.b ?? 1),
            a: Number(color?.a ?? 1),
        },
    };
    // 建对象时也能一次给全材质细节（光泽度、反射强度、透明裁剪……），
    // 省掉"先 add、再 setMaterial"这一步；字段映射与 setMaterial 共用同一份
    for (const [field, mapping] of Object.entries(MATERIAL_FIELD_MAP))
    {
        if (field === 'color' || params[field] === undefined) continue;
        if (mapping.color)
        {
            uniforms[mapping.uniform] = toColor4(params[field], field);
            continue;
        }
        const value = Number(params[field]);
        if (!isFiniteF32(value))
        {
            throw new Error(`${field} 需要有限数字（且不超出 f32 范围），收到：${JSON.stringify(params[field])}`);
        }
        uniforms[mapping.uniform] = value;
    }
    const material = { __type__: 'StandardMaterial', uniforms };

    return [{
        __type__: 'MeshRenderer',
        geometry: {
            __type__: shapeInfo.type,
            ...(geometryParams ?? {}),
        },
        material,
    }];
}
