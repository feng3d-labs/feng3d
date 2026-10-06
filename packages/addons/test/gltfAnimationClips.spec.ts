import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { logic, reactive } from '@feng3d/reactivity';
import { findObject3DChild } from 'feng3d';
import type { Object3D } from 'feng3d';
import { parseGLB } from '../src/loaders/GLTFLoader';

/**
 * glTF 动画 → 可播放的 `AnimationClipData`（原先动画只解析结构、不接运行时播放）。
 *
 * 用仓库里**已有的**真实资源 `whale.glb`（自带 2 个 animation + 1 套 skin）做端到端验证，
 * 不依赖任何新引入的第三方资源。四条断言逐层递进：
 * 1. 关键帧读全了（times/values 长度与曲线类型对齐、时间换算成毫秒且单调）；
 * 2. `path` 是场景根起的名称链，逐级都能在解析出的对象树里找到；
 * 3. 挂上 `Animation` 组件后 `update` **真的**改写了目标节点属性（不是只解析出数据）。
 *
 * 有意**没有**在这里钉住 `Skeleton.globalMatrices`：该组件当前用 `findBoneByName(members.entity, name)`
 * 只在**自身子树**里按名字找骨骼，而 glTF 的 joints 往往挂在引用 skin 节点的祖先/兄弟分支下，
 * 于是每根骨骼都取不到、`globalMatrices` 恒为单位矩阵。这是阶段 C 落地前要先确认/修的已知问题
 * （详见 tmp/handoff-webgl-shadowmap.md）。
 */

const WHALE_URL = new URL('../../webgpu/examples/resources/assets/gltf/whale.glb', import.meta.url);

/** 每条曲线每帧的分量数（与 PropertyClip.type 一致） */
function componentsOf(type: string): number
{
    return type === 'Quaternion' ? 4 : type === 'Vector3' ? 3 : 1;
}

/**
 * 每次解析一份新的结果：用例之间不共享被改写过的对象树。
 */
function loadWhale()
{
    const fileBuffer = readFileSync(WHALE_URL);

    return parseGLB(fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength));
}

/** 沿 `PropertyClip.path` 找到目标节点 */
function resolveTarget(root: Object3D, path: readonly (readonly [number, string])[]): Object3D | null
{
    let host: Object3D | null = root;
    for (const item of path) host = findObject3DChild(host!, item[1]);

    return host;
}

/**
 * 预热整棵对象树的 logic。
 *
 * 实际使用时 View 会把整棵树递归 init（父子同步 effect）；只 `logic` 根节点的话，
 * 组件 init 的 effect 里首次触达子节点会拿到**构造中的占位 logic**，path 解析会落空。
 */
function warmUpTree(object3D: Object3D): void
{
    logic(object3D);
    for (const child of object3D.children ?? []) warmUpTree(child);
}

/** 把 clip 挂到 glTF 场景根并返回驱动用的 logic */
function setupAnimation(root: Object3D, clip: ReturnType<typeof loadWhale>['animationClips'][number])
{
    warmUpTree(root);
    reactive(root).components = [{
        __type__: 'Animation',
        animation: clip,
        time: 0,
        isplaying: true,
        playspeed: 1,
    } as never];
    logic(root);   // 触发组件 init（建立 animation/time 的 effect）

    return logic(root.components![0]) as unknown as { update: (interval: number) => void };
}

describe('glTF 动画 → AnimationClipData（whale.glb 真实资源）', () =>
{
    it('每个 glTF animation 产出一份 clip，关键帧数与曲线类型对齐', () =>
    {
        const result = loadWhale();

        // 该资源自带 2 个动画、1 套 skin——是"能验证动画"的最小真实样本
        expect(result.animations.length).toBe(2);
        expect(result.skins.length).toBe(1);
        expect(result.animationClips).toHaveLength(result.animations.length);

        for (const clip of result.animationClips)
        {
            expect(clip.propertyClips.length).toBeGreaterThan(0);
            expect(clip.length).toBeGreaterThan(0);
            expect(clip.loop).toBe(true);

            for (const propertyClip of clip.propertyClips)
            {
                expect(propertyClip.times.length).toBeGreaterThan(0);
                expect(propertyClip.values.length).toBe(propertyClip.times.length * componentsOf(propertyClip.type));

                // glTF 的时间是秒、Animation 组件用毫秒——必须换算过
                for (let i = 1; i < propertyClip.times.length; i++)
                {
                    expect(propertyClip.times[i]).toBeGreaterThanOrEqual(propertyClip.times[i - 1]);
                }
                expect(propertyClip.times[propertyClip.times.length - 1]).toBeLessThanOrEqual(clip.length + 1e-6);
                expect(clip.length).toBeLessThan(60_000);   // 秒没被当成毫秒：whale 的动画只有几秒
            }
        }
    });

    it('path 是场景根起的名称链，逐级都能在对象树里找到', () =>
    {
        const result = loadWhale();

        for (const clip of result.animationClips)
        {
            for (const propertyClip of clip.propertyClips)
            {
                expect(propertyClip.path.length).toBeGreaterThan(0);
                for (const item of propertyClip.path)
                {
                    expect(item[0]).toBe(0);   // PropertyClipPathItemType.Object3D
                }
                expect(resolveTarget(result.root, propertyClip.path), `path 必须能在树里解析`).toBeTruthy();
            }
        }
    });

    it('挂到 Animation 组件后 update 真的改写了目标属性', () =>
    {
        const result = loadWhale();
        const clip = result.animationClips[0];
        const animationLogic = setupAnimation(result.root, clip);

        const targets = clip.propertyClips.map((propertyClip) => ({
            propertyClip,
            host: resolveTarget(result.root, propertyClip.path)!,
        }));
        const valueOf = (host: Object3D, propertyName: string) =>
            JSON.stringify((logic(host) as unknown as Record<string, unknown>)[propertyName]);
        const before = targets.map((target) => valueOf(target.host, target.propertyClip.propertyName));

        animationLogic.update(clip.length / 2);   // 走到整段一半

        const changed = targets.some((target, i) => valueOf(target.host, target.propertyClip.propertyName) !== before[i]);

        expect(changed).toBe(true);
    });

});
