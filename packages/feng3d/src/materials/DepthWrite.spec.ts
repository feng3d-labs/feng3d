import { describe, expect, it } from 'vitest';

// 必须最先：在任何 @feng3d/webgpu 间接导入之前 stub 全局
import '../test/webgpu-stub';

import { effect, logic, reactive, type Effect } from '@feng3d/reactivity';
import type { RenderObject } from '@feng3d/webgpu';

// 触发各材质 Logic 的 registerLogic
import './ColorMaterial';
import './DebugShadowMapMaterial';
import './NormalMaterial';
import './PointMaterial';
import './SegmentMaterial';
import './StandardMaterial';
import './TextureMaterial';
import type { Material, MaterialLogic } from './Material';

/**
 * 取某材质写出的 `depthStencil.depthWriteEnabled`。
 *
 * 各材质 Logic 的 `#renderPipeline` 是私有字段，只对外暴露 `beforeRender(renderObject)`，
 * 所以用「调一次 beforeRender，读 renderObject 上被写入的 pipeline」来观测渲染状态。
 */
function readDepthWrite(material: MaterialLogic): boolean | undefined
{
    const renderObject = {} as RenderObject;
    material.beforeRender(renderObject);

    return (renderObject.pipeline?.depthStencil as { depthWriteEnabled?: boolean } | undefined)?.depthWriteEnabled;
}

/** 按 __type__ 造一个最简材质并取它的 depthWrite */
function depthWriteOf(type: string, extra?: Record<string, unknown>): boolean | undefined
{
    const material = logic({ __type__: type, ...extra } as unknown as Material) as MaterialLogic;

    return readDepthWrite(material);
}

/**
 * 材质 `depthWrite` 数据字段（issue #157）。
 *
 * 背景：该值原先写死在材质 Logic 构造里、数据接口未暴露，编辑器调
 * `setDepthWrite(material, false)` 只能降级成 `warnUnsupported`。
 */
describe('materials depthWrite', () =>
{
    describe('StandardMaterial（带运行时切换）', () =>
    {
        it('缺省 true；显式 false 生效', () =>
        {
            expect(depthWriteOf('StandardMaterial')).toBe(true);
            expect(depthWriteOf('StandardMaterial', { depthWrite: false })).toBe(false);
        });

        it('数据字段变化后 pipeline 随之更新（响应式派发）', () =>
        {
            // 字面量类型要显式带上 depthWrite：Material 基接口按设计不声明该字段，
            // 若断言成 Material 会让 `reactive(data).depthWrite` 报属性不存在
            const data: { __type__: string; depthWrite?: boolean } = { __type__: 'StandardMaterial' };
            const material = logic(data as unknown as Material) as MaterialLogic;

            expect(readDepthWrite(material)).toBe(true);

            reactive(data).depthWrite = false;
            expect(readDepthWrite(material)).toBe(false);
        });

        it('效果在 effect 内可被追踪（确认是响应式派生而非一次性写入）', () =>
        {
            const data: { __type__: string; depthWrite?: boolean } = { __type__: 'StandardMaterial', depthWrite: false };
            const material = logic(data as unknown as Material) as MaterialLogic;

            let observed: boolean | undefined;
            const watcher: Effect = effect(() =>
            {
                observed = readDepthWrite(material);
            });

            expect(observed).toBe(false);

            reactive(data).depthWrite = true;
            expect(observed).toBe(true);

            watcher.stop();
        });
    });

    describe('各材质的默认值（不得因本次改动而改变）', () =>
    {
        it('TextureMaterial 缺省 true（编辑器图标使用的材质）', () =>
        {
            expect(depthWriteOf('TextureMaterial', { s_texture: { __type__: 'Texture', url: '' } })).toBe(true);
        });

        it('PointMaterial 缺省 true', () =>
        {
            expect(depthWriteOf('PointMaterial')).toBe(true);
        });

        it('SegmentMaterial 缺省 true', () =>
        {
            expect(depthWriteOf('SegmentMaterial')).toBe(true);
        });

        it('NormalMaterial 缺省 true', () =>
        {
            expect(depthWriteOf('NormalMaterial')).toBe(true);
        });

        it('ColorMaterial 缺省 true', () =>
        {
            expect(depthWriteOf('ColorMaterial')).toBe(true);
        });

        it('DebugShadowMapMaterial 缺省 false（该材质本就关闭深度写入，必须保持）', () =>
        {
            expect(depthWriteOf('DebugShadowMapMaterial')).toBe(false);
        });
    });

    describe('显式 false 在各材质上均生效', () =>
    {
        const cases: Array<[string, Record<string, unknown> | undefined]> = [
            ['TextureMaterial', { s_texture: { __type__: 'Texture', url: '' } }],
            ['PointMaterial', undefined],
            ['SegmentMaterial', undefined],
            ['NormalMaterial', undefined],
            ['ColorMaterial', undefined],
            ['DebugShadowMapMaterial', undefined],
        ];

        for (const [type, extra] of cases)
        {
            it(`${type} 可显式关闭`, () =>
            {
                expect(depthWriteOf(type, { ...extra, depthWrite: false })).toBe(false);
            });
        }
    });
});
