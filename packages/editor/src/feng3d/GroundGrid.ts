import { ComponentLogicBase } from 'feng3d';
import type { Camera, Color4, Component3D, CustomGeometry, Object3D, StandardMaterial } from 'feng3d';
import { reactive, UnReadonly } from '@feng3d/reactivity';

/**
 * 地面网格（纯数据接口）。
 *
 * 迁移自旧写法 `class GroundGrid extends Component` + `@RegisterComponent()`：
 * 在新范式中组件是纯数据接口，行为由 Logic 提供。
 */
export interface GroundGrid extends Component3D
{
    readonly __type__: 'GroundGrid';

    /** 网格线段数量（默认 100，由 Logic 补默认值） */
    readonly num?: number;

    /** 编辑器相机（由编辑器注入） */
    readonly editorCamera?: Camera;
}

declare module 'feng3d'
{
    interface ComponentMap
    {
        GroundGrid: GroundGrid;
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        GroundGrid: GroundGridLogic;
    }
}

/** 网格线厚度（世界单位）：相机默认观察距离下约 1~2 像素 */
const GRID_LINE_THICKNESS = 0.02;

/**
 * 网格线离地高度（对象位置，世界单位）。
 *
 * 网格与地面（`Plane`）都位于 y = 0 时：一是共面深度值相同会被 `depthCompare: 'less'`
 * 丢弃，二是两者到相机的距离相同、`sortBackToFront` 排序并列，地面可能后绘制把网格整片盖掉。
 * 抬高一格最小可见距离即可同时避开这两个问题。
 */
const GRID_Y = 0.01;

/** 一条网格线的位置与朝向 */
interface GridLine
{
    /** 线在另一轴上的坐标 */
    readonly coord: number;
    /** true：沿 X 方向（z = coord）；false：沿 Z 方向（x = coord） */
    readonly alongX: boolean;
}

/**
 * 生成一组网格线的三角形几何体。
 *
 * **为什么用三角形而不是线段**：`SegmentGeometry` + `SegmentMaterial`（line-list）
 * 在当前主仓 WebGPU 渲染路径下不产生可见像素（顶点缓冲、布局、draw 均已验证正确，
 * 详见 `.verify/` 下的线段诊断脚本），而三角形 + `StandardMaterial` 通路验证可用。
 * 因此这里把每条网格线做成一个极细的矩形（2 个三角形），合并进一个 `CustomGeometry`，
 * 既保证可见又只有一次 draw call。
 *
 * 绕序：从 +Y 观察为逆时针（索引 `(0,1,2) + (0,2,3)`），与 `frontFace: 'ccw'` 的正面一致；
 * 反序会让整片网格被 `cullFace: 'back'` 剔除（正面朝下）。
 *
 * @param halfNum 网格半长（网格范围 [-halfNum, halfNum]）
 * @param lines 网格线列表
 */
function createGridGeometry(halfNum: number, lines: readonly GridLine[]): CustomGeometry
{
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    const half = GRID_LINE_THICKNESS / 2;

    for (const line of lines)
    {
        const base = positions.length / 3;
        const x0 = line.alongX ? -halfNum : line.coord - half;
        const x1 = line.alongX ? halfNum : line.coord + half;
        const z0 = line.alongX ? line.coord - half : -halfNum;
        const z1 = line.alongX ? line.coord + half : halfNum;

        positions.push(x0, GRID_Y, z0, x0, GRID_Y, z1, x1, GRID_Y, z1, x1, GRID_Y, z0);
        normals.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0);
        uvs.push(0, 0, 0, 1, 1, 1, 1, 0);
        indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }

    return { __type__: 'CustomGeometry', positions, normals, uvs, indices };
}

/** 生成网格线材质（`StandardMaterial` + 纯色漫反射） */
function createGridMaterial(r: number, g: number, b: number): StandardMaterial
{
    const diffuse: Color4 = { __type__: 'Color4', r, g, b, a: 1 };

    return { __type__: 'StandardMaterial', uniforms: { u_diffuse: diffuse } };
}

/**
 * GroundGridLogic 逻辑类。
 *
 * 职责：在宿主对象下挂 4 组网格线对象——普通线 / 每 10 条加重的线 / X 轴线（红）/
 * Z 轴线（蓝），每组一个 `CustomGeometry`（三角形细线）+ `StandardMaterial`。
 *
 * 迁移自旧写法 `class GroundGrid extends Component`（旧 `init` 用
 * `new Object3D()` + `addComponent(Renderable)` + `Material.getDefault('Segment-Material')`，
 * 旧 `update` 里命令式构造 `Vector3` / `Color4` 并整体替换 `segmentGeometry.segments`）。
 */
