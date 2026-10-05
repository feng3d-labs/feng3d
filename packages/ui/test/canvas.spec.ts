// 副作用导入：Object3D 是纯数据类型，只用作标注的 import 会被转译器擦除，
// 那样 feng3d 的 registerLogic 注册就不会执行（logic() 会返回 null）。
import 'feng3d';
import { Object3D } from 'feng3d';
import { logic, reactive } from '@feng3d/reactivity';
import { describe, expect, it } from 'vitest';
import '../src/core/Canvas';
import { createCanvasObject3D } from '../src/core/Canvas';
import { getTransform2D } from '../src/core/Transform2D';

describe('Canvas（新架构迁移）', () =>
{
    it('createCanvasObject3D 返回带 Transform2D / Canvas 组件的纯数据对象', () =>
    {
        const object3D = createCanvasObject3D();

        expect(object3D.__type__).toBe('Object3D');
        expect(object3D.components!.map((component) => component.__type__)).toEqual(['Transform2D', 'Canvas']);
    });

    it('layout 把画布尺寸写到 2D 变换与投影矩阵，并复位宿主对象变换', () =>
    {
        const object3D = createCanvasObject3D();
        logic(object3D);
        const canvas = object3D.components!.find((component) => component.__type__ === 'Canvas')!;

        logic(canvas).layout(100, 50);

        expect(getTransform2D(object3D)!.size).toEqual({ x: 100, y: 50 });
        expect(getTransform2D(object3D)!.pivot).toEqual({ x: 0, y: 0 });
        // 投影矩阵：2/width、-2/height（列主序 elements[0]、elements[5]）
        expect(logic(canvas).projection.elements[0]).toBeCloseTo(0.02);
        expect(logic(canvas).projection.elements[5]).toBeCloseTo(-0.04);
    });

    it('calcMouseRay3D 就地更新射线的原点到鼠标位置（方向保持 +Z）', () =>
    {
        const object3D = createCanvasObject3D();
        logic(object3D);
        const canvas = object3D.components!.find((component) => component.__type__ === 'Canvas')!;

        logic(canvas).calcMouseRay3D({ x: 10, y: 20 });

        expect(logic(canvas).mouseRay.origin).toEqual({ x: 10, y: 20, z: 0 });
        expect(logic(canvas).mouseRay.direction).toEqual({ x: 0, y: 0, z: 1 });
    });

    it('near / far 支持运行时改写（缺失时按 -1000 / 10000 处理）', () =>
    {
        const object3D: Object3D = {
            __type__: 'Object3D',
            components: [{ __type__: 'Transform2D' }, { __type__: 'Canvas' }],
        };
        logic(object3D);
        const canvas = object3D.components!.find((component) => component.__type__ === 'Canvas')!;

        reactive(canvas).near = -10;
        reactive(canvas).far = 20;
        logic(canvas).layout(10, 10);

        // near / far 只影响 z 方向的缩放（列主序 elements[10] = 2 / (far - near)）
        expect(logic(canvas).projection.elements[10]).toBeCloseTo(2 / 30);
    });
});
