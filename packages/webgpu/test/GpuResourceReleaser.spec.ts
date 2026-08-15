import { describe, expect, it } from 'vitest';
import { ReactiveObject } from '../src/ReactiveObject';
import { destroyGpuResourcesOf, releaseBindingResources, trackGpuResource } from '../src/utils/GpuResourceReleaser';

/**
 * GPU 资源确定性释放索引（框架设计文档 7.2）契约测试。
 */
describe('utils/GpuResourceReleaser', () =>
{
    class FakeGpuResource extends ReactiveObject
    {
        static destroyed = 0;
        readonly id: number;

        destroyCallRegistered = false;

        constructor(id: number)
        {
            super();
            this.id = id;
            this.destroyCall(() =>
            {
                FakeGpuResource.destroyed++;
            });
        }
    }

    it('按数据键销毁全部登记实例（执行 destroy 回调链）', () =>
    {
        FakeGpuResource.destroyed = 0;
        const key = {};
        const a = new FakeGpuResource(1);
        const b = new FakeGpuResource(2);
        trackGpuResource(key, a);
        trackGpuResource(key, b);

        destroyGpuResourcesOf(key);

        expect(FakeGpuResource.destroyed).toBe(2);
    });

    it('幂等：重复销毁同键无副作用，未登记键安全', () =>
    {
        FakeGpuResource.destroyed = 0;
        const key = {};
        trackGpuResource(key, new FakeGpuResource(1));
        destroyGpuResourcesOf(key);
        destroyGpuResourcesOf(key);   // 幂等
        destroyGpuResourcesOf({});    // 未登记键

        expect(FakeGpuResource.destroyed).toBe(1);
    });

    it('实例显式 destroy 后自动反注册（销毁回调只执行一次）', () =>
    {
        FakeGpuResource.destroyed = 0;
        const key = {};
        const res = new FakeGpuResource(1);
        const untrack = trackGpuResource(key, res);

        res.destroy();
        untrack();
        destroyGpuResourcesOf(key);

        expect(FakeGpuResource.destroyed).toBe(1);   // 不重复销毁
    });

    it('releaseBindingResources 遍历 bindingResources 各键销毁', () =>
    {
        FakeGpuResource.destroyed = 0;
        const transformKey = { value: {} };
        const materialKey = { value: {} };
        trackGpuResource(transformKey, new FakeGpuResource(1));
        trackGpuResource(materialKey, new FakeGpuResource(2));

        releaseBindingResources({ transform: transformKey, material_uniforms: materialKey, plain: 123 });

        expect(FakeGpuResource.destroyed).toBe(2);
    });
});
