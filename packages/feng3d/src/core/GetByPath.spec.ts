import { describe, expect, it } from 'vitest';
import { logic, reactive } from '@feng3d/reactivity';
import type { Object3D } from './Object3D';
import { findByName, getByPath } from './GetByPath';

/**
 * 可变引用查询 API（框架设计文档 3.4）。
 */
describe('core/GetByPath', () =>
{
    it('索引路径命中嵌套节点', () =>
    {
        const root = { root: { children: [{ name: 'a' }, { name: 'b' }] } };

        expect(getByPath(root, 'root/children/1').name).toBe('b');
        expect(getByPath(root, 'root/children/0/name')).toBe('a');
    });

    it('路径不存在时抛错并回显断点路径', () =>
    {
        const root = { root: { children: [] } };

        expect(() => getByPath(root, 'root/children/5/name')).toThrowError('root/children/5');
    });

    it('获取的节点经 reactive 修改写入原始数据', () =>
    {
        const cube = { __type__: 'Object3D', name: 'Cube' } as Object3D;
        const view: any = { root: { children: [cube] } };
        const node = getByPath(view, 'root/children/0');

        reactive(node).name = 'Cube2';
        expect((cube as any).name).toBe('Cube2');
    });

    it('findByName 命中自身与子树', () =>
    {
        const child = { __type__: 'Object3D', name: 'Cube' } as Object3D;
        const root = { __type__: 'Object3D', name: 'root' } as Object3D;

        logic(root);   // 触发 containerLogic（children pre-fill）
        reactive(root).children.push(child);

        expect(findByName(root, 'root')).toBe(root);
        expect(findByName(root, 'Cube')).toBe(child);
        expect(findByName(root, 'none')).toBeUndefined();
    });
});
