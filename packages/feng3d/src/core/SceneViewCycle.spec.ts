import { box3GetSize } from '@feng3d/math';
import { describe, expect, it } from 'vitest';

import '../test/webgpu-stub';

import { batchRun, logic, reactive } from '@feng3d/reactivity';
import type { Object3D } from './Object3D';
import './Object3D';
import type { Scene } from '../scene/Scene';
import '../scene/Scene';
import './MeshRenderer';
import '../primitives/CubeGeometry';
import '../materials/StandardMaterial';

/**
 * 场景视图反复卸载/重建（issue #177）。
 *
 * 现场（无 GPU 的 headless 环境，反复开关"场景"面板插件 → 每次卸载/重建场景视图）：
 *
 * ```
 * RangeError: Maximum call stack size exceeded
 *     at setParent (Container.ts)
 *     at EffectReactivity._func (Container.ts)     ← children→parent 同步 effect
 *     at forceTrack (Reactivity.ts)
 *     at batchRun (batch.ts)
 *
 * TypeError: Cannot read properties of undefined (reading 'elements')
 *     at Matrix4x4.append
 *     at ComputedReactivity._func (Object3D.ts)    ← local2world computed
 * ```
 *
 * 两处根因（都已在引擎侧修掉，本用例把它们固定住）：
 *
 * 1. `ContainerLogic` 的父子同步 effect **读了自己要写的状态**（经 `childLogic.parent`
 *    读 parentState，紧接着 `setParent` 写同一个 state）。平时看不出问题（重跑时条件已不成立），
 *    但在批量刷新里会变成「写 → trigger → batch → computed 遍历子节点读 value → 又执行该 effect」
 *    的递归，直接爆栈；
 * 2. `Object3DLogic` 读父级 logic 时没处理"取不到"：类型未注册返回 `null`、
 *    **logic 正在构造中**时注册表里是占位对象（读任何 getter 都是 `undefined`），
 *    于是 `Matrix4x4.append(undefined)` 炸在矩阵里。
 *
 * 本用例模拟编辑器的操作序列：把整棵场景反复从视图 root 上摘下再挂回（同一批次内），
 * 期间持续读世界矩阵 / 激活状态 / 世界包围盒。
 */
describe('场景视图反复卸载/重建的响应式稳定性（issue #177）', () =>
{
    /** 造一棵"视图 root + 游戏场景（含子对象、渲染组件）"的树 */
    function buildSceneTree(): { viewRoot: Object3D; gameScene: Object3D; deep: Object3D }
    {
        const viewRoot: Object3D = { __type__: 'Object3D', name: 'viewRoot', children: [] };
        const gameScene: Object3D = {
            __type__: 'Object3D',
            name: 'gameScene',
            components: [{ __type__: 'Scene' } as Scene],
            children: [
                { __type__: 'Object3D', name: 'A', children: [{ __type__: 'Object3D', name: 'B' }] },
                {
                    __type__: 'Object3D',
                    name: 'C',
                    components: [{
                        __type__: 'MeshRenderer',
                        geometry: { __type__: 'CubeGeometry' },
                        material: { __type__: 'StandardMaterial' },
                    }],
                },
            ],
        };

        logic(viewRoot);

        return { viewRoot, gameScene, deep: (gameScene.children as Object3D[])[0].children![0] as Object3D };
    }

    it('反复摘挂整棵场景时：世界矩阵、激活状态、世界包围盒都能读出来且不递归爆栈', () =>
    {
        const { viewRoot, gameScene, deep } = buildSceneTree();
        const r_viewRoot = reactive(viewRoot);

        r_viewRoot.children!.push(gameScene);

        const readChain = () =>
        {
            logic(deep).local2world;
            logic(deep).activeInHierarchy;
            logic(gameScene).boundingBox.worldBounds;
        };
        readChain();

        // 模拟"卸载 → 重建"：同一批次里把场景整棵摘下来再挂回去（编辑器重建视图就是这个形状），
        // 连续多轮——现场是 3 轮就能复现
        for (let i = 0; i < 5; i++)
        {
            batchRun(() =>
            {
                r_viewRoot.children = [];
                r_viewRoot.children = [gameScene];
            });
            readChain();
        }

        // 摘挂之后仍然"接得上"：深层的世界矩阵链可读、包围盒算得出来
        expect(logic(deep).local2world).toBeTruthy();
        expect(logic(deep).activeInHierarchy).toBe(true);
        expect(box3GetSize(logic(gameScene).boundingBox.worldBounds).x).toBeGreaterThan(0);
    });

    it('子树被摘掉后 parent 链不断：仍在树里的对象照常读出世界矩阵', () =>
    {
        const { viewRoot, gameScene, deep } = buildSceneTree();
        const r_viewRoot = reactive(viewRoot);

        r_viewRoot.children!.push(gameScene);
        expect(logic(deep).local2world).toBeTruthy();

        // 摘掉：对象自身的 logic 与矩阵链仍可用（不抛 `undefined.elements` 这类错）
        batchRun(() =>
        {
            r_viewRoot.children = [];
        });

        expect(logic(gameScene).local2world).toBeTruthy();
        expect(logic(deep).local2world).toBeTruthy();
    });
});
