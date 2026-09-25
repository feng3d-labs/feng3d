import { ComponentLogicBase, Vector3, geometryUtils, oav, logic as getLogic, reactive } from 'feng3d';
import type { Color4, Component3D, MeshRenderer, Object3D, PointGeometry, PointMaterial } from 'feng3d';
import { registerLogic, UnReadonly } from '@feng3d/reactivity';
import { Recastnavigation, VoxelFlag } from '../recastnavigation/Recastnavigation';

/**
 * 导航代理参数。
 *
 * 迁移说明：本类**保留为普通 class**（非组件）。它的字段用 `@oav()` 标注以供编辑器
 * 属性面板显示，而 `@oav()` 是**装饰器**——只能作用于 class 成员。若按纯数据范式改为
 * interface，装饰器将无处可施（见迁移指南 §3.7）。它不参与组件注册，故不受新范式约束。
 */
export class NavigationAgent
{
    /**
     * 距离边缘半径
     */
    @oav()
    radius = 0.5;

    /**
     * 允许行走高度
     */
    @oav()
    height = 2;

    /**
     * 允许爬上的阶梯高度
     */
    @oav()
    stepHeight = 0.4;

    /**
     * 允许行走坡度
     */
    @oav()
    maxSlope = 45;// [0,60]
}

declare module 'feng3d'
{
    export interface ComponentMap
    {
        Navigation: Navigation;
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        Navigation: NavigationLogic;
    }
}

/**
 * 导航组件（纯数据接口），提供生成导航网格功能。
 *
 * 迁移自旧写法 `@AddComponentMenu('Navigation/Navigation') @RegisterComponent()
 * class Navigation extends Component`。
 *
 * 行为退化（见迁移指南 §8）：
 * - `hideFlags = HideFlags.DontSaveInBuild` 无替代：主仓 `Object3D` / `Component`
 *   均无 `hideFlags` 字段（`HideFlags` 枚举虽仍导出，但全仓 0 消费方）。
 * - `@AddComponentMenu('Navigation/Navigation')` 是**类装饰器**，纯数据接口无处可施；
 *   组件菜单的分类信息暂缺（TODO：待主仓提供数据侧的菜单声明方式）。
 */
export interface Navigation extends Component3D
{
    /** 组件类型名 */
    readonly __type__: 'Navigation';
    /** 导航代理参数（缺失时由 Logic 补默认值） */
    readonly agent?: NavigationAgent;
}

/**
 * Navigation 逻辑类。
 *
 * 旧 `init()` 中的三段 `new Object3D()` + `addComponent` + `addChild` 已改为
 * **纯数据字面量**（子对象随父对象一次性声明），替代命令式构建。
 */
export class NavigationLogic extends ComponentLogicBase
{
    /** 组件数据（raw） */
    #data: Navigation;

    /** 导航调试根对象（init 时构建） */
    #navObject: Object3D | null = null;
    /** recast 计算器（bake 时懒创建） */
    #recastNavigation: Recastnavigation | null = null;

    #allowedVoxelsPointGeometry: PointGeometry | null = null;
    #rejectivedVoxelsPointGeometry: PointGeometry | null = null;
    #debugVoxelsPointGeometry: PointGeometry | null = null;

    protected constructor(data: Navigation)
    {
        // 默认值填充（须在 super 之前完成，见根规范 §11.5）
        const writable = data as UnReadonly<Navigation>;
        if (data.agent === undefined) writable.agent = new NavigationAgent();

        super(data);
        this.#data = data;
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: Navigation): NavigationLogic
    {
        return new NavigationLogic(data);
    }

