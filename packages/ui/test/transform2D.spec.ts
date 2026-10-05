// 副作用导入：Object3D / TransformLayout 都是纯数据类型，只用作标注的 import 会被转译器擦除，
// 那样 feng3d 的 registerLogic 注册就不会执行（logic() 会返回 null）。
import 'feng3d';
import { Object3D, TransformLayout } from 'feng3d';
import { logic, reactive } from '@feng3d/reactivity';
import { describe, expect, it } from 'vitest';
// 副作用导入：Transform2D 是纯数据类型，只用作标注的 import 会被转译器擦除，
// 那样本包 src 里的 registerLogic('Transform2D') 就不会执行。
import '../src/core/Transform2D';
import { Transform2D } from '../src/core/Transform2D';

/**
 * 挂载一个带 Transform2D 的 Object3D（触发组件 init）。
 *
 * @param data Transform2D 的额外初始字段
 */
function mountTransform2D(data: Partial<Transform2D> = {})
{
    const object3D: Object3D = {
        __type__: 'Object3D',
        components: [{ __type__: 'Transform2D', ...data } as Transform2D],
    };
    logic(object3D);

    return { object3D, transform2D: object3D.components![0] as Transform2D };
}

describe('Transform2D（新架构迁移）', () =>
{
    it('init 会补上缺失的 TransformLayout 依赖组件', () =>
    {
        const { object3D } = mountTransform2D();
        const transformLayout = logic(object3D).getComponent<TransformLayout>('TransformLayout');

        expect(transformLayout).toBeTruthy();
        expect(transformLayout!.position).toEqual({ x: 0, y: 0, z: 0 });
    });

    it('rect 由布局组件的 pivot / size 派生（默认 pivot=0.5、size=1）', () =>
    {
        const { transform2D } = mountTransform2D();

        expect(logic(transform2D).rect).toEqual({ __type__: 'Vector4', x: -0.5, y: -0.5, z: 1, w: 1 });
    });

    it('写 Transform2D.size 会镜像到布局组件，并更新 rect', () =>
    {
        const { object3D, transform2D } = mountTransform2D();

        reactive(transform2D).size = { x: 100, y: 50 };

        const transformLayout = logic(object3D).getComponent<TransformLayout>('TransformLayout')!;
        expect(transformLayout.size).toEqual({ x: 100, y: 50, z: 1 });
        expect(logic(transform2D).rect).toEqual({ __type__: 'Vector4', x: -50, y: -25, z: 100, w: 50 });
    });

    it('写布局组件的 pivot 会回写到 Transform2D（反向镜像）', () =>
    {
        const { object3D, transform2D } = mountTransform2D();
        const transformLayout = logic(object3D).getComponent<TransformLayout>('TransformLayout')!;

        reactive(transformLayout).pivot = { x: 0, y: 0, z: 0.5 };

        expect(transform2D.pivot).toEqual({ x: 0, y: 0 });
    });

    it('Transform2D.rotation 与宿主 Object3D 的 rotation.z 双向镜像', () =>
    {
        const { object3D, transform2D } = mountTransform2D();

        reactive(transform2D).rotation = 0.5;
        expect(logic(object3D).rotation.z).toBe(0.5);

        reactive(object3D).rotation = { x: 0, y: 0, z: 1.5 };
        expect(transform2D.rotation).toBe(1.5);
    });

    it('Transform2D.scale.x/y 与宿主 Object3D 的 scale 双向镜像（z 保持原值）', () =>
    {
        const { object3D, transform2D } = mountTransform2D();

        reactive(transform2D).scale = { x: 2, y: 3 };
        expect(logic(object3D).scale).toEqual({ x: 2, y: 3, z: 1 });

        reactive(object3D).scale = { x: 4, y: 5, z: 6 };
        expect(transform2D.scale).toEqual({ x: 4, y: 5 });
        expect(logic(object3D).scale.z).toBe(6);
    });
});
