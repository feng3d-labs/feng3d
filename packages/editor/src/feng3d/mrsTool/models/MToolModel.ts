import { ComponentLogicBase } from 'feng3d';
import type { Color4, Component3D, Object3D } from 'feng3d';
import { registerLogic, UnReadonly } from '@feng3d/reactivity';

// ---------------------------------------------------------------------------
// 移动工具模型（MToolModel）—— 纯数据接口 + Logic
// ---------------------------------------------------------------------------

/**
 * 移动工具模型组件（纯数据接口）。
 *
 * 迁移自旧写法 `@RegisterComponent() class MToolModel extends Component`。
 *
 * **P0 阶段（编辑器启动解阻塞）说明**：原 class 字段 `xAxis` / `yzPlane` 等指向
 * 在 `init()` 中命令式创建的子组件；新范式下这些子对象应由**声明式字面量**
 * 直接写在 `components` / `children` 中，因此 P0 先不声明这些字段（迁移方向见
 * {@link MToolModelLogic.init} 的 TODO）。
 */
export interface MToolModel extends Component3D
{
    /** 组件类型名 */
    readonly __type__: 'MToolModel';
}

declare module 'feng3d'
{
    interface ComponentMap
    {
        MToolModel: MToolModel;
        CoordinateAxis: CoordinateAxis;
        CoordinateCube: CoordinateCube;
        CoordinatePlane: CoordinatePlane;
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        MToolModel: MToolModelLogic;
        CoordinateAxis: CoordinateAxisLogic;
        CoordinateCube: CoordinateCubeLogic;
        CoordinatePlane: CoordinatePlaneLogic;
    }
}

/** MToolModelLogic 逻辑类。 */
export class MToolModelLogic extends ComponentLogicBase
{
    #data: MToolModel;

    protected constructor(data: MToolModel)
    {
        super(data);
        this.#data = data;
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: MToolModel): MToolModelLogic
    {
        return new MToolModelLogic(data);
    }

    override init(entity?: Object3D): void
    {
        super.init(entity);

        // TODO(P1 API 迁移)：原实现在此命令式创建坐标轴 / 平面 / 中心立方体：
        //   this.object3D.name = 'Object3DMoveModel';
        //   this.xAxis = serialization.setValue(new Object3D(), { name: 'xAxis' }).addComponent(CoordinateAxis);
        //   ... yzPlane / xzPlane / xyPlane / oCube 同理，并 this.object3D.addChild(...)
        // 新范式改写方向：模型直接写成声明式字面量（组件挂 components、子对象挂 children），
        // 组件实体名用 `logic(component).entity` 取；见 API_MIGRATION.md §3.6 / §3.8。
        void this.#data;
    }
}

// ---------------------------------------------------------------------------
// 坐标轴（CoordinateAxis）
// ---------------------------------------------------------------------------

/** 坐标轴组件（纯数据接口）。 */
export interface CoordinateAxis extends Component3D
{
    /** 组件类型名 */
    readonly __type__: 'CoordinateAxis';

    /** 未选中颜色（默认由 Logic 填充：{ __type__: 'Color4', r: 1, g: 0, b: 0, a: 0.99 }） */
    readonly color?: Color4;

    /** 选中颜色（默认由 Logic 填充：{ __type__: 'Color4', r: 1, g: 1, b: 0, a: 0.99 }） */
    readonly selectedColor?: Color4;

    /** 轴长度（默认 100） */
    readonly length?: number;

    /** 是否选中 */
    readonly selected?: boolean;
}

/** CoordinateAxisLogic 逻辑类。 */
export class CoordinateAxisLogic extends ComponentLogicBase
{
    #data: CoordinateAxis;

    /** 线段材质（由 init 创建，随实体释放） */
    #segmentMaterial: unknown = null;
    /** 箭头材质（由 init 创建，随实体释放） */
    #material: unknown = null;

    protected constructor(data: CoordinateAxis)
    {
        // 默认值填充（须在 super 之前完成）
        const writable = data as UnReadonly<CoordinateAxis>;
        if (data.color === undefined) writable.color = { __type__: 'Color4', r: 1, g: 0, b: 0, a: 0.99 };
        if (data.selectedColor === undefined) writable.selectedColor = { __type__: 'Color4', r: 1, g: 1, b: 0, a: 0.99 };
        if (data.length === undefined) writable.length = 100;
        if (data.selected === undefined) writable.selected = false;

        super(data);
        this.#data = data;
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: CoordinateAxis): CoordinateAxisLogic
    {
        return new CoordinateAxisLogic(data);
    }

