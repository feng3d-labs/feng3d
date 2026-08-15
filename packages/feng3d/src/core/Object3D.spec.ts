import { describe, expect, it, beforeAll } from 'vitest';
import { Vector3 } from '@feng3d/math';
import { logic, reactive, registerLogic, toRaw } from '@feng3d/reactivity';

// 触发 registerLogic('Object3D', object3DLogic) 注册
import './Object3D';
import { componentLogic } from '../component/Component';
import type { Object3D } from './Object3D';

/**
 * object3DLogic 单元测试。
 *
 * object3DLogic 是函数式工厂（src/core/Object3D.ts），通过组合 containerLogic
 *（进而组合 entityLogic）复用全部 Entity + Container 行为，再叠加 Object3D 自有
 * 的变换矩阵 / scene / 激活状态 / 包围盒 / beforeRender / lookAt / dispose。
 *
 * 注意点（来自源码）：
 * - 必须先 import './Object3D' 触发 registerLogic，否则 logic(obj) 返回 null。
 * - _initialized 是模块级 WeakSet（跨用例共享），每个测试需新建 component 实例，
 *   否则组件 init 不会再次触发。
 * - 测试用 { __type__: 'Object3D' } as Object3D 字面量构造对象（缺失字段由 logic computed 缺省补齐）；
 *   缺省默认值分支直接用最小字面量 { __type__: 'Object3D' }。
 * - 响应式系统的 effect 在 logic 构造时同步注册并立即执行；push child 到
 *   reactive(parent).children 前，需先 logic(parent) 让 children→parent 同步 effect
 *   建立依赖（否则 push 时 parent 的 logic 尚未创建，effect 不存在）。
 * - 从响应式数组（components/children）取出的元素是代理，用 toRaw 还原后再比较引用。
 * - parent 是只读 getter，外部不可赋值；父子关系只能通过 push 到父级 children 自动同步。
 */

// ---- 测试用轻量组件：记录是否被 init ----
interface InitSpyComp
{
    __type__: 'InitSpyComp';
}

const initSpy = { callCount: 0, lastOwner: null as Object3D | null };

/**
 * 测试组件 logic：组合 componentLogic 后覆盖 init 记录调用。
 */
function InitSpyCompLogic(c: InitSpyComp)
{
    const base = componentLogic(c);
    const baseInit = base.init;

    return Object.assign(base, {
        init(entity?: any): void
        {
            initSpy.callCount++;
            initSpy.lastOwner = entity ?? null;
            baseInit(entity);
        },
    });
}

beforeAll(() =>
{
    registerLogic('InitSpyComp', InitSpyCompLogic);
});

/** 构造一个干净的 InitSpyComp 实例（避免跨用例 WeakSet 去重） */
function createInitSpyComp(): InitSpyComp
{
    return { __type__: 'InitSpyComp' };
}

/** 浮点近似相等（向量） */
function expectVec3Close(actual: { x: number; y: number; z: number }, expected: { x: number; y: number; z: number }, precision = 5): void
{
    expect(actual.x).toBeCloseTo(expected.x, precision);
    expect(actual.y).toBeCloseTo(expected.y, precision);
    expect(actual.z).toBeCloseTo(expected.z, precision);
}

describe('object3DLogic - 默认值与基本属性', () =>
{
    it('logic 实例非空且 entity 指向 raw', () =>
    {
        const obj = ({ __type__: 'Object3D' } as Object3D);
        const l = logic(obj);

        expect(l).not.toBeNull();
        expect(l.entity).toBe(obj);
    });

    it('字面量对象返回默认字段值', () =>
    {
        const l = logic(({ __type__: 'Object3D' } as Object3D));

        expect(l.name).toBe('Object3D');
        expect(l.mouseEnabled).toBe(true);
        expect(l.activeSelf).toBe(true);
        expectVec3Close(l.position, { x: 0, y: 0, z: 0 });
        expectVec3Close(l.rotation, { x: 0, y: 0, z: 0 });
        expectVec3Close(l.scale, { x: 1, y: 1, z: 1 });
    });

    it('仅 __type__ 的最小字面量同样返回默认值（缺省字段由 logic 补齐）', () =>
    {
        // 最小字面量：仅 __type__，缺失字段由 logic computed 内 ?? 字面量补齐
        const raw = { __type__: 'Object3D' } as Object3D;
        const l = logic(raw);

        expect(l.name).toBe('Object3D');
        expect(l.mouseEnabled).toBe(true);
        expect(l.activeSelf).toBe(true);
        expectVec3Close(l.position, { x: 0, y: 0, z: 0 });
        expectVec3Close(l.rotation, { x: 0, y: 0, z: 0 });
        expectVec3Close(l.scale, { x: 1, y: 1, z: 1 });
    });

    it('缺省字段不写回 raw（raw 保持干净，便于序列化）', () =>
    {
        const raw = { __type__: 'Object3D' } as Object3D;
        const l = logic(raw);

        // 访问触发 computed
        expect(l.name).toBe('Object3D');
        expect(l.position.x).toBe(0);

        // raw 上不应被写入这些缺省字段
        expect('name' in raw).toBe(false);
        expect('position' in raw).toBe(false);
        expect('rotation' in raw).toBe(false);
        expect('scale' in raw).toBe(false);
        // 但 components / children 会被 pre-fill（写入路径依赖）
        expect('components' in raw).toBe(true);
        expect('children' in raw).toBe(true);
    });

    it('isLoaded：无 Renderable 组件且无 children 时为 true', () =>
    {
        const l = logic(({ __type__: 'Object3D' } as Object3D));

        expect(l.isLoaded).toBe(true);
    });
});

