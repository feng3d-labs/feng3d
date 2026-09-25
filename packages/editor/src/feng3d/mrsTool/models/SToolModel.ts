import { ComponentLogicBase } from 'feng3d';
import type { Color4, Component3D, Object3D } from 'feng3d';
import { registerLogic, UnReadonly } from '@feng3d/reactivity';
import { CoordinateCube } from './MToolModel';

// ---------------------------------------------------------------------------
// 缩放工具模型（SToolModel）—— 纯数据接口 + Logic
// ---------------------------------------------------------------------------

/**
 * 缩放工具模型组件（纯数据接口）。
 *
 * 迁移自旧写法 `@RegisterComponent() class SToolModel extends Component`。
 *
 * **P0 阶段（编辑器启动解阻塞）说明**：原 class 字段 `xCube` / `oCube` 等指向
 * 在 `init()` 中命令式创建的子组件；新范式下应由**声明式字面量**直接写在
 * `components` / `children` 中，因此 P0 先不声明这些字段（见 Logic 内的 TODO）。
 */
export interface SToolModel extends Component3D
{
    /** 组件类型名 */
    readonly __type__: 'SToolModel';
}

declare module 'feng3d'
{
    interface ComponentMap
    {
        SToolModel: SToolModel;
        CoordinateScaleCube: CoordinateScaleCube;
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        SToolModel: SToolModelLogic;
        CoordinateScaleCube: CoordinateScaleCubeLogic;
    }
}

/** SToolModelLogic 逻辑类。 */
export class SToolModelLogic extends ComponentLogicBase
{
    #data: SToolModel;

    protected constructor(data: SToolModel)
    {
        super(data);
        this.#data = data;
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: SToolModel): SToolModelLogic
    {
        return new SToolModelLogic(data);
    }

    override init(entity?: Object3D): void
    {
        super.init(entity);

        // TODO(P1 API 迁移)：原实现在此命令式创建 3 个缩放轴 + 中心立方体：
        //   this.object3D.name = 'Object3DScaleModel';
        //   this.xCube = serialization.setValue(new Object3D(), { name: 'xCube' }).addComponent(CoordinateScaleCube);
        //   this.xCube.color.setTo(1, 0, 0, 1); { const r = reactive(this.xCube.transform.rotation); r.z = -90; }
        //   ... yCube / zCube / oCube(CoordinateCube) 同理，并 this.object3D.addChild(...)
        // 新范式改写方向：模型写成声明式字面量；颜色用 `{ __type__: 'Color4', ... }`；
        // 旋转/缩放整体写入 `reactive(object3D).rotation = { x, y, z }`。
        void this.#data;
    }
}

// ---------------------------------------------------------------------------
// 缩放轴（CoordinateScaleCube）
// ---------------------------------------------------------------------------

/** 缩放轴组件（纯数据接口）。 */
export interface CoordinateScaleCube extends Component3D
{
    /** 组件类型名 */
    readonly __type__: 'CoordinateScaleCube';

    /** 未选中颜色（默认由 Logic 填充：{ __type__: 'Color4', r: 1, g: 0, b: 0, a: 0.99 }） */
    readonly color?: Color4;

    /** 选中颜色（默认由 Logic 填充：{ __type__: 'Color4', r: 1, g: 1, b: 0, a: 0.99 }） */
    readonly selectedColor?: Color4;

    /** 轴长度（默认 100） */
    readonly length?: number;

    /** 是否选中 */
    readonly selected?: boolean;

    /**
     * 拖拽缩放系数（默认 1）。
     *
     * 由 {@link SToolLogic} 拖拽时经响应式代理写入（原 class 的公开可写字段）。
     */
    readonly scaleValue?: number;
}

/** CoordinateScaleCubeLogic 逻辑类。 */
export class CoordinateScaleCubeLogic extends ComponentLogicBase
{
    #data: CoordinateScaleCube;

    /** 中心立方体组件（由 init 创建） */
    #coordinateCube: CoordinateCube | null = null;
    /** 线框几何体（由 init 创建） */
    #segmentGeometry: unknown = null;
    /** 是否已完成初始化 */
    #isinit = false;

    protected constructor(data: CoordinateScaleCube)
    {
        // 默认值填充（须在 super 之前完成）
        const writable = data as UnReadonly<CoordinateScaleCube>;
        if (data.color === undefined) writable.color = { __type__: 'Color4', r: 1, g: 0, b: 0, a: 0.99 };
        if (data.selectedColor === undefined) writable.selectedColor = { __type__: 'Color4', r: 1, g: 1, b: 0, a: 0.99 };
        if (data.length === undefined) writable.length = 100;
        if (data.selected === undefined) writable.selected = false;
        if (data.scaleValue === undefined) writable.scaleValue = 1;

        super(data);
        this.#data = data;
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: CoordinateScaleCube): CoordinateScaleCubeLogic
    {
        return new CoordinateScaleCubeLogic(data);
    }

    override init(entity?: Object3D): void
    {
        super.init(entity);

        // TODO(P1 API 迁移)：原实现在此
        //   watcher.watch(this, 'selected', this.update, this);
        //   watcher.watch(this, 'scaleValue', this.update, this);   // → effect(() => reactive(data).scaleValue)
        //   xLine + new SegmentGeometry() / new SegmentMaterial()；this.coordinateCube = ...addComponent(CoordinateCube)
        //   mouseHit + serialization.setValue(new CylinderGeometry(), { topRadius: 5, bottomRadius: 5, height })
        //   this.object3D.addChild(...)
        // 新范式：声明式字面量 + effect 监听。
    }

    update(): void
    {
        // TODO(P1 API 迁移)：原实现把配色/选中态同步给中心立方体并重建轴线：
        //   this.#coordinateCube.color = this.#data.color; this.#coordinateCube.selectedColor = this.#data.selectedColor;
        //   logic(this.#coordinateCube).update();
        //   this.#segmentGeometry.segments = [{ start, end: new Vector3(0, scaleValue * length, 0), startColor, endColor }];
        //   { const r = reactive(this.#coordinateCube.transform.position); r.y = length * scaleValue; }
        // 新范式：颜色/位置整体写入响应式代理，线段整体替换 `segments`。
        if (!this.#isinit) return;
        void this.#data.color;
        void this.#data.scaleValue;
        void this.#coordinateCube;
        void this.#segmentGeometry;
    }
}

// 注册到 logic 分发表
registerLogic('SToolModel', SToolModelLogic as unknown as new (data: SToolModel) => SToolModelLogic);
registerLogic('CoordinateScaleCube', CoordinateScaleCubeLogic as unknown as new (data: CoordinateScaleCube) => CoordinateScaleCubeLogic);