    override init(entity?: Object3D): void
    {
        super.init(entity);

        // TODO(P1 API 迁移)：原实现在此
        //   watcher.watch(this, 'selected', this.update, this);   // → effect(() => reactive(data).selected)
        //   new SegmentGeometry() / new SegmentMaterial() / serialization.setValue(new ConeGeometry(), {...})
        //   new Object3D() + Object3D.addComponent(Renderable) + object3D.addChild(...)
        //   setBlendEnabled(material, true)
        // 新范式：几何体/材质/子对象一律用声明式字面量（`__type__` + 字段），见 API_MIGRATION.md §3.6 / §3.8。
    }

    update(): void
    {
        // TODO(P1 API 迁移)：原实现把选中态映射为材质颜色：
        //   (<SegmentUniforms> this.#segmentMaterial.uniforms).u_segmentColor = color;
        //   reactive(this.#material.uniforms).u_diffuseInput = color;
        // 新范式：颜色经 `reactive(material).uniforms` 写入。
        void this.#data.color;
        void this.#segmentMaterial;
        void this.#material;
    }
}

// ---------------------------------------------------------------------------
// 中心立方体（CoordinateCube）
// ---------------------------------------------------------------------------

/**
 * 中心立方体组件（纯数据接口）。
 *
 * 注意：`CoordinateScaleCubeLogic.update()` 会把 `color` / `selectedColor` 整体
 * 换成缩放轴的配色并调用本组件的 `update()`，因此这两个字段在运行时会被写入。
 */
export interface CoordinateCube extends Component3D
{
    /** 组件类型名 */
    readonly __type__: 'CoordinateCube';

    /** 未选中颜色（默认由 Logic 填充：{ __type__: 'Color4', r: 1, g: 1, b: 1, a: 0.99 }） */
    readonly color?: Color4;

    /** 选中颜色（默认由 Logic 填充：{ __type__: 'Color4', r: 1, g: 1, b: 0, a: 0.99 }） */
    readonly selectedColor?: Color4;

    /** 是否选中 */
    readonly selected?: boolean;
}

/** CoordinateCubeLogic 逻辑类。 */
export class CoordinateCubeLogic extends ComponentLogicBase
{
    #data: CoordinateCube;

    /** 立方体材质（由 init 创建） */
    #colorMaterial: unknown = null;
    /** 立方体子对象（由 init 创建） */
    #oCube: Object3D | null = null;

    protected constructor(data: CoordinateCube)
    {
        // 默认值填充（须在 super 之前完成）
        const writable = data as UnReadonly<CoordinateCube>;
        if (data.color === undefined) writable.color = { __type__: 'Color4', r: 1, g: 1, b: 1, a: 0.99 };
        if (data.selectedColor === undefined) writable.selectedColor = { __type__: 'Color4', r: 1, g: 1, b: 0, a: 0.99 };
        if (data.selected === undefined) writable.selected = false;

        super(data);
        this.#data = data;
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: CoordinateCube): CoordinateCubeLogic
    {
        return new CoordinateCubeLogic(data);
    }

    override init(entity?: Object3D): void
    {
        super.init(entity);

        // TODO(P1 API 迁移)：原实现在此
        //   watcher.watch(this, 'selected', this.update, this);
        //   this.oCube = new Object3D(); model = this.oCube.addComponent(Renderable);
        //   model.geometry = serialization.setValue(new CubeGeometry(), { width: 8, height: 8, depth: 8 });
        //   this.colorMaterial = model.material = new ColorMaterial(); setBlendEnabled(this.colorMaterial, true);
        //   this.#oCube.mouseEnabled = true; this.object3D.addChild(this.oCube);
        // 新范式：子对象 + MeshRenderer 组件 + 几何体/材质全部用声明式字面量。
    }

    update(): void
    {
        // TODO(P1 API 迁移)：原实现 `reactive(this.colorMaterial.uniforms).u_diffuseInput = selected ? selectedColor : color;`
        // 新范式：从 raw 取色，向 `reactive(material).uniforms` 写值。
        void this.#data.color;
        void this.#data.selected;
        void this.#colorMaterial;
        void this.#oCube;
    }
}

// ---------------------------------------------------------------------------
// 坐标平面（CoordinatePlane）
// ---------------------------------------------------------------------------

