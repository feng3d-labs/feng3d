import { Geometry, geometryLogic, GeometryLogic, registerCloneFactory, registerDefaultGeometryFactory } from '../geometry/Geometry';
import { registerLogic, reactive, computed, Computed, UnReadonly } from '@feng3d/reactivity';
import { VertexAttribute } from '@feng3d/webgpu';

declare module '../geometry/Geometry'
{
    export interface GeometryMap
    {
        CylinderGeometry: CylinderGeometry;
    }
}

/**
 * 圆柱体几何体（纯数据接口）。
 */
export interface CylinderGeometry extends Geometry
{
    readonly __type__: 'CylinderGeometry';
    /** 顶部半径（缺失时由工厂填充默认值） */
    readonly topRadius?: number;
    /** 底部半径（缺失时由工厂填充默认值） */
    readonly bottomRadius?: number;
    /** 高度（缺失时由工厂填充默认值） */
    readonly height?: number;
    /** 横向分割数（缺失时由工厂填充默认值） */
    readonly segmentsW?: number;
    /** 纵向分割数（缺失时由工厂填充默认值） */
    readonly segmentsH?: number;
    /** 顶部是否封口（缺失时由工厂填充默认值） */
    readonly topClosed?: boolean;
    /** 底部是否封口（缺失时由工厂填充默认值） */
    readonly bottomClosed?: boolean;
    /** 侧面是否封口（缺失时由工厂填充默认值） */
    readonly surfaceClosed?: boolean;
    /** 是否朝上（缺失时由工厂填充默认值） */
    readonly yUp?: boolean;
}

// CylinderGeometry 默认值由 CylinderGeometryLogic 工厂顶部处理（见下）

/**
 * 创建圆柱体几何体 logic 实例（函数式实现；ConeGeometry 亦复用本工厂）。
 *
 * 组合 {@link geometryLogic}，每个顶点属性用 computed 独立懒计算，
 * 依赖 topRadius/bottomRadius/height/segmentsW/segmentsH/topClosed/bottomClosed/surfaceClosed/yUp。
 * 不使用 effect/invalidateGeometry — 参数变化时 computed 自动失效重算。
 *
 * @param geometry CylinderGeometry（或 ConeGeometry，按 __type__ 区分默认值）
 */