    override init(object3D?: Object3D): void
    {
        super.init(object3D);

        if (!this.entity) return;

        const allowedVoxelsPointGeometry: PointGeometry = { __type__: 'PointGeometry', points: [] };
        const rejectivedVoxelsPointGeometry: PointGeometry = { __type__: 'PointGeometry', points: [] };
        const debugVoxelsPointGeometry: PointGeometry = { __type__: 'PointGeometry', points: [] };

        const createVoxelsObject = (name: string, geometry: PointGeometry, color: Color4): Object3D => ({
            __type__: 'Object3D',
            name,
            components: [
                {
                    __type__: 'MeshRenderer',
                    geometry,
                    material: { __type__: 'PointMaterial', uniforms: { u_color: color } },
                },
            ],
        });

        this.#navObject = {
            __type__: 'Object3D',
            name: 'NavObject',
            children: [
                createVoxelsObject('allowedVoxels', allowedVoxelsPointGeometry, { __type__: 'Color4', r: 0, g: 1, b: 0, a: 1 }),
                createVoxelsObject('rejectivedVoxels', rejectivedVoxelsPointGeometry, { __type__: 'Color4', r: 1, g: 0, b: 0, a: 1 }),
                createVoxelsObject('debugVoxels', debugVoxelsPointGeometry, { __type__: 'Color4', r: 0, g: 0, b: 1, a: 1 }),
            ],
        };
        this.#allowedVoxelsPointGeometry = allowedVoxelsPointGeometry;
        this.#rejectivedVoxelsPointGeometry = rejectivedVoxelsPointGeometry;
        this.#debugVoxelsPointGeometry = debugVoxelsPointGeometry;
    }

    /**
     * 清除 oav 网格模型
     */
    @oav()
    clear(): void
    {
        const navObject = this.#navObject;
        if (navObject) getLogic(navObject).dispose();
    }

    /**
     * 计算导航网格数据
     */
    @oav()
    bake(): void
    {
        const host = this.entity;
        if (!host) return;

        // 场景根对象（替代旧 `this.object3D.scene.object3D`）
        const scene = getLogic(host).scene;
        const sceneObject = scene ? getLogic(scene).entity : null;
        if (!sceneObject) return;

        const geometrys = this.#getNavGeometrys(sceneObject);
        const navObject = this.#navObject;
        if (geometrys.length === 0)
        {
            if (navObject) getLogic(navObject).dispose();

            return;
        }
        if (!navObject) return;

        (reactive(sceneObject).children as unknown as Object3D[]).push(navObject);
        // 位置归零（规范 §8.4：向代理写新值）
        reactive(navObject).position = { x: 0, y: 0, z: 0 };

        const geometry = geometryUtils.mergeGeometry(geometrys);

        this.#recastNavigation = this.#recastNavigation ?? new Recastnavigation();

        this.#recastNavigation.doRecastnavigation(geometry, this.#data.agent);
        const voxels = this.#recastNavigation.getVoxels();

        const voxels0 = voxels.filter((v) => v.flag === VoxelFlag.Default);
        const voxels1 = voxels.filter((v) => v.flag !== VoxelFlag.Default);

        // 整体替换 points（纯数据数组，替代旧直接赋值只读字段）
        if (this.#allowedVoxelsPointGeometry)
        {
            reactive(this.#allowedVoxelsPointGeometry).points = voxels0.map((v) => ({ position: new Vector3(v.x, v.y, v.z) }));
        }
        if (this.#rejectivedVoxelsPointGeometry)
        {
            reactive(this.#rejectivedVoxelsPointGeometry).points = voxels1.map((v) => ({ position: new Vector3(v.x, v.y, v.z) }));
        }
    }

    /**
     * 获取参与导航的几何体列表
     *
     * 迁移点：
     * - `object3D.getComponent(Renderable)` → `getComponent<MeshRenderer>('MeshRenderer')`
     *   （`Renderable` 是基接口、不在 `ComponentMap` 中，无法作为 `getComponent` 的判别键）
     * - `logic(object3D.transform).local2world.value` → `getLogic(object3D).local2world`
     *   （主仓已移除 `Transform`，矩阵 getter 直接挂在 Object3D 的 logic 上）
     * - `matrix.transformPoints(arr, arr)` → 逐点 `transformPoint3`（批量接口已移除）
     *
     * @param object3D 遍历起点
     * @param geometrys 累积结果
     */
    #getNavGeometrys(object3D: Object3D, geometrys: { positions: number[], indices: number[] }[] = []): { positions: number[], indices: number[] }[]
    {
        const objectLogic = getLogic(object3D);

        if (!objectLogic.activeSelf)
        { return geometrys; }
        const model = objectLogic.getComponent<MeshRenderer>('MeshRenderer');
        const geometry = model && model.geometry;
        if (geometry)
        {
            const matrix = objectLogic.local2world;
            const sourcePositions = [...geometry.positions];
            const positions: number[] = [];
            for (let i = 0; i < sourcePositions.length; i += 3)
            {
                const point = matrix.transformPoint3(new Vector3(sourcePositions[i], sourcePositions[i + 1], sourcePositions[i + 2]));
                positions.push(point.x, point.y, point.z);
            }
            const indices = [...geometry.indices];
            //
            geometrys.push({ positions, indices });
        }
        objectLogic.children.forEach((element) =>
        {
            this.#getNavGeometrys(element as Object3D, geometrys);
        });

        return geometrys;
    }
}

// 注册到分发表
registerLogic('Navigation', NavigationLogic as unknown as new (data: Navigation) => NavigationLogic);