/** 坐标平面组件（纯数据接口）。 */
export interface CoordinatePlane extends Component3D
{
    /** 组件类型名 */
    readonly __type__: 'CoordinatePlane';

    /** 未选中颜色（默认由 Logic 填充：{ __type__: 'Color4', r: 1, g: 0, b: 0, a: 0.2 }） */
    readonly color?: Color4;

    /** 边框颜色（默认由 Logic 填充：{ __type__: 'Color4', r: 1, g: 0, b: 0, a: 0.99 }） */
    readonly borderColor?: Color4;

    /** 选中颜色（默认由 Logic 填充：{ __type__: 'Color4', r: 1, g: 0, b: 0, a: 0.5 }） */
    readonly selectedColor?: Color4;

    /** 选中边框颜色（默认由 Logic 填充：{ __type__: 'Color4', r: 1, g: 1, b: 0, a: 0.99 }） */
    readonly selectedborderColor?: Color4;

    /** 平面宽度（默认 20） */
    readonly width?: number;

    /** 是否选中 */
    readonly selected?: boolean;
}

/** CoordinatePlaneLogic 逻辑类。 */
export class CoordinatePlaneLogic extends ComponentLogicBase
{
    #data: CoordinatePlane;

    /** 平面材质（由 init 创建） */
    #colorMaterial: unknown = null;
    /** 边框线段几何体（由 init 创建） */
    #segmentGeometry: unknown = null;

    protected constructor(data: CoordinatePlane)
    {
        // 默认值填充（须在 super 之前完成）
        const writable = data as UnReadonly<CoordinatePlane>;
        if (data.color === undefined) writable.color = { __type__: 'Color4', r: 1, g: 0, b: 0, a: 0.2 };
        if (data.borderColor === undefined) writable.borderColor = { __type__: 'Color4', r: 1, g: 0, b: 0, a: 0.99 };
        if (data.selectedColor === undefined) writable.selectedColor = { __type__: 'Color4', r: 1, g: 0, b: 0, a: 0.5 };
        if (data.selectedborderColor === undefined) writable.selectedborderColor = { __type__: 'Color4', r: 1, g: 1, b: 0, a: 0.99 };
        if (data.width === undefined) writable.width = 20;
        if (data.selected === undefined) writable.selected = false;

        super(data);
        this.#data = data;
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: CoordinatePlane): CoordinatePlaneLogic
    {
        return new CoordinatePlaneLogic(data);
    }

    override init(entity?: Object3D): void
    {
        super.init(entity);

        // TODO(P1 API 迁移)：原实现在此
        //   watcher.watch(this, 'selected', this.update, this);
        //   plane = serialization.setValue(new Object3D(), { name: 'plane' }); model = plane.addComponent(Renderable);
        //   model.geometry = serialization.setValue(new PlaneGeometry(), { width, height });
        //   this.colorMaterial = model.material = new ColorMaterial(); setCullFace/setBlendEnabled(...)
        //   border = serialization.setValue(new Object3D(), { name: 'border' }); new SegmentGeometry() / new SegmentMaterial()
        // 新范式：子对象 + MeshRenderer 组件 + 几何体/材质全部用声明式字面量。
    }

    update(): void
    {
        // TODO(P1 API 迁移)：原实现写材质颜色并重建 4 条边框线段：
        //   reactive(this.colorMaterial.uniforms).u_diffuseInput = selected ? selectedColor : color;
        //   this.segmentGeometry.segments = [...];（无 addSegment，改为整体替换 segments）
        // 新范式：`reactive(segmentGeometry).segments = segments`，线段元素为
        // `{ start, end, startColor, endColor }`（四项全必填）。
        void this.#data.width;
        void this.#data.selected;
        void this.#colorMaterial;
        void this.#segmentGeometry;
    }
}

// 注册到 logic 分发表
registerLogic('MToolModel', MToolModelLogic as unknown as new (data: MToolModel) => MToolModelLogic);
registerLogic('CoordinateAxis', CoordinateAxisLogic as unknown as new (data: CoordinateAxis) => CoordinateAxisLogic);
registerLogic('CoordinateCube', CoordinateCubeLogic as unknown as new (data: CoordinateCube) => CoordinateCubeLogic);
registerLogic('CoordinatePlane', CoordinatePlaneLogic as unknown as new (data: CoordinatePlane) => CoordinatePlaneLogic);
