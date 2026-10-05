import { computedAttr, createGeometryLogicState, Geometry, GeometryLogic, geometryBeforeRender, geometryBounding, geometryRaycast, geometryUtils } from 'feng3d';
import { computed, registerLogic } from '@feng3d/reactivity';
import { VertexAttributes } from '@feng3d/webgpu';

declare module 'feng3d'
{
    export interface GeometryMap
    {
        UIGeometry: UIGeometry;
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        UIGeometry: UIGeometryLogic;
    }
}

/**
 * UI几何体（纯数据接口）。
 *
 * 单位四边形：顶点取 `(0,0)` → `(1,1)`，实际尺寸由着色器里的 `u_rect` uniform 缩放
 * （**注意与 `QuadGeometry` 的居中四边形 `[-0.5,0.5]` 不同**，不要互换）。
 *
 * 无构造参数，字面量 `{ __type__: 'UIGeometry' }` 即完整数据；顶点数据全部由
 * {@link UIGeometryLogic} 维护。
 */
export interface UIGeometry extends Geometry
{
    readonly __type__: 'UIGeometry';
}

/**
 * UIGeometryLogic 逻辑类。
 *
 * 继承 {@link GeometryLogic}。顶点数据与原实现逐字一致：
 * positions / uvs / indices 为常量，normals / tangents 由它们派生（原实现是在构造函数里
 * 就地算好写进字段，这里改为 computed，语义与读取结果不变）。
 */
export interface UIGeometryLogic extends GeometryLogic
{
}

/**
 * 工厂函数：UIGeometryLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * @param data 几何数据（raw）
 */
export function uiGeometryLogic(data: UIGeometry): UIGeometryLogic
{
    // 每个属性独立 computed，仅在实际被读取时计算
    const positionsComputed = computed(() => new Float32Array([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0]));
    const uvsComputed = computed(() => new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]));
    const indicesComputed = computed(() => [0, 1, 2, 0, 2, 3]);
    const normalsComputed = computed(() => new Float32Array(geometryUtils.createVertexNormals(
        indicesComputed.value, Array.from(positionsComputed.value), true)));
    const tangentsComputed = computed(() => new Float32Array(geometryUtils.createVertexTangents(
        indicesComputed.value, Array.from(positionsComputed.value), Array.from(uvsComputed.value), true)));

    // attributes：data 由各 computed getter 驱动
    const attrTable: VertexAttributes = {
        a_position: computedAttr(positionsComputed, 'float32x3'),
        a_uv: computedAttr(uvsComputed, 'float32x2'),
        a_normal: computedAttr(normalsComputed, 'float32x3'),
        a_tangent: computedAttr(tangentsComputed, 'float32x3'),
    };
    const state = createGeometryLogicState(() => attrTable, () => indicesComputed.value, data);

    const logic: UIGeometryLogic = {
        get vertices() { return attrTable; },
        get vertexIndices() { return indicesComputed.value; },
        get indices() { return state.indices.value; },
        get draw() { return state.draw.value; },
        get bounding() { return geometryBounding(logic); },
        raycast(ray, shortestCollisionDistance, cullFace) { return geometryRaycast(logic, ray, shortestCollisionDistance, cullFace); },
        beforeRender(renderObject) { geometryBeforeRender(logic, renderObject); },
    };

    return logic;
}

// 注册到统一 logic 分发表
registerLogic('UIGeometry', uiGeometryLogic);

/**
 * 创建 UI 几何体数据。
 *
 * 迁移前这里是 `Geometry.setDefault('Default-UIGeometry', new UIGeometry())`：
 * 把实例登记进默认几何体注册表，供 `Geometry.getDefault('Default-UIGeometry')` 取用。
 * 主仓已移除默认几何体注册表（`Geometry.setDefault` / `getDefaultGeometry` 都不存在），
 * 需要默认几何体的位置改为直接写纯数据字面量 `{ __type__: 'UIGeometry' }` 或调用本工厂。
 *
 * @returns UI 几何体数据
 */
export function createUIGeometry(): UIGeometry
{
    return { __type__: 'UIGeometry' };
}
