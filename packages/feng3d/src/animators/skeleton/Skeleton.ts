import { mat4Copy, mat4Identity, mat4Prepend, Matrix4x4 } from '@feng3d/math';
import { logic as getLogic, registerLogic } from '@feng3d/reactivity';
import { Component3D, Component3DLogic, createComponentLogicBase } from '../../component/Component';
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
 * Skeleton 逻辑处理接口。
 *
 * 提供 globalMatrices：当前骨骼姿势的全局矩阵列表（由外部 SkinnedMeshRenderer 读取）。
 */
export interface SkeletonLogic extends Component3DLogic
{
    /**
     * 当前骨骼姿势的全局矩阵列表。
     *
     * 语义：`globalMatrices[i] = 骨骼 i 的世界矩阵 × boneInverses[i]`——就是蒙皮公式里
     * `jointMatrix × inverseBindMatrix` 的形式。
     */
    readonly globalMatrices: Matrix4x4[];
}

/**
 * 工厂函数：SkeletonLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * @param data 组件数据（raw）
 */
export function skeletonLogic(data: Skeleton): SkeletonLogic
{
    const { state, members } = createComponentLogicBase(data);

    /** 当前骨骼姿势的全局矩阵列表（内部可变，外部通过 getter 只读访问） */
    const globalMatrices: Matrix4x4[] = [];

    const logic: SkeletonLogic = {
        // ---- Component 基类成员（显式委托基座 members）----
        /** 关联的组件数据（raw） */
        get component() { return members.component; },
        /** 所属 Object3D */
        get entity() { return state.entity as Object3D | null; },
        /** 初始化：注入 entity */
        init(entity) { members.init(entity); },
        /** 渲染前回调（默认空） */
        beforeRender(renderObject) { members.beforeRender(renderObject); },
        /** 是否加载完成 */
        get isLoaded() { return members.isLoaded; },
        /** 释放 */
        dispose() { members.dispose(); },

        // ---- Skeleton 自身成员 ----
        get globalMatrices(): Matrix4x4[]
        {
            const data = members.component as Skeleton | undefined;
            const boneNames = data?.boneNames ?? [];
            const boneInverses = data?.boneInverses ?? [];
            const root = members.entity as Object3D | null;

            // 没有实体（尚未 init）时不做无意义的重算
            if (!root) return globalMatrices;

            // 以 boneNames 为权威长度对齐结果数组（着色器侧对长度有预期，见 SkinnedMeshRenderer 的 default）
            if (globalMatrices.length !== boneNames.length) globalMatrices.length = boneNames.length;

            for (let i = 0; i < boneNames.length; i++)
            {
                // 阶段 C-e：`Matrix4x4` 的 class 已删除，新建即「单位矩阵字面量 + 判别字段」
                const matrix = globalMatrices[i] ?? (globalMatrices[i] = { __type__: 'Matrix4x4', ...mat4Identity() });
                const bone = findBoneByName(root, boneNames[i]);
                const boneInverse = boneInverses[i];

                // 骨骼或逆矩阵缺失时保持单位矩阵：宁可"这一根骨骼不动"，也不要像旧实现那样抛
                // `Cannot read properties of undefined (reading 'transform')`
                if (!bone || !boneInverse)
                {
                    mat4Identity(matrix);
                    continue;
                }

                mat4Copy(getLogic(bone).local2world, matrix);
                mat4Prepend(matrix, boneInverse, matrix);
            }

            return globalMatrices;
        },
    };

    return logic;
}

// 注册到 logic 分发表
registerLogic('Skeleton', skeletonLogic);
