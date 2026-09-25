import { Camera, Component3D, ComponentLogicBase, Object3D } from 'feng3d';
import { registerLogic, UnReadonly } from '@feng3d/reactivity';

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

/**
 * GroundGridLogic 逻辑类。
 *
 * **P0 阶段（编辑器启动解阻塞）说明**：
 * 原 class 的 `extends Component` 在新范式下会导致**模块加载期崩溃**——`Component`
 * 已是纯 interface，运行时为 `undefined`，`class X extends undefined` 直接抛
 * `TypeError`。因此本类先只做「结构迁移」，把原 `init` / `update` 中依赖
 * 旧 API 的部分暂缓执行并标注 TODO，避免运行时崩溃。
 *
 * 功能恢复（P1，见 docs/API_MIGRATION.md §3.4–§3.6）：
 * - `new Object3D()` → `{ __type__: 'Object3D', name: 'GroundGrid', ... }` 字面量
 * - `serialization.setValue(obj, {...})` → 推荐改字面量（该 API **仍然存在**于 `@feng3d/serialization`，
 *   改用字面量是为符合纯数据范式，不是因为缺失）
 * - `object3D.addChild(obj)` → 数据里声明 `children: [...]`；运行时挂载 `reactive(host).children.push(obj)`
 * - `object3D.addComponent(Renderable)` → `components: [{ __type__: 'MeshRenderer', geometry, material }]`
 *   ⚠️ **`Renderable` 不在主仓 `ComponentMap`**（只有 `MeshRenderer` / `SkinnedMeshRenderer` 在里面），
 *   写 `{ __type__: 'Renderable' }` 会类型报错——必须用 `'MeshRenderer'`
 * - `new SegmentGeometry()` → `{ __type__: 'SegmentGeometry', segments: [...] }`
 * - `Material.getDefault('Segment-Material')` → 该静态方法**确实不存在**，直接 `{ __type__: 'SegmentMaterial' }`
 * - `new Color4(...)` / `new Vector3(...)` → `{ __type__: 'Color4' | 'Vector3', ... }` 字面量
 *   （两者已是纯数据接口，不可 `new`、无 `fromUnit` 等方法）
 * - `Segment` 的 `start` / `end` / `startColor` / `endColor` **四项全必填**
 * - `editorCamera` 变化触发 `update()` → 改用 `effect` 读 `reactive(data).editorCamera`
 */
export class GroundGridLogic extends ComponentLogicBase
{
    #data: GroundGrid;

    protected constructor(data: GroundGrid)
    {
        // 默认值填充（须在 super 之前完成）
        const writable = data as UnReadonly<GroundGrid>;
        if (data.num === undefined) writable.num = 100;

        super(data);
        this.#data = data;
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: GroundGrid): GroundGridLogic
    {
        return new GroundGridLogic(data);
    }

    init(entity?: Object3D): void
    {
        super.init(entity);

        // TODO(P1 API 迁移)：原实现在此用旧 API 创建地面网格子对象
        // （`addChild` / `addComponent` / `new Xxx()` 均已废除），暂缓执行以免运行时崩溃。
        // 注意并非所有旧 API 都消失：`serialization.setValue` 仍存在，改用字面量是为范式统一。
        // 迁移方向见类注释。
    }

    /** 更新地面网格（由编辑器在相机变化时调用） */
    update(): void
    {
        // TODO(P1 API 迁移)：原实现在此按相机位置重算线段并写入 segmentGeometry.segments，
        // 依赖已移除的 `Camera.transform` / 命令式 Color4、Vector3 构造，待迁移后恢复。
        void this.#data;
    }
}

// 注册到 logic 分发表
registerLogic('GroundGrid', GroundGridLogic as unknown as new (data: GroundGrid) => GroundGridLogic);