describe('object3DLogic - 组件管理', () =>
{
    it('getComponent：按 __type__ 精确匹配', () =>
    {
        const obj = ({ __type__: 'Object3D' } as Object3D);
        const l = logic(obj); // 先 logic 触发 components pre-fill
        const camera = { __type__: 'Camera' };
        reactive(obj).components.push(camera);

        // 从响应式数组取出的元素是代理，用 toRaw 还原后比较原始引用
        expect(toRaw(l.getComponent('Camera'))).toBe(camera);
    });

    it('getComponent：经类型层级表匹配父类型（Camera 属于 Component 子类型）', () =>
    {
        const obj = ({ __type__: 'Object3D' } as Object3D);
        const l = logic(obj);
        const camera = { __type__: 'Camera' };
        reactive(obj).components.push(camera);

        // Camera 在 _typeHierarchy['Component'] 集合中
        expect(toRaw(l.getComponent('Component'))).toBe(camera);
    });

    it('getComponent：未命中返回 undefined', () =>
    {
        const l = logic(({ __type__: 'Object3D' } as Object3D));

        expect(l.getComponent('NotExisting')).toBeUndefined();
    });

    it('getComponents：返回所有匹配项', () =>
    {
        const obj = ({ __type__: 'Object3D' } as Object3D);
        const l = logic(obj);
        const c1 = { __type__: 'Camera' };
        const c2 = { __type__: 'Camera' };
        const c3 = { __type__: 'Light' };
        reactive(obj).components.push(c1, c2, c3);

        const result = l.getComponents('Camera').map(toRaw);

        expect(result).toEqual([c1, c2]);
    });

    it('getComponents：空 typeName 返回全部组件', () =>
    {
        const obj = ({ __type__: 'Object3D' } as Object3D);
        const l = logic(obj);
        const c1 = { __type__: 'Camera' };
        const c2 = { __type__: 'Light' };
        reactive(obj).components.push(c1, c2);

        const result = l.getComponents('').map(toRaw);

        expect(result).toEqual([c1, c2]);
    });

    it('getComponents：传入 results 数组累加结果', () =>
    {
        const obj = ({ __type__: 'Object3D' } as Object3D);
        const l = logic(obj);
        const cam = { __type__: 'Camera' };
        reactive(obj).components.push(cam);

        const results: any[] = ['seed'];
        const ret = l.getComponents('Camera', results);

        expect(ret).toBe(results);
        expect(results.length).toBe(2);
        expect(toRaw(results[1])).toBe(cam);
    });

    it('组件自动 init：挂载后 logic.init 被调用，参数为该 object3D', () =>
    {
        initSpy.callCount = 0;
        initSpy.lastOwner = null;

        const obj = ({ __type__: 'Object3D' } as Object3D);
        const objLogic = logic(obj);
        // 触发 components computed 求值，建立自动 init effect 的依赖
        objLogic.getComponents('');
        const comp = createInitSpyComp();
        reactive(obj).components.push(comp);

        expect(initSpy.callCount).toBe(1);
        expect(initSpy.lastOwner).toBe(obj);
    });

    it('组件 init 去重：同一 component 实例只 init 一次（WeakSet 跨逻辑实例共享）', () =>
    {
        initSpy.callCount = 0;
        const obj = ({ __type__: 'Object3D' } as Object3D);
        const objLogic = logic(obj);
        objLogic.getComponents('');
        const comp = createInitSpyComp();
        reactive(obj).components.push(comp);
        const countAfterFirst = initSpy.callCount;

        // 同一实例再次进入 components 数组（模拟重复 push 或再次同步）
        reactive(obj).components.push(comp);

        expect(initSpy.callCount).toBe(countAfterFirst);
    });
});

