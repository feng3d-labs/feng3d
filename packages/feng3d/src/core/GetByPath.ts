import { logic as getLogic, toRaw } from '@feng3d/reactivity';
import type { Object3D } from './Object3D';
import { findObject3DChild } from './Object3D';

/**
 * 按索引路径获取数据节点（框架设计文档 3.4 可变引用查询）。
 *
 * 路径为索引形式（如 `'root'`、`'root/children/0/components/1'`），
 * 数组字段用数字索引。谓词语法（`children[name=Cube]`）待编辑器需求
 * 明确后再定——路径语法一旦发布就是兼容性负担。
 *
 * 用于替代在字面量内捕获变量的技巧，获取待修改的数据节点后经
 * `reactive(node).field = value` 修改。
 *
 * @param root 查询起点（如 view）
 * @param path 索引路径（'/' 分隔）
 * @returns 命中的节点；路径不存在时 dev 抛错（附完整路径），prod 返回 undefined
 */
export function getByPath(root: object, path: string): any
{
    const segments = path.split('/');
    let current: any = root;

    for (let i = 0; i < segments.length; i++)
    {
        const key = segments[i];
        const value = current?.[key];

        if (value === undefined || value === null)
        {
            const message = `getByPath: 路径不存在 '${path}'（在 '${segments.slice(0, i + 1).join('/')}' 处断开）`;

            if (process.env.NODE_ENV === 'production')
            {
                console.error(message);

                return undefined;
            }
            throw new Error(message);
        }
        current = value;
    }

    return current;
}

/**
 * 在场景树中按名称查找 Object3D（全路径遍历，先本级后子树）。
 *
 * 与 {@link findObject3DChild} 的区别：后者从某 Object3D 的 children 起查，
 * 本函数接受根 Object3D 自身也参与名称匹配。
 *
 * @param root 起始 Object3D（自身参与匹配）
 * @param name 目标名称
 * @returns 命中的第一个 Object3D；未命中返回 undefined
 */
export function findByName(root: Object3D, name: string): Object3D | undefined
{
    if (getLogic(root).name === name) return root;

    // children getter 可能返回响应式代理元素，toRaw 还原为原始对象（规范 8.2）
    return toRaw(findObject3DChild(root, name)) as Object3D | undefined;
}
