import { Geometry, geometryLogic, GeometryLogic } from '../geometry/Geometry';
import { registerLogic, reactive, computed, Computed } from '@feng3d/reactivity';
import { VertexAttribute } from '@feng3d/webgpu';

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        CylinderGeometry: GeometryLogic;
    }
}

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

    // 响应式参数（不修改原始数据，缺失字段通过 ?? 提供默认值；ConeGeometry 按 __type__ 区分）
    const r_geometry = reactive(geometry);
    const isCone = (geometry as { __type__: string }).__type__ === 'ConeGeometry';
    const topRadius = () => r_geometry.topRadius ?? (isCone ? 0 : 0.5);
    const bottomRadius = () => r_geometry.bottomRadius ?? 0.5;
    const height = () => r_geometry.height ?? 2;
    const segmentsW = () => r_geometry.segmentsW ?? 16;
    const segmentsH = () => r_geometry.segmentsH ?? 1;
    const topClosed = () => r_geometry.topClosed ?? !isCone;
    const bottomClosed = () => r_geometry.bottomClosed ?? true;
    const surfaceClosed = () => r_geometry.surfaceClosed ?? true;
    const yUp = () => r_geometry.yUp ?? true;

    // 每个属性独立 computed，仅在实际被读取时计算
    const _positions = computed(() => buildPositions());
    const _normals = computed(() => buildNormals());
    const _tangents = computed(() => buildTangents());
    const _uvs = computed(() => buildUVs());
    const _colors = computed(() =>
    {
        const pos = _positions.value;
        if (pos.length === 0) return new Float32Array(0);
        const count = pos.length / 3;

        return new Float32Array(count * 4).fill(1);
    });
    const _indicesComputed = computed(() => buildIndices());

    // attributes: data 由 computed getter 驱动
    const _attrTable = createAttributes();
    Object.defineProperty(base, 'vertices', { get() { return _attrTable; }, enumerable: true, configurable: true });

    // indices 由 computed 驱动（覆盖基类 getter）
    Object.defineProperty(base, 'vertexIndices', { get() { return _indicesComputed.value; }, enumerable: true, configurable: true });

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
            a_color: computedAttr(_colors, 'float32x4'),
            a_uv: computedAttr(_uvs, 'float32x2'),
            a_normal: computedAttr(_normals, 'float32x3'),
            a_tangent: computedAttr(_tangents, 'float32x3'),
        };
    }

    // ---- 顶点构建（直接返回 Float32Array，内部 reactive 建立依赖） ----
    // 三个方法独立运行同样的迭代结构，各自只填充一种属性；index/startIndex 计数必须保持一致。

    function buildPositions(): Float32Array
    {
        
        let i: number; let j: number; let index = 0;
        let x: number; let y: number; let z: number; let radius: number; let revolutionAngle = 0;
        let comp1: number; let comp2: number; let startIndex = 0;

        const data: number[] = [];
        const revolutionAngleDelta = 2 * Math.PI / segmentsW();

        const addVertex = (px: number, py: number, pz: number) =>
        {
            data[index] = px; data[index + 1] = py; data[index + 2] = pz;
            index += 3;
        };

        // 顶部
        if (topClosed() && topRadius() > 0)
        {
            z = -0.5 * height();
            for (i = 0; i <= segmentsW(); ++i)
            {
                comp1 = yUp() ? -z : 0; comp2 = yUp() ? 0 : z;
                addVertex(0, comp1, comp2);
                revolutionAngle = i * revolutionAngleDelta;
                x = topRadius() * Math.cos(revolutionAngle);
                y = topRadius() * Math.sin(revolutionAngle);
                if (yUp()) { comp1 = -z; comp2 = y; }
                else { comp1 = y; comp2 = z; }
                if (i === segmentsW())
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
        if (bottomClosed() && bottomRadius() > 0)
        {
            z = 0.5 * height();
            startIndex = index;
            for (i = 0; i <= segmentsW(); ++i)
            {
                comp1 = yUp() ? -z : 0; comp2 = yUp() ? 0 : z;
                addVertex(0, comp1, comp2);
                revolutionAngle = i * revolutionAngleDelta;
                x = bottomRadius() * Math.cos(revolutionAngle);
                y = bottomRadius() * Math.sin(revolutionAngle);
                if (yUp()) { comp1 = -z; comp2 = y; }
                else { comp1 = y; comp2 = z; }
                if (i === segmentsW())
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
        if (surfaceClosed())
        {
            for (j = 0; j <= segmentsH(); ++j)
            {
                radius = topRadius() - ((j / segmentsH()) * (topRadius() - bottomRadius()));
                z = -(height() / 2) + (j / segmentsH() * height());
                startIndex = index;
                for (i = 0; i <= segmentsW(); ++i)
                {
                    revolutionAngle = i * revolutionAngleDelta;
                    x = radius * Math.cos(revolutionAngle);
                    y = radius * Math.sin(revolutionAngle);
                    if (yUp()) { comp1 = -z; comp2 = y; }
                    else { comp1 = y; comp2 = z; }
                    if (i === segmentsW())
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
        
        let i: number; let j: number; let index = 0;
        let x: number; let y: number; let z: number; let radius: number; let revolutionAngle = 0;
        let t1: number; let t2: number; let startIndex = 0;

        const data: number[] = [];
        const revolutionAngleDelta = 2 * Math.PI / segmentsW();
        const dr = bottomRadius() - topRadius();
        const latNormElev = dr / height();
        const latNormBase = (latNormElev === 0) ? 1 : height() / dr;

        const addVertex = (nx: number, ny: number, nz: number) =>
        {
            data[index] = nx; data[index + 1] = ny; data[index + 2] = nz;
            index += 3;
        };

        // 顶部
        if (topClosed() && topRadius() > 0)
        {
            z = -0.5 * height();
            for (i = 0; i <= segmentsW(); ++i)
            {
                if (yUp()) { t1 = 1; t2 = 0; }
                else { t1 = 0; t2 = -1; }
                addVertex(0, t1, t2);
                revolutionAngle = i * revolutionAngleDelta;
                x = topRadius() * Math.cos(revolutionAngle);
                y = topRadius() * Math.sin(revolutionAngle);
                if (i === segmentsW())
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
        if (bottomClosed() && bottomRadius() > 0)
        {
            z = 0.5 * height();
            startIndex = index;
            for (i = 0; i <= segmentsW(); ++i)
            {
                if (yUp()) { t1 = -1; t2 = 0; }
                else { t1 = 0; t2 = 1; }
                addVertex(0, t1, t2);
                revolutionAngle = i * revolutionAngleDelta;
                x = bottomRadius() * Math.cos(revolutionAngle);
                y = bottomRadius() * Math.sin(revolutionAngle);
                if (i === segmentsW())
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
        if (surfaceClosed())
        {
            let na0: number; let na1: number; let naComp1: number; let naComp2: number;
            for (j = 0; j <= segmentsH(); ++j)
            {
                radius = topRadius() - ((j / segmentsH()) * (topRadius() - bottomRadius()));
                z = -(height() / 2) + (j / segmentsH() * height());
                startIndex = index;
                for (i = 0; i <= segmentsW(); ++i)
                {
                    revolutionAngle = i * revolutionAngleDelta;
                    na0 = latNormBase * Math.cos(revolutionAngle);
                    na1 = latNormBase * Math.sin(revolutionAngle);
                    if (yUp()) { naComp1 = latNormElev; naComp2 = na1; }
                    else { naComp1 = na1; naComp2 = latNormElev; }
                    if (i === segmentsW())
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
        
        let i: number; let j: number; let index = 0;
        let radius: number; let z: number; let revolutionAngle = 0;
        let t1: number; let t2: number; let startIndex = 0;

        const data: number[] = [];
        const revolutionAngleDelta = 2 * Math.PI / segmentsW();
        const dr = bottomRadius() - topRadius();
        const latNormElev = dr / height();
        const latNormBase = (latNormElev === 0) ? 1 : height() / dr;

        const addVertex = (tx: number, ty: number, tz: number) =>
        {
            data[index] = tx; data[index + 1] = ty; data[index + 2] = tz;
            index += 3;
        };

        // 顶部
        if (topClosed() && topRadius() > 0)
        {
            z = -0.5 * height();
            for (i = 0; i <= segmentsW(); ++i)
            {
                addVertex(1, 0, 0);
                revolutionAngle = i * revolutionAngleDelta;
                if (i === segmentsW())
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
        if (bottomClosed() && bottomRadius() > 0)
        {
            z = 0.5 * height();
            startIndex = index;
            for (i = 0; i <= segmentsW(); ++i)
            {
                addVertex(1, 0, 0);
                revolutionAngle = i * revolutionAngleDelta;
                if (i === segmentsW())
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
        if (surfaceClosed())
        {
            let na0: number; let na1: number;
            for (j = 0; j <= segmentsH(); ++j)
            {
                radius = topRadius() - ((j / segmentsH()) * (topRadius() - bottomRadius()));
                z = -(height() / 2) + (j / segmentsH() * height());
                startIndex = index;
                for (i = 0; i <= segmentsW(); ++i)
                {
                    revolutionAngle = i * revolutionAngleDelta;
                    na0 = latNormBase * Math.cos(revolutionAngle);
                    na1 = latNormBase * Math.sin(revolutionAngle);
                    if (yUp()) { t1 = 0; t2 = -na0; }
                    else { t1 = -na0; t2 = 0; }
                    if (i === segmentsW())
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
        
        let i: number; let j: number; let x: number; let y: number; let revolutionAngle: number;
        const data: number[] = [];
        const revolutionAngleDelta = 2 * Math.PI / segmentsW();
        let index = 0;
        if (topClosed())
        {
            for (i = 0; i <= segmentsW(); ++i)
            {
                revolutionAngle = i * revolutionAngleDelta;
                x = 0.5 + 0.5 * -Math.cos(revolutionAngle);
                y = 0.5 + 0.5 * Math.sin(revolutionAngle);
                data[index++] = 0.5; data[index++] = 0.5;
                data[index++] = x; data[index++] = y;
            }
        }
        if (bottomClosed())
        {
            for (i = 0; i <= segmentsW(); ++i)
            {
                revolutionAngle = i * revolutionAngleDelta;
                x = 0.5 + 0.5 * Math.cos(revolutionAngle);
                y = 0.5 + 0.5 * Math.sin(revolutionAngle);
                data[index++] = 0.5; data[index++] = 0.5;
                data[index++] = x; data[index++] = y;
            }
        }
        if (surfaceClosed())
        {
            for (j = 0; j <= segmentsH(); ++j) for (i = 0; i <= segmentsW(); ++i)
            {
                data[index++] = (i / segmentsW());
                data[index++] = (j / segmentsH());
            }
        }

        return new Float32Array(data);
    }

    function buildIndices(): number[]
    {
        
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

        if (topClosed() && topRadius() > 0)
        {
            for (i = 0; i <= segmentsW(); ++i)
            {
                index += 2;
                if (i > 0) addTriangle(index - 1, index - 3, index - 2);
            }
        }
        if (bottomClosed() && bottomRadius() > 0)
        {
            for (i = 0; i <= segmentsW(); ++i)
            {
                index += 2;
                if (i > 0) addTriangle(index - 2, index - 3, index - 1);
            }
        }
        if (surfaceClosed())
        {
            let a: number; let b: number; let c: number; let d: number;
            for (j = 0; j <= segmentsH(); ++j) for (i = 0; i <= segmentsW(); ++i)
            {
                index++;
                if (i > 0 && j > 0)
                {
                    a = index - 1; b = index - 2;
                    c = b - segmentsW() - 1; d = a - segmentsW() - 1;
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
