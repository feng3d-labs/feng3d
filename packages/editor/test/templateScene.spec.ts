import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { quatFromEuler, quatRotatePoint } from 'feng3d';
import { createDefaultScene } from '../src/utils/createDefaultScene';

/**
 * 默认场景的**相机朝向**。
 *
 * ## 它守的是哪条 bug
 *
 * 模板里 Main Camera 原来是 `(0, 1, -10)` 且 `rotation` 为零——而 feng3d 的相机看向
 * **局部 -Z**（`Object3D.lookAt` 的约定，见 `packages/feng3d/src/core/Object3D.spec.ts`
 * 与 `DirectionalLight.ts` 里"相机看向 -Z"的注释）。于是它朝 z 更负的方向看，
 * **背对原点**：新建项目后视口里看不到 Plane / Cube，而"场景加载成功"那类判据
 * （对象数 > 0、无 pageerror）照样全绿——所以这条 bug 能一直躺着。
 *
 * ## 判据为什么只覆盖两处
 *
 * 同一个"新建默认场景"有**三份数据**，但只有两处能被这里的判据触及：
 *
 * | 处 | 什么时候用到 | 在判据里？ |
 * |---|---|---|
 * | `resource/template/default.scene.json` | 新建项目时写进项目的模板 | ✅ |
 * | `src/utils/createDefaultScene.ts` | 模板缺失 / 反序列化失败时的**回退** | ✅ |
 * | `feng3d` 的 `createNewScene()` | 引擎侧的"新建场景" | ❌ **不在这里** |
 *
 * 第三处**没有被本判据覆盖**，原因是它跑不起来：那份场景的 Main Camera 挂了
 * `AudioListener`，其 `init()` 要真的 `AudioContext`（`getAudioCtx().createGain()`），
 * 而仓库**有意不在** `vitest.setup.ts` 里定义 `window`（那是"非浏览器环境"的守卫，
 * 见该文件第 19–21 行）。与其为了它往全局堆 WebAudio mock，不如**不动那一处**——
 * 它目前也没有生产调用者（编辑器里两处 `View.createNewScene()` 都已注释、标着 P1 迁移 TODO）。
 * 这条局限写在 PR 里，不假装它被覆盖了。
 */
interface Vec3
{
    readonly x: number;
    readonly y: number;
    readonly z: number;
}

/** 判据只关心位置与旋转；`rotation` 可缺省（`createDefaultScene()` 就不写它，等于零旋转） */
interface Pose
{
    readonly position: Vec3;
    readonly rotation?: Vec3;
}

/** 场景树里最小可用的节点形状 */
interface SceneNode extends Pose
{
    readonly name?: string;
    readonly children?: readonly SceneNode[];
}

const CAMERA_NAME = 'Main Camera';

/**
 * 在场景树里按名字找节点。
 *
 * @param node 根节点（可为空）
 * @param name 名字
 * @returns 找到的节点；没有时 `null`
 */
function findByName(node: SceneNode | null | undefined, name: string): SceneNode | null
{
    if (!node) return null;
    if (node.name === name) return node;

    for (const child of node.children ?? [])
    {
        const found = findByName(child, name);

        if (found) return found;
    }

    return null;
}

/**
 * 归一化（判据只用到方向）。
 *
 * @param v 向量
 * @returns 单位向量（零向量返回自身，避免除零）
 */
function normalize(v: Vec3): Vec3
{
    const length = Math.hypot(v.x, v.y, v.z) || 1;

    return { x: v.x / length, y: v.y / length, z: v.z / length };
}

/**
 * 相机的**朝向**：局部 -Z 经 `rotation` 旋转后的世界方向。
 *
 * 为什么是 -Z：`Object3D.lookAt` 的约定就是"让局部 -Z 指向 target"，所以"相机在看哪"
 * 这个问题在引擎里的答案就是 -Z。这里用引擎自己的数学（`quatFromEuler` / `quatRotatePoint`
 * 由 `feng3d` 桶重导出）算，而不是在测试里手推一套公式——判据不该有自己的"相机模型"。
 *
 * @param pose 相机位姿
 * @returns 朝向（世界方向，单位向量）
 */
function forwardOf(pose: Pose): Vec3
{
    const rotation = pose.rotation ?? { x: 0, y: 0, z: 0 };
    const rotated = quatRotatePoint(quatFromEuler(rotation.x, rotation.y, rotation.z), { x: 0, y: 0, z: -1 });

    return normalize({ x: rotated.x, y: rotated.y, z: rotated.z });
}

/**
 * 相机"看着原点"的程度：朝向与"相机 → 原点"的点积。
 *
 * `1` = 正对原点，`0` = 侧对，`-1` = 背对。用**原点**当参照点是因为默认场景的内容
 * （Plane / Cube / Sphere）都在原点附近，而两处的具体内容并不相同。
 *
 * @param pose 相机位姿
 * @returns 点积
 */
function lookingAtOrigin(pose: Pose): number
{
    const toOrigin = normalize({ x: -pose.position.x, y: -pose.position.y, z: -pose.position.z });
    const forward = forwardOf(pose);

    return forward.x * toOrigin.x + forward.y * toOrigin.y + forward.z * toOrigin.z;
}

describe('默认场景的相机朝向（模板 / 回退路径）', () =>
{
    /**
     * 取两处的相机位姿。
     *
     * @returns 每处的名字与位姿（找不到相机时 `pose` 为 `null`，让判据去报"找不到"而不是崩）
     */
    function cameraPoses(): { label: string, pose: Pose | null }[]
    {
        const template = JSON.parse(readFileSync(new URL('../resource/template/default.scene.json', import.meta.url), 'utf8')) as SceneNode;
        const fallback = createDefaultScene() as unknown as SceneNode;

        return [
            { label: '模板 resource/template/default.scene.json', pose: findByName(template, CAMERA_NAME) },
            { label: '回退 createDefaultScene()', pose: findByName(fallback, CAMERA_NAME) },
        ];
    }

    it('★ 两处的相机都**看向原点**（点积 > 0.5，不是背对）', () =>
    {
        const poses = cameraPoses();

        // 空转检查：两处都得真找到相机，否则下面那条"全过"毫无意义
        expect(poses.map((one) => one.pose !== null), '两处都该有 Main Camera').toEqual([true, true]);

        for (const { label, pose } of poses)
        {
            const dot = lookingAtOrigin(pose!);

            expect(dot, `${label} 的相机背对着场景（点积 ${dot.toFixed(3)}）`).toBeGreaterThan(0.5);
        }
    });

    it('★ 两处的相机位姿一致（同一份"新建默认场景"不该分叉）', () =>
    {
        const poses = cameraPoses().map((one) => one.pose!);

        for (const pose of poses) expect(pose.position).toEqual(poses[0].position);
        for (const pose of poses) expect(pose.rotation ?? { x: 0, y: 0, z: 0 }).toEqual(poses[0].rotation ?? { x: 0, y: 0, z: 0 });
    });

    it('相机在场景的 **+Z 侧**（`z = -10` 的旧写法会让这条失败）', () =>
    {
        for (const { label, pose } of cameraPoses())
        {
            expect(pose!.position.z, label).toBeGreaterThan(0);
        }
    });
});
