// 调试可视化只依赖 feng3d + cannon-es，可以离线跑（不需要 GPU）
import { logic } from '@feng3d/reactivity';
import { Object3D } from 'feng3d';
import { describe, expect, it } from 'vitest';
import '@feng3d/cannon-plugin';
import type { PhysicsWorld, PhysicsWorldLogic } from '@feng3d/cannon-plugin';
import type { MeshRenderer } from 'feng3d';
import { createPhysicsDebugLayers, updatePhysicsDebugVisuals } from '../examples/src/physics/PhysicsDebugVisuals';

/** 读某一层的线段条数 */
function segCount(layer: Object3D): number
{
    const geometry = (layer.components?.[0] as MeshRenderer | undefined)?.geometry as { segments?: unknown[] } | undefined;

    return geometry?.segments?.length ?? 0;
}

/** 造一个「地面 + 一个下落方块」的最小物理世界 */
function createWorld()
{
    const root: Object3D = {
        __type__: 'Object3D',
        components: [{ __type__: 'PhysicsWorld' }],
        children: [{
            __type__: 'Object3D',
            name: 'Ground',
            components: [{ __type__: 'BoxCollider', width: 10, height: 1, depth: 10 }, { __type__: 'Rigidbody', mass: 0 }],
        }, {
            __type__: 'Object3D',
            name: 'Box',
            position: { x: 0, y: 3, z: 0 },
            components: [{ __type__: 'BoxCollider' }, { __type__: 'Rigidbody', mass: 1 }],
        }],
    };
    logic(root);
    const physicsWorldLogic = logic(root.components![0] as PhysicsWorld) as PhysicsWorldLogic;

    return physicsWorldLogic;
}

describe('物理调试可视化', () =>
{
    it('六类都关闭时不产生任何线段', () =>
    {
        const physicsWorldLogic = createWorld();
        for (let i = 0; i < 60; i++) physicsWorldLogic.update(1000 / 60);

        const { layers } = createPhysicsDebugLayers();
        updatePhysicsDebugVisuals(physicsWorldLogic.world, {
            contacts: false, cm2contact: false, normals: false, axes: false, aabbs: false, constraints: false,
        }, layers);

        for (const layer of Object.values(layers)) expect(segCount(layer)).toBe(0);
    });

    it('axes / aabbs 按刚体数产生线段（每个刚体 3 条轴、12 条棱）', () =>
    {
        const physicsWorldLogic = createWorld();
        for (let i = 0; i < 60; i++) physicsWorldLogic.update(1000 / 60);

        const { layers } = createPhysicsDebugLayers();
        updatePhysicsDebugVisuals(physicsWorldLogic.world, {
            contacts: false, cm2contact: false, normals: false, axes: true, aabbs: true, constraints: false,
        }, layers);

        const bodyCount = physicsWorldLogic.world.bodies.length;
        expect(bodyCount).toBe(2);
        expect(segCount(layers.axes)).toBe(bodyCount * 3);
        expect(segCount(layers.aabbs)).toBe(bodyCount * 12);
    });

    it('contacts / normals / cm2contact 在有接触后产生线段', () =>
    {
        const physicsWorldLogic = createWorld();
        // 方块从 y=3 落到地面（顶面 y=0.5）需要约 1 秒
        for (let i = 0; i < 150; i++) physicsWorldLogic.update(1000 / 60);
        expect(physicsWorldLogic.world.contacts.length).toBeGreaterThan(0);

        const { layers } = createPhysicsDebugLayers();
        updatePhysicsDebugVisuals(physicsWorldLogic.world, {
            contacts: true, cm2contact: true, normals: true, axes: false, aabbs: false, constraints: false,
        }, layers);

        const contactCount = physicsWorldLogic.world.contacts.length;
        // 每个接触点一个小十字（3 条线段）、一段法线、一条质心连线
        expect(segCount(layers.contacts)).toBe(contactCount * 3);
        expect(segCount(layers.normals)).toBe(contactCount);
        expect(segCount(layers.cm2contact)).toBe(contactCount);
    });

    it('constraints 按约束数产生连线', () =>
    {
        const root: Object3D = {
            __type__: 'Object3D',
            components: [{ __type__: 'PhysicsWorld' }],
            children: [{
                __type__: 'Object3D',
                name: 'Anchor',
                position: { x: 0, y: 10, z: 0 },
                components: [{ __type__: 'BoxCollider' }, { __type__: 'Rigidbody', mass: 0 }],
            }, {
                __type__: 'Object3D',
                name: 'Bob',
                position: { x: 0, y: 8, z: 0 },
                components: [
                    { __type__: 'SphereCollider' },
                    { __type__: 'Rigidbody', mass: 1 },
                    { __type__: 'DistanceConstraint', targetName: 'Anchor', distance: 2 },
                ],
            }],
        };
        logic(root);
        const physicsWorldLogic = logic(root.components![0] as PhysicsWorld) as PhysicsWorldLogic;
        physicsWorldLogic.update(1000 / 60);

        const { layers } = createPhysicsDebugLayers();
        updatePhysicsDebugVisuals(physicsWorldLogic.world, {
            contacts: false, cm2contact: false, normals: false, axes: false, aabbs: false, constraints: true,
        }, layers);

        expect(physicsWorldLogic.world.constraints.length).toBe(1);
        expect(segCount(layers.constraints)).toBe(1);
    });
});
