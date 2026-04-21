import { Computed, computed, reactive } from '@feng3d/reactivity';
import { ChainMap } from '../utils/ChainMap';
import { OcclusionQuery } from '../data/OcclusionQuery';
import { RenderPass } from '../data/RenderPass';
import { ReactiveObject } from '../ReactiveObject';

export class WGPUQuerySet extends ReactiveObject
{
    get gpuQuerySet()
    {
        return this._computedGpuQuerySet.value;
    }

    private _computedGpuQuerySet: Computed<GPUQuerySet>;

    constructor(device: GPUDevice, renderPass: RenderPass)
    {
        super();

        this._onCreate(device, renderPass);
        //
        WGPUQuerySet.map.set([device, renderPass], this);
        this.destroyCall(() =>
        {
            WGPUQuerySet.map.delete([device, renderPass]);
        });
    }

    private _onCreate(device: GPUDevice, renderPass: RenderPass)
    {
        const r_renderPass = reactive(renderPass);

        let occlusionQuerys: OcclusionQuery[];
        let occlusionQuerySet: GPUQuerySet
        let resultBuf: GPUBuffer;
        let resolveBuf: GPUBuffer

        let needQueryResult = false;

        this.effect(() =>
        {
            reactive(device.queue).afterSubmit;

            if (!needQueryResult) return;

            if (resultBuf.mapState === 'unmapped')
            {
                resultBuf.mapAsync(GPUMapMode.READ).then(() =>
                {
                    const bigUint64Array = new BigUint64Array(resultBuf.getMappedRange());

                    const results = bigUint64Array.reduce((pv: number[], cv) =>
                    {
                        pv.push(Number(cv));

                        return pv;
                    }, []);

                    resultBuf.unmap();

                    occlusionQuerys.forEach((v, i) =>
                    {
                        v.onQuery?.(results[i]);
                    });

                    renderPass.onOcclusionQuery?.(occlusionQuerys, results);

                    //
                    needQueryResult = false;
                });
            }
        });

        this._computedGpuQuerySet = computed(() =>
        {
            r_renderPass?.renderPassObjects?.concat();

            occlusionQuerys = renderPass.renderPassObjects?.filter((v) => v.__type__ === 'OcclusionQuery') as OcclusionQuery[];

            if (!occlusionQuerys || occlusionQuerys.length === 0)
            {
                return;
            }

            occlusionQuerySet?.destroy();
            occlusionQuerySet = device.createQuerySet({ type: 'occlusion', count: occlusionQuerys.length });

            //
            resolveBuf?.destroy();
            resolveBuf = device.createBuffer({
                label: 'resolveBuffer',
                // Query results are 64bit unsigned integers.
                size: occlusionQuerys.length * BigUint64Array.BYTES_PER_ELEMENT,
                usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC,
            });

            //
            resultBuf?.destroy();
            resultBuf = device.createBuffer({
                label: 'resultBuffer',
                size: resolveBuf.size,
                usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
            });

            //
            occlusionQuerySet.resolve = (commandEncoder: GPUCommandEncoder) =>
            {
                if (occlusionQuerys.length === 0) return;

                commandEncoder.resolveQuerySet(occlusionQuerySet, 0, occlusionQuerys.length, resolveBuf, 0);

                if (resultBuf.mapState === 'unmapped')
                {
                    commandEncoder.copyBufferToBuffer(resolveBuf, 0, resultBuf, 0, resultBuf.size);
                }

                needQueryResult = true;
            };

            return occlusionQuerySet;
        });

        this.destroyCall(() =>
        {
            occlusionQuerySet?.destroy();
            resolveBuf?.destroy();
            resultBuf?.destroy();

            this._computedGpuQuerySet = null;
        });
    }

    static getInstance(device: GPUDevice, renderPass: RenderPass)
    {
        return this.map.get([device, renderPass]) || new WGPUQuerySet(device, renderPass);
    }

    private static readonly map = new ChainMap<[GPUDevice, RenderPass], WGPUQuerySet>();
}

declare global
{
    interface GPUQuerySet
    {
        resolve(commandEncoder: GPUCommandEncoder): void;
    }
}