describe('object3DLogic - 父子层级', () =>
{
    it('parent 默认为 null', () =>
    {
        const l = logic(({ __type__: 'Object3D' } as Object3D));

        expect(l.parent).toBeNull();
    });

    it('push 到 parent.children 后，child.parent 自动同步为 parent', () =>
    {
        const parent = ({ __type__: 'Object3D' } as Object3D);
        const child = ({ __type__: 'Object3D' } as Object3D);
        // 先 logic(parent) 让 children→parent 同步 effect 注册依赖
        const parentLogic = logic(parent);
        // 触发 children computed 求值建立依赖
        void parentLogic.children.length;

        reactive(parent).children.push(child);

        expect(toRaw(logic(child).parent)).toBe(parent);
    });

    it('parent 为只读 getter：外部直接赋值无效', () =>
    {
        const obj = ({ __type__: 'Object3D' } as Object3D);
        const l = logic(obj);
        const parent = ({ __type__: 'Object3D' } as Object3D);

        // 直接赋值在严格模式下静默失败（getter-only 属性无 setter）
        expect(() =>
        {
            (l as any).parent = parent;
        }).toThrow(TypeError);

        // 赋值后 parent 仍为 null（未被写入）
        expect(l.parent).toBeNull();
    });

    it('parent 为只读 getter：通过 reactive 代理赋值同样无效', () =>
    {
        const obj = ({ __type__: 'Object3D' } as Object3D);
        const l = logic(obj);
        const r_l = reactive(l);
        const parent = ({ __type__: 'Object3D' } as Object3D);

        // reactive 代理的 set 最终 Reflect.set 到 getter-only 属性，同样失败
        expect(() =>
        {
            r_l.parent = parent;
        }).toThrow(TypeError);
        expect(l.parent).toBeNull();
    });

    it('children getter 反映 raw.children 的变化', () =>
    {
        const obj = ({ __type__: 'Object3D' } as Object3D);
        const l = logic(obj);
        // 建立 computed 依赖
        void l.children.length;

        expect(l.children.length).toBe(0);

        const c1 = ({ __type__: 'Object3D' } as Object3D);
        reactive(obj).children.push(c1);
        expect(l.children.length).toBe(1);
        expect(toRaw(l.children[0])).toBe(c1);
    });
});

describe('object3DLogic - 激活状态', () =>
{
    it('reactive(obj).activeSelf = false 后 getter 反映', () =>
    {
        const obj = ({ __type__: 'Object3D' } as Object3D);
        reactive(obj).activeSelf = false;

        expect(logic(obj).activeSelf).toBe(false);
    });

    it('activeInHierarchy：无 parent 时等于 activeSelf', () =>
    {
        const obj = ({ __type__: 'Object3D' } as Object3D);

        expect(logic(obj).activeInHierarchy).toBe(true);
        reactive(obj).activeSelf = false;
        expect(logic(obj).activeInHierarchy).toBe(false);
    });

    it('activeInHierarchy：父 activeSelf=false 时子为 false', () =>
    {
        const parent = ({ __type__: 'Object3D' } as Object3D);
        const parentLogic = logic(parent);
        const child = ({ __type__: 'Object3D' } as Object3D);
        void parentLogic.children.length;
        reactive(parent).children.push(child);
        reactive(parent).activeSelf = false;

        expect(logic(child).activeInHierarchy).toBe(false);
    });

    it('activeInHierarchy：父子均 active 时为 true（AND 链）', () =>
    {
        const parent = ({ __type__: 'Object3D' } as Object3D);
        const parentLogic = logic(parent);
        const child = ({ __type__: 'Object3D' } as Object3D);
        void parentLogic.children.length;
        reactive(parent).children.push(child);

        expect(logic(child).activeInHierarchy).toBe(true);
    });
});

