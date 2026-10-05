import { mat4Copy, mat4Identity, mat4Prepend, Matrix4x4 } from '@feng3d/math';
import { logic, registerLogic } from '@feng3d/reactivity';
import { Component3D, ComponentLogicBase } from '../../component/Component';
import type { Object3D } from '../../core/Object3D';

declare module '../../component/Component'
{
    export interface ComponentMap
    {
        Skeleton: Skeleton;
    }
}

/**
 * Skeleton（纯数据接口）。
 */
export interface Skeleton extends Component3D
{
    readonly __type__: 'Skeleton';
    readonly boneInverses: Matrix4x4[];
    readonly boneNames: string[];
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        Skeleton: SkeletonLogic;
    }
}

/**
 * 在实体子树里按名字查找骨骼对象（深度优先，同名取先遇到的）。
 *
 * 迁移前的实现用的是 `gameObject.find(name)`；新架构下 `Object3D` 是纯数据接口、
 * 没有这个方法，所以在这里按 `children` 递归。找不到返回 `null`，由调用方决定兜底
 * （旧实现会在 `undefined.transform` 上直接抛错）。
 *
 * @param root 查找起点（通常是 Skeleton 所在实体）
 * @param name 骨骼名称
 */
function findBoneByName(root: Object3D, name: string): Object3D | null
{
    if (root.name === name) return root;

    const children = root.children;

    if (!children) return null;

    for (const child of children)
    {
        const found = findBoneByName(child, name);

        if (found) return found;
    }

    return null;
}

/**
 * Skeleton 逻辑类。
 *
 * 提供 globalMatrices：当前骨骼姿势的全局矩阵列表（由外部 SkinnedMeshRenderer 读取）。
 */
export class SkeletonLogic extends ComponentLogicBase
{
    /** 当前骨骼姿势的全局矩阵列表（内部可变，外部通过 getter 只读访问） */
    readonly #globalMatrices: Matrix4x4[] = [];

    protected constructor(data: Skeleton)
    {
        super(data);
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: Skeleton): SkeletonLogic
    {
        return new SkeletonLogic(data);
    }

    /**
     * 当前骨骼姿势的全局矩阵列表。
     *
     * 语义：`globalMatrices[i] = 骨骼 i 的世界矩阵 × boneInverses[i]`——就是蒙皮公式里
     * `jointMatrix × inverseBindMatrix` 的形式，与迁移前的旧实现
     * （`src/core/animators/skeleton/SkeletonComponent.ts` 的 `copy(localToWorldMatrix).prepend(boneInverses[i])`）
     * 完全一致。
     *
     * **一个反直觉的地方（踩过）**：本仓库的 `Matrix4x4.prepend(rhs)` 实际是**右乘**——它的实现是
     * `copy(rhs).append(原值)`，而 `X.append(Y)` 得到的是 `Y × X`。所以 `A.prepend(B)` 得到 `A × B`，
     * 与「prepend=左乘」的直觉相反。这里要保持与旧实现相同的语义，所以照原样写 `prepend`。
     *
     * **每次访问都重算**：骨骼姿势逐帧变化，而唯一的消费方 `SkinnedMeshRendererLogic.beforeRender`
     * 本来就是每帧调用一次。矩阵对象按索引复用，避免每帧新建。
     */
    get globalMatrices(): Matrix4x4[]
    {
        const data = this.component as Skeleton | undefined;
        const boneNames = data?.boneNames ?? [];
        const boneInverses = data?.boneInverses ?? [];
        const root = this.entity as Object3D | null;

        // 没有实体（尚未 init）时不做无意义的重算
        if (!root) return this.#globalMatrices;

        // 以 boneNames 为权威长度对齐结果数组（着色器侧对长度有预期，见 SkinnedMeshRenderer 的 default）
        if (this.#globalMatrices.length !== boneNames.length) this.#globalMatrices.length = boneNames.length;

        for (let i = 0; i < boneNames.length; i++)
        {
            // 阶段 C-e：`Matrix4x4` 的 class 已删除，新建即「单位矩阵字面量 + 判别字段」
            const matrix = this.#globalMatrices[i] ?? (this.#globalMatrices[i] = { __type__: 'Matrix4x4', ...mat4Identity() });
            const bone = findBoneByName(root, boneNames[i]);
            const boneInverse = boneInverses[i];

            // 骨骼或逆矩阵缺失时保持单位矩阵：宁可"这一根骨骼不动"，也不要像旧实现那样抛
            // `Cannot read properties of undefined (reading 'transform')`
            if (!bone || !boneInverse)
            {
                mat4Identity(matrix);
                continue;
            }

            mat4Copy(logic(bone).local2world, matrix);
            mat4Prepend(matrix, boneInverse, matrix);
        }

        return this.#globalMatrices;
    }
}

// 注册到 logic 分发表
registerLogic('Skeleton', SkeletonLogic.create);
