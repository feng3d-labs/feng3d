import { describe, expect, it } from 'vitest';

import '../test/webgpu-stub';

import { logic } from '@feng3d/reactivity';
import { Ray3, Vector3 } from '@feng3d/math';
import type { Object3D } from '../core/Object3D';
import '../core/Object3D';
import '../core/MeshRenderer';
import '../primitives/CubeGeometry';
import '../materials/StandardMaterial';
import { raycaster } from './Raycaster';

/**
 * 层级包围盒剔除（issue #124）。
 *
 * `pick` 会对**每个候选对象**做一次精确的三角形级求交；`cullByHierarchy` 先用世界包围盒
 * 沿父链粗筛，把"必然不可能命中"的整棵子树剔掉。改写最怕**悄悄漏掉命中对象**，
 * 所以这里用**不剔除的 `pick` 当参照物做随机对拍**：同一批射线两种走法结果必须一字不差。
 */
describe('Raycaster.cullByHierarchy', () =>
{
    /** 确定性伪随机（用例里不用 Math.random：那样失败无法复现） */
    let seed = 20240927;
    function random(): number
    {
        seed = (seed * 1103515245 + 12345) % 2147483648;

        return seed / 2147483648;
    }

    /** 带 MeshRenderer（CubeGeometry）的对象——能参与精确求交 */
    function makeCube(name: string, x: number, y: number, z: number): Object3D
    {
        return {
            __type__: 'Object3D',
            name,
            position: { x, y, z },
            components: [{
                __type__: 'MeshRenderer',
                geometry: { __type__: 'CubeGeometry' },
                material: { __type__: 'StandardMaterial' },
            }],
        } as Object3D;
    }

    /**
     * 两簇场景：
     * - A 簇在原点附近（含一层**孙对象**，用来验证"祖先包围盒"确实在起作用）；
     * - B 簇在 x=100（离得远，射线不朝那边时应当被整棵剔除）。
     */
    function buildScene(): { all: Object3D[]; near: Object3D[]; far: Object3D[] }
    {
        const near = [makeCube('A0', 0, 0, 0), makeCube('A1', 1.2, 0, 0), makeCube('A2', 0, 1.2, 0)];
        const nearGrandChild = makeCube('A3', 0, 0, 1.2);
        const far = [makeCube('B0', 100, 0, 0), makeCube('B1', 101.2, 0, 0)];

        const root: Object3D = {
            __type__: 'Object3D',
            name: 'Root',
            children: [
                { __type__: 'Object3D', name: 'GroupA', children: [...near, { __type__: 'Object3D', name: 'GroupAChild', children: [nearGrandChild] }] },
                { __type__: 'Object3D', name: 'GroupB', children: far },
            ],
        } as Object3D;

        // 触发 logic 构建（包围盒 / 矩阵链都在 logic 上）
        logic(root);

        // 候选集：摊平所有带渲染组件的对象（与 Scene.mouseCheckObjects 同构）
        const all: Object3D[] = [];
        const walk = (object: Object3D) =>
        {
            if ((object.components ?? []).some((component) => component.__type__ === 'MeshRenderer')) all.push(object);
            for (const child of object.children ?? []) walk(child);
        };
        walk(root);

        return { all, near: [...near, nearGrandChild], far };
    }

    /** 一条随机射线（起点在原点附近的小立方体内，方向随机单位向量） */
    function randomRay(): Ray3
    {
        const origin = new Vector3((random() - 0.5) * 4, (random() - 0.5) * 4, -10 + random() * 2);
        const direction = new Vector3(random() - 0.5, random() - 0.5, random() - 0.2).normalize();

        return new Ray3(origin, direction);
    }

    it('随机对拍：剔除后的拾取结果与不剔除完全一致（200 条射线）', () =>
    {
        const { all } = buildScene();

        for (let i = 0; i < 200; i++)
        {
            const ray = randomRay();
            const plain = raycaster.pick(ray, all);
            const culled = raycaster.pick(ray, raycaster.cullByHierarchy(ray, all));

            if (!plain)
            {
                expect(culled, `第 ${i} 条射线：不剔除没命中，剔除后更不该命中`).toBeNull();

                continue;
            }

            expect(culled, `第 ${i} 条射线：剔除后漏掉了命中对象 ${plain.object3D.name}`).toBeTruthy();
            expect(culled!.object3D, `第 ${i} 条射线命中对象不一致`).toBe(plain.object3D);
            expect(culled!.rayEntryDistance, `第 ${i} 条射线命中距离不一致`).toBeCloseTo(plain.rayEntryDistance, 6);
            expect(culled!.index, `第 ${i} 条射线命中三角形不一致`).toBe(plain.index);
        }
    });

    it('射线不经过的整簇被剔除（含其孙对象）', () =>
    {
        const { all, far } = buildScene();
        // 从 z=-10 朝 +z：只经过 A 簇（x≈0），不经过 x=100 的 B 簇
        const ray = new Ray3(new Vector3(0, 0, -10), new Vector3(0, 0, 1));
        const culled = raycaster.cullByHierarchy(ray, all);

        for (const object of far)
        {
            expect(culled, `${object.name} 在远处，不该留在候选里`).not.toContain(object);
        }
        expect(culled.some((object) => object.name === 'A0'), '近处对象被误剔除').toBe(true);
    });

    it('保守性：射线真的穿过某簇时不会把它剔除', () =>
    {
        const { all, far } = buildScene();
        // 从 x=-10 朝 +x：先穿过 A 簇（x≈0），再穿过 B 簇（x=100）
        const ray = new Ray3(new Vector3(-10, 0, 0), new Vector3(1, 0, 0));
        const culled = raycaster.cullByHierarchy(ray, all);
        const names = culled.map((object) => object.name);

        for (const object of far)
        {
            expect(names, `${object.name} 在射线上，必须留下`).toContain(object.name);
        }
        expect(raycaster.pick(ray, culled)?.object3D, '剔除后命中对象应与不剔除一致')
            .toBe(raycaster.pick(ray, all)?.object3D);
    });

    it('取不到包围盒时不做剔除（宁可多算，不能漏命中）', () =>
    {
        const { all } = buildScene();
        const ray = new Ray3(new Vector3(0, 0, -10), new Vector3(0, 0, 1));
        // 候选里混入一个没有渲染组件的普通对象：它的包围盒是"原点一个点"，
        // 但无论如何都不该因为"拿不到包围盒"而被丢掉
        const plainObject = { __type__: 'Object3D', name: 'NoRenderer' } as Object3D;
        logic(plainObject);

        const culled = raycaster.cullByHierarchy(ray, [...all, plainObject]);
        expect(culled.length).toBeGreaterThan(0);
        // 结果仍与不剔除一致
        expect(raycaster.pick(ray, culled)?.object3D ?? null)
            .toBe(raycaster.pick(ray, [...all, plainObject])?.object3D ?? null);
    });

    it('空候选集直接返回（不抛错）', () =>
    {
        const ray = new Ray3(new Vector3(), new Vector3(0, 0, 1));

        expect(raycaster.cullByHierarchy(ray, [])).toEqual([]);
    });
});