describe('object3DLogic - scene 派生', () =>
{
    it('无 Scene 组件且无 parent：scene 为 null', () =>
    {
        const l = logic(({ __type__: 'Object3D' } as Object3D));

        expect(l.scene).toBeNull();
    });

    it('自身持 Scene 组件：scene 为该组件', () =>
    {
        const obj = ({ __type__: 'Object3D' } as Object3D);
        logic(obj);
        const sceneComp = { __type__: 'Scene' };
        reactive(obj).components.push(sceneComp);

        expect(toRaw(logic(obj).scene)).toBe(sceneComp);
    });

    it('parent 持 Scene 组件：子对象 scene 经 parent 链派生为该组件', () =>
    {
        const parent = ({ __type__: 'Object3D' } as Object3D);
        const parentLogic = logic(parent);
        void parentLogic.children.length;
        const sceneComp = { __type__: 'Scene' };
        reactive(parent).components.push(sceneComp);

        const child = ({ __type__: 'Object3D' } as Object3D);
        reactive(parent).children.push(child);

        expect(toRaw(logic(child).scene)).toBe(sceneComp);
    });
});

describe('object3DLogic - 矩阵变换', () =>
{
    it('matrix：由 position 计算（平移分量）', () =>
    {
        const obj = ({ __type__: 'Object3D' } as Object3D);
        reactive(obj).position = { x: 1, y: 2, z: 3 };

        const l = logic(obj);
        expectVec3Close(l.matrix.getPosition(), { x: 1, y: 2, z: 3 });
    });

    it('matrix：scale 反映在对角线', () =>
    {
        const obj = ({ __type__: 'Object3D' } as Object3D);
        reactive(obj).scale = { x: 2, y: 3, z: 4 };

        const m = logic(obj).matrix.elements;
        expect(m[0]).toBeCloseTo(2, 5);
        expect(m[5]).toBeCloseTo(3, 5);
        expect(m[10]).toBeCloseTo(4, 5);
    });

    it('无 parent：local2world 与 matrix 一致（位置）', () =>
    {
        const obj = ({ __type__: 'Object3D' } as Object3D);
        reactive(obj).position = { x: 5, y: 0, z: 0 };

        const l = logic(obj);
        const mPos = l.matrix.getPosition();
        const wPos = l.local2world.getPosition();

        expectVec3Close(wPos, { x: mPos.x, y: mPos.y, z: mPos.z });
    });

    it('有 parent：worldPosition = parent 位置 + child 位置', () =>
    {
        const parent = ({ __type__: 'Object3D' } as Object3D);
        const parentLogic = logic(parent);
        void parentLogic.children.length;
        reactive(parent).position = { x: 1, y: 0, z: 0 };

        const child = ({ __type__: 'Object3D' } as Object3D);
        reactive(child).position = { x: 0, y: 2, z: 0 };
        reactive(parent).children.push(child);

        expectVec3Close(logic(child).worldPosition, { x: 1, y: 2, z: 0 });
    });

    it('world2local：把世界坐标映回本地坐标', () =>
    {
        const obj = ({ __type__: 'Object3D' } as Object3D);
        reactive(obj).position = { x: 1, y: 2, z: 3 };

        const l = logic(obj);
        // 世界点 (1,2,3) 即物体原点，映回本地应为 (0,0,0)
        const local = l.world2local.transformPoint3(new Vector3(1, 2, 3));

        expectVec3Close(local, { x: 0, y: 0, z: 0 });
    });

    it('world2local = local2world.invert()（数值一致）', () =>
    {
        const obj = ({ __type__: 'Object3D' } as Object3D);
        reactive(obj).position = { x: 1, y: 2, z: 3 };

        const l = logic(obj);
        const expected = l.local2world.clone().invert();

        expect(Array.from(expected.elements) as number[]).toEqual(
            Array.from(l.world2local.elements) as number[],
        );
    });

    it('响应式：修改 position 后 matrix 随之变化', () =>
    {
        const obj = ({ __type__: 'Object3D' } as Object3D);
        const l = logic(obj);

        expectVec3Close(l.matrix.getPosition(), { x: 0, y: 0, z: 0 });

        reactive(obj).position = { x: 7, y: 8, z: 9 };
        expectVec3Close(l.matrix.getPosition(), { x: 7, y: 8, z: 9 });
    });

    it('ITlocal2world = local2world.invert().transpose()（数值一致）', () =>
    {
        const obj = ({ __type__: 'Object3D' } as Object3D);
        reactive(obj).position = { x: 1, y: 0, z: 0 };
        reactive(obj).scale = { x: 2, y: 1, z: 1 };

        const l = logic(obj);
        const expected = l.local2world.clone().invert().transpose();

        expect(Array.from(expected.elements) as number[]).toEqual(
            Array.from(l.ITlocal2world.elements) as number[],
        );
    });
});