export class GroundGridLogic extends ComponentLogicBase
{
    /** 数据引用 */
    #data: GroundGrid;

    /** 网格几何体（分组顺序与 {@link GroundGridLogic.#gridObjects} 一致） */
    readonly #geometries: CustomGeometry[] = [];

    /** 网格子对象（每组一个，不参与鼠标拾取） */
    readonly #gridObjects: Object3D[] = [];

    protected constructor(data: GroundGrid)
    {
        // 默认值填充（须在 super 之前完成）
        const writable = data as UnReadonly<GroundGrid>;
        if (data.num === undefined) writable.num = 100;

        super(data);
        this.#data = data;

        this.#createGridObjects();
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: GroundGrid): GroundGridLogic
    {
        return new GroundGridLogic(data);
    }

    override init(entity?: Object3D): void
    {
        super.init(entity);

        const host = entity ?? (this.entity as Object3D | null);
        if (!host) return;

        // 挂载网格子对象（父子关系由 ContainerLogic 的 effect 维护；
        // children 一般已由 ContainerLogic 构造期 pre-fill，这里只做防御）
        const r_host = reactive(host);
        if (!r_host.children) (host as { children: Object3D[] }).children = [];
        r_host.children.push(...this.#gridObjects);
    }

    /**
     * 重建网格数据（`num` 变化时由外部调用）。
     *
     * 网格固定在原点（与旧实现一致：`startX = startZ = 0; step = 1`）。
     */
    update(): void
    {
        const num = this.#data.num ?? 100;
        const halfNum = num / 2;

        const plain: GridLine[] = [];
        const major: GridLine[] = [];
        const xAxis: GridLine[] = [];
        const zAxis: GridLine[] = [];

        for (let i = -halfNum; i <= halfNum; i++)
        {
            if (i === 0)
            {
                // 过原点的两条线分别作为 X 轴（沿 X，z = 0）与 Z 轴（沿 Z，x = 0）
                xAxis.push({ coord: i, alongX: true });
                zAxis.push({ coord: i, alongX: false });
                continue;
            }
            const target = (i % 10) === 0 ? major : plain;
            target.push({ coord: i, alongX: true }, { coord: i, alongX: false });
        }

        const lineGroups = [plain, major, xAxis, zAxis];
        for (let i = 0; i < lineGroups.length; i++)
        {
            const geometry = createGridGeometry(halfNum, lineGroups[i]);
            const r_geometry = reactive(this.#geometries[i]);
            r_geometry.positions = geometry.positions;
            r_geometry.normals = geometry.normals;
            r_geometry.uvs = geometry.uvs;
            r_geometry.indices = geometry.indices;
        }
    }

    /** 创建 4 组网格子对象与几何体数据（构造期一次性完成，不依赖相机） */
    #createGridObjects(): void
    {
        // 颜色与旧实现一致：普通线 0x777777 / 加重线 0x888888，X 轴红 / Z 轴蓝
        const groups: { name: string, r: number, g: number, b: number }[] = [
            { name: 'GroundGrid', r: 0x77 / 255, g: 0x77 / 255, b: 0x77 / 255 },
            { name: 'GroundGridMajor', r: 0x88 / 255, g: 0x88 / 255, b: 0x88 / 255 },
            { name: 'GroundGridXAxis', r: 1, g: 0, b: 0 },
            { name: 'GroundGridZAxis', r: 0, g: 0, b: 1 },
        ];

        for (const group of groups)
        {
            const geometry: CustomGeometry = { __type__: 'CustomGeometry' };
            this.#geometries.push(geometry);
            this.#gridObjects.push({
                __type__: 'Object3D',
                name: group.name,
                // 抬高一点：避免与地面共面（深度冲突）以及排序并列时被地面覆盖
                position: { x: 0, y: GRID_Y, z: 0 },
                // 与旧实现 `groundGridObject.mouseEnabled = false` 一致：网格线不挡拾取
                mouseEnabled: false,
                components: [{
                    __type__: 'MeshRenderer',
                    geometry,
                    material: createGridMaterial(group.r, group.g, group.b),
                }],
            });
        }

        this.update();
    }
}