export function cylinderGeometryLogic(geometry: CylinderGeometry): GeometryLogic
{
    // 组合基座
    const base = geometryLogic(geometry);

    // 默认值（缺失字段单独赋值；ConeGeometry 复用本 Logic，按 __type__ 区分默认值）
    const isCone = (geometry as { __type__: string }).__type__ === 'ConeGeometry';
    const writable = geometry as UnReadonly<CylinderGeometry>;
    if (geometry.name === undefined) writable.name = isCone ? 'Cone' : 'Cylinder';
    if (geometry.scaleU === undefined) writable.scaleU = 1;
    if (geometry.scaleV === undefined) writable.scaleV = 1;
    if (geometry.topRadius === undefined) writable.topRadius = isCone ? 0 : 0.5;
    if (geometry.bottomRadius === undefined) writable.bottomRadius = 0.5;
    if (geometry.height === undefined) writable.height = 2;
    if (geometry.segmentsW === undefined) writable.segmentsW = 16;
    if (geometry.segmentsH === undefined) writable.segmentsH = 1;
    if (geometry.topClosed === undefined) writable.topClosed = !isCone;
    if (geometry.bottomClosed === undefined) writable.bottomClosed = true;
    if (geometry.surfaceClosed === undefined) writable.surfaceClosed = true;
    if (geometry.yUp === undefined) writable.yUp = true;

    // 每个属性独立 computed，仅在实际被读取时计算
    const _positions = computed(() => buildPositions());
    const _normals = computed(() => buildNormals());
    const _tangents = computed(() => buildTangents());
    const _uvs = computed(() => buildUVs());
    const _indicesComputed = computed(() => buildIndices());

    // attributes: data 由 computed getter 驱动
    base.setAttributes(createAttributes());

    // indices 由 computed 驱动（覆盖基类 getter）
    Object.defineProperty(base, 'indices', { get() { return _indicesComputed.value; }, enumerable: true, configurable: true });

    function createAttributes(): Record<string, VertexAttribute>
    {
        const computedAttr = (ref: Computed<Float32Array>, format: VertexAttribute['format']): VertexAttribute =>
        {
            const obj: VertexAttribute = { data: new Float32Array(), format };
            Object.defineProperty(obj, 'data', { get() { return ref.value; }, enumerable: true });

            return obj;
        };

        return {
            a_position: computedAttr(_positions, 'float32x3'),
            a_uv: computedAttr(_uvs, 'float32x2'),
            a_normal: computedAttr(_normals, 'float32x3'),
            a_tangent: computedAttr(_tangents, 'float32x3'),
            a_skinIndices: { data: new Float32Array(), format: 'float32x4' },
            a_skinWeights: { data: new Float32Array(), format: 'float32x4' },
            a_skinIndices1: { data: new Float32Array(), format: 'float32x4' },
            a_skinWeights1: { data: new Float32Array(), format: 'float32x4' },
        };
    }

    // ---- 顶点构建（直接返回 Float32Array，内部 reactive 建立依赖） ----
    // 三个方法独立运行同样的迭代结构，各自只填充一种属性；index/startIndex 计数必须保持一致。

    function buildPositions(): Float32Array
    {
        const g = reactive(geometry);
        let i: number; let j: number; let index = 0;
        let x: number; let y: number; let z: number; let radius: number; let revolutionAngle = 0;
        let comp1: number; let comp2: number; let startIndex = 0;

        const data: number[] = [];
        const revolutionAngleDelta = 2 * Math.PI / g.segmentsW;

        const addVertex = (px: number, py: number, pz: number) =>
        {
            data[index] = px; data[index + 1] = py; data[index + 2] = pz;
            index += 3;
        };

        // 顶部
        if (g.topClosed && g.topRadius > 0)
        {
            z = -0.5 * g.height;
            for (i = 0; i <= g.segmentsW; ++i)
            {
                comp1 = g.yUp ? -z : 0; comp2 = g.yUp ? 0 : z;
                addVertex(0, comp1, comp2);
                revolutionAngle = i * revolutionAngleDelta;
                x = g.topRadius * Math.cos(revolutionAngle);
                y = g.topRadius * Math.sin(revolutionAngle);
                if (g.yUp) { comp1 = -z; comp2 = y; }
                else { comp1 = y; comp2 = z; }
                if (i === g.segmentsW)
                {
                    addVertex(data[startIndex + 3], data[startIndex + 4], data[startIndex + 5]);
                }
                else
                {
                    addVertex(x, comp1, comp2);
                }
            }
        }

        // 底部
        if (g.bottomClosed && g.bottomRadius > 0)
        {
            z = 0.5 * g.height;
            startIndex = index;
            for (i = 0; i <= g.segmentsW; ++i)
            {
                comp1 = g.yUp ? -z : 0; comp2 = g.yUp ? 0 : z;
                addVertex(0, comp1, comp2);
                revolutionAngle = i * revolutionAngleDelta;
                x = g.bottomRadius * Math.cos(revolutionAngle);
                y = g.bottomRadius * Math.sin(revolutionAngle);
                if (g.yUp) { comp1 = -z; comp2 = y; }
                else { comp1 = y; comp2 = z; }
                if (i === g.segmentsW)
                {
                    addVertex(x, data[startIndex + 1], data[startIndex + 2]);
                }
                else
                {
                    addVertex(x, comp1, comp2);
                }
            }
        }

        // 侧面
        if (g.surfaceClosed)
        {
            for (j = 0; j <= g.segmentsH; ++j)
            {
                radius = g.topRadius - ((j / g.segmentsH) * (g.topRadius - g.bottomRadius));
                z = -(g.height / 2) + (j / g.segmentsH * g.height);
                startIndex = index;
                for (i = 0; i <= g.segmentsW; ++i)
                {
                    revolutionAngle = i * revolutionAngleDelta;
                    x = radius * Math.cos(revolutionAngle);
                    y = radius * Math.sin(revolutionAngle);
                    if (g.yUp) { comp1 = -z; comp2 = y; }
                    else { comp1 = y; comp2 = z; }
                    if (i === g.segmentsW)
                    {
                        addVertex(data[startIndex], data[startIndex + 1], data[startIndex + 2]);
                    }
                    else
                    {
                        addVertex(x, comp1, comp2);
                    }
                }
            }
        }

        return new Float32Array(data);
    }

    function buildNormals(): Float32Array
    {
        const g = reactive(geometry);
        let i: number; let j: number; let index = 0;
        let x: number; let y: number; let z: number; let radius: number; let revolutionAngle = 0;
        let t1: number; let t2: number; let startIndex = 0;

        const data: number[] = [];
        const revolutionAngleDelta = 2 * Math.PI / g.segmentsW;
        const dr = g.bottomRadius - g.topRadius;
        const latNormElev = dr / g.height;
        const latNormBase = (latNormElev === 0) ? 1 : g.height / dr;

        const addVertex = (nx: number, ny: number, nz: number) =>
        {
            data[index] = nx; data[index + 1] = ny; data[index + 2] = nz;
            index += 3;
        };

        // 顶部
        if (g.topClosed && g.topRadius > 0)
        {
            z = -0.5 * g.height;
            for (i = 0; i <= g.segmentsW; ++i)
            {
                if (g.yUp) { t1 = 1; t2 = 0; }
                else { t1 = 0; t2 = -1; }
                addVertex(0, t1, t2);
                revolutionAngle = i * revolutionAngleDelta;
                x = g.topRadius * Math.cos(revolutionAngle);
                y = g.topRadius * Math.sin(revolutionAngle);
                if (i === g.segmentsW)
                {
                    addVertex(0, t1, t2);
                }
                else
                {
                    addVertex(0, t1, t2);
                }
            }
        }

        // 底部
        if (g.bottomClosed && g.bottomRadius > 0)
        {
            z = 0.5 * g.height;
            startIndex = index;
            for (i = 0; i <= g.segmentsW; ++i)
            {
                if (g.yUp) { t1 = -1; t2 = 0; }
                else { t1 = 0; t2 = 1; }
                addVertex(0, t1, t2);
                revolutionAngle = i * revolutionAngleDelta;
                x = g.bottomRadius * Math.cos(revolutionAngle);
                y = g.bottomRadius * Math.sin(revolutionAngle);
                if (i === g.segmentsW)
                {
                    addVertex(0, t1, t2);
                }
                else
                {
                    addVertex(0, t1, t2);
                }
            }
        }

        // 侧面
        if (g.surfaceClosed)
        {
            let na0: number; let na1: number; let naComp1: number; let naComp2: number;
            for (j = 0; j <= g.segmentsH; ++j)
            {
                radius = g.topRadius - ((j / g.segmentsH) * (g.topRadius - g.bottomRadius));
                z = -(g.height / 2) + (j / g.segmentsH * g.height);
                startIndex = index;
                for (i = 0; i <= g.segmentsW; ++i)
                {
                    revolutionAngle = i * revolutionAngleDelta;
                    na0 = latNormBase * Math.cos(revolutionAngle);
                    na1 = latNormBase * Math.sin(revolutionAngle);
                    if (g.yUp) { naComp1 = latNormElev; naComp2 = na1; }
                    else { naComp1 = na1; naComp2 = latNormElev; }
                    if (i === g.segmentsW)
                    {
                        addVertex(na0, latNormElev, na1);
                    }
                    else
                    {
                        addVertex(na0, naComp1, naComp2);
                    }
                }
            }
        }

        return new Float32Array(data);
    }

    function buildTangents(): Float32Array
    {
        const g = reactive(geometry);
        let i: number; let j: number; let index = 0;
        let radius: number; let z: number; let revolutionAngle = 0;
        let t1: number; let t2: number; let startIndex = 0;

        const data: number[] = [];
        const revolutionAngleDelta = 2 * Math.PI / g.segmentsW;
        const dr = g.bottomRadius - g.topRadius;
        const latNormElev = dr / g.height;
        const latNormBase = (latNormElev === 0) ? 1 : g.height / dr;

        const addVertex = (tx: number, ty: number, tz: number) =>
        {
            data[index] = tx; data[index + 1] = ty; data[index + 2] = tz;
            index += 3;
        };

        // 顶部
        if (g.topClosed && g.topRadius > 0)
        {
            z = -0.5 * g.height;
            for (i = 0; i <= g.segmentsW; ++i)
            {
                addVertex(1, 0, 0);
                revolutionAngle = i * revolutionAngleDelta;
                if (i === g.segmentsW)
                {
                    addVertex(1, 0, 0);
                }
                else
                {
                    addVertex(1, 0, 0);
                }
            }
        }

        // 底部
        if (g.bottomClosed && g.bottomRadius > 0)
        {
            z = 0.5 * g.height;
            startIndex = index;
            for (i = 0; i <= g.segmentsW; ++i)
            {
                addVertex(1, 0, 0);
                revolutionAngle = i * revolutionAngleDelta;
                if (i === g.segmentsW)
                {
                    addVertex(1, 0, 0);
                }
                else
                {
                    addVertex(1, 0, 0);
                }
            }
        }

        // 侧面
        if (g.surfaceClosed)
        {
            let na0: number; let na1: number;
            for (j = 0; j <= g.segmentsH; ++j)
            {
                radius = g.topRadius - ((j / g.segmentsH) * (g.topRadius - g.bottomRadius));
                z = -(g.height / 2) + (j / g.segmentsH * g.height);
                startIndex = index;
                for (i = 0; i <= g.segmentsW; ++i)
                {
                    revolutionAngle = i * revolutionAngleDelta;
                    na0 = latNormBase * Math.cos(revolutionAngle);
                    na1 = latNormBase * Math.sin(revolutionAngle);
                    if (g.yUp) { t1 = 0; t2 = -na0; }
                    else { t1 = -na0; t2 = 0; }
                    if (i === g.segmentsW)
                    {
                        addVertex(na1, t1, t2);
                    }
                    else
                    {
                        addVertex(-na1, t1, t2);
                    }
                }
            }
        }

        return new Float32Array(data);
    }

    function buildUVs(): Float32Array
    {
        const g = reactive(geometry);
        let i: number; let j: number; let x: number; let y: number; let revolutionAngle: number;
        const data: number[] = [];
        const revolutionAngleDelta = 2 * Math.PI / g.segmentsW;
        let index = 0;
        if (g.topClosed)
        {
            for (i = 0; i <= g.segmentsW; ++i)
            {
                revolutionAngle = i * revolutionAngleDelta;
                x = 0.5 + 0.5 * -Math.cos(revolutionAngle);
                y = 0.5 + 0.5 * Math.sin(revolutionAngle);
                data[index++] = 0.5; data[index++] = 0.5;
                data[index++] = x; data[index++] = y;
            }
        }
        if (g.bottomClosed)
        {
            for (i = 0; i <= g.segmentsW; ++i)
            {
                revolutionAngle = i * revolutionAngleDelta;
                x = 0.5 + 0.5 * Math.cos(revolutionAngle);
                y = 0.5 + 0.5 * Math.sin(revolutionAngle);
                data[index++] = 0.5; data[index++] = 0.5;
                data[index++] = x; data[index++] = y;
            }
        }
        if (g.surfaceClosed)
        {
            for (j = 0; j <= g.segmentsH; ++j) for (i = 0; i <= g.segmentsW; ++i)
            {
                data[index++] = (i / g.segmentsW);
                data[index++] = (j / g.segmentsH);
            }
        }

        return new Float32Array(data);
    }

    function buildIndices(): number[]
    {
        const g = reactive(geometry);
        let i: number; let j: number; let index = 0;
        const indices: number[] = [];
        let n = 0;
        // CCW 环绕（配合 frontFace:'ccw'）：写入顺序交换后两个顶点，使三角形从外法线一侧观察为逆时针。
        const addTriangle = (vertexIndex0: number, vertexIndex1: number, vertexIndex2: number) =>
        {
            indices[n++] = vertexIndex0;
            indices[n++] = vertexIndex2;
            indices[n++] = vertexIndex1;
        };

        if (g.topClosed && g.topRadius > 0)
        {
            for (i = 0; i <= g.segmentsW; ++i)
            {
                index += 2;
                if (i > 0) addTriangle(index - 1, index - 3, index - 2);
            }
        }
        if (g.bottomClosed && g.bottomRadius > 0)
        {
            for (i = 0; i <= g.segmentsW; ++i)
            {
                index += 2;
                if (i > 0) addTriangle(index - 2, index - 3, index - 1);
            }
        }
        if (g.surfaceClosed)
        {
            let a: number; let b: number; let c: number; let d: number;
            for (j = 0; j <= g.segmentsH; ++j) for (i = 0; i <= g.segmentsW; ++i)
            {
                index++;
                if (i > 0 && j > 0)
                {
                    a = index - 1; b = index - 2;
                    c = b - g.segmentsW - 1; d = a - g.segmentsW - 1;
                    addTriangle(a, b, c);
                    addTriangle(a, c, d);
                }
            }
        }

        return indices;
    }

    return base;
}

registerLogic('CylinderGeometry', cylinderGeometryLogic);
registerCloneFactory('CylinderGeometry', (src: CylinderGeometry) => ({ ...src }) as CylinderGeometry);
registerDefaultGeometryFactory('Cylinder', () => ({ __type__: 'CylinderGeometry' } as CylinderGeometry));