describe('object3DLogic - lookAt', () =>
{
    /**
     * 约定无关的稳健断言：lookAt 后，物体局部 -Z 轴在世界空间中应指向 target。
     * 物体局部 -Z 轴 (0,0,-1) 经 local2worldRotation（仅旋转）变换后的方向，
     * 应等于 (target - position) 归一化。
     */
    function forwardPointsTo(obj: Object3D, target: Vector3): boolean
    {
        const l = logic(obj);
        const localNegZ = new Vector3(0, 0, -1);
        const rotated = l.local2worldRotation.transformVector3(localNegZ);
        const position = l.matrix.getPosition();
        const expected = new Vector3(
            target.x - position.x,
            target.y - position.y,
            target.z - position.z,
        ).normalize();

        return rotated.normalize().equals(expected, 5);
    }

    it('lookAt 后 -Z 轴指向目标', () =>
    {
        const obj = ({ __type__: 'Object3D' } as Object3D);
        const target = new Vector3(0, 0, -10);
        logic(obj).lookAt(target);

        expect(forwardPointsTo(obj, target)).toBe(true);
    });

    it('lookAt +X 方向：-Z 轴指向 +X', () =>
    {
        const obj = ({ __type__: 'Object3D' } as Object3D);
        const target = new Vector3(10, 0, 0);
        logic(obj).lookAt(target);

        expect(forwardPointsTo(obj, target)).toBe(true);
    });

    it('lookAt 写入 rotation（raw 出现 rotation 字段）', () =>
    {
        const raw = { __type__: 'Object3D' } as Object3D;
        logic(raw).lookAt(new Vector3(0, 0, -1));

        expect('rotation' in raw).toBe(true);
        expect(raw.rotation).toBeDefined();
    });
});

describe('object3DLogic - beforeRender', () =>
{
    it('写入 u_modelMatrix / u_ITModelMatrix（懒创建 transform）', () =>
    {
        const obj = ({ __type__: 'Object3D' } as Object3D);
        reactive(obj).position = { x: 1, y: 0, z: 0 };

        // 构造最小 RenderObject mock（仅用到的字段）
        const renderObject: any = { bindingResources: {} };
        logic(obj).beforeRender(renderObject);

        const transform = renderObject.bindingResources.transform.value;
        expect(transform).toBeDefined();
        // u_modelMatrix 应等于 local2world
        expect(transform.u_modelMatrix.elements).toEqual(logic(obj).local2world.elements);
        // u_ITModelMatrix 应等于 ITlocal2world
        expect(transform.u_ITModelMatrix.elements).toEqual(logic(obj).ITlocal2world.elements);
    });

    it('多次调用复用同一 transform 对象', () =>
    {
        const obj = ({ __type__: 'Object3D' } as Object3D);
        const renderObject: any = { bindingResources: {} };
        const l = logic(obj);

        l.beforeRender(renderObject);
        const first = renderObject.bindingResources.transform;
        l.beforeRender(renderObject);
        const second = renderObject.bindingResources.transform;

        expect(second).toBe(first);
    });
});

describe('object3DLogic - dispose', () =>
{
    it('从父级 children 移除并清空 parent', () =>
    {
        const parent = ({ __type__: 'Object3D' } as Object3D);
        const parentLogic = logic(parent);
        void parentLogic.children.length;
        const child = ({ __type__: 'Object3D' } as Object3D);
        reactive(parent).children.push(child);

        expect(logic(parent).children.length).toBe(1);

        logic(child).dispose();

        expect(logic(parent).children.length).toBe(0);
        expect(logic(child).parent).toBeNull();
    });

    it('递归 dispose 子对象（子的 parent 清空）', () =>
    {
        const root = ({ __type__: 'Object3D' } as Object3D);
        const rootLogic = logic(root);
        void rootLogic.children.length;
        const mid = ({ __type__: 'Object3D' } as Object3D);
        reactive(root).children.push(mid);

        logic(root).dispose();

        expect(logic(mid).parent).toBeNull();
    });

    it('dispose 移除并清理所有组件', () =>
    {
        initSpy.callCount = 0;
        const obj = ({ __type__: 'Object3D' } as Object3D);
        const l = logic(obj);
        const comp = createInitSpyComp();
        reactive(obj).components.push(comp);

        // dispose 前 components 非空
        expect(toRaw(obj).components.length).toBe(1);

        l.dispose();
        expect(toRaw(obj).components.length).toBe(0);
    });
});